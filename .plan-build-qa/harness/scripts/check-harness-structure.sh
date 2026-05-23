#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)"
missing=""

for item in \
  ".plan-build-qa/constitution/architecture.md" \
  ".plan-build-qa/constitution/testing.md" \
  ".plan-build-qa/constitution/operations.md" \
  ".plan-build-qa/constitution/repository-rules.md" \
  ".plan-build-qa/harness/README.md" \
  ".plan-build-qa/harness/prompts/implement-package.md" \
  ".plan-build-qa/harness/prompts/validate-contract.md" \
  ".plan-build-qa/harness/prompts/run-evaluation.md" \
  ".plan-build-qa/harness/scripts/run-fast.ps1" \
  ".plan-build-qa/harness/scripts/run-medium.ps1" \
  ".plan-build-qa/harness/scripts/run-slow.ps1" \
  ".plan-build-qa/harness/scripts/check-harness-structure.ps1" \
  ".plan-build-qa/harness/scripts/run-fast.sh" \
  ".plan-build-qa/harness/scripts/run-medium.sh" \
  ".plan-build-qa/harness/scripts/run-slow.sh" \
  ".plan-build-qa/harness/scripts/check-harness-structure.sh" \
  ".plan-build-qa/harness/templates/spec.md" \
  ".plan-build-qa/harness/templates/contract.md" \
  ".plan-build-qa/harness/templates/progress.md" \
  ".plan-build-qa/harness/templates/evaluation.md" \
  ".plan-build-qa/roadmap.md" \
  ".plan-build-qa/specs/README.md" \
  ".plan-build-qa/sensors.json" \
  ".plan-build-qa/manifest.json"; do
  if [ ! -e "$ROOT/$item" ]; then
    missing="$missing
$item"
  fi
done

if [ -n "$missing" ]; then
  printf '[harness] Missing required files:%s\n' "$missing"
  exit 1
fi

printf '[harness] Structure OK\n'
