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

Preferred deterministic command:

```sh
pbq sensor add . --name <name> --tier <fast|medium|slow> --command "<command>" --reason "<why this validates the project>"
```

If the `pbq` executable is not available in the target repository, update `.plan-build-qa/sensors.json` directly and regenerate the affected runner scripts consistently.

Rules:

- Do not add sensors that only print success without validating behavior.
- Put cheap lint/typecheck/unit checks in `fast`.
- Put build and full unit/integration checks in `medium`.
- Put E2E, browser, external-service, or long-running checks in `slow`.
- Every sensor must fail with a non-zero exit code when validation fails.
