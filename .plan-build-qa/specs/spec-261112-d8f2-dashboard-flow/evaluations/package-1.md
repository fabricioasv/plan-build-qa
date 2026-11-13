# Evaluation: Package 1

Score: 1

## Resumo De Sensores

| Sensor | Tier | Obrigatorio | Status | Comando | Exit Code | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| npm-run-test | - | sim | passou | `npm run test` | 0 | npm notice run pbq-harness@0.8.0 test npm notice run node ./tests/pbq-init-smoke.mjs |
| pbq-analyze | - | sim | passou | `node ./bin/pbq.mjs analyze .` | 0 | ...: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-260627-3571-sensor-scope-local-global/package-4.md: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-260627-3571-sensor-scope-local-global/package-4.md: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-260627-3571-sensor-scope-local-global/package-4.md: sensor obrigatorio citado sem nome cadastrado em sensors.json [pbq] Resumo: 0 violacoes, 40 warnings em 36 specs [pbq] Resultado: OK |

Status permitidos:

- `passou`
- `falhou`
- `pendente`
- `nao-aplicavel`

Regra:

- Todo sensor obrigatorio do contrato deve aparecer nesta tabela.
- `Score: 1` exige todos os sensores obrigatorios com status `passou`.
- Se algum sensor obrigatorio estiver `falhou`, `pendente` ou ausente, o Score deve ser `0`.

## Log De Execucao Dos Sensores

- Executado em: 2026-11-13T01:27:33.382Z
- Tiers: fast, medium, slow

## Resultado

Todos os sensores executados passaram.

## Evidencias

Ver tabela de sensores.

## Violacoes Encontradas

Nenhuma violacao critica encontrada pelos sensores executados.

## Riscos Residuais

Registrar manualmente riscos que os sensores nao cobrem.

## Proxima Acao Recomendada

Atualizar progress.md e roadmap.md se a spec foi concluida.

## Acceptance-check Independente

Verificacao pela skill test contra o contrato package-1. O gate `node ./bin/pbq.mjs package close . --spec spec-261112-d8f2-dashboard-flow --package 1` encerrou com exit 0 e Score 1 em 2026-11-13T01:27:33.382Z. Os dois sensores obrigatorios passaram; analyze registrou 0 violacoes e 40 warnings historicos.

Revisao confirmou separacao entre conclusao declarada no progress e confirmacao da evaluation; contrato presente nao confirma contract-check. Fixtures verificam que packages historicos nao herdam etapas do package atual, que divergencia de package bloqueia atribuicao, que Score 1 com sensor obrigatorio pendente sinaliza inconsistencia e que ausencia de artefato permanece sem registro. Tambem cobrem estado nao-aplicavel sem evaluation, falha, HTML/JSON e serve/watch.

Filtros e ordenacao foram revisados no codigo: aplicam texto/status/integridade, preservam linha e detalhe juntos e atualizam mensagem sem resultados. Nomes/evidencias usam escapeHtml; JSON embutido escapa todo caractere '<' para impedir interpretacao como markup. A fixture com nome de sensor HTML hostil passou.

Antes do gate final foram identificados e reportados ao implementador: escape octal invalido no CSS, assercao global de nao-aplicavel contraditoria com evaluation inconsistente e falta de escape completo no JSON embutido. O implementador corrigiu esses pontos; a assercao especifica de nao-aplicavel sem evaluation permanece.

Verificacao visual desktop/mobile e interacao em navegador ficam a cargo do verificador visual separado; este acceptance-check nao afirma evidencia visual propria. Nenhum arquivo de codigo foi alterado pelo verificador.
Apos ajuste visual apenas dos caracteres CSS das setas, `node --check bin/pbq.mjs` e `node ./bin/pbq.mjs dashboard . --output .plan-build-qa/dashboard` encerraram com exit 0, confirmando parsing e regeneracao do artefato final.

Verificacao visual independente final: Edge headless desktop 1440x1100 (fluxo 1440x1000) e mobile 390x844, sem overflow global ou erros de console. Spec dashboard-flow Package 1 selecionada: concluido, Score 1 e sensores aprovados. Setas direita/abaixo confirmadas no CSS computado e screenshot. Seletores, botoes, filtros combinados/vazio, ordenacao preservando detalhe e Tab com foco visivel passaram. Evidencias derivadas: .plan-build-qa/dashboard/qa/desktop-viewport.png, desktop-flow.png, desktop.png, mobile.png e results.json. Browser dedicado encerrado; nenhuma pendencia visual.

Ajuste pequeno header fixo - verificacao proporcional independente: node --check e geracao do dashboard exit 0. Edge desktop 1440x1100/mobile 390x844 confirmou position sticky e top 0 apos rolagem, quatro ancoras sem titulos ocultos e skip-link z-index 30 acima do header 20. Evidencia: .plan-build-qa/dashboard/qa/sticky-results.json, sticky-1440.png e sticky-390.png. Gate anterior Score 1 preservado; sem bateria npm adicional por alteracao CSS pequena. Browser dedicado encerrado.

Ajuste pequeno menu fixo - verificacao proporcional independente: node --check e geracao do dashboard exit 0. Edge desktop 1440x1100/mobile 390x844 confirmou header top 0/menu top 76 durante rolagem, ambos sticky; quatro ancoras visiveis abaixo de ambos; sem overflow global (scrollWidth 1425/390), skip-link acima. Screenshots revisados e dados em .plan-build-qa/dashboard/qa/sticky-menu-results.json e sticky-menu-1440.png/sticky-menu-390.png. Gate Score 1 anterior preservado; browser dedicado encerrado.
