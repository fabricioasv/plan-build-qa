# Contract: Package 3

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

3

## Objetivo

Remover os runners depreciados `run-fast`/`run-medium`/`run-slow` (`.ps1`/`.sh`) de templates, harness instalado e manifest.

## Arquivos Permitidos

- `templates/harness/scripts/run-fast.ps1`, `run-fast.sh`, `run-medium.ps1`, `run-medium.sh`, `run-slow.ps1`, `run-slow.sh` (remover)
- `.plan-build-qa/harness/scripts/run-fast.ps1`, `run-fast.sh`, `run-medium.ps1`, `run-medium.sh`, `run-slow.ps1`, `run-slow.sh` (remover)
- `.plan-build-qa/manifest.json`, `templates/manifest` equivalente se houver (remover entradas de hash desses 6 arquivos)
- `bin/pbq.mjs` (funcao que gera os scripts em `init`/`update`)
- `README.md`, `.plan-build-qa/harness/README.md` (secao "Runners por tier (deprecated)")

## Arquivos Proibidos

- `run-commit.ps1`/`.sh`, `run-close.ps1`/`.sh` (permanecem intactos).
- `check-harness-structure.ps1`/`.sh` (fora de escopo).

## Mudancas Permitidas

- Apagar os 6 arquivos de runner deprecado, nos dois locais (fonte e instalado).
- Remover as entradas correspondentes do `manifest.json` para que `pbq update` os apague em instalacoes existentes.
- Remover geracao desses arquivos em `bin/pbq.mjs` (`init`).
- Remover a secao "Runners por tier (deprecated...)" do README/harness README.

## Mudancas Proibidas

- Alterar `run-commit`/`run-close`.
- Adicionar migracao automatica que apague scripts customizados pelo usuario em repos consumidores sem passar pelo fluxo normal de "customizado -> preservar + `.pbq-new`" do `pbq update`.

## Criterios de Aceite

- Os 6 arquivos `run-fast/medium/slow.*` nao existem mais em `templates/harness/scripts/` nem em `.plan-build-qa/harness/scripts/`.
- `node ./bin/pbq.mjs init <dir-teste> --agents claude` (apos Package 5) nao gera mais esses 6 arquivos.
- `node ./bin/pbq.mjs update <dir-com-instalacao-antiga> --dry-run` reporta remocao (ou preservacao se customizado) desses arquivos, nao recriacao.
- `manifest.json` deste repo nao referencia mais esses 6 caminhos.

## Sensores Obrigatorios

| Sensor | Scope | Tier | Comando | Motivo |
| --- | --- | --- | --- | --- |
| pbq-analyze | global | - | `node ./bin/pbq.mjs analyze .` | Confirma coerencia do harness apos remocao |
| npm-run-test | global | - | `npm run test` | Regressao do CLI |

## Riscos

- Repo consumidor com script proprio que chama `run-fast.ps1`/`.sh` diretamente (fora do `pbq guard`) quebra — mitigar documentando a remocao como breaking change no README.

## Rollback

Reverter o commit deste package restaura os 6 arquivos e as entradas do manifest.

## Observabilidade

Nao aplicavel.

## Duvidas Abertas

Nenhuma.
