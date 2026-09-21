# Contract: Package 10 - colapso por spec

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

10

## Objetivo

Reverter a exposicao aberta do resumo de packages introduzida no Package 9 e reincorporar essas informacoes como um colapso por spec dentro da propria `Grade De Execucao`.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/progress.md`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/spec.md`
- `.plan-build-qa/roadmap.md`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-10.md` (somente durante fechamento)

## Arquivos Proibidos

- `README.md`, templates e skills
- `.plan-build-qa/sensors.json`
- `.plan-build-qa/constitution/**`
- Qualquer alteracao no gate `pbq package close`, no modelo de sensores ou nos hooks
- Dependencias novas em `package.json`

## Mudancas Permitidas

1. Remover a exibicao sempre aberta do resumo de packages do Package 9.
2. Manter uma unica secao principal (`Grade De Execucao`) sem reintroduzir um grid separado de fluxo.
3. Adicionar, por spec, um colapso/expand para revelar:
   - packages
   - `contract`
   - `evaluation`
   - `score`
4. Ajustar CSS e testes necessarios, preservando legenda, integridade e etapas.

## Mudancas Proibidas

- Nao recriar a secao separada `Fluxo por Spec`.
- Nao remover o resumo por package; ele deve continuar acessivel no colapso.
- Nao alterar o schema JSON nem os comandos do dashboard.

## Criterios de Aceite

| # | Criterio | Verificacao |
| --- | --- | --- |
| AC1 | A grade principal deixa de exibir o resumo de packages sempre aberto | Assertion no HTML gerado |
| AC2 | Cada spec passa a ter um colapso para revelar o fluxo/packages | Assertion no HTML gerado |
| AC3 | O colapso mostra `contract`, `evaluation` e `score` por package | Fixture/teste do HTML gerado |
| AC4 | A secao separada `Fluxo por Spec` continua ausente | Assertion no HTML gerado |
| AC5 | `npm run test` passa | exit 0 |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |

## Riscos

- O colapso precisa ficar claramente descobrivel sem roubar espaco horizontal demais.
- Expandir dentro da linha da grade nao pode quebrar a legibilidade das demais colunas.

## Rollback

Reverter o commit do Package 10 e regenerar `.plan-build-qa/dashboard/`.

## Observabilidade

- O HTML gerado deve mostrar o colapso por spec dentro da `Grade De Execucao`.

## Duvidas Abertas

_(nenhuma)_
