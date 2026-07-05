---
name: spec
description: Create, update, inspect, or continue a Plan Build QA spec and package contract.
---

# Spec

Use this skill when the user asks to create, update, inspect, continue, split, or finalize a Plan Build QA spec.

Canonical harness files live under `.plan-build-qa/`.

> **Blocking rule**
> **STOP** before implementation if the spec has no objective acceptance criteria, package boundary, rollback note, or required sensors.

Workflow:

1. Read `.plan-build-qa/harness/README.md`.
2. Read relevant constitution files in `.plan-build-qa/constitution/`.
3. Read `.plan-build-qa/roadmap.md`.
4. If a spec already exists, read `.plan-build-qa/specs/<spec>/spec.md` and `progress.md`.
5. For a new spec, create `.plan-build-qa/specs/spec-YYMMDD-hex-name/` using templates from `.plan-build-qa/harness/templates/`. Generate `YYMMDD` from the current local date and `hex` as four lowercase hexadecimal characters. Legacy `spec-NNN-name` specs remain compatible and may be migrated by `pbq update`.
6. **REQUIRED**: when creating a spec, update `.plan-build-qa/roadmap.md` with status `em andamento`.
7. **REQUIRED**: when finalizing a spec, update `.plan-build-qa/roadmap.md` with status `concluido`, date, and evidence.
8. Create or update `contracts/package-N.md` for the next small, reversible, verifiable package.
9. **REQUIRED**: after creating or updating a contract, invoke the `test` skill in `contract-check` mode (stage 2 of the pipeline) to validate that the contract is well-formed, has objective acceptance criteria, and names sensors registered in `sensors.json`. When invoked automatically, `test` runs as a fresh-context subagent. This can be skipped only with an explicit, documented `skip test`.
10. Keep implementation out of this command unless the user explicitly asks to implement.
11. **REQUIRED**: make acceptance criteria and required sensors objective.
12. For specs where hooks should block (not just warn), add `Enforcement: blocking` to `spec.md`. Default is `advisory` (hooks are early-warning only, never block).

## Sensor scope in contracts

When writing `## Sensores Obrigatorios`, choose scope explicitly:

- `Scope: global` for reusable project invariants already registered in `.plan-build-qa/sensors.json`.
- `Scope: local` or `Scope: package` for checks specific to this package. Local sensors must include `Comando` and `Motivo`; they are executed/evidenced through the package evaluation and are not added to `sensors.json`.

Use a table with `Sensor`, `Scope`, `Tier`, `Comando`, and `Motivo`. Promotion local -> global requires an explicit later decision with `pbq sensor add --scope global` or equivalent registry edit.

Prefer a short contract for small changes. Require a formal spec and contract for medium or large changes.

This skill owns stages 1 (`spec`) and 2 (`contract (validacao)`) of the harness pipeline `1. spec` -> `2. contract (validacao)` -> `3. implement` -> `4. test/qa` -> `5. roadmap`. Verification stays in `test`, kept separate from `implement`.
