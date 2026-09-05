using Microsoft.Data.SqlClient;
using System;
using System.Data;
using System.IO;
using System.Net.Http;

namespace PecoDropDesktopApp;

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
            EnsurePointSettingsTable();
            message = "Database connected.";
            return true;
        }
        catch (Exception ex)
        {
            message = ex.Message;
            return false;
        }
    }

    public static void EnsurePointSettingsTable()
    {
        try
        {
            using var connection = new SqlConnection(ConnectionString);
            connection.Open();
            using var cmd = new SqlCommand(@"
                IF OBJECT_ID('dbo.PointSettings', 'U') IS NULL
                BEGIN
                    CREATE TABLE dbo.PointSettings (
                        PointSettingID INT IDENTITY(1,1) PRIMARY KEY,
                        BottleSize NVARCHAR(50) NOT NULL,
                        MaterialType NVARCHAR(50) NOT NULL,
                        Points INT NOT NULL DEFAULT 10,
                        IsActive BIT NOT NULL DEFAULT 1
                    );

                    INSERT INTO dbo.PointSettings (BottleSize, MaterialType, Points, IsActive) VALUES
                    ('SMALL', 'PLASTIC', 5, 1),
                    ('MEDIUM', 'PLASTIC', 10, 1),
                    ('LARGE', 'PLASTIC', 15, 1),
                    ('SMALL', 'METAL', 5, 1),
                    ('MEDIUM', 'METAL', 10, 1),
                    ('LARGE', 'METAL', 15, 1),
                    ('SMALL', 'CAN', 10, 1),
                    ('MEDIUM', 'CAN', 15, 1),
                    ('LARGE', 'CAN', 20, 1),
                    ('SMALL', 'GLASS', 10, 1),
                    ('MEDIUM', 'GLASS', 15, 1),
                    ('LARGE', 'GLASS', 20, 1),
                    ('SMALL', 'TETRA', 5, 1),
                    ('MEDIUM', 'TETRA', 10, 1),
                    ('LARGE', 'TETRA', 15, 1);
                END
                ELSE
                BEGIN
                    -- Rename legacy PointsAwarded column to Points if it exists
                    IF COL_LENGTH('dbo.PointSettings', 'Points') IS NULL AND COL_LENGTH('dbo.PointSettings', 'PointsAwarded') IS NOT NULL
                        EXEC sp_rename 'dbo.PointSettings.PointsAwarded', 'Points', 'COLUMN';

                    IF COL_LENGTH('dbo.PointSettings', 'Points') IS NULL
                        ALTER TABLE dbo.PointSettings ADD Points INT NOT NULL DEFAULT 10;
                END
            ", connection);
            cmd.ExecuteNonQuery();
        }
        catch { }
    }

    public static DataTable GetLocalPointSettings(string machineName = "RVM-001")
    {
        EnsurePointSettingsTable();
        try
        {
            return Get(@"
                SELECT 
                    PointSettingID AS SettingID,
                    MaterialType,
                    BottleSize,
                    Points AS PointsAwarded,
                    Points,
                    'per_piece' AS Unit,
                    IsActive,
                    GETDATE() AS LastUpdated 
                FROM dbo.PointSettings 
                ORDER BY MaterialType ASC, BottleSize ASC");
        }
        catch
        {
            return new DataTable();
        }
    }

    public static async System.Threading.Tasks.Task<bool> SyncPointSettingsFromCentralAsync(string machineId = "RVM-001", Action<string>? logCallback = null)
    {
        try
        {
            EnsurePointSettingsTable();
            string serverUrl = CentralSyncService.CentralApiUrl;
            using var http = new System.Net.Http.HttpClient { Timeout = TimeSpan.FromSeconds(8) };

            string[] candidateEndpoints = new[]
            {
                $"{serverUrl.TrimEnd('/')}/api/machine/point-settings?machineId={Uri.EscapeDataString(machineId)}",
                $"{serverUrl.TrimEnd('/')}/api/machine/point-settings",
                $"{serverUrl.TrimEnd('/')}/api/analytics/machines?machineId={Uri.EscapeDataString(machineId)}",
                $"{serverUrl.TrimEnd('/')}/api/overview?machineId={Uri.EscapeDataString(machineId)}",
                $"{serverUrl.TrimEnd('/')}/api/analytics/machines"
            };

            HttpResponseMessage? response = null;
            string? successUrl = null;
            string? validJson = null;

            foreach (var url in candidateEndpoints)
            {
                try
                {
                    var res = await http.GetAsync(url);
                    if (res.IsSuccessStatusCode)
                    {
                        string body = await res.Content.ReadAsStringAsync();
                        if (!string.IsNullOrWhiteSpace(body) && body.Trim() != "[]" && body.Trim() != "{}")
                        {
                            response = res;
                            successUrl = url;
                            validJson = body;
                            break;
                        }
                    }
                }
                catch { }
            }

            if (response == null || string.IsNullOrWhiteSpace(validJson))
            {
                logCallback?.Invoke($"[POINT SETTINGS SYNC NOTICE 🟡] Remote point settings endpoint unavailable. Local SQL rules active.");
                return false;
            }

            string json = validJson;
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            var root = doc.RootElement;

            var rulesToUpsert = new System.Collections.Generic.List<(string mat, string sz, int pts, string unit)>();

            if (root.TryGetProperty("settings", out var settingsElem) && settingsElem.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                foreach (var item in settingsElem.EnumerateArray())
                {
                    string mat = item.TryGetProperty("materialType", out var m) ? m.GetString()?.ToUpper() ?? "PLASTIC" : "PLASTIC";
                    string sz = item.TryGetProperty("bottleSize", out var s) ? s.GetString()?.ToUpper() ?? "MEDIUM" : "MEDIUM";
                    int pts = item.TryGetProperty("points", out var p) && p.ValueKind == System.Text.Json.JsonValueKind.Number ? p.GetInt32() : 10;
                    string unit = item.TryGetProperty("unit", out var u) ? u.GetString() ?? "per_piece" : "per_piece";
                    rulesToUpsert.Add((mat, sz, pts, unit));
                }
            }
            else
            {
                System.Text.Json.JsonElement elem = root;
                if (root.ValueKind == System.Text.Json.JsonValueKind.Array)
                {
                    if (root.GetArrayLength() == 0)
                    {
                        logCallback?.Invoke($"[POINT SETTINGS SYNC NOTICE 🟡] Server returned empty response for '{machineId}'. Using local SQL rules.");
                        return false;
                    }
                    elem = root[0];
                }

                if (elem.ValueKind != System.Text.Json.JsonValueKind.Object)
                {
                    logCallback?.Invoke($"[POINT SETTINGS SYNC NOTICE 🟡] Payload is not a JSON object. Using local SQL rules.");
                    return false;
                }

                int GetProp(params string[] props)
                {
                    foreach (string p in props)
                    {
                        if (elem.TryGetProperty(p, out var v) && v.ValueKind == System.Text.Json.JsonValueKind.Number)
                            return v.GetInt32();
                    }
                    return 0;
                }

                rulesToUpsert.Add(("PLASTIC", "SMALL", GetProp("pointsPlasticSmall", "points_plastic_small") > 0 ? GetProp("pointsPlasticSmall", "points_plastic_small") : 5, "per_piece"));
                rulesToUpsert.Add(("PLASTIC", "MEDIUM", GetProp("pointsPlasticMedium", "points_plastic_medium", "pointsPerPlasticBottle") > 0 ? GetProp("pointsPlasticMedium", "points_plastic_medium", "pointsPerPlasticBottle") : 10, "per_piece"));
                rulesToUpsert.Add(("PLASTIC", "LARGE", GetProp("pointsPlasticLarge", "points_plastic_large") > 0 ? GetProp("pointsPlasticLarge", "points_plastic_large") : 15, "per_piece"));

                rulesToUpsert.Add(("CAN", "SMALL", GetProp("pointsCanSmall", "points_can_small") > 0 ? GetProp("pointsCanSmall", "points_can_small") : 10, "per_piece"));
                rulesToUpsert.Add(("CAN", "MEDIUM", GetProp("pointsCanMedium", "points_can_medium", "pointsPerAluminiumCan") > 0 ? GetProp("pointsCanMedium", "points_can_medium", "pointsPerAluminiumCan") : 15, "per_piece"));
                rulesToUpsert.Add(("CAN", "LARGE", GetProp("pointsCanLarge", "points_can_large") > 0 ? GetProp("pointsCanLarge", "points_can_large") : 20, "per_piece"));

                rulesToUpsert.Add(("TETRA", "SMALL", GetProp("pointsTetraPakSmall", "points_tetrapak_small") > 0 ? GetProp("pointsTetraPakSmall", "points_tetrapak_small") : 5, "per_piece"));
                rulesToUpsert.Add(("TETRA", "MEDIUM", GetProp("pointsTetraPakMedium", "points_tetrapak_medium", "pointsPerPaperKg") > 0 ? GetProp("pointsTetraPakMedium", "points_tetrapak_medium", "pointsPerPaperKg") : 10, "per_piece"));
                rulesToUpsert.Add(("TETRA", "LARGE", GetProp("pointsTetraPakLarge", "points_tetrapak_large") > 0 ? GetProp("pointsTetraPakLarge", "points_tetrapak_large") : 15, "per_piece"));

                rulesToUpsert.Add(("GLASS", "SMALL", GetProp("pointsGlassSmall", "points_glass_small") > 0 ? GetProp("pointsGlassSmall", "points_glass_small") : 10, "per_piece"));
                rulesToUpsert.Add(("GLASS", "MEDIUM", GetProp("pointsGlassMedium", "points_glass_medium", "pointsPerGlass") > 0 ? GetProp("pointsGlassMedium", "points_glass_medium", "pointsPerGlass") : 15, "per_piece"));
                rulesToUpsert.Add(("GLASS", "LARGE", GetProp("pointsGlassLarge", "points_glass_large") > 0 ? GetProp("pointsGlassLarge", "points_glass_large") : 20, "per_piece"));
            }

            if (rulesToUpsert.Count == 0) return false;

            using var connection = new SqlConnection(ConnectionString);
            await connection.OpenAsync();

            int updatedCount = 0;
            foreach (var item in rulesToUpsert)
            {
                using var upsertCmd = new SqlCommand(@"
                    -- 1. Exact Match
                    IF EXISTS (SELECT 1 FROM dbo.PointSettings WHERE UPPER(MaterialType) = @Mat AND UPPER(BottleSize) = @Sz)
                    BEGIN
                        UPDATE dbo.PointSettings 
                        SET Points = @Pts, IsActive = 1
                        WHERE UPPER(MaterialType) = @Mat AND UPPER(BottleSize) = @Sz;
                    END
                    -- 2. Alias Match for CAN / METAL / ALUMINIUM
                    ELSE IF (@Mat = 'CAN' OR @Mat = 'METAL' OR @Mat = 'ALUMINIUM') AND EXISTS (SELECT 1 FROM dbo.PointSettings WHERE UPPER(MaterialType) IN ('CAN', 'METAL', 'ALUMINIUM') AND UPPER(BottleSize) = @Sz)
                    BEGIN
                        UPDATE dbo.PointSettings 
                        SET Points = @Pts, IsActive = 1
                        WHERE UPPER(MaterialType) IN ('CAN', 'METAL', 'ALUMINIUM') AND UPPER(BottleSize) = @Sz;
                    END
                    -- 3. Alias Match for TETRA / TETRA PAK / PAPER
                    ELSE IF (@Mat LIKE '%TETRA%' OR @Mat LIKE '%CARTON%' OR @Mat LIKE '%PAPER%') AND EXISTS (SELECT 1 FROM dbo.PointSettings WHERE (UPPER(MaterialType) LIKE '%TETRA%' OR UPPER(MaterialType) LIKE '%CARTON%' OR UPPER(MaterialType) LIKE '%PAPER%') AND UPPER(BottleSize) = @Sz)
                    BEGIN
                        UPDATE dbo.PointSettings 
                        SET Points = @Pts, IsActive = 1
                        WHERE (UPPER(MaterialType) LIKE '%TETRA%' OR UPPER(MaterialType) LIKE '%CARTON%' OR UPPER(MaterialType) LIKE '%PAPER%') AND UPPER(BottleSize) = @Sz;
                    END
                    -- 4. Fuzzy Substring Match
                    ELSE IF EXISTS (SELECT 1 FROM dbo.PointSettings WHERE (UPPER(MaterialType) LIKE '%' + @Mat + '%' OR @Mat LIKE '%' + UPPER(MaterialType) + '%') AND (UPPER(BottleSize) LIKE '%' + @Sz + '%' OR @Sz LIKE '%' + UPPER(BottleSize) + '%'))
                    BEGIN
                        UPDATE dbo.PointSettings 
                        SET Points = @Pts, IsActive = 1
                        WHERE (UPPER(MaterialType) LIKE '%' + @Mat + '%' OR @Mat LIKE '%' + UPPER(MaterialType) + '%') AND (UPPER(BottleSize) LIKE '%' + @Sz + '%' OR @Sz LIKE '%' + UPPER(BottleSize) + '%');
                    END
                    -- 5. Insert new rule if absent
                    ELSE
                    BEGIN
                        INSERT INTO dbo.PointSettings (BottleSize, MaterialType, Points, IsActive)
                        VALUES (@Sz, @Mat, @Pts, 1);
                    END
                ", connection);
                upsertCmd.Parameters.AddWithValue("@Mat", item.mat);
                upsertCmd.Parameters.AddWithValue("@Sz", item.sz);
                upsertCmd.Parameters.AddWithValue("@Pts", item.pts);

                await upsertCmd.ExecuteNonQueryAsync();
                updatedCount++;
            }

            logCallback?.Invoke($"[POINT SETTINGS SYNC 🟢] Successfully synced {updatedCount} dynamic point rules via '{successUrl}' into local database.");
            return true;
        }
        catch (Exception ex)
        {
            logCallback?.Invoke($"[POINT SETTINGS SYNC NOTICE 🟡] {ex.Message}");
            return false;
        }
    }

    public static int GetPoints(string bottleSize, string materialType)
    {
        try
        {
            EnsurePointSettingsTable();

            string mat = (materialType ?? "PLASTIC").Trim().ToUpper();
            string sz = (bottleSize ?? "MEDIUM").Trim().ToUpper();

            using var connection = new SqlConnection(ConnectionString);
            connection.Open();

            using var queryCmd = new SqlCommand(@"
                SELECT TOP 1 Points 
                FROM dbo.PointSettings 
                WHERE IsActive = 1 
                  AND (UPPER(MaterialType) = @Mat 
                       OR (MaterialType LIKE '%PLASTIC%' AND @Mat LIKE '%PLASTIC%') 
                       OR (MaterialType LIKE '%CAN%' AND @Mat LIKE '%CAN%')
                       OR (MaterialType LIKE '%METAL%' AND @Mat LIKE '%CAN%')
                       OR (MaterialType LIKE '%TETRA%' AND @Mat LIKE '%TETRA%'))
                  AND (UPPER(BottleSize) = @Sz 
                       OR (BottleSize LIKE '%SMALL%' AND @Sz LIKE '%SMALL%') 
                       OR (BottleSize LIKE '%LARGE%' AND @Sz LIKE '%LARGE%') 
                       OR (BottleSize LIKE '%MEDIUM%' AND @Sz LIKE '%MEDIUM%'))
                ORDER BY CASE WHEN UPPER(MaterialType) = @Mat AND UPPER(BottleSize) = @Sz THEN 1 ELSE 2 END;
            ", connection);
            queryCmd.Parameters.AddWithValue("@Mat", mat);
            queryCmd.Parameters.AddWithValue("@Sz", sz);

            var res = queryCmd.ExecuteScalar();
            if (res != null && res != DBNull.Value)
            {
                return Convert.ToInt32(res);
            }
        }
        catch { }

        // Fallback to stored procedure
        try
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
            if (result != null && result != DBNull.Value)
                return Convert.ToInt32(result);
        }
        catch { }

        // Hardcoded safety defaults
        string mUpper = (materialType ?? "").ToUpper();
        string sUpper = (bottleSize ?? "").ToUpper();
        if (mUpper.Contains("CAN") || mUpper.Contains("ALUMINIUM"))
        {
            return sUpper.Contains("SMALL") ? 10 : sUpper.Contains("LARGE") ? 20 : 15;
        }
        if (mUpper.Contains("TETRA") || mUpper.Contains("CARTON") || mUpper.Contains("PAPER"))
        {
            return sUpper.Contains("SMALL") ? 5 : sUpper.Contains("LARGE") ? 15 : 10;
        }
        if (mUpper.Contains("GLASS"))
        {
            return sUpper.Contains("SMALL") ? 10 : sUpper.Contains("LARGE") ? 20 : 15;
        }
        return sUpper.Contains("SMALL") ? 5 : sUpper.Contains("LARGE") ? 15 : 10;
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

    public static DataTable GetLocalItemCountsByVariant(string machineName = "RVM-001")
    {
        try
        {
            return Get($"""
                SELECT 
                    CASE 
                        WHEN UPPER(MaterialType) LIKE '%CAN%' THEN 'CAN'
                        WHEN UPPER(MaterialType) LIKE '%TETRA%' OR UPPER(MaterialType) LIKE '%CARTON%' OR UPPER(MaterialType) LIKE '%PAPER%' THEN 'TETRA PAK'
                        ELSE 'PLASTIC'
                    END AS MaterialType,
                    CASE 
                        WHEN UPPER(BottleSize) LIKE '%SMALL%' OR UPPER(BottleSize) = 'S' THEN 'SMALL'
                        WHEN UPPER(BottleSize) LIKE '%LARGE%' OR UPPER(BottleSize) = 'L' THEN 'LARGE'
                        ELSE 'MEDIUM'
                    END AS BottleSize,
                    COUNT(*) AS ItemCount,
                    SUM(PointsAwarded) AS TotalPoints
                FROM dbo.BottleTransactions
                WHERE IsAccepted = 1 OR IsAccepted IS NULL
                GROUP BY 
                    CASE 
                        WHEN UPPER(MaterialType) LIKE '%CAN%' THEN 'CAN'
                        WHEN UPPER(MaterialType) LIKE '%TETRA%' OR UPPER(MaterialType) LIKE '%CARTON%' OR UPPER(MaterialType) LIKE '%PAPER%' THEN 'TETRA PAK'
                        ELSE 'PLASTIC'
                    END,
                    CASE 
                        WHEN UPPER(BottleSize) LIKE '%SMALL%' OR UPPER(BottleSize) = 'S' THEN 'SMALL'
                        WHEN UPPER(BottleSize) LIKE '%LARGE%' OR UPPER(BottleSize) = 'L' THEN 'LARGE'
                        ELSE 'MEDIUM'
                    END;
                """);
        }
        catch
        {
            return new DataTable();
        }
    }

    public static (int TotalItems, int TotalPoints) GetLocalTotals(string machineName = "RVM-001")
    {
        try
        {
            DataTable dt = Get("""
                SELECT 
                    COUNT(*) AS TotalItems,
                    ISNULL(SUM(PointsAwarded), 0) AS TotalPoints
                FROM dbo.BottleTransactions
                WHERE IsAccepted = 1 OR IsAccepted IS NULL;
                """);
            if (dt != null && dt.Rows.Count > 0)
            {
                int items = Convert.ToInt32(dt.Rows[0]["TotalItems"]);
                int points = Convert.ToInt32(dt.Rows[0]["TotalPoints"]);
                return (items, points);
            }
        }
        catch { }
        return (0, 0);
    }

    public static DataTable GetLeaderboard() =>
        Get(
            """
            IF COL_LENGTH('dbo.WalletAccounts', 'FullName') IS NULL
                ALTER TABLE dbo.WalletAccounts ADD FullName NVARCHAR(100) NULL;
            IF COL_LENGTH('dbo.WalletAccounts', 'UserName') IS NULL
                ALTER TABLE dbo.WalletAccounts ADD UserName NVARCHAR(50) NULL;
            IF COL_LENGTH('dbo.WalletAccounts', 'ProfileImage') IS NULL
                ALTER TABLE dbo.WalletAccounts ADD ProfileImage NVARCHAR(100) NULL;
            IF COL_LENGTH('dbo.WalletAccounts', 'DOB') IS NULL
                ALTER TABLE dbo.WalletAccounts ADD DOB NVARCHAR(50) NULL;

            SELECT TOP 10
                ROW_NUMBER() OVER (ORDER BY wallet.PointsBalance DESC, wallet.LastUpdated ASC) AS Rank,
                COALESCE(wallet.FullName, wallet.UserName,
                    CASE
                        WHEN LEN(wallet.PhoneNumber) > 7
                            THEN LEFT(wallet.PhoneNumber, 3) + REPLICATE('*', LEN(wallet.PhoneNumber) - 6) + RIGHT(wallet.PhoneNumber, 3)
                        ELSE wallet.PhoneNumber
                    END
                ) AS DisplayName,
                COALESCE(wallet.PhoneNumber, '') AS PhoneNumber,
                COALESCE(wallet.ProfileImage, 'male') AS ProfileImage,
                CASE 
                    WHEN wallet.DOB IS NOT NULL AND SUBSTRING(wallet.DOB, 6, 5) = FORMAT(GETDATE(), 'MM-dd') THEN 1 
                    ELSE 0 
                END AS IsBirthday,
                wallet.PointsBalance
            FROM dbo.WalletAccounts AS wallet
            ORDER BY wallet.PointsBalance DESC, wallet.LastUpdated ASC;
            """);

    public static (string DisplayName, int PointsAwarded, string Material, string TimeAgo) GetLastRecyclerInfo()
    {
        try
        {
            var dt = Get(
                """
                SELECT TOP 1
                    COALESCE(wallet.FullName, wallet.UserName,
                        CASE
                            WHEN LEN(bt.MobileNumber) > 7
                                THEN LEFT(bt.MobileNumber, 3) + REPLICATE('*', LEN(bt.MobileNumber) - 6) + RIGHT(bt.MobileNumber, 3)
                            WHEN bt.MobileNumber IS NOT NULL AND bt.MobileNumber <> '' THEN bt.MobileNumber
                            ELSE 'Eco Hero'
                        END
                    ) AS DisplayName,
                    COALESCE(bt.PointsAwarded, 10) AS PointsAwarded,
                    COALESCE(bt.MaterialType, 'Bottle') AS MaterialType,
                    bt.TransactionDate
                FROM dbo.BottleTransactions AS bt
                LEFT JOIN dbo.WalletAccounts AS wallet ON wallet.PhoneNumber = bt.MobileNumber
                WHERE bt.IsAccepted = 1 OR bt.IsAccepted IS NULL
                ORDER BY bt.TransactionID DESC;
                """);

            if (dt.Rows.Count > 0)
            {
                var row = dt.Rows[0];
                string name = row["DisplayName"]?.ToString() ?? "Eco Hero";
                int pts = row["PointsAwarded"] != DBNull.Value ? Convert.ToInt32(row["PointsAwarded"]) : 10;
                string mat = row["MaterialType"]?.ToString() ?? "Bottle";
                string timeStr = "Recently";
                if (row["TransactionDate"] != DBNull.Value && DateTime.TryParse(row["TransactionDate"].ToString(), out var dtTime))
                {
                    var span = DateTime.Now - dtTime;
                    if (span.TotalMinutes < 1) timeStr = "Just now";
                    else if (span.TotalMinutes < 60) timeStr = $"{(int)span.TotalMinutes}m ago";
                    else if (span.TotalHours < 24) timeStr = $"{(int)span.TotalHours}h ago";
                    else timeStr = dtTime.ToString("dd MMM, hh:mm tt");
                }
                return (name, pts, mat, timeStr);
            }
        }
        catch { }

        return ("Eco Champion", 10, "Bottle", "Just now");
    }

    public static void UpdateLeaderboardUsers(System.Text.Json.JsonElement usersArr)
    {
        try
        {
            using var connection = new SqlConnection(ConnectionString);
            connection.Open();

            using var schemaCmd = new SqlCommand(@"
                IF COL_LENGTH('dbo.WalletAccounts', 'FullName') IS NULL
                    ALTER TABLE dbo.WalletAccounts ADD FullName NVARCHAR(100) NULL;
                IF COL_LENGTH('dbo.WalletAccounts', 'UserName') IS NULL
                    ALTER TABLE dbo.WalletAccounts ADD UserName NVARCHAR(50) NULL;
                IF COL_LENGTH('dbo.WalletAccounts', 'ProfileImage') IS NULL
                    ALTER TABLE dbo.WalletAccounts ADD ProfileImage NVARCHAR(100) NULL;
                IF COL_LENGTH('dbo.WalletAccounts', 'DOB') IS NULL
                    ALTER TABLE dbo.WalletAccounts ADD DOB NVARCHAR(50) NULL;
            ", connection);
            schemaCmd.ExecuteNonQuery();

            foreach (var u in usersArr.EnumerateArray())
            {
                string userName = u.TryGetProperty("userName", out var un) ? un.GetString() ?? "" : "";
                string fullName = u.TryGetProperty("fullName", out var fn) ? fn.GetString() ?? userName : userName;
                string profileImage = u.TryGetProperty("profileImage", out var img) ? img.GetString() ?? "male" : "male";
                string dob = u.TryGetProperty("dob", out var d) ? d.GetString() ?? "" : "";
                int points = u.TryGetProperty("totalPoints", out var pts) ? pts.GetInt32() : 0;

                if (string.IsNullOrWhiteSpace(userName)) continue;

                using var cmd = new SqlCommand(@"
                    IF EXISTS (SELECT 1 FROM dbo.WalletAccounts WHERE PhoneNumber = @u OR UserName = @u)
                    BEGIN
                        UPDATE dbo.WalletAccounts
                        SET FullName = @fn, UserName = @u, ProfileImage = @img, DOB = @dob, PointsBalance = @pts, LastUpdated = GETDATE()
                        WHERE PhoneNumber = @u OR UserName = @u;
                    END
                    ELSE
                    BEGIN
                        INSERT INTO dbo.WalletAccounts (PhoneNumber, FullName, UserName, ProfileImage, DOB, PointsBalance, LastUpdated)
                        VALUES (@u, @fn, @u, @img, @dob, @pts, GETDATE());
                    END
                ", connection);
                cmd.Parameters.AddWithValue("@u", userName);
                cmd.Parameters.AddWithValue("@fn", fullName);
                cmd.Parameters.AddWithValue("@img", profileImage);
                cmd.Parameters.AddWithValue("@dob", dob);
                cmd.Parameters.AddWithValue("@pts", points);
                cmd.ExecuteNonQuery();
            }
        }
        catch { }
    }

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

    public static bool VerifyAdminCredentials(string username, string password)
    {
        try
        {
            using var connection = new SqlConnection(ConnectionString);
            connection.Open();

            using var schemaCmd = new SqlCommand(@"
                IF OBJECT_ID('dbo.AdminCredentials', 'U') IS NULL
                BEGIN
                    CREATE TABLE dbo.AdminCredentials (
                        Username VARCHAR(50) PRIMARY KEY,
                        Password VARCHAR(255) NOT NULL,
                        LastUpdated DATETIME NOT NULL DEFAULT GETDATE()
                    );

                    INSERT INTO dbo.AdminCredentials (Username, Password)
                    VALUES ('RVM', 'Admin786');
                END;
            ", connection);
            schemaCmd.ExecuteNonQuery();

            using var queryCmd = new SqlCommand("SELECT Password FROM dbo.AdminCredentials WHERE Username = @u", connection);
            queryCmd.Parameters.AddWithValue("@u", username);

            var dbPassword = queryCmd.ExecuteScalar()?.ToString();
            if (dbPassword != null)
            {
                return dbPassword == password;
            }

            // Fallback default
            if (username.Equals("RVM", StringComparison.OrdinalIgnoreCase) && password == "Admin786")
            {
                return true;
            }

            return false;
        }
        catch
        {
            // Fallback default when database is offline
            return username.Equals("RVM", StringComparison.OrdinalIgnoreCase) && password == "Admin786";
        }
    }

    public static bool ChangeAdminPassword(string username, string oldPassword, string newPassword, out string errorMessage)
    {
        errorMessage = string.Empty;
        if (!VerifyAdminCredentials(username, oldPassword))
        {
            errorMessage = "Current password is incorrect.";
            return false;
        }

        try
        {
            using var connection = new SqlConnection(ConnectionString);
            connection.Open();

            using var cmd = new SqlCommand(@"
                IF EXISTS (SELECT 1 FROM dbo.AdminCredentials WHERE Username = @u)
                    UPDATE dbo.AdminCredentials SET Password = @p, LastUpdated = GETDATE() WHERE Username = @u;
                ELSE
                    INSERT INTO dbo.AdminCredentials (Username, Password) VALUES (@u, @p);
            ", connection);
            cmd.Parameters.AddWithValue("@u", username);
            cmd.Parameters.AddWithValue("@p", newPassword);
            cmd.ExecuteNonQuery();

            return true;
        }
        catch (Exception ex)
        {
            errorMessage = ex.Message;
            return false;
        }
    }

    public static async System.Threading.Tasks.Task<(int Total, int Success, int Failed)> SyncAllLocalSessionsToCentralAsync(
        string machineId,
        Action<string>? logCallback = null,
        bool forceResyncAll = false)
    {
        int total = 0, success = 0, failed = 0;
        try
        {
            using var connection = new SqlConnection(ConnectionString);
            await connection.OpenAsync();

            // 1. Ensure IsSynced column exists in dbo.BottleTransactions
            using var colCmd = new SqlCommand(@"
                IF COL_LENGTH('dbo.BottleTransactions', 'IsSynced') IS NULL
                    ALTER TABLE dbo.BottleTransactions ADD IsSynced BIT NOT NULL DEFAULT 0;

                -- Assign unique SessionID to any legacy records where SessionID is NULL
                UPDATE dbo.BottleTransactions SET SessionID = NEWID() WHERE SessionID IS NULL;
            ", connection);
            await colCmd.ExecuteNonQueryAsync();

            // If forceResyncAll requested, reset IsSynced = 0 for all accepted transactions
            if (forceResyncAll)
            {
                using var resetCmd = new SqlCommand("UPDATE dbo.BottleTransactions SET IsSynced = 0 WHERE IsAccepted = 1 OR IsAccepted IS NULL;", connection);
                await resetCmd.ExecuteNonQueryAsync();
                logCallback?.Invoke("[RESET] Forced re-sync requested: Reset IsSynced = 0 for all local accepted transactions.");
            }

            // Check how many unsynced records exist
            using var countCmd = new SqlCommand("SELECT COUNT(*) FROM dbo.BottleTransactions WHERE (IsSynced = 0 OR IsSynced IS NULL) AND (IsAccepted = 1 OR IsAccepted IS NULL);", connection);
            int unsyncedRecordCount = Convert.ToInt32(await countCmd.ExecuteScalarAsync());

            if (unsyncedRecordCount == 0 && !forceResyncAll)
            {
                logCallback?.Invoke("[SYNC 🟢] All local transactions are fully synced to Central Dashboard.");
                return (0, 0, 0);
            }

            // 2. Query unique sessions with complete material variant breakdowns
            string sql = @"
                SELECT 
                    SessionID,
                    ISNULL(MobileNumber, '3214424625') AS MobileNumber,
                    SUM(CASE WHEN (UPPER(MaterialType) LIKE '%PLASTIC%' OR MaterialType IS NULL) AND (UPPER(BottleSize) LIKE '%SMALL%' OR UPPER(BottleSize) = 'S') THEN 1 ELSE 0 END) AS PlasticSmall,
                    SUM(CASE WHEN (UPPER(MaterialType) LIKE '%PLASTIC%' OR MaterialType IS NULL) AND (UPPER(BottleSize) LIKE '%LARGE%' OR UPPER(BottleSize) = 'L') THEN 1 ELSE 0 END) AS PlasticLarge,
                    SUM(CASE WHEN (UPPER(MaterialType) LIKE '%PLASTIC%' OR MaterialType IS NULL) AND UPPER(BottleSize) NOT LIKE '%SMALL%' AND UPPER(BottleSize) NOT LIKE '%LARGE%' AND UPPER(BottleSize) != 'S' AND UPPER(BottleSize) != 'L' THEN 1 ELSE 0 END) AS PlasticMedium,
                    SUM(CASE WHEN UPPER(MaterialType) LIKE '%CAN%' AND (UPPER(BottleSize) LIKE '%SMALL%' OR UPPER(BottleSize) = 'S') THEN 1 ELSE 0 END) AS CanSmall,
                    SUM(CASE WHEN UPPER(MaterialType) LIKE '%CAN%' AND (UPPER(BottleSize) LIKE '%LARGE%' OR UPPER(BottleSize) = 'L') THEN 1 ELSE 0 END) AS CanLarge,
                    SUM(CASE WHEN UPPER(MaterialType) LIKE '%CAN%' AND UPPER(BottleSize) NOT LIKE '%SMALL%' AND UPPER(BottleSize) NOT LIKE '%LARGE%' AND UPPER(BottleSize) != 'S' AND UPPER(BottleSize) != 'L' THEN 1 ELSE 0 END) AS CanMedium,
                    SUM(CASE WHEN (UPPER(MaterialType) LIKE '%TETRA%' OR UPPER(MaterialType) LIKE '%CARTON%' OR UPPER(MaterialType) LIKE '%PAPER%') AND (UPPER(BottleSize) LIKE '%SMALL%' OR UPPER(BottleSize) = 'S') THEN 1 ELSE 0 END) AS TetraPakSmall,
                    SUM(CASE WHEN (UPPER(MaterialType) LIKE '%TETRA%' OR UPPER(MaterialType) LIKE '%CARTON%' OR UPPER(MaterialType) LIKE '%PAPER%') AND (UPPER(BottleSize) LIKE '%LARGE%' OR UPPER(BottleSize) = 'L') THEN 1 ELSE 0 END) AS TetraPakLarge,
                    SUM(CASE WHEN (UPPER(MaterialType) LIKE '%TETRA%' OR UPPER(MaterialType) LIKE '%CARTON%' OR UPPER(MaterialType) LIKE '%PAPER%') AND UPPER(BottleSize) NOT LIKE '%SMALL%' AND UPPER(BottleSize) NOT LIKE '%LARGE%' AND UPPER(BottleSize) != 'S' AND UPPER(BottleSize) != 'L' THEN 1 ELSE 0 END) AS TetraPakMedium,
                    SUM(PointsAwarded) AS TotalPoints,
                    COUNT(*) AS TotalItems
                FROM dbo.BottleTransactions
                WHERE (IsSynced = 0 OR IsSynced IS NULL) AND (IsAccepted = 1 OR IsAccepted IS NULL)
                GROUP BY SessionID, ISNULL(MobileNumber, '3214424625');
            ";

            using var cmd = new SqlCommand(sql, connection);
            using var reader = await cmd.ExecuteReaderAsync();

            var sessionList = new System.Collections.Generic.List<(string sessId, string phone, int ps, int pm, int pl, int cs, int cm, int cl, int tps, int tpm, int tpl, int pts)>();

            while (await reader.ReadAsync())
            {
                sessionList.Add((
                    reader["SessionID"].ToString() ?? Guid.NewGuid().ToString(),
                    reader["MobileNumber"].ToString() ?? "3214424625",
                    Convert.ToInt32(reader["PlasticSmall"]),
                    Convert.ToInt32(reader["PlasticMedium"]),
                    Convert.ToInt32(reader["PlasticLarge"]),
                    Convert.ToInt32(reader["CanSmall"]),
                    Convert.ToInt32(reader["CanMedium"]),
                    Convert.ToInt32(reader["CanLarge"]),
                    Convert.ToInt32(reader["TetraPakSmall"]),
                    Convert.ToInt32(reader["TetraPakMedium"]),
                    Convert.ToInt32(reader["TetraPakLarge"]),
                    Convert.ToInt32(reader["TotalPoints"])
                ));
            }

            reader.Close();
            total = sessionList.Count;

            logCallback?.Invoke($"Found {total} unsynced local sessions to upload to Central Master Server...");

            foreach (var item in sessionList)
            {
                int plasticCount = item.ps + item.pm + item.pl;
                int canCount = item.cs + item.cm + item.cl;
                int paperCount = item.tps + item.tpm + item.tpl;

                var res = await CentralSyncService.SyncSessionToCentralDetailedAsync(
                    machineId,
                    item.sessId,
                    item.phone,
                    plasticCount,
                    canCount,
                    paperCount,
                    0, // glass
                    item.pts,
                    0.0,
                    "MEDIUM",
                    "PLASTIC",
                    item.ps, item.pm, item.pl,
                    item.cs, item.cm, item.cl,
                    item.tps, item.tpm
                );

                if (res.IsSuccess)
                {
                    success++;
                    logCallback?.Invoke($"[Sync OK 🟢] Session {item.sessId} ({item.phone}): {res.Message}");

                    // Mark as synced in local DB
                    using var updateCmd = new SqlCommand("UPDATE dbo.BottleTransactions SET IsSynced = 1 WHERE SessionID = @s", connection);
                    updateCmd.Parameters.AddWithValue("@s", Guid.Parse(item.sessId));
                    await updateCmd.ExecuteNonQueryAsync();
                }
                else
                {
                    failed++;
                    logCallback?.Invoke($"[Sync ERR 🔴] Session {item.sessId} failed: {res.Message}");
                }
            }
        }
        catch (Exception ex)
        {
            logCallback?.Invoke($"[Sync Exception 🔴] {ex.Message}");
        }

        return (total, success, failed);
    }
}
