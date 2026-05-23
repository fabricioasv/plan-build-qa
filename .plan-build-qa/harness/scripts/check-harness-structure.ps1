$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
$Required = @(
  ".plan-build-qa\constitution\architecture.md",
  ".plan-build-qa\constitution\testing.md",
  ".plan-build-qa\constitution\operations.md",
  ".plan-build-qa\constitution\repository-rules.md",
  ".plan-build-qa\harness\README.md",
  ".plan-build-qa\harness\prompts\implement-package.md",
  ".plan-build-qa\harness\prompts\validate-contract.md",
  ".plan-build-qa\harness\prompts\run-evaluation.md",
  ".plan-build-qa\harness\scripts\run-fast.ps1",
  ".plan-build-qa\harness\scripts\run-medium.ps1",
  ".plan-build-qa\harness\scripts\run-slow.ps1",
  ".plan-build-qa\harness\scripts\check-harness-structure.ps1",
  ".plan-build-qa\harness\scripts\run-fast.sh",
  ".plan-build-qa\harness\scripts\run-medium.sh",
  ".plan-build-qa\harness\scripts\run-slow.sh",
  ".plan-build-qa\harness\scripts\check-harness-structure.sh",
  ".plan-build-qa\harness\templates\spec.md",
  ".plan-build-qa\harness\templates\contract.md",
  ".plan-build-qa\harness\templates\progress.md",
  ".plan-build-qa\harness\templates\evaluation.md",
  ".plan-build-qa\roadmap.md",
  ".plan-build-qa\specs\README.md",
  ".plan-build-qa\sensors.json",
  ".plan-build-qa\manifest.json"
)

$Missing = @()
foreach ($Item in $Required) {
  $Path = Join-Path $Root $Item
  if (-not (Test-Path $Path)) {
    $Missing += $Item
  }
}

if ($Missing.Count -gt 0) {
  Write-Host "[harness] Missing required files:"
  $Missing | ForEach-Object { Write-Host " - $_" }
  exit 1
}

Write-Host "[harness] Structure OK"
exit 0
