using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;

namespace RVMDesktopApp;

public sealed class WalletPhoneWindow : Window
{
    private static readonly Regex PhonePattern = new(@"^\+?[0-9]{7,15}$", RegexOptions.Compiled);
    private readonly TextBox phoneTextBox = new();
    private readonly TextBlock validationText = new();

    public string PhoneNumber { get; private set; } = string.Empty;

    public WalletPhoneWindow(int itemCount, int points)
    {
        Title = "Credit Wallet";
        Icon = BitmapFrame.Create(new Uri("pack://application:,,,/Assets/RvmIcon.ico"));
        Width = 440;
        Height = 300;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        ResizeMode = ResizeMode.NoResize;
        Background = Brushes.White;

        var panel = new StackPanel { Margin = new Thickness(30) };
        panel.Children.Add(new TextBlock { Text = "Send points to your wallet", FontSize = 22, FontWeight = FontWeights.Bold });
        panel.Children.Add(new TextBlock { Text = $"{itemCount} item(s) - {points} point(s)", Margin = new Thickness(0, 8, 0, 22), FontSize = 15, Foreground = Brushes.DimGray });
        panel.Children.Add(new TextBlock { Text = "Phone number", FontWeight = FontWeights.SemiBold });

        phoneTextBox.Margin = new Thickness(0, 6, 0, 4);
        phoneTextBox.FontSize = 18;
        phoneTextBox.MaxLength = 16;
        phoneTextBox.Padding = new Thickness(10, 7, 10, 7);
        phoneTextBox.KeyDown += PhoneTextBox_KeyDown;
        panel.Children.Add(phoneTextBox);

        validationText.Foreground = Brushes.OrangeRed;
        validationText.MinHeight = 20;
        panel.Children.Add(validationText);

        var buttons = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Right, Margin = new Thickness(0, 10, 0, 0) };
        var cancelButton = new Button { Content = "Cancel", IsCancel = true, Padding = new Thickness(16, 7, 16, 7), Margin = new Thickness(0, 0, 8, 0) };
        var creditButton = new Button { Content = "Credit wallet", IsDefault = true, Padding = new Thickness(16, 7, 16, 7), Background = Brushes.ForestGreen, Foreground = Brushes.White };
        creditButton.Click += CreditButton_Click;
        buttons.Children.Add(cancelButton);
        buttons.Children.Add(creditButton);
        panel.Children.Add(buttons);

        Content = panel;
        Loaded += (_, _) => phoneTextBox.Focus();
    }

    private void PhoneTextBox_KeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.Enter)
        {
            Submit();
            e.Handled = true;
        }
    }

    private void CreditButton_Click(object sender, RoutedEventArgs e) => Submit();

    private void Submit()
    {
        string value = phoneTextBox.Text.Trim().Replace(" ", string.Empty).Replace("-", string.Empty);
        if (!PhonePattern.IsMatch(value))
        {
            validationText.Text = "Enter a valid phone number (7-15 digits).";
            return;
        }

        PhoneNumber = value;
        DialogResult = true;
    }
}
