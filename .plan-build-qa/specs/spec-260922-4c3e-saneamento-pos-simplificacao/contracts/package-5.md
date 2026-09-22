# Contract: Package 5

> **PLACEHOLDER — nao aprovado para implementacao.** Esqueleto criado apenas para satisfazer a regra do harness de que todo package declarado na tabela da spec precisa ter contrato materializado (decisao `spec-012-spec-creates-all-contracts`). Antes de implementar, reabrir esta spec via skill `spec`, preencher todas as secoes abaixo com objetivo, arquivos e criterios reais, e rodar `test` em modo `contract-check` normalmente.

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

5

## Objetivo

Remover a coluna `Tier` vestigial do gerador de evaluation em `bin/pbq.mjs` (~linha 2283) e corrigir `--tiers` de `pbq package close` para ser de fato sem efeito quando passado explicitamente (hoje filtra por `sensor.tier || sensor.runnerBucket`). Detalhamento completo fica para quando este package for puxado.

## Arquivos Permitidos

TBD ao puxar o package — provavelmente `bin/pbq.mjs` (gerador de evaluation, filtro de `--tiers`, `runnerBucket`).

## Arquivos Proibidos

TBD.

## Mudancas Permitidas

TBD.

## Mudancas Proibidas

**NUNCA** inclua refactor amplo, mudanca funcional extra ou ajuste de teste fora do objetivo deste package.

## Criterios de Aceite

TBD — precisa ser definido de forma objetiva antes de qualquer implementacao (ver regra de bloqueio acima).

## Sensores Obrigatorios

| Sensor | Scope | Comando | Motivo |
| --- | --- | --- | --- |
| pbq-analyze | global | `node ./bin/pbq.mjs analyze .` | Invariante reutilizavel ja cadastrado em sensors.json |
| npm-run-test | global | `npm run test` | Invariante reutilizavel ja cadastrado em sensors.json |

## Riscos

TBD — `runnerBucket` ainda sustenta o filtro real de `--tiers`; remover sem cuidado pode reintroduzir a regressao ja corrigida no Package 1 da spec 7a1b.

## Rollback

TBD.

## Observabilidade

TBD.

## Duvidas Abertas

**PARE** — este package inteiro e um placeholder; nao ha decisao de escopo tomada ainda.
