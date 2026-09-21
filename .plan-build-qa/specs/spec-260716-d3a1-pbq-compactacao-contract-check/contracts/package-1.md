# Contract: Package 1

## Package

Package 1 - contract-check computacional e leve.

## Objetivo

Criar um caminho de validacao mecanica de contrato que seja rapido, deterministico e reutilizavel pela skill `test` em modo `contract-check`, reduzindo a necessidade de leitura ampla de roadmap/progress/evaluations para checagens estruturais simples.

## Arquivos Permitidos

| Caminho | Mudanca |
| --- | --- |
| `bin/pbq.mjs` | Adicionar subcomando/funcoes de `contract check` e mensagens de ajuda |
| `tests/pbq-init-smoke.mjs` | Adicionar fixtures e asserts para contratos validos/invalidos |
| `.agents/skills/test/SKILL.md` | Simplificar modo `contract-check` para preferir a validacao computacional |
| `.claude/skills/test/SKILL.md` | Manter adapter Claude em paridade quando aplicavel |
| `templates/adapters/skills/test/SKILL.md` | Propagar instrucao da skill para novas instalacoes |
| `.plan-build-qa/specs/spec-260716-d3a1-pbq-compactacao-contract-check/progress.md` | Registrar progresso do package |
| `.plan-build-qa/specs/spec-260716-d3a1-pbq-compactacao-contract-check/evaluations/package-1.md` | Registrar resultado do package |

## Arquivos Proibidos

- Arquivos de aplicacao fora do CLI/harness PBQ.
- `.plan-build-qa/roadmap.md`, exceto se a implementacao mudar o estado da spec.
- Templates de `contract.md`, `progress.md`, `evaluation.md` e dashboard; ficam para packages seguintes.
- Qualquer arquivo em `C:\dti\netview\max`.

## Mudancas Permitidas

- Adicionar comando CLI, por exemplo `pbq contract check <path> --contract <arquivo>` e/ou `pbq contract check <path> --spec <spec> --package <N>`.
- Validar mecanicamente:
  - presenca de secoes obrigatorias: `Objetivo`, `Arquivos Permitidos`, `Mudancas Permitidas`, `Criterios de Aceite`, `Sensores Obrigatorios`, `Rollback`;
  - pelo menos um criterio de aceite nao-vazio;
  - pelo menos um sensor obrigatorio;
  - sensor global existente em `.plan-build-qa/sensors.json`;
  - sensor local/package com `Comando` e `Motivo` preenchidos;
  - ausencia de placeholders obvios como `<nome>`, `<comando>`, `TODO` em campos obrigatorios.
- Suportar saida textual curta e, se simples, saida `--json` para testes.
- Atualizar a skill `test` para usar esse comando como primeira etapa do modo `contract-check`.
- Manter revisao contextual/humana apenas para ambiguidades que o comando nao consegue decidir.

## Mudancas Proibidas

- Rodar sensores de codigo no modo `contract-check`.
- Transformar `contract-check` em `pbq analyze` completo.
- Ler ou exigir `roadmap.md`, `progress.md` ou `evaluations/` para validar mecanicamente um contrato.
- Relaxar validacao de sensores obrigatorios no `package close` ou no `analyze`.
- Remover a verificacao independente da skill `test`; o pacote so muda o mecanismo default para a parte mecanica.

## Criterios de Aceite

1. Um contrato valido em fixture minima, com `sensors.json` e sem `roadmap.md`/`progress.md`, passa no novo `contract check` com exit code 0.
2. Um contrato sem `Criterios de Aceite` falha com exit code diferente de 0 e mensagem objetiva contendo o nome da secao ausente.
3. Um contrato com sensor global inexistente falha e informa o nome do sensor.
4. Um contrato com sensor local sem comando ou motivo falha e informa o campo ausente.
5. A saida default do comando e curta: para sucesso, no maximo tres linhas; para falha, lista objetiva de problemas sem imprimir o contrato inteiro.
6. A skill `test` em `.agents`, `.claude` e `templates/adapters` orienta que `contract-check` use o novo comando antes de qualquer revisao contextual mais ampla.
7. `npm run test` cobre os casos valido, secao ausente, global inexistente e local incompleto.
8. `pbq analyze .` passa apos a implementacao.

## Sensores Obrigatorios

| Sensor | Scope | Tier | Comando | Motivo |
| --- | --- | --- | --- | --- |
| pbq-analyze | global | fast |  | Garante coerencia estrutural do harness depois de adicionar a spec e o comando |
| npm-run-test | global | medium |  | Cobre regressao do CLI e dos fixtures de contract-check |

## Riscos

- A validacao mecanica pode ser confundida com aprovacao total de qualidade do contrato.
- Contratos existentes podem usar formatos legados que o checker novo precisa tratar com mensagens claras.
- A worktree contem alteracoes nao relacionadas nas skills/templates; a implementacao deve editar preservando o conteudo atual.

## Rollback

Reverter as alteracoes em `bin/pbq.mjs`, `tests/pbq-init-smoke.mjs` e nas tres variantes da skill `test`. Remover `evaluations/package-1.md` se tiver sido criado durante uma tentativa abortada.

## Observabilidade

O comando deve expor contadores simples: contrato valido/invalido, quantidade de problemas e nomes dos sensores validados. Nao deve registrar logs longos.

## Duvidas Abertas

Nenhuma para este package.
