# Progress

> **Regra de retomada**
> **OBRIGATORIO** manter este arquivo suficiente para outro agente continuar o trabalho sem depender de memoria da sessao anterior.

## Estado Atual

concluido

Quadro de etapas (atualize a cada avanco):

| Etapa | Status |
| --- | --- |
| 1. spec | ok |
| 2. contract (validacao) | ok |
| 3. implement | ok |
| 4. test/qa | ok |
| 5. roadmap | ok |

Status de etapa: `pendente`, `em andamento`, `ok`, `falhou`, `nao-aplicavel`.

## Packages Concluidos

- Package 1 fechado com Score 1 em `.plan-build-qa/specs/spec-024-bug-investigation-only/evaluations/package-1.md`.

## Package Atual

Package 1: restringir `/bug` a registro e investigacao, direcionando correcao para `/implement`.

## Decisoes Tecnicas

- `bug` continua sendo o lugar canonico para erro observado e evidencia inicial.
- `/bug` nao deve aplicar mudancas de codigo nem executar validacao de aceite; esses passos ficam para `/implement` e `/test`.
- Templates podem manter referencias a correcao/teste apenas como links ou resumo de evidencia gerada por package/evaluation posterior.
- A skill `/bug` agora explicita a fronteira: cria/atualiza registros, preenche `Investigacao`, para a execucao direta e encaminha correcao para `/implement` e validacao para `/test`.
- `bug.md` preserva secoes `Correcao` e `Teste`, mas como registro posterior produzido por `/implement` e `/test`.
- `bug-progress.md` substitui etapas de execucao direta por `Encaminhamento para implement` e `Evidencia de test`.

## Sensores Executados

- 2026-06-26: contract-check manual da skill `test` aplicado ao contrato `.plan-build-qa/specs/spec-024-bug-investigation-only/contracts/package-1.md`. Resultado: passou. Evidencia: contrato contem criterios objetivos AC1-AC6, arquivos permitidos/proibidos, rollback e sensores obrigatorios; `pbq-analyze` e `npm-run-test` existem em `.plan-build-qa/sensors.json`.
- 2026-06-27: acceptance-check via `node .\bin\pbq.mjs package close . --spec spec-024-bug-investigation-only --package 1 --tiers fast,medium`. Resultado: passou, Score 1. Sensores obrigatorios: `npm-run-test` exit 0 (`npm run test`), `pbq-analyze` exit 0 (`node ./bin/pbq.mjs analyze .`). Evaluation: `.plan-build-qa/specs/spec-024-bug-investigation-only/evaluations/package-1.md`.

## Falhas Anteriores

Nenhuma registrada para esta spec.

## Riscos Acumulados

- A implementacao precisa atualizar tanto `.agents`/`.claude` quanto `templates/adapters`, ou novos repositorios continuarao recebendo a skill antiga.
- O teste deve checar texto/instrucoes de forma objetiva sem ficar fragil a pequenas reformulacoes.

## Pendencias

Nenhuma.

## Contexto Para Retomada

Pedido original: ajustar `/bug` para executar apenas as etapas 1 a 3 do fluxo entendido pelo usuario: criar/localizar registro, criar/atualizar documentacao e investigar. A correcao deve ficar a cargo de `/implement`.
