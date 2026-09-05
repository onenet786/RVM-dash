using System;
using System.Diagnostics;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;

namespace PecoDropDesktopApp;

public partial class App : Application
{
    private static Mutex? singleInstanceMutex;
    private const string MutexId = @"Local\PecoDropDesktopApp_SingleInstance_Mutex";
    public static SecondaryAdWindow? SecondaryDisplayWindow { get; private set; }

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    private const int SWP_NOZORDER = 0x0004;
    private const int SWP_SHOWWINDOW = 0x0040;
    private const int SW_MAXIMIZE = 3;
    private const int SW_RESTORE = 9;

    protected override void OnStartup(StartupEventArgs e)
    {
        bool createdNew;
        try
        {
            singleInstanceMutex = new Mutex(true, MutexId, out createdNew);
        }
        catch
        {
            createdNew = true;
        }

        if (!createdNew)
        {
            // Another instance is already running – show temporary info window then exit
            var msgWindow = new AutoCloseMessageWindow();
            msgWindow.Show();
            var timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(2) };
            timer.Tick += (s, e) =>
            {
                timer.Stop();
                msgWindow.Close();
                Shutdown(0);
            };
            timer.Start();
            return;
        }

        base.OnStartup(e);
        DispatcherUnhandledException += OnDispatcherUnhandledException;
        AppDomain.CurrentDomain.UnhandledException += OnUnhandledException;
        TaskScheduler.UnobservedTaskException += OnUnobservedTaskException;

        var settings = AppSettings.Load();

        // Check if both windows should be explicitly displayed together on Primary (Laptop) display
        bool showBothOnPrimary = e.Args.Any(a => a.Equals("--both-on-primary", StringComparison.OrdinalIgnoreCase) ||
                                                 a.Equals("--single-display", StringComparison.OrdinalIgnoreCase)) ||
                                 settings.DisplayMode.Equals("BothOnPrimary", StringComparison.OrdinalIgnoreCase);

        var startupWindow = new LandscapeWindow();
        MainWindow = startupWindow;

