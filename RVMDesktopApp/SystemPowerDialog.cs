using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Threading;

namespace RVMDesktopApp;

public enum PowerAction
{
    Restart,
    Shutdown
}

/// <summary>
/// Confidential system restart & shutdown confirmation dialogue.
/// Triggered only via secret keyboard sequence 1218 (Restart) or 1219 (Shutdown).
/// Supports all standard USB keypads (with or without Backspace keys).
/// Features high-contrast glowing focus indicators, bidirectional arrow/Tab navigation,
/// Backspace cancellation/switching, and an immediate forced power execution engine.
/// </summary>
public sealed class SystemPowerDialog : Window
{
    public bool Confirmed { get; private set; } = false;

    private enum DialogButtonSelection
    {
        NoCancel,
        YesConfirm
    }

    private readonly PowerAction _action;
    private readonly string _confirmButtonLabel;
    private readonly Color _accentColor;
    private readonly TextBlock _titleText;
    private readonly TextBlock _mainMsg;
    private readonly TextBlock _subMsg;
    private readonly Button _yesButton;
    private readonly Button _noButton;
    private DialogButtonSelection _currentSelection = DialogButtonSelection.YesConfirm;
    private bool _isProcessing = false;

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool SetForegroundWindow(IntPtr hWnd);

