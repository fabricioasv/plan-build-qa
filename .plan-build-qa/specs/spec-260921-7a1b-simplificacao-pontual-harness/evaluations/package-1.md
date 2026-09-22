# Evaluation: Package 1

Score: 1

## Resumo De Sensores

| Sensor | Tier | Obrigatorio | Status | Comando | Exit Code | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| npm-run-test | - | sim | passou | `npm run test` | 0 | npm notice run pbq-harness@0.8.0 test npm notice run node ./tests/pbq-init-smoke.mjs |
| pbq-analyze | - | sim | passou | `node ./bin/pbq.mjs analyze .` | 0 | ...: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-260627-3571-sensor-scope-local-global/package-4.md: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-260627-3571-sensor-scope-local-global/package-4.md: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-260627-3571-sensor-scope-local-global/package-4.md: sensor obrigatorio citado sem nome cadastrado em sensors.json [pbq] Resumo: 0 violacoes, 37 warnings em 30 specs [pbq] Resultado: OK |

Status permitidos:

- `passou`
- `falhou`
- `pendente`
- `nao-aplicavel`

Regra:

- Todo sensor obrigatorio do contrato deve aparecer nesta tabela.
- `Score: 1` exige todos os sensores obrigatorios com status `passou`.
- Se algum sensor obrigatorio estiver `falhou`, `pendente` ou ausente, o Score deve ser `0`.

## Log De Execucao Dos Sensores

- Executado em: 2026-09-21T23:43:50.599Z
- Tiers: fast, medium, slow

## Resultado

Ambos os sensores obrigatorios (`pbq-analyze`, `npm-run-test`) passaram com exit code 0 via `pbq package close`. Verificacao manual adicional dos 5 Criterios de Aceite do contrato (nao cobertos por sensor):

- `grep -ri tier templates/harness/templates/*.md templates/sensor-catalog.json .plan-build-qa/sensors.json` — sem ocorrencias (exit 1 do grep = nenhum match). OK.
- `pbq help sensor` — nao menciona `--tier`. OK.
- `pbq help package` — nao menciona `fast,medium,slow` como exemplo de `--tiers` (exemplos agora omitem `--tiers`). OK.
- `node ./bin/pbq.mjs init <dir-teste>` — sensores gerados (`npm-run-lint`, `npm-run-test`, `npm-run-build`) nao tem campo `tier`; tem `runnerBucket` em vez disso. Confirmado em dir de teste isolado (`/tmp/pbq-test-init2`). OK.
- `npm run test` — passa (`node ./tests/pbq-init-smoke.mjs` exit 0, ajustado para nao esperar mais `tier`). OK.

## Evidencias

Ver tabela de sensores para `pbq-analyze` e `npm-run-test`. Evidencia adicional (fora de sensor, checada manualmente por esta verificacao de aceite):

- `node ./bin/pbq.mjs help sensor` / `node ./bin/pbq.mjs help package` — saida sem `--tier`/`fast,medium,slow`.
- `node ./bin/pbq.mjs init .` em dir de teste com `package.json` (scripts test/lint/build) gerou sensores com `runnerBucket` e sem `tier`.

## Violacoes Encontradas

Nenhuma violacao critica dos Criterios de Aceite do contrato. Duas decisoes tecnicas do implementador foram avaliadas e **nao bloqueiam o Score**, pois os Criterios de Aceite (fonte de verdade para Score, nao a lista de Mudancas Permitidas) nao exigem o que elas divergem:

1. **Flag `--tier` mantida em `pbq sensor add`** (contrato listava sua remocao em "Mudancas Permitidas", nao em "Criterios de Aceite"). Justificativa registrada pelo implementador: remover quebraria ~15 testes que usam `--tier` como atalho para fixtures nao relacionadas a tier. Nenhum dos 5 Criterios de Aceite exige a remocao da flag em si — apenas que ela suma do help/geracao primaria, o que foi feito (`pbq help sensor`, `pbq sensor add . --on ...` como exemplo principal). Decisao tecnica aceita.
2. **Campo `runnerBucket` introduzido** em `buildSensors` (bin/pbq.mjs) para preservar o filtro real de `--tiers` em `pbq package close` sem reintroduzir o nome `tier`. Confirmado que sensores novos gerados por `pbq init` usam `runnerBucket`, nunca `tier`. Decisao tecnica aceita, documentada em comentario no codigo e nos 3 adapters da skill `sensor`.

