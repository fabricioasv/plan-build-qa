# Contract: Package 2

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

2

## Objetivo

Expandir `pbq analyze` (introduzido no package 1) com tres verificacoes objetivas adicionais, mantendo o modo somente leitura: (a) estados de spec do roadmap restritos ao conjunto permitido; (b) coerencia entre `Package Atual` do roadmap e `Package Atual` do `progress.md` de cada spec; (c) sensores obrigatorios declarados em contratos referenciam apenas sensores cadastrados em `.plan-build-qa/sensors.json`. Adicionar cobertura automatizada para cada caso.

## Arquivos Permitidos

- `bin/pbq.mjs`
- `tests/pbq-init-smoke.mjs`
- `.plan-build-qa/specs/spec-001-analyze/progress.md`
- `.plan-build-qa/specs/spec-001-analyze/contracts/package-2.md`
- `.plan-build-qa/specs/spec-001-analyze/evaluations/package-2.md`
- `README.md` (apenas se a ajuda do CLI for ajustada para descrever as novas validacoes)

## Arquivos Proibidos

- `package.json`
- `.plan-build-qa/constitution/**`
- `.plan-build-qa/harness/templates/**`
- `.plan-build-qa/sensors.json`
- `.plan-build-qa/roadmap.md` (exceto pela marcacao final de status quando a spec inteira for concluida; este package nao altera a spec-001 no roadmap)
- qualquer arquivo de outras skills (`.claude/skills/**`)
- qualquer arquivo fora da lista de arquivos permitidos

## Mudancas Permitidas

- Adicionar funcoes auxiliares dentro de `bin/pbq.mjs` para as tres novas verificacoes.
- Estender `analyzeHarness` (e/ou helpers correlatos) para emitir as violacoes/avisos correspondentes.
- Adicionar testes em `tests/pbq-init-smoke.mjs` cobrindo um caso valido e um caso invalido para cada verificacao nova.
- Ajustar ajuda do CLI somente se isso afetar a descricao de `pbq analyze`.
- Atualizar `progress.md` desta spec com execucao e resultado do package.

## Mudancas Proibidas

**NUNCA** inclua refactor amplo, mudanca funcional extra ou ajuste de teste fora do objetivo deste package.

- Nao corrigir ou reescrever automaticamente artefatos inconsistentes do alvo analisado.
- Nao refatorar comandos nao relacionados (`init`, `update`, `sensor`, `run`, `package`).
- Nao introduzir novas dependencias, novo formato de arquivo ou nova persistencia.
- Nao relaxar criterios ja cobertos pelo package 1.
- Nao alterar sensores cadastrados nem scripts do harness para acomodar o comando.

## Criterios de Aceite

**OBRIGATORIO** definir criterios objetivos e verificaveis.

1. `pbq analyze <path>` retorna exit code diferente de `0` e identifica a violacao quando uma linha de spec no `roadmap.md` do alvo usa estado fora do conjunto `{planejado, em andamento, bloqueado, concluido, cancelado}`.
2. `pbq analyze <path>` retorna exit code diferente de `0` e identifica a violacao quando `Package Atual` declarado no `roadmap.md` para uma spec diverge do `Package Atual` registrado no `progress.md` daquela spec (considerando o numero do package, nao texto livre). Quando `roadmap.md` registra `-` ou vazio, a verificacao deve ser tolerante e nao emitir violacao.
3. `pbq analyze <path>` emite violacao quando um `contracts/package-N.md` lista, na secao `Sensores Obrigatorios`, um nome de sensor que nao existe em `.plan-build-qa/sensors.json` do alvo. Sensores citados apenas por comando (sem nome cadastrado) geram aviso, nao violacao.
4. Casos validos para as tres verificacoes acima continuam retornando exit code `0`.
5. `tests/pbq-init-smoke.mjs` contem ao menos um caso valido e um caso invalido para cada uma das tres verificacoes novas (total: 6 asserts novos no minimo).
6. O comando permanece somente leitura: nao cria, altera ou remove arquivos do alvo analisado.
7. Sensores obrigatorios deste package passam (exit code 0).
8. Evaluation do package 2 lista cada sensor obrigatorio com status, comando, exit code e evidencia.

## Sensores Obrigatorios

**OBRIGATORIO** listar sensores por nome/tier/comando esperado.

- Runner legado: `.\.plan-build-qa\harness\scripts\run-fast.ps1` (inclui check de estrutura; nao era sensor cadastrado em sensors.json na epoca)
- Medium | `npm-run-test` | `npm run test`

## Riscos

- Parsing adicional do markdown do roadmap e do progress pode ficar fragil. Mitigacao: cobrir cada nova regra por teste especifico e manter parser tolerante a espacamento.
- Lista de estados permitidos pode divergir entre `constitution/operations.md` e a logica do analyze. Mitigacao: declarar o conjunto em uma constante unica em `bin/pbq.mjs` e referenciar a mesma constante no help, se ajustado.
- Verificacao de sensores pode gerar ruido em projetos que ainda usam `pbq sensor add` parcialmente. Mitigacao: classificar sensor citado apenas por comando como aviso, nao violacao.

## Rollback

`git revert` do commit do package 2. Como o comando permanece somente leitura sobre o alvo analisado, nao ha rollback de dados; basta restaurar o estado anterior dos arquivos permitidos.

## Observabilidade

stdout/stderr do CLI e a evidencia dos testes automatizados. Nao introduzir logs persistentes.

## Duvidas Abertas

Nenhuma aberta para iniciar o package 2.

**PARE** se houver duvida aberta que possa alterar escopo, arquivos permitidos, criterio de aceite ou sensor obrigatorio.
