using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;

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
}
