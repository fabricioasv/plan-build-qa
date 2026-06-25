#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)"
cd "$ROOT"

run_cmd() {
  printf '[harness:fast] %s\n' "$1"
  sh -c "$1"
}

run_cmd "sh ./.plan-build-qa/harness/scripts/check-harness-structure.sh"

run_cmd "node ./bin/pbq.mjs analyze ."



printf '[harness:fast] OK\n'
