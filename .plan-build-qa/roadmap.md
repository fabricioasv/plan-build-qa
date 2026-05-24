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
| spec-001-analyze | em andamento | 1 | 2026-05-23 | Spec criada em `.plan-build-qa/specs/spec-001-analyze/` a partir da sugestao inspirada em Spec Kit `/speckit.analyze` | Implementar `contracts/package-1.md` para entregar a primeira versao util de `pbq analyze` |
| spec-002-plan-tasks | planejado | - | 2026-05-23 | Sugestao inspirada nas fases `specify`, `plan`, `tasks`, `implement` do Spec Kit | Adicionar artefatos `plan.md` e `tasks.md` e skills `/plan` e `/tasks` |
| spec-003-checklist | planejado | - | 2026-05-23 | Sugestao inspirada em checklists de qualidade do Spec Kit | Criar `pbq checklist` para gerar checks objetivos por spec/package |
| spec-004-audit-lock | planejado | - | 2026-05-23 | Sugestao inspirada em hashing, lockfile e audit trail do agent-skills | Adicionar `.plan-build-qa/lock.json`, `.plan-build-qa/audit.log`, `pbq audit` e registro de operacoes |
| spec-005-overrides | planejado | - | 2026-05-23 | Sugestao inspirada em overrides/presets do Spec Kit | Criar suporte a `.plan-build-qa/overrides/templates` e `.plan-build-qa/overrides/skills` |
| spec-006-doctor | planejado | - | 2026-05-23 | Necessidade operacional do harness | Criar `pbq doctor` para diagnosticar estrutura, skills, manifest, sensores, specs e `.pbq-new` pendentes |
| spec-007-agent-instructions-pin | planejado | - | 2026-05-23 | Ajuste operacional do harness | Forcar a referencia explicita a `./.plan-build-qa/` em `AGENTS.md` e `CLAUDE.md` durante `init` e `update`, evitando a inclusao solta no final do arquivo |
| spec-008-token-cost-model | planejado | - | 2026-05-23 | Ajuste operacional do harness | Criar um exemplo de spec para estimar consumo de tokens e custo por execucao, com calculo explicito por modelo/plano |
| spec-009-sensor-preflight-evidence | planejado | - | 2026-05-23 | Ajuste operacional do harness | Exigir execucao previa dos sensores com evidencia antes de mudancas maiores, com foco em cenarios de migracao e validacao documental |
| spec-010-test-finalization-workflow | planejado | - | 2026-05-23 | Ajuste operacional do harness | Criar fluxo para adicionar novos testes unitarios e/ou de integracao no fechamento final do trabalho, com registro objetivo no package |
| spec-011-test-as-independent-gate | em andamento | 1 | 2026-05-23 | Discussao com usuario sobre separacao spec/implement/test: `implement` deve delegar verificacao a `test` rodando como subagente de contexto fresco, evitando re-execucao redundante e preservando independencia | Implementar `contracts/package-1.md` para reescrever a skill `test` em dois modos (contract-check apos spec, acceptance-check apos implement), tornar a invocacao automatica padrao a partir de `implement` e `spec`, e atualizar `constitution/testing.md` |
| spec-012-spec-creates-all-contracts | planejado | - | 2026-05-23 | Bug operacional observado em 2026-05-23: `/implement` do package-2 da spec-001-analyze travou porque a skill `spec` criou apenas `contracts/package-1.md`, deixando os demais packages declarados na tabela da spec sem contrato. Isso forcou um ciclo extra de `/spec` para destravar o `/implement` | Fazer com que a skill `spec` (e o template/instalador correspondente em `templates/adapters/skills/spec`) crie esqueletos de `contracts/package-N.md` para todos os packages listados na tabela da spec, com placeholders objetivos e sensor list herdada da coluna `Sensores`, evitando que `/implement` seja bloqueado por contrato ausente |

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

## Decisoes De Roadmap

- 2026-05-23: Priorizar `pbq analyze` como proximo incremento porque reduz falsa completude e valida coerencia entre artefatos existentes.
- 2026-05-23: Manter `pbq doctor` logo depois de `analyze`, pois ele ajuda usuarios a diagnosticar instalacoes reais antes de adicionar novas fases.
- 2026-05-23: Adicionar `spec-011-test-as-independent-gate` para resolver duvida operacional sobre redundancia entre `implement` e `test`. Decisao: manter as tres skills, mas tornar `test` o unico responsavel por verificacao, invocado automaticamente como subagente fresco a partir de `spec` (contract-check) e `implement` (acceptance-check).
- 2026-05-23: Adicionar `spec-012-spec-creates-all-contracts` apos `/implement` ser bloqueado em `spec-001-analyze` por falta de `contracts/package-2.md`. Decisao: a skill `spec` deve materializar esqueletos de todos os packages declarados na tabela da spec ja na criacao, nao apenas o package 1.
