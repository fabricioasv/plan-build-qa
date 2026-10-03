# Evaluation: Package 2

Score: 1

## Resumo De Sensores

| Sensor | Tier | Obrigatorio | Status | Comando | Exit Code | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| npm-run-test | - | sim | passou | `npm run test` | 0 | npm notice run pbq-harness@0.8.0 test npm notice run node ./tests/pbq-init-smoke.mjs |
| pbq-analyze | - | sim | passou | `node ./bin/pbq.mjs analyze .` | 0 | ...: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-260627-3571-sensor-scope-local-global/package-4.md: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-260627-3571-sensor-scope-local-global/package-4.md: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-260627-3571-sensor-scope-local-global/package-4.md: sensor obrigatorio citado sem nome cadastrado em sensors.json [pbq] Resumo: 0 violacoes, 37 warnings em 33 specs [pbq] Resultado: OK |

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

- Executado em: 2026-10-02T23:43:03.095Z
- Tiers: fast, medium, slow

## Resultado

Todos os sensores executados passaram.

## Evidencias

O gate `node ./bin/pbq.mjs package close . --spec spec-261002-a91f-agent-skill-priority --package 2` terminou com exit code 0 e Score 1. Ver tabela de sensores para os comandos e resultados obrigatorios.

Revisao dos criterios de aceite em `tests/pbq-init-smoke.mjs`:

- A atualizacao de um comando Cursor customizado grava a referencia gerada no arquivo original e nao cria `.pbq-new`.
- A selecao `claude,codex,cursor` aparece no `manifest.json` original apos o update, sem copia `.pbq-new`.
- O `--dry-run` relata `Updated:` e preserva o comando e o manifest; nao cria `.pbq-new`.
- O update preserva literalmente um comando equivalente apos `trim()`.
- Os conteudos locais de `roadmap.md` e `sensors.json` permanecem identicos apos o update.
- Um comando Cursor customizado continua preservado quando Cursor sai da selecao.

## Violacoes Encontradas

Nenhuma violacao critica encontrada pelos sensores executados.

## Riscos Residuais

`pbq analyze` registrou 37 warnings em 33 specs, sem violacoes. Arquivos gerenciados customizados de agentes selecionados sao sobrescritos por decisao do contrato; recuperacao depende do source control.

## Proxima Acao Recomendada

Registrar o aceite em `progress.md` e concluir o fluxo de roadmap da spec.
