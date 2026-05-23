# Implement Package

Voce esta implementando um package dentro do Harness Engineering System.

1. Carregue as regras relevantes em `.plan-build-qa/constitution/`.
2. Carregue a spec ativa em `.plan-build-qa/specs/spec-XXX-nome/spec.md`.
3. Carregue `.plan-build-qa/roadmap.md`.
4. Carregue `progress.md`.
5. Carregue o contrato do package em `contracts/package-N.md`.
6. Garanta que a spec esteja marcada como `em andamento` no roadmap.
7. Implemente somente o escopo aprovado.
8. Crie ou ajuste testes necessarios.
9. Rode os sensores obrigatorios do contrato, preferencialmente via `pbq package close`.
10. Atualize `progress.md`.
11. Gere ou atualize `evaluations/package-N.md`; se usar `pbq package close`, confira o arquivo gerado.
12. Se a spec foi concluida, marque `concluido` no roadmap com evidencia.

Nao amplie escopo por conveniencia. Se o contrato estiver ambiguo, pare e registre a duvida antes de implementar.
