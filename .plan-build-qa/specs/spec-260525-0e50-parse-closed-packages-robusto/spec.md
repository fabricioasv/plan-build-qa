# Spec: parse-closed-packages-robusto

## Objetivo

Tornar `parseClosedPackages` (`bin/pbq.mjs`) robusto a numeros soltos na secao `## Packages Concluidos` do `progress.md`, para que `pbq analyze` nao reporte falsas violacoes de "evaluation ausente para package concluido N" quando a prosa contem inteiros que nao sao numeros de package (ex: "exit 0", "AC 1-6", datas).

## Contexto

Hoje `parseClosedPackages` (em `bin/pbq.mjs`) extrai numeros da secao `## Packages Concluidos` com o regex `/package\s+(\d+)|\b(\d+)\b/gi`. A segunda alternativa (`\b(\d+)\b`) captura **qualquer** inteiro da secao. Observado em 2026-05-25 durante a spec-011: a prosa "Sensor `npm-run-test` exit 0" e "validacao textual dos AC 1-6" fez o analyzer entender que os packages 0 e 6 estavam concluidos e cobrar `evaluations/package-0.md` e `package-6.md`, gerando duas violacoes falsas. Foi contornado reescrevendo a prosa, mas a fragilidade do parser permanece.

Analogo a `spec-016-roadmap-parse-tolerante`, que endureceu o parser de roadmap. Aqui a correcao e o inverso: tornar o parser mais restritivo, exigindo a forma explicita "package N".

## Escopo

- Ajustar `parseClosedPackages` para considerar package concluido apenas a forma explicita `package <N>` (case-insensitive, com espaco), removendo a captura de inteiros soltos.
- Cobrir com teste em `tests/pbq-init-smoke.mjs`: progress com `Package 1` concluido + prosa contendo numeros soltos (`exit 0`, `AC 1-6`) nao deve gerar violacao para 0/6, apenas exigir `evaluations/package-1.md`.

## Fora de Escopo

- Mudar o formato do template de `progress.md` ou exigir lista numerica rigida.
- Alterar `parseProgressCurrentPackage`, `parsePackageNumber` ou o parser de roadmap.
- Mudar a regra de cobranca de evaluation em si.

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Restringir `parseClosedPackages` a forma `package <N>` + teste de regressao com numeros soltos | planejado | npm-run-test |

## Riscos

- Deixar de detectar um package realmente concluido escrito sem a palavra "package" (ex: so "1."). Mitigacao: a convencao do harness e listar "Package N"; documentar via teste o formato suportado. Formas hifenizadas (`package-1.md`, nome de arquivo) continuam ignoradas, o que e desejado.

## Sensores Esperados

- `npm-run-test` (medium): cobre o smoke de `pbq analyze`, incluindo o novo caso de numeros soltos.

## Criterios de Conclusao

- `parseClosedPackages` retorna apenas numeros que aparecem como `package <N>` na secao.
- Progress com `Package 1` + prosa com `exit 0` e `AC 1-6` faz `pbq analyze` exigir somente `evaluations/package-1.md` (sem violacao para 0 ou 6).
- Casos atuais preservados (`Nenhum.` => nenhum package; `Package 1` => 1).
- `npm run test` passa. Evaluation do package 1 com Score 1.
