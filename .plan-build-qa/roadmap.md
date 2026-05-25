# Roadmap

Este roadmap acompanha a evolucao do proprio `pbq`.

## Status

Use estes valores:

- `planejado`
- `em andamento`
- `bloqueado`
- `concluido`
- `cancelado`

## Specs

| Spec | Status | Package Atual | Ultima Atualizacao | Evidencia | Proxima Acao |
| --- | --- | --- | --- | --- | --- |
| spec-001-analyze | concluido | 3 | 2026-05-23 | Packages 1, 2 e 3 fechados com Score 1 (evaluations em `.plan-build-qa/specs/spec-001-analyze/evaluations/`). `pbq analyze` cobre presenca/coerencia minima, estados permitidos, package atual divergente, sensores referenciados em sensors.json, resumo com contadores, flag `--strict` e deteccao de `sensors.json` invalido | - |
| spec-002-plan-tasks | planejado | - | 2026-05-23 | Sugestao inspirada nas fases `specify`, `plan`, `tasks`, `implement` do Spec Kit | Adicionar artefatos `plan.md` e `tasks.md` e skills `/plan` e `/tasks` |
| spec-003-checklist | planejado | - | 2026-05-23 | Sugestao inspirada em checklists de qualidade do Spec Kit | Criar `pbq checklist` para gerar checks objetivos por spec/package |
| spec-004-audit-lock | planejado | - | 2026-05-23 | Sugestao inspirada em hashing, lockfile e audit trail do agent-skills | Adicionar `.plan-build-qa/lock.json`, `.plan-build-qa/audit.log`, `pbq audit` e registro de operacoes |
| spec-005-overrides | planejado | - | 2026-05-23 | Sugestao inspirada em overrides/presets do Spec Kit | Criar suporte a `.plan-build-qa/overrides/templates` e `.plan-build-qa/overrides/skills` |
| spec-006-doctor | planejado | - | 2026-05-23 | Necessidade operacional do harness | Criar `pbq doctor` para diagnosticar estrutura, skills, manifest, sensores, specs e `.pbq-new` pendentes |
| spec-007-agent-instructions-pin | planejado | - | 2026-05-23 | Ajuste operacional do harness | Forcar a referencia explicita a `./.plan-build-qa/` em `AGENTS.md` e `CLAUDE.md` durante `init` e `update`, evitando a inclusao solta no final do arquivo |
| spec-008-token-cost-model | planejado | - | 2026-05-23 | Ajuste operacional do harness | Criar um exemplo de spec para estimar consumo de tokens e custo por execucao, com calculo explicito por modelo/plano |
| spec-009-sensor-preflight-evidence | planejado | - | 2026-05-24 | Ajuste operacional do harness. Depende do campo `phase` (before/after) entregue pela spec-017; deve ser executada DEPOIS dela | Consumir o campo `phase` dos sensores para exigir execucao previa (fase `before`) com evidencia antes de mudancas maiores, e gate (fase `after`) no fechamento; focar em cenarios de migracao e validacao documental |
| spec-010-test-finalization-workflow | planejado | - | 2026-05-23 | Ajuste operacional do harness | Criar fluxo para adicionar novos testes unitarios e/ou de integracao no fechamento final do trabalho, com registro objetivo no package |
| spec-011-test-as-independent-gate | concluido | 2 | 2026-05-25 | Packages 1 e 2 fechados com Score 1. P1: skill `test` em dois modos (contract-check/acceptance-check) como subagente de contexto fresco, `implement` delega verificacao, `spec` invoca contract-check, `constitution/testing.md` com pipeline de 5 etapas, quadro de etapas no template de `progress.md`. P2: skills propagadas para `templates/adapters/skills/**` (diff vazio vs `.claude/skills/*`) e `tests/pbq-init-smoke.mjs` alinhado (sem `pbq package close` na skill `implement`). Bypass = `skip test` | - |
| spec-012-spec-creates-all-contracts | planejado | - | 2026-05-23 | Bug operacional observado em 2026-05-23: `/implement` do package-2 da spec-001-analyze travou porque a skill `spec` criou apenas `contracts/package-1.md`, deixando os demais packages declarados na tabela da spec sem contrato. Isso forcou um ciclo extra de `/spec` para destravar o `/implement` | Fazer com que a skill `spec` (e o template/instalador correspondente em `templates/adapters/skills/spec`) crie esqueletos de `contracts/package-N.md` para todos os packages listados na tabela da spec, com placeholders objetivos e sensor list herdada da coluna `Sensores`, evitando que `/implement` seja bloqueado por contrato ausente |
| spec-013-saneamento-harness-pbq | planejado | - | 2026-05-23 | Incoerencias detectadas pelo proprio `pbq analyze .` apos a conclusao de spec-001-analyze: (a) `check-harness-structure` e referenciado como sensor obrigatorio em `contracts/package-1.md`, `contracts/package-2.md` e `contracts/package-3.md` da spec-001-analyze, mas nao esta cadastrado em `.plan-build-qa/sensors.json`; (b) o analyzer marca como violacao a ausencia de pasta para specs em status `planejado`, o que e ruidoso porque specs planejadas legitimamente ainda nao tem artefatos | Decidir entre cadastrar `check-harness-structure` em `sensors.json` ou ajustar os contratos para citar apenas comando solto (warning), e refinar a regra do analyzer para que specs `planejado` sem pasta gerem warning em vez de violacao (ou nao gerem nada). Manter mudanca aditiva sem regredir packages 1-3 da spec-001-analyze |
| spec-014-melhora-deteccao-sensores | concluido | 3 | 2026-05-24 | Packages 1, 2 e 3 fechados com Score 1. Package 1: deteccao ampliada para scripts soltos (.bat/.cmd/.sh/.ps1), Makefile, sonar*. Package 2: `pbq sensor suggest` imprime comandos prontos para candidatos nao cadastrados. Package 3: skill `/sensor` (Claude, Codex, template) com secao "Fluxo recomendado" e exemplos concretos (sonar.bat, scripts/test.sh, Makefile). | - |
| spec-015-skill-analyze | concluido | 1 | 2026-05-24 | Package 1 fechado com Score 1. Skill `/analyze` criada nas tres variantes (Claude, Codex, template), registrada em `ADAPTER_SKILLS`. `pbq init`/`pbq update` agora instala `.claude/skills/analyze/SKILL.md` e `.agents/skills/analyze/SKILL.md` em projetos alvo. | - |
| spec-016-roadmap-parse-tolerante | concluido | 1 | 2026-05-24 | Package 1 fechado com Score 1 (`evaluations/package-1.md`). `parseRoadmapSpecRows` normaliza crases no nome e decoracao/emoji no status; gate final `/^spec-\d+/i` preserva o descarte de linhas de epico/backlog. Testes em `tests/pbq-init-smoke.mjs` cobrem nome entre crases + `✅ concluido`; regressoes (`_nenhuma_`, `fazendo`, `em andamento`) preservadas | - |
| spec-018-parse-closed-packages-robusto | em andamento | 1 | 2026-05-25 | Durante a spec-011, `pbq analyze` reportou falsas violacoes "evaluation ausente para package concluido 0/6" porque `parseClosedPackages` (`bin/pbq.mjs:629`) raspa inteiros soltos da prosa em "Packages Concluidos". Inverso da spec-016: tornar o parser mais restritivo (exigir `package <N>`) | Implementar `contracts/package-1.md`: trocar o regex por `package\s+(\d+)` e cobrir com teste de numeros soltos |
| spec-017-catalogo-de-sensores | em andamento | 1 | 2026-05-24 | Discussao com usuario: catalogo de sensores prontos selecionaveis pela skill `/sensor`, com `add` livre preservado, convite nao-interativo no init/update, e campo `phase` (before/after) no schema. Tiers seguem fast/medium/slow (sem tier `sonar`, decisao B) | Implementar package 1: `templates/sensor-catalog.json`, `pbq sensor catalog`, `pbq sensor add --from-catalog`, convite nao-interativo |

