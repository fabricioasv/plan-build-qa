# Constitution: Operations

## Seguranca Operacional

> **Regra de seguranca**
> **PARE** antes de executar comando destrutivo, deploy, publish, migration, seed ou alteracao de ambiente sem aprovacao humana explicita.

- Nao execute comandos destrutivos, deploy, publish, migration, seed ou alteracao de ambiente sem aprovacao humana explicita.
- Nao leia, imprima ou copie segredos de arquivos `.env`, cofres, variaveis sensiveis ou logs privados.
- Nao altere configuracoes de CI/CD, seguranca, lint ou testes para fazer sensores passarem sem contrato explicito.

## Riscos Detectados

- Nenhum risco operacional especifico foi detectado automaticamente.

## Rollback

- Cada contrato deve indicar como desfazer a mudanca.
- Mudancas pequenas devem ser isoladas para revert simples.
- Mudancas com dados, migracoes ou efeitos externos exigem plano de rollback validado por humano.

## Observabilidade

- Mudancas em comportamento de runtime devem considerar logs, metricas ou rastros ja usados pelo projeto.
- Nao introduza logs ruidosos nem exponha dados sensiveis.
- Quando nao houver observabilidade aplicavel, registre isso no contrato.

## Ambientes

- Sensores fast e medium devem evitar dependencia de servicos externos sempre que possivel.
- Sensores slow podem exigir ambiente especifico, mas devem falhar de forma explicita quando pre-condicoes estiverem ausentes.
