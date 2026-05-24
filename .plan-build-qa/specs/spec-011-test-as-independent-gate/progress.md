# Progress

> **Regra de retomada**
> **OBRIGATORIO** manter este arquivo suficiente para outro agente continuar o trabalho sem depender de memoria da sessao anterior.

## Estado Atual

em andamento

## Packages Concluidos

Nenhum.

## Package Atual

Package 1 - Reescrever skill `test` em dois modos, atualizar `implement` e `spec` para delegar verificacao, e atualizar `constitution/testing.md`.

Arquivos previstos para edicao:

- `.claude/skills/test/SKILL.md`
- `.claude/skills/implement/SKILL.md`
- `.claude/skills/spec/SKILL.md`
- `.plan-build-qa/constitution/testing.md`

## Decisoes Tecnicas

- 2026-05-23: Descartar abordagem baseada em hash/cache do estado do codigo. Independencia sera garantida por contexto fresco do subagente, nao por deteccao de staleness.
- 2026-05-23: Manter as tres skills (`spec`, `implement`, `test`). Nao fundir `test` em `implement`.
- 2026-05-23: `test` deve inferir o modo pelo estado dos artefatos quando invocada manualmente sem flag.
- 2026-05-23: Manter `pbq package close` na CLI; muda apenas quem o invoca (skill `test` em vez de `implement`).

## Sensores Executados

Nenhum ate o momento. Sensores previstos para o package 1:

- `check-harness-structure` (fast)
- Validacao textual ad-hoc nas SKILL.md alteradas (registrada na evaluation)

## Falhas Anteriores

Nenhuma.

## Riscos Acumulados

- Custo adicional de tokens/latencia por subagente fresco a cada `implement` e `spec`.
- Briefing insuficiente do subagente pode causar falhas em achar artefatos.

## Pendencias

- Definir nome exato da flag de bypass manual (`--skip-test`, `--no-verify`, ou via prompt) durante o package 1.

## Contexto Para Retomada

A spec foi criada apos discussao de design entre usuario e agente sobre redundancia entre `implement` e `test`. A decisao final foi tratar `test` como gate independente invocado automaticamente via subagente. Implementacao deve comecar pela skill `test` (definir os dois modos), depois ajustar `implement` e `spec` para delegar, e por fim atualizar a constituicao. O contrato package-1 lista arquivos permitidos e criterios objetivos.
