# Spec: spec-021-package-close-contract-driven

## Objetivo

Tornar a lista de **sensores obrigatórios do contrato** a fonte de verdade do gate `pbq package close`. Hoje a evaluation é gerada apenas a partir do `sensors.json` filtrado por tier/`on:close`; um sensor exigido pelo contrato mas fora desse filtro nunca entra na evaluation e o package ainda recebe Score 1. O `pbq package close` passará a ler o contrato `## Sensores Obrigatorios`, executar também esses sensores e exigir `passou` em todos eles para Score 1.

## Contexto

Follow-up da spec-020: o `pbq analyze` passou a **detectar** o descasamento contract↔evaluation de sensores (`analyzeSensorEnforcement`), mas a **geração** da evaluation em `executePackageSensors` (`bin/pbq.mjs`) continua derivando os sensores só do `sensors.json` (filtro tier/evento), sem consultar o contrato. Resultado: o contrato pode exigir o sensor X, mas se X não estiver entre os tiers pedidos ou não for `on:close`, a evaluation não o inclui e mesmo assim fecha com Score 1. Esta spec fecha esse loop na origem (geração), complementando o check que o analyze já faz (detecção).

## Escopo

- `bin/pbq.mjs` — `runPackageCommand`, `parsePackageCloseArgs`, `executePackageSensors`, `packageEvaluationContent`.
- `tests/pbq-init-smoke.mjs`.
- `.plan-build-qa/constitution/testing.md` + skills `test`/`sensor` (3 variantes).
- `.plan-build-qa/roadmap.md`.

## Fora de Escopo

- Mudar o modelo de sensores (`on`/tiers) — permanece como está.
- Mudar o `pbq guard` (hooks) — permanece advisory/event-based.
- A política da matriz de packages (spec-020).

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | `package close` lê o contrato, roda a união (contract-required ∪ selecionados por tier/evento) e exige todos `passou`; obrigatório não-registrado → `pendente` + Score 0 | planejado | medium: `npm-run-test` |
| 2 | Docs: constitution/testing.md + skills test/sensor + roadmap concluido | planejado | medium: `npm-run-test` |

## Riscos

- Mudança de comportamento do gate: packages que hoje passam podem passar a exigir sensores antes ignorados. É o efeito desejado, mas pode surfar dívidas existentes.
- Sensor obrigatório do contrato sem comando registrado em `sensors.json` → não há o que executar; tratar como `pendente` (Score 0), não como erro fatal.

## Sensores Esperados

- `npm-run-test` (medium) — registrado.
- `pbq-analyze` (fast) — registrado; não-gate (violações pré-existentes de spec-013 no próprio repo).

## Criterios de Conclusao

- `package close` executa os sensores obrigatórios do contrato mesmo fora do filtro tier/evento.
- Score 1 só com todos os sensores (união) `passou`.
- Comportamento preservado quando o contrato não tem `## Sensores Obrigatorios`.
- `npm run test` verde; docs e roadmap atualizados.

## Decisões de design

- **União, não substituição**: o gate roda os sensores selecionados por tier/evento **mais** os obrigatórios do contrato (dedup por nome). Mantém compatibilidade com quem usa `--tiers`, e adiciona a garantia do contrato. (Alternativa "só contrato" foi descartada por quebrar fluxo atual.)

## Enforcement

Enforcement: advisory
