[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$base = "https://wwyabc.github.io/ai-agent-mentor/"

function Check($path, $patterns) {
  $url = $base + $path + "?v=verify-" + (Get-Random)
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -Headers @{ 'User-Agent' = 'ps' }
    $out = "$path -> HTTP $($r.StatusCode)"
    foreach ($p in $patterns) { $out += "  [$p=$([bool]($r.Content -match $p))]" }
    Write-Output $out
  } catch {
    Write-Output "$path -> FAIL $($_.Exception.Message)"
  }
}

Check "index.html" @("06c-zh-lessons-a", "force-update")
Check "assets/js/13-ui.js" @("20 个阶段", "force-update")
Check "assets/js/sw.js" @("aam-v3")
Check "sw.js" @("aam-v3")
Check "assets/js/06c-zh-lessons-a.js" @("工具塑造你的思维方式")
