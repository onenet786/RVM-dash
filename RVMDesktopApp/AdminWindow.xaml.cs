using System;
using System.Data;
using System.Net.Http;
using System.Windows;
using System.Windows.Controls;

namespace RVMDesktopApp;

public partial class AdminWindow : Window
{
    private readonly AppSettings settings = AppSettings.Load();

    public AdminWindow()
    {
        InitializeComponent();
        Loaded += async (sender, e) => {
            TxtServerUrl.Text = settings.CentralApiUrl;
            TxtMachineId.Text = settings.MachineId;
            Load();
            LoadConfigForm();
            LogConsole("RVM Master Communication Console Initialized.");
            LogConsole("Ready to test live 2-way sync with Central Master Dashboard.");
            await CheckCentralConnectionAsync();
        };
    }

    private void LoadConfigForm()
    {
        try
        {
            var raw = AppSettings.LoadRawConfig();
            CfgConnectionString.Text = raw.GetValueOrDefault("ConnectionString", @"Server=.\SQLEXPRESS;Database=RVMDB;User ID=RVM;Password=RVM;Encrypt=False;TrustServerCertificate=True;");
            CfgMachineId.Text = raw.GetValueOrDefault("MachineId", "RVM-RWP");
            CfgCentralApiUrl.Text = raw.GetValueOrDefault("CentralApiUrl", "https://isprvm.binishaqsoft.com");
            CfgArduinoPort.Text = raw.GetValueOrDefault("ArduinoPort", "COM16");
            CfgArduinoBaud.Text = raw.GetValueOrDefault("ArduinoBaud", "9600");
            CfgCameraPort.Text = raw.GetValueOrDefault("CameraPort", "COM31");
            CfgCameraBaud.Text = raw.GetValueOrDefault("CameraBaud", "921600");
            CfgAdsFolder.Text = raw.GetValueOrDefault("AdvertisementVideoFolder", @"Ads\Advertisements");
            CfgInstructionsFolder.Text = raw.GetValueOrDefault("InstructionVideoFolder", @"Ads\Instructions");
            CfgModelPath.Text = raw.GetValueOrDefault("ModelPath", @"Models\rvm_classifier.onnx");
            CfgCaptureDir.Text = raw.GetValueOrDefault("CaptureDirectory", "Captures");
        }
        catch (Exception ex)
        {
            LogConsole($"[Config Load Notice] {ex.Message}");
        }
    }

    private void ReloadConfig_Click(object sender, RoutedEventArgs e)
    {
        LoadConfigForm();
        RvmMessageDialog.ShowInfo("Reload Config", "Configuration reloaded from config.txt.", this);
    }

    private void SaveConfig_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            var dict = new Dictionary<string, string>
            {
                ["ConnectionString"] = CfgConnectionString.Text.Trim(),
                ["MachineId"] = CfgMachineId.Text.Trim(),
                ["CentralApiUrl"] = CfgCentralApiUrl.Text.Trim(),
                ["ArduinoPort"] = CfgArduinoPort.Text.Trim(),
                ["ArduinoBaud"] = CfgArduinoBaud.Text.Trim(),
                ["CameraPort"] = CfgCameraPort.Text.Trim(),
                ["CameraBaud"] = CfgCameraBaud.Text.Trim(),
                ["AdvertisementVideoFolder"] = CfgAdsFolder.Text.Trim(),
                ["InstructionVideoFolder"] = CfgInstructionsFolder.Text.Trim(),
                ["ModelPath"] = CfgModelPath.Text.Trim(),
                ["CaptureDirectory"] = CfgCaptureDir.Text.Trim()
            };

            AppSettings.SaveConfigToFile(dict);
            CentralSyncService.CentralApiUrl = dict["CentralApiUrl"];

            // Restart background heartbeat with updated config
            HeartbeatService.Start(dict["MachineId"], dict["CentralApiUrl"]);

