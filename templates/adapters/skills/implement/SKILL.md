---
name: implement
description: Implement a Plan Build QA package against an approved contract and required sensors.
---

# Implement

Use this skill when the user asks to implement a package, continue implementation, or make code changes under an existing spec/contract.

> **Blocking rule**
> **NEVER** implement outside the approved contract. **STOP** if the contract is ambiguous, too broad, or missing required sensors.

`implement` is stage 3 of the pipeline (`1. spec` -> `2. contract (validacao)` -> `3. implement` -> `4. test/qa` -> `5. roadmap`). It produces code only; it does NOT run sensors. Verification is delegated to the `test` skill (stage 4), which runs as a fresh-context subagent so the verifier stays independent of the implementer.

Workflow:

1. Read `.plan-build-qa/harness/prompts/implement-package.md`.
2. Read relevant constitution files in `.plan-build-qa/constitution/`.
3. Read `.plan-build-qa/roadmap.md`.
4. Read the active spec, `progress.md`, and `contracts/package-N.md`.
5. Confirm the roadmap marks the spec as `em andamento`.
6. **REQUIRED**: implement only the approved scope.
7. Add or update tests required by the contract.
8. **REQUIRED**: do NOT run sensors yourself. Delegate verification to the `test` skill in `acceptance-check` mode, invoked as a fresh-context subagent (subagente de contexto fresco). Pass it the exact spec name, package number, and contract path so it can load them from disk. `test` is what executes the sensors and generates the evaluation.
9. Only if delegation to `test` is unavailable (e.g. `skip test` was explicitly requested and documented), run the required sensors manually and fill the evaluation sensor table with status, command, exit code, and evidence; record the bypass reason in `progress.md`.
10. Update `progress.md` (including the stage board in `Estado Atual`); update `roadmap.md` only when the spec state changes.

**NEVER** broaden scope, relax tests, run the verification yourself instead of delegating, or mark work complete without sensor evidence from `test`.
