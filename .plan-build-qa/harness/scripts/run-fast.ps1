$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
Set-Location $Root

function Invoke-HarnessCommand {
  param([string]$Command)
  Write-Host "[harness:fast] $Command"
  powershell -NoProfile -ExecutionPolicy Bypass -Command $Command
  if ($LASTEXITCODE -ne 0) {
    Write-Host "[harness:fast] Failed: $Command"
    exit $LASTEXITCODE
  }
}

Invoke-HarnessCommand ".\.plan-build-qa\harness\scripts\check-harness-structure.ps1"

$Commands = @(

)

foreach ($Command in $Commands) {
  Invoke-HarnessCommand $Command
}

Write-Host "[harness:fast] PLACEHOLDER: Nenhum lint/typecheck/teste unitario rapido foi detectado. Use 'pbq sensor add' ou edite .plan-build-qa/sensors.json quando existir."

Write-Host "[harness:fast] OK"
exit 0
