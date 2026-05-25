# Contract: Package 3

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

3 - Skill `/sensor` interativa com catalogo e fase.

## Objetivo

Atualizar a skill `/sensor` (3 variantes) para apresentar o catalogo de sensores, orientar o usuario a escolher quais adicionar (via `pbq sensor add --from-catalog`), manter o `add` livre, e documentar o campo `phase`.

## Arquivos Permitidos

- `templates/adapters/skills/sensor/SKILL.md`
- `tests/pbq-init-smoke.mjs` (assercoes de conteudo nas skills instaladas)
- `.plan-build-qa/specs/spec-017-catalogo-de-sensores/progress.md`
- `.plan-build-qa/specs/spec-017-catalogo-de-sensores/evaluations/package-3.md`
- `.plan-build-qa/roadmap.md`

## Arquivos Proibidos

- `bin/pbq.mjs` (logica ja feita nos packages 1 e 2)
- `templates/sensor-catalog.json`

## Mudancas Permitidas

- Reescrever a secao de fluxo da skill `/sensor` para: (1) rodar `pbq sensor catalog` e apresentar as opcoes ao usuario; (2) o usuario escolhe quais adicionar; (3) adicionar via `pbq sensor add --from-catalog <id>`; (4) `add` livre continua documentado; (5) explicar `phase` (before/after) e quando usar.
- A skill e instalada em `.claude/skills/sensor/SKILL.md` e `.agents/skills/sensor/SKILL.md` por `init`/`update` (via `adapterSkillEntries`), entao editar o template ja propaga para as duas variantes.
- Preservar as regras existentes da skill (lint=fast, build=medium, e2e=slow, exit code != 0 em falha, `pbq sensor suggest`).

## Mudancas Proibidas

**NUNCA** remover as regras de qualidade atuais da skill nem o exemplo de `pbq sensor suggest`. Nao alterar a logica do binario neste package.

## Criterios de Aceite

1. `templates/adapters/skills/sensor/SKILL.md` cita `pbq sensor catalog`, `--from-catalog` e explica `phase` (before/after).
2. Apos `pbq init`, `.claude/skills/sensor/SKILL.md` e `.agents/skills/sensor/SKILL.md` contem `pbq sensor catalog` e `--from-catalog`.
3. Regras preservadas: a skill ainda cita `pbq sensor suggest` e `non-zero exit code`.
4. `npm run test` sai com status 0 (incluindo as assercoes existentes da skill `/sensor`).

## Sensores Obrigatorios

- medium | `npm-run-test` | `npm run test`

## Riscos

- Quebrar assercoes existentes da skill em `tests/pbq-init-smoke.mjs`: mitigado preservando os termos ja asseridos (`pbq sensor suggest`, `non-zero exit code`, exemplos concretos).

## Rollback

`git checkout -- templates/adapters/skills/sensor/SKILL.md tests/pbq-init-smoke.mjs`. Mudanca so de conteudo de skill; reverter o template restaura a versao anterior no proximo init/update.

## Observabilidade

Conteudo das skills instaladas apos init; `npm run test`.

## Duvidas Abertas

Nenhuma.
