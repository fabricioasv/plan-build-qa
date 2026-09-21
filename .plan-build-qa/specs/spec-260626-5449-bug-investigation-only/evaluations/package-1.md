# Evaluation: Package 1

Score: 1

## Resumo De Sensores

| Sensor | Tier | Obrigatorio | Status | Comando | Exit Code | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| npm-run-test | medium | sim | passou | `npm run test` | 0 | > pbq-harness@0.8.0 test > node ./tests/pbq-init-smoke.mjs |
| pbq-analyze | fast | sim | passou | `node ./bin/pbq.mjs analyze .` | 0 | ...melhora-deteccao-sensores/package-3.md: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-015-skill-analyze/package-1.md: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-022-dashboard-visual-status/package-13.md: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-022-dashboard-visual-status/package-14.md: sensor obrigatorio citado sem nome cadastrado em sensors.json [pbq] Resumo: 0 violacoes, 20 warnings em 24 specs [pbq] Resultado: OK |

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

- Executado em: 2026-06-27T00:39:08.472Z
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
