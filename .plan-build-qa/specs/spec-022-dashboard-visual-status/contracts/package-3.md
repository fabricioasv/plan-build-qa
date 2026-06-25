# Contract: Package 3 - serve/watch e documentacao

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

3

## Objetivo

Adicionar modo operacional de acompanhamento ao dashboard com servidor HTTP local e refresh de snapshots, mais documentacao de uso para que a visualizacao funcione durante a execucao e posteriormente.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `README.md`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/progress.md`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/evaluations/package-3.md` (somente durante fechamento)

## Arquivos Proibidos

- Templates e skills
- `.plan-build-qa/sensors.json`
- `.plan-build-qa/constitution/**`
- Qualquer alteracao no gate `pbq package close`, no modelo de sensores ou nos hooks
- Dependencias novas em `package.json`

## Mudancas Permitidas

1. Adicionar `--serve`, `--watch` e `--port <N>` em `pbq dashboard`.
2. Usar somente APIs nativas de Node para:
   - gerar snapshots iniciais no diretorio de saida
   - servir `index.html` e `status.json`
   - regerar snapshots quando `--watch` estiver ativo
3. Atualizar ajuda/README com exemplos objetivos de uso.
4. Preservar comportamento existente de `pbq dashboard --json`, `pbq status` e `pbq run --resume`.

## Mudancas Proibidas

- Nao adicionar websocket ou dependencia externa.
- Nao abrir navegador automaticamente.
- Nao fazer o comando depender de acesso a internet.

## Criterios de Aceite

| # | Criterio | Verificacao |
| --- | --- | --- |
| AC1 | `pbq dashboard <fixture> --serve --port <N>` sobe servidor local e responde `200` para `/` e `/status.json` | Teste em `tests/pbq-init-smoke.mjs` |
| AC2 | `--watch` regenera `status.json` quando o roadmap/spec mudar no fixture | Teste altera arquivo e observa novo conteudo |
| AC3 | `README.md` documenta o fluxo de snapshot estatico e o modo `--serve` | Assertion textual |
| AC4 | `npm run test` passa | exit 0 |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |

## Riscos

- `fs.watch` pode ter comportamento variavel; manter implementacao tolerante e simples.
- Teste de servidor pode deixar processo pendurado; fechar explicitamente o child process.

## Rollback

Reverter o commit do Package 3. Encerrar processo local do servidor se estiver rodando.

## Observabilidade

- O proprio servidor local e os snapshots gerados sao a evidencia operacional do modo ao vivo.

## Duvidas Abertas

_(nenhuma)_
