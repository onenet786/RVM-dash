using System;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.IO;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Threading;

namespace RVMDesktopApp;

public partial class MainWindow : Window
{
    private static readonly TimeSpan ScanTimeout = TimeSpan.FromSeconds(25);
    private static readonly HashSet<string> VideoExtensions = new(StringComparer.OrdinalIgnoreCase)
        { ".mp4", ".avi", ".wmv", ".mkv", ".mov", ".m4v" };

    private readonly AppSettings settings = AppSettings.Load();
    private readonly SerialManager serial = new();
    private readonly DispatcherTimer scanTimer = new();
    private Guid sessionId = Guid.NewGuid();

    private bool databaseAvailable;
    private bool machineStarted;
    private int totalItems;
    private int totalPoints;
    private int plasticSmallCount;
    private int plasticMediumCount;
    private int plasticLargeCount;
    private int canSmallCount;
    private int canMediumCount;
    private int canLargeCount;
    private int rejectedCount;
    private bool suppressNextCleanupError;
    private BottleResult? pendingBottleResult;
    private int pendingBottlePoints;

    private readonly ObservableCollection<string> telemetryLog = [];
    private readonly List<string> adPlaylist = [];
    private int adPlaylistIndex;

    public MainWindow()
    {
        InitializeComponent();

        Loaded += MainWindow_Loaded;
        Closed += MainWindow_Closed;
        serial.DataReceived += Serial_DataReceived;
        serial.ErrorReceived += Serial_ErrorReceived;
        AdvertisementPlayer.MediaFailed += AdvertisementPlayer_MediaFailed;

        scanTimer.Interval = ScanTimeout;
        scanTimer.Tick += ScanTimer_Tick;

        TelemetryList.ItemsSource = telemetryLog;
    }

    private DispatcherTimer? apiCheckTimer;

