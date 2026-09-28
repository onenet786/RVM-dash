using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;

namespace PecoDropDesktopApp;

public class ScreenInfo
{
    public int Left { get; set; }
    public int Top { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public bool IsPrimary { get; set; }
    public string DeviceName { get; set; } = string.Empty;
}

public enum ScreenLayoutOrder
{
    HardwareLeftVideoRight, // 0012
    VideoLeftHardwareRight  // 0021
}

public static class ScreenHelper
{
    [StructLayout(LayoutKind.Sequential)]
    private struct RECT
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
    private struct MONITORINFOEX
    {
        public int cbSize;
        public RECT rcMonitor;
        public RECT rcWork;
        public uint dwFlags;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
        public string szDevice;
    }

    private delegate bool MonitorEnumProc(IntPtr hMonitor, IntPtr hdcMonitor, ref RECT lprcMonitor, IntPtr dwData);

    [DllImport("user32.dll")]
    private static extern bool EnumDisplayMonitors(IntPtr hdc, IntPtr lprcClip, MonitorEnumProc lpfnEnum, IntPtr dwData);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    private static extern bool GetMonitorInfo(IntPtr hMonitor, ref MONITORINFOEX lpmi);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    public const uint SWP_NOZORDER = 0x0004;
    public const uint SWP_SHOWWINDOW = 0x0040;
    public const uint SWP_FRAMECHANGED = 0x0020;
    public const int SW_RESTORE = 9;
    public const int SW_MAXIMIZE = 3;

    private const uint MONITORINFOF_PRIMARY = 0x00000001;

    public static List<ScreenInfo> GetScreens()
    {
        var screens = new List<ScreenInfo>();

        EnumDisplayMonitors(IntPtr.Zero, IntPtr.Zero, (IntPtr hMonitor, IntPtr hdcMonitor, ref RECT lprcMonitor, IntPtr dwData) =>
        {
            var mi = new MONITORINFOEX();
            mi.cbSize = Marshal.SizeOf(typeof(MONITORINFOEX));

            if (GetMonitorInfo(hMonitor, ref mi))
            {
                screens.Add(new ScreenInfo
                {
                    Left = mi.rcMonitor.Left,
                    Top = mi.rcMonitor.Top,
                    Width = mi.rcMonitor.Right - mi.rcMonitor.Left,
                    Height = mi.rcMonitor.Bottom - mi.rcMonitor.Top,
                    IsPrimary = (mi.dwFlags & MONITORINFOF_PRIMARY) != 0,
                    DeviceName = mi.szDevice
                });
            }

            return true;
        }, IntPtr.Zero);

        return screens;
    }

