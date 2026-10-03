# Contract: Package 4

## Package

4

## Objetivo

Evitar que `pbq update` apague regras locais em `.plan-build-qa/constitution/`, distinguindo arquivos iguais a ultima versao instalada de arquivos alterados pelo projeto.

## Arquivos Permitidos

| Caminho | Mudanca |
| --- | --- |
| `bin/pbq.mjs` | Politica especial de update e resumo de revisao |
| `tests/pbq-init-smoke.mjs` | Casos de constitution gerenciada, customizada, sem manifest e `--force` |
| `README.md` | Documentar a excecao e fluxo de revisao |
| `.plan-build-qa/specs/spec-261002-a91f-agent-skill-priority/**` | Contrato, progresso e avaliacao |
| `.plan-build-qa/roadmap.md` | Status |

## Arquivos Proibidos

- `.plan-build-qa/constitution/**` deste repositorio e `templates/adapters/skills/**`.

## Mudancas Permitidas

- Se constitution existente for equivalente ao novo conteudo apos `trim()`, manter sem escrita.
- Se hash do conteudo atual corresponder ao hash de instalacao anterior no manifest, atualizar automaticamente.
- Se o arquivo foi alterado localmente ou nao possui hash anterior confiavel, preservar e sinalizar revisao manual com caminho e motivo, sem `.pbq-new`.
- Permitir `--force` para sobrescrever constitution apos decisao explicita, mantendo a escrita direta para os demais arquivos gerenciados.
- Preservar no manifest o hash anterior de constitution nao atualizada, permitindo reavaliar a customizacao em updates futuros.

## Mudancas Proibidas

- Apagar ou substituir regras locais customizadas sem `--force`.
- Fazer mescla semantica automatica que possa mudar o sentido das regras.
- Reintroduzir `.pbq-new` ou mudar `pbq init`.

## Criterios de Aceite

1. Constitution customizada permanece byte-identica apos update, sem `.pbq-new`; resumo lista arquivo para revisao.
2. Constitution ainda igual ao hash do manifest anterior e com template novo recebe update direto.
3. Constitution sem hash anterior confiavel e diferente do novo template e preservada para revisao.
4. `--force` atualiza constitution customizada; `--dry-run` relata a decisao sem escrever.
5. Manifest preserva o hash anterior dos arquivos de constitution deixados para revisao e usa o novo hash para os atualizados.
6. Skills e outros arquivos gerenciados continuam com a regra de escrita direta do Package 2.

## Sensores Obrigatorios

| Sensor | Scope | Comando | Motivo |
| --- | --- | --- | --- |
| pbq-analyze | global | `node ./bin/pbq.mjs analyze .` | Coerencia do harness |
| npm-run-test | global | `npm run test` | Regressao de init/update |

## Riscos

O CLI so consegue classificar historico de conteudo; a revisao do significado das regras precisa de um humano ou agente com contexto do projeto.

## Rollback

Reverter o Package 4 e recuperar arquivos pelo source control, caso necessario.

## Observabilidade

Resumo do update lista cada constitution preservada, motivo e orientacao de revisao.

## Duvidas Abertas

Nenhuma bloqueante; preferencia do usuario sobre mescla automatica foi solicitada e pode ajustar este contrato antes da implementacao.
