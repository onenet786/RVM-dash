using System;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;

namespace RVMDesktopApp;

public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
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
