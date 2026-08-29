using System;
using System.Diagnostics;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;

namespace RVMDesktopApp;

public partial class App : Application
{
    private static Mutex? singleInstanceMutex;
    private const string MutexId = @"Local\RVMDesktopApp_SingleInstance_Mutex";

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

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
            // Another instance is already running
            BringExistingInstanceToForeground();
            Shutdown(0);
            return;
        }

        base.OnStartup(e);
        DispatcherUnhandledException += OnDispatcherUnhandledException;
        AppDomain.CurrentDomain.UnhandledException += OnUnhandledException;
        TaskScheduler.UnobservedTaskException += OnUnobservedTaskException;

        bool usePortrait = DetermineIsPortrait(e.Args);

        Window startupWindow = usePortrait
            ? new MainWindow()
            : new LandscapeWindow();

        MainWindow = startupWindow;
        startupWindow.Show();
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

    private static bool DetermineIsPortrait(string[] args)
    {
        // 1. Check explicit command-line flags
        if (args.Any(a => a.Equals("--portrait", StringComparison.OrdinalIgnoreCase) ||
                          a.Equals("-p", StringComparison.OrdinalIgnoreCase) ||
                          a.Equals("/portrait", StringComparison.OrdinalIgnoreCase) ||
                          a.Equals("--mode=portrait", StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        if (args.Any(a => a.Equals("--landscape", StringComparison.OrdinalIgnoreCase) ||
                          a.Equals("-l", StringComparison.OrdinalIgnoreCase) ||
                          a.Equals("/landscape", StringComparison.OrdinalIgnoreCase) ||
                          a.Equals("--mode=landscape", StringComparison.OrdinalIgnoreCase)))
        {
            return false;
        }

        // 2. Fallback: check primary screen bounds
        return IsPortraitDisplay(
            SystemParameters.PrimaryScreenWidth,
            SystemParameters.PrimaryScreenHeight);
    }

    protected override void OnExit(ExitEventArgs e)
    {
        try
        {
            if (MainWindow is MainWindow mainWin)
            {
                mainWin.DisconnectHardwareOnExit();
            }
            else if (MainWindow is LandscapeWindow landWin)
            {
                landWin.DisconnectHardwareOnExit();
            }
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

    internal static bool IsPortraitDisplay(double width, double height) => height > width;

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
