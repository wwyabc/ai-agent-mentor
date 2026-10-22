# =============================================================================
# Package + upload to Tencent Cloud COS (use together with CDN for CN speed).
# Usage: powershell -ExecutionPolicy Bypass -File deploy/upload-cos.ps1
#
# One-time setup:
#   1) Create a COS bucket: access "public read / private write", pick a near region
#   2) Get SecretId / SecretKey: https://console.cloud.tencent.com/cam/capi
#   3) Download coscli: https://cloud.tencent.com/document/product/436/63144
#      put it somewhere in PATH
#   4) Fill in the 4 variables below, then run this script
# =============================================================================

$Bucket    = 'ai-agent-mentor-1250000000'   # bucket name, MUST include APPID
$Region    = 'ap-guangzhou'                 # region
$SecretId  = 'AKIDxxxxxxxxxxxxxxxxxxxx'     # secret id
$SecretKey = 'xxxxxxxxxxxxxxxxxxxxxxxx'     # secret key
$Prefix    = ''                             # sub path in bucket, empty = root

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

# 1) package
& (Join-Path $PSScriptRoot 'package.ps1')

# 2) configure coscli (overwrites existing profile named aam)
coscli config add -b $Bucket -r $Region -a $SecretId -s $SecretKey -n aam

# 3) sync (--delete removes extra remote files so bucket == dist)
$cosPath = if ($Prefix) { "cos://$Bucket/$Prefix/" } else { "cos://$Bucket/" }
coscli sync (Join-Path $root 'dist') $cosPath --delete

Write-Host ''
Write-Host 'Upload done. Two things left (only once):'
Write-Host '  1) COS console -> bucket -> Basic config -> Static website: index doc = index.html, error doc = index.html'
Write-Host '  2) CDN console -> add domain -> origin = COS -> enable HTTPS -> cache rules in DEPLOY.md'
Write-Host ''
Write-Host 'After a new release, purge CDN cache if needed:'
Write-Host '  tccli cdn PurgePathCache --cli-unfold-argument --Paths https://YOUR_DOMAIN/index.html --Paths https://YOUR_DOMAIN/sw.js'