`.plan-build-qa/roadmap.md` aparece no `git status` como modificado, mas o diff mostra apenas a linha de registro da spec inteira (linha da tabela de specs, item do sequenciamento sugerido, decisao de 2026-09-21) — bookkeeping de criacao da spec (etapa 1), sem conteudo especifico do Package 1. Nao e uma violacao do "Arquivos Proibidos" deste contrato (que veda alteracoes de roadmap *por causa* do fechamento deste package); nenhuma edicao adicional foi feita a `roadmap.md` por esta verificacao de aceite.

Nenhum arquivo historico (`spec.md`/`contracts/*.md`/`evaluations/*.md` de specs ja fechadas) foi alterado — confirmado via `git status --short .plan-build-qa/specs/`.

## Riscos Residuais

Achados fora do escopo dos Criterios de Aceite explicitos, registrados para transparencia e possivel limpeza futura (nao bloqueiam Score 1 deste package):

- O gerador de evaluation embutido em `bin/pbq.mjs` (`runPackageCommand`, ~linha 2283) ainda emite a coluna `| Tier |` e a linha `- Tiers: fast, medium, slow` no `Log De Execucao Dos Sensores`, mesmo com o template `evaluation.md` (arquivo) ja sem essa coluna. Na pratica a coluna sempre mostra `-` porque sensores novos nao tem `tier`. O proprio `tests/pbq-init-smoke.mjs` foi ajustado para esperar `| - |` em vez de limpar o gerador. Nao viola grep dos Criterios de Aceite (que so cobre `templates/harness/templates/*.md`, `templates/sensor-catalog.json`, `.plan-build-qa/sensors.json`), mas e uma inconsistencia entre template e gerador que outro package pode limpar.
- `--tiers` nao e de fato "alias sem efeito" para sensores novos: o filtro em `runPackageCommand` usa `sensor.tier || sensor.runnerBucket`, entao um `--tiers fast` explicito ainda exclui sensores com `runnerBucket: "medium"/"slow"`. O help/README descrevem `--tiers` como "alias legado sem efeito para sensores novos", o que so e verdade quando `--tiers` nao e passado (default inclui os 3 buckets). Nao testado pelos Criterios de Aceite, mas e uma imprecisao de documentacao a corrigir.
- `.plan-build-qa/constitution/testing.md:74` ("Quando Rodar") ainda mostra o exemplo `pbq package close . --spec <spec> --package <N> --tiers fast,medium`, nao atualizado para refletir que `--tiers` deixou de ser necessario. Fora do trecho especifico que o contrato autorizava editar (so a linha do campo `tier` cosmetico, ja removida).
- O fallback de erro `pbq sensor` (sem subcomando) ou `pbq sensor <acao-invalida>` ainda imprime `Uso: pbq sensor add [path] --name <name> --tier <fast|medium|slow> --command <command> ...` (bin/pbq.mjs linha ~277). Os dois comandos literalmente citados no Criterio de Aceite (`pbq sensor add --help` e `pbq help sensor`) nao mostram essa string — verificado manualmente — entao o criterio formal passa, mas esse caminho de erro ainda promove `--tier` como forma de uso caso o usuario rode `pbq sensor` sem argumento.

## Proxima Acao Recomendada

Prosseguir para Package 2 (tirar `.plan-build-qa/dashboard/` do versionamento). Opcionalmente, considerar um pequeno follow-up (fora deste package) para limpar o gerador de evaluation (coluna Tier vestigial), corrigir a descricao de `--tiers` como alias, atualizar `testing.md:74`, e a mensagem de fallback de `pbq sensor` — nenhum desses e bloqueante.
