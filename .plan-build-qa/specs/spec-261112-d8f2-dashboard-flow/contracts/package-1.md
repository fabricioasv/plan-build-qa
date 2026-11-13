# Contract: Package 1

## Package
1

## Objetivo
Entregar dashboard HTML com layout de carteira operacional e fluxo PBQ rastreavel em cinco etapas.

## Arquivos Permitidos
- bin/pbq.mjs
- tests/pbq-init-smoke.mjs
- README.md
- .plan-build-qa/roadmap.md
- .plan-build-qa/specs/spec-261112-d8f2-dashboard-flow/spec.md
- .plan-build-qa/specs/spec-261112-d8f2-dashboard-flow/progress.md
- .plan-build-qa/specs/spec-261112-d8f2-dashboard-flow/evaluations/package-1.md

## Arquivos Proibidos
Skills/templates, package.json, sensores/constitution, arquivos de outros projetos e alteracoes preexistentes.

## Mudancas Permitidas
Refatorar renderDashboardHtml e helpers de apresentacao; adicionar metadados de existencia de artefatos ao JSON sem remover campos existentes; testes sem dependencia nova e documentacao. Gerar snapshot derivado ignorado no git. Substituir assercoes de layout antigo explicitamente superadas por esta mudanca.

## Mudancas Proibidas
Alterar gates ou semantica dos status canonicos; inferir execucao de validacao/implementacao pela existencia de contrato/evaluation; executar LLM; buscar fontes web no runtime; publicar ou iniciar servidor persistente sem necessidade.

## Criterios de Aceite
1. Layout com cabecalho escuro, navegacao, fundo claro, cards de indicadores e graficos calculados de dados reais. Responsivo e offline, sem fontes/CDN externos.
2. Fluxo principal conecta Spec -> Validacao do contrato -> Implementacao -> Teste/QA -> Roadmap. Permite selecionar spec e package e mostra evidencia/origem por etapa e lista de sensores do package.
3. Estados distinguem concluido declarado no progress, confirmado por evaluation, em andamento, pendente explicito, falha, nao-aplicavel e sem registro. Contrato existente nao equivale a contract-check executado; spec concluida nao equivale a todas as etapas executadas. Evaluation com sensores obrigatorios faltantes/divergentes sinaliza inconsistencia.
4. Quadro de etapas do progress aplica apenas ao package atual identificado; packages historicos nao herdam conclusao do atual. Ausencia de quadro/artefato mostra sem registro e nao afirmacao de nao execucao.
5. Filtros por texto/status/integridade, ordenacao, detalhe por package/score/sensores, mensagens de nenhum resultado e navega??o acessivel com teclado continuam funcionais. Contadores globais sao identificados como globais.
6. Snapshot JSON mantem campos existentes/schemaVersion; HTML/JSON/serve/watch passam na regressao. Conteudo de nomes/evidencias e escapado para HTML/JS.
7. Verificacao independente executa npm-run-test e pbq-analyze; verificacao visual desktop/mobile registra evidencia ou limitacao explicita.

## Sensores Obrigatorios

| Sensor | Scope | Comando | Motivo |
| --- | --- | --- | --- |
| npm-run-test | global | npm run test | Regressao CLI e cenarios de fluxo com evidencia |
| pbq-analyze | global | node ./bin/pbq.mjs analyze . | Coerencia do harness |

## Riscos
A avaliacao registra o ultimo resultado do package, nao historico de tentativas. Progress declara execucao sem comprovar chamadas da LLM. Recursos visuais nao devem sugerir execucao real sem evidencia.

## Rollback
Reverter apenas o diff deste package em bin/testes/README e seus registros; regenerar o snapshot com a versao anterior. Preservar as alteracoes anteriores de update de skills e backlog-sync.

## Observabilidade
Fontes e divergencias visiveis no fluxo; data do snapshot e resumo dos sensores.

## Duvidas Abertas
Nenhuma.
