# Progress: spec-022-dashboard-visual-status

> **Regra de retomada**
> **OBRIGATORIO** manter este arquivo suficiente para outro agente continuar o trabalho sem depender de memoria da sessao anterior.

## Estado Atual

`concluido`

| Etapa | Status |
| --- | --- |
| 1. spec | ok |
| 2. contract (validacao) | ok |
| 3. implement | ok |
| 4. test/qa | ok |
| 5. roadmap | ok |

## Packages Concluidos

- Package 1 fechado com Score 1 em `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-1.md`.
- Package 2 fechado com Score 1 em `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-2.md`.
- Package 3 fechado com Score 1 em `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-3.md`.
- Package 4 fechado com Score 1 em `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-4.md`.
- Package 5 fechado com Score 1 em `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-5.md`.
- Package 6 fechado com Score 1 em `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-6.md`.
- Package 7 fechado com Score 1 em `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-7.md`.
- Package 8 fechado com Score 1 em `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-8.md`.
- Package 9 fechado com Score 1 em `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-9.md`.
- Package 10 fechado com Score 1 em `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-10.md`.
- Package 11 fechado com Score 1 em `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-11.md`.
- Package 12 fechado com Score 1 em `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-12.md`.
- Package 13 fechado com Score 1 em `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-13.md`.
- Package 14 fechado com Score 1 em `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-14.md`.

## Package Atual

_(nenhum)_

## Decisoes Tecnicas

- Dashboard deve ser derivado de artefatos canonicos: `roadmap.md`, `spec.md`, `contracts/`, `progress.md`, `evaluations/` e `sensors.json`.
- Package 1 entrega apenas o modelo JSON; HTML fica para Package 2 para manter o primeiro incremento pequeno e reversivel.
- Saida JSON deve funcionar sem dependencias npm novas e sem browser.
- `pbq status`/`pbq run`, ja presentes em mudancas nao commitadas, sao tratados como base textual existente; esta spec nao deve remove-los nem alterar seu comportamento sem criterio explicito.
- Package 2 vai gerar HTML estatico com dados embutidos e, quando `status.json` existir ao lado, tentar atualizacao incremental via `fetch`/polling sem quebrar o uso offline em `file://`.
- Package 3 vai focar em `--serve` e `--watch`, sem introduzir dependencia externa; servidor HTTP simples de Node e suficiente.
- `pbq dashboard --output <dir>` passou a gerar snapshot completo (`status.json` + `index.html`).
- `pbq dashboard --serve --watch` usa somente APIs nativas de Node; o HTML faz polling de `status.json` e recarrega quando `generatedAt` muda.
- O ajuste atual vai privilegiar uma tabela/grade full-width como visao primaria para leitura operacional, mantendo o restante como apoio.
- A grade principal passou a usar uma linha por spec, com colunas para packages, evaluations e etapas do `progress.md`.
- O ajuste atual vai remover a secao kanban e deixar apenas a grade principal como leitura dominante.
- O refinamento final deixou a grade mais compacta, com colunas explicitas de integridade e status, e etapas sem fundo colorido.
- Quando a integridade nao e `healthy`, o subtitulo da spec passa a mostrar o motivo consolidado da integridade em vez de `materialized`.
- O Package 7 vai acrescentar uma legenda compacta na grade principal e trocar `pendente` para um marcador textual `SOON` com seta para cima.
- A legenda final da grade ficou logo abaixo do cabecalho da secao, explicando cores de integridade e simbolos das etapas sem roubar protagonismo da tabela.
- O Package 8 vai alinhar `Fluxo por Spec` ao mesmo padrao tabular da primeira secao, removendo os cards.
- O `Fluxo por Spec` final ficou em grade horizontal full-width, com uma linha por spec e blocos compactos por package.
- O Package 9 vai fundir as duas grades em uma leitura unica, mantendo os packages na mesma linha da spec.
- A versao final consolidou execucao e fluxo em uma unica grade full-width, com a coluna `Fluxo Packages` absorvendo o resumo por package.
- O Package 10 vai recuar da exposicao sempre aberta do Package 9 e substituir isso por um colapso por spec dentro da grade principal.
- A versao final manteve uma unica grade principal, mas trocou a coluna aberta do Package 9 por um colapso `ver packages (N)` em cada spec.
- O Package 11 vai mover esse colapso para uma linha abaixo de cada spec, em vez de mante-lo como coluna.
- A versao final liga cada spec a uma linha de detalhe colapsavel logo abaixo, preservando a grade principal mais limpa.
- O Package 12 vai adicionar filtros client-side para texto, status e integridade na propria pagina.
- Os filtros finais ficaram no topo da grade principal e escondem em conjunto a linha da spec e sua linha de detalhe.
- O Package 13 vai acrescentar ordenacao client-side na grade, com default por `Ultima Atualizacao` da spec em ordem decrescente.
- A versao final acrescenta um ordenador client-side e abre a grade por padrao em `mais atual -> mais antiga`, mantendo fallback deterministico por numero/nome da spec.
- O Package 14 vai ampliar a sessao inicial `PBQ Dashboard` com contadores gerais por status e integridade.
- A versao final do topo do dashboard agora expõe, junto dos totais, os contadores derivados de status do roadmap e de integridade do snapshot.

