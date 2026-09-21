# Spec: spec-025-sensor-scope-local-global

## Objetivo

Evoluir o modelo de sensores para separar sensores globais permanentes de sensores locais de spec/package, evitando que validacoes muito especificas sejam promovidas automaticamente para `.plan-build-qa/sensors.json`.

## Contexto

Repositorios reais com muitos packages, como `netview/max`, mostraram que o modelo atual incentiva todo aprendizado de uma spec a virar sensor global permanente. Isso faz o gate `close` crescer indefinidamente e mistura tres responsabilidades:

- invariantes permanentes do projeto;
- matriz operacional de builds/E2E;
- checks historicos ou temporarios de um package.

O harness precisa preservar a retroalimentacao para a IA, mas com uma politica explicita de escopo:

- sensor global: fica no registry canonico e pode ser reutilizado por qualquer contrato;
- sensor local: vive no contrato/evaluation do package e so e promovido a global por decisao explicita.

Esta spec complementa `spec-021-package-close-contract-driven`, que torna o `package close` orientado ao contrato. Enquanto a `spec-021` fecha o loop de execucao dos sensores obrigatorios, esta spec define como esses sensores podem ser globais ou locais.

## Escopo

- Modelo declarativo de sensores com `scope`.
- Compatibilidade com `sensors.json` v2: sensor sem `scope` equivale a `scope: "global"`.
- Representacao de sensor local em `contracts/package-N.md`.
- Comportamento de `pbq sensor add/list` para escopo global e package-local.
- Comportamento esperado de `pbq package close` para sensores globais e locais.
- Comportamento esperado de `pbq analyze` e contract-check para sensores locais.
- Templates, skills e docs do harness.

## Fora de Escopo

- Saneamento do registry de sensores do MAX ou outro repositorio alvo.
- Matriz parametrizada de clientes (`build-client -Client X`, `e2e-client -Client X`).
- Scheduler de CI/CD, nightly ou deteccao automatica de clientes afetados.
- Remocao de `tier` ou `on`.
- Mudanca do comportamento advisory dos hooks.

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Fundacao do modelo: schema `scope`, default global, parser de sensores locais em contratos e testes cobrindo compatibilidade | concluido | medium: `npm-run-test`; fast: `pbq-analyze` |
| 2 | Execucao: `pbq package close` roda sensores globais referenciados e sensores locais inline, registrando evidencias na evaluation | concluido | medium: `npm-run-test`; fast: `pbq-analyze` |
| 3 | CLI e validacao: `pbq sensor add/list` com `--scope`, `pbq analyze` e contract-check aceitam sensores locais sem exigir registro global | concluido | medium: `npm-run-test`; fast: `pbq-analyze` |
| 4 | Docs/templates/skills: atualizar constitution, templates de contrato/evaluation, skills `sensor` e `test`, e guia de promocao local -> global | concluido | medium: `npm-run-test`; fast: `pbq-analyze` |

## Riscos

- Sobrepor escopo da `spec-021`. Mitigacao: Package 1 nao muda execucao do gate; packages seguintes devem considerar o estado final da `spec-021`.
- Local sensor virar forma de burlar governanca. Mitigacao: sensor local precisa de comando, motivo e evidencia no contrato/evaluation, e deve falhar com exit code nao zero.
- Quebra de compatibilidade em projetos existentes. Mitigacao: `scope` ausente significa `global`.
- Contracts antigos com sensores nao registrados podem mudar de diagnostico. Mitigacao: somente tratar como local quando o contrato declarar comando/escopo local de forma objetiva.

## Sensores Esperados

- `npm-run-test` (medium) - registrado; valida regressao do CLI/harness.
- `pbq-analyze` (fast) - registrado; valida coerencia estrutural do harness.

## Criterios de Conclusao

- O PBQ diferencia sensor global e local sem quebrar `sensors.json` v2 existente.
- Sensor local pode ser declarado no contrato com nome, comando, tier, eventos/uso e motivo.
- `package close` consegue registrar evidencia de sensores globais e locais na mesma evaluation.
- `analyze` e contract-check nao exigem registro global para sensor local bem declarado.
- Templates e skills orientam quando manter local e quando promover para global.
- O fluxo de migracao para repositorios como MAX fica documentado, mas nao executado nesta spec.

## Decisoes de design

- `sensors.json` permanece o registry canonico apenas de sensores globais.
- Sensor sem `scope` e tratado como `global` para compatibilidade.
- Sensor local nasce no contrato do package, nao no registry global.
- Promocao local -> global exige acao explicita (`pbq sensor add --scope global` ou edicao equivalente), com motivo registrado.
- `on` continua controlando gatilhos; `tier` continua rotulo de custo.

## Enforcement

Enforcement: advisory
