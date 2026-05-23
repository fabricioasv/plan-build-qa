---
name: roadmap
description: Inspect or update the Plan Build QA roadmap and keep spec status synchronized.
---

# Roadmap

Use this skill when the user asks about priorities, current work, completed specs, blocked specs, or what should happen next.

Canonical roadmap:

- `.plan-build-qa/roadmap.md`

Workflow:

1. Read `.plan-build-qa/roadmap.md`.
2. Cross-check active specs under `.plan-build-qa/specs/`.
3. A newly created spec must be listed as `em andamento`.
4. A finalized spec must be listed as `concluido` only when required package evaluations have `Score: 1`, unless an exception is documented.
5. If roadmap and spec/progress/evaluation disagree, report the mismatch and update the roadmap only after preserving evidence.

Do not use the roadmap as a replacement for `progress.md`; it is a cross-spec index.
