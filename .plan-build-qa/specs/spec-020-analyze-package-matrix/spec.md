# Spec: spec-020-analyze-package-matrix

## Objetivo

Endurecer o `pbq analyze` para construir uma **matriz de packages por spec** (tabela `## Packages` ∪ `contracts/` ∪ `evaluations/`) e cruzar tudo, detectando incoerências que hoje passam batido: numeração inválida (sub-packages como `1.1`), buracos na sequência de packages materializados, evaluations órfãs (sem contract), packages materializados fora da tabela, evaluations com Score 0 em packages fechados, e sensores obrigatórios do contrato que não foram efetivamente executados e aprovados na evaluation.

## Contexto

Caso real em `c:\dti\netview\max` (spec-013-onboarding-max-bdmg): contracts `{1,1.1,1.2,2,3,10}`, evaluations `{1,1.1,1.2,2,3,8,10}`. Havia sub-packages `1.1/1.2`, salto `3→8→10` (4,5,6,7,9 ausentes), evaluation `8` sem contract, contract+eval `10` materializado, e `package-2` fechado com `Score 0/1 REPROVADO`. **O `pbq analyze` deu 0 violações** porque (ver `bin/pbq.mjs:947-1044`):

1. Nunca lê a tabela `## Packages` da spec.md.
2. Nunca lista `contracts/`/`evaluations/`; só checa o contrato do único `currentPackage` do roadmap.
3. Sub-packages caem fora dos regex (`^package-\d+\.md$`, `package\s+(\d+)`).
4. Nunca lê o `Score:` das evaluations.
5. Só valida que o sensor está *registrado*, nunca que a evaluation o *rodou com `passou`*.

## Decisões de design (confirmadas com o usuário)

- **Sub-packages decimais (`1.1`) são PROIBIDOS** (integer-only, contíguo). `analyze` flagga como violação tanto na tabela quanto em arquivos `package-1.1.md`.
- **Cruzamento tolerante a aberto**: marcador `N+` na tabela declara cauda aberta legítima. Violação para: numeração inválida, buraco na sequência materializada, evaluation sem contract, materializado fora da declaração, package fechado com Score 0. Warning para: declarado-sem-contract (cauda `N+` e packages planejados não materializados).

## Escopo

- `bin/pbq.mjs` — função `analyzeHarness` e novos parsers/helpers.
- `tests/pbq-init-smoke.mjs` — casos de teste.
- `.claude/skills/analyze/SKILL.md` + `templates/adapters/skills/analyze/SKILL.md` + `.agents/skills/analyze/SKILL.md`.
- `.plan-build-qa/roadmap.md`.

## Fora de Escopo

- A migração/numeração da spec-013 em `netview/max` (questão do projeto, não do framework).
- Mudar o `pbq package close` para gerar a evaluation a partir do contrato (registrado como risco/follow-up).
- Heurística de "spec sem sensor de teste" (ruidosa; fica de fora).

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Matriz estrutural: naming integer-only, sequência/buracos, evaluation órfã, materializado-fora-da-tabela, Score 0 | planejado | medium: `npm-run-test` |
| 2 | Enforcement de sensores: sensores obrigatórios do contrato presentes e `passou` na evaluation + docs/skill | planejado | medium: `npm-run-test` |

## Riscos

- Parsing de tabela markdown e de tabela de sensores em evaluation é sensível a formato. Mitigar com tolerância (linhas que não casam o shape são ignoradas, não quebram).
- Falso-positivo em specs legítimas com cauda `N+`. Mitigado pela decisão "tolerante a aberto".

## Sensores Esperados

- `npm-run-test` (medium) — já registrado.
- `pbq-analyze` (fast) — registrado; não-gate (violações pré-existentes de spec-013 no próprio repo).

## Criterios de Conclusao

- `analyze` detecta cada um dos casos da spec-013 (validado por fixtures de teste).
- `npm run test` verde.
- Skills e roadmap atualizados.

## Enforcement

Enforcement: advisory
