# Contract: Package 1

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

1

## Objetivo

Reposicionar a skill `test` como unico ponto de verificacao do harness, com dois modos explicitos (`contract-check` e `acceptance-check`), invocada automaticamente como subagente de contexto fresco a partir de `implement` e `spec`, deixando `implement` (etapa 3) e `test/qa` (etapa 4) como etapas distintas do pipeline. Atualizar a constituicao para codificar a politica e adicionar o quadro de 5 etapas na secao `Estado Atual` do template de `progress.md` (duas copias).

## Arquivos Permitidos

- `.claude/skills/test/SKILL.md`
- `.claude/skills/implement/SKILL.md`
- `.claude/skills/spec/SKILL.md`
- `.plan-build-qa/constitution/testing.md`
- `templates/harness/templates/progress.md` (fonte do instalador - adicionar o quadro de etapas)
- `.plan-build-qa/harness/templates/progress.md` (copia dogfood - manter identica a fonte)
- `.plan-build-qa/specs/spec-011-test-as-independent-gate/progress.md`
- `.plan-build-qa/specs/spec-011-test-as-independent-gate/evaluations/package-1.md`
- `.plan-build-qa/roadmap.md` (apenas para marcar `concluido` ao final)

## Arquivos Proibidos

- Qualquer arquivo em `templates/` EXCETO `templates/harness/templates/progress.md`. Em especial, **nao** propagar as mudancas das skills (`templates/adapters/skills/**`) nesta etapa - isso fica para spec separada.
- Qualquer arquivo em `src/` da CLI `pbq` e `bin/pbq.mjs`.
- `.plan-build-qa/sensors.json`.
- Outras skills nao listadas.

## Mudancas Permitidas

- Reescrita do conteudo das SKILL.md listadas para refletir os dois modos, a delegacao via subagente e o pipeline de 5 etapas com `implement` e `test/qa` distintos.
- Adicao de secao em `constitution/testing.md` sobre verificacao independente e o pipeline de 5 etapas.
- Adicao do quadro de etapas na secao `Estado Atual` das duas copias do template de `progress.md`. As duas copias devem ficar identicas (o instalador gera a copia dogfood a partir da fonte).
- Definicao textual (na SKILL.md de `test`) da convencao de bypass manual.
- Atualizacao de `progress.md` desta spec ao avancar.

## Mudancas Proibidas

**NUNCA** inclua refactor amplo, mudanca funcional extra ou ajuste de teste fora do objetivo deste package.

- Nao alterar comportamento da CLI `pbq` (`bin/pbq.mjs`).
- Nao introduzir novos sensores em `sensors.json` neste package.
- Nao propagar as mudancas das SKILL.md para `templates/adapters/skills/**` (sera spec separada se necessario). A unica mudanca permitida em `templates/` e o quadro de etapas em `templates/harness/templates/progress.md`.
- Nao mudar fluxo de roadmap alem da marcacao final de status.

## Criterios de Aceite

**OBRIGATORIO** definir criterios objetivos e verificaveis.

1. `.claude/skills/test/SKILL.md` contem secoes nomeadas para `contract-check` e `acceptance-check`, com criterio explicito de quando cada modo se aplica. Verificavel por grep dos termos exatos.
2. `.claude/skills/test/SKILL.md` documenta que deve ser executada como subagente de contexto fresco quando invocada automaticamente. Verificavel por grep de `subagente` e `contexto fresco`.
3. `.claude/skills/implement/SKILL.md` nao contem mais instrucao de rodar `pbq package close` diretamente; em vez disso, instrui delegar a verificacao a `test`. Verificavel por grep negativo de `pbq package close` no passo de fechamento e grep positivo de delegacao a `test`.
4. `.claude/skills/spec/SKILL.md` contem passo explicito de invocar `test` em modo `contract-check` ao final do fluxo de criacao/atualizacao de contrato. Verificavel por grep.
5. `.plan-build-qa/constitution/testing.md` contem secao "Verificacao Independente" (ou titulo equivalente) descrevendo a politica e o pipeline de 5 etapas com `implement` e `test/qa` separados. Verificavel por grep.
6. As duas copias do template de `progress.md` (`templates/harness/templates/progress.md` e `.plan-build-qa/harness/templates/progress.md`) contem, dentro da secao `## Estado Atual`, um quadro com as 5 etapas nomeadas (`1. spec`, `2. contract (validacao)`, `3. implement`, `4. test/qa`, `5. roadmap`) e a legenda de status de etapa. As duas copias sao identicas (verificavel por diff/grep).
7. `npm run test` sai com exit code 0 apos as edicoes (regressao do instalador, incluindo geracao do template de progress).
8. Evaluation do package 1 lista cada sensor obrigatorio com status, comando, exit code e evidencia.
9. Convencao de bypass manual esta definida textualmente na SKILL.md de `test` (nome exato pendente, a decidir durante a implementacao e registrar em `progress.md`).

## Sensores Obrigatorios

**OBRIGATORIO** listar sensores por nome/tier/comando esperado.

- medium | `npm-run-test` | `npm run test` - sensor registrado em `.plan-build-qa/sensors.json`. Esperado: exit code 0. Garante que o instalador continua integro apos editar o template de `progress.md`.
- Validacao textual ad-hoc das SKILL.md, da constituicao e das duas copias do template de `progress.md`, com grep dos termos listados nos criterios de aceite 1-6. Resultado registrado na evaluation com comando exato, arquivo, exit code do grep e trecho de evidencia.

## Riscos

- Subagente fresco sem briefing suficiente pode falhar em encontrar artefatos. Mitigacao: a SKILL.md de `implement`/`spec` deve detalhar quais caminhos passar ao invocar `test`.
- Texto da skill pode ficar ambiguo sobre quando inferir modo automaticamente. Mitigacao: tabela explicita de inputs/modos na SKILL.md de `test`.
- Custo de tokens adicional. Aceito como tradeoff documentado em `constitution/testing.md`.

## Rollback

**OBRIGATORIO** descrever como desfazer este package.

`git revert` do commit do package 1. Como o package altera apenas SKILL.md e a constituicao, sem migracao de dados ou efeitos externos, o revert restaura totalmente o comportamento anterior.

## Observabilidade

Nao aplicavel: mudanca afeta documentacao de skills e constituicao, sem componente de runtime do produto.

## Duvidas Abertas

- Nome exato da flag de bypass manual (`--skip-test`, `--no-verify` ou instrucao em linguagem natural no prompt). **PARE** nao se aplica: pendencia pode ser resolvida durante a implementacao e registrada em `progress.md` e na evaluation, sem afetar arquivos permitidos nem criterios de aceite.
