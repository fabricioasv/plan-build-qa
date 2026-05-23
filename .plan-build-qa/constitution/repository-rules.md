# Constitution: Repository Rules

Este arquivo consolida regras existentes detectadas no repositorio durante o bootstrap. Ele nao substitui os arquivos originais.

## Fontes Lidas

- README.md
- templates/specs/README.md

## Trechos Operacionais Extraidos

### README.md

  - npm install
  - npm link
  - Sem `npm link`:
  - Por padrao, o init cria `AGENTS.md` e `CLAUDE.md` quando eles nao existem, com uma ponte curta para `.plan-build-qa/`. Se esses arquivos ja existirem, ele apenas anexa uma secao marcada e preserva o restante.
  - .plan-build-qa/
  - test/
  - test/
  - O update usa `.plan-build-qa/manifest.json` para distinguir arquivos ainda iguais ao template de arquivos customizados:
  - .\.plan-build-qa\harness\scripts\check-harness-structure.ps1
  - .\.plan-build-qa\harness\scripts\run-fast.ps1
  - .\.plan-build-qa\harness\scripts\run-medium.ps1
  - .\.plan-build-qa\harness\scripts\run-slow.ps1

### templates/specs/README.md

  - .plan-build-qa/specs/spec-XXX-nome/
  - Cada package deve ser pequeno, reversivel e validavel.
  - Use os templates em `.plan-build-qa/harness/templates/`.

## Regras de Preservacao

- Regras existentes do repositorio tem prioridade sobre este harness.
- Se este arquivo divergir de `AGENTS.md`, `CLAUDE.md`, README, CI ou documentacao local, siga a regra mais especifica e atualize esta consolidacao.
- Nao invente convencoes: derive regras de codigo, testes, scripts e documentos existentes.