        if (showBothOnPrimary)
        {
            // Position both windows side-by-side on Primary (Laptop) display
            double workW = SystemParameters.WorkArea.Width;
            double workH = SystemParameters.WorkArea.Height;

            // 65% for Main Kiosk (Leaderboard 50% + Details 50%), 35% for Ad Player
            double kioskW = Math.Round(workW * 0.65);
            double adW = workW - kioskW;

            startupWindow.WindowStartupLocation = WindowStartupLocation.Manual;
            startupWindow.Left = 0;
            startupWindow.Top = 0;
            startupWindow.Width = kioskW;
            startupWindow.Height = workH;
            startupWindow.WindowState = WindowState.Normal;
            startupWindow.Show();

            var adWindow = new SecondaryAdWindow
            {
                WindowStartupLocation = WindowStartupLocation.Manual,
                Left = kioskW,
                Top = 0,
                Width = adW,
                Height = workH,
                WindowState = WindowState.Normal
            };
            adWindow.Show();
            SecondaryDisplayWindow = adWindow;
        }
        else
        {
            // Multi-Display Mode (Default):
            // Primary Screen 0 (Laptop): Landscape Kiosk Maximized
            // Secondary Screen 1 (HDMI LED Display): Commercial Advertisements Maximized
            var screens = ScreenHelper.GetScreens();
            var primaryScreen = screens.FirstOrDefault(s => s.IsPrimary) ?? screens.FirstOrDefault();
            if (primaryScreen != null)
            {
                startupWindow.WindowStartupLocation = WindowStartupLocation.Manual;
                startupWindow.Left = primaryScreen.Left;
                startupWindow.Top = primaryScreen.Top;
                startupWindow.Width = primaryScreen.Width;
                startupWindow.Height = primaryScreen.Height;
                startupWindow.WindowState = WindowState.Normal;

                startupWindow.SourceInitialized += (s, ev) =>
                {
                    var helper = new System.Windows.Interop.WindowInteropHelper(startupWindow);
                    SetWindowPos(helper.Handle, IntPtr.Zero, primaryScreen.Left, primaryScreen.Top, primaryScreen.Width, primaryScreen.Height, SWP_NOZORDER | SWP_SHOWWINDOW);
                };

                startupWindow.Loaded += (s, ev) =>
                {
                    var helper = new System.Windows.Interop.WindowInteropHelper(startupWindow);
                    SetWindowPos(helper.Handle, IntPtr.Zero, primaryScreen.Left, primaryScreen.Top, primaryScreen.Width, primaryScreen.Height, SWP_NOZORDER | SWP_SHOWWINDOW);
                    ShowWindow(helper.Handle, SW_MAXIMIZE);
                };
            }
            startupWindow.Show();

            TryLaunchSecondaryDisplay();
        }
    }

    public static void TryLaunchSecondaryDisplay()
    {
        try
        {
            var screens = ScreenHelper.GetScreens();
            if (screens.Count > 1)
            {
                var secondaryScreen = screens.FirstOrDefault(s => !s.IsPrimary) ?? screens[1];
                var adWindow = new SecondaryAdWindow();
                adWindow.WindowStartupLocation = WindowStartupLocation.Manual;
                adWindow.Left = secondaryScreen.Left;
                adWindow.Top = secondaryScreen.Top;
                adWindow.Width = secondaryScreen.Width;
                adWindow.Height = secondaryScreen.Height;
                adWindow.WindowState = WindowState.Normal;

                adWindow.SourceInitialized += (s, e) =>
                {
                    var helper = new System.Windows.Interop.WindowInteropHelper(adWindow);
                    SetWindowPos(helper.Handle, IntPtr.Zero, secondaryScreen.Left, secondaryScreen.Top, secondaryScreen.Width, secondaryScreen.Height, SWP_NOZORDER | SWP_SHOWWINDOW);
                };

                adWindow.Loaded += (s, e) =>
                {
                    var helper = new System.Windows.Interop.WindowInteropHelper(adWindow);
                    SetWindowPos(helper.Handle, IntPtr.Zero, secondaryScreen.Left, secondaryScreen.Top, secondaryScreen.Width, secondaryScreen.Height, SWP_NOZORDER | SWP_SHOWWINDOW);
                    ShowWindow(helper.Handle, SW_MAXIMIZE);
                };

                adWindow.Show();
                SecondaryDisplayWindow = adWindow;
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[Secondary Display] Could not initialize: {ex.Message}");
        }
    }

    private static void BringExistingInstanceToForeground()
    {
        try
        {
            Process current = Process.GetCurrentProcess();
            foreach (Process process in Process.GetProcessesByName(current.ProcessName))
            {
                if (process.Id != current.Id && process.MainWindowHandle != IntPtr.Zero)
                {
                    ShowWindow(process.MainWindowHandle, SW_RESTORE);
                    SetForegroundWindow(process.MainWindowHandle);
                    break;
                }
            }
        }
        catch { }
    }

    protected override void OnExit(ExitEventArgs e)
    {
        try
        {
            if (MainWindow is LandscapeWindow landWin)
            {
                landWin.DisconnectHardwareOnExit();
            }
        }
        catch { }

        try
        {
            SecondaryDisplayWindow?.StopAndClose();
            SecondaryDisplayWindow = null;
        }
        catch { }

        try
        {
            singleInstanceMutex?.ReleaseMutex();
            singleInstanceMutex?.Dispose();
            singleInstanceMutex = null;
        }
        catch { }

        base.OnExit(e);
    }

    private void OnDispatcherUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
    {
        Debug.WriteLine($"Dispatcher UI exception: {e.Exception}");
        RvmMessageDialog.ShowError("RVM System Error", $"An unexpected error occurred:\n\n{e.Exception.Message}");
        e.Handled = true;
    }

    private static void OnUnhandledException(object sender, UnhandledExceptionEventArgs e)
    {
        var ex = e.ExceptionObject as Exception;
        Debug.WriteLine($"Unhandled appdomain exception: {ex}");

        try
        {
            RvmMessageDialog.ShowError("RVM Fatal Error", $"Fatal error:\n\n{ex?.Message ?? "Unknown error"}");
        }
        catch
        {
            // If the UI is already broken, at least log to the debug output.
        }
    }

    private static void OnUnobservedTaskException(object? sender, UnobservedTaskExceptionEventArgs e)
    {
        Debug.WriteLine($"Unobserved task exception: {e.Exception}");
        e.SetObserved();
    }
}
