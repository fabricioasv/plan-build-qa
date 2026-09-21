# Contract: Package 4 - grade tipo gantt full-width

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

4

## Objetivo

Ajustar o dashboard HTML para usar toda a largura disponivel da pagina e apresentar uma grade horizontal, uma linha por spec, mais proxima de um gantt operacional. Cada linha deve mostrar nome da spec, contagem de packages, contagem de evaluations e marcadores visuais de etapas concluidas.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/progress.md`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-4.md` (somente durante fechamento)

## Arquivos Proibidos

- `README.md`, templates e skills
- `.plan-build-qa/sensors.json`
- `.plan-build-qa/constitution/**`
- Qualquer alteracao no gate `pbq package close`, no modelo de sensores ou nos hooks
- Dependencias novas em `package.json`

## Mudancas Permitidas

1. Estender o modelo do dashboard para incluir etapas do `progress.md` por spec materializada.
2. Alterar o HTML gerado para:
   - ocupar toda a largura util da pagina
   - adicionar uma grade principal tipo gantt com uma linha por spec
   - exibir colunas para nome da spec, quantidade de packages e quantidade de evaluations
   - exibir colunas de etapas com emoji/indicador visual de concluido por etapa
3. Manter o restante do dashboard como apoio, desde que a grade full-width seja a leitura principal.
4. Preservar `pbq dashboard --json`, `pbq status`, `pbq run --resume`, `--serve` e `--watch`.

## Mudancas Proibidas

- Nao transformar a grade em fonte editavel de status.
- Nao remover a derivacao a partir de roadmap/spec/progress/contracts/evaluations.
- Nao adicionar dependencia externa de UI.

## Criterios de Aceite

| # | Criterio | Verificacao |
| --- | --- | --- |
| AC1 | O HTML gerado ocupa largura total util da pagina (sem `max-width` limitando o container principal) | Assertion textual sobre o HTML/CSS gerado |
| AC2 | O HTML contem uma grade principal tipo gantt com uma linha por spec | Assertions sobre marcador/estrutura textual no HTML |
| AC3 | Cada linha da grade mostra nome da spec, quantidade de packages e quantidade de evaluations | Assertions sobre o HTML gerado |
| AC4 | Specs materializadas com quadro de etapas no `progress.md` mostram marcadores visuais de conclusao por etapa | Fixture em `tests/pbq-init-smoke.mjs` |
| AC5 | `npm run test` passa | exit 0 |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |

## Riscos

- `progress.md` pode nao ter quadro de etapas em todas as specs; nesses casos a grade deve degradar para ausencia explicita, nao inferencia fraca.
- Excesso de colunas pode quebrar leitura em telas pequenas; usar scroll horizontal controlado em vez de comprimir demais.

## Rollback

Reverter o commit do Package 4. Regenerar `.plan-build-qa/dashboard/` com a versao anterior se necessario.

## Observabilidade

- A propria grade gerada no HTML e a evidencia do ajuste visual.

## Duvidas Abertas

_(nenhuma)_
