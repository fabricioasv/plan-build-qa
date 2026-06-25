# Contract: Package 12 - filtros no dashboard

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

12

## Objetivo

Adicionar filtros na visualizacao do dashboard para permitir refinar as specs exibidas sem alterar a derivacao dos dados do harness.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/progress.md`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/spec.md`
- `.plan-build-qa/roadmap.md`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-12.md` (somente durante fechamento)

## Arquivos Proibidos

- `README.md`, templates e skills
- `.plan-build-qa/sensors.json`
- `.plan-build-qa/constitution/**`
- Qualquer alteracao no gate `pbq package close`, no modelo de sensores ou nos hooks
- Dependencias novas em `package.json`

## Mudancas Permitidas

1. Adicionar controles de filtro no HTML gerado, usando apenas CSS/JS nativos.
2. Permitir filtrar ao menos por:
   - texto/nome da spec
   - status
   - integridade
3. Aplicar o filtro sobre a `Grade De Execucao` e suas linhas de detalhe.
4. Preservar colapsos, legenda, integridade e o restante do dashboard.

## Mudancas Proibidas

- Nao alterar o schema JSON nem os comandos do dashboard.
- Nao transformar filtros em fonte de verdade persistente fora da pagina.
- Nao reintroduzir bibliotecas externas ou backend.

## Criterios de Aceite

| # | Criterio | Verificacao |
| --- | --- | --- |
| AC1 | O HTML exibe controles de filtro na visualizacao | Assertion no HTML gerado |
| AC2 | Os filtros incluem texto, status e integridade | Assertion no HTML gerado |
| AC3 | O script gerado aplica filtros sobre a grade principal | Assertion no HTML gerado |
| AC4 | As linhas de detalhe acompanham a visibilidade da spec filtrada | Assertion estrutural/textual no HTML gerado |
| AC5 | `npm run test` passa | exit 0 |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |

## Riscos

- Filtros demais podem poluir o topo da tela; manter controles compactos.
- O colapso por spec nao pode perder associacao com a linha principal ao filtrar.

## Rollback

Reverter o commit do Package 12 e regenerar `.plan-build-qa/dashboard/`.

## Observabilidade

- O HTML gerado deve conter os controles e a logica de filtro.

## Duvidas Abertas

_(nenhuma)_
