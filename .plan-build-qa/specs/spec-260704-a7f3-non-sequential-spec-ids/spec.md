# Spec: Non-Sequential Spec IDs

Spec ID: 260704-a7f3

## Objetivo

Substituir a expectativa operacional de specs sequenciais (`spec-001-*`) por IDs de spec criados no formato `spec-YYMMDD-hex-slug`, mantendo compatibilidade com specs legadas e reduzindo conflitos entre branches.

## Contexto

Specs sequenciais conflitam quando branches paralelos criam a proxima spec com o mesmo numero. O novo padrao usa data curta e sufixo hexadecimal para gerar nomes estaveis sem coordenacao central.

## Escopo

- Atualizar scripts/parsers do `pbq` para aceitar specs legadas e specs `spec-YYMMDD-hex-slug`.
- Fazer `pbq update` migrar diretorios legados de specs materializadas para o novo padrao, usando a data de criacao de `spec.md`.
- Atualizar roadmap durante a migracao para apontar para os novos nomes.
- Atualizar templates, skills e documentacao que ensinam `spec-XXX-nome`.
- Adicionar testes para parser e migracao.

## Fora de Escopo

- Remover suporte a specs legadas.
- Migrar historico Git ou preservar rename history manualmente.
- Criar uma UI interativa para resolver colisoes de slug.

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Aceitar e migrar IDs nao sequenciais de spec no CLI, templates e docs | planejado | pbq-analyze, npm-run-test |

## Riscos

- `birthtime` de arquivo pode nao refletir a data historica em copias ou exports. A migracao deve usar fallback deterministico quando necessario.
- Renomear diretorios altera caminhos referenciados fora do roadmap.

## Sensores Esperados

- `pbq-analyze`
- `npm-run-test`

## Criterios de Conclusao

- `pbq analyze` aceita linhas `spec-YYMMDD-hex-slug` no roadmap.
- `pbq update` renomeia specs `spec-NNN-slug` materializadas para `spec-YYMMDD-hex-slug`, usando a data de criacao de `spec.md`.
- O roadmap e atualizado quando a migracao renomeia specs.
- Templates, skills e README deixam de recomendar `spec-XXX-nome` como padrao novo.
- Specs legadas continuam aceitas quando nao migradas.

## Enforcement

Enforcement: advisory
