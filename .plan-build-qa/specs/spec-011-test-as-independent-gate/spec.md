# Spec: test como gate independente

## Objetivo

Tornar a skill `test` o unico ponto de verificacao do harness, invocada automaticamente como subagente de contexto fresco a partir de `spec` (modo contract-check) e `implement` (modo acceptance-check), preservando invocacao manual. Eliminar redundancia onde `implement` ja roda sensores e depois `test` re-roda os mesmos sensores no mesmo turno sem ganho de independencia.

Formalizar o trabalho como um **pipeline de 5 etapas distintas**, deixando explicito que `implement` e `test/qa` sao etapas separadas: `implement` produz o codigo (etapa 3) e `test/qa` valida o contrato sobre esse codigo (etapa 4), como gate independente. As etapas sao:

1. **spec** - spec.md criada/atualizada.
2. **contract (validacao)** - contrato criado e validado por `test` em modo contract-check.
3. **implement** - codigo escrito contra o contrato (sem rodar sensores diretamente).
4. **test/qa** - `test` em modo acceptance-check valida o contrato sobre o codigo (subagente de contexto fresco).
5. **roadmap** - status/evidencia atualizados.

Para que esse pipeline fique rastreavel, o template de `progress.md` do harness passa a conter, na secao `Estado Atual`, um quadro com o status de cada uma das 5 etapas.

## Contexto

Hoje:

- `implement` (`.claude/skills/implement/SKILL.md`) executa `pbq package close`, que ja roda sensores e gera evaluation.
- `test` (`.claude/skills/test/SKILL.md`) cobre essencialmente o mesmo fluxo, sendo redundante quando chamada logo apos `implement` no mesmo contexto.
- `spec` nao tem etapa de verificacao do proprio contrato: nao ha checagem objetiva de que sensores declarados existem em `sensors.json`, sao executaveis e que criterios de aceite sao mensuraveis.

Discussao com usuario (2026-05-23) concluiu que:

- A separacao de papeis (`spec` / `implement` / `test`) so faz sentido se o verificador tiver independencia real do implementador.
- Solucao mais simples que cache/hashing: `test` roda como subagente de contexto fresco, garantindo verificacao sem heranca de suposicoes.
- `implement` deixa de rodar sensores diretamente e delega para `test`.
- `spec` tambem invoca `test` em modo contract-check ao finalizar contrato.

## Escopo

- Reescrever `.claude/skills/test/SKILL.md` definindo dois modos explicitos: `contract-check` e `acceptance-check`.
- Atualizar `.claude/skills/implement/SKILL.md` para nao executar sensores diretamente: ao terminar mudancas de codigo, delegar verificacao a `test` rodando como subagente.
- Atualizar `.claude/skills/spec/SKILL.md` para invocar `test` em modo contract-check ao criar ou atualizar contrato.
- Atualizar `.plan-build-qa/constitution/testing.md` para codificar a politica: verificacao acontece em `test`, com contexto fresco, e e bloqueante.
- Definir, na propria skill `test`, o comportamento esperado para a flag de pular auto-invocacao (`--skip-test` ou equivalente em prompt), permitindo override manual em casos raros documentados.
- Adicionar o quadro de status das 5 etapas na secao `Estado Atual` do template de `progress.md` do harness, nas duas copias: `templates/harness/templates/progress.md` (fonte do instalador) e `.plan-build-qa/harness/templates/progress.md` (copia dogfood). Toda spec futura passa a herdar o quadro.

## Fora de Escopo

- Mudar CLI `pbq` (comandos como `pbq package close` permanecem; apenas o ponto de invocacao na cadeia de skills muda).
- Refactor do sistema de sensores ou de `sensors.json`.
- Sensor de "contract well-formed" como checagem computacional (sera proposto em spec separada se necessario); nesta spec o contract-check e exercido pela leitura do `test` em modo proprio.
- Mecanismo de hash/cache para evitar re-execucao (descartado em favor da independencia por contexto fresco).
- Alteracoes em `spec-010-test-finalization-workflow` (adicao de novos testes no fechamento), que segue independente.

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Reescrever skill `test` em dois modos, atualizar `implement` e `spec` para auto-invocacao via subagente, atualizar `constitution/testing.md`, e adicionar o quadro de 5 etapas no template de `progress.md` (duas copias) | concluido | npm-run-test (medium); validacao textual das SKILL.md/templates alterados (ad-hoc grep) |
| 2 | Propagar as skills `test`/`implement`/`spec` alteradas no package 1 para os templates-fonte do instalador (`templates/adapters/skills/**`) e alinhar `tests/pbq-init-smoke.mjs` ao novo comportamento (sem `pbq package close` na skill `implement`) | planejado | npm-run-test (medium) |

## Riscos

- Auto-invocacao adiciona custo de tokens e latencia ao final de `implement` e `spec`. Mitigacao: aceitar o custo como preco da independencia; documentar flag manual de bypass.
- Subagente de contexto fresco pode falhar em achar artefatos sem briefing claro. Mitigacao: prompt de invocacao precisa carregar caminhos exatos (spec, contrato, package N).
- Skill `test` pode ser chamada manualmente sem modo definido. Mitigacao: skill deve inferir modo pelo estado dos artefatos (se existe codigo recem-modificado vs apenas contrato).
- Quebra de fluxo para quem ja usa `implement` esperando que ele rode sensores diretamente. Mitigacao: comportamento padrao continua resultando em sensores executados e evaluation gerada; muda apenas quem executa.

## Sensores Esperados

- `check-harness-structure` (fast) - garante que estrutura do harness permanece integra apos edicoes nas skills.
- Validacao manual via grep nas SKILL.md alteradas, registrada na evaluation, confirmando presenca dos termos-chave: `contract-check`, `acceptance-check`, `subagente`, `contexto fresco`.

## Criterios de Conclusao

- `.claude/skills/test/SKILL.md` documenta explicitamente os dois modos e como sao acionados.
- `.claude/skills/implement/SKILL.md` nao chama mais sensores diretamente; delega a `test` via subagente.
- `.claude/skills/spec/SKILL.md` invoca `test` em modo contract-check no final do fluxo de criacao/atualizacao de contrato.
- `.plan-build-qa/constitution/testing.md` registra a politica de verificacao independente e o pipeline de 5 etapas (`implement` e `test/qa` separados).
- As duas copias do template de `progress.md` contem, na secao `Estado Atual`, o quadro com as 5 etapas (1.spec / 2.contract (validacao) / 3.implement / 4.test/qa / 5.roadmap) e a legenda de status de etapa.
- `npm run test` passa.
- Os templates-fonte do instalador (`templates/adapters/skills/test|implement|spec/SKILL.md`) ficam identicos as copias `.claude/skills/*` editadas no package 1, de modo que `pbq init`/`update` instale o novo comportamento em projetos alvo (package 2).
- `tests/pbq-init-smoke.mjs` reflete o novo comportamento da skill `implement` (delegacao a `test`, sem `pbq package close` direto) (package 2).
- Evaluation de cada package com Score 1.
- Roadmap atualizado para `concluido` com evidencia.
