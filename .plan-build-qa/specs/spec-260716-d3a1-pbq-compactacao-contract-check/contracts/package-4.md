# Contract: Package 4

## Package

Package 4 - diagnostico de peso do harness.

## Objetivo

Adicionar diagnostico nao-destrutivo para identificar acumulacao de artefatos PBQ em repositorios consumidores e orientar compactacao/saneamento sem modificar historico automaticamente.

## Arquivos Permitidos

| Caminho | Mudanca |
| --- | --- |
| `bin/pbq.mjs` | Adicionar subcomando ou opcao de diagnostico de peso |
| `README.md` | Documentar uso do diagnostico |
| `.plan-build-qa/harness/README.md` | Atualizar orientacao local |
| `templates/harness/README.md` | Propagar orientacao |
| `tests/pbq-init-smoke.mjs` | Adicionar fixtures de diagnostico |
| `.plan-build-qa/specs/spec-260716-d3a1-pbq-compactacao-contract-check/progress.md` | Registrar progresso |
| `.plan-build-qa/specs/spec-260716-d3a1-pbq-compactacao-contract-check/evaluations/package-4.md` | Registrar resultado |

## Arquivos Proibidos

- Apagar, mover ou renomear specs/contracts/evaluations automaticamente.
- Corrigir repositorios consumidores dentro deste package.
- Alterar regras de `pbq analyze`.

## Mudancas Permitidas

- Exibir contadores por grupo: root, specs, contracts, evaluations, progress, dashboard, bugs e adapters.
- Listar maiores arquivos PBQ.
- Contar `progress.md` acima de limite configurado em codigo.
- Contar contratos/evaluations acima de limite configurado em codigo.
- Contar arquivos `package-X.Y.md`.
- Emitir recomendacoes curtas e nao-destrutivas.
- Oferecer saida `--json` se simples de testar.

## Mudancas Proibidas

- Fazer limpeza automatica.
- Marcar diagnostico como falha de `analyze` sem nova decisao.
- Ler conteudo completo dos maiores arquivos quando metadados forem suficientes.

## Criterios de Aceite

1. O diagnostico roda em fixture com `.plan-build-qa` minimo e retorna exit code 0.
2. O diagnostico identifica pelo menos: tamanho total, quantidade de arquivos, maiores arquivos, dashboard versionavel/derivado e packages decimais.
3. Fixture com `package-1.1.md` reporta contador de subpackages decimais.
4. Fixture com `progress.md` acima do limite reporta o arquivo no resumo.
5. A saida default e curta e nao imprime conteudo integral dos arquivos analisados.
6. `npm run test` passa.
7. `pbq analyze .` passa.

## Sensores Obrigatorios

| Sensor | Scope | Tier | Comando | Motivo |
| --- | --- | --- | --- | --- |
| pbq-analyze | global | fast |  | Valida coerencia do harness |
| npm-run-test | global | medium |  | Cobre fixtures do diagnostico |

## Riscos

- Diagnostico pode ser confundido com saneamento automatico.
- Limites de tamanho podem precisar ajuste apos uso real em repos consumidores.

## Rollback

Reverter alteracoes de CLI, README/harness README e testes do Package 4.

## Observabilidade

Registrar no progresso os limites escolhidos e um exemplo de saida contra fixture.

## Duvidas Abertas

Nenhuma para este package.
