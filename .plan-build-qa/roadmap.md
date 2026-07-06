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
| spec-013-saneamento-harness-pbq | concluido | 1 | 2026-06-25 | Package 1 fechado com Score 1. `pbq-analyze` voltou a passar com 0 violacoes; specs planejadas sem pasta viram warning, `check-harness-structure` legado deixou de fingir sensor cadastrado, Score 0 aberto nao bloqueia reexecucao, e spec-022 recebeu `contracts/package-6.md`. | - |
| spec-014-melhora-deteccao-sensores | concluido | 3 | 2026-05-24 | Packages 1, 2 e 3 fechados com Score 1. Package 1: deteccao ampliada para scripts soltos (.bat/.cmd/.sh/.ps1), Makefile, sonar*. Package 2: `pbq sensor suggest` imprime comandos prontos para candidatos nao cadastrados. Package 3: skill `/sensor` (Claude, Codex, template) com secao "Fluxo recomendado" e exemplos concretos (sonar.bat, scripts/test.sh, Makefile). | - |
| spec-015-skill-analyze | concluido | 1 | 2026-05-24 | Package 1 fechado com Score 1. Skill `/analyze` criada nas tres variantes (Claude, Codex, template), registrada em `ADAPTER_SKILLS`. `pbq init`/`pbq update` agora instala `.claude/skills/analyze/SKILL.md` e `.agents/skills/analyze/SKILL.md` em projetos alvo. | - |
| spec-016-roadmap-parse-tolerante | concluido | 1 | 2026-05-24 | Package 1 fechado com Score 1 (`evaluations/package-1.md`). `parseRoadmapSpecRows` normaliza crases no nome e decoracao/emoji no status; gate final `/^spec-\d+/i` preserva o descarte de linhas de epico/backlog. Testes em `tests/pbq-init-smoke.mjs` cobrem nome entre crases + `✅ concluido`; regressoes (`_nenhuma_`, `fazendo`, `em andamento`) preservadas | - |
| spec-018-parse-closed-packages-robusto | concluido | 1 | 2026-05-25 | Package 1 fechado com Score 1 (`evaluations/package-1.md`). `parseClosedPackages` passou a usar `/package\s+(\d+)/gi` (so a forma explicita), eliminando falsas violacoes de "evaluation ausente" por inteiros soltos na prosa (`exit 0`, `AC 1-6`). Teste `pbq-analyze-closed-prose` cobre o caso; regressoes (`Nenhum.`, `Package 1`/`Package 2`) preservadas | - |
| spec-017-catalogo-de-sensores | concluido | 3 | 2026-05-25 | Packages 1, 2 e 3 fechados com Score 1. P1: `sensor-catalog.json`, `pbq sensor catalog`, `--from-catalog`, convite no init/update. P2: campo `phase` (before/after) em sensores; `--phase` em `sensor add` e `package close` (default after). P3: skill `/sensor` reescrita com fluxo catalogo + phase + exemplos concretos. | - |
| spec-019-modelo-gatilho-eventos | concluido | 3 | 2026-05-30 | Packages 1, 2 e 3 fechados com Score 1. P1: schema v2 (`on`), captura de saida real nos sensores, migracao v1→v2. P2: `pbq guard` (advisory/blocking), `pbq hooks`, merge PostToolUse em settings.json. P3: constitution, skills, templates, OVERVIEW, runners por evento (`run-commit`, `run-close`). | - |
| spec-021-package-close-contract-driven | em andamento | 1 | 2026-05-31 | Follow-up da spec-020: `pbq package close` passa a ler os sensores obrigatórios do contrato e exigi-los no gate (união com os selecionados por tier/evento), fechando o loop que o analyze hoje só detecta. | Implementar Package 1 |
| spec-022-dashboard-visual-status | concluido | 14 | 2026-06-19 | Packages 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 e 14 fechados com Score 1. P1: `pbq dashboard --json` com schema deterministico, spec do roadmap sem pasta materializada e escrita de `status.json`. P2: snapshot HTML estatico com kanban, fluxo por spec/package e integridade em `.plan-build-qa/dashboard/index.html`. P3: `--serve`, `--watch`, `--port` e README com fluxo de snapshot e modo ao vivo. P4: grade full-width tipo gantt por spec com contagem de packages/evaluations e marcadores de etapas concluidas. P5: refinamento da grade principal com fonte menor, sem kanban, colunas de integridade/status e simbolos simplificados. P6: motivo explicito da integridade no lugar de `materialized` para specs `warning`/`critical`. P7: legenda da grade com explicacao de cores/simbolos e marcador `SOON` para etapas pendentes. P8: `Fluxo por Spec` convertido para grade horizontal full-width, uma linha por spec, com packages compactos. P9: execucao e fluxo consolidados em uma unica grade full-width, com `Fluxo Packages` na mesma linha da spec. P10: rollback visual do P9 e reincorporacao do fluxo como colapso por spec na grade principal. P11: colapso movido para uma linha abaixo de cada spec, preservando a linha principal limpa. P12: filtros por texto, status e integridade aplicados sobre a grade e a linha de detalhe. P13: ordenador client-side com default `mais atual -> mais antiga`, usando `Ultima Atualizacao` do roadmap e fallback deterministico por spec. P14: sessao `PBQ Dashboard` ampliada com contadores gerais por status e integridade. | - |
| spec-020-analyze-package-matrix | concluido | 2 | 2026-05-31 | Packages 1 e 2 fechados com Score 1. P1: `analyzePackageMatrix` cruza tabela ∪ contracts ∪ evaluations — numeração integer-only (proibe sub-packages), buracos na sequência, evaluation órfã, materializado-fora-da-tabela (tolera cauda `N+`), Score 0 em fechado, declarado-sem-contract (warning). Bug corrigido: parser de seção ancorado em header exato. P2: enforcement — sensor obrigatório do contract deve aparecer `passou` na evaluation; `parseContractRequiredSensors` estendido p/ tabelas; skill analyze atualizada. Validado contra netview/max spec-013 (pega sub-packages 1.1/1.2). | - |
| spec-023-bug-command | concluido | 1 | 2026-06-25 | Package 1 fechado com Score 1. Entregues skill `/bug`, `.plan-build-qa/bugs/README.md`, templates `bug.md`/`bug-progress.md`, instalacao via `pbq init/update` e smoke test. Evaluation em `.plan-build-qa/specs/spec-023-bug-command/evaluations/package-1.md`. | - |
| spec-024-bug-investigation-only | concluido | 1 | 2026-06-27 | Package 1 fechado com Score 1 (`evaluations/package-1.md`). `/bug` ficou restrito a registro e investigacao; correcao segue para `/implement` e validacao para `/test`. Sensores `pbq-analyze` e `npm-run-test` passaram no aceite. | - |
| spec-025-sensor-scope-local-global | concluido | 4 | 2026-06-29 | Packages 1, 2, 3 e 4 fechados com Score 1. P1: `scope` normalizado em memoria e parser de sensores locais em contrato. P2: `package close` executa a uniao entre sensores por tier/evento, globais obrigatorios e locais inline, com pendentes e deduplicacao. P3: `pbq sensor add/list --scope` e `pbq analyze` distinguem local/global sem exigir registry para local com comando. P4: constitution, templates e skills orientam registry global, sensores locais em contrato/evaluation e promocao local -> global explicita. | - |
| spec-260704-a7f3-non-sequential-spec-ids | concluido | 1 | 2026-07-04 | Package 1 fechado com Score 1 (`evaluations/package-1.md`). `pbq update` migra specs legadas `spec-NNN-slug` para `spec-YYMMDD-hex-slug` usando a data de criacao de `spec.md`, atualiza roadmap, e analyze aceita novo padrao preservando legado. Sensores `pbq-analyze` e `npm-run-test` passaram. | - |
| spec-260705-b9c1-non-sequential-bug-ids | concluido | 1 | 2026-07-05 | Package 1 fechado com Score 1 (`evaluations/package-1.md`). `pbq update` migra bugs legados `bug-NNN-slug` para `bug-YYMMDD-hex-slug` usando a data de criacao de `bug.md`; README de bugs e skills `/bug` orientam o novo padrao preservando legado. Sensores `pbq-analyze` e `npm-run-test` passaram. | - |
| spec-260706-c1a9-update-migration-empty-duplicates | concluido | 1 | 2026-07-06 | Package 1 fechado com Score 1 (`evaluations/package-1.md`). `pbq update` agora remove somente diretorios modernos vazios com mesmo slug durante migracao de specs/bugs legados, preserva duplicatas populadas e emite warning por slug duplicado. | - |

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
19. `spec-019-modelo-gatilho-eventos` (substitui spec-009; redesenha modelo de sensores)
20. `spec-020-analyze-package-matrix` (analyze cruza tabela ∪ contracts ∪ evaluations)
21. `spec-021-package-close-contract-driven` (package close orientado ao contrato)
22. `spec-022-dashboard-visual-status` (dashboard visual derivado dos artefatos do harness)
23. `spec-009-sensor-preflight-evidence` (revisar — pode ser absorvida pela spec-019)

