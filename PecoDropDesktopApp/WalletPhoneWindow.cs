using System;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Threading;

namespace PecoDropDesktopApp;

public sealed class WalletPhoneWindow : Window
{
    private static readonly Regex DigitOnlyRegex = new(@"^[0-9]+$", RegexOptions.Compiled);
    private static readonly Regex ValidPakPhoneRegex = new(@"^03[0-9]{9}$", RegexOptions.Compiled);

    private readonly int _itemCount;
    private readonly int _points;

    // Controls for Step 1: Phone
    private readonly Grid _rootGrid = new();
    private readonly Border _headerBorder = new();
    private readonly TextBlock _headerTitle = new();
    private readonly TextBlock _headerSubtitle = new();
    private readonly StackPanel _phoneBodyStack = new();
    private readonly TextBox _phoneTextBox = new();
    private readonly TextBlock _validationText = new();
    private readonly Border _inputBorder = new();
    private readonly Border _phoneFooterBorder = new();

    // Controls for Step 2: Rating
    private readonly StackPanel _ratingBodyStack = new();
    private readonly Border _ratingFooterBorder = new();
    private readonly TextBlock[] _starBlocks = new TextBlock[5];
    private readonly TextBlock _ratingBadgeText = new();
    private readonly Border _ratingBadgeBorder = new();
    private readonly TextBlock _countdownText = new();
    private DispatcherTimer? _countdownTimer;
    private int _secondsRemaining = 8;

    // Controls for Step 3: Thank You / Completion
    private readonly StackPanel _thankYouStack = new();

    // State
    public string PhoneNumber { get; private set; } = string.Empty;
    public int Rating { get; private set; } = 5;
    public string FeedbackText { get; private set; } = "Excellent (5)";
    public bool FeedbackSubmitted { get; private set; } = false;

    private enum WindowStep
    {
        PhoneInput,
        Rating,
        Completed
    }

    private WindowStep _currentStep = WindowStep.PhoneInput;

    public WalletPhoneWindow(int itemCount, int points)
    {
        _itemCount = itemCount;
        _points = points;

        Title = "Send Points to Your Wallet";
        try
        {
            Icon = BitmapFrame.Create(new Uri("pack://application:,,,/Assets/RvmIcon.ico"));
        }
        catch { }

        Width = 500;
        SizeToContent = SizeToContent.Height;
        MinHeight = 380;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        ResizeMode = ResizeMode.NoResize;
        WindowStyle = WindowStyle.SingleBorderWindow;
        Background = new SolidColorBrush(Color.FromRgb(15, 23, 42)); // Modern #0F172A

        _rootGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // 0: Header
        _rootGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // 1: Body
        _rootGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // 2: Footer

        BuildHeader();
        BuildPhoneStep();
        BuildRatingStep();
        BuildThankYouStep();

        Content = _rootGrid;

        PreviewKeyDown += WalletPhoneWindow_PreviewKeyDown;
        Closing += (_, _) => StopCountdownTimer();
        Loaded += (_, _) => _phoneTextBox.Focus();
    }

    private void BuildHeader()
    {
        _headerBorder.Background = new SolidColorBrush(Color.FromRgb(30, 41, 59));
        _headerBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(51, 65, 85));
        _headerBorder.BorderThickness = new Thickness(0, 0, 0, 1);
        _headerBorder.Padding = new Thickness(22, 14, 22, 14);
        Grid.SetRow(_headerBorder, 0);

        var headerStack = new StackPanel { Orientation = Orientation.Horizontal, VerticalAlignment = VerticalAlignment.Center };
        
        _headerTitle.Text = "💳 WALLET TRANSFER";
        _headerTitle.FontSize = 12;
        _headerTitle.FontWeight = FontWeights.Bold;
        _headerTitle.Foreground = new SolidColorBrush(Color.FromRgb(56, 189, 248));
        _headerTitle.Margin = new Thickness(0, 0, 10, 0);
        _headerTitle.VerticalAlignment = VerticalAlignment.Center;
        headerStack.Children.Add(_headerTitle);

