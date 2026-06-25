# Progress: spec-020-analyze-package-matrix

> **Regra de retomada**
> **OBRIGATORIO** manter este arquivo suficiente para outro agente continuar o trabalho sem depender de memoria da sessao anterior.

## Estado Atual

`em andamento`

| Etapa | Status |
| --- | --- |
| 1. spec | ok |
| 2. contract (validacao) | ok |
| 3. implement | ok |
| 4. test/qa | ok |
| 5. roadmap | ok |

## Packages Concluidos

Package 1 — fechado com Score 1 em 2026-05-31. `analyzePackageMatrix` com 6 checks; `npm run test` verde; validado contra netview/max spec-013.
Package 2 — fechado com Score 1 em 2026-05-31. `analyzeSensorEnforcement` + `parseEvaluationSensorRows` + `parseContractRequiredSensors` estendido p/ tabelas; skill analyze (3 variantes, diff vazio); roadmap concluido. Dogfood: spec-019/020 não auto-flagadas.

## Package Atual

_(spec concluida)_

## Decisoes Tecnicas

- Sub-packages decimais proibidos (integer-only). Violação para `package-1.1.md` e para entrada `1.1` na tabela.
- Marcador `N+` na tabela = cauda aberta legítima (não vira violação de "fora da tabela" para materializados >= N).
- Buraco na sequência de packages MATERIALIZADOS (contracts ∪ evaluations) = violação. Ex: {1,2,3,8,10} falta {4,5,6,7,9}.
- Evaluation sem contract correspondente = violação (órfã).
- Evaluation com Score 0 em package fechado = violação; Score 0 fora de fechado = warning.
- Declarado-sem-contract (planejado / cauda N+) = warning, não violação.
- Package 2: enforcement — sensor obrigatório do contrato deve aparecer na tabela de sensores da evaluation com status `passou`.

## Sensores Executados

- **Package 1 impl** (2026-05-31): novos parsers (`parseSpecPackageRows`, `listPackageFiles`, `parseEvaluationScore`) + `analyzePackageMatrix` com 6 checks. Bug corrigido: `parseSpecPackageRows` ancorado em linha de header exata (evita mencao inline de `## Packages` no Contexto). Validado contra netview/max spec-013 (pega sub-packages 1.1/1.2) e sem falso-positivo no repo do framework.

## Falhas Anteriores

_(nenhuma)_

## Riscos Acumulados

- `pbq package close` gera evaluation a partir de sensors.json (filtro tier/evento), não do contrato — o vínculo contract↔evaluation de sensores não é imposto na geração. Package 2 cobre a verificacao no analyze, mas a geracao em si fica como follow-up.

## Pendencias

_(nenhuma)_

## Contexto Para Retomada

- Caso motivador: `c:\dti\netview\max` spec-013-onboarding-max-bdmg.
- `analyzeHarness` em `bin/pbq.mjs:947`. Parsers: `parseRoadmapSpecRows` (:1089), `parseClosedPackages` (:1119), `parseContractRequiredSensors` (:1067), `parsePackageNumber` (:1114).
- Sensores: `npm-run-test` (medium), `pbq-analyze` (fast, não-gate).
