using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;

namespace RVMDesktopApp;

public sealed class AdminLoginWindow : Window
{
    private readonly TextBox usernameBox = new();
    private readonly PasswordBox passwordBox = new();
    private readonly TextBlock errorText = new();

    public AdminLoginWindow()
    {
        Title = "RVM Admin Panel Login";
        Icon = BitmapFrame.Create(new Uri("pack://application:,,,/Assets/RvmIcon.ico"));
        Width = 420;
        Height = 320;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        ResizeMode = ResizeMode.NoResize;
        Background = Brushes.White;

        var mainPanel = new StackPanel { Margin = new Thickness(30) };

        mainPanel.Children.Add(new TextBlock
        {
            Text = "🔒 Admin Security Access",
            FontSize = 20,
            FontWeight = FontWeights.Bold,
            Foreground = Brushes.DarkSlateGray
        });

        mainPanel.Children.Add(new TextBlock
        {
            Text = "Enter administrator credentials to unlock system setup.",
            Margin = new Thickness(0, 4, 0, 18),
            FontSize = 12,
            Foreground = Brushes.DimGray
        });

        // Username
        mainPanel.Children.Add(new TextBlock { Text = "Username", FontWeight = FontWeights.SemiBold, FontSize = 12 });
        usernameBox.Text = "RVM";
        usernameBox.Margin = new Thickness(0, 4, 0, 12);
        usernameBox.FontSize = 14;
        usernameBox.Padding = new Thickness(8, 6, 8, 6);
        mainPanel.Children.Add(usernameBox);

        // Password
        mainPanel.Children.Add(new TextBlock { Text = "Password", FontWeight = FontWeights.SemiBold, FontSize = 12 });
        passwordBox.Margin = new Thickness(0, 4, 0, 6);
        passwordBox.FontSize = 14;
        passwordBox.Padding = new Thickness(8, 6, 8, 6);
        passwordBox.KeyDown += PasswordBox_KeyDown;
        mainPanel.Children.Add(passwordBox);

        // Error message
        errorText.Foreground = Brushes.OrangeRed;
        errorText.FontSize = 12;
        errorText.MinHeight = 18;
        mainPanel.Children.Add(errorText);

        // Buttons
        var buttonsPanel = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Right,
            Margin = new Thickness(0, 10, 0, 0)
        };

        var cancelButton = new Button
        {
            Content = "Cancel",
            IsCancel = true,
            Padding = new Thickness(16, 6, 16, 6),
            Margin = new Thickness(0, 0, 8, 0)
        };

        var loginButton = new Button
        {
            Content = "Login to Admin",
            IsDefault = true,
            Padding = new Thickness(16, 6, 16, 6),
            Background = Brushes.DarkCyan,
            Foreground = Brushes.White,
            FontWeight = FontWeights.Bold
        };
        loginButton.Click += LoginButton_Click;

        buttonsPanel.Children.Add(cancelButton);
        buttonsPanel.Children.Add(loginButton);
        mainPanel.Children.Add(buttonsPanel);

        Content = mainPanel;
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
            errorText.Text = "Username is required.";
            usernameBox.Focus();
            return;
        }

        if (string.IsNullOrEmpty(password))
        {
            errorText.Text = "Password is required.";
            passwordBox.Focus();
            return;
        }

        if (DatabaseManager.VerifyAdminCredentials(username, password))
        {
            DialogResult = true;
        }
        else
        {
            errorText.Text = "Invalid username or password. Default: RVM / Admin786";
            passwordBox.SelectAll();
            passwordBox.Focus();
        }
    }
}
