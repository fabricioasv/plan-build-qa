---
name: implement
description: Implement a Plan Build QA package against an approved contract and required sensors.
---

# Implement

Use this skill when the user asks to implement a package, continue implementation, or make code changes under an existing spec/contract.

> **Blocking rule**
> **NEVER** implement outside the approved contract. **STOP** if the contract is ambiguous, too broad, or missing required sensors.

Workflow:

1. Read `.plan-build-qa/harness/prompts/implement-package.md`.
2. Read relevant constitution files in `.plan-build-qa/constitution/`.
3. Read `.plan-build-qa/roadmap.md`.
4. Read the active spec, `progress.md`, and `contracts/package-N.md`.
5. Confirm the roadmap marks the spec as `em andamento`.
6. **REQUIRED**: implement only the approved scope.
7. Add or update tests required by the contract.
8. **REQUIRED**: close the package with `pbq package close` when possible so sensors execute and evaluation is generated.
9. If `pbq package close` cannot be used, run required sensors manually and fill the evaluation sensor table with status, command, exit code, and evidence.
10. Update `progress.md`; update `roadmap.md` only when the spec state changes.

**NEVER** broaden scope, relax tests, or mark work complete without sensor evidence.
