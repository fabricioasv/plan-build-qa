---
name: bug
description: Register and investigate observed bugs using Plan Build QA bug records.
---

# Bug

Use this skill when the user asks to investigate an error, create or update a bug record, or run `/bug`.

Canonical bug records live under `.plan-build-qa/bugs/`.

> **Blocking rule**
> **NEVER** implement a fix, apply patches, run final validation, offer to open a spec/package, or ask whether to continue into `/implement` or `/test` from `/bug`. Record investigation, note the recommended handoff, and stop.

Workflow:

1. Read `.plan-build-qa/harness/README.md`.
2. Read relevant constitution files in `.plan-build-qa/constitution/`.
3. Locate an existing bug in `.plan-build-qa/bugs/` or create `.plan-build-qa/bugs/bug-YYMMDD-hex-slug/`. Generate `YYMMDD` from the current local date and `hex` as four lowercase hexadecimal characters. Legacy `bug-NNN-slug` bugs remain compatible and may be migrated by `pbq update`.
4. Create or update `.plan-build-qa/bugs/bug-YYMMDD-hex-slug/bug.md` from `.plan-build-qa/harness/templates/bug.md`.
5. Create or update `.plan-build-qa/bugs/bug-YYMMDD-hex-slug/progress.md` from `.plan-build-qa/harness/templates/bug-progress.md`.
6. Fill `Investigacao` with reproduction steps, observed behavior, expected behavior, environment, evidence, and current hypotheses.
7. Stop direct execution after investigation. Do not edit product code, implement correction, apply patches, or execute final acceptance tests from `/bug`.
8. If code correction is likely needed, record the recommended handoff to `/implement` and `/test`, then stop. Do not end with a question offering to open a spec/package, forward to `/implement`, run `/test`, or continue the workflow unless the user explicitly requested that before running `/bug`.
9. Record later `Correcao` and `Teste` evidence only as references produced by `/implement` and `/test`, such as files changed, evaluation path, sensor results, and residual risk.

Bug records are for observed errors. Specs remain the place for planned product or harness evolution.
