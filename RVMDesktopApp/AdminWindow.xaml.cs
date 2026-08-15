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
        try
        {
            DatabaseManager.SaveTransaction(sessionId, size, material, totalPoints, true);
            if (!string.IsNullOrWhiteSpace(userId))
            {
                DatabaseManager.CreditWallet(userId, totalPoints, sessionId);
            }
            LogConsole($"1. Local SQL Server Transaction: SAVED locally.");
        }
        catch (Exception ex)
        {
            LogConsole($"1. Local SQL Server Notice: {ex.Message} (Proceeding to Central Sync)");
        }

        // Step 2: Sync to Central Master Dashboard API
        int plasticCount = material.Contains("PLASTIC") ? itemCount : 0;
        int aluminiumCount = (material.Contains("CAN") || material.Contains("METAL")) ? itemCount : 0;
        int paperCount = material.Contains("PAPER") ? itemCount : 0;
        int glassCount = material.Contains("GLASS") ? itemCount : 0;

        bool syncSuccess = await CentralSyncService.SyncSessionToCentralAsync(
            machineId,
            sessionId.ToString(),
            userId,
            plasticCount,
            aluminiumCount,
            paperCount,
            glassCount,
            totalPoints,
            weightKg
        );


        if (syncSuccess)
        {
            LogConsole($"2. Central Master Dashboard Sync (POST /api/machine/sync-session): SUCCESS 🟢");
            LogConsole($"   -> Machine '{machineId}' transaction synced.");
            LogConsole($"   -> User '{userId}' credited +{totalPoints} points on Central DB!");
        }
        else
        {
            LogConsole($"2. Central Master Dashboard Sync: FAILED 🔴 (Verify central server URL or connection)");
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