## Sensores Executados

- 2026-06-18: `contract-check` pela skill `test` (modo validacao de contrato, sem executar sensores de codigo). Resultado: ok. Verificado que `contracts/package-1.md` tem objetivo, arquivos permitidos/proibidos, mudancas permitidas/proibidas, criterios objetivos, sensor obrigatorio, rollback, observabilidade e nenhuma duvida aberta. Sensor obrigatorio `npm-run-test` esta registrado em `.plan-build-qa/sensors.json`.
- 2026-06-18: revisao de contrato para `contracts/package-2.md` e `contracts/package-3.md`. Resultado: ok. Escopo, criterios de aceite, arquivos permitidos e sensor obrigatorio `npm-run-test` estavam objetivos antes da implementacao.
- 2026-06-18: `node .\bin\pbq.mjs analyze .`. Resultado: exit 1. Falhou por violacoes historicas/preexistentes do harness (`check-harness-structure` ausente em sensors.json em specs antigas e pastas ausentes para specs planejadas), alem de warnings esperados para packages 2 e 3 desta spec ainda sem contract. Nao bloqueia o contrato do Package 1 porque `pbq-analyze` nao e sensor obrigatorio deste package.
- 2026-06-18: `npm test`. Resultado: ok. Cobriu AC1-AC8 do Package 1, incluindo `pbq dashboard --json`, spec apenas no roadmap, warning de sensor ausente e escrita de `status.json`.
- 2026-06-18: `node .\bin\pbq.mjs package close . --spec spec-022-dashboard-visual-status --package 1 --tiers medium`. Resultado: Score 1.
- 2026-06-18: `npm test`. Resultado: ok apos implementacao dos Packages 2 e 3. Cobriu HTML gerado, servidor HTTP local, regeneracao com `--watch` e README atualizado.
- 2026-06-18: `node .\bin\pbq.mjs package close . --spec spec-022-dashboard-visual-status --package 2 --tiers medium`. Resultado: Score 1.
- 2026-06-18: `node .\bin\pbq.mjs package close . --spec spec-022-dashboard-visual-status --package 3 --tiers medium`. Resultado: Score 1.
- 2026-06-18: `node .\bin\pbq.mjs dashboard . --output .plan-build-qa\dashboard`. Resultado: snapshot final materializado em `.plan-build-qa/dashboard/` (`index.html` + `status.json`).
- 2026-06-18: `contract-check` manual do `contracts/package-4.md`. Resultado: ok. Escopo objetivo, arquivos permitidos e sensor obrigatorio `npm-run-test` presentes.
- 2026-06-18: `npm test`. Resultado: ok apos ajuste full-width/gantt; cobriu grade principal, colunas de contagem, etapas do `progress.md` e emoji de conclusao.
- 2026-06-18: `node .\bin\pbq.mjs package close . --spec spec-022-dashboard-visual-status --package 4 --tiers medium`. Resultado: Score 1.
- 2026-06-18: `contract-check` manual do `contracts/package-5.md`. Resultado: ok. Escopo objetivo, arquivos permitidos e sensor obrigatorio `npm-run-test` presentes.
- 2026-06-18: `npm test`. Resultado: ok apos refinamento da grade principal; cobriu remocao do kanban, colunas `integridade`/`status`, quadrado vermelho para `pendente` e novo simbolo de `nao-aplicavel`.
- 2026-06-18: `node .\bin\pbq.mjs package close . --spec spec-022-dashboard-visual-status --package 5 --tiers medium`. Resultado: Score 1.
- 2026-06-18: `contract-check` manual do `package-6`. Resultado: ok. Escopo curto e objetivo, sem ampliar o modelo fora do dashboard.
- 2026-06-18: `npm test`. Resultado: ok apos trocar `materialized` pelo motivo da integridade para specs `warning`/`critical`.
- 2026-06-18: `node .\bin\pbq.mjs package close . --spec spec-022-dashboard-visual-status --package 6 --tiers medium`. Resultado: Score 1.
- 2026-06-18: `contract-check` manual do `package-7`. Resultado: ok. Escopo objetivo e limitado a legenda da grade e ao marcador visual de `pendente`.
- 2026-06-18: `npm test`. Resultado: ok apos adicionar legenda da grade e trocar `pendente` para o marcador `SOON` com seta.
- 2026-06-18: `node .\bin\pbq.mjs package close . --spec spec-022-dashboard-visual-status --package 7 --tiers medium`. Resultado: Score 1.
- 2026-06-18: `contract-check` manual do `package-8`. Resultado: ok. Escopo objetivo e restrito ao layout da secao `Fluxo por Spec`.
- 2026-06-18: `npm test`. Resultado: ok apos transformar `Fluxo por Spec` em grade horizontal.
- 2026-06-18: `node .\bin\pbq.mjs package close . --spec spec-022-dashboard-visual-status --package 8 --tiers medium`. Resultado: Score 1.
- 2026-06-18: `contract-check` manual do `package-9`. Resultado: ok. Escopo objetivo e restrito a unificacao visual das duas grades.
- 2026-06-18: `npm test`. Resultado: ok apos consolidar execucao e fluxo em uma grade unica.
- 2026-06-18: `node .\bin\pbq.mjs package close . --spec spec-022-dashboard-visual-status --package 9 --tiers medium`. Resultado: Score 1.
- 2026-06-18: `contract-check` manual do `package-10`. Resultado: ok. Escopo objetivo e restrito a rollback visual do Package 9 e reincorporacao via colapso por spec.
- 2026-06-18: `npm test`. Resultado: ok apos substituir a coluna aberta por colapso por spec.
- 2026-06-18: `node .\bin\pbq.mjs package close . --spec spec-022-dashboard-visual-status --package 10 --tiers medium`. Resultado: Score 1.
- 2026-06-19: `contract-check` manual do `package-11`. Resultado: ok. Escopo objetivo e restrito ao reposicionamento do colapso para uma linha abaixo de cada spec.
- 2026-06-19: `npm test`. Resultado: ok apos mover o colapso para uma linha abaixo de cada spec.
- 2026-06-19: `node .\bin\pbq.mjs package close . --spec spec-022-dashboard-visual-status --package 11 --tiers medium`. Resultado: Score 1.
- 2026-06-19: `contract-check` manual do `package-12`. Resultado: ok. Escopo objetivo e restrito aos filtros client-side do dashboard.
- 2026-06-19: `npm test`. Resultado: ok apos adicionar filtros por texto, status e integridade.
- 2026-06-19: `node .\bin\pbq.mjs package close . --spec spec-022-dashboard-visual-status --package 12 --tiers medium`. Resultado: Score 1.
- 2026-06-19: `contract-check` manual do `package-13`. Resultado: ok. Escopo objetivo e restrito a ordenacao client-side da grade e ao uso da data do roadmap como default.
- 2026-06-19: `npm test`. Resultado: ok apos adicionar seletor de ordenacao e default `mais atual -> mais antiga`.
- 2026-06-19: `node .\bin\pbq.mjs package close . --spec spec-022-dashboard-visual-status --package 13 --tiers medium`. Resultado: Score 1.
- 2026-06-19: `contract-check` manual do `package-14`. Resultado: ok. Escopo objetivo e restrito aos contadores gerais por status e integridade no topo do dashboard.
- 2026-06-19: `npm test`. Resultado: ok apos ampliar a sessao `PBQ Dashboard` com contadores de status e integridade.
- 2026-06-19: `node .\bin\pbq.mjs package close . --spec spec-022-dashboard-visual-status --package 14 --tiers medium`. Resultado: Score 1.

