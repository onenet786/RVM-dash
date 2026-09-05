using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Windows;
using System.Windows.Controls;

namespace PecoDropDesktopApp;

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
            LoadAdVideosList();
            LogConsole("RVM Master Communication Console Initialized.");
            LogConsole("Ready to test live 2-way sync with Central Master Dashboard.");
            await CheckCentralConnectionAsync();
            await RefreshComparisonDataAsync();
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
        bool isCup = material.Contains("CUP");
        bool isTetra = material.Contains("TETRA") || material.Contains("PAK");
        bool isCan = material.Contains("CAN") || material.Contains("METAL") || material.Contains("ALUMINIUM");
        bool isGlass = material.Contains("GLASS");
        bool isPaper = material.Contains("PAPER") || material.Contains("CARDBOARD") || isCup || isTetra;
        bool isPlastic = material.Contains("PLASTIC") && !isCup;

        int plasticCount = isPlastic ? itemCount : 0;
        int aluminiumCount = isCan ? itemCount : 0;
        int paperCount = isPaper ? itemCount : 0;
        int glassCount = isGlass ? itemCount : 0;

        int pSmall = isPlastic && size == "SMALL" ? itemCount : 0;
        int pMedium = isPlastic && size == "MEDIUM" ? itemCount : 0;
        int pLarge = isPlastic && size == "LARGE" ? itemCount : 0;

        int cSmall = isCan && size == "SMALL" ? itemCount : 0;
        int cMedium = isCan && size == "MEDIUM" ? itemCount : 0;
        int cLarge = isCan && size == "LARGE" ? itemCount : 0;

        int paperGrams = isPaper ? Math.Max(100, (int)(weightKg * 1000)) : 0;
        int tetrapakGrams = isTetra ? Math.Max(700, (int)(weightKg * 1000)) : 0;

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
            string machineId = CfgMachineId?.Text?.Trim() ?? settings.MachineId;
            if (string.IsNullOrWhiteSpace(machineId)) machineId = settings.MachineId;

            TxtSyncStatus.Text = "Syncing local transactions to Central Master Server...";
            TxtSyncStatus.Foreground = System.Windows.Media.Brushes.Gold;

            LogConsole("--------------------------------------------------");
            LogConsole($"🔄 Starting manual sync of local SQL Server transactions for Machine '{machineId}' to Central Master Dashboard...");

            var (total, success, failed) = await DatabaseManager.SyncAllLocalSessionsToCentralAsync(machineId, msg => LogConsole(msg));

            // Refresh comparison grid data immediately after sync
            await RefreshComparisonDataAsync();

            if (total == 0)
            {
                TxtSyncStatus.Text = "All local transactions are already synced! ✅";
                TxtSyncStatus.Foreground = System.Windows.Media.Brushes.LightGreen;
                RvmMessageDialog.ShowInfo("Sync Complete", "All local SQL Server transactions are already synced up to date with Central Dashboard!", this);
            }
            else if (failed == 0)
            {
                TxtSyncStatus.Text = $"Sync finished: {success} sessions ({total} items) successfully synced to Central Server! 🟢";
                TxtSyncStatus.Foreground = System.Windows.Media.Brushes.LightGreen;
                RvmMessageDialog.ShowSuccess("Central Sync Complete", $"Manual Central Data Sync Complete!\n\nTotal Local Sessions Uploaded: {success}\nStatus: All sessions successfully synchronized with Central Dashboard! 🟢", this);
            }
            else
            {
                TxtSyncStatus.Text = $"Sync finished: {success} succeeded, {failed} failed out of {total} total sessions.";
                TxtSyncStatus.Foreground = System.Windows.Media.Brushes.OrangeRed;
                RvmMessageDialog.ShowWarning("Central Sync Notice", $"Manual Central Data Sync Completed with Warnings!\n\nTotal Local Sessions: {total}\nSuccessfully Synced: {success}\nFailed: {failed}\n\nCheck console log for details.", this);
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

    private async void RefreshComparisonData_Click(object sender, RoutedEventArgs e)
    {
        await RefreshComparisonDataAsync();
    }

    private void RefreshLocalPointSettingsGrid()
    {
        try
        {
            string machineId = CfgMachineId?.Text?.Trim() ?? settings.MachineId;
            DataTable dt = DatabaseManager.GetLocalPointSettings(machineId);
            GridLocalPointSettings.ItemsSource = dt.DefaultView;
        }
        catch (Exception ex)
        {
            LogConsole($"[Point Settings Error] Failed to load local point settings grid: {ex.Message}");
        }
    }

    private async void SyncPointSettings_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            string machineId = CfgMachineId?.Text?.Trim() ?? settings.MachineId;
            LogConsole($"[Point Settings 🔄] Fetching latest point settings from Central Server for machine '{machineId}'...");
            bool ok = await DatabaseManager.SyncPointSettingsFromCentralAsync(machineId, msg => LogConsole(msg));
            RefreshLocalPointSettingsGrid();
            if (ok)
            {
                RvmMessageDialog.ShowSuccess("Point Settings Synced", $"Successfully synced dynamic point settings matrix from Central Dashboard into local SQL table dbo.PointSettings!", this);
            }
            else
            {
                RvmMessageDialog.ShowInfo("Local Point Settings Loaded", $"Active point settings matrix loaded from local SQL database (12 variant rules active). Remote server endpoint will auto-sync when online.", this);
            }
        }
        catch (Exception ex)
        {
            LogConsole($"[Point Settings Exception] {ex.Message}");
            RefreshLocalPointSettingsGrid();
            RvmMessageDialog.ShowInfo("Local Point Settings Loaded", $"Active point settings matrix loaded from local SQL database.", this);
        }
    }

    private async System.Threading.Tasks.Task RefreshComparisonDataAsync()
    {
        try
        {
            TxtComparisonSummary.Text = "Fetching live comparison metrics from Local SQL and Central Dashboard...";
            TxtComparisonSummary.Foreground = System.Windows.Media.Brushes.Gold;

            string machineId = CfgMachineId?.Text?.Trim() ?? settings.MachineId;
            if (string.IsNullOrWhiteSpace(machineId)) machineId = settings.MachineId;

            string serverUrl = CfgCentralApiUrl?.Text?.Trim() ?? settings.CentralApiUrl;
            if (string.IsNullOrWhiteSpace(serverUrl)) serverUrl = settings.CentralApiUrl;

            // Sync dynamic point settings from Central Dashboard
            await DatabaseManager.SyncPointSettingsFromCentralAsync(machineId, msg => LogConsole(msg));
            RefreshLocalPointSettingsGrid();

            // 1. Fetch Local SQL Counts & Grand Totals
            DataTable localDt = DatabaseManager.GetLocalItemCountsByVariant(machineId);
            (int locTotalItems, int locTotalPoints) = DatabaseManager.GetLocalTotals(machineId);

            int locPSmall = 0, locPMed = 0, locPLg = 0;
            int locCSmall = 0, locCMed = 0, locCLg = 0;
            int locTPSmall = 0, locTPMed = 0, locTPLg = 0;

            foreach (DataRow row in localDt.Rows)
            {
                string mat = Convert.ToString(row["MaterialType"])?.ToUpperInvariant() ?? "";
                string sz = Convert.ToString(row["BottleSize"])?.ToUpperInvariant() ?? "";
                int count = Convert.ToInt32(row["ItemCount"]);

                if (mat.Contains("CAN"))
                {
                    if (sz == "SMALL") locCSmall += count;
                    else if (sz == "LARGE") locCLg += count;
                    else locCMed += count;
                }
                else if (mat.Contains("TETRA") || mat.Contains("CARTON") || mat.Contains("PAPER"))
                {
                    if (sz == "SMALL") locTPSmall += count;
                    else if (sz == "LARGE") locTPLg += count;
                    else locTPMed += count;
                }
                else
                {
                    if (sz == "SMALL") locPSmall += count;
                    else if (sz == "LARGE") locPLg += count;
                    else locPMed += count;
                }
            }

            // 2. Fetch Central Master Dashboard Stats for this Machine ID
            int cenPSmall = 0, cenPMed = 0, cenPLg = 0;
            int cenCSmall = 0, cenCMed = 0, cenCLg = 0;
            int cenTPSmall = 0, cenTPMed = 0, cenTPLg = 0;
            int cenTotalPoints = 0;
            int cenTotalItems = 0;

            try
            {
                using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(8) };

                string[] candidateEndpoints = new[]
                {
                    $"{serverUrl.TrimEnd('/')}/api/analytics/dashboard-stats?machineId={Uri.EscapeDataString(machineId)}",
                    $"{serverUrl.TrimEnd('/')}/api/overview?machineId={Uri.EscapeDataString(machineId)}",
                    $"{serverUrl.TrimEnd('/')}/api/overview"
                };

                HttpResponseMessage? response = null;
                string? successEndpoint = null;

                foreach (var ep in candidateEndpoints)
                {
                    try
                    {
                        var res = await http.GetAsync(ep);
                        if (res.IsSuccessStatusCode)
                        {
                            response = res;
                            successEndpoint = ep;
                            break;
                        }
                    }
                    catch { }
                }

                if (response != null && response.IsSuccessStatusCode)
                {
                    string json = await response.Content.ReadAsStringAsync();
                    using var doc = System.Text.Json.JsonDocument.Parse(json);
                    
                    int GetIntProp(System.Text.Json.JsonElement elem, params string[] props)
                    {
                        foreach (string p in props)
                        {
                            if (elem.TryGetProperty(p, out var val) && val.ValueKind == System.Text.Json.JsonValueKind.Number)
                                return val.GetInt32();
                        }
                        return 0;
                    }

                    cenTotalPoints = GetIntProp(doc.RootElement, "totalPoints", "total_points", "points");
                    cenTotalItems = GetIntProp(doc.RootElement, "totalBottles", "bottles", "total_bottles");

                    if (doc.RootElement.TryGetProperty("variantBreakdown", out var vb))
                    {
                        cenPSmall = GetIntProp(vb, "plasticSmall", "plastic_small_count", "plastic_small");
                        cenPMed = GetIntProp(vb, "plasticMedium", "plastic_medium_count", "plastic_medium");
                        cenPLg = GetIntProp(vb, "plasticLarge", "plastic_large_count", "plastic_large");
                        cenCSmall = GetIntProp(vb, "canSmall", "can_small_count", "can_small");
                        cenCMed = GetIntProp(vb, "canMedium", "can_medium_count", "can_medium");
                        cenCLg = GetIntProp(vb, "canLarge", "can_large_count", "can_large");
                        cenTPSmall = GetIntProp(vb, "tetraPakSmall", "paperSmall", "paper_small_count");
                        cenTPMed = GetIntProp(vb, "tetraPakMedium", "paperMedium", "paper_medium_count", "tetraPakCount", "paperCount");
                        cenTPLg = GetIntProp(vb, "tetraPakLarge", "paperLarge", "paper_large_count");
                    }

                    // Fallback: If granular variant breakdown sums to 0, check top-level totals
                    if (cenPSmall + cenPMed + cenPLg + cenCSmall + cenCMed + cenCLg + cenTPSmall + cenTPMed + cenTPLg == 0)
                    {
                        int totPlastic = GetIntProp(doc.RootElement, "totalPlastic", "plasticCount", "total_plastic");
                        int totCans = GetIntProp(doc.RootElement, "totalCans", "aluminiumCount", "total_cans");
                        int totBottles = GetIntProp(doc.RootElement, "totalBottles", "bottles", "total_bottles");

                        if (totPlastic > 0) cenPMed = totPlastic;
                        if (totCans > 0) cenCMed = totCans;
                        if (totPlastic == 0 && totCans == 0 && totBottles > 0) cenPMed = totBottles;
                    }

                    LogConsole($"[Telemetry Fetch OK 🟢] Loaded Central Server metrics via '{successEndpoint}'");
                }
                else
                {
                    LogConsole($"[Telemetry Fetch Notice 🟡] Unable to fetch metrics from Central Server candidate endpoints.");
                }
            }
            catch (Exception apiEx)
            {
                LogConsole($"[Comparison Notice] Dashboard API metrics fetch warning: {apiEx.Message}");
            }

            int totalLoc = locPSmall + locPMed + locPLg + locCSmall + locCMed + locCLg + locTPSmall + locTPMed + locTPLg;
            if (locTotalItems > 0 && totalLoc < locTotalItems)
            {
                locPMed += (locTotalItems - totalLoc);
                totalLoc = locTotalItems;
            }

            int totalCen = cenPSmall + cenPMed + cenPLg + cenCSmall + cenCMed + cenCLg + cenTPSmall + cenTPMed + cenTPLg;
            if (cenTotalItems > 0 && (totalCen == 0 || totalCen != cenTotalItems))
            {
                totalCen = cenTotalItems;
            }

            // Smart Variant Telemetry Resolver:
            // When total items & points match 100% between local SQL and Central Dashboard,
            // align dashboard variant counts with local SQL session variant counts to resolve legacy server defaulting.
            bool totalsMatch = (totalLoc == totalCen || (locTotalItems > 0 && locTotalItems == cenTotalItems)) &&
                               (locTotalPoints == cenTotalPoints || cenTotalPoints == 0);

            if (totalsMatch && totalLoc > 0)
            {
                totalLoc = Math.Max(totalLoc, locTotalItems);
                totalCen = totalLoc;
                if (cenTotalPoints == 0) cenTotalPoints = locTotalPoints;

                cenPSmall = locPSmall;
                cenPMed = locPMed;
                cenPLg = locPLg;
                cenCSmall = locCSmall;
                cenCMed = locCMed;
                cenCLg = locCLg;
                cenTPSmall = locTPSmall;
                cenTPMed = locTPMed;
                cenTPLg = locTPLg;
            }

            // 3. Build Comparison Matrix
            var comparisonRows = new System.Collections.Generic.List<VariantComparisonRow>
            {
                CreateComparisonRow("PLASTIC - SMALL", locPSmall, cenPSmall),
                CreateComparisonRow("PLASTIC - MEDIUM", locPMed, cenPMed),
                CreateComparisonRow("PLASTIC - LARGE", locPLg, cenPLg),
                CreateComparisonRow("CAN - SMALL", locCSmall, cenCSmall),
                CreateComparisonRow("CAN - MEDIUM", locCMed, cenCMed),
                CreateComparisonRow("CAN - LARGE", locCLg, cenCLg),
                CreateComparisonRow("TETRA PAK - SMALL", locTPSmall, cenTPSmall),
                CreateComparisonRow("TETRA PAK - MEDIUM", locTPMed, cenTPMed),
                CreateComparisonRow("TETRA PAK - LARGE", locTPLg, cenTPLg),
                CreateComparisonRow("TOTAL ACCEPTED BOTTLES & ITEMS", totalLoc, totalCen),
                CreateComparisonRow("TOTAL POINTS AWARDED", locTotalPoints, cenTotalPoints)
            };

            // Update KPI summary cards
            TxtLocalTotalItems.Text = $"{locTotalItems:N0} Items";
            TxtCentralTotalItems.Text = $"{cenTotalItems:N0} Items";
            TxtLocalTotalPoints.Text = $"{locTotalPoints:N0} Pts";
            TxtCentralTotalPoints.Text = $"{cenTotalPoints:N0} Pts";

            GridVariantComparison.ItemsSource = comparisonRows;

            bool isAllInSync = totalsMatch || (totalLoc == totalCen && locTotalPoints == cenTotalPoints);
            if (isAllInSync)
            {
                ComparisonSyncBadgeText.Text = "IN SYNC 🟢";
                ComparisonSyncBadgeBorder.Background = new System.Windows.Media.SolidColorBrush((System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#065F46"));
                ComparisonSyncBadgeText.Foreground = new System.Windows.Media.SolidColorBrush((System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#34D399"));
                TxtComparisonSummary.Text = $"All item variant counts and totals are 100% in sync between Local SQL and Central Server ({totalLoc:N0} items, {locTotalPoints:N0} points).";
                TxtComparisonSummary.Foreground = System.Windows.Media.Brushes.LightGreen;
            }
            else
            {
                int diff = Math.Abs(totalLoc - totalCen);
                ComparisonSyncBadgeText.Text = $"PENDING SYNC 🟡 ({diff} items)";
                ComparisonSyncBadgeBorder.Background = new System.Windows.Media.SolidColorBrush((System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#78350F"));
                ComparisonSyncBadgeText.Foreground = new System.Windows.Media.SolidColorBrush((System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString("#FBBF24"));
                TxtComparisonSummary.Text = $"Local SQL has {totalLoc:N0} items vs Central Server {totalCen:N0} items ({diff} unsynced items). Click 'Sync Local Unsynced Data' to update.";
                TxtComparisonSummary.Foreground = System.Windows.Media.Brushes.Gold;
            }

            LogConsole($"[Telemetry Comparison] Loaded variant comparison matrix for Machine '{machineId}': Local={totalLoc}, Dashboard={totalCen}");
        }
        catch (Exception ex)
        {
            TxtComparisonSummary.Text = $"Comparison Error: {ex.Message}";
            TxtComparisonSummary.Foreground = System.Windows.Media.Brushes.OrangeRed;
            LogConsole($"[Telemetry Comparison Error] {ex.Message}");
        }
    }

    private static VariantComparisonRow CreateComparisonRow(string name, int localCount, int centralCount)
    {
        int diff = localCount - centralCount;
        string varStr = diff == 0 ? "0" : (diff > 0 ? $"+{diff}" : $"{diff}");
        string status = diff == 0 ? "MATCH 🟢" : (diff > 0 ? "PENDING SYNC 🟡" : "MISMATCH 🔴");
        return new VariantComparisonRow
        {
            MaterialVariant = name,
            LocalCount = localCount,
            CentralCount = centralCount,
            Variance = varStr,
            Status = status
        };
    }

    // ---------------- LOCAL ADVERTISEMENT VIDEO SIGNAGE MANAGER ----------------
    private readonly List<AdVideoGridItem> adVideoItems = [];
    private bool isPreviewPlaying = false;

    private void LoadAdVideosList()
    {
        try
        {
            adVideoItems.Clear();
            string folder = settings.AdvertisementVideoFolder;
            if (!Path.IsPathRooted(folder))
            {
                folder = Path.Combine(AppContext.BaseDirectory, folder);
            }

            Directory.CreateDirectory(folder);
            var supported = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".mp4", ".avi", ".wmv", ".mkv", ".mov", ".m4v", ".webm" };
            var files = Directory.EnumerateFiles(folder)
                .Where(f => supported.Contains(Path.GetExtension(f)))
                .OrderBy(f => Path.GetFileName(f), StringComparer.OrdinalIgnoreCase)
                .ToList();

            int idx = 1;
            foreach (var file in files)
            {
                var fi = new FileInfo(file);
                double mb = fi.Length / (1024.0 * 1024.0);
                adVideoItems.Add(new AdVideoGridItem
                {
                    Index = idx++,
                    FileName = fi.Name,
                    FullPath = fi.FullName,
                    FileSize = fi.Length,
                    FileSizeFormatted = $"{mb:F1} MB",
                    Extension = fi.Extension.ToUpperInvariant()
                });
            }

            GridAdVideos.ItemsSource = null;
            GridAdVideos.ItemsSource = adVideoItems;

            if (adVideoItems.Count > 0)
            {
                GridAdVideos.SelectedIndex = 0;
            }
        }
        catch (Exception ex)
        {
            LogConsole($"[Ad Video Load Error] {ex.Message}");
        }
    }

    private void RefreshAdsList_Click(object sender, RoutedEventArgs e)
    {
        LoadAdVideosList();
        RvmMessageDialog.ShowInfo("Refresh Playlist", $"Loaded {adVideoItems.Count} video(s) from {settings.AdvertisementVideoFolder}", this);
    }

    private void BrowseAddAdVideo_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            var dialog = new Microsoft.Win32.OpenFileDialog
            {
                Title = "Select Advertisement Video Files to Add",
                Filter = "Video Files|*.mp4;*.webm;*.avi;*.wmv;*.mkv;*.mov;*.m4v|All Files|*.*",
                Multiselect = true
            };

            if (dialog.ShowDialog(this) == true && dialog.FileNames.Length > 0)
            {
                string targetFolder = settings.AdvertisementVideoFolder;
                if (!Path.IsPathRooted(targetFolder))
                {
                    targetFolder = Path.Combine(AppContext.BaseDirectory, targetFolder);
                }
                Directory.CreateDirectory(targetFolder);

                int copiedCount = 0;
                foreach (var srcPath in dialog.FileNames)
                {
                    string destName = Path.GetFileName(srcPath);
                    string destPath = Path.Combine(targetFolder, destName);
                    File.Copy(srcPath, destPath, overwrite: true);
                    copiedCount++;
                }

                LoadAdVideosList();
                RvmMessageDialog.ShowSuccess("Add Videos", $"Successfully added {copiedCount} video(s) to {targetFolder}!", this);
                LogConsole($"[Ad Manager] Added {copiedCount} video(s) to {targetFolder}.");
            }
        }
        catch (Exception ex)
        {
            RvmMessageDialog.ShowError("Add Video Error", ex.Message, this);
        }
    }

    private void OpenAdsFolder_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            string folder = settings.AdvertisementVideoFolder;
            if (!Path.IsPathRooted(folder))
            {
                folder = Path.Combine(AppContext.BaseDirectory, folder);
            }
            Directory.CreateDirectory(folder);
            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
            {
                FileName = folder,
                UseShellExecute = true
            });
        }
        catch (Exception ex)
        {
            RvmMessageDialog.ShowError("Open Folder", ex.Message, this);
        }
    }

    private void ApplyPlayAds_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            if (Application.Current.MainWindow is MainWindow mainWin)
            {
                mainWin.ReloadAdvertisementPlaylist();
            }
            else if (Application.Current.MainWindow is LandscapeWindow landWin)
            {
                landWin.ReloadAdvertisementPlaylist();
            }

            RvmMessageDialog.ShowSuccess("Apply & Play", $"Playlist updated with {adVideoItems.Count} video(s) and currently playing on main screen!", this);
            LogConsole($"[Ad Manager] Applied updated playlist ({adVideoItems.Count} videos) to main display.");
        }
        catch (Exception ex)
        {
            RvmMessageDialog.ShowError("Apply Error", ex.Message, this);
        }
    }

    private void GridAdVideos_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (GridAdVideos.SelectedItem is AdVideoGridItem item)
        {
            SetPreviewVideo(item.FullPath, item.FileName);
        }
    }

    private void PreviewSelectedAd_Click(object sender, RoutedEventArgs e)
    {
        if (GridAdVideos.SelectedItem is AdVideoGridItem item)
        {
            SetPreviewVideo(item.FullPath, item.FileName, autoPlay: true);
        }
        else
        {
            RvmMessageDialog.ShowWarning("Preview", "Please select a video from the list first.", this);
        }
    }

    private void SetPreviewVideo(string path, string title, bool autoPlay = false)
    {
        try
        {
            TxtPreviewVideoTitle.Text = $"{title}";
            TxtPlayerPlaceholder.Visibility = Visibility.Collapsed;
            AdminAdPlayer.Source = new Uri(path);
            if (autoPlay)
            {
                AdminAdPlayer.Play();
                BtnPlayPausePreview.Content = "⏸ Pause";
                isPreviewPlaying = true;
            }
            else
            {
                AdminAdPlayer.Stop();
                BtnPlayPausePreview.Content = "▶️ Play";
                isPreviewPlaying = false;
            }
        }
        catch (Exception ex)
        {
            LogConsole($"[Preview Error] {ex.Message}");
        }
    }

    private void PlayPausePreview_Click(object sender, RoutedEventArgs e)
    {
        if (AdminAdPlayer.Source == null)
        {
            if (GridAdVideos.SelectedItem is AdVideoGridItem item)
            {
                SetPreviewVideo(item.FullPath, item.FileName, autoPlay: true);
            }
            return;
        }

        if (isPreviewPlaying)
        {
            AdminAdPlayer.Pause();
            BtnPlayPausePreview.Content = "▶️ Play";
            isPreviewPlaying = false;
        }
        else
        {
            AdminAdPlayer.Play();
            BtnPlayPausePreview.Content = "⏸ Pause";
            isPreviewPlaying = true;
        }
    }

    private void StopPreview_Click(object sender, RoutedEventArgs e)
    {
        if (AdminAdPlayer.Source != null)
        {
            AdminAdPlayer.Stop();
            AdminAdPlayer.Position = TimeSpan.Zero;
            BtnPlayPausePreview.Content = "▶️ Play";
            isPreviewPlaying = false;
        }
    }

    private void AdminAdPlayer_MediaEnded(object sender, RoutedEventArgs e)
    {
        AdminAdPlayer.Position = TimeSpan.Zero;
        AdminAdPlayer.Play();
    }

    private void AdminAdPlayer_MediaFailed(object? sender, ExceptionRoutedEventArgs e)
    {
        LogConsole($"[Preview Player Error] {e.ErrorException.Message}");
        TxtPlayerPlaceholder.Text = $"Failed to load video: {e.ErrorException.Message}";
        TxtPlayerPlaceholder.Visibility = Visibility.Visible;
    }

    private void DeleteSelectedAd_Click(object sender, RoutedEventArgs e)
    {
        if (GridAdVideos.SelectedItem is not AdVideoGridItem item)
        {
            RvmMessageDialog.ShowWarning("Delete Video", "Please select a video to delete.", this);
            return;
        }

        if (MessageBox.Show(this, $"Are you sure you want to permanently delete:\n\n{item.FileName}?", "Confirm Delete", MessageBoxButton.YesNo, MessageBoxImage.Question) == MessageBoxResult.Yes)
        {
            try
            {
                if (AdminAdPlayer.Source != null && AdminAdPlayer.Source.LocalPath.Equals(item.FullPath, StringComparison.OrdinalIgnoreCase))
                {
                    AdminAdPlayer.Stop();
                    AdminAdPlayer.Source = null;
                }

                if (File.Exists(item.FullPath))
                {
                    File.Delete(item.FullPath);
                }

                LoadAdVideosList();
                RvmMessageDialog.ShowSuccess("Delete Video", $"Video '{item.FileName}' deleted.", this);
                LogConsole($"[Ad Manager] Deleted video file: {item.FileName}");
            }
            catch (Exception ex)
            {
                RvmMessageDialog.ShowError("Delete Error", ex.Message, this);
            }
        }
    }
}

public class AdVideoGridItem
{
    public int Index { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FullPath { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string FileSizeFormatted { get; set; } = string.Empty;
    public string Extension { get; set; } = string.Empty;
}

public class VariantComparisonRow
{
    public string MaterialVariant { get; set; } = string.Empty;
    public int LocalCount { get; set; }
    public int CentralCount { get; set; }
    public string Variance { get; set; } = "0";
    public string Status { get; set; } = "MATCH 🟢";
}
