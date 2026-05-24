# Contract: Package 2

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

2

## Objetivo

Adicionar o subcomando `pbq sensor suggest [path]` que escaneia o alvo, calcula os candidatos a sensor (via mesmas regras introduzidas no package 1), filtra os ja presentes em `sensors.json` e imprime, para cada candidato pendente, um comando `pbq sensor add ...` pronto. Sem alterar arquivos do alvo. Cobrir por testes.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-014-melhora-deteccao-sensores/progress.md`
- `.plan-build-qa/specs/spec-014-melhora-deteccao-sensores/contracts/package-2.md`
- `.plan-build-qa/specs/spec-014-melhora-deteccao-sensores/evaluations/package-2.md`

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

- Adicionar branch `suggest` em `runSensorCommand` (ou helper dedicado) em `bin/pbq.mjs`.
- Reutilizar a deteccao do package 1 para calcular candidatos.
- Imprimir uma linha por candidato pendente em formato `pbq sensor add <path> --name <name> --tier <tier> --command <command> --reason <reason>`, com `[tier-incerto]` como sufixo na razao quando aplicavel.
- Filtrar candidatos cujo `command` ja esta presente em `sensors.json` (comparacao por string normalizada).
- Imprimir mensagem "Nenhum candidato pendente." quando nao houver nada a sugerir.
- Atualizar texto de ajuda do CLI (`pbq help sensor`) para incluir `suggest`.
- Adicionar testes cobrindo: sugerir candidatos novos, nao sugerir os ja cadastrados, mensagem de "nenhum candidato pendente", saida nao modifica `sensors.json`.
- Atualizar `progress.md` desta spec.

## Mudancas Proibidas

**NUNCA** inclua refactor amplo, mudanca funcional extra ou ajuste de teste fora do objetivo deste package.

- Nao cadastrar sensores automaticamente (sempre imprime, nunca grava).
- Nao alterar `pbq sensor add` ou `pbq sensor list`.
- Nao alterar a deteccao introduzida no package 1.
- Nao alterar o formato de `sensors.json`.
- Nao introduzir saida JSON (apenas texto).

## Criterios de Aceite

**OBRIGATORIO** definir criterios objetivos e verificaveis.

1. `pbq sensor suggest <path>` imprime uma linha `pbq sensor add ...` para cada candidato detectado e ainda nao cadastrado em `sensors.json`. Verificavel por regex e contagem de linhas.
2. `pbq sensor suggest <path>` nao imprime linha para candidatos cujo `command` ja esta em `sensors.json`. Verificavel por teste.
3. Quando nao ha candidatos pendentes, imprime exatamente uma linha contendo "Nenhum candidato pendente." e retorna exit code 0. Verificavel por teste.
4. `pbq sensor suggest <path>` nao altera nenhum arquivo do alvo (`sensors.json` e demais permanecem inalterados). Verificavel comparando conteudo antes/depois.
5. `pbq help sensor` documenta o subcomando `suggest` em ao menos uma linha objetiva. Verificavel por regex.
6. `tests/pbq-init-smoke.mjs` ganha ao menos 4 asserts novos cobrindo os criterios 1-4.
7. Sensores obrigatorios do package passam.
8. Evaluation do package 2 tem Score 1.

## Sensores Obrigatorios

**OBRIGATORIO** listar sensores por nome/tier/comando esperado.

- Fast | `check-harness-structure` | `.\.plan-build-qa\harness\scripts\run-fast.ps1`
- Medium | `npm-run-test` | `npm run test`

## Riscos

- Comparacao de comando "ja cadastrado" pode falhar por diferencas de path/quoting. Mitigacao: normalizar (trim + lowercase opcional) e cobrir nos testes.
- Output muito longo em projetos grandes. Mitigacao: ordenar por tier e por nome para previsibilidade.
- Confusao com `pbq sensor add` (que cadastra). Mitigacao: help deixa explicito que `suggest` so imprime.

## Rollback

`git revert` do commit do package 2. Subcomando novo isolado em `runSensorCommand`; revert restaura comportamento do package 1.

## Observabilidade

stdout do CLI + evidencia dos testes automatizados.

## Duvidas Abertas

- Forma exata de sinalizar `tier-incerto` no comando impresso (sufixo na `--reason` ou flag extra). Definir no proprio package 2 e registrar em `progress.md`.

**PARE** se houver duvida aberta que possa alterar escopo, arquivos permitidos, criterio de aceite ou sensor obrigatorio.
