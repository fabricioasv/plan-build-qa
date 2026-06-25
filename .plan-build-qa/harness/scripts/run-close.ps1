$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
Set-Location $Root

function Invoke-HarnessCommand {
  param([string]$Command)
  Write-Host "[harness:close] $Command"
  powershell -NoProfile -ExecutionPolicy Bypass -Command $Command
  if ($LASTEXITCODE -ne 0) {
    Write-Host "[harness:close] Failed: $Command"
    exit $LASTEXITCODE
  }
}

$Commands = @(
  "npm run test"
)

foreach ($Command in $Commands) {
  Invoke-HarnessCommand $Command
}

Write-Host "[harness:close] OK"
exit 0
