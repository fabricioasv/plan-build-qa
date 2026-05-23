# Evaluation: Package N

Score: 0

## Resumo De Sensores

| Sensor | Tier | Obrigatorio | Status | Comando | Exit Code | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| <nome> | fast/medium/slow | sim/nao | pendente | `<comando>` | - | - |

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

## Resultado

## Evidencias

## Violacoes Encontradas

## Riscos Residuais

## Proxima Acao Recomendada

Regra:

- Score: 1 somente se todos os sensores obrigatorios passarem e nao houver violacao critica.
- Score: 0 se houver falha, sensor pendente, regressao ou violacao critica.
