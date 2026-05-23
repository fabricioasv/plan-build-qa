# Evaluation: Package N

Score: 0

> **Regra de bloqueio**
> **NUNCA** marque `Score: 1` se algum sensor obrigatorio estiver `falhou`, `pendente` ou ausente desta evaluation.

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

- **OBRIGATORIO**: todo sensor obrigatorio do contrato deve aparecer nesta tabela.
- **OBRIGATORIO**: `Score: 1` exige todos os sensores obrigatorios com status `passou`.
- **NUNCA** use `Score: 1` se algum sensor obrigatorio estiver `falhou`, `pendente` ou ausente.

## Log De Execucao Dos Sensores

## Resultado

## Evidencias

## Violacoes Encontradas

## Riscos Residuais

## Proxima Acao Recomendada

Regra:

- **Score: 1** somente se todos os sensores obrigatorios passarem e nao houver violacao critica.
- **Score: 0** se houver falha, sensor pendente, regressao ou violacao critica.
