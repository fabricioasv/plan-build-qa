# Contract: Package 4 - Docs, templates e skills para sensores locais/globais

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

4

## Objetivo

Propagar a decisao local/global para a documentacao operacional do harness: constitution, templates de contrato/evaluation e skills `sensor`, `spec` e `test` devem orientar quando manter sensor local no contrato/evaluation e quando promover explicitamente para o registry global.

## Arquivos Permitidos

- `.plan-build-qa/constitution/testing.md`
- `.plan-build-qa/harness/templates/contract.md`
- `.plan-build-qa/harness/templates/evaluation.md`
- `.agents/skills/sensor/SKILL.md`
- `.agents/skills/spec/SKILL.md`
- `.agents/skills/test/SKILL.md`
- `.claude/skills/sensor/SKILL.md`
- `.claude/skills/spec/SKILL.md`
- `.claude/skills/test/SKILL.md`
- `templates/adapters/skills/sensor/SKILL.md`
- `templates/adapters/skills/spec/SKILL.md`
- `templates/adapters/skills/test/SKILL.md`
- `templates/harness/templates/contract.md`
- `templates/harness/templates/evaluation.md`
- `bin/pbq.mjs` (somente a funcao geradora `constitutionTesting(project)`)
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-025-sensor-scope-local-global/progress.md`

## Arquivos Proibidos

- `bin/pbq.mjs` fora da funcao geradora `constitutionTesting(project)` e qualquer codigo funcional do CLI.
- `.plan-build-qa/sensors.json` e catalogos de sensores.
- Hooks, runners, dashboard HTML/JS e CI/CD.
- Saneamento de sensores em repositorios alvo como MAX.
- Mudancas em skills/templates de `bug`, `implement`, `roadmap`, `analyze` ou `constitution`.

## Mudancas Permitidas

1. Constitution:
   - declarar que `sensors.json` e o registry de sensores globais;
   - declarar que sensores locais vivem no contrato/evaluation do package;
   - orientar promocao local -> global somente por decisao explicita.
   - atualizar a fonte instalada por `pbq init` em `constitutionTesting(project)`, sem mudar comportamento do CLI.
2. Templates:
   - atualizar `contract.md` para aceitar tabela de `## Sensores Obrigatorios` com `Sensor`, `Scope`, `Tier`, `Comando` e `Motivo`;
   - atualizar `evaluation.md` para preservar evidencia/status de sensores locais e globais.
3. Skills:
   - `sensor`: orientar `pbq sensor add --scope global` para registry e rejeitar a criacao de local no registry;
   - `spec`: orientar contratos a escolher `scope global` para invariantes reutilizaveis e `scope local` para checks especificos de package;
   - `test`: orientar contract-check/acceptance-check a aceitar local com comando sem exigir cadastro global e a manter enforcement por nome na evaluation.
4. Templates/adapters:
   - manter `.agents`, `.claude` e `templates/adapters` coerentes para as skills alteradas.
5. Testes:
   - adicionar asserts de smoke que comprovem que `pbq init` instala constitution/templates/skills com orientacao local/global.

## Mudancas Proibidas

- Nao alterar comportamento do CLI.
- Nao transformar sensores locais em bypass do gate: sensor local obrigatorio continua precisando passar na evaluation.
- Nao recomendar que repositorios alvo limpem `sensors.json` automaticamente.
- Nao adicionar novo sensor obrigatorio neste package.

## Criterios de Aceite

| # | Criterio | Verificacao |
| --- | --- | --- |
| AC1 | Constitution explica que `sensors.json` e registry global e que local vive em contrato/evaluation | fixture le arquivo instalado por `pbq init` |
| AC2 | Template de contract contem colunas `Sensor`, `Scope`, `Tier`, `Comando` e `Motivo` em `## Sensores Obrigatorios` | fixture le template instalado por `pbq init` |
| AC3 | Template de evaluation orienta que sensor local obrigatorio tambem precisa aparecer/passar | fixture le template instalado por `pbq init` |
| AC4 | Skill `sensor` orienta `--scope global`, promocao explicita e nao criar local em `sensors.json` | fixture le `.agents`, `.claude` e template adapter |
| AC5 | Skill `spec` orienta escolha local/global no contrato e exige comando para local | fixture le `.agents`, `.claude` e template adapter |
| AC6 | Skill `test` orienta contract-check/acceptance-check para local sem registry global e enforcement por nome | fixture le `.agents`, `.claude` e template adapter |
| AC7 | Variantes `.agents`, `.claude` e `templates/adapters` das skills alteradas permanecem semanticamente equivalentes quanto ao texto local/global | fixture compara presenca dos mesmos marcadores obrigatorios |
| AC8 | `npm run test` passa | exit 0 |
| AC9 | `node ./bin/pbq.mjs analyze .` passa | exit 0 |

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| npm-run-test | medium | `npm-run-test` | `npm run test` |
| pbq-analyze | fast | `pbq-analyze` | `node ./bin/pbq.mjs analyze .` |

## Riscos

- Texto demais pode contradizer o comportamento implementado. Mitigacao: criterios exigem marcadores objetivos e os sensores rodam smoke/analyze.
- Skills divergentes entre agentes podem causar instrucoes inconsistentes. Mitigacao: testar `.agents`, `.claude` e `templates/adapters`.

## Rollback

Reverter este package restaurando constitution, templates, skills e smoke test alterados. Packages 1 a 3 continuam funcionais mesmo sem a documentacao do Package 4.

## Observabilidade

- `npm run test` deve falhar se os textos instalados por `pbq init` nao contiverem os marcadores local/global.
- `pbq analyze` deve continuar reportando 0 violacoes.

## Duvidas Abertas

_(nenhuma)_
