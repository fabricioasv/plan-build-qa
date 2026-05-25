# Progress

> **Regra de retomada**
> **OBRIGATORIO** manter este arquivo suficiente para outro agente continuar o trabalho sem depender de memoria da sessao anterior.

## Estado Atual

concluido

Quadro de etapas (atualize a cada avanco):

| Etapa | Status |
| --- | --- |
| 1. spec | ok |
| 2. contract (validacao) | ok |
| 3. implement | ok |
| 4. test/qa | ok |
| 5. roadmap | ok |

Status de etapa: `pendente`, `em andamento`, `ok`, `falhou`, `nao-aplicavel`.

## Packages Concluidos

Package 1 - fechado com Score 1; ver `evaluations/package-1.md`.

## Package Atual

Nenhum. Spec concluida.

## Decisoes Tecnicas

- Correcao restritiva (inverso da spec-016, que afrouxou o parser de roadmap): exigir a forma explicita `package <N>` e descartar inteiros soltos.
- Formas hifenizadas (`package-1.md`) e numeros de prosa (`exit 0`, `AC 1-6`, datas) deixam de ser interpretados como package concluido.

## Sensores Executados

- `npm run test` (medium, `npm-run-test`) | 2026-05-25 | passou (exit 0) | evidencia: `evaluations/package-1.md` (Score 1), inclui o caso `pbq-analyze-closed-prose`.

## Falhas Anteriores

Nenhuma.

## Riscos Acumulados

- Package concluido escrito sem a palavra "package" deixaria de ser detectado (aceito; convencao e "Package N").

## Pendencias

Nenhuma.

## Contexto Para Retomada

Origem: durante a spec-011 (2026-05-25), `pbq analyze` reportou falsas violacoes "evaluation ausente para package concluido 0/6" porque `parseClosedPackages` raspava inteiros soltos da prosa em "Packages Concluidos". Contornado reescrevendo a prosa; esta spec corrige o parser. Spec e contrato criados; implementacao nao iniciada.