24. `spec-023-bug-command` (comando/skill `/bug` para registrar erros em `.plan-build-qa/bugs`)
25. `spec-024-bug-investigation-only` (restringe `/bug` a registro e investigacao; correcao via `/implement`)
26. `spec-025-sensor-scope-local-global` (separa sensores globais permanentes de sensores locais de package; preparar saneamento posterior de repositorios como MAX)
27. `spec-260704-a7f3-non-sequential-spec-ids` (substitui sequencial obrigatorio por `spec-YYMMDD-hex-slug`, com migracao no `pbq update`)
28. `spec-260705-b9c1-non-sequential-bug-ids` (aplica `bug-YYMMDD-hex-slug` e migracao de bugs legados no `pbq update`)
29. `spec-260706-c1a9-update-migration-empty-duplicates` (torna migracao do `pbq update` idempotente diante de diretorios modernos vazios por slug)

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
- 2026-06-18: Adicionar `spec-022-dashboard-visual-status` apos pedido do usuario por uma visualizacao tipo fluxograma/Trello/DevOps para acompanhar specs, contracts e evaluations durante e apos execucoes com IA. Decisao: dashboard deve ser derivado dos artefatos canonicos do harness, com Package 1 focado no JSON deterministico e Package 2 no HTML estatico.
- 2026-06-25: Adicionar `spec-023-bug-command` apos pedido por um comando `/bug` para investigar e registrar erros em `.plan-build-qa/bugs/`. Decisao: tratar `/bug` como skill de agente no Package 1, com fluxo Investigacao -> Correcao -> Teste; subcomando `pbq bug` fica fora de escopo para evitar misturar documentacao de fluxo com automacao CLI.
- 2026-06-26: Adicionar `spec-024-bug-investigation-only` apos esclarecimento de que `/bug` deve criar/atualizar o registro e investigar, mas nao executar correcao. Decisao: restringir `/bug` as etapas de registro e Investigacao; correcao de codigo passa para `/implement` e validacao para `/test`.
- 2026-06-28: Adicionar `spec-025-sensor-scope-local-global` apos observar em `C:\dti\netview\max` que o registry de sensores cresce misturando invariantes permanentes, matriz operacional e checks especificos de packages antigos. Decisao: evoluir primeiro o PBQ com escopo local/global; limpar o MAX somente depois, via spec propria no repositorio alvo.
- 2026-07-04: Adicionar `spec-260704-a7f3-non-sequential-spec-ids` apos risco de conflito por numeracao sequencial em branches paralelos. Decisao: novo padrao `spec-YYMMDD-hex-slug`, com `pbq update` migrando specs legadas materializadas a partir da data de criacao de `spec.md`.
- 2026-07-05: Adicionar `spec-260705-b9c1-non-sequential-bug-ids` apos observar que registros de bug sequenciais sofrem o mesmo conflito entre branches. Decisao: novo padrao `bug-YYMMDD-hex-slug`, com `pbq update` migrando bugs legados materializados a partir da data de criacao de `bug.md`.
- 2026-07-06: Adicionar `spec-260706-c1a9-update-migration-empty-duplicates` apos observar em repositorio consumidor que `pbq update` deixava diretorios modernos vazios com mesmo slug e hash diferente durante migracao/reexecucao. Decisao: limpar somente tentativas modernas vazias e avisar duplicidade por slug.
