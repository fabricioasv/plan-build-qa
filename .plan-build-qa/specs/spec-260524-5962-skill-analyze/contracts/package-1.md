# Contract: Package 1

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

1

## Objetivo

Criar a skill `/analyze` nas tres variantes (Claude, Codex e template instalavel), registrar em `ADAPTER_SKILLS` em `bin/pbq.mjs` para que `pbq init` e `pbq update` a instalem automaticamente, e adicionar testes que verificam instalacao e conteudo.

## Arquivos Permitidos

- `templates/adapters/skills/analyze/SKILL.md` (criar)
- `.claude/skills/analyze/SKILL.md` (criar)
- `.agents/skills/analyze/SKILL.md` (criar)
- `bin/pbq.mjs` (apenas para adicionar `"analyze"` a `ADAPTER_SKILLS` e incluir `analyze` na lista de required files do init)
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-015-skill-analyze/progress.md`
- `.plan-build-qa/specs/spec-015-skill-analyze/contracts/package-1.md`
- `.plan-build-qa/specs/spec-015-skill-analyze/evaluations/package-1.md`
- `.plan-build-qa/roadmap.md` (apenas para marcar `spec-015` como `concluido` ao final)

## Arquivos Proibidos

- `package.json`
- `README.md`
- `.plan-build-qa/constitution/**`
- `.plan-build-qa/harness/templates/**`
- `.plan-build-qa/sensors.json`
- outras skills alem da `analyze` em `.claude/skills/**`, `.agents/skills/**`, `templates/adapters/skills/**`
- contratos/evaluations de outras specs

## Mudancas Permitidas

- Criar `templates/adapters/skills/analyze/SKILL.md` com:
  - frontmatter `name: analyze`
  - secao de workflow orientando: rodar `pbq analyze [path]`, ler violations (exit 1 = falhou), ler warnings (exit 0 = passou com avisos), agir sobre violations antes de continuar
  - mencao a flags `--strict`
- Adicionar `"analyze"` ao array `ADAPTER_SKILLS` em `bin/pbq.mjs`
- Garantir que o arquivo aparece na lista de arquivos required do `pbq init` (se aplicavel no teste)
- Adicionar asserts no smoke test verificando: arquivo existe apos `pbq init`, contem `pbq analyze`, contem `violations` ou `Violations`

## Mudancas Proibidas

**NUNCA** inclua refactor amplo, mudanca funcional extra ou ajuste de teste fora do objetivo deste package.

- Nao alterar logica de `pbq analyze` (`analyzeHarness`, `runAnalyzeCommand`)
- Nao criar skills para outros subcomandos
- Nao modificar constitution ou outros templates
- Nao alterar outras skills

## Criterios de Aceite

**OBRIGATORIO** definir criterios objetivos e verificaveis.

1. `pbq init` instala `.claude/skills/analyze/SKILL.md` e `.agents/skills/analyze/SKILL.md` no projeto alvo. Verificavel pelo smoke test (existsSync).
2. Os tres arquivos (Claude, Codex, template) contem o termo `pbq analyze`. Verificavel por grep/assert.match.
3. Os tres arquivos contem orientacao sobre `violations` (ou `Violations`). Verificavel por grep/assert.match.
4. Os tres arquivos mencionam `--strict` ou flags opcionais. Verificavel por grep/assert.match.
5. Testes existentes nao regridem.
6. `tests/pbq-init-smoke.mjs` ganha ao menos 3 asserts novos cobrindo criterios 1-3.
7. Sensores obrigatorios do package passam.
8. Evaluation do package 1 tem Score 1.
9. Roadmap reflete `spec-015-skill-analyze` como `concluido` apos o package 1.

## Sensores Obrigatorios

**OBRIGATORIO** listar sensores por nome/tier/comando esperado.

- Runner legado: `.\.plan-build-qa\harness\scripts\run-fast.ps1` (inclui check de estrutura; nao era sensor cadastrado em sensors.json na epoca)
- Medium | `npm-run-test` | `npm run test`

## Riscos

- `ADAPTER_SKILLS` e usado em varios lugares (`generateFiles`, `adapterSkillPaths`, `adapterSkillEntries`). Basta adicionar a string ao array; o resto e automatico.
- Testes acoplados a wording exato. Mitigacao: regex tolerante nos termos-chave.

## Rollback

`git revert` do commit do package 1. Remove os tres arquivos `SKILL.md` da skill `analyze` e reverte `ADAPTER_SKILLS` para o estado anterior.

## Observabilidade

stdout do smoke test + `pbq init` instalando a skill no projeto alvo.

## Duvidas Abertas

Nenhuma aberta para iniciar o package 1.

**PARE** se houver duvida aberta que possa alterar escopo, arquivos permitidos, criterio de aceite ou sensor obrigatorio.
