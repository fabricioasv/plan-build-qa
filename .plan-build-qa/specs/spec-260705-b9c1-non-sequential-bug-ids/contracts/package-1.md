# Contract: Package 1

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

Package 1 - IDs nao sequenciais de bug

## Objetivo

Aplicar a registros de bug a mesma convencao `YYMMDD-hex-slug` usada para specs, incluindo migracao no `pbq update` de bugs legados materializados.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `templates/bugs/README.md`
- `.plan-build-qa/bugs/README.md`
- `templates/adapters/skills/bug/SKILL.md`
- `.agents/skills/bug/SKILL.md`
- `.claude/skills/bug/SKILL.md`
- `.plan-build-qa/roadmap.md`
- `.plan-build-qa/specs/spec-260705-b9c1-non-sequential-bug-ids/progress.md`
- `.plan-build-qa/specs/spec-260705-b9c1-non-sequential-bug-ids/evaluations/package-1.md`

## Arquivos Proibidos

- `.plan-build-qa/sensors.json`
- `package.json`
- Specs ou bugs antigos materializados no repositorio real.

## Mudancas Permitidas

- Adicionar regex/helpers para reconhecer e migrar nomes `bug-NNN-slug`.
- Reaproveitar ou generalizar a logica de data/hex usada em specs.
- Atualizar texto instalado de `/bug` e README de bugs.
- Adicionar testes com fixtures temporarias para validar migracao.

## Mudancas Proibidas

- Remover compatibilidade com bugs legados.
- Mudar o fluxo investigativo de `/bug`.
- Atualizar referencias externas fora de `.plan-build-qa/bugs/` automaticamente.
- Relaxar sensores ou asserts existentes.

## Criterios de Aceite

- AC1: `pbq update <repo>` renomeia `.plan-build-qa/bugs/bug-001-demo/` para `bug-YYMMDD-hex-demo/`.
- AC2: `YYMMDD` e derivado da data de criacao de `bug.md`, com fallback para `mtime`.
- AC3: A migracao nao sobrescreve diretorio existente; colisao escolhe outro sufixo hexadecimal.
- AC4: A saida de `pbq update` informa cada bug migrado.
- AC5: README de bugs e skills `/bug` orientam `bug-YYMMDD-hex-slug` e mencionam legado `bug-NNN-slug`.

## Sensores Obrigatorios

| Sensor | Scope | Tier | Comando | Motivo |
| --- | --- | --- | --- | --- |
| pbq-analyze | global | fast | `node ./bin/pbq.mjs analyze .` | Validacao de coerencia do harness |
| npm-run-test | global | medium | `npm run test` | Suite smoke cobre init/update/analyze |

## Riscos

- A data de criacao pode variar em copias de repositorio; o comportamento ainda deve ser deterministico.

## Rollback

Reverter as alteracoes deste package. Em repositorios alvo ja migrados, renomear manualmente `bug-YYMMDD-hex-slug` de volta para o nome legado se necessario.

## Observabilidade

`pbq update` deve imprimir uma linha `Bug migrated: antigo -> novo` para cada migracao.

## Duvidas Abertas

Nenhuma.
