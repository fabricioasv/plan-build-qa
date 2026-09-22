# Contract: Package 5

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

5

## Objetivo

Tornar `--agents <lista>` obrigatorio em `pbq init` e `pbq update` (valores: `claude`, `codex`, `cursor`), com `cursor` gerando adicionalmente `.cursor/commands/<skill>.md` para cada skill de `ADAPTER_SKILLS` (skills continuam em `.agents/skills`; `AGENTS.md` continua sendo a referencia).

## Arquivos Permitidos

- `bin/pbq.mjs` (parsing de argumentos de `init`/`update`, `adapterSkillEntries`, `adapterSkillPaths`, geracao de `AGENTS.md`/`CLAUDE.md`, `withManifest`, blocos `helpByTopic.init` e `helpByTopic.update`)
- `.plan-build-qa/manifest.json` (nova chave registrando agentes instalados neste repo)
- `tests/pbq-init-smoke.mjs`
- `README.md`, `.plan-build-qa/harness/README.md`

## Arquivos Proibidos

- Skills em si (`.claude/skills/*`, `.agents/skills/*`, `templates/adapters/skills/*`) — este package so muda **onde/quando** elas sao instaladas, nao o conteudo.
- Qualquer arquivo do Package 6 (skill `retro`).

## Mudancas Permitidas

- Adicionar flag obrigatoria `--agents <lista>` (comma-separated; valores aceitos: `claude`, `codex`, `cursor`) em `init` e `update`.
- Se `--agents` estiver ausente e `--no-agent-integration` tambem estiver ausente, `pbq init`/`pbq update` terminam com exit code 1 e mensagem explicando os valores aceitos, sem escrever nenhum arquivo.
- `--no-agent-integration` continua dispensando `--agents` (nenhuma integracao de agente e instalada, como hoje).
- Mapeamento:
  - `claude` -> gera `.claude/skills/<skill>/SKILL.md` + injeta bloco em `CLAUDE.md` (comportamento atual).
  - `codex` -> gera `.agents/skills/<skill>/SKILL.md` + injeta bloco em `AGENTS.md` (comportamento atual).
  - `cursor` -> gera `.agents/skills/<skill>/SKILL.md` (mesma pasta que `codex`; se `codex` e `cursor` forem passados juntos, gerar uma unica vez) + garante `AGENTS.md` presente/atualizado + gera `.cursor/commands/<skill>.md` para cada skill em `ADAPTER_SKILLS` (incluindo `retro` apos o Package 6).
- Registrar em `manifest.json` quais agentes foram instalados (ex.: `"agents": ["claude", "cursor"]`).
- `pbq update` continua exigindo `--agents` explicito a cada chamada; se a lista passada remover um agente presente no manifest anterior, remover os artefatos exclusivos desse agente seguindo a mesma regra de customizacao preservada (`.pbq-new`) ja usada para outros arquivos gerenciados pelo manifest.

## Mudancas Proibidas

- Adicionar um default silencioso para `--agents` (ex.: assumir `claude` se omitido) — deve ser erro.
- Alterar o conteudo funcional das skills (fora de escopo deste package).
- Inventar um schema de frontmatter para `.cursor/commands/<nome>.md` sem checar a documentacao atual do Cursor primeiro (ver "Duvidas Abertas").

## Criterios de Aceite

- `node ./bin/pbq.mjs init <dir-vazio>` sem `--agents` e sem `--no-agent-integration` retorna exit code 1 e nao cria nenhum arquivo.
- `node ./bin/pbq.mjs init <dir-vazio> --agents claude,cursor` gera `.claude/skills/*`, `.agents/skills/*` e `.cursor/commands/*`, e nao gera nenhum artefato exclusivo de `codex` alem do que `cursor` ja compartilha via `.agents`.
- `node ./bin/pbq.mjs update <dir> --agents claude,codex --dry-run` nao tenta gerar/alterar `.cursor/commands/*`.
- `pbq help init` e `pbq help update` documentam `--agents` como obrigatorio, os 3 valores aceitos, e o que cada um gera.
- `npm run test` cobre: erro sem `--agents`, instalacao com `cursor` gerando `.cursor/commands/*`, e `update` removendo artefatos de um agente retirado da lista.

## Sensores Obrigatorios

| Sensor | Scope | Tier | Comando | Motivo |
| --- | --- | --- | --- | --- |
| pbq-analyze | global | - | `node ./bin/pbq.mjs analyze .` | Confirma coerencia do harness apos mudanca de CLI |
| npm-run-test | global | - | `npm run test` | Cobre o novo comportamento obrigatorio de `--agents` |

## Riscos

- Scripts/CI de repos consumidores (incluindo netview/max) que chamam `pbq init`/`pbq update` sem `--agents` passam a falhar — breaking change de CLI que precisa constar destacado no README como tal.
- Formato incorreto de `.cursor/commands/<nome>.md` por falta de confirmacao do schema real do Cursor.

## Rollback

Reverter o commit deste package restaura o comportamento anterior (instalacao incondicional de `.claude/skills` + `.agents/skills`, sem flag obrigatoria).

## Observabilidade

Nao aplicavel.

## Duvidas Abertas

Confirmar o formato exato esperado por `.cursor/commands/<nome>.md` (frontmatter, se houver) contra a documentacao atual do Cursor antes de implementar o gerador — nao assumir um schema. Se a confirmacao nao for possivel durante o `implement`, gerar o arquivo como um wrapper minimo (titulo + instrucao textual apontando para `.agents/skills/<skill>/SKILL.md`) e registrar em `progress.md` que o schema formal do Cursor fica pendente de validacao posterior, sem bloquear o fechamento do package por isso.
