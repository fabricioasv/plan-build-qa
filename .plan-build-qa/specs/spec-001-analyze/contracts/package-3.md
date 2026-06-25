# Contract: Package 3

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

3

## Objetivo

Refinar `pbq analyze` com tres mudancas aditivas e reversiveis, sem alterar nenhuma das mensagens/violacoes ja cobertas pelos packages 1 e 2: (a) linha de resumo com contadores; (b) flag `--strict` que faz warnings causarem exit 1; (c) deteccao explicita de `sensors.json` corrompido como warning em vez de silencio.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-001-analyze/progress.md`
- `.plan-build-qa/specs/spec-001-analyze/contracts/package-3.md`
- `.plan-build-qa/specs/spec-001-analyze/evaluations/package-3.md`
- `.plan-build-qa/roadmap.md` (apenas para marcar `spec-001-analyze` como `concluido` ao final, se todos os packages estiverem fechados com Score 1)

## Arquivos Proibidos

- `package.json`
- `README.md`
- `.plan-build-qa/constitution/**`
- `.plan-build-qa/harness/templates/**`
- `.plan-build-qa/sensors.json`
- `.claude/skills/**`
- contratos e evaluations de outros packages/specs
- qualquer arquivo fora da lista de arquivos permitidos

## Mudancas Permitidas

- Adicionar funcoes auxiliares dentro de `bin/pbq.mjs` para os tres refinamentos.
- Adicionar linha `Resumo: ...` ao output do comando `analyze`, antes da linha `Resultado:`.
- Adicionar parsing de flag `--strict` em `runAnalyzeCommand` (sem afetar outros comandos).
- Ajustar `loadSensorNames` para emitir warning quando `sensors.json` existe mas e invalido, em vez de silenciar.
- Atualizar texto de ajuda do CLI do `pbq analyze` para incluir a nova flag.
- Adicionar testes em `tests/pbq-init-smoke.mjs` cobrindo cada refinamento.
- Atualizar `progress.md` desta spec.

## Mudancas Proibidas

**NUNCA** inclua refactor amplo, mudanca funcional extra ou ajuste de teste fora do objetivo deste package.

- Nao alterar mensagens de violacoes/warnings ja existentes nem o formato das secoes `Violations:`/`Warnings:`/`Resultado:` cobertas pelos packages 1 e 2.
- Nao introduzir output JSON, output agrupado por spec ou outras formas de output novas.
- Nao corrigir incoerencias do harness alvo automaticamente.
- Nao tocar em comandos diferentes de `analyze` (parsing de flags, help) alem do estritamente necessario para documentar `--strict`.
- Nao introduzir dependencias novas.

## Criterios de Aceite

**OBRIGATORIO** definir criterios objetivos e verificaveis.

1. `pbq analyze <path>` inclui uma linha no formato `[pbq] Resumo: N violacoes, M warnings em K specs` imediatamente antes da linha `[pbq] Resultado: ...`. Verificavel por regex.
2. `pbq analyze <path> --strict` retorna exit code 1 quando ha pelo menos 1 warning, mesmo com 0 violations. Verificavel por cenario de teste que produz warning sem violation (ex.: contrato com sensor citado sem nome em sensors.json).
3. `pbq analyze <path>` (sem `--strict`) retorna exit code 0 no mesmo cenario do criterio 2.
4. Quando `sensors.json` existe mas e JSON invalido, o output inclui warning iniciado por `sensors.json invalido` e o exit code segue as mesmas regras (0 sem `--strict` se nao houver violacao, 1 com `--strict`).
5. `pbq help analyze` documenta a flag `--strict` em uma linha objetiva.
6. Nenhuma assercao de teste introduzida pelos packages 1 ou 2 continua falhando (testes pre-existentes devem permanecer verdes sem alteracao).
7. `tests/pbq-init-smoke.mjs` ganha ao menos 4 asserts novos cobrindo os criterios 1-4.
8. Sensores obrigatorios deste package passam (exit code 0).
9. Evaluation do package 3 lista cada sensor obrigatorio com status, comando, exit code e evidencia, com Score 1.

## Sensores Obrigatorios

**OBRIGATORIO** listar sensores por nome/tier/comando esperado.

- Runner legado: `.\.plan-build-qa\harness\scripts\run-fast.ps1` (inclui check de estrutura; nao era sensor cadastrado em sensors.json na epoca)
- Medium | `npm-run-test` | `npm run test`

## Riscos

- Adicionar parsing de flag pode interferir com argumentos posicionais; mitigacao: `--strict` so vale quando passado explicitamente; demais args mantem ordem.
- Catch de JSON parse pode mascarar erros estruturais; mitigacao: warning carrega o motivo do erro de parse.
- Alteracao no output do `analyze` pode quebrar consumidores; mitigacao: linha `Resumo:` e aditiva e nao remove formato existente; tests pre-existentes confirmam.

## Rollback

`git revert` do commit do package 3. Como sao tres mudancas aditivas em `bin/pbq.mjs`, o revert restaura totalmente o comportamento dos packages 1 e 2.

## Observabilidade

stdout/stderr do CLI e evidencia dos testes automatizados. Sem logs persistentes.

## Duvidas Abertas

Nenhuma aberta para iniciar o package 3.

**PARE** se houver duvida aberta que possa alterar escopo, arquivos permitidos, criterio de aceite ou sensor obrigatorio.
