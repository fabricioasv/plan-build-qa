# Contract: Package 3

> **PLACEHOLDER — nao aprovado para implementacao.** Esqueleto criado apenas para satisfazer a regra do harness de que todo package declarado na tabela da spec precisa ter contrato materializado (decisao `spec-012-spec-creates-all-contracts`). Este package especificamente e so um lembrete de roadmap: o trabalho real continua em `spec-260716-d3a1-pbq-compactacao-contract-check` (packages 2, 3 e 4 dela), nao aqui.

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

3

## Objetivo

Nenhuma implementacao acontece neste package. Ele existe so para lembrar, no roadmap desta spec, que `spec-260716-d3a1-pbq-compactacao-contract-check` ainda tem os packages 2, 3 e 4 `planejado`. Quando for retomar, trabalhe diretamente na spec 260716-d3a1 (abra `contracts/package-2.md` dela), nao aqui.

## Arquivos Permitidos

Nenhum — este package nao deve gerar nenhuma mudanca de codigo por si so.

## Arquivos Proibidos

Qualquer arquivo — mudancas reais pertencem a `spec-260716-d3a1-pbq-compactacao-contract-check`.

## Mudancas Permitidas

Nenhuma mudanca de codigo. No maximo, atualizar a linha desta spec no roadmap quando a spec 260716-d3a1 avancar.

## Mudancas Proibidas

**NUNCA** implemente compactacao de templates, dashboard como derivado ou diagnostico de peso aqui — isso e escopo de `spec-260716-d3a1-pbq-compactacao-contract-check`.

## Criterios de Aceite

Este package "fecha" (deixa de ser `planejado`) quando `spec-260716-d3a1-pbq-compactacao-contract-check` tiver seus packages 2, 3 e 4 concluidos — nao antes.

## Sensores Obrigatorios

| Sensor | Scope | Comando | Motivo |
| --- | --- | --- | --- |
| pbq-analyze | global | `node ./bin/pbq.mjs analyze .` | Invariante reutilizavel ja cadastrado em sensors.json |
| npm-run-test | global | `npm run test` | Invariante reutilizavel ja cadastrado em sensors.json |

## Riscos

Se `spec-260716-d3a1` mudar de escopo antes deste package ser reavaliado, esta referencia fica desatualizada.

## Rollback

Nao aplicavel (nenhuma mudanca de codigo).

## Observabilidade

Nao aplicavel.

## Duvidas Abertas

Nenhuma — este package e deliberadamente um ponteiro, nao um placeholder de trabalho real.