            RvmMessageDialog.ShowSuccess("Save Config", "System & Hardware Configuration successfully saved to config.txt!", this);
            LogConsole("[System Config] Saved updated config.txt settings successfully.");
        }
        catch (Exception ex)
        {
            RvmMessageDialog.ShowError("Save Config Error", $"Failed to save config.txt: {ex.Message}", this);
        }
    }

    private void ReinitializeArduino_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            string port = CfgArduinoPort.Text.Trim();
            int baud = int.TryParse(CfgArduinoBaud.Text.Trim(), out int b) ? b : 9600;

            if (Application.Current.MainWindow is MainWindow mainWin)
            {
                mainWin.DisconnectHardwareOnExit();
                System.Threading.Thread.Sleep(300);
            }
            else if (Application.Current.MainWindow is LandscapeWindow landWin)
            {
                landWin.DisconnectHardwareOnExit();
                System.Threading.Thread.Sleep(300);
            }

            using var serial = new SerialManager();
            serial.Connect(port, baud);
            serial.SendCommand("RESET");
            serial.SendCommand("STATUS");
            System.Threading.Thread.Sleep(300);
            serial.Disconnect();

            RvmMessageDialog.ShowSuccess("Arduino Re-initialized", $"Arduino board on {port} (Baud: {baud}) successfully re-initialized with hardware DTR reset and soft reset!", this);
            LogConsole($"[Hardware Reset] Arduino on {port} re-initialized cleanly.");
        }
        catch (Exception ex)
        {
            RvmMessageDialog.ShowError("Arduino Reset Error", $"Failed to re-initialize Arduino: {ex.Message}", this);
            LogConsole($"[Hardware Reset Error] {ex.Message}");
        }
    }

    private void Load()
    {
        try
        {
            PointsGrid.ItemsSource = DatabaseManager.GetPointSettings().DefaultView;
            TransactionsGrid.ItemsSource = DatabaseManager.GetTransactions().DefaultView;
            TxtHeaderSqlStatus.Text = "Connected 🟢";
            TxtHeaderSqlStatus.Foreground = System.Windows.Media.Brushes.LightGreen;
        }
        catch (Exception ex)
        {
            TxtHeaderSqlStatus.Text = "Offline 🔴";
            TxtHeaderSqlStatus.Foreground = System.Windows.Media.Brushes.Red;
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
            RvmMessageDialog.ShowWarning("Save Points", "No point settings loaded.", this);
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
                    RvmMessageDialog.ShowWarning("Validation", "Points cannot be negative.", this);
                    anyError = true;
                    break;
                }

                DatabaseManager.UpdatePoints(id, points);
                rowView.Row.AcceptChanges();
            }
            catch (Exception ex)
            {
                RvmMessageDialog.ShowError("Save Points", $"Failed to save row: {ex.Message}", this);
                anyError = true;
                break;
            }
        }

        if (!anyError)
        {
            RvmMessageDialog.ShowSuccess("Save Points", "Point settings saved successfully.", this);
        }

        Load();
    }

    private async Task CheckCentralConnectionAsync()
    {
        string serverUrl = TxtServerUrl.Text.Trim();
        if (string.IsNullOrWhiteSpace(serverUrl)) serverUrl = settings.CentralApiUrl;
        CentralSyncService.CentralApiUrl = serverUrl;

        string machineId = TxtMachineId.Text.Trim();
        if (string.IsNullOrWhiteSpace(machineId)) machineId = settings.MachineId;

        LogConsole($"--------------------------------------------------");
        LogConsole($"Testing HTTP connection to Central Server: {serverUrl}/api/machine/config/{machineId}...");
        TxtConnStatus.Text = "Testing...";
        TxtConnStatus.Foreground = System.Windows.Media.Brushes.Orange;

        TxtHeaderApiStatus.Text = "Testing... ⏳";
        TxtHeaderApiStatus.Foreground = System.Windows.Media.Brushes.Orange;

        try
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
            var response = await client.GetAsync($"{serverUrl}/api/machine/config/{machineId}");
            if (response.IsSuccessStatusCode)
            {
                string json = await response.Content.ReadAsStringAsync();
                TxtConnStatus.Text = "Connected 🟢";
                TxtConnStatus.Foreground = System.Windows.Media.Brushes.LightGreen;

                TxtHeaderApiStatus.Text = "Connected 🟢";
                TxtHeaderApiStatus.Foreground = System.Windows.Media.Brushes.LightGreen;

                LogConsole($"SUCCESS (HTTP {(int)response.StatusCode}): Connected to Central Dashboard API!");
                LogConsole($"Downstream Points Config Rules: {json}");
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.Forbidden)
            {
                TxtConnStatus.Text = "Unauthorized 🔴";
                TxtConnStatus.Foreground = System.Windows.Media.Brushes.OrangeRed;

                TxtHeaderApiStatus.Text = "Unauthorized 🔴";
                TxtHeaderApiStatus.Foreground = System.Windows.Media.Brushes.OrangeRed;

                LogConsole($"HTTP 403 Forbidden: Machine '{machineId}' is NOT registered or authorized on Central Dashboard! Please add it under Fleet Monitoring on https://isprvm.binishaqsoft.com");
            }
            else
            {
                TxtConnStatus.Text = "Error 🔴";
                TxtConnStatus.Foreground = System.Windows.Media.Brushes.Red;

                TxtHeaderApiStatus.Text = "Disconnected 🔴";
                TxtHeaderApiStatus.Foreground = System.Windows.Media.Brushes.Red;

                LogConsole($"HTTP Error {(int)response.StatusCode}: {response.ReasonPhrase}");
            }
        }
        catch (Exception ex)
        {
            TxtConnStatus.Text = "Offline 🔴";
            TxtConnStatus.Foreground = System.Windows.Media.Brushes.Red;

            TxtHeaderApiStatus.Text = "Disconnected 🔴";
            TxtHeaderApiStatus.Foreground = System.Windows.Media.Brushes.Red;

            LogConsole($"CONNECTION FAILED: {ex.Message}");
        }
    }

    private async void TestConnection_Click(object sender, RoutedEventArgs e)
    {
        await CheckCentralConnectionAsync();
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

    private async void SyncLocalData_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            string machineId = CfgMachineId?.Text?.Trim() ?? "RVM-001";
            TxtSyncStatus.Text = "Syncing local transactions to Central Master Server...";
            TxtSyncStatus.Foreground = System.Windows.Media.Brushes.Gold;

            LogConsole("--------------------------------------------------");
            LogConsole($"🔄 Starting manual sync of local SQL Server transactions to Central Master Dashboard...");

            var (total, success, failed) = await DatabaseManager.SyncAllLocalSessionsToCentralAsync(machineId, msg => LogConsole(msg));

            if (total == 0)
            {
                TxtSyncStatus.Text = "All local transactions are already synced! ✅";
                TxtSyncStatus.Foreground = System.Windows.Media.Brushes.LightGreen;
                RvmMessageDialog.ShowInfo("Sync Complete", "All local SQL Server transactions are already synced up to date with Central Dashboard!", this);
            }
            else
            {
                TxtSyncStatus.Text = $"Sync finished: {success} succeeded, {failed} failed out of {total} total.";
                TxtSyncStatus.Foreground = success > 0 ? System.Windows.Media.Brushes.LightGreen : System.Windows.Media.Brushes.OrangeRed;
                RvmMessageDialog.ShowSuccess("Central Sync Complete", $"Manual Central Data Sync Complete!\n\nTotal Local Sessions: {total}\nSuccessfully Synced: {success}\nFailed: {failed}", this);
            }

            Load();
        }
        catch (Exception ex)
        {
            TxtSyncStatus.Text = $"Sync Error: {ex.Message}";
            TxtSyncStatus.Foreground = System.Windows.Media.Brushes.OrangeRed;
            LogConsole($"[Sync Error 🔴] {ex.Message}");
        }
    }

    private void ChangePassword_Click(object sender, RoutedEventArgs e)
    {
        string currentPwd = PwdCurrentAdmin.Password;
        string newPwd = PwdNewAdmin.Password;
        string confirmPwd = PwdConfirmAdmin.Password;

        if (string.IsNullOrEmpty(currentPwd))
        {
            RvmMessageDialog.ShowWarning("Validation Error", "Please enter your current admin password.", this);
            PwdCurrentAdmin.Focus();
            return;
        }

        if (string.IsNullOrEmpty(newPwd))
        {
            RvmMessageDialog.ShowWarning("Validation Error", "Please enter a new password.", this);
            PwdNewAdmin.Focus();
            return;
        }

        if (newPwd != confirmPwd)
        {
            RvmMessageDialog.ShowWarning("Validation Error", "New password and confirm password do not match.", this);
            PwdConfirmAdmin.Focus();
            return;
        }

        if (DatabaseManager.ChangeAdminPassword("RVM", currentPwd, newPwd, out string err))
        {
            RvmMessageDialog.ShowSuccess("Password Updated", "Admin password successfully updated in local SQL database!\n\nUse your new password next time you access the Admin Panel.", this);
            LogConsole("[Security 🟢] Admin password successfully updated in local database.");
            PwdCurrentAdmin.Clear();
            PwdNewAdmin.Clear();
            PwdConfirmAdmin.Clear();
        }
        else
        {
            RvmMessageDialog.ShowError("Password Error", $"Failed to update password: {err}", this);
            LogConsole($"[Security 🔴] Password change failed: {err}");
        }
    }
}
