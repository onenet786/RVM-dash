using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Media.Imaging;

namespace RVMDesktopApp;

public enum MessageDialogType
{
    Info,
    Success,
    Warning,
    Error,
    Confirm
}

public sealed class RvmMessageDialog : Window
{
    public RvmMessageDialog(string title, string message, MessageDialogType dialogType = MessageDialogType.Info)
    {
        Title = title;
        Icon = BitmapFrame.Create(new Uri("pack://application:,,,/Assets/RvmIcon.ico"));
        Width = 480;
        Height = 260;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        ResizeMode = ResizeMode.NoResize;
        WindowStyle = WindowStyle.SingleBorderWindow;
        Background = new SolidColorBrush(Color.FromRgb(15, 23, 42)); // #0F172A Dark Slate

        var rootGrid = new Grid { Margin = new Thickness(0) };
        rootGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(60) });
        rootGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });
        rootGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(56) });

        // Colors & Icons based on type
        Color accentColor;
        string iconHeader;

        switch (dialogType)
        {
            case MessageDialogType.Success:
                accentColor = Color.FromRgb(16, 185, 129); // Emerald #10B981
                iconHeader = "✅ SUCCESS";
                break;
            case MessageDialogType.Error:
                accentColor = Color.FromRgb(244, 63, 94); // Rose #F43F5E
                iconHeader = "🔴 ERROR";
                break;
            case MessageDialogType.Warning:
                accentColor = Color.FromRgb(245, 158, 11); // Amber #F59E0B
                iconHeader = "⚠️ WARNING";
                break;
            case MessageDialogType.Confirm:
                accentColor = Color.FromRgb(56, 189, 248); // Cyan #38BDF8
                iconHeader = "❓ CONFIRMATION";
                break;
            case MessageDialogType.Info:
            default:
                accentColor = Color.FromRgb(56, 189, 248); // Cyan #38BDF8
                iconHeader = "ℹ️ INFORMATION";
                break;
        }

        var accentBrush = new SolidColorBrush(accentColor);

        // Header Border
        var headerBorder = new Border
        {
            Background = new SolidColorBrush(Color.FromRgb(30, 41, 59)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(51, 65, 85)),
            BorderThickness = new Thickness(0, 0, 0, 1),
            Padding = new Thickness(24, 0, 24, 0)
        };
        Grid.SetRow(headerBorder, 0);

        var headerStack = new StackPanel { Orientation = Orientation.Horizontal, VerticalAlignment = VerticalAlignment.Center };
        headerStack.Children.Add(new TextBlock
        {
            Text = iconHeader,
            FontSize = 13,
            FontWeight = FontWeights.Bold,
            Foreground = accentBrush,
            Margin = new Thickness(0, 0, 10, 0)
        });
        headerStack.Children.Add(new TextBlock
        {
            Text = title,
            FontSize = 15,
            FontWeight = FontWeights.SemiBold,
            Foreground = Brushes.White,
            TextTrimming = TextTrimming.CharacterEllipsis
        });
        headerBorder.Child = headerStack;
        rootGrid.Children.Add(headerBorder);

        // Content Area
        var contentBorder = new Border
        {
            Padding = new Thickness(24, 16, 24, 16)
        };
        Grid.SetRow(contentBorder, 1);

        var messageScroll = new ScrollViewer
        {
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            Content = new TextBlock
            {
                Text = message,
                FontSize = 13,
                Foreground = new SolidColorBrush(Color.FromRgb(226, 232, 240)), // #E2E8F0
                TextWrapping = TextWrapping.Wrap,
                LineHeight = 20
            }
        };
        contentBorder.Child = messageScroll;
        rootGrid.Children.Add(contentBorder);

        // Footer Action Buttons
        var footerBorder = new Border
        {
            Background = new SolidColorBrush(Color.FromRgb(30, 41, 59)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(51, 65, 85)),
            BorderThickness = new Thickness(0, 1, 0, 0),
            Padding = new Thickness(24, 0, 24, 0)
        };
        Grid.SetRow(footerBorder, 2);

        var buttonsPanel = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Right,
            VerticalAlignment = VerticalAlignment.Center
        };

        if (dialogType == MessageDialogType.Confirm)
        {
            var cancelButton = new Button
            {
                Content = "Cancel",
                IsCancel = true,
                Padding = new Thickness(18, 7, 18, 7),
                Margin = new Thickness(0, 0, 10, 0),
                Background = new SolidColorBrush(Color.FromRgb(51, 65, 85)),
                Foreground = Brushes.White,
                FontWeight = FontWeights.SemiBold
            };
            buttonsPanel.Children.Add(cancelButton);
        }

        var okButton = new Button
        {
            Content = dialogType == MessageDialogType.Confirm ? "Yes, Proceed" : "OK",
            IsDefault = true,
            Padding = new Thickness(22, 7, 22, 7),
            Background = accentBrush,
            Foreground = dialogType == MessageDialogType.Warning || dialogType == MessageDialogType.Info || dialogType == MessageDialogType.Confirm ? new SolidColorBrush(Color.FromRgb(15, 23, 42)) : Brushes.White,
            FontWeight = FontWeights.Bold
        };
        okButton.Click += (_, _) =>
        {
            DialogResult = true;
            Close();
        };

        buttonsPanel.Children.Add(okButton);
        footerBorder.Child = buttonsPanel;
        rootGrid.Children.Add(footerBorder);

        Content = rootGrid;
    }

    public static void ShowInfo(string title, string message, Window? owner = null)
    {
        var dlg = new RvmMessageDialog(title, message, MessageDialogType.Info);
        if (owner != null) dlg.Owner = owner;
        dlg.ShowDialog();
    }

    public static void ShowSuccess(string title, string message, Window? owner = null)
    {
        var dlg = new RvmMessageDialog(title, message, MessageDialogType.Success);
        if (owner != null) dlg.Owner = owner;
        dlg.ShowDialog();
    }

    public static void ShowWarning(string title, string message, Window? owner = null)
    {
        var dlg = new RvmMessageDialog(title, message, MessageDialogType.Warning);
        if (owner != null) dlg.Owner = owner;
        dlg.ShowDialog();
    }

    public static void ShowError(string title, string message, Window? owner = null)
    {
        var dlg = new RvmMessageDialog(title, message, MessageDialogType.Error);
        if (owner != null) dlg.Owner = owner;
        dlg.ShowDialog();
    }

    public static bool ShowConfirm(string title, string message, Window? owner = null)
    {
        var dlg = new RvmMessageDialog(title, message, MessageDialogType.Confirm);
        if (owner != null) dlg.Owner = owner;
        return dlg.ShowDialog() == true;
    }
}
