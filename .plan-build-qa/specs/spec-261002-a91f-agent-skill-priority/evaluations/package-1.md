# Evaluation: Package 1

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

- Executado em: 2026-10-02T23:22:58.366Z
- Tiers: fast, medium, slow

## Resultado

Todos os sensores executados passaram.

## Evidencias

O gate `node ./bin/pbq.mjs package close . --spec spec-261002-a91f-agent-skill-priority --package 1` terminou com exit code 0 e Score 1. A tabela registra os dois sensores obrigatorios com exit code 0.

O smoke test exercita `init` e `update` para as sete selecoes nao vazias de Claude, Codex e Cursor: tres agentes isolados, tres pares e o trio. Em cada selecao, verifica conteudo integral no agente prioritario, referencia nos secundarios e presenca no manifest. Tambem verifica que `update` preserva conteudo equivalente com whitespace nas extremidades sem criar `.pbq-new` e preserva comando Cursor customizado na transicao.

## Violacoes Encontradas

Nenhuma violacao critica encontrada pelos sensores executados.

## Riscos Residuais

Arquivos de agente anteriores sem controle do manifest continuam fora do escopo da remocao automatica e devem ser preservados. `pbq-analyze` registrou 37 warnings em 33 specs, sem violacoes.

## Proxima Acao Recomendada

Atualizar progress.md e roadmap.md se a spec foi concluida.
