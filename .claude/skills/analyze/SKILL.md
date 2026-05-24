---
name: analyze
description: Run pbq analyze to check Plan Build QA harness coherence.
---

# Analyze

Use this skill when the user asks to analyze the harness, check coherence, find violations, or run `/analyze`.

## Fluxo recomendado

```sh
pbq analyze [path]
```

Use `--strict` to treat warnings as failures:

```sh
pbq analyze [path] --strict
```

## Interpretando o output

- **Violations** — inconsistencies that must be fixed before continuing (exit code 1). Examples: required sensor not registered in `sensors.json`, missing spec folder for a roadmap entry.
- **Warnings** — non-blocking issues worth reviewing (exit code 0). Examples: required sensor referenced by name only (no registered command).
- **Resumo** — last line summarizes total violations and warnings across all specs.

If `pbq analyze` exits with code 1, fix all violations before running sensors or closing a package.

## Acao esperada do agente

1. Run `pbq analyze [path]` (use `.` for the current directory).
2. Read the output and list all violations.
3. For each violation, propose or apply a fix within the approved contract scope.
4. Re-run `pbq analyze [path]` until exit code is 0.
5. Optionally run with `--strict` to surface warnings as well.

## Regras

- Do not mark a package as complete if `pbq analyze` exits with code 1.
- Do not suppress or ignore violations — fix them.
- Warnings may be deferred if documented in `progress.md`.
