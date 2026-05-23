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
5. For a new spec, create `.plan-build-qa/specs/spec-XXX-name/` using templates from `.plan-build-qa/harness/templates/`.
6. **REQUIRED**: when creating a spec, update `.plan-build-qa/roadmap.md` with status `em andamento`.
7. **REQUIRED**: when finalizing a spec, update `.plan-build-qa/roadmap.md` with status `concluido`, date, and evidence.
8. Create or update `contracts/package-N.md` for the next small, reversible, verifiable package.
9. Keep implementation out of this command unless the user explicitly asks to implement.
10. **REQUIRED**: make acceptance criteria and required sensors objective.

Prefer a short contract for small changes. Require a formal spec and contract for medium or large changes.
