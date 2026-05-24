# Contract: Package 3

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

3

## Objetivo

Refinar a skill `/sensor` (variante Claude e variante Codex em `.claude/skills/sensor/SKILL.md` e `.agents/skills/sensor/SKILL.md`) e o help do CLI para documentar o fluxo recomendado: `pbq sensor suggest` primeiro, depois `pbq sensor add` para cada linha aprovada. Incluir exemplos concretos cobrindo `sonar`, scripts soltos e `Makefile`. Atualizar tambem o template instalavel em `templates/adapters/skills/sensor` para que projetos novos ja recebam a skill refinada.

## Arquivos Permitidos

- `.claude/skills/sensor/SKILL.md`
- `.agents/skills/sensor/SKILL.md`
- `templates/adapters/skills/sensor/SKILL.md`
- `bin/pbq.mjs` (apenas se for necessario ajustar `pbq help sensor` alem do que foi feito no package 2)
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-014-melhora-deteccao-sensores/progress.md`
- `.plan-build-qa/specs/spec-014-melhora-deteccao-sensores/contracts/package-3.md`
- `.plan-build-qa/specs/spec-014-melhora-deteccao-sensores/evaluations/package-3.md`
- `.plan-build-qa/roadmap.md` (apenas para marcar `spec-014` como `concluido` ao final, se os 3 packages estiverem fechados com Score 1)

## Arquivos Proibidos

- `package.json`
- `README.md`
- `.plan-build-qa/constitution/**`
- `.plan-build-qa/harness/templates/**`
- `.plan-build-qa/sensors.json`
- outras skills alem da `sensor` em `.claude/skills/**`, `.agents/skills/**`, `templates/adapters/skills/**`
- contratos/evaluations de outras specs ou outros packages

## Mudancas Permitidas

- Reescrever `SKILL.md` da skill `sensor` (Claude, Codex e template) com:
  - secao "Fluxo recomendado" citando `pbq sensor suggest` antes de `pbq sensor add`
  - tres exemplos concretos: `sonar.bat`, `scripts/test.sh`, `Makefile`
  - regras existentes preservadas (lint/typecheck em fast etc.)
- Garantir que as tres variantes (Claude, Codex, template) ficam consistentes em conteudo (texto pode diferir em metadata se necessario).
- Ajustar `pbq help sensor` se faltar referencia ao fluxo recomendado.
- Adicionar/atualizar testes que validem por grep que os termos-chave aparecem na skill instalada e no template.
- Marcar a spec como `concluido` no roadmap quando os 3 packages estiverem fechados.

## Mudancas Proibidas

**NUNCA** inclua refactor amplo, mudanca funcional extra ou ajuste de teste fora do objetivo deste package.

- Nao alterar logica de deteccao (escopo do package 1) nem do `suggest` (escopo do package 2).
- Nao alterar outras skills ou outros templates.
- Nao introduzir regras novas alem do fluxo recomendado e dos exemplos.

## Criterios de Aceite

**OBRIGATORIO** definir criterios objetivos e verificaveis.

1. `.claude/skills/sensor/SKILL.md`, `.agents/skills/sensor/SKILL.md` e `templates/adapters/skills/sensor/SKILL.md` contem secao "Fluxo recomendado" (ou titulo equivalente nomeado explicitamente) e citam `pbq sensor suggest`. Verificavel por grep.
2. Cada uma das tres variantes cita pelo menos um dos termos: `sonar`, `Makefile`, `scripts/`. Verificavel por grep.
3. Regras existentes (tier rules, "Do not add sensors that only print success", "non-zero exit code") permanecem nos tres arquivos. Verificavel por grep.
4. `pbq help sensor` cita `pbq sensor suggest`. Verificavel por regex.
5. Testes existentes que assertam conteudo da skill `sensor` instalada nao regridem.
6. `tests/pbq-init-smoke.mjs` ganha ao menos 3 asserts novos cobrindo criterios 1-3 (um por variante).
7. Sensores obrigatorios do package passam.
8. Evaluation do package 3 tem Score 1.
9. Roadmap reflete `spec-014-melhora-deteccao-sensores` como `concluido` apos o package 3.

## Sensores Obrigatorios

**OBRIGATORIO** listar sensores por nome/tier/comando esperado.

- Fast | `check-harness-structure` | `.\.plan-build-qa\harness\scripts\run-fast.ps1`
- Medium | `npm-run-test` | `npm run test`

## Riscos

- Divergencia entre as 3 variantes da skill. Mitigacao: testes por grep nos tres arquivos.
- Alterar template afetar projetos que rodarem `pbq update`. Mitigacao: template e arquivo gerenciado pelo update; mudanca aditiva (acrescenta secao), nao remove regras.
- Testes ficarem acoplados a wording exato. Mitigacao: regex tolerante em termos-chave.

## Rollback

`git revert` do commit do package 3. Restaura `SKILL.md` original em todas as variantes.

## Observabilidade

stdout do CLI + evidencia dos testes automatizados.

## Duvidas Abertas

Nenhuma aberta para iniciar o package 3.

**PARE** se houver duvida aberta que possa alterar escopo, arquivos permitidos, criterio de aceite ou sensor obrigatorio.
