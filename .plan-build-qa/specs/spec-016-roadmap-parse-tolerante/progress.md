# Progress

> **Regra de retomada**
> **OBRIGATORIO** manter este arquivo suficiente para outro agente continuar o trabalho sem depender de memoria da sessao anterior.

## Estado Atual

`concluido`

## Packages Concluidos

Package 1 - fechado com Score 1 (`evaluations/package-1.md`).

## Package Atual

Nenhum. Spec concluida.

## Decisoes Tecnicas

- Escopo restrito aos dois bugs reais confirmados no codigo (`bin/pbq.mjs:597` filtro de nome; `bin/pbq.mjs:601` comparacao de status). As demais alegacoes do diagnostico foram verificadas e descartadas (linhas sem `spec-NNN` ja sao ignoradas; `parsePackageNumber` ja tolera prosa).
- Manter o gate final `/^spec-\d+/i` sobre o nome normalizado para nao capturar linhas de epico/backlog.
- Validar a parte textual do status apos remover decoracao, para nao mascarar status invalidos (`fazendo` deve continuar invalido).

## Sensores Executados

- `npm run test` (medium) | 2026-05-24 | passou (exit 0) | evidencia: `evaluations/package-1.md` (Score 1).

## Falhas Anteriores

Nenhuma.

## Riscos Acumulados

- Normalizacao de status mascarando invalidos (mitigado por validacao textual residual).

## Pendencias

Nenhuma.

## Contexto Para Retomada

Origem: `pbq analyze` em repo alvo saiu com exit 1 e "Nenhuma spec encontrada" por nome de spec entre crases e status com emoji. Decisao do usuario (2026-05-24): tornar o parser tolerante. Spec e contrato criados; implementacao ainda nao iniciada.
