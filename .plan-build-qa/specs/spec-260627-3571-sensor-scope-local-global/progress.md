# Progress: spec-025-sensor-scope-local-global

> **Regra de retomada**
> **OBRIGATORIO** manter este arquivo suficiente para outro agente continuar o trabalho sem depender de memoria da sessao anterior.

## Estado Atual

`concluido`

| Etapa | Status |
| --- | --- |
| 1. spec | ok |
| 2. contract (validacao) | ok |
| 3. implement | ok |
| 4. test/qa | ok |
| 5. roadmap | ok |

## Packages Concluidos

- Package 1 - fechado com Score 1 em `evaluations/package-1.md`.
- Package 2 - fechado com Score 1 em `evaluations/package-2.md`.
- Package 3 - fechado com Score 1 em `evaluations/package-3.md`.
- Package 4 - fechado com Score 1 em `evaluations/package-4.md`.

## Package Atual

Package 4 - Docs/templates/skills: atualizar constitution, templates de contrato/evaluation, skills `sensor`, `spec` e `test`, e guia de promocao local -> global (fechado com Score 1).

## Decisoes Tecnicas

- `sensors.json` continua sendo registry global.
- Sensor sem `scope` deve ser tratado como `scope: "global"`.
- Sensor local deve viver no contrato/evaluation do package, com comando e motivo objetivos.
- A execucao completa de sensores locais no `package close` fica para package posterior, para nao misturar com a `spec-021-package-close-contract-driven`.

## Sensores Executados

- 2026-06-29: `node .\bin\pbq.mjs package close . --spec spec-025-sensor-scope-local-global --package 4 --tiers fast,medium` em modo acceptance-check. Resultado: Score 1 em `evaluations/package-4.md`.
  - `npm-run-test`: passou, comando `npm run test`, exit 0.
  - `pbq-analyze`: passou, comando `node ./bin/pbq.mjs analyze .`, exit 0; reportou 0 violacoes e 37 warnings globais.

- 2026-06-29: `node .\bin\pbq.mjs package close . --spec spec-025-sensor-scope-local-global --package 3 --tiers fast,medium` em modo acceptance-check. Resultado: Score 1 em `evaluations/package-3.md`.
  - `npm-run-test`: passou, comando `npm run test`, exit 0.
  - `pbq-analyze`: passou, comando `node ./bin/pbq.mjs analyze .`, exit 0; reportou 0 violacoes e 33 warnings globais.

- 2026-06-28: `node .\bin\pbq.mjs package close . --spec spec-025-sensor-scope-local-global --package 2 --tiers fast,medium` em modo acceptance-check. Resultado: Score 1 em `evaluations/package-2.md`.
  - `npm-run-test`: passou, comando `npm run test`, exit 0.
  - `pbq-analyze`: passou, comando `node ./bin/pbq.mjs analyze .`, exit 0; reportou 0 violacoes e 27 warnings globais.

- 2026-06-28: `pbq package close . --spec spec-025-sensor-scope-local-global --package 1 --tiers "fast,medium"` em modo acceptance-check. Resultado: Score 1 em `evaluations/package-1.md`.
  - `npm-run-test`: passou, comando `npm run test`, exit 0.
  - `pbq-analyze`: passou, comando `node ./bin/pbq.mjs analyze .`, exit 0; reportou 0 violacoes e 28 warnings globais.

## Implementacao

2026-06-29 - Package 4 implementado no escopo do contrato:

- `.plan-build-qa/constitution/testing.md` e `bin/pbq.mjs` (`constitutionTesting(project)`): documentam que `.plan-build-qa/sensors.json` e registry global, que sensor local vive em contrato/evaluation, e que promocao local -> global e decisao explicita.
- `.plan-build-qa/harness/templates/contract.md` e `templates/harness/templates/contract.md`: `## Sensores Obrigatorios` passa a orientar colunas `Sensor`, `Scope`, `Tier`, `Comando` e `Motivo`, com exemplos global/local.
- `.plan-build-qa/harness/templates/evaluation.md` e `templates/harness/templates/evaluation.md`: reforcam que sensor local obrigatorio deve aparecer/passar na evaluation e que promocao local -> global nao e automatica.
- Skills `sensor`, `spec` e `test` nas variantes `.agents`, `.claude` e `templates/adapters`: orientam registry global, contrato local com comando/motivo, contract-check sem exigir registry para local, e enforcement por nome no acceptance-check.
- `tests/pbq-init-smoke.mjs`: asserts comprovam que `pbq init` instala constitution/templates/skills com os marcadores local/global exigidos pelo contrato.

2026-06-29 - Package 3 implementado no escopo do contrato:

