# pbq — Visão Geral do Framework

Diagramas de referência rápida do **Plan Build QA harness**.

---

## O que `pbq init` instala

```mermaid
flowchart LR
    CLI["pbq CLI\nnpm global"] -->|"pbq init path"| TARGET

    subgraph TARGET["Repositorio Alvo"]
        direction TB
        H[".plan-build-qa/\nconstitution/  harness/  specs/\nsensors.json  roadmap.md  manifest.json"]
        SK["Skills instaladas\n.claude/skills/  .agents/skills/\nspec  implement  test  sensor  analyze  roadmap"]
        AI["CLAUDE.md / AGENTS.md\nsecao harness injetada"]
    end
```

---

## Pipeline das 5 Etapas

> **Laranja** = acao manual do agente/usuario. **Azul** = disparado automaticamente pelo passo anterior.

```mermaid
flowchart TD
    START(["Mudanca identificada"])

    S1["/spec\nCria spec.md\nCria contracts/package-N.md\nAtualiza roadmap: em andamento"]

    S2["/test — contract-check\nValida criterios objetivos\nConfirma sensores cadastrados\nSem execucao de codigo"]

    S3["/implement\nProduz codigo\nRespeita escopo do contrato\nNAO executa sensores"]

    S4["/test — acceptance-check\npbq package close\nExecuta sensores obrigatorios\nGera evaluations/package-N.md\nScore 0 ou 1"]

    S5["Atualiza progress.md\nAtualiza roadmap.md\nconcluido ou proximo package"]

    START --> S1
    S1 -->|"contrato criado"| S2
    S2 -->|"contrato invalido"| S1
    S2 -->|"contrato valido"| S3
    S3 --> S4
    S4 -->|"Score 0 — sensor falhou"| S3
    S4 -->|"Score 1"| S5
    S5 -->|"spec concluida"| END(["Proxima spec"])
    S5 -->|"mais packages"| S1

    style S1 fill:#f5a623,color:#111
    style S3 fill:#f5a623,color:#111
    style S2 fill:#0f3460,color:#eee
    style S4 fill:#0f3460,color:#eee
    style S5 fill:#533483,color:#eee
```

**O que e automatico:**
- `/spec` dispara `/test contract-check` logo apos criar o contrato (etapa 2 e automatica)
- `/implement` delega para `/test acceptance-check` ao terminar o codigo (etapa 4 e automatica)
- As atualizacoes de `progress.md` e `roadmap.md` fazem parte do workflow da skill ativa

**O que e manual:**
- O usuario invoca `/spec` para iniciar ou avançar uma spec
- O usuario invoca `/implement` para codificar o package
- Bypass documentado: `skip test` desabilita a delegacao automatica ao test

---

## Ecossistema de Sensores

```mermaid
flowchart TD
    subgraph Descoberta["Descoberta"]
        AUTO["pbq sensor suggest\nDetecta automaticamente:\nscripts sh  bat  Makefile\npackage.json scripts"]
        CAT["pbq sensor catalog\nCatalogo curado:\neslint  dotnet-build  dotnet-test\nplaywright-e2e  sonar-dotnet  sonar-js"]
    end

    subgraph Registro["Registro em sensors.json"]
        MANUAL["pbq sensor add\n--name  --tier  --command\n--reason  --phase"]
        FROMCAT["pbq sensor add\n--from-catalog id"]
    end

    subgraph SJ["sensors.json"]
        FIELDS["name  tier  command  reason\nsource  enabled  requiresEnv\nphase: before ou after"]
    end

    subgraph Runners["Runners Gerados"]
        direction LR
        RF["run-fast\n.ps1 / .sh"]
        RM["run-medium\n.ps1 / .sh"]
        RS["run-slow\n.ps1 / .sh"]
    end

    subgraph Close["pbq package close"]
        PHASE["--phase before  preflight\n--phase after   gate default\n--tiers fast,medium,slow"]
        EVAL["evaluations/package-N.md\nScore: 0 ou 1"]
    end

    AUTO -->|"candidatos detectados"| MANUAL
    CAT -->|"id selecionado"| FROMCAT
    MANUAL --> SJ
    FROMCAT --> SJ
    SJ -->|"sensors enabled"| Runners
    SJ --> PHASE
    PHASE --> EVAL
```

---

## Hierarquia de Regras

```mermaid
flowchart TB
    P1["1  Plataforma e ferramenta\nClaude, Codex, etc"]
    P2["2  Regras existentes do repositorio\nAGENTS.md, CLAUDE.md, README"]
    P3["3  constitution/\nregras permanentes de arquitetura e testes"]
    P4["4  harness/\ntemplates, prompts, scripts"]
    P5["5  specs/spec.md\nobjetivo e scope da spec"]
    P6["6  contracts/package-N.md\ncritérios de aceite e sensores obrigatorios"]
    P7["7  Prompts locais do agente"]
    P8["8  Implementacao"]

    P1 -->|"prevalece sobre"| P2
    P2 --> P3
    P3 --> P4
    P4 --> P5
    P5 --> P6
    P6 --> P7
    P7 --> P8

    style P1 fill:#1a1a2e,color:#eee
    style P2 fill:#16213e,color:#eee
    style P3 fill:#0f3460,color:#eee
    style P4 fill:#533483,color:#eee
    style P5 fill:#e94560,color:#eee
    style P6 fill:#f5a623,color:#111
    style P7 fill:#7bc67e,color:#111
    style P8 fill:#a8d8a8,color:#111
```
