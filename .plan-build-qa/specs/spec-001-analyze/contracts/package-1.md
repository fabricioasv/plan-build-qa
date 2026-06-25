# Contract: Package 1

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

1

## Objetivo

Entregar a primeira versao util de `pbq analyze`, em modo somente leitura, para validar a coerencia minima entre `roadmap.md`, a existencia da pasta da spec, `progress.md`, `contracts/` e o uso basico de `evaluations/` quando houver packages fechados, com ajuda do CLI atualizada e cobertura automatizada.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/roadmap.md`
- `.plan-build-qa/specs/spec-001-analyze/spec.md`
- `.plan-build-qa/specs/spec-001-analyze/progress.md`
- `.plan-build-qa/specs/spec-001-analyze/contracts/package-1.md`
- `README.md`

## Arquivos Proibidos

- `package.json`
- `.plan-build-qa/constitution/**`
- `.plan-build-qa/harness/templates/**`
- `.plan-build-qa/sensors.json`
- qualquer arquivo fora da lista de arquivos permitidos

## Mudancas Permitidas

- Adicionar parsing do comando `analyze` no CLI atual.
- Implementar validacoes somente leitura sobre artefatos existentes em `.plan-build-qa/`.
- Atualizar ajuda/documentacao estritamente para descrever o novo comando.
- Ajustar ou adicionar asserts nos testes existentes para cobrir sucesso e falha do `analyze`.
- Atualizar `progress.md` desta spec com execucao e resultado do package.

## Mudancas Proibidas

- Corrigir ou reescrever automaticamente artefatos inconsistentes.
- Refatorar comandos nao relacionados (`init`, `update`, `sensor`, `run`, `package`) sem necessidade direta do package.
- Introduzir novas dependencias, novo formato de arquivo ou nova persistencia.
- Alterar sensores cadastrados ou scripts do harness para acomodar o comando.

**NUNCA** inclua refactor amplo, mudanca funcional extra ou ajuste de teste fora do objetivo deste package.

## Criterios de Aceite

- `pbq help` passa a listar `analyze` com descricao objetiva.
- `pbq help analyze` retorna uso do comando com status de saida esperados.
- `pbq analyze <path>` retorna exit code `0` quando o harness alvo contem, no minimo, `roadmap.md`, a pasta da spec referenciada, `progress.md` e o diretorio `contracts/`.
- `pbq analyze <path>` retorna exit code diferente de `0` e identifica a violacao quando faltar pelo menos um desses artefatos obrigatorios.
- Quando existir evidencia de package fechado no roadmap, em `progress.md` ou em `contracts/`, o comando verifica a presenca coerente de `evaluations/package-N.md` para esse package.
- O comando nao cria, altera ou remove arquivos do alvo analisado.
- Ha teste automatizado cobrindo ao menos um caso valido e um caso invalido do `analyze`.

## Sensores Obrigatorios

- Runner legado: `.\.plan-build-qa\harness\scripts\run-fast.ps1` (inclui check de estrutura; nao era sensor cadastrado em sensors.json na epoca)
- Medium | `npm-run-test` | `npm run test`

**OBRIGATORIO** listar sensores por nome/tier/comando esperado. Se um sensor ainda nao existir, registre como criar via `pbq sensor add`.

## Riscos

- A leitura do markdown do roadmap pode quebrar se a implementacao acoplar demais ao layout textual.
- O primeiro recorte pode ser util demais para virar um pseudo-linter completo antes da hora.

## Rollback

Reverter as mudancas deste package nos arquivos permitidos e remover qualquer teste especifico de `analyze` introduzido nele. Como o comando e somente leitura, nao ha rollback de dados.

## Observabilidade

O proprio stdout/stderr do CLI e a evidence dos testes automatizados serao a observabilidade deste package. Nao introduzir logs persistentes.

## Duvidas Abertas

Nenhuma aberta para iniciar o package 1.

**PARE** se houver duvida aberta que possa alterar escopo, arquivos permitidos, criterio de aceite ou sensor obrigatorio.
