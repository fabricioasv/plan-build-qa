# Contract: Package 1

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

1

## Objetivo

Entregar o modelo minimo do comando/skill `/bug`, incluindo hierarquia `.plan-build-qa/bugs/`, templates de registro, instalacao da skill nos adapters e teste automatizado que prove que `pbq init` instala os novos artefatos.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.agents/skills/bug/SKILL.md`
- `.claude/skills/bug/SKILL.md`
- `templates/adapters/skills/bug/SKILL.md`
- `.plan-build-qa/bugs/README.md`
- `templates/bugs/README.md`
- `.plan-build-qa/harness/templates/bug.md`
- `.plan-build-qa/harness/templates/bug-progress.md`
- `templates/harness/templates/bug.md`
- `templates/harness/templates/bug-progress.md`
- `.plan-build-qa/specs/spec-023-bug-command/progress.md`
- `.plan-build-qa/specs/spec-023-bug-command/evaluations/package-1.md`
- `.plan-build-qa/roadmap.md`

## Arquivos Proibidos

- `package.json`, salvo se um sensor existente ficar impossivel de executar por motivo externo documentado.
- `.plan-build-qa/sensors.json`
- `.plan-build-qa/constitution/**`
- Specs, contratos ou evaluations de outras specs.
- Arquivos de dashboard gerados, salvo se um sensor existente exigir regeneracao documentada.

## Mudancas Permitidas

- Adicionar `bug` a `ADAPTER_SKILLS`.
- Adicionar `.plan-build-qa/bugs/README.md`, templates `bug.md` e `bug-progress.md` ao conjunto gerado por `pbq init`/`update`.
- Criar a skill `/bug` nas copias locais e no template de adapters.
- Atualizar o smoke test para validar a instalacao dos arquivos de bug e conteudo minimo da skill.
- Atualizar `progress.md`, `roadmap.md` e criar a evaluation do package apos validacao.

## Mudancas Proibidas

- Implementar subcomando `pbq bug`.
- Alterar comportamento de `/spec`, `/implement`, `/test`, `/sensor`, `/roadmap`, `/constitution` ou `/analyze`, exceto a lista comum de skills instaladas.
- Relaxar, remover ou pular asserts existentes no smoke test.
- Alterar sensores para fazer o package passar.
- Criar fluxo de dashboard para bugs.

## Criterios de Aceite

- AC1: `bin/pbq.mjs` inclui `bug` em `ADAPTER_SKILLS`, e `pbq init` instala `.agents/skills/bug/SKILL.md` e `.claude/skills/bug/SKILL.md` em fixture de teste.
- AC2: `pbq init` instala `.plan-build-qa/bugs/README.md`, `.plan-build-qa/harness/templates/bug.md` e `.plan-build-qa/harness/templates/bug-progress.md` em fixture de teste.
- AC3: `templates/adapters/skills/bug/SKILL.md`, `.agents/skills/bug/SKILL.md` e `.claude/skills/bug/SKILL.md` contem instrucoes para criar ou atualizar `.plan-build-qa/bugs/bug-XXX-slug/bug.md` e `progress.md`.
- AC4: O template `bug.md` contem secoes chamadas `Investigacao`, `Correcao` e `Teste`, cada uma com criterios objetivos de preenchimento.
- AC5: O teste `npm run test` falha se a skill `/bug` ou os templates obrigatorios nao forem instalados pelo `pbq init`.
- AC6: O fechamento do package gera `.plan-build-qa/specs/spec-023-bug-command/evaluations/package-1.md` com Score 1 somente se `pbq-analyze` e `npm-run-test` passarem.

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando esperado |
| --- | --- | --- | --- |
| pbq-analyze | fast | `pbq-analyze` | `node ./bin/pbq.mjs analyze .` |
| npm-run-test | medium | `npm-run-test` | `npm run test` |

## Riscos

- Se `bug` for adicionado apenas nas copias locais e nao nos templates, repositorios novos nao receberao o comando.
- Se a skill nao exigir evidencia de teste, bugs podem ser marcados como resolvidos sem validacao computacional.

## Rollback

Reverter as alteracoes listadas em Arquivos Permitidos. Como o package nao altera dados externos nem formato de specs existentes, o rollback e um revert de commit/patch dos arquivos do package.

## Observabilidade

Nao ha observabilidade de runtime aplicavel. A evidencia operacional sera o conteudo dos artefatos de bug e os sensores `pbq-analyze` e `npm-run-test`.

## Duvidas Abertas

Nenhuma duvida bloqueante. Automacao CLI `pbq bug` fica explicitamente fora deste package.
