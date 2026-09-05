<#
.SYNOPSIS
    Launches the PecoDropDesktopApp kiosk in Landscape mode on the primary display.
    Automatically spawns the secondary digital signage / ad window on the second display.

.DESCRIPTION
    PecoDropDesktopApp is strictly a Landscape RVM application.
    - Screen 0 (Primary Display, Landscape): 50% Leaderboard, 50% Kiosk Details & Interaction.
    - Screen 1 (Secondary Display): Fullscreen Digital Signage & Video Advertisements.

.PARAMETER ScreenIndex
    The index of the target monitor for the primary interaction screen. Default is 0 (Primary Landscape display).

.PARAMETER ExePath
    Optional explicit path to PecoDropDesktopApp.exe.
#>

param(
    [int]$ScreenIndex = 0,
    [string]$ExePath = ""
)

# 1. Load Windows Forms to query connected displays
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# 2. Import Win32 User32 APIs for precise window repositioning
$Win32Signature = @"
using System;
using System.Runtime.InteropServices;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public class Win32PecoMultiDisplay {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    public class WindowEntry {
        public IntPtr Handle;
        public string Title;
    }

    public static List<WindowEntry> GetProcessWindows(uint processId) {
        var list = new List<WindowEntry>();
        EnumWindows((hWnd, lParam) => {
            uint pid;
            GetWindowThreadProcessId(hWnd, out pid);
            if (pid == processId && IsWindowVisible(hWnd)) {
                var sb = new StringBuilder(256);
                GetWindowText(hWnd, sb, 256);
                list.Add(new WindowEntry { Handle = hWnd, Title = sb.ToString() });
            }
            return true;
        }, IntPtr.Zero);
        return list;
    }
}
"@

if (-not ([System.Management.Automation.PSTypeName]'Win32PecoMultiDisplay').Type) {
}

Write-Host "=================================================" -ForegroundColor Green
Write-Host "  PECO DROP KIOSK DISPLAY LAUNCHER (LANDSCAPE)   " -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# 3. Locate PecoDropDesktopApp executable
if ([string]::IsNullOrWhiteSpace($ExePath)) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    if ([string]::IsNullOrWhiteSpace($scriptDir)) {
        $scriptDir = $PSScriptRoot
    }
    if ([string]::IsNullOrWhiteSpace($scriptDir)) {
        $scriptDir = (Get-Location).Path
    }

    $possiblePaths = @(
        (Join-Path $scriptDir "bin\Debug\net8.0-windows\PecoDropDesktopApp.exe"),
        (Join-Path $scriptDir "bin\Release\net8.0-windows\PecoDropDesktopApp.exe"),
        (Join-Path $scriptDir "PecoDropDesktopApp\bin\Debug\net8.0-windows\PecoDropDesktopApp.exe"),
        (Join-Path (Get-Location) "PecoDropDesktopApp\bin\Debug\net8.0-windows\PecoDropDesktopApp.exe"),
        (Join-Path (Get-Location) "bin\Debug\net8.0-windows\PecoDropDesktopApp.exe")
    )
    foreach ($p in $possiblePaths) {
        if (Test-Path $p) {
            $ExePath = $p
            break
        }
    }
}

