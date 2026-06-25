# Contract: Package 1 — Schema v2, captura de saída e migração

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

1

## Objetivo

Implementar o schema v2 de sensores (campo `on`, `tier` cosmético, `phase` removido do schema ativo), capturar stdout/stderr reais na coluna Evidência das evaluations, e providenciar migração automática v1→v2 em `pbq update`.

## Arquivos Permitidos

- `bin/pbq.mjs` — único arquivo de produção modificável
- `tests/pbq-init-smoke.mjs` — testes unitários existentes (adicionar casos, não remover)
- `.plan-build-qa/sensors.json` — registrar sensor `pbq-analyze`

## Arquivos Proibidos

- Qualquer arquivo fora da lista acima
- Skills, templates, constitution, OVERVIEW (escopo do Package 3)
- `package.json`, `package-lock.json`

## Mudancas Permitidas

1. **`isSensorEligibleForPhase` (:327) → `isSensorEligibleForEvent(sensor, event)`**: sensor elegível se `sensor.on` (ou default `["close"]`) inclui o evento solicitado.
2. **`parseSensorAddArgs` (:290)**: aceitar `--on <gatilhos>` (csv: `edit,commit,close,manual`). Manter `--tier` e `--phase` como deprecated (mapeados para `on` automaticamente).
3. **`parsePhaseOption` (:321) → `parseOnOption`**: parseia csv de gatilhos, valida valores permitidos.
4. **`executePackageSensors` (:892-936) → extrair `runSensor(root, sensor)`**: executar com `spawnSync`; incluir últimos ~500 chars de `stdout`+`stderr` (sanitizados: pipes escapados, quebras de linha → espaço) na coluna Evidência em vez de `"Executado em <timestamp>"`.
5. **`writeSensors` (:347) / schema**: bump `version` de `1` para `2`; remover `phase` ao gravar; `tier` gravado como cosmético quando informado.
6. **`runUpdateCommand` (:737) + `updateManagedFile` (:788)**: antes de gravar `sensors.json` atualizado, migrar sensores v1→v2 (idempotente):
   - `fast → on:["commit","close"]`
   - `medium → on:["close"]`
   - `slow → on:["close"]`
   - `phase:["before"] ou phase:["before","after"]` → acrescenta `"edit"` em `on`
   - Preserva `enabled`, `requiresEnv`, `tier` (cosmético)
7. **`buildSensors` (:1632)**, **`runSensorAddFromCatalog` (:238)**, **`sensor suggest/list/catalog` (:191-233)**: emitir `on` em vez de `phase` na saída.
8. **`runPackageCommand` (:841)**: usar `isSensorEligibleForEvent(sensor, "close")` em vez de `isSensorEligibleForPhase`.
9. **Registrar `pbq-analyze`** via `pbq sensor add . --name pbq-analyze --tier fast --on edit,close --command "node ./bin/pbq.mjs analyze ." --reason "Validacao de coerencia do harness"`.
10. **Testes**: adicionar casos em `tests/pbq-init-smoke.mjs` cobrindo: sensor sem `on` default para `close`; migração v1→v2; captura de saída (mock de spawnSync).

## Mudancas Proibidas

- Não alterar comportamento de `pbq package close --tiers` (filtro por tier cosmético pode ser mantido se não quebrar, mas não é obrigatório neste package).
- Não implementar `pbq guard` (Package 2).
- Não alterar skills, constitution, templates, OVERVIEW (Package 3).
- Não remover aliases `run-fast.ps1`/`run-medium.ps1`/`run-slow.ps1`.
- Não criar novos comandos além dos listados.

## Criterios de Aceite

| # | Critério | Verificação |
| --- | --- | --- |
| AC1 | `pbq sensor add . --name x --on commit,close --command "echo ok"` cria sensor com `on:["commit","close"]` em sensors.json | `cat .plan-build-qa/sensors.json` mostra campo `on` |
| AC2 | `pbq sensor add . --name y --tier medium --command "echo ok"` (sem `--on`) cria sensor com `on:["close"]` | campo `on` presente, `tier` presente como cosmético |
| AC3 | `pbq package close` filtra sensores por `on` incluindo `"close"`; sensores sem `on` são incluídos | evaluation gerada tem todos os sensores esperados |
| AC4 | Coluna Evidência na evaluation gerada contém trecho do stdout real (não apenas timestamp) | string diferente de `"Executado em ..."` na coluna Evidência |
| AC5 | `pbq update` em repo com `sensors.json` v1 (só `tier`) migra para v2 com `on` correto e `version:2` | sensors.json migrado preserva `enabled`/`requiresEnv` |
| AC6 | `npm run test` verde após as mudanças | exit 0 |
| AC7 | `node ./bin/pbq.mjs analyze .` sem violations | `[pbq] Resultado: OK` |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |

> `pbq-analyze` é registrado neste package (pré-condição para Package 2+3) mas não é gate obrigatório aqui:
> o repositório tem violações pré-existentes de spec-013 scope (`check-harness-structure` não cadastrado,
> specs `planejado` sem pasta) que fariam o sensor falhar sem relação com Package 1. Verificação manual
> confirma que nenhuma violação NOVA foi introduzida por este package.

## Riscos

- Regex/parse de `phase` legado pode interagir com outros campos — testar com fixtures.
- `spawnSync` já captura `stdout`/`stderr` como Buffer; verificar encoding (`utf8`) antes de truncar.

## Rollback

`git revert` dos commits do package. `sensors.json` pode ser restaurado do git. Sem mudanças de schema de arquivo persistente não-versionado.

## Observabilidade

- `pbq sensor list .` deve exibir campo `on` após a mudança.
- Evaluation gerada deve ter Evidência não-vazia com conteúdo do sensor.

## Duvidas Abertas

_(nenhuma)_
