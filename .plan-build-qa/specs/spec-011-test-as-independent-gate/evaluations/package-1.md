# Evaluation: Package 1

Score: 1

## Resumo De Sensores

| Sensor | Tier | Obrigatorio | Status | Comando | Exit Code | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| npm-run-test | medium | sim | passou | `npm run test` | 0 | Executado em 2026-05-25T11:40:09.238Z |

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

- Executado em: 2026-05-25T11:40:19.695Z
- Tiers: medium

## Resultado

Todos os sensores executados passaram.

## Evidencias

Sensor obrigatorio: ver tabela de sensores (npm-run-test, exit 0).

Validacao textual ad-hoc (grep, 2026-05-25), criterios de aceite 1-6:

- AC1/AC2 - `.claude/skills/test/SKILL.md`: contem `contract-check`, `acceptance-check`, `subagente de contexto fresco`. Exit 0.
- AC3 - `.claude/skills/implement/SKILL.md`: `grep -c "pbq package close"` = 0 (nao instrui rodar sensores direto) e contem delegacao a `test`. Exit 0.
- AC4 - `.claude/skills/spec/SKILL.md`: contem passo de invocar `test` em `contract-check`. Exit 0.
- AC5 - `.plan-build-qa/constitution/testing.md`: contem secao `Verificacao Independente` e o pipeline de 5 etapas. Exit 0.
- AC6 - `templates/harness/templates/progress.md` e `.plan-build-qa/harness/templates/progress.md`: contem o quadro das 5 etapas em `Estado Atual`; `diff` entre as duas copias = identico. Exit 0.

## Violacoes Encontradas

Nenhuma violacao critica encontrada pelos sensores executados.

## Riscos Residuais

Registrar manualmente riscos que os sensores nao cobrem.

## Proxima Acao Recomendada

Atualizar progress.md e roadmap.md se a spec foi concluida.
