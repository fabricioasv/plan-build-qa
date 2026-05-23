# Implement Package

Voce esta implementando um package dentro do Harness Engineering System.

> **Regra de execucao**
> **NUNCA** implemente fora do contrato. **PARE** se o contrato estiver ambiguo, amplo demais ou sem sensores obrigatorios.

1. Carregue as regras relevantes em `.plan-build-qa/constitution/`.
2. Carregue a spec ativa em `.plan-build-qa/specs/spec-XXX-nome/spec.md`.
3. Carregue `.plan-build-qa/roadmap.md`.
4. Carregue `progress.md`.
5. Carregue o contrato do package em `contracts/package-N.md`.
6. **OBRIGATORIO** garantir que a spec esteja marcada como `em andamento` no roadmap.
7. **OBRIGATORIO** implementar somente o escopo aprovado.
8. Crie ou ajuste testes necessarios.
9. **OBRIGATORIO** rodar os sensores obrigatorios do contrato, preferencialmente via `pbq package close`.
10. Atualize `progress.md`.
11. Gere ou atualize `evaluations/package-N.md`; se usar `pbq package close`, confira o arquivo gerado.
12. Se a spec foi concluida, marque `concluido` no roadmap com evidencia.

**NUNCA** amplie escopo por conveniencia. Se o contrato estiver ambiguo, registre a duvida antes de implementar.
