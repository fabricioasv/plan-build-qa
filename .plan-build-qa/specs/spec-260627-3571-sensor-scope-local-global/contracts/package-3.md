# Contract: Package 3 - CLI e validacao de sensores locais

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

3

## Objetivo

Completar a superficie operacional do modelo local/global sem alterar documentacao ampla: `pbq sensor add/list` deve aceitar e expor `scope` para sensores globais, e `pbq analyze` deve aceitar sensores locais bem declarados em contratos sem exigir que eles existam em `.plan-build-qa/sensors.json`.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-025-sensor-scope-local-global/progress.md`

## Arquivos Proibidos

- Qualquer arquivo fora da lista de permitidos.
- Templates, skills, constitution, README e ajuda textual extensa (Package 4).
- Mudancas em `pbq package close` alem de ajustes inevitaveis de helper compartilhado.
- Mudancas em hooks, dashboard visual HTML ou CI/CD.
- Saneamento de sensores em repositorios alvo como MAX.

## Mudancas Permitidas

1. `pbq sensor add`:
   - aceitar `--scope global|local|package`;
   - persistir apenas `scope: "global"` no registry global;
   - rejeitar `--scope local`/`package` com mensagem clara, porque sensor local deve nascer em contrato/evaluation, nao em `.plan-build-qa/sensors.json`.
2. `pbq sensor list`:
   - exibir coluna/valor de `scope`, com default `global` para sensores antigos sem campo.
3. `pbq sensor catalog` e `--from-catalog`:
   - manter comportamento existente; entradas adicionadas continuam globais por default.
4. `pbq analyze`:
   - ao validar `## Sensores Obrigatorios`, nao gerar violacao "nao cadastrado em sensors.json" para sensor local bem declarado (`scope local/package` + comando preenchido);
   - gerar warning/violacao objetiva para sensor local sem comando, sem trata-lo como global ausente;
   - manter violacao para sensor global ausente em `sensors.json`;
   - manter enforcement contract/evaluation por nome para sensores locais e globais quando houver evaluation.
5. Dashboard JSON/modelo, se necessario:
   - preservar metadados de `scope`, `local`, `command` e `registered` ja introduzidos no Package 1.
6. Testes:
   - adicionar fixtures para `sensor add/list --scope`;
   - adicionar fixtures para `analyze` com sensor local bem declarado e local sem comando.

## Mudancas Proibidas

- Nao permitir que `pbq sensor add --scope local` grave sensor local no registry.
- Nao remover compatibilidade com sensores sem `scope`.
- Nao relaxar enforcement de evaluation: sensor obrigatorio local continua precisando aparecer/passar quando o package esta fechado.
- Nao atualizar textos de skills/templates neste package.

## Criterios de Aceite

| # | Criterio | Verificacao |
| --- | --- | --- |
| AC1 | `pbq sensor add --scope global` grava sensor global em `sensors.json` com `scope: "global"` | fixture le `sensors.json` apos add |
| AC2 | `pbq sensor add` sem `--scope` mantem compatibilidade e resulta em sensor global | fixture confirma `scope: "global"` em memoria/listagem ou arquivo |
| AC3 | `pbq sensor add --scope local` e `--scope package` falham e nao alteram `sensors.json` | fixture compara arquivo antes/depois e exit code diferente de zero |
| AC4 | `pbq sensor list` mostra o scope de cada sensor | fixture confere saida contendo `global` |
| AC5 | `pbq analyze` aceita sensor local bem declarado em contrato sem exigir cadastro em `sensors.json` | fixture com contrato local+comando gera 0 violacoes relacionadas ao nome |
| AC6 | `pbq analyze` sinaliza sensor local sem comando como problema objetivo | fixture com `Scope=local` e comando vazio gera warning ou violacao especifica de comando ausente |
| AC7 | `pbq analyze` continua violando sensor global ausente em `sensors.json` | fixture com `Scope=global` ausente gera violacao existente |
| AC8 | Enforcement contract/evaluation continua funcionando para sensor local: se evaluation de package fechado lista local com `falhou`, analyze viola | fixture com progress fechado + evaluation falha gera violacao |
| AC9 | `npm run test` passa | exit 0 |
| AC10 | `node ./bin/pbq.mjs analyze .` passa para o repo atual | exit 0 |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |
| pbq-analyze | fast | `pbq-analyze` | `node ./bin/pbq.mjs analyze .` |

## Riscos

- `pbq sensor add --scope local` pode parecer util, mas gravar local no registry contraria a decisao central. Mitigacao: falhar explicitamente e orientar contrato.
- `analyze` pode ficar permissivo demais. Mitigacao: exigir `scope local/package` e comando preenchido para dispensar registro global.
- Warnings pre-existentes do repo podem permanecer. Mitigacao: criterios cobrem violacoes novas, nao saneamento global.

## Rollback

Reverter o commit do package. O rollback deve restaurar `pbq sensor add/list` e `pbq analyze` ao comportamento anterior, mantendo os Packages 1 e 2 como ultimo estado funcional.

## Observabilidade

- Mensagens de erro devem distinguir "sensor global ausente" de "sensor local sem comando".
- Fixtures devem cobrir tanto o caminho feliz local quanto os caminhos de rejeicao.

## Duvidas Abertas

_(nenhuma)_
