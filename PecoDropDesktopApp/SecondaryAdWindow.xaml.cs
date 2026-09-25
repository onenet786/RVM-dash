using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Windows;
using System.Windows.Input;

namespace PecoDropDesktopApp;

public partial class SecondaryAdWindow : Window
{
    private readonly List<string> playlist = new();
    private int playlistIndex = 0;
    private readonly AppSettings settings;
    private static readonly string[] VideoExtensions = [".mp4", ".avi", ".wmv", ".mov", ".mkv"];

    public SecondaryAdWindow(AppSettings? appSettings = null)
    {
        InitializeComponent();
        settings = appSettings ?? AppSettings.Load();
        Loaded += SecondaryAdWindow_Loaded;
        SourceInitialized += (s, ev) =>
        {
            var helper = new System.Windows.Interop.WindowInteropHelper(this);
            var source = System.Windows.Interop.HwndSource.FromHwnd(helper.Handle);
            source?.AddHook((IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled) =>
            {
                if (msg == 0x0010) // WM_CLOSE
                {
                    handled = true;
                    try { HeartbeatService.Stop(); } catch { }
                    try { DemoTestingWindow.CloseIfOpen(); } catch { }
                    try { AcceptedItemVideoWindow.CloseIfOpen(); } catch { }
                    try { Application.Current?.Shutdown(); } catch { }
                    Environment.Exit(0);
                }
                else if (msg == 0x0100 && wParam.ToInt32() == 0x1B) // WM_KEYDOWN VK_ESCAPE
                {
                    handled = true;
                    try { HeartbeatService.Stop(); } catch { }
                    try { DemoTestingWindow.CloseIfOpen(); } catch { }
                    try { AcceptedItemVideoWindow.CloseIfOpen(); } catch { }
                    try { Application.Current?.Shutdown(); } catch { }
                    Environment.Exit(0);
                }
                return IntPtr.Zero;
            });
        };
    }

    private void SecondaryAdWindow_Loaded(object sender, RoutedEventArgs e)
    {
        LoadPlaylist();
        PlayCurrentVideo();
    }

    public void LoadPlaylist()
    {
        playlist.Clear();

        // Load ONLY from Advertisement Video Folder (strictly no instructional videos)
        string adDir = Path.IsPathRooted(settings.AdvertisementVideoFolder)
            ? settings.AdvertisementVideoFolder
            : Path.Combine(AppDomain.CurrentDomain.BaseDirectory, settings.AdvertisementVideoFolder);

        if (Directory.Exists(adDir))
        {
            var adFiles = Directory.GetFiles(adDir)
                .Where(f => VideoExtensions.Contains(Path.GetExtension(f).ToLowerInvariant())
                            && !Path.GetFileName(f).ToLowerInvariant().Contains("instruct"))
                .OrderBy(f => f)
                .ToList();
            playlist.AddRange(adFiles);
        }

        playlistIndex = 0;
    }

    private void PlayCurrentVideo()
    {
        if (playlist.Count == 0)
        {
            SecondaryPlayer.Visibility = Visibility.Collapsed;
            PlayerPlaceholder.Visibility = Visibility.Visible;
            return;
        }

        try
        {
            PlayerPlaceholder.Visibility = Visibility.Collapsed;
            SecondaryPlayer.Visibility = Visibility.Visible;

            string videoPath = playlist[playlistIndex];
            SecondaryPlayer.Source = new Uri(Path.GetFullPath(videoPath));
            SecondaryPlayer.Play();
        }
        catch
        {
            PlayNextVideo();
        }
    }

    private void PlayNextVideo()
    {
        if (playlist.Count == 0)
        {
            SecondaryPlayer.Visibility = Visibility.Collapsed;
            PlayerPlaceholder.Visibility = Visibility.Visible;
            return;
        }

        playlistIndex = (playlistIndex + 1) % playlist.Count;
        PlayCurrentVideo();
    }

    private void SecondaryPlayer_MediaEnded(object sender, RoutedEventArgs e)
    {
        PlayNextVideo();
    }

    private void SecondaryPlayer_MediaFailed(object? sender, ExceptionRoutedEventArgs e)
    {
        PlayNextVideo();
    }

    private string _demoSecretSequence = "";
    private DateTime _lastDemoSecretTime = DateTime.MinValue;

    protected override void OnPreviewKeyDown(KeyEventArgs e)
    {
        char digit = e.Key switch
        {
            Key.D0 or Key.NumPad0 => '0',
            Key.D1 or Key.NumPad1 => '1',
            Key.D2 or Key.NumPad2 => '2',
            Key.D3 or Key.NumPad3 => '3',
            Key.D4 or Key.NumPad4 => '4',
            Key.D5 or Key.NumPad5 => '5',
            Key.D6 or Key.NumPad6 => '6',
            Key.D7 or Key.NumPad7 => '7',
            Key.D8 or Key.NumPad8 => '8',
            Key.D9 or Key.NumPad9 => '9',
            _ => '\0'
        };

        if (digit != '\0')
        {
            DateTime nowSeq = DateTime.Now;
            if ((nowSeq - _lastDemoSecretTime).TotalMilliseconds > 4000)
            {
                _demoSecretSequence = "";
            }
            _lastDemoSecretTime = nowSeq;
            _demoSecretSequence += digit;
            if (_demoSecretSequence.Length > 8)
            {
                _demoSecretSequence = _demoSecretSequence[^8..];
            }

            if (_demoSecretSequence.EndsWith("1218"))
            {
                _demoSecretSequence = "";
                e.Handled = true;
                SystemPowerDialog.PromptAndRestart(this);
                return;
            }

            if (_demoSecretSequence.EndsWith("1219"))
            {
                _demoSecretSequence = "";
                e.Handled = true;
                SystemPowerDialog.PromptAndShutdown(this);
                return;
            }
        }

        if (e.Key == Key.Escape)
        {
            e.Handled = true;
            try { HeartbeatService.Stop(); } catch { }
            try { DemoTestingWindow.CloseIfOpen(); } catch { }
            try { Application.Current?.Shutdown(); } catch { }
            Environment.Exit(0);
            return;
        }
        base.OnPreviewKeyDown(e);
    }

    private void Window_KeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.Escape)
        {
            e.Handled = true;
            try { HeartbeatService.Stop(); } catch { }
            try { DemoTestingWindow.CloseIfOpen(); } catch { }
            try { Application.Current?.Shutdown(); } catch { }
            Environment.Exit(0);
        }
    }

    public void StopAndClose()
    {
        try
        {
            SecondaryPlayer?.Stop();
            SecondaryPlayer?.Close();
        }
        catch { }

        try
        {
            Close();
        }
        catch { }
    }

    protected override void OnClosed(EventArgs e)
    {
        try
        {
            SecondaryPlayer?.Stop();
            SecondaryPlayer?.Close();
        }
        catch { }
        base.OnClosed(e);
    }
}