        _headerSubtitle.Text = "·  Send Points to Wallet";
        _headerSubtitle.FontSize = 14;
        _headerSubtitle.FontWeight = FontWeights.SemiBold;
        _headerSubtitle.Foreground = Brushes.White;
        _headerSubtitle.VerticalAlignment = VerticalAlignment.Center;
        headerStack.Children.Add(_headerSubtitle);

        _headerBorder.Child = headerStack;
        _rootGrid.Children.Add(_headerBorder);
    }

    private void BuildPhoneStep()
    {
        _phoneBodyStack.Margin = new Thickness(24, 18, 24, 12);
        Grid.SetRow(_phoneBodyStack, 1);

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
            Text = $"{_itemCount} Item(s) Recycled",
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
            Text = $"+{_points} PTS",
            FontSize = 18,
            FontWeight = FontWeights.ExtraBold,
            Foreground = new SolidColorBrush(Color.FromRgb(245, 158, 11)),
            TextAlignment = TextAlignment.Right,
            Margin = new Thickness(0, 2, 0, 0)
        });
        summaryGrid.Children.Add(sumRight);
        summaryCard.Child = summaryGrid;
        _phoneBodyStack.Children.Add(summaryCard);

        // Input Label
        var labelStack = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 0, 0, 6) };
        labelStack.Children.Add(new TextBlock
        {
            Text = "📱 MOBILE NUMBER (03xxxxxxxxx)",
            FontSize = 11,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(203, 213, 225))
        });
        _phoneBodyStack.Children.Add(labelStack);

        // Input Box Container
        _inputBorder.Background = new SolidColorBrush(Color.FromRgb(30, 41, 59));
        _inputBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(71, 85, 105));
        _inputBorder.BorderThickness = new Thickness(1.5);
        _inputBorder.CornerRadius = new CornerRadius(10);
        _inputBorder.Padding = new Thickness(8, 2, 8, 2);

        _phoneTextBox.FontSize = 18;
        _phoneTextBox.FontWeight = FontWeights.SemiBold;
        _phoneTextBox.MaxLength = 11;
        _phoneTextBox.Background = Brushes.Transparent;
        _phoneTextBox.Foreground = Brushes.White;
        _phoneTextBox.CaretBrush = Brushes.White;
        _phoneTextBox.BorderThickness = new Thickness(0);
        _phoneTextBox.Padding = new Thickness(4, 6, 4, 6);

        _phoneTextBox.PreviewTextInput += PhoneTextBox_PreviewTextInput;
        DataObject.AddPastingHandler(_phoneTextBox, PhoneTextBox_Pasting);
        _phoneTextBox.TextChanged += PhoneTextBox_TextChanged;
        _phoneTextBox.KeyDown += PhoneTextBox_KeyDown;

        _inputBorder.Child = _phoneTextBox;
        _phoneBodyStack.Children.Add(_inputBorder);

        _phoneBodyStack.Children.Add(new TextBlock
        {
            Text = "Must start with 03 and contain exactly 11 digits (e.g. 03001234567).",
            FontSize = 11,
            Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)),
            Margin = new Thickness(2, 4, 0, 4)
        });

        _validationText.Foreground = new SolidColorBrush(Color.FromRgb(244, 63, 94));
        _validationText.FontSize = 12;
        _validationText.FontWeight = FontWeights.SemiBold;
        _validationText.MinHeight = 18;
        _validationText.Margin = new Thickness(2, 0, 0, 0);
        _phoneBodyStack.Children.Add(_validationText);

        _rootGrid.Children.Add(_phoneBodyStack);

        // Footer Action Buttons Bar
        _phoneFooterBorder.Background = new SolidColorBrush(Color.FromRgb(20, 29, 47));
        _phoneFooterBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(51, 65, 85));
        _phoneFooterBorder.BorderThickness = new Thickness(0, 1, 0, 0);
        _phoneFooterBorder.Padding = new Thickness(22, 14, 22, 16);
        Grid.SetRow(_phoneFooterBorder, 2);

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
            FontSize = 14,
            FontWeight = FontWeights.Bold,
            Height = 42,
            Background = new SolidColorBrush(Color.FromRgb(16, 185, 129)),
            Foreground = Brushes.White,
            BorderThickness = new Thickness(0),
            Cursor = Cursors.Hand
        };
        creditButton.Click += (_, _) => SubmitPhone();
        Grid.SetColumn(creditButton, 2);
        buttonsGrid.Children.Add(creditButton);

        _phoneFooterBorder.Child = buttonsGrid;
        _rootGrid.Children.Add(_phoneFooterBorder);
    }

    private void BuildRatingStep()
    {
        _ratingBodyStack.Margin = new Thickness(24, 18, 24, 14);
        _ratingBodyStack.Visibility = Visibility.Collapsed;
        Grid.SetRow(_ratingBodyStack, 1);

        // Account Credited Badge
        var creditBadge = new Border
        {
            Background = new SolidColorBrush(Color.FromArgb(40, 16, 185, 129)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(16, 185, 129)),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(8),
            Padding = new Thickness(12, 8, 12, 8),
            Margin = new Thickness(0, 0, 0, 18),
            HorizontalAlignment = HorizontalAlignment.Center
        };
        var creditBadgeStack = new StackPanel { Orientation = Orientation.Horizontal };
        creditBadgeStack.Children.Add(new TextBlock
        {
            Text = "✓ Wallet Credited:",
            FontSize = 12,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(52, 211, 153)),
            Margin = new Thickness(0, 0, 6, 0)
        });
        var phoneSummaryText = new TextBlock
        {
            FontSize = 12,
            FontWeight = FontWeights.SemiBold,
            Foreground = Brushes.White
        };
        phoneSummaryText.SetBinding(TextBlock.TextProperty, new System.Windows.Data.Binding(nameof(PhoneNumber)) { Source = this });
        creditBadgeStack.Children.Add(phoneSummaryText);
        creditBadge.Child = creditBadgeStack;
        _ratingBodyStack.Children.Add(creditBadge);

        // Heading & Urdu prompt
        _ratingBodyStack.Children.Add(new TextBlock
        {
            Text = "HOW WAS YOUR EXPERIENCE?",
            FontSize = 18,
            FontWeight = FontWeights.ExtraBold,
            Foreground = Brushes.White,
            HorizontalAlignment = HorizontalAlignment.Center,
            TextAlignment = TextAlignment.Center
        });

        _ratingBodyStack.Children.Add(new TextBlock
        {
            Text = "آپ کا ری سائیکلنگ کا تجربہ کیسا رہا؟",
            FontSize = 16,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(52, 211, 153)),
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 4, 0, 18)
        });

        // 5 Gold Stars Horizontal Row
        var starsGrid = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 0, 0, 16)
        };

        for (int i = 0; i < 5; i++)
        {
            int starIndex = i + 1;
            var starBorder = new Border
            {
                Background = Brushes.Transparent,
                Padding = new Thickness(4, 0, 4, 0),
                Cursor = Cursors.Hand
            };

            var star = new TextBlock
            {
                Text = "★",
                FontSize = 52,
                FontWeight = FontWeights.Bold,
                Foreground = new SolidColorBrush(Color.FromRgb(245, 158, 11)),
                HorizontalAlignment = HorizontalAlignment.Center,
                VerticalAlignment = VerticalAlignment.Center
            };

            starBorder.Child = star;
            starBorder.MouseLeftButtonDown += (_, _) => SetRating(starIndex);
            starBorder.MouseEnter += (_, _) => star.Foreground = new SolidColorBrush(Color.FromRgb(251, 191, 36));
            starBorder.MouseLeave += (_, _) => UpdateStarsDisplay();

            _starBlocks[i] = star;
            starsGrid.Children.Add(starBorder);
        }

        _ratingBodyStack.Children.Add(starsGrid);

        // Rating Label Badge
        _ratingBadgeBorder.Background = new SolidColorBrush(Color.FromRgb(24, 33, 50));
        _ratingBadgeBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(51, 65, 85));
        _ratingBadgeBorder.BorderThickness = new Thickness(1);
        _ratingBadgeBorder.CornerRadius = new CornerRadius(8);
        _ratingBadgeBorder.Padding = new Thickness(16, 6, 16, 6);
        _ratingBadgeBorder.HorizontalAlignment = HorizontalAlignment.Center;
        _ratingBadgeBorder.Margin = new Thickness(0, 0, 0, 14);

        _ratingBadgeText.FontSize = 14;
        _ratingBadgeText.FontWeight = FontWeights.Bold;
        _ratingBadgeText.Foreground = new SolidColorBrush(Color.FromRgb(245, 158, 11));
        _ratingBadgeText.Text = "★★★★★  5/5 — Excellent · بہترین";
        _ratingBadgeBorder.Child = _ratingBadgeText;
        _ratingBodyStack.Children.Add(_ratingBadgeBorder);

        // Keypad hint
        _ratingBodyStack.Children.Add(new TextBlock
        {
            Text = "Press 1 to 5 on keypad or tap stars to rate · Press ENTER to finish",
            FontSize = 11,
            FontWeight = FontWeights.SemiBold,
            Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)),
            HorizontalAlignment = HorizontalAlignment.Center,
            TextAlignment = TextAlignment.Center
        });

        // Countdown Text
        _countdownText.Text = $"Auto-completing in {_secondsRemaining}s...";
        _countdownText.FontSize = 11;
        _countdownText.Foreground = new SolidColorBrush(Color.FromRgb(100, 116, 139));
        _countdownText.HorizontalAlignment = HorizontalAlignment.Center;
        _countdownText.Margin = new Thickness(0, 6, 0, 0);
        _ratingBodyStack.Children.Add(_countdownText);

        _rootGrid.Children.Add(_ratingBodyStack);

        // Rating Footer
        _ratingFooterBorder.Background = new SolidColorBrush(Color.FromRgb(20, 29, 47));
        _ratingFooterBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(51, 65, 85));
        _ratingFooterBorder.BorderThickness = new Thickness(0, 1, 0, 0);
        _ratingFooterBorder.Padding = new Thickness(22, 14, 22, 16);
        _ratingFooterBorder.Visibility = Visibility.Collapsed;
        Grid.SetRow(_ratingFooterBorder, 2);

        var rButtonsGrid = new Grid();
        rButtonsGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        rButtonsGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(10) });
        rButtonsGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1.3, GridUnitType.Star) });

        var skipButton = new Button
        {
            Content = "Skip / چھوڑیں",
            FontSize = 13,
            FontWeight = FontWeights.Bold,
            Height = 42,
            Background = new SolidColorBrush(Color.FromRgb(51, 65, 85)),
            Foreground = new SolidColorBrush(Color.FromRgb(203, 213, 225)),
            BorderThickness = new Thickness(0),
            Cursor = Cursors.Hand
        };
        skipButton.Click += (_, _) => SkipRating();
        Grid.SetColumn(skipButton, 0);
        rButtonsGrid.Children.Add(skipButton);

        var submitRatingButton = new Button
        {
            Content = "Submit Rating ✓",
            FontSize = 14,
            FontWeight = FontWeights.Bold,
            Height = 42,
            Background = new SolidColorBrush(Color.FromRgb(16, 185, 129)),
            Foreground = Brushes.White,
            BorderThickness = new Thickness(0),
            Cursor = Cursors.Hand
        };
        submitRatingButton.Click += (_, _) => SubmitRating();
        Grid.SetColumn(submitRatingButton, 2);
        rButtonsGrid.Children.Add(submitRatingButton);

        _ratingFooterBorder.Child = rButtonsGrid;
        _rootGrid.Children.Add(_ratingFooterBorder);
    }

    private void BuildThankYouStep()
    {
        _thankYouStack.Margin = new Thickness(24, 30, 24, 30);
        _thankYouStack.Visibility = Visibility.Collapsed;
        Grid.SetRow(_thankYouStack, 1);

        _thankYouStack.Children.Add(new TextBlock
        {
            Text = "🌱",
            FontSize = 56,
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 0, 0, 10)
        });

        _thankYouStack.Children.Add(new TextBlock
        {
            Text = "THANK YOU FOR RECYCLING!",
            FontSize = 18,
            FontWeight = FontWeights.Black,
            Foreground = Brushes.White,
            HorizontalAlignment = HorizontalAlignment.Center
        });

        _thankYouStack.Children.Add(new TextBlock
        {
            Text = "ماحول کی حفاظت میں آپ کا شکریہ",
            FontSize = 16,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(52, 211, 153)),
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 6, 0, 8)
        });

        _thankYouStack.Children.Add(new TextBlock
        {
            Text = "Your wallet has been credited and feedback recorded.",
            FontSize = 12,
            Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)),
            HorizontalAlignment = HorizontalAlignment.Center
        });

        _rootGrid.Children.Add(_thankYouStack);
    }

    private void PhoneTextBox_PreviewTextInput(object sender, TextCompositionEventArgs e)
    {
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
        string value = _phoneTextBox.Text.Trim();
        if (string.IsNullOrEmpty(value))
        {
            _validationText.Text = string.Empty;
            _inputBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(71, 85, 105));
            return;
        }

        if (value.Length >= 1 && !value.StartsWith("0"))
        {
            _validationText.Text = "⚠ Invalid number: Must start with 03 (e.g. 03xxxxxxxxx).";
            _inputBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(244, 63, 94));
        }
        else if (value.Length >= 2 && !value.StartsWith("03"))
        {
            _validationText.Text = "⚠ Invalid number: Must start with 03 (e.g. 03xxxxxxxxx).";
            _inputBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(244, 63, 94));
        }
        else if (value.Length > 0 && value.Length < 11)
        {
            _validationText.Text = $"Entering number: {value.Length}/11 digits";
            _validationText.Foreground = new SolidColorBrush(Color.FromRgb(245, 158, 11));
            _inputBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(245, 158, 11));
        }
        else if (value.Length == 11 && ValidPakPhoneRegex.IsMatch(value))
        {
            _validationText.Text = "✓ Valid mobile number";
            _validationText.Foreground = new SolidColorBrush(Color.FromRgb(16, 185, 129));
            _inputBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(16, 185, 129));
        }
    }

    private void PhoneTextBox_KeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.Enter)
        {
            SubmitPhone();
            e.Handled = true;
        }
    }

    private void WalletPhoneWindow_PreviewKeyDown(object sender, KeyEventArgs e)
    {
        if (_currentStep == WindowStep.Rating)
        {
            if (e.Key == Key.D1 || e.Key == Key.NumPad1)
            {
                SetRating(1);
                e.Handled = true;
            }
            else if (e.Key == Key.D2 || e.Key == Key.NumPad2)
            {
                SetRating(2);
                e.Handled = true;
            }
            else if (e.Key == Key.D3 || e.Key == Key.NumPad3)
            {
                SetRating(3);
                e.Handled = true;
            }
            else if (e.Key == Key.D4 || e.Key == Key.NumPad4)
            {
                SetRating(4);
                e.Handled = true;
            }
            else if (e.Key == Key.D5 || e.Key == Key.NumPad5)
            {
                SetRating(5);
                e.Handled = true;
            }
            else if (e.Key == Key.Enter)
            {
                SubmitRating();
                e.Handled = true;
            }
            else if (e.Key == Key.Escape)
            {
                SkipRating();
                e.Handled = true;
            }
        }
    }

    private void SubmitPhone()
    {
        string value = _phoneTextBox.Text.Trim();
        if (string.IsNullOrEmpty(value))
        {
            _validationText.Foreground = new SolidColorBrush(Color.FromRgb(244, 63, 94));
            _validationText.Text = "⚠ Please enter a mobile number.";
            _inputBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(244, 63, 94));
            _phoneTextBox.Focus();
            return;
        }

        if (!value.StartsWith("03"))
        {
            _validationText.Foreground = new SolidColorBrush(Color.FromRgb(244, 63, 94));
            _validationText.Text = "⚠ Invalid number: Must start with 03 (e.g. 03xxxxxxxxx).";
            _inputBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(244, 63, 94));
            _phoneTextBox.Focus();
            return;
        }

        if (value.Length != 11 || !ValidPakPhoneRegex.IsMatch(value))
        {
            _validationText.Foreground = new SolidColorBrush(Color.FromRgb(244, 63, 94));
            _validationText.Text = "⚠ Invalid number length: Must be exactly 11 digits (03xxxxxxxxx).";
            _inputBorder.BorderBrush = new SolidColorBrush(Color.FromRgb(244, 63, 94));
            _phoneTextBox.Focus();
            return;
        }

        PhoneNumber = value;
        TransitionToRatingStep();
    }

    private void TransitionToRatingStep()
    {
        _currentStep = WindowStep.Rating;

        _headerTitle.Text = "⭐ EXPERIENCE RATING";
        _headerTitle.Foreground = new SolidColorBrush(Color.FromRgb(245, 158, 11)); // Gold
        _headerSubtitle.Text = "·  Rate Your Experience";

        _phoneBodyStack.Visibility = Visibility.Collapsed;
        _phoneFooterBorder.Visibility = Visibility.Collapsed;

        _ratingBodyStack.Visibility = Visibility.Visible;
        _ratingFooterBorder.Visibility = Visibility.Visible;

        SetRating(5); // Default to 5 stars
        StartCountdownTimer();
    }

    private void SetRating(int stars)
    {
        Rating = Math.Clamp(stars, 1, 5);

        switch (Rating)
        {
            case 1:
                FeedbackText = "Very Bad (1)";
                _ratingBadgeText.Text = "★☆☆☆☆  1/5 — Very Bad · بہت برا";
                _ratingBadgeText.Foreground = new SolidColorBrush(Color.FromRgb(244, 63, 94));
                break;
            case 2:
                FeedbackText = "Bad (2)";
                _ratingBadgeText.Text = "★★☆☆☆  2/5 — Bad · برا";
                _ratingBadgeText.Foreground = new SolidColorBrush(Color.FromRgb(249, 115, 22));
                break;
            case 3:
                FeedbackText = "Neutral (3)";
                _ratingBadgeText.Text = "★★★☆☆  3/5 — Neutral · درمیانہ";
                _ratingBadgeText.Foreground = new SolidColorBrush(Color.FromRgb(245, 158, 11));
                break;
            case 4:
                FeedbackText = "Very Good (4)";
                _ratingBadgeText.Text = "★★★★☆  4/5 — Very Good · اچھا";
                _ratingBadgeText.Foreground = new SolidColorBrush(Color.FromRgb(132, 204, 22));
                break;
            case 5:
            default:
                FeedbackText = "Excellent (5)";
                _ratingBadgeText.Text = "★★★★★  5/5 — Excellent · بہترین";
                _ratingBadgeText.Foreground = new SolidColorBrush(Color.FromRgb(16, 185, 129));
                break;
        }

        UpdateStarsDisplay();
    }

    private void UpdateStarsDisplay()
    {
        var activeBrush = new SolidColorBrush(Color.FromRgb(245, 158, 11));
        var inactiveBrush = new SolidColorBrush(Color.FromRgb(51, 65, 85));

        for (int i = 0; i < 5; i++)
        {
            if (_starBlocks[i] != null)
            {
                _starBlocks[i].Foreground = (i < Rating) ? activeBrush : inactiveBrush;
            }
        }
    }

    private void StartCountdownTimer()
    {
        StopCountdownTimer();
        _secondsRemaining = 8;
        _countdownText.Text = $"Auto-completing in {_secondsRemaining}s...";

        _countdownTimer = new DispatcherTimer
        {
            Interval = TimeSpan.FromSeconds(1)
        };
        _countdownTimer.Tick += (_, _) =>
        {
            _secondsRemaining--;
            if (_secondsRemaining <= 0)
            {
                StopCountdownTimer();
                SubmitRating();
            }
            else
            {
                _countdownText.Text = $"Auto-completing in {_secondsRemaining}s...";
            }
        };
        _countdownTimer.Start();
    }

    private void StopCountdownTimer()
    {
        if (_countdownTimer != null)
        {
            _countdownTimer.Stop();
            _countdownTimer = null;
        }
    }

    private void SkipRating()
    {
        StopCountdownTimer();
        FeedbackSubmitted = false;
        CompleteAndClose();
    }

    private void SubmitRating()
    {
        StopCountdownTimer();
        FeedbackSubmitted = true;
        CompleteAndClose();
    }

    private void CompleteAndClose()
    {
        _currentStep = WindowStep.Completed;
        _ratingBodyStack.Visibility = Visibility.Collapsed;
        _ratingFooterBorder.Visibility = Visibility.Collapsed;
        _thankYouStack.Visibility = Visibility.Visible;

        var closeTimer = new DispatcherTimer
        {
            Interval = TimeSpan.FromMilliseconds(900)
        };
        closeTimer.Tick += (_, _) =>
        {
            closeTimer.Stop();
            DialogResult = true;
        };
        closeTimer.Start();
    }
}
