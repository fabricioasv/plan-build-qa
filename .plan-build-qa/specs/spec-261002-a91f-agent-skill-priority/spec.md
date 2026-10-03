# Spec: agent-skill-priority

Spec ID: 261002-a91f

## Objetivo

Gerar conteudo completo da skill para o primeiro agente informado em `--agents` e referencias apenas para os demais. O update deve gravar arquivos gerenciados diretamente, sem candidatos `.pbq-new`.

## Contexto

O Cursor atualmente recebe um comando de referencia mesmo quando e o unico agente. Arquivos existentes equivalentes com espacos ou linhas vazias nas extremidades geram candidatos desnecessarios no update.

## Escopo

Geracao de skills por `pbq init`/`pbq update`, transicao de artefatos gerenciados, comparacao de conteudo e testes/documentacao associados.

## Fora de Escopo

Alterar o conteudo canonico das skills ou o formato de specs existentes.

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Aplicar prioridade e comparacao normalizada | concluido | pbq-analyze, npm-run-test |
| 2 | Sobrescrever arquivos gerenciados no update | concluido | pbq-analyze, npm-run-test |
| 3 | Usar ordem de `--agents` para definir skill principal | concluido | pbq-analyze, npm-run-test |
| 4 | Proteger regras locais de constitution no update | concluido | pbq-analyze, npm-run-test |
| 5 | Exibir tabela de constitution em init/update | concluido | pbq-analyze, npm-run-test |

## Riscos

Transicoes de selecao de agentes podem preservar arquivos customizados antigos; referencias devem apontar para um artefato efetivamente gerado.

## Sensores Esperados

`pbq-analyze` e `npm-run-test`.

## Criterios de Conclusao

Packages 1 a 5 com Score 1; ordem de agente coberta em init/update, update sem novos `.pbq-new`, regras locais de constitution preservadas ate revisao e decisao visivel na saida do CLI.

## Enforcement

Enforcement: advisory
