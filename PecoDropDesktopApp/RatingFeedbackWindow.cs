using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Threading;

namespace PecoDropDesktopApp;

public sealed class RatingFeedbackWindow : Window
{
    private readonly string _phoneNumber;
    private readonly int _points;
    private readonly int _itemCount;

    private readonly TextBlock[] _starBlocks = new TextBlock[5];
    private readonly TextBlock _ratingBadgeText = new();
    private readonly TextBlock _countdownText = new();
    private DispatcherTimer? _countdownTimer;
    private int _secondsRemaining = 8;

    public int Rating { get; private set; } = 5;
    public string FeedbackText { get; private set; } = "Excellent (5)";
    public bool FeedbackSubmitted { get; private set; } = false;

    public RatingFeedbackWindow(string phoneNumber = "", int points = 0, int itemCount = 0)
    {
        _phoneNumber = phoneNumber;
        _points = points;
        _itemCount = itemCount;

        Title = "Rate Your Recycling Experience";
        try
        {
            Icon = BitmapFrame.Create(new Uri("pack://application:,,,/Assets/RvmIcon.ico"));
        }
        catch { }

        Width = 500;
        SizeToContent = SizeToContent.Height;
        MinHeight = 360;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        ResizeMode = ResizeMode.NoResize;
        WindowStyle = WindowStyle.SingleBorderWindow;
        Background = new SolidColorBrush(Color.FromRgb(15, 23, 42)); // #0F172A

        var rootGrid = new Grid();
        rootGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // Header
        rootGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // Body
        rootGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // Footer

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
            Text = "⭐ EXPERIENCE RATING",
            FontSize = 12,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(245, 158, 11)),
            Margin = new Thickness(0, 0, 10, 0),
            VerticalAlignment = VerticalAlignment.Center
        });
        headerStack.Children.Add(new TextBlock
        {
            Text = "·  Rate Your Experience",
            FontSize = 14,
            FontWeight = FontWeights.SemiBold,
            Foreground = Brushes.White,
            VerticalAlignment = VerticalAlignment.Center
        });
        headerBorder.Child = headerStack;
        rootGrid.Children.Add(headerBorder);

        // 2. Body
        var bodyStack = new StackPanel { Margin = new Thickness(24, 18, 24, 14) };
        Grid.SetRow(bodyStack, 1);

        if (!string.IsNullOrWhiteSpace(_phoneNumber))
        {
            var creditBadge = new Border
            {
                Background = new SolidColorBrush(Color.FromArgb(40, 16, 185, 129)),
                BorderBrush = new SolidColorBrush(Color.FromRgb(16, 185, 129)),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(8),
                Padding = new Thickness(12, 8, 12, 8),
                Margin = new Thickness(0, 0, 0, 16),
                HorizontalAlignment = HorizontalAlignment.Center
            };
            var creditBadgeStack = new StackPanel { Orientation = Orientation.Horizontal };
            creditBadgeStack.Children.Add(new TextBlock
            {
                Text = "✓ Wallet Credited: ",
                FontSize = 12,
                FontWeight = FontWeights.Bold,
                Foreground = new SolidColorBrush(Color.FromRgb(52, 211, 153))
            });
            creditBadgeStack.Children.Add(new TextBlock
            {
                Text = $"{_phoneNumber} (+{_points} PTS)",
                FontSize = 12,
                FontWeight = FontWeights.SemiBold,
                Foreground = Brushes.White
            });
            creditBadge.Child = creditBadgeStack;
            bodyStack.Children.Add(creditBadge);
        }

        bodyStack.Children.Add(new TextBlock
        {
            Text = "HOW WAS YOUR EXPERIENCE?",
            FontSize = 18,
            FontWeight = FontWeights.ExtraBold,
            Foreground = Brushes.White,
            HorizontalAlignment = HorizontalAlignment.Center,
            TextAlignment = TextAlignment.Center
        });

        bodyStack.Children.Add(new TextBlock
        {
            Text = "آپ کا ری سائیکلنگ کا تجربہ کیسا رہا؟",
            FontSize = 16,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(52, 211, 153)),
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 4, 0, 18)
        });

        // 5 Gold Stars
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
        bodyStack.Children.Add(starsGrid);

        // Rating Label Badge
        var ratingBadgeBorder = new Border
        {
            Background = new SolidColorBrush(Color.FromRgb(24, 33, 50)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(51, 65, 85)),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(8),
            Padding = new Thickness(16, 6, 16, 6),
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 0, 0, 14)
        };
        _ratingBadgeText.FontSize = 14;
        _ratingBadgeText.FontWeight = FontWeights.Bold;
        _ratingBadgeText.Foreground = new SolidColorBrush(Color.FromRgb(245, 158, 11));
        _ratingBadgeText.Text = "★★★★★  5/5 — Excellent · بہترین";
        ratingBadgeBorder.Child = _ratingBadgeText;
        bodyStack.Children.Add(ratingBadgeBorder);

        bodyStack.Children.Add(new TextBlock
        {
            Text = "Press 1 to 5 on keypad or tap stars to rate · Press ENTER to finish",
            FontSize = 11,
            FontWeight = FontWeights.SemiBold,
            Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)),
            HorizontalAlignment = HorizontalAlignment.Center,
            TextAlignment = TextAlignment.Center
        });

        _countdownText.Text = $"Auto-completing in {_secondsRemaining}s...";
        _countdownText.FontSize = 11;
        _countdownText.Foreground = new SolidColorBrush(Color.FromRgb(100, 116, 139));
        _countdownText.HorizontalAlignment = HorizontalAlignment.Center;
        _countdownText.Margin = new Thickness(0, 6, 0, 0);
        bodyStack.Children.Add(_countdownText);

        rootGrid.Children.Add(bodyStack);

        // 3. Footer
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
        skipButton.Click += (_, _) => Skip();
        Grid.SetColumn(skipButton, 0);
        buttonsGrid.Children.Add(skipButton);

        var submitButton = new Button
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
        submitButton.Click += (_, _) => Submit();
        Grid.SetColumn(submitButton, 2);
        buttonsGrid.Children.Add(submitButton);

        footerBorder.Child = buttonsGrid;
        rootGrid.Children.Add(footerBorder);

        Content = rootGrid;

        PreviewKeyDown += RatingFeedbackWindow_PreviewKeyDown;
        Closing += (_, _) => StopCountdownTimer();
        Loaded += (_, _) =>
        {
            SetRating(5);
            StartCountdownTimer();
        };
    }

    private void RatingFeedbackWindow_PreviewKeyDown(object sender, KeyEventArgs e)
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
            Submit();
            e.Handled = true;
        }
        else if (e.Key == Key.Escape)
        {
            Skip();
            e.Handled = true;
        }
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
                Submit();
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

    private void Skip()
    {
        StopCountdownTimer();
        FeedbackSubmitted = false;
        DialogResult = true;
    }

    private void Submit()
    {
        StopCountdownTimer();
        FeedbackSubmitted = true;
        DialogResult = true;
    }
}
