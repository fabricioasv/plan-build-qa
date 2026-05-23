# Specs

Cada spec representa uma iniciativa, epico ou frente de mudanca.

Estrutura padrao:

```text
.specs/spec-XXX-nome/
├── spec.md
├── progress.md
├── contracts/
│   └── package-N.md
├── evaluations/
│   └── package-N.md
├── scripts/
└── prompts/
```

Cada package deve ser pequeno, reversivel e validavel.

Use os templates em `.harness/templates/`.
