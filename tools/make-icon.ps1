# Generate PWA icons (Windows PowerShell 5.1, System.Drawing)
# Usage: powershell -ExecutionPolicy Bypass -File tools/make-icon.ps1
# ASCII-only on purpose so it runs on any Windows locale.
Add-Type -AssemblyName System.Drawing

$root   = Split-Path -Parent $PSScriptRoot
$assets = Join-Path $root 'assets'
if (-not (Test-Path $assets)) { New-Item -ItemType Directory -Path $assets | Out-Null }

function Make-Icon($size, $path) {
  $bmp = New-Object System.Drawing.Bitmap -ArgumentList @($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  $rect = New-Object System.Drawing.Rectangle -ArgumentList @(0, 0, $size, $size)
  $c1 = [System.Drawing.Color]::FromArgb(53, 83, 255)
  $c2 = [System.Drawing.Color]::FromArgb(107, 70, 255)
  $mode = [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
  $br = New-Object System.Drawing.Drawing2D.LinearGradientBrush -ArgumentList @($rect, $c1, $c2, $mode)
  $g.FillRectangle($br, $rect)

  $font = New-Object System.Drawing.Font -ArgumentList @('Segoe UI', [float]($size * 0.40), [System.Drawing.FontStyle]::Bold)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $area = New-Object System.Drawing.RectangleF -ArgumentList @(0, 0, $size, $size)
  $g.DrawString('AI', $font, [System.Drawing.Brushes]::White, $area, $sf)

  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  Write-Host "icon: $path"
}

Make-Icon 192 (Join-Path $assets 'icon-192.png')
Make-Icon 512 (Join-Path $assets 'icon-512.png')
