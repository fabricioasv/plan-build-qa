# Progress

> **Regra de retomada**
> **OBRIGATORIO** manter este arquivo suficiente para outro agente continuar o trabalho sem depender de memoria da sessao anterior.

## Estado Atual

`em andamento`

## Packages Concluidos

Nenhum.

## Package Atual

Package 1 - catalogo de sensores (dado + `pbq sensor catalog` + `pbq sensor add --from-catalog`) + convite nao-interativo no fim de init/update.

## Decisoes Tecnicas

- Terminologia: "catalogo de sensores" / "sensores prontos". Nao usar "preset".
- Interatividade mora na skill `/sensor`; `pbq init`/`update`/`sensor` permanecem nao-interativos (smoke test roda via spawnSync e exige exit 0 sem prompt).
- Tiers continuam `fast|medium|slow`. Decisao B: nao criar tier `sonar`; sensores de sonar do catalogo entram como `slow` enabled:false. Usuario corrige os `"tier":"sonar"` no proprio repo alvo.
- Campo `phase` = fase no ciclo do package (preflight `before` vs gate `after`). Ausencia de `phase` == `["after"]` para retrocompatibilidade do `package close`.
- Catalogo vive em `templates/sensor-catalog.json` (dado versionado). Sensor adicionado via catalogo recebe `source:"catalog"`.

## Sensores Executados

Pendente: `npm run test` na implementacao de cada package.

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
