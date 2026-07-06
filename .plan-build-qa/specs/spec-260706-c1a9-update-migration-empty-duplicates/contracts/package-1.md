# Contract: Package 1

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

1

## Objetivo

Corrigir a migracao de nomes legados em `pbq update` para specs e bugs, tornando-a idempotente quando ha diretorios modernos vazios com mesmo slug e adicionando aviso de duplicidade por slug.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-260706-c1a9-update-migration-empty-duplicates/spec.md`
- `.plan-build-qa/specs/spec-260706-c1a9-update-migration-empty-duplicates/progress.md`
- `.plan-build-qa/specs/spec-260706-c1a9-update-migration-empty-duplicates/contracts/package-1.md`
- `.plan-build-qa/specs/spec-260706-c1a9-update-migration-empty-duplicates/evaluations/package-1.md`
- `.plan-build-qa/roadmap.md`

## Arquivos Proibidos

- Templates e skills nao relacionados.
- Estrutura de specs/bugs existentes fora desta spec.
- `package.json`, salvo se necessario para manter o sensor existente.

## Mudancas Permitidas

- Adicionar helpers pequenos em `bin/pbq.mjs` para detectar slug moderno, diretorio vazio, duplicidade e limpeza de tentativa orfa.
- Ajustar `migrateLegacySpecDirectories` e `migrateLegacyBugDirectories`.
- Adicionar asserts de regressao no smoke test para specs e bugs.
- Atualizar progresso, evaluation e roadmap.

## Mudancas Proibidas

- Mudar o formato `spec-YYMMDD-hex-slug` ou `bug-YYMMDD-hex-slug`.
- Remover automaticamente diretorio moderno populado.
- Transformar aviso de duplicidade populada em erro bloqueante.
- Refatorar fluxos nao relacionados de `pbq update`.

## Criterios de Aceite

1. Ao migrar `spec-001-demo` com uma pasta moderna vazia `spec-YYMMDD-xxxx-demo` existente, `pbq update` remove a pasta vazia e renomeia o legado para um unico diretorio moderno populado.
2. O mesmo comportamento ocorre para `bug-001-demo` com pasta moderna vazia `bug-YYMMDD-xxxx-demo`.
3. Quando houver mais de uma pasta moderna com mesmo slug, `pbq update` imprime aviso contendo os nomes duplicados.
4. Diretorio moderno populado nunca e removido automaticamente; em colisao, a migracao escolhe nome alternativo e avisa duplicidade.
5. `npm run test` passa.

## Sensores Obrigatorios

| Sensor | Scope | Tier | Comando | Motivo |
| --- | --- | --- | --- | --- |
| npm-run-test | global | medium | `npm run test` | Suite smoke cobre init/update/analyze |

## Riscos

- Limpeza agressiva demais. Mitigacao: helper de vazio deve exigir que o diretorio nao tenha entradas.

## Rollback

Reverter alteracoes em `bin/pbq.mjs` e `tests/pbq-init-smoke.mjs`, remover esta spec do roadmap e apagar os artefatos da spec.

## Observabilidade

O resumo de `pbq update` deve listar eventos de limpeza de tentativa vazia e avisos de slug duplicado.

## Duvidas Abertas

Nenhuma.
