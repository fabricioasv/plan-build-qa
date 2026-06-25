# Bugs

Registros de bugs observados ficam em `.plan-build-qa/bugs/`.

Use uma pasta por bug:

```text
.plan-build-qa/bugs/bug-XXX-slug/
  bug.md
  progress.md
```

Cada bug deve preservar evidencia suficiente para outro agente continuar sem depender da memoria da sessao anterior.

Fluxo minimo:

1. Investigacao: erro observado, passos de reproducao, evidencias e causa provavel.
2. Correcao: mudanca aplicada, arquivos tocados, limites e rollback.
3. Teste: sensores executados, resultado, evidencia e risco residual.

Use os templates em `.plan-build-qa/harness/templates/bug.md` e `.plan-build-qa/harness/templates/bug-progress.md`.
