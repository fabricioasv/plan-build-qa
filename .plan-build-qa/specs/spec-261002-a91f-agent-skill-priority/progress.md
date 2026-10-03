# Progress

## Estado Atual

concluido

| Etapa | Status |
| --- | --- |
| 1. spec | ok |
| 2. contract (validacao) | ok |
| 3. implement | ok |
| 4. test/qa | ok |
| 5. roadmap | ok |

## Packages Concluidos

Package 1: Score 1 em `evaluations/package-1.md`.

Package 2: Score 1 em `evaluations/package-2.md`.

Package 3: Score 1 em `evaluations/package-3.md`.

Package 4: Score 1 em `evaluations/package-4.md`.

Package 5: Score 1 em `evaluations/package-5.md`.

## Package Atual

Package 5: tabela de resultado dos arquivos de constitution em init/update.

## Decisoes Tecnicas

- Cursor isolado recebe conteudo completo em `.cursor/commands`; o arquivo de `.agents/skills` so e gerado quando Codex foi selecionado.
- Referencias dos agentes secundarios apontam diretamente para o artefato do primeiro agente informado.
- Package 2: `sensors.json` e `roadmap.md` sao estado local e ficam fora da substituicao por template; `manifest.json` passa a ser escrito diretamente.
- Package 3: a prioridade fixa do Package 1 foi substituida pela ordem explicita da lista, por decisao do usuario.
- Package 4: no MAX, `architecture.md` e `repository-rules.md` divergem do hash do manifest e contem regras locais; `testing.md` e `operations.md` ainda coincidem com a versao instalada.
- Package 5: a saida do CLI deve mostrar a decisao para cada arquivo de constitution, sem modificar a politica do Package 4.

## Sensores Executados

Contract-check: `node ./bin/pbq.mjs contract check . --spec spec-261002-a91f-agent-skill-priority --package 1` passou (2 sensores). Acceptance-check repetido apos ampliar o smoke test para as sete selecoes de agentes em `init` e `update`: `node ./bin/pbq.mjs package close . --spec spec-261002-a91f-agent-skill-priority --package 1` passou (exit code 0, Score 1); `npm-run-test` e `pbq-analyze` passaram com exit code 0. O teste tambem cobre whitespace nas extremidades sem `.pbq-new` e preservacao de arquivo customizado.

Package 2 contract-check: `node ./bin/pbq.mjs contract check . --spec spec-261002-a91f-agent-skill-priority --package 2` passou (2 sensores), verificado independentemente.

Package 2 acceptance-check: `node ./bin/pbq.mjs package close . --spec spec-261002-a91f-agent-skill-priority --package 2` passou (exit code 0, Score 1). `npm-run-test` (`npm run test`) e `pbq-analyze` (`node ./bin/pbq.mjs analyze .`) passaram com exit code 0. A revisao de `tests/pbq-init-smoke.mjs` confirmou cobertura dos seis criterios de aceite; detalhes em `evaluations/package-2.md`.

Package 3 contract-check: `node ./bin/pbq.mjs contract check . --spec spec-261002-a91f-agent-skill-priority --package 3` passou (2 sensores), verificado independentemente.

Package 3 acceptance-check inicial: `node ./bin/pbq.mjs package close . --spec spec-261002-a91f-agent-skill-priority --package 3` passou (exit code 0, Score 1). A revisao identificou ausencia de assercao explicita de `.pbq-new` quando somente a ordem dos agentes muda; a assercao foi adicionada depois desse gate, exigindo nova execucao.

Package 3 acceptance-check final: o mesmo comando passou apos a nova assercao (exit code 0, Score 1). `npm-run-test` e `pbq-analyze` passaram com exit code 0; analyze apontou 0 violacoes e 39 warnings em 33 specs. Revisao do smoke test confirmou as 15 selecoes ordenadas em init/update, ausencia de `.pbq-new` nos tres caminhos para todas as selecoes, ordem do manifest e frontmatter dos secundarios. Detalhes em `evaluations/package-3.md`.

Package 4 contract-check: `node ./bin/pbq.mjs contract check . --spec spec-261002-a91f-agent-skill-priority --package 4` passou (2 sensores), verificado independentemente.

Package 4 acceptance-check: `node ./bin/pbq.mjs package close . --spec spec-261002-a91f-agent-skill-priority --package 4` passou (exit code 0, Score 1). `npm-run-test` (`npm run test`) e `pbq-analyze` (`node ./bin/pbq.mjs analyze .`) passaram com exit code 0; analyze relatou 0 violacoes e 37 warnings em 33 specs. Revisao do smoke test confirmou os seis criterios de aceite, inclusive preservacao de constitution customizada/sem baseline, update de arquivo gerenciado, dry-run, force e hashes do manifest. Detalhes em `evaluations/package-4.md`.

Simulacao em MAX: `node ./bin/pbq.mjs update 'C:\dti\netview\MAX' --agents 'codex,claude,cursor' --dry-run` passou (exit code 0) e listou `architecture.md` e `repository-rules.md` como constitution preservada para revisao; nenhum arquivo foi alterado.

Package 5 contract-check: `node ./bin/pbq.mjs contract check . --spec spec-261002-a91f-agent-skill-priority --package 5` passou (2 sensores), verificado independentemente.

Package 5 acceptance-check: `node ./bin/pbq.mjs package close . --spec spec-261002-a91f-agent-skill-priority --package 5` passou (exit code 0, Score 1). `npm-run-test` (`npm run test`) e `pbq-analyze` (`node ./bin/pbq.mjs analyze .`) passaram com exit code 0; analyze registrou 0 violacoes e 37 warnings em 33 specs. Revisao do smoke test confirmou init novo e preexistente, update com preservacao e atualizacao, e dry-run sem escrita. A revisao de `printConstitutionTable` confirmou uma linha por evento para os quatro arquivos de constitution e ausencia de mensagens individuais duplicadas. Detalhes em `evaluations/package-5.md`.

Package 5 acceptance-check repetido apos reforco do smoke test: o mesmo comando passou (exit code 0, Score 1). `npm-run-test` e `pbq-analyze` passaram com exit code 0; analyze registrou 0 violacoes e 37 warnings em 33 specs. O smoke test agora exige exatamente quatro linhas na tabela de init e update, uma unica tabela no update e ausencia da mensagem individual de constitution preservada. Detalhes em `evaluations/package-5.md`.

Simulacao final em MAX: `node ./bin/pbq.mjs update 'C:\dti\netview\MAX' --agents 'codex,claude,cursor' --dry-run` passou (exit code 0), mostrou tabela com `architecture.md` e `repository-rules.md` preservados para revisao, `testing.md` e `operations.md` mantidos como equivalentes; nenhum arquivo foi alterado.

## Falhas Anteriores

Nenhuma falha no gate do Package 2.

## Riscos Acumulados

Artefatos antigos customizados de agentes removidos devem ser preservados; o smoke test cobre essa transicao. O gate mais recente de `pbq analyze` registrou 37 warnings em 33 specs, sem violacoes. Arquivos gerenciados customizados de agentes selecionados sao sobrescritos por decisao do contrato; constitution customizada requer revisao semantica antes de `--force`. No MAX, `repository-rules.md` e `scripts/agentico/sync-agent-skills.ps1` declaram Claude como fonte canonica, o que conflita com `pbq update --agents 'codex,claude,cursor'` (Codex canonico); este conflito nao e resolvido automaticamente pelo Package 4.

## Pendencias

Nenhuma.

## Contexto Para Retomada

Contrato atual em `contracts/package-5.md`.
