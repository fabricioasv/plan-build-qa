$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
Set-Location $Root

function Invoke-HarnessCommand {
  param([string]$Command)
  Write-Host "[harness:medium] $Command"
  powershell -NoProfile -ExecutionPolicy Bypass -Command $Command
  if ($LASTEXITCODE -ne 0) {
    Write-Host "[harness:medium] Failed: $Command"
    exit $LASTEXITCODE
  }
}

Invoke-HarnessCommand ".\.plan-build-qa\harness\scripts\check-harness-structure.ps1"

$Commands = @(
  "npm run test"
)

foreach ($Command in $Commands) {
  Invoke-HarnessCommand $Command
}



Write-Host "[harness:medium] OK"
exit 0
