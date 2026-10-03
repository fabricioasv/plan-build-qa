# Contract: Package 2

## Package

2

## Objetivo

Fazer `pbq update` gravar diretamente a versao gerada de cada arquivo gerenciado que mudou, sem criar `.pbq-new`.

## Arquivos Permitidos

| Caminho | Mudanca |
| --- | --- |
| `bin/pbq.mjs` | Escrita direta e resumo do update |
| `tests/pbq-init-smoke.mjs` | Testes de sobrescrita, dry-run, manifest e preservacao de estado |
| `README.md` | Documentar comportamento |
| `.plan-build-qa/specs/spec-261002-a91f-agent-skill-priority/**` | Contrato, progresso e avaliacao |
| `.plan-build-qa/roadmap.md` | Status |

## Arquivos Proibidos

- `templates/adapters/skills/**` e conteudo canonico das skills.

## Mudancas Permitidas

- Para arquivos gerenciados gerados pelo CLI, criar ausentes e sobrescrever existentes diferentes, inclusive customizados, sem consultar hash anterior.
- Preservar arquivos equivalentes apos `trim()` sem reescrever.
- Atualizar `manifest.json` diretamente para refletir a selecao instalada.
- Manter `sensors.json` e `roadmap.md` como estado local, fora da sobrescrita de update; roadmap ainda pode receber migracoes de nomes de specs.
- Manter `--force` aceito por compatibilidade; em update ele nao altera a regra de escrita direta.
- Preservar arquivos antigos de agentes removidos quando customizados; a mudanca de remocao fica fora deste package.

## Mudancas Proibidas

- Gerar novos arquivos `.pbq-new`.
- Apagar arquivos customizados de agentes nao selecionados.
- Alterar comportamento de `pbq init`.

## Criterios de Aceite

1. `pbq update` sobrescreve uma skill existente customizada com a versao gerada, sem `.pbq-new`.
2. `pbq update` atualiza `manifest.json` no arquivo original, inclusive a lista de agentes; nenhuma copia `.pbq-new` e criada.
3. `--dry-run` relata atualizacoes previstas sem escrever arquivos nem `.pbq-new`.
4. Conteudo equivalente apos `trim()` permanece intacto.
5. `sensors.json` e `roadmap.md` nao sao substituidos pelo template durante update.
6. Artefatos de agente nao selecionado customizados continuam preservados.

## Sensores Obrigatorios

| Sensor | Scope | Comando | Motivo |
| --- | --- | --- | --- |
| pbq-analyze | global | `node ./bin/pbq.mjs analyze .` | Coerencia do harness |
| npm-run-test | global | `npm run test` | Regressao de init/update |

## Riscos

Arquivos customizados gerenciados serao substituidos; o usuario optou por revisar alteracoes pelo source control.

## Rollback

Reverter o package e recuperar versoes anteriores de arquivos gerenciados pelo source control.

## Observabilidade

O resumo do update informa arquivos criados, atualizados e ja atuais; dry-run informa a previsao sem escrita.

## Duvidas Abertas

Nenhuma.
