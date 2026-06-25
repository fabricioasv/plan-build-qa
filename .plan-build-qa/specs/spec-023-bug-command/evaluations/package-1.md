# Evaluation: Package 1

Score: 1

## Resumo De Sensores

| Sensor | Tier | Obrigatorio | Status | Comando | Exit Code | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| npm-run-test | medium | sim | passou | `npm run test` | 0 | > pbq-harness@0.8.0 test > node ./tests/pbq-init-smoke.mjs |
| pbq-analyze | fast | sim | passou | `node ./bin/pbq.mjs analyze .` | 0 | ...- spec-022-dashboard-visual-status/package-13.md: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-022-dashboard-visual-status/package-14.md: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-023-bug-command: evaluation package-1 tem Score 0 (package não fechado)  - spec-023-bug-command/package-1: enforcement de sensores ignorado porque evaluation tem Score 0 e package nao esta fechado [pbq] Resumo: 0 violacoes, 22 warnings em 23 specs [pbq] Resultado: OK |

Status permitidos:

- `passou`
- `falhou`
- `pendente`
- `nao-aplicavel`

Regra:

- Todo sensor obrigatorio do contrato deve aparecer nesta tabela.
- `Score: 1` exige todos os sensores obrigatorios com status `passou`.
- Se algum sensor obrigatorio estiver `falhou`, `pendente` ou ausente, o Score deve ser `0`.

## Log De Execucao Dos Sensores

- Executado em: 2026-06-25T22:51:33.421Z
- Tiers: fast, medium

## Resultado

Todos os sensores executados passaram.

## Evidencias

Ver tabela de sensores.

## Violacoes Encontradas

Nenhuma violacao critica encontrada pelos sensores executados.

## Riscos Residuais

Registrar manualmente riscos que os sensores nao cobrem.

## Proxima Acao Recomendada

Atualizar progress.md e roadmap.md se a spec foi concluida.
