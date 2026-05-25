# Progress

> **Regra de retomada**
> **OBRIGATORIO** manter este arquivo suficiente para outro agente continuar o trabalho sem depender de memoria da sessao anterior.

## Estado Atual

`em andamento`

Quadro de etapas (atualize a cada avanco):

| Etapa | Status |
| --- | --- |
| 1. spec | ok |
| 2. contract (validacao) | ok |
| 3. implement | ok |
| 4. test/qa | ok |
| 5. roadmap | em andamento |

Status de etapa: `pendente`, `em andamento`, `ok`, `falhou`, `nao-aplicavel`.

## Packages Concluidos

Package 1 - fechado com Score 1; ver `evaluations/package-1.md`.
Package 2 - fechado com Score 1; ver `evaluations/package-2.md`.

## Package Atual

Package 3 - skill `/sensor` (Claude, Codex, template) atualizada com catalogo, selecao guiada e explicacao de phase.

## Decisoes Tecnicas

- Terminologia: "catalogo de sensores" / "sensores prontos". Nao usar "preset".
- Interatividade mora na skill `/sensor`; `pbq init`/`update`/`sensor` permanecem nao-interativos (smoke test roda via spawnSync e exige exit 0 sem prompt).
- Tiers continuam `fast|medium|slow`. Decisao B: nao criar tier `sonar`; sensores de sonar do catalogo entram como `slow` enabled:false. Usuario corrige os `"tier":"sonar"` no proprio repo alvo.
- Campo `phase` = fase no ciclo do package (preflight `before` vs gate `after`). Ausencia de `phase` == `["after"]` para retrocompatibilidade do `package close`.
- Catalogo vive em `templates/sensor-catalog.json` (dado versionado). Sensor adicionado via catalogo recebe `source:"catalog"`.

## Sensores Executados

- `npm run test` (medium, `npm-run-test`) | 2026-05-25 | passou (exit 0) | evidencia: `evaluations/package-1.md` (Score 1).
- `npm run test` (medium, `npm-run-test`) | 2026-05-25 | passou (exit 0) | evidencia: `evaluations/package-2.md` (Score 1).

## Falhas Anteriores

Nenhuma.

## Riscos Acumulados

- Determinismo de init/update (mitigado: convite e texto puro, sem prompt).
- Regressao em `package close` ao introduzir `phase` (mitigado: ausencia == after).

## Pendencias

- Implementar packages 1, 2, 3 via `/implement` contra os contratos.
- Apos esta spec: ajustar a `spec-009-sensor-preflight-evidence` para consumir o campo `phase` e executa-la.

## Contexto Para Retomada

Discussao com usuario (2026-05-24): adicionar catalogo de sensores prontos selecionaveis na skill `/sensor`, com `add` livre preservado, convite nao-interativo no init/update, e campo de fase before/after. Decisoes fechadas: terminologia "catalogo", interatividade na skill, tier `sonar` NAO criado (decisao B), fase = preflight/gate. spec-009 ajustada e executada depois. Spec e 3 contratos criados; implementacao ainda nao iniciada.
