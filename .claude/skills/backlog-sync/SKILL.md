---
name: backlog-sync
description: Archive stale planned specs and irrelevant bugs to an external tracker (Azure DevOps, Jira, or any tracker with an MCP server available). Does not create new work items and does not continuously mirror status of completed work.
---

# Backlog Sync

Use this skill when the user asks to archive old backlog to an external tracker, clean up specs that were never started, retire a bug that no longer matters, or run `/backlog-sync`. This is a one-way, outbound-only utility: local backlog leaves the repo and gets a corresponding record in an external tracker. It is optional harness hygiene, not a required stage of the 5-step package pipeline (`spec` -> `contract` -> `implement` -> `test` -> `roadmap`) nor of the developer-facing flow (`spec` -> `implement` -> `test` -> `retro`).

Canonical local sources: `.plan-build-qa/roadmap.md` (specs with `Status: planejado`) and `.plan-build-qa/bugs/` (bug records that no longer make sense to keep active).

> **Blocking rule**
> **NEVER** create a new work item, planned feature, or backlog entry in the external tracker from this skill — that is out of scope; this skill only archives what already exists locally and is being retired.
> **NEVER** delete a spec or bug folder from disk — mark it as archived/cancelled with an external reference instead, leaving the local investigation/decision history intact.
> **NEVER** write to the external tracker without the user's explicit, item-by-item confirmation of which candidates to archive, and never before a real MCP tracker tool has confirmed success.

## Not this skill

- Creating new planned work in a tracker (Feature/PBI/Task-style backlog creation) is a different, project-specific capability — not part of pbq.
- Continuously mirroring implementation status of completed work back to a tracker is a different, project-specific capability — not part of pbq. `backlog-sync` never touches specs that are `concluido`, `em andamento`, or `bloqueado`; it only ever moves a `planejado` spec (or an irrelevant bug) to `cancelado`.
- Unlike `/retro` (which recommends changes to the harness itself — constitution, sensors, templates), `/backlog-sync` acts on product/process backlog (specs and bugs), never on harness rules.

## Workflow

1. Read `.plan-build-qa/roadmap.md` and list every spec row with `Status: planejado` as a candidate — these were never started.
2. Read `.plan-build-qa/bugs/` and, based only on what the user points out (never decide unilaterally), list bug records the user considers no longer worth investigating or fixing.
3. Present the candidate list to the user and get **explicit, item-by-item confirmation** of which ones should actually be archived to the external tracker. Do not batch-assume "all of them."
4. Check whether any tracker MCP server (Azure DevOps, Jira, or any other) is available in the current session. **If none is configured, stop and explain what is missing** (e.g. point to `.mcp.json` or the project's MCP configuration) — never simulate or fabricate a "sent" result without a real MCP write tool actually succeeding.
5. For each confirmed item, use the available MCP write tool to create the corresponding external item: title derived from the spec/bug name, description summarized from `spec.md`/`bug.md` (objective, context, and why it is being archived).
6. **Only after the MCP tool confirms success** (an id/link is returned): update the local record —
   - Spec: in `.plan-build-qa/roadmap.md`, set `Status` to `cancelado` and record the tracker link/id plus the date in `Evidencia`.
   - Bug: update `bug.md`/`progress.md` with the same kind of reference, without erasing the existing `Investigacao` history.
7. Never delete the local spec/bug folder in this flow. Physical deletion, if ever wanted, is a separate, explicit action outside this skill.
8. Report back to the user what was archived (with the tracker ids/links) and what is still pending (unconfirmed items, or everything, if no tracker MCP was available).

`backlog-sync` never assumes which tracker product is in use and never hardcodes an organization, project, or epic — it only uses whatever MCP tracker tool is already available in the session, exactly as the user configured it for that project.
