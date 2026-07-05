# Bugs

Registros de bugs observados ficam em `.plan-build-qa/bugs/`.

Use uma pasta por bug:

```text
.plan-build-qa/bugs/bug-YYMMDD-hex-slug/
  bug.md
  progress.md
```

Use `bug-YYMMDD-hex-slug` para novos bugs, por exemplo `bug-260705-b9c1-login-timeout`. Bugs `bug-NNN-slug` sao legado compativel e podem ser migrados pelo `pbq update`.

Cada bug deve preservar evidencia suficiente para outro agente continuar sem depender da memoria da sessao anterior.

Fluxo minimo:

1. Investigacao: erro observado, passos de reproducao, evidencias e causa provavel.
2. Correcao: mudanca aplicada, arquivos tocados, limites e rollback.
3. Teste: sensores executados, resultado, evidencia e risco residual.

Use os templates em `.plan-build-qa/harness/templates/bug.md` e `.plan-build-qa/harness/templates/bug-progress.md`.
