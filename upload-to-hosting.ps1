# =================================================================
# One-Click Upload & Deploy to Hosting Script (PowerShell for Windows)
# Project: RVM Master Developer Dashboard (ISP Environmental Solutions)
# =================================================================

param (
    [string]$TargetDestination = ""
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "[1/3] ISP SMART RECYCLING DASHBOARD - ONE-CLICK HOSTING UPLOADER " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Build Production Frontend
Write-Host "Building production frontend with Vite..." -ForegroundColor Green
npm run build

# 2. Package Clean Production Archive
$ZipName = "rvm-dash-production.zip"
$ZipPath = Join-Path $ScriptDir $ZipName

if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

Write-Host "[2/3] Creating lightweight production bundle ($ZipName)..." -ForegroundColor Green

$ItemsToInclude = @(
    "dist",
    "server",
    "package.json",
    "package-lock.json",
    "ecosystem.config.cjs",
    ".env.example",
    "deploy-aapanel.sh",
    "update-server.sh",
    "upload-to-hosting.sh",
    "nginx-aapanel.conf"
)

if (Get-Command tar -ErrorAction SilentlyContinue) {
    tar -acf $ZipName $ItemsToInclude
} else {
    Compress-Archive -Path $ItemsToInclude -DestinationPath $ZipPath -Force
}

$ZipSize = (Get-Item $ZipPath).Length / 1MB
Write-Host "Production package created successfully: $ZipName ($([math]::Round($ZipSize, 2)) MB)" -ForegroundColor Green

# 3. Direct SCP Upload or Instructions
if ($TargetDestination -ne "") {
    Write-Host ""
    Write-Host "[3/3] Uploading package to remote destination: $TargetDestination..." -ForegroundColor Yellow
    
    $parts = $TargetDestination.Split(":")
    $RemoteHost = $parts[0]
    $RemotePath = if ($parts.Length -gt 1) { $parts[1] } else { "/www/wwwroot/rvm-dash" }

    Write-Host "   -> Remote Host: $RemoteHost"
    Write-Host "   -> Remote Path: $RemotePath"

    scp "$ZipPath" "${RemoteHost}:${RemotePath}/${ZipName}"

    Write-Host "Executing remote extraction and PM2 reload on server..." -ForegroundColor Yellow
    ssh $RemoteHost "cd '$RemotePath' && chattr -i dist/.user.ini 2>/dev/null || true; unzip -o -q '$ZipName'; rm -f '$ZipName'; [ ! -f .env ] && cp .env.example .env || true; npm install --omit=dev --no-audit; node server/migrate.js || true; pm2 reload ecosystem.config.cjs --env production || pm2 restart rvm-dash || pm2 start ecosystem.config.cjs --env production; pm2 save; curl -s http://127.0.0.1:5009/api/health || true"

    Write-Host ""
    Write-Host "[SUCCESS] Dashboard uploaded and live on remote hosting server!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host "PRODUCTION PACKAGE READY FOR INSTANT UPLOAD!" -ForegroundColor Green
    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host "Archive Location: $ZipPath" -ForegroundColor White
    Write-Host ""
    Write-Host "Choose your upload method below:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "METHOD 1: 1-Click Upload via aaPanel / cPanel Web File Manager" -ForegroundColor White
    Write-Host "   1. Open aaPanel -> Files -> Go to: /www/wwwroot/rvm-dash"
    Write-Host "   2. Click 'Upload' -> Select '$ZipName'"
    Write-Host "   3. Right-click '$ZipName' on server -> Click 'Unzip' or 'Extract'"
    Write-Host "   4. In aaPanel -> Website -> Node project -> Click 'Restart'"
    Write-Host ""
    Write-Host "METHOD 2: 1-Command Automated Remote Upload via SSH" -ForegroundColor White
    Write-Host "   Run in PowerShell:"
    Write-Host "   .\upload-to-hosting.ps1 -TargetDestination root@YOUR_SERVER_IP:/www/wwwroot/rvm-dash"
    Write-Host ""
    Write-Host "METHOD 3: Direct Server Update via Git Terminal on Server" -ForegroundColor White
    Write-Host "   SSH to server and run: bash deploy-aapanel.sh"
    Write-Host "=================================================================" -ForegroundColor Cyan
}
