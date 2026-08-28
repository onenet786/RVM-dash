<#
.SYNOPSIS
    Launches the RVMDesktopApp kiosk on a specified display monitor (e.g., secondary display in Portrait mode).

.DESCRIPTION
    Automatically detects connected monitors, selects Portrait or Landscape mode based on target screen orientation,
    launches RVMDesktopApp, obtains the window handle, and snaps the full-screen kiosk window to the target display.

.PARAMETER ScreenIndex
    The index of the target monitor (0 = Primary Display, 1 = Secondary Display). Default is 1 (or 0 if only 1 screen exists).

.PARAMETER Mode
    Window layout mode: "Auto" (default, detects from screen aspect ratio), "Portrait", or "Landscape".

.PARAMETER ExePath
    Optional explicit path to RVMDesktopApp.exe. If omitted, finds the latest build automatically.
#>

param(
    [int]$ScreenIndex = 1,
    [ValidateSet("Auto", "Portrait", "Landscape")]
    [string]$Mode = "Auto",
    [string]$ExePath = ""
)

# 1. Load Windows Forms to query connected displays
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# 2. Import Win32 User32 APIs for precise window repositioning
$Win32Signature = @"
using System;
using System.Runtime.InteropServices;

public class Win32Kiosk {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
}
"@

if (-not ([System.Management.Automation.PSTypeName]'Win32Kiosk').Type) {
    Add-Type -TypeDefinition $Win32Signature
}

Write-Host "=================================================" -ForegroundColor Green
Write-Host "  RVM KIOSK DISPLAY LAUNCHER                     " -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# 3. Locate RVMDesktopApp executable
if ([string]::IsNullOrWhiteSpace($ExePath)) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    if ([string]::IsNullOrWhiteSpace($scriptDir)) {
        $scriptDir = $PSScriptRoot
    }
    if ([string]::IsNullOrWhiteSpace($scriptDir)) {
        $scriptDir = (Get-Location).Path
    }

    $possiblePaths = @(
        (Join-Path $scriptDir "bin\Debug\net8.0-windows\RVMDesktopApp.exe"),
        (Join-Path $scriptDir "bin\Release\net8.0-windows\RVMDesktopApp.exe"),
        (Join-Path $scriptDir "RVMDesktopApp\bin\Debug\net8.0-windows\RVMDesktopApp.exe"),
        (Join-Path (Get-Location) "RVMDesktopApp\bin\Debug\net8.0-windows\RVMDesktopApp.exe"),
        (Join-Path (Get-Location) "bin\Debug\net8.0-windows\RVMDesktopApp.exe")
    )
    foreach ($p in $possiblePaths) {
        if (Test-Path $p) {
            $ExePath = $p
            break
        }
    }
}

if (-not (Test-Path $ExePath)) {
    Write-Host "[ERROR] Could not find RVMDesktopApp.exe! Building now..." -ForegroundColor Yellow
    dotnet build (Join-Path $PSScriptRoot "RVMDesktopApp.csproj") -c Debug
    $ExePath = Join-Path $PSScriptRoot "bin\Debug\net8.0-windows\RVMDesktopApp.exe"
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
    $tag = if ($s.Primary) { "[PRIMARY]" } else { "[SECONDARY]" }
    $orient = if ($s.Bounds.Height -gt $s.Bounds.Width) { "PORTRAIT" } else { "LANDSCAPE" }
    Write-Host "  Screen $i $tag - Device: $($s.DeviceName) ($orient) | Bounds: X=$($s.Bounds.X), Y=$($s.Bounds.Y), W=$($s.Bounds.Width), H=$($s.Bounds.Height)" -ForegroundColor Gray
}

# Select target screen
if ($ScreenIndex -ge $screens.Count) {
    Write-Host "[WARN] Screen index $ScreenIndex requested, but only $($screens.Count) display(s) found. Defaulting to Screen 0." -ForegroundColor Yellow
    $ScreenIndex = 0
}

$targetScreen = $screens[$ScreenIndex]
$targetX = $targetScreen.Bounds.X
$targetY = $targetScreen.Bounds.Y
$targetWidth = $targetScreen.Bounds.Width
$targetHeight = $targetScreen.Bounds.Height

# Determine portrait / landscape mode flag to pass to application
$isTargetPortrait = ($targetHeight -gt $targetWidth)
if ($Mode -eq "Portrait") {
    $isTargetPortrait = $true
} elseif ($Mode -eq "Landscape") {
    $isTargetPortrait = $false
}

$modeArg = if ($isTargetPortrait) { "--portrait" } else { "--landscape" }
$modeLabel = if ($isTargetPortrait) { "PORTRAIT MODE" } else { "LANDSCAPE MODE" }

Write-Host "`n[TARGET] Selected Screen $ScreenIndex ($modeLabel) -> (X=$targetX, Y=$targetY, Width=$targetWidth, Height=$targetHeight)" -ForegroundColor Green

# 5. Launch RVMDesktopApp process with orientation argument
Write-Host "[LAUNCH] Starting RVMDesktopApp in $modeLabel with arg: $modeArg..." -ForegroundColor Cyan
$process = Start-Process -FilePath $ExePath -ArgumentList $modeArg -PassThru

# 6. Wait for MainWindowHandle to be created
$hwnd = [IntPtr]::Zero
$timeoutSec = 10
$sw = [System.Diagnostics.Stopwatch]::StartNew()

while ($hwnd -eq [IntPtr]::Zero -and $sw.Elapsed.TotalSeconds -lt $timeoutSec) {
    Start-Sleep -Milliseconds 200
    try {
        $freshProc = [System.Diagnostics.Process]::GetProcessById($process.Id)
        $hwnd = $freshProc.MainWindowHandle
    }
    catch {
        break
    }
}

if ($hwnd -eq [IntPtr]::Zero) {
    Write-Host "[ERROR] Timed out waiting for RVMDesktopApp window handle!" -ForegroundColor Red
    exit 1
}

Write-Host "[HWND] Obtained window handle: $hwnd (in $($sw.Elapsed.TotalMilliseconds.ToString('0'))ms)" -ForegroundColor Green

# 7. Move and Maximize on target monitor
# Win32 Constants
$SW_RESTORE = 9
$SW_MAXIMIZE = 3
$SWP_NOZORDER = 0x0004
$SWP_SHOWWINDOW = 0x0040
$SWP_FRAMECHANGED = 0x0020

# Restore first so coordinates can be reassigned across monitors
[Win32Kiosk]::ShowWindow($hwnd, $SW_RESTORE) | Out-Null
Start-Sleep -Milliseconds 150

# Move window to target screen coordinates
$flags = $SWP_NOZORDER -bor $SWP_SHOWWINDOW -bor $SWP_FRAMECHANGED
[Win32Kiosk]::SetWindowPos($hwnd, [IntPtr]::Zero, $targetX, $targetY, $targetWidth, $targetHeight, $flags) | Out-Null
Start-Sleep -Milliseconds 200

# Maximize fullscreen on target monitor
[Win32Kiosk]::ShowWindow($hwnd, $SW_MAXIMIZE) | Out-Null
[Win32Kiosk]::SetForegroundWindow($hwnd) | Out-Null

Write-Host "`n[SUCCESS] RVMDesktopApp is running full-screen in $modeLabel on Screen $ScreenIndex!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green