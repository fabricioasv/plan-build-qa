# Spec: spec-001-analyze

## Objetivo

Criar o comando `pbq analyze` para validar, em modo somente leitura, a consistencia entre `roadmap.md`, specs, contracts, `progress.md`, evaluations e sensores do harness.

## Contexto

O repositorio ja possui `pbq status`, `pbq package close`, templates de spec/contract/evaluation e sensores registrados em `.plan-build-qa/sensors.json`, mas ainda nao existe um comando dedicado para detectar incoerencias entre esses artefatos. O roadmap prioriza `spec-001-analyze` como proximo incremento porque isso reduz falsa completude e torna o uso do harness mais auditavel.

## Escopo

- Adicionar um comando CLI `pbq analyze`.
- Validar artefatos dentro de `.plan-build-qa/` sem modificar arquivos.
- Produzir saida textual com violacoes, avisos e resumo final.
- Retornar exit code diferente de zero quando houver violacao critica definida pela spec/contrato.
- Cobrir o comportamento com testes automatizados.

## Fora de Escopo

- Corrigir automaticamente artefatos inconsistentes.
- Alterar o formato dos arquivos de harness existentes.
- Criar painel interativo, TUI ou persistencia adicional.
- Introduzir dependencias externas novas.

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Entregar a primeira versao de `pbq analyze` validando presenca e coerencia minima entre roadmap, pasta da spec, `progress.md`, `contracts/` e uso basico de `evaluations/` quando houver packages fechados, com testes automatizados e ajuda do CLI atualizada. | planejado | fast: `.\.plan-build-qa\harness\scripts\run-fast.ps1`; medium: `npm run test` |
| 2 | Expandir `pbq analyze` para verificar coerencia entre package atual, evidencias de evaluation, sensores obrigatorios e estados permitidos sem relaxar contratos existentes. | planejado | fast: `.\.plan-build-qa\harness\scripts\run-fast.ps1`; medium: `npm run test` |
| 3 | Refinar mensagens, documentacao e cobertura de casos de erro para tornar o comando utilizavel em fluxos reais de manutencao do harness. | planejado | fast: `.\.plan-build-qa\harness\scripts\run-fast.ps1`; medium: `npm run test` |

## Riscos

- As regras de consistencia podem ficar vagas demais e gerar falso positivo ou falso negativo.
- O comando pode virar um agregador grande demais se tentar validar todas as regras em um unico package.
- Ha tensao entre regras inferidas do conteudo markdown e contratos realmente obrigatorios; isso precisa ser documentado incrementalmente.

## Sensores Esperados

- Fast: `.\.plan-build-qa\harness\scripts\run-fast.ps1`
- Medium: `npm run test`
- Slow: nenhum sensor obrigatorio neste momento

## Criterios de Conclusao

- `pbq help` ou ajuda equivalente passa a listar `analyze` sem regredir os comandos atuais.
- `pbq analyze` percorre `.plan-build-qa/` em modo somente leitura e emite resultado deterministico para entradas iguais.
- Existe pelo menos um teste automatizado cobrindo sucesso e falha do comando.
- Cada package desta spec possui contract, `progress.md` atualizado, evaluation correspondente e evidencia objetiva dos sensores obrigatorios antes de marcar a spec como `concluido`.
