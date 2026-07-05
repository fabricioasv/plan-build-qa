# Spec: Non-Sequential Bug IDs

Spec ID: 260705-b9c1

## Objetivo

Aplicar aos registros de bug a mesma regra anti-conflito usada em specs: novos bugs devem usar `bug-YYMMDD-hex-slug`, mantendo compatibilidade com `bug-NNN-slug` e migrando bugs legados no `pbq update`.

## Contexto

O fluxo atual de `/bug` orienta criar `.plan-build-qa/bugs/bug-XXX-slug/`, o que sofre o mesmo risco de conflito entre branches paralelos que existia para specs sequenciais.

## Escopo

- Atualizar `pbq update` para migrar `.plan-build-qa/bugs/bug-NNN-slug/` para `bug-YYMMDD-hex-slug/`.
- Usar a data de criacao de `bug.md` para gerar `YYMMDD`, com fallback deterministico para `mtime`.
- Atualizar README de bugs e skill `/bug` para orientar o novo padrao.
- Adicionar testes de regressao para migracao e documentacao instalada.

## Fora de Escopo

- Criar comando CLI novo para abrir bugs.
- Alterar semantica de investigacao/correcao/teste do fluxo `/bug`.
- Remover suporte a bugs legados.

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Migrar e documentar IDs nao sequenciais de bugs | planejado | pbq-analyze, npm-run-test |

## Riscos

- A data de criacao de `bug.md` pode refletir copia/checkout em alguns filesystems.
- Referencias externas a caminhos antigos de bug nao sao atualizadas automaticamente.

## Sensores Esperados

- `pbq-analyze`
- `npm-run-test`

## Criterios de Conclusao

- `pbq update` renomeia bugs materializados `bug-NNN-slug` para `bug-YYMMDD-hex-slug`.
- `YYMMDD` vem da data de criacao de `bug.md`, com fallback para `mtime`.
- Colisoes nao sobrescrevem diretorios existentes.
- Templates e skills deixam de recomendar `bug-XXX-slug` como padrao novo.
- Sensores obrigatorios passam e evaluation registra Score 1.

## Enforcement

Enforcement: advisory
