# Contract: Package 1

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

1 - Parse tolerante de nome e status no roadmap.

## Objetivo

Fazer `parseRoadmapSpecRows` reconhecer specs cujo nome esteja entre crases e validar status com prefixo de emoji/simbolo, sem regredir o comportamento atual do `pbq analyze`.

## Arquivos Permitidos

- `bin/pbq.mjs` (apenas `parseRoadmapSpecRows` e helpers de normalizacao adicionados proximos a ela; comparacao de status em `runAnalyze` se necessario)
- `tests/pbq-init-smoke.mjs` (adicionar casos de teste)
- `.plan-build-qa/specs/spec-016-roadmap-parse-tolerante/progress.md`
- `.plan-build-qa/specs/spec-016-roadmap-parse-tolerante/evaluations/package-1.md`
- `.plan-build-qa/roadmap.md`

## Arquivos Proibidos

- `templates/**` (templates de roadmap nao mudam)
- `ALLOWED_SPEC_STATUS` (`bin/pbq.mjs:14`) e seu conjunto de valores
- Qualquer outra funcao de parse (`parseProgressCurrentPackage`, `parsePackageNumber`, `parseClosedPackages`)

## Mudancas Permitidas

- Em `parseRoadmapSpecRows`: normalizar a celula de nome removendo crases e espacos antes de aplicar o gate `/^spec-\d+/i`; normalizar a celula de status removendo caracteres que nao sejam letra/espaco antes do `toLowerCase`.
- Adicionar helpers puros e pequenos (ex: `stripCellDecoration`, `normalizeRoadmapStatus`) no mesmo arquivo.
- Adicionar casos de teste cobrindo nome entre crases e status com emoji, e um caso de regressao garantindo que `_nenhuma_` continua ignorado.

## Mudancas Proibidas

**NUNCA** inclua refactor amplo, mudanca funcional extra ou ajuste de teste fora do objetivo deste package. Nao alterar exit codes, mensagens de violacao existentes, nem a logica de cruzamento spec/progress/contracts/evaluations.

## Criterios de Aceite

1. Roadmap com linha `` | `spec-016-foo` | ✅ concluido | 1 | ... `` faz `pbq analyze`:
   - contar a spec (`specCount >= 1`, sem violacao "Nenhuma spec encontrada");
   - tratar o status como `concluido` (sem violacao "status invalido").
2. Regressao preservada (assercoes existentes continuam verdes):
   - roadmap-template com `_nenhuma_` ainda produz "Nenhuma spec encontrada" (teste em `tests/pbq-init-smoke.mjs` linha ~116);
   - `spec-001-demo | em andamento | 1` continua valido;
   - status `fazendo` continua disparando "status invalido no roadmap".
3. `npm run test` sai com status 0.

## Sensores Obrigatorios

- medium | `npm-run-test` | `npm run test`

## Riscos

- Normalizacao de status mascarando invalidos: mitigado validando a parte textual restante contra `ALLOWED_SPEC_STATUS`.
- Filtro de linha capturando linhas extras: mitigado mantendo o gate `/^spec-\d+/i` sobre o nome normalizado.

## Rollback

`git checkout -- bin/pbq.mjs tests/pbq-init-smoke.mjs` e remover a pasta `.plan-build-qa/specs/spec-016-roadmap-parse-tolerante/`. A mudanca e aditiva e isolada em uma funcao de parse; reverter o arquivo restaura o comportamento anterior.

## Observabilidade

Saida de `pbq analyze` (contadores de specs/violations/warnings) e o resultado de `npm run test`.

## Duvidas Abertas

Nenhuma.
