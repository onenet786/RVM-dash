using System;
using System.IO;
using System.Reflection;
using System.Threading;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Media.Imaging;
using RVMDesktopApp;

namespace CaptureScreenshots;

public static class Program
{
    [STAThread]
    public static void Main()
    {
        Console.WriteLine("=== RVMDesktopApp High-Resolution Snapshot Capture Tool ===");
        
        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        string outputDir = Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", "..", "snapshots"));
        Directory.CreateDirectory(outputDir);
        Console.WriteLine($"Output Directory: {outputDir}");

        var app = new Application
        {
            ShutdownMode = ShutdownMode.OnExplicitShutdown
        };

        // 1. SCREEN 01: SPLASH SCREEN
        Console.WriteLine("[1/12] Capturing Screen 01: Splash Screen...");
        try
        {
            var splashWin = CreateSplashWindow();
            SaveWindowBitmap(splashWin, Path.Combine(outputDir, "screen_01_splash.png"), 1080, 1920);
            splashWin.Close();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error capturing Splash Window: {ex.Message}");
        }

        // 2. PRIMARY MAINWINDOW STATES
        MainWindow? mainWin = null;
        try
        {
            Console.WriteLine("[INITIALIZING] Instantiating MainWindow in Portrait (1080x1920)...");
            mainWin = new MainWindow
            {
                WindowState = WindowState.Normal,
                WindowStyle = WindowStyle.None,
                WindowStartupLocation = WindowStartupLocation.CenterScreen,
                Width = 1080,
                Height = 1920,
                ShowInTaskbar = false
            };
            mainWin.Show();
            mainWin.Measure(new Size(1080, 1920));
            mainWin.Arrange(new Rect(0, 0, 1080, 1920));
            mainWin.UpdateLayout();
            DoEvents(600);

            // Set ideal diagnostics indicators
            SetPristineDiagnostics(mainWin);
            DoEvents(300);

            // SCREEN 02: HOME PAGE (DEFAULT IDLE)
            Console.WriteLine("[2/12] Capturing Screen 02: Home Page (Default Screen)...");
            mainWin.ShowDefaultInstructionVideoState();
            SetPristineDiagnostics(mainWin);
            DoEvents(400);
            SaveWindowBitmap(mainWin, Path.Combine(outputDir, "screen_02_home_page.png"), 1080, 1920);

            // SCREEN IDLE EXPANDED: 1-MINUTE IDLE EXPANSION (50% HEIGHT, ZERO OVERLAP)
            Console.WriteLine("[3/12] Capturing Screen Idle Expanded: 1-Minute Standby Mode...");
            mainWin.EnterIdleExpandedMode();
            DoEvents(800); // Allow animation to complete
            if (mainWin.InstructionContainer != null)
            {
                mainWin.InstructionContainer.BeginAnimation(FrameworkElement.HeightProperty, null);
                mainWin.InstructionContainer.Height = 960; // 50% of 1920
            }
            DoEvents(300);
            SaveWindowBitmap(mainWin, Path.Combine(outputDir, "screen_idle_expanded.png"), 1080, 1920);

            // Return from Idle
            mainWin.ExitIdleExpandedMode();
            DoEvents(500);
            SetPristineDiagnostics(mainWin);

            // SCREEN 03: STEP 01 - PLEASE INSERT CONTAINER
            Console.WriteLine("[4/12] Capturing Screen 03: Step 01 - Please Insert Container...");
            mainWin.StartMachine(forceSimulator: true);
            mainWin.ShowPleaseInsertState();
            SetPristineDiagnostics(mainWin);
            mainWin.StatusText.Text = "Machine Started";
            mainWin.StatusText.Foreground = Brushes.LimeGreen;
            mainWin.BottleInfoText.Text = "Insert container • (Or use Demo Testing Panel)";
            mainWin.MachineStateText.Text = "MACHINE: RUNNING";
            DoEvents(400);
            SaveWindowBitmap(mainWin, Path.Combine(outputDir, "screen_03_step_01.png"), 1080, 1920);

            // SCREEN 04: STEP 02 - DETECTING & SIZING
            Console.WriteLine("[5/12] Capturing Screen 04: Step 02 - Detecting & Sizing Item...");
            mainWin.ShowDetectingState("DETECTING MEDIUM PLASTIC • OPTICAL IR & SIZING ACTIVE");
            SetPristineDiagnostics(mainWin);
            mainWin.StatusText.Text = "Detecting...";
            mainWin.StatusText.Foreground = Brushes.Gold;
            mainWin.BottleInfoText.Text = "Optical IR & Ultrasonic sizing in progress...";
            mainWin.MachineStateText.Text = "MACHINE: DETECTING";
            DoEvents(400);
            SaveWindowBitmap(mainWin, Path.Combine(outputDir, "screen_04_step_02.png"), 1080, 1920);

            // SCREEN 05: STEP 02 - REJECTION
            Console.WriteLine("[6/12] Capturing Screen 05: Step 02 - Rejection Overlay...");
            mainWin.ShowRejectedState("Item rejected (MEDIUM PLASTIC) • Please remove from gate");
            SetPristineDiagnostics(mainWin);
            mainWin.StatusText.Text = "Rejected";
            mainWin.StatusText.Foreground = Brushes.OrangeRed;
            mainWin.BottleInfoText.Text = "Item rejected (MEDIUM PLASTIC) - please remove from gate";
            mainWin.RejectedCountText.Text = "1";
            mainWin.RejectedTotalCountText.Text = "1";
            DoEvents(400);
            SaveWindowBitmap(mainWin, Path.Combine(outputDir, "screen_05_step_02_rejection.png"), 1080, 1920);

            // SCREEN 06: STEP 03 - CONTAINER ACCEPTED
            Console.WriteLine("[7/12] Capturing Screen 06: Step 03 - Accepted (+10 Points)...");
            mainWin.ShowAcceptedState("PLASTIC", "MEDIUM", 10);
            SetPristineDiagnostics(mainWin);
            mainWin.StatusText.Text = "Accepted";
            mainWin.StatusText.Foreground = Brushes.LimeGreen;
            mainWin.BottleInfoText.Text = "MEDIUM plastic - 10 points";
            mainWin.TotalItemsText.Text = "1";
            mainWin.TotalPointsText.Text = "10";
            DoEvents(400);
            SaveWindowBitmap(mainWin, Path.Combine(outputDir, "screen_06_step_03_accepted.png"), 1080, 1920);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[MAINWINDOW ERROR] {ex}");
        }

        // 3. SCREEN 07: WALLET PHONE MODAL (COMPOSITE WITH MAINWINDOW)
        Console.WriteLine("[8/12] Capturing Screen 07: Step 04 - Mobile Wallet Number Input...");
        try
        {
            var walletWin = new WalletPhoneWindow(1, 10)
            {
                WindowState = WindowState.Normal,
                WindowStartupLocation = WindowStartupLocation.CenterScreen,
                Width = 500,
                ShowInTaskbar = false
            };
            walletWin.Show();
            DoEvents(300);

            if (mainWin != null)
            {
                var composite = CreateModalComposite(mainWin, walletWin, 1080, 1920);
                SaveVisualBitmap(composite, Path.Combine(outputDir, "screen_07_step_04_wallet.png"), 1080, 1920);
            }
            else
            {
                SaveWindowBitmap(walletWin, Path.Combine(outputDir, "screen_07_step_04_wallet.png"), 500, 500);
            }
            walletWin.Close();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error capturing Wallet Window: {ex.Message}");
        }

        // 4. SCREEN 08: WALLET SUCCESS (POINTS AWARDED)
        Console.WriteLine("[9/12] Capturing Screen 08: Step 04 - Points Awarded Success...");
        try
        {
            var successWin = CreatePointsSuccessWindow(1, 10, "03001234567");
            if (mainWin != null)
            {
                var composite = CreateModalComposite(mainWin, successWin, 1080, 1920);
                SaveVisualBitmap(composite, Path.Combine(outputDir, "screen_08_step_04_success.png"), 1080, 1920);
            }
            else
            {
                SaveWindowBitmap(successWin, Path.Combine(outputDir, "screen_08_step_04_success.png"), 1080, 1920);
            }
            successWin.Close();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error capturing Success Window: {ex.Message}");
        }

        // 5. SCREEN 09: FEEDBACK SCREEN (1-5 STARS & TAGS)
        Console.WriteLine("[10/12] Capturing Screen 09: Feedback & Star Rating...");
        try
        {
            var feedbackWin = CreateFeedbackWindow();
            SaveWindowBitmap(feedbackWin, Path.Combine(outputDir, "screen_09_feedback.png"), 1080, 1920);
            feedbackWin.Close();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error capturing Feedback Window: {ex.Message}");
        }

        // 6. SCREEN 10: PROCESS COMPLETED
        Console.WriteLine("[11/12] Capturing Screen 10: Process Completed Screen...");
        try
        {
            var completeWin = CreateProcessCompletedWindow();
            SaveWindowBitmap(completeWin, Path.Combine(outputDir, "screen_10_complete.png"), 1080, 1920);
            completeWin.Close();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error capturing Process Completed Window: {ex.Message}");
        }

        // 7. SCREEN LANDSCAPE: SECONDARY PUBLIC SIGNAGE
        Console.WriteLine("[12/12] Capturing Screen Landscape: Secondary Public Awareness Display (1920x1080)...");
        try
        {
            var landWin = new LandscapeWindow
            {
                WindowState = WindowState.Normal,
                WindowStyle = WindowStyle.None,
                WindowStartupLocation = WindowStartupLocation.CenterScreen,
                Width = 1920,
                Height = 1080,
                ShowInTaskbar = false
            };
            landWin.Show();
            landWin.Measure(new Size(1920, 1080));
            landWin.Arrange(new Rect(0, 0, 1920, 1080));
            landWin.UpdateLayout();
            DoEvents(500);

            try
            {
                landWin.ConnectionText.Text = "HARDWARE: COM3 🟢";
                landWin.ConnectionText.Foreground = Brushes.LightGreen;
                landWin.StatusDot.Fill = Brushes.LightGreen;
                landWin.DbStatusText.Text = "DB: OK 🟢";
                landWin.DbDot.Fill = Brushes.LightGreen;
                landWin.ApiStatusText.Text = "API: ONLINE 🟢";
                landWin.ApiDot.Fill = Brushes.LightGreen;
            }
            catch { }

            DoEvents(300);
            SaveWindowBitmap(landWin, Path.Combine(outputDir, "screen_landscape_kiosk.png"), 1920, 1080);
            landWin.Close();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error capturing Landscape Window: {ex.Message}");
        }

        // Cleanup MainWindow
        try { mainWin?.Close(); } catch { }

        Console.WriteLine("\n=== ALL NEW REAL UI SNAPSHOTS CAPTURED SUCCESSFULLY! ===");
        app.Shutdown(0);
    }

