# Contract: Package 1

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

1

## Objetivo

Restringir a skill `/bug` a registro e investigacao de bugs observados, removendo a responsabilidade de aplicar correcao ou executar validacao final, e direcionando essas etapas para `/implement` e `/test`.

## Arquivos Permitidos

- `.agents/skills/bug/SKILL.md`
- `.claude/skills/bug/SKILL.md`
- `templates/adapters/skills/bug/SKILL.md`
- `.plan-build-qa/harness/templates/bug.md`
- `.plan-build-qa/harness/templates/bug-progress.md`
- `templates/harness/templates/bug.md`
- `templates/harness/templates/bug-progress.md`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-024-bug-investigation-only/progress.md`
- `.plan-build-qa/specs/spec-024-bug-investigation-only/evaluations/package-1.md`
- `.plan-build-qa/roadmap.md`

## Arquivos Proibidos

- `bin/pbq.mjs`, salvo se o smoke test provar que o instalador copia conteudo de origem diferente do template listado.
- `package.json`
- `.plan-build-qa/sensors.json`
- `.plan-build-qa/constitution/**`
- Specs, contratos ou evaluations de outras specs.
- Implementacao de subcomando CLI `pbq bug`.

## Mudancas Permitidas

- Reescrever o workflow da skill `/bug` para terminar na investigacao e no registro de encaminhamento.
- Declarar explicitamente que `/bug` nao aplica patches, nao altera codigo de produto e nao roda sensores de aceite.
- Ajustar templates `bug.md` e `bug-progress.md` para que secoes de correcao/teste registrem links, status ou evidencia gerados por `/implement` e `/test`, quando existirem.
- Adicionar ou ajustar assert no smoke test para validar que a skill instalada contem a nova fronteira de responsabilidade.
- Atualizar `progress.md`, `roadmap.md` e criar evaluation somente durante fechamento via `/test`.

## Mudancas Proibidas

- Alterar comportamento de `/spec`, `/implement`, `/test`, `/sensor`, `/roadmap`, `/constitution` ou `/analyze`.
- Aplicar a correcao da propria skill durante esta etapa de spec; a implementacao deve ocorrer em etapa `/implement`.
- Remover testes existentes ou relaxar asserts sem substituicao equivalente.
- Alterar sensores para fazer o package passar.
- Reclassificar esta spec como concluida sem evaluation Score 1 ou excecao documentada.

## Criterios de Aceite

- AC1: `.agents/skills/bug/SKILL.md`, `.claude/skills/bug/SKILL.md` e `templates/adapters/skills/bug/SKILL.md` declaram que `/bug` nao implementa correcao, nao aplica patches e nao executa validacao final.
- AC2: O workflow numerado da skill `/bug` limita a execucao direta a localizar/criar bug record, criar/atualizar `bug.md` e `progress.md`, e preencher `Investigacao`.
- AC3: A skill `/bug` orienta que correcao de codigo deve ser encaminhada para spec/package e executada por `/implement`, com validacao posterior por `/test`.
- AC4: `bug.md` e `bug-progress.md`, nas copias locais e nos templates de distribuicao, nao instruem o agente a executar correcao/teste dentro de `/bug`; quando mencionam `Correcao` ou `Teste`, tratam como registro de encaminhamento, resultado externo ou evidencia posterior.
- AC5: `tests/pbq-init-smoke.mjs` valida que o template instalado da skill `/bug` contem a fronteira de responsabilidade de AC1-AC3.
- AC6: O fechamento do package gera `.plan-build-qa/specs/spec-024-bug-investigation-only/evaluations/package-1.md` com Score 1 somente se `pbq-analyze` e `npm-run-test` passarem.

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando esperado |
| --- | --- | --- | --- |
| pbq-analyze | fast | `pbq-analyze` | `node ./bin/pbq.mjs analyze .` |
| npm-run-test | medium | `npm-run-test` | `npm run test` |

## Riscos

- Texto de skill pode ser validado por assert fragil se o teste depender de frase exata demais; prefira checagens por termos-chave estaveis da fronteira.
- Se apenas uma das tres copias da skill for atualizada, o comportamento local e o comportamento distribuido podem divergir.
- Se templates de bug forem interpretados como checklist operacional, nomes de secoes podem continuar sugerindo execucao direta; a implementacao deve deixar a responsabilidade clara.

## Rollback

Reverter as alteracoes nos arquivos permitidos deste package. Como a mudanca e documental/de skill/teste e nao altera dados externos nem formato obrigatorio de bug records existentes, o rollback e um revert de commit/patch.

## Observabilidade

Nao ha observabilidade de runtime aplicavel. A evidencia sera textual nos arquivos de skill/templates, automatizada pelo smoke test, e registrada na evaluation do package.

## Duvidas Abertas

Nenhuma duvida bloqueante. A decisao de produto ja foi dada: `/bug` faz registro e investigacao; correcao fica a cargo de `/implement`.
