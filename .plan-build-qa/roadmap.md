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
| spec-001-analyze | planejado | - | 2026-05-23 | Sugestao inspirada em Spec Kit `/speckit.analyze` | Criar `pbq analyze` para validar consistencia entre roadmap, specs, contracts, progress, evaluations e sensores |
| spec-002-plan-tasks | planejado | - | 2026-05-23 | Sugestao inspirada nas fases `specify`, `plan`, `tasks`, `implement` do Spec Kit | Adicionar artefatos `plan.md` e `tasks.md` e skills `/plan` e `/tasks` |
| spec-003-checklist | planejado | - | 2026-05-23 | Sugestao inspirada em checklists de qualidade do Spec Kit | Criar `pbq checklist` para gerar checks objetivos por spec/package |
| spec-004-audit-lock | planejado | - | 2026-05-23 | Sugestao inspirada em hashing, lockfile e audit trail do agent-skills | Adicionar `.plan-build-qa/lock.json`, `.plan-build-qa/audit.log`, `pbq audit` e registro de operacoes |
| spec-005-overrides | planejado | - | 2026-05-23 | Sugestao inspirada em overrides/presets do Spec Kit | Criar suporte a `.plan-build-qa/overrides/templates` e `.plan-build-qa/overrides/skills` |
| spec-006-doctor | planejado | - | 2026-05-23 | Necessidade operacional do harness | Criar `pbq doctor` para diagnosticar estrutura, skills, manifest, sensores, specs e `.pbq-new` pendentes |

## Sequenciamento Sugerido

1. `spec-001-analyze`
2. `spec-006-doctor`
3. `spec-003-checklist`
4. `spec-002-plan-tasks`
5. `spec-004-audit-lock`
6. `spec-005-overrides`

## Decisoes De Roadmap

- 2026-05-23: Priorizar `pbq analyze` como proximo incremento porque reduz falsa completude e valida coerencia entre artefatos existentes.
- 2026-05-23: Manter `pbq doctor` logo depois de `analyze`, pois ele ajuda usuarios a diagnosticar instalacoes reais antes de adicionar novas fases.
