#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)"
cd "$ROOT"

run_cmd() {
  printf '[harness:fast] %s\n' "$1"
  sh -c "$1"
}

run_cmd "sh ./.plan-build-qa/harness/scripts/check-harness-structure.sh"



printf '[harness:fast] PLACEHOLDER: Nenhum lint/typecheck/teste unitario rapido foi detectado. Use 'pbq sensor add' ou edite .plan-build-qa/sensors.json quando existir.\n'

printf '[harness:fast] OK\n'
