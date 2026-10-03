# Contract: Package 5

## Package

5

## Objetivo

Mostrar em `pbq init` e `pbq update` uma tabela por arquivo de `.plan-build-qa/constitution/` com resultado e motivo, incluindo arquivos preservados.

## Arquivos Permitidos

| Caminho | Mudanca |
| --- | --- |
| `bin/pbq.mjs` | Formatar e imprimir resumo da constitution |
| `tests/pbq-init-smoke.mjs` | Verificar tabela de init/update e dry-run |
| `README.md` | Documentar a saida |
| `.plan-build-qa/specs/spec-261002-a91f-agent-skill-priority/**` | Contrato, progresso e avaliacao |
| `.plan-build-qa/roadmap.md` | Status |

## Arquivos Proibidos

- `.plan-build-qa/constitution/**` deste repositorio e `templates/adapters/skills/**`.

## Mudancas Permitidas

- Usar eventos existentes de init/update para montar tabela `Arquivo | Resultado | Motivo`.
- Mostrar os quatro arquivos gerados de constitution, inclusive preservados, atuais, criados e atualizados.
- Em `--dry-run`, usar verbos condicionais sem indicar escrita real.
- Substituir mensagens individuais de constitution pela tabela para evitar duplicacao.

## Mudancas Proibidas

- Alterar a politica de preservacao/force do Package 4.
- Criar `.pbq-new` ou editar arquivos de constitution para produzir a tabela.

## Criterios de Aceite

1. `init` com constitution preexistente informa `preservado` para esse arquivo e nao altera seu conteudo.
2. `init` novo informa `criado` para os arquivos de constitution.
3. `update` com constitution customizada informa `preservado para revisao` e motivo; arquivos atualizados/atuais tambem aparecem.
4. `--dry-run` informa `criaria`/`atualizaria` quando aplicavel e nao escreve arquivos.
5. Tabela lista o caminho relativo de cada arquivo e nao duplica mensagens por arquivo.

## Sensores Obrigatorios

| Sensor | Scope | Comando | Motivo |
| --- | --- | --- | --- |
| pbq-analyze | global | `node ./bin/pbq.mjs analyze .` | Coerencia do harness |
| npm-run-test | global | `npm run test` | Regressao de init/update |

## Riscos

O status `preservado` em init significa apenas que o arquivo ja existia; nao e revisao semantica.

## Rollback

Reverter a formatacao de resumo e os testes deste package.

## Observabilidade

A tabela e impressa nos resumos normais de init/update e em dry-run.

## Duvidas Abertas

Nenhuma.
