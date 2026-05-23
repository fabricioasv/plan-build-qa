# PBQ Harness

`pbq init` cria uma estrutura inicial de Harness Engineering em um repositorio existente.

O objetivo e transformar um prompt de bootstrap em um comando deterministico, idempotente e auditavel para Claude, Claude Code, Codex, Cursor Agents, Windsurf e OpenAI Agents.

## Uso Local

```powershell
npm install
npm link
pbq init C:\caminho\do\repo
```

Sem `npm link`:

```powershell
node .\bin\pbq.mjs init C:\caminho\do\repo
```

Comandos:

```text
pbq init [path] [--force] [--dry-run] [--no-agent-integration]
pbq sensor add [path] --name <name> --tier <fast|medium|slow> --command <command> [--reason <text>]
pbq sensor list [path]
pbq status [path]
pbq run [path] [--resume]
pbq package close [path] --spec <spec-name> --package <N> [--tiers fast,medium,slow]
```

- `--force`: permite sobrescrever arquivos do harness gerados anteriormente.
- `--dry-run`: mostra o que seria criado ou alterado, sem escrever.
- `--no-agent-integration`: nao adiciona a secao "Harness Engineering" em arquivos de instrucao.

Por padrao, o init cria `AGENTS.md` e `CLAUDE.md` quando eles nao existem, com uma ponte curta para `.plan-build-qa/`. Se esses arquivos ja existirem, ele apenas anexa uma secao marcada e preserva o restante.

Para Claude Code, o init tambem cria adaptadores em `.claude/skills/spec/SKILL.md` e `.claude/skills/sensor/SKILL.md`, porque o Claude so descobre slash commands de projeto dentro de `.claude/commands/` ou `.claude/skills/`. O conteudo canonico continua em `.plan-build-qa/`.

Para Codex, o init cria as mesmas skills repo-scoped em `.agents/skills/`. A documentacao atual do Codex indica que `AGENTS.md` e o arquivo de regras do repo, enquanto `.agents/skills` e o local de discovery das skills do Codex.

## O Que O Init Cria

```text
.plan-build-qa/
  constitution/
  harness/
    prompts/
    scripts/
    templates/
    evaluations/
  roadmap.md
  specs/
  sensors.json
.claude/
  skills/
    constitution/
    implement/
    roadmap/
    sensor/
    spec/
    test/
.agents/
  skills/
    constitution/
    implement/
    roadmap/
    sensor/
    spec/
    test/
```

Os templates fonte ficam versionados em `templates/`:

```text
templates/
  adapters/
    claude/
  harness/
    prompts/
    templates/
  specs/
```

Isso permite evoluir `spec.md`, `contract.md`, `progress.md`, `evaluation.md` e prompts operacionais sem mexer na logica do CLI.

Os scripts gerados rodam a partir da raiz do repositorio alvo:

```powershell
.\.plan-build-qa\harness\scripts\check-harness-structure.ps1
.\.plan-build-qa\harness\scripts\run-fast.ps1
.\.plan-build-qa\harness\scripts\run-medium.ps1
.\.plan-build-qa\harness\scripts\run-slow.ps1
```

Tambem sao criados equivalentes `.sh` para ambientes Unix quando possivel.

## Roadmap

O arquivo `.plan-build-qa/roadmap.md` fica no mesmo nivel de `constitution/`, `harness/` e `specs/`.

Ele e o indice consolidado das specs:

- quando uma spec e criada, ela deve entrar como `em andamento`
- quando a spec e finalizada, ela deve ser marcada como `concluido`
- a conclusao deve apontar para evidencia, normalmente evaluations com Score 1
- o roadmap nao substitui `progress.md`; ele resume o estado entre specs

## Sensores

Sensores ficam registrados em `.plan-build-qa/sensors.json`. Para adicionar um E2E manualmente:

```powershell
pbq sensor add C:\caminho\do\repo --name e2e --tier slow --command ".\scripts\run-e2e.ps1" --reason "Valida fluxo E2E principal"
```

O comando atualiza `sensors.json` e regenera os runners `run-fast`, `run-medium` e `run-slow`.

No Claude Code, use `/sensor` para orientar o agente a cadastrar ou revisar sensores.

Skills instaladas para Claude e Codex:

- `constitution`: ler ou atualizar regras permanentes do projeto
- `roadmap`: manter status consolidado das specs
- `spec`: criar ou revisar specs e contratos
- `implement`: implementar package contra contrato
- `test`: rodar sensores, fechar package e preencher evaluation
- `sensor`: cadastrar ou revisar sensores

## Painel De Execucao

Use o painel para enxergar rapidamente contrato, build, QA e score das specs:

```powershell
pbq run C:\caminho\do\repo --resume
```

ou, dentro do projeto:

```powershell
pbq status
```

O painel le `.plan-build-qa/specs/`, contratos, evaluations e `.plan-build-qa/sensors.json`. Ele nao substitui a execucao dos sensores; ele mostra quando algo ainda esta pendente ou sem evidencia.

## Garantia Dos Sensores

O template de `evaluation.md` contem um quadro obrigatorio de sensores:

```text
| Sensor | Tier | Obrigatorio | Status | Comando | Exit Code | Evidencia |
```

Se um sensor obrigatorio estiver ausente, `pendente` ou `falhou`, o `Score` deve ser `0`. Para garantia tecnica, use o comando de fechamento que executa os sensores e gera a evaluation automaticamente.

Para fechamento com execucao real dos sensores:

```powershell
pbq package close C:\caminho\do\repo --spec spec-001-exemplo --package 1 --tiers fast,medium
```

Esse comando executa os sensores cadastrados nos tiers informados, gera `.plan-build-qa/specs/<spec>/evaluations/package-N.md`, preenche a tabela de sensores e retorna exit code diferente de zero se algum sensor falhar ou estiver pendente.

## Principios

- Guias permanentes ficam em `.plan-build-qa/constitution/`.
- Sensores computacionais ficam em `.plan-build-qa/harness/scripts/`.
- Iniciativas medias ou grandes ficam em `.plan-build-qa/specs/spec-XXX-nome/`.
- Cada package deve ser pequeno, reversivel e validavel.
- O agente nao deve declarar conclusao apenas por julgamento subjetivo.

Referencias conceituais:

- https://martinfowler.com/articles/harness-engineering.html
- https://www.youtube.com/watch?v=dLs-Pbn8stU
