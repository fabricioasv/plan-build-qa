# Evaluation: Package 2

Score: 1

## Resumo De Sensores

| Sensor | Tier | Obrigatorio | Status | Comando | Exit Code | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| npm-run-test | medium | sim | passou | `npm run test` | 0 | Executado em 2026-05-25T12:46:03.137Z |

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

- Executado em: 2026-05-25T12:46:09.805Z
- Tiers: medium

## Resultado

Todos os sensores executados passaram.

## Evidencias

Sensor obrigatorio: ver tabela de sensores (npm-run-test, exit 0). O smoke test alinhado (sem exigir `pbq package close` na skill `implement`, exigindo delegacao a `test` e os modos `contract-check`/`acceptance-check`) passou.

Validacao textual ad-hoc (grep, 2026-05-25):

- AC1 - `templates/adapters/skills/test/SKILL.md`: 6 ocorrencias de `contract-check`/`acceptance-check`/`subagente de contexto fresco`. Exit 0.
- AC2 - `templates/adapters/skills/implement/SKILL.md`: `grep -c "pbq package close"` = 0 e 1 ocorrencia de delegacao a `test`. Exit 0.
- AC3 - `templates/adapters/skills/spec/SKILL.md`: contem passo `contract-check`. Exit 0.
- AC4 - `diff` entre cada `templates/adapters/skills/<skill>/SKILL.md` e `.claude/skills/<skill>/SKILL.md`: saida vazia (identicos) para test, implement e spec.
- AC5 - `tests/pbq-init-smoke.mjs`: assercao de `pbq package close` na skill `implement` substituida por delegacao + modos; coberto pelo proprio `npm run test` (exit 0).

Nota de processo: a etapa 4 (acceptance-check) foi executada inline, nao via subagente de contexto fresco, por ser verificacao puramente computacional (`npm run test` + grep) e pela politica do ambiente de nao abrir subagentes sem pedido explicito.

## Violacoes Encontradas

Nenhuma violacao critica encontrada pelos sensores executados.

## Riscos Residuais

Registrar manualmente riscos que os sensores nao cobrem.

## Proxima Acao Recomendada

Atualizar progress.md e roadmap.md se a spec foi concluida.
