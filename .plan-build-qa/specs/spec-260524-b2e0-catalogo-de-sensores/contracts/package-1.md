# Contract: Package 1

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

1 - Catalogo de sensores prontos: dado + primitivas de CLI + convite nao-interativo.

## Objetivo

Criar um catalogo curado de sensores prontos como dado versionado, e dois comandos nao-interativos para consumi-lo (`pbq sensor catalog`, `pbq sensor add --from-catalog <id>`). No fim de `init`/`update`, imprimir um convite (texto puro) apontando para o catalogo. Sem nenhuma pergunta interativa no binario.

## Arquivos Permitidos

- `templates/sensor-catalog.json` (novo: o catalogo)
- `bin/pbq.mjs` (novo subcomando `sensor catalog`; flag `--from-catalog` em `sensor add`; helper `loadSensorCatalog`; linha de convite no fim de `runInitCommand`/`runUpdateCommand` ou seus summaries; texto de help do `sensor`)
- `tests/pbq-init-smoke.mjs` (novos casos)
- `.plan-build-qa/specs/spec-017-catalogo-de-sensores/progress.md`
- `.plan-build-qa/specs/spec-017-catalogo-de-sensores/evaluations/package-1.md`
- `.plan-build-qa/roadmap.md`

## Arquivos Proibidos

- `templates/adapters/skills/**` (skill `/sensor` e o package 3)
- Schema de fase em `sensors.json` (campo `phase` e o package 2)
- Qualquer template fora de `sensor-catalog.json`

## Mudancas Permitidas

- Definir o schema do catalogo em `templates/sensor-catalog.json`. Cada entrada: `id`, `name`, `tier` (fast|medium|slow), `command`, `reason`, `enabled` (boolean), `requiresEnv` (array de nomes de env vars). Conjunto inicial pequeno e curado: ao menos `sonar-dotnet` (slow, enabled:false, requiresEnv SONAR_TOKEN/SONAR_HOST_URL), `sonar-js` (slow, enabled:false), `dotnet-build` (medium), `dotnet-test` (medium), `eslint` (fast), `playwright-e2e` (slow, enabled:false).
- `pbq sensor catalog [path]`: imprime as entradas do catalogo (id, tier, enabled, requiresEnv, reason) e marca quais ja existem em `sensors.json` (por `name`). So leitura.
- `pbq sensor add --from-catalog <id> [path]`: copia a entrada do catalogo para `sensors.json` com `source:"catalog"`, respeitando `tier`/`enabled` do catalogo; regenera runners. Reaproveitar `writeSensors`/`regenerateSensorScripts`. Conflito de nome existente: mesma regra do `add` atual (substitui).
- Convite no fim de `init` e `update`: linha tipo `[pbq] N sensores no catalogo. Rode 'pbq sensor catalog' ou /sensor para adicionar.` Texto puro, sem prompt.
- Atualizar o help do `sensor`.

## Mudancas Proibidas

**NUNCA** introduzir prompt interativo, leitura de stdin, ou qualquer pausa em `pbq init`/`update`/`sensor`. **NUNCA** alterar exit codes existentes. Nao adicionar o campo `phase` aqui. Nao mexer na skill.

## Criterios de Aceite

1. `pbq sensor catalog .` (apos init) sai com status 0 e lista as entradas do catalogo, marcando as ja cadastradas.
2. `pbq sensor add --from-catalog sonar-dotnet .` adiciona o sensor a `sensors.json` com `tier:"slow"`, `enabled:false`, `source:"catalog"`, e regenera os runners sem incluir o comando do sensor disabled.
3. `pbq init`/`pbq update` continuam exit 0 **sem prompt** e a saida contem a linha de convite ao catalogo.
4. Regressao: todos os casos atuais de `tests/pbq-init-smoke.mjs` continuam verdes (init/update/analyze/sensor add/suggest).
5. `npm run test` sai com status 0.

## Sensores Obrigatorios

- medium | `npm-run-test` | `npm run test`

## Riscos

- JSON do catalogo invalido quebrando o comando: mitigado com parse defensivo e teste cobrindo `sensor catalog`.
- Convite poluir saida esperada por testes existentes: mitigado adicionando linha nova sem alterar as mensagens ja asseridas.

## Rollback

`git checkout -- bin/pbq.mjs tests/pbq-init-smoke.mjs`, remover `templates/sensor-catalog.json` e a pasta da spec. Mudanca aditiva; nenhum comportamento existente depende do catalogo.

## Observabilidade

Saida de `pbq sensor catalog`, conteudo de `sensors.json` apos `--from-catalog`, e resultado de `npm run test`.

## Duvidas Abertas

Nenhuma.
