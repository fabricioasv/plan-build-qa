#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)"
cd "$ROOT"

run_cmd() {
  printf '[harness:slow] %s\n' "$1"
  sh -c "$1"
}

run_cmd "sh ./.plan-build-qa/harness/scripts/check-harness-structure.sh"



printf '[harness:slow] PLACEHOLDER: Nenhum sensor slow cadastrado. Use 'pbq sensor add --tier slow' para adicionar.\n'

printf '[harness:slow] OK\n'
