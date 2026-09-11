using System;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.IO;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Threading;

namespace RVMDesktopApp;

public partial class MainWindow : Window, IKioskSimulatorTarget
{
    public Window AsWindow => this;
    public bool IsMachineStarted => machineStarted;
    public bool IsDemoMode { get; set; } = false;
    public int TotalItems => totalItems;
    public int TotalPoints => totalPoints;
    public int RejectedCount => rejectedCount;
    public string MachineStatus => StatusText?.Text ?? "Ready";
    public event Action? SimulatorStateChanged;

    public void FocusKiosk()
    {
        Activate();
        Focus();
    }

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
    private int tetraPakSmallCount;
    private int tetraPakMediumCount;
    private int tetraPakLargeCount;
    private int rejectedCount;
    private bool suppressNextCleanupError;
    private BottleResult? pendingBottleResult;
    private int pendingBottlePoints;
    private string? activeUserMobile;

    private readonly ObservableCollection<string> telemetryLog = [];
    private readonly List<string> adPlaylist = [];
    private int adPlaylistIndex;
    private string? currentPlayingAdPath;

    // -------------------------------------------------------------
    // DYNAMIC TOUCHLESS QR KIOSK START HANDSHAKE
    // -------------------------------------------------------------
    private readonly DispatcherTimer _startHandshakeTimer = new();
    private string? _currentStartToken;
    private DateTime _startTokenExpiresAt = DateTime.MinValue;
    private bool _isRegisteringHandshake = false;
    private readonly DispatcherTimer _inactivityCountdownTimer = new();
    private int _inactivitySecondsRemaining = 0;

    // -------------------------------------------------------------
    // IDLE MODE EXPANSION (1-MINUTE TIMEOUT & ZOOM TRANSITION)
    // -------------------------------------------------------------
    private readonly DispatcherTimer _idleTimer = new();
    private DateTime _lastInteractionTime = DateTime.Now;
    private Point _lastMousePosition;
    private bool _isIdleExpandedMode = false;
    private const double DefaultInstructionHeight = 490.0;
    private const double DefaultHowToUseHeight = 185.0;

    // -------------------------------------------------------------
    // DYNAMIC INSTRUCTION DISPLAY STATES
    // -------------------------------------------------------------
    public enum InstructionDisplayState
    {
        DefaultIdleVideo,
        PleaseInsert,
        DetectingAndSizing,
        Accepted,
        Rejected
    }

    private InstructionDisplayState _currentInstructionState = InstructionDisplayState.DefaultIdleVideo;
    private readonly DispatcherTimer _detectingLaserTimer = new();
    private readonly DispatcherTimer _revertToInsertTimer = new();
    private double _laserPos = 20.0;
    private bool _laserDown = true;
    private string? _defaultInstructionVideoPath;

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

        clockTimer.Interval = TimeSpan.FromSeconds(1);
        clockTimer.Tick += (s, args) => UpdateClockDisplay();

        _idleTimer.Interval = TimeSpan.FromSeconds(1);
        _idleTimer.Tick += IdleTimer_Tick;
        _idleTimer.Start();

        _detectingLaserTimer.Interval = TimeSpan.FromMilliseconds(30);
        _detectingLaserTimer.Tick += DetectingLaserTimer_Tick;

        _revertToInsertTimer.Interval = TimeSpan.FromSeconds(4.5);
        _revertToInsertTimer.Tick += (s, args) =>
        {
            _revertToInsertTimer.Stop();
            if (machineStarted)
            {
                ShowPleaseInsertState();
            }
            else
            {
                ShowDefaultInstructionVideoState();
            }
        };

