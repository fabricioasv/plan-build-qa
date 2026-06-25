# Contract: Package 5 - refinamento da grade principal

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

5

## Objetivo

Refinar a grade principal do dashboard para leitura operacional mais compacta: fonte menor, remocao da secao kanban, coluna de integridade logo apos o nome, coluna de status, simbolos de etapa sem background e pendencia marcada com quadrado vermelho.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/progress.md`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-5.md` (somente durante fechamento)

## Arquivos Proibidos

- `README.md`, templates e skills
- `.plan-build-qa/sensors.json`
- `.plan-build-qa/constitution/**`
- Qualquer alteracao no gate `pbq package close`, no modelo de sensores ou nos hooks
- Dependencias novas em `package.json`

## Mudancas Permitidas

1. Reduzir a tipografia da grade principal para leitura mais densa.
2. Remover a secao kanban do HTML gerado.
3. Inserir coluna de integridade logo apos o nome da spec, usando swatch/indicador de cor e rotulo curto.
4. Inserir coluna de status da spec.
5. Remover background color das celulas de etapa.
6. Marcar etapa `pendente` com quadrado vermelho.
7. Trocar o simbolo de `nao-aplicavel`.
8. Preservar o restante da derivacao do dashboard e os comandos existentes.

## Mudancas Proibidas

- Nao reintroduzir o kanban em outra secao.
- Nao remover a grade principal full-width.
- Nao transformar integridade ou status em campos editaveis no HTML.

## Criterios de Aceite

| # | Criterio | Verificacao |
| --- | --- | --- |
| AC1 | O HTML nao contem mais a secao kanban | Assertion no HTML gerado |
| AC2 | A grade principal contem colunas de integridade e status | Assertions no HTML gerado |
| AC3 | A tipografia da grade principal e menor que a atual, com leitura mais compacta | Assertion textual no CSS gerado |
| AC4 | Celulas de etapa nao usam background color e `pendente` usa quadrado vermelho | Fixture/teste do HTML gerado |
| AC5 | `nao-aplicavel` usa simbolo diferente do atual | Fixture/teste do HTML gerado |
| AC6 | `npm run test` passa | exit 0 |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |

## Riscos

- Tipografia menor demais pode perder legibilidade; manter densidade sem virar microtexto.
- Swatch de integridade precisa ficar explícito o suficiente para não depender só de cor.

## Rollback

Reverter o commit do Package 5 e regenerar `.plan-build-qa/dashboard/`.

## Observabilidade

- O proprio HTML gerado e a evidencia do refinamento visual.

## Duvidas Abertas

_(nenhuma)_
