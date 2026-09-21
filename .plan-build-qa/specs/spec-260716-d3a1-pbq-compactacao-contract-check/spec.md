# Spec: pbq compactacao contract-check

Spec ID: 260716-d3a1

## Objetivo

Reduzir o custo operacional do PBQ em repositorios consumidores, diminuindo artefatos Markdown/JSON gerados e tornando a validacao de contrato mais computacional, curta e rapida.

## Contexto

Diagnostico em `C:\dti\netview\max` mostrou que o uso prolongado do PBQ acumulou:

- `.plan-build-qa` com 523 arquivos e cerca de 3,3 MB.
- `.plan-build-qa/specs` com 462 arquivos e cerca de 2,6 MB.
- `progress.md` de ate 100 KB.
- `roadmap.md` com cerca de 84 KB.
- dashboard versionado com cerca de 376 KB.
- 84 arquivos `package-X.Y.md`, que hoje geram violacoes.
- `pbq analyze` com 189 violacoes e 90 warnings.

O problema observado pelo usuario nao e apenas etapa extra. O peso vem do que o harness incentiva a gerar: historico longo em `progress.md`, evidencias inline em `evaluations`, roadmap narrativo, dashboard derivado versionado e contract-check dependente de leitura/avaliacao contextual demais.

## Escopo

- Criar validacao computacional leve para contratos.
- Atualizar a skill `test` para usar o caminho leve no modo `contract-check`.
- Compactar artefatos gerados para novas specs/packages.
- Reduzir evidencia inline em evaluations e mover logs longos para artefatos externos quando necessario.
- Tratar dashboard como snapshot derivado, nao fonte canonica.
- Criar diagnostico/saneamento nao-destrutivo para instalacoes existentes.

## Fora de Escopo

- Saneamento destrutivo automatico de repositorios consumidores.
- Reescrever historico existente sem comando explicito e aprovado.
- Remover a separacao conceitual entre `spec`, `implement` e `test`.
- Relaxar sensores obrigatorios ou permitir Score 1 sem evidencia objetiva.
- Corrigir as 189 violacoes do repositorio `C:\dti\netview\max` dentro desta spec.

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Criar `pbq contract check` leve e atualizar contract-check para preferir validacao computacional curta | em andamento | pbq-analyze, npm-run-test |
| 2 | Compactar templates e geracao de `progress.md`, `contract.md` e `evaluation.md` para novos packages | planejado | pbq-analyze, npm-run-test |
| 3 | Reduzir artefatos derivados versionados, especialmente dashboard, com orientacao de `.gitignore` e geracao sob demanda | planejado | pbq-analyze, npm-run-test |
| 4 | Adicionar diagnostico nao-destrutivo de peso do harness para repos existentes, com contadores e recomendacoes objetivas | planejado | pbq-analyze, npm-run-test |

## Riscos

- Compactar demais e perder informacao necessaria para retomada por outro agente.
- Criar validacao mecanica que pareca substituir revisao humana de escopo.
- Alterar templates sem atualizar adapters `.agents` e `.claude`.
- Gerar divergencia entre arquivos canonicos e templates em `templates/`.

## Sensores Esperados

- `pbq-analyze`: valida coerencia estrutural do harness.
- `npm-run-test`: cobre regressao do CLI e smoke tests.
- Sensores locais podem ser adicionados por package para fixtures de performance/compactacao.

## Criterios de Conclusao

- Novas specs/packages gerados pelo PBQ passam a ser mais curtos por padrao, sem remover campos canonicos essenciais.
- Contract-check possui caminho computacional que nao depende de ler roadmap/progress/evaluations para validar requisitos mecanicos do contrato.
- Dashboard gerado e tratado como artefato derivado por default.
- Existe diagnostico objetivo para identificar arquivos PBQ grandes e subpackages decimais em repos consumidores.
- `pbq analyze .` e `npm run test` passam no fechamento dos packages.

## Enforcement

Enforcement: advisory
