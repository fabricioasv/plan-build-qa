# Progress

> **Regra de retomada**
> **OBRIGATORIO** manter este arquivo suficiente para outro agente continuar o trabalho sem depender de memoria da sessao anterior.

## Estado Atual

em andamento

Quadro de etapas (atualize a cada avanco):

| Etapa | Status |
| --- | --- |
| 1. spec | ok |
| 2. contract (validacao) | ok |
| 3. implement | pendente |
| 4. test/qa | pendente |
| 5. roadmap | pendente |

Status de etapa: `pendente`, `em andamento`, `ok`, `falhou`, `nao-aplicavel`.

## Packages Concluidos

Nenhum.

## Package Atual

Package 1 - restringir `parseClosedPackages` a forma `package <N>` e cobrir com teste de regressao.

## Decisoes Tecnicas

- Correcao restritiva (inverso da spec-016, que afrouxou o parser de roadmap): exigir a forma explicita `package <N>` e descartar inteiros soltos.
- Formas hifenizadas (`package-1.md`) e numeros de prosa (`exit 0`, `AC 1-6`, datas) deixam de ser interpretados como package concluido.

## Sensores Executados

Pendente: `npm run test` na implementacao do package 1.

## Falhas Anteriores

Nenhuma.

## Riscos Acumulados

- Package concluido escrito sem a palavra "package" deixaria de ser detectado (aceito; convencao e "Package N").

## Pendencias

- Implementar package 1 via `/implement` contra `contracts/package-1.md`.

## Contexto Para Retomada

Origem: durante a spec-011 (2026-05-25), `pbq analyze` reportou falsas violacoes "evaluation ausente para package concluido 0/6" porque `parseClosedPackages` raspava inteiros soltos da prosa em "Packages Concluidos". Contornado reescrevendo a prosa; esta spec corrige o parser. Spec e contrato criados; implementacao nao iniciada.
