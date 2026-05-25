# Evaluation: Package 1

Score: 1

## Resumo De Sensores

| Sensor | Tier | Obrigatorio | Status | Comando | Exit Code | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| npm-run-test | medium | sim | passou | `npm run test` | 0 | Executado em 2026-05-25T20:11:42.149Z |

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

- Executado em: 2026-05-25T20:11:57.007Z
- Tiers: medium

## Resultado

Todos os sensores executados passaram.

## Evidencias

Sensor obrigatorio: ver tabela de sensores (npm-run-test, exit 0).

`npm run test` inclui o novo caso `pbq-analyze-closed-prose`: progress com `Package 1` concluido + prosa `exit 0` e `AC 1-6`, com `evaluations/package-1.md` presente. Asserts: `pbq analyze` exit 0, sem `package concluido 0`, sem `package concluido 6`, sem `evaluation ausente`. Confirma AC1-3. `parseClosedPackages` agora usa `/package\s+(\d+)/gi` (so a forma explicita).

Nota de processo: etapa 4 (acceptance-check) executada inline, nao via subagente de contexto fresco (verificacao computacional + politica do ambiente).

## Violacoes Encontradas

Nenhuma violacao critica encontrada pelos sensores executados.

## Riscos Residuais

Registrar manualmente riscos que os sensores nao cobrem.

## Proxima Acao Recomendada

Atualizar progress.md e roadmap.md se a spec foi concluida.
