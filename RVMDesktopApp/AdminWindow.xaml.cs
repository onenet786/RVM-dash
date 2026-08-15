using System;
using System.Data;
using System.Net.Http;
using System.Windows;
using System.Windows.Controls;

namespace RVMDesktopApp;

public partial class AdminWindow : Window
{
    public AdminWindow()
    {
        InitializeComponent();
        Loaded += (sender, e) => {
            Load();
            LogConsole("RVM Master Communication Console Initialized.");
            LogConsole("Ready to test live 2-way sync with Central Master Dashboard.");
        };
    }

    private void Load()
    {
        try
        {
            PointsGrid.ItemsSource = DatabaseManager.GetPointSettings().DefaultView;
            TransactionsGrid.ItemsSource = DatabaseManager.GetTransactions().DefaultView;
        }
        catch (Exception ex)
        {
            LogConsole($"[Local Database Notice] {ex.Message}");
        }
    }

    private void LogConsole(string message)
    {
        string timestamp = DateTime.Now.ToString("HH:mm:ss");
        TxtConsoleLog.AppendText($"[{timestamp}] {message}\n");
        TxtConsoleLog.ScrollToEnd();
    }

    private void Refresh_Click(object sender, RoutedEventArgs e) => Load();

    private void Save_Click(object sender, RoutedEventArgs e)
    {
        if (PointsGrid.ItemsSource is not DataView view)
        {
            MessageBox.Show("No point settings loaded.", "Save Points", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        bool anyError = false;

        foreach (DataRowView rowView in view)
        {
            try
            {
                if (rowView.Row.RowState == DataRowState.Unchanged)
                {
                    continue;
                }

                int id = Convert.ToInt32(rowView["PointSettingID"]);
                int points = Convert.ToInt32(rowView["Points"]);

                if (points < 0)
                {
                    MessageBox.Show("Points cannot be negative.", "Validation", MessageBoxButton.OK, MessageBoxImage.Warning);
                    anyError = true;
                    break;
                }

                DatabaseManager.UpdatePoints(id, points);
                rowView.Row.AcceptChanges();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to save row: {ex.Message}", "Save Points", MessageBoxButton.OK, MessageBoxImage.Error);
                anyError = true;
                break;
            }
        }

        if (!anyError)
        {
            MessageBox.Show("Point settings saved.", "Save Points", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        Load();
    }

    private async void TestConnection_Click(object sender, RoutedEventArgs e)
    {
        string serverUrl = TxtServerUrl.Text.Trim();
        CentralSyncService.CentralApiUrl = serverUrl;

        LogConsole($"--------------------------------------------------");
        LogConsole($"Testing HTTP connection to Central Server: {serverUrl}/api/machine/config/RVM-001...");
        TxtConnStatus.Text = "Testing...";
        TxtConnStatus.Foreground = System.Windows.Media.Brushes.Orange;

        try
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
            var response = await client.GetAsync($"{serverUrl}/api/machine/config/RVM-001");
            if (response.IsSuccessStatusCode)
            {
                string json = await response.Content.ReadAsStringAsync();
                TxtConnStatus.Text = "Connected 🟢";
                TxtConnStatus.Foreground = System.Windows.Media.Brushes.LightGreen;
                LogConsole($"SUCCESS (HTTP {(int)response.StatusCode}): Connected to Central Dashboard API!");
                LogConsole($"Downstream Points Config Rules: {json}");
            }
            else
            {
                TxtConnStatus.Text = "Error 🔴";
                TxtConnStatus.Foreground = System.Windows.Media.Brushes.Red;
                LogConsole($"HTTP Error {(int)response.StatusCode}: {response.ReasonPhrase}");
            }
        }
        catch (Exception ex)
        {
            TxtConnStatus.Text = "Offline 🔴";
            TxtConnStatus.Foreground = System.Windows.Media.Brushes.Red;
            LogConsole($"CONNECTION FAILED: {ex.Message}");
        }
    }

    private async void SimulateInsert_Click(object sender, RoutedEventArgs e)
    {
        string machineId = TxtMachineId.Text.Trim();
        string userId = TxtUserId.Text.Trim();
        string material = (CmbMaterial.SelectedItem as ComboBoxItem)?.Content?.ToString() ?? "PLASTIC";
        string size = (CmbSize.SelectedItem as ComboBoxItem)?.Content?.ToString() ?? "MEDIUM";

        if (!int.TryParse(TxtItemCount.Text.Trim(), out int itemCount) || itemCount <= 0) itemCount = 1;
        if (!double.TryParse(TxtWeightKg.Text.Trim(), out double weightKg) || weightKg <= 0) weightKg = 0.150;

        CentralSyncService.CentralApiUrl = TxtServerUrl.Text.Trim();
        Guid sessionId = Guid.NewGuid();
        int pointsPerItem = 10;
        try
        {
            pointsPerItem = DatabaseManager.GetPoints(size, material.Contains("CAN") ? "CAN" : material);
            if (pointsPerItem == 0) pointsPerItem = 10;
        }
        catch
        {
            pointsPerItem = 10;
        }
        int totalPoints = pointsPerItem * itemCount;

        LogConsole($"--------------------------------------------------");
        LogConsole($"🚀 SIMULATING RECYCLING SESSION [{sessionId.ToString()[..8]}]...");
        LogConsole($"Item: {itemCount}x {size} {material} | Weight: {weightKg} kg | Points Calculated: {totalPoints}");

        // Step 1: Save local transaction
        LogConsole($"💾 1. LOCAL SQL SERVER TRANSACTION:");
        try
        {
            DatabaseManager.SaveTransaction(sessionId, size, material, totalPoints, true);
            LogConsole($"   -> Local Server: SQL Server 2012 (RVMDB)");
            LogConsole($"   -> Table 'RVMDB.dbo.Transactions': Record Inserted 🟢 (Session ID: {sessionId})");

            if (!string.IsNullOrWhiteSpace(userId))
            {
                DatabaseManager.CreditWallet(userId, totalPoints, sessionId);
                LogConsole($"   -> Table 'RVMDB.dbo.Wallets': Credited +{totalPoints} pts to user '{userId}' 🟢");
            }
        }
        catch (Exception ex)
        {
            LogConsole($"   -> Local SQL Server Notice: {ex.Message} (Proceeding to Remote Central Sync)");
        }

        // Step 2: Sync to Remote Central Master Dashboard API
        int plasticCount = material.Contains("PLASTIC") ? itemCount : 0;
        int aluminiumCount = (material.Contains("CAN") || material.Contains("METAL")) ? itemCount : 0;
        int paperCount = material.Contains("PAPER") ? itemCount : 0;
        int glassCount = material.Contains("GLASS") ? itemCount : 0;

        int pSmall = material.Contains("PLASTIC") && size == "SMALL" ? itemCount : 0;
        int pMedium = material.Contains("PLASTIC") && size == "MEDIUM" ? itemCount : 0;
        int pLarge = material.Contains("PLASTIC") && size == "LARGE" ? itemCount : 0;

        int cSmall = (material.Contains("CAN") || material.Contains("METAL")) && size == "SMALL" ? itemCount : 0;
        int cMedium = (material.Contains("CAN") || material.Contains("METAL")) && size == "MEDIUM" ? itemCount : 0;
        int cLarge = (material.Contains("CAN") || material.Contains("METAL")) && size == "LARGE" ? itemCount : 0;

        int paperGrams = material.Contains("PAPER") ? Math.Max(100, (int)(weightKg * 1000)) : 0;
        int tetrapakGrams = material.Contains("TETRA") || material.Contains("PAK") ? Math.Max(700, (int)(weightKg * 1000)) : 0;

        CentralSyncService.CentralApiUrl = TxtServerUrl.Text.Trim();

        LogConsole($"📡 2. REMOTE MASTER DASHBOARD POSTGRESQL SYNC:");
        LogConsole($"   -> Endpoint: POST {CentralSyncService.CentralApiUrl.TrimEnd('/')}/api/machine/sync-session");

        var syncRes = await CentralSyncService.SyncSessionToCentralDetailedAsync(
            machineId,
            sessionId.ToString(),
            userId,
            plasticCount,
            aluminiumCount,
            paperCount,
            glassCount,
            totalPoints,
            weightKg,
            size,
            material,
            pSmall,
            pMedium,
            pLarge,
            cSmall,
            cMedium,
            cLarge,
            paperGrams,
            tetrapakGrams
        );


        if (syncRes.IsSuccess)
        {
            LogConsole($"   -> Remote DB Engine: {syncRes.RemoteDbEngine}");
            LogConsole($"   -> Target PostgreSQL Tables Populated:");
            LogConsole($"      • recycling_sessions (Session ID: {machineId}_{sessionId})");
            LogConsole($"      • machines (Machine ID: {machineId} | Total Bottles: +{itemCount})");
            LogConsole($"      • users (User ID: {userId} | Points Balance: +{totalPoints})");
            LogConsole($"      • recyclingsessions (JSONB Document Engine)");
            LogConsole($"   -> Response: HTTP {syncRes.StatusCode} OK 🟢 ({syncRes.Message})");
        }
        else
        {
            LogConsole($"   -> Remote Sync Status: FAILED 🔴 (HTTP {syncRes.StatusCode})");
            LogConsole($"   -> Error Details: {syncRes.Message}");
        }


        Load();
    }

    private async void SendHeartbeat_Click(object sender, RoutedEventArgs e)
    {
        string machineId = TxtMachineId.Text.Trim();
        CentralSyncService.CentralApiUrl = TxtServerUrl.Text.Trim();

        LogConsole($"--------------------------------------------------");
        LogConsole($"📡 Sending Telemetry Heartbeat Ping (Machine: {machineId}, Bin Fill: 85%)...");

        bool hbSuccess = await CentralSyncService.SendHeartbeatAsync(machineId, 85, "active");
        if (hbSuccess)
        {
            LogConsole($"Heartbeat Sent 🟢 (Fill: 85% Triggered Bin Alert on Master Dashboard!)");
        }
        else
        {
            LogConsole($"Heartbeat Ping Failed 🔴");
        }
    }

    private async void VerifyQr_Click(object sender, RoutedEventArgs e)
    {
        string qrToken = TxtUserId.Text.Trim();
        string machineId = TxtMachineId.Text.Trim();
        CentralSyncService.CentralApiUrl = TxtServerUrl.Text.Trim();

        LogConsole($"--------------------------------------------------");
        LogConsole($"🔍 Verifying Hardware Scanner QR Code Token: '{qrToken}'...");

        string? result = await CentralSyncService.VerifyUserQrCodeAsync(qrToken, machineId);
        if (!string.IsNullOrWhiteSpace(result))
        {
            LogConsole($"QR Authenticator Response 🟢:\n{result}");
        }
        else
        {
            LogConsole($"QR Verification Failed 🔴 (User token '{qrToken}' not found on Central DB)");
        }
    }

    private void ClearConsole_Click(object sender, RoutedEventArgs e)
    {
        TxtConsoleLog.Clear();
        LogConsole("Console cleared.");
    }
}
