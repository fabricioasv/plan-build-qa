# Progress

> **Regra de retomada**
> **OBRIGATORIO** manter este arquivo suficiente para outro agente continuar o trabalho sem depender de memoria da sessao anterior.

## Estado Atual

em andamento

## Packages Concluidos

Package 1 concluido com evaluation Score 1 em `evaluations/package-1.md`.

## Package Atual

Package 2 - adicionar subcomando `pbq sensor suggest [path]` que escaneia o alvo e imprime comandos `pbq sensor add` prontos para candidatos ainda nao cadastrados em `sensors.json`.

## Decisoes Tecnicas

- 2026-05-23: Heuristica de tier por nome (sonar/lint/typecheck/format → fast; test/build/coverage → medium; e2e/smoke/integration → slow). Inconclusivo vira medium com flag `tier-incerto`.
- 2026-05-23: Nao executar scripts detectados; classificacao apenas por nome/extensao.
- 2026-05-23: Suggest nao altera arquivos do alvo; so imprime comandos.
- 2026-05-23: Aplicada antecipadamente a decisao de spec-012: contratos dos 3 packages criados ja na criacao da spec.

## Sensores Executados

- 2026-05-23 - `.\.plan-build-qa\harness\scripts\run-fast.ps1` - passou - evidencia em `evaluations/package-1.md`
- 2026-05-23 - `npm run test` - passou - evidencia em `evaluations/package-1.md`
- 2026-05-23 - `node .\bin\pbq.mjs package close . --spec spec-014-melhora-deteccao-sensores --package 1 --tiers medium` - passou - gerou `evaluations/package-1.md`

## Falhas Anteriores

Nenhuma.

## Riscos Acumulados

- Heuristica de tier pode classificar mal scripts ambiguos.
- Detectar todo `.bat`/`.sh` em raiz geraria ruido; lista de prefixos seguros mitiga.
- Skill refatorada (package 3) nao pode regredir comportamento atual.

## Pendencias

- Decidir nome canonico do flag de "tier-incerto" no output do `suggest` durante o package 2.
- Resolvida no package 1: lista final de prefixos seguros para deteccao automatica - fast: `sonar`, `lint`, `typecheck`, `format`; medium: `test`, `build`, `coverage`; slow: `e2e`, `smoke`, `integration`; medium com `tier-incerto`: `qa`. Prefixos casam por igualdade ou seguidos de `-`, `_` ou `.`. Sinalizacao via sufixo `[tier-incerto]` na razao e campo `tierUncertain: true` no `sensors.json`.

**PARE** antes de marcar a spec como concluida se houver pendencia sem decisao registrada.

## Contexto Para Retomada

Spec criada apos relato do usuario em 2026-05-23 sobre lacunas no `pbq init` e no fluxo `/sensor`. A skill `/sensor` atual exige cadastro muito manual; falta um caminho de descoberta-em-massa. Os tres contratos ja existem em `contracts/`; implementar em ordem package-1 → package-2 → package-3 e fechar via `pbq package close` complementando o sensor fast manualmente, como nos packages da spec-001-analyze.
