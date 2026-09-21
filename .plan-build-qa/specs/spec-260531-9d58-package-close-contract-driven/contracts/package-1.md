# Contract: Package 1 — package close orientado ao contrato

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

1

## Objetivo

Fazer `pbq package close` ler os sensores obrigatórios do contrato `contracts/package-N.md` e executá-los como parte do gate, em união com os sensores selecionados por tier/evento. Score 1 só com todos `passou`. Sensor obrigatório sem comando registrado → `pendente` + Score 0.

## Arquivos Permitidos

- `bin/pbq.mjs` (apenas `runPackageCommand`, `parsePackageCloseArgs`, `executePackageSensors`, `packageEvaluationContent` e helper novo)
- `tests/pbq-init-smoke.mjs`

## Arquivos Proibidos

- Qualquer arquivo fora da lista
- `analyzeHarness`/parsers de analyze (spec-020), skills, constitution, templates (Package 2)
- Modelo de sensores (`on`/tiers), `pbq guard`

## Mudancas Permitidas

1. **`runPackageCommand`**: após montar a lista de sensores selecionados por tier/evento, ler `contracts/package-${packageNumber}.md` (se existir), extrair nomes via `parseContractRequiredSensors` (filtrar `hasName`), e montar a **união** por nome:
   - sensor selecionado por tier/evento → mantém;
   - sensor obrigatório do contrato registrado em `sensors.json` mas fora do filtro → adiciona à execução;
   - sensor obrigatório do contrato sem registro em `sensors.json` → entra como item "não-registrado" (sem comando), para virar linha `pendente`.
   - dedup por `name` (um sensor que é selecionado E obrigatório aparece uma vez).
2. **`executePackageSensors`**: aceitar a lista unida; para item não-registrado, emitir linha `{ status: "pendente", exitCode: "-", evidence: "sensor obrigatório do contrato não registrado em sensors.json" }`. Score 1 exige todas as linhas `passou` (qualquer `falhou`/`pendente` → Score 0).
3. **`packageEvaluationContent`**: coluna `Obrigatorio` = `sim` para os do contrato, `nao` para os apenas-selecionados. (Score continua exigindo todos `passou`.)
4. **Sem contrato ou sem seção `## Sensores Obrigatorios`** → comportamento atual preservado (roda só os selecionados).
5. **Testes**: fixtures cobrindo os ACs abaixo.

## Mudancas Proibidas

- Não remover o filtro tier/evento (é união, não substituição).
- Não alterar `analyze`/skills/constitution (Package 2).
- Não tornar erro fatal o sensor obrigatório não-registrado (deve virar `pendente`).

## Criterios de Aceite

| # | Critério | Verificação |
| --- | --- | --- |
| AC1 | Contrato exige `sensor-x` (registrado `on:["commit"]`, NÃO `on:close`); `package close --tiers medium` inclui e executa `sensor-x` na evaluation | `sensor-x` aparece na tabela da evaluation |
| AC2 | `sensor-x` obrigatório falha → Score 0 | `Score: 0` |
| AC3 | Contrato exige `sensor-z` ausente de `sensors.json` → linha `pendente` + Score 0 | match `pendente` + `Score: 0` |
| AC4 | Contrato sem `## Sensores Obrigatorios` → roda só selecionados (comportamento atual) | evaluation só com selecionados |
| AC5 | Sensor que é selecionado (on:close) E obrigatório no contrato aparece uma única vez (dedup) | uma linha para o nome |
| AC6 | Coluna `Obrigatorio` = `sim` para contrato, `nao` para apenas-selecionado | conteúdo da tabela |
| AC7 | `npm run test` verde | exit 0 |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |

> `pbq-analyze` não é gate aqui (violações pré-existentes de spec-013 no próprio repo).

## Riscos

- Resolver o sensor obrigatório por nome contra `sensors.json` exige leitura adicional em `runPackageCommand`; manter tolerante a `sensors.json` ausente/inválido.

## Rollback

`git revert` do commit do package. Mudança isolada no caminho de `package close`.

## Observabilidade

- Evaluation passa a listar os sensores do contrato; `pbq analyze` (spec-020) deixa de acusar descasamento para packages fechados por esta versão.

## Duvidas Abertas

_(nenhuma)_
