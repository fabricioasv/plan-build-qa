# Spec: spec-024-bug-investigation-only

## Objetivo

Ajustar a skill `/bug` para que ela crie/atualize o registro de bug e conduza somente a investigacao inicial, deixando correcao, implementacao e validacao para o fluxo `/implement` -> `/test`.

## Contexto

A `spec-023-bug-command` criou a skill `/bug` com fluxo `Investigacao` -> `Correcao` -> `Teste`. Esse desenho permite que a mesma skill investigue, corrija e valide, o que conflita com a separacao operacional desejada: bug records devem preservar evidencia do problema e hipoteses; a mudanca de codigo deve ser tratada por spec/package e executada por `/implement`.

A nova regra esperada e que `/bug` execute apenas:

1. localizar ou criar o bug record;
2. criar ou atualizar `bug.md` e `progress.md`;
3. preencher a investigacao com reproducao, comportamento observado/esperado, ambiente, evidencia e hipoteses.

## Escopo

- Atualizar as instrucoes da skill `/bug` nas copias locais e nos templates distribuidos.
- Ajustar templates de bug/progresso se eles incentivarem correcao/teste dentro da propria `/bug`.
- Registrar que correcao, alteracao de codigo e validacao pertencem ao fluxo `/spec`/`/implement`/`/test`.
- Cobrir o comportamento esperado em teste automatizado de smoke ou verificacao textual equivalente.

## Fora de Escopo

- Implementar a alteracao nesta etapa de spec.
- Alterar o fluxo de `/implement` ou `/test`.
- Criar subcomando CLI `pbq bug`.
- Remover secoes historicas de bug records ja existentes.
- Corrigir um bug real de produto.

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Restringir `/bug` a registro e investigacao, direcionando correcao para `/implement` | planejado | pbq-analyze, npm-run-test |

## Riscos

- Se a skill mantiver verbos como "corrigir", "aplicar correcao" ou "rodar testes" como responsabilidade direta de `/bug`, agentes podem continuar executando implementacao fora do fluxo contratado.
- Se os templates removerem totalmente secoes de correcao/teste, registros de bugs fechados podem perder local para referenciar a spec/package/evaluation que resolveu o problema.
- Repositorios inicializados por `pbq init`/`update` podem continuar recebendo a instrucao antiga se apenas a copia local for alterada.

## Sensores Esperados

- `pbq-analyze`: `node ./bin/pbq.mjs analyze .`
- `npm-run-test`: `npm run test`

## Criterios de Conclusao

- A skill `/bug` nas copias locais e nos templates declara explicitamente que nao implementa correcao nem roda a validacao final.
- O workflow da skill `/bug` termina apos criar/atualizar o registro e preencher a investigacao, salvo quando apenas documentar encaminhamento para spec/package.
- Qualquer referencia a `Correcao` e `Teste` em templates de bug passa a ser registro de encaminhamento/evidencia produzida por `/implement` e `/test`, nao trabalho executado pela propria `/bug`.
- O teste automatizado falha se a skill distribuida voltar a instruir `/bug` a aplicar correcao ou executar teste de aceite.
- `pbq-analyze` e `npm-run-test` passam no fechamento do package.

## Enforcement

Enforcement: advisory
