# Contract: Package 1

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

1

## Objetivo

Remover o conceito de `tier` (fast/medium/slow) de templates, skills, `sensors.json`, `sensor-catalog.json` e da geracao/leitura em `bin/pbq.mjs`, mantendo `--tiers` de `pbq package close` como alias sem efeito para compatibilidade.

## Arquivos Permitidos

- `templates/harness/templates/contract.md`
- `templates/harness/templates/evaluation.md`
- `.plan-build-qa/harness/templates/contract.md`
- `.plan-build-qa/harness/templates/evaluation.md`
- `.claude/skills/sensor/SKILL.md`, `.agents/skills/sensor/SKILL.md`, `templates/adapters/skills/sensor/SKILL.md`
- `.claude/skills/test/SKILL.md`, `.agents/skills/test/SKILL.md`, `templates/adapters/skills/test/SKILL.md`
- `templates/sensor-catalog.json`
- `.plan-build-qa/sensors.json`
- `bin/pbq.mjs` (funcoes de `sensor add`, `contract check`, `package close`, `buildSensors`, blocos `helpByTopic.sensor` e `helpByTopic.package`)
- `README.md`, `.plan-build-qa/harness/README.md`, `templates/harness/OVERVIEW.md`, `.plan-build-qa/OVERVIEW.md`
- `.plan-build-qa/constitution/testing.md` (linha que descreve `tier` como campo cosmetico)
- `tests/pbq-init-smoke.mjs`

## Arquivos Proibidos

- Qualquer `spec.md`/`contracts/*.md`/`evaluations/*.md` de specs ja fechadas (historico).
- `.plan-build-qa/roadmap.md` (fora deste package).

## Mudancas Permitidas

- Remover o campo/coluna `Tier` de templates novos.
- Remover a flag `--tier` de `pbq sensor add` e a explicacao de mapeamento tier->on no help e nas skills.
- Remover geracao/leitura do campo `tier` em sensores novos criados por `bin/pbq.mjs`.
- Manter `--tiers` em `pbq package close` funcionando como hoje (selecao por evento), documentando-a explicitamente como alias sem novo conceito de tier por tras, se o codigo atual ja resolve `--tiers` para `on` internamente.

## Mudancas Proibidas

- Remover `tier` de specs/contracts/evaluations historicas.
- Remover a flag `--tiers` do `pbq package close` (mantida por compatibilidade).
- Qualquer mudanca em `run-fast/medium/slow`, dashboard, `--agents` ou `retro` (packages separados).

## Criterios de Aceite

- `grep -ri tier templates/harness/templates/*.md templates/sensor-catalog.json .plan-build-qa/sensors.json` nao retorna ocorrencia (exceto notas de compatibilidade explicitas, se necessario).
- `pbq sensor add --help`/`pbq help sensor` nao menciona mais `--tier` como forma de uso.
- `pbq help package` nao menciona mais `fast,medium,slow` como exemplo de `--tiers`.
- `node ./bin/pbq.mjs init <dir-teste>` gera sensores sem campo `tier`.
- `npm run test` passa com `tests/pbq-init-smoke.mjs` ajustado.

## Sensores Obrigatorios

| Sensor | Scope | Tier | Comando | Motivo |
| --- | --- | --- | --- | --- |
| pbq-analyze | global | - | `node ./bin/pbq.mjs analyze .` | Coerencia estrutural do harness apos remover `tier` |
| npm-run-test | global | - | `npm run test` | Regressao do CLI e smoke tests |

## Riscos

- Instalacoes existentes (netview/max) com sensores que ainda tem campo `tier` continuam funcionando (campo extra ignorado), mas `pbq sensor add --tier` deixa de funcionar para quem ainda usa esse fluxo manual — documentar no README como mudanca de breaking change de CLI.

## Rollback

Reverter o commit deste package restaura os arquivos de template/skill/CLI ao estado anterior; nenhuma migracao de dados é necessária porque `tier` continua sendo apenas um campo textual ignorado em specs antigas.

## Observabilidade

Nao aplicavel (mudanca de template/CLI, sem runtime persistente).

## Duvidas Abertas

Nenhuma.
