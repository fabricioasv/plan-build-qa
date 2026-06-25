# Contract: Package 6 - motivo explicito da integridade

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

6

## Objetivo

Mostrar o motivo explicito da integridade no dashboard quando uma spec nao estiver `healthy`, substituindo o subtitulo generico `materialized` por uma explicacao derivada do modelo de integridade.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/progress.md`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-6.md`

## Arquivos Proibidos

- `package.json`
- `.plan-build-qa/sensors.json`
- `.plan-build-qa/constitution/**`
- Skills e templates nao relacionados ao dashboard
- Alteracoes no modelo de sensores, hooks ou gate `pbq package close`

## Mudancas Permitidas

- Ajustar o HTML gerado para mostrar `integrityReason` quando a integridade for `warning` ou `critical`.
- Atualizar assertions do smoke test para cobrir o motivo explicito da integridade.
- Atualizar progress/evaluation do package.

## Mudancas Proibidas

- Alterar a fonte de verdade do dashboard.
- Transformar integridade em campo editavel.
- Remover outras informacoes de rastreabilidade do dashboard.

## Criterios de Aceite

| # | Criterio | Verificacao |
| --- | --- | --- |
| AC1 | Specs com integridade nao saudavel exibem o motivo explicito da integridade no HTML | Assertion no HTML gerado |
| AC2 | O subtitulo generico `materialized` nao substitui o motivo quando ha warning/critical | Assertion no HTML gerado |
| AC3 | Specs saudaveis continuam exibindo dados derivados normalmente | Smoke test existente |
| AC4 | `npm run test` passa | exit 0 |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |

## Riscos

- Motivo muito longo pode poluir a grade; manter texto derivado e compacto.
- A mudanca deve ser somente apresentacional, sem mudar o calculo de integridade.

## Rollback

Reverter o commit/patch do Package 6 e regenerar `.plan-build-qa/dashboard/` se necessario.

## Observabilidade

O HTML gerado e o smoke test sao a evidencia operacional.

## Duvidas Abertas

Nenhuma.
