# Evaluation: Package 3

Score: 1

## Resumo De Sensores

| Sensor | Tier | Obrigatorio | Status | Comando | Exit Code | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| npm-run-test | - | sim | passou | `npm run test` | 0 | npm notice run pbq-harness@0.8.0 test npm notice run node ./tests/pbq-init-smoke.mjs |
| pbq-analyze | - | sim | passou | `node ./bin/pbq.mjs analyze .` | 0 | ...: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-260627-3571-sensor-scope-local-global/package-4.md: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-260627-3571-sensor-scope-local-global/package-4.md: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-260627-3571-sensor-scope-local-global/package-4.md: sensor obrigatorio citado sem nome cadastrado em sensors.json [pbq] Resumo: 0 violacoes, 39 warnings em 33 specs [pbq] Resultado: OK |

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

- Executado em: 2026-10-03T00:07:33.530Z
- Tiers: fast, medium, slow

## Resultado

Todos os sensores executados passaram.

## Evidencias

O smoke test em `tests/pbq-init-smoke.mjs` percorre as 15 selecoes ordenadas possiveis de um a tres agentes. Para cada selecao, compara o artefato principal com o conteudo canonico, verifica referencias diretas dos secundarios e confirma a ordem de `manifest.agents` no init e no update. No update, verifica a ausencia de `.pbq-new` para os tres caminhos, inclusive nas seis permutacoes que mudam somente a ordem do conjunto completo. As referencias Claude/Codex sao verificadas quanto ao frontmatter. Ambos os sensores obrigatorios passaram com exit code 0, como registrado na tabela.

## Violacoes Encontradas

Nenhuma violacao critica encontrada pelos sensores executados.

## Riscos Residuais

O smoke test usa a skill `spec` como amostra dos artefatos gerados; as demais skills compartilham o gerador. O `pbq-analyze` registrou 39 warnings em 33 specs, com 0 violacoes.

## Proxima Acao Recomendada

Atualizar o progresso e o roadmap para registrar a conclusao do Package 3.
