using System;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;

namespace PecoDropDesktopApp;

public sealed class WalletPhoneWindow : Window
{
    private static readonly Regex DigitOnlyRegex = new(@"^[0-9]+$", RegexOptions.Compiled);
    private static readonly Regex ValidPakPhoneRegex = new(@"^03[0-9]{9}$", RegexOptions.Compiled);
    private readonly TextBox phoneTextBox = new();
    private readonly TextBlock validationText = new();
    private readonly Border inputBorder = new();

    public string PhoneNumber { get; private set; } = string.Empty;

    public WalletPhoneWindow(int itemCount, int points)
    {
        Title = "Send Points to Your Wallet";
        try
        {
            Icon = BitmapFrame.Create(new Uri("pack://application:,,,/Assets/RvmIcon.ico"));
        }
        catch { }

        Width = 480;
        SizeToContent = SizeToContent.Height;
        MinHeight = 360;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        ResizeMode = ResizeMode.NoResize;
        WindowStyle = WindowStyle.SingleBorderWindow;
        Background = new SolidColorBrush(Color.FromRgb(15, 23, 42)); // Modern #0F172A

        var rootGrid = new Grid();
        rootGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // Header
        rootGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // Body / Summary / Input
        rootGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // Actions

        // 1. Header
        var headerBorder = new Border
        {
            Background = new SolidColorBrush(Color.FromRgb(30, 41, 59)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(51, 65, 85)),
            BorderThickness = new Thickness(0, 0, 0, 1),
            Padding = new Thickness(22, 14, 22, 14)
        };
        Grid.SetRow(headerBorder, 0);

        var headerStack = new StackPanel { Orientation = Orientation.Horizontal, VerticalAlignment = VerticalAlignment.Center };
        headerStack.Children.Add(new TextBlock
        {
            Text = "💳 WALLET TRANSFER",
            FontSize = 12,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(56, 189, 248)),
            Margin = new Thickness(0, 0, 10, 0),
            VerticalAlignment = VerticalAlignment.Center
        });
        headerStack.Children.Add(new TextBlock
        {
            Text = "·  Send Points to Wallet",
            FontSize = 14,
            FontWeight = FontWeights.SemiBold,
            Foreground = Brushes.White,
            VerticalAlignment = VerticalAlignment.Center
        });
        headerBorder.Child = headerStack;
        rootGrid.Children.Add(headerBorder);

        // 2. Main Content Body
        var bodyStack = new StackPanel { Margin = new Thickness(24, 18, 24, 12) };
        Grid.SetRow(bodyStack, 1);

        // Summary Card
        var summaryCard = new Border
        {
            Background = new SolidColorBrush(Color.FromRgb(24, 33, 50)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(51, 65, 85)),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(12),
            Padding = new Thickness(16, 12, 16, 12),
            Margin = new Thickness(0, 0, 0, 16)
        };

        var summaryGrid = new Grid();
        summaryGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        summaryGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

