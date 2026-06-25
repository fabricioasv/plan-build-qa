---
name: bug
description: Investigate, fix, and test observed bugs using Plan Build QA bug records.
---

# Bug

Use this skill when the user asks to investigate an error, create or update a bug record, or run `/bug`.

Canonical bug records live under `.plan-build-qa/bugs/`.

> **Blocking rule**
> **NEVER** mark a bug as resolved without objective test evidence or an explicit residual-risk note.

Workflow:

1. Read `.plan-build-qa/harness/README.md`.
2. Read relevant constitution files in `.plan-build-qa/constitution/`.
3. Locate an existing bug in `.plan-build-qa/bugs/` or create the next `.plan-build-qa/bugs/bug-XXX-slug/`.
4. Create or update `.plan-build-qa/bugs/bug-XXX-slug/bug.md` from `.plan-build-qa/harness/templates/bug.md`.
5. Create or update `.plan-build-qa/bugs/bug-XXX-slug/progress.md` from `.plan-build-qa/harness/templates/bug-progress.md`.
6. Fill the three required sections in order: `Investigacao`, `Correcao`, `Teste`.
7. During `Investigacao`, preserve reproduction steps, observed behavior, expected behavior, environment, evidence, and current hypotheses.
8. During `Correcao`, record confirmed cause, files changed, limits, and rollback.
9. During `Teste`, record sensors or commands, result, exit code when available, evidence, and residual risk.
10. If the fix requires a medium or large planned change, create or link a spec and package instead of expanding the bug record into unbounded implementation.

Bug records are for observed errors. Specs remain the place for planned product or harness evolution.