## Sequenciamento Sugerido

1. `spec-001-analyze`
2. `spec-006-doctor`
3. `spec-007-agent-instructions-pin`
4. `spec-003-checklist`
5. `spec-002-plan-tasks`
6. `spec-004-audit-lock`
7. `spec-005-overrides`
8. `spec-008-token-cost-model`
9. `spec-009-sensor-preflight-evidence`
10. `spec-010-test-finalization-workflow`
11. `spec-011-test-as-independent-gate`
12. `spec-012-spec-creates-all-contracts`
13. `spec-013-saneamento-harness-pbq`
14. `spec-014-melhora-deteccao-sensores`
15. `spec-015-skill-analyze`
16. `spec-016-roadmap-parse-tolerante`
17. `spec-017-catalogo-de-sensores`
18. `spec-018-parse-closed-packages-robusto`
19. `spec-009-sensor-preflight-evidence` (depende do campo `phase` da spec-017)

## Decisoes De Roadmap

- 2026-05-23: Priorizar `pbq analyze` como proximo incremento porque reduz falsa completude e valida coerencia entre artefatos existentes.
- 2026-05-23: Manter `pbq doctor` logo depois de `analyze`, pois ele ajuda usuarios a diagnosticar instalacoes reais antes de adicionar novas fases.
- 2026-05-23: Adicionar `spec-011-test-as-independent-gate` para resolver duvida operacional sobre redundancia entre `implement` e `test`. Decisao: manter as tres skills, mas tornar `test` o unico responsavel por verificacao, invocado automaticamente como subagente fresco a partir de `spec` (contract-check) e `implement` (acceptance-check).
- 2026-05-23: Adicionar `spec-012-spec-creates-all-contracts` apos `/implement` ser bloqueado em `spec-001-analyze` por falta de `contracts/package-2.md`. Decisao: a skill `spec` deve materializar esqueletos de todos os packages declarados na tabela da spec ja na criacao, nao apenas o package 1.
- 2026-05-23: Adicionar `spec-013-saneamento-harness-pbq` apos `pbq analyze .` (entregue pela spec-001-analyze) surfar incoerencias reais no proprio repo. A propria entrega da spec-001 expos a divida; o saneamento e o passo logico seguinte.
- 2026-05-23: Adicionar `spec-014-melhora-deteccao-sensores` apos relato do usuario de que `pbq init` ignorou script de teste solto e `sonar.bat`, e que a skill `/sensor` exige cadastro muito manual. Aplicada antecipadamente a decisao de spec-012: contratos dos packages 1, 2 e 3 criados na mesma alteracao para evitar bloqueio futuro do `/implement`.
- 2026-05-24: Adicionar `spec-015-skill-analyze` apos usuario relatar que `/analyze` nao funciona no agente do projeto alvo porque `pbq update` nao instala nenhuma skill correspondente ao subcomando `pbq analyze`.
- 2026-05-24: Adicionar `spec-016-roadmap-parse-tolerante` apos `pbq analyze` falhar em repo alvo com "Nenhuma spec encontrada"/status invalido por causa de nome entre crases e status com emoji. Decisao: tornar o parser tolerante (normalizar crases no nome e decoracao no status) em vez de exigir que o repo alvo abra mao do tracker humano ou da regra de emoji. Escopo restrito aos dois bugs reais confirmados; demais alegacoes do diagnostico descartadas.
- 2026-05-25: Adicionar `spec-018-parse-closed-packages-robusto` apos a spec-011 expor que `parseClosedPackages` raspa inteiros soltos da prosa em "Packages Concluidos", gerando falsas violacoes de evaluation ausente. Decisao: tornar o parser restritivo, exigindo a forma `package <N>` (inverso da spec-016, que afrouxou o parser de roadmap).
- 2026-05-24: Adicionar `spec-017-catalogo-de-sensores` a partir de discussao sobre semear sensores no init/update. Decisoes: (a) catalogo de sensores prontos selecionaveis pela skill `/sensor` (terminologia "catalogo", nao "preset"); (b) `add` livre preservado; (c) interatividade so na skill, `pbq init`/`update`/`sensor` continuam deterministicos (apenas convite em texto); (d) NAO criar tier `sonar` (decisao B) - sensores de sonar entram como slow; (e) campo `phase` (before/after) = preflight vs gate no ciclo do package, ausencia == after. A `spec-009-sensor-preflight-evidence` foi reescrita para consumir `phase` e sera executada depois da spec-017.
