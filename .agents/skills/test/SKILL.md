---
name: test
description: Run, add, or troubleshoot Plan Build QA sensors and test validation.
---

# Test

Use this skill when the user asks to test, validate, run sensors, diagnose failing sensors, or close a package. `test` is the **single verification gate** of the harness. It is the only place that runs sensors and decides pass/fail.

> **Blocking rule**
> **NEVER** treat missing, pending, or failed required sensor evidence as success.

Canonical files:

- `.plan-build-qa/sensors.json`
- `.plan-build-qa/harness/scripts/run-commit.ps1` / `.sh` — sensors with `on:commit` (early-warning)
- `.plan-build-qa/harness/scripts/run-close.ps1` / `.sh` — sensors with `on:close` (gate)
- `.plan-build-qa/harness/templates/evaluation.md`

> **Advisory hooks vs blocking gate**: `pbq guard --event commit` (pre-commit hook) and `pbq guard --event edit`
> (PostToolUse hook) are **early-warning only** — they never replace this skill as the verification gate.
> The authoritative blocking gate is `pbq package close` (`on:close` sensors). Do not confuse hook output
> with acceptance-check results.

## Pipeline position

The harness flow is a pipeline of 5 stages: `1. spec` -> `2. contract (validacao)` -> `3. implement` -> `4. test/qa` -> `5. roadmap`. `test` owns the verification stages, kept separate from `implement`:

- **Stage 2 (contract validation)** uses the `contract-check` mode, after `spec` writes/updates a contract.
- **Stage 4 (test/qa)** uses the `acceptance-check` mode, after `implement` writes code.

`implement` does NOT run sensors itself; it delegates to `test`. This separation only has value if the verifier is independent of the implementer, so when invoked automatically `test` runs as a **subagente de contexto fresco** (fresh-context subagent): a new agent that loads the spec, contract, and package number from disk and does not inherit the implementer's assumptions.

## Modes

### contract-check (stage 2)

Applies when a contract was just created or updated and there is no new code to verify yet. Validate that the contract is well-formed and verifiable:

1. Read `.plan-build-qa/constitution/testing.md`.
2. Prefer the lightweight mechanical gate:
   `pbq contract check . --spec <spec> --package <N>`.
3. If the contract path is known but the spec/package pair is not, use:
   `pbq contract check . --contract <path>`.
4. Treat any non-zero exit as blocking and report the command output directly.
5. Only after the command passes, do a short contextual review for ambiguity or scope risk that a mechanical checker cannot decide.
6. Do not read roadmap, progress, or evaluations for the mechanical checks. Do not run code sensors in this mode (there is nothing new to execute).

### acceptance-check (stage 4)

Applies after `implement` produces code against the contract. Verify the implementation satisfies the contract:

1. Read `.plan-build-qa/constitution/testing.md`.
2. Read the required sensors from `contracts/package-N.md`.
3. Prefer `pbq package close . --spec <spec> --package <N> --tiers <tiers>` for enforced execution and evaluation generation. The evaluation's Evidence column is auto-populated with real stdout/stderr output.
4. For exploratory validation, use `.plan-build-qa/harness/scripts/run-close.ps1` or `run-close.sh` (event-based runners).
5. **REQUIRED**: record every required sensor in the evaluation table with status, command, exit code, and evidence.
6. A required global sensor must exist in `.plan-build-qa/sensors.json`; `Scope: local` and `Scope: package` sensors are contract-local and do not require global registry entries.
7. Local required sensors must be enforced by name just like global sensors: if a local sensor is absent, `falhou`, or `pendente`, keep `Score: 0`.
8. If a required sensor cannot run, mark it `pendente` and keep `Score: 0`.

### Inferring the mode

When invoked manually without an explicit mode, infer it from the artifacts: if a contract exists but no new implementation code was produced for it, run `contract-check`; if code was changed against an existing contract, run `acceptance-check`.

## Manual bypass

Auto-invocation can be skipped only in rare, documented cases. The convention is the natural-language instruction `skip test` (equivalently `--skip-test`) passed when invoking `implement`/`spec`. When bypass is used, record the reason in `progress.md`; bypass never counts as a passing gate.

**NEVER** treat missing sensor evidence as success.
