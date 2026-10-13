using System;
using System.Linq;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Threading;

namespace RVMDesktopApp;

/// <summary>
/// Universal Kiosk Keypad & Mouse Emulation Helper.
/// Supports:
/// - Numpad '*' as Escape to close open dialogs
/// - '/' (Divide) to switch between Keypad Mode (NumLock ON) and Mouse Mode (NumLock OFF, arrow keys move mouse pointer)
/// - Directional cursor movement with speed acceleration on arrow keys
/// - Left-click on 5 (Center / Clear) and Enter
/// - Right-click on 0 (Insert) and Decimal / Delete
/// - Global class-level key routing so shortcuts work across all open windows and dialogs
/// </summary>
public static class KioskNumpadHelper
{
    [DllImport("user32.dll", SetLastError = true)]
    private static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    [DllImport("user32.dll")]
    private static extern short GetKeyState(int nVirtKey);

    [StructLayout(LayoutKind.Sequential)]
    public struct POINT
    {
        public int X;
        public int Y;
    }

    [DllImport("user32.dll")]
    public static extern bool GetCursorPos(out POINT lpPoint);

    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);

    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, UIntPtr dwExtraInfo);

    private const byte VK_NUMLOCK = 0x90;
    private const uint KEYEVENTF_EXTENDEDKEY = 0x0001;
    private const uint KEYEVENTF_KEYUP = 0x0002;

    private const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    private const uint MOUSEEVENTF_LEFTUP = 0x0004;
    private const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
    private const uint MOUSEEVENTF_RIGHTUP = 0x0010;

    public static bool IsMouseMode { get; private set; } = false;

    private static Window? _modeToastWindow;
    private static DispatcherTimer? _modeToastTimer;
    private static int _consecutiveMoves = 0;
    private static DateTime _lastMoveTime = DateTime.MinValue;
    private static bool _isInitialized = false;

    /// <summary>
    /// Initializes global keyboard hooks and ensures NumLock is active on kiosk startup.
    /// </summary>
    public static void Initialize()
    {
        if (_isInitialized) return;
        _isInitialized = true;

        EnsureNumLockOn();

        EventManager.RegisterClassHandler(
            typeof(Window),
            UIElement.PreviewKeyDownEvent,
            new KeyEventHandler(OnGlobalPreviewKeyDown),
            handledEventsToo: false);
    }

    private static void OnGlobalPreviewKeyDown(object sender, KeyEventArgs e)
    {
        if (sender == _modeToastWindow) return;

        Window? win = sender as Window;
        if (HandleKioskKey(e, win))
        {
            e.Handled = true;
        }
    }

    /// <summary>
    /// Verifies and forces NumLock to ON state.
    /// </summary>
    public static void EnsureNumLockOn()
    {
        SetNumLock(true);
    }

    /// <summary>
    /// Checks if Windows NumLock is currently ON.
    /// </summary>
    public static bool IsNumLockOn()
    {
        try
        {
            return (GetKeyState(VK_NUMLOCK) & 0x0001) != 0;
        }
        catch
        {
            return true;
        }
    }

    /// <summary>
    /// Programmatically sets Windows NumLock state.
    /// </summary>
    public static void SetNumLock(bool state)
    {
        try
        {
            bool current = IsNumLockOn();
            if (current != state)
            {
                keybd_event(VK_NUMLOCK, 0x45, KEYEVENTF_EXTENDEDKEY, UIntPtr.Zero);
                keybd_event(VK_NUMLOCK, 0x45, KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYUP, UIntPtr.Zero);
            }
        }
        catch
        {
            // Non-critical if OS restrictions prevent simulated keybd_event
        }
    }

    /// <summary>
    /// Normalizes a KeyEventArgs, unwrapping SystemKey and ImeProcessedKey.
    /// </summary>
    public static Key NormalizeKey(KeyEventArgs e)
    {
        if (e == null) return Key.None;
        if (e.Key == Key.System) return e.SystemKey;
        if (e.Key == Key.ImeProcessed) return e.ImeProcessedKey;
        return e.Key;
    }

    /// <summary>
    /// Checks if key is '/' (Divide or Slash) used to switch between mouse and keypad mode.
    /// </summary>
    public static bool IsToggleMouseKey(Key key)
    {
        return key is Key.Divide or Key.Oem2 or Key.OemQuestion;
    }

    /// <summary>
    /// Checks if key is Escape or Numpad '*' (Multiply) used to cancel/close dialogs.
    /// </summary>
    public static bool IsEscapeOrMultiply(Key key)
    {
        return key is Key.Escape or Key.Multiply;
    }

    /// <summary>
    /// Checks if key event represents Escape or '*' (Multiply / Shift+8).
    /// </summary>
    public static bool IsEscapeOrMultiply(KeyEventArgs e)
    {
        Key key = NormalizeKey(e);
        if (key is Key.Escape or Key.Multiply) return true;
        if (key == Key.D8 && (Keyboard.Modifiers & ModifierKeys.Shift) == ModifierKeys.Shift) return true;
        return false;
    }

    /// <summary>
    /// Checks if key is Backspace, Minus/Subtract, or Delete.
    /// </summary>
    public static bool IsBackKey(Key key)
    {
        return key is Key.Back or Key.Subtract or Key.OemMinus or Key.Delete;
    }

    /// <summary>
    /// Checks if key is Enter or Return.
    /// </summary>
    public static bool IsEnterKey(Key key)
    {
        return key is Key.Enter or Key.Return;
    }

    /// <summary>
    /// Toggles between Mouse Emulation Mode and normal Keypad Mode.
    /// </summary>
    public static void ToggleMouseMode(Window? owner = null)
    {
        IsMouseMode = !IsMouseMode;
        if (IsMouseMode)
        {
            SetNumLock(false);
            ShowModeToast(
                "🖱️ MOUSE MODE ACTIVE",
                "Arrow keys (8/2/4/6) move pointer  ·  5/Enter to click  ·  Press '/' to exit",
                isMouseMode: true);
        }
        else
        {
            SetNumLock(true);
            ShowModeToast(
                "🔢 KEYPAD MODE ACTIVE",
                "NumLock ON  ·  Keypad digits & kiosk hotkeys restored  ·  Press '/' for mouse",
                isMouseMode: false);
        }
    }

    /// <summary>
    /// Core Kiosk key dispatcher. Handles '/' mode toggle, mouse navigation in mouse mode,
    /// and numpad '*' dialog dismissals.
    /// Returns true if the key event was consumed and should be marked e.Handled = true.
    /// </summary>
    public static bool HandleKioskKey(KeyEventArgs e, Window? currentWindow = null)
    {
        if (e == null) return false;

        Key key = NormalizeKey(e);

        // 1. '/' switches between mouse and keypad mode
        if (IsToggleMouseKey(key))
        {
            ToggleMouseMode(currentWindow);
            e.Handled = true;
            return true;
        }

        // 2. Mouse mode active: translate arrow keys to mouse movements and clicks
        if (IsMouseMode)
        {
            if (HandleMouseMovementAndClicks(key))
            {
                e.Handled = true;
                return true;
            }
        }

        // 3. '*' as Escape to close open dialogs
        if (IsEscapeOrMultiply(e))
        {
            if (TryCloseOpenDialogs(currentWindow))
            {
                e.Handled = true;
                return true;
            }
        }

        return false;
    }

    private static int GetMoveStep()
    {
        DateTime now = DateTime.Now;
        if ((now - _lastMoveTime).TotalMilliseconds < 350)
        {
            _consecutiveMoves = Math.Min(_consecutiveMoves + 1, 18);
        }
        else
        {
            _consecutiveMoves = 0;
        }
        _lastMoveTime = now;
        return 12 + (_consecutiveMoves * 24 / 18);
    }

    private static bool HandleMouseMovementAndClicks(Key key)
    {
        int step = GetMoveStep();

        switch (key)
        {
            // Up
            case Key.Up:
            case Key.NumPad8:
                MoveMouse(0, -step);
                return true;

            // Down
            case Key.Down:
            case Key.NumPad2:
                MoveMouse(0, step);
                return true;

            // Left
            case Key.Left:
            case Key.NumPad4:
                MoveMouse(-step, 0);
                return true;

            // Right
            case Key.Right:
            case Key.NumPad6:
                MoveMouse(step, 0);
                return true;

            // Diagonal: Up-Left (Home / NumPad 7)
            case Key.Home:
            case Key.NumPad7:
                MoveMouse(-step, -step);
                return true;

            // Diagonal: Up-Right (PageUp / NumPad 9)
            case Key.PageUp:
            case Key.NumPad9:
                MoveMouse(step, -step);
                return true;

            // Diagonal: Down-Left (End / NumPad 1)
            case Key.End:
            case Key.NumPad1:
                MoveMouse(-step, step);
                return true;

            // Diagonal: Down-Right (PageDown / NumPad 3)
            case Key.PageDown:
            case Key.NumPad3:
                MoveMouse(step, step);
                return true;

            // Left Click: Center 5 (Clear / NumPad5 / D5), Enter
            case Key.Clear:
            case Key.NumPad5:
            case Key.D5:
            case Key.Enter:
                LeftClick();
                return true;

            // Right Click: 0 (Insert / NumPad0 / D0), Decimal / Delete
            case Key.Insert:
            case Key.NumPad0:
            case Key.D0:
            case Key.Delete:
            case Key.Decimal:
            case Key.OemPeriod:
                RightClick();
                return true;

            default:
                return false;
        }
    }

    public static void MoveMouse(int deltaX, int deltaY)
    {
        if (GetCursorPos(out POINT pt))
        {
            SetCursorPos(pt.X + deltaX, pt.Y + deltaY);
        }
    }

    public static void LeftClick()
    {
        if (GetCursorPos(out POINT pt))
        {
            mouse_event(MOUSEEVENTF_LEFTDOWN, pt.X, pt.Y, 0, UIntPtr.Zero);
            mouse_event(MOUSEEVENTF_LEFTUP, pt.X, pt.Y, 0, UIntPtr.Zero);
        }
    }

    public static void RightClick()
    {
        if (GetCursorPos(out POINT pt))
        {
            mouse_event(MOUSEEVENTF_RIGHTDOWN, pt.X, pt.Y, 0, UIntPtr.Zero);
            mouse_event(MOUSEEVENTF_RIGHTUP, pt.X, pt.Y, 0, UIntPtr.Zero);
        }
    }

    /// <summary>
    /// Attempts to close any active modal dialog or popup child window when '*' or Escape is pressed.
    /// </summary>
    public static bool TryCloseOpenDialogs(Window? currentWindow = null)
    {
        bool closedAny = false;

        try
        {
            if (Application.Current != null)
            {
                // If current focused window is an open dialog, close it
                if (currentWindow != null && !IsKioskHostWindow(currentWindow) && currentWindow != _modeToastWindow)
                {
                    try
                    {
                        currentWindow.Close();
                        closedAny = true;
                    }
                    catch { }
                }

                // Scan all open windows for dialogs
                var windows = Application.Current.Windows.OfType<Window>().ToList();
                foreach (var win in windows)
                {
                    if (win == null || !win.IsVisible) continue;
                    if (win == _modeToastWindow) continue;
                    if (IsKioskHostWindow(win)) continue;

                    try
                    {
                        win.Close();
                        closedAny = true;
                    }
                    catch { }
                }
            }
        }
        catch { }

        return closedAny;
    }

    private static bool IsKioskHostWindow(Window win)
    {
        string name = win.GetType().Name;
        return name is "MainWindow" or "LandscapeWindow" or "SecondaryAdWindow";
    }

    /// <summary>
    /// Resolves whether a key represents a numeric digit '0' through '9'.
    /// When Mouse Mode is active, navigation keys are reserved for pointer emulation.
    /// </summary>
    public static bool TryResolveDigit(KeyEventArgs e, out char digit)
    {
        return TryResolveDigit(NormalizeKey(e), out digit);
    }

    /// <summary>
    /// Resolves whether a key represents a numeric digit '0' through '9'.
    /// When Mouse Mode is active, returns false so arrow keys move the mouse.
    /// </summary>
    public static bool TryResolveDigit(Key key, out char digit)
    {
        if (IsMouseMode)
        {
            digit = '\0';
            return false;
        }

        switch (key)
        {
            case Key.D0:
            case Key.NumPad0:
            case Key.Insert:
                digit = '0';
                return true;

            case Key.D1:
            case Key.NumPad1:
            case Key.End:
                digit = '1';
                return true;

            case Key.D2:
            case Key.NumPad2:
            case Key.Down:
                digit = '2';
                return true;

            case Key.D3:
            case Key.NumPad3:
            case Key.PageDown:
                digit = '3';
                return true;

            case Key.D4:
            case Key.NumPad4:
            case Key.Left:
                digit = '4';
                return true;

            case Key.D5:
            case Key.NumPad5:
            case Key.Clear:
                digit = '5';
                return true;

            case Key.D6:
            case Key.NumPad6:
            case Key.Right:
                digit = '6';
                return true;

            case Key.D7:
            case Key.NumPad7:
            case Key.Home:
                digit = '7';
                return true;

            case Key.D8:
            case Key.NumPad8:
            case Key.Up:
                digit = '8';
                return true;

            case Key.D9:
            case Key.NumPad9:
            case Key.PageUp:
                digit = '9';
                return true;

            default:
                try
                {
                    int vk = KeyInterop.VirtualKeyFromKey(key);
                    if (vk >= 0x60 && vk <= 0x69)
                    {
                        digit = (char)('0' + (vk - 0x60));
                        return true;
                    }
                    if (vk >= 0x30 && vk <= 0x39)
                    {
                        digit = (char)('0' + (vk - 0x30));
                        return true;
                    }
                }
                catch { }

                digit = '\0';
                return false;
        }
    }

    /// <summary>
    /// Displays a non-activating floating HUD notification on screen.
    /// </summary>
    public static void ShowModeToast(string title, string subtitle, bool isMouseMode)
    {
        try
        {
            Application.Current?.Dispatcher.Invoke(() =>
            {
                if (_modeToastWindow == null)
                {
                    _modeToastWindow = new Window
                    {
                        WindowStyle = WindowStyle.None,
                        AllowsTransparency = true,
                        Background = Brushes.Transparent,
                        ShowInTaskbar = false,
                        Topmost = true,
                        Focusable = false,
                        ShowActivated = false,
                        SizeToContent = SizeToContent.WidthAndHeight,
                        WindowStartupLocation = WindowStartupLocation.Manual
                    };
                }

                var border = new Border
                {
                    Background = new SolidColorBrush(Color.FromArgb(240, 15, 23, 42)), // Slate 900
                    BorderBrush = new SolidColorBrush(isMouseMode ? Color.FromRgb(6, 182, 212) : Color.FromRgb(16, 185, 129)),
                    BorderThickness = new Thickness(1.5),
                    CornerRadius = new CornerRadius(12),
                    Padding = new Thickness(24, 12, 24, 14),
                    Effect = new System.Windows.Media.Effects.DropShadowEffect
                    {
                        Color = Colors.Black,
                        BlurRadius = 18,
                        ShadowDepth = 4,
                        Opacity = 0.65
                    }
                };

                var stack = new StackPanel { Orientation = Orientation.Vertical, HorizontalAlignment = HorizontalAlignment.Center };
                var titleBlock = new TextBlock
                {
                    Text = title,
                    FontSize = 15,
                    FontWeight = FontWeights.Bold,
                    Foreground = isMouseMode ? new SolidColorBrush(Color.FromRgb(34, 211, 238)) : new SolidColorBrush(Color.FromRgb(52, 211, 153)),
                    HorizontalAlignment = HorizontalAlignment.Center,
                    Margin = new Thickness(0, 0, 0, 4)
                };
                var subBlock = new TextBlock
                {
                    Text = subtitle,
                    FontSize = 12,
                    FontWeight = FontWeights.SemiBold,
                    Foreground = new SolidColorBrush(Color.FromRgb(226, 232, 240)),
                    HorizontalAlignment = HorizontalAlignment.Center
                };
                stack.Children.Add(titleBlock);
                stack.Children.Add(subBlock);
                border.Child = stack;

                _modeToastWindow.Content = border;

                double screenW = SystemParameters.PrimaryScreenWidth;
                _modeToastWindow.Measure(new Size(double.PositiveInfinity, double.PositiveInfinity));
                double winW = _modeToastWindow.DesiredSize.Width > 0 ? _modeToastWindow.DesiredSize.Width : 440;
                _modeToastWindow.Left = Math.Max(20, (screenW - winW) / 2);
                _modeToastWindow.Top = 36;

                if (!_modeToastWindow.IsVisible)
                {
                    _modeToastWindow.Show();
                }

                _modeToastTimer?.Stop();
                _modeToastTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(2.8) };
                _modeToastTimer.Tick += (s, ev) =>
                {
                    _modeToastTimer?.Stop();
                    _modeToastTimer = null;
                    try
                    {
                        _modeToastWindow?.Hide();
                    }
                    catch { }
                };
                _modeToastTimer.Start();
            });
        }
        catch { }
    }
}
