# Spec: skill-analyze

## Objetivo

Criar a skill `/analyze` (variante Claude, variante Codex e template instalavel) que orienta o agente a invocar `pbq analyze [path]` e interpretar corretamente o output (violations, warnings, resumo, exit code). Registrar a skill em `ADAPTER_SKILLS` em `bin/pbq.mjs` para que `pbq init` e `pbq update` a instalem automaticamente em projetos alvo.

## Contexto

O subcomando `pbq analyze` existe no CLI desde a spec-001, mas nao ha skill correspondente instalada pelo harness. Quando o usuario tenta `/analyze` no agente do projeto alvo, o agente nao tem instrucoes sobre o que fazer. O `pbq update` instala as skills de `ADAPTER_SKILLS`; basta adicionar `"analyze"` a essa lista e criar o arquivo de template.

## Escopo

- Criar `templates/adapters/skills/analyze/SKILL.md`
- Copiar para `.claude/skills/analyze/SKILL.md` e `.agents/skills/analyze/SKILL.md` (no proprio repo pbq)
- Adicionar `"analyze"` a `ADAPTER_SKILLS` em `bin/pbq.mjs`
- Adicionar testes que verificam que a skill e instalada pelo `pbq init` e contem termos-chave

## Fora de Escopo

- Alterar logica de `pbq analyze` (ja entregue pela spec-001)
- Criar skills para outros subcomandos (`doctor`, `update`, etc.)
- Modificar constitution ou outros templates

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Criar skill `/analyze` (template + Claude + Codex), registrar em `ADAPTER_SKILLS`, adicionar testes | planejado | check-harness-structure (fast), npm-run-test (medium) |

## Riscos

- Wording muito rigido na skill pode conflitar com projetos que usam `pbq analyze` com flags diferentes. Mitigacao: skill usa linguagem orientativa, nao prescritiva.
- Adicionar `"analyze"` a `ADAPTER_SKILLS` faz o `pbq update` sobrescrever eventual customizacao existente. Mitigacao: comportamento padrao do harness (`.pbq-new` se customizado).

## Sensores Esperados

- Fast: `check-harness-structure`
- Medium: `npm run test`

## Criterios de Conclusao

1. `pbq init` instala `.claude/skills/analyze/SKILL.md` e `.agents/skills/analyze/SKILL.md` no projeto alvo.
2. Os tres arquivos (Claude, Codex, template) contem o termo `pbq analyze` e orientacoes sobre violations/warnings.
3. Testes automatizados passam com Score 1.
