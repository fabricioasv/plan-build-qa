# Spec: Dashboard com fluxo de execucao

Spec ID: 261112-d8f2

## Objetivo
Refatorar o artefato HTML do dashboard com layout inspirado na carteira publica Investidor10 e fluxo PBQ que distingue etapas executadas, pendentes, falhas e ausencia de registro.

## Contexto
Referencia: https://investidor10.com.br/wallet/public/34919. Cabecalho escuro, navegacao horizontal, fundo cinza claro, cards brancos, indicadores e graficos, tabela operacional. O fluxo precisa tornar visivel a ideia do PBQ sem afirmar execucao apenas pela existencia de arquivos.

## Escopo
Layout responsivo, resumo visual de distribuicao/etapas, fluxo de cinco etapas por spec/package, evidencias e sensores, filtros/ordenacao e estado vazio. Artefato local estatico/offline e modo serve/watch preservados.

## Fora de Escopo
LLM, hospedagem, dependencias externas, edicao de status no dashboard, mudancas em sensores ou gates, inventar historico de execucao.

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Redesenhar dashboard com fluxo e evidencias | concluido | npm-run-test, pbq-analyze |

## Riscos
Quadro do progress e declarativo e pode refletir somente package atual. Ausencia de registro nao significa etapa nao executada. Evaluation nao prova execucao de contract-check nem implementacao independente.

## Sensores Esperados
npm-run-test e pbq-analyze, verificacao visual local desktop/mobile.

## Criterios de Conclusao
Package 1 com Score 1; snapshot gerado e revisado visualmente, sem runtime externo.

## Enforcement
Enforcement: advisory