        TelemetryList.ItemsSource = telemetryLog;
    }

    private readonly DispatcherTimer clockTimer = new();
    private DispatcherTimer? apiCheckTimer;

    private void MainWindow_Loaded(object sender, RoutedEventArgs e)
    {
        UpdateClockDisplay();
        clockTimer.Start();
        UpdateImpactMetrics();

        CentralSyncService.CentralApiUrl = settings.CentralApiUrl;
        UpdateRvmNameDisplay(settings.MachineId);

        HeartbeatService.StatusChanged += OnNetworkStatusChanged;
        HeartbeatService.Start(settings.MachineId, settings.CentralApiUrl, settings.Location, settings.Latitude, settings.Longitude);

        StartInstructionVideo();
        StartAdvertisement();
        CheckDatabase();
        ConnectArduino();
        _ = CheckCentralApiConnectionAsync();

        apiCheckTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(15) };
        apiCheckTimer.Tick += async (s, args) => await CheckCentralApiConnectionAsync();
        apiCheckTimer.Start();

        _startHandshakeTimer.Interval = TimeSpan.FromMilliseconds(1500);
        _startHandshakeTimer.Tick += StartHandshakeTimer_Tick;
        _startHandshakeTimer.Start();
        _inactivityCountdownTimer.Interval = TimeSpan.FromSeconds(1);
        _inactivityCountdownTimer.Tick += InactivityCountdownTimer_Tick;
        _ = RegisterStartHandshakeAsync();
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

    public void DisconnectHardwareOnExit()
    {
        try
        {
            InstructionPlayer?.Close();
            AdvertisementPlayer?.Close();
            serial?.Disconnect();
        }
        catch { }
    }

    private void MainWindow_Closed(object? sender, EventArgs e)
    {
        _startHandshakeTimer.Stop();
        DisconnectHardwareOnExit();
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

    private int digit1PressCount = 0;
    private DateTime lastDigit1PressTime = DateTime.MinValue;
    private int digit8PressCount = 0;
    private DateTime lastDigit8PressTime = DateTime.MinValue;
    private DateTime lastDigit3PressTime = DateTime.MinValue;
    private string _demoSecretSequence = "";
    private DateTime _lastDemoSecretTime = DateTime.MinValue;

    private void Window_KeyDown(object sender, KeyEventArgs e)
    {
        RegisterUserActivity();

        // Testing Hotkey: Ctrl+I triggers idle expanded mode immediately
        if (e.Key == Key.I && (Keyboard.Modifiers & ModifierKeys.Control) == ModifierKeys.Control)
        {
            if (_isIdleExpandedMode)
            {
                ExitIdleExpandedMode();
            }
            else
            {
                EnterIdleExpandedMode();
            }
            e.Handled = true;
            return;
        }

        // Secret code 1122 to open Demo Testing simulator
        char digit = e.Key switch
        {
            Key.D0 or Key.NumPad0 => '0',
            Key.D1 or Key.NumPad1 => '1',
            Key.D2 or Key.NumPad2 => '2',
            Key.D3 or Key.NumPad3 => '3',
            Key.D4 or Key.NumPad4 => '4',
            Key.D5 or Key.NumPad5 => '5',
            Key.D6 or Key.NumPad6 => '6',
            Key.D7 or Key.NumPad7 => '7',
            Key.D8 or Key.NumPad8 => '8',
            Key.D9 or Key.NumPad9 => '9',
            _ => '\0'
        };

        if (digit != '\0')
        {
            DateTime nowSeq = DateTime.Now;
            if ((nowSeq - _lastDemoSecretTime).TotalMilliseconds > 4000)
            {
                _demoSecretSequence = "";
            }
            _lastDemoSecretTime = nowSeq;
            _demoSecretSequence += digit;
            if (_demoSecretSequence.Length > 8)
            {
                _demoSecretSequence = _demoSecretSequence[^8..];
            }

            if (_demoSecretSequence.EndsWith("001"))
            {
                _demoSecretSequence = "";
                digit1PressCount = 0;
                LogTelemetry("[DEMO HOTKEY] Demo Mode activated via sequence '001'");
                if (_isIdleExpandedMode)
                {
                    ExitIdleExpandedMode();
                }
                DemoTestingWindow.CloseIfOpen();
                IsDemoMode = true;
                StartMachine(forceSimulator: true);
                e.Handled = true;
                return;
            }

            if (_demoSecretSequence.EndsWith("1122"))
            {
                _demoSecretSequence = "";
                digit1PressCount = 0;
                LogTelemetry("[HOTKEY] Demo testing simulator opened via secret code 1122");
                if (_isIdleExpandedMode)
                {
                    ExitIdleExpandedMode();
                }
                IsDemoMode = true;
                StartMachine(forceSimulator: true);
                DemoTestingWindow.OpenOrBringToFront(this);
                e.Handled = true;
                return;
            }
        }
        if (e.Key == Key.D1 || e.Key == Key.NumPad1)
        {
            DateTime now = DateTime.Now;
            if ((now - lastDigit1PressTime).TotalMilliseconds <= 1500)
            {
                digit1PressCount++;
            }
            else
            {
                digit1PressCount = 1;
            }

            lastDigit1PressTime = now;

            if (digit1PressCount >= 3)
            {
                digit1PressCount = 0;
                lastDigit1PressTime = DateTime.MinValue;
                LogTelemetry("[HOTKEY] Admin panel login opened via hotkey 111");
                OpenAdmin();
                e.Handled = true;
                return;
            }
        }
        else
        {
            digit1PressCount = 0;
        }

        if (e.Key == Key.D8 || e.Key == Key.NumPad8)
        {
            DateTime now = DateTime.Now;
            if ((now - lastDigit8PressTime).TotalMilliseconds <= 1500)
            {
                digit8PressCount++;
            }
            else
            {
                digit8PressCount = 1;
            }

            lastDigit8PressTime = now;

            if (digit8PressCount >= 3)
            {
                digit8PressCount = 0;
                lastDigit8PressTime = DateTime.MinValue;
                LogTelemetry("[HOTKEY] Telemetry toggled via hotkey 888");
                ToggleTelemetry();
                e.Handled = true;
                return;
            }
        }
        else
        {
            digit8PressCount = 0;
        }

        if (e.Key == Key.D3 || e.Key == Key.NumPad3)
        {
            DateTime now = DateTime.Now;
            if ((now - lastDigit3PressTime).TotalMilliseconds <= 1500)
            {
                lastDigit3PressTime = DateTime.MinValue;
                ManualClearChamber();
                e.Handled = true;
                return;
            }

            lastDigit3PressTime = now;
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
                if (_isIdleExpandedMode)
                {
                    ExitIdleExpandedMode();
                }
                // Key 0 is strictly for hardware usage when connected
                if (serial.IsConnected)
                {
                    StartMachine();
                }
                else
                {
                    LogTelemetry("[HARDWARE] Key 0 is reserved for physical hardware. Hardware is not connected. Type '001' to start Demo Testing.");
                }
                e.Handled = true;
                break;

            case Key.B:
                SimulateItemDeposit("PLASTIC", "MEDIUM", accept: true);
                e.Handled = true;
                break;

            case Key.C:
                SimulateItemDeposit("CAN", "MEDIUM", accept: true);
                e.Handled = true;
                break;

            case Key.U:
                SimulateItemDeposit("UBC", "MEDIUM", accept: true);
                e.Handled = true;
                break;

            case Key.R:
                SimulateItemDeposit("PLASTIC", "UNKNOWN", accept: false);
                e.Handled = true;
                break;

            case Key.S:
                StopMachine();
                break;

            case Key.A:
                OpenAdmin();
                break;

            // Hotkey 9 disabled: do not open video file dialog on pressing key 9
        }
    }

    private void ManualClearChamber()
    {
        StatusText.Text = "Clearing Chamber...";
        StatusText.Foreground = Brushes.Gold;
        BottleInfoText.Text = "Manual gate release command (33) sent";
        LogTelemetry("[COMMAND] Manual Chamber Clearing requested (Key 33 pressed)");

        if (serial.IsConnected)
        {
            serial.SendCommand("CLEAR_CHAMBER");
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

    private void UpdateClockDisplay()
    {
        var now = DateTime.Now;
        if (LiveDateText != null) LiveDateText.Text = now.ToString("dd MMM yyyy");
        if (LiveTimeText != null) LiveTimeText.Text = now.ToString("hh:mm tt");
    }

    private void UpdateImpactMetrics()
    {
        if (Co2SavedText != null) Co2SavedText.Text = (totalItems * 0.15).ToString("0.00");
        if (WaterSavedText != null) WaterSavedText.Text = (totalItems * 0.75).ToString("0.00");
    }

    public void RegisterUserActivity()
    {
        _lastInteractionTime = DateTime.Now;
        if (_isIdleExpandedMode)
        {
            ExitIdleExpandedMode();
        }
    }

    private void Window_UserActivity(object sender, RoutedEventArgs e) => RegisterUserActivity();

    private void Window_MouseMoveActivity(object sender, MouseEventArgs e)
    {
        Point current = e.GetPosition(this);
        if (Math.Abs(current.X - _lastMousePosition.X) > 20 || Math.Abs(current.Y - _lastMousePosition.Y) > 20)
        {
            _lastMousePosition = current;
            RegisterUserActivity();
        }
    }

    private void IdleTimer_Tick(object? sender, EventArgs e)
    {
        if (machineStarted)
        {
            _lastInteractionTime = DateTime.Now;
            return;
        }

        if (!_isIdleExpandedMode && (DateTime.Now - _lastInteractionTime) >= TimeSpan.FromMinutes(1))
        {
            EnterIdleExpandedMode();
        }
    }

    public void EnterIdleExpandedMode()
    {
        if (_isIdleExpandedMode || machineStarted) return;
        _isIdleExpandedMode = true;

        LogTelemetry("[IDLE] Kiosk idle for > 1 min. Expanding instructional video to 50% height. Keeping 'How to Use RVM' and Ad Video section visible. Hiding header, status bar, and lower breakdown.");

        double windowHeight = ActualHeight > 0 ? ActualHeight : 1920;
        double targetInstructionHeight = windowHeight * 0.50; // 50% of whole height (e.g. 960px)

        var easeInOut = new QuarticEase { EasingMode = EasingMode.EaseInOut };

        // 1. Zoom in styling on instructional video container (expands to 50% of screen height)
        var heightAnim = new DoubleAnimation
        {
            To = targetInstructionHeight,
            Duration = TimeSpan.FromMilliseconds(750),
            EasingFunction = easeInOut
        };
        InstructionContainer.BeginAnimation(HeightProperty, heightAnim);

        var zoomAnim = new DoubleAnimation
        {
            To = 1.025,
            Duration = TimeSpan.FromMilliseconds(750),
            EasingFunction = easeInOut
        };
        InstructionContainerScale.BeginAnimation(ScaleTransform.ScaleXProperty, zoomAnim);
        InstructionContainerScale.BeginAnimation(ScaleTransform.ScaleYProperty, zoomAnim);

        if (InstructionPlayer.Visibility != Visibility.Visible && InstructionPlayer.Source != null)
        {
            InstructionPlayer.Visibility = Visibility.Visible;
            InstructionPlaceholder.Visibility = Visibility.Collapsed;
        }
        InstructionPlayer?.Play();

        // 2. Collapse hidden elements cleanly so there is zero overlap or layout collision
        TopHeaderGrid.Visibility = Visibility.Collapsed;
        if (HeaderRowDef != null) HeaderRowDef.Height = new GridLength(0);

        HardwareStatusBar.Visibility = Visibility.Collapsed;
        if (HardwareStatusRowDef != null) HardwareStatusRowDef.Height = new GridLength(0);

        LowerDashboardGrid.Visibility = Visibility.Collapsed;
        if (LowerDashboardRow != null) LowerDashboardRow.Height = new GridLength(0);
        if (HowToUseSpacerRow2 != null) HowToUseSpacerRow2.Height = new GridLength(0);

        if (MainContentRowDef != null) MainContentRowDef.Height = GridLength.Auto;

        // 3. KEEP "HOW TO USE RVM" VISIBLE AND CLEAN DIRECTLY BELOW VIDEO (WITH GENEROUS 16PX SPACING)
        HowToUseContainer.Visibility = Visibility.Visible;
        if (HowToUseSpacerRow1 != null) HowToUseSpacerRow1.Height = new GridLength(16);
        if (HowToUseRow != null) HowToUseRow.Height = GridLength.Auto;
        HowToUseContainer.BeginAnimation(HeightProperty, null);
        HowToUseContainer.Height = DefaultHowToUseHeight;
        HowToUseContainer.Opacity = 1.0;

        // 4. Set Top Dashboard to Auto and Bottom Signage to Star - strictly non-overlapping!
        TopDashboardRow.Height = GridLength.Auto;
        BottomSignageRow.Height = new GridLength(1, GridUnitType.Star);
        BottomGrid.Visibility = Visibility.Visible;
        BottomGrid.Opacity = 1.0;
        try { AdvertisementPlayer?.Play(); } catch { }
    }

    public void ExitIdleExpandedMode()
    {
        if (!_isIdleExpandedMode) return;
        _isIdleExpandedMode = false;
        _lastInteractionTime = DateTime.Now;

        LogTelemetry("[IDLE] Activity detected / Key 0 pressed. Returning smoothly to default kiosk screen.");

        var easeInOut = new QuarticEase { EasingMode = EasingMode.EaseInOut };

        // 1. Zoom out instructional video container back to default height and 1.0 scale
        var heightAnim = new DoubleAnimation
        {
            To = DefaultInstructionHeight,
            Duration = TimeSpan.FromMilliseconds(650),
            EasingFunction = easeInOut
        };
        InstructionContainer.BeginAnimation(HeightProperty, heightAnim);

        var zoomAnim = new DoubleAnimation
        {
            To = 1.0,
            Duration = TimeSpan.FromMilliseconds(650),
            EasingFunction = easeInOut
        };
        InstructionContainerScale.BeginAnimation(ScaleTransform.ScaleXProperty, zoomAnim);
        InstructionContainerScale.BeginAnimation(ScaleTransform.ScaleYProperty, zoomAnim);

        // 2. Restore standard Top Dashboard (67%) and Bottom Signage (33%) split
        TopDashboardRow.Height = new GridLength(67, GridUnitType.Star);
        BottomSignageRow.Height = new GridLength(33, GridUnitType.Star);
        if (MainContentRowDef != null) MainContentRowDef.Height = new GridLength(1, GridUnitType.Star);

        // 3. Restore Top Header Bar (Row 0)
        TopHeaderGrid.Visibility = Visibility.Visible;
        if (HeaderRowDef != null) HeaderRowDef.Height = GridLength.Auto;
        var fadeInHeader = new DoubleAnimation
        {
            To = 1.0,
            Duration = TimeSpan.FromMilliseconds(550),
            EasingFunction = easeInOut
        };
        TopHeaderGrid.BeginAnimation(OpacityProperty, fadeInHeader);

        // 4. Restore Hardware Status Bar (Row 1)
        HardwareStatusBar.Visibility = Visibility.Visible;
        if (HardwareStatusRowDef != null) HardwareStatusRowDef.Height = GridLength.Auto;
        var fadeInHardware = new DoubleAnimation
        {
            To = 1.0,
            Duration = TimeSpan.FromMilliseconds(550),
            EasingFunction = easeInOut
        };
        HardwareStatusBar.BeginAnimation(OpacityProperty, fadeInHardware);

        // 5. Restore "HOW TO USE RVM" Container
        HowToUseContainer.Visibility = Visibility.Visible;
        if (HowToUseSpacerRow1 != null) HowToUseSpacerRow1.Height = new GridLength(10);
        if (HowToUseRow != null) HowToUseRow.Height = GridLength.Auto;
        if (HowToUseSpacerRow2 != null) HowToUseSpacerRow2.Height = new GridLength(6);
        HowToUseContainer.BeginAnimation(HeightProperty, null);
        HowToUseContainer.Height = DefaultHowToUseHeight;
        HowToUseContainer.Opacity = 1.0;

        // 6. Restore Lower Dashboard (Row 4: Live Session Breakdown + Top 5 Leaderboard)
        LowerDashboardGrid.Visibility = Visibility.Visible;
        if (LowerDashboardRow != null) LowerDashboardRow.Height = new GridLength(1, GridUnitType.Star);
        var fadeInLowerDash = new DoubleAnimation
        {
            To = 1.0,
            Duration = TimeSpan.FromMilliseconds(600),
            EasingFunction = easeInOut
        };
        LowerDashboardGrid.BeginAnimation(OpacityProperty, fadeInLowerDash);

        // 7. Signage remains visible and playing
        BottomGrid.Visibility = Visibility.Visible;
        BottomGrid.Opacity = 1.0;
        try { AdvertisementPlayer?.Play(); } catch { }
    }

    private void StartButton_Click(object sender, RoutedEventArgs e)
    {
        RegisterUserActivity();
        StartMachine();
    }

    private void DemoTestingButton_Click(object sender, RoutedEventArgs e) => DemoTestingWindow.OpenOrBringToFront(this);

    private void StopButton_Click(object sender, RoutedEventArgs e) => StopMachine();

    private void AdminButton_Click(object sender, RoutedEventArgs e) => OpenAdmin();

    private void ViewRewardsButton_Click(object sender, RoutedEventArgs e) => CompleteSessionToWallet();

    private void SignInNav_Click(object sender, RoutedEventArgs e) => CompleteSessionToWallet();

    private void RewardsNav_Click(object sender, RoutedEventArgs e) => CompleteSessionToWallet();

    private void TransactionNav_Click(object sender, RoutedEventArgs e)
    {
        RvmMessageDialog.ShowInfo("Session Summary", $"Current Session Stats:\n\n• Items Recycled: {totalItems}\n• Points Earned: {totalPoints}\n• CO₂ Saved: {(totalItems * 0.15):0.00} kg\n• Water Saved: {(totalItems * 0.75):0.00} L");
    }

    private void InstructionsNav_Click(object sender, RoutedEventArgs e)
    {
        RvmMessageDialog.ShowInfo("How To Use RVM", "1. Press 0 to Start\n2. Insert Bottle/Can/UBC/Cup\n3. Detect\n4. Press Enter\n5. Enter Mobile Number / Scan QR Code\n6. Press Enter and Get Points\n7. Save");
    }

    private void AnnouncementsNav_Click(object sender, RoutedEventArgs e)
    {
        RvmMessageDialog.ShowInfo("Announcements", "🌿 Special Recycling Campaign Active!\nEarn bonus points for plastic bottles, aluminum cans, and beverage cups today!");
    }

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
        var login = new AdminLoginWindow { Owner = this };
        if (login.ShowDialog() == true)
        {
            new AdminWindow { Owner = this }.ShowDialog();
        }
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
            var candidateFiles = FindVideoFiles(settings.InstructionVideoFolder);
            string? path = candidateFiles.OrderByDescending(f => File.GetLastWriteTime(f)).FirstOrDefault(f => Path.GetFileName(f).Equals("Instructinal.mp4", StringComparison.OrdinalIgnoreCase))
                          ?? candidateFiles.OrderByDescending(f => File.GetLastWriteTime(f)).FirstOrDefault(f => f.Contains("Instruct", StringComparison.OrdinalIgnoreCase))
                          ?? candidateFiles.OrderByDescending(f => File.GetLastWriteTime(f)).FirstOrDefault();

            if (string.IsNullOrEmpty(path))
            {
                // Fallback check in multiple well-known folders
                string[] fallbackFolders = [
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Ads", "Instructions"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "RVMDesktopApp", "Ads", "Instructions"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "Ads", "Instructions"),
                    Path.Combine(Directory.GetCurrentDirectory(), "Ads", "Instructions"),
                    Path.Combine(Directory.GetCurrentDirectory(), "RVMDesktopApp", "Ads", "Instructions"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Ads", "Advertisements")
                ];
                foreach (var folder in fallbackFolders)
                {
                    path = FindVideoFiles(folder).OrderByDescending(f => File.GetLastWriteTime(f)).FirstOrDefault(f => Path.GetFileName(f).Equals("Instructinal.mp4", StringComparison.OrdinalIgnoreCase))
                           ?? FindVideoFiles(folder).OrderByDescending(f => File.GetLastWriteTime(f)).FirstOrDefault(f => f.Contains("Instruct", StringComparison.OrdinalIgnoreCase));
                    if (!string.IsNullOrEmpty(path)) break;
                }
            }

            if (string.IsNullOrEmpty(path))
            {
                LogTelemetry($"[VIDEO] No instruction video found in: {settings.InstructionVideoFolder}");
                InstructionPlaceholder.Visibility = Visibility.Visible;
                InstructionPlayer.Visibility = Visibility.Collapsed;
                return;
            }

            _defaultInstructionVideoPath = Path.GetFullPath(path);
            InstructionPlayer.Source = new Uri(_defaultInstructionVideoPath);
            InstructionPlaceholder.Visibility = Visibility.Collapsed;
            InstructionPlayer.Visibility = Visibility.Visible;
            InstructionPlayer.Play();
            LogTelemetry($"[VIDEO] Instruction video loaded: {Path.GetFileName(path)}");
        }
        catch (Exception ex)
        {
            LogTelemetry($"[VIDEO Error] Could not load instruction video: {ex.Message}");
            InstructionPlaceholder.Visibility = Visibility.Visible;
            InstructionPlayer.Visibility = Visibility.Collapsed;
        }
    }

    private void InstructionPlayer_MediaEnded(object sender, RoutedEventArgs e)
    {
        if (_currentInstructionState == InstructionDisplayState.Accepted || _currentInstructionState == InstructionDisplayState.Rejected)
        {
            if (machineStarted)
            {
                ShowPleaseInsertState();
            }
            else
            {
                ShowDefaultInstructionVideoState();
            }
            return;
        }

        InstructionPlayer.Position = TimeSpan.Zero;
        InstructionPlayer.Play();
    }

    private void DetectingLaserTimer_Tick(object? sender, EventArgs e)
    {
        if (_laserDown)
        {
            _laserPos += 7.0;
            if (_laserPos >= 195.0)
            {
                _laserPos = 195.0;
                _laserDown = false;
            }
        }
        else
        {
            _laserPos -= 7.0;
            if (_laserPos <= 15.0)
            {
                _laserPos = 15.0;
                _laserDown = true;
            }
        }
        if (DetectingLaserLine != null)
        {
            Canvas.SetTop(DetectingLaserLine, _laserPos);
        }
    }

    public void ShowDefaultInstructionVideoState()
    {
        _currentInstructionState = InstructionDisplayState.DefaultIdleVideo;
        _detectingLaserTimer.Stop();
        _revertToInsertTimer.Stop();

        if (PleaseInsertOverlay != null) PleaseInsertOverlay.Visibility = Visibility.Collapsed;
        if (DetectingOverlay != null) DetectingOverlay.Visibility = Visibility.Collapsed;
        if (AcceptedOverlay != null) AcceptedOverlay.Visibility = Visibility.Collapsed;
        if (RejectedOverlay != null) RejectedOverlay.Visibility = Visibility.Collapsed;

        if (!string.IsNullOrEmpty(_defaultInstructionVideoPath) && File.Exists(_defaultInstructionVideoPath))
        {
            try
            {
                InstructionPlayer.Source = new Uri(_defaultInstructionVideoPath);
                InstructionPlayer.Visibility = Visibility.Visible;
                if (InstructionPlaceholder != null) InstructionPlaceholder.Visibility = Visibility.Collapsed;
                InstructionPlayer.Position = TimeSpan.Zero;
                InstructionPlayer.Play();
            }
            catch
            {
                if (InstructionPlaceholder != null) InstructionPlaceholder.Visibility = Visibility.Visible;
            }
        }
        else
        {
            if (InstructionPlaceholder != null) InstructionPlaceholder.Visibility = Visibility.Visible;
            InstructionPlayer.Visibility = Visibility.Collapsed;
        }

        if (StartQrCard != null && !machineStarted) StartQrCard.Visibility = Visibility.Visible;

        LogTelemetry("[STATE] Instruction screen -> DEFAULT IDLE INSTRUCTION VIDEO");
    }

    public void ShowPleaseInsertState()
    {
        _currentInstructionState = InstructionDisplayState.PleaseInsert;
        _detectingLaserTimer.Stop();
        _revertToInsertTimer.Stop();

        try
        {
            InstructionPlayer.Stop();
            InstructionPlayer.Visibility = Visibility.Collapsed;
        }
        catch { }

        if (InstructionPlaceholder != null) InstructionPlaceholder.Visibility = Visibility.Collapsed;
        if (DetectingOverlay != null) DetectingOverlay.Visibility = Visibility.Collapsed;
        if (AcceptedOverlay != null) AcceptedOverlay.Visibility = Visibility.Collapsed;
        if (RejectedOverlay != null) RejectedOverlay.Visibility = Visibility.Collapsed;
        if (StartQrCard != null) StartQrCard.Visibility = Visibility.Collapsed;
        if (PleaseInsertOverlay != null) PleaseInsertOverlay.Visibility = Visibility.Visible;

        // Animate Arrow Bounce
        try
        {
            if (InsertArrowBounce != null)
            {
                var bounceAnim = new DoubleAnimation
                {
                    From = -4,
                    To = 14,
                    Duration = TimeSpan.FromMilliseconds(650),
                    AutoReverse = true,
                    RepeatBehavior = RepeatBehavior.Forever,
                    EasingFunction = new SineEase { EasingMode = EasingMode.EaseInOut }
                };
                InsertArrowBounce.BeginAnimation(TranslateTransform.YProperty, bounceAnim);
            }

            if (InsertRingRotate != null)
            {
                var rotateAnim = new DoubleAnimation
                {
                    From = 0,
                    To = 360,
                    Duration = TimeSpan.FromSeconds(8),
                    RepeatBehavior = RepeatBehavior.Forever
                };
                InsertRingRotate.BeginAnimation(RotateTransform.AngleProperty, rotateAnim);
            }
        }
        catch { }

        LogTelemetry("[STATE] Instruction screen -> PLEASE INSERT BOTTLE/CAN/UBC");
    }

    public void ShowDetectingState(string detail = "")
    {
        _currentInstructionState = InstructionDisplayState.DetectingAndSizing;
        _revertToInsertTimer.Stop();

        try
        {
            InstructionPlayer.Stop();
            InstructionPlayer.Visibility = Visibility.Collapsed;
        }
        catch { }

        if (InstructionPlaceholder != null) InstructionPlaceholder.Visibility = Visibility.Collapsed;
        if (PleaseInsertOverlay != null) PleaseInsertOverlay.Visibility = Visibility.Collapsed;
        if (AcceptedOverlay != null) AcceptedOverlay.Visibility = Visibility.Collapsed;
        if (RejectedOverlay != null) RejectedOverlay.Visibility = Visibility.Collapsed;
        if (DetectingOverlay != null) DetectingOverlay.Visibility = Visibility.Visible;

        if (!string.IsNullOrWhiteSpace(detail) && DetectingStatusDetailText != null)
        {
            DetectingStatusDetailText.Text = detail;
        }
        else if (DetectingStatusDetailText != null)
        {
            DetectingStatusDetailText.Text = "CALIBRATING VOLUME • OPTICAL IR SCAN ACTIVE";
        }

        _laserPos = 20.0;
        _laserDown = true;
        if (DetectingLaserLine != null)
        {
            Canvas.SetTop(DetectingLaserLine, _laserPos);
        }
        _detectingLaserTimer.Start();

        LogTelemetry("[STATE] Instruction screen -> DETECTING & SIZING ITEM");
    }

    public void ShowAcceptedState(string material, string size, int points)
    {
        _currentInstructionState = InstructionDisplayState.Accepted;
        _detectingLaserTimer.Stop();
        _revertToInsertTimer.Stop();

        if (PleaseInsertOverlay != null) PleaseInsertOverlay.Visibility = Visibility.Collapsed;
        if (DetectingOverlay != null) DetectingOverlay.Visibility = Visibility.Collapsed;
        if (RejectedOverlay != null) RejectedOverlay.Visibility = Visibility.Collapsed;
        if (InstructionPlaceholder != null) InstructionPlaceholder.Visibility = Visibility.Collapsed;

        string matUpper = (material ?? "").Trim().ToUpperInvariant();
        string fileName;
        if (matUpper.Contains("CAN") || matUpper.Contains("METAL") || matUpper.Contains("ALUMINIUM"))
        {
            fileName = "DancingCan.mp4";
            string xnPath = Path.Combine(AppContext.BaseDirectory, "Assets", "DancingXN.mp4");
            if (File.Exists(xnPath)) fileName = "DancingXN.mp4";
        }
        else if (matUpper.Contains("TETRA") || matUpper.Contains("PAPER") || matUpper.Contains("CARTON") || matUpper.Contains("CUP"))
        {
            fileName = "DancingTetra.mp4";
        }
        else
        {
            fileName = "DancingPlastic.mp4";
        }

        string videoPath = Path.Combine(AppContext.BaseDirectory, "Assets", fileName);
        if (!File.Exists(videoPath))
        {
            videoPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "Assets", fileName);
        }

        if (AcceptedItemBadgeText != null) AcceptedItemBadgeText.Text = $"{size.ToUpperInvariant()} {matUpper}";
        if (AcceptedItemPointsText != null) AcceptedItemPointsText.Text = $"+{points} REWARD POINTS ADDED";
        if (AcceptedOverlay != null) AcceptedOverlay.Visibility = Visibility.Visible;

        if (File.Exists(videoPath))
        {
            try
            {
                InstructionPlayer.Source = new Uri(Path.GetFullPath(videoPath));
                InstructionPlayer.Visibility = Visibility.Visible;
                InstructionPlayer.Position = TimeSpan.Zero;
                InstructionPlayer.Play();
                LogTelemetry($"[STATE] Playing Celebration Video: {fileName} for {material}");
            }
            catch (Exception ex)
            {
                LogTelemetry($"[STATE Error] Could not play celebration video: {ex.Message}");
            }
        }

        // Safety fallback timer in case video ends or doesn't play
        _revertToInsertTimer.Interval = TimeSpan.FromSeconds(5);
        _revertToInsertTimer.Start();
    }

    public void ShowRejectedState(string reason = "")
    {
        _currentInstructionState = InstructionDisplayState.Rejected;
        _detectingLaserTimer.Stop();
        _revertToInsertTimer.Stop();

        if (PleaseInsertOverlay != null) PleaseInsertOverlay.Visibility = Visibility.Collapsed;
        if (DetectingOverlay != null) DetectingOverlay.Visibility = Visibility.Collapsed;
        if (AcceptedOverlay != null) AcceptedOverlay.Visibility = Visibility.Collapsed;
        if (InstructionPlaceholder != null) InstructionPlaceholder.Visibility = Visibility.Collapsed;

        if (!string.IsNullOrWhiteSpace(reason) && RejectedMessageText != null)
        {
            RejectedMessageText.Text = reason.ToUpperInvariant();
        }
        else if (RejectedMessageText != null)
        {
            RejectedMessageText.Text = "PLEASE REMOVE ITEM FROM DEPOSIT CHAMBER";
        }

        if (RejectedOverlay != null) RejectedOverlay.Visibility = Visibility.Visible;

        string rejectVideoPath = Path.Combine(AppContext.BaseDirectory, "Assets", "ItemRejected.mp4");
        if (File.Exists(rejectVideoPath))
        {
            try
            {
                InstructionPlayer.Source = new Uri(Path.GetFullPath(rejectVideoPath));
                InstructionPlayer.Visibility = Visibility.Visible;
                InstructionPlayer.Position = TimeSpan.Zero;
                InstructionPlayer.Play();
            }
            catch { }
        }

        try { System.Media.SystemSounds.Hand.Play(); } catch { }

        // Revert back to please insert after 4 seconds
        _revertToInsertTimer.Interval = TimeSpan.FromSeconds(4);
        _revertToInsertTimer.Start();

        LogTelemetry($"[STATE] Instruction screen -> ITEM REJECTED ({reason})");
    }

    private void InstructionPlayer_MediaFailed(object? sender, ExceptionRoutedEventArgs e)
    {
        LogTelemetry($"[INSTRUCTION VIDEO FAILED] {e.ErrorException?.Message}");
        InstructionPlaceholder.Visibility = Visibility.Visible;
        InstructionPlayer.Visibility = Visibility.Collapsed;
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
        }
        else
        {
            adPlaylistIndex = 0;
            PlayAdVideo(adPlaylist[0]);
            LogTelemetry($"[AD] Loaded {adPlaylist.Count} video(s) from {settings.AdvertisementVideoFolder}");
        }

        // Pull remote advertisement video updates from Central Dashboard in background
        _ = Task.Run(async () =>
        {
            try
            {
                var remoteAds = await CentralSyncService.SyncAdvertisementsFromCentralAsync(settings.MachineId, settings.AdvertisementVideoFolder, msg => LogTelemetry(msg));
                if (remoteAds.Count > 0)
                {
                    await Dispatcher.InvokeAsync(() =>
                    {
                        adPlaylist.Clear();
                        adPlaylist.AddRange(FindVideoFiles(settings.AdvertisementVideoFolder));
                        if (adPlaylist.Count > 0 && AdvertisementPlayer.Source == null)
                        {
                            adPlaylistIndex = 0;
                            PlayAdVideo(adPlaylist[0]);
                        }
                    });
                }
            }
            catch {}
        });
    }

    private void PlayAdVideo(string path)
    {
        try
        {
            currentPlayingAdPath = Path.GetFullPath(path);
            AdvertisementPlayer.Visibility = Visibility.Visible;
            AdvertisementPlayer.Source = new Uri(currentPlayingAdPath);
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

    public void ReloadAdvertisementPlaylist(IEnumerable<string>? customList = null)
    {
        adPlaylist.Clear();
        if (customList != null)
        {
            adPlaylist.AddRange(customList);
        }
        else
        {
            adPlaylist.AddRange(FindVideoFiles(settings.AdvertisementVideoFolder));
        }

        if (adPlaylist.Count == 0)
        {
            AdvertisementPlayer.Visibility = Visibility.Collapsed;
            LogTelemetry($"[AD] No videos in playlist.");
            return;
        }

        adPlaylistIndex = 0;
        PlayAdVideo(adPlaylist[0]);
        LogTelemetry($"[AD] Playlist reloaded with {adPlaylist.Count} video(s).");
    }

    public void ReloadInstructionVideo()
    {
        StartInstructionVideo();
    }

    private static string[] FindVideoFiles(string directory)
    {
        if (string.IsNullOrWhiteSpace(directory)) return [];

        string targetDir = directory;

        // If path is absolute and exists, use it directly
        if (Path.IsPathRooted(directory) && Directory.Exists(directory))
        {
            targetDir = directory;
        }
        else
        {
            // For relative paths, ALWAYS check AppDomain BaseDirectory first (where build output & deployed assets reside)
            string fromBase = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, directory);
            if (Directory.Exists(fromBase) && Directory.EnumerateFiles(fromBase).Any())
            {
                targetDir = fromBase;
            }
            else
            {
                // Try project source directory (..\..\..\RVMDesktopApp\directory or ..\..\..\directory)
                string fromProjectSource = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "RVMDesktopApp", directory));
                string fromRepoRoot = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", directory));
                string fromCwdRvm = Path.Combine(Directory.GetCurrentDirectory(), "RVMDesktopApp", directory);

                if (Directory.Exists(fromProjectSource) && Directory.EnumerateFiles(fromProjectSource).Any())
                {
                    targetDir = fromProjectSource;
                }
                else if (Directory.Exists(fromCwdRvm) && Directory.EnumerateFiles(fromCwdRvm).Any())
                {
                    targetDir = fromCwdRvm;
                }
                else if (Directory.Exists(fromRepoRoot) && Directory.EnumerateFiles(fromRepoRoot).Any())
                {
                    targetDir = fromRepoRoot;
                }
                else if (Directory.Exists(directory))
                {
                    targetDir = directory;
                }
            }
        }

        if (!Directory.Exists(targetDir))
        {
            return [];
        }

        return [.. Directory.EnumerateFiles(targetDir)
            .Where(path => VideoExtensions.Contains(Path.GetExtension(path), StringComparer.OrdinalIgnoreCase))
            .OrderByDescending(path => File.GetLastWriteTime(path))];
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
            
            string localIp = HeartbeatService.GetLocalIpAddress();
            client.DefaultRequestHeaders.TryAddWithoutValidation("X-Local-IP", localIp);
            
            try
            {
                var heartbeatObj = new { machineId = settings.MachineId, status = "active", binFillPercentage = 0, localIp };
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
                    PointRulesCache.ApplyJsonConfig(json);

                    using var doc = System.Text.Json.JsonDocument.Parse(json);
                    if (doc.RootElement.TryGetProperty("name", out var nameProp) && !string.IsNullOrWhiteSpace(nameProp.GetString()))
                    {
                        string apiName = nameProp.GetString()!;
                        UpdateRvmNameDisplay(apiName);
                        LogTelemetry($"[API] Machine Name & Point Rules (v{PointRulesCache.ConfigVersion}) synced from Central Dashboard: {apiName}");
                    }
                }
                catch
                {
                    // Ignore JSON parse errors for fallback compatibility
                }

                SetLiveBadgeOnline();
                
                // Auto-upload unsynced local sessions & silently pull latest point settings & ads when online
                _ = DatabaseManager.SyncAllLocalSessionsToCentralAsync(settings.MachineId, msg => LogTelemetry(msg));
                _ = DatabaseManager.SyncPointSettingsFromCentralAsync(settings.MachineId, msg => LogTelemetry(msg));
                _ = CentralSyncService.SyncAdvertisementsFromCentralAsync(settings.MachineId, settings.AdvertisementVideoFolder, msg => LogTelemetry(msg));
                _ = CentralSyncService.SyncLeaderboardFromCentralAsync(msg => {
                    LogTelemetry(msg);
                    Dispatcher.Invoke(RefreshLeaderboard);
                });

                // Sync & update remote multi-video advertisement rotation playlist from Central Dashboard
                _ = Task.Run(async () =>
                {
                    try
                    {
                        var remotePlaylist = await CentralSyncService.FetchRemoteActivePlaylistAsync(settings.MachineId, settings.AdvertisementVideoFolder, msg => LogTelemetry(msg));
                        if (remotePlaylist.Count > 0)
                        {
                            await Dispatcher.InvokeAsync(() =>
                            {
                                bool sequenceChanged = adPlaylist.Count != remotePlaylist.Count ||
                                                       !adPlaylist.SequenceEqual(remotePlaylist, StringComparer.OrdinalIgnoreCase);
                                if (sequenceChanged)
                                {
                                    LogTelemetry($"[REMOTE PLAYLIST 🚀] Remote Dashboard updated multi-video playlist ({remotePlaylist.Count} video(s) in rotation).");
                                    adPlaylist.Clear();
                                    adPlaylist.AddRange(remotePlaylist);

                                    if (string.IsNullOrWhiteSpace(currentPlayingAdPath) || !adPlaylist.Contains(currentPlayingAdPath, StringComparer.OrdinalIgnoreCase))
                                    {
                                        adPlaylistIndex = 0;
                                        PlayAdVideo(adPlaylist[0]);
                                    }
                                    else
                                    {
                                        adPlaylistIndex = adPlaylist.FindIndex(p => string.Equals(p, currentPlayingAdPath, StringComparison.OrdinalIgnoreCase));
                                    }
                                }
                            });
                        }
                    }
                    catch {}
                });
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

    private async Task RegisterStartHandshakeAsync()
    {
        if (machineStarted || _isRegisteringHandshake) return;
        _isRegisteringHandshake = true;
        try
        {
            var resp = await CentralSyncService.RegisterKioskStartHandshakeAsync(settings.MachineId);
            if (resp != null && resp.Success && !string.IsNullOrWhiteSpace(resp.QrUrl))
            {
                _currentStartToken = resp.StartToken;
                _startTokenExpiresAt = DateTime.UtcNow.AddSeconds(110);
                var qrBmp = QrCodeGenerator.GenerateQrCode(resp.QrUrl, 6);
                if (StartQrImage != null)
                {
                    StartQrImage.Source = qrBmp;
                }
                if (StartQrCard != null)
                {
                    StartQrCard.Visibility = Visibility.Visible;
                }
                LogTelemetry($"[TOUCHLESS 📱] Dynamic start QR generated for kiosk {settings.MachineId}");
            }
        }
        catch (Exception ex)
        {
            LogTelemetry($"[TOUCHLESS WARN] QR registration: {ex.Message}");
        }
        finally
        {
            _isRegisteringHandshake = false;
        }
    }

    private async void StartHandshakeTimer_Tick(object? sender, EventArgs e)
    {
        if (machineStarted)
        {
            if (!string.IsNullOrWhiteSpace(activeUserMobile))
            {
                try
                {
                    var statusResp = await CentralSyncService.CheckKioskStartStatusAsync(settings.MachineId);
                    if (statusResp != null && statusResp.FinishRequested && totalItems > 0)
                    {
                        _startHandshakeTimer.Stop();
                        _inactivityCountdownTimer.Stop();
                        LogTelemetry($"[TOUCHLESS 📱] Mobile {activeUserMobile} requested session finish! Completing session...");
                        CompleteSessionToWallet();
                        return;
                    }
                }
                catch { }
            }
            else
            {
                _startHandshakeTimer.Stop();
            }
            return;
        }

        if (string.IsNullOrWhiteSpace(_currentStartToken) || DateTime.UtcNow > _startTokenExpiresAt)
        {
            await RegisterStartHandshakeAsync();
            return;
        }

        try
        {
            var statusResp = await CentralSyncService.CheckKioskStartStatusAsync(settings.MachineId);
            if (statusResp != null && statusResp.Success)
            {
                if (statusResp.Status == "STARTED" && !string.IsNullOrWhiteSpace(statusResp.MobileNumber))
                {
                    activeUserMobile = statusResp.MobileNumber;

                    string userName = statusResp.User?.FullName ?? statusResp.User?.Username ?? "Eco Citizen";
                    int balance = statusResp.User?.Balance ?? 0;

                    if (GreetingUserNameText != null) GreetingUserNameText.Text = userName;
                    if (GreetingPointsBalanceText != null) GreetingPointsBalanceText.Text = $"Balance: {balance} pts";
                    if (UserGreetingBanner != null) UserGreetingBanner.Visibility = Visibility.Visible;

                    LogTelemetry($"[TOUCHLESS 🚀] User {activeUserMobile} ({userName}) authenticated via QR! Starting kiosk...");
                    StartMachine();
                }
                else if (statusResp.Status == "EXPIRED")
                {
                    await RegisterStartHandshakeAsync();
                }
            }
        }
        catch
        {
            // Transient network hiccups ignored in poll
        }
    }

    private void ResetInactivityCountdown()
    {
        if (!machineStarted || totalItems <= 0) return;
        _inactivitySecondsRemaining = 15;
        if (!_inactivityCountdownTimer.IsEnabled)
        {
            _inactivityCountdownTimer.Start();
        }
    }

    private void InactivityCountdownTimer_Tick(object? sender, EventArgs e)
    {
        if (!machineStarted || totalItems <= 0)
        {
            _inactivityCountdownTimer.Stop();
            return;
        }

        _inactivitySecondsRemaining--;
        if (_inactivitySecondsRemaining > 0 && _inactivitySecondsRemaining <= 10)
        {
            BottleInfoText.Text = $"Insert item • Auto-completing in {_inactivitySecondsRemaining}s";
        }

        if (_inactivitySecondsRemaining <= 0)
        {
            _inactivityCountdownTimer.Stop();
            LogTelemetry($"[TOUCHLESS ⏱️] 15s Inactivity reached with {totalItems} items. Auto-completing session...");
            CompleteSessionToWallet();
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

            var last = DatabaseManager.GetLastRecyclerInfo();
            if (LastRecyclerNameText != null) LastRecyclerNameText.Text = last.DisplayName;
            if (LastRecyclerPointsText != null) LastRecyclerPointsText.Text = $"+{last.PointsAwarded} pts";
            if (LastRecyclerTimeText != null) LastRecyclerTimeText.Text = $" • {last.TimeAgo}";
            if (LastRecyclerActivityText != null) LastRecyclerActivityText.Text = $"Recycled {last.Material} • آخری ری سائیکلر";
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
            if (HardwareErrorBanner != null) HardwareErrorBanner.Visibility = Visibility.Collapsed;
            LogTelemetry($"[HARDWARE] Connected on {settings.ArduinoPort} at {settings.ArduinoBaud} baud");
            LogTelemetry("[CMD] CALIBRATE");
            serial.SendCommand("CALIBRATE");
        }
        catch (Exception ex)
        {
            ConnectionText.Text = "HARDWARE: OFFLINE";
            ConnectionText.Foreground = Brushes.OrangeRed;
            StatusDot.Fill = Brushes.OrangeRed;
            StatusText.Text = "Ready";
            StatusText.Foreground = Brushes.LimeGreen;
            BottleInfoText.Text = "• Insert container";
            MachineStateText.Text = "MACHINE: ERROR";
            if (HardwareErrorBanner != null)
            {
                HardwareErrorBanner.Visibility = Visibility.Visible;
                if (HardwareErrorText != null)
                {
                    HardwareErrorText.Text = $"HARDWARE CONNECTION ERROR: Check {settings.ArduinoPort} connection or update config.txt • ہارڈویئر منسلک نہیں ہے";
                }
            }
            LogTelemetry($"[HARDWARE] Connection failed: {ex.Message}");
        }
    }

    private void RetryHardwareConnection_Click(object sender, RoutedEventArgs e)
    {
        ConnectArduino();
    }

    public void StartMachine(bool forceSimulator = false)
    {
        if (_isIdleExpandedMode)
        {
            ExitIdleExpandedMode();
        }

        if (!serial.IsConnected && !IsDemoMode && !forceSimulator)
        {
            ConnectArduino();
        }

        if (!serial.IsConnected && !IsDemoMode && !forceSimulator)
        {
            MachineStateText.Text = "MACHINE: ERROR";
            if (HardwareErrorBanner != null) HardwareErrorBanner.Visibility = Visibility.Visible;
            SimulatorStateChanged?.Invoke();
            return;
        }

        if (serial.IsConnected)
        {
            serial.SendCommand("START");
        }

        machineStarted = true;
        scanTimer.Stop();
        if (string.IsNullOrWhiteSpace(activeUserMobile))
        {
            _startHandshakeTimer.Stop();
        }
        else
        {
            if (!_startHandshakeTimer.IsEnabled) _startHandshakeTimer.Start();
        }
        if (string.IsNullOrWhiteSpace(activeUserMobile) && UserGreetingBanner != null)
        {
            UserGreetingBanner.Visibility = Visibility.Collapsed;
        }

        StatusText.Text = (IsDemoMode || !serial.IsConnected) ? "Machine Started (Demo Mode)" : "Machine Started";
        StatusText.Foreground = Brushes.LimeGreen;
        BottleInfoText.Text = "Insert container • (Or use Demo Testing Panel)";
        MachineStateText.Text = (IsDemoMode || !serial.IsConnected) ? "MACHINE: RUNNING (DEMO)" : "MACHINE: RUNNING";
        if (HardwareErrorBanner != null) HardwareErrorBanner.Visibility = Visibility.Collapsed;
        LogTelemetry((IsDemoMode || !serial.IsConnected) ? "[DEMO] Session Started without hardware" : "[CMD] START");
        ShowPleaseInsertState();
        SimulatorStateChanged?.Invoke();
    }

    public void StopMachine()
    {
        if (serial.IsConnected)
        {
            serial.SendCommand("STOP");
        }

        machineStarted = false;
        scanTimer.Stop();
        _inactivityCountdownTimer.Stop();
        activeUserMobile = null;
        if (UserGreetingBanner != null) UserGreetingBanner.Visibility = Visibility.Collapsed;
        _ = CentralSyncService.ResetKioskStartHandshakeAsync(settings.MachineId);
        _ = RegisterStartHandshakeAsync();
        if (!_startHandshakeTimer.IsEnabled) _startHandshakeTimer.Start();

        StatusText.Text = "Ready";
        StatusText.Foreground = Brushes.LimeGreen;
        BottleInfoText.Text = "• Insert container";
        MachineStateText.Text = "MACHINE: IDLE";
        LogTelemetry("[CMD] STOP");
        ShowDefaultInstructionVideoState();
        SimulatorStateChanged?.Invoke();
    }

    public void SimulateItemDeposit(string material, string size, bool accept)
    {
        if (!machineStarted)
        {
            StartMachine(forceSimulator: true);
        }

        string matUpper = (material ?? "PLASTIC").Trim().ToUpperInvariant();
        string sizeUpper = (size ?? "MEDIUM").Trim().ToUpperInvariant();

        // 1. Immediately show Detecting & Sizing state with scanner animation
        ShowDetectingState($"DETECTING {sizeUpper} {matUpper} • OPTICAL IR & SIZING ACTIVE");

        // 2. Realistic 1.2s sensor delay, then trigger Accepted celebration or Rejected alert!
        var detectTimer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(1200) };
        detectTimer.Tick += (s, e) =>
        {
            detectTimer.Stop();
            ExecuteDepositCommit(matUpper, sizeUpper, accept);
        };
        detectTimer.Start();
    }

    private void ExecuteDepositCommit(string matUpper, string sizeUpper, bool accept)
    {
        if (!accept)
        {
            rejectedCount++;
            RejectedCountText.Text = RejectedTotalCountText.Text = rejectedCount.ToString();

            StatusText.Text = "Rejected";
            StatusText.Foreground = Brushes.OrangeRed;
            BottleInfoText.Text = $"Item rejected ({sizeUpper} {matUpper}) - please remove from gate";

            LogTelemetry($"[DEMO REJECT] Size={sizeUpper} Material={matUpper}");
            SaveTransaction(new BottleResult { Material = matUpper, Size = sizeUpper }, 0, false);
            ShowRejectedState($"Item rejected ({sizeUpper} {matUpper}) • Please remove from gate");
            SimulatorStateChanged?.Invoke();
            return;
        }

        var result = new BottleResult
        {
            Material = matUpper,
            Size = sizeUpper,
            DurationMs = 350
        };

        int points = GetPoints(result);
        totalItems++;
        totalPoints += points;

        IncrementMaterialSizeCounter(result.Material, result.Size);

        StatusText.Text = "Accepted";
        StatusText.Foreground = Brushes.LimeGreen;
        string itemDescription = result.Material.ToLowerInvariant();
        BottleInfoText.Text = $"{result.Size} {itemDescription} - {points} points";
        TotalItemsText.Text = totalItems.ToString();
        TotalPointsText.Text = totalPoints.ToString();
        UpdateImpactMetrics();

        LogTelemetry($"[DEMO ACCEPT] Size={result.Size} Material={result.Material} Points={points} Total={totalPoints}");
        SaveTransaction(result, points, true);
        ShowAcceptedState(result.Material, result.Size, points);
        ResetInactivityCountdown();

        // Real-Time Live Sync to Central Server
        string currentSessionId = sessionId.ToString();
        string currentMachineId = settings.MachineId;
        string userIdentifier = !string.IsNullOrWhiteSpace(activeUserMobile) ? activeUserMobile : "08884424625";
        int curPlastic = plasticSmallCount + plasticMediumCount + plasticLargeCount;
        int curCan = canSmallCount + canMediumCount + canLargeCount;
        int curPaper = tetraPakSmallCount + tetraPakMediumCount + tetraPakLargeCount;
        int curPoints = totalPoints;
        int pSmall = plasticSmallCount;
        int pMed = plasticMediumCount;
        int pLg = plasticLargeCount;
        int cSmall = canSmallCount;
        int cMed = canMediumCount;
        int cLg = canLargeCount;

        _ = System.Threading.Tasks.Task.Run(async () =>
        {
            try
            {
                var syncRes = await CentralSyncService.SyncSessionToCentralDetailedAsync(
                    currentMachineId,
                    currentSessionId,
                    userIdentifier,
                    curPlastic,
                    curCan,
                    curPaper,
                    0,
                    curPoints,
                    0.0,
                    result.Size,
                    result.Material,
                    pSmall, pMed, pLg,
                    cSmall, cMed, cLg
                );

                if (syncRes.IsSuccess)
                {
                    LogTelemetry($"[LIVE SYNC 🟢] Accepted simulated item synced ({curPoints} pts)");
                }
            }
            catch { }
        });

        SimulatorStateChanged?.Invoke();
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
            if (HardwareErrorBanner != null)
            {
                HardwareErrorBanner.Visibility = Visibility.Visible;
                if (HardwareErrorText != null)
                {
                    HardwareErrorText.Text = $"HARDWARE CONNECTION ERROR: {error.Message} • ہارڈویئر کا رابطہ منقطع ہے";
                }
            }
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
            if (HardwareErrorBanner != null) HardwareErrorBanner.Visibility = Visibility.Collapsed;
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

        if (message == "CHAMBER:CLEARED")
        {
            StatusText.Text = "Chamber Cleared";
            StatusText.Foreground = Brushes.LimeGreen;
            BottleInfoText.Text = "Gate closed. Ready for next item.";
            MachineStateText.Text = "MACHINE: READY";
            LogTelemetry("[HARDWARE 🟢] Chamber manually cleared (Key 33 response)");
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
            ShowDetectingState("CONTAINER SENSED • OPTICAL IR SCAN ACTIVE");
            StatusText.Text = "Scanning...";
            StatusText.Foreground = Brushes.Gold;
            BottleInfoText.Text = "Bottle detected";
            scanTimer.Stop();
            scanTimer.Start();
            return;
        }

        if (message == "IR:DETECTED_TRIGGER")
        {
            ShowDetectingState("ITEM HELD • MEASURING LENGTH & SIZING");
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

        if (message == "BIN:FULL" || message == "BIN:BLOCKED" || message == "ERROR:BIN_FULL")
        {
            machineStarted = false;
            scanTimer.Stop();
            StatusText.Text = "Bin Full / Blocked";
            StatusText.Foreground = Brushes.OrangeRed;
            BottleInfoText.Text = "Collection bin is full or sensor blocked (D11)";
            MachineStateText.Text = "MACHINE: BIN FULL";
            LogTelemetry("[SAFETY 🔴] Bin sensor (Pin D11) is blocked. Machine stopped.");
            return;
        }

        if (message == "BIN:CLEARED")
        {
            StatusText.Text = "Bin Cleared";
            StatusText.Foreground = Brushes.LimeGreen;
            BottleInfoText.Text = "Bin sensor clear. Press 0 or Start to resume.";
            MachineStateText.Text = "MACHINE: READY";
            LogTelemetry("[SAFETY 🟢] Bin sensor (Pin D11) is clear.");
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
        RejectedCountText.Text = RejectedTotalCountText.Text = rejectedCount.ToString();

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
            RejectedCountText.Text = RejectedTotalCountText.Text = rejectedCount.ToString();

            StatusText.Text = "Rejected";
            StatusText.Foreground = Brushes.OrangeRed;
            BottleInfoText.Text = "Invalid item";

            LogTelemetry($"[REJECT] Size={result.Size} Material={result.Material}");
            SaveTransaction(result, 0, false);
            ShowRejectedState("Non-recyclable or invalid item");
            return;
        }

        pendingBottlePoints = GetPoints(result);
        pendingBottleResult = result;
        StatusText.Text = "Confirming drop...";
        StatusText.Foreground = Brushes.Gold;
        BottleInfoText.Text = $"{result.Size} {result.Material.ToLowerInvariant()} detected";
        LogTelemetry($"[PENDING] Size={result.Size} Material={result.Material} Points={pendingBottlePoints} | Raw={message}");
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
        UpdateImpactMetrics();

        LogTelemetry($"[ACCEPT] Size={result.Size} Material={result.Material} Points={points} Total={totalPoints}");
        SaveTransaction(result, points, true);
        ShowAcceptedState(result.Material, result.Size, points);
        ResetInactivityCountdown();

        // Real-Time Live Sync of accepted item to Central Master Dashboard & Mobile App
        string currentSessionId = sessionId.ToString();
        string currentMachineId = settings.MachineId;
        string userIdentifier = !string.IsNullOrWhiteSpace(activeUserMobile) ? activeUserMobile : "08884424625";
        int curPlastic = plasticSmallCount + plasticMediumCount + plasticLargeCount;
        int curCan = canSmallCount + canMediumCount + canLargeCount;
        int curPaper = tetraPakSmallCount + tetraPakMediumCount + tetraPakLargeCount;
        int curPoints = totalPoints;
        int curItems = totalItems;
        int pSmall = plasticSmallCount;
        int pMed = plasticMediumCount;
        int pLg = plasticLargeCount;
        int cSmall = canSmallCount;
        int cMed = canMediumCount;
        int cLg = canLargeCount;

        _ = Task.Run(async () =>
        {
            try
            {
                var syncRes = await CentralSyncService.SyncSessionToCentralDetailedAsync(
                    currentMachineId,
                    currentSessionId,
                    userIdentifier,
                    curPlastic,
                    curCan,
                    curPaper,
                    0, // glass
                    curPoints,
                    0.0,
                    result.Size,
                    result.Material,
                    pSmall, pMed, pLg,
                    cSmall, cMed, cLg
                );

                if (syncRes.IsSuccess)
                {
                    LogTelemetry($"[LIVE SYNC 🟢] Accepted item synced to Central Server ({curItems} items, {curPoints} pts)");
                }
                else
                {
                    LogTelemetry($"[LIVE SYNC NOTE 🟡] Central response: HTTP {syncRes.StatusCode} - {syncRes.Message}");
                }
            }
            catch (Exception syncEx)
            {
                LogTelemetry($"[LIVE SYNC ERROR] {syncEx.Message}");
            }
        });
    }

    private int GetPoints(BottleResult result)
    {
        // 1. Check live synced PointRulesCache first
        int cached = PointRulesCache.GetPoints(result.Size, result.Material);
        if (cached > 0) return cached;

        // 2. Check local database
        if (databaseAvailable)
        {
            try
            {
                int dbPts = DatabaseManager.GetPoints(result.Size, result.Material);
                if (dbPts > 0) return dbPts;
            }
            catch
            {
                databaseAvailable = false;
            }
        }

        // 3. Fallback defaults
        return result.Size switch
        {
            "SMALL" => 5,
            "MEDIUM" => 10,
            "LARGE" => 15,
            _ => 5
        };
    }

    public void CompleteSessionToWallet()
    {
        _inactivityCountdownTimer.Stop();
        _startHandshakeTimer.Stop();

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

        // Allow wallet entry if either local SQL DB or Central Network API is available, or in Demo Mode
        bool localDbOk = databaseAvailable || RefreshDatabaseConnection();
        bool centralNetOk = HeartbeatService.CurrentStatus == NetworkStatus.Online;

        if (!localDbOk && !centralNetOk && !IsDemoMode)
        {
            StatusText.Text = "Wallet unavailable";
            StatusText.Foreground = Brushes.OrangeRed;
            BottleInfoText.Text = "Connect local DB or Central Network before crediting a wallet";
            return;
        }

        string currentSessionId = sessionId.ToString();
        int currentTotalItems = totalItems;
        int currentTotalPoints = totalPoints;

        int pSmall = plasticSmallCount;
        int pMed = plasticMediumCount;
        int pLg = plasticLargeCount;
        int cSmall = canSmallCount;
        int cMed = canMediumCount;
        int cLg = canLargeCount;
        int tpSmall = tetraPakSmallCount;
        int tpMed = tetraPakMediumCount;
        int tpLg = tetraPakLargeCount;

        int plasticCount = pSmall + pMed + pLg;
        int canCount = cSmall + cMed + cLg;
        int paperCount = tpSmall + tpMed + tpLg;

        string phoneNumber;
        int userRating = 5;
        string userFeedback = "";
        bool feedbackSubmitted = false;

        if (!string.IsNullOrWhiteSpace(activeUserMobile))
        {
            // Touchless flow: Citizen scanned QR to authenticate upfront!
            phoneNumber = activeUserMobile;
            var ratingWindow = new RatingFeedbackWindow(phoneNumber, currentTotalPoints, currentTotalItems)
            {
                Owner = this
            };
            ratingWindow.ShowDialog();
            userRating = ratingWindow.Rating;
            userFeedback = ratingWindow.FeedbackText;
            feedbackSubmitted = ratingWindow.FeedbackSubmitted;
            LogTelemetry($"[TOUCHLESS 🚀] Auto-claiming session for QR user: {phoneNumber} (+{currentTotalPoints} pts)");
        }
        else
        {
            // Manual Keypad flow (Key 0 or Guest)
            var walletWindow = new WalletPhoneWindow(
                totalItems,
                totalPoints,
                settings.MachineId,
                currentSessionId,
                plasticCount,
                canCount,
                paperCount)
            {
                Owner = this
            };

            if (walletWindow.ShowDialog() is not true || string.IsNullOrWhiteSpace(walletWindow.PhoneNumber))
            {
                StopMachine();
                StatusText.Text = "Session closed without claiming";
                StatusText.Foreground = Brushes.SlateGray;
                BottleInfoText.Text = "Session ended without claiming points.";
                return;
            }

            phoneNumber = walletWindow.PhoneNumber;
            userRating = walletWindow.Rating;
            userFeedback = walletWindow.FeedbackText;
            feedbackSubmitted = walletWindow.FeedbackSubmitted;
            activeUserMobile = phoneNumber;
        }

        // 1. Credit Local SQL Database if available
        if (localDbOk)
        {
            try
            {
                DatabaseManager.CreditWallet(phoneNumber, currentTotalPoints, sessionId);
                RefreshLeaderboard();
                LogTelemetry($"[LOCAL DB 🟢] Credited {currentTotalPoints} point(s) to {phoneNumber}");

                if (feedbackSubmitted)
                {
                    DatabaseManager.SaveFeedback(settings.MachineId, phoneNumber, userRating, userFeedback, sessionId);
                    LogTelemetry($"[LOCAL DB ⭐] Saved citizen feedback: {userFeedback} ({userRating} stars) for {phoneNumber}");
                }
            }
            catch (Exception ex)
            {
                LogTelemetry($"[LOCAL DB WARN 🟡] Could not write local SQL: {ex.Message}");
            }
        }
        else if (IsDemoMode)
        {
            LogTelemetry($"[DEMO ⭐] Citizen {phoneNumber} completed session: {currentTotalPoints} pts, Rated {userRating}★ ({userFeedback})");
        }

        // 2. Synchronize Recycling Session & Feedback to Central Master Server API
        _ = Task.Run(async () =>
        {
            try
            {
                int plasticCount = pSmall + pMed + pLg;
                int canCount = cSmall + cMed + cLg;
                int paperCount = tpSmall + tpMed + tpLg;

                var syncRes = await CentralSyncService.SyncSessionToCentralDetailedAsync(
                    settings.MachineId,
                    currentSessionId,
                    phoneNumber,
                    plasticCount,
                    canCount,
                    paperCount, // paperCount
                    0, // glassCount
                    currentTotalPoints,
                    0.0, // weightKg
                    "MEDIUM",
                    "PLASTIC",
                    pSmall,
                    pMed,
                    pLg,
                    cSmall,
                    cMed,
                    cLg
                );

                if (syncRes.IsSuccess)
                {
                    LogTelemetry($"[CENTRAL SYNC 🟢] Session for user {phoneNumber} (+{currentTotalPoints} pts, {currentTotalItems} items) successfully synced to Central Server!");
                }
                else
                {
                    LogTelemetry($"[CENTRAL SYNC 🔴] Session sync failed: HTTP {syncRes.StatusCode} - {syncRes.Message}");
                }

                if (feedbackSubmitted)
                {
                    var fbSyncRes = await CentralSyncService.SyncFeedbackToCentralAsync(
                        settings.MachineId,
                        phoneNumber,
                        userRating,
                        userFeedback,
                        currentSessionId
                    );
                    if (fbSyncRes.IsSuccess)
                    {
                        LogTelemetry($"[FEEDBACK SYNC 🟢] Feedback '{userFeedback}' for user {phoneNumber} synced to Central Cloud!");
                    }
                }
            }
            catch (Exception syncEx)
            {
                LogTelemetry($"[CENTRAL SYNC ERROR 🔴] {syncEx.Message}");
            }
        });

        StopMachine();
        StatusText.Text = "Wallet credited & session completed";
        StatusText.Foreground = Brushes.LimeGreen;
        BottleInfoText.Text = feedbackSubmitted
            ? $"{currentTotalPoints} pts credited to {phoneNumber} · Rated {userRating}★ ({userFeedback})"
            : $"{currentTotalPoints} points sent to wallet {phoneNumber}";
        ResetSession();
        SimulatorStateChanged?.Invoke();
    }

    public void ResetSession()
    {
        activeUserMobile = null;
        if (UserGreetingBanner != null) UserGreetingBanner.Visibility = Visibility.Collapsed;
        _ = CentralSyncService.ResetKioskStartHandshakeAsync(settings.MachineId);
        _ = RegisterStartHandshakeAsync();
        if (!_startHandshakeTimer.IsEnabled) _startHandshakeTimer.Start();

        sessionId = Guid.NewGuid();
        totalItems = totalPoints = plasticSmallCount = plasticMediumCount = plasticLargeCount =
            canSmallCount = canMediumCount = canLargeCount = tetraPakSmallCount = tetraPakMediumCount = tetraPakLargeCount = rejectedCount = 0;
        TotalItemsText.Text = PlasticSmallCountText.Text = PlasticMediumCountText.Text = PlasticLargeCountText.Text =
            CanSmallCountText.Text = CanMediumCountText.Text = CanLargeCountText.Text =
            TetraPakSmallCountText.Text = TetraPakMediumCountText.Text = TetraPakLargeCountText.Text = RejectedCountText.Text =
            PlasticTotalCountText.Text = CanTotalCountText.Text = TetraPakTotalCountText.Text = RejectedTotalCountText.Text = "0";
        TotalPointsText.Text = "0";
        UpdateImpactMetrics();
        SimulatorStateChanged?.Invoke();
    }

    private void IncrementMaterialSizeCounter(string material, string size)
    {
        if (material.Equals("PLASTIC", StringComparison.OrdinalIgnoreCase))
        {
            if (size == "SMALL") PlasticSmallCountText.Text = (++plasticSmallCount).ToString();
            else if (size == "MEDIUM") PlasticMediumCountText.Text = (++plasticMediumCount).ToString();
            else if (size == "LARGE") PlasticLargeCountText.Text = (++plasticLargeCount).ToString();
            PlasticTotalCountText.Text = (plasticSmallCount + plasticMediumCount + plasticLargeCount).ToString();
        }
        else if (material.Contains("CAN", StringComparison.OrdinalIgnoreCase) || material.Contains("METAL", StringComparison.OrdinalIgnoreCase) || material.Contains("ALUMINIUM", StringComparison.OrdinalIgnoreCase))
        {
            if (size == "SMALL") CanSmallCountText.Text = (++canSmallCount).ToString();
            else if (size == "MEDIUM") CanMediumCountText.Text = (++canMediumCount).ToString();
            else if (size == "LARGE") CanLargeCountText.Text = (++canLargeCount).ToString();
            CanTotalCountText.Text = (canSmallCount + canMediumCount + canLargeCount).ToString();
        }
        else if (material.Contains("UBC", StringComparison.OrdinalIgnoreCase) || material.Contains("TETRA", StringComparison.OrdinalIgnoreCase) || material.Contains("CARTON", StringComparison.OrdinalIgnoreCase) || material.Contains("PAPER", StringComparison.OrdinalIgnoreCase))
        {
            if (size == "SMALL") TetraPakSmallCountText.Text = (++tetraPakSmallCount).ToString();
            else if (size == "MEDIUM") TetraPakMediumCountText.Text = (++tetraPakMediumCount).ToString();
            else if (size == "LARGE") TetraPakLargeCountText.Text = (++tetraPakLargeCount).ToString();
            TetraPakTotalCountText.Text = (tetraPakSmallCount + tetraPakMediumCount + tetraPakLargeCount).ToString();
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

                case "MATERIAL":
                    string parsedMat = pair[1].ToUpperInvariant();
                    if (!string.IsNullOrWhiteSpace(parsedMat))
                    {
                        result.Material = parsedMat;
                    }
                    break;

                case "METAL":
                    if (string.IsNullOrEmpty(result.Material))
                    {
                        result.Material = pair[1] == "1" ? "CAN" : "PLASTIC";
                    }
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
