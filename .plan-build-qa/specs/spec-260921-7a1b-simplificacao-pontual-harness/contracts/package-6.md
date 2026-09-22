# Contract: Package 6

> **Regra de bloqueio**
> **PARE** se este contrato nao delimitar objetivo, arquivos permitidos, mudancas permitidas, criterios de aceite e sensores obrigatorios.

## Package

6

## Objetivo

Criar a skill `retro` (4o estagio informal do fluxo do usuario: spec/implement/test/retro) como skill de agente pura, instalada nos 3 adapters, sem subcomando novo no CLI.

## Arquivos Permitidos

- `templates/adapters/skills/retro/SKILL.md` (novo)
- `.claude/skills/retro/SKILL.md` (novo)
- `.agents/skills/retro/SKILL.md` (novo)
- `bin/pbq.mjs` (adicionar `"retro"` a `ADAPTER_SKILLS`)
- `.plan-build-qa/manifest.json` (hash das 3 copias)
- `README.md`, `.plan-build-qa/OVERVIEW.md`, `templates/harness/OVERVIEW.md` (mencionar `retro` como 4o estagio)
- `tests/pbq-init-smoke.mjs` (cobrir instalacao da skill `retro`)

## Arquivos Proibidos

- `constitution/*` (a skill `retro` recomenda mudanca nesses arquivos, mas nao os edita neste package nem em runtime).
- `.plan-build-qa/sensors.json` (idem — `retro` recomenda, nao cadastra sensor sozinha).

## Mudancas Permitidas

- Escrever `SKILL.md` da skill `retro` com: frontmatter no mesmo padrao das skills existentes; workflow numerado que le `roadmap.md`, historico de `evaluations/*.md` das specs e a saida de `pbq analyze --strict`; produz um veredito objetivo por item (revisar / incrementar / excluir) sobre `constitution/`, `sensors.json` ou templates do harness.
- Regra de PARE explicita: `retro` nunca edita `constitution/` ou sensores diretamente — aplicar a recomendacao passa pelas skills `constitution`/`sensor` normais (mesmo modelo do `bug`, que investiga mas nao corrige).
- Registrar `retro` em `ADAPTER_SKILLS` para que `pbq init`/`pbq update` a instalem conforme os agentes escolhidos no Package 5.

## Mudancas Proibidas

- Criar subcomando `pbq retro` no CLI.
- Fazer a skill aplicar mudanca de constitution/sensor automaticamente.

## Criterios de Aceite

- `.claude/skills/retro/SKILL.md`, `.agents/skills/retro/SKILL.md` e `templates/adapters/skills/retro/SKILL.md` existem e sao identicos (mesmo padrao de diff vazio usado pelas outras skills).
- `node ./bin/pbq.mjs init <dir-vazio> --agents claude` instala `.claude/skills/retro/SKILL.md`.
- `pbq analyze .` nao acusa skill `retro` como fonte nao referenciada no manifest.
- README/OVERVIEW citam `retro` como 4o estagio do fluxo.

## Sensores Obrigatorios

| Sensor | Scope | Tier | Comando | Motivo |
| --- | --- | --- | --- | --- |
| pbq-analyze | global | - | `node ./bin/pbq.mjs analyze .` | Confirma coerencia do harness com a nova skill registrada |
| npm-run-test | global | - | `npm run test` | Cobre instalacao da skill `retro` |

## Riscos

- Se o texto da skill nao deixar claro o limite de "so recomenda, nao aplica", o agente pode editar `constitution/` diretamente ao rodar `retro` — mitigado pela regra de PARE explicita no `SKILL.md`, no mesmo padrao ja validado pela skill `bug`.

## Rollback

Reverter o commit deste package remove a skill `retro` dos 3 adapters e do `ADAPTER_SKILLS`.

## Observabilidade

Nao aplicavel.

## Duvidas Abertas

Nenhuma.
