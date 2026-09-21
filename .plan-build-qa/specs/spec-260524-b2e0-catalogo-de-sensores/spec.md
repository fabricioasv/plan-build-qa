# Spec: catalogo-de-sensores

## Objetivo

Permitir que o usuario adicione sensores a partir de um **catalogo de sensores prontos** (curado, versionado no repo do pbq), alem do `add` livre que ja existe. A selecao interativa fica na skill `/sensor`; o binario ganha primitivas nao-interativas. O `init`/`update` permanece determinístico e apenas convida o usuario a abrir o catalogo. Tambem adiciona ao schema de sensor um campo de **fase** (`before`/`after`) indicando se o sensor deve rodar como preflight (antes) e/ou como gate de aceite (depois) no ciclo do package.

## Contexto

Hoje o `pbq` semeia sensores apenas por deteccao no `init` (`buildSensors`), e o `update` nunca toca `sensors.json` (preserva customizacao). Nao ha como o usuario escolher entre sensores prontos comuns (sonar, build .NET, e2e Playwright, lint) sem digitar comando por comando. O `pbq sensor suggest` ja imprime comandos `pbq sensor add` para candidatos detectados, mas nao cobre sensores que exigem configuracao externa (ex: SonarQube com `SONAR_TOKEN`/`SONAR_HOST_URL`), que devem entrar `enabled:false` ate o usuario configurar.

Decisoes ja tomadas com o usuario (2026-05-24):

- Terminologia: "catalogo de sensores" / "sensores prontos". Nao usar "preset".
- A pergunta interativa ("quer adicionar sensores? quais?") mora na skill `/sensor` (agente), nao no binario. `pbq init`/`update` so imprime um convite nao-interativo, para nao quebrar o smoke test nem CI.
- Tiers continuam `fast|medium|slow`. **Nao** criar tier `sonar`. Sensores de sonar do catalogo entram como `slow`. O usuario corrige no proprio repo os sensores que estavam com `"tier":"sonar"` (invalido, ignorado em silencio hoje).
- Campo de fase = fase no ciclo do package (preflight `before` vs gate `after`), nao ordem dentro do tier.
- A `spec-009-sensor-preflight-evidence` sera ajustada para consumir o campo `phase` e executada **depois** desta spec.

## Escopo

- `templates/sensor-catalog.json`: catalogo curado de sensores prontos.
- `pbq sensor catalog [path]`: lista o catalogo (id, nome, tier, fase, requisitos de ambiente), marcando os ja cadastrados.
- `pbq sensor add --from-catalog <id> [path]`: adiciona um sensor do catalogo pelo id, respeitando `enabled`/`phase`/`tier` do catalogo.
- Campo opcional `phase` no schema de `sensors.json` (subconjunto de `["before","after"]`); `pbq sensor add --phase`; `pbq package close --phase` (default `after`, retrocompativel).
- Convite nao-interativo no fim de `init`/`update` apontando para o catalogo / skill `/sensor`.
- Skill `/sensor` (Claude, Codex, template) passa a apresentar o catalogo e orientar a escolha + explicar fase.

## Fora de Escopo

- Criar tier `sonar` ou qualquer tier novo (decisao B do usuario).
- Tornar `pbq init`/`update` interativo (a interatividade fica na skill).
- Implementar o fluxo de preflight em si (isso e da `spec-009`, ajustada e executada depois).
- Detectar automaticamente credenciais ou configurar SonarQube.

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Catalogo (dado + `pbq sensor catalog` + `pbq sensor add --from-catalog`) + convite nao-interativo no fim de init/update | planejado | npm-run-test |
| 2 | Campo `phase` no schema; `pbq sensor add --phase`; `pbq package close --phase` (default after, retrocompativel) | planejado | npm-run-test |
| 3 | Skill `/sensor` interativa: apresenta catalogo, usuario escolhe, adiciona via --from-catalog, documenta phase (Claude/Codex/template) | planejado | npm-run-test |

## Riscos

- Quebrar determinismo de `init`/`update`: mitigado mantendo qualquer pergunta fora do binario; o convite e texto puro.
- Campo `phase` regredir `package close`: mitigado tratando ausencia de `phase` como `["after"]` (gate), preservando o comportamento atual.
- Catalogo virar lista gigante e desatualizada: mitigado mantendo um conjunto pequeno e curado, com `requiresEnv` explicito.

## Sensores Esperados

- `npm-run-test` (medium): `npm run test` cobre o smoke; novos casos validam catalog/add --from-catalog/phase sem prompts.

## Criterios de Conclusao

- `pbq sensor catalog .` lista o catalogo e marca cadastrados; `pbq sensor add --from-catalog <id> .` adiciona o sensor com `enabled`/`phase`/`tier` corretos.
- Sensores aceitam `phase` opcional; `pbq package close` sem `--phase` roda como hoje (sensores com `phase` ausente ou contendo `after`); `--phase before` roda so os de preflight.
- `init`/`update` continuam exit 0 sem prompt; imprimem convite ao catalogo.
- Skill `/sensor` (3 variantes) documenta catalogo e fase.
- `npm run test` passa com novos casos. Evaluations dos 3 packages com Score 1.