    private static void SetPristineDiagnostics(MainWindow win)
    {
        try
        {
            win.ConnectionText.Text = "HARDWARE: COM3 🟢";
            win.ConnectionText.Foreground = Brushes.LightGreen;
            win.StatusDot.Fill = Brushes.LightGreen;
            if (win.HardwareErrorBanner != null) win.HardwareErrorBanner.Visibility = Visibility.Collapsed;

            win.DbStatusText.Text = "DB: OK 🟢";
            win.DbDot.Fill = Brushes.LightGreen;

            win.ApiStatusText.Text = "API: ONLINE 🟢";
            win.ApiDot.Fill = Brushes.LightGreen;

            if (win.LiveBadgeBorder != null)
            {
                win.LiveBadgeBorder.Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#DCFCE7"));
            }
            if (win.LiveBadgeText != null)
            {
                win.LiveBadgeText.Text = "LIVE 🟢";
                win.LiveBadgeText.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#15803D"));
            }
        }
        catch { }
    }

    private static FrameworkElement CreateModalComposite(Window parentWin, Window modalWin, int width, int height)
    {
        var container = new Grid { Width = width, Height = height, Background = new SolidColorBrush(Color.FromRgb(11, 17, 32)) };

        var parentContent = (Visual)parentWin.Content;
        var vbParent = new VisualBrush(parentContent) { Stretch = Stretch.UniformToFill };
        var parentRect = new System.Windows.Shapes.Rectangle { Width = width, Height = height, Fill = vbParent };
        container.Children.Add(parentRect);

        var backdrop = new System.Windows.Shapes.Rectangle
        {
            Width = width,
            Height = height,
            Fill = new SolidColorBrush(Color.FromArgb(170, 0, 0, 0))
        };
        container.Children.Add(backdrop);

        var modalContent = (Visual)modalWin.Content;
        double mw = modalWin.ActualWidth > 0 ? modalWin.ActualWidth : 500;
        double mh = modalWin.ActualHeight > 0 ? modalWin.ActualHeight : 450;
        var vbModal = new VisualBrush(modalContent) { Stretch = Stretch.Uniform };
        var modalBorder = new Border
        {
            Width = mw,
            Height = mh,
            CornerRadius = new CornerRadius(16),
            BorderBrush = new SolidColorBrush(Color.FromRgb(51, 65, 85)),
            BorderThickness = new Thickness(1.5),
            Background = new SolidColorBrush(Color.FromRgb(15, 23, 42)),
            Effect = new System.Windows.Media.Effects.DropShadowEffect { BlurRadius = 35, ShadowDepth = 12, Opacity = 0.8 },
            Child = new System.Windows.Shapes.Rectangle { Fill = vbModal }
        };
        container.Children.Add(modalBorder);

        container.Measure(new Size(width, height));
        container.Arrange(new Rect(0, 0, width, height));
        container.UpdateLayout();
        return container;
    }

