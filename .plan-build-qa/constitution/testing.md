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

## Verificacao Independente

O trabalho segue um pipeline de 5 etapas distintas:

1. **spec** - `spec.md` criada/atualizada.
2. **contract (validacao)** - contrato criado e validado pela skill `test` em modo `contract-check`.
3. **implement** - codigo escrito contra o contrato. `implement` **nao** roda sensores.
4. **test/qa** - skill `test` em modo `acceptance-check` valida o contrato sobre o codigo e roda os sensores obrigatorios.
5. **roadmap** - status/evidencia atualizados.

Regras:

- A skill `test` e o **unico ponto de verificacao** do harness. `implement` (etapa 3) e `test/qa` (etapa 4) sao etapas separadas.
- Quando acionada automaticamente a partir de `spec` (etapa 2) ou `implement` (etapa 4), `test` roda como **subagente de contexto fresco**, carregando spec, contrato e numero do package do disco, sem herdar suposicoes de quem implementou. A independencia do verificador e o motivo de manter as etapas separadas.
- A verificacao e **bloqueante**: nenhuma etapa avanca com sensor obrigatorio `falhou` ou `pendente`.
- O bypass manual (`skip test`) e raro, deve ser documentado em `progress.md`, e nunca conta como gate aprovado.
- O custo adicional de tokens/latencia do subagente fresco e aceito como preco da independencia.
- O quadro de etapas em `Estado Atual` do `progress.md` registra o status de cada uma das 5 etapas.

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