    public SystemPowerDialog(PowerAction action)
    {
        _action = action;
        Title = action == PowerAction.Restart ? "System Restart Confirmation" : "System Shutdown Confirmation";
        Width = 540;
        Height = 290;
        WindowStartupLocation = WindowStartupLocation.CenterScreen;
        ResizeMode = ResizeMode.NoResize;
        WindowStyle = WindowStyle.None;
        Topmost = true;
        ShowInTaskbar = false;
        Background = new SolidColorBrush(Color.FromRgb(15, 23, 42)); // #0F172A Dark Slate

        _accentColor = action == PowerAction.Restart
            ? Color.FromRgb(245, 158, 11)   // Amber #F59E0B
            : Color.FromRgb(239, 68, 68);    // Red #EF4444

        string headerIcon = action == PowerAction.Restart ? "🔄" : "⏻";
        string headerTitle = action == PowerAction.Restart ? "SYSTEM RESTART CONFIRMATION" : "SYSTEM SHUTDOWN CONFIRMATION";
        string questionText = action == PowerAction.Restart
            ? "Are you sure you want to RESTART the kiosk computer?"
            : "Are you sure you want to SHUT DOWN the kiosk computer?";
        _confirmButtonLabel = action == PowerAction.Restart ? "Yes, Restart" : "Yes, Shutdown";

        var outerBorder = new Border
        {
            BorderBrush = new SolidColorBrush(Color.FromRgb(51, 65, 85)), // #334155
            BorderThickness = new Thickness(2),
            CornerRadius = new CornerRadius(12),
            Background = new SolidColorBrush(Color.FromRgb(15, 23, 42))
        };

        var rootGrid = new Grid();
        rootGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(56) });
        rootGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });
        rootGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(80) });

        // Header
        var headerBorder = new Border
        {
            Background = new SolidColorBrush(Color.FromRgb(30, 41, 59)), // #1E293B
            BorderBrush = new SolidColorBrush(Color.FromRgb(51, 65, 85)),
            BorderThickness = new Thickness(0, 0, 0, 1),
            CornerRadius = new CornerRadius(10, 10, 0, 0),
            Padding = new Thickness(20, 0, 20, 0)
        };
        Grid.SetRow(headerBorder, 0);

        var headerStack = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            VerticalAlignment = VerticalAlignment.Center
        };
        var iconText = new TextBlock
        {
            Text = headerIcon,
            FontSize = 18,
            Margin = new Thickness(0, 0, 10, 0),
            VerticalAlignment = VerticalAlignment.Center
        };
        _titleText = new TextBlock
        {
            Text = headerTitle,
            FontSize = 15,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(_accentColor),
            VerticalAlignment = VerticalAlignment.Center
        };
        headerStack.Children.Add(iconText);
        headerStack.Children.Add(_titleText);
        headerBorder.Child = headerStack;
        rootGrid.Children.Add(headerBorder);

        // Body
        var bodyPanel = new StackPanel
        {
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(24, 14, 24, 14)
        };
        Grid.SetRow(bodyPanel, 1);

        _mainMsg = new TextBlock
        {
            Text = questionText,
            FontSize = 15,
            FontWeight = FontWeights.SemiBold,
            Foreground = Brushes.White,
            TextWrapping = TextWrapping.Wrap,
            Margin = new Thickness(0, 0, 0, 8)
        };
        bodyPanel.Children.Add(_mainMsg);

        _subMsg = new TextBlock
        {
            Text = "Please confirm if you want to proceed with this operation.",
            FontSize = 12.5,
            FontWeight = FontWeights.Normal,
            Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)), // #94A3B8
            TextWrapping = TextWrapping.Wrap
        };
        bodyPanel.Children.Add(_subMsg);
        rootGrid.Children.Add(bodyPanel);

        // Footer with Action Buttons & Numpad Guide
        var footerBorder = new Border
        {
            Background = new SolidColorBrush(Color.FromRgb(30, 41, 59)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(51, 65, 85)),
            BorderThickness = new Thickness(0, 1, 0, 0),
            CornerRadius = new CornerRadius(0, 0, 10, 10),
            Padding = new Thickness(20, 10, 20, 10)
        };
        Grid.SetRow(footerBorder, 2);

        var footerStack = new StackPanel { VerticalAlignment = VerticalAlignment.Center };

        var buttonsGrid = new Grid();
        buttonsGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        buttonsGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(14) });
        buttonsGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });

        _noButton = new Button
        {
            Padding = new Thickness(0, 10, 0, 10),
            Background = new SolidColorBrush(Color.FromRgb(51, 65, 85)),
            Foreground = Brushes.White,
            FontWeight = FontWeights.SemiBold,
            FontSize = 13,
            Cursor = Cursors.Hand,
            IsCancel = true,
            FocusVisualStyle = null
        };
        _noButton.Click += (_, _) => CloseWithChoice(false);
        _noButton.GotFocus += (_, _) => SetSelection(DialogButtonSelection.NoCancel);
        _noButton.MouseEnter += (_, _) => SetSelection(DialogButtonSelection.NoCancel);
        Grid.SetColumn(_noButton, 0);
        buttonsGrid.Children.Add(_noButton);

        _yesButton = new Button
        {
            Padding = new Thickness(0, 10, 0, 10),
            Background = new SolidColorBrush(_accentColor),
            Foreground = Brushes.White,
            FontWeight = FontWeights.Bold,
            FontSize = 13,
            Cursor = Cursors.Hand,
            IsDefault = true,
            FocusVisualStyle = null
        };
        _yesButton.Click += (_, _) => ConfirmAndExecutePowerAction();
        _yesButton.GotFocus += (_, _) => SetSelection(DialogButtonSelection.YesConfirm);
        _yesButton.MouseEnter += (_, _) => SetSelection(DialogButtonSelection.YesConfirm);
        Grid.SetColumn(_yesButton, 2);
        buttonsGrid.Children.Add(_yesButton);

        footerStack.Children.Add(buttonsGrid);

        // Helper shortcut label for all keypad models
        var shortcutHint = new TextBlock
        {
            Text = "Keypad: [1] Yes  ·  [0] or [⌫ Backspace] Cancel  ·  [Arrows/Tab] Switch  ·  [Enter] Confirm",
            FontSize = 10.5,
            FontWeight = FontWeights.Normal,
            Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)), // #94A3B8
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 6, 0, 0)
        };
        footerStack.Children.Add(shortcutHint);

        footerBorder.Child = footerStack;
        rootGrid.Children.Add(footerBorder);

        outerBorder.Child = rootGrid;
        Content = outerBorder;

        // Initialize button visual states
        UpdateSelectionVisuals();

        // Comprehensive Keypad & Keyboard Interception
        PreviewKeyDown += (_, e) =>
        {
            if (_isProcessing)
            {
                e.Handled = true;
                return;
            }

            Key normKey = KioskNumpadHelper.NormalizeKey(e);
            bool hasDigit = KioskNumpadHelper.TryResolveDigit(e, out char digit);

            // 1. Direct Numeric / Alpha Shortcuts
            if (hasDigit && digit == '1' || normKey == Key.Y)
            {
                e.Handled = true;
                SetSelection(DialogButtonSelection.YesConfirm);
                ConfirmAndExecutePowerAction();
                return;
            }

            if (hasDigit && digit == '0' || normKey == Key.Escape || normKey == Key.Multiply || normKey == Key.N)
            {
                e.Handled = true;
                SetSelection(DialogButtonSelection.NoCancel);
                CloseWithChoice(false);
                return;
            }

            // 2. Backspace Key Handling (Specific support for keypads with Backspace key)
            if (KioskNumpadHelper.IsBackKey(normKey))
            {
                e.Handled = true;
                if (_currentSelection == DialogButtonSelection.NoCancel)
                {
                    // Already on Cancel, close dialog
                    CloseWithChoice(false);
                }
                else
                {
                    // Switch focus to Cancel button
                    SetSelection(DialogButtonSelection.NoCancel);
                }
                return;
            }

            // 3. Enter / Return Key Handling (Executes currently focused selection)
            if (KioskNumpadHelper.IsEnterKey(normKey))
            {
                e.Handled = true;
                if (_currentSelection == DialogButtonSelection.YesConfirm)
                {
                    ConfirmAndExecutePowerAction();
                }
                else
                {
                    CloseWithChoice(false);
                }
                return;
            }

            // 4. Directional Navigation & Tab (Allows keypad 4/6/8/2 or arrow keys to switch selection)
            if (normKey is Key.Left or Key.Up || (hasDigit && (digit is '4' or '8')))
            {
                e.Handled = true;
                SetSelection(DialogButtonSelection.NoCancel);
                return;
            }

            if (normKey is Key.Right or Key.Down || (hasDigit && (digit is '6' or '2')))
            {
                e.Handled = true;
                SetSelection(DialogButtonSelection.YesConfirm);
                return;
            }

            if (normKey == Key.Tab)
            {
                e.Handled = true;
                SetSelection(_currentSelection == DialogButtonSelection.YesConfirm
                    ? DialogButtonSelection.NoCancel
                    : DialogButtonSelection.YesConfirm);
                return;
            }
        };

        Closing += (_, e) =>
        {
            if (_isProcessing)
            {
                e.Cancel = true;
            }
        };

        // Aggressive focus and activation handshake for borderless windows
        Loaded += (_, _) =>
        {
            try
            {
                Activate();
                Topmost = true;
                var helper = new WindowInteropHelper(this);
                if (helper.Handle != IntPtr.Zero)
                {
                    SetForegroundWindow(helper.Handle);
                }
            }
            catch { }

            Dispatcher.BeginInvoke(DispatcherPriority.Input, () =>
            {
                Activate();
                SetSelection(DialogButtonSelection.YesConfirm);
            });
        };

        ContentRendered += (_, _) =>
        {
            Dispatcher.BeginInvoke(DispatcherPriority.ApplicationIdle, () =>
            {
                Activate();
                SetSelection(DialogButtonSelection.YesConfirm);
            });
        };

        Activated += (_, _) =>
        {
            SetSelection(_currentSelection);
        };
    }

    private void SetSelection(DialogButtonSelection selection)
    {
        _currentSelection = selection;
        UpdateSelectionVisuals();

        try
        {
            if (selection == DialogButtonSelection.YesConfirm)
            {
                _yesButton.Focus();
                Keyboard.Focus(_yesButton);
            }
            else
            {
                _noButton.Focus();
                Keyboard.Focus(_noButton);
            }
        }
        catch { }
    }

    private void UpdateSelectionVisuals()
    {
        if (_currentSelection == DialogButtonSelection.YesConfirm)
        {
            // High-contrast glowing border on Yes
            _yesButton.BorderBrush = Brushes.White;
            _yesButton.BorderThickness = new Thickness(3);
            _yesButton.Content = $"▶  {_confirmButtonLabel} (Enter / 1)";
            _yesButton.Background = new SolidColorBrush(_accentColor);
            _yesButton.Opacity = 1.0;

            // Subtle border on No
            _noButton.BorderBrush = new SolidColorBrush(Color.FromRgb(71, 85, 105)); // #475569
            _noButton.BorderThickness = new Thickness(1.5);
            _noButton.Content = "No, Cancel (0 / ⌫)";
            _noButton.Background = new SolidColorBrush(Color.FromRgb(51, 65, 85));
            _noButton.Opacity = 0.8;
        }
        else
        {
            // High-contrast glowing border on No
            _noButton.BorderBrush = Brushes.White;
            _noButton.BorderThickness = new Thickness(3);
            _noButton.Content = "▶  No, Cancel (Enter / 0 / ⌫)";
            _noButton.Background = new SolidColorBrush(Color.FromRgb(71, 85, 105));
            _noButton.Opacity = 1.0;

            // Subtle border on Yes
            _yesButton.BorderBrush = new SolidColorBrush(Color.FromRgb(71, 85, 105));
            _yesButton.BorderThickness = new Thickness(1.5);
            _yesButton.Content = $"{_confirmButtonLabel} (1)";
            _yesButton.Background = new SolidColorBrush(Color.FromArgb(180, _accentColor.R, _accentColor.G, _accentColor.B));
            _yesButton.Opacity = 0.8;
        }
    }

    private void CloseWithChoice(bool confirmed)
    {
        if (_isProcessing) return;
        Confirmed = confirmed;
        try
        {
            DialogResult = confirmed;
        }
        catch
        {
            try { Close(); } catch { }
        }
    }

    private async void ConfirmAndExecutePowerAction()
    {
        if (_isProcessing) return;
        _isProcessing = true;
        Confirmed = true;

        // Immediate visual update on UI
        _yesButton.IsEnabled = false;
        _noButton.IsEnabled = false;
        _yesButton.Opacity = 0.5;
        _noButton.Opacity = 0.5;

        string actionTitle = _action == PowerAction.Restart ? "SYSTEM RESTART IN PROGRESS" : "SYSTEM SHUTDOWN IN PROGRESS";
        string actionMain = _action == PowerAction.Restart ? "Restarting kiosk computer..." : "Shutting down kiosk computer...";
        string actionSub = "Signaling Windows OS and disconnecting components. Please wait...";

        _titleText.Text = actionTitle;
        _mainMsg.Text = actionMain;
        _subMsg.Text = actionSub;

        // Best effort non-blocking hardware teardown in background
        _ = Task.Run(() => PerformHardwareAndServicesTeardown());

        // Execute power command immediately with /t 0 /f
        bool success = await Task.Run(() => ExecuteSystemPowerAction(_action, msg => Debug.WriteLine(msg)));

        if (success)
        {
            await Task.Delay(400);
            App.AllowKioskClose = true;
            try
            {
                Application.Current?.Dispatcher.Invoke(() => Application.Current?.Shutdown());
            }
            catch { }
            Environment.Exit(0);
        }
        else
        {
            _isProcessing = false;
            _titleText.Text = "POWER COMMAND FAILED";
            _titleText.Foreground = Brushes.Red;
            _mainMsg.Text = "Windows OS did not accept the power command.";
            _subMsg.Text = "Please verify Windows permissions or use the physical power switch. Press Esc or Close to return.";
            _noButton.IsEnabled = true;
            _noButton.Opacity = 1.0;
            _noButton.Content = "Close";
            _noButton.Focus();
        }
    }

    public static void PromptAndRestart(Window? owner = null)
    {
        Application.Current?.Dispatcher.BeginInvoke(DispatcherPriority.Input, () =>
        {
            var dlg = new SystemPowerDialog(PowerAction.Restart);
            if (owner != null && owner.IsVisible) dlg.Owner = owner;
            dlg.ShowDialog();
        });
    }

    public static void PromptAndShutdown(Window? owner = null)
    {
        Application.Current?.Dispatcher.BeginInvoke(DispatcherPriority.Input, () =>
        {
            var dlg = new SystemPowerDialog(PowerAction.Shutdown);
            if (owner != null && owner.IsVisible) dlg.Owner = owner;
            dlg.ShowDialog();
        });
    }

    public static void PerformSystemRestart()
    {
        _ = Task.Run(() => PerformHardwareAndServicesTeardown());
        bool success = ExecuteSystemPowerAction(PowerAction.Restart, msg => Debug.WriteLine(msg));
        if (success)
        {
            System.Threading.Thread.Sleep(400);
            App.AllowKioskClose = true;
            try { Application.Current?.Shutdown(); } catch { }
            Environment.Exit(0);
        }
    }

    public static void PerformSystemShutdown()
    {
        _ = Task.Run(() => PerformHardwareAndServicesTeardown());
        bool success = ExecuteSystemPowerAction(PowerAction.Shutdown, msg => Debug.WriteLine(msg));
        if (success)
        {
            System.Threading.Thread.Sleep(400);
            App.AllowKioskClose = true;
            try { Application.Current?.Shutdown(); } catch { }
            Environment.Exit(0);
        }
    }

    private static void PerformHardwareAndServicesTeardown()
    {
        try
        {
            Application.Current?.Dispatcher.Invoke(() =>
            {
                if (Application.Current?.MainWindow is MainWindow mainWin)
                {
                    try { mainWin.DisconnectHardwareOnExit(); } catch { }
                }
                else if (Application.Current?.MainWindow is LandscapeWindow landWin)
                {
                    try { landWin.DisconnectHardwareOnExit(); } catch { }
                }
            });
        }
        catch { }

        try { HeartbeatService.Stop(); } catch { }
    }

    #region Multi-Tiered Windows Power Engine

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    private struct LUID
    {
        public uint LowPart;
        public int HighPart;
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    private struct TOKEN_PRIVILEGES
    {
        public int PrivilegeCount;
        public LUID Luid;
        public int Attributes;
    }

    private const int SE_PRIVILEGE_ENABLED = 0x00000002;
    private const int TOKEN_QUERY = 0x00000008;
    private const int TOKEN_ADJUST_PRIVILEGES = 0x00000020;

    private const int EWX_LOGOFF = 0x00000000;
    private const int EWX_SHUTDOWN = 0x00000001;
    private const int EWX_REBOOT = 0x00000002;
    private const int EWX_FORCE = 0x00000004;
    private const int EWX_POWEROFF = 0x00000008;
    private const int EWX_FORCEIFHUNG = 0x00000010;

    private const uint SHTDN_REASON_FLAG_PLANNED = 0x40000000;
    private const uint SHTDN_REASON_MAJOR_OPERATINGSYSTEM = 0x00020000;
    private const uint SHTDN_REASON_MINOR_RECONFIG = 0x00000004;

    [DllImport("advapi32.dll", ExactSpelling = true, SetLastError = true)]
    private static extern bool OpenProcessToken(IntPtr ProcessHandle, int DesiredAccess, out IntPtr TokenHandle);

    [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    private static extern bool LookupPrivilegeValue(string? lpSystemName, string lpName, out LUID lpLuid);

    [DllImport("advapi32.dll", ExactSpelling = true, SetLastError = true)]
    private static extern bool AdjustTokenPrivileges(IntPtr TokenHandle, bool DisableAllPrivileges, ref TOKEN_PRIVILEGES NewState, int BufferLength, IntPtr PreviousState, IntPtr ReturnLength);

    [DllImport("user32.dll", ExactSpelling = true, SetLastError = true)]
    private static extern bool ExitWindowsEx(int uFlags, uint dwReason);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool CloseHandle(IntPtr hObject);

    private static bool EnableShutdownPrivilege()
    {
        IntPtr hToken = IntPtr.Zero;
        try
        {
            if (!OpenProcessToken(Process.GetCurrentProcess().Handle, TOKEN_ADJUST_PRIVILEGES | TOKEN_QUERY, out hToken))
            {
                return false;
            }

            if (!LookupPrivilegeValue(null, "SeShutdownPrivilege", out LUID luid))
            {
                return false;
            }

            TOKEN_PRIVILEGES tp = new TOKEN_PRIVILEGES
            {
                PrivilegeCount = 1,
                Luid = luid,
                Attributes = SE_PRIVILEGE_ENABLED
            };

            return AdjustTokenPrivileges(hToken, false, ref tp, 0, IntPtr.Zero, IntPtr.Zero);
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[POWER] Privilege error: {ex.Message}");
            return false;
        }
        finally
        {
            if (hToken != IntPtr.Zero)
            {
                try { CloseHandle(hToken); } catch { }
            }
        }
    }

    public static bool ExecuteSystemPowerAction(PowerAction action, Action<string>? logCallback = null)
    {
        bool isRestart = action == PowerAction.Restart;
        string actionLabel = isRestart ? "RESTART" : "SHUTDOWN";
        string flag = isRestart ? "/r" : "/s";
        string comment = isRestart ? "Kiosk System Restart" : "Kiosk System Shutdown";
        logCallback?.Invoke($"[POWER] Initiating system {actionLabel} sequence...");

        // Tier 1: Direct PowerShell Invocation with /t 0 /f (Proven 100% reliable in terminal session)
        try
        {
            logCallback?.Invoke($"[POWER] Tier 1: Invoking PowerShell shutdown.exe {flag} /t 0 /f...");
            var psi = new ProcessStartInfo
            {
                FileName = "powershell.exe",
                Arguments = $"-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command \"shutdown.exe {flag} /t 0 /f /c '{comment}'\"",
                CreateNoWindow = true,
                UseShellExecute = false,
                RedirectStandardError = true,
                RedirectStandardOutput = true
            };

            using var proc = Process.Start(psi);
            if (proc != null)
            {
                bool exited = proc.WaitForExit(2000);
                if (exited && (proc.ExitCode == 0 || proc.ExitCode == 1190))
                {
                    logCallback?.Invoke($"[POWER] Tier 1 PowerShell success (ExitCode {proc.ExitCode}).");
                    return true;
                }
            }
        }
        catch (Exception ex)
        {
            logCallback?.Invoke($"[POWER] Tier 1 exception: {ex.Message}");
        }

        // Tier 2: Direct ShellExecute of C:\Windows\System32\shutdown.exe with /t 0 /f (Detached)
        try
        {
            string systemDir = Environment.GetFolderPath(Environment.SpecialFolder.System);
            string shutdownExe = Path.Combine(systemDir, "shutdown.exe");
            if (!File.Exists(shutdownExe)) shutdownExe = "shutdown.exe";

            logCallback?.Invoke($"[POWER] Tier 2: Invoking ShellExecute {shutdownExe} {flag} /t 0 /f...");
            var psi = new ProcessStartInfo
            {
                FileName = shutdownExe,
                Arguments = $"{flag} /t 0 /f /c \"{comment}\"",
                UseShellExecute = true,
                WindowStyle = ProcessWindowStyle.Hidden
            };
            using var proc = Process.Start(psi);
            if (proc != null)
            {
                proc.WaitForExit(1500);
                if (proc.ExitCode == 0 || proc.ExitCode == 1190)
                {
                    logCallback?.Invoke($"[POWER] Tier 2 ShellExecute success (ExitCode {proc.ExitCode}).");
                    return true;
                }
            }
        }
        catch (Exception ex)
        {
            logCallback?.Invoke($"[POWER] Tier 2 exception: {ex.Message}");
        }

        // Tier 3: CMD.exe fallback with /t 0 /f
        try
        {
            logCallback?.Invoke($"[POWER] Tier 3: Invoking cmd.exe /c shutdown {flag} /t 0 /f...");
            var psi = new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = $"/c shutdown.exe {flag} /t 0 /f /c \"{comment}\"",
                CreateNoWindow = true,
                UseShellExecute = false
            };
            using var proc = Process.Start(psi);
            if (proc != null)
            {
                bool exited = proc.WaitForExit(2000);
                if (exited && (proc.ExitCode == 0 || proc.ExitCode == 1190))
                {
                    logCallback?.Invoke($"[POWER] Tier 3 cmd success.");
                    return true;
                }
            }
        }
        catch (Exception ex)
        {
            logCallback?.Invoke($"[POWER] Tier 3 exception: {ex.Message}");
        }

        // Tier 4: Native Win32 ExitWindowsEx with SeShutdownPrivilege
        try
        {
            logCallback?.Invoke("[POWER] Tier 4: Invoking Win32 ExitWindowsEx with SeShutdownPrivilege...");
            bool privOk = EnableShutdownPrivilege();
            int flags = isRestart
                ? (EWX_REBOOT | EWX_FORCEIFHUNG)
                : (EWX_POWEROFF | EWX_FORCEIFHUNG);
            uint reason = SHTDN_REASON_FLAG_PLANNED | SHTDN_REASON_MAJOR_OPERATINGSYSTEM | SHTDN_REASON_MINOR_RECONFIG;

            bool win32Result = ExitWindowsEx(flags, reason);
            if (win32Result)
            {
                logCallback?.Invoke($"[POWER] Tier 4 success. ExitWindowsEx returned true (Privilege granted: {privOk}).");
                return true;
            }
            int err = Marshal.GetLastWin32Error();
            logCallback?.Invoke($"[POWER] Tier 4 ExitWindowsEx failed with Win32 error {err}.");
        }
        catch (Exception ex)
        {
            logCallback?.Invoke($"[POWER] Tier 4 exception: {ex.Message}");
        }

        // Tier 5: PowerShell Computer Power Cmdlet
        try
        {
            logCallback?.Invoke("[POWER] Tier 5: Invoking Restart-Computer / Stop-Computer...");
            string psCmd = isRestart ? "Restart-Computer -Force" : "Stop-Computer -Force";
            var psi = new ProcessStartInfo
            {
                FileName = "powershell.exe",
                Arguments = $"-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command \"{psCmd}\"",
                CreateNoWindow = true,
                UseShellExecute = false
            };
            using var proc = Process.Start(psi);
            if (proc != null)
            {
                bool exited = proc.WaitForExit(3000);
                if (exited && proc.ExitCode == 0)
                {
                    logCallback?.Invoke("[POWER] Tier 5 PowerShell cmdlet success.");
                    return true;
                }
            }
        }
        catch (Exception ex)
        {
            logCallback?.Invoke($"[POWER] Tier 5 exception: {ex.Message}");
        }

        return false;
    }

    #endregion
}
