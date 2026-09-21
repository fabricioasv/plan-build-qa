# Spec: roadmap-parse-tolerante

## Objetivo

Tornar `parseRoadmapSpecRows` (e a normalizacao de status) do `pbq analyze` tolerante a duas decoracoes comuns em roadmaps humanos ricos, sem regredir o comportamento atual:

1. Nome da spec entre crases na coluna `Spec` (ex: `` `spec-016-foo` ``).
2. Status com prefixo de emoji/simbolo (ex: `✅ concluido`).

## Contexto

Rodando `pbq analyze` em um repositorio alvo que adotou o harness, o comando saiu com exit 1 e a violacao "Nenhuma spec encontrada na tabela do roadmap.", mesmo com specs reais registradas. O diagnostico mostrou que o parser e fragil em dois pontos objetivos:

- `bin/pbq.mjs:597` filtra linhas com `/^\|\s*spec-\d+/i`. Uma celula iniciada por crase (`` | `spec-... ``) nunca casa, entao a spec inteira e descartada -> falso "Nenhuma spec encontrada".
- `bin/pbq.mjs:601` faz `cells[2].toLowerCase()` e compara contra `ALLOWED_SPEC_STATUS`. `"✅ concluido"` nao bate com `"concluido"` -> falso "status invalido".

Outras alegacoes do diagnostico foram verificadas e descartadas como nao-bug: linhas sem `spec-NNN` (epicos/backlog) ja sao ignoradas silenciosamente por design, e `parsePackageNumber` ja extrai o primeiro digito de prosa. O escopo desta spec fica restrito aos dois pontos reais acima.

## Escopo

- Normalizar a coluna `Spec` removendo crases/espacos antes de testar o padrao `spec-\d+`.
- Normalizar a coluna `Status` removendo decoracao nao-textual (emoji/simbolos) antes de comparar com `ALLOWED_SPEC_STATUS`.
- Cobrir os dois casos com testes em `tests/pbq-init-smoke.mjs`.

## Fora de Escopo

- Suportar nomes de spec que nao sigam `spec-NNN` (slugs descritivos continuam ignorados de proposito).
- Mudar `parseProgressCurrentPackage`, `parsePackageNumber` ou a regra de "Package Atual em prosa".
- Alterar `ALLOWED_SPEC_STATUS` ou os templates de roadmap.

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Normalizar nome (crases) e status (emoji) em parseRoadmapSpecRows + testes | planejado | npm-run-test |

## Riscos

- Normalizacao agressiva de status poderia mascarar status genuinamente invalidos. Mitigacao: remover apenas decoracao nao-letra/espaco e ainda validar a parte textual contra `ALLOWED_SPEC_STATUS` (ex: `fazendo` continua invalido).
- Afrouxar o filtro de linha poderia capturar linhas indesejadas. Mitigacao: manter o gate final em `/^spec-\d+/i` sobre o nome ja normalizado.

## Sensores Esperados

- `npm-run-test` (medium): `npm run test` cobre o smoke de `pbq analyze`, incluindo a asercao de que o roadmap-template `_nenhuma_` ainda gera "Nenhuma spec encontrada".

## Criterios de Conclusao

- `npm run test` passa com novos casos para nome entre crases e status com emoji.
- `pbq analyze` reconhece spec com nome entre crases (entra em `specCount`) e valida `✅ concluido` como `concluido`.
- Casos atuais preservados: `spec-001-demo | em andamento` continua valido; linha `_nenhuma_` continua ignorada; `fazendo` continua invalido.
- Evaluation do package 1 com Score 1.
