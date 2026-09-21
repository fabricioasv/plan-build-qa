# Progress

> **Regra de retomada**
> **OBRIGATORIO** manter este arquivo suficiente para outro agente continuar o trabalho sem depender de memoria da sessao anterior.

## Estado Atual

concluido

Quadro de etapas do package 2 (propagacao das skills aos templates do instalador):

| Etapa | Status |
| --- | --- |
| 1. spec | ok |
| 2. contract (validacao) | ok |
| 3. implement | ok |
| 4. test/qa | ok |
| 5. roadmap | ok |

Status de etapa: `pendente`, `em andamento`, `ok`, `falhou`, `nao-aplicavel`.

## Packages Concluidos

Package 1 - fechado com Score 1; ver `evaluations/package-1.md` (sensor `npm-run-test` e validacao textual por grep).
Package 2 - fechado com Score 1; ver `evaluations/package-2.md` (skills propagadas aos templates, diff vazio vs `.claude/skills`, e smoke test alinhado).

## Package Atual

Nenhum. Spec concluida (packages 1 e 2 fechados com Score 1).

## Decisoes Tecnicas

- 2026-05-23: Descartar abordagem baseada em hash/cache do estado do codigo. Independencia sera garantida por contexto fresco do subagente, nao por deteccao de staleness.
- 2026-05-23: Manter as tres skills (`spec`, `implement`, `test`). Nao fundir `test` em `implement`.
- 2026-05-23: `test` deve inferir o modo pelo estado dos artefatos quando invocada manualmente sem flag.
- 2026-05-23: Manter `pbq package close` na CLI; muda apenas quem o invoca (skill `test` em vez de `implement`).
- 2026-05-25: Formalizar o trabalho como pipeline de 5 etapas (spec / contract (validacao) / implement / test-qa / roadmap), deixando `implement` (etapa 3, so codigo) e `test/qa` (etapa 4, valida o contrato) explicitamente separados. `test` segue auto-invocado como subagente, mas como etapa distinta.
- 2026-05-25: O quadro das 5 etapas entra na secao `Estado Atual` do template de `progress.md` do harness (duas copias: `templates/harness/templates/progress.md` e `.plan-build-qa/harness/templates/progress.md`), para toda spec futura herdar. Decisao do usuario.
- 2026-05-25: Trocar o sensor obrigatorio do package 1 de `check-harness-structure` (nao cadastrado em sensors.json) para `npm-run-test` (registrado), que cobre regressao do instalador apos editar o template de progress.

## Sensores Executados

- `npm run test` (medium, `npm-run-test`) | 2026-05-25 | passou (exit 0) | evidencia: `evaluations/package-1.md` (Score 1), via `pbq package close`.
- Validacao textual ad-hoc (grep) dos criterios de aceite 1-6 | 2026-05-25 | passou | evidencia registrada em `evaluations/package-1.md`.

## Falhas Anteriores

Nenhuma.

## Riscos Acumulados

- Custo adicional de tokens/latencia por subagente fresco a cada `implement` e `spec`.
- Briefing insuficiente do subagente pode causar falhas em achar artefatos.

## Pendencias

- Resolvida (2026-05-25): convencao de bypass manual definida como `skip test` (equivalente `--skip-test`) em linguagem natural no prompt, documentada na SKILL.md de `test` e `implement`/`spec`.
- Resolvida (2026-05-25, package 2): skills `test`/`implement`/`spec` propagadas para `templates/adapters/skills/**`; projetos alvo passam a receber o novo comportamento via `pbq init`/`update`.

## Contexto Para Retomada

A spec foi criada apos discussao de design entre usuario e agente sobre redundancia entre `implement` e `test`. A decisao final foi tratar `test` como gate independente invocado automaticamente via subagente. Implementacao deve comecar pela skill `test` (definir os dois modos), depois ajustar `implement` e `spec` para delegar, e por fim atualizar a constituicao. O contrato package-1 lista arquivos permitidos e criterios objetivos.
