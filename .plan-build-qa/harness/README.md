# Harness Engineering

Este harness e a camada externa de controle para agentes de IA neste repositorio. Ele combina guias de feedforward, sensores de feedback e registro de progresso.

Referencias:

- https://martinfowler.com/articles/harness-engineering.html
- https://www.youtube.com/watch?v=dLs-Pbn8stU

## Quando Usar Spec

- Mudanca pequena: contrato inline e sensores fast podem ser suficientes.
- Mudanca media: crie uma spec em `.plan-build-qa/specs/spec-XXX-nome/` e um contrato em `contracts/package-N.md`.
- Mudanca grande: divida em varios packages pequenos, reversiveis e validaveis.

## Quando Usar Contrato Formal

Use contrato formal quando houver alteracao de fluxo, fronteira publica, persistencia, integracao externa, arquitetura, seguranca, CI/CD ou mais de um modulo afetado.

## Sensores

Fast:

- Apenas `check-harness-structure` foi configurado; adicione lint/typecheck/teste rapido com `pbq sensor add` quando existir.

Medium:

- `npm run test` - package.json script 'test'

Slow:

- Placeholder: nenhum E2E/integracao pesada detectado.

Comandos:

```powershell
.\.plan-build-qa\harness\scripts\run-fast.ps1
.\.plan-build-qa\harness\scripts\run-medium.ps1
.\.plan-build-qa\harness\scripts\run-slow.ps1
```

Em Unix:

```sh
sh ./.plan-build-qa/harness/scripts/run-fast.sh
sh ./.plan-build-qa/harness/scripts/run-medium.sh
sh ./.plan-build-qa/harness/scripts/run-slow.sh
```

## Progresso

Cada spec deve manter `progress.md` com estado atual, decisoes, sensores executados, falhas anteriores e contexto para retomada.

O roadmap em `.plan-build-qa/roadmap.md` e o indice consolidado das specs:

- Ao criar uma spec, registre status `em andamento`.
- Ao concluir uma spec, registre status `concluido`, data e evidencia.
- Nao marque `concluido` se houver package obrigatorio sem evaluation Score 1, salvo excecao documentada.

## Nova Spec

1. Copie `.plan-build-qa/harness/templates/spec.md` para `.plan-build-qa/specs/spec-XXX-nome/spec.md`.
2. Copie `.plan-build-qa/harness/templates/progress.md` para `.plan-build-qa/specs/spec-XXX-nome/progress.md`.
3. Crie `contracts/package-N.md` a partir de `.plan-build-qa/harness/templates/contract.md`.
4. Liste sensores obrigatorios antes da implementacao.

## Concluir Package

1. Confirme que o escopo do contrato foi respeitado.
2. Rode sensores obrigatorios.
3. Atualize `progress.md`.
4. Gere `evaluations/package-N.md` com Score 0 ou 1.
5. Score 1 exige todos os sensores obrigatorios passando e nenhuma violacao critica.

## Hierarquia de Regras

1. instrucoes superiores da plataforma/ferramenta
2. regras ja existentes do repositorio
3. `.plan-build-qa/constitution/`
4. `.plan-build-qa/harness/`
5. `spec.md`
6. `contracts/`
7. prompts locais
8. implementacao
