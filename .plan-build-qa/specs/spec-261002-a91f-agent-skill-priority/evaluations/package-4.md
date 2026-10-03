# Evaluation: Package 4

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

- Executado em: 2026-10-03T00:27:48.492Z
- Tiers: fast, medium, slow

## Resultado

Todos os sensores executados passaram.

## Evidencias

Gate: `node ./bin/pbq.mjs package close . --spec spec-261002-a91f-agent-skill-priority --package 4` terminou com exit code 0 e Score 1. Ambos os sensores globais obrigatorios constam em `.plan-build-qa/sensors.json` com gatilho `close` e passaram com exit code 0 (tabela acima).

Revisao independente de `tests/pbq-init-smoke.mjs` e `bin/pbq.mjs` confirmou os criterios do contrato:

| Criterio | Evidencia |
| --- | --- |
| 1. Customizada preservada | Fixture altera `architecture.md`, compara o conteudo depois do update, exige resumo de revisao e ausencia de `.pbq-new`. |
| 2. Arquivo gerenciado atualizado | Fixture registra no manifest o hash do conteudo antigo de `testing.md` e confirma update direto. |
| 3. Sem hash confiavel | Fixture remove a entrada de `operations.md` do manifest, confirma preservacao do conteudo e resumo de revisao. |
| 4. `--force` e `--dry-run` | Fixture confirma que dry-run nao altera constitution nem manifest, e que force substitui os dois arquivos customizados. |
| 5. Hashes no manifest | Fixture confirma hash anterior para `architecture.md`, ausencia de baseline inventado para `operations.md` e novos hashes para arquivos atualizados. |
| 6. Outros gerenciados | Fixture de update direto confirma sobrescrita da skill/comando, manifest atualizado e ausencia de `.pbq-new`; casos anteriores cobrem a ordem dos agentes. |

O smoke test tambem cobre constitution equivalente apos `trim()` sem reescrita. `pbq-analyze` relatou 0 violacoes e 37 warnings em 33 specs.

## Violacoes Encontradas

Nenhuma violacao critica encontrada pelos sensores executados.

## Riscos Residuais

A avaliacao semantica de regras locais preservadas continua manual. Os 37 warnings de `pbq-analyze` nao bloqueiam o gate e incluem avisos de specs historicas.

## Proxima Acao Recomendada

Sincronizar roadmap e estado final da spec.
