using System;
using System.Diagnostics;
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

        Window startupWindow = IsPortraitDisplay(
            SystemParameters.PrimaryScreenWidth,
            SystemParameters.PrimaryScreenHeight)
            ? new MainWindow()
            : new LandscapeWindow();

        MainWindow = startupWindow;
        startupWindow.Show();
    }

    internal static bool IsPortraitDisplay(double width, double height) => height > width;

    private void OnDispatcherUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
    {
        Debug.WriteLine($"Dispatcher UI exception: {e.Exception}");
        MessageBox.Show($"An unexpected error occurred:\n\n{e.Exception.Message}", "RVM Error", MessageBoxButton.OK, MessageBoxImage.Error);
        e.Handled = true;
    }

    private static void OnUnhandledException(object sender, UnhandledExceptionEventArgs e)
    {
        var ex = e.ExceptionObject as Exception;
        Debug.WriteLine($"Unhandled appdomain exception: {ex}");

        try
        {
            MessageBox.Show($"Fatal error:\n\n{ex?.Message ?? "Unknown error"}", "RVM Fatal Error", MessageBoxButton.OK, MessageBoxImage.Error);
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
