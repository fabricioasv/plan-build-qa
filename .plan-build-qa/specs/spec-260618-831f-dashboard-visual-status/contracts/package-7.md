# Contract: Package 7 - legenda e marcador SOON

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

7

## Objetivo

Adicionar uma legenda visivel dentro da grade principal do dashboard para explicar os simbolos/cores usados, e trocar o marcador de etapa `pendente` do quadrado vermelho para um icone textual `SOON` com seta para cima.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/progress.md`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/spec.md`
- `.plan-build-qa/roadmap.md`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-7.md` (somente durante fechamento)

## Arquivos Proibidos

- `README.md`, templates e skills
- `.plan-build-qa/sensors.json`
- `.plan-build-qa/constitution/**`
- Qualquer alteracao no gate `pbq package close`, no modelo de sensores ou nos hooks
- Dependencias novas em `package.json`

## Mudancas Permitidas

1. Inserir uma legenda textual/visual logo abaixo do cabecalho da Grade de Execucao.
2. Explicar na legenda ao menos:
   - cores de integridade (`healthy`, `warning`, `critical`)
   - significado dos simbolos de etapa exibidos na grade
3. Trocar o simbolo de `pendente` para um icone textual `SOON` com seta para cima.
4. Ajustar CSS e testes necessarios, preservando a grade full-width atual.

## Mudancas Proibidas

- Nao remover colunas existentes da grade.
- Nao voltar a usar o quadrado vermelho para `pendente`.
- Nao transformar a legenda em conteudo editavel/manual fora do HTML gerado.

## Criterios de Aceite

| # | Criterio | Verificacao |
| --- | --- | --- |
| AC1 | A secao `Grade De Execucao` exibe uma legenda visivel no HTML gerado | Assertion no HTML gerado |
| AC2 | A legenda explica as cores de integridade | Assertion textual no HTML gerado |
| AC3 | A legenda explica os simbolos/status das etapas | Assertion textual no HTML gerado |
| AC4 | Etapas `pendente` passam a usar o icone textual `SOON` com seta para cima | Fixture/teste do HTML gerado |
| AC5 | `npm run test` passa | exit 0 |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |

## Riscos

- A legenda pode competir com a grade se ficar grande demais; manter leitura curta e compacta.
- O novo icone textual precisa continuar legivel em largura estreita sem desalinhar as celulas.

## Rollback

Reverter o commit do Package 7 e regenerar `.plan-build-qa/dashboard/`.

## Observabilidade

- O HTML gerado deve refletir a legenda e o novo marcador `SOON`.

## Duvidas Abertas

_(nenhuma)_
