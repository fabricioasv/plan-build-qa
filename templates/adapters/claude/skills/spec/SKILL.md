---
name: spec
description: Create or update a Plan Build QA spec, package contract, progress file, and evaluation scaffold.
---

# /spec

Use this skill when the user asks to create, update, inspect, or continue a Plan Build QA spec.

Canonical harness files live under `.plan-build-qa/`.

Workflow:

1. Read `.plan-build-qa/harness/README.md`.
2. Read relevant constitution files in `.plan-build-qa/constitution/`.
3. If a spec already exists, read `.plan-build-qa/specs/<spec>/spec.md` and `progress.md`.
4. For a new spec, create `.plan-build-qa/specs/spec-XXX-name/` using templates from `.plan-build-qa/harness/templates/`.
5. Create or update `contracts/package-N.md` for the next small, reversible, verifiable package.
6. Keep implementation out of this command unless the user explicitly asks to implement.
7. Make acceptance criteria and required sensors objective.

Prefer a short contract for small changes. Require a formal spec and contract for medium or large changes.