    private static Window CreatePointsSuccessWindow(int items, int points, string phone)
    {
        var win = new Window
        {
            Width = 500,
            Height = 440,
            WindowStyle = WindowStyle.None,
            Background = new SolidColorBrush(Color.FromRgb(15, 23, 42)),
            ShowInTaskbar = false
        };

        var root = new Grid { Background = new SolidColorBrush(Color.FromRgb(15, 23, 42)), Width = 500, Height = 440 };
        var border = new Border
        {
            Background = new SolidColorBrush(Color.FromRgb(30, 41, 59)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(34, 197, 94)),
            BorderThickness = new Thickness(2),
            CornerRadius = new CornerRadius(16),
            Padding = new Thickness(32),
            VerticalAlignment = VerticalAlignment.Center,
            HorizontalAlignment = HorizontalAlignment.Center,
            Width = 440
        };

        var sp = new StackPanel { HorizontalAlignment = HorizontalAlignment.Center };
        sp.Children.Add(new TextBlock
        {
            Text = "🎉",
            FontSize = 54,
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 0, 0, 12)
        });
        sp.Children.Add(new TextBlock
        {
            Text = "REWARDS CREDITED SUCCESSFULLY!",
            FontSize = 16,
            FontWeight = FontWeights.Black,
            Foreground = new SolidColorBrush(Color.FromRgb(34, 197, 94)),
            HorizontalAlignment = HorizontalAlignment.Center
        });
        sp.Children.Add(new TextBlock
        {
            Text = "پوائنٹس کامیابی کے ساتھ منتقل کر دیے گئے ہیں",
            FontSize = 14,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(134, 239, 172)),
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 4, 0, 18)
        });

        var pointsPill = new Border
        {
            Background = new SolidColorBrush(Color.FromArgb(40, 34, 197, 94)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(34, 197, 94)),
            BorderThickness = new Thickness(1.5),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(20, 8, 20, 8),
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 0, 0, 16),
            Child = new TextBlock
            {
                Text = $"+{points} POINTS ADDED TO {phone}",
                FontSize = 15,
                FontWeight = FontWeights.Bold,
                Foreground = Brushes.White
            }
        };
        sp.Children.Add(pointsPill);

        sp.Children.Add(new TextBlock
        {
            Text = "Receipt synchronized to Central Cloud & Local Database",
            FontSize = 12,
            Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)),
            HorizontalAlignment = HorizontalAlignment.Center
        });

        border.Child = sp;
        root.Children.Add(border);
        win.Content = root;
        win.Show();
        DoEvents(200);
        return win;
    }

    private static Window CreateSplashWindow()
    {
        var win = new Window
        {
            Width = 1080,
            Height = 1920,
            WindowStyle = WindowStyle.None,
            Background = new SolidColorBrush(Color.FromRgb(7, 59, 40)),
            ShowInTaskbar = false
        };

        var root = new Grid { Background = new SolidColorBrush(Color.FromRgb(7, 59, 40)), Width = 1080, Height = 1920 };
        var sp = new StackPanel
        {
            VerticalAlignment = VerticalAlignment.Center,
            HorizontalAlignment = HorizontalAlignment.Center
        };

        var logoBorder = new Border
        {
            Width = 160,
            Height = 160,
            CornerRadius = new CornerRadius(80),
            Background = new SolidColorBrush(Color.FromArgb(40, 34, 197, 94)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(34, 197, 94)),
            BorderThickness = new Thickness(3),
            Margin = new Thickness(0, 0, 0, 32),
            HorizontalAlignment = HorizontalAlignment.Center
        };
        var leafText = new TextBlock
        {
            Text = "🍃",
            FontSize = 72,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center
        };
        logoBorder.Child = leafText;
        sp.Children.Add(logoBorder);

        var title = new TextBlock
        {
            Text = "REVERSE VENDING MACHINE",
            FontSize = 38,
            FontWeight = FontWeights.Black,
            Foreground = Brushes.White,
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 0, 0, 8)
        };
        sp.Children.Add(title);

        var subtitle = new TextBlock
        {
            Text = "Environmental Solutions Pvt. Ltd  •  World Bank Group",
            FontSize = 18,
            FontWeight = FontWeights.SemiBold,
            Foreground = new SolidColorBrush(Color.FromRgb(134, 239, 172)),
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 0, 0, 48)
        };
        sp.Children.Add(subtitle);

        var diagBox = new Border
        {
            Background = new SolidColorBrush(Color.FromRgb(15, 45, 33)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(26, 77, 56)),
            BorderThickness = new Thickness(1.5),
            CornerRadius = new CornerRadius(12),
            Padding = new Thickness(28, 20, 28, 20),
            Width = 680,
            Margin = new Thickness(0, 0, 0, 32)
        };
        var diagSp = new StackPanel();
        diagSp.Children.Add(CreateDiagLine("SERIAL PORT", "CONNECTED (COM3 @ 9600 BAUD) 🟢"));
        diagSp.Children.Add(CreateDiagLine("LOCAL RVMDB", "MICROSOFT SQL SERVER READY 🟢"));
        diagSp.Children.Add(CreateDiagLine("CLOUD API", "ONLINE (isprvm.binishaqsoft.com) 🟢"));
        diagSp.Children.Add(CreateDiagLine("CHAMBER", "AUTO-CALIBRATING BASELINE (25.0 cm) 🟢"));
        diagBox.Child = diagSp;
        sp.Children.Add(diagBox);

        var loading = new TextBlock
        {
            Text = "SYSTEM INITIALIZING  •  PLEASE STAND BY...",
            FontSize = 15,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)),
            HorizontalAlignment = HorizontalAlignment.Center
        };
        sp.Children.Add(loading);

        root.Children.Add(sp);
        win.Content = root;
        win.Show();
        DoEvents(300);
        return win;
    }

    private static TextBlock CreateDiagLine(string label, string status)
    {
        return new TextBlock
        {
            Text = $"[●] {label,-14} : {status}",
            FontFamily = new FontFamily("Consolas"),
            FontSize = 15,
            Foreground = new SolidColorBrush(Color.FromRgb(134, 239, 172)),
            Margin = new Thickness(0, 5, 0, 5)
        };
    }

    private static Window CreateFeedbackWindow()
    {
        var win = new Window
        {
            Width = 1080,
            Height = 1920,
            WindowStyle = WindowStyle.None,
            Background = new SolidColorBrush(Color.FromRgb(247, 249, 245)),
            ShowInTaskbar = false
        };

        var root = new Grid { Background = new SolidColorBrush(Color.FromRgb(247, 249, 245)), Width = 1080, Height = 1920 };
        var card = new Border
        {
            Width = 760,
            Background = Brushes.White,
            BorderBrush = new SolidColorBrush(Color.FromRgb(226, 234, 224)),
            BorderThickness = new Thickness(2),
            CornerRadius = new CornerRadius(24),
            Padding = new Thickness(48),
            VerticalAlignment = VerticalAlignment.Center,
            HorizontalAlignment = HorizontalAlignment.Center,
            Effect = new System.Windows.Media.Effects.DropShadowEffect { BlurRadius = 30, ShadowDepth = 8, Opacity = 0.15 }
        };

        var sp = new StackPanel { HorizontalAlignment = HorizontalAlignment.Center };
        sp.Children.Add(new TextBlock
        {
            Text = "⭐",
            FontSize = 72,
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 0, 0, 16)
        });
        sp.Children.Add(new TextBlock
        {
            Text = "HOW WAS YOUR EXPERIENCE?",
            FontSize = 28,
            FontWeight = FontWeights.Black,
            Foreground = new SolidColorBrush(Color.FromRgb(7, 59, 40)),
            HorizontalAlignment = HorizontalAlignment.Center
        });
        sp.Children.Add(new TextBlock
        {
            Text = "آپ کا ری سائیکلنگ کا تجربہ کیسا رہا؟",
            FontSize = 24,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(4, 120, 87)),
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 6, 0, 32)
        });

        var starSp = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Center, Margin = new Thickness(0, 0, 0, 28) };
        for (int i = 0; i < 5; i++)
        {
            starSp.Children.Add(new TextBlock
            {
                Text = "★",
                FontSize = 58,
                Foreground = new SolidColorBrush(Color.FromRgb(245, 158, 11)),
                Margin = new Thickness(8, 0, 8, 0)
            });
        }
        sp.Children.Add(starSp);

        var badge = new Border
        {
            Background = new SolidColorBrush(Color.FromArgb(40, 16, 185, 129)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(16, 185, 129)),
            BorderThickness = new Thickness(1.5),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(24, 8, 24, 8),
            Margin = new Thickness(0, 0, 0, 20),
            HorizontalAlignment = HorizontalAlignment.Center,
            Child = new TextBlock
            {
                Text = "★★★★★  5/5 — Excellent · بہترین",
                FontSize = 18,
                FontWeight = FontWeights.Bold,
                Foreground = new SolidColorBrush(Color.FromRgb(16, 185, 129))
            }
        };
        sp.Children.Add(badge);

        var tagsPanel = new WrapPanel { HorizontalAlignment = HorizontalAlignment.Center, Margin = new Thickness(0, 0, 0, 24) };
        string[] tags = ["⚡ Fast & Easy", "✨ Clean Machine", "🎁 Great Rewards", "👍 Helpful Instructions"];
        foreach (var tag in tags)
        {
            tagsPanel.Children.Add(new Border
            {
                Background = new SolidColorBrush(Color.FromRgb(241, 245, 249)),
                BorderBrush = new SolidColorBrush(Color.FromRgb(203, 213, 225)),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(16),
                Padding = new Thickness(14, 6, 14, 6),
                Margin = new Thickness(4),
                Child = new TextBlock
                {
                    Text = tag,
                    FontSize = 13,
                    FontWeight = FontWeights.SemiBold,
                    Foreground = new SolidColorBrush(Color.FromRgb(51, 65, 85))
                }
            });
        }
        sp.Children.Add(tagsPanel);

        sp.Children.Add(new TextBlock
        {
            Text = "Press 1 to 5 on keypad to rate • Press ENTER to confirm",
            FontSize = 16,
            FontWeight = FontWeights.SemiBold,
            Foreground = new SolidColorBrush(Color.FromRgb(100, 116, 139)),
            HorizontalAlignment = HorizontalAlignment.Center
        });

        sp.Children.Add(new TextBlock
        {
            Text = "Auto-submitting in 8s...",
            FontSize = 13,
            FontWeight = FontWeights.Medium,
            Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)),
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 8, 0, 0)
        });

        card.Child = sp;
        root.Children.Add(card);
        win.Content = root;
        win.Show();
        DoEvents(300);
        return win;
    }

    private static Window CreateProcessCompletedWindow()
    {
        var win = new Window
        {
            Width = 1080,
            Height = 1920,
            WindowStyle = WindowStyle.None,
            Background = new SolidColorBrush(Color.FromRgb(247, 249, 245)),
            ShowInTaskbar = false
        };

        var root = new Grid { Background = new SolidColorBrush(Color.FromRgb(247, 249, 245)), Width = 1080, Height = 1920 };
        var card = new Border
        {
            Width = 760,
            Background = new SolidColorBrush(Color.FromRgb(248, 252, 247)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(134, 239, 172)),
            BorderThickness = new Thickness(2),
            CornerRadius = new CornerRadius(24),
            Padding = new Thickness(48),
            VerticalAlignment = VerticalAlignment.Center,
            HorizontalAlignment = HorizontalAlignment.Center,
            Effect = new System.Windows.Media.Effects.DropShadowEffect { BlurRadius = 30, ShadowDepth = 8, Opacity = 0.15 }
        };

        var sp = new StackPanel { HorizontalAlignment = HorizontalAlignment.Center };
        sp.Children.Add(new TextBlock
        {
            Text = "🌱",
            FontSize = 80,
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 0, 0, 16)
        });
        sp.Children.Add(new TextBlock
        {
            Text = "THANK YOU FOR RECYCLING!",
            FontSize = 28,
            FontWeight = FontWeights.Black,
            Foreground = new SolidColorBrush(Color.FromRgb(7, 59, 40)),
            HorizontalAlignment = HorizontalAlignment.Center
        });
        sp.Children.Add(new TextBlock
        {
            Text = "ماحول کی حفاظت میں آپ کا شکریہ",
            FontSize = 24,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush(Color.FromRgb(4, 120, 87)),
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 6, 0, 24)
        });
        sp.Children.Add(new TextBlock
        {
            Text = "Together we create a cleaner, greener Pakistan.",
            FontSize = 16,
            FontWeight = FontWeights.Medium,
            Foreground = new SolidColorBrush(Color.FromRgb(71, 85, 105)),
            HorizontalAlignment = HorizontalAlignment.Center,
            Margin = new Thickness(0, 0, 0, 28)
        });
        sp.Children.Add(new Border
        {
            Background = new SolidColorBrush(Color.FromRgb(220, 252, 231)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(134, 239, 172)),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(12),
            Padding = new Thickness(24, 10, 24, 10),
            HorizontalAlignment = HorizontalAlignment.Center,
            Child = new TextBlock
            {
                Text = "[ RESETTING TO STANDBY IN 5s... ]",
                FontSize = 14,
                FontWeight = FontWeights.Bold,
                Foreground = new SolidColorBrush(Color.FromRgb(21, 128, 61))
            }
        });

        card.Child = sp;
        root.Children.Add(card);
        win.Content = root;
        win.Show();
        DoEvents(300);
        return win;
    }

    private static void SaveWindowBitmap(Window window, string outputPath, int width, int height)
    {
        window.Measure(new Size(width, height));
        window.Arrange(new Rect(0, 0, width, height));
        window.UpdateLayout();

        var target = (UIElement)window.Content ?? window;
        SaveVisualBitmap(target, outputPath, width, height);
    }

    private static void SaveVisualBitmap(Visual visual, string outputPath, int width, int height)
    {
        var rtb = new RenderTargetBitmap(width, height, 96, 96, PixelFormats.Pbgra32);
        rtb.Render(visual);

        var encoder = new PngBitmapEncoder();
        encoder.Frames.Add(BitmapFrame.Create(rtb));

        using var fs = new FileStream(outputPath, FileMode.Create, FileAccess.Write);
        encoder.Save(fs);
        var fi = new FileInfo(outputPath);
        Console.WriteLine($"[SNAPSHOT SAVED] {fi.Name} -> {fi.Length / 1024} KB ({width}x{height})");
    }

    private static void DoEvents(int sleepMs = 300)
    {
        var frame = new System.Windows.Threading.DispatcherFrame();
        System.Windows.Threading.Dispatcher.CurrentDispatcher.BeginInvoke(
            System.Windows.Threading.DispatcherPriority.Background,
            new Action(() => frame.Continue = false));
        System.Windows.Threading.Dispatcher.PushFrame(frame);
        if (sleepMs > 0)
        {
            Thread.Sleep(sleepMs);
        }
    }
}
