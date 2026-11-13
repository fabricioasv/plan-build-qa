# Contract: Package 2

## Package
2

## Objetivo
Fazer a skill local do primeiro agente de --agents prevalecer automaticamente em update e init, inclusive com conteudo divergente nos secundarios.

## Arquivos Permitidos
- bin/pbq.mjs
- tests/pbq-init-smoke.mjs
- README.md
- .plan-build-qa/roadmap.md
- .plan-build-qa/specs/spec-261112-c7e4-update-local-skills/spec.md
- .plan-build-qa/specs/spec-261112-c7e4-update-local-skills/progress.md
- .plan-build-qa/specs/spec-261112-c7e4-update-local-skills/evaluations/package-2.md

## Arquivos Proibidos
Projetos consumidores incluindo MAX, constitution/sensors, templates e alteracoes anteriores fora do escopo.

## Mudancas Permitidas
Resolver somente a fonte principal da skill local; ignorar divergencias e referencias antigas dos secundarios selecionados ao recriar wrappers. Reutilizar planejamento no init; recursos auxiliares da fonte principal sao autoritativos. Atualizar testes e documentacao.

## Mudancas Proibidas
Comparar conteudo secundario para bloquear a fonte principal; fazer merge por LLM; remover arquivos auxiliares dos secundarios; alterar comportamento geral de preservacao do init ou templates das skills PBQ.

## Criterios de Aceite
1. update e init com claude,codex,cursor e merge-maxcore divergente preservam integralmente a fonte Claude e geram referencias diretas em Codex e Cursor sem --force.
2. A ordem de --agents e respeitada tambem com Codex e Cursor principais. Referencias quebradas/circulares de secundarios nao bloqueiam uma fonte principal integra; referencia principal quebrada/circular continua bloqueando antes das escritas.
3. Recursos da fonte principal sao preservados e copiados quando essa fonte e movida. Recursos divergentes/exclusivos de secundarios nao bloqueiam e permanecem intocados; nao sao incorporados na fonte principal.
4. Principal ausente usa primeira copia existente pela ordem informada e resolve referencias PBQ, mantendo fallback atual. Skills exclusivas de agentes nao selecionados nao sao alteradas.
5. --dry-run nao altera arquivos, repeticao e idempotente, --no-agent-integration pula skills locais. init normaliza apenas skills locais existentes; preservacao geral do init e comportamento de templates PBQ nao mudam.
6. Protecoes contra links simbolicos e restricao de recursos Cursor permanecem. Colisoes internas de destinos continuam bloqueando.
7. npm-run-test e pbq-analyze passam em verificacao independente.

## Sensores Obrigatorios

| Sensor | Scope | Comando | Motivo |
| --- | --- | --- | --- |
| npm-run-test | global | npm run test | Regressao, divergencias e ordem em init/update |
| pbq-analyze | global | node ./bin/pbq.mjs analyze . | Coerencia do harness |

## Riscos
Conteudos secundarios sao substituidos por referencias por autorizacao explicita do usuario. Recursos secundarios antigos ficam preservados no disco mas nao sao canonicos. Fonte principal pode ser wrapper e exigir resolucao da referencia.

## Rollback
Reverter somente o diff deste package e seus registros. Nao executar update/init no MAX durante esta implementacao.

## Observabilidade
Resumo normal de arquivos criados/atualizados; erros de fonte principal invalida identificam o caminho.

## Duvidas Abertas
Nenhuma. Este package substitui a politica de bloqueio por divergencias do Package 1 conforme pedido explicito.
