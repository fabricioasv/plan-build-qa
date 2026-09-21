# Contract: Package 9 - grade unica

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

9

## Objetivo

Consolidar `Grade De Execucao` e `Fluxo por Spec` em uma unica grade horizontal full-width, com uma linha por spec contendo tanto os dados de execucao quanto o resumo dos packages.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/progress.md`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/spec.md`
- `.plan-build-qa/roadmap.md`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-9.md` (somente durante fechamento)

## Arquivos Proibidos

- `README.md`, templates e skills
- `.plan-build-qa/sensors.json`
- `.plan-build-qa/constitution/**`
- Qualquer alteracao no gate `pbq package close`, no modelo de sensores ou nos hooks
- Dependencias novas em `package.json`

## Mudancas Permitidas

1. Substituir as duas secoes tabulares por uma unica grade principal.
2. Manter por linha, no minimo:
   - nome da spec
   - integridade
   - status
   - contagem de packages
   - contagem de evaluations
   - etapas do `progress.md`
   - resumo dos packages com `contract/evaluation/score`
3. Remover a secao separada `Fluxo por Spec` se a informacao estiver absorvida integralmente na grade unica.
4. Ajustar CSS e testes necessarios, preservando legenda, integridade e o restante do dashboard.

## Mudancas Proibidas

- Nao criar uma segunda fonte de verdade fora dos artefatos do harness.
- Nao remover o resumo por package; ele deve continuar visivel na grade unica.
- Nao alterar o schema JSON nem os comandos do dashboard.

## Criterios de Aceite

| # | Criterio | Verificacao |
| --- | --- | --- |
| AC1 | O HTML passa a ter uma unica grade principal que absorve execucao e fluxo | Assertion no HTML gerado |
| AC2 | A grade unica mostra os campos de execucao e os packages na mesma linha da spec | Assertion estrutural/textual no HTML gerado |
| AC3 | O resumo `contract/evaluation/score` continua visivel por package | Fixture/teste do HTML gerado |
| AC4 | A secao separada `Fluxo por Spec` deixa de existir | Assertion no HTML gerado |
| AC5 | `npm run test` passa | exit 0 |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |

## Riscos

- Uma grade unica pode ficar larga demais; usar scroll horizontal controlado e largura minima coerente.
- A mistura de etapas e packages na mesma linha pode perder legibilidade se os blocos de package crescerem demais; manter o resumo compacto.

## Rollback

Reverter o commit do Package 9 e regenerar `.plan-build-qa/dashboard/`.

## Observabilidade

- O HTML gerado deve mostrar claramente uma unica grade contendo execucao e packages.

## Duvidas Abertas

_(nenhuma)_
