# pbq guard — advisory pre-commit hook (PowerShell)
# Activate with: pbq hooks install
$RepoRoot = git rev-parse --show-toplevel 2>$null
if (-not $RepoRoot) { $RepoRoot = (Get-Location).Path }

if (Get-Command pbq -ErrorAction SilentlyContinue) {
  pbq guard --event commit $RepoRoot
} elseif (Test-Path "$RepoRoot\node_modules\.bin\pbq.cmd") {
  & "$RepoRoot\node_modules\.bin\pbq.cmd" guard --event commit $RepoRoot
} elseif (Test-Path "$RepoRoot\bin\pbq.mjs") {
  node "$RepoRoot\bin\pbq.mjs" guard --event commit $RepoRoot
}
exit 0
