<#
.SYNOPSIS
    Installs True Urdu Nastaliq Fonts (Jameel Noori Nastaleeq & Noto Nastaliq Urdu) for the current user.
    No Administrator rights required.
#>

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  Installing True Urdu Nastaliq Fonts (Kiosk)   " -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$fontSourceDir = Join-Path $scriptDir "RVMDesktopApp\Fonts"

if (-not (Test-Path $fontSourceDir)) {
    Write-Error "Font source directory not found: $fontSourceDir"
    return
}

$userFontDir = [System.IO.Path]::Combine($env:LOCALAPPDATA, "Microsoft\Windows\Fonts")
if (-not (Test-Path $userFontDir)) {
    New-Item -ItemType Directory -Path $userFontDir -Force | Out-Null
}

$fonts = @(
    @{ File = "Jameel Noori Nastaleeq.ttf"; RegName = "Jameel Noori Nastaleeq (TrueType)" },
    @{ File = "NotoNastaliqUrdu-Regular.ttf"; RegName = "Noto Nastaliq Urdu (TrueType)" },
    @{ File = "NotoNastaliqUrdu-Bold.ttf"; RegName = "Noto Nastaliq Urdu Bold (TrueType)" }
)

# C# helper for Win32 API to register fonts dynamically
$win32Type = @"
using System;
using System.Runtime.InteropServices;

public static class FontInstaller {
    [DllImport("gdi32.dll", EntryPoint = "AddFontResourceW", SetLastError = true)]
    public static extern int AddFontResource([MarshalAs(UnmanagedType.LPWStr)] string lpFileName);

    [DllImport("user32.dll", EntryPoint = "SendMessageTimeoutW", SetLastError = true)]
    public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, UIntPtr wParam, IntPtr lParam, uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);

    public const int HWND_BROADCAST = 0xffff;
    public const int WM_FONTCHANGE = 0x001d;
    public const int SMTO_ABORTIFHUNG = 0x0002;

    public static void NotifyFontChange() {
        UIntPtr result;
        SendMessageTimeout((IntPtr)HWND_BROADCAST, (uint)WM_FONTCHANGE, UIntPtr.Zero, IntPtr.Zero, (uint)SMTO_ABORTIFHUNG, 1000, out result);
    }
}
"@

try {
    Add-Type -TypeDefinition $win32Type -Language CSharp
} catch {
    # Type might already be loaded in current session
}

$regPath = "HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Fonts"

foreach ($font in $fonts) {
    $src = Join-Path $fontSourceDir $font.File
    if (Test-Path $src) {
        $dest = Join-Path $userFontDir $font.File
        Copy-Item -Path $src -Destination $dest -Force
        Set-ItemProperty -Path $regPath -Name $font.RegName -Value $dest -Force
        
        [FontInstaller]::AddFontResource($dest) | Out-Null
        Write-Host "[OK] Installed & Registered: $($font.RegName)" -ForegroundColor Green
    } else {
        Write-Warning "Source font file not found: $src"
    }
}

[FontInstaller]::NotifyFontChange()
Write-Host "`n[SUCCESS] All Urdu Nastaliq fonts are installed and active!" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
