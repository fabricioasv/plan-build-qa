# Contract: Package 1 - modelo JSON do dashboard

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

1

## Objetivo

Adicionar uma forma deterministica de gerar o modelo JSON do dashboard visual a partir dos artefatos canonicos do harness PBQ. O Package 1 nao entrega HTML; ele entrega a base de dados verificavel que os proximos packages vao renderizar.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/progress.md`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-1.md` (somente durante fechamento)

## Arquivos Proibidos

- `README.md`, templates e skills (ficam para package posterior)
- `.plan-build-qa/sensors.json`
- `.plan-build-qa/constitution/**`
- `.plan-build-qa/roadmap.md` (exceto fechamento de roadmap quando a spec/package for concluido por fluxo proprio)
- Qualquer alteracao no gate `pbq package close`, no modelo de sensores ou nos hooks
- Dependencias novas em `package.json`

## Mudancas Permitidas

1. Adicionar comando/rota CLI para gerar dashboard em JSON, preferencialmente `pbq dashboard [path] --json`.
2. Permitir escrita opcional de `status.json` em diretorio de saida explicito, por exemplo `pbq dashboard [path] --json --output .plan-build-qa/dashboard`.
3. Ler, em modo somente leitura, os seguintes artefatos quando existirem:
   - `.plan-build-qa/roadmap.md`
   - `.plan-build-qa/specs/<spec>/spec.md`
   - `.plan-build-qa/specs/<spec>/contracts/package-N.md`
   - `.plan-build-qa/specs/<spec>/progress.md`
   - `.plan-build-qa/specs/<spec>/evaluations/package-N.md`
   - `.plan-build-qa/sensors.json`
4. Reusar helpers existentes de parsing quando possivel (`parseRoadmapSpecRows`, `parseSpecPackageRows`, `parseContractRequiredSensors`, `parseEvaluationScore`) para evitar regras divergentes do `analyze`.
5. Produzir JSON com schema estavel contendo, no minimo:
   - `schemaVersion: 1`
   - `generatedAt`
   - `root`
   - `summary` com contadores por status e por estado de integridade
   - `specs[]` ordenado pelo roadmap e depois por nome de pasta
   - para cada spec: `name`, `status`, `currentPackage`, `materialized`, `packages[]`, `warnings[]`
   - para cada package: `number`, `declaredInSpec`, `contractExists`, `evaluationExists`, `score`, `requiredSensors[]`, `evaluationSensors[]`
6. Preservar a saida atual de `pbq status` e `pbq run --resume`.

## Mudancas Proibidas

- Nao gerar HTML neste package.
- Nao adicionar servidor HTTP, watch mode, browser automation ou abertura automatica de navegador.
- Nao inferir sucesso quando contract/evaluation/sensor estiver ausente; representar ausencia como estado explicito no JSON.
- Nao alterar semantics de `pbq analyze`, `pbq package close`, `pbq guard` ou `pbq hooks`.
- Nao criar arquivo gerado quando o usuario pedir apenas stdout JSON.

## Criterios de Aceite

| # | Criterio | Verificacao |
| --- | --- | --- |
| AC1 | `pbq dashboard <fixture> --json` retorna exit code 0 e imprime JSON parseavel em stdout | Teste em `tests/pbq-init-smoke.mjs` com `JSON.parse(stdout)` |
| AC2 | O JSON contem `schemaVersion: 1`, `generatedAt`, `root`, `summary` e `specs[]` | Assertions de propriedades obrigatorias |
| AC3 | Spec presente apenas no roadmap, sem pasta materializada, aparece com `materialized: false` e status/currentPackage do roadmap | Fixture com roadmap-only spec |
| AC4 | Spec materializada com package declarado, contrato e evaluation aparece com `contractExists: true`, `evaluationExists: true`, `score` e sensores da evaluation | Fixture com `contracts/package-1.md` e `evaluations/package-1.md` |
| AC5 | Contrato que exige sensor registrado expoe o nome em `requiredSensors[]`; sensor exigido mas ausente de `sensors.json` gera warning objetivo | Fixture com sensor conhecido e sensor ausente |
| AC6 | `--output <dir>` cria `<dir>/status.json` com o mesmo schema e stdout informa o caminho escrito | Teste em diretorio temporario |
| AC7 | `pbq status` e `pbq run --resume` continuam passando os testes existentes | Testes existentes preservados |
| AC8 | `npm run test` passa | exit 0 |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |

> `pbq-analyze` pode ser usado como early-warning, mas nao e sensor obrigatorio deste package por haver divergencias historicas/ativas fora do escopo da entrega.

## Riscos

- O parser do dashboard divergir do parser do `analyze`; mitigar reusando helpers existentes.
- A saida JSON crescer demais em repositorios grandes; manter schema objetivo e nao embutir conteudo integral de arquivos.
- Workspace atual possui mudancas nao commitadas; preservar comportamento existente de `pbq status`/`pbq run`.

## Rollback

Reverter o commit do Package 1. Se o comando tiver sido executado com `--output`, remover manualmente o diretorio gerado `.plan-build-qa/dashboard/` ou o diretorio informado pelo usuario.

## Observabilidade

- O JSON gerado e a propria evidencia operacional do estado consolidado.
- Nenhum log persistente novo deve ser criado neste package.

## Duvidas Abertas

_(nenhuma)_
