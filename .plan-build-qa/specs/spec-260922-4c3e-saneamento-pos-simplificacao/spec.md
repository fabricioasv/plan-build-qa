# Spec: Saneamento pos simplificacao

Spec ID: 260922-4c3e

## Objetivo

Registrar como backlog planejado os itens que ficaram deliberadamente fora do escopo de `spec-260921-7a1b-simplificacao-pontual-harness` durante a avaliacao de simplificacao do framework pbq, para nao se perderem, sem implementar nada agora.

## Contexto

A spec `spec-260921-7a1b-simplificacao-pontual-harness` fechou com 6 packages verificados de forma independente (tier, dashboard, runners depreciados, regra de enforcement, `--agents`/cursor, skill `retro`). Durante essa spec e a avaliacao que a originou, ficaram identificados 5 itens de follow-up que nao faziam parte do escopo aprovado. Esta spec so registra esses itens; nenhum package aqui esta liberado para implementacao ate ser puxado explicitamente.

## Escopo

- Registrar os 5 packages abaixo com Estado `planejado`.
- Nao criar contratos (`contracts/package-N.md`) agora — isso fica para quando cada package for de fato iniciado, seguindo o pipeline normal (`spec` cria/ajusta o contrato -> `test` contract-check -> `implement` -> `test` acceptance-check).

## Fora de Escopo

- Implementar qualquer um dos 5 packages agora.
- Alterar `spec-260716-d3a1-pbq-compactacao-contract-check` diretamente (Package 3 aqui so aponta para ela, nao a substitui nem a duplica).

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Consolidar `roadmap.md`/`progress.md`/`evaluation.md` como fonte unica de status de spec/package, eliminando divergencia manual entre as 3 | planejado | pbq-analyze, npm-run-test |
| 2 | Remover `constitution/repository-rules.md` (redundante com `AGENTS.md`/`CLAUDE.md`, que ja carregam o mesmo bloco injetado) | planejado | pbq-analyze, npm-run-test |
| 3 | Retomar `spec-260716-d3a1-pbq-compactacao-contract-check` (packages 2, 3 e 4 — compactar templates, dashboard como derivado, diagnostico de peso); este package aqui e so um lembrete no roadmap, o trabalho real continua na spec 260716-d3a1 | planejado | pbq-analyze, npm-run-test |
| 4 | Corrigir `manifest.json` para se auto-atualizar durante `pbq update` (hoje `withManifest` exclui o proprio `manifest.json` do mapa de hashes que ele guarda, entao mudancas nele sempre geram `.pbq-new` em vez de sobrescrita automatica) | planejado | pbq-analyze, npm-run-test |
| 5 | Remover a coluna `Tier` vestigial do gerador de evaluation em `bin/pbq.mjs` (~linha 2283) e corrigir `--tiers` de `pbq package close` para ser de fato sem efeito quando passado explicitamente (hoje filtra por `sensor.tier \|\| sensor.runnerBucket` quando a flag e informada) | planejado | pbq-analyze, npm-run-test |

## Riscos

- Package 1 (fusao de fontes de status) e o mais arriscado: pode enfraquecer a deteccao de divergencia que `pbq analyze` hoje faz justamente comparando as 3 fontes — precisa de contrato cuidadoso quando for iniciado.
- Package 3 depende do estado de `spec-260716-d3a1`; se ela mudar de escopo antes deste package ser puxado, revisar a referencia aqui.

## Sensores Esperados

- `pbq-analyze`: `node ./bin/pbq.mjs analyze .`
- `npm-run-test`: `npm run test`

## Criterios de Conclusao

Esta spec fica `planejado`/`em andamento` conforme os packages forem puxados individualmente; nao ha criterio de conclusao unico ate que os 5 packages sejam tratados (implementados, fundidos em outra spec, ou formalmente cancelados com justificativa).

## Enforcement

Enforcement: advisory
