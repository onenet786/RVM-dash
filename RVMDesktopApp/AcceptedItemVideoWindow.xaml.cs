using System;
using System.IO;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;

namespace RVMDesktopApp;

public partial class AcceptedItemVideoWindow : Window
{
    private static AcceptedItemVideoWindow? current;
    private readonly DispatcherTimer safetyTimer = new() { Interval = TimeSpan.FromSeconds(10) };

    private AcceptedItemVideoWindow(string material)
    {
        InitializeComponent();

        bool isCan = material.Equals("CAN", StringComparison.OrdinalIgnoreCase);
        MaterialText.Text = isCan ? "Can accepted" : "Plastic bottle accepted";
        string fileName = isCan ? "DancingCan.mp4" : "DancingPlastic.mp4";
        string path = Path.Combine(AppContext.BaseDirectory, "Assets", fileName);

        safetyTimer.Tick += SafetyTimer_Tick;
        Closed += Window_Closed;

        if (!File.Exists(path))
        {
            Loaded += (_, _) => Close();
            return;
        }

        CelebrationPlayer.Source = new Uri(path, UriKind.Absolute);
        Loaded += (_, _) =>
        {
            safetyTimer.Start();
            CelebrationPlayer.Play();
        };
    }

    public static void ShowFor(Window owner, string material)
    {
        if (!material.Equals("CAN", StringComparison.OrdinalIgnoreCase) &&
            !material.Equals("PLASTIC", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        try
        {
            current?.Close();
            current = new AcceptedItemVideoWindow(material) { Owner = owner };
            current.Show();
        }
        catch
        {
            current = null;
        }
    }

    private void CelebrationPlayer_MediaEnded(object sender, RoutedEventArgs e) => Close();
    private void CelebrationPlayer_MediaFailed(object sender, ExceptionRoutedEventArgs e) => Close();
    private void SafetyTimer_Tick(object? sender, EventArgs e) => Close();
    private void Window_KeyDown(object sender, KeyEventArgs e) { if (e.Key == Key.Escape) Close(); }
    private void Window_MouseLeftButtonDown(object sender, MouseButtonEventArgs e) => Close();

    private void Window_Closed(object? sender, EventArgs e)
    {
        safetyTimer.Stop();
        CelebrationPlayer.Stop();
        CelebrationPlayer.Close();
        CelebrationPlayer.Source = null;
        if (ReferenceEquals(current, this)) current = null;
    }
}