    private void MainWindow_Loaded(object sender, RoutedEventArgs e)
    {
        CentralSyncService.CentralApiUrl = settings.CentralApiUrl;
        UpdateRvmNameDisplay(settings.MachineId);

        HeartbeatService.StatusChanged += OnNetworkStatusChanged;
        HeartbeatService.Start(settings.MachineId, settings.CentralApiUrl);

        StartInstructionVideo();
        StartAdvertisement();
        CheckDatabase();
        ConnectArduino();
        _ = CheckCentralApiConnectionAsync();

        apiCheckTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(15) };
        apiCheckTimer.Tick += async (s, args) => await CheckCentralApiConnectionAsync();
        apiCheckTimer.Start();
    }

    private void OnNetworkStatusChanged(NetworkStatus status, string? error)
    {
        Dispatcher.InvokeAsync(() =>
        {
            switch (status)
            {
                case NetworkStatus.Online:
                    SetLiveBadgeOnline();
                    break;
                case NetworkStatus.Unauthorized:
                    SetLiveBadgeUnauthorized(error ?? "Machine not registered/authorized");
                    break;
                case NetworkStatus.Offline:
                case NetworkStatus.Checking:
                default:
                    SetLiveBadgeOffline(error ?? "NO NETWORK");
                    break;
            }
        });
    }

    private void SetLiveBadgeOnline()
    {
        if (ApiStatusText != null) ApiStatusText.Text = "API: ONLINE 🟢";
        if (ApiDot != null) ApiDot.Fill = Brushes.LightGreen;
        if (LiveBadgeText != null) LiveBadgeText.Text = "LIVE 🟢";
        if (LiveBadgeBorder != null)
        {
            LiveBadgeBorder.Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#DCFCE7"));
        }
        if (LiveBadgeText != null)
        {
            LiveBadgeText.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#15803D"));
        }
        if (HeaderDotText != null)
        {
            HeaderDotText.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#22C55E"));
        }
    }

    private void SetLiveBadgeUnauthorized(string reason)
    {
        if (ApiStatusText != null) ApiStatusText.Text = "API: UNAUTHORIZED 🔴";
        if (ApiDot != null) ApiDot.Fill = Brushes.OrangeRed;
        if (LiveBadgeText != null) LiveBadgeText.Text = "UNAUTHORIZED 🔴";
        if (LiveBadgeBorder != null)
        {
            LiveBadgeBorder.Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#FEF3C7"));
        }
        if (LiveBadgeText != null)
        {
            LiveBadgeText.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#D97706"));
        }
        if (HeaderDotText != null)
        {
            HeaderDotText.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#F59E0B"));
        }
        LogTelemetry($"[API] Central API authorization required: {reason}");
    }

    private void SetLiveBadgeOffline(string reason)
    {
        if (ApiStatusText != null) ApiStatusText.Text = "API: OFFLINE 🔴";
        if (ApiDot != null) ApiDot.Fill = Brushes.OrangeRed;
        if (LiveBadgeText != null) LiveBadgeText.Text = "NO NETWORK 🔴";
        if (LiveBadgeBorder != null)
        {
            LiveBadgeBorder.Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#FEE2E2"));
        }
        if (LiveBadgeText != null)
        {
            LiveBadgeText.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#B91C1C"));
        }
        if (HeaderDotText != null)
        {
            HeaderDotText.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#EF4444"));
        }
        LogTelemetry($"[API] Central API offline: {reason}");
    }

    private void MainWindow_Closed(object? sender, EventArgs e)
    {
        InstructionPlayer.Close();
        InstructionPlayer.Source = null;
        AdvertisementPlayer.Close();
        AdvertisementPlayer.Source = null;
        serial.Disconnect();
    }

    private void ScanTimer_Tick(object? sender, EventArgs e)
    {
        scanTimer.Stop();

        if (!machineStarted)
        {
            return;
        }

        StatusText.Text = "Scan Timeout";
        StatusText.Foreground = Brushes.OrangeRed;
        BottleInfoText.Text = "Remove bottle and try again";

        if (serial.IsConnected)
            serial.SendCommand("RESET");
    }

    private void Window_KeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.D8 || e.Key == Key.NumPad8)
        {
            ToggleTelemetry();
            e.Handled = true;
            return;
        }

        if (e.Key == Key.Escape)
        {
            if (TelemetryPanel.Visibility == Visibility.Visible)
            {
                ToggleTelemetry();
                e.Handled = true;
                return;
            }

            Close();
            return;
        }

        switch (e.Key)
        {
            case Key.Enter:
                CompleteSessionToWallet();
                e.Handled = true;
                break;

            case Key.D0:
            case Key.NumPad0:
                StartMachine();
                break;

            case Key.S:
                StopMachine();
                break;

            case Key.A:
                OpenAdmin();
                break;

            case Key.D9:
            case Key.NumPad9:
                BrowseVideo();
                break;
        }
    }

    private void ToggleTelemetry()
    {
        if (TelemetryPanel.Visibility == Visibility.Visible)
        {
            TelemetryPanel.Visibility = Visibility.Collapsed;
            AdPanel.SetValue(Grid.ColumnProperty, 0);
            BottomGrid.ColumnDefinitions[1].Width = new GridLength(0);
            BottomGrid.ColumnDefinitions[2].Width = new GridLength(0);
        }
        else
        {
            AdPanel.SetValue(Grid.ColumnProperty, 2);
            BottomGrid.ColumnDefinitions[0].Width = new GridLength(1, GridUnitType.Star);
            BottomGrid.ColumnDefinitions[1].Width = new GridLength(18);
            BottomGrid.ColumnDefinitions[2].Width = new GridLength(340);
            TelemetryPanel.Visibility = Visibility.Visible;
            TelemetryScroll.ScrollToEnd();
        }
    }

    private void StartButton_Click(object sender, RoutedEventArgs e) => StartMachine();

    private void StopButton_Click(object sender, RoutedEventArgs e) => StopMachine();

    private void AdminButton_Click(object sender, RoutedEventArgs e) => OpenAdmin();

    private void BrowseVideo()
    {
        var dialog = new Microsoft.Win32.OpenFileDialog
        {
            Title = "Select Advertisement Video",
            Filter = "Video Files|*.mp4;*.avi;*.wmv;*.mkv;*.mov;*.m4v|All Files|*.*",
            Multiselect = true
        };

        if (dialog.ShowDialog() is not true)
        {
            return;
        }

        adPlaylist.Clear();
        adPlaylist.AddRange(dialog.FileNames);

        adPlaylistIndex = 0;
        PlayAdVideo(adPlaylist[0]);
        LogTelemetry($"[AD] Loaded {adPlaylist.Count} video(s) from browse");
    }

    private void OpenAdmin()
    {
        new AdminWindow { Owner = this }.ShowDialog();
    }

    private void AdvertisementPlayer_MediaEnded(object sender, RoutedEventArgs e)
    {
        if (adPlaylist.Count > 1)
        {
            PlayNextAd();
        }
        else
        {
            AdvertisementPlayer.Position = TimeSpan.Zero;
            AdvertisementPlayer.Play();
        }
    }

    private void StartInstructionVideo()
    {
        try
        {
            string? path = FindVideoFiles(settings.InstructionVideoFolder).FirstOrDefault();
            if (path == null)
            {
                LogTelemetry($"[VIDEO] No instruction video found in: {settings.InstructionVideoFolder}");
                return;
            }

            InstructionPlayer.Source = new Uri(Path.GetFullPath(path));
            InstructionPlaceholder.Visibility = Visibility.Collapsed;
            InstructionPlayer.Visibility = Visibility.Visible;
            InstructionPlayer.Play();
            LogTelemetry($"[VIDEO] Instruction video loaded: {Path.GetFileName(path)}");
        }
        catch (Exception ex)
        {
            LogTelemetry($"[VIDEO Error] Could not load instruction video: {ex.Message}");
        }
    }

    private void InstructionPlayer_MediaEnded(object sender, RoutedEventArgs e)
    {
        InstructionPlayer.Position = TimeSpan.Zero;
        InstructionPlayer.Play();
    }

    private void AdvertisementPlayer_MediaFailed(object? sender, ExceptionRoutedEventArgs e)
    {
        Debug.WriteLine($"Media playback failed: {e.ErrorException}");
        BottleInfoText.Text = "Skipping unavailable advertisement";
        LogTelemetry($"[AD] Playback failed; skipping: {e.ErrorException.Message}");
        PlayNextAd();
    }

    private void StartAdvertisement()
    {
        adPlaylist.Clear();
        adPlaylist.AddRange(FindVideoFiles(settings.AdvertisementVideoFolder));
        if (adPlaylist.Count == 0)
        {
            AdvertisementPlayer.Visibility = Visibility.Collapsed;
            LogTelemetry($"[AD] No videos found in: {settings.AdvertisementVideoFolder}");
            return;
        }

        adPlaylistIndex = 0;
        PlayAdVideo(adPlaylist[0]);
        LogTelemetry($"[AD] Loaded {adPlaylist.Count} video(s) from {settings.AdvertisementVideoFolder}");
    }

    private void PlayAdVideo(string path)
    {
        try
        {
            AdvertisementPlayer.Visibility = Visibility.Visible;
            AdvertisementPlayer.Source = new Uri(Path.GetFullPath(path));
            AdvertisementPlayer.LoadedBehavior = System.Windows.Controls.MediaState.Manual;
            AdvertisementPlayer.UnloadedBehavior = System.Windows.Controls.MediaState.Stop;
            AdvertisementPlayer.Stretch = Stretch.Fill;
            AdvertisementPlayer.Play();
        }
        catch (Exception ex)
        {
            LogTelemetry($"[AD Error] Could not play ad video: {ex.Message}");
            PlayNextAd();
        }
    }

    private void PlayNextAd()
    {
        if (adPlaylist.Count == 0)
        {
            return;
        }

        adPlaylistIndex = (adPlaylistIndex + 1) % adPlaylist.Count;
        PlayAdVideo(adPlaylist[adPlaylistIndex]);
        LogTelemetry($"[AD] Now playing: {Path.GetFileName(adPlaylist[adPlaylistIndex])}");
    }

    private static string[] FindVideoFiles(string directory)
    {
        if (!Directory.Exists(directory))
        {
            return [];
        }

        return [.. Directory.EnumerateFiles(directory)
            .Where(path => VideoExtensions.Contains(Path.GetExtension(path)))
            .OrderBy(path => Path.GetFileName(path), StringComparer.OrdinalIgnoreCase)];
    }

    private void CheckDatabase()
    {
        RefreshDatabaseConnection();
    }

    private bool RefreshDatabaseConnection()
    {
        databaseAvailable = DatabaseManager.TryOpen(out string message);

        if (databaseAvailable)
        {
            DbStatusText.Text = "DB: ONLINE";
            DbDot.Fill = Brushes.LightGreen;
            LogTelemetry("[DB] Connected successfully");
            RefreshLeaderboard();
        }
        else
        {
            DbStatusText.Text = "DB: OFFLINE";
            DbDot.Fill = Brushes.OrangeRed;
            BottleInfoText.Text = message;
            LogTelemetry($"[DB] Connection failed: {message}");
        }

        return databaseAvailable;
    }

    private async System.Threading.Tasks.Task CheckCentralApiConnectionAsync()
    {
        string serverUrl = CentralSyncService.CentralApiUrl;
        if (ApiStatusText != null) ApiStatusText.Text = "API: CHECKING...";
        if (ApiDot != null) ApiDot.Fill = Brushes.Orange;

        try
        {
            using var client = new System.Net.Http.HttpClient { Timeout = TimeSpan.FromSeconds(5) };
            
            try
            {
                var heartbeatObj = new { machineId = settings.MachineId, status = "active", binFillPercentage = 0 };
                var heartbeatJson = System.Text.Json.JsonSerializer.Serialize(heartbeatObj);
                var content = new System.Net.Http.StringContent(heartbeatJson, System.Text.Encoding.UTF8, "application/json");
                await client.PostAsync($"{serverUrl}/api/machine/heartbeat", content);
            }
            catch (Exception ex)
            {
                LogTelemetry($"[Heartbeat Warning] {ex.Message}");
            }

            var response = await client.GetAsync($"{serverUrl}/api/machine/config/{settings.MachineId}");
            if (response.IsSuccessStatusCode)
            {
                if (ApiStatusText != null) ApiStatusText.Text = "API: ONLINE 🟢";
                if (ApiDot != null) ApiDot.Fill = Brushes.LightGreen;

                try
                {
                    string json = await response.Content.ReadAsStringAsync();
                    using var doc = System.Text.Json.JsonDocument.Parse(json);
                    if (doc.RootElement.TryGetProperty("name", out var nameProp) && !string.IsNullOrWhiteSpace(nameProp.GetString()))
                    {
                        string apiName = nameProp.GetString()!;
                        UpdateRvmNameDisplay(apiName);
                        LogTelemetry($"[API] Machine Name retrieved from Central Dashboard: {apiName}");
                    }
                }
                catch
                {
                    // Ignore JSON parse errors for fallback compatibility
                }

                SetLiveBadgeOnline();
                LogTelemetry("[API] Central Master Dashboard API connected (2-way sync ready)");
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.Forbidden)
            {
                SetLiveBadgeUnauthorized($"Machine '{settings.MachineId}' not registered/authorized on Central Dashboard");
            }
            else
            {
                SetLiveBadgeOffline($"HTTP {(int)response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            SetLiveBadgeOffline(ex.Message);
        }
    }

    private void UpdateRvmNameDisplay(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return;
        if (HeaderRvmNameText != null) HeaderRvmNameText.Text = name;
        if (AdHeaderRvmNameText != null) AdHeaderRvmNameText.Text = name;
        if (CommandCenterRvmNameText != null) CommandCenterRvmNameText.Text = name;
    }

    private void RefreshLeaderboard()
    {
        try
        {
            LeaderboardList.ItemsSource = DatabaseManager.GetLeaderboard().DefaultView;
        }
        catch (Exception ex)
        {
            LeaderboardList.ItemsSource = null;
            LogTelemetry($"[DB] Leaderboard unavailable: {ex.Message}");
        }
    }

    private void ConnectArduino()
    {
        try
        {
            serial.Connect(settings.ArduinoPort, settings.ArduinoBaud);
            ConnectionText.Text = $"HARDWARE: {settings.ArduinoPort}";
            ConnectionText.Foreground = Brushes.LightGreen;
            StatusDot.Fill = Brushes.LightGreen;
            StatusText.Text = "Calibrating...";
            StatusText.Foreground = Brushes.Gold;
            BottleInfoText.Text = "Keep pipe empty";
            MachineStateText.Text = "MACHINE: CALIBRATING";
            LogTelemetry($"[HARDWARE] Connected on {settings.ArduinoPort} at {settings.ArduinoBaud} baud");
            LogTelemetry("[CMD] CALIBRATE");
            serial.SendCommand("CALIBRATE");
        }
        catch (Exception ex)
        {
            ConnectionText.Text = "HARDWARE: OFFLINE";
            ConnectionText.Foreground = Brushes.OrangeRed;
            StatusDot.Fill = Brushes.OrangeRed;
            StatusText.Text = "Hardware Offline";
            StatusText.Foreground = Brushes.OrangeRed;
            BottleInfoText.Text = $"Check {settings.ArduinoPort} connection or update config.txt";
            MachineStateText.Text = "MACHINE: ERROR";
            LogTelemetry($"[HARDWARE] Connection failed: {ex.Message}");
        }
    }

    private void StartMachine()
    {
        if (!serial.IsConnected)
        {
            ConnectArduino();
        }

        if (!serial.IsConnected)
        {
            StatusText.Text = "Hardware not connected";
            StatusText.Foreground = Brushes.OrangeRed;
            MachineStateText.Text = "MACHINE: ERROR";
            return;
        }

        serial.SendCommand("START");
        machineStarted = true;
        scanTimer.Stop();
        StatusText.Text = "Machine Started";
        StatusText.Foreground = Brushes.LimeGreen;
        BottleInfoText.Text = "Insert a plastic bottle or metal can";
        MachineStateText.Text = "MACHINE: RUNNING";
        LogTelemetry("[CMD] START");
    }

    private void StopMachine()
    {
        if (serial.IsConnected)
        {
            serial.SendCommand("STOP");
        }

        machineStarted = false;
        scanTimer.Stop();
        StatusText.Text = "Machine Stopped";
        StatusText.Foreground = Brushes.OrangeRed;
        BottleInfoText.Text = "Press 0 to Start";
        MachineStateText.Text = "MACHINE: IDLE";
        LogTelemetry("[CMD] STOP");
    }

    private void Serial_DataReceived(string message)
    {
        Dispatcher.InvokeAsync(() =>
        {
            if (IsLoaded)
            {
                ProcessArduinoMessage(message);
            }
        });
    }

    private void Serial_ErrorReceived(Exception error)
    {
        Dispatcher.InvokeAsync(() =>
        {
            if (!IsLoaded)
            {
                return;
            }

            ConnectionText.Text = "HARDWARE: ERROR";
            ConnectionText.Foreground = Brushes.OrangeRed;
            StatusDot.Fill = Brushes.OrangeRed;
            StatusText.Text = "Hardware connection error";
            StatusText.Foreground = Brushes.OrangeRed;
            BottleInfoText.Text = "Reconnect the hardware and press 0 to start";
            LogTelemetry($"[HARDWARE] Serial error: {error.Message}");
        });
    }

    private void ProcessArduinoMessage(string message)
    {
        LogTelemetry($"[RX] {message}");

        if (message == "READY" || message == "STATUS:ONLINE")
        {
            ConnectionText.Text = $"HARDWARE: {settings.ArduinoPort}";
            ConnectionText.Foreground = Brushes.LightGreen;
            StatusDot.Fill = Brushes.LightGreen;
            return;
        }

        if (message == "CALIBRATION:START")
        {
            StatusText.Text = "Calibrating...";
            StatusText.Foreground = Brushes.Gold;
            BottleInfoText.Text = "Keep pipe empty";
            MachineStateText.Text = "MACHINE: CALIBRATING";
            return;
        }

        if (message == "CALIBRATION:CLEARING_CHAMBER")
        {
            StatusText.Text = "Clearing chamber...";
            StatusText.Foreground = Brushes.Gold;
            BottleInfoText.Text = "Object detected within 12 cm; opening drop gate";
            MachineStateText.Text = "MACHINE: CLEARING";
            return;
        }

        if (message == "CALIBRATION:RETRY")
        {
            StatusText.Text = "Recalibrating...";
            StatusText.Foreground = Brushes.Gold;
            BottleInfoText.Text = "Checking empty chamber again";
            MachineStateText.Text = "MACHINE: CALIBRATING";
            return;
        }

        if (message.StartsWith("CALIBRATED:EMPTY_DISTANCE_CM:", StringComparison.OrdinalIgnoreCase))
        {
            string value = message["CALIBRATED:EMPTY_DISTANCE_CM:".Length..].Trim();
            StatusText.Text = "Ready";
            StatusText.Foreground = Brushes.LimeGreen;
            BottleInfoText.Text = $"Empty pipe distance: {value} cm";
            MachineStateText.Text = "MACHINE: READY";
            return;
        }

        if (message == "MACHINE:STARTED")
        {
            machineStarted = true;
            StatusText.Text = "Machine Started";
            StatusText.Foreground = Brushes.LimeGreen;
            MachineStateText.Text = "MACHINE: RUNNING";
            return;
        }

        if (message == "MACHINE:STOPPED")
        {
            machineStarted = false;
            StatusText.Text = "Machine Stopped";
            StatusText.Foreground = Brushes.OrangeRed;
            MachineStateText.Text = "MACHINE: IDLE";
            return;
        }

        if (message == "BIN:FULL")
        {
            machineStarted = false;
            scanTimer.Stop();
            StatusText.Text = "Bin Full";
            StatusText.Foreground = Brushes.OrangeRed;
            BottleInfoText.Text = "kindly empty the bin";
            MachineStateText.Text = "MACHINE: STOPPED";
            LogTelemetry("[SAFETY] Bin is full; machine stopped");
            return;
        }

        if (message == "IR:DETECTED")
        {
            StatusText.Text = "Scanning...";
            StatusText.Foreground = Brushes.Gold;
            BottleInfoText.Text = "Bottle detected";
            scanTimer.Stop();
            scanTimer.Start();
            return;
        }

        if (message == "IR:DETECTED_TRIGGER")
        {
            StatusText.Text = "Item held for scan";
            StatusText.Foreground = Brushes.Gold;
            BottleInfoText.Text = "Measuring item";
            scanTimer.Stop();
            scanTimer.Start();
            return;
        }

        if (message.StartsWith("BOTTLE_LENGTH_CM:", StringComparison.OrdinalIgnoreCase))
        {
            string value = message["BOTTLE_LENGTH_CM:".Length..].Trim();
            BottleInfoText.Text = $"Bottle length: {value} cm";
            return;
        }

        if (message.StartsWith("BOTTLE_LENGTH_MS:", StringComparison.OrdinalIgnoreCase))
        {
            string value = message["BOTTLE_LENGTH_MS:".Length..].Trim();
            BottleInfoText.Text = $"Bottle scan time: {value} ms";
            return;
        }

        if (message.StartsWith("SIZE:", StringComparison.OrdinalIgnoreCase))
        {
            ProcessBottleResult(message);
            return;
        }

        if (message == "BOTTLE:CLEARED")
        {
            CommitPendingBottle();
            return;
        }

        if (message == "BOTTLE:REMOVED")
        {
            StatusText.Text = "Ready";
            StatusText.Foreground = Brushes.LimeGreen;
            BottleInfoText.Text = "Insert the next item";
            MachineStateText.Text = "MACHINE: RUNNING";
            LogTelemetry("[SAFETY] Blockage cleared; scanner re-enabled");
            return;
        }

        if (message.StartsWith("ERROR:", StringComparison.OrdinalIgnoreCase))
        {
            scanTimer.Stop();
            ProcessArduinoError(message);
        }
    }

    private void ProcessArduinoError(string message)
    {
        if (message == "ERROR:CLEAR_TIMEOUT")
        {
            pendingBottleResult = null;
            pendingBottlePoints = 0;
            StatusText.Text = "Bottle stuck";
            StatusText.Foreground = Brushes.OrangeRed;
            BottleInfoText.Text = "Remove the bottle before inserting another item";
            MachineStateText.Text = "MACHINE: BLOCKED";
            LogTelemetry("[SAFETY] Drop not confirmed; points cancelled");
            return;
        }

        if (suppressNextCleanupError)
        {
            suppressNextCleanupError = false;
            LogTelemetry($"[IGNORE-ERROR] {message}");
            return;
        }

        if (message == "ERROR:NO_BOTTLE_CHANGE")
        {
            StatusText.Text = "Ready";
            StatusText.Foreground = Brushes.LimeGreen;
            BottleInfoText.Text = "Insert bottle fully into pipe";
            return;
        }

        rejectedCount++;
        RejectedCountText.Text = rejectedCount.ToString();

        StatusText.Text = "Rejected";
        StatusText.Foreground = Brushes.OrangeRed;

        BottleInfoText.Text = message switch
        {
            "ERROR:NO_DISTANCE" => "Could not measure bottle length",
            "ERROR:SCAN_TIMEOUT" => "Scan timed out. Remove bottle and try again",
            "ERROR:CALIBRATION_FAILED" => "Calibration failed. Keep pipe empty and restart",
            "ERROR:NOT_CALIBRATED" => "Hardware not calibrated",
            _ => "Hardware scan error"
        };
    }

    private void ProcessBottleResult(string message)
    {
        BottleResult result = ParseBottleResult(message);

        if (!machineStarted)
        {
            return;
        }

        scanTimer.Stop();
        bool accepted = result.Size != "UNKNOWN" && result.Material != "REJECT";

        if (!accepted)
        {
            rejectedCount++;
            RejectedCountText.Text = rejectedCount.ToString();

            StatusText.Text = "Rejected";
            StatusText.Foreground = Brushes.OrangeRed;
            BottleInfoText.Text = "Invalid item";

            LogTelemetry($"[REJECT] Size={result.Size} Material={result.Material}");
            SaveTransaction(result, 0, false);
            return;
        }

        pendingBottlePoints = GetPoints(result);
        pendingBottleResult = result;
        StatusText.Text = "Confirming drop...";
        StatusText.Foreground = Brushes.Gold;
        BottleInfoText.Text = $"{result.Size} {result.Material.ToLowerInvariant()} detected";
        LogTelemetry($"[PENDING] Size={result.Size} Material={result.Material} Points={pendingBottlePoints}");
    }

    private void CommitPendingBottle()
    {
        if (!machineStarted || pendingBottleResult is null)
        {
            LogTelemetry("[DROP] Clear confirmation received without a pending item");
            return;
        }

        BottleResult result = pendingBottleResult;
        int points = pendingBottlePoints;
        pendingBottleResult = null;
        pendingBottlePoints = 0;
        totalItems++;
        totalPoints += points;

        IncrementMaterialSizeCounter(result.Material, result.Size);

        suppressNextCleanupError = true;

        StatusText.Text = "Accepted";
        StatusText.Foreground = Brushes.LimeGreen;
        string itemDescription = result.Material.ToLowerInvariant();
        BottleInfoText.Text = result.DurationMs > 0
            ? $"{result.Size} {itemDescription} - {points} points | Length: {result.DurationMs} ms"
            : $"{result.Size} {itemDescription} - {points} points";
        TotalItemsText.Text = totalItems.ToString();
        TotalPointsText.Text = totalPoints.ToString();

        LogTelemetry($"[ACCEPT] Size={result.Size} Material={result.Material} Points={points} Total={totalPoints}");
        SaveTransaction(result, points, true);
        AcceptedItemVideoWindow.ShowFor(this, result.Material);
    }

    private int GetPoints(BottleResult result)
    {
        if (databaseAvailable)
        {
            try
            {
                return DatabaseManager.GetPoints(result.Size, result.Material);
            }
            catch
            {
                databaseAvailable = false;
            }
        }

        // Fallback values must match the defaults in Database.sql.
        return result.Size switch
        {
            "SMALL" => 5,
            "MEDIUM" => 10,
            "LARGE" => 15,
            _ => 0
        };
    }

    private void CompleteSessionToWallet()
    {
        if (!machineStarted)
        {
            StatusText.Text = "Start recycling first";
            StatusText.Foreground = Brushes.OrangeRed;
            return;
        }

        if (totalItems == 0)
        {
            StatusText.Text = "No items to credit";
            StatusText.Foreground = Brushes.OrangeRed;
            BottleInfoText.Text = "Insert an item before using your wallet";
            return;
        }

        // A previous transient query failure may have marked the cached state as
        // offline. Recheck now instead of permanently blocking the wallet dialog.
        if (!databaseAvailable && !RefreshDatabaseConnection())
        {
            StatusText.Text = "Wallet unavailable";
            StatusText.Foreground = Brushes.OrangeRed;
            BottleInfoText.Text = "Connect the database before crediting a wallet";
            return;
        }

        var walletWindow = new WalletPhoneWindow(totalItems, totalPoints) { Owner = this };
        if (walletWindow.ShowDialog() is not true)
        {
            return;
        }

        string phoneNumber = walletWindow.PhoneNumber;
        try
        {
            DatabaseManager.CreditWallet(phoneNumber, totalPoints, sessionId);
            RefreshLeaderboard();

            LogTelemetry($"[WALLET] Credited {totalPoints} point(s) to {phoneNumber}");
            StopMachine();
            StatusText.Text = "Wallet credited";
            StatusText.Foreground = Brushes.LimeGreen;
            BottleInfoText.Text = $"{totalPoints} points sent to wallet {phoneNumber}";
            ResetSession();
        }
        catch (Exception ex)
        {
            databaseAvailable = false;
            DbStatusText.Text = "DB: OFFLINE";
            DbDot.Fill = Brushes.OrangeRed;
            StatusText.Text = "Wallet credit failed";
            StatusText.Foreground = Brushes.OrangeRed;
            BottleInfoText.Text = $"Wallet was not credited: {ex.Message}";
            LogTelemetry($"[WALLET] Credit failed: {ex.Message}");
        }
    }

    private void ResetSession()
    {
        sessionId = Guid.NewGuid();
        totalItems = totalPoints = plasticSmallCount = plasticMediumCount = plasticLargeCount =
            canSmallCount = canMediumCount = canLargeCount = rejectedCount = 0;
        TotalItemsText.Text = PlasticSmallCountText.Text = PlasticMediumCountText.Text = PlasticLargeCountText.Text =
            CanSmallCountText.Text = CanMediumCountText.Text = CanLargeCountText.Text = RejectedCountText.Text = "0";
        TotalPointsText.Text = "0";
    }

    private void IncrementMaterialSizeCounter(string material, string size)
    {
        if (material.Equals("PLASTIC", StringComparison.OrdinalIgnoreCase))
        {
            if (size == "SMALL") PlasticSmallCountText.Text = (++plasticSmallCount).ToString();
            else if (size == "MEDIUM") PlasticMediumCountText.Text = (++plasticMediumCount).ToString();
            else if (size == "LARGE") PlasticLargeCountText.Text = (++plasticLargeCount).ToString();
        }
        else if (material.Equals("CAN", StringComparison.OrdinalIgnoreCase))
        {
            if (size == "SMALL") CanSmallCountText.Text = (++canSmallCount).ToString();
            else if (size == "MEDIUM") CanMediumCountText.Text = (++canMediumCount).ToString();
            else if (size == "LARGE") CanLargeCountText.Text = (++canLargeCount).ToString();
        }
    }

    private void SaveTransaction(BottleResult result, int points, bool accepted)
    {
        if (!databaseAvailable)
        {
            return;
        }

        try
        {
            DatabaseManager.SaveTransaction(
                sessionId, result.Size, result.Material, points, accepted);
        }
        catch
        {
            databaseAvailable = false;
            DbStatusText.Text = "DB: OFFLINE";
            DbDot.Fill = Brushes.OrangeRed;
            LogTelemetry("[DB] Went offline during save");
        }
    }

    private void LogTelemetry(string line)
    {
        string entry = $"{DateTime.Now:HH:mm:ss} {line}";
        telemetryLog.Add(entry);

        if (telemetryLog.Count > 200)
        {
            telemetryLog.RemoveAt(0);
        }

        TelemetryScroll.ScrollToEnd();
    }

    private static BottleResult ParseBottleResult(string message)
    {
        var result = new BottleResult();
        string[] parts = message.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (string part in parts)
        {
            string[] pair = part.Split(':', 2, StringSplitOptions.TrimEntries);

            if (pair.Length != 2)
            {
                continue;
            }

            switch (pair[0].ToUpperInvariant())
            {
                case "SIZE":
                    result.Size = pair[1].ToUpperInvariant();
                    break;

                case "METAL":
                    result.Material = pair[1] == "1" ? "CAN" : "PLASTIC";
                    break;

                case "DISTANCE":
                    if (int.TryParse(pair[1], out int distance))
                    {
                        result.Distance = distance;
                    }
                    break;

                case "DURATION":
                    if (int.TryParse(pair[1], out int duration))
                    {
                        result.DurationMs = duration;
                    }
                    break;

                case "CHANGE":
                    if (int.TryParse(pair[1], out int change))
                    {
                        result.ChangeCm = change;
                    }
                    break;

                case "EMPTY":
                    if (int.TryParse(pair[1], out int emptyDistance))
                    {
                        result.EmptyDistanceCm = emptyDistance;
                    }
                    break;
            }
        }

        return result;
    }
}
