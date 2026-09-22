# Contract: Package 2

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

2

## Objetivo

Tirar `.plan-build-qa/dashboard/` do versionamento e documentar o dashboard como artefato derivado, gerado sob demanda.

## Arquivos Permitidos

- `.gitignore` (raiz, criar se nao existir)
- `.plan-build-qa/dashboard/` (remover do index via `git rm --cached`, manter local)
- `README.md`, `.plan-build-qa/harness/README.md` (secao de dashboard)
- `bin/pbq.mjs` (blocos `helpByTopic.run`/`.status`/`.dashboard`)

## Arquivos Proibidos

- Codigo de geracao do dashboard (`runDashboardCommand` e afins) fora do necessario para confirmar que ele recria o diretorio sob demanda — nao alterar logica de geracao neste package.

## Mudancas Permitidas

- Criar `.gitignore` na raiz com entrada para `.plan-build-qa/dashboard/`.
- Rodar `git rm --cached -r .plan-build-qa/dashboard` para parar de versionar sem apagar os arquivos localmente.
- Atualizar textos de ajuda/README para deixar explicito que o dashboard nao e mais versionado e deve ser gerado com `pbq dashboard`.

## Mudancas Proibidas

- Apagar fisicamente os arquivos do dashboard do disco.
- Alterar o schema JSON ou o HTML gerado pelo dashboard.

## Criterios de Aceite

- `.gitignore` existe na raiz e contem `.plan-build-qa/dashboard/`.
- `git status` nao lista mais `.plan-build-qa/dashboard/**` como tracked apos o `git rm --cached`.
- `node ./bin/pbq.mjs dashboard . --json` continua gerando `.plan-build-qa/dashboard/status.json` normalmente apos a mudanca.
- `pbq help run`/`pbq help dashboard` mencionam explicitamente que o dashboard e derivado e nao versionado.

## Sensores Obrigatorios

| Sensor | Scope | Tier | Comando | Motivo |
| --- | --- | --- | --- | --- |
| pbq-analyze | global | - | `node ./bin/pbq.mjs analyze .` | Confirma que remover o dashboard do versionamento nao quebra leitura de artefatos canonicos |
| npm-run-test | global | - | `npm run test` | Regressao do CLI |

## Riscos

- Repos consumidores que dependiam do dashboard versionado (para revisar historico via git diff) perdem esse historico local a partir de agora — aceitavel, pois o dashboard e derivado e pode ser regenerado a qualquer momento.

## Rollback

Reverter o commit deste package e re-adicionar `.plan-build-qa/dashboard/` ao git restaura o comportamento anterior; os arquivos nunca foram apagados do disco.

## Observabilidade

Nao aplicavel.

## Duvidas Abertas

Nenhuma.
