# Spec: melhora deteccao de sensores

## Objetivo

Melhorar a descoberta automatica de sensores em `pbq init`/`pbq update` para cobrir scripts soltos (`.bat`/`.cmd`/`.sh`/`.ps1`), alvos de `Makefile` e ferramentas comuns de qualidade (ex.: `sonar*`), e tornar a skill `/sensor` mais usavel via um novo subcomando `pbq sensor suggest` que escaneia o repositorio e imprime comandos prontos de cadastro. Reduzir a friccao do fluxo "agente recebe pedido > descobre o que cadastrar > cadastra".

## Contexto

Hoje, `inspectProject` em `bin/pbq.mjs` (`detectCommands`) so reconhece sensores derivados de:

- scripts do `package.json` (npm/yarn/pnpm)
- arquivos `.csproj`/`.sln` (.NET)
- `build.gradle*`, `pom.xml`, `pyproject.toml`/`requirements.txt`, `go.mod`, `Cargo.toml`

Ficam de fora:

- Scripts soltos em raiz ou em `scripts/`, como `sonar.bat`, `run-tests.sh`, `lint.ps1`, `qa.cmd`.
- Targets de `Makefile`/`Justfile`/`Taskfile`.
- Ferramentas instaladas globalmente cujo invocador esta apenas em um wrapper local (ex.: `sonar-scanner.bat`).

A skill `/sensor` documenta apenas o comando `pbq sensor add ... --name ... --tier ... --command ... --reason ...`, com muita digitacao manual. O usuario relatou em 2026-05-23 que ao pedir ao agente para "incluir mais sensores", precisou descobrir manualmente o que cadastrar porque `pbq init` nao reportou os scripts existentes nem o `sonar.bat`. Nao ha hoje um caminho do tipo "escaneie e me diga o que cadastrar".

## Escopo

- Estender `detectCommands` (e/ou novo helper) para listar scripts soltos em raiz e em `scripts/` por extensao (`.bat`, `.cmd`, `.sh`, `.ps1`).
- Classificar candidatos por nome heuristico: `sonar*`, `lint*`, `typecheck*`, `format*` → fast; `test*`, `build*`, `coverage*` → medium; `e2e*`, `*-e2e*`, `smoke*`, `integration*` → slow. Quando inconclusivo, classificar como medium e marcar como `tier-incerto: true`.
- Adicionar `Makefile` (targets `test`, `build`, `lint`, `e2e` quando presentes).
- Atualizar a constituicao auto-gerada e a documentacao para citar os novos candidatos.
- Adicionar subcomando `pbq sensor suggest [path]` que escaneia o alvo e imprime, para cada candidato detectado mas nao cadastrado em `sensors.json`, uma linha pronta `pbq sensor add ...` com nome sugerido, tier inferido, comando e razao.
- Refinar a skill `/sensor` (Claude e Codex) com fluxo recomendado: rodar `pbq sensor suggest` primeiro, depois `pbq sensor add` para cada linha aprovada, com exemplos concretos.

## Fora de Escopo

- Executar os scripts detectados para inferir tier de forma dinamica (apenas heuristica por nome/extensao).
- UI interativa de aprovacao (apenas comandos imprimiveis).
- Modificar o formato de `sensors.json`.
- Reescrever `pbq init`: a deteccao continua acontecendo no mesmo ponto, apenas com novas regras.
- Detectar configuracoes de SaaS sem arquivo local (ex.: SonarCloud sem `sonar*` no repo).
- Saida em JSON do `suggest` (apenas texto).

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Ampliar `detectCommands` para reconhecer scripts soltos (`.bat`/`.cmd`/`.sh`/`.ps1`) em raiz e em `scripts/`, `Makefile` e padroes comuns (`sonar*`), com classificacao heuristica de tier, mantendo todos os candidatos existentes. Cobrir por testes. | planejado | fast: `.\.plan-build-qa\harness\scripts\run-fast.ps1`; medium: `npm run test` |
| 2 | Adicionar subcomando `pbq sensor suggest [path]` que escaneia o alvo e imprime comandos `pbq sensor add` prontos para candidatos ainda nao cadastrados em `sensors.json`. Cobrir por testes. | planejado | fast: `.\.plan-build-qa\harness\scripts\run-fast.ps1`; medium: `npm run test` |
| 3 | Refinar a skill `/sensor` (Claude e Codex) e o help do CLI com fluxo recomendado usando `pbq sensor suggest` antes de `pbq sensor add`, exemplos concretos e referencia a tipos comuns (sonar, scripts soltos, Makefile). | planejado | fast: `.\.plan-build-qa\harness\scripts\run-fast.ps1`; medium: `npm run test` |

## Riscos

- Heuristica por nome pode classificar mal (ex.: `build-test.sh` cai em medium quando deveria ser slow). Mitigacao: `tier-incerto: true` e o `suggest` imprime tier sugerido com ressalva.
- Detectar todo `.bat`/`.sh` em raiz pode gerar ruido (ex.: scripts de deploy, de release, de migration). Mitigacao: filtrar por prefixos seguros (`test*`, `build*`, `lint*`, `sonar*`, `qa*`, `format*`, `typecheck*`, `coverage*`, `e2e*`, `smoke*`, `integration*`); o resto fica como warning no `suggest`, nao como candidato automatico.
- Executar conteudo de scripts e perigoso (security). Mitigacao: deteccao e classificacao 100% por nome/extensao/conteudo textual, nunca executar o script.
- Suggest precisa nao quebrar fluxo atual: deve ser subcomando novo sem alterar `pbq sensor add`/`list`.
- Skill refatorada nao pode regredir comportamento atual de `/sensor` ja documentado.

## Sensores Esperados

- Fast: `.\.plan-build-qa\harness\scripts\run-fast.ps1`
- Medium: `npm run test`
- Slow: nenhum sensor obrigatorio neste momento

## Criterios de Conclusao

- `pbq init` em um projeto contendo `sonar.bat`, `scripts/test.sh` e `Makefile` com target `test` lista os tres como sensores candidatos detectados.
- `pbq sensor suggest <path>` imprime comandos `pbq sensor add ...` apenas para candidatos ainda nao presentes em `sensors.json`.
- A skill `/sensor` (Claude e Codex equivalente) documenta o fluxo recomendado e cita explicitamente os novos tipos de candidato.
- Cada package tem evaluation Score 1 e roadmap atualizado para `concluido` quando os tres fecharem.
- Nenhuma das assercoes de teste introduzidas pelos packages anteriores (spec-001-analyze) regride.
