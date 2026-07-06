# Spec: update-migration-empty-duplicates

Spec ID: 260706-c1a9

## Objetivo

Corrigir `pbq update` para que a migracao de diretorios legados de specs e bugs nao deixe diretorios modernos vazios com mesmo slug e hash diferente quando houver colisao ou reexecucao.

## Contexto

Foi observado em repositorio consumidor que `pbq update` deixou pares de diretorios modernos com mesmo slug: um populado com o conteudo real e outro vazio. A causa suspeita esta na migracao de nomes legados para `spec-YYMMDD-hex-slug` e `bug-YYMMDD-hex-slug`: diretorios modernos vazios entram como nomes ocupados, fazendo o algoritmo trocar o hash por tentativa em vez de limpar/reutilizar a tentativa vazia.

## Escopo

- Tornar a migracao de specs e bugs idempotente diante de diretorios modernos vazios com mesmo slug.
- Avisar quando houver mais de um diretorio moderno com mesmo slug.
- Cobrir a regressao no smoke test.
- Documentar causa raiz e correcao nos artefatos do package.

## Fora de Escopo

- Alterar o formato publico de nomes modernos.
- Migrar ou remover diretorios populados automaticamente.
- Refatorar comandos nao relacionados ao `pbq update`.

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Corrigir colisao com diretorios modernos vazios nas migracoes de specs/bugs e adicionar regressao | planejado | npm-run-test |

## Riscos

- Remocao indevida de diretorio com conteudo real. Mitigacao: somente diretorios vazios podem ser limpos automaticamente.
- Aviso excessivo para duplicidade intencional. Mitigacao: apenas alerta; nao bloqueia quando os diretorios estao populados.

## Sensores Esperados

- `npm run test`

## Criterios de Conclusao

- `pbq update` remove/reutiliza tentativa moderna vazia com mesmo slug antes de migrar um legado equivalente.
- `pbq update` avisa quando encontra mais de um diretorio moderno com mesmo slug.
- O comportamento vale para specs e bugs.
- O smoke test cobre specs e bugs com duplicata moderna vazia.

## Enforcement

Enforcement: advisory