    /// <summary>
    /// Swaps and docks the Hardware Kiosk Screen and Video Signage Ad Screen dynamically
    /// across dual physical displays or side-by-side on a single display.
    /// Hotkey 0012: Hardware Screen LEFT, Video Signage RIGHT.
    /// Hotkey 0021: Video Signage LEFT, Hardware Screen RIGHT.
    /// </summary>
    public static void ApplyLayout(ScreenLayoutOrder order, Window? callingWindow = null, bool persist = true)
    {
        if (Application.Current == null) return;

        Application.Current.Dispatcher.Invoke(() =>
        {
            try
            {
                var screens = GetScreens();
                var mainWindow = Application.Current.MainWindow;
                var adWindow = App.SecondaryDisplayWindow;

                string layoutCode = order == ScreenLayoutOrder.HardwareLeftVideoRight ? "0012" : "0021";
                if (persist)
                {
                    // SQL is authoritative; config.txt remains an offline fallback.
                    var settings = AppSettings.Load();
                    DatabaseManager.SaveDisplayLayout(settings.MachineId, layoutCode);
                    AppSettings.UpdateDisplayLayout(layoutCode);
                }

                if (screens.Count > 1)
                {
                    // Sort displays strictly from Left to Right by their horizontal screen coordinates
                    var sortedScreens = screens.OrderBy(s => s.Left).ToList();
                    var leftScreen = sortedScreens[0];
                    var rightScreen = sortedScreens[^1];

                    ScreenInfo hwScreen = order == ScreenLayoutOrder.HardwareLeftVideoRight ? leftScreen : rightScreen;
                    ScreenInfo adScreen = order == ScreenLayoutOrder.HardwareLeftVideoRight ? rightScreen : leftScreen;

                    // Ensure SecondaryAdWindow exists and is visible
                    if (adWindow == null || !adWindow.IsLoaded)
                    {
                        adWindow = new SecondaryAdWindow();
                        App.SecondaryDisplayWindow = adWindow;
                        adWindow.Show();
                    }

                    if (mainWindow != null)
                    {
                        PositionWindowOnScreen(mainWindow, hwScreen);
                    }

                    if (adWindow != null)
                    {
                        PositionWindowOnScreen(adWindow, adScreen);
                    }
                }
                else
                {
                    // Single display layout (Split screen: 60% Kiosk, 40% Video Ads)
                    double workW = SystemParameters.WorkArea.Width;
                    double workH = SystemParameters.WorkArea.Height;
                    double hwW = Math.Round(workW * 0.60);
                    double adW = workW - hwW;

                    if (adWindow == null || !adWindow.IsLoaded)
                    {
                        adWindow = new SecondaryAdWindow();
                        App.SecondaryDisplayWindow = adWindow;
                        adWindow.Show();
                    }

                    if (order == ScreenLayoutOrder.HardwareLeftVideoRight)
                    {
                        // Hardware on Left, Video Signage on Right
                        if (mainWindow != null)
                        {
                            mainWindow.WindowState = WindowState.Normal;
                            mainWindow.WindowStartupLocation = WindowStartupLocation.Manual;
                            mainWindow.Left = 0;
                            mainWindow.Top = 0;
                            mainWindow.Width = hwW;
                            mainWindow.Height = workH;
                        }
                        if (adWindow != null)
                        {
                            adWindow.WindowState = WindowState.Normal;
                            adWindow.WindowStartupLocation = WindowStartupLocation.Manual;
                            adWindow.Left = hwW;
                            adWindow.Top = 0;
                            adWindow.Width = adW;
                            adWindow.Height = workH;
                        }
                    }
                    else
                    {
                        // Video Signage on Left, Hardware on Right
                        if (adWindow != null)
                        {
                            adWindow.WindowState = WindowState.Normal;
                            adWindow.WindowStartupLocation = WindowStartupLocation.Manual;
                            adWindow.Left = 0;
                            adWindow.Top = 0;
                            adWindow.Width = adW;
                            adWindow.Height = workH;
                        }
                        if (mainWindow != null)
                        {
                            mainWindow.WindowState = WindowState.Normal;
                            mainWindow.WindowStartupLocation = WindowStartupLocation.Manual;
                            mainWindow.Left = adW;
                            mainWindow.Top = 0;
                            mainWindow.Width = hwW;
                            mainWindow.Height = workH;
                        }
                    }
                }

                if (callingWindow != null)
                {
                    try
                    {
                        callingWindow.Activate();
                        var helper = new WindowInteropHelper(callingWindow);
                        if (helper.Handle != IntPtr.Zero)
                        {
                            SetForegroundWindow(helper.Handle);
                        }
                    }
                    catch { }
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[ScreenHelper] ApplyLayout failed: {ex.Message}");
            }
        });
    }

    private static void PositionWindowOnScreen(Window window, ScreenInfo screen)
    {
        try
        {
            window.WindowState = WindowState.Normal;
            window.WindowStartupLocation = WindowStartupLocation.Manual;
            window.Left = screen.Left;
            window.Top = screen.Top;
            window.Width = screen.Width;
            window.Height = screen.Height;

            var helper = new WindowInteropHelper(window);
            if (helper.Handle != IntPtr.Zero)
            {
                uint flags = SWP_NOZORDER | SWP_SHOWWINDOW | SWP_FRAMECHANGED;
                SetWindowPos(helper.Handle, IntPtr.Zero, screen.Left, screen.Top, screen.Width, screen.Height, flags);
                ShowWindow(helper.Handle, SW_MAXIMIZE);
            }
            window.WindowState = WindowState.Maximized;
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[ScreenHelper] PositionWindowOnScreen error: {ex.Message}");
        }
    }
}
