# Constitution: Testing

## Estrategia

> **Regra de bloqueio**
> **NUNCA** declare uma mudanca concluida sem evidencia dos sensores obrigatorios.

- Sensores computacionais valem mais que julgamento subjetivo do agente.
- Todo package deve listar sensores obrigatorios antes da implementacao.
- Se um sensor nao puder rodar, registre motivo, evidencia e risco residual em `progress.md` e na evaluation.
- Sensores cadastrados ficam em `.plan-build-qa/sensors.json`.

## Modelo de Gatilho-por-Evento (campo `on`)

Cada sensor declara **quando** deve rodar via o campo `on` (array de gatilhos):

- **`edit`** — roda ao editar arquivos (hook PostToolUse); reservado para checks rapidos e read-only.
- **`commit`** — roda no pre-commit (hooks advisory); lint/typecheck/unit tests.
- **`close`** — roda no gate de aceite `pbq package close`; todos os sensores de validacao.
- **`manual`** — so sob invocacao explicita.

Exemplo de sensor:
```json
{ "name": "unit-tests", "on": ["commit","close"], "command": "npm test", ... }
```

O campo `tier` (fast/medium/slow) e **cosmético** — rotulo de custo para listagem.
Migracao automatica v1→v2: `fast → commit,close`; `medium|slow → close`.

## Hooks Advisory vs Gate Bloqueante

Os hooks (`pbq guard --event commit` no pre-commit, `pbq guard --event edit` no PostToolUse) sao
**early-warning nao-bloqueantes por default**. Eles surfam problemas cedo mas nao bloqueiam o fluxo.

O gate bloqueante autoritativo e o `pbq package close` (event `close`). Nenhuma etapa avanca com
sensor obrigatorio `falhou` ou `pendente` no gate.

### Flag Enforcement por-spec

A linha `Enforcement: blocking` em `spec.md` torna os hooks bloqueantes para aquela spec:
```
Enforcement: blocking   # hooks que falham bloqueiam (exit 1)
Enforcement: advisory   # default — hooks sempre exit 0
```

Regras:
- Se 0 ou >1 specs `em andamento`, hooks sao sempre advisory (seguro por default).
- `pbq guard` le o roadmap, resolve a spec ativa, e aplica a flag.

## Verificacao Independente

O trabalho segue um pipeline de 5 etapas distintas:

1. **spec** - `spec.md` criada/atualizada.
2. **contract (validacao)** - contrato criado e validado pela skill `test` em modo `contract-check`.
3. **implement** - codigo escrito contra o contrato. `implement` **nao** roda sensores.
4. **test/qa** - skill `test` em modo `acceptance-check` valida o contrato sobre o codigo e roda os sensores obrigatorios.
5. **roadmap** - status/evidencia atualizados.

Regras:

- A skill `test` e o **unico ponto de verificacao** do harness. `implement` (etapa 3) e `test/qa` (etapa 4) sao etapas separadas.
- Quando acionada automaticamente a partir de `spec` (etapa 2) ou `implement` (etapa 4), `test` roda como **subagente de contexto fresco**, carregando spec, contrato e numero do package do disco, sem herdar suposicoes de quem implementou.
- A verificacao e **bloqueante**: nenhuma etapa avanca com sensor obrigatorio `falhou` ou `pendente`.
- O bypass manual (`skip test`) e raro, deve ser documentado em `progress.md`, e nunca conta como gate aprovado.

## Quando Rodar

- Hooks (early-warning): `pbq guard --event commit` no pre-commit, `pbq guard --event edit` no PostToolUse.
- Gate de package: `pbq package close . --spec <spec> --package <N> --tiers fast,medium`.
- Runners diretos (deprecated, use pbq guard): `.plan-build-qa/harness/scripts/run-commit.ps1` ou `.sh`.

## Criterio Minimo de Validacao

- Todos os sensores obrigatorios do contrato passaram.
- Falhas conhecidas foram registradas com evidencia.
- Nenhum teste foi removido, ignorado ou relaxado sem justificativa no contrato.
- A evaluation do package recebeu Score 1 apenas se nao houver violacao critica e nenhum sensor obrigatorio pendente.

## Testes Pendentes ou Impossiveis

- Nao declare sucesso pleno com sensor pendente.
- Marque Score 0 quando um sensor obrigatorio nao executou.
- Transforme pendencias recorrentes em sensores computacionais ou regras do harness.
