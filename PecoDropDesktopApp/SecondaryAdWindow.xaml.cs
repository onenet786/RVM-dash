using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Windows;

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

    public void StopAndClose()
    {
        try
        {
            SecondaryPlayer?.Close();
        }
        catch { }

        try
        {
            Close();
        }
        catch { }
    }
}
