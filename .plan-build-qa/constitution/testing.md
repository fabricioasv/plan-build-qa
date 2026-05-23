# Constitution: Testing

## Estrategia

> **Regra de bloqueio**
> **NUNCA** declare uma mudanca concluida sem evidencia dos sensores obrigatorios.

- Sensores computacionais valem mais que julgamento subjetivo do agente.
- Todo package deve listar sensores obrigatorios antes da implementacao.
- Se um sensor nao puder rodar, registre motivo, evidencia e risco residual em `progress.md` e na evaluation.
- Sensores cadastrados ficam em `.plan-build-qa/sensors.json`.

## Sensores Detectados

Fast:

- Placeholder: nenhum comando rapido detectado.

Medium:

- `npm run test` - package.json script 'test'

Slow:

- Placeholder: nenhum comando lento detectado.

## Quando Rodar

- Mudanca pequena: `.plan-build-qa/harness/scripts/run-fast.ps1` ou `.plan-build-qa/harness/scripts/run-fast.sh`.
- Mudanca media: fast + `.plan-build-qa/harness/scripts/run-medium.ps1` ou `.plan-build-qa/harness/scripts/run-medium.sh`.
- Mudanca grande: fast + medium + slow quando houver sensor real aplicavel.

## Criterio Minimo de Validacao

- Todos os sensores obrigatorios do contrato passaram.
- Falhas conhecidas foram registradas com evidencia.
- Nenhum teste foi removido, ignorado ou relaxado sem justificativa no contrato.
- A evaluation do package recebeu Score 1 apenas se nao houver violacao critica e nenhum sensor obrigatorio pendente.

## Testes Pendentes ou Impossiveis

- Nao declare sucesso pleno com sensor pendente.
- Marque Score 0 quando um sensor obrigatorio nao executou.
- Transforme pendencias recorrentes em sensores computacionais ou regras do harness.
