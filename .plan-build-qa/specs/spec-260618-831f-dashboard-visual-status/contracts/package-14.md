# Contract: Package 14 - contadores gerais no topo do dashboard

## Objetivo

Ampliar a sessao inicial `PBQ Dashboard` para mostrar, alem dos totais existentes, os contadores gerais de status e integridade derivados do snapshot.

## Escopo

- Exibir na sessao inicial os contadores por status do roadmap (`planejado`, `em andamento`, `concluido`, `bloqueado`, `cancelado`) quando existirem no snapshot.
- Exibir na mesma sessao os contadores de integridade (`healthy`, `warning`, `critical`).
- Preservar a fonte unica no `dashboard.summary`, sem recalculo paralelo no HTML.

## Fora de Escopo

- Alterar a grade principal, filtros, ordenacao ou a secao de integridade detalhada.
- Introduzir novos estados, taxonomias ou dependencias de UI.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/spec.md`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/progress.md`
- `.plan-build-qa/roadmap.md`

## Arquivos Proibidos

- `.plan-build-qa/sensors.json`
- `package.json`
- Qualquer arquivo fora do escopo acima

## Criterios de Aceite

1. A sessao `PBQ Dashboard` mostra contadores gerais de status derivados de `dashboard.summary.specsByStatus`.
2. A mesma sessao mostra contadores gerais de integridade derivados de `dashboard.summary.integrity`.
3. O HTML continua full-width e sem remover os totais ja exibidos.
4. `npm test` cobre a presenca dos contadores adicionais no HTML gerado.

## Sensores Obrigatorios

- `npm-run-test`

## Rollback

Remover os blocos adicionais de resumo por status e integridade da sessao inicial do dashboard.

## Observabilidade

Sem telemetria nova. A evidencia fica no HTML gerado e no teste automatizado.
