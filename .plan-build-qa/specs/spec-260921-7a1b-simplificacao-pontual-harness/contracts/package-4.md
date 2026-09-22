# Contract: Package 4

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

4

## Objetivo

Remover de `constitution/testing.md` e do comportamento de `pbq guard` a regra "hooks so podem ser `blocking` quando ha exatamente 1 spec `em andamento`"; `Enforcement` por spec passa a ser a unica fonte, resolvida pela spec ativa no contexto do evento.

## Arquivos Permitidos

- `.plan-build-qa/constitution/testing.md` (secao "Flag Enforcement por-spec")
- `bin/pbq.mjs` (implementacao de `pbq guard`: resolucao de spec ativa e aplicacao de `Enforcement`)
- `bin/pbq.mjs` (bloco `helpByTopic.guard`)
- `tests/pbq-init-smoke.mjs` (ajustar/():adicionar teste de `guard` com multiplas specs `em andamento`)

## Arquivos Proibidos

- `.plan-build-qa/roadmap.md` (nao alterar status de specs existentes neste package).
- Logica de `pbq package close` (gate de aceite continua bloqueante independente desta flag).

## Mudancas Permitidas

- Remover a frase "Se 0 ou >1 specs `em andamento`, hooks sao sempre advisory" de `testing.md`.
- Ajustar `pbq guard` para resolver a spec ativa da seguinte forma (decisao registrada, nao mais aberta):
  1. Se houver exatamente 1 spec `em andamento`, usar seu `Enforcement` (comportamento atual, inalterado).
  2. Se houver mais de 1 spec `em andamento` e `--path <file>` foi informado, verificar em quais specs ativas o arquivo casa com `Arquivos Permitidos` de algum `contracts/package-N.md`; se exatamente uma spec casar, usar o `Enforcement` dela.
  3. Em qualquer outro caso (0 specs ativas, `--path` ausente, ou mais de uma spec casando com o mesmo arquivo), permanecer `advisory` — mesma seguranca por default de hoje, mas por ambiguidade real e nao por contagem simples de specs.
- Atualizar o help de `guard` para refletir a nova regra (as 3 condicoes acima).

## Mudancas Proibidas

- Tornar `pbq guard` blocking por default.
- Alterar o gate de `pbq package close`.

## Criterios de Aceite

- `constitution/testing.md` nao contem mais a frase sobre "0 ou >1 specs em andamento".
- Com 2 specs `em andamento` simultaneas (situacao real hoje: `spec-260531-9d58` e `spec-260716-d3a1`), uma spec com `Enforcement: blocking` faz `pbq guard --event commit --path <arquivo do contrato dela>` retornar exit 1 quando um sensor falha, sem exigir que as outras specs estejam `concluido`.
- Sem `--path`, ou com `--path` casando mais de uma spec ativa, `pbq guard` permanece `advisory` mesmo que alguma spec ativa tenha `Enforcement: blocking`.
- `pbq help guard` reflete a regra nova.
- `npm run test` cobre pelo menos um caso de `guard` com multiplas specs `em andamento`.

## Sensores Obrigatorios

| Sensor | Scope | Tier | Comando | Motivo |
| --- | --- | --- | --- | --- |
| pbq-analyze | global | - | `node ./bin/pbq.mjs analyze .` | Confirma coerencia do harness |
| npm-run-test | global | - | `npm run test` | Cobre o novo comportamento de `guard` |

## Riscos

- Se `pbq guard` nao tiver hoje um jeito claro de inferir "a spec ativa" quando ha mais de uma `em andamento`, a implementacao precisa decidir um criterio objetivo (ex.: spec do package cujo contrato cobre o arquivo tocado) — registrar a decisao em `progress.md` antes de fechar o package.

## Rollback

Reverter o commit deste package restaura a regra antiga em `testing.md` e no codigo de `guard`.

## Observabilidade

Nao aplicavel.

## Duvidas Abertas

Nenhuma — criterio de resolucao de spec ativa com multiplas specs `em andamento` decidido acima (secao "Mudancas Permitidas").
