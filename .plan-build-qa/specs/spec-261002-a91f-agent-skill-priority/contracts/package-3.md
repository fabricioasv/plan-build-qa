# Contract: Package 3

## Package

3

## Objetivo

Usar o primeiro agente listado em `--agents` como dono do conteudo integral de cada skill; os demais apontam diretamente para ele.

## Arquivos Permitidos

| Caminho | Mudanca |
| --- | --- |
| `bin/pbq.mjs` | Selecao do agente principal, referencias e ordem do manifest |
| `tests/pbq-init-smoke.mjs` | Regressao das ordens de agentes em init/update |
| `README.md` | Regra da ordem |
| `.plan-build-qa/specs/spec-261002-a91f-agent-skill-priority/**` | Contrato, progresso e avaliacao |
| `.plan-build-qa/roadmap.md` | Status |

## Arquivos Proibidos

- `templates/adapters/skills/**` e conteudo canonico das skills.

## Mudancas Permitidas

- Selecionar como principal o primeiro agente valido na lista (primeira ocorrencia se repetido).
- Gerar conteudo integral no artefato desse agente e referencia direta nos demais.
- Preservar frontmatter das skills `SKILL.md` secundarias para Claude e Codex.
- Registrar `manifest.agents` na ordem informada, para auditar a escolha.
- No update, reescrever os artefatos quando a ordem mudar, mesmo com o mesmo conjunto de agentes.

## Mudancas Proibidas

- Alterar conteudo canonico das skills ou regras de escrita direta do Package 2.
- Criar referencia transitiva que dependa de outro agente secundario.

## Criterios de Aceite

1. Para cada agente isolado, seu artefato recebe conteudo integral.
2. Para pares em ambas as ordens, o primeiro recebe conteudo integral e o segundo aponta diretamente para ele.
3. Para as seis permutacoes de tres agentes, somente o primeiro recebe conteudo integral; as outras duas referencias apontam para o primeiro.
4. `pbq update` aplica a mesma regra quando somente a ordem muda e sobrescreve os originais sem `.pbq-new`.
5. `manifest.agents` preserva a ordem informada em init/update.
6. Skills secundarias em `.claude/skills` e `.agents/skills` mantem frontmatter valido.

## Sensores Obrigatorios

| Sensor | Scope | Comando | Motivo |
| --- | --- | --- | --- |
| pbq-analyze | global | `node ./bin/pbq.mjs analyze .` | Coerencia do harness |
| npm-run-test | global | `npm run test` | Regressao de init/update |

## Riscos

Mudar apenas a ordem reescreve skills gerenciadas; o source control permite revisar a mudanca.

## Rollback

Reverter o Package 3 e recuperar as skills anteriores pelo source control.

## Observabilidade

`manifest.agents` e o resumo do update registram a selecao aplicada.

## Duvidas Abertas

Nenhuma.
