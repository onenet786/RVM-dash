Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class KioskMover {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
}
"@

$proc = Get-Process -Name RVMDesktopApp -ErrorAction SilentlyContinue | Select-Object -First 1
if ($proc -and $proc.MainWindowHandle -ne [IntPtr]::Zero) {
    $hwnd = $proc.MainWindowHandle
    $screens = [System.Windows.Forms.Screen]::AllScreens
    $targetScreen = if ($screens.Count -gt 1) { $screens[1] } else { $screens[0] }
    
    [KioskMover]::ShowWindow($hwnd, 9) | Out-Null
    Start-Sleep -Milliseconds 100
    [KioskMover]::SetWindowPos($hwnd, [IntPtr]::Zero, $targetScreen.Bounds.X, $targetScreen.Bounds.Y, $targetScreen.Bounds.Width, $targetScreen.Bounds.Height, 0x0040 -bor 0x0020) | Out-Null
    Start-Sleep -Milliseconds 100
    [KioskMover]::ShowWindow($hwnd, 3) | Out-Null
    [KioskMover]::SetForegroundWindow($hwnd) | Out-Null
    Write-Host "Positioned RVMDesktopApp (PID $($proc.Id)) to Screen ($($targetScreen.Bounds.X), $($targetScreen.Bounds.Y), $($targetScreen.Bounds.Width)x$($targetScreen.Bounds.Height))" -ForegroundColor Green
} else {
    Write-Host "No active RVMDesktopApp window handle found." -ForegroundColor Yellow
}
