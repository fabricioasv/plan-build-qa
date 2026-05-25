# Contract: Package 1

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

1 - Restringir `parseClosedPackages` a forma explicita `package <N>`.

## Objetivo

Remover a captura de inteiros soltos em `parseClosedPackages`, exigindo a forma `package <N>` para considerar um package concluido, sem regredir o comportamento atual do `pbq analyze`.

## Arquivos Permitidos

- `bin/pbq.mjs` (apenas o regex/loop de `parseClosedPackages`)
- `tests/pbq-init-smoke.mjs` (novo caso de teste)
- `.plan-build-qa/specs/spec-018-parse-closed-packages-robusto/progress.md`
- `.plan-build-qa/specs/spec-018-parse-closed-packages-robusto/evaluations/package-1.md`
- `.plan-build-qa/roadmap.md`

## Arquivos Proibidos

- Qualquer outra funcao de parse em `bin/pbq.mjs` (`parseProgressCurrentPackage`, `parsePackageNumber`, `parseRoadmapSpecRows`, `parseContractRequiredSensors`).
- `templates/**`.
- `.plan-build-qa/sensors.json`.

## Mudancas Permitidas

- Trocar o regex de `parseClosedPackages` de `/package\s+(\d+)|\b(\d+)\b/gi` por uma forma que capture somente `package\s+(\d+)` (case-insensitive). Ajustar o loop para a unica captura.

## Mudancas Proibidas

**NUNCA** inclua refactor amplo, mudanca funcional extra ou ajuste de teste fora do objetivo. Nao alterar mensagens de violacao, exit codes, nem outras funcoes de parse.

## Criterios de Aceite

1. `parseClosedPackages` sobre uma secao contendo `Package 1` mais a prosa `exit 0` e `AC 1-6` retorna `["1"]` (nao inclui `0` nem `6`).
2. `pbq analyze` em fixture com progress assim (e `evaluations/package-1.md` presente) NAO emite "evaluation ausente para package concluido 0" nem "...6".
3. Regressao: secao com `Nenhum.` => nenhum package concluido; secao com `Package 1` e `Package 2` => `["1","2"]`. Casos atuais do smoke test continuam verdes.
4. `npm run test` sai com exit code 0.

## Sensores Obrigatorios

- medium | `npm-run-test` | `npm run test`

## Riscos

- Package concluido escrito sem a palavra "package" deixar de ser detectado: aceito; a convencao e "Package N", coberta por teste.

## Rollback

`git checkout -- bin/pbq.mjs tests/pbq-init-smoke.mjs` e remover a pasta da spec. Mudanca isolada em uma funcao de parse.

## Observabilidade

Saida de `pbq analyze` (violacoes de evaluation ausente) e `npm run test`.

## Duvidas Abertas

Nenhuma.
