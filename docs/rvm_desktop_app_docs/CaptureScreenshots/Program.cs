using System;
using System.IO;
using System.Reflection;
using System.Threading;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using RVMDesktopApp;

namespace CaptureScreenshots;

public static class Program
{
    [STAThread]
    public static void Main()
    {
        Console.WriteLine("=== RVMDesktopApp Complete Screenshot Capturer ===");
        
        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        string outputDir = System.IO.Path.GetFullPath(System.IO.Path.Combine(baseDir, "..", "..", "..", "..", "snapshots"));
        Directory.CreateDirectory(outputDir);
        Console.WriteLine($"Output Directory: {outputDir}");

        var app = new Application();
        
        // 1. SCREEN 01: SPLASH SCREEN
        Console.WriteLine("[1/12] Capturing Screen 01: Splash Screen...");
        try
        {
            var splashWin = CreateSplashWindow();
            SaveWindowBitmap(splashWin, System.IO.Path.Combine(outputDir, "screen_01_splash.png"), 1080, 1920);
            splashWin.Close();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error capturing Splash Window: {ex.Message}");
        }

        // 2. SCREEN 09: FEEDBACK SCREEN
        Console.WriteLine("[9/12] Capturing Screen 09: Feedback Screen...");
        try
        {
            var feedbackWin = CreateFeedbackWindow();
            SaveWindowBitmap(feedbackWin, System.IO.Path.Combine(outputDir, "screen_09_feedback.png"), 1080, 1920);
            feedbackWin.Close();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error capturing Feedback Window: {ex.Message}");
        }

        // 3. SCREEN 10: PROCESS COMPLETED SCREEN
        Console.WriteLine("[10/12] Capturing Screen 10: Process Completed Screen...");
        try
        {
            var completeWin = CreateProcessCompletedWindow();
            SaveWindowBitmap(completeWin, System.IO.Path.Combine(outputDir, "screen_10_complete.png"), 1080, 1920);
            completeWin.Close();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error capturing Process Completed Window: {ex.Message}");
        }

        Console.WriteLine("Auxiliary snapshots captured successfully!");
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
        DoEvents();
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
            HorizontalAlignment = HorizontalAlignment.Center
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

        sp.Children.Add(new TextBlock
        {
            Text = "Press 1 to 5 on keypad or tap star to rate",
            FontSize = 16,
            FontWeight = FontWeights.SemiBold,
            Foreground = new SolidColorBrush(Color.FromRgb(100, 116, 139)),
            HorizontalAlignment = HorizontalAlignment.Center
        });

        card.Child = sp;
        root.Children.Add(card);
        win.Content = root;
        win.Show();
        DoEvents();
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
            HorizontalAlignment = HorizontalAlignment.Center
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
        DoEvents();
        return win;
    }

    private static void SaveWindowBitmap(Window window, string outputPath, int width, int height)
    {
        var target = (UIElement)window.Content ?? window;
        var rtb = new RenderTargetBitmap(width, height, 96, 96, PixelFormats.Pbgra32);
        rtb.Render(target);

        var encoder = new PngBitmapEncoder();
        encoder.Frames.Add(BitmapFrame.Create(rtb));

        using var fs = new FileStream(outputPath, FileMode.Create, FileAccess.Write);
        encoder.Save(fs);
        var fi = new FileInfo(outputPath);
        Console.WriteLine($"[SNAPSHOT SAVED] {fi.Name} -> {fi.Length / 1024} KB ({width}x{height})");
    }

    private static void DoEvents()
    {
        var frame = new System.Windows.Threading.DispatcherFrame();
        System.Windows.Threading.Dispatcher.CurrentDispatcher.BeginInvoke(
            System.Windows.Threading.DispatcherPriority.Background,
            new Action(() => frame.Continue = false));
        System.Windows.Threading.Dispatcher.PushFrame(frame);
        Thread.Sleep(300);
    }
}
