using System;
using System.IO;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;

namespace PecoDropDesktopApp;

public partial class AcceptedItemVideoWindow : Window
{
    private static AcceptedItemVideoWindow? current;
    private readonly DispatcherTimer safetyTimer = new() { Interval = TimeSpan.FromSeconds(10) };

    private AcceptedItemVideoWindow(string material)
    {
        InitializeComponent();

        string mat = (material ?? "").Trim().ToUpperInvariant();
        string fileName;
        string titleText;

        if (mat.Contains("CAN") || mat.Contains("METAL") || mat.Contains("ALUMINIUM"))
        {
            titleText = "Can accepted";
            fileName = "DancingXN.mp4";
            string xnPath = Path.Combine(AppContext.BaseDirectory, "Assets", fileName);
            if (!File.Exists(xnPath))
            {
                fileName = "DancingCan.mp4";
            }
        }
        else if (mat.Contains("TETRA") || mat.Contains("PAPER") || mat.Contains("CARTON") || mat.Contains("CUP"))
        {
            titleText = mat.Contains("CUP") ? "Cup accepted (Plastic / Paper / Foam)" : "Tetra Pak accepted";
            fileName = "DancingTetra.mp4";
        }
        else
        {
            titleText = "Plastic bottle accepted";
            fileName = "DancingPlastic.mp4";
        }

        MaterialText.Text = titleText;
        string path = Path.Combine(AppContext.BaseDirectory, "Assets", fileName);

        safetyTimer.Tick += SafetyTimer_Tick;
        Closed += Window_Closed;

        if (!File.Exists(path))
        {
            Loaded += (_, _) => Close();
            return;
        }

        try
        {
            CelebrationPlayer.Source = new Uri(Path.GetFullPath(path), UriKind.Absolute);
            Loaded += (_, _) =>
            {
                safetyTimer.Start();
                CelebrationPlayer.Play();
            };
        }
        catch
        {
            Loaded += (_, _) => Close();
        }
    }

    public static void ShowFor(Window owner, string material)
    {
        if (string.IsNullOrWhiteSpace(material))
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