        var sumLeft = new StackPanel();
        sumLeft.Children.Add(new TextBlock
        {
            Text = "RECYCLED DEPOSIT",
            FontSize = 10,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184))
        });
        sumLeft.Children.Add(new TextBlock
        {
            Text = $"{itemCount} Item(s) Recycled",
            FontSize = 15,
            FontWeight = FontWeights.Bold,
            Foreground = Brushes.White,
            Margin = new Thickness(0, 2, 0, 0)
        });
        summaryGrid.Children.Add(sumLeft);

        var sumRight = new StackPanel { HorizontalAlignment = HorizontalAlignment.Right };
        Grid.SetColumn(sumRight, 1);
        sumRight.Children.Add(new TextBlock
        {
            Text = "POINTS TO CREDIT",
            FontSize = 10,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(245, 158, 11)),
            TextAlignment = TextAlignment.Right
        });
        sumRight.Children.Add(new TextBlock
        {
            Text = $"+{points} PTS",
            FontSize = 18,
            FontWeight = FontWeights.ExtraBold,
            Foreground = new SolidColorBrush(Color.FromRgb(245, 158, 11)),
            TextAlignment = TextAlignment.Right,
            Margin = new Thickness(0, 2, 0, 0)
        });
        summaryGrid.Children.Add(sumRight);
        summaryCard.Child = summaryGrid;
        bodyStack.Children.Add(summaryCard);

        // Input Label
        var labelStack = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 0, 0, 6) };
        labelStack.Children.Add(new TextBlock
        {
            Text = "📱 MOBILE NUMBER (03xxxxxxxxx)",
            FontSize = 11,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(203, 213, 225))
        });
        bodyStack.Children.Add(labelStack);

        // Input Box Container
        inputBorder.Background = new SolidColorBrush(Color.FromRgb(30, 41, 59));
        inputBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(71, 85, 105));
        inputBorder.BorderThickness = new Thickness(1.5);
        inputBorder.CornerRadius = new CornerRadius(10);
        inputBorder.Padding = new Thickness(8, 2, 8, 2);

        phoneTextBox.FontSize = 18;
        phoneTextBox.FontWeight = FontWeights.SemiBold;
        phoneTextBox.MaxLength = 11; // 03xxxxxxxxx max 11 digits
        phoneTextBox.Background = Brushes.Transparent;
        phoneTextBox.Foreground = Brushes.White;
        phoneTextBox.CaretBrush = Brushes.White;
        phoneTextBox.BorderThickness = new Thickness(0);
        phoneTextBox.Padding = new Thickness(4, 6, 4, 6);
        
        // Restrict to only numbers
        phoneTextBox.PreviewTextInput += PhoneTextBox_PreviewTextInput;
        DataObject.AddPastingHandler(phoneTextBox, PhoneTextBox_Pasting);
        phoneTextBox.TextChanged += PhoneTextBox_TextChanged;
        phoneTextBox.KeyDown += PhoneTextBox_KeyDown;

        inputBorder.Child = phoneTextBox;
        bodyStack.Children.Add(inputBorder);

        // Subtitle / Helper
        bodyStack.Children.Add(new TextBlock
        {
            Text = "Must start with 03 and contain exactly 11 digits (e.g. 03001234567).",
            FontSize = 11,
            Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)),
            Margin = new Thickness(2, 4, 0, 4)
        });

        // Validation Error Text
        validationText.Foreground = new SolidColorBrush(Color.FromRgb(244, 63, 94));
        validationText.FontSize = 12;
        validationText.FontWeight = FontWeights.SemiBold;
        validationText.MinHeight = 18;
        validationText.Margin = new Thickness(2, 0, 0, 0);
        bodyStack.Children.Add(validationText);

        rootGrid.Children.Add(bodyStack);

        // 3. Footer Action Buttons Bar
        var footerBorder = new Border
        {
            Background = new SolidColorBrush(Color.FromRgb(20, 29, 47)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(51, 65, 85)),
            BorderThickness = new Thickness(0, 1, 0, 0),
            Padding = new Thickness(22, 14, 22, 16)
        };
        Grid.SetRow(footerBorder, 2);

        var buttonsGrid = new Grid();
        buttonsGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        buttonsGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(10) });
        buttonsGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1.3, GridUnitType.Star) });

        var cancelButton = new Button
        {
            Content = "✖  Cancel",
            IsCancel = true,
            FontSize = 13,
            FontWeight = FontWeights.Bold,
            Height = 42,
            Background = new SolidColorBrush(Color.FromRgb(51, 65, 85)),
            Foreground = Brushes.White,
            BorderThickness = new Thickness(0),
            Cursor = Cursors.Hand
        };
        Grid.SetColumn(cancelButton, 0);
        buttonsGrid.Children.Add(cancelButton);

        var creditButton = new Button
        {
            Content = "Credit Wallet  ✓",
            IsDefault = true,
            FontSize = 14,
            FontWeight = FontWeights.Bold,
            Height = 42,
            Background = new SolidColorBrush(Color.FromRgb(16, 185, 129)), // Emerald Green #10B981
            Foreground = Brushes.White,
            BorderThickness = new Thickness(0),
            Cursor = Cursors.Hand
        };
        creditButton.Click += CreditButton_Click;
        Grid.SetColumn(creditButton, 2);
        buttonsGrid.Children.Add(creditButton);

        footerBorder.Child = buttonsGrid;
        rootGrid.Children.Add(footerBorder);

        Content = rootGrid;
        Loaded += (_, _) => phoneTextBox.Focus();
    }

    private void PhoneTextBox_PreviewTextInput(object sender, TextCompositionEventArgs e)
    {
        // Strictly allow only digit characters 0-9
        e.Handled = !DigitOnlyRegex.IsMatch(e.Text);
    }

    private void PhoneTextBox_Pasting(object sender, DataObjectPastingEventArgs e)
    {
        if (e.DataObject.GetDataPresent(typeof(string)))
        {
            string text = (string)e.DataObject.GetData(typeof(string));
            if (!DigitOnlyRegex.IsMatch(text))
            {
                e.CancelCommand();
            }
        }
        else
        {
            e.CancelCommand();
        }
    }

    private void PhoneTextBox_TextChanged(object sender, TextChangedEventArgs e)
    {
        string value = phoneTextBox.Text.Trim();
        if (string.IsNullOrEmpty(value))
        {
            validationText.Text = string.Empty;
            inputBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(71, 85, 105));
            return;
        }

        if (value.Length >= 1 && !value.StartsWith("0"))
        {
            validationText.Text = "⚠ Invalid number: Must start with 03 (e.g. 03xxxxxxxxx).";
            inputBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(244, 63, 94));
        }
        else if (value.Length >= 2 && !value.StartsWith("03"))
        {
            validationText.Text = "⚠ Invalid number: Must start with 03 (e.g. 03xxxxxxxxx).";
            inputBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(244, 63, 94));
        }
        else if (value.Length > 0 && value.Length < 11)
        {
            validationText.Text = $"Entering number: {value.Length}/11 digits";
            validationText.Foreground = new SolidColorBrush(Color.FromRgb(245, 158, 11)); // Amber info
            inputBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(245, 158, 11));
        }
        else if (value.Length == 11 && ValidPakPhoneRegex.IsMatch(value))
        {
            validationText.Text = "✓ Valid mobile number";
            validationText.Foreground = new SolidColorBrush(Color.FromRgb(16, 185, 129)); // Emerald success
            inputBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(16, 185, 129));
        }
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
        string value = phoneTextBox.Text.Trim();
        if (string.IsNullOrEmpty(value))
        {
            validationText.Foreground = new SolidColorBrush(Color.FromRgb(244, 63, 94));
            validationText.Text = "⚠ Please enter a mobile number.";
            inputBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(244, 63, 94));
            phoneTextBox.Focus();
            return;
        }

        if (!value.StartsWith("03"))
        {
            validationText.Foreground = new SolidColorBrush(Color.FromRgb(244, 63, 94));
            validationText.Text = "⚠ Invalid number: Must start with 03 (e.g. 03xxxxxxxxx).";
            inputBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(244, 63, 94));
            phoneTextBox.Focus();
            return;
        }

        if (value.Length != 11 || !ValidPakPhoneRegex.IsMatch(value))
        {
            validationText.Foreground = new SolidColorBrush(Color.FromRgb(244, 63, 94));
            validationText.Text = "⚠ Invalid number length: Must be exactly 11 digits (03xxxxxxxxx).";
            inputBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(244, 63, 94));
            phoneTextBox.Focus();
            return;
        }

        PhoneNumber = value;
        DialogResult = true;
    }
}
