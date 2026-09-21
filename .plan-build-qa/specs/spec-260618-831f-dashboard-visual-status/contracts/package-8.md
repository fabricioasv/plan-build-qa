# Contract: Package 8 - fluxo por spec em grade

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

8

## Objetivo

Substituir o layout em cards da secao `Fluxo por Spec` por uma grade horizontal full-width, com uma linha por spec, para manter a mesma leitura tabular da `Grade De Execucao`.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/progress.md`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/spec.md`
- `.plan-build-qa/roadmap.md`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-8.md` (somente durante fechamento)

## Arquivos Proibidos

- `README.md`, templates e skills
- `.plan-build-qa/sensors.json`
- `.plan-build-qa/constitution/**`
- Qualquer alteracao no gate `pbq package close`, no modelo de sensores ou nos hooks
- Dependencias novas em `package.json`

## Mudancas Permitidas

1. Trocar a secao `Fluxo por Spec` de cards para grade horizontal com scroll controlado, se necessario.
2. Manter uma linha por spec.
3. Exibir por spec, no minimo:
   - nome da spec
   - status
   - packages materializados em formato compacto
   - contract/evaluation/score por package
4. Ajustar CSS e testes necessarios, preservando as demais secoes.

## Mudancas Proibidas

- Nao remover a secao `Fluxo por Spec`.
- Nao voltar ao layout em cards para essa secao.
- Nao alterar a fonte de verdade do dashboard; a secao continua 100% derivada dos artefatos do harness.

## Criterios de Aceite

| # | Criterio | Verificacao |
| --- | --- | --- |
| AC1 | `Fluxo por Spec` passa a usar grade/tabular em vez de cards | Assertion no HTML gerado |
| AC2 | A grade tem uma linha por spec | Assertion estrutural/textual no HTML gerado |
| AC3 | Cada linha mostra nome da spec, status e resumo dos packages | Assertion no HTML gerado |
| AC4 | Contract, evaluation e score continuam visiveis por package | Fixture/teste do HTML gerado |
| AC5 | `npm run test` passa | exit 0 |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |

## Riscos

- Muitos packages na mesma linha podem estourar largura; usar wrapper com scroll horizontal e blocos compactos.
- O fluxo pode perder legibilidade se os metadados por package ficarem longos demais; manter labels curtas.

## Rollback

Reverter o commit do Package 8 e regenerar `.plan-build-qa/dashboard/`.

## Observabilidade

- O HTML gerado deve evidenciar o novo layout em grade da secao `Fluxo por Spec`.

## Duvidas Abertas

_(nenhuma)_
