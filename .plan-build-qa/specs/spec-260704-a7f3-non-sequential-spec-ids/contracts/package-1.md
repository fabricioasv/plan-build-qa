# Contract: Package 1

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

Package 1 - IDs nao sequenciais de spec

## Objetivo

Permitir que specs novas usem o formato `spec-YYMMDD-hex-slug`, preservar compatibilidade com specs legadas `spec-NNN-slug` e fazer `pbq update` migrar specs materializadas legadas consultando a data de criacao do `spec.md`.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `README.md`
- `templates/specs/README.md`
- `.plan-build-qa/specs/README.md`
- `templates/harness/prompts/implement-package.md`
- `templates/harness/templates/spec.md`
- `templates/adapters/skills/spec/SKILL.md`
- `.agents/skills/spec/SKILL.md`
- `.claude/skills/spec/SKILL.md`
- `.plan-build-qa/harness/README.md`
- `.plan-build-qa/harness/prompts/implement-package.md`
- `.plan-build-qa/harness/templates/spec.md`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-260704-a7f3-non-sequential-spec-ids/progress.md`
- `.plan-build-qa/specs/spec-260704-a7f3-non-sequential-spec-ids/evaluations/package-1.md`
- `.plan-build-qa/roadmap.md`

## Arquivos Proibidos

- `package.json`
- `.plan-build-qa/sensors.json`
- Arquivos de specs antigas, exceto se alterados automaticamente por um teste temporario fora do repositorio real.

## Mudancas Permitidas

- Ajustar validacao/parsing de nomes de spec para aceitar `spec-NNN-slug` e `spec-YYMMDD-hex-slug`.
- Adicionar migracao em `pbq update` para renomear specs materializadas legadas e atualizar referencias no roadmap.
- Gerar sufixo hexadecimal deterministico por nome/data quando migrando specs existentes.
- Atualizar documentacao e templates para o novo padrao.
- Adicionar testes que criem fixtures temporarias e validem migracao, parser e compatibilidade legada.

## Mudancas Proibidas

- Remover suporte a specs legadas.
- Renomear specs reais existentes neste repositorio como parte manual da implementacao.
- Alterar semantica de contratos, evaluations, sensores ou package close fora do necessario para localizar specs por nome.
- Relaxar sensores ou asserts existentes.

## Criterios de Aceite

- AC1: `parseRoadmapSpecRows` ou o fluxo equivalente conta specs com nome `spec-260704-a7f3-demo` como spec valida.
- AC2: Specs legadas `spec-001-demo` continuam validas para analyze/dashboard/package close.
- AC3: `pbq update <repo>` renomeia diretorio legado materializado `spec-001-demo` para `spec-YYMMDD-hex-demo`, onde `YYMMDD` vem da data de criacao de `spec.md` e `hex` tem quatro caracteres hexadecimais.
- AC4: Quando a migracao renomeia a spec, o roadmap do repo alvo troca a referencia antiga pela nova.
- AC5: Se o destino ja existe, `pbq update` evita sobrescrever e escolhe um sufixo hexadecimal alternativo ou preserva a spec antiga com aviso explicito.
- AC6: README, templates e skill `spec` orientam o novo formato e mencionam compatibilidade com legado.

## Sensores Obrigatorios

| Sensor | Scope | Tier | Comando | Motivo |
| --- | --- | --- | --- | --- |
| pbq-analyze | global | fast | `node ./bin/pbq.mjs analyze .` | Validacao de coerencia do harness |
| npm-run-test | global | medium | `npm run test` | Suite smoke cobre init/update/analyze/dashboard |

## Riscos

- Em alguns filesystems, a data de criacao pode ser igual a data de copia. O comportamento ainda deve ser deterministico e documentado.
- Renomear paths pode exigir atualizacao de referencias externas fora do roadmap; fora do escopo deste package.

## Rollback

Reverter as alteracoes deste package e restaurar os textos antigos. Em repositorios alvo ja migrados, renomear manualmente os diretorios de volta e trocar as referencias no roadmap.

## Observabilidade

`pbq update` deve imprimir uma linha informando cada spec migrada ou colisao evitada.

## Duvidas Abertas

Nenhuma.
