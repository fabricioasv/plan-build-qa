# Contract: Package 1

## Package

1

## Objetivo

Aplicar prioridade claude > codex > cursor para conteudo completo de skills em init/update e evitar `.pbq-new` quando a unica diferenca for whitespace nas extremidades.

## Arquivos Permitidos

| Caminho | Mudanca |
| --- | --- |
| `bin/pbq.mjs` | Geracao, manifest e comparacao no update |
| `tests/pbq-init-smoke.mjs` | Casos de selecao e normalizacao |
| `README.md` | Explicar regra de prioridade |
| `.plan-build-qa/specs/spec-261002-a91f-agent-skill-priority/**` | Spec, progresso e aceite |
| `.plan-build-qa/roadmap.md` | Status |

## Arquivos Proibidos

- `templates/adapters/skills/**` e skills canonicas.

## Mudancas Permitidas

- Instalar somente artefatos dos agentes selecionados.
- O artefato do agente de maior prioridade recebe o conteudo integral; os demais recebem referencia direta a ele. O artefato Codex secundario preserva frontmatter valido.
- Remover artefatos anteriores gerenciados e nao selecionados apenas se inalterados; preservar customizados.
- Considerar iguais no update arquivos cujo conteudo coincide apos `trim()` de ambas as strings, sem mudar o arquivo existente.

## Mudancas Proibidas

- Sobrescrever arquivos customizados sem `--force`.
- Alterar conteudo canonico das skills.

## Criterios de Aceite

1. `init`/`update` com cada agente isolado instala sua skill com conteudo integral e nenhuma referencia.
2. Com claude+codex, claude+cursor ou claude+codex+cursor, somente Claude tem conteudo integral; os demais referenciam Claude.
3. Com codex+cursor, Codex tem conteudo integral e Cursor referencia `.agents/skills`.
4. `update` nao cria `.pbq-new` quando conteudo existente difere somente em espacos/linhas vazias nas extremidades.
5. Manifest lista somente artefatos instalados; transicoes preservam customizacoes.

## Sensores Obrigatorios

| Sensor | Scope | Comando | Motivo |
| --- | --- | --- | --- |
| pbq-analyze | global | `node ./bin/pbq.mjs analyze .` | Coerencia do harness |
| npm-run-test | global | `npm run test` | Regressao de init/update |

## Riscos

Artefatos de agente anteriormente gerados por outra ferramenta nao estao sob controle do manifest e devem ser preservados.

## Rollback

Reverter este package e restaurar o gerador/comparacao anteriores.

## Observabilidade

Resumo do `pbq update` informa arquivos criados, atualizados, candidatos e removidos.

## Duvidas Abertas

Nenhuma.
