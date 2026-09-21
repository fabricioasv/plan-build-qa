# Contract: Package 1 - fundacao de sensor scope local/global

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

1

## Objetivo

Introduzir a fundacao do modelo de sensores com escopo local/global sem alterar ainda a execucao do gate `pbq package close`: `sensors.json` passa a aceitar `scope`, sensor sem `scope` continua global, e o PBQ ganha parser/testes para reconhecer sensores locais declarados em contratos.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-025-sensor-scope-local-global/progress.md`

## Arquivos Proibidos

- Qualquer arquivo fora da lista de permitidos.
- Templates, skills e constitution (reservados para package posterior).
- Logica de execucao final do `pbq package close` para sensores locais (reservada para package posterior).
- Mudancas em `pbq guard`, hooks, CI/CD ou dashboard.

## Mudancas Permitidas

1. Normalizar sensores lidos de `.plan-build-qa/sensors.json` para expor `scope: "global"` quando o campo estiver ausente.
2. Preservar escrita backward compatible: entradas existentes podem ganhar `scope: "global"` somente se o caminho de normalizacao/escrita ja reserializar sensores; nao fazer migracao massiva sem necessidade.
3. Adicionar parser/helper para sensores locais declarados no contrato, aceitando uma tabela objetiva sob `## Sensores Obrigatorios` com colunas equivalentes a:
   - `Sensor` ou `Nome`;
   - `Scope` ou `Escopo` com valor `local`/`package` ou `global`;
   - `Tier`;
   - `Comando` ou `Command`;
   - `Motivo` ou `Reason` quando presente.
4. Tratar como sensor local somente linhas com escopo local/package e comando nao vazio.
5. Manter contratos antigos funcionando: linhas que so nomeiam sensores continuam sendo referencias a sensores globais registrados.
6. Adicionar testes em `tests/pbq-init-smoke.mjs` cobrindo normalizacao de escopo e parsing de sensores locais.

## Mudancas Proibidas

- Nao executar sensores locais neste package.
- Nao alterar o formato da evaluation neste package.
- Nao exigir que todos os sensores globais existentes recebam `scope` explicitamente.
- Nao remover `tier`, `on`, `phase` legado ou compatibilidade v2.
- Nao modificar o registry real `.plan-build-qa/sensors.json` fora do necessario para testes fixtures temporarios.

## Criterios de Aceite

| # | Criterio | Verificacao |
| --- | --- | --- |
| AC1 | Sensor de `sensors.json` sem `scope` e normalizado como `global` em memoria | teste automatizado cobre leitura/normalizacao |
| AC2 | Sensor com `scope: "global"` continua aceito | teste automatizado cobre leitura explicita |
| AC3 | Contrato com tabela de sensor local contendo `Scope=local` e `Comando` e reconhecido pelo parser como sensor local executavel futuramente | teste automatizado cobre nome, tier, comando e scope |
| AC4 | Contrato antigo que lista apenas nome de sensor continua sendo tratado como referencia global | teste automatizado cobre comportamento legado |
| AC5 | Linha com `Scope=local` mas sem comando nao e tratada como sensor local valido | teste automatizado cobre diagnostico/ignorar como local executavel |
| AC6 | Nenhuma mudanca de comportamento em `pbq package close` para execucao de sensores locais neste package | ausencia de alteracao na evaluation/execucao local; testes existentes permanecem verdes |
| AC7 | `npm run test` passa | exit 0 |
| AC8 | `node ./bin/pbq.mjs analyze .` nao introduz violacoes novas desta spec | exit 0 ou justificativa registrada se houver violacao pre-existente fora do escopo |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |
| pbq-analyze | fast | `pbq-analyze` | `node ./bin/pbq.mjs analyze .` |

## Riscos

- O parser pode ficar permissivo demais e confundir texto livre com sensor local. Mitigacao: exigir escopo local/package e comando nao vazio.
- A normalizacao pode alterar output serializado sem necessidade. Mitigacao: preferir default em memoria e testes, evitando migracao massiva.
- A spec-021 pode mudar helpers relacionados a sensores obrigatorios antes deste package ser implementado. Mitigacao: ao implementar, reler `bin/pbq.mjs` e adaptar o contrato se a spec-021 tiver sido fechada.

## Rollback

Reverter o commit do package. Como este package nao altera execucao de sensores locais nem formato de evaluation, o rollback deve se limitar aos helpers/testes adicionados.

## Observabilidade

- Testes devem deixar claro quando uma linha de contrato foi classificada como referencia global versus sensor local.
- Falhas de parsing devem produzir mensagens suficientemente objetivas para o agente corrigir o contrato.

## Duvidas Abertas

_(nenhuma)_
