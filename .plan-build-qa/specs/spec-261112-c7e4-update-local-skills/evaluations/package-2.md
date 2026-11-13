# Evaluation: Package 2

Score: 1

## Resumo De Sensores

| Sensor | Tier | Obrigatorio | Status | Comando | Exit Code | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| npm-run-test | - | sim | passou | `npm run test` | 0 | npm notice run pbq-harness@0.8.0 test npm notice run node ./tests/pbq-init-smoke.mjs |
| pbq-analyze | - | sim | passou | `node ./bin/pbq.mjs analyze .` | 0 | ...: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-260627-3571-sensor-scope-local-global/package-4.md: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-260627-3571-sensor-scope-local-global/package-4.md: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-260627-3571-sensor-scope-local-global/package-4.md: sensor obrigatorio citado sem nome cadastrado em sensors.json [pbq] Resumo: 0 violacoes, 37 warnings em 36 specs [pbq] Resultado: OK |

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

- Executado em: 2026-11-13T01:47:24.135Z
- Tiers: fast, medium, slow

## Resultado

Todos os sensores executados passaram.

## Evidencias

Ver tabela de sensores.

## Violacoes Encontradas

Nenhuma violacao critica encontrada pelos sensores executados.

## Riscos Residuais

Registrar manualmente riscos que os sensores nao cobrem.

## Proxima Acao Recomendada

Atualizar progress.md e roadmap.md se a spec foi concluida.

## Revisao Independente Do Package 2

Acceptance-check executado por agente independente, com contrato e constitution/testing.md carregados do disco. Gate: node ./bin/pbq.mjs package close . --spec spec-261112-c7e4-update-local-skills --package 2 (exit 0).

Revisao de bin/pbq.mjs e tests/pbq-init-smoke.mjs confirma planejamento antes de escritas em init/update, selecao da primeira copia existente pela prioridade dos agentes, resolucao apenas da fonte escolhida e referencias diretas nos secundarios. Recursos sao lidos somente da fonte resolvida; recursos secundarios divergentes/exclusivos permanecem intocados. Referencias principais quebradas/circulares bloqueiam o planejamento; referencias secundarias antigas nao sao resolvidas.

A bateria passou com merge-maxcore divergente nas tres ordens principais para init e update, sem --force, incluindo dry-run e repeticao sem alterar mtime dos arquivos locais. Cobertura adicional verifica fallback, troca do principal, recurso binario, referencias secundarias quebradas/circulares, fonte principal invalida e --no-agent-integration.

pbq-analyze reportou 0 violacoes e 37 warnings em 36 specs; warnings nao bloquearam o sensor. Nenhuma falha nova encontrada na revisao. Nao houve execucao no MAX nem alteracao de codigo nesta verificacao; mudancas anteriores de dashboard/backlog foram preservadas.
