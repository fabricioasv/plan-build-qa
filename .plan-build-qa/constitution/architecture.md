# Constitution: Architecture

Este arquivo contem regras permanentes de arquitetura para agentes e humanos. Ele deve evoluir quando o time encontrar desvios recorrentes.

## Contexto Detectado

Linguagens/frameworks detectados:

- JavaScript/TypeScript

Arquivos de instrucao existentes:

- AGENTS.md
- CLAUDE.md

## Varredura Arquitetural Inicial

Esta secao e informativa. Ela descreve sinais encontrados no repositorio para orientar investigacao, mas nao transforma a arquitetura atual em regra permanente.

Top-level detectado:

- .agents
- AGENTS.md
- CLAUDE.md
- README.md
- package.json
- templates
- tests

Sinais de camadas/modulos:

- Infrastructure: templates/adapters/skills/analyze, templates/adapters/skills/constitution, templates/adapters/skills/implement, templates/adapters/skills/roadmap, templates/adapters/skills/sensor, templates/adapters/skills/spec, templates/adapters/skills/test
- Tests: .agents/skills/spec, .agents/skills/test, templates/adapters/skills/spec, templates/adapters/skills/test, templates/specs, tests

Conectores e fronteiras tecnicas:

- Nenhum conector tecnico forte detectado automaticamente.

## Principios

> **Regra de arquitetura**
> **NUNCA** trate a arquitetura atual como autoridade absoluta. Use-a como evidencia e aplique boas praticas de engenharia.

- Use a estrutura atual como evidencia, nao como autoridade absoluta.
- Prefira boas praticas de engenharia: coesao alta, acoplamento baixo, separacao de responsabilidades, nomes claros, testes objetivos e fronteiras explicitas.
- Prefira mudancas pequenas, reversiveis e testaveis.
- Nao misture refactor estrutural com mudanca funcional no mesmo package sem contrato explicito.
- Nao crie dependencias globais, estado compartilhado ou atalhos transversais sem justificativa registrada na spec.
- Modulos de baixo nivel nao devem conhecer detalhes de UI, transporte, banco ou infraestrutura sem uma fronteira clara e justificada.

## Limites Entre Camadas e Modulos

- Extraia os limites reais do codigo antes de alterar chamadas entre diretorios ou camadas.
- Se o limite atual contrariar boas praticas, registre o risco e proponha migracao incremental em spec propria.
- Ao tocar uma fronteira publica, registre consumidores afetados e sensores que cobrem a mudanca.
- Alteracoes em contratos publicos exigem criterio de aceite objetivo e, quando aplicavel, migracao documentada.

## Dependencias Permitidas e Proibidas

- Permitido: dependencias que ja fazem parte do padrao local ou que estejam justificadas na spec.
- Proibido: dependencia nova para conveniencia local sem avaliacao de impacto.
- Proibido: chamadas diretas que contornem camadas de dominio, aplicacao ou infraestrutura ja existentes.

## Refactors

- Refactor deve preservar comportamento observavel.
- Refactor amplo exige package proprio e sensores antes/depois.
- Nao renomeie ou mova arquivos em massa sem contrato que delimite o escopo.

## Mudancas Estruturais

Mudancas estruturais exigem spec + contrato quando:

- alteram diretorios compartilhados ou interfaces publicas
- mudam fluxo de dados entre camadas
- introduzem infraestrutura, fila, cache, banco, autenticacao ou observabilidade
- afetam mais de um modulo funcional
