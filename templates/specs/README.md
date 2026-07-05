# Specs

Cada spec representa uma iniciativa, epico ou frente de mudanca.

Estrutura padrao:

```text
.plan-build-qa/specs/spec-YYMMDD-hex-nome/
├── spec.md
├── progress.md
├── contracts/
│   └── package-N.md
├── evaluations/
│   └── package-N.md
├── scripts/
└── prompts/
```

Use `spec-YYMMDD-hex-nome` para novas specs, por exemplo `spec-260704-a7f3-nome-curto`. Specs `spec-NNN-nome` sao legado compativel e podem ser migradas pelo `pbq update`.

Cada package deve ser pequeno, reversivel e validavel.

Use os templates em `.plan-build-qa/harness/templates/`.
