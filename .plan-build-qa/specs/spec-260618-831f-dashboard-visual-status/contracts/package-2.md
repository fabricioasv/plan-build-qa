# Contract: Package 2 - HTML estatico do dashboard

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

2

## Objetivo

Gerar `index.html` estatico para o dashboard visual em `.plan-build-qa/dashboard/`, usando o modelo consolidado do Package 1 para renderizar uma interface navegavel com kanban por status, fluxo por spec/package e matriz de integridade.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/progress.md`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-2.md` (somente durante fechamento)

## Arquivos Proibidos

- `README.md`, templates e skills
- `.plan-build-qa/sensors.json`
- `.plan-build-qa/constitution/**`
- Qualquer alteracao no gate `pbq package close`, no modelo de sensores ou nos hooks
- Dependencias novas em `package.json`

## Mudancas Permitidas

1. Estender `pbq dashboard --output <dir>` para gravar `index.html` e `status.json` no diretorio de saida.
2. Gerar HTML estatico sem dependencia externa, com CSS e JS embutidos.
3. Embutir o snapshot mais recente do dashboard no proprio HTML e, quando servido via HTTP, tentar recarregar `status.json` periodicamente sem quebrar o uso offline em `file://`.
4. Renderizar no HTML, no minimo:
   - kanban com colunas por status do roadmap
   - visao por spec/package com contratos, evaluations e score
   - matriz/lista de warnings/integridade
5. Preservar `pbq dashboard --json`, `pbq status` e `pbq run --resume`.

## Mudancas Proibidas

- Nao adicionar framework web, bundler ou dependencia npm.
- Nao transformar o HTML em fonte editavel de estado.
- Nao introduzir servidor HTTP neste package.
- Nao mudar a estrutura do schema JSON de forma breaking sem atualizar os testes do Package 1.

## Criterios de Aceite

| # | Criterio | Verificacao |
| --- | --- | --- |
| AC1 | `pbq dashboard <fixture> --output <dir>` cria `<dir>/index.html` e `<dir>/status.json` | Teste em `tests/pbq-init-smoke.mjs` |
| AC2 | O HTML contem o nome de uma spec materializada e de uma spec apenas no roadmap | Assertions sobre o arquivo gerado |
| AC3 | O HTML contem secoes identificaveis para kanban, fluxo/specs e integridade/warnings | Assertions sobre marcadores/textos do HTML |
| AC4 | O HTML embute o snapshot inicial sem depender de fetch para renderizar a primeira tela | Assertion sobre presenca de payload serializado |
| AC5 | `pbq status` e `pbq run --resume` continuam passando os testes existentes | Testes existentes preservados |
| AC6 | `npm run test` passa | exit 0 |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |

## Riscos

- HTML gerado ficar visualmente pobre ou estruturalmente confuso; mitigar com layout claro e dados objetivos.
- Serializacao inline quebrar quando houver caracteres especiais; usar `JSON.stringify` seguro dentro de `<script>`.

## Rollback

Reverter o commit do Package 2. Se snapshots tiverem sido gerados manualmente, remover `.plan-build-qa/dashboard/`.

## Observabilidade

- `status.json` e `index.html` sao artefatos derivados e inspecionaveis.

## Duvidas Abertas

_(nenhuma)_
