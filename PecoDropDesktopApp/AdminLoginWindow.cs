using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;

namespace PecoDropDesktopApp;

public sealed class AdminLoginWindow : Window
{
    private readonly TextBox usernameBox = new();
    private readonly PasswordBox passwordBox = new();
    private readonly TextBlock errorText = new();

    public AdminLoginWindow()
    {
        Title = "RVM Admin Panel Login";
        try
        {
            Icon = BitmapFrame.Create(new Uri("pack://application:,,,/Assets/RvmIcon.ico"));
        }
        catch { }

        Width = 480;
        Height = 460;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        ResizeMode = ResizeMode.NoResize;
        Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#0F172A")); // Dark Slate

        var rootGrid = new Grid { Margin = new Thickness(24) };
        rootGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // Header
        rootGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) }); // Form Body
        rootGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // Buttons & Footer

        // ---- HEADER ----
        var headerPanel = new StackPanel { Margin = new Thickness(0, 0, 0, 20) };
        var titleStack = new StackPanel { Orientation = Orientation.Horizontal };

        titleStack.Children.Add(new TextBlock
        {
            Text = "🛡️",
            FontSize = 24,
            Margin = new Thickness(0, 0, 10, 0),
            VerticalAlignment = VerticalAlignment.Center
        });

        titleStack.Children.Add(new TextBlock
        {
            Text = "Admin Security Access",
            FontSize = 22,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#38BDF8")), // Cyan
            VerticalAlignment = VerticalAlignment.Center
        });

        headerPanel.Children.Add(titleStack);

        headerPanel.Children.Add(new TextBlock
        {
            Text = "Enter administrator credentials to unlock system configuration.",
            Margin = new Thickness(0, 6, 0, 0),
            FontSize = 13,
            Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#94A3B8")) // Slate Muted
        });

        Grid.SetRow(headerPanel, 0);
        rootGrid.Children.Add(headerPanel);

        // ---- FORM BODY ----
        var formPanel = new StackPanel();

        // Username Label & Box
        formPanel.Children.Add(new TextBlock
        {
            Text = "USERNAME",
            FontWeight = FontWeights.Bold,
            FontSize = 11,
            Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#cbd5e1")),
            Margin = new Thickness(0, 0, 0, 6)
        });

        usernameBox.Text = "RVM";
        usernameBox.FontSize = 14;
        usernameBox.FontWeight = FontWeights.SemiBold;
        usernameBox.Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#1E293B"));
        usernameBox.Foreground = Brushes.White;
        usernameBox.BorderBrush = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#334155"));
        usernameBox.BorderThickness = new Thickness(1);
        usernameBox.Padding = new Thickness(10, 8, 10, 8);
        usernameBox.Margin = new Thickness(0, 0, 0, 16);
        formPanel.Children.Add(usernameBox);

        // Password Label & Box
        formPanel.Children.Add(new TextBlock
        {
            Text = "PASSWORD",
            FontWeight = FontWeights.Bold,
            FontSize = 11,
            Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#cbd5e1")),
            Margin = new Thickness(0, 0, 0, 6)
        });

        passwordBox.FontSize = 14;
        passwordBox.Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#1E293B"));
        passwordBox.Foreground = Brushes.White;
        passwordBox.BorderBrush = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#334155"));
        passwordBox.BorderThickness = new Thickness(1);
        passwordBox.Padding = new Thickness(10, 8, 10, 8);
        passwordBox.Margin = new Thickness(0, 0, 0, 10);
        passwordBox.KeyDown += PasswordBox_KeyDown;
        formPanel.Children.Add(passwordBox);

        // Error message container
        errorText.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#F87171")); // Red
        errorText.FontSize = 12;
        errorText.FontWeight = FontWeights.SemiBold;
        errorText.MinHeight = 22;
        errorText.TextWrapping = TextWrapping.Wrap;
        formPanel.Children.Add(errorText);

        Grid.SetRow(formPanel, 1);
        rootGrid.Children.Add(formPanel);

        // ---- FOOTER & BUTTONS ----
        var footerPanel = new StackPanel { Margin = new Thickness(0, 10, 0, 0) };

        var buttonsGrid = new Grid();
        buttonsGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        buttonsGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(12) });
        buttonsGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1.3, GridUnitType.Star) });

        var cancelButton = new Button
        {
            Content = "Cancel",
            IsCancel = true,
            Height = 42,
            Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#1E293B")),
            Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#94A3B8")),
            BorderBrush = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#334155")),
            BorderThickness = new Thickness(1),
            FontWeight = FontWeights.SemiBold,
            FontSize = 13,
            Cursor = Cursors.Hand
        };
        Grid.SetColumn(cancelButton, 0);

        var loginButton = new Button
        {
            Content = "🔓 Login to Admin",
            IsDefault = true,
            Height = 42,
            Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#0891B2")), // Cyan Teal
            Foreground = Brushes.White,
            BorderThickness = new Thickness(0),
            FontWeight = FontWeights.Bold,
            FontSize = 13,
            Cursor = Cursors.Hand
        };
        loginButton.Click += LoginButton_Click;
        Grid.SetColumn(loginButton, 2);

        buttonsGrid.Children.Add(cancelButton);
        buttonsGrid.Children.Add(loginButton);
        footerPanel.Children.Add(buttonsGrid);

        // Default Credentials Chip
        var hintBorder = new Border
        {
            Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#1E293B")),
            BorderBrush = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#334155")),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(6),
            Padding = new Thickness(10, 6, 10, 6),
            Margin = new Thickness(0, 14, 0, 0)
        };

        var hintText = new TextBlock
        {
            Text = "🔑 Default Access: Username: RVM | Password: Admin786",
            FontSize = 11,
            Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#0EA5E9")),
            HorizontalAlignment = HorizontalAlignment.Center,
            FontWeight = FontWeights.SemiBold
        };
        hintBorder.Child = hintText;
        footerPanel.Children.Add(hintBorder);

        Grid.SetRow(footerPanel, 2);
        rootGrid.Children.Add(footerPanel);

        Content = rootGrid;
        Loaded += (_, _) => passwordBox.Focus();
    }

    private void PasswordBox_KeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.Enter)
        {
            AttemptLogin();
            e.Handled = true;
        }
    }

    private void LoginButton_Click(object sender, RoutedEventArgs e) => AttemptLogin();

    private void AttemptLogin()
    {
        string username = usernameBox.Text.Trim();
        string password = passwordBox.Password;

        if (string.IsNullOrWhiteSpace(username))
        {
            errorText.Text = "⚠️ Username is required.";
            usernameBox.Focus();
            return;
        }

        if (string.IsNullOrEmpty(password))
        {
            errorText.Text = "⚠️ Password is required.";
            passwordBox.Focus();
            return;
        }

        if (DatabaseManager.VerifyAdminCredentials(username, password))
        {
            DialogResult = true;
        }
        else
        {
            errorText.Text = "❌ Invalid credentials. Default: RVM / Admin786";
            passwordBox.SelectAll();
            passwordBox.Focus();
        }
    }
}
