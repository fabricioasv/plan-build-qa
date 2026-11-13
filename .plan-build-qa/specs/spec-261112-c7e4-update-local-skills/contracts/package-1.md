# Contract: Package 1

## Package
1

## Objetivo
Normalizar skills locais existentes durante pbq update conforme a ordem explicita de --agents.

## Arquivos Permitidos
- bin/pbq.mjs
- tests/pbq-init-smoke.mjs
- README.md
- .plan-build-qa/roadmap.md
- .plan-build-qa/specs/spec-261112-c7e4-update-local-skills/spec.md
- .plan-build-qa/specs/spec-261112-c7e4-update-local-skills/progress.md
- .plan-build-qa/specs/spec-261112-c7e4-update-local-skills/evaluations/package-1.md

## Arquivos Proibidos
Templates canonicos de skills e alteracoes preexistentes de outras specs.

## Mudancas Permitidas
Preflight somente leitura de skills locais nos tres formatos suportados; planejar escritas antes de executar update; principal recebe conteudo e recursos, secundarios referencias no formato PBQ. Preservar arquivos auxiliares existentes. Documentar comportamento.

## Mudancas Proibidas
Refactor amplo, acesso a skills globais, LLM, seguir links simbolicos, apagar skills locais nao selecionadas ou reescrever instrucoes da skill por interpretacao.

## Criterios de Aceite
1. Primeiro agente recebe conteudo integral e secundarios referencias diretas para skills locais, inclusive skills que so existem em outro agente.
2. Troca de principal resolve referencias PBQ sem ciclo; referencia quebrada/circular bloqueia antes das escritas.
3. Conteudos integrais ou recursos divergentes bloqueiam com caminhos do conflito, sem sobrescrever dados.
4. Recursos auxiliares sao copiados para o diretorio da nova fonte; skill Cursor usa .cursor/commands, preservando caminhos relativos. Colisoes de recursos bloqueiam.
5. --dry-run nao escreve; segunda execucao e idempotente; --no-agent-integration nao padroniza skills locais; agentes nao selecionados permanecem intocados para skills locais.
6. Skills PBQ continuam seguindo os templates e testes anteriores continuam passando.

## Sensores Obrigatorios

| Sensor | Scope | Comando | Motivo |
| --- | --- | --- | --- |
| npm-run-test | global | npm run test | Regressao e cenarios de skills locais |
| pbq-analyze | global | node ./bin/pbq.mjs analyze . | Coerencia do harness |

## Riscos
Cursor tem recursos relativos compartilhados no diretorio commands; colisao deve bloquear.

## Rollback
Reverter somente o diff deste package; nenhum update em projeto externo sera executado nesta tarefa.

## Observabilidade
Resumo padrao de arquivos criados/atualizados e erros com caminhos envolvidos.

## Duvidas Abertas
Nenhuma para a politica conservadora de bloqueio de conflitos. Usuario pode optar por politica de backup em vez de bloqueio.
