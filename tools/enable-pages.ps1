# =============================================================================
# Enable GitHub Pages for the repo, using the token stored by Git Credential
# Manager (no need to paste any secret by hand).
# Usage: powershell -ExecutionPolicy Bypass -File tools/enable-pages.ps1
# ASCII-only on purpose so it runs on any Windows locale.
# =============================================================================
$Owner = 'wwyabc'
$Repo  = 'ai-agent-mentor'
$Branch= 'main'

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
if (-not $token) {
  Write-Host 'Could not read a GitHub token from Git Credential Manager.'
  Write-Host 'Enable Pages manually: https://github.com/wwyabc/ai-agent-mentor/settings/pages'
  Write-Host '  Source = Deploy from a branch -> branch: main, folder: / (root) -> Save'
  exit 1
}
Write-Host ('token acquired, length = ' + $token.Length)

$headers = @{
  'Authorization'        = "Bearer $token"
  'Accept'               = 'application/vnd.github+json'
  'X-GitHub-Api-Version' = '2022-11-28'
  'User-Agent'           = 'enable-pages'
}
$body = (@{ source = @{ branch = $Branch; path = '/' } }) | ConvertTo-Json
$uri = "https://api.github.com/repos/$Owner/$Repo/pages"

try {
  $r = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body -ContentType 'application/json'
  Write-Host ('Pages status : ' + $r.status)
  Write-Host ('Pages url    : ' + $r.html_url)
} catch {
  $msg = $_.Exception.Message
  if ($_.ErrorDetails.Message) { $msg += ' | ' + $_.ErrorDetails.Message }
  Write-Host ('API error: ' + $msg)
  Write-Host 'Fallback: open https://github.com/wwyabc/ai-agent-mentor/settings/pages and set Source to main / root'
  exit 1
}
