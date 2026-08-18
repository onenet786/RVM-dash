using Microsoft.Data.SqlClient;
using System;
using System.Data;
using System.IO;

namespace RVMDesktopApp;

public static class DatabaseManager
{
    private static string? _connectionString;
    private static string ConnectionString => _connectionString ??= ResolveConnectionString();

    private static string ResolveConnectionString()
    {
        string configPath = Path.Combine(AppContext.BaseDirectory, "config.txt");
        if (File.Exists(configPath))
        {
            foreach (string line in File.ReadLines(configPath))
            {
                string value = line.Trim();
                if (value.Length == 0 || value.StartsWith('#') || value.StartsWith(';'))
                    continue;

                const string key = "ConnectionString=";
                if (value.StartsWith(key, StringComparison.OrdinalIgnoreCase))
                {
                    string connectionString = value[key.Length..].Trim();
                    if (!string.IsNullOrWhiteSpace(connectionString))
                        return connectionString;
                }
            }
        }

        string environmentConnectionString = Environment.GetEnvironmentVariable("RVMDB_CONNECTION") ?? string.Empty;
        if (!string.IsNullOrWhiteSpace(environmentConnectionString))
            return environmentConnectionString;

        throw new InvalidOperationException(
            $"Database connection string not found. Add ConnectionString=... to '{configPath}' or set RVMDB_CONNECTION.");
    }

    public static bool TryOpen(out string message)
    {
        try
        {
            using var connection = new SqlConnection(ConnectionString);
            connection.Open();
            message = "Database connected.";
            return true;
        }
        catch (Exception ex)
        {
            message = ex.Message;
            return false;
        }
    }

