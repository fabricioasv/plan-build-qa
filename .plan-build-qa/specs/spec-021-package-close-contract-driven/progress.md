# Progress: spec-021-package-close-contract-driven

> **Regra de retomada**
> **OBRIGATORIO** manter este arquivo suficiente para outro agente continuar o trabalho sem depender de memoria da sessao anterior.

## Estado Atual

`em andamento`

| Etapa | Status |
| --- | --- |
| 1. spec | ok |
| 2. contract (validacao) | ok |
| 3. implement | pendente |
| 4. test/qa | pendente |
| 5. roadmap | pendente |

## Packages Concluidos

_(nenhum)_

## Package Atual

Package 1 — `package close` orientado ao contrato.

## Decisoes Tecnicas

- União (contract-required ∪ selecionados por tier/evento), dedup por nome. Não substituição.
- Sensor obrigatório do contrato sem comando registrado em sensors.json → linha `pendente` na evaluation, Score 0.
- Reusar `parseContractRequiredSensors` (já entende tabela e lista após spec-020).
- Score 1 = todos os sensores executados (união) com `passou`; qualquer `falhou`/`pendente` → Score 0.
- Contrato sem `## Sensores Obrigatorios` → comportamento atual preservado.

## Sensores Executados

_(nenhum ainda)_

## Falhas Anteriores

_(nenhuma)_

## Riscos Acumulados

- Mudança de comportamento do gate pode surfar dívidas em packages que hoje passam.

## Pendencias

_(nenhuma)_

## Contexto Para Retomada

- Follow-up da spec-020. `executePackageSensors`/`runPackageCommand`/`parsePackageCloseArgs`/`packageEvaluationContent` em `bin/pbq.mjs`.
- `parseContractRequiredSensors` (table+list aware) e `isSensorEligibleForEvent` já existem.
- Sensores: `npm-run-test` (medium), `pbq-analyze` (fast, não-gate).
