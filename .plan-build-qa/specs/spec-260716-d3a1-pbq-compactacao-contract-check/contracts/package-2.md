# Contract: Package 2

## Package

Package 2 - templates e evaluations compactos.

## Objetivo

Reduzir o tamanho dos artefatos gerados para novas specs/packages, mantendo os campos canonicos necessarios para retomada, aceite e auditoria.

## Arquivos Permitidos

| Caminho | Mudanca |
| --- | --- |
| `.plan-build-qa/harness/templates/spec.md` | Compactar template canonico local |
| `.plan-build-qa/harness/templates/progress.md` | Compactar progresso inicial |
| `.plan-build-qa/harness/templates/contract.md` | Remover texto repetitivo e manter criterios objetivos |
| `.plan-build-qa/harness/templates/evaluation.md` | Reduzir boilerplate e evidencia inline |
| `templates/harness/templates/spec.md` | Propagar template para novas instalacoes |
| `templates/harness/templates/progress.md` | Propagar template para novas instalacoes |
| `templates/harness/templates/contract.md` | Propagar template para novas instalacoes |
| `templates/harness/templates/evaluation.md` | Propagar template para novas instalacoes |
| `bin/pbq.mjs` | Ajustar geracao de evaluation/evidencia se necessario |
| `tests/pbq-init-smoke.mjs` | Atualizar asserts de smoke para templates compactos |
| `.plan-build-qa/specs/spec-260716-d3a1-pbq-compactacao-contract-check/progress.md` | Registrar progresso |
| `.plan-build-qa/specs/spec-260716-d3a1-pbq-compactacao-contract-check/evaluations/package-2.md` | Registrar resultado |

## Arquivos Proibidos

- Skills/adapters, salvo se testes mostrarem referencia direta a texto removido dos templates.
- Dashboard e `.gitignore`; ficam para Package 3.
- Saneamento de specs antigas; fica para Package 4.

## Mudancas Permitidas

- Remover instrucoes repetidas dos templates quando ja estiverem cobertas por constitution/skills.
- Reduzir evidencia inline gerada por `pbq package close`.
- Se logs longos forem mantidos, mover para arquivo externo derivado e referenciar o caminho na evaluation.
- Ajustar testes para validar estrutura essencial em vez de texto longo.

## Mudancas Proibidas

- Remover `Score`, tabela/resumo de sensores, status de sensores ou criterio de Score 1.
- Permitir evaluation sem sensores obrigatorios.
- Remover rollback de contratos.
- Tornar progress insuficiente para retomada do package atual.

## Criterios de Aceite

1. `pbq init` em fixture gera `spec.md`, `progress.md`, `contract.md` e `evaluation.md` menores que os templates atuais, medidos em bytes no teste.
2. Os templates compactos ainda contem secoes minimas exigidas por `pbq analyze` e pelo contract-check do Package 1.
3. `package close` nao imprime stdout/stderr longo diretamente acima do limite definido no codigo/teste.
4. Testes cobrem pelo menos um sensor com saida longa e verificam que a evaluation permanece compacta.
5. `npm run test` passa.
6. `pbq analyze .` passa.

## Sensores Obrigatorios

| Sensor | Scope | Tier | Comando | Motivo |
| --- | --- | --- | --- | --- |
| pbq-analyze | global | fast |  | Valida coerencia do harness apos alterar templates |
| npm-run-test | global | medium |  | Cobre geracao dos templates e formato das evaluations |

## Riscos

- Reduzir texto demais pode deixar agentes sem contexto suficiente em repos instalados.
- Testes existentes podem depender de trechos literais dos templates.

## Rollback

Reverter alteracoes em templates, `bin/pbq.mjs` e testes do Package 2.

## Observabilidade

Registrar no progresso os tamanhos antes/depois dos principais templates e de uma evaluation de fixture.

## Duvidas Abertas

Nenhuma para este package.