if (-not (Test-Path $ExePath)) {
    Write-Host "[ERROR] Could not find PecoDropDesktopApp.exe! Building now..." -ForegroundColor Yellow
    dotnet build (Join-Path $PSScriptRoot "PecoDropDesktopApp.csproj") -c Debug
    $ExePath = Join-Path $PSScriptRoot "bin\Debug\net8.0-windows\PecoDropDesktopApp.exe"
    if (-not (Test-Path $ExePath)) {
        Write-Host "[FATAL] Build failed or executable missing at: $ExePath" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[EXE] Using: $ExePath" -ForegroundColor Cyan

# 4. Enumerate connected monitors
$screens = [System.Windows.Forms.Screen]::AllScreens
Write-Host "`n[DISPLAYS DETECTED: $($screens.Count)]" -ForegroundColor Magenta
for ($i = 0; $i -lt $screens.Count; $i++) {
    $s = $screens[$i]
    $tag = if ($s.Primary) { "[PRIMARY - INTERACTION TOUCHSCREEN]" } else { "[SECONDARY - DIGITAL SIGNAGE / ADS]" }
    $orient = if ($s.Bounds.Height -gt $s.Bounds.Width) { "PORTRAIT" } else { "LANDSCAPE" }
    Write-Host "  Screen $i $tag - Device: $($s.DeviceName) ($orient) | Bounds: X=$($s.Bounds.X), Y=$($s.Bounds.Y), W=$($s.Bounds.Width), H=$($s.Bounds.Height)" -ForegroundColor Gray
}

# Select target screen for interaction window
if ($ScreenIndex -ge $screens.Count) {
    Write-Host "[WARN] Screen index $ScreenIndex requested, but only $($screens.Count) display(s) found. Defaulting to Screen 0." -ForegroundColor Yellow
    $ScreenIndex = 0
}

$targetScreen = $screens[$ScreenIndex]
$targetX = $targetScreen.Bounds.X
$targetY = $targetScreen.Bounds.Y
$targetWidth = $targetScreen.Bounds.Width
$targetHeight = $targetScreen.Bounds.Height

Write-Host "`n[TARGET] Selected Screen $ScreenIndex (LANDSCAPE 50/50) -> (X=$targetX, Y=$targetY, Width=$targetWidth, Height=$targetHeight)" -ForegroundColor Green

# 4.5 Ensure single instance - if already running, show message and exit
$existingProcs = Get-Process -Name "PecoDropDesktopApp" -ErrorAction SilentlyContinue
if ($existingProcs) {
    Add-Type -AssemblyName System.Windows.Forms
    $msgForm = New-Object System.Windows.Forms.Form
    $msgForm.StartPosition = "CenterScreen"
    $msgForm.Size = New-Object System.Drawing.Size(350, 120)
    $msgForm.FormBorderStyle = "FixedDialog"
    $msgForm.Text = "Info"
    $msgForm.TopMost = $true
    $label = New-Object System.Windows.Forms.Label
    $label.Text = "PecoDropDesktopApp is already running."
    $label.AutoSize = $true
    $label.Location = New-Object System.Drawing.Point(30, 30)
    $msgForm.Controls.Add($label)
    $msgForm.Show()
    Start-Sleep -Milliseconds 2000
    $msgForm.Close()
    exit 0
}

# 5. Launch PecoDropDesktopApp process
Write-Host "[LAUNCH] Starting PecoDropDesktopApp in LANDSCAPE MODE..." -ForegroundColor Cyan
$process = Start-Process -FilePath $ExePath -ArgumentList "--landscape" -WorkingDirectory (Split-Path $ExePath) -PassThru

# 6. Wait for MainWindowHandle to be created
$hwnd = [IntPtr]::Zero
# 6. Wait for windows to be created
$timeoutSec = 10
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$winList = @()

while ($sw.Elapsed.TotalSeconds -lt $timeoutSec) {
    Start-Sleep -Milliseconds 250
    $winList = [Win32PecoMultiDisplay]::GetProcessWindows($process.Id)
    if ($screens.Count -gt 1 -and -not $BothOnPrimary) {
        if ($winList.Count -ge 2) { break }
    }
    else {
        if ($winList.Count -ge 1) { break }
    }
}

if ($winList.Count -eq 0) {
    \
    Write-Host "[ERROR] Timed out waiting for PecoDropDesktopApp window handles!" -ForegroundColor Red
    exit 1
}

Write-Host "[WINDOWS DETECTED: $($winList.Count)]" -ForegroundColor Magenta
foreach ($w in $winList) {
    Write-Host "  HWND: $($w.Handle) | Title: '$($w.Title)'" -ForegroundColor Gray
}

# 7. Position windows on respective physical displays
$SW_RESTORE = 9
$SW_MAXIMIZE = 3
$SWP_NOZORDER = 0x0004
$SWP_SHOWWINDOW = 0x0040
$SWP_FRAMECHANGED = 0x0020
$flags = $SWP_NOZORDER -bor $SWP_SHOWWINDOW -bor $SWP_FRAMECHANGED

if (-not $BothOnPrimary) {
    $primaryScreen = $screens | Where-Object { $_.Primary } | Select-Object -First 1
    if (-not $primaryScreen) { $primaryScreen = $screens[0] }

    $secondaryScreen = $screens | Where-Object { -not $_.Primary } | Select-Object -First 1
    if (-not $secondaryScreen -and $screens.Count -gt 1) { $secondaryScreen = $screens[1] }

    foreach ($w in $winList) {
        if ($w.Title -like "*Signage*" -or $w.Title -like "*Secondary*" -or $w.Title -like "*Ad*") {
            if ($secondaryScreen) {
                Write-Host "[TARGET 2] Routing Commercial Advertisements to HDMI Display ($($secondaryScreen.DeviceName)) -> ($($secondaryScreen.Bounds.X), $($secondaryScreen.Bounds.Y), $($secondaryScreen.Bounds.Width)x$($secondaryScreen.Bounds.Height))..." -ForegroundColor Cyan
                [Win32PecoMultiDisplay]::ShowWindow($w.Handle, $SW_RESTORE) | Out-Null
                Start-Sleep -Milliseconds 100
                [Win32PecoMultiDisplay]::SetWindowPos($w.Handle, [IntPtr]::Zero, $secondaryScreen.Bounds.X, $secondaryScreen.Bounds.Y, $secondaryScreen.Bounds.Width, $secondaryScreen.Bounds.Height, $flags) | Out-Null
                Start-Sleep -Milliseconds 150
                [Win32PecoMultiDisplay]::ShowWindow($w.Handle, $SW_MAXIMIZE) | Out-Null
            }
        }
        else {
            Write-Host "[TARGET 1] Routing Main Kiosk 50/50 to Primary Display ($($primaryScreen.DeviceName)) -> ($($primaryScreen.Bounds.X), $($primaryScreen.Bounds.Y), $($primaryScreen.Bounds.Width)x$($primaryScreen.Bounds.Height))..." -ForegroundColor Green
            [Win32PecoMultiDisplay]::ShowWindow($w.Handle, $SW_RESTORE) | Out-Null
            Start-Sleep -Milliseconds 100
            [Win32PecoMultiDisplay]::SetWindowPos($w.Handle, [IntPtr]::Zero, $primaryScreen.Bounds.X, $primaryScreen.Bounds.Y, $primaryScreen.Bounds.Width, $primaryScreen.Bounds.Height, $flags) | Out-Null
            Start-Sleep -Milliseconds 150
            [Win32PecoMultiDisplay]::ShowWindow($w.Handle, $SW_MAXIMIZE) | Out-Null
            [Win32PecoMultiDisplay]::SetForegroundWindow($w.Handle) | Out-Null
        }
    }

    Write-Host "`n[SUCCESS] Display 1 (Primary Touchscreen): Landscape Kiosk running full-screen!" -ForegroundColor Green
    if ($secondaryScreen) {
        Write-Host "[SUCCESS] Display 2 (HDMI Second Display LED): Commercial Advertisements running full-screen!" -ForegroundColor Cyan
    }
    else {
        Write-Host "[NOTICE] Only 1 display connected; secondary window is ready once HDMI display is plugged in." -ForegroundColor Yellow
    }
}
else {
    foreach ($w in $winList) {
        [Win32PecoMultiDisplay]::SetForegroundWindow($w.Handle) | Out-Null
    }
    Write-Host "=================================================" -ForegroundColor Greenaptop display." -ForegroundColor Yellow
    Write-Host "  - Left side:  Main Kiosk (Leaderboard 50% + Details 50%)" -ForegroundColor Cyan
    Write-Host "  - Right side: Secondary Digital Signage & Commercial Advertisements" -ForegroundColor Cyan
    Write-Host "  - HDMI second display LED is kept untouched." -ForegroundColor Yellow
}
Write-Host "=================================================" -ForegroundColor Green