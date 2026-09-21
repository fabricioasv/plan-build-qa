# Contract: Package 2 - package close executa sensores locais e globais do contrato

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

2

## Objetivo

Fazer `pbq package close` ler `contracts/package-N.md` e executar a uniao entre sensores selecionados por tier/evento e sensores obrigatorios do contrato, incluindo:

- sensores globais referenciados por nome e registrados em `.plan-build-qa/sensors.json`;
- sensores locais inline declarados no contrato com `Scope=local` ou `Scope=package` e `Comando`/`Command` preenchido;
- sensores obrigatorios sem comando executavel como linha `pendente` na evaluation, com `Score: 0`.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-025-sensor-scope-local-global/progress.md`

## Arquivos Proibidos

- Qualquer arquivo fora da lista de permitidos.
- Templates, skills, constitution, README e dashboard visual HTML.
- `pbq sensor add/list` com `--scope` (Package 3).
- Docs/templates de orientacao sobre promocao local -> global (Package 4).
- Saneamento de sensores em repositorios alvo como MAX.

## Mudancas Permitidas

1. Em `runPackageCommand`, apos carregar sensores globais e antes de executar:
   - ler `.plan-build-qa/specs/<spec>/contracts/package-<N>.md` quando existir;
   - usar `parseContractRequiredSensors` para obter sensores obrigatorios;
   - montar a uniao por nome entre sensores selecionados por tier/evento e sensores obrigatorios do contrato.
2. Resolver sensores obrigatorios globais:
   - se o nome existe em `sensors.json`, executar mesmo que esteja fora do filtro `--tiers` ou fora do evento `on:close`;
   - deduplicar por nome quando o sensor ja foi selecionado por tier/evento.
3. Resolver sensores locais:
   - se `scope` normalizado for `local` e houver `command`, executar como sensor inline;
   - preencher `name`, `tier`, `command`, `required: "sim"` e evidencia real na evaluation;
   - nao gravar o sensor local em `.plan-build-qa/sensors.json`.
4. Resolver obrigatorios pendentes:
   - sensor global citado sem registro em `sensors.json` vira linha `pendente`;
   - sensor local sem comando vira linha `pendente`;
   - qualquer linha `pendente` deixa `Score: 0`.
5. Preservar comportamento quando nao existe contrato ou nao existe secao `## Sensores Obrigatorios`: executar apenas os sensores selecionados por tier/evento, como hoje.
6. Ajustar testes em `tests/pbq-init-smoke.mjs` para cobrir criterios de aceite abaixo.

## Mudancas Proibidas

- Nao alterar a sintaxe publica de `pbq package close`, exceto usar os dados do contrato ja informado por `--spec` e `--package`.
- Nao adicionar `pbq sensor add --scope` neste package.
- Nao alterar `pbq guard` ou hooks.
- Nao tornar local sem comando um sucesso silencioso.
- Nao remover a execucao de sensores selecionados por tier/evento; a regra e uniao, nao substituicao.
- Nao mudar o formato geral da evaluation alem de preencher as linhas de sensores ja existentes.

## Criterios de Aceite

| # | Criterio | Verificacao |
| --- | --- | --- |
| AC1 | Contrato exige sensor global registrado, mas fora do filtro `--tiers` ou fora de `on:close`; `package close` ainda executa esse sensor | fixture com sensor `on:["commit"]` ou tier fora do filtro aparece na evaluation com status `passou` |
| AC2 | Contrato exige sensor local inline com `Scope=local` e `Comando`; `package close` executa o comando e registra evidencia na evaluation | fixture com `echo local-ok` aparece na tabela e `Score: 1` quando tudo passa |
| AC3 | Sensor local inline que falha deixa `Score: 0` | fixture com comando `exit 1` gera status `falhou` e `Score: 0` |
| AC4 | Sensor local sem comando vira `pendente` e deixa `Score: 0` | fixture com `Scope=local` e comando vazio gera linha `pendente` |
| AC5 | Sensor global obrigatorio ausente de `sensors.json` vira `pendente` e deixa `Score: 0` | fixture com nome inexistente gera linha `pendente` |
| AC6 | Sensor selecionado por tier/evento e tambem obrigatorio no contrato aparece uma unica vez | evaluation contem uma linha para o nome |
| AC7 | Sem contrato ou sem secao `## Sensores Obrigatorios`, comportamento atual e preservado | fixture sem secao roda somente selecionados por tier/evento |
| AC8 | Sensor local inline nao e persistido em `.plan-build-qa/sensors.json` | comparar `sensors.json` antes/depois |
| AC9 | `npm run test` passa | exit 0 |
| AC10 | `node ./bin/pbq.mjs analyze .` nao introduz violacoes novas desta spec | exit 0 ou justificativa registrada se houver warning pre-existente |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |
| pbq-analyze | fast | `pbq-analyze` | `node ./bin/pbq.mjs analyze .` |

## Riscos

- Sobreposicao com a `spec-021-package-close-contract-driven`, que tambem mira `package close` orientado ao contrato. Mitigacao: este package implementa a uniao contrato + tier/evento incluindo locais; ao final, registrar no progresso se a `spec-021` ficou funcionalmente absorvida ou se ainda precisa de ajuste separado.
- Execucao de comandos locais inline aumenta responsabilidade do contrato. Mitigacao: local sem comando nao passa; comando falho falha o package; evidence e exit code ficam na evaluation.
- Comandos locais podem depender de quoting shell. Mitigacao: seguir o mesmo runner `shell:true` usado por sensores globais e cobrir casos simples em fixture.

## Rollback

Reverter o commit do package. O rollback deve restaurar o comportamento anterior de `pbq package close`, que executa apenas sensores de `sensors.json` filtrados por tier/evento.

## Observabilidade

- Evaluation deve mostrar cada sensor executado ou pendente com `Sensor`, `Tier`, `Obrigatorio`, `Status`, `Comando`, `Exit Code` e `Evidencia`.
- Testes devem cobrir Score 1 e Score 0 para sensores locais.
- `sensors.json` nao deve mudar ao fechar package com sensores locais.

## Duvidas Abertas

_(nenhuma)_
