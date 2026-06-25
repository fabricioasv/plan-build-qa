# Spec: spec-013-saneamento-harness-pbq

## Objetivo

Sanear inconsistencias historicas que fazem `pbq analyze .` falhar no proprio repositorio mesmo quando a mudanca atual nao introduziu essas falhas.

## Contexto

O fechamento da `spec-023-bug-command` ficou bloqueado porque `pbq-analyze` falha por dividas globais antigas: specs planejadas sem pasta materializada, referencias legadas a `check-harness-structure` como se fosse sensor cadastrado, uma evaluation sem contract correspondente na spec-022, e evaluations Score 0 abertas bloqueando a propria reexecucao do gate.

## Escopo

- Transformar ausencia de pasta para specs com status `planejado` em warning, nao violation.
- Ajustar contratos historicos que citavam `check-harness-structure` como sensor cadastrado quando ele era apenas script/runner legado.
- Adicionar o contract ausente do package 6 da spec-022, derivado da spec/progress/evaluation existentes.
- Evitar que evaluation Score 0 de package nao fechado gere violacao de sensor obrigatorio em reexecucoes de `pbq-analyze`.
- Cobrir as regras novas em `tests/pbq-init-smoke.mjs`.

## Fora de Escopo

- Reabrir packages historicos ou alterar Score de evaluations antigas.
- Adicionar novo subcomando.
- Corrigir warnings nao bloqueantes que nao impedem `pbq analyze .`.
- Alterar o contrato do Package 1 da spec-023.

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Sanear as causas globais que bloqueiam `pbq-analyze` no repositorio atual | planejado | npm-run-test, pbq-analyze |

## Riscos

- Relaxar demais o analyzer pode esconder erro real; por isso apenas specs `planejado` sem pasta viram warning.
- Ajustar contratos historicos deve preservar o registro de que o runner foi usado, sem inventar cadastro retroativo em `sensors.json`.
- Evaluation Score 0 deve continuar bloqueando quando o package estiver listado como concluido.

## Sensores Esperados

- `npm-run-test`: `npm run test`
- `pbq-analyze`: `node ./bin/pbq.mjs analyze .`

## Criterios de Conclusao

- `pbq analyze .` nao falha por specs `planejado` sem pasta materializada.
- Contratos historicos nao geram violation por `check-harness-structure` ausente em `sensors.json`.
- `spec-022-dashboard-visual-status` possui `contracts/package-6.md`.
- Evaluation Score 0 de package nao fechado nao gera violation de sensor obrigatorio; package fechado com Score 0 continua violation.
- `npm-run-test` passa.
- `pbq-analyze` passa antes de retentar o fechamento da spec-023.

## Enforcement

Enforcement: advisory
