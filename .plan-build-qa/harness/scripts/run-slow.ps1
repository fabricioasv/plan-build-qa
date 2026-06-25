$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
Set-Location $Root

function Invoke-HarnessCommand {
  param([string]$Command)
  Write-Host "[harness:slow] $Command"
  powershell -NoProfile -ExecutionPolicy Bypass -Command $Command
  if ($LASTEXITCODE -ne 0) {
    Write-Host "[harness:slow] Failed: $Command"
    exit $LASTEXITCODE
  }
}

Invoke-HarnessCommand ".\.plan-build-qa\harness\scripts\check-harness-structure.ps1"

$Commands = @(

)

foreach ($Command in $Commands) {
  Invoke-HarnessCommand $Command
}

Write-Host "[harness:slow] PLACEHOLDER: Nenhum sensor slow cadastrado. Use 'pbq sensor add --tier slow' para adicionar."

Write-Host "[harness:slow] OK"
exit 0
