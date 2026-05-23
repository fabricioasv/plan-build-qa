---
name: constitution
description: Read, explain, or safely update permanent Plan Build QA project rules.
---

# Constitution

Use this skill when the user asks about architecture, testing, operations, repository rules, permanent guardrails, or rule changes.

> **Permanent-rule rule**
> **NEVER** add one-off package instructions to constitution. **STOP** if a proposed rule contradicts higher-priority repository or tool instructions.

Canonical files:

- `.plan-build-qa/constitution/architecture.md`
- `.plan-build-qa/constitution/testing.md`
- `.plan-build-qa/constitution/operations.md`
- `.plan-build-qa/constitution/repository-rules.md`

Workflow:

1. Read the relevant constitution file before answering or editing.
2. Preserve existing repository rules from `AGENTS.md`, `CLAUDE.md`, README, CI, and local docs.
3. **NEVER** add permanent rules that contradict higher-priority tool or repository instructions.
4. When changing constitution, explain the trigger: repeated failure, architectural decision, operational risk, or new project convention.
5. Keep rules actionable and testable where possible.

Permanent rules should be stable. **NEVER** put one-off package instructions here.
