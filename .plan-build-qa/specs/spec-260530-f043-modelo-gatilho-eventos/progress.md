# Progress: spec-019-modelo-gatilho-eventos

> **Regra de retomada**
> **OBRIGATORIO** manter este arquivo suficiente para outro agente continuar o trabalho sem depender de memoria da sessao anterior.

## Estado Atual

`em andamento`

Quadro de etapas (atualize a cada avanco):

| Etapa | Status |
| --- | --- |
| 1. spec | ok |
| 2. contract (validacao) | ok |
| 3. implement | ok |
| 4. test/qa | ok |
| 5. roadmap | ok |

## Packages Concluidos

Package 1 — fechado com Score 1 em 2026-05-30. `npm run test` passou (exit 0). Evidência automática de stdout na evaluation. Sensores migrados para v2 (`on`).
Package 2 — fechado com Score 1 em 2026-05-30. `pbq guard` (advisory/blocking), `pbq hooks install|status`, geração de hook scripts e merge de PostToolUse em settings.json.
Package 3 — fechado com Score 1 em 2026-05-30. Constitution, skills, templates, OVERVIEW, runners por evento, sensor-catalog com `on`.

## Package Atual

_(spec concluida)

## Decisoes Tecnicas

- `tier` torna-se cosmético (rótulo de custo na listagem); não é mais usado para filtrar execução.
- `phase` (before/after) é removido do schema ativo. Sensores existentes com `phase` são migrados: `phase:["before"]` acrescenta `"edit"` em `on`; ausência de `phase` vira `on:["close"]`.
- Migração v1→v2: `fast → on:["commit","close"]`; `medium → on:["close"]`; `slow → on:["close"]`. Preserva `enabled` e `requiresEnv`.
- `pbq guard` é advisory por default (exit 0 sempre); exit 1 apenas quando `Enforcement: blocking` está na spec ativa E algum sensor falhou.
- `pbq hooks install` (explícito, não automático no `init`) ativa o git hook via `core.hooksPath` ou cópia.
- Captura de stdout/stderr: truncar em ~500 chars do final, sanitizar pipes e quebras de linha.
- Aliases `run-fast.ps1`/`run-medium.ps1`/`run-slow.ps1` mantidos como deprecados nesta spec.

## Sensores Executados

- **contract-check Package 1** (2026-05-30): validação estrutural apenas (modo contract-check não executa sensores de código). `pbq-analyze` registrado em sensors.json como pré-condição.
- **acceptance-check Package 1** (2026-05-30): `npm run test` passou (exit 0, evidência automática). `pbq-analyze` não incluído no gate (tier fast, `--tiers medium` no package close) — violações pré-existentes de spec-013 scope, nenhuma nova introduzida.

## Falhas Anteriores

_(nenhuma)_

## Riscos Acumulados

- Contratos/evaluations em `netview/max` referenciam `run-fast.ps1` e `tier` — não serão reescritos.
- settings.json do projeto alvo pode ter hooks pré-existentes — merge obrigatório ao gerar hook PostToolUse.

## Pendencias

_(nenhuma)_

## Contexto Para Retomada

- Spec criada em 2026-05-30.
- Plano completo em `C:\Users\dtiDigital\.claude\plans\estou-achando-que-a-vectorized-ullman.md`.
- Arquivos centrais: `bin/pbq.mjs` (2276 linhas). Funções-chave: `isSensorEligibleForPhase` (:327), `executePackageSensors` (:892), `packageEvaluationContent` (:945), `runSensorCommand` (:137), `parseSensorAddArgs` (:290), `runUpdateCommand` (:737).
- Sensor já registrado: `npm-run-test` (medium). `pbq-analyze` (fast) a ser registrado no Package 1.
