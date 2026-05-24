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

Run `pbq sensor suggest` first to discover candidates not yet registered. Review the output, then run the printed `pbq sensor add` commands for each candidate you want to add.

```sh
# 1. Discover candidates
pbq sensor suggest .

# 2. Register the ones you want (copy-paste from suggest output)
pbq sensor add . --name <name> --tier <fast|medium|slow> --command "<command>" --reason "<why>"
```

If the `pbq` executable is not available in the target repository, update `.plan-build-qa/sensors.json` directly and regenerate the affected runner scripts consistently.

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
