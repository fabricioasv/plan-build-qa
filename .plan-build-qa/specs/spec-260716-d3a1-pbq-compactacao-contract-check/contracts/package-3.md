# Contract: Package 3

## Package

Package 3 - snapshots derivados e dashboard.

## Objetivo

Evitar que artefatos derivados, especialmente `.plan-build-qa/dashboard/`, sejam tratados como fonte canonica versionada por default.

## Arquivos Permitidos

| Caminho | Mudanca |
| --- | --- |
| `bin/pbq.mjs` | Ajustar init/update/dashboard para orientar ou gerar ignore de snapshots derivados |
| `README.md` | Documentar fluxo recomendado de dashboard sob demanda |
| `.plan-build-qa/harness/README.md` | Atualizar orientacao local do harness |
| `templates/harness/README.md` | Propagar orientacao para novas instalacoes |
| `tests/pbq-init-smoke.mjs` | Cobrir comportamento de ignore/orientacao |
| `.plan-build-qa/specs/spec-260716-d3a1-pbq-compactacao-contract-check/progress.md` | Registrar progresso |
| `.plan-build-qa/specs/spec-260716-d3a1-pbq-compactacao-contract-check/evaluations/package-3.md` | Registrar resultado |

## Arquivos Proibidos

- Remover arquivos versionados existentes de repos consumidores.
- Alterar layout visual do dashboard sem necessidade para o objetivo.
- Compactar templates gerais; pertence ao Package 2.

## Mudancas Permitidas

- Adicionar orientacao para nao versionar `.plan-build-qa/dashboard/` por default.
- Gerar ou sugerir entrada de `.gitignore` em instalacoes novas, se isso for compativel com o modelo atual do `pbq init`.
- Preservar comando `pbq dashboard --output` para quem quiser versionar explicitamente um snapshot.
- Atualizar textos de ajuda para deixar claro que dashboard e derivado.

## Mudancas Proibidas

- Quebrar `pbq dashboard --json`, `--serve`, `--watch` ou `--output`.
- Apagar snapshots existentes automaticamente.
- Fazer alteracoes destrutivas em `.gitignore` sem preservacao de conteudo do usuario.

## Criterios de Aceite

1. Novas instalacoes recebem orientacao objetiva para tratar `.plan-build-qa/dashboard/` como derivado.
2. Teste cobre que `pbq dashboard --json` continua funcionando.
3. Teste cobre que o fluxo de snapshot continua gerando `status.json` e `index.html` quando solicitado.
4. Nenhum snapshot existente e removido automaticamente.
5. `npm run test` passa.
6. `pbq analyze .` passa.

## Sensores Obrigatorios

| Sensor | Scope | Tier | Comando | Motivo |
| --- | --- | --- | --- | --- |
| pbq-analyze | global | fast |  | Valida coerencia do harness |
| npm-run-test | global | medium |  | Cobre regressao do dashboard/init |

## Riscos

- Alguns usuarios podem depender de snapshots versionados em CI ou docs.
- Alterar `.gitignore` automaticamente pode conflitar com politicas locais.

## Rollback

Reverter alteracoes de documentacao, init/update/dashboard e testes do Package 3.

## Observabilidade

Registrar se a decisao final foi "gerar ignore" ou apenas "documentar/sugerir ignore", com motivo.

## Duvidas Abertas

Nenhuma para este package.
