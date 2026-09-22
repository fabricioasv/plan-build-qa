# Spec: Skill backlog-sync

Spec ID: 260922-8e1f

## Objetivo

Criar uma skill nova (`backlog-sync`) no framework pbq, genérica e com tracker externo plugável, para arquivar em um sistema externo (Azure DevOps, Jira, ou qualquer tracker com MCP disponível no projeto consumidor) specs `planejado` que nunca foram iniciadas e bugs que não fazem mais sentido manter localmente — mão única, só saída, sem criar trabalho novo no tracker e sem virar sync contínuo de status.

## Contexto

Durante a avaliação de simplificação do pbq (`spec-260921-7a1b-simplificacao-pontual-harness`), o usuário mostrou um par de skills que usa em outro projeto (ProEnamed): `devops-backlog` (cria trabalho futuro no Azure DevOps) e `devops-sync` (reflete status de código implementado nos dois sentidos, continuamente). Confirmado que o padrão delas (SKILL.md de projeto + `.mcp.json` na raiz) é mecanismo nativo do Claude Code, não um plugin.

O usuário quer trazer para o pbq (framework genérico, usado por múltiplos projetos consumidores como netview/max) uma capacidade nova e mais restrita: arquivar backlog obsoleto (specs nunca iniciadas, bugs irrelevantes) para um tracker externo, mantendo o `roadmap.md` do pbq como única fonte de status local (sem criar um `devops-mapping.md` paralelo, decisão já tomada na sessão de planejamento). O tracker não é hardcoded — cada projeto consumidor aponta para o seu próprio MCP.

## Escopo

- Criar `templates/adapters/skills/backlog-sync/SKILL.md` seguindo o padrão de `retro`/`bug` (frontmatter, regra de PARE, workflow numerado).
- Registrar `"backlog-sync"` em `ADAPTER_SKILLS` (`bin/pbq.mjs`), o que gera automaticamente `.claude/skills/backlog-sync/SKILL.md`, `.agents/skills/backlog-sync/SKILL.md` e `.cursor/commands/backlog-sync.md`.
- Atualizar `manifest.json` com os hashes correspondentes.
- Documentar a skill em `README.md`/`.plan-build-qa/OVERVIEW.md`/`templates/harness/OVERVIEW.md` como utilitário opcional de higiene de backlog, não como estágio obrigatório do pipeline de 5 etapas nem do fluxo spec/implement/test/retro.
- Cobrir a instalação da skill em `tests/pbq-init-smoke.mjs` (mesmo padrão do teste que cobre `retro`).

## Fora de Escopo

- Criar trabalho novo no tracker externo (isso seria equivalente a `devops-backlog`, não faz parte desta skill).
- Sync contínuo de status de specs concluídas refletido no tracker (equivalente a `devops-sync`, fora de escopo por decisão do usuário).
- Apagar fisicamente pastas de spec/bug do disco — a skill só marca como arquivado/cancelado com referência externa.
- Implementar ou hardcodar qualquer integração específica de tracker (Azure DevOps, Jira, etc.) dentro do pbq — a skill descreve o fluxo de forma agnóstica e usa as ferramentas MCP que já estiverem disponíveis na sessão.
- Criar um `.plan-build-qa/devops-mapping.md` ou qualquer arquivo de mapeamento paralelo ao `roadmap.md`.

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Criar a skill `backlog-sync` nos 3 adapters, registrar em `ADAPTER_SKILLS`, atualizar manifest e documentação | planejado | pbq-analyze, npm-run-test |
| 2 | Cobrir instalação/smoke da skill em `tests/pbq-init-smoke.mjs` | planejado | pbq-analyze, npm-run-test |

## Riscos

- A skill pode ser tentada a "inventar" uma forma de enviar dados sem MCP real configurado — precisa ficar explícito que ela para e explica, nunca simula sucesso.
- Confundir esta skill com `retro` (que recomenda mudanças de harness) ou com um futuro `devops-backlog`-like (que criaria trabalho novo) — a regra de PARE precisa distinguir os três papéis claramente.
- Mutação em sistema externo sem aprovação explícita violaria `constitution/operations.md` — a skill precisa confirmar item a item antes de qualquer chamada de escrita via MCP.

## Sensores Esperados

- `pbq-analyze`: `node ./bin/pbq.mjs analyze .`
- `npm-run-test`: `npm run test`

## Criterios de Conclusao

- `.claude/skills/backlog-sync/SKILL.md`, `.agents/skills/backlog-sync/SKILL.md` e `templates/adapters/skills/backlog-sync/SKILL.md` existem e são idênticos.
- `"backlog-sync"` está em `ADAPTER_SKILLS` e é instalada por `pbq init`/`pbq update` conforme os agentes selecionados (`--agents`).
- A skill documenta explicitamente: (a) nunca cria trabalho novo no tracker, (b) nunca apaga pastas locais, (c) para e explica quando não há MCP de tracker configurado, (d) só muda `roadmap.md`/`bug.md` após confirmação explícita item a item e sucesso remoto confirmado.
- `pbq analyze .` e `npm run test` passam.

## Enforcement

Enforcement: advisory
