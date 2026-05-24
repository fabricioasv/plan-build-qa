# Contract: Package 1

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

1

## Objetivo

Reposicionar a skill `test` como unico ponto de verificacao do harness, com dois modos explicitos (`contract-check` e `acceptance-check`), invocada automaticamente como subagente de contexto fresco a partir de `implement` e `spec`. Atualizar a constituicao para codificar a politica.

## Arquivos Permitidos

- `.claude/skills/test/SKILL.md`
- `.claude/skills/implement/SKILL.md`
- `.claude/skills/spec/SKILL.md`
- `.plan-build-qa/constitution/testing.md`
- `.plan-build-qa/specs/spec-011-test-as-independent-gate/progress.md`
- `.plan-build-qa/specs/spec-011-test-as-independent-gate/evaluations/package-1.md`
- `.plan-build-qa/roadmap.md` (apenas para marcar `concluido` ao final)

## Arquivos Proibidos

- Qualquer arquivo em `templates/` (templates do instalador do pbq) - mudanca afeta apenas as skills locais deste repo nesta etapa.
- Qualquer arquivo em `src/` da CLI `pbq`.
- `.plan-build-qa/sensors.json`.
- Outras skills nao listadas.

## Mudancas Permitidas

- Reescrita do conteudo das SKILL.md listadas para refletir os dois modos e a delegacao via subagente.
- Adicao de secao em `constitution/testing.md` sobre verificacao independente.
- Definicao textual (na SKILL.md de `test`) da convencao de bypass manual.
- Atualizacao de `progress.md` desta spec ao avancar.

## Mudancas Proibidas

**NUNCA** inclua refactor amplo, mudanca funcional extra ou ajuste de teste fora do objetivo deste package.

- Nao alterar comportamento da CLI `pbq`.
- Nao introduzir novos sensores em `sensors.json` neste package.
- Nao propagar as mudancas para `templates/` (sera spec separada se necessario).
- Nao mudar fluxo de roadmap alem da marcacao final de status.

## Criterios de Aceite

**OBRIGATORIO** definir criterios objetivos e verificaveis.

1. `.claude/skills/test/SKILL.md` contem secoes nomeadas para `contract-check` e `acceptance-check`, com criterio explicito de quando cada modo se aplica. Verificavel por grep dos termos exatos.
2. `.claude/skills/test/SKILL.md` documenta que deve ser executada como subagente de contexto fresco quando invocada automaticamente. Verificavel por grep de `subagente` e `contexto fresco`.
3. `.claude/skills/implement/SKILL.md` nao contem mais instrucao de rodar `pbq package close` diretamente; em vez disso, instrui delegar a verificacao a `test`. Verificavel por grep negativo de `pbq package close` no passo de fechamento e grep positivo de delegacao a `test`.
4. `.claude/skills/spec/SKILL.md` contem passo explicito de invocar `test` em modo `contract-check` ao final do fluxo de criacao/atualizacao de contrato. Verificavel por grep.
5. `.plan-build-qa/constitution/testing.md` contem secao "Verificacao Independente" (ou titulo equivalente) descrevendo a politica. Verificavel por grep.
6. Sensor `check-harness-structure` passa (exit code 0) apos as edicoes.
7. Evaluation do package 1 lista cada sensor obrigatorio com status, comando, exit code e evidencia.
8. Convencao de bypass manual esta definida textualmente na SKILL.md de `test` (nome exato pendente, a decidir durante a implementacao e registrar em `progress.md`).

## Sensores Obrigatorios

**OBRIGATORIO** listar sensores por nome/tier/comando esperado.

- `check-harness-structure` (fast) - comando registrado em `.plan-build-qa/sensors.json`. Esperado: exit code 0.
- Validacao textual ad-hoc das SKILL.md e da constituicao alterada, com grep dos termos listados nos criterios de aceite 1-5. Resultado registrado na evaluation com comando exato, arquivo, exit code do grep e trecho de evidencia.

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
