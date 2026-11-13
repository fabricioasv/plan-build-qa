# Spec: Padronizar skills locais no update

Spec ID: 261112-c7e4

## Objetivo
Padronizar skills locais em pbq init/update usando o primeiro agente de --agents como fonte autoritativa.

## Escopo
Descobrir skills em .claude/skills, .agents/skills e .cursor/commands. Manter conteudo integral no principal e referencias diretas nos demais selecionados. Preservar recursos auxiliares da fonte, substituir secundarios divergentes por referencias e detectar fonte principal invalida antes das escritas.

## Fora de Escopo
Instalar skills globais, executar LLM ou remover skills locais de agentes nao selecionados.

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Validar e normalizar skills locais | concluido | npm-run-test, pbq-analyze |
| 2 | Priorizar fonte principal automaticamente em init/update | concluido | npm-run-test, pbq-analyze |

## Riscos
O primeiro agente define a fonte canonica. Copias secundarias divergentes sao substituidas por referencias por autorizacao explicita do usuario. Recursos secundarios antigos sao preservados sem mescla. Referencias invalidas da fonte principal continuam bloqueando.

## Sensores Esperados
npm-run-test e pbq-analyze.

## Criterios de Conclusao
Packages 1 e 2 com Score 1, prioridade automatica em init/update, troca de principal, dry-run, recursos e idempotencia cobertos.

## Enforcement
Enforcement: advisory

## Revisao de politica (Package 2)
Usuario relatou bloqueio merge-maxcore no MAX e determinou que o primeiro agente seja a base em init/update. Divergencias secundarias passam a ser substituidas por referencias automaticamente; a politica conservadora do Package 1 e superada.