## Falhas Anteriores

- `pbq analyze .` segue vermelho por dividas existentes fora do escopo desta spec. Nao tratar como sucesso de gate; se for necessario torna-lo gate, resolver antes as dividas registradas em spec-013 e warnings de contratos futuros.

## Riscos Acumulados

- O workspace ja contem mudancas nao commitadas anteriores; implementar contra o contrato deve preservar essas alteracoes.
- `pbq-analyze` pode surfacar divergencias historicas fora do escopo; `npm-run-test` e o gate obrigatorio desta spec.

## Pendencias

_(nenhuma)_

## Contexto Para Retomada

- Usuario pediu uma visualizacao tipo fluxograma/Trello/DevOps para acompanhar specs, contracts e evaluations durante e apos a execucao.
- O desenho escolhido evita um `.md` manual paralelo: gera JSON/HTML a partir dos arquivos do harness.
- A entrega final ficou em tres camadas: JSON canonico, HTML estatico e modo ao vivo (`--serve --watch`).
- Novo pedido: dar prioridade a uma visao horizontal de largura total, com uma linha por spec e marcadores de etapa concluida.
- Refinamento final: grade mais densa, sem kanban, com integridade e status explicitos.
- Refinamento adicional: specs com `warning`/`critical` exibem o motivo da integridade diretamente na linha.
- Pedido atual: adicionar legenda na tabela e trocar `pendente` pelo icone textual `SOON` com seta para cima.
- Entrega atual: legenda adicionada na `Grade De Execucao`; `pendente` agora aparece como `SOON` com seta para cima.
- Pedido atual: transformar `Fluxo por Spec` em grade horizontal, com a mesma leitura da primeira secao.
- Entrega atual: `Fluxo por Spec` agora usa grade/tabular full-width, sem cards.
- Pedido atual: testar uma unica grade para consolidar execucao e fluxo.
- Entrega atual: a leitura principal agora e uma unica grade full-width, sem secao separada de fluxo.
- Pedido atual: fazer rollback do comportamento do Package 9 e reintroduzir o fluxo como colapso por spec.
- Entrega atual: o fluxo agora aparece como colapso por spec dentro da `Grade De Execucao`.
- Pedido atual: mover o colapso para uma linha abaixo de cada spec.
- Entrega atual: cada spec agora tem uma linha de detalhe colapsavel logo abaixo da linha principal.
- Pedido atual: adicionar filtros na visualizacao.
- Entrega atual: filtros por texto, status e integridade adicionados ao topo da grade.
- Pedido atual: adicionar um ordenador e usar por padrao a ordem da spec mais atual para a mais antiga.
- Entrega atual: ordenador adicionado ao topo da grade; default usa `Ultima Atualizacao` do roadmap em ordem decrescente e reordena a linha principal junto com a linha de detalhe.
- Pedido atual: mostrar no topo do `PBQ Dashboard` os contadores gerais de status e integridade.
- Entrega atual: o topo do `PBQ Dashboard` mostra blocos de resumo para totais gerais, status e integridade.
