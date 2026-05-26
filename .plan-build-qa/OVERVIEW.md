# pbq — Visão Geral do Framework

Diagramas de referência rápida do **Plan Build QA harness**.

---

## Visão Geral — O que `pbq init` instala

```mermaid
flowchart LR
    CLI["🛠️ pbq CLI\n(npm global)"] -->|pbq init [repo]| TR["📁 Repositório Alvo"]

    subgraph TR["📁 Repositório Alvo"]
        direction TB
        H["📂 .plan-build-qa/\n  constitution/    ← regras permanentes\n  harness/         ← templates, scripts, prompts\n  specs/           ← specs + contracts + evaluations\n  sensors.json     ← sensores cadastrados\n  roadmap.md       ← índice de specs\n  manifest.json    ← hashes para update"]
        CS["🤖 .claude/skills/\n  spec  implement  test\n  sensor  analyze  roadmap"]
        AS["🤖 .agents/skills/\n  (mesma cópia)"]
        AI["📄 CLAUDE.md / AGENTS.md\n  (seção harness injetada)"]
    end
```

---

## Pipeline das 5 Etapas

```mermaid
flowchart TD
    START(["Mudança identificada"]) --> S1

    subgraph S1["1 · spec"]
        SP["/spec\n  Cria spec.md\n  Cria contracts/package-N.md\n  Atualiza roadmap: em andamento"]
    end

    subgraph S2["2 · contract (validação)"]
        CT["/test — contract-check\n  Valida critérios objetivos\n  Confirma sensores cadastrados\n  Sem execução de código"]
    end

    subgraph S3["3 · implement"]
        IM["/implement\n  Produz código\n  Respeita escopo do contrato\n  NÃO executa sensores"]
    end

    subgraph S4["4 · test / qa"]
        TS["/test — acceptance-check\n  pbq package close\n  Executa sensores obrigatórios\n  Gera evaluations/package-N.md\n  Score 0 ou 1"]
    end

    subgraph S5["5 · roadmap"]
        RM["Atualiza progress.md\n  Atualiza roadmap.md\n  concluido / próximo package"]
    end

    S1 -->|"contrato criado"| S2
    S2 -->|"Score ok"| S3
    S2 -->|"contrato inválido"| S1
    S3 --> S4
    S4 -->|"Score 1 ✅"| S5
    S4 -->|"Score 0 ❌\nfalha no sensor"| S3
    S5 -->|"spec concluída"| END(["Próxima spec"])
    S5 -->|"mais packages"| S1
```

---

## Ecossistema de Sensores

```mermaid
flowchart TD
    subgraph Descoberta["Descoberta de Sensores"]
        AUTO["pbq sensor suggest\n  Detecta automaticamente:\n  scripts/*.sh  *.bat  Makefile\n  package.json scripts"]
        CAT["pbq sensor catalog\n  Catálogo curado:\n  eslint · dotnet-build\n  dotnet-test · playwright-e2e\n  sonar-dotnet · sonar-js"]
    end

    subgraph Registro["Registro"]
        MANUAL["pbq sensor add\n  --name  --tier  --command\n  --reason  --phase"]
        FROMCAT["pbq sensor add\n  --from-catalog <id>"]
    end

    subgraph SJ["sensors.json"]
        FIELDS["{ name, tier, command,\n  reason, source,\n  enabled, requiresEnv,\n  phase: [before|after] }"]
    end

    subgraph Runners["Runners Gerados"]
        direction LR
        RF["run-fast\n  .ps1 / .sh"]
        RM["run-medium\n  .ps1 / .sh"]
        RS["run-slow\n  .ps1 / .sh"]
    end

    subgraph Close["pbq package close"]
        PHASE["--phase before  → preflight\n  --phase after   → gate (default)\n  --tiers fast,medium,slow"]
        EVAL["evaluations/\n  package-N.md\n  Score: 0 | 1"]
    end

    AUTO -->|candidatos| MANUAL
    CAT -->|id selecionado| FROMCAT
    MANUAL --> SJ
    FROMCAT --> SJ
    SJ -->|sensors enabled| Runners
    SJ --> PHASE
    PHASE --> EVAL
```

---

## Hierarquia de Regras (o que prevalece)

```mermaid
flowchart TB
    P1["① Plataforma / ferramenta (Claude, Codex...)"]
    P2["② Regras existentes do repositório"]
    P3["③ .plan-build-qa/constitution/"]
    P4["④ .plan-build-qa/harness/"]
    P5["⑤ specs/*/spec.md"]
    P6["⑥ specs/*/contracts/package-N.md"]
    P7["⑦ Prompts locais do agente"]
    P8["⑧ Implementação"]

    P1 -->|"prevalece sobre"| P2 --> P3 --> P4 --> P5 --> P6 --> P7 --> P8

    style P1 fill:#1a1a2e,color:#eee
    style P2 fill:#16213e,color:#eee
    style P3 fill:#0f3460,color:#eee
    style P4 fill:#533483,color:#eee
    style P5 fill:#e94560,color:#eee
    style P6 fill:#f5a623,color:#111
    style P7 fill:#7bc67e,color:#111
    style P8 fill:#a8d8a8,color:#111
```

---

**Como ler:** o `pbq init` instala o harness no repo alvo e injeta as skills nos agentes. O agente então trabalha sempre contra um contrato (`/spec` → `/implement` → `/test`), com sensores computacionais como único árbitro de qualidade. O campo `phase` separa preflight (`before`) de gate de aceite (`after`), e o catálogo oferece sensores prontos para os toolchains mais comuns.
