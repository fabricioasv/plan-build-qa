# Spec: spec-023-bug-command

## Objetivo

Criar o comando/skill `/bug` para investigar, registrar e acompanhar erros em uma hierarquia propria `.plan-build-qa/bugs/`, com fluxo semelhante ao de specs, mas orientado a:

1. Investigacao
2. Correcao
3. Teste

## Contexto

O harness atual organiza evolucao planejada em `.plan-build-qa/specs/`. Erros reais precisam de um caminho mais direto para preservar evidencia de investigacao, causa provavel, correcao aplicada e validacao, sem transformar todo bug em uma spec completa desde o inicio.

O novo comando deve operar como skill instalada nos adapters (`.agents`, `.claude` e templates), de forma similar a `/spec`, `/implement`, `/test` e `/analyze`.

## Escopo

- Definir a hierarquia `.plan-build-qa/bugs/bug-XXX-slug/`.
- Definir templates para registro de bug e progresso do bug.
- Criar skill `/bug` nos adapters instalados e no template de distribuicao.
- Fazer `pbq init`/`pbq update` instalarem a skill `/bug` e os artefatos-base da hierarquia.
- Cobrir o novo comportamento em teste automatizado de smoke.

## Fora de Escopo

- Criar automacao CLI `pbq bug`.
- Corrigir um bug real do produto dentro desta spec.
- Alterar o fluxo de specs, packages ou evaluations ja existente.
- Criar dashboard especifico para bugs.

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Entregar o modelo minimo de `/bug`: hierarquia, templates, skill instalada e smoke test | planejado | pbq-analyze, npm-run-test |

## Riscos

- A skill `/bug` pode duplicar responsabilidades de `/spec` se nao deixar claro que bugs registram erros reais e evidencias antes da correcao.
- A hierarquia `.plan-build-qa/bugs/` pode virar deposito informal se os criterios minimos de investigacao, correcao e teste nao forem objetivos.
- `pbq init`/`update` podem deixar de instalar a nova skill se `ADAPTER_SKILLS`, templates e manifest nao forem atualizados em conjunto.

## Sensores Esperados

- `pbq-analyze`: `node ./bin/pbq.mjs analyze .`
- `npm-run-test`: `npm run test`

## Criterios de Conclusao

- `pbq init` em fixture de smoke cria `.plan-build-qa/bugs/README.md`.
- `pbq init` em fixture de smoke instala `.agents/skills/bug/SKILL.md` e `.claude/skills/bug/SKILL.md`.
- A skill `/bug` instrui o agente a criar/atualizar `.plan-build-qa/bugs/bug-XXX-slug/bug.md` e `progress.md`.
- O template de bug contem secoes objetivas para Investigacao, Correcao e Teste.
- O teste automatizado valida a instalacao da skill e dos artefatos de bug.
- `pbq-analyze` e `npm-run-test` passam no fechamento do package.

## Enforcement

Enforcement: advisory
