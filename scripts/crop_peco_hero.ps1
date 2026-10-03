Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\BIN ISHAQ\.gemini\antigravity-ide\brain\5a423f69-8bfd-4dd5-a314-03367c310dd6\.user_uploaded\media_1790982485859.jpg"
if (-not (Test-Path $srcPath)) {
    Write-Host "File not found: $srcPath"
    exit 1
}

$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Host "Source dimensions: $($bmp.Width) x $($bmp.Height)"

# In 1024x682 or similar:
# Left column is from X=0 to Width*0.62 approx
# Let's inspect coordinates
# Centerpiece card is roughly:
# X: from left border to center border
# Y: under Machine Status bar to above How-To-Use bar
# Let's crop the center hero graphic
$w = $bmp.Width
$h = $bmp.Height

# Let's calculate normalized coordinates:
# Centerpiece in the image:
# Left: ~1.5% of width, Right: ~61.5% of width
# Top: ~23% of height, Bottom: ~63% of height
$rectX = [int]($w * 0.015)
$rectY = [int]($h * 0.228)
$rectW = [int]($w * 0.595)
$rectH = [int]($h * 0.405)

$rect = New-Object System.Drawing.Rectangle($rectX, $rectY, $rectW, $rectH)
$cropped = $bmp.Clone($rect, $bmp.PixelFormat)

$destDir = "d:\GIT-HUB\RVM-dash\PecoDropDesktopApp\Assets"
if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force }

$destPath = Join-Path $destDir "peco_centerpiece_hero.jpg"
$cropped.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
Write-Host "Saved centerpiece hero to: $destPath ($($cropped.Width) x $($cropped.Height))"

$cropped.Dispose()
$bmp.Dispose()
