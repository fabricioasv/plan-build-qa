# Contract: Package 13 - ordenacao da grade do dashboard

## Objetivo

Adicionar um controle de ordenacao no dashboard para reorganizar a grade principal sem recarregar a pagina, usando por padrao a ordem de spec mais atual para mais antiga.

## Escopo

- Acrescentar um seletor de ordenacao junto aos filtros existentes.
- Ordenar a grade principal e a linha de detalhe correspondente no cliente.
- Usar como criterio default a data mais recente para a mais antiga, baseada no campo `Ultima Atualizacao` do roadmap quando disponivel.
- Manter fallback deterministico quando a data nao existir.

## Fora de Escopo

- Alterar o formato visual das colunas alem do necessario para acomodar o seletor.
- Mudar o modelo de integridade, filtros existentes ou o conteudo das linhas de detalhe.
- Introduzir dependencia npm, biblioteca de tabela ou ordenacao server-side.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/spec.md`
- `.plan-build-qa/specs/spec-022-dashboard-visual-status/progress.md`
- `.plan-build-qa/roadmap.md`

## Arquivos Proibidos

- `.plan-build-qa/sensors.json`
- `package.json`
- Qualquer arquivo fora do escopo acima

## Criterios de Aceite

1. O HTML gerado expõe um controle de ordenacao ao lado dos filtros.
2. A ordenacao default e `mais atual -> mais antiga`.
3. A ordem usa `Ultima Atualizacao` do roadmap quando disponivel; em empate ou ausencia, usa fallback deterministico.
4. A ordenacao reordena a linha principal da spec e sua linha de detalhe como um bloco unico.
5. `npm test` cobre a presenca do seletor e a ordenacao default no HTML/modelo gerado.

## Sensores Obrigatorios

- `npm-run-test`

## Rollback

Remover o seletor de ordenacao, o metadado de data usado pela grade e a logica client-side associada.

## Observabilidade

Sem telemetria nova. A evidencia fica no HTML gerado, no teste automatizado e na evaluation do package.
