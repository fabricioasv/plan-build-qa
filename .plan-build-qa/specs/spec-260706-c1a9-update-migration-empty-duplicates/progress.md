# Progress

> **Regra de retomada**
> **OBRIGATORIO** manter este arquivo suficiente para outro agente continuar o trabalho sem depender de memoria da sessao anterior.

## Estado Atual

concluido

| Etapa | Status |
| --- | --- |
| 1. spec | ok |
| 2. contract (validacao) | ok |
| 3. implement | ok |
| 4. test/qa | ok |
| 5. roadmap | ok |

## Packages Concluidos

Package 1 concluido com Score 1 em `evaluations/package-1.md`.

## Package Atual

Nenhum.

## Decisoes Tecnicas

- Tratar diretorios modernos vazios com mesmo slug como tentativas orfas de migracao e permitir limpeza automatica durante `pbq update`.
- Manter diretorios modernos populados intactos e emitir aviso de duplicidade por slug.
- Causa raiz confirmada: `occupiedNames` era montado com todos os diretorios existentes, inclusive diretorios modernos vazios. Quando um diretorio vazio ocupava uma tentativa de nome, a migracao avancava `attempt` e gerava outro hash, deixando a tentativa vazia sem limpeza.
- Correcao aplicada: antes de migrar specs/bugs legados, `pbq update` detecta duplicidade moderna por slug, remove somente diretorios modernos vazios associados ao slug, e mantem diretorios populados com warning.

## Sensores Executados

- 2026-07-06: `npm test` -> passou.
- 2026-07-06: `node .\bin\pbq.mjs package close . --spec spec-260706-c1a9-update-migration-empty-duplicates --package 1 --tiers medium` -> Score 1 em `evaluations/package-1.md`.

## Falhas Anteriores

- Em repositorio consumidor, `pbq update` deixou diretorios modernos vazios e populados com mesmo slug e hashes diferentes.

## Riscos Acumulados

- A limpeza automatica se limita a diretorios com `readdir(...).length === 0`; diretorios populados com mesmo slug sao preservados e avisados.

## Pendencias

Nenhuma.

## Contexto Para Retomada

Package concluido. A implementacao esta em `bin/pbq.mjs`; a regressao esta em `tests/pbq-init-smoke.mjs`, cobrindo limpeza de diretorio moderno vazio para specs e bugs e warning de duplicidade moderna populada para specs e bugs.
