# Evaluation: Package 5

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

- Executado em: 2026-10-03T00:47:39.788Z
- Tiers: fast, medium, slow

## Resultado

Todos os sensores executados passaram.

## Evidencias

O gate `node ./bin/pbq.mjs package close . --spec spec-261002-a91f-agent-skill-priority --package 5` terminou com exit code 0 e Score 1. A tabela registra os dois sensores obrigatorios com comando, exit code e evidencia; `pbq-analyze` encontrou 0 violacoes e 37 warnings em 33 specs.

Revisao do smoke test `tests/pbq-init-smoke.mjs`:

- `init` novo exibe `criado` e exige exatamente quatro linhas de constitution na tabela.
- `init` com `architecture.md` preexistente exibe `preservado` e confirma que seu conteudo nao muda.
- `update` com constitution customizada e sem baseline exibe `preservado para revisao` com os motivos respectivos; o arquivo gerenciado divergente exibe `atualizado` e e atualizado.
- `update` exige exatamente quatro linhas de constitution, uma unica tabela e ausencia da mensagem individual `Constitution preservada para revisao`.
- `init --dry-run` exibe `criaria`; `update --dry-run` exibe `atualizaria` e confirma que constitution e manifest nao mudam.

## Violacoes Encontradas

Nenhuma violacao critica encontrada pelos sensores executados.

## Riscos Residuais

O smoke test verifica a mensagem individual anterior explicitamente no update. A ausencia das demais mensagens individuais foi conferida na revisao de `printConstitutionTable` e dos pontos de chamada de init/update.

## Proxima Acao Recomendada

Atualizar progress.md e roadmap.md se a spec foi concluida.
