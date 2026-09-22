# Contract: Package 2

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

2

## Objetivo

Cobrir a instalação da skill `backlog-sync` em `tests/pbq-init-smoke.mjs`, no mesmo padrão do teste que já cobre a skill `retro`.

## Arquivos Permitidos

- `tests/pbq-init-smoke.mjs`

## Arquivos Proibidos

- Qualquer arquivo de skill (`templates/adapters/skills/backlog-sync/SKILL.md`, `.claude/skills/backlog-sync/SKILL.md`, `.agents/skills/backlog-sync/SKILL.md`) — já fechados no Package 1, não mexer no conteúdo aqui.
- `bin/pbq.mjs`.

## Mudancas Permitidas

- Adicionar asserções em `tests/pbq-init-smoke.mjs` que confirmem: `pbq init --agents claude` instala `.claude/skills/backlog-sync/SKILL.md`; o conteúdo menciona as regras de PARE (não criar trabalho novo, não apagar pastas locais, exigir confirmação item a item, parar sem MCP configurado); as 3 cópias (`.claude`, `.agents`, `templates/adapters`) são byte-idênticas.

## Mudancas Proibidas

- Reescrever testes existentes de outras skills além do necessário para adicionar os novos casos.

## Criterios de Aceite

- `npm run test` passa, incluindo os novos casos para `backlog-sync`.
- Os novos testes falham de verdade se a skill for removida de `ADAPTER_SKILLS` (verificação manual: comentar temporariamente a entrada e confirmar que o teste novo quebra, depois reverter).

## Sensores Obrigatorios

| Sensor | Scope | Comando | Motivo |
| --- | --- | --- | --- |
| pbq-analyze | global | `node ./bin/pbq.mjs analyze .` | Invariante reutilizavel ja cadastrado em sensors.json |
| npm-run-test | global | `npm run test` | Invariante reutilizavel ja cadastrado em sensors.json |

## Riscos

Nenhum risco relevante — mudança isolada em teste.

## Rollback

Reverter o commit deste package remove os casos de teste novos.

## Observabilidade

Nao aplicavel.

## Duvidas Abertas

Nenhuma.
