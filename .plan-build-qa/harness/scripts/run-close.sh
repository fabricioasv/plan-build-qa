#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)"
cd "$ROOT"

run_cmd() {
  printf '[harness:close] %s\n' "$1"
  sh -c "$1"
}

run_cmd "npm run test"

printf '[harness:close] OK\n'
