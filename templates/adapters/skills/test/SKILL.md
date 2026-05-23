---
name: test
description: Run, add, or troubleshoot Plan Build QA sensors and test validation.
---

# Test

Use this skill when the user asks to test, validate, run sensors, diagnose failing sensors, or close a package.

Canonical files:

- `.plan-build-qa/sensors.json`
- `.plan-build-qa/harness/scripts/run-fast.ps1`
- `.plan-build-qa/harness/scripts/run-medium.ps1`
- `.plan-build-qa/harness/scripts/run-slow.ps1`
- `.plan-build-qa/harness/templates/evaluation.md`

Workflow:

1. Read `.plan-build-qa/constitution/testing.md`.
2. Read required sensors from the package contract when a package is active.
3. Prefer `pbq package close . --spec <spec> --package <N> --tiers <tiers>` for enforced execution and evaluation generation.
4. For exploratory validation, use `.plan-build-qa/harness/scripts/run-fast.ps1`, `run-medium.ps1`, or `run-slow.ps1`.
5. Record every required sensor in the evaluation table with status, command, exit code, and evidence.
6. If a required sensor cannot run, mark it `pendente` and keep `Score: 0`.

Never treat missing sensor evidence as success.
