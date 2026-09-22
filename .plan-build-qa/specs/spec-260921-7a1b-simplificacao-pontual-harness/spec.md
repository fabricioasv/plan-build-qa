# Spec: Simplificacao pontual do harness pbq

Spec ID: 260921-7a1b

## Objetivo

Reduzir ceremonia redundante do harness pbq em pontos especificos ja avaliados (nao a compactacao geral de `spec-260716-d3a1`, que segue seu proprio curso), e adicionar um novo estagio de auto-melhoria (`retro`) e um controle explicito de quais agentes (`claude`, `codex`, `cursor`) recebem os artefatos instalados por `pbq init`/`pbq update`.

## Contexto

Avaliacao do framework (spec/contract/implement/test/roadmap, sensores, dashboard, hooks) comparando com boas praticas de mercado e com o GitHub spec-kit identificou pontos de bookkeeping que a propria IA escreve sobre si mesma (sem evidencia de exit code) versus pontos que geram evidencia real. Desta avaliacao, o usuario decidiu executar agora 6 cortes/adicoes concretos, mantendo o restante da avaliacao (fusao de `roadmap.md`/`progress.md`/`evaluation.md` como fontes de status, `constitution/repository-rules.md`) para uma spec futura.

## Escopo

- Remover o conceito de `tier` (fast/medium/slow) dos templates, skills, `sensors.json`, `sensor-catalog.json` e CLI, mantendo `--tiers` em `pbq package close` apenas como alias sem efeito para compatibilidade de instalacoes existentes.
- Tirar `.plan-build-qa/dashboard/` do versionamento (artefato derivado).
- Remover os runners depreciados `run-fast`/`run-medium`/`run-slow` (`.ps1`/`.sh`) de templates, harness instalado e manifest.
- Remover de `constitution/testing.md` e do comportamento de `pbq guard` a regra "hooks so podem ser `blocking` quando ha exatamente 1 spec `em andamento`".
- Tornar `--agents <lista>` obrigatorio em `pbq init` e `pbq update` (valores: `claude`, `codex`, `cursor`), com `cursor` gerando adicionalmente `.cursor/commands/<skill>.md` (skills continuam em `.agents/skills`, `AGENTS.md` continua sendo a referencia).
- Criar a skill `retro` (stage 4 informal do fluxo do usuario: spec/implement/test/retro) como skill de agente pura, sem subcomando novo no CLI, instalada nos 3 adapters (`.claude/skills`, `.agents/skills`, `templates/adapters/skills`).
- Atualizar `pbq help` (topicos `init`, `update`, `sensor`, `package`, `guard`, `hooks`, `dashboard`/`run`/`status`, e ajuda geral) para refletir cada corte/adicao acima.

## Fora de Escopo

- Fundir `roadmap.md`/`progress.md`/`evaluation.md` como fontes de status (avaliacao registrada, sem spec ainda).
- Remover `constitution/repository-rules.md` (avaliacao registrada, sem spec ainda).
- Continuar `spec-260716-d3a1-pbq-compactacao-contract-check` (packages 2-4 seguem no proprio fluxo dela).
- Definir/implementar `pbq bug` como subcomando de CLI.
- Fixar o schema exato de `.cursor/commands/<nome>.md` sem antes confirmar contra a documentacao atual do Cursor.

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Remover conceito de `tier` de templates/skills/sensors.json/CLI/help | planejado | pbq-analyze, npm-run-test |
| 2 | Tirar dashboard do versionamento e documentar como artefato derivado | planejado | pbq-analyze, npm-run-test |
| 3 | Remover runners depreciados run-fast/medium/slow | planejado | pbq-analyze, npm-run-test |
| 4 | Remover regra de enforcement "exatamente 1 spec em andamento" de testing.md e `pbq guard` | planejado | pbq-analyze, npm-run-test |
| 5 | Tornar `--agents` obrigatorio em init/update, com suporte a cursor (.cursor/commands) | planejado | pbq-analyze, npm-run-test |
| 6 | Criar skill `retro` nos 3 adapters e registrar no manifest | planejado | pbq-analyze, npm-run-test |

## Riscos

- Quebrar instalacoes existentes (netview/max) que ainda dependem de `--tier`, dos runners depreciados, ou que rodam `pbq init`/`update` sem `--agents` em scripts automatizados.
- `.cursor/commands/<nome>.md` com formato incorreto por falta de confirmacao do schema real do Cursor.
- Remover a trava de "exatamente 1 spec em andamento" sem validar que `pbq guard` ainda resolve corretamente a spec ativa quando ha mais de uma `em andamento` (situacao ja existente hoje no proprio roadmap: `spec-260531-9d58` e `spec-260716-d3a1`).
- Skill `retro` recomendar mudanca em `constitution/` e o agente aplicar direto, pulando a skill `constitution` (deve ficar explicito que `retro` so recomenda).

## Sensores Esperados

- `pbq-analyze`: `node ./bin/pbq.mjs analyze .` — valida coerencia estrutural do harness apos cada package.
- `npm-run-test`: `npm run test` — cobre `tests/pbq-init-smoke.mjs` e regressao do CLI.

## Criterios de Conclusao

- `tier` nao aparece mais em templates/skills/sensors.json/sensor-catalog.json novos; `--tiers` de `pbq package close` continua aceito como alias sem efeito.
- `.plan-build-qa/dashboard/` nao esta mais versionado; `.gitignore` na raiz o ignora; `pbq dashboard` continua gerando-o sob demanda.
- `run-fast`/`run-medium`/`run-slow` (`.ps1`/`.sh`) nao existem mais em `templates/` nem em `.plan-build-qa/harness/scripts/`; `manifest.json` nao referencia mais esses caminhos.
- `constitution/testing.md` nao contem mais a regra de "exatamente 1 spec em andamento"; `pbq guard` aplica `Enforcement` da spec ativa independente de quantas outras specs estao `em andamento`.
- `pbq init`/`pbq update` retornam exit code 1 com mensagem clara quando chamados sem `--agents` e sem `--no-agent-integration`; `--agents cursor` gera `.agents/skills/*` + `.cursor/commands/*`.
- Skill `retro` instalada em `.claude/skills/retro/SKILL.md`, `.agents/skills/retro/SKILL.md` e `templates/adapters/skills/retro/SKILL.md`, com regra de PARE contra editar `constitution/`/sensores diretamente.
- `pbq help init`, `pbq help update`, `pbq help sensor`, `pbq help package`, `pbq help guard`, `pbq help hooks`, `pbq help dashboard`/`run`/`status` refletem os itens acima.
- `pbq analyze .` e `npm run test` passam no fechamento de cada package.

## Enforcement

Enforcement: advisory
