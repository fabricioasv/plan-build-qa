# Contract: Package 2 — Enforcement de sensores na evaluation

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

2

## Objetivo

Fazer o `analyze` verificar que os sensores obrigatórios declarados no contract aparecem na tabela de sensores da evaluation correspondente com status `passou`. Atualizar a skill `analyze` e o roadmap.

## Arquivos Permitidos

- `bin/pbq.mjs` (apenas `analyzeHarness` e novo parser)
- `tests/pbq-init-smoke.mjs`
- `.claude/skills/analyze/SKILL.md`
- `templates/adapters/skills/analyze/SKILL.md`
- `.agents/skills/analyze/SKILL.md`
- `.plan-build-qa/roadmap.md`

## Arquivos Proibidos

- Qualquer arquivo fora da lista

## Mudancas Permitidas

1. **`parseEvaluationSensorRows(evalMd)`** (novo): le a tabela de sensores da evaluation e retorna `[{ name, status }]`. Tolera os dois formatos em uso (gerado por `pbq package close` e tabelas manuais), casando por coluna de nome e coluna de status (`passou|falhou|pendente|nao-aplicavel` ou `PASS|FAIL`).
2. **`analyzeHarness`**: para cada contract com sensores obrigatórios (`parseContractRequiredSensors`) que tenha evaluation correspondente:
   - Para cada sensor obrigatório nomeado: se não aparece na tabela da evaluation → violação `package <N>: sensor obrigatório "<nome>" do contract ausente na evaluation`.
   - Se aparece com status diferente de `passou`/`PASS` → violação `package <N>: sensor obrigatório "<nome>" não passou na evaluation (status: <status>)`.
   - Só aplica quando existe evaluation (não força evaluation a existir — isso é Package 1).
3. **Skill `analyze`**: documentar os novos checks (matriz de packages + enforcement de sensores) nas três variantes, mantendo diff vazio entre elas.
4. **`roadmap.md`**: marcar spec-020 como `concluido` com evidências.
5. **Testes**: fixture com contract exigindo sensor X e evaluation sem X → violação; evaluation com X `falhou` → violação; evaluation com X `passou` → ok.

## Mudancas Proibidas

- Não alterar a geração de evaluation (`package close`).
- Não tornar obrigatória a existência de evaluation (Package 1 cuida da matriz estrutural).

## Criterios de Aceite

| # | Critério | Verificação |
| --- | --- | --- |
| AC1 | Contract exige `sensor-x`, evaluation não o lista → violação de sensor ausente | match `ausente na evaluation` |
| AC2 | Evaluation lista `sensor-x` com `falhou` → violação de não-passou | match `não passou` |
| AC3 | Evaluation lista `sensor-x` com `passou` → sem violação para esse sensor | sem match |
| AC4 | Skill `analyze` (3 variantes) documenta matriz de packages + enforcement de sensores; diff vazio entre elas | conteúdo + diff |
| AC5 | `npm run test` verde | exit 0 |
| AC6 | roadmap marca spec-020 `concluido` | conteúdo |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |

> `pbq-analyze` não é gate aqui (mesma justificativa do Package 1).

## Riscos

- Tabela de sensores em evaluations manuais tem ordem de colunas variável (`| Sensor | Tier | Comando | Exit | Evidência |` vs `| Sensor | Tier | Obrigatorio | Status | ...`). O parser deve localizar a coluna de status por heurística de conteúdo, não por índice fixo.

## Rollback

`git revert` do commit do package.

## Observabilidade

- `node ./bin/pbq.mjs analyze .` continua OK no próprio repo (specs do framework usam `npm-run-test`/`pbq-analyze`, presentes nas evaluations).

## Duvidas Abertas

_(nenhuma)_
