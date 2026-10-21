param(
  [int]$Port = 8766
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env"

function Import-AdsMcpEnvFile([string] $path) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
    return
  }
  foreach ($line in Get-Content -LiteralPath $path) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$') {
      $key = $Matches[1]
      $value = $Matches[2].Trim()
      if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
        $value = $value.Substring(1, $value.Length - 2)
      }
      Set-Item -Path "Env:$key" -Value $value
    }
  }
}

Import-AdsMcpEnvFile $envFile

$dataRoot = $env:ADS_MCP_DATA
if ([string]::IsNullOrWhiteSpace($dataRoot)) {
  $dataRoot = Join-Path $root "data"
} elseif (-not [System.IO.Path]::IsPathRooted($dataRoot)) {
  $dataRoot = [System.IO.Path]::GetFullPath((Join-Path $root $dataRoot))
}
$sessionEnvFile = Join-Path $dataRoot "secrets\telegram-ads-session.env"
# The session file is the only supported source for Telegram Ads cookies.
# Clear legacy root-.env values so state cannot silently come from two places.
foreach ($key in @("ADS_TELEGRAM_STEL_TOKEN", "ADS_TELEGRAM_STEL_SSID", "ADS_TELEGRAM_STEL_ADOWNER")) {
  Remove-Item -Path "Env:$key" -ErrorAction SilentlyContinue
}
Import-AdsMcpEnvFile $sessionEnvFile

$moduleDir = $env:ADS_TELEGRAM_MCP_DIR
if ([string]::IsNullOrWhiteSpace($moduleDir)) {
  $moduleDir = Join-Path $root "modules\telegram-ads"
} elseif (-not [System.IO.Path]::IsPathRooted($moduleDir)) {
  $moduleDir = Join-Path $root $moduleDir
}
if (-not (Test-Path -LiteralPath $moduleDir -PathType Container)) {
  throw "Telegram Ads MCP directory not found: $moduleDir"
}
if ([string]::IsNullOrWhiteSpace($env:ADS_TELEGRAM_STEL_TOKEN) -or [string]::IsNullOrWhiteSpace($env:ADS_TELEGRAM_STEL_SSID)) {
  throw "Run npm run telegram:login first; the session is loaded from ADS_MCP_DATA\secrets\telegram-ads-session.env. Do not put cookie values in chat."
}

# The global Python environment may contain a different MCP SDK. Keep the
# provider runtime deterministic by preferring the locally prepared dependency
# tree whose SDK range matches telegram-ads-mcp (mcp>=2.1.1,<3).
$dependencyDir = Join-Path $root "modules\telegram-ads-deps"
if (-not (Test-Path -LiteralPath $dependencyDir -PathType Container)) {
  throw "Telegram Ads MCP dependency tree not found: $dependencyDir"
}
$env:PYTHONPATH = if ([string]::IsNullOrWhiteSpace($env:PYTHONPATH)) {
  $dependencyDir
} else {
  "$dependencyDir;$($env:PYTHONPATH)"
}

$env:STEL_TOKEN = $env:ADS_TELEGRAM_STEL_TOKEN
$env:STEL_SSID = $env:ADS_TELEGRAM_STEL_SSID
if (-not [string]::IsNullOrWhiteSpace($env:ADS_TELEGRAM_STEL_ADOWNER)) {
  $env:STEL_ADOWNER = $env:ADS_TELEGRAM_STEL_ADOWNER
}
$env:TG_ADS_WRITE_GATE = "strict"

Set-Location -LiteralPath $moduleDir
python -m telegram_ads_mcp --transport streamable-http --host 127.0.0.1 --port $Port
