# Contract: Package 4

> **PLACEHOLDER — nao aprovado para implementacao.** Esqueleto criado apenas para satisfazer a regra do harness de que todo package declarado na tabela da spec precisa ter contrato materializado (decisao `spec-012-spec-creates-all-contracts`). Antes de implementar, reabrir esta spec via skill `spec`, preencher todas as secoes abaixo com objetivo, arquivos e criterios reais, e rodar `test` em modo `contract-check` normalmente.

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

4

## Objetivo

Corrigir `manifest.json` para se auto-atualizar durante `pbq update` (hoje `withManifest` exclui o proprio `manifest.json` do mapa de hashes que ele guarda, entao mudancas nele sempre geram `.pbq-new` em vez de sobrescrita automatica). Detalhamento completo fica para quando este package for puxado.

## Arquivos Permitidos

TBD ao puxar o package — provavelmente `bin/pbq.mjs` (`withManifest`, `runUpdateCommand`).

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

TBD — cuidado ao mexer em `withManifest`, ja que ele e usado por `pbq update` para decidir customizado/nao-customizado em todos os outros arquivos gerenciados.

## Rollback

TBD.

## Observabilidade

TBD.

## Duvidas Abertas

**PARE** — este package inteiro e um placeholder; nao ha decisao de escopo tomada ainda.
