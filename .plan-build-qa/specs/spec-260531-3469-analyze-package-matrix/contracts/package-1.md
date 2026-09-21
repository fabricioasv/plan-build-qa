# Contract: Package 1 — Matriz estrutural de packages

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

1

## Objetivo

Estender `analyzeHarness` para construir uma matriz de packages por spec (declarados na tabela `## Packages` ∪ contracts ∪ evaluations) e emitir violações/warnings para: numeração inválida (sub-packages), buracos na sequência materializada, evaluation órfã (sem contract), materializado fora da declaração, e evaluation com Score 0 em package fechado.

## Arquivos Permitidos

- `bin/pbq.mjs` (apenas `analyzeHarness` e novos parsers/helpers próximos)
- `tests/pbq-init-smoke.mjs`

## Arquivos Proibidos

- Qualquer arquivo fora da lista
- Skills, constitution, templates (sem mudanças neste package)
- Mudanças em `runPackageCommand`/`executePackageSensors` (geração de evaluation)

## Mudancas Permitidas

1. **`parseSpecPackageRows(specMd)`** (novo): le a tabela `## Packages` e retorna `{ integers: Set<number>, subpackages: string[], openEndedFrom: number|null }`. A primeira celula da linha e o token do package (`1`, `1.1`, `9+`).
2. **`listPackageFiles(dir)`** (novo): lista `package-*.md` em um diretorio e retorna `{ integers: number[], invalid: string[] }` — `invalid` captura nomes nao-inteiros (ex.: `package-1.1.md`).
3. **`analyzeHarness`** (`:947`): para cada spec materializada, adicionar checks:
   - **Naming integer-only**: cada arquivo em `invalid` (contracts ou evaluations) e cada `subpackage` da tabela → violação `numeração inválida: <X> (sub-packages não são suportados; use inteiros contíguos)`.
   - **Sequência materializada**: M = inteiros de (contracts ∪ evaluations). Se M nao vazio e houver buraco em `1..max(M)` → violação `packages materializados com buracos: faltam <lista>`.
   - **Evaluation órfã**: evaluation inteiro N sem contract N → violação `evaluation package-<N> sem contract correspondente`.
   - **Materializado fora da declaração**: inteiro N em M que nao esteja em `integers` e (não haja `openEndedFrom` ou N < openEndedFrom) → violação `package <N> materializado mas ausente da tabela da spec`.
   - **Score 0 em fechado**: ler `Score` de cada evaluation (`parseEvaluationScore`); se Score==0 e N em `parseClosedPackages(progress)` → violação `package <N> fechado mas evaluation tem Score 0`. Se Score==0 e N não-fechado → warning.
   - **Declarado-sem-contract**: inteiro declarado (não na cauda `N+`) sem contract → warning `package <N> declarado na spec sem contract`.
4. **`parseEvaluationScore(evalMd)`** (novo): extrai o primeiro `Score: <n>` (tolera `Score: 0/1`, `**Score: 1/1**`).
5. Checks só rodam quando a spec tem pasta + tabela `## Packages`; specs `planejado` sem pasta continuam silenciosas (preserva spec-016).
6. **Testes**: fixtures cobrindo cada caso (sub-package, buraco, órfã, fora-da-tabela, Score 0 fechado) + regressão (matriz coerente → sem violação).

## Mudancas Proibidas

- Não tornar `planejado`-sem-materialização uma violação (preservar tolerância).
- Não alterar a geração de evaluation nem o `package close`.
- Não mexer em skills/templates (Package 2).

## Criterios de Aceite

| # | Critério | Verificação |
| --- | --- | --- |
| AC1 | Fixture com `package-1.1.md` → violação de numeração inválida | match `numeração inválida` |
| AC2 | Fixture materializado `{1,2,3,8,10}` → violação listando buracos `4,5,6,7,9` | match `buracos` + números |
| AC3 | Fixture evaluation `8` sem contract → violação de evaluation órfã | match `sem contract` |
| AC4 | Fixture contract+eval `10` com tabela sem `9+` → violação fora-da-tabela; com `9+` → sem essa violação | ambos os ramos |
| AC5 | Fixture evaluation Score 0 em package fechado → violação | match `Score 0` |
| AC6 | Fixture matriz coerente `{1,2,3}` declarados+contract+eval Score 1 → 0 violações novas | `Violations: nenhuma` |
| AC7 | Declarado `4` sem contract (não cauda) → warning, não violação | warning + `Resultado: OK` |
| AC8 | `npm run test` verde | exit 0 |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |

> `pbq-analyze` não é gate aqui (violações pré-existentes de spec-013 no próprio repo). Verificação manual confirma ausência de regressão nova.

## Riscos

- Parsing de tabela markdown sensível a formato; linhas fora do shape devem ser ignoradas sem quebrar.

## Rollback

`git revert` do commit do package. Mudança aditiva e isolada em `analyzeHarness`.

## Observabilidade

- `node ./bin/pbq.mjs analyze .` no próprio repo deve passar a listar os novos tipos de violação onde aplicável.

## Duvidas Abertas

_(nenhuma)_
