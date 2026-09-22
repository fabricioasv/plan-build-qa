---
name: retro
description: Review Plan Build QA harness history and recommend whether to revise, extend, or drop parts of the harness.
---

# Retro

Use this skill when the user asks to run a retrospective on the harness itself, review whether the pipeline/constitution/sensors still fit, or run `/retro`. This is stage 4 of the developer-facing flow (`spec` -> `implement` -> `test` -> `retro`), separate from the harness's own 5-stage package pipeline.

Canonical evidence lives under `.plan-build-qa/roadmap.md`, `.plan-build-qa/specs/*/evaluations/*.md`, and `pbq analyze --strict` output.

> **Blocking rule**
> **NEVER** edit `.plan-build-qa/constitution/`, `.plan-build-qa/sensors.json`, or harness templates directly from `/retro`. Produce a recommendation only; applying it goes through the `constitution` or `sensor` skill, as a separate, explicit step.

Workflow:

1. Read `.plan-build-qa/harness/README.md`.
2. Read all files in `.plan-build-qa/constitution/`.
3. Read `.plan-build-qa/roadmap.md`, focusing on the "Decisoes De Roadmap" log and recurring patterns (specs opened to fix a gap the harness itself created, specs that stalled, specs marked `em andamento` for a long time without progress).
4. Read recent `evaluations/*.md` across specs (prioritize the last few closed specs) looking for repeated non-blocking risks, repeated bypasses (`skip test`), or sensors that are frequently `pendente`/`falhou` without being promoted to a real fix.
5. Run `node ./bin/pbq.mjs analyze . --strict` and read the violations/warnings, treating recurring warnings as candidate signal, not noise.
6. For each candidate finding, classify it as one of: **revisar** (a rule or template is ambiguous or has drifted from practice), **incrementar** (a gap exists — missing sensor, missing rule, missing skill), or **excluir** (a rule, template, or artifact is ceremony that produces no verifiable evidence and is not being used).
7. Prefer findings backed by objective evidence (repeated evaluation risk entries, repeated `pbq analyze` warnings, roadmap decisions that reference the same recurring problem) over subjective impressions.
8. **REQUIRED**: present findings as a list, each with: the artifact affected, the classification (revisar/incrementar/excluir), the evidence that supports it, and the recommended next step (e.g. "abrir `/constitution` para ajustar `testing.md`", "abrir `/sensor add` para cadastrar X", "abrir `/spec` para remover Y").
9. Do not apply any of the recommendations yourself. Stop after presenting the list, the same way `/bug` stops after investigation.

`/retro` is a review of the harness's own effectiveness, not of the product code being built with it. If the user wants to change constitution rules, sensors, or templates based on a `/retro` finding, hand off explicitly to `/constitution`, `/sensor`, or `/spec`.