    public static int GetPoints(string bottleSize, string materialType)
    {
        using var connection = new SqlConnection(ConnectionString);
        using var command = new SqlCommand("dbo.RVM_sp_GetPoints", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@BottleSize", SqlDbType.VarChar, 20) { Value = bottleSize });
        command.Parameters.Add(new SqlParameter("@MaterialType", SqlDbType.VarChar, 20) { Value = materialType });

        connection.Open();
        var result = command.ExecuteScalar();
        return result == null || result == DBNull.Value ? 0 : Convert.ToInt32(result);
    }

    public static void SaveTransaction(
        Guid sessionId,
        string bottleSize,
        string materialType,
        int pointsAwarded,
        bool isAccepted,
        string machineName = "RVM-001")
    {
        using var connection = new SqlConnection(ConnectionString);
        using var command = new SqlCommand(
            """
            INSERT INTO dbo.BottleTransactions
                (SessionID, BottleSize, MaterialType, PointsAwarded, IsAccepted, MachineName)
            VALUES
                (@SessionID, @BottleSize, @MaterialType, @PointsAwarded, @IsAccepted, @MachineName);
            """, connection);

        command.Parameters.Add(new SqlParameter("@SessionID", SqlDbType.UniqueIdentifier) { Value = sessionId });
        command.Parameters.Add(new SqlParameter("@BottleSize", SqlDbType.VarChar, 20) { Value = bottleSize });
        command.Parameters.Add(new SqlParameter("@MaterialType", SqlDbType.VarChar, 20) { Value = materialType });
        command.Parameters.Add(new SqlParameter("@PointsAwarded", SqlDbType.Int) { Value = pointsAwarded });
        command.Parameters.Add(new SqlParameter("@IsAccepted", SqlDbType.Bit) { Value = isAccepted });
        command.Parameters.Add(new SqlParameter("@MachineName", SqlDbType.VarChar, 50) { Value = machineName });

        connection.Open();
        command.ExecuteNonQuery();
    }

    public static void CreditWallet(string phoneNumber, int points, Guid sessionId)
    {
        using var connection = new SqlConnection(ConnectionString);
        connection.Open();

        using var schemaCommand = new SqlCommand(
            """
            IF OBJECT_ID('dbo.WalletAccounts', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.WalletAccounts
                (
                    PhoneNumber VARCHAR(20) PRIMARY KEY,
                    PointsBalance INT NOT NULL DEFAULT 0,
                    LastUpdated DATETIME NOT NULL DEFAULT GETDATE()
                );
            END;

            IF OBJECT_ID('dbo.WalletTransactions', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.WalletTransactions
                (
                    WalletTransactionID INT IDENTITY PRIMARY KEY,
                    TransactionDate DATETIME NOT NULL DEFAULT GETDATE(),
                    PhoneNumber VARCHAR(20) NOT NULL,
                    PointsCredited INT NOT NULL,
                    CONSTRAINT FK_WalletTransactions_WalletAccounts
                        FOREIGN KEY (PhoneNumber) REFERENCES dbo.WalletAccounts(PhoneNumber)
                );
            END;

            IF COL_LENGTH('dbo.BottleTransactions', 'SessionID') IS NULL
                ALTER TABLE dbo.BottleTransactions ADD SessionID UNIQUEIDENTIFIER NULL;

            IF COL_LENGTH('dbo.BottleTransactions', 'MobileNumber') IS NULL
                ALTER TABLE dbo.BottleTransactions ADD MobileNumber VARCHAR(20) NULL;
            """, connection);
        schemaCommand.ExecuteNonQuery();

        using var command = new SqlCommand(
            """
            SET XACT_ABORT ON;
            BEGIN TRANSACTION;

            IF NOT EXISTS (SELECT 1 FROM dbo.WalletAccounts WHERE PhoneNumber = @PhoneNumber)
                INSERT INTO dbo.WalletAccounts (PhoneNumber, PointsBalance)
                VALUES (@PhoneNumber, 0);

            UPDATE dbo.WalletAccounts
            SET PointsBalance = PointsBalance + @Points,
                LastUpdated = GETDATE()
            WHERE PhoneNumber = @PhoneNumber;

            INSERT INTO dbo.WalletTransactions (PhoneNumber, PointsCredited)
            VALUES (@PhoneNumber, @Points);

            UPDATE dbo.BottleTransactions
            SET MobileNumber = @PhoneNumber
            WHERE SessionID = @SessionID;

            COMMIT TRANSACTION;
            """, connection);

        command.Parameters.Add(new SqlParameter("@PhoneNumber", SqlDbType.VarChar, 20) { Value = phoneNumber });
        command.Parameters.Add(new SqlParameter("@Points", SqlDbType.Int) { Value = points });
        command.Parameters.Add(new SqlParameter("@SessionID", SqlDbType.UniqueIdentifier) { Value = sessionId });

        command.ExecuteNonQuery();
    }

    public static DataTable GetPointSettings() =>
        Get("SELECT PointSettingID, BottleSize, MaterialType, Points, IsActive FROM dbo.PointSettings ORDER BY BottleSize, MaterialType");

    public static DataTable GetTransactions() =>
        Get("SELECT TOP 100 TransactionID, TransactionDate, BottleSize, MaterialType, PointsAwarded, MobileNumber, IsAccepted, MachineName FROM dbo.BottleTransactions ORDER BY TransactionID DESC");

    public static DataTable GetLeaderboard() =>
        Get(
            """
            SELECT TOP 5
                ROW_NUMBER() OVER (ORDER BY wallet.PointsBalance DESC, wallet.LastUpdated ASC) AS Rank,
                CASE
                    WHEN LEN(wallet.PhoneNumber) > 7
                        THEN LEFT(wallet.PhoneNumber, 3) + REPLICATE('*', LEN(wallet.PhoneNumber) - 6) + RIGHT(wallet.PhoneNumber, 3)
                    ELSE wallet.PhoneNumber
                END AS PhoneNumber,
                wallet.PointsBalance
            FROM dbo.WalletAccounts AS wallet
            ORDER BY wallet.PointsBalance DESC, wallet.LastUpdated ASC;
            """);

    private static DataTable Get(string sql)
    {
        using var adapter = new SqlDataAdapter(sql, ConnectionString);
        var table = new DataTable();
        adapter.Fill(table);
        return table;
    }

    public static void UpdatePoints(int pointSettingId, int points)
    {
        using var connection = new SqlConnection(ConnectionString);
        using var command = new SqlCommand("UPDATE dbo.PointSettings SET Points = @p WHERE PointSettingID = @i", connection);
        command.Parameters.Add(new SqlParameter("@p", SqlDbType.Int) { Value = points });
        command.Parameters.Add(new SqlParameter("@i", SqlDbType.Int) { Value = pointSettingId });

        connection.Open();
        command.ExecuteNonQuery();
    }

    public static void UpdateLocalPointSettings(
        int plasticSmall, int plasticMedium, int plasticLarge,
        int canSmall, int canMedium, int canLarge,
        int glassSmall, int glassMedium, int glassLarge)
    {
        try
        {
            using var connection = new SqlConnection(ConnectionString);
            connection.Open();

            string sql = @"
                MERGE dbo.PointSettings AS target
                USING (VALUES 
                    ('SMALL', 'PLASTIC', @ps), ('MEDIUM', 'PLASTIC', @pm), ('LARGE', 'PLASTIC', @pl),
                    ('SMALL', 'CAN', @cs), ('MEDIUM', 'CAN', @cm), ('LARGE', 'CAN', @cl),
                    ('SMALL', 'GLASS', @gs), ('MEDIUM', 'GLASS', @gm), ('LARGE', 'GLASS', @gl)
                ) AS source (BottleSize, MaterialType, Points)
                ON target.BottleSize = source.BottleSize AND target.MaterialType = source.MaterialType
                WHEN MATCHED THEN
                    UPDATE SET Points = source.Points, IsActive = 1
                WHEN NOT MATCHED THEN
                    INSERT (BottleSize, MaterialType, Points, IsActive) VALUES (source.BottleSize, source.MaterialType, source.Points, 1);
            ";

            using var cmd = new SqlCommand(sql, connection);
            cmd.Parameters.AddWithValue("@ps", plasticSmall);
            cmd.Parameters.AddWithValue("@pm", plasticMedium);
            cmd.Parameters.AddWithValue("@pl", plasticLarge);
            cmd.Parameters.AddWithValue("@cs", canSmall);
            cmd.Parameters.AddWithValue("@cm", canMedium);
            cmd.Parameters.AddWithValue("@cl", canLarge);
            cmd.Parameters.AddWithValue("@gs", glassSmall);
            cmd.Parameters.AddWithValue("@gm", glassMedium);
            cmd.Parameters.AddWithValue("@gl", glassLarge);

            cmd.ExecuteNonQuery();
        }
        catch
        {
            // Ignore if local SQL Server is unavailable
        }
    }
}
