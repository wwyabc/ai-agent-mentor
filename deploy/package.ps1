# =============================================================================
# Package the app into dist/ (and dist.zip) ready for upload.
# Usage: powershell -ExecutionPolicy Bypass -File deploy/package.ps1
# Note: ASCII-only on purpose so it runs on any Windows locale.
# =============================================================================
$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root 'dist'
$zip  = Join-Path $root 'dist.zip'

if (Test-Path $dist) { Remove-Item -Recurse -Force $dist }
New-Item -ItemType Directory -Path $dist | Out-Null

@('index.html', 'manifest.webmanifest', 'sw.js', 'README.md', 'ARCHITECTURE.md', 'DEPLOY.md') | ForEach-Object {
  $src = Join-Path $root $_
  if (Test-Path $src) { Copy-Item $src $dist }
}

Copy-Item (Join-Path $root 'assets') (Join-Path $dist 'assets') -Recurse

$sum = (Get-ChildItem -Recurse -File $dist | Measure-Object -Property Length -Sum)
$kb  = [math]::Round($sum.Sum / 1KB, 1)
$gzip= [math]::Round($sum.Sum / 1KB * 0.3, 1)
Write-Host "dist ready : $dist"
Write-Host "files      : $($sum.Count)"
Write-Host "size       : $kb KB (about $gzip KB after gzip)"

if (Test-Path $zip) { Remove-Item -Force $zip }
Compress-Archive -Path (Join-Path $dist '*') -DestinationPath $zip
Write-Host "zip ready  : $zip"
