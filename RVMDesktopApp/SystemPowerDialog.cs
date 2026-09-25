using System;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;

namespace RVMDesktopApp;

public enum PowerAction
{
    Restart,
    Shutdown
}

/// <summary>
/// Confidential system restart & shutdown confirmation dialogue.
/// Triggered only via secret keyboard sequence 1218 (Restart) or 1219 (Shutdown).
/// Accepts 1 for Yes, 0 or Esc for No.
/// </summary>
public sealed class SystemPowerDialog : Window
{
    public bool Confirmed { get; private set; } = false;

    public SystemPowerDialog(PowerAction action)
    {
        Title = action == PowerAction.Restart ? "System Restart Confirmation" : "System Shutdown Confirmation";
        Width = 520;
        Height = 270;
        WindowStartupLocation = WindowStartupLocation.CenterScreen;
        ResizeMode = ResizeMode.NoResize;
        WindowStyle = WindowStyle.None;
        Topmost = true;
        ShowInTaskbar = false;
        Background = new SolidColorBrush(Color.FromRgb(15, 23, 42)); // #0F172A Dark Slate

        Color accentColor = action == PowerAction.Restart
            ? Color.FromRgb(245, 158, 11)   // Amber #F59E0B
            : Color.FromRgb(239, 68, 68);    // Red #EF4444

        string headerIcon = action == PowerAction.Restart ? "🔄" : "⏻";
        string headerTitle = action == PowerAction.Restart ? "SYSTEM RESTART CONFIRMATION" : "SYSTEM SHUTDOWN CONFIRMATION";
        string questionText = action == PowerAction.Restart
            ? "Are you sure you want to RESTART the kiosk computer?"
            : "Are you sure you want to SHUT DOWN the kiosk computer?";
        string confirmButtonLabel = action == PowerAction.Restart ? "Yes, Restart" : "Yes, Shutdown";

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
        rootGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(64) });

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
        var titleText = new TextBlock
        {
            Text = headerTitle,
            FontSize = 15,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(accentColor),
            VerticalAlignment = VerticalAlignment.Center
        };
        headerStack.Children.Add(iconText);
        headerStack.Children.Add(titleText);
        headerBorder.Child = headerStack;
        rootGrid.Children.Add(headerBorder);

        // Body
        var bodyPanel = new StackPanel
        {
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(24, 16, 24, 16)
        };
        Grid.SetRow(bodyPanel, 1);

        var mainMsg = new TextBlock
        {
            Text = questionText,
            FontSize = 15,
            FontWeight = FontWeights.SemiBold,
            Foreground = Brushes.White,
            TextWrapping = TextWrapping.Wrap,
            Margin = new Thickness(0, 0, 0, 10)
        };
        bodyPanel.Children.Add(mainMsg);

        var subMsg = new TextBlock
        {
            Text = "Please confirm if you want to proceed with this operation.",
            FontSize = 12.5,
            FontWeight = FontWeights.Normal,
            Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)), // #94A3B8
            TextWrapping = TextWrapping.Wrap
        };
        bodyPanel.Children.Add(subMsg);
        rootGrid.Children.Add(bodyPanel);

        // Footer with Action Buttons
        var footerBorder = new Border
        {
            Background = new SolidColorBrush(Color.FromRgb(30, 41, 59)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(51, 65, 85)),
            BorderThickness = new Thickness(0, 1, 0, 0),
            CornerRadius = new CornerRadius(0, 0, 10, 10),
            Padding = new Thickness(20, 0, 20, 0)
        };
        Grid.SetRow(footerBorder, 2);

        var buttonsGrid = new Grid { VerticalAlignment = VerticalAlignment.Center };
        buttonsGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        buttonsGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(14) });
        buttonsGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });

        var noButton = new Button
        {
            Content = "No, Cancel",
            Padding = new Thickness(0, 10, 0, 10),
            Background = new SolidColorBrush(Color.FromRgb(51, 65, 85)),
            Foreground = Brushes.White,
            FontWeight = FontWeights.SemiBold,
            FontSize = 13,
            Cursor = Cursors.Hand
        };
        noButton.Click += (_, _) => CloseWithChoice(false);
        Grid.SetColumn(noButton, 0);
        buttonsGrid.Children.Add(noButton);

        var yesButton = new Button
        {
            Content = confirmButtonLabel,
            Padding = new Thickness(0, 10, 0, 10),
            Background = new SolidColorBrush(accentColor),
            Foreground = Brushes.White,
            FontWeight = FontWeights.Bold,
            FontSize = 13,
            Cursor = Cursors.Hand
        };
        yesButton.Click += (_, _) => CloseWithChoice(true);
        Grid.SetColumn(yesButton, 2);
        buttonsGrid.Children.Add(yesButton);

        footerBorder.Child = buttonsGrid;
        rootGrid.Children.Add(footerBorder);

        outerBorder.Child = rootGrid;
        Content = outerBorder;

        // Key interception: 1 for Yes, 0 for No
        PreviewKeyDown += (_, e) =>
        {
            if (e.Key == Key.D1 || e.Key == Key.NumPad1 || e.Key == Key.Y)
            {
                e.Handled = true;
                CloseWithChoice(true);
            }
            else if (e.Key == Key.D0 || e.Key == Key.NumPad0 || e.Key == Key.Escape || e.Key == Key.N)
            {
                e.Handled = true;
                CloseWithChoice(false);
            }
        };

        Loaded += (_, _) =>
        {
            Focus();
            yesButton.Focus();
        };
    }

    private void CloseWithChoice(bool confirmed)
    {
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

    public static void PromptAndRestart(Window? owner = null)
    {
        var dlg = new SystemPowerDialog(PowerAction.Restart);
        if (owner != null && owner.IsVisible) dlg.Owner = owner;
        dlg.ShowDialog();

        if (dlg.Confirmed)
        {
            PerformSystemRestart();
        }
    }

    public static void PromptAndShutdown(Window? owner = null)
    {
        var dlg = new SystemPowerDialog(PowerAction.Shutdown);
        if (owner != null && owner.IsVisible) dlg.Owner = owner;
        dlg.ShowDialog();

        if (dlg.Confirmed)
        {
            PerformSystemShutdown();
        }
    }

    private static void PerformSystemRestart()
    {
        try
        {
            if (Application.Current?.MainWindow is MainWindow mainWin)
            {
                try { mainWin.DisconnectHardwareOnExit(); } catch { }
            }
            else if (Application.Current?.MainWindow is LandscapeWindow landWin)
            {
                try { landWin.DisconnectHardwareOnExit(); } catch { }
            }

            try { HeartbeatService.Stop(); } catch { }

            Process.Start(new ProcessStartInfo
            {
                FileName = "shutdown.exe",
                Arguments = "/r /t 2 /f /c \"Kiosk System Restart\"",
                CreateNoWindow = true,
                UseShellExecute = false
            });

            try { Application.Current?.Shutdown(); } catch { }
            Environment.Exit(0);
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[POWER] Restart error: {ex.Message}");
        }
    }

    private static void PerformSystemShutdown()
    {
        try
        {
            if (Application.Current?.MainWindow is MainWindow mainWin)
            {
                try { mainWin.DisconnectHardwareOnExit(); } catch { }
            }
            else if (Application.Current?.MainWindow is LandscapeWindow landWin)
            {
                try { landWin.DisconnectHardwareOnExit(); } catch { }
            }

            try { HeartbeatService.Stop(); } catch { }

            Process.Start(new ProcessStartInfo
            {
                FileName = "shutdown.exe",
                Arguments = "/s /t 2 /f /c \"Kiosk System Shutdown\"",
                CreateNoWindow = true,
                UseShellExecute = false
            });

            try { Application.Current?.Shutdown(); } catch { }
            Environment.Exit(0);
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[POWER] Shutdown error: {ex.Message}");
        }
    }
}
