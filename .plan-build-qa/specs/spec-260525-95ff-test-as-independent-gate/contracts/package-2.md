# Contract: Package 2

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

2 - Propagar as skills alteradas para os templates-fonte do instalador.

## Objetivo

Levar o novo comportamento das skills `test`, `implement` e `spec` (entregue no package 1 apenas nas copias `.claude/skills/*` deste repo) para os templates-fonte do instalador em `templates/adapters/skills/**`, para que `pbq init`/`update` passem a instalar o pipeline de 5 etapas e a verificacao independente em projetos alvo. Alinhar o smoke test ao novo comportamento.

## Arquivos Permitidos

- `templates/adapters/skills/test/SKILL.md`
- `templates/adapters/skills/implement/SKILL.md`
- `templates/adapters/skills/spec/SKILL.md`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-011-test-as-independent-gate/progress.md`
- `.plan-build-qa/specs/spec-011-test-as-independent-gate/evaluations/package-2.md`
- `.plan-build-qa/roadmap.md` (apenas para marcar `concluido` ao final)

## Arquivos Proibidos

- `bin/pbq.mjs` e qualquer codigo da CLI.
- `.plan-build-qa/sensors.json`.
- `.claude/skills/**` e `.agents/skills/**` (ja entregues / gerados; nao editar a mao aqui).
- `templates/harness/templates/progress.md` (ja entregue no package 1).
- Qualquer outro arquivo em `templates/` alem dos tres SKILL.md listados.

## Mudancas Permitidas

- Copiar o conteudo de `.claude/skills/test/SKILL.md`, `.claude/skills/implement/SKILL.md` e `.claude/skills/spec/SKILL.md` (estado pos-package-1) para os arquivos correspondentes em `templates/adapters/skills/**`, deixando-os identicos.
- Atualizar `tests/pbq-init-smoke.mjs`: substituir a assercao que exige `pbq package close` na skill `implement` instalada por assercoes que reflitam o novo comportamento (skill `implement` NAO contem `pbq package close` e contem delegacao a `test`); opcionalmente adicionar assercoes para `contract-check`/`acceptance-check` na skill `test` instalada. Manter as demais assercoes existentes.

## Mudancas Proibidas

**NUNCA** inclua refactor amplo, mudanca funcional extra ou ajuste de teste fora do objetivo deste package. Nao alterar a CLI, sensores, nem reescrever o conteudo das skills (apenas copiar o que ja foi aprovado no package 1). Nao relaxar assercoes existentes do smoke test alem da troca exigida pelo novo comportamento.

## Criterios de Aceite

1. `templates/adapters/skills/test/SKILL.md` contem `contract-check`, `acceptance-check` e `subagente de contexto fresco`. Verificavel por grep.
2. `templates/adapters/skills/implement/SKILL.md` NAO contem `pbq package close` e contem delegacao a `test`. Verificavel por grep negativo + positivo.
3. `templates/adapters/skills/spec/SKILL.md` contem passo de invocar `test` em `contract-check`. Verificavel por grep.
4. Cada um dos tres `templates/adapters/skills/<skill>/SKILL.md` e identico a `.claude/skills/<skill>/SKILL.md` correspondente. Verificavel por `diff` (saida vazia).
5. `tests/pbq-init-smoke.mjs` nao exige mais `pbq package close` na skill `implement` instalada e passa a verificar a delegacao a `test`.
6. `npm run test` sai com exit code 0.

## Sensores Obrigatorios

- medium | `npm-run-test` | `npm run test` - sensor registrado em `.plan-build-qa/sensors.json`. Esperado: exit 0. Cobre que o instalador instala as skills propagadas e que o smoke test alinhado passa.

## Riscos

- Esquecer de alinhar uma assercao do smoke test e quebrar `npm run test`: mitigado rodando o sensor antes de fechar e tratando exit != 0 como Score 0.
- Divergencia residual entre template e copia `.claude/skills/*`: mitigado pelo criterio 4 (diff vazio).

## Rollback

`git checkout -- templates/adapters/skills/test/SKILL.md templates/adapters/skills/implement/SKILL.md templates/adapters/skills/spec/SKILL.md tests/pbq-init-smoke.mjs`. Mudanca so de conteudo de template e teste; reverter restaura o estado anterior.

## Observabilidade

`diff` entre templates e copias `.claude/skills/*`; saida de `npm run test`.

## Duvidas Abertas

Nenhuma.
