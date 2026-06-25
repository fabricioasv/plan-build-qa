# Contract: Package 2 — `pbq guard` + wiring de hooks

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

2

## Objetivo

Implementar `pbq guard --event <edit|commit|close>` (advisory por default, bloqueante quando `Enforcement: blocking` na spec ativa) e gerar automaticamente via `pbq init`/`update` o hook `PostToolUse` no settings.json do projeto alvo e o script `harness/hooks/pre-commit`.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `templates/adapters/skills/**` (se necessário para propagar mudanças)
- `.plan-build-qa/harness/templates/` (apenas arquivos de hook/script gerado, não spec/contract/evaluation)

## Arquivos Proibidos

- Skills em `.claude/skills/` (Package 3)
- Constitution, OVERVIEW (Package 3)
- `package.json`

## Mudancas Permitidas

1. **`pbq guard --event <edit|commit|close>` (novo subcomando)**:
   - Lê `sensors.json`, filtra por `on`⊇event e `enabled:true`.
   - Resolve spec ativa: lê `roadmap.md`, pega specs com status `em andamento`. Se 0 ou >1 → advisory (nunca bloqueia).
   - Lê flag `Enforcement: blocking|advisory` da spec ativa (`spec.md`); default `advisory` quando ausente.
   - Roda cada sensor via `runSensor` (do Package 1); imprime resultado por sensor.
   - Exit 0 sempre no modo advisory; exit 1 apenas no modo blocking com sensor falhado.
   - Evento `edit`: se path recebido (stdin JSON ou argv) estiver sob `.plan-build-qa/**`, também roda `pbq analyze`.
2. **`pbq hooks install|status` (novo subcomando)**:
   - `install`: configura git hook `core.hooksPath` apontando para `.plan-build-qa/harness/hooks/` ou copia script para `.git/hooks/pre-commit`. Não reconfigura silenciosamente no `init` — exige `pbq hooks install` explícito.
   - `status`: exibe se o hook está ativo, caminho configurado, e quantos sensores seriam rodados por evento.
3. **`pbq init`/`update` (geração de arquivos)**:
   - Gerar `.plan-build-qa/harness/hooks/pre-commit` (script sh + ps1) que chama `pbq guard --event commit`. Marcado em manifest.
   - Gerar/mesclar hook `PostToolUse` no `.claude/settings.json` do projeto alvo (matcher `Edit|Write|MultiEdit`) chamando `pbq guard --event edit`. **Merge**: preservar hooks pré-existentes.
4. **Testes**: casos cobrindo: `pbq guard --event commit` advisory (exit 0 com sensor falhado); `pbq guard --event commit` blocking (exit 1); 0 specs ativas → advisory; >1 spec ativa → advisory.

## Mudancas Proibidas

- Não ativar git hook automaticamente no `pbq init` sem `pbq hooks install` explícito.
- Não sobrescrever hooks pré-existentes no settings.json do alvo.
- Não alterar skills, constitution, templates de spec/contract/evaluation (Package 3).

## Criterios de Aceite

| # | Critério | Verificação |
| --- | --- | --- |
| AC1 | `pbq guard --event commit` (spec ativa = advisory) → imprime resultado dos sensores `on:commit`, exit 0 mesmo com sensor falhado | exit code 0 |
| AC2 | `pbq guard --event commit` com spec `Enforcement: blocking` e sensor falhado → exit 1 | exit code 1 |
| AC3 | 0 specs `em andamento` → advisory, exit 0 | exit code 0 |
| AC4 | >1 spec `em andamento` → advisory, exit 0 | exit code 0 |
| AC5 | `pbq guard --event edit` com path `.plan-build-qa/roadmap.md` → roda `pbq analyze` | output inclui `[pbq] Analyze` |
| AC6 | `pbq hooks status` exibe estado do hook | output legível sem erro |
| AC7 | `pbq update` gera `.plan-build-qa/harness/hooks/pre-commit` | arquivo presente |
| AC8 | `pbq update` mescla hook PostToolUse em `.claude/settings.json` preservando hooks existentes | hooks existentes intactos |
| AC9 | `npm run test` verde | exit 0 |
| AC10 | `node ./bin/pbq.mjs analyze .` sem violations | `[pbq] Resultado: OK` |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |

> `pbq-analyze` não é gate obrigatório neste package pelos mesmos motivos do Package 1:
> violações pré-existentes de spec-013 (`check-harness-structure` não cadastrado, specs `planejado`
> sem pasta). Verificação manual confirma que nenhuma violação nova foi introduzida por Package 2.

## Riscos

- Merge de settings.json pode corromper JSON se arquivo tiver comentários ou formatação não-padrão.
- `core.hooksPath` afeta todos os hooks git do repo — documentar claramente.

## Rollback

`git revert` dos commits do package. Remover `core.hooksPath` se instalado: `git config --unset core.hooksPath`.

## Observabilidade

- `pbq hooks status` mostra estado completo.
- `pbq guard --event commit --dry-run` (se implementado) lista sensores sem executar.

## Duvidas Abertas

- Formato exato do JSON de stdin que o hook PostToolUse envia (path do arquivo editado) — verificar schema do Claude Code hooks antes de implementar filtro de path.
