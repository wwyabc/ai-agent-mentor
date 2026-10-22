# =============================================================================
# Check repo visibility + GitHub Pages status, then enable Pages if possible.
# Usage: powershell -ExecutionPolicy Bypass -File tools/pages-status.ps1
#        powershell -ExecutionPolicy Bypass -File tools/pages-status.ps1 -MakePublic
# ASCII-only on purpose so it runs on any Windows locale.
# =============================================================================
param([switch]$MakePublic)

$Owner  = 'wwyabc'
$Repo   = 'ai-agent-mentor'
$Branch = 'main'

$env:PATH = [System.Environment]::GetEnvironmentVariable('PATH', 'Machine') + ';' +
            [System.Environment]::GetEnvironmentVariable('PATH', 'User')

function Get-GitToken {
  $inFile  = Join-Path $env:TEMP 'aam-gh-in.txt'
  $outFile = Join-Path $env:TEMP 'aam-gh-out.txt'
  $enc = New-Object System.Text.ASCIIEncoding
  [System.IO.File]::WriteAllText($inFile, "protocol=https`nhost=github.com`n`n", $enc)
  if (Test-Path $outFile) { Remove-Item $outFile -Force }
  Start-Process -FilePath 'git' -ArgumentList 'credential','fill' -RedirectStandardInput $inFile -RedirectStandardOutput $outFile -NoNewWindow -Wait | Out-Null
  if (-not (Test-Path $outFile)) { return $null }
  $out = [System.IO.File]::ReadAllText($outFile)
  Remove-Item $inFile -Force
  Remove-Item $outFile -Force
  $line = ($out -split "`n" | Where-Object { $_ -like 'password=*' } | Select-Object -First 1)
  if (-not $line) { return $null }
  return ($line -replace '^password=', '').Trim()
}

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$token = Get-GitToken
if (-not $token) { Write-Host 'NO_TOKEN'; exit 1 }

$headers = @{
  'Authorization'        = "Bearer $token"
  'Accept'               = 'application/vnd.github+json'
  'X-GitHub-Api-Version' = '2022-11-28'
  'User-Agent'           = 'pages-status'
}
$base = "https://api.github.com/repos/$Owner/$Repo"

$info = Invoke-RestMethod -Uri $base -Headers $headers -Method Get
Write-Host ('repo       : ' + $info.full_name)
Write-Host ('private    : ' + $info.private)
Write-Host ('default    : ' + $info.default_branch)
Write-Host ('has_pages  : ' + $info.has_pages)

if ($info.private -and $MakePublic) {
  $body = (@{ private = $false }) | ConvertTo-Json
  $info = Invoke-RestMethod -Uri $base -Headers $headers -Method Patch -Body $body -ContentType 'application/json'
  Write-Host ('visibility : set to public -> private=' + $info.private)
}

if (-not $info.private) {
  $body = (@{ source = @{ branch = $Branch; path = '/' } }) | ConvertTo-Json
  try {
    $p = Invoke-RestMethod -Uri ($base + '/pages') -Headers $headers -Method Post -Body $body -ContentType 'application/json'
    Write-Host ('pages      : ' + $p.status + '  ' + $p.html_url)
  } catch {
    $m = $_.Exception.Message
    if ($_.ErrorDetails.Message) { $m += ' | ' + $_.ErrorDetails.Message }
    Write-Host ('pages err  : ' + $m)
  }
} else {
  Write-Host 'repo is private: GitHub Pages needs a public repo on the Free plan.'
  Write-Host 're-run with -MakePublic, or change visibility in Settings -> Danger zone.'
}
