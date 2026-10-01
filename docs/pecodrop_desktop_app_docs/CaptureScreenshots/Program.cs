using System.IO;
using System.Threading;
using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using PecoDropDesktopApp;

namespace CapturePecoDropScreenshots;

public static class Program
{
    [STAThread]
    public static void Main()
    {
        var output = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "snapshots"));
        Directory.CreateDirectory(output);
        var app = new Application { ShutdownMode = ShutdownMode.OnExplicitShutdown };
        var kiosk = new LandscapeWindow
        {
            WindowState = WindowState.Normal,
            WindowStyle = WindowStyle.None,
            Width = 1920,
            Height = 1080,
            ShowInTaskbar = false,
            IsDemoMode = true
        };

        kiosk.Show();
        Layout(kiosk);
        Save(kiosk, Path.Combine(output, "pecodrop_01_welcome.png"));

        kiosk.StartMachine(forceSimulator: true);
        Pump(500);
        Layout(kiosk);
        Save(kiosk, Path.Combine(output, "pecodrop_02_session_ready.png"));

        kiosk.SimulateItemDeposit("PLASTIC", "MEDIUM", true);
        Pump(500);
        Layout(kiosk);
        Save(kiosk, Path.Combine(output, "pecodrop_03_plastic_accepted.png"));

        kiosk.SimulateItemDeposit("METAL", "MEDIUM", true);
        Pump(500);
        Layout(kiosk);
        Save(kiosk, Path.Combine(output, "pecodrop_04_can_accepted.png"));

        kiosk.SimulateItemDeposit("PAPER", "WEIGHT", true, 0.250);
        Pump(500);
        Layout(kiosk);
        Save(kiosk, Path.Combine(output, "pecodrop_05_paper_accepted.png"));

        kiosk.SimulateItemDeposit("PLASTIC", "MEDIUM", false);
        Pump(500);
        Layout(kiosk);
        Save(kiosk, Path.Combine(output, "pecodrop_06_rejected.png"));

        kiosk.Close();
        app.Shutdown();
    }

    private static void Layout(Window window)
    {
        window.Measure(new Size(1920, 1080));
        window.Arrange(new Rect(0, 0, 1920, 1080));
        window.UpdateLayout();
        Pump(250);
    }

    private static void Save(Window window, string path)
    {
        var visual = (Visual)(window.Content ?? window);
        var bitmap = new RenderTargetBitmap(1920, 1080, 96, 96, PixelFormats.Pbgra32);
        bitmap.Render(visual);
        var encoder = new PngBitmapEncoder();
        encoder.Frames.Add(BitmapFrame.Create(bitmap));
        using var stream = new FileStream(path, FileMode.Create, FileAccess.Write);
        encoder.Save(stream);
        Console.WriteLine(path);
    }

    private static void Pump(int milliseconds)
    {
        var frame = new System.Windows.Threading.DispatcherFrame();
        System.Windows.Threading.Dispatcher.CurrentDispatcher.BeginInvoke(
            System.Windows.Threading.DispatcherPriority.Background,
            new Action(() => frame.Continue = false));
        System.Windows.Threading.Dispatcher.PushFrame(frame);
        Thread.Sleep(milliseconds);
    }
}