- `bin/pbq.mjs`: `pbq sensor add` aceita `--scope global|local|package`, persiste sensores adicionados como `scope: "global"` e rejeita `local`/`package` com orientacao para declarar sensores locais no contrato do package; `sensor list` passa a exibir a coluna de scope; entradas `--from-catalog` continuam globais.
- `bin/pbq.mjs`: `pbq analyze` deixa de exigir cadastro em `sensors.json` para sensor local bem declarado (`scope local/package` + comando), gera violacao objetiva para sensor local sem comando e preserva a violacao de sensor global ausente; enforcement contract/evaluation continua por nome.
- `tests/pbq-init-smoke.mjs`: fixtures isoladas cobrem `sensor add/list --scope`, local bem declarado no analyze, local sem comando, global ausente e evaluation local com status `falhou`.

2026-06-28 - Package 2 implementado no escopo do contrato:

- `bin/pbq.mjs`: `pbq package close` agora le `contracts/package-N.md`, resolve a uniao entre sensores selecionados por tier/evento e sensores obrigatorios do contrato, executa sensores globais obrigatorios fora do filtro, executa sensores locais inline com comando, deduplica por nome e registra pendentes para sensores locais sem comando ou globais ausentes/disabled.
- `tests/pbq-init-smoke.mjs`: fixture isolada cobre AC1-AC8 com packages temporarios: global fora do filtro, local inline com sucesso, local falho, local sem comando, global ausente, deduplicacao, sem secao obrigatoria e garantia de que sensores locais nao sao persistidos em `sensors.json`.

2026-06-28 - Package 1 implementado no escopo do contrato:

- `bin/pbq.mjs`: `readSensors` normaliza `scope` em memoria (`scope` ausente => `global`); parser de `## Sensores Obrigatorios` reconhece colunas `Scope`/`Escopo`, `Tier`, `Comando`/`Command` e `Motivo`/`Reason`; sensor local so e classificado como local valido quando tem escopo local/package e comando nao vazio; dashboard JSON expõe metadados parseados para required sensors.
- `tests/pbq-init-smoke.mjs`: fixture isolada cobre AC1-AC5 via `pbq dashboard --json`, sem executar sensores locais nem alterar o gate `package close`.

## Contract-check

2026-06-29 - Package 4 validado em modo contract-check:

- objetivo e escopo delimitados;
- arquivos permitidos/proibidos explicitos;
- criterios de aceite AC1-AC9 objetivos e verificaveis;
- rollback definido;
- sensores obrigatorios `npm-run-test` e `pbq-analyze` existem em `.plan-build-qa/sensors.json`;
- sem bloqueios objetivos.

2026-06-29 - Package 4 contrato ajustado apos revisao de implementabilidade:

- `bin/pbq.mjs` foi permitido somente para atualizar a funcao geradora `constitutionTesting(project)`, porque `pbq init` instala `constitution/testing.md` a partir dessa funcao e AC1 le o arquivo instalado;
- novo contract-check aprovado, sem bloqueios objetivos.

2026-06-29 - Package 3 validado em modo contract-check:

- objetivo e escopo delimitados;
- arquivos permitidos/proibidos explicitos;
- criterios de aceite AC1-AC10 objetivos e verificaveis;
- rollback definido;
- sensores obrigatorios `npm-run-test` e `pbq-analyze` existem em `.plan-build-qa/sensors.json`;
- sem duvidas abertas.

2026-06-28 - Package 2 validado em modo contract-check:

- objetivo e escopo delimitados;
- arquivos permitidos/proibidos explicitos;
- criterios de aceite AC1-AC10 objetivos e verificaveis;
- rollback definido;
- sensores obrigatorios `npm-run-test` e `pbq-analyze` existem em `.plan-build-qa/sensors.json`;
- sem duvidas abertas.

2026-06-28 - Package 1 validado em modo contract-check:

- objetivo e escopo estao delimitados;
- arquivos permitidos/proibidos estao explicitos;
- criterios de aceite AC1-AC8 sao objetivos;
- rollback definido;
- sensores obrigatorios `npm-run-test` e `pbq-analyze` existem em `.plan-build-qa/sensors.json`;
- sem duvidas abertas.

## Falhas Anteriores

_(nenhuma)_

## Riscos Acumulados

- Package 2 absorveu funcionalmente a parte principal da `spec-021-package-close-contract-driven` ao tornar `package close` orientado pela uniao entre contrato e filtros tier/evento. Ainda resta decidir em roadmap se a spec-021 deve ser concluida, cancelada ou ajustada como follow-up separado.

## Pendencias

_(nenhuma)_

## Contexto Para Retomada

- Motivacao veio do crescimento de sensores em `C:\dti\netview\max`, onde checks globais, builds por cliente, E2E por cliente e regressions especificas ficaram todos no mesmo `sensors.json`.
- A direcao aprovada e separar `global` de `package-local`, sem limpar o MAX antes de evoluir o PBQ.
