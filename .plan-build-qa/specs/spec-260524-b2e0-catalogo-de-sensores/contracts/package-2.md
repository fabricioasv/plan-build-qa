# Contract: Package 2

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

2 - Campo `phase` (before/after) no schema de sensores e suporte em close.

## Objetivo

Adicionar um campo opcional `phase` ao sensor, indicando se ele roda como preflight (`before`) e/ou gate de aceite (`after`) no ciclo do package, de forma retrocompativel.

## Arquivos Permitidos

- `bin/pbq.mjs` (flag `--phase` em `sensor add`; propagacao de `phase` no objeto sensor; filtro por fase em `package close`; help)
- `templates/sensor-catalog.json` (preencher `phase` sugerido nas entradas do catalogo)
- `tests/pbq-init-smoke.mjs` (novos casos)
- `.plan-build-qa/specs/spec-017-catalogo-de-sensores/progress.md`
- `.plan-build-qa/specs/spec-017-catalogo-de-sensores/evaluations/package-2.md`
- `.plan-build-qa/roadmap.md`

## Arquivos Proibidos

- `templates/adapters/skills/**`
- Lista de tiers (continua `fast|medium|slow`)

## Mudancas Permitidas

- Aceitar `--phase before`, `--phase after` ou `--phase before,after` em `pbq sensor add`; gravar `phase` como array no sensor. Ausencia de `--phase` => nao grava o campo (compat).
- `pbq package close` ganha `--phase <before|after>` (default `after`). Um sensor e elegivel para a fase X se: `phase` ausente e X === `after`, OU `phase` inclui X. Manter o filtro de tier atual combinado com o de fase.
- Preencher `phase` sugerido nas entradas do catalogo (ex: `sonar-dotnet` => `["before","after"]`).
- Atualizar help de `sensor` e `package close`.

## Mudancas Proibidas

**NUNCA** mudar o comportamento padrao de `pbq package close` sem `--phase` (deve permanecer identico a hoje para sensores sem `phase`). Nao criar runners novos por fase. Nao tocar a skill.

## Criterios de Aceite

1. `pbq sensor add --from-catalog sonar-dotnet .` grava `phase:["before","after"]` (ou o valor do catalogo) no sensor.
2. `pbq sensor add . --name x --tier fast --command "echo x" --phase before` grava `phase:["before"]`.
3. `pbq package close` sem `--phase`: sensor com `phase:["before"]` **nao** roda; sensor com `phase` ausente roda (igual a hoje).
4. `pbq package close --phase before`: roda so sensores cuja `phase` inclui `before`.
5. Regressao: casos atuais de close/analyze continuam verdes; sensores sem `phase` se comportam como antes.
6. `npm run test` sai com status 0.

## Sensores Obrigatorios

- medium | `npm-run-test` | `npm run test`

## Riscos

- Regressao silenciosa em close: mitigado por caso de teste explicito de "phase ausente == after".

## Rollback

`git checkout -- bin/pbq.mjs templates/sensor-catalog.json tests/pbq-init-smoke.mjs`. Campo opcional e aditivo; remover o suporte volta ao comportamento atual.

## Observabilidade

`sensors.json` apos add com `--phase`; saida de `pbq package close --phase`; `npm run test`.

## Duvidas Abertas

Nenhuma.
