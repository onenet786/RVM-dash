using System;
using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Effects;
using System.Windows.Threading;

namespace RVMDesktopApp;

/// <summary>
/// Dedicated Hardware Simulator & Demo Testing Window.
/// Enables full end-to-end kiosk testing without physical Arduino or sensors:
/// 1. Press '0' to start session.
/// 2. Select Container Type (Bottle / Can / UBC).
/// 3. Select Size (Small / Medium / Large).
/// 4. Click Accept (plays celebration video & increments points) or Reject.
/// 5. Press Enter to launch mobile phone input -> 5-star rating -> thank you screen -> reset.
/// </summary>
public sealed class DemoTestingWindow : Window
{
    private static DemoTestingWindow? _instance;
    private readonly IKioskSimulatorTarget _target;

    // Selections
    private string _selectedMaterial = "PLASTIC"; // PLASTIC, CAN, UBC
    private string _selectedSize = "MEDIUM";      // SMALL, MEDIUM, LARGE

    // Visual Controls - Status Card
    private readonly Border _statusBadgeBorder = new();
    private readonly TextBlock _statusBadgeText = new();
    private readonly TextBlock _txtItems = new();
    private readonly TextBlock _txtPoints = new();
    private readonly TextBlock _txtRejects = new();
    private readonly TextBlock _txtMachineState = new();

    // Visual Controls - Step 1: Start Button
    private readonly Button _btnStartStop = new();
    private readonly TextBlock _txtStartStopLabel = new();
    private readonly TextBlock _txtStartStopSub = new();

    // Visual Controls - Step 2: Material Cards
    private readonly Border _cardBottle = new();
    private readonly Border _cardCan = new();
    private readonly Border _cardUbc = new();

    // Visual Controls - Step 3: Size Pills
    private readonly Border _pillSmall = new();
    private readonly Border _pillMedium = new();
    private readonly Border _pillLarge = new();

    // Activity Log
    private readonly ObservableCollection<string> _logItems = [];
    private readonly ListBox _logListBox = new();

    public DemoTestingWindow(IKioskSimulatorTarget target)
    {
        _target = target ?? throw new ArgumentNullException(nameof(target));
        _target.IsDemoMode = true;

        Title = "RVM Kiosk Hardware Simulator & Demo Testing Panel";
        Width = 780;
        Height = 860;
        MinWidth = 700;
        MinHeight = 720;
        WindowStartupLocation = WindowStartupLocation.CenterScreen;
        Background = new SolidColorBrush(Color.FromRgb(11, 17, 32)); // #0B1120
        Foreground = Brushes.White;
        Topmost = false;

        BuildUi();

        _target.SimulatorStateChanged += OnTargetStateChanged;
        Closed += OnWindowClosed;
        PreviewKeyDown += OnWindowPreviewKeyDown;

        Log($"[SIMULATOR] Attached to {target.AsWindow.GetType().Name} in Demo Mode");
        UpdateDisplayState();
    }

    public static DemoTestingWindow OpenOrBringToFront(IKioskSimulatorTarget target)
    {
        if (_instance != null && _instance.IsLoaded)
        {
            _instance.Activate();
            _instance.Focus();
            return _instance;
        }

        _instance = new DemoTestingWindow(target);
        _instance.Show();
        return _instance;
    }

