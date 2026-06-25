# Contract: Package 2 — Docs e roadmap

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

2

## Objetivo

Documentar que o gate `pbq package close` é orientado ao contrato (sensores obrigatórios do contrato sempre executados e exigidos), na constitution e nas skills `test`/`sensor`, e marcar a spec-021 como concluída no roadmap.

## Arquivos Permitidos

- `.plan-build-qa/constitution/testing.md`
- `.claude/skills/test/SKILL.md`
- `templates/adapters/skills/test/SKILL.md`
- `.agents/skills/test/SKILL.md`
- `.claude/skills/sensor/SKILL.md`
- `templates/adapters/skills/sensor/SKILL.md`
- `.agents/skills/sensor/SKILL.md`
- `.plan-build-qa/roadmap.md`

## Arquivos Proibidos

- `bin/pbq.mjs` (lógica já entregue no Package 1)
- `tests/pbq-init-smoke.mjs`
- Qualquer arquivo fora da lista

## Mudancas Permitidas

1. **`constitution/testing.md`**: registrar que `pbq package close` executa e exige `passou` em todos os sensores obrigatórios do contrato (união com os selecionados por tier/evento), e que isso é a contraparte de geração do check de enforcement do `analyze`.
2. **Skill `test`**: documentar que o acceptance-check via `package close` agora cobre os sensores do contrato automaticamente.
3. **Skill `sensor`**: nota curta de que um sensor citado em `## Sensores Obrigatorios` do contrato será executado no gate mesmo fora do filtro tier/evento.
4. **Skills propagadas** (3 variantes) com diff vazio.
5. **`roadmap.md`**: marcar spec-021 `concluido` com evidências.

## Mudancas Proibidas

- Não alterar lógica de CLI (Package 1).
- Não tocar em analyze/matriz (spec-020).

## Criterios de Aceite

| # | Critério | Verificação |
| --- | --- | --- |
| AC1 | `constitution/testing.md` descreve o gate orientado ao contrato | conteúdo verificável |
| AC2 | Skill `test` (3 variantes) menciona sensores do contrato no acceptance-check; diff vazio entre variantes | conteúdo + diff |
| AC3 | Skill `sensor` (3 variantes) tem a nota sobre execução no gate; diff vazio | conteúdo + diff |
| AC4 | roadmap marca spec-021 `concluido` | conteúdo |
| AC5 | `npm run test` verde | exit 0 |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |

> `pbq-analyze` não é gate aqui (mesma justificativa do Package 1).

## Riscos

- Skills devem permanecer sincronizadas (diff vazio) entre `.claude`, `.agents` e `templates/adapters`.

## Rollback

`git revert` do commit do package. Mudanças puramente documentais.

## Observabilidade

- `npm run test` cobre a sincronização das skills (asserts de diff existentes).

## Duvidas Abertas

_(nenhuma)_
