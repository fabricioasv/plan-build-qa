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

- **Violations** — inconsistencies that must be fixed before continuing (exit code 1).
- **Warnings** — non-blocking issues worth reviewing (exit code 0).
- **Resumo** — last line summarizes total violations and warnings across all specs.

If `pbq analyze` exits with code 1, fix all violations before running sensors or closing a package.

## Matriz de packages (declarado ∪ contracts ∪ evaluations)

Para cada spec, `analyze` cruza a tabela `## Packages` da `spec.md`, os arquivos `contracts/package-N.md` e `evaluations/package-N.md`:

- **Numeração integer-only** — sub-packages decimais (`package-1.1.md` ou `1.1` na tabela) são violação. Use inteiros contíguos.
- **Buracos na sequência** — packages materializados (contracts ∪ evaluations) devem ser contíguos a partir de 1. Ex.: `{1,2,3,8,10}` → violação listando `4,5,6,7,9`.
- **Evaluation órfã** — evaluation sem contract correspondente é violação.
- **Materializado fora da tabela** — contract/eval de um package ausente da tabela é violação (o marcador `N+` na tabela declara cauda aberta legítima e cobre packages ≥ N).
- **Score 0 em fechado** — evaluation com `Score 0` num package listado em "Packages Concluidos" é violação; fora de fechado é warning.
- **Declarado-sem-contract** — package declarado na tabela sem contract é warning (tolera planejados e cauda `N+`).

## Enforcement de sensores

Quando um contract tem `## Sensores Obrigatorios` e existe a evaluation correspondente, `analyze` verifica que cada sensor obrigatório aparece na tabela de sensores da evaluation com status `passou`:

- sensor obrigatório ausente da evaluation → violação;
- sensor obrigatório presente com `falhou`/`pendente`/`nao-aplicavel` → violação.

(Se a evaluation não tem tabela de sensores, o enforcement é pulado e a matriz estrutural cuida do caso.)

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
