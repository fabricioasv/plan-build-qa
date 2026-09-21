# Spec: spec-022-dashboard-visual-status

## Objetivo

Criar um dashboard visual do andamento do harness PBQ, derivado dos artefatos existentes (`roadmap.md`, `spec.md`, `contracts/`, `progress.md`, `evaluations/` e `sensors.json`), para permitir acompanhar specs, contratos, packages, sensores e evaluations durante e depois da execucao sem manter uma segunda fonte manual de status.

## Contexto

O usuario relatou dificuldade de visualizar "o que esta acontecendo" quando a IA executa mudancas sem que o humano acompanhe o codigo diretamente. Markdown puro nao resolveu bem o problema visual. A alternativa desejada e algo proximo de fluxograma, Trello ou Azure DevOps. Ja existe um painel textual local em `pbq status`/`pbq run` nas mudancas atuais do workspace; esta spec trata a visualizacao HTML/JSON como evolucao persistente e navegavel desse conceito.

## Escopo

- Consolidar um modelo de status derivado somente dos arquivos canonicos do harness.
- Gerar artefatos navegaveis em `.plan-build-qa/dashboard/` sem exigir servico externo.
- Expor uma UX simples para humano: kanban por status, fluxo por package e matriz de integridade.
- Preservar `roadmap.md` e `progress.md` como fontes de verdade; o dashboard e sempre derivado.

## Fora de Escopo

- Substituir `roadmap.md`, `progress.md` ou evaluations por uma fonte paralela editavel.
- Criar banco de dados, dependencia web externa, telemetria remota ou login.
- Alterar o modelo de sensores (`on`, tiers, `phase`) ou o gate `pbq package close`.
- Resolver divergencias historicas existentes no harness fora do necessario para ler e exibir estado.

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Gerar um modelo JSON deterministico do dashboard a partir de roadmap/specs/contracts/progress/evaluations/sensors | concluido | medium: `npm-run-test` |
| 2 | Gerar `index.html` estatico em `.plan-build-qa/dashboard/` com kanban, fluxo por spec/package e matriz de integridade usando o JSON do Package 1 | concluido | medium: `npm-run-test` |
| 3 | Adicionar modo operacional de acompanhamento (`--watch` e/ou `--serve`) e documentacao de uso sem transformar o dashboard em fonte de verdade | concluido | medium: `npm-run-test` |
| 4 | Ajustar o HTML para largura total e adicionar uma grade tipo gantt por spec com contagem de packages/evaluations e marcadores de etapas concluidas | concluido | medium: `npm-run-test` |
| 5 | Refinar a grade principal: fonte menor, remover kanban, adicionar colunas de integridade e status, e simplificar simbolos das etapas sem fundo colorido | concluido | medium: `npm-run-test` |
| 6 | Mostrar o motivo explicito da integridade no lugar de `materialized` quando a spec nao estiver `healthy` | concluido | medium: `npm-run-test` |
| 7 | Adicionar legenda da grade principal e trocar o marcador de `pendente` por um icone textual `SOON` com seta para cima | concluido | medium: `npm-run-test` |
| 8 | Transformar `Fluxo por Spec` em uma grade horizontal full-width, com uma linha por spec, alinhada ao estilo da primeira secao | concluido | medium: `npm-run-test` |
| 9 | Unificar `Grade De Execucao` e `Fluxo por Spec` em uma unica grade full-width com colunas de execucao e packages na mesma linha | concluido | medium: `npm-run-test` |
| 10 | Reverter a exposicao aberta do Package 9 e incorporar o fluxo como colapso por spec dentro da `Grade De Execucao` | concluido | medium: `npm-run-test` |
| 11 | Mover o colapso do fluxo para uma linha abaixo de cada spec, em vez de mantelo como coluna da grade | concluido | medium: `npm-run-test` |
| 12 | Adicionar filtros na visualizacao para refinar as specs exibidas no dashboard | concluido | medium: `npm-run-test` |
| 13 | Adicionar ordenacao client-side na grade, com default de spec mais atual para mais antiga | concluido | medium: `npm-run-test` |
| 14 | Expor no topo do dashboard os contadores gerais por status e integridade | concluido | medium: `npm-run-test` |

## Riscos

- Duplicar regras de parsing ja usadas pelo `analyze`, criando diferenca entre o que o dashboard mostra e o que o gate valida.
- Gerar HTML bonito mas pouco fiel aos estados reais. A prioridade deve ser fidelidade, links e rastreabilidade.
- Escrever artefatos gerados dentro de `.plan-build-qa/dashboard/` pode criar ruido de git se o usuario decidir versionar snapshots; documentar o comportamento.
- Existem mudancas nao commitadas no workspace atual, incluindo `pbq status/run`; esta spec deve ser implementada de forma incremental e sem reverter essas mudancas.

## Sensores Esperados

- `npm-run-test` (medium) - registrado em `.plan-build-qa/sensors.json` e obrigatorio para os packages.
- `pbq-analyze` (fast) - util como early-warning, mas nao obrigatorio nesta spec enquanto houver divergencias historicas/ativas fora do escopo.

## Criterios de Conclusao

- O dashboard e gerado a partir dos artefatos canonicos do harness, sem edicao manual de estado no HTML/JSON.
- Cada spec visivel no roadmap aparece na saida, inclusive specs planejadas sem pasta materializada.
- Specs materializadas mostram packages declarados, contratos existentes, evaluations existentes, score e sensores obrigatorios quando disponiveis.
- O HTML estatico permite enxergar ao menos: kanban por status, fluxo por spec/package e matriz de integridade.
- O HTML estatico deve ocupar toda a largura util da pagina e expor uma grade por spec mais proxima de um gantt, com contagem de packages/evaluations e marcadores visuais de etapas concluidas.
- `npm run test` passa no fechamento de cada package.
- `roadmap.md`, `progress.md` e `evaluations/package-N.md` continuam sendo os registros canonicos de andamento e aceite.

## Decisoes de design

- **Fonte unica**: o dashboard nunca deve aceitar edicao manual de status; ele apenas deriva dos arquivos do harness.
- **Snapshot primeiro**: priorizar artefato estatico (`status.json` e depois `index.html`) antes de servidor/watch, para funcionar offline e ser facil de anexar em discussoes.
- **Sem dependencia externa**: Package 1 e 2 nao devem adicionar dependencia npm. HTML deve funcionar com CSS/JS embutido ou assets locais gerados.

## Enforcement

Enforcement: advisory
