# Evaluation: Package 1

Score: 1

## Resumo De Sensores

| Sensor | Tier | Obrigatorio | Status | Comando | Exit Code | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| npm-run-test | medium | sim | passou | `npm run test` | 0 | Executado em 2026-05-25T22:36:10.577Z |

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

- Executado em: 2026-05-25T22:36:25.559Z
- Tiers: medium

## Resultado

Todos os sensores executados passaram.

## Evidencias

Sensor obrigatorio: ver tabela de sensores (npm-run-test, exit 0).

`npm run test` cobre: `pbq sensor catalog` (AC1), `pbq sensor add --from-catalog sonar-dotnet` com tier:slow/enabled:false/source:catalog (AC2), convite no fim de init e update (AC3), e regressoes existentes (AC4).

## Violacoes Encontradas

Nenhuma violacao critica encontrada pelos sensores executados.

## Riscos Residuais

Registrar manualmente riscos que os sensores nao cobrem.

## Proxima Acao Recomendada

Atualizar progress.md e roadmap.md se a spec foi concluida.
