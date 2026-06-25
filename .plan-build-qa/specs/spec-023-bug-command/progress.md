# Progress

> **Regra de retomada**
> **OBRIGATORIO** manter este arquivo suficiente para outro agente continuar o trabalho sem depender de memoria da sessao anterior.

## Estado Atual

concluido

Quadro de etapas:

| Etapa | Status |
| --- | --- |
| 1. spec | ok |
| 2. contract (validacao) | ok |
| 3. implement | ok |
| 4. test/qa | ok |
| 5. roadmap | ok |

## Packages Concluidos

- Package 1 fechado com Score 1 em `.plan-build-qa/specs/spec-023-bug-command/evaluations/package-1.md`.

## Package Atual

_(nenhum)_

## Decisoes Tecnicas

- `/bug` sera tratado como skill de agente instalada pelos adapters, nao como subcomando `pbq bug` neste package.
- Bugs serao materializados em `.plan-build-qa/bugs/bug-XXX-slug/`, separados de `.plan-build-qa/specs/`.
- O fluxo minimo do artefato de bug sera `Investigacao`, `Correcao` e `Teste`.
- Implementacao do Package 1 adicionou `bug` a `ADAPTER_SKILLS`, incluiu README/templates de bug no conjunto gerado por `pbq init`/`update`, criou a skill `/bug` nas copias locais e no template, e adicionou asserts no smoke test.

## Sensores Executados

- 2026-06-25: `contract-check` manual do Package 1, sem executar sensores de codigo. Resultado: passou. Evidencia: contrato contem objetivo, arquivos permitidos/proibidos, criterios AC1-AC6, rollback e sensores obrigatorios; `pbq-analyze` e `npm-run-test` existem em `.plan-build-qa/sensors.json`.
- 2026-06-25: `node .\bin\pbq.mjs analyze .`. Resultado: falhou antes da implementacao por violacoes preexistentes fora da spec-023: sensores antigos `check-harness-structure` nao cadastrados, specs planejadas sem pasta materializada e inconsistencias historicas da spec-022. Nao corrigido neste package por estar fora do contrato.
- 2026-06-25: `node .\bin\pbq.mjs package close . --spec spec-023-bug-command --package 1 --tiers fast,medium`. Resultado: falhou com evaluation Score 0 em `.plan-build-qa/specs/spec-023-bug-command/evaluations/package-1.md`. `npm-run-test` passou; `pbq-analyze` falhou com 22 violacoes e 4 warnings preexistentes fora da spec-023.
- 2026-06-25: apos saneamento em `spec-013-saneamento-harness-pbq`, reexecutado `node .\bin\pbq.mjs package close . --spec spec-023-bug-command --package 1 --tiers fast,medium`. Resultado: Score 1. `npm-run-test` e `pbq-analyze` passaram. Observacao: a evidencia textual de `pbq-analyze` ainda cita warning da evaluation Score 0 anterior porque o sensor roda antes de `package close` sobrescrever a evaluation.

## Falhas Anteriores

- Package 1 acceptance-check falhou porque `pbq-analyze` falha no estado global do harness por dividas historicas fora do contrato atual.

## Riscos Acumulados

- Evitar escopo excessivo: automacao CLI e dashboard para bugs ficam fora deste package.
- `pbq-analyze` atualmente falha no repositorio por dividas historicas fora da spec-023; o fechamento do Package 1 exigira decisao explicita sobre corrigir essas dividas, isolar o sensor ou registrar excecao.

## Pendencias

Nenhuma.

## Contexto Para Retomada

Spec concluida. `/bug` foi entregue como skill de agente e hierarquia/template de bug; subcomando `pbq bug` permanece fora do escopo desta spec.