    private void BuildUi()
    {
        var mainGrid = new Grid();
        mainGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // 0: Header
        mainGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // 1: Live Status Card
        mainGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) }); // 2: Interactive Controls
        mainGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(115) }); // 3: Mini Terminal Log

        // -------------------------------------------------------------
        // ROW 0: HEADER BAR
        // -------------------------------------------------------------
        var headerBorder = new Border
        {
            Background = new SolidColorBrush(Color.FromRgb(15, 23, 42)), // #0F172A
            BorderBrush = new SolidColorBrush(Color.FromRgb(30, 41, 59)),
            BorderThickness = new Thickness(0, 0, 0, 1),
            Padding = new Thickness(16, 10, 16, 10)
        };

        var headerGrid = new Grid();
        headerGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        headerGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

        var headerTitleStack = new StackPanel { Orientation = Orientation.Horizontal };
        var iconText = new TextBlock
        {
            Text = "🎮 ",
            FontSize = 20,
            VerticalAlignment = VerticalAlignment.Center
        };
        var titleStack = new StackPanel();
        var titleText = new TextBlock
        {
            Text = "HARDWARE SIMULATOR & DEMO TESTING",
            FontWeight = FontWeights.Black,
            FontSize = 14,
            Foreground = new SolidColorBrush(Color.FromRgb(52, 211, 153)) // Emerald #34D399
        };
        var subText = new TextBlock
        {
            Text = "No Hardware Required • Test 0 (Start) ➔ Deposit (Bottle/Can/UBC) ➔ Enter (Wallet & Rating)",
            FontSize = 10,
            Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)) // Slate #94A3B8
        };
        titleStack.Children.Add(titleText);
        titleStack.Children.Add(subText);
        headerTitleStack.Children.Add(iconText);
        headerTitleStack.Children.Add(titleStack);

        // Header controls (Always on top toggle + Focus kiosk)
        var headerBtnStack = new StackPanel { Orientation = Orientation.Horizontal, VerticalAlignment = VerticalAlignment.Center };
        
        var chkTopmost = new CheckBox
        {
            Content = "📌 Always On Top",
            IsChecked = false,
            Foreground = new SolidColorBrush(Color.FromRgb(203, 213, 225)),
            FontSize = 11,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(0, 0, 12, 0),
            Cursor = Cursors.Hand
        };
        chkTopmost.Checked += (_, _) => Topmost = true;
        chkTopmost.Unchecked += (_, _) => Topmost = false;

        var btnFocusKiosk = new Button
        {
            Content = "👁 Focus Kiosk",
            Background = new SolidColorBrush(Color.FromRgb(30, 41, 59)),
            Foreground = Brushes.White,
            BorderBrush = new SolidColorBrush(Color.FromRgb(71, 85, 105)),
            BorderThickness = new Thickness(1),
            Padding = new Thickness(8, 4, 8, 4),
            FontSize = 10.5,
            FontWeight = FontWeights.Bold,
            Cursor = Cursors.Hand
        };
        btnFocusKiosk.Click += (_, _) => _target.FocusKiosk();

        headerBtnStack.Children.Add(chkTopmost);
        headerBtnStack.Children.Add(btnFocusKiosk);

        headerGrid.Children.Add(headerTitleStack);
        Grid.SetColumn(headerBtnStack, 1);
        headerGrid.Children.Add(headerBtnStack);
        headerBorder.Child = headerGrid;
        Grid.SetRow(headerBorder, 0);
        mainGrid.Children.Add(headerBorder);

        // -------------------------------------------------------------
        // ROW 1: LIVE STATUS CARD
        // -------------------------------------------------------------
        var statusCard = new Border
        {
            Background = new SolidColorBrush(Color.FromRgb(15, 23, 42)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(30, 41, 59)),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(10),
            Margin = new Thickness(14, 8, 14, 4),
            Padding = new Thickness(14, 8, 14, 8)
        };

        var statusGrid = new Grid();
        statusGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
        statusGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });

        // Status Top Row: Session indicator & current machine status
        var statusHeaderGrid = new Grid();
        statusHeaderGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
        statusHeaderGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });

        _statusBadgeBorder.CornerRadius = new CornerRadius(6);
        _statusBadgeBorder.Padding = new Thickness(10, 3, 10, 3);
        _statusBadgeBorder.Background = new SolidColorBrush(Color.FromRgb(30, 41, 59));
        _statusBadgeText.FontSize = 11;
        _statusBadgeText.FontWeight = FontWeights.Black;
        _statusBadgeText.Text = "⚪ STANDBY (PRESS 0 TO START)";
        _statusBadgeText.Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184));
        _statusBadgeBorder.Child = _statusBadgeText;

        _txtMachineState.Text = "Status: Ready";
        _txtMachineState.FontSize = 11;
        _txtMachineState.FontWeight = FontWeights.SemiBold;
        _txtMachineState.Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184));
        _txtMachineState.HorizontalAlignment = HorizontalAlignment.Right;
        _txtMachineState.VerticalAlignment = VerticalAlignment.Center;

        statusHeaderGrid.Children.Add(_statusBadgeBorder);
        Grid.SetColumn(_txtMachineState, 1);
        statusHeaderGrid.Children.Add(_txtMachineState);
        statusGrid.Children.Add(statusHeaderGrid);

        // Status Metrics Row: Items, Points, Rejects
        var metricsGrid = new UniformGrid { Columns = 3, Margin = new Thickness(0, 6, 0, 0) };

        metricsGrid.Children.Add(CreateMetricPill("ACCEPTED ITEMS", _txtItems, "#10B981"));
        metricsGrid.Children.Add(CreateMetricPill("TOTAL POINTS", _txtPoints, "#F59E0B"));
        metricsGrid.Children.Add(CreateMetricPill("REJECTED ITEMS", _txtRejects, "#EF4444"));

        Grid.SetRow(metricsGrid, 1);
        statusGrid.Children.Add(metricsGrid);
        statusCard.Child = statusGrid;
        Grid.SetRow(statusCard, 1);
        mainGrid.Children.Add(statusCard);

        // -------------------------------------------------------------
        // ROW 2: INTERACTIVE CONTROLS (Form Area)
        // -------------------------------------------------------------
        var scrollViewer = new ScrollViewer
        {
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            Margin = new Thickness(14, 2, 14, 4)
        };

        var controlsStack = new StackPanel { Margin = new Thickness(0, 0, 0, 2) };

        // ---------------------------------------------------------
        // STEP 1: PRESS 0 TO START SESSION
        // ---------------------------------------------------------
        controlsStack.Children.Add(CreateSectionHeader("STEP 1: START OR STOP SESSION", "Keypad: [ 0 ] Start • [ Ctrl+S ] Stop"));

        _btnStartStop.Background = new SolidColorBrush(Color.FromRgb(5, 150, 105)); // Emerald 600
        _btnStartStop.BorderBrush = new SolidColorBrush(Color.FromRgb(16, 185, 129));
        _btnStartStop.BorderThickness = new Thickness(1.5);
        _btnStartStop.Padding = new Thickness(14, 8, 14, 8);
        _btnStartStop.Cursor = Cursors.Hand;
        _btnStartStop.Margin = new Thickness(0, 2, 0, 6);

        var startStopContent = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Center };
        _txtStartStopLabel.Text = "▶ [ 0 ] START RECYCLING SESSION";
        _txtStartStopLabel.FontSize = 13;
        _txtStartStopLabel.FontWeight = FontWeights.Black;
        _txtStartStopLabel.Foreground = Brushes.White;
        _txtStartStopSub.Text = "  (Press 0 or click here to activate machine)";
        _txtStartStopSub.FontSize = 10.5;
        _txtStartStopSub.Foreground = new SolidColorBrush(Color.FromRgb(209, 250, 229));
        _txtStartStopSub.VerticalAlignment = VerticalAlignment.Center;
        startStopContent.Children.Add(_txtStartStopLabel);
        startStopContent.Children.Add(_txtStartStopSub);
        _btnStartStop.Content = startStopContent;
        _btnStartStop.Click += OnStartStopClicked;
        controlsStack.Children.Add(_btnStartStop);

        // ---------------------------------------------------------
        // STEP 2: SELECT CONTAINER TYPE (Bottle / Can / UBC)
        // ---------------------------------------------------------
        controlsStack.Children.Add(CreateSectionHeader("STEP 2: SELECT CONTAINER TYPE", "Classify: [ B / 1 ] Bottle • [ C / 2 ] Can • [ U / 3 ] UBC"));

        var materialGrid = new UniformGrid { Columns = 3, Margin = new Thickness(0, 2, 0, 6) };

        SetupMaterialCard(_cardBottle, "PLASTIC", "🧴 BOTTLE", "Plastic Bottle (PET / HDPE)", "DancingPlastic.mp4", "[ B ] / [ 1 ]");
        SetupMaterialCard(_cardCan, "CAN", "🥫 CAN", "Metal Can (Aluminium / Tin)", "DancingCan.mp4", "[ C ] / [ 2 ]");
        SetupMaterialCard(_cardUbc, "UBC", "🧃 UBC", "Tetra Pak (Beverage Carton)", "DancingTetra.mp4", "[ U ] / [ 3 ]");

        materialGrid.Children.Add(_cardBottle);
        materialGrid.Children.Add(_cardCan);
        materialGrid.Children.Add(_cardUbc);
        controlsStack.Children.Add(materialGrid);

        // ---------------------------------------------------------
        // STEP 3: SELECT CONTAINER SIZE (Small / Medium / Large)
        // ---------------------------------------------------------
        controlsStack.Children.Add(CreateSectionHeader("STEP 3: SELECT CONTAINER SIZE", "Measure: [ S ] Small • [ M ] Medium • [ L ] Large"));

        var sizeGrid = new UniformGrid { Columns = 3, Margin = new Thickness(0, 2, 0, 6) };

        SetupSizePill(_pillSmall, "SMALL", "Small", "250ml - 350ml", "+10 Pts", "[ S ]");
        SetupSizePill(_pillMedium, "MEDIUM", "Medium", "500ml - 750ml", "+20 Pts", "[ M ]");
        SetupSizePill(_pillLarge, "LARGE", "Large", "1.0L - 2.0L", "+30 Pts", "[ L ]");

        sizeGrid.Children.Add(_pillSmall);
        sizeGrid.Children.Add(_pillMedium);
        sizeGrid.Children.Add(_pillLarge);
        controlsStack.Children.Add(sizeGrid);

        // ---------------------------------------------------------
        // STEP 4: SIMULATE DROP ACTION (Accept & Play Video OR Reject)
        // ---------------------------------------------------------
        controlsStack.Children.Add(CreateSectionHeader("STEP 4: SIMULATE DROP OUTCOME", "Outcome: [ A / Space ] Accept • [ R ] Reject"));

        var actionGrid = new UniformGrid { Columns = 2, Margin = new Thickness(0, 2, 0, 6) };

        // Accept Button
        var btnAccept = new Button
        {
            Background = new SolidColorBrush(Color.FromRgb(16, 185, 129)), // #10B981
            BorderBrush = new SolidColorBrush(Color.FromRgb(52, 211, 153)),
            BorderThickness = new Thickness(2),
            Padding = new Thickness(12, 7, 12, 7),
            Margin = new Thickness(0, 0, 4, 0),
            Cursor = Cursors.Hand
        };
        var acceptStack = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Center };
        var txtAcceptTitle = new TextBlock
        {
            Text = "✅ ACCEPT CONTAINER",
            FontWeight = FontWeights.Black,
            FontSize = 12.5,
            Foreground = Brushes.White,
            VerticalAlignment = VerticalAlignment.Center
        };
        var txtAcceptSub = new TextBlock
        {
            Text = "  (Plays Video & Credits Points) [ A / Space ]",
            FontSize = 9.5,
            Foreground = new SolidColorBrush(Color.FromRgb(220, 252, 231)),
            VerticalAlignment = VerticalAlignment.Center
        };
        acceptStack.Children.Add(txtAcceptTitle);
        acceptStack.Children.Add(txtAcceptSub);
        btnAccept.Content = acceptStack;
        btnAccept.Click += (_, _) => SimulateDrop(accept: true);

        // Reject Button
        var btnReject = new Button
        {
            Background = new SolidColorBrush(Color.FromRgb(220, 38, 38)), // #DC2626
            BorderBrush = new SolidColorBrush(Color.FromRgb(248, 113, 113)),
            BorderThickness = new Thickness(2),
            Padding = new Thickness(12, 7, 12, 7),
            Margin = new Thickness(4, 0, 0, 0),
            Cursor = Cursors.Hand
        };
        var rejectStack = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Center };
        var txtRejectTitle = new TextBlock
        {
            Text = "❌ REJECT CONTAINER",
            FontWeight = FontWeights.Black,
            FontSize = 12.5,
            Foreground = Brushes.White,
            VerticalAlignment = VerticalAlignment.Center
        };
        var txtRejectSub = new TextBlock
        {
            Text = "  (Simulates Invalid Item) [ R ]",
            FontSize = 9.5,
            Foreground = new SolidColorBrush(Color.FromRgb(254, 226, 226)),
            VerticalAlignment = VerticalAlignment.Center
        };
        rejectStack.Children.Add(txtRejectTitle);
        rejectStack.Children.Add(txtRejectSub);
        btnReject.Content = rejectStack;
        btnReject.Click += (_, _) => SimulateDrop(accept: false);

        actionGrid.Children.Add(btnAccept);
        actionGrid.Children.Add(btnReject);
        controlsStack.Children.Add(actionGrid);

        // ---------------------------------------------------------
        // STEP 5: FINISH SESSION & CREDIT WALLET (Enter)
        // ---------------------------------------------------------
        controlsStack.Children.Add(CreateSectionHeader("STEP 5: COMPLETE & CREDIT WALLET", "Keypad [ Enter ] -> Mobile & Rating"));

        var btnFinish = new Button
        {
            Background = new SolidColorBrush(Color.FromRgb(217, 119, 6)), // Amber 600
            BorderBrush = new SolidColorBrush(Color.FromRgb(245, 158, 11)),
            BorderThickness = new Thickness(2),
            Padding = new Thickness(14, 8, 14, 8),
            Cursor = Cursors.Hand,
            Margin = new Thickness(0, 2, 0, 4)
        };
        var finishStack = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Center };
        var txtFinishIcon = new TextBlock { Text = "💳 ", FontSize = 15, VerticalAlignment = VerticalAlignment.Center };
        var txtFinishTitle = new TextBlock
        {
            Text = "FINISH & CREDIT WALLET  [ PRESS ENTER ]",
            FontSize = 13,
            FontWeight = FontWeights.Black,
            Foreground = Brushes.White,
            VerticalAlignment = VerticalAlignment.Center
        };
        var txtFinishSub = new TextBlock
        {
            Text = "  ➔ Mobile (03xxxxxxxxx) ➔ ★★★★★ 5-Star Feedback",
            FontSize = 10,
            Foreground = new SolidColorBrush(Color.FromRgb(254, 243, 199)),
            VerticalAlignment = VerticalAlignment.Center
        };
        finishStack.Children.Add(txtFinishIcon);
        finishStack.Children.Add(txtFinishTitle);
        finishStack.Children.Add(txtFinishSub);
        btnFinish.Content = finishStack;
        btnFinish.Click += OnFinishClicked;
        controlsStack.Children.Add(btnFinish);

        // Keyboard Cheat Sheet Banner
        var cheatSheetBorder = new Border
        {
            Background = new SolidColorBrush(Color.FromRgb(15, 23, 42)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(30, 41, 59)),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(6),
            Padding = new Thickness(10, 4, 10, 4),
            Margin = new Thickness(0, 2, 0, 2)
        };
        var txtCheat = new TextBlock
        {
            Text = "⌨️ Hotkeys: [0] Start · [B/C/U] Material · [S/M/L] Size · [A/Space] Accept · [R] Reject · [Enter] Finish & Wallet",
            FontSize = 9.5,
            FontWeight = FontWeights.SemiBold,
            Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)),
            HorizontalAlignment = HorizontalAlignment.Center
        };
        cheatSheetBorder.Child = txtCheat;
        controlsStack.Children.Add(cheatSheetBorder);

        scrollViewer.Content = controlsStack;
        Grid.SetRow(scrollViewer, 2);
        mainGrid.Children.Add(scrollViewer);

        // -------------------------------------------------------------
        // ROW 3: MINI TERMINAL ACTIVITY LOG
        // -------------------------------------------------------------
        var logBorder = new Border
        {
            Background = new SolidColorBrush(Color.FromRgb(3, 7, 18)), // #030712
            BorderBrush = new SolidColorBrush(Color.FromRgb(30, 41, 59)),
            BorderThickness = new Thickness(0, 1, 0, 0),
            Padding = new Thickness(12, 6, 12, 6)
        };

        var logGrid = new Grid();
        logGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
        logGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });

        var logHeader = new Grid();
        var txtLogTitle = new TextBlock
        {
            Text = "SIMULATOR ACTIVITY LOG 📡",
            FontSize = 10,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(100, 116, 139))
        };
        var btnClearLog = new TextBlock
        {
            Text = "Clear Log",
            FontSize = 10,
            Foreground = new SolidColorBrush(Color.FromRgb(56, 189, 248)),
            HorizontalAlignment = HorizontalAlignment.Right,
            Cursor = Cursors.Hand
        };
        btnClearLog.MouseDown += (_, _) => _logItems.Clear();
        logHeader.Children.Add(txtLogTitle);
        logHeader.Children.Add(btnClearLog);
        logGrid.Children.Add(logHeader);

        _logListBox.ItemsSource = _logItems;
        _logListBox.Background = Brushes.Transparent;
        _logListBox.BorderThickness = new Thickness(0);
        _logListBox.FontFamily = new FontFamily("Consolas, Courier New, Segoe UI");
        _logListBox.FontSize = 10;
        _logListBox.Foreground = new SolidColorBrush(Color.FromRgb(203, 213, 225));
        Grid.SetRow(_logListBox, 1);
        logGrid.Children.Add(_logListBox);

        logBorder.Child = logGrid;
        Grid.SetRow(logBorder, 3);
        mainGrid.Children.Add(logBorder);

        Content = mainGrid;

        // Apply initial material and size styling
        RefreshMaterialCardsVisual();
        RefreshSizePillsVisual();
    }

    private static Border CreateMetricPill(string label, TextBlock valueText, string colorHex)
    {
        var border = new Border
        {
            Background = new SolidColorBrush(Color.FromRgb(24, 33, 47)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(45, 55, 72)),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(7),
            Padding = new Thickness(8, 6, 8, 6),
            Margin = new Thickness(3, 0, 3, 0)
        };
        var stack = new StackPanel { HorizontalAlignment = HorizontalAlignment.Center };
        var lbl = new TextBlock
        {
            Text = label,
            FontSize = 8.5,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)),
            HorizontalAlignment = HorizontalAlignment.Center
        };
        valueText.Text = "0";
        valueText.FontSize = 18;
        valueText.FontWeight = FontWeights.Black;
        valueText.Foreground = (SolidColorBrush)new BrushConverter().ConvertFromString(colorHex)!;
        valueText.HorizontalAlignment = HorizontalAlignment.Center;
        stack.Children.Add(lbl);
        stack.Children.Add(valueText);
        border.Child = stack;
        return border;
    }

    private static Grid CreateSectionHeader(string title, string shortcut)
    {
        var grid = new Grid { Margin = new Thickness(0, 5, 0, 3) };
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

        var t = new TextBlock
        {
            Text = title,
            FontWeight = FontWeights.Black,
            FontSize = 11,
            Foreground = new SolidColorBrush(Color.FromRgb(226, 232, 240)),
            VerticalAlignment = VerticalAlignment.Center
        };
        var s = new TextBlock
        {
            Text = shortcut,
            FontSize = 9.5,
            Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)),
            VerticalAlignment = VerticalAlignment.Center
        };
        grid.Children.Add(t);
        Grid.SetColumn(s, 1);
        grid.Children.Add(s);
        return grid;
    }

    private void SetupMaterialCard(Border card, string materialKey, string title, string sub, string videoFile, string hotkey)
    {
        card.CornerRadius = new CornerRadius(8);
        card.Padding = new Thickness(10, 8, 10, 8);
        card.Margin = new Thickness(4, 0, 4, 0);
        card.Cursor = Cursors.Hand;
        card.Tag = materialKey;

        var stack = new StackPanel { HorizontalAlignment = HorizontalAlignment.Center };
        
        var headerStack = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Center };
        var t = new TextBlock
        {
            Text = title,
            FontWeight = FontWeights.Black,
            FontSize = 12.5,
            Foreground = Brushes.White,
            VerticalAlignment = VerticalAlignment.Center
        };
        var hk = new TextBlock
        {
            Text = $"  {hotkey}",
            FontSize = 9,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(245, 158, 11)),
            VerticalAlignment = VerticalAlignment.Center
        };
        headerStack.Children.Add(t);
        headerStack.Children.Add(hk);

        var s = new TextBlock
        {
            Text = sub,
            FontSize = 9,
            Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)),
            HorizontalAlignment = HorizontalAlignment.Center,
            TextAlignment = TextAlignment.Center,
            Margin = new Thickness(0, 2, 0, 0)
        };
        var v = new TextBlock
        {
            Text = $"▶ {videoFile}",
            FontSize = 8.5,
            FontWeight = FontWeights.SemiBold,
            Foreground = new SolidColorBrush(Color.FromRgb(56, 189, 248)),
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 2, 0, 0)
        };

        stack.Children.Add(headerStack);
        stack.Children.Add(s);
        stack.Children.Add(v);
        card.Child = stack;

        card.MouseDown += (_, _) =>
        {
            _selectedMaterial = materialKey;
            RefreshMaterialCardsVisual();
            Log($"[SELECT] Material selected: {_selectedMaterial}");
        };
    }

    private void SetupSizePill(Border pill, string sizeKey, string title, string range, string pts, string hotkey)
    {
        pill.CornerRadius = new CornerRadius(8);
        pill.Padding = new Thickness(10, 6, 10, 6);
        pill.Margin = new Thickness(4, 0, 4, 0);
        pill.Cursor = Cursors.Hand;
        pill.Tag = sizeKey;

        var stack = new StackPanel { HorizontalAlignment = HorizontalAlignment.Center };
        
        var topStack = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Center };
        var t = new TextBlock
        {
            Text = title,
            FontWeight = FontWeights.Black,
            FontSize = 12,
            Foreground = Brushes.White,
            VerticalAlignment = VerticalAlignment.Center
        };
        var hk = new TextBlock
        {
            Text = $"  {hotkey}",
            FontSize = 9,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(245, 158, 11)),
            VerticalAlignment = VerticalAlignment.Center
        };
        topStack.Children.Add(t);
        topStack.Children.Add(hk);

        var bottomStack = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Center, Margin = new Thickness(0, 2, 0, 0) };
        var r = new TextBlock
        {
            Text = range,
            FontSize = 9,
            Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)),
            VerticalAlignment = VerticalAlignment.Center
        };
        var p = new TextBlock
        {
            Text = $"  •  {pts}",
            FontSize = 9.5,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(52, 211, 153)),
            VerticalAlignment = VerticalAlignment.Center
        };
        bottomStack.Children.Add(r);
        bottomStack.Children.Add(p);

        stack.Children.Add(topStack);
        stack.Children.Add(bottomStack);
        pill.Child = stack;

        pill.MouseDown += (_, _) =>
        {
            _selectedSize = sizeKey;
            RefreshSizePillsVisual();
            Log($"[SELECT] Size selected: {_selectedSize}");
        };
    }

    private void RefreshMaterialCardsVisual()
    {
        ApplyCardStyle(_cardBottle, _selectedMaterial == "PLASTIC", Color.FromRgb(14, 165, 233));
        ApplyCardStyle(_cardCan, _selectedMaterial == "CAN", Color.FromRgb(234, 88, 12));
        ApplyCardStyle(_cardUbc, _selectedMaterial == "UBC", Color.FromRgb(168, 85, 247));
    }

    private void RefreshSizePillsVisual()
    {
        ApplyCardStyle(_pillSmall, _selectedSize == "SMALL", Color.FromRgb(16, 185, 129));
        ApplyCardStyle(_pillMedium, _selectedSize == "MEDIUM", Color.FromRgb(245, 158, 11));
        ApplyCardStyle(_pillLarge, _selectedSize == "LARGE", Color.FromRgb(239, 68, 68));
    }

    private static void ApplyCardStyle(Border card, bool isSelected, Color accentColor)
    {
        if (isSelected)
        {
            card.Background = new SolidColorBrush(Color.FromArgb(50, accentColor.R, accentColor.G, accentColor.B));
            card.BorderBrush = new SolidColorBrush(accentColor);
            card.BorderThickness = new Thickness(2);
            card.Effect = new DropShadowEffect
            {
                Color = accentColor,
                BlurRadius = 12,
                ShadowDepth = 0,
                Opacity = 0.55
            };
        }
        else
        {
            card.Background = new SolidColorBrush(Color.FromRgb(19, 27, 43));
            card.BorderBrush = new SolidColorBrush(Color.FromRgb(40, 53, 76));
            card.BorderThickness = new Thickness(1);
            card.Effect = null;
        }
    }

    private void OnStartStopClicked(object sender, RoutedEventArgs e)
    {
        if (_target.IsMachineStarted)
        {
            _target.StopMachine();
            Log("[ACTION] Stopped recycling session.");
        }
        else
        {
            _target.StartMachine(forceSimulator: true);
            Log("[ACTION] Started recycling session (Simulated citizen pressed '0').");
        }
        UpdateDisplayState();
    }

    private void SimulateDrop(bool accept)
    {
        if (!_target.IsMachineStarted)
        {
            Log("[AUTO-START] Machine was idle. Auto-starting session in demo mode...");
            _target.StartMachine(forceSimulator: true);
        }

        string mat = _selectedMaterial;
        string sz = _selectedSize;

        if (accept)
        {
            string vidName = mat == "PLASTIC" ? "DancingPlastic.mp4" : (mat == "CAN" ? "DancingCan.mp4" : "DancingTetra.mp4");
            Log($"[DROP ACCEPT] Simulating deposit: {sz} {mat} -> Celebration Video ({vidName}) playing!");
            _target.SimulateItemDeposit(mat, sz, accept: true);
        }
        else
        {
            Log($"[DROP REJECT] Simulating sensor reject for {sz} {mat}. Rejection alert displayed.");
            _target.SimulateItemDeposit(mat, sz, accept: false);
        }

        UpdateDisplayState();
    }

    private void OnFinishClicked(object sender, RoutedEventArgs e)
    {
        if (!_target.IsMachineStarted)
        {
            Log("[WARNING] Cannot finish session: Machine is not started. Press '0' and deposit items first!");
            return;
        }

        if (_target.TotalItems == 0)
        {
            Log("[WARNING] No items deposited yet. Please accept at least one container before crediting wallet.");
            return;
        }

        Log("[WALLET] Triggering finish session (Enter pressed) -> Mobile Phone & Rating flow launching on kiosk...");
        _target.CompleteSessionToWallet();
        UpdateDisplayState();
    }

    private void UpdateDisplayState()
    {
        Dispatcher.InvokeAsync(() =>
        {
            bool running = _target.IsMachineStarted;
            _txtItems.Text = _target.TotalItems.ToString();
            _txtPoints.Text = _target.TotalPoints.ToString();
            _txtRejects.Text = _target.RejectedCount.ToString();
            _txtMachineState.Text = $"Status: {_target.MachineStatus}";

            if (running)
            {
                _statusBadgeBorder.Background = new SolidColorBrush(Color.FromRgb(6, 78, 59));
                _statusBadgeText.Text = "🟢 SESSION ACTIVE (INSERTING CONTAINERS)";
                _statusBadgeText.Foreground = new SolidColorBrush(Color.FromRgb(110, 231, 183));

                _btnStartStop.Background = new SolidColorBrush(Color.FromRgb(185, 28, 28));
                _btnStartStop.BorderBrush = new SolidColorBrush(Color.FromRgb(239, 68, 68));
                _txtStartStopLabel.Text = "⏹ [ S ] STOP / RESET SESSION";
                _txtStartStopSub.Text = "  (Click or press S)";
            }
            else
            {
                _statusBadgeBorder.Background = new SolidColorBrush(Color.FromRgb(30, 41, 59));
                _statusBadgeText.Text = "⚪ STANDBY (PRESS 0 TO START)";
                _statusBadgeText.Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184));

                _btnStartStop.Background = new SolidColorBrush(Color.FromRgb(5, 150, 105));
                _btnStartStop.BorderBrush = new SolidColorBrush(Color.FromRgb(16, 185, 129));
                _txtStartStopLabel.Text = "▶ [ 0 ] START RECYCLING SESSION";
                _txtStartStopSub.Text = "  (Press 0 or click here)";
            }
        });
    }

    private void OnTargetStateChanged()
    {
        UpdateDisplayState();
    }

    private void OnWindowPreviewKeyDown(object sender, KeyEventArgs e)
    {
        switch (e.Key)
        {
            case Key.D0:
            case Key.NumPad0:
                if (!_target.IsMachineStarted)
                {
                    _target.StartMachine(forceSimulator: true);
                    Log("[KEYPAD] '0' pressed -> Session Started.");
                    UpdateDisplayState();
                    e.Handled = true;
                }
                break;

            case Key.B:
            case Key.D1:
            case Key.NumPad1:
                _selectedMaterial = "PLASTIC";
                RefreshMaterialCardsVisual();
                Log("[KEY] 'B' / '1' -> Selected Bottle (Plastic)");
                e.Handled = true;
                break;

            case Key.C:
            case Key.D2:
            case Key.NumPad2:
                _selectedMaterial = "CAN";
                RefreshMaterialCardsVisual();
                Log("[KEY] 'C' / '2' -> Selected Can (Metal)");
                e.Handled = true;
                break;

            case Key.U:
            case Key.D3:
            case Key.NumPad3:
                _selectedMaterial = "UBC";
                RefreshMaterialCardsVisual();
                Log("[KEY] 'U' / '3' -> Selected UBC (Tetra Pak)");
                e.Handled = true;
                break;

            case Key.S:
                if (Keyboard.Modifiers.HasFlag(ModifierKeys.Control))
                {
                    _target.StopMachine();
                    Log("[KEY] Ctrl+S -> Session stopped");
                }
                else
                {
                    _selectedSize = "SMALL";
                    RefreshSizePillsVisual();
                    Log("[KEY] 'S' -> Selected Small size");
                }
                e.Handled = true;
                break;

            case Key.M:
                _selectedSize = "MEDIUM";
                RefreshSizePillsVisual();
                Log("[KEY] 'M' -> Selected Medium size");
                e.Handled = true;
                break;

            case Key.L:
                _selectedSize = "LARGE";
                RefreshSizePillsVisual();
                Log("[KEY] 'L' -> Selected Large size");
                e.Handled = true;
                break;

            case Key.A:
            case Key.Space:
                SimulateDrop(accept: true);
                e.Handled = true;
                break;

            case Key.R:
                SimulateDrop(accept: false);
                e.Handled = true;
                break;

            case Key.Enter:
                OnFinishClicked(sender, e);
                e.Handled = true;
                break;

            case Key.Escape:
                Close();
                e.Handled = true;
                break;
        }
    }

    private void Log(string message)
    {
        Dispatcher.InvokeAsync(() =>
        {
            string entry = $"{DateTime.Now:HH:mm:ss} {message}";
            _logItems.Add(entry);
            if (_logItems.Count > 150)
            {
                _logItems.RemoveAt(0);
            }
            if (_logListBox.Items.Count > 0)
            {
                _logListBox.ScrollIntoView(_logListBox.Items[^1]);
            }
        });
    }

    private void OnWindowClosed(object? sender, EventArgs e)
    {
        _target.SimulatorStateChanged -= OnTargetStateChanged;
        if (ReferenceEquals(_instance, this))
        {
            _instance = null;
        }
    }
}
