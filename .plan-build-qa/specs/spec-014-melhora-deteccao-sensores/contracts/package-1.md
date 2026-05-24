# Contract: Package 1

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

1

## Objetivo

Ampliar `detectCommands` (e helpers correlatos) em `bin/pbq.mjs` para que `pbq init` e `pbq update` reconhecam como candidatos a sensor: scripts soltos (`.bat`/`.cmd`/`.sh`/`.ps1`) presentes em raiz ou em `scripts/`, alvos de `Makefile` (`test`, `build`, `lint`, `e2e` quando declarados) e wrappers comuns (`sonar*`). Classificar tier por heuristica de nome. Cobrir por testes automatizados sem regredir candidatos ja detectados.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-014-melhora-deteccao-sensores/progress.md`
- `.plan-build-qa/specs/spec-014-melhora-deteccao-sensores/contracts/package-1.md`
- `.plan-build-qa/specs/spec-014-melhora-deteccao-sensores/evaluations/package-1.md`

## Arquivos Proibidos

- `package.json`
- `README.md`
- `.plan-build-qa/constitution/**`
- `.plan-build-qa/harness/templates/**`
- `.plan-build-qa/sensors.json`
- `.claude/skills/**`, `.agents/skills/**`
- contratos/evaluations de outras specs ou outros packages
- qualquer arquivo fora da lista de arquivos permitidos

## Mudancas Permitidas

- Adicionar funcoes auxiliares em `bin/pbq.mjs` para escanear scripts soltos e alvos de `Makefile`.
- Estender `detectCommands` para incluir os novos candidatos com classificacao de tier por heuristica de nome.
- Marcar candidato como `tier-incerto: true` quando o nome nao casar com a heuristica.
- Adicionar testes em `tests/pbq-init-smoke.mjs` cobrindo: detecao de `sonar.bat`, detecao de script em `scripts/`, detecao de target `test` em `Makefile`, classificacao heuristica esperada para nome ambiguo.
- Atualizar `progress.md` desta spec.

## Mudancas Proibidas

**NUNCA** inclua refactor amplo, mudanca funcional extra ou ajuste de teste fora do objetivo deste package.

- Nao executar scripts detectados.
- Nao alterar formato de `sensors.json`.
- Nao introduzir o subcomando `pbq sensor suggest` (escopo do package 2).
- Nao alterar skills `/sensor` ou outras (escopo do package 3).
- Nao detectar candidatos fora dos diretorios `raiz` e `scripts/` (manter recorte).
- Nao modificar comandos existentes alem do estritamente necessario para integracao do detector.

## Criterios de Aceite

**OBRIGATORIO** definir criterios objetivos e verificaveis.

1. `pbq init` em um projeto que contenha `sonar.bat` na raiz reporta um candidato a sensor referenciando `sonar.bat`. Verificavel por scan da saida e/ou inspecao do `sensors.json`/scripts gerados.
2. `pbq init` em um projeto que contenha `scripts/test.sh` reporta um candidato apontando para esse script. Verificavel por teste.
3. `pbq init` em um projeto que contenha `Makefile` com target `test` reporta um candidato `make test`. Verificavel por teste.
4. Nome `sonar.bat` e classificado tier `fast`; `test.sh` e `make test` em tier `medium`; nome ambiguo (ex.: `qa.bat`) cai em `medium` e marca `tier-incerto`. Verificavel por teste.
5. Candidatos ja detectados pelas regras anteriores (npm scripts, .NET, etc.) continuam aparecendo. Verificavel pelos testes existentes que nao podem regredir.
6. `tests/pbq-init-smoke.mjs` ganha ao menos 4 asserts novos cobrindo os criterios 1-4.
7. Sensores obrigatorios do package passam.
8. Evaluation do package 1 tem Score 1 com cada sensor listado com status/comando/exit code/evidencia.

## Sensores Obrigatorios

**OBRIGATORIO** listar sensores por nome/tier/comando esperado.

- Fast | `check-harness-structure` | `.\.plan-build-qa\harness\scripts\run-fast.ps1`
- Medium | `npm-run-test` | `npm run test`

## Riscos

- Heuristica errar tier para nome ambiguo. Mitigacao: `tier-incerto` evita "engessar" decisao.
- Scripts de deploy/release entrarem como candidato. Mitigacao: lista de prefixos seguros explicita no codigo (`test`, `build`, `lint`, `format`, `typecheck`, `coverage`, `sonar`, `qa`, `e2e`, `smoke`, `integration`); demais nomes ficam fora do candidato automatico.
- Testes adicionando muitas fixtures temporarias podem tornar o teste lento. Mitigacao: reusar a estrutura `mkdtemp` ja em uso e limpar com `rm` em `finally`.

## Rollback

`git revert` do commit do package 1. As mudancas sao todas locais a `bin/pbq.mjs` e ao teste smoke; sem dados persistentes nem efeitos externos.

## Observabilidade

stdout/stderr do CLI + evidencia dos testes automatizados.

## Duvidas Abertas

- Lista final dos prefixos seguros (definicao no proprio package 1).
- Onde, no relatorio gerado por `inspectProject`, exibir o flag `tier-incerto` (definicao no proprio package 1, sem alterar formato externo).

**PARE** se houver duvida aberta que possa alterar escopo, arquivos permitidos, criterio de aceite ou sensor obrigatorio.
