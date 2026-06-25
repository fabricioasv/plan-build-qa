# Contract: Package 3 — Constitution, skills, templates e OVERVIEW

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

3

## Objetivo

Atualizar toda a camada de documentação e templates do harness para refletir o modelo de gatilho-por-evento: constitution/testing.md, OVERVIEW.md, skills (sensor, test, spec, implement, analyze), templates (sensor-catalog.json, spec.md, contract.md, evaluation.md) e roadmap.

## Arquivos Permitidos

- `.plan-build-qa/constitution/testing.md`
- `.plan-build-qa/OVERVIEW.md` (e geração em `bin/pbq.mjs` função `constitutionTesting`/`harnessReadme`)
- `.claude/skills/sensor/SKILL.md`
- `.claude/skills/test/SKILL.md`
- `.claude/skills/spec/SKILL.md`
- `.claude/skills/implement/SKILL.md`
- `.claude/skills/analyze/SKILL.md`
- `templates/sensor-catalog.json`
- `.plan-build-qa/harness/templates/spec.md` (adicionar linha `Enforcement:`)
- `.plan-build-qa/harness/templates/contract.md`
- `.plan-build-qa/harness/templates/evaluation.md`
- `templates/adapters/skills/**` (propagação das skills)
- `.agents/skills/**` (propagação das skills)
- `.plan-build-qa/roadmap.md`
- `bin/pbq.mjs` (somente funções de geração: `constitutionTesting`, `harnessReadme`, `psRunScript`, `shRunScript`, `regenerateSensorScripts`)

## Arquivos Proibidos

- Qualquer arquivo fora da lista acima
- `tests/pbq-init-smoke.mjs` (sem mudanças de teste neste package)
- Evaluations e contratos existentes em `netview/max`

## Mudancas Permitidas

1. **`constitution/testing.md`**: documentar modelo de eventos (`on`), hooks advisory por default, flag `Enforcement` por-spec, e que `pbq package close` (`on:close`) é o gate bloqueante autoritativo — hooks são early-warning, não substituem o gate.
2. **`OVERVIEW.md` + geração em `constitutionTesting`**: atualizar mermaid "Ecossistema de Sensores" (campo `on`, remover `phase`) e mermaid "Pipeline" (adicionar faixa de hooks advisory → early-warning).
3. **Skills**: refletir `--on`, `pbq guard`, `pbq hooks`, flag `Enforcement`. Exemplos concretos nos SKILLs de sensor e test.
4. **`templates/sensor-catalog.json`**: substituir `phase` por `on` em todos os entries do catálogo.
5. **`harness/templates/spec.md`**: adicionar linha `Enforcement: advisory` na seção de metadados.
6. **`harness/templates/contract.md`**: nenhuma mudança estrutural, apenas atualizar exemplos de sensores se necessário.
7. **`harness/templates/evaluation.md`**: documentar que coluna Evidência é preenchida automaticamente pelo `pbq package close`.
8. **`psRunScript`/`shRunScript` + `regenerateSensorScripts`**: gerar runners por evento (`run-commit.ps1`/`run-commit.sh`, `run-close.ps1`/`run-close.sh`), mantendo `run-fast.ps1` etc. como aliases deprecated (apenas chamam o novo runner).
9. **`roadmap.md`**: marcar spec-019 como `concluido` com evidências.

## Mudancas Proibidas

- Não alterar lógica funcional do CLI (Package 1 e 2 já fizeram isso).
- Não remover aliases `run-fast.ps1`/`run-medium.ps1`/`run-slow.ps1` (ficam deprecated, não removidos).
- Não reescrever evaluations existentes em outros projetos.

## Criterios de Aceite

| # | Critério | Verificação |
| --- | --- | --- |
| AC1 | `constitution/testing.md` menciona campo `on`, hooks advisory, flag `Enforcement` e gate `pbq package close` | conteúdo verificável |
| AC2 | `OVERVIEW.md` mermaid "Ecossistema de Sensores" contém `on` e não contém `phase` como campo ativo | conteúdo verificável |
| AC3 | `templates/sensor-catalog.json` não tem `phase` nos entries; tem `on` | `cat` do arquivo |
| AC4 | `harness/templates/spec.md` contém linha `Enforcement:` | `grep Enforcement` |
| AC5 | Skill `sensor/SKILL.md` documenta `--on` e `pbq guard` | conteúdo verificável |
| AC6 | `pbq update` no próprio repo gera `run-commit.ps1` e mantém `run-fast.ps1` deprecated | arquivos presentes |
| AC7 | `npm run test` verde | exit 0 |
| AC8 | `node ./bin/pbq.mjs analyze .` sem violations | `[pbq] Resultado: OK` |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |

> `pbq-analyze` não é gate obrigatório neste package pelos mesmos motivos dos Packages 1 e 2:
> violações pré-existentes de spec-013. Verificação manual confirma que nenhuma violação nova
> foi introduzida por Package 3.

## Riscos

- Skills em `.claude/skills/` e em `templates/adapters/skills/` devem ser sincronizadas — verificar diff vazio (padrão da spec-011).

## Rollback

`git revert` dos commits do package. Mudanças são puramente documentais e em templates; sem impacto em dados persistentes.

## Observabilidade

- `pbq update` no próprio repo deve completar sem erros e gerar os novos runners.
- `pbq analyze .` sem violations confirma coerência do harness após as mudanças.

## Duvidas Abertas

_(nenhuma)_
