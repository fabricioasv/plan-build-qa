# Spec: spec-019-modelo-gatilho-eventos

## Objetivo

Substituir o modelo de sensores baseado em `tier`+`phase` por um modelo orientado a **gatilho-por-evento** (`on`), capturar a saída real dos sensores nas evaluations, e introduzir o comando `pbq guard` com wiring de hooks automáticos (advisory por default). Resultado: sensor.json mais simples, evidência auditável sem preenchimento manual, e backstop determinístico que não depende da disciplina do agente.

## Contexto

Diagnóstico feito sobre o uso real em `c:\dti\netview\max` revelou três fricções:

1. **Duplicidade de evidência**: `pbq package close` captura stdout/stderr mas descarta — a evidência rica nas evaluations é preenchida à mão.
2. **`sensors.json` confuso**: quatro eixos sobrepostos (`tier`, `phase`, `enabled`, `requiresEnv`). O campo `phase` (adicionado na spec-017) está praticamente sem uso — apenas 1 de 22 sensores no `max` o usa.
3. **Enforcement frágil**: depende do agente lembrar de chamar `/test`. Sem backstop determinístico.

O campo `tier` vira cosmético (rótulo de custo); `phase` é removido do schema ativo. A seleção de "quando rodar" passa a ser feita por `on` (array de gatilhos).

## Escopo

- `bin/pbq.mjs` (core CLI)
- `.plan-build-qa/constitution/testing.md`
- `.plan-build-qa/OVERVIEW.md` (e geração em `constitutionTesting`)
- `.claude/skills/{sensor,test,spec,implement,analyze}/SKILL.md`
- `templates/sensor-catalog.json`
- `.plan-build-qa/harness/templates/{spec,contract,evaluation}.md`
- `.plan-build-qa/roadmap.md`

## Fora de Escopo

- Reescrita de evaluations existentes em `netview/max` (mantidas intactas).
- Remoção de `run-fast.ps1`/`run-medium.ps1`/`run-slow.ps1` (ficam como aliases deprecados nesta spec).
- Novos subcomandos `pbq doctor`, `pbq audit`, etc.
- Mudanças em testes unitários além dos necessários para cobrir os novos caminhos.

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Schema v2 (`on`), captura de saída real e migração v1→v2 no core CLI | planejado | medium: `npm-run-test`; fast: `pbq-analyze` (a registrar no próprio package) |
| 2 | Comando `pbq guard --event` + wiring de hooks no `init`/`update` | planejado | medium: `npm-run-test`; fast: `pbq-analyze` |
| 3 | Constitution, skills, templates e OVERVIEW atualizados | planejado | medium: `npm-run-test`; fast: `pbq-analyze` |

## Riscos

- **Compatibilidade retroativa**: contratos e evaluations em `netview/max` referenciam `run-fast.ps1`/`tier`. Mitigado por: aliases de runner mantidos + `tier` cosmético + migração automática em `pbq update`.
- **Merge do settings.json**: `pbq init`/`update` não devem sobrescrever hooks pré-existentes no settings.json do projeto alvo (ex.: `touch-webconfig-after-msbuild` do `max`). Merge explícito obrigatório.
- **Logs gigantes**: captura de stdout/stderr deve ser truncada (~500 chars do final) para não inflar evaluations.

## Sensores Esperados

- `npm-run-test` (medium) — já registrado em `sensors.json`
- `pbq-analyze` (fast) — a ser registrado via `pbq sensor add` durante o Package 1

## Criterios de Conclusao

- `sensors.json` v2 com campo `on` e sem `phase` ativo; `tier` presente apenas como cosmético.
- `pbq package close` grava stdout/stderr (truncados) na coluna Evidência — sem preenchimento manual.
- `pbq sensor add --on commit,close` aceito; `--tier/--phase` aceitos mas deprecados.
- `pbq update` migra automaticamente `sensors.json` v1→v2 (idempotente).
- `pbq guard --event commit|close|edit` implementado; exit 0 por default (advisory); exit 1 só com `Enforcement: blocking` e sensor falhado.
- `pbq init`/`update` geram hook `PostToolUse` no settings.json do alvo e script `harness/hooks/pre-commit`.
- Constitution, skills e templates refletem o novo modelo.
- `npm run test` verde, `pbq analyze .` sem violations ao fim de cada package.
