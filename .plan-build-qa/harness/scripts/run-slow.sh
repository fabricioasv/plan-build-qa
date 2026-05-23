#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)"
cd "$ROOT"

run_cmd() {
  printf '[harness:slow] %s\n' "$1"
  sh -c "$1"
}

run_cmd "sh ./.plan-build-qa/harness/scripts/check-harness-structure.sh"



printf '[harness:slow] PLACEHOLDER: Nenhum E2E/integracao pesada foi detectado. Mantenha run-slow como placeholder ate haver sensor real.\n'

printf '[harness:slow] OK\n'
