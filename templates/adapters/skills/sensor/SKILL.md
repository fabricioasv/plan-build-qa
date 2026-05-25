---
name: sensor
description: Add, list, or refine Plan Build QA computational sensors.
---

# Sensor

Use this skill when the user wants to add, list, or refine sensors.

Canonical sensor registry:

- `.plan-build-qa/sensors.json`

Generated sensor runners:

- `.plan-build-qa/harness/scripts/run-fast.ps1`
- `.plan-build-qa/harness/scripts/run-medium.ps1`
- `.plan-build-qa/harness/scripts/run-slow.ps1`
- `.plan-build-qa/harness/scripts/run-fast.sh`
- `.plan-build-qa/harness/scripts/run-medium.sh`
- `.plan-build-qa/harness/scripts/run-slow.sh`

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

Catalog entries carry preset `tier`, `enabled`, `requiresEnv`, and `phase` values. Disabled entries (e.g. `sonar-dotnet`) require environment variables (`SONAR_TOKEN`, `SONAR_HOST_URL`) to run.

### 4. Adicionar sensor manualmente

For sensors not in the catalog, use free-form `add`:

```sh
pbq sensor add . --name <name> --tier <fast|medium|slow> --command "<command>" --reason "<why>"
```

If the `pbq` executable is not available in the target repository, update `.plan-build-qa/sensors.json` directly and regenerate the affected runner scripts consistently.

## Campo phase (before / after)

The optional `phase` field on a sensor controls when it runs in the package cycle:

- `"before"` — preflight check, runs before the main implementation changes (e.g. SonarQube analysis baseline).
- `"after"` — acceptance gate, runs after implementation to validate the result. **Default** when `phase` is absent.

A sensor may belong to both phases: `["before","after"]`.

Pass `--phase` when adding a sensor manually:

```sh
pbq sensor add . --name preflight-scan --tier slow --command "sonar.bat" --phase before
pbq sensor add . --name acceptance-test --tier medium --command "npm test" --phase after
```

Run `pbq package close --phase before` for preflight checks, and `pbq package close` (default `after`) for acceptance gates.

## Exemplos concretos

**sonar.bat** — static analysis tool at the project root:

```sh
pbq sensor add . --name sonar --tier fast --command "sonar.bat" --reason "Executa analise estatica SonarQube"
```

**scripts/test.sh** — test script under scripts/:

```sh
pbq sensor add . --name sh-test --tier medium --command "sh ./scripts/test.sh" --reason "Script de testes detectado em scripts/test.sh"
```

**Makefile** — build or lint target:

```sh
pbq sensor add . --name make-lint --tier fast --command "make lint" --reason "Target lint do Makefile"
```

## Regras

- Do not add sensors that only print success without validating behavior.
- Put cheap lint/typecheck/unit checks in `fast`.
- Put build and full unit/integration checks in `medium`.
- Put E2E, browser, external-service, or long-running checks in `slow`.
- Every sensor must fail with a non-zero exit code when validation fails.
