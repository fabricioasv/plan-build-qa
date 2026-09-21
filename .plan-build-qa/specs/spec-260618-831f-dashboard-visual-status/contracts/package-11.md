# Contract: Package 11 - colapso em linha abaixo

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

11

## Objetivo

Reposicionar o colapso do fluxo/packages para uma linha abaixo de cada spec na `Grade De Execucao`, em vez de mante-lo em uma coluna da propria linha principal.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/progress.md`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/spec.md`
- `.plan-build-qa/roadmap.md`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-11.md` (somente durante fechamento)

## Arquivos Proibidos

- `README.md`, templates e skills
- `.plan-build-qa/sensors.json`
- `.plan-build-qa/constitution/**`
- Qualquer alteracao no gate `pbq package close`, no modelo de sensores ou nos hooks
- Dependencias novas em `package.json`

## Mudancas Permitidas

1. Remover a coluna de colapso da linha principal da grade.
2. Fazer cada spec renderizar:
   - uma linha principal com execucao
   - uma linha imediatamente abaixo, colapsada por default, contendo packages e detalhes
3. Manter o resumo `contract/evaluation/score` por package dentro da linha expandida.
4. Ajustar CSS e testes necessarios, preservando legenda, integridade, etapas e ausencia de secao separada de fluxo.

## Mudancas Proibidas

- Nao recriar a secao separada `Fluxo por Spec`.
- Nao remover o resumo por package.
- Nao alterar o schema JSON nem os comandos do dashboard.

## Criterios de Aceite

| # | Criterio | Verificacao |
| --- | --- | --- |
| AC1 | A linha principal deixa de ter coluna dedicada ao fluxo | Assertion no HTML gerado |
| AC2 | Cada spec passa a renderizar uma linha colapsavel logo abaixo com os packages | Assertion no HTML gerado |
| AC3 | A linha expandida mostra `contract`, `evaluation` e `score` por package | Fixture/teste do HTML gerado |
| AC4 | A secao separada `Fluxo por Spec` continua ausente | Assertion no HTML gerado |
| AC5 | `npm run test` passa | exit 0 |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |

## Riscos

- A linha expandida precisa ficar claramente associada a sua spec sem confundir a leitura da grade.
- O colapso nao pode quebrar a largura e o alinhamento da tabela principal.

## Rollback

Reverter o commit do Package 11 e regenerar `.plan-build-qa/dashboard/`.

## Observabilidade

- O HTML gerado deve mostrar a linha de detalhe abaixo de cada spec.

## Duvidas Abertas

_(nenhuma)_
