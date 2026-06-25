---
name: sensor
description: Add, list, or refine Plan Build QA computational sensors.
---

# Sensor

Use this skill when the user wants to add, list, or refine sensors.

Canonical sensor registry:

- `.plan-build-qa/sensors.json`

Generated sensor runners (by event):

- `.plan-build-qa/harness/scripts/run-commit.ps1` / `.sh` — sensors with `on:commit`
- `.plan-build-qa/harness/scripts/run-close.ps1` / `.sh` — sensors with `on:close`
- `.plan-build-qa/harness/hooks/pre-commit` / `.ps1` — calls `pbq guard --event commit`

## Fluxo recomendado

### 1. Ver candidatos detectados automaticamente

Run `pbq sensor suggest` to discover candidates not yet registered (scripts, Makefile targets, sonar files):

```sh
pbq sensor suggest .
```

### 2. Ver sensores prontos no catalogo

Run `pbq sensor catalog` to list curated ready-to-use sensors. Entries marked `[cadastrado]` are already in `sensors.json`:

```sh
pbq sensor catalog .
```

### 3. Adicionar a partir do catalogo

If a catalog entry fits the project, add it with `--from-catalog`:

```sh
pbq sensor add --from-catalog dotnet-build .
pbq sensor add --from-catalog eslint .
pbq sensor add --from-catalog sonar-dotnet .
```

### 4. Adicionar sensor manualmente

For sensors not in the catalog, use `--on` to specify when it runs:

```sh
# run on commit (fast check) and at package close gate
pbq sensor add . --name lint --on commit,close --command "npm run lint" --reason "Linting"

# run only at package close gate (slow or medium)
pbq sensor add . --name e2e --on close --command "npx playwright test" --reason "E2E smoke"

# run only on edit (advisory preflight)
pbq sensor add . --name sonar --on edit --command "sonar.bat" --reason "SonarQube preflight"
```

If the `pbq` executable is not available in the target repository, update `.plan-build-qa/sensors.json` directly and regenerate the affected runner scripts consistently.

## Campo `on` — gatilho-por-evento

The `on` field controls when a sensor runs:

- `"edit"` — fires via PostToolUse hook (early-warning, advisory); for read-only/fast checks.
- `"commit"` — fires via pre-commit hook (advisory by default); for lint/unit tests.
- `"close"` — fires at `pbq package close` acceptance gate (blocking gate).
- `"manual"` — only runs when explicitly invoked.

A sensor may belong to multiple events: `["commit","close"]`.

The `tier` field (fast/medium/slow) is cosmetic — a cost label for display. The `on` field is what controls execution.

Legacy `--tier` is still accepted and maps to `on` automatically:
- `--tier fast` → `on:["commit","close"]`
- `--tier medium` or `--tier slow` → `on:["close"]`

Legacy `--phase` is also accepted (deprecated, mapped to `on`):
- `--phase before` → `on:["edit"]`
- `--phase after` → `on:["close"]`
- `--phase before,after` → `on:["edit","close"]`

## `pbq guard` — early-warning hooks

Run sensors for a specific event without the full acceptance gate:

```sh
pbq guard --event commit .   # advisory pre-commit check
pbq guard --event edit . --path .plan-build-qa/roadmap.md  # advisory on edit
```

`pbq guard` is advisory by default (exit 0 even with failures). To make it blocking, set `Enforcement: blocking` in the active `spec.md`.

Activate the pre-commit git hook:

```sh
pbq hooks install .
pbq hooks status .
```

## Exemplos concretos

**sonar.bat** — static analysis tool at the project root:

```sh
pbq sensor add . --name sonar --on edit,close --command "sonar.bat" --reason "Executa analise estatica SonarQube"
```

**scripts/test.sh** — test script under scripts/:

```sh
pbq sensor add . --name sh-test --on commit,close --command "sh ./scripts/test.sh" --reason "Script de testes detectado em scripts/test.sh"
```

**Makefile** — build or lint target:

```sh
pbq sensor add . --name make-lint --on commit,close --command "make lint" --reason "Target lint do Makefile"
```

## Regras

- Do not add sensors that only print success without validating behavior.
- Prefer `on:["commit","close"]` for fast lint/typecheck/unit checks.
- Use `on:["close"]` for build and full unit/integration checks.
- Use `on:["close"]` for E2E, browser, external-service, or long-running checks.
- Every sensor must fail with a non-zero exit code when validation fails.
