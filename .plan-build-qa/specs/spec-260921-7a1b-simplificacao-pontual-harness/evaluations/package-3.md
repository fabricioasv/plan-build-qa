# Evaluation: Package 3

Score: 1

## Resumo De Sensores

| Sensor | Tier | Obrigatorio | Status | Comando | Exit Code | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| npm-run-test | - | sim | passou | `npm run test` | 0 | npm notice run pbq-harness@0.8.0 test npm notice run node ./tests/pbq-init-smoke.mjs |
| pbq-analyze | - | sim | passou | `node ./bin/pbq.mjs analyze .` | 0 | ...: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-260627-3571-sensor-scope-local-global/package-4.md: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-260627-3571-sensor-scope-local-global/package-4.md: sensor obrigatorio citado sem nome cadastrado em sensors.json  - spec-260627-3571-sensor-scope-local-global/package-4.md: sensor obrigatorio citado sem nome cadastrado em sensors.json [pbq] Resumo: 0 violacoes, 37 warnings em 30 specs [pbq] Resultado: OK |

Status permitidos:

- `passou`
- `falhou`
- `pendente`
- `nao-aplicavel`

Regra:

- Todo sensor obrigatorio do contrato deve aparecer nesta tabela.
- `Score: 1` exige todos os sensores obrigatorios com status `passou`.
- Se algum sensor obrigatorio estiver `falhou`, `pendente` ou ausente, o Score deve ser `0`.

## Log De Execucao Dos Sensores

- Executado em: 2026-09-22T09:06:16.607Z
- Tiers: fast, medium, slow

## Resultado

Todos os sensores executados passaram (evidencia real acima, gerada por `pbq package close`). Verificacao
manual dos Criterios de Aceite, feita em 2026-09-22 por agente independente (sem heranca da tentativa
anterior nem do relato do implementador), reproduziu de forma ceptica o cenario exato que reprovou a
rodada anterior, testando o comportamento de verdade em diretorios isolados, nao so lendo codigo:

1. `node ./bin/pbq.mjs init <dir-isolado> --agents claude` nao gera `run-fast`/`run-medium`/`run-slow`
   (`.ps1`/`.sh`); so `run-commit`, `run-close` e `check-harness-structure` (`.ps1`/`.sh`) sao criados.
2. Instalacao antiga NAO customizada simulada: criei `.plan-build-qa/harness/scripts/run-fast.sh` com
   conteudo arbitrario e registrei o hash sha256 exato desse conteudo em `manifest.json` do dir de teste.
   `update --agents claude --dry-run` reportou `Would remove deprecated file: .../run-fast.sh` (nao mais
   silencio). `update` real removeu o arquivo de fato do disco (confirmado via `ls` apos o comando, nao so
   pelo log) e reportou `Deprecated file removed: ...`.
3. Variacao customizada: mesmo cenario, mas o conteudo em disco de `run-medium.sh` foi alterado apos
   registrar o hash antigo no manifest. `update` (dry-run e real) reportou `Deprecated file preservado
   (customizado): .../run-medium.sh` e o arquivo permaneceu intacto no disco com o conteudo customizado.
4. Regressao do Package 5 confirmada intacta: `init --agents claude,cursor` seguido de
   `update --agents claude` em dir isolado removeu de verdade todos os `.cursor/commands/*.md` (log
   `Agent file removed` por arquivo, diretorio ficou vazio apos o comando).
5. `grep` em `tests/pbq-init-smoke.mjs` confirmou os 2 testes de regressao citados pelo implementador
   (cenario nao-customizado com remocao real, linhas ~1662-1698; cenario customizado com preservacao,
   linhas ~1702-1733) existem de fato e rodam dentro de `npm run test` (exit 0).
6. Os 6 arquivos `run-fast/medium/slow.{ps1,sh}` continuam ausentes de `templates/harness/scripts/`
   (diretorio nem existe) e de `.plan-build-qa/harness/scripts/` (contem so `check-harness-structure.*`,
   `run-close.*`, `run-commit.*`).
7. `grep -n "run-fast\|run-medium\|run-slow"` em `manifest.json`, `README.md` e
   `.plan-build-qa/harness/README.md` deste repo retornou 0 ocorrencias.

## Evidencias

Ver tabela de sensores (evidencia real de `pbq package close`) e a lista numerada em "Resultado" acima
(verificacao manual em diretorios isolados).

## Violacoes Encontradas

Nenhuma que bloqueie os Criterios de Aceite do contrato.

## Riscos Residuais

Nao-bloqueante (mesma classe ja documentada para o Package 5 em `progress.md`): apos `update` real remover
um arquivo deprecado orfao do disco, a entrada correspondente em `manifest.json` do repo consumidor nao
desaparece automaticamente — so e removida no `manifest.json.pbq-new` gerado ao lado, ate merge manual.
Motivo: `manifest.json` e excluido do proprio mapa de hashes que ele guarda (`withManifest`,
bin/pbq.mjs), entao qualquer mudanca nele (inclusive remocao de uma entrada deprecada) gera `.pbq-new` em
vez de sobrescrita automatica. Confirmado empiricamente nesta verificacao. Nao bloqueia nenhum Criterio de
Aceite literal do contrato do Package 3 (que trata do `manifest.json` deste proprio repo, ja sem os 6
caminhos, nao do auto-update do manifest de repos consumidores). Risco a observar em repos consumidores
(netview/max).

## Proxima Acao Recomendada

Nenhuma para este package. `progress.md` e `roadmap.md` ja atualizados nesta rodada — spec marcada
`concluido` (todos os 6 packages com Score 1 confirmado por verificacao independente).
