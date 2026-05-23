# PBQ Harness

`pbq init` cria uma estrutura inicial de Harness Engineering em um repositorio existente.

O objetivo e transformar um prompt de bootstrap em um comando deterministico, idempotente e auditavel para Claude, Claude Code, Codex, Cursor Agents, Windsurf e OpenAI Agents.

## Uso local

```powershell
npm install
npm link
pbq init C:\caminho\do\repo
```

Sem `npm link`:

```powershell
node .\bin\pbq.mjs init C:\caminho\do\repo
```

Opcoes:

```text
pbq init [path] [--force] [--dry-run] [--no-agent-integration]
```

- `--force`: permite sobrescrever arquivos do harness gerados anteriormente.
- `--dry-run`: mostra o que seria criado ou alterado, sem escrever.
- `--no-agent-integration`: nao adiciona a secao "Harness Engineering" em `AGENTS.md`, `CLAUDE.md`, `.cursorrules` ou regras similares.

Por padrao, o init cria `AGENTS.md` e `CLAUDE.md` quando eles nao existem, com uma ponte curta para `.constitution/` e `.harness/`. Se esses arquivos ja existirem, ele apenas anexa uma secao marcada e preserva o restante.

## O que o init cria

```text
.constitution/
.harness/
.harness/prompts/
.harness/scripts/
.harness/templates/
.harness/evaluations/
.specs/
```

Os templates fonte ficam versionados em `templates/`:

```text
templates/
├── harness/
│   ├── prompts/
│   └── templates/
└── specs/
```

Isso permite evoluir `spec.md`, `contract.md`, `progress.md`, `evaluation.md` e prompts operacionais sem mexer na logica do CLI.

Os scripts gerados rodam a partir da raiz do repositorio alvo:

```powershell
.\.harness\scripts\check-harness-structure.ps1
.\.harness\scripts\run-fast.ps1
.\.harness\scripts\run-medium.ps1
.\.harness\scripts\run-slow.ps1
```

Tambem sao criados equivalentes `.sh` para ambientes Unix quando possivel.

## Principios

- Guias permanentes ficam em `.constitution/`.
- Sensores computacionais ficam em `.harness/scripts/`.
- Iniciativas medias ou grandes ficam em `.specs/spec-XXX-nome/`.
- Cada package deve ser pequeno, reversivel e validavel.
- O agente nao deve declarar conclusao apenas por julgamento subjetivo.

Referencias conceituais:

- https://martinfowler.com/articles/harness-engineering.html
- https://www.youtube.com/watch?v=dLs-Pbn8stU
