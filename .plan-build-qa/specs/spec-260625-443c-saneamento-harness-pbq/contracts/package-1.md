# Contract: Package 1

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

1

## Objetivo

Sanear as causas globais que fazem `pbq-analyze` falhar no repositorio atual e impedem o fechamento da spec-023, sem reabrir packages historicos nem inventar evidencia retroativa.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-001-analyze/contracts/package-1.md`
- `.plan-build-qa/specs/spec-001-analyze/contracts/package-2.md`
- `.plan-build-qa/specs/spec-001-analyze/contracts/package-3.md`
- `.plan-build-qa/specs/spec-014-melhora-deteccao-sensores/contracts/package-1.md`
- `.plan-build-qa/specs/spec-014-melhora-deteccao-sensores/contracts/package-2.md`
- `.plan-build-qa/specs/spec-014-melhora-deteccao-sensores/contracts/package-3.md`
- `.plan-build-qa/specs/spec-015-skill-analyze/spec.md`
- `.plan-build-qa/specs/spec-015-skill-analyze/contracts/package-1.md`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/contracts/package-6.md`
- `.plan-build-qa/specs/spec-013-saneamento-harness-pbq/progress.md`
- `.plan-build-qa/specs/spec-013-saneamento-harness-pbq/evaluations/package-1.md`
- `.plan-build-qa/roadmap.md`

## Arquivos Proibidos

- `.plan-build-qa/sensors.json`
- `package.json`
- Evaluations historicas de outras specs.
- Implementacao ou artefatos da spec-023, exceto reexecutar o gate apos este saneamento.

## Mudancas Permitidas

- Alterar `pbq analyze` para tratar spec `planejado` sem pasta como warning.
- Alterar enforcement de sensores para ignorar evaluation Score 0 de package nao fechado, mantendo o warning da matriz.
- Ajustar mencoes legadas de `check-harness-structure` em contratos antigos para comando/runner legado sem nome de sensor cadastrado.
- Materializar `contracts/package-6.md` da spec-022 com base nos registros ja existentes.
- Adicionar testes de regressao para os comportamentos acima.
- Atualizar progress/roadmap/evaluation deste package.

## Mudancas Proibidas

- Relaxar unknown sensor em contrato ativo/materializado para warning.
- Fazer package fechado com Score 0 passar.
- Alterar Score ou tabela de sensors de evaluations historicas.
- Cadastrar `check-harness-structure` em `.plan-build-qa/sensors.json` sem evidencia correspondente nas evaluations historicas.

## Criterios de Aceite

- AC1: Fixture com spec `planejado` no roadmap e sem pasta materializada faz `pbq analyze` retornar exit 0 com warning.
- AC2: Fixture com evaluation Score 0 de package nao fechado e sensor obrigatorio falho nao gera violation de enforcement; fixture com package fechado e Score 0 continua falhando.
- AC3: Contratos historicos deixam de produzir violation de sensor `check-harness-structure` nao cadastrado.
- AC4: `spec-022-dashboard-visual-status/contracts/package-6.md` existe e corresponde ao objetivo do package 6 declarado.
- AC5: `npm-run-test` passa.
- AC6: `pbq-analyze` passa no repositorio apos o saneamento.

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando esperado |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |
| pbq-analyze | fast | `pbq-analyze` | `node ./bin/pbq.mjs analyze .` |

## Riscos

- Pode restar warning intencional; warnings nao devem ser escondidos.
- O analyzer nao deve passar a tolerar erro real de package concluido.

## Rollback

Reverter os arquivos listados em Arquivos Permitidos. Como nao ha migracao externa nem mudanca de dados de runtime, rollback e revert de patch/commit.

## Observabilidade

Evidencia sera registrada por `npm-run-test`, `pbq-analyze` e pela evaluation do package.

## Duvidas Abertas

Nenhuma duvida bloqueante.
