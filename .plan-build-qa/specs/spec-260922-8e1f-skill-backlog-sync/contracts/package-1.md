# Contract: Package 1

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

1

## Objetivo

Criar a skill `backlog-sync` nos 3 adapters do pbq (`.claude/skills`, `.agents/skills`, `.cursor/commands`), registrar em `ADAPTER_SKILLS`, atualizar `manifest.json` e a documentacao do harness (README/OVERVIEW).

## Arquivos Permitidos

- `templates/adapters/skills/backlog-sync/SKILL.md` (novo)
- `.claude/skills/backlog-sync/SKILL.md` (novo, gerado)
- `.agents/skills/backlog-sync/SKILL.md` (novo, gerado)
- `.cursor/commands/backlog-sync.md` (novo, gerado)
- `bin/pbq.mjs` (adicionar `"backlog-sync"` ao array `ADAPTER_SKILLS`, linha ~13)
- `.plan-build-qa/manifest.json` (hash das 3 copias)
- `README.md`, `.plan-build-qa/OVERVIEW.md`, `templates/harness/OVERVIEW.md`

## Arquivos Proibidos

- Qualquer codigo de MCP/integracao real com um tracker especifico (nao existe nesta skill — ela so descreve o fluxo e usa MCP ja disponivel na sessao).
- `constitution/*` (a skill referencia `operations.md`, mas nao o edita).
- Skills existentes (`retro`, `bug`, etc.) — usar como referencia, nao modificar.

## Mudancas Permitidas

- Escrever `SKILL.md` da skill `backlog-sync` com:
  - Frontmatter (`name: backlog-sync`, `description` de uma linha) no mesmo padrao das skills existentes.
  - Regra de bloqueio (PARE) explicita cobrindo os 3 limites: (a) nunca cria trabalho novo no tracker externo; (b) nunca apaga a pasta local de spec/bug do disco; (c) nunca escreve no tracker sem confirmacao explicita do usuario item a item.
  - Workflow numerado: (1) ler `roadmap.md` e listar specs `planejado` candidatas (sem atividade recente) e bugs em `.plan-build-qa/bugs/` candidatos; (2) apresentar a lista ao usuario e pedir confirmacao item a item sobre quais devem ser arquivados; (3) verificar se ha MCP de tracker configurado na sessao — se nao houver, parar e explicar o que falta, sem inventar forma de enviar; (4) para cada item confirmado, usar a ferramenta MCP disponivel para criar o item externo (titulo/descricao resumida a partir do `spec.md`/`bug.md`); (5) so apos sucesso confirmado na criacao remota, atualizar a linha do `roadmap.md` (`Status` -> `cancelado`, `Evidencia` com link/ID do tracker e data) ou o `bug.md`/`progress.md` do bug com a mesma referencia; (6) nunca apagar a pasta local; (7) reportar ao usuario o que foi arquivado e o que ficou pendente.
- Registrar `"backlog-sync"` em `ADAPTER_SKILLS` (`bin/pbq.mjs`).
- Atualizar `manifest.json` com os hashes gerados.
- Atualizar README/OVERVIEW mencionando a skill como utilitario opcional (nao como estagio obrigatorio do pipeline).

## Mudancas Proibidas

- Adicionar subcomando `pbq backlog-sync` no CLI (fora de escopo — e skill pura, como `retro`).
- Hardcodar nome de organizacao/projeto/tracker especifico dentro do template da skill.
- Fazer a skill decidir sozinha quais itens sao "obsoletos" sem confirmacao do usuario.

## Criterios de Aceite

- `diff` entre `.claude/skills/backlog-sync/SKILL.md`, `.agents/skills/backlog-sync/SKILL.md` e `templates/adapters/skills/backlog-sync/SKILL.md` vazio (identicos).
- `grep -n "backlog-sync" bin/pbq.mjs` mostra a entrada em `ADAPTER_SKILLS` e nenhum dispatcher/case novo de comando CLI.
- `node ./bin/pbq.mjs init <dir-teste> --agents claude` instala `.claude/skills/backlog-sync/SKILL.md`.
- O texto da skill contem, de forma explicita e verificavel por leitura: proibicao de criar trabalho novo no tracker, proibicao de apagar pastas locais, exigencia de confirmacao item a item antes de qualquer escrita remota, e instrucao de parar quando nao ha MCP de tracker configurado.
- `pbq analyze .` nao acusa a skill `backlog-sync` como fonte nao referenciada no manifest.
- README/OVERVIEW mencionam a skill como utilitario opcional de higiene de backlog.

## Sensores Obrigatorios

| Sensor | Scope | Comando | Motivo |
| --- | --- | --- | --- |
| pbq-analyze | global | `node ./bin/pbq.mjs analyze .` | Invariante reutilizavel ja cadastrado em sensors.json |
| npm-run-test | global | `npm run test` | Invariante reutilizavel ja cadastrado em sensors.json |

## Riscos

- Texto da skill ambiguo pode levar um agente a tentar "simular" sucesso de sincronizacao sem MCP real — mitigado pela regra de PARE explicita.

## Rollback

Reverter o commit deste package remove a skill dos 3 adapters e do `ADAPTER_SKILLS`.

## Observabilidade

Nao aplicavel.

## Duvidas Abertas

Nenhuma.
