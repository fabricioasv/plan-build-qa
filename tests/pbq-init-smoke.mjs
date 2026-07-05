import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const root = await mkdtemp(path.join(tmpdir(), "pbq-init-"));

function formatTestSpecDateId(date) {
  const year = String(date.getFullYear()).slice(-2).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

async function readDirNames(dir) {
  return readdir(dir);
}

async function renameForTest(oldPath, newPath) {
  await rename(oldPath, newPath);
}

try {
  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify(
      {
        scripts: {
          build: "echo build",
          test: "echo test",
          lint: "echo lint",
          "test:e2e": "echo e2e"
        }
      },
      null,
      2
    )
  );
  await mkdir(path.join(root, "Tests", "App.E2E"), { recursive: true });
  await writeFile(path.join(root, "Tests", "App.E2E", "App.E2E.csproj"), "<Project Sdk=\"Microsoft.NET.Sdk\"></Project>\n");
  await writeFile(path.join(root, "AGENTS.md"), "# Agent rules\n\nPreserve me.\n");

  const cli = path.resolve("bin", "pbq.mjs");
  const help = spawnSync(process.execPath, [cli, "help"], {
    encoding: "utf8"
  });
  assert.equal(help.status, 0, help.stderr || help.stdout);
  assert.match(help.stdout, /Comandos:/);
  assert.match(help.stdout, /pbq help init/);

  const sensorHelp = spawnSync(process.execPath, [cli, "help", "sensor"], {
    encoding: "utf8"
  });
  assert.equal(sensorHelp.status, 0, sensorHelp.stderr || sensorHelp.stdout);
  assert.match(sensorHelp.stdout, /pbq sensor add/);

  const analyzeHelp = spawnSync(process.execPath, [cli, "help", "analyze"], {
    encoding: "utf8"
  });
  assert.equal(analyzeHelp.status, 0, analyzeHelp.stderr || analyzeHelp.stdout);
  assert.match(analyzeHelp.stdout, /pbq analyze/);
  assert.match(analyzeHelp.stdout, /Status de saida/);

  const dashboardHelp = spawnSync(process.execPath, [cli, "help", "dashboard"], {
    encoding: "utf8"
  });
  assert.equal(dashboardHelp.status, 0, dashboardHelp.stderr || dashboardHelp.stdout);
  assert.match(dashboardHelp.stdout, /pbq dashboard/);
  assert.match(dashboardHelp.stdout, /--json/);
  assert.match(dashboardHelp.stdout, /--serve/);
  assert.match(dashboardHelp.stdout, /--watch/);

  const dashboardHelpAfterCommand = spawnSync(process.execPath, [cli, "dashboard", "help"], {
    encoding: "utf8"
  });
  assert.equal(dashboardHelpAfterCommand.status, 0, dashboardHelpAfterCommand.stderr || dashboardHelpAfterCommand.stdout);
  assert.match(dashboardHelpAfterCommand.stdout, /pbq dashboard/);
  assert.match(dashboardHelpAfterCommand.stdout, /--serve/);

  const sensorHelpAfterCommand = spawnSync(process.execPath, [cli, "sensor", "--help"], {
    encoding: "utf8"
  });
  assert.equal(sensorHelpAfterCommand.status, 0, sensorHelpAfterCommand.stderr || sensorHelpAfterCommand.stdout);
  assert.match(sensorHelpAfterCommand.stdout, /pbq sensor add/);

  const result = spawnSync(process.execPath, [cli, "init", root], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  // spec-017 package-1: convite ao catalogo no fim de init
  assert.match(result.stdout, /sensores no catalogo/, "init deve imprimir convite ao catalogo");

  const required = [
    ".plan-build-qa/constitution/architecture.md",
    ".plan-build-qa/constitution/testing.md",
    ".plan-build-qa/constitution/operations.md",
    ".plan-build-qa/constitution/repository-rules.md",
    ".plan-build-qa/harness/README.md",
    ".plan-build-qa/harness/scripts/check-harness-structure.ps1",
    ".plan-build-qa/harness/scripts/run-fast.ps1",
    ".plan-build-qa/harness/scripts/run-medium.ps1",
    ".plan-build-qa/harness/scripts/run-slow.ps1",
    ".plan-build-qa/harness/scripts/run-fast.sh",
    ".plan-build-qa/harness/templates/spec.md",
    ".plan-build-qa/harness/templates/contract.md",
    ".plan-build-qa/harness/templates/progress.md",
    ".plan-build-qa/harness/templates/evaluation.md",
    ".plan-build-qa/harness/templates/bug.md",
    ".plan-build-qa/harness/templates/bug-progress.md",
    ".plan-build-qa/roadmap.md",
    ".plan-build-qa/manifest.json",
    ".plan-build-qa/harness/prompts/implement-package.md",
    ".plan-build-qa/harness/prompts/validate-contract.md",
    ".plan-build-qa/harness/prompts/run-evaluation.md",
    ".plan-build-qa/specs/README.md",
    ".plan-build-qa/bugs/README.md",
    ".plan-build-qa/sensors.json",
    ".claude/skills/spec/SKILL.md",
    ".claude/skills/sensor/SKILL.md",
    ".claude/skills/roadmap/SKILL.md",
    ".claude/skills/constitution/SKILL.md",
    ".claude/skills/implement/SKILL.md",
    ".claude/skills/test/SKILL.md",
    ".claude/skills/analyze/SKILL.md",
    ".claude/skills/bug/SKILL.md",
    ".agents/skills/spec/SKILL.md",
    ".agents/skills/sensor/SKILL.md",
    ".agents/skills/roadmap/SKILL.md",
    ".agents/skills/constitution/SKILL.md",
    ".agents/skills/implement/SKILL.md",
    ".agents/skills/test/SKILL.md",
    ".agents/skills/analyze/SKILL.md",
    ".agents/skills/bug/SKILL.md"
  ];

  for (const file of required) {
    assert.ok(existsSync(path.join(root, file)), `missing ${file}`);
  }
  assert.equal(existsSync(path.join(root, ".plan-build-qa/harness/evaluations")), false);

  const agents = await readFile(path.join(root, "AGENTS.md"), "utf8");
  assert.match(agents, /Preserve me/);
  assert.match(agents, /Harness Engineering/);

  const claude = await readFile(path.join(root, "CLAUDE.md"), "utf8");
  assert.match(claude, /Harness Engineering/);

  const roadmap = await readFile(path.join(root, ".plan-build-qa/roadmap.md"), "utf8");
  assert.match(roadmap, /em andamento/);
  assert.match(roadmap, /concluido/);
  const cliDir = path.resolve(path.dirname(cli), "..");

  const analyzeInvalid = spawnSync(process.execPath, [cli, "analyze", root], {
    encoding: "utf8"
  });
  assert.equal(analyzeInvalid.status, 1, analyzeInvalid.stderr || analyzeInvalid.stdout);
  assert.match(analyzeInvalid.stdout, /Violations:/);
  assert.match(analyzeInvalid.stdout, /Nenhuma spec encontrada na tabela do roadmap/);

  const specSkill = await readFile(path.join(root, ".claude/skills/spec/SKILL.md"), "utf8");
  assert.match(specSkill, /roadmap\.md/);
  const codexSpecSkill = await readFile(path.join(root, ".agents/skills/spec/SKILL.md"), "utf8");
  const templateSpecSkill = await readFile(path.join(cliDir, "templates/adapters/skills/spec/SKILL.md"), "utf8");
  for (const content of [specSkill, codexSpecSkill, templateSpecSkill]) {
    assert.match(content, /spec-YYMMDD-hex-name/, "spec skill deve orientar o novo padrao de ID");
    assert.match(content, /Legacy `spec-NNN-name`/, "spec skill deve documentar compatibilidade legado");
    assert.match(content, /Sensor scope in contracts/, "spec skill deve orientar scope local/global");
    assert.match(content, /Scope: global/, "spec skill deve orientar sensor global");
    assert.match(content, /Scope: local.*Scope: package/s, "spec skill deve orientar sensor local/package");
    assert.match(content, /Comando.*Motivo/s, "spec skill deve exigir comando e motivo para local");
  }

  // spec-011 package-2: implement delega verificacao a test (nao roda pbq package close direto)
  const codexImplementSkill = await readFile(path.join(root, ".agents/skills/implement/SKILL.md"), "utf8");
  assert.doesNotMatch(codexImplementSkill, /pbq package close/, "implement skill deve delegar verificacao, nao citar pbq package close");
  assert.match(codexImplementSkill, /[Dd]elegate verification to the .test. skill/, "implement skill deve delegar a test");

  const claudeTestSkill = await readFile(path.join(root, ".claude/skills/test/SKILL.md"), "utf8");
  assert.match(claudeTestSkill, /NEVER.*missing sensor evidence as success/);
  // spec-011 package-2: test skill expoe os dois modos do gate independente
  assert.match(claudeTestSkill, /contract-check/, "test skill deve documentar o modo contract-check");
  assert.match(claudeTestSkill, /acceptance-check/, "test skill deve documentar o modo acceptance-check");
  const codexTestSkill = await readFile(path.join(root, ".agents/skills/test/SKILL.md"), "utf8");
  const templateTestSkill = await readFile(path.join(cliDir, "templates/adapters/skills/test/SKILL.md"), "utf8");
  for (const content of [claudeTestSkill, codexTestSkill, templateTestSkill]) {
    assert.match(content, /required global sensor/, "test skill deve exigir registry para global");
    assert.match(content, /Scope: local.*Scope: package/s, "test skill deve aceitar local/package sem registry global");
    assert.match(content, /Local required sensors must be enforced by name/, "test skill deve manter enforcement por nome para local");
  }

  // spec-014 package-3: sensor skill deve documentar fluxo recomendado e exemplos
  const claudeSensorSkill = await readFile(path.join(root, ".claude/skills/sensor/SKILL.md"), "utf8");
  assert.match(claudeSensorSkill, /pbq sensor suggest/, "claude sensor skill deve citar pbq sensor suggest");
  assert.match(claudeSensorSkill, /sonar|Makefile|scripts\//, "claude sensor skill deve citar exemplo concreto");
  assert.match(claudeSensorSkill, /non-zero exit code/, "claude sensor skill deve preservar regra de exit code");
  // spec-017 package-3: sensor skill deve documentar catalogo e phase
  assert.match(claudeSensorSkill, /pbq sensor catalog/, "claude sensor skill deve citar pbq sensor catalog");
  assert.match(claudeSensorSkill, /--from-catalog/, "claude sensor skill deve citar --from-catalog");
  assert.match(claudeSensorSkill, /phase/, "claude sensor skill deve documentar campo phase");

  const codexSensorSkill = await readFile(path.join(root, ".agents/skills/sensor/SKILL.md"), "utf8");
  assert.match(codexSensorSkill, /pbq sensor suggest/, "codex sensor skill deve citar pbq sensor suggest");
  assert.match(codexSensorSkill, /sonar|Makefile|scripts\//, "codex sensor skill deve citar exemplo concreto");
  assert.match(codexSensorSkill, /non-zero exit code/, "codex sensor skill deve preservar regra de exit code");
  // spec-017 package-3
  assert.match(codexSensorSkill, /pbq sensor catalog/, "codex sensor skill deve citar pbq sensor catalog");
  assert.match(codexSensorSkill, /--from-catalog/, "codex sensor skill deve citar --from-catalog");

  const templateSensorSkill = await readFile(path.join(cliDir, "templates/adapters/skills/sensor/SKILL.md"), "utf8");
  assert.match(templateSensorSkill, /pbq sensor suggest/, "template sensor skill deve citar pbq sensor suggest");
  assert.match(templateSensorSkill, /sonar|Makefile|scripts\//, "template sensor skill deve citar exemplo concreto");
  assert.match(templateSensorSkill, /non-zero exit code/, "template sensor skill deve preservar regra de exit code");
  // spec-017 package-3
  assert.match(templateSensorSkill, /pbq sensor catalog/, "template sensor skill deve citar pbq sensor catalog");
  assert.match(templateSensorSkill, /--from-catalog/, "template sensor skill deve citar --from-catalog");
  for (const content of [claudeSensorSkill, codexSensorSkill, templateSensorSkill]) {
    assert.match(content, /registry for .*global.* reusable sensors/i, "sensor skill deve declarar registry global");
    assert.match(content, /pbq sensor add --scope global/, "sensor skill deve orientar --scope global");
    assert.match(content, /Do not create local\/package sensors in `sensors\.json`/, "sensor skill nao deve criar local no registry");
    assert.match(content, /Promotion local -> global must be an explicit decision/, "sensor skill deve orientar promocao explicita");
  }

  // spec-015 package-1: analyze skill deve ser instalada e conter termos-chave
  const claudeAnalyzeSkill = await readFile(path.join(root, ".claude/skills/analyze/SKILL.md"), "utf8");
  assert.match(claudeAnalyzeSkill, /pbq analyze/, "claude analyze skill deve citar pbq analyze");
  assert.match(claudeAnalyzeSkill, /[Vv]iolations/, "claude analyze skill deve orientar sobre violations");
  assert.match(claudeAnalyzeSkill, /--strict/, "claude analyze skill deve mencionar --strict");

  const codexAnalyzeSkill = await readFile(path.join(root, ".agents/skills/analyze/SKILL.md"), "utf8");
  assert.match(codexAnalyzeSkill, /pbq analyze/, "codex analyze skill deve citar pbq analyze");
  assert.match(codexAnalyzeSkill, /[Vv]iolations/, "codex analyze skill deve orientar sobre violations");

  const templateAnalyzeSkill = await readFile(path.join(cliDir, "templates/adapters/skills/analyze/SKILL.md"), "utf8");
  assert.match(templateAnalyzeSkill, /pbq analyze/, "template analyze skill deve citar pbq analyze");
  assert.match(templateAnalyzeSkill, /[Vv]iolations/, "template analyze skill deve orientar sobre violations");

  // spec-023 package-1: bug skill e templates devem ser instalados
  const claudeBugSkill = await readFile(path.join(root, ".claude/skills/bug/SKILL.md"), "utf8");
  assert.match(claudeBugSkill, /\/bug/, "claude bug skill deve mencionar /bug");
  assert.match(claudeBugSkill, /\.plan-build-qa\/bugs\/bug-YYMMDD-hex-slug\/bug\.md/, "claude bug skill deve orientar bug.md");
  assert.match(claudeBugSkill, /Legacy `bug-NNN-slug`/, "claude bug skill deve documentar compatibilidade legado");
  assert.match(claudeBugSkill, /progress\.md/, "claude bug skill deve orientar progress.md");
  assert.match(claudeBugSkill, /Investigacao/, "claude bug skill deve exigir Investigacao");
  assert.match(claudeBugSkill, /Do not edit product code/, "claude bug skill nao deve implementar correcao");
  assert.match(claudeBugSkill, /apply patches/, "claude bug skill deve proibir patches");
  assert.match(claudeBugSkill, /\/implement/, "claude bug skill deve encaminhar correcao para implement");
  assert.match(claudeBugSkill, /\/test/, "claude bug skill deve encaminhar validacao para test");
  assert.match(claudeBugSkill, /offer to open a spec\/package/, "claude bug skill nao deve oferecer abertura de spec");
  assert.match(claudeBugSkill, /Do not end with a question offering to open a spec\/package, forward to `\/implement`, run `\/test`, or continue the workflow/, "claude bug skill nao deve perguntar continuidade para implement/test");
  assert.doesNotMatch(claudeBugSkill, /Fill the three required sections/, "claude bug skill nao deve executar Correcao/Teste");
  assert.doesNotMatch(claudeBugSkill, /create or link a spec\/package/, "claude bug skill nao deve criar spec/package durante /bug");

  const codexBugSkill = await readFile(path.join(root, ".agents/skills/bug/SKILL.md"), "utf8");
  assert.match(codexBugSkill, /\.plan-build-qa\/bugs\/bug-YYMMDD-hex-slug\/bug\.md/, "codex bug skill deve orientar bug.md");
  assert.match(codexBugSkill, /Legacy `bug-NNN-slug`/, "codex bug skill deve documentar compatibilidade legado");
  assert.match(codexBugSkill, /progress\.md/, "codex bug skill deve orientar progress.md");
  assert.match(codexBugSkill, /Do not edit product code/, "codex bug skill nao deve implementar correcao");
  assert.match(codexBugSkill, /\/implement/, "codex bug skill deve encaminhar correcao para implement");
  assert.match(codexBugSkill, /\/test/, "codex bug skill deve encaminhar validacao para test");
  assert.match(codexBugSkill, /offer to open a spec\/package/, "codex bug skill nao deve oferecer abertura de spec");
  assert.match(codexBugSkill, /Do not end with a question offering to open a spec\/package, forward to `\/implement`, run `\/test`, or continue the workflow/, "codex bug skill nao deve perguntar continuidade para implement/test");

  const templateBugSkill = await readFile(path.join(cliDir, "templates/adapters/skills/bug/SKILL.md"), "utf8");
  assert.match(templateBugSkill, /\.plan-build-qa\/bugs\/bug-YYMMDD-hex-slug\/bug\.md/, "template bug skill deve orientar bug.md");
  assert.match(templateBugSkill, /Legacy `bug-NNN-slug`/, "template bug skill deve documentar compatibilidade legado");
  assert.match(templateBugSkill, /Investigacao/, "template bug skill deve exigir Investigacao");
  assert.match(templateBugSkill, /Do not edit product code/, "template bug skill nao deve implementar correcao");
  assert.match(templateBugSkill, /\/implement/, "template bug skill deve encaminhar correcao para implement");
  assert.match(templateBugSkill, /\/test/, "template bug skill deve encaminhar validacao para test");
  assert.match(templateBugSkill, /offer to open a spec\/package/, "template bug skill nao deve oferecer abertura de spec");
  assert.match(templateBugSkill, /Do not end with a question offering to open a spec\/package, forward to `\/implement`, run `\/test`, or continue the workflow/, "template bug skill nao deve perguntar continuidade para implement/test");

  const bugTemplate = await readFile(path.join(root, ".plan-build-qa/harness/templates/bug.md"), "utf8");
  assert.match(bugTemplate, /^## Investigacao$/m, "bug.md deve conter secao Investigacao");
  assert.match(bugTemplate, /^## Correcao$/m, "bug.md deve conter secao Correcao");
  assert.match(bugTemplate, /^## Teste$/m, "bug.md deve conter secao Teste");
  assert.match(bugTemplate, /passos objetivos para reproduzir/, "bug.md deve exigir reproducao objetiva");
  assert.match(bugTemplate, /preenchido a partir de `\/implement`/, "bug.md deve tratar Correcao como registro externo");
  assert.match(bugTemplate, /preenchido a partir de `\/test`/, "bug.md deve tratar Teste como registro externo");
  assert.match(bugTemplate, /rollback/, "bug.md deve exigir rollback");

  const bugProgressTemplate = await readFile(path.join(root, ".plan-build-qa/harness/templates/bug-progress.md"), "utf8");
  assert.match(bugProgressTemplate, /1\. Investigacao/, "bug-progress deve conter etapa Investigacao");
  assert.match(bugProgressTemplate, /2\. Encaminhamento para implement/, "bug-progress deve encaminhar para implement");
  assert.match(bugProgressTemplate, /3\. Evidencia de test/, "bug-progress deve registrar evidencia de test");
  assert.doesNotMatch(bugProgressTemplate, /corrigindo|em teste/, "bug-progress nao deve usar estados de execucao direta");
  const bugsReadme = await readFile(path.join(root, ".plan-build-qa/bugs/README.md"), "utf8");
  assert.match(bugsReadme, /bug-YYMMDD-hex-slug/, "bugs README deve orientar novo padrao");
  assert.match(bugsReadme, /bug-NNN-slug/, "bugs README deve mencionar legado");

  // OVERVIEW.md deve ser instalado pelo init e conter os diagramas Mermaid
  const overview = await readFile(path.join(root, ".plan-build-qa/OVERVIEW.md"), "utf8");
  assert.match(overview, /mermaid/, "OVERVIEW.md deve conter blocos Mermaid");
  assert.match(overview, /Pipeline/, "OVERVIEW.md deve conter o diagrama de pipeline");

  const architecture = await readFile(path.join(root, ".plan-build-qa/constitution/architecture.md"), "utf8");
  assert.match(architecture, /Varredura Arquitetural Inicial/);
  assert.match(architecture, /Use a estrutura atual como evidencia/);
  assert.match(architecture, /NUNCA.*arquitetura atual/);

  const testingConstitution = await readFile(path.join(root, ".plan-build-qa/constitution/testing.md"), "utf8");
  assert.match(testingConstitution, /registry de sensores globais reutilizaveis/, "testing constitution deve declarar registry global");
  assert.match(testingConstitution, /Sensor local: vive no `contracts\/package-N\.md`/, "testing constitution deve declarar sensor local em contrato");
  assert.match(testingConstitution, /Promocao local -> global e decisao explicita/, "testing constitution deve orientar promocao explicita");

  const contractTemplate = await readFile(path.join(root, ".plan-build-qa/harness/templates/contract.md"), "utf8");
  assert.match(contractTemplate, /\| Sensor \| Scope \| Tier \| Comando \| Motivo \|/, "contract template deve conter colunas local/global");
  assert.match(contractTemplate, /Scope: global/, "contract template deve orientar global");
  assert.match(contractTemplate, /Scope: local.*Scope: package/s, "contract template deve orientar local/package");
  assert.match(contractTemplate, /pbq sensor add --scope global/, "contract template deve orientar criacao global");
  assert.match(contractTemplate, /Nao cadastre sensor local/, "contract template nao deve orientar local no registry");

  const evaluationTemplate = await readFile(path.join(root, ".plan-build-qa/harness/templates/evaluation.md"), "utf8");
  assert.match(evaluationTemplate, /Resumo De Sensores/);
  assert.match(evaluationTemplate, /\| Sensor \| Tier \| Obrigatorio \| Status \| Comando \| Exit Code \| Evidencia \|/);
  assert.match(evaluationTemplate, /sensor local obrigatorio tambem deve aparecer/, "evaluation template deve exigir local na tabela");
  assert.match(evaluationTemplate, /promocao local -> global deve ser decisao explicita/, "evaluation template deve orientar promocao explicita");

  const fast = await readFile(path.join(root, ".plan-build-qa/harness/scripts/run-fast.ps1"), "utf8");
  assert.match(fast, /npm run lint/);

  const fastResult =
    process.platform === "win32"
      ? spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(root, ".plan-build-qa/harness/scripts/run-fast.ps1")], {
          encoding: "utf8"
        })
      : spawnSync("sh", [path.join(root, ".plan-build-qa/harness/scripts/run-fast.sh")], {
          encoding: "utf8"
        });
  assert.equal(fastResult.status, 0, fastResult.stderr || fastResult.stdout);

  const addSensor = spawnSync(
    process.execPath,
    [cli, "sensor", "add", root, "--name", "browser-e2e", "--tier", "slow", "--command", "npm run test:e2e", "--reason", "smoke e2e"],
    { encoding: "utf8" }
  );
  assert.equal(addSensor.status, 0, addSensor.stderr || addSensor.stdout);

  const sensors = JSON.parse(await readFile(path.join(root, ".plan-build-qa/sensors.json"), "utf8"));
  assert.ok(sensors.sensors.some((sensor) => sensor.name === "browser-e2e" && sensor.tier === "slow"));

  const slow = await readFile(path.join(root, ".plan-build-qa/harness/scripts/run-slow.ps1"), "utf8");
  assert.match(slow, /npm run test:e2e/);
  assert.match(slow, /dotnet test .*Tests\/App\.E2E\/App\.E2E\.csproj/);

  const status = spawnSync(process.execPath, [cli, "run", root, "--resume"], {
    encoding: "utf8"
  });
  assert.equal(status.status, 0, status.stderr || status.stdout);
  assert.match(status.stdout, /Autonomous Development Pipeline/);
  assert.match(status.stdout, /Sprints/);
  assert.match(status.stdout, /Activity/);

  const readme = await readFile(path.resolve("README.md"), "utf8");
  assert.match(readme, /pbq dashboard \. --output \.plan-build-qa\/dashboard/, "AC3: README documenta snapshot");
  assert.match(readme, /--serve --watch --port 4173/, "AC3: README documenta modo ao vivo");

  const dashboardFixtureRoot = await mkdtemp(path.join(tmpdir(), "pbq-dashboard-"));
  try {
    const fixtureSpecDir = path.join(dashboardFixtureRoot, ".plan-build-qa", "specs", "spec-001-demo");
    await mkdir(path.join(fixtureSpecDir, "contracts"), { recursive: true });
    await mkdir(path.join(fixtureSpecDir, "evaluations"), { recursive: true });
    await writeFile(
      path.join(dashboardFixtureRoot, ".plan-build-qa", "roadmap.md"),
      `# Roadmap

## Specs

| Spec | Status | Package Atual | Ultima Atualizacao | Evidencia | Proxima Acao |
| --- | --- | --- | --- | --- | --- |
| spec-001-demo | em andamento | 1 | 2026-06-18 | - | Implementar package 1 |
| spec-002-planned-only | planejado | - | 2026-06-17 | - | Aguardar |
`
    );
    await writeFile(
      path.join(fixtureSpecDir, "spec.md"),
      `# Spec: spec-001-demo

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | obj | planejado | medium: known-sensor |

## Riscos
`
    );
    await writeFile(
      path.join(fixtureSpecDir, "progress.md"),
      `# Progress

## Package Atual

Package 1

| Etapa | Status |
| --- | --- |
| 1. spec | ok |
| 2. contract (validacao) | ok |
| 3. implement | em andamento |
| 4. test/qa | nao-aplicavel |
| 5. roadmap | pendente |

## Packages Concluidos

Nenhum.
`
    );
    await writeFile(
      path.join(fixtureSpecDir, "contracts", "package-1.md"),
      `# Contract: Package 1

## Sensores Obrigatorios

| Sensor | Tier | Nome em sensors.json | Comando |
| --- | --- | --- | --- |
| known-sensor | medium | \`known-sensor\` | \`echo known\` |
| missing-sensor | medium | \`missing-sensor\` | \`echo missing\` |
`
    );
    await writeFile(
      path.join(fixtureSpecDir, "evaluations", "package-1.md"),
      `# Evaluation: Package 1

Score: 1

## Resumo De Sensores

| Sensor | Tier | Obrigatorio | Status | Comando | Exit Code | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| known-sensor | medium | sim | passou | \`echo known\` | 0 | ok |
`
    );
    await writeFile(
      path.join(dashboardFixtureRoot, ".plan-build-qa", "sensors.json"),
      JSON.stringify(
        {
          version: 2,
          sensors: [{ name: "known-sensor", tier: "medium", on: ["close"], command: "echo known", enabled: true }]
        },
        null,
        2
      )
    );

    const dashboardJson = spawnSync(process.execPath, [cli, "dashboard", dashboardFixtureRoot, "--json"], {
      encoding: "utf8"
    });
    assert.equal(dashboardJson.status, 0, dashboardJson.stderr || dashboardJson.stdout);
    const dashboardData = JSON.parse(dashboardJson.stdout);
    assert.equal(dashboardData.schemaVersion, 1);
    assert.equal(typeof dashboardData.generatedAt, "string");
    assert.equal(dashboardData.root, dashboardFixtureRoot);
    assert.ok(Array.isArray(dashboardData.specs));
    assert.ok(dashboardData.summary.specsByStatus["em andamento"] >= 1);

    const plannedOnly = dashboardData.specs.find((spec) => spec.name === "spec-002-planned-only");
    assert.equal(plannedOnly.materialized, false, "AC3: spec so no roadmap deve aparecer nao materializada");
    assert.equal(plannedOnly.status, "planejado");
    assert.equal(plannedOnly.updatedAt, "2026-06-17", "AC6: data de roadmap exposta no modelo");

    const materialized = dashboardData.specs.find((spec) => spec.name === "spec-001-demo");
    assert.equal(materialized.materialized, true);
    assert.equal(materialized.integrity, "warning");
    assert.match(materialized.integrityReason, /missing-sensor/, "motivo da integridade deve ficar explicito no modelo");
    assert.ok(Array.isArray(materialized.progress.stages), "AC4: etapas devem entrar no modelo");
    assert.ok(materialized.progress.stages.some((stage) => stage.stage === "1. spec" && stage.status === "ok"));
    assert.equal(dashboardData.specs[0]?.name, "spec-001-demo", "AC6: ordenacao default usa spec mais atual primeiro");
    const pkg1 = materialized.packages.find((pkg) => pkg.number === 1);
    assert.equal(pkg1.contractExists, true, "AC4: contrato presente");
    assert.equal(pkg1.evaluationExists, true, "AC4: evaluation presente");
    assert.equal(pkg1.score, 1, "AC4: score parseado");
    assert.ok(pkg1.requiredSensors.some((sensor) => sensor.name === "known-sensor"), "AC5: sensor conhecido exposto");
    assert.ok(materialized.warnings.some((warning) => /missing-sensor/.test(warning)), "AC5: warning para sensor ausente");

    const dashboardOutDir = path.join(dashboardFixtureRoot, "dashboard-out");
    const dashboardWrite = spawnSync(
      process.execPath,
      [cli, "dashboard", dashboardFixtureRoot, "--json", "--output", dashboardOutDir],
      { encoding: "utf8" }
    );
    assert.equal(dashboardWrite.status, 0, dashboardWrite.stderr || dashboardWrite.stdout);
    assert.match(dashboardWrite.stdout, /Dashboard snapshot written/);
    const writtenJson = JSON.parse(await readFile(path.join(dashboardOutDir, "status.json"), "utf8"));
    assert.equal(writtenJson.schemaVersion, 1, "AC6: arquivo escrito com schema esperado");
    const writtenHtml = await readFile(path.join(dashboardOutDir, "index.html"), "utf8");
    assert.match(writtenHtml, /PBQ Dashboard/, "AC1/AC3: html gerado");
    assert.match(writtenHtml, /Totais Gerais/, "AC1: topo agrupa os totais gerais");
    assert.match(writtenHtml, /Status/, "AC1: topo mostra contadores por status");
    assert.match(writtenHtml, /status: em andamento/, "AC1: contador de status visivel");
    assert.match(writtenHtml, /status: planejado/, "AC1: contador de status planejado visivel");
    assert.match(writtenHtml, /Integridade/, "AC1: topo mostra contadores por integridade");
    assert.match(writtenHtml, /integridade: healthy/, "AC1: contador healthy visivel");
    assert.match(writtenHtml, /integridade: warning/, "AC1: contador warning visivel");
    assert.match(writtenHtml, /integridade: critical/, "AC1: contador critical visivel");
    assert.match(writtenHtml, /main\s*\{\s*width:\s*100%/i, "AC1: pagina full-width");
    assert.match(writtenHtml, /spec-001-demo/, "AC2: spec materializada no HTML");
    assert.match(writtenHtml, /spec-002-planned-only/, "AC2: spec so no roadmap no HTML");
    assert.match(writtenHtml, /missing-sensor/, "motivo da integridade deve substituir o subtitulo quando nao for healthy");
    assert.match(writtenHtml, /gantt-grid/, "AC2: grade gantt principal");
    assert.match(writtenHtml, /dashboard-filters/, "AC1: controles de filtro presentes");
    assert.match(writtenHtml, /filter-spec-text/, "AC2: filtro por texto presente");
    assert.match(writtenHtml, /filter-spec-status/, "AC2: filtro por status presente");
    assert.match(writtenHtml, /filter-spec-integrity/, "AC2: filtro por integridade presente");
    assert.match(writtenHtml, /filter-spec-sort/, "AC2: seletor de ordenacao presente");
    assert.match(writtenHtml, /mais atual -> mais antiga/, "AC2: ordenacao default descrita no HTML");
    assert.match(writtenHtml, /Legenda da grade de execucao/, "AC1: legenda da grade presente");
    assert.match(writtenHtml, /healthy[\s\S]*warning[\s\S]*critical/, "AC2: legenda explica cores de integridade");
    assert.match(writtenHtml, /SOON[\s\S]*pendente/, "AC3\/AC4: legenda explica marcador pendente");
    assert.match(writtenHtml, /Integridade<\/span>/, "AC2: coluna integridade");
    assert.match(writtenHtml, /Status<\/span>/, "AC2: coluna status");
    assert.match(writtenHtml, /Packages<\/span>/, "AC3: coluna packages");
    assert.match(writtenHtml, /Evaluations<\/span>/, "AC3: coluna evaluations");
    assert.match(writtenHtml, /✅/, "AC4: emoji de etapa concluida");
    assert.match(writtenHtml, /<span class="stage-icon-soon"><span class="arrow">↑<\/span><span>SOON<\/span><\/span>/, "AC4: pendente usa marcador SOON");
    assert.match(writtenHtml, /∅/, "AC5: simbolo de nao-aplicavel atualizado");
    assert.doesNotMatch(writtenHtml, /Kanban/, "AC1: secao kanban removida");
    assert.doesNotMatch(writtenHtml, /background:\s*rgba\(255,255,255,0\.55\)/, "AC4: celulas sem background");
    assert.match(writtenHtml, /font-size:\s*13px;\s*\}/, "AC3: tipografia da grade mais compacta");
    assert.match(writtenHtml, /contract: yes/, "AC4: contract visivel por package");
    assert.match(writtenHtml, /evaluation: yes/, "AC4: evaluation visivel por package");
    assert.match(writtenHtml, /score: 1/, "AC4: score visivel por package");
    assert.match(writtenHtml, /gantt-detail-row/, "AC2: detalhe vira linha abaixo da spec");
    assert.match(writtenHtml, /gantt-detail-cell/, "AC2: detalhe ocupa linha dedicada");
    assert.match(writtenHtml, /data-spec-name=/, "AC4: linhas carregam metadados para filtro");
    assert.match(writtenHtml, /data-spec-updated-at=/, "AC4: linhas carregam metadados para ordenacao");
    assert.match(writtenHtml, /applyDashboardFilters/, "AC3: script de filtro presente");
    assert.match(writtenHtml, /applyDashboardSort/, "AC3: script de ordenacao presente");
    assert.match(writtenHtml, /<details class="gantt-collapse">/, "AC2: fluxo por spec vira colapso");
    assert.match(writtenHtml, /ver packages \(1\)/, "AC2: colapso exposto por spec");
    assert.match(writtenHtml, /collapse-package/, "AC3: packages ficam dentro do colapso");
    assert.doesNotMatch(writtenHtml, /Fluxo<\/span>/, "AC1: linha principal nao usa coluna de fluxo");
    assert.doesNotMatch(writtenHtml, /spec-flow/, "AC4: secao separada de fluxo removida");
    assert.doesNotMatch(writtenHtml, /flow-table/, "AC4: grade separada de fluxo removida");
    assert.doesNotMatch(writtenHtml, /flow-card/, "AC1: fluxo nao usa mais cards");
    assert.match(writtenHtml, /integrity-matrix/, "AC3: secao integridade");
    assert.match(writtenHtml, /pbq-dashboard-data/, "AC4: payload embutido");
    assert.ok(
      writtenHtml.indexOf("spec-001-demo") < writtenHtml.indexOf("spec-002-planned-only"),
      "AC6: HTML inicial respeita ordenacao default por data mais recente"
    );

    const serverPort = 43173;
    const liveDir = path.join(dashboardFixtureRoot, "dashboard-live");
    const dashboardServer = spawn(
      process.execPath,
      [cli, "dashboard", dashboardFixtureRoot, "--serve", "--watch", "--port", String(serverPort), "--output", liveDir],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    try {
      await waitFor(async () => {
        const response = await fetch(`http://127.0.0.1:${serverPort}/`);
        if (!response.ok) throw new Error(`status ${response.status}`);
      }, 10000);

      const liveIndex = await fetch(`http://127.0.0.1:${serverPort}/`);
      assert.equal(liveIndex.status, 200, "AC1: / deve responder 200");
      const liveStatus = await fetch(`http://127.0.0.1:${serverPort}/status.json`);
      assert.equal(liveStatus.status, 200, "AC1: /status.json deve responder 200");

      await writeFile(
        path.join(dashboardFixtureRoot, ".plan-build-qa", "roadmap.md"),
        `# Roadmap

## Specs

| Spec | Status | Package Atual | Ultima Atualizacao | Evidencia | Proxima Acao |
| --- | --- | --- | --- | --- | --- |
| spec-001-demo | em andamento | 1 | 2026-06-18 | - | Implementar package 1 |
| spec-002-planned-only | planejado | - | 2026-06-18 | - | Aguardar |
| spec-003-live-watch | bloqueado | - | 2026-06-18 | - | Revisar |
`
      );

      await waitFor(async () => {
        const updated = JSON.parse(await readFile(path.join(liveDir, "status.json"), "utf8"));
        if (!updated.specs.some((spec) => spec.name === "spec-003-live-watch")) {
          throw new Error("watch ainda nao regenerou");
        }
      }, 10000);
    } finally {
      dashboardServer.kill();
      await onceExit(dashboardServer);
    }
  } finally {
    await rm(dashboardFixtureRoot, { recursive: true, force: true });
  }

  const analyzeRoot = await mkdtemp(path.join(tmpdir(), "pbq-analyze-"));
  try {
    await mkdir(path.join(analyzeRoot, ".plan-build-qa", "specs", "spec-001-demo", "contracts"), { recursive: true });
    await writeFile(
      path.join(analyzeRoot, ".plan-build-qa", "roadmap.md"),
      `# Roadmap

## Specs

| Spec | Status | Package Atual | Ultima Atualizacao | Evidencia | Proxima Acao |
| --- | --- | --- | --- | --- | --- |
| spec-001-demo | em andamento | 1 | 2026-05-23 | - | Implementar package 1 |
`
    );
    await writeFile(
      path.join(analyzeRoot, ".plan-build-qa", "specs", "spec-001-demo", "progress.md"),
      `# Progress

## Estado Atual

\`em andamento\`

## Packages Concluidos

Nenhum.
`
    );
    await writeFile(
      path.join(analyzeRoot, ".plan-build-qa", "specs", "spec-001-demo", "contracts", "package-1.md"),
      "# Contract: Package 1\n"
    );

    const analyzeValid = spawnSync(process.execPath, [cli, "analyze", analyzeRoot], {
      encoding: "utf8"
    });
    assert.equal(analyzeValid.status, 0, analyzeValid.stderr || analyzeValid.stdout);
    assert.match(analyzeValid.stdout, /Resultado: OK/);
    assert.match(analyzeValid.stdout, /Violations: nenhuma/);
  } finally {
    await rm(analyzeRoot, { recursive: true, force: true });
  }

  // spec-013 package-1: spec planejada sem pasta materializada deve ser warning, nao violation
  const analyzePlannedMissingRoot = await mkdtemp(path.join(tmpdir(), "pbq-analyze-planned-missing-"));
  try {
    await mkdir(path.join(analyzePlannedMissingRoot, ".plan-build-qa"), { recursive: true });
    await writeFile(
      path.join(analyzePlannedMissingRoot, ".plan-build-qa", "roadmap.md"),
      `# Roadmap

## Specs

| Spec | Status | Package Atual | Ultima Atualizacao | Evidencia | Proxima Acao |
| --- | --- | --- | --- | --- | --- |
| spec-001-planned | planejado | - | 2026-06-25 | - | Criar spec quando priorizada |
`
    );
    const plannedMissing = spawnSync(process.execPath, [cli, "analyze", analyzePlannedMissingRoot], { encoding: "utf8" });
    assert.equal(plannedMissing.status, 0, plannedMissing.stderr || plannedMissing.stdout);
    assert.match(plannedMissing.stdout, /Warnings:/, "spec planejada sem pasta deve aparecer como warning");
    assert.match(plannedMissing.stdout, /pasta da spec ausente/, "warning deve explicar pasta ausente");
    assert.match(plannedMissing.stdout, /Resultado: OK/, "warning nao deve falhar analyze sem --strict");
  } finally {
    await rm(analyzePlannedMissingRoot, { recursive: true, force: true });
  }

  const buildAnalyzeFixture = async (rootDir, overrides = {}) => {
    await mkdir(path.join(rootDir, ".plan-build-qa", "specs", "spec-001-demo", "contracts"), { recursive: true });
    await writeFile(
      path.join(rootDir, ".plan-build-qa", "roadmap.md"),
      overrides.roadmap ?? `# Roadmap

## Specs

| Spec | Status | Package Atual | Ultima Atualizacao | Evidencia | Proxima Acao |
| --- | --- | --- | --- | --- | --- |
| spec-001-demo | em andamento | 1 | 2026-05-23 | - | Implementar package 1 |
`
    );
    await writeFile(
      path.join(rootDir, ".plan-build-qa", "specs", "spec-001-demo", "progress.md"),
      overrides.progress ?? `# Progress\n\n## Package Atual\n\nPackage 1\n\n## Packages Concluidos\n\nNenhum.\n`
    );
    await writeFile(
      path.join(rootDir, ".plan-build-qa", "specs", "spec-001-demo", "contracts", "package-1.md"),
      overrides.contract ?? "# Contract: Package 1\n\n## Sensores Obrigatorios\n\n- Fast | `known-sensor` | `cmd`\n"
    );
    await writeFile(
      path.join(rootDir, ".plan-build-qa", "sensors.json"),
      overrides.sensors ?? JSON.stringify({ version: 1, sensors: [{ name: "known-sensor", tier: "fast", command: "cmd", enabled: true }] })
    );
  };

  const analyzeStatusRoot = await mkdtemp(path.join(tmpdir(), "pbq-analyze-status-"));
  try {
    await buildAnalyzeFixture(analyzeStatusRoot, {
      roadmap: `# Roadmap

## Specs

| Spec | Status | Package Atual | Ultima Atualizacao | Evidencia | Proxima Acao |
| --- | --- | --- | --- | --- | --- |
| spec-001-demo | fazendo | 1 | 2026-05-23 | - | Implementar package 1 |
`
    });
    const invalid = spawnSync(process.execPath, [cli, "analyze", analyzeStatusRoot], { encoding: "utf8" });
    assert.equal(invalid.status, 1, invalid.stderr || invalid.stdout);
    assert.match(invalid.stdout, /status invalido no roadmap: "fazendo"/);
  } finally {
    await rm(analyzeStatusRoot, { recursive: true, force: true });
  }

  const analyzeStatusValidRoot = await mkdtemp(path.join(tmpdir(), "pbq-analyze-status-ok-"));
  try {
    await buildAnalyzeFixture(analyzeStatusValidRoot);
    const valid = spawnSync(process.execPath, [cli, "analyze", analyzeStatusValidRoot], { encoding: "utf8" });
    assert.equal(valid.status, 0, valid.stderr || valid.stdout);
    assert.doesNotMatch(valid.stdout, /status invalido no roadmap/);
  } finally {
    await rm(analyzeStatusValidRoot, { recursive: true, force: true });
  }

  const analyzeModernSpecRoot = await mkdtemp(path.join(tmpdir(), "pbq-analyze-modern-spec-"));
  try {
    const modernName = "spec-260704-a7f3-demo";
    await buildAnalyzeFixture(analyzeModernSpecRoot, {
      roadmap: `# Roadmap

## Specs

| Spec | Status | Package Atual | Ultima Atualizacao | Evidencia | Proxima Acao |
| --- | --- | --- | --- | --- | --- |
| ${modernName} | em andamento | 1 | 2026-07-04 | - | Implementar package 1 |
`
    });
    const oldDir = path.join(analyzeModernSpecRoot, ".plan-build-qa", "specs", "spec-001-demo");
    const modernDir = path.join(analyzeModernSpecRoot, ".plan-build-qa", "specs", modernName);
    await rm(modernDir, { recursive: true, force: true });
    await renameForTest(oldDir, modernDir);
    const modern = spawnSync(process.execPath, [cli, "analyze", analyzeModernSpecRoot], { encoding: "utf8" });
    assert.equal(modern.status, 0, modern.stderr || modern.stdout);
    assert.match(modern.stdout, /em 1 specs/, "spec-YYMMDD-hex deve ser contada pelo analyze");
    assert.doesNotMatch(modern.stdout, /Nenhuma spec encontrada/, "novo padrao nao deve ser ignorado");
  } finally {
    await rm(analyzeModernSpecRoot, { recursive: true, force: true });
  }

  // spec-016 package-1: nome entre crases e status com emoji devem ser tolerados
  const analyzeDecoratedRoot = await mkdtemp(path.join(tmpdir(), "pbq-analyze-decorated-"));
  try {
    await buildAnalyzeFixture(analyzeDecoratedRoot, {
      roadmap: `# Roadmap

## Mapa De Epicos

| Epico | Status | Nota |
| --- | --- | --- |
| onda-5-cs-finalizacao | ✅ concluido | linha de indice sem pasta de spec |

## Specs

| Spec | Status | Package Atual | Ultima Atualizacao | Evidencia | Proxima Acao |
| --- | --- | --- | --- | --- | --- |
| \`spec-001-demo\` | ✅ concluido | 1 | 2026-05-24 | - | - |
`,
      progress: `# Progress\n\n## Package Atual\n\nPackage 1\n\n## Packages Concluidos\n\nPackage 1\n`
    });
    await mkdir(path.join(analyzeDecoratedRoot, ".plan-build-qa", "specs", "spec-001-demo", "evaluations"), { recursive: true });
    await writeFile(
      path.join(analyzeDecoratedRoot, ".plan-build-qa", "specs", "spec-001-demo", "evaluations", "package-1.md"),
      "# Evaluation: Package 1\n\nScore: 1\n"
    );
    const decorated = spawnSync(process.execPath, [cli, "analyze", analyzeDecoratedRoot], { encoding: "utf8" });
    assert.equal(decorated.status, 0, decorated.stderr || decorated.stdout);
    assert.doesNotMatch(decorated.stdout, /Nenhuma spec encontrada/, "nome entre crases deve ser reconhecido");
    assert.doesNotMatch(decorated.stdout, /status invalido no roadmap/, "status com emoji deve normalizar para concluido");
    assert.match(decorated.stdout, /em 1 specs/, "linha de epico sem spec-NNN nao deve ser contada como spec");
  } finally {
    await rm(analyzeDecoratedRoot, { recursive: true, force: true });
  }

  const analyzeDivergentRoot = await mkdtemp(path.join(tmpdir(), "pbq-analyze-divergent-"));
  try {
    await buildAnalyzeFixture(analyzeDivergentRoot, {
      progress: `# Progress\n\n## Package Atual\n\nPackage 2\n\n## Packages Concluidos\n\nNenhum.\n`
    });
    const divergent = spawnSync(process.execPath, [cli, "analyze", analyzeDivergentRoot], { encoding: "utf8" });
    assert.equal(divergent.status, 1, divergent.stderr || divergent.stdout);
    assert.match(divergent.stdout, /Package Atual divergente - roadmap=1, progress\.md=2/);
  } finally {
    await rm(analyzeDivergentRoot, { recursive: true, force: true });
  }

  const analyzeCoherentRoot = await mkdtemp(path.join(tmpdir(), "pbq-analyze-coherent-"));
  try {
    await buildAnalyzeFixture(analyzeCoherentRoot);
    const coherent = spawnSync(process.execPath, [cli, "analyze", analyzeCoherentRoot], { encoding: "utf8" });
    assert.equal(coherent.status, 0, coherent.stderr || coherent.stdout);
    assert.doesNotMatch(coherent.stdout, /Package Atual divergente/);
  } finally {
    await rm(analyzeCoherentRoot, { recursive: true, force: true });
  }

  // spec-018: numeros soltos na prosa de "Packages Concluidos" nao viram packages concluidos
  const analyzeClosedProseRoot = await mkdtemp(path.join(tmpdir(), "pbq-analyze-closed-prose-"));
  try {
    await buildAnalyzeFixture(analyzeClosedProseRoot, {
      progress: `# Progress\n\n## Package Atual\n\nPackage 1\n\n## Packages Concluidos\n\nPackage 1 - fechado com Score 1; sensor exit 0; validacao dos AC 1-6.\n`
    });
    await mkdir(path.join(analyzeClosedProseRoot, ".plan-build-qa", "specs", "spec-001-demo", "evaluations"), { recursive: true });
    await writeFile(
      path.join(analyzeClosedProseRoot, ".plan-build-qa", "specs", "spec-001-demo", "evaluations", "package-1.md"),
      "# Evaluation: Package 1\n\nScore: 1\n"
    );
    const closedProse = spawnSync(process.execPath, [cli, "analyze", analyzeClosedProseRoot], { encoding: "utf8" });
    assert.equal(closedProse.status, 0, closedProse.stderr || closedProse.stdout);
    assert.doesNotMatch(closedProse.stdout, /package concluido 0/, "exit 0 nao deve virar package concluido");
    assert.doesNotMatch(closedProse.stdout, /package concluido 6/, "AC 1-6 nao deve virar package concluido");
    assert.doesNotMatch(closedProse.stdout, /evaluation ausente/, "package 1 tem evaluation; nao deve faltar nenhuma");
  } finally {
    await rm(analyzeClosedProseRoot, { recursive: true, force: true });
  }

  const analyzeUnknownSensorRoot = await mkdtemp(path.join(tmpdir(), "pbq-analyze-unknown-sensor-"));
  try {
    await buildAnalyzeFixture(analyzeUnknownSensorRoot, {
      contract: "# Contract: Package 1\n\n## Sensores Obrigatorios\n\n- Fast | `ghost-sensor` | `cmd`\n"
    });
    const unknown = spawnSync(process.execPath, [cli, "analyze", analyzeUnknownSensorRoot], { encoding: "utf8" });
    assert.equal(unknown.status, 1, unknown.stderr || unknown.stdout);
    assert.match(unknown.stdout, /sensor obrigatorio "ghost-sensor" nao cadastrado em sensors\.json/);
  } finally {
    await rm(analyzeUnknownSensorRoot, { recursive: true, force: true });
  }

  const analyzeKnownSensorRoot = await mkdtemp(path.join(tmpdir(), "pbq-analyze-known-sensor-"));
  try {
    await buildAnalyzeFixture(analyzeKnownSensorRoot);
    const known = spawnSync(process.execPath, [cli, "analyze", analyzeKnownSensorRoot], { encoding: "utf8" });
    assert.equal(known.status, 0, known.stderr || known.stdout);
    assert.doesNotMatch(known.stdout, /nao cadastrado em sensors\.json/);
  } finally {
    await rm(analyzeKnownSensorRoot, { recursive: true, force: true });
  }

  const analyzeSummaryRoot = await mkdtemp(path.join(tmpdir(), "pbq-analyze-summary-"));
  try {
    await buildAnalyzeFixture(analyzeSummaryRoot);
    const summary = spawnSync(process.execPath, [cli, "analyze", analyzeSummaryRoot], { encoding: "utf8" });
    assert.equal(summary.status, 0, summary.stderr || summary.stdout);
    assert.match(summary.stdout, /\[pbq\] Resumo: 0 violacoes, 0 warnings em 1 specs/);
    assert.match(summary.stdout, /Resumo:[\s\S]*Resultado:/);
  } finally {
    await rm(analyzeSummaryRoot, { recursive: true, force: true });
  }

  const analyzeWarningOnlyRoot = await mkdtemp(path.join(tmpdir(), "pbq-analyze-warn-only-"));
  try {
    await buildAnalyzeFixture(analyzeWarningOnlyRoot, {
      contract: "# Contract: Package 1\n\n## Sensores Obrigatorios\n\n- `cmd-sem-nome-cadastrado`\n"
    });
    const lenient = spawnSync(process.execPath, [cli, "analyze", analyzeWarningOnlyRoot], { encoding: "utf8" });
    assert.equal(lenient.status, 0, lenient.stderr || lenient.stdout);
    assert.match(lenient.stdout, /sensor obrigatorio citado sem nome/);
    assert.match(lenient.stdout, /Resultado: OK/);

    const strict = spawnSync(process.execPath, [cli, "analyze", analyzeWarningOnlyRoot, "--strict"], { encoding: "utf8" });
    assert.equal(strict.status, 1, strict.stderr || strict.stdout);
    assert.match(strict.stdout, /Resultado: FALHOU/);
  } finally {
    await rm(analyzeWarningOnlyRoot, { recursive: true, force: true });
  }

  const analyzeBrokenSensorsRoot = await mkdtemp(path.join(tmpdir(), "pbq-analyze-broken-sensors-"));
  try {
    await buildAnalyzeFixture(analyzeBrokenSensorsRoot, {
      sensors: "{ not valid json"
    });
    const broken = spawnSync(process.execPath, [cli, "analyze", analyzeBrokenSensorsRoot], { encoding: "utf8" });
    assert.equal(broken.status, 0, broken.stderr || broken.stdout);
    assert.match(broken.stdout, /sensors\.json invalido/);

    const brokenStrict = spawnSync(process.execPath, [cli, "analyze", analyzeBrokenSensorsRoot, "--strict"], { encoding: "utf8" });
    assert.equal(brokenStrict.status, 1, brokenStrict.stderr || brokenStrict.stdout);
  } finally {
    await rm(analyzeBrokenSensorsRoot, { recursive: true, force: true });
  }

  // spec-020 package-1: matriz de packages (declarado ∪ contracts ∪ evaluations)
  const buildMatrixFixture = async (rootDir, opts) => {
    const specDir = path.join(rootDir, ".plan-build-qa", "specs", "spec-001-demo");
    await mkdir(path.join(specDir, "contracts"), { recursive: true });
    await mkdir(path.join(specDir, "evaluations"), { recursive: true });
    await writeFile(
      path.join(rootDir, ".plan-build-qa", "roadmap.md"),
      `# Roadmap\n\n## Specs\n\n| Spec | Status | Package Atual | Ultima Atualizacao | Evidencia | Proxima Acao |\n| --- | --- | --- | --- | --- | --- |\n| spec-001-demo | em andamento | 1 | 2026-05-31 | - | - |\n`
    );
    const tableRows = opts.declaredRows.map((tok) => `| ${tok} | obj | planejado | s |`).join("\n");
    await writeFile(
      path.join(specDir, "spec.md"),
      `# Spec: spec-001-demo\n\n## Packages\n\n| Package | Objetivo | Estado | Sensores |\n| --- | --- | --- | --- |\n${tableRows}\n\n## Riscos\n`
    );
    const closedLines = (opts.closed || []).map((n) => `- Package ${n} fechado.`).join("\n");
    await writeFile(
      path.join(specDir, "progress.md"),
      `# Progress\n\n## Package Atual\n\nPackage 1\n\n## Packages Concluidos\n\n${closedLines || "Nenhum."}\n`
    );
    for (const c of opts.contracts || []) {
      await writeFile(path.join(specDir, "contracts", `package-${c}.md`), `# Contract: Package ${c}\n`);
    }
    for (const e of opts.evaluations || []) {
      const score = (opts.scores && opts.scores[e] !== undefined) ? opts.scores[e] : 1;
      await writeFile(path.join(specDir, "evaluations", `package-${e}.md`), `# Evaluation: Package ${e}\n\nScore: ${score}\n`);
    }
    await writeFile(
      path.join(rootDir, ".plan-build-qa", "sensors.json"),
      JSON.stringify({ version: 2, sensors: [] })
    );
  };

  // AC1: sub-package package-1.1.md → violação de numeração inválida
  const mxSub = await mkdtemp(path.join(tmpdir(), "pbq-mx-sub-"));
  try {
    await buildMatrixFixture(mxSub, { declaredRows: ["1"], contracts: ["1", "1.1"], evaluations: ["1"] });
    const out = spawnSync(process.execPath, [cli, "analyze", mxSub], { encoding: "utf8" });
    assert.equal(out.status, 1, out.stderr || out.stdout);
    assert.match(out.stdout, /numeração inválida: package-1\.1\.md/, "AC1: sub-package deve gerar violação");
  } finally {
    await rm(mxSub, { recursive: true, force: true });
  }

  // AC2: materializado {1,2,3,8,10} → buracos 4,5,6,7,9
  const mxHoles = await mkdtemp(path.join(tmpdir(), "pbq-mx-holes-"));
  try {
    await buildMatrixFixture(mxHoles, {
      declaredRows: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      contracts: ["1", "2", "3", "8", "10"],
      evaluations: ["1", "2", "3", "8", "10"]
    });
    const out = spawnSync(process.execPath, [cli, "analyze", mxHoles], { encoding: "utf8" });
    assert.equal(out.status, 1, out.stderr || out.stdout);
    assert.match(out.stdout, /buracos: faltam 4, 5, 6, 7, 9/, "AC2: deve listar buracos");
  } finally {
    await rm(mxHoles, { recursive: true, force: true });
  }

  // AC3: evaluation 8 sem contract → órfã
  const mxOrphan = await mkdtemp(path.join(tmpdir(), "pbq-mx-orphan-"));
  try {
    await buildMatrixFixture(mxOrphan, {
      declaredRows: ["1", "2", "3", "8"],
      contracts: ["1", "2", "3"],
      evaluations: ["1", "2", "3", "8"]
    });
    const out = spawnSync(process.execPath, [cli, "analyze", mxOrphan], { encoding: "utf8" });
    assert.equal(out.status, 1, out.stderr || out.stdout);
    assert.match(out.stdout, /evaluation package-8 sem contract correspondente/, "AC3: evaluation órfã");
  } finally {
    await rm(mxOrphan, { recursive: true, force: true });
  }

  // AC4: materializado 10 — sem 9+ → violação; com 9+ → sem violação
  const mxUndeclared = await mkdtemp(path.join(tmpdir(), "pbq-mx-undeclared-"));
  try {
    await buildMatrixFixture(mxUndeclared, {
      declaredRows: ["1", "2", "3"],
      contracts: ["1", "2", "3", "10"],
      evaluations: ["1", "2", "3", "10"]
    });
    const out = spawnSync(process.execPath, [cli, "analyze", mxUndeclared], { encoding: "utf8" });
    assert.match(out.stdout, /package 10 materializado mas ausente da tabela/, "AC4a: sem 9+ deve flagar");
  } finally {
    await rm(mxUndeclared, { recursive: true, force: true });
  }
  const mxOpenEnded = await mkdtemp(path.join(tmpdir(), "pbq-mx-open-"));
  try {
    await buildMatrixFixture(mxOpenEnded, {
      declaredRows: ["1", "2", "3", "9+"],
      contracts: ["1", "2", "3", "10"],
      evaluations: ["1", "2", "3", "10"]
    });
    const out = spawnSync(process.execPath, [cli, "analyze", mxOpenEnded], { encoding: "utf8" });
    assert.doesNotMatch(out.stdout, /package 10 materializado mas ausente da tabela/, "AC4b: 9+ cobre o 10");
  } finally {
    await rm(mxOpenEnded, { recursive: true, force: true });
  }

  // AC5: evaluation Score 0 em package fechado → violação
  const mxScore = await mkdtemp(path.join(tmpdir(), "pbq-mx-score-"));
  try {
    await buildMatrixFixture(mxScore, {
      declaredRows: ["1"],
      contracts: ["1"],
      evaluations: ["1"],
      scores: { "1": 0 },
      closed: ["1"]
    });
    const out = spawnSync(process.execPath, [cli, "analyze", mxScore], { encoding: "utf8" });
    assert.equal(out.status, 1, out.stderr || out.stdout);
    assert.match(out.stdout, /package 1 fechado mas evaluation tem Score 0/, "AC5: Score 0 em fechado");
  } finally {
    await rm(mxScore, { recursive: true, force: true });
  }

  // AC6: matriz coerente {1,2,3} → 0 violações
  const mxCoherent = await mkdtemp(path.join(tmpdir(), "pbq-mx-coherent-"));
  try {
    await buildMatrixFixture(mxCoherent, {
      declaredRows: ["1", "2", "3"],
      contracts: ["1", "2", "3"],
      evaluations: ["1", "2", "3"],
      closed: ["1", "2", "3"]
    });
    const out = spawnSync(process.execPath, [cli, "analyze", mxCoherent], { encoding: "utf8" });
    assert.equal(out.status, 0, out.stderr || out.stdout);
    assert.match(out.stdout, /Violations: nenhuma/, "AC6: matriz coerente sem violação");
  } finally {
    await rm(mxCoherent, { recursive: true, force: true });
  }

  // AC7: declarado 4 sem contract → warning, não violação
  const mxDeclared = await mkdtemp(path.join(tmpdir(), "pbq-mx-declared-"));
  try {
    await buildMatrixFixture(mxDeclared, {
      declaredRows: ["1", "2", "3", "4"],
      contracts: ["1", "2", "3"],
      evaluations: ["1", "2", "3"],
      closed: ["1", "2", "3"]
    });
    const out = spawnSync(process.execPath, [cli, "analyze", mxDeclared], { encoding: "utf8" });
    assert.equal(out.status, 0, out.stderr || out.stdout);
    assert.match(out.stdout, /package 4 declarado na spec sem contract/, "AC7: warning de declarado-sem-contract");
    assert.match(out.stdout, /Resultado: OK/, "AC7: warning não falha o analyze");
  } finally {
    await rm(mxDeclared, { recursive: true, force: true });
  }

  // spec-020 package-2: enforcement de sensores na evaluation
  const buildEnforceFixture = async (rootDir, { contractSensorTable, evalSensorTable }) => {
    const specDir = path.join(rootDir, ".plan-build-qa", "specs", "spec-001-demo");
    await mkdir(path.join(specDir, "contracts"), { recursive: true });
    await mkdir(path.join(specDir, "evaluations"), { recursive: true });
    await writeFile(
      path.join(rootDir, ".plan-build-qa", "roadmap.md"),
      `# Roadmap\n\n## Specs\n\n| Spec | Status | Package Atual | Ultima Atualizacao | Evidencia | Proxima Acao |\n| --- | --- | --- | --- | --- | --- |\n| spec-001-demo | em andamento | 1 | 2026-05-31 | - | - |\n`
    );
    await writeFile(
      path.join(specDir, "spec.md"),
      `# Spec: spec-001-demo\n\n## Packages\n\n| Package | Objetivo | Estado | Sensores |\n| --- | --- | --- | --- |\n| 1 | obj | planejado | s |\n\n## Riscos\n`
    );
    await writeFile(path.join(specDir, "progress.md"), `# Progress\n\n## Package Atual\n\nPackage 1\n\n## Packages Concluidos\n\nPackage 1 fechado.\n`);
    await writeFile(
      path.join(specDir, "contracts", "package-1.md"),
      `# Contract: Package 1\n\n## Sensores Obrigatorios\n\n${contractSensorTable}\n`
    );
    await writeFile(
      path.join(specDir, "evaluations", "package-1.md"),
      `# Evaluation: Package 1\n\nScore: 1\n\n## Resumo De Sensores\n\n${evalSensorTable}\n`
    );
    await writeFile(
      path.join(rootDir, ".plan-build-qa", "sensors.json"),
      JSON.stringify({ version: 2, sensors: [{ name: "sensor-x", on: ["close"], command: "echo x", enabled: true }] })
    );
  };
  const contractTable = "| Sensor | Tier | Nome em sensors.json | Comando |\n| --- | --- | --- | --- |\n| sensor-x | medium | `sensor-x` | `echo x` |";

  // AC1: contract exige sensor-x, evaluation nao o lista → violação ausente
  const enfAusente = await mkdtemp(path.join(tmpdir(), "pbq-enf-ausente-"));
  try {
    await buildEnforceFixture(enfAusente, {
      contractSensorTable: contractTable,
      evalSensorTable: "| Sensor | Tier | Obrigatorio | Status | Comando | Exit Code | Evidencia |\n| --- | --- | --- | --- | --- | --- | --- |\n| outro-sensor | medium | sim | passou | `echo y` | 0 | ok |"
    });
    const out = spawnSync(process.execPath, [cli, "analyze", enfAusente], { encoding: "utf8" });
    assert.equal(out.status, 1, out.stderr || out.stdout);
    assert.match(out.stdout, /sensor obrigatório "sensor-x" do contract ausente na evaluation/, "AC1: sensor ausente");
  } finally {
    await rm(enfAusente, { recursive: true, force: true });
  }

  // AC2: evaluation lista sensor-x com falhou → violação não passou
  const enfFalhou = await mkdtemp(path.join(tmpdir(), "pbq-enf-falhou-"));
  try {
    await buildEnforceFixture(enfFalhou, {
      contractSensorTable: contractTable,
      evalSensorTable: "| Sensor | Tier | Obrigatorio | Status | Comando | Exit Code | Evidencia |\n| --- | --- | --- | --- | --- | --- | --- |\n| sensor-x | medium | sim | falhou | `echo x` | 1 | erro |"
    });
    const out = spawnSync(process.execPath, [cli, "analyze", enfFalhou], { encoding: "utf8" });
    assert.equal(out.status, 1, out.stderr || out.stdout);
    assert.match(out.stdout, /sensor obrigatório "sensor-x" não passou na evaluation \(status: falhou\)/, "AC2: sensor falhou");
  } finally {
    await rm(enfFalhou, { recursive: true, force: true });
  }

  // spec-013 package-1: Score 0 em package nao fechado nao deve bloquear reexecucao do analyze
  const enfAbertoScoreZero = await mkdtemp(path.join(tmpdir(), "pbq-enf-aberto-score-zero-"));
  try {
    await buildEnforceFixture(enfAbertoScoreZero, {
      contractSensorTable: contractTable,
      evalSensorTable: "| Sensor | Tier | Obrigatorio | Status | Comando | Exit Code | Evidencia |\n| --- | --- | --- | --- | --- | --- | --- |\n| sensor-x | medium | sim | falhou | `echo x` | 1 | erro |"
    });
    await writeFile(
      path.join(enfAbertoScoreZero, ".plan-build-qa", "specs", "spec-001-demo", "progress.md"),
      "# Progress\n\n## Package Atual\n\nPackage 1\n\n## Packages Concluidos\n\nNenhum.\n"
    );
    await writeFile(
      path.join(enfAbertoScoreZero, ".plan-build-qa", "specs", "spec-001-demo", "evaluations", "package-1.md"),
      "# Evaluation: Package 1\n\nScore: 0\n\n## Resumo De Sensores\n\n| Sensor | Tier | Obrigatorio | Status | Comando | Exit Code | Evidencia |\n| --- | --- | --- | --- | --- | --- | --- |\n| sensor-x | medium | sim | falhou | `echo x` | 1 | erro |\n"
    );
    const out = spawnSync(process.execPath, [cli, "analyze", enfAbertoScoreZero], { encoding: "utf8" });
    assert.equal(out.status, 0, out.stderr || out.stdout);
    assert.match(out.stdout, /evaluation package-1 tem Score 0/, "Score 0 aberto deve aparecer como warning");
    assert.match(out.stdout, /enforcement de sensores ignorado/, "enforcement deve explicar skip para Score 0 aberto");
    assert.doesNotMatch(out.stdout, /não passou na evaluation/, "sensor falho em Score 0 aberto nao deve virar violation");
  } finally {
    await rm(enfAbertoScoreZero, { recursive: true, force: true });
  }

  // AC3: evaluation lista sensor-x com passou → sem violação para esse sensor
  const enfPassou = await mkdtemp(path.join(tmpdir(), "pbq-enf-passou-"));
  try {
    await buildEnforceFixture(enfPassou, {
      contractSensorTable: contractTable,
      evalSensorTable: "| Sensor | Tier | Obrigatorio | Status | Comando | Exit Code | Evidencia |\n| --- | --- | --- | --- | --- | --- | --- |\n| sensor-x | medium | sim | passou | `echo x` | 0 | ok |"
    });
    const out = spawnSync(process.execPath, [cli, "analyze", enfPassou], { encoding: "utf8" });
    assert.doesNotMatch(out.stdout, /sensor-x.*(ausente|não passou)/, "AC3: sensor passou não gera violação");
  } finally {
    await rm(enfPassou, { recursive: true, force: true });
  }

  const analyzeHelp2 = spawnSync(process.execPath, [cli, "help", "analyze"], { encoding: "utf8" });
  assert.equal(analyzeHelp2.status, 0, analyzeHelp2.stderr || analyzeHelp2.stdout);
  assert.match(analyzeHelp2.stdout, /--strict/);

  const sensorSuggestRoot = await mkdtemp(path.join(tmpdir(), "pbq-sensor-suggest-"));
  try {
    await writeFile(path.join(sensorSuggestRoot, "package.json"), JSON.stringify({ scripts: {} }, null, 2));
    await writeFile(path.join(sensorSuggestRoot, "sonar.bat"), "@echo sonar\n");
    await mkdir(path.join(sensorSuggestRoot, "scripts"), { recursive: true });
    await writeFile(path.join(sensorSuggestRoot, "scripts", "test.sh"), "#!/bin/sh\necho test\n");

    const initForSuggest = spawnSync(process.execPath, [cli, "init", sensorSuggestRoot], { encoding: "utf8" });
    assert.equal(initForSuggest.status, 0, initForSuggest.stderr || initForSuggest.stdout);

    const sensorsBefore = await readFile(path.join(sensorSuggestRoot, ".plan-build-qa", "sensors.json"), "utf8");

    const cadastrados = JSON.parse(sensorsBefore).sensors;
    assert.ok(cadastrados.some((sensor) => /sonar\.bat/i.test(sensor.command)), "fixture deveria cadastrar sonar.bat no init");

    const suggestAfterInit = spawnSync(process.execPath, [cli, "sensor", "suggest", sensorSuggestRoot], { encoding: "utf8" });
    assert.equal(suggestAfterInit.status, 0, suggestAfterInit.stderr || suggestAfterInit.stdout);
    assert.match(suggestAfterInit.stdout, /Nenhum candidato pendente\./);

    await writeFile(path.join(sensorSuggestRoot, "lint.sh"), "#!/bin/sh\necho lint\n");

    const suggestPending = spawnSync(process.execPath, [cli, "sensor", "suggest", sensorSuggestRoot], { encoding: "utf8" });
    assert.equal(suggestPending.status, 0, suggestPending.stderr || suggestPending.stdout);
    assert.match(suggestPending.stdout, /--on commit,close --command.*lint\.sh/);
    assert.doesNotMatch(suggestPending.stdout, /sonar\.bat/);

    const sensorsAfter = await readFile(path.join(sensorSuggestRoot, ".plan-build-qa", "sensors.json"), "utf8");
    assert.equal(sensorsAfter, sensorsBefore, "pbq sensor suggest nao deve alterar sensors.json");

    const sensorHelp2 = spawnSync(process.execPath, [cli, "help", "sensor"], { encoding: "utf8" });
    assert.equal(sensorHelp2.status, 0, sensorHelp2.stderr || sensorHelp2.stdout);
    assert.match(sensorHelp2.stdout, /pbq sensor suggest/);
  } finally {
    await rm(sensorSuggestRoot, { recursive: true, force: true });
  }

  const sensorDetectRoot = await mkdtemp(path.join(tmpdir(), "pbq-sensor-detect-"));
  try {
    await writeFile(path.join(sensorDetectRoot, "package.json"), JSON.stringify({ scripts: {} }, null, 2));
    await writeFile(path.join(sensorDetectRoot, "sonar.bat"), "@echo sonar scan\n");
    await writeFile(path.join(sensorDetectRoot, "qa.bat"), "@echo qa run\n");
    await mkdir(path.join(sensorDetectRoot, "scripts"), { recursive: true });
    await writeFile(path.join(sensorDetectRoot, "scripts", "test.sh"), "#!/bin/sh\necho test\n");
    await writeFile(path.join(sensorDetectRoot, "Makefile"), "test:\n\techo make-test\n\nbuild:\n\techo make-build\n");

    const detectInit = spawnSync(process.execPath, [cli, "init", sensorDetectRoot], { encoding: "utf8" });
    assert.equal(detectInit.status, 0, detectInit.stderr || detectInit.stdout);

    const detectedSensors = JSON.parse(
      await readFile(path.join(sensorDetectRoot, ".plan-build-qa", "sensors.json"), "utf8")
    ).sensors;

    assert.ok(
      detectedSensors.some((sensor) => sensor.tier === "fast" && /sonar\.bat/i.test(sensor.command)),
      `sonar.bat deveria virar sensor fast. Detectados: ${JSON.stringify(detectedSensors)}`
    );
    assert.ok(
      detectedSensors.some((sensor) => sensor.tier === "medium" && /scripts[\/\\]test\.sh/i.test(sensor.command)),
      `scripts/test.sh deveria virar sensor medium. Detectados: ${JSON.stringify(detectedSensors)}`
    );
    assert.ok(
      detectedSensors.some((sensor) => sensor.tier === "medium" && sensor.command === "make test"),
      `make test deveria virar sensor medium. Detectados: ${JSON.stringify(detectedSensors)}`
    );
    assert.ok(
      detectedSensors.some(
        (sensor) =>
          sensor.tier === "medium" &&
          /qa\.bat/i.test(sensor.command) &&
          sensor.tierUncertain === true &&
          /tier-incerto/.test(sensor.reason)
      ),
      `qa.bat deveria ser medium com tier-incerto. Detectados: ${JSON.stringify(detectedSensors)}`
    );
  } finally {
    await rm(sensorDetectRoot, { recursive: true, force: true });
  }

  // spec-017 package-1: pbq sensor catalog lista entradas do catalogo
  const catalogList = spawnSync(process.execPath, [cli, "sensor", "catalog", root], { encoding: "utf8" });
  assert.equal(catalogList.status, 0, catalogList.stderr || catalogList.stdout);
  assert.match(catalogList.stdout, /sonar-dotnet/, "catalog deve listar sonar-dotnet");
  assert.match(catalogList.stdout, /eslint/, "catalog deve listar eslint");
  assert.match(catalogList.stdout, /playwright-e2e/, "catalog deve listar playwright-e2e");

  // spec-017 package-1: pbq sensor add --from-catalog sonar-dotnet adiciona com campos corretos
  const addFromCatalog = spawnSync(
    process.execPath,
    [cli, "sensor", "add", "--from-catalog", "sonar-dotnet", root],
    { encoding: "utf8" }
  );
  assert.equal(addFromCatalog.status, 0, addFromCatalog.stderr || addFromCatalog.stdout);

  const sensorsAfterCatalog = JSON.parse(await readFile(path.join(root, ".plan-build-qa/sensors.json"), "utf8"));
  const sonarDotnet = sensorsAfterCatalog.sensors.find((s) => s.name === "sonar-dotnet");
  assert.ok(sonarDotnet, "sonar-dotnet deve estar em sensors.json apos add --from-catalog");
  assert.equal(sonarDotnet.tier, "slow", "sonar-dotnet deve ter tier slow");
  assert.equal(sonarDotnet.enabled, false, "sonar-dotnet deve ter enabled false (vem do catalogo)");
  assert.equal(sonarDotnet.source, "catalog", "sonar-dotnet deve ter source catalog");

  const slowAfterCatalog = await readFile(path.join(root, ".plan-build-qa/harness/scripts/run-slow.ps1"), "utf8");
  assert.doesNotMatch(slowAfterCatalog, /sonarscanner|sonar-scanner|npx sonar/, "sensor disabled nao deve aparecer no runner");

  // catalog marca sonar-dotnet como [cadastrado] apos o add
  const catalogListAfter = spawnSync(process.execPath, [cli, "sensor", "catalog", root], { encoding: "utf8" });
  assert.equal(catalogListAfter.status, 0, catalogListAfter.stderr || catalogListAfter.stdout);
  assert.match(catalogListAfter.stdout, /\[cadastrado\].*sonar-dotnet|\[cadastrado\][\s\S]*sonar-dotnet/, "sonar-dotnet deve aparecer como cadastrado apos o add");

  // spec-017 package-2: from-catalog propaga phase do catalogo (sonar-dotnet tem ["before","after"])
  const sensorsWithPhase = JSON.parse(await readFile(path.join(root, ".plan-build-qa/sensors.json"), "utf8"));
  const sonarPhase = sensorsWithPhase.sensors.find((s) => s.name === "sonar-dotnet");
  assert.ok(Array.isArray(sonarPhase?.phase), "sonar-dotnet deve ter campo phase como array");
  assert.ok(sonarPhase.phase.includes("before") && sonarPhase.phase.includes("after"), "sonar-dotnet phase deve incluir before e after");

  // spec-017 package-2: sensor add --phase before grava phase:["before"]
  const phaseRoot = await mkdtemp(path.join(tmpdir(), "pbq-phase-"));
  try {
    const initPhase = spawnSync(process.execPath, [cli, "init", phaseRoot], { encoding: "utf8" });
    assert.equal(initPhase.status, 0, initPhase.stderr || initPhase.stdout);

    const addPhase = spawnSync(
      process.execPath,
      [cli, "sensor", "add", phaseRoot, "--name", "preflight-check", "--tier", "fast", "--command", "echo preflight", "--phase", "before"],
      { encoding: "utf8" }
    );
    assert.equal(addPhase.status, 0, addPhase.stderr || addPhase.stdout);

    const sensorsPhase = JSON.parse(await readFile(path.join(phaseRoot, ".plan-build-qa/sensors.json"), "utf8"));
    const preflight = sensorsPhase.sensors.find((s) => s.name === "preflight-check");
    assert.ok(Array.isArray(preflight?.phase), "sensor com --phase deve gravar campo phase como array");
    assert.deepEqual(preflight.phase, ["before"], "phase deve ser [\"before\"]");

    // sensor sem phase se comporta como after (AC3/AC5): package close padrao (after) inclui sensor sem phase
    const addNoPhaseSensor = spawnSync(
      process.execPath,
      [cli, "sensor", "add", phaseRoot, "--name", "no-phase-sensor", "--tier", "fast", "--command", "echo gate"],
      { encoding: "utf8" }
    );
    assert.equal(addNoPhaseSensor.status, 0, addNoPhaseSensor.stderr || addNoPhaseSensor.stdout);

    // package close padrao (--phase after): roda no-phase-sensor (sem phase = after), nao roda preflight-check (phase=before)
    const closePhaseBefore = spawnSync(
      process.execPath,
      [cli, "package", "close", phaseRoot, "--spec", "spec-phase-test", "--package", "1", "--tiers", "fast"],
      { encoding: "utf8" }
    );
    assert.equal(closePhaseBefore.status, 0, closePhaseBefore.stderr || closePhaseBefore.stdout);
    const evalAfter = await readFile(path.join(phaseRoot, ".plan-build-qa/specs/spec-phase-test/evaluations/package-1.md"), "utf8");
    assert.match(evalAfter, /no-phase-sensor/, "package close padrao deve incluir sensor sem phase (equivale a after)");
    assert.doesNotMatch(evalAfter, /preflight-check/, "package close padrao nao deve incluir sensor com phase:before");

    // package close --phase before: roda preflight-check, nao roda no-phase-sensor
    const closePhaseBeforeExplicit = spawnSync(
      process.execPath,
      [cli, "package", "close", phaseRoot, "--spec", "spec-phase-test", "--package", "2", "--tiers", "fast", "--phase", "before"],
      { encoding: "utf8" }
    );
    assert.equal(closePhaseBeforeExplicit.status, 0, closePhaseBeforeExplicit.stderr || closePhaseBeforeExplicit.stdout);
    const evalBefore = await readFile(path.join(phaseRoot, ".plan-build-qa/specs/spec-phase-test/evaluations/package-2.md"), "utf8");
    assert.match(evalBefore, /preflight-check/, "package close --phase before deve incluir sensor com phase:before");
    assert.doesNotMatch(evalBefore, /no-phase-sensor/, "package close --phase before nao deve incluir sensor sem phase (que e after)");
  } finally {
    await rm(phaseRoot, { recursive: true, force: true });
  }

  const closePackage = spawnSync(
    process.execPath,
    [cli, "package", "close", root, "--spec", "spec-001-smoke", "--package", "1", "--tiers", "fast"],
    { encoding: "utf8" }
  );
  assert.equal(closePackage.status, 0, closePackage.stderr || closePackage.stdout);

  const evaluation = await readFile(path.join(root, ".plan-build-qa/specs/spec-001-smoke/evaluations/package-1.md"), "utf8");
  assert.match(evaluation, /Score: 1/);
  assert.match(evaluation, /\| npm-run-lint \| fast \| sim \| passou \|/);

  // OVERVIEW.md deve ser sempre substituido no update (nao gera .pbq-new)
  await writeFile(path.join(root, ".plan-build-qa/OVERVIEW.md"), "conteudo customizado que deve ser substituido\n");
  await writeFile(path.join(root, ".claude/skills/constitution/SKILL.md"), "custom constitution skill\n");
  await rm(path.join(root, ".agents/skills/roadmap/SKILL.md"), { force: true });
  const update = spawnSync(process.execPath, [cli, "update", root], {
    encoding: "utf8"
  });
  assert.equal(update.status, 0, update.stderr || update.stdout);
  assert.match(update.stdout, /Candidates written/);
  // spec-017 package-1: convite ao catalogo no fim de update
  assert.match(update.stdout, /sensores no catalogo/, "update deve imprimir convite ao catalogo");
  assert.equal(await readFile(path.join(root, ".claude/skills/constitution/SKILL.md"), "utf8"), "custom constitution skill\n");
  assert.ok(existsSync(path.join(root, ".claude/skills/constitution/SKILL.md.pbq-new")));
  assert.ok(existsSync(path.join(root, ".agents/skills/roadmap/SKILL.md")));
  // OVERVIEW.md deve ter sido substituido (nao preservado como custom)
  const overviewAfterUpdate = await readFile(path.join(root, ".plan-build-qa/OVERVIEW.md"), "utf8");
  assert.match(overviewAfterUpdate, /mermaid/, "OVERVIEW.md deve ter sido substituido pelo update, nao preservado");
  assert.doesNotMatch(overviewAfterUpdate, /conteudo customizado/, "OVERVIEW.md customizado nao deve sobreviver ao update");

  const updateMigrationRoot = await mkdtemp(path.join(tmpdir(), "pbq-update-spec-migration-"));
  try {
    const initMigration = spawnSync(process.execPath, [cli, "init", updateMigrationRoot], { encoding: "utf8" });
    assert.equal(initMigration.status, 0, initMigration.stderr || initMigration.stdout);
    const legacySpecDir = path.join(updateMigrationRoot, ".plan-build-qa", "specs", "spec-001-legacy-demo");
    await mkdir(legacySpecDir, { recursive: true });
    const legacySpecPath = path.join(legacySpecDir, "spec.md");
    await writeFile(legacySpecPath, "# Spec: Legacy Demo\n\n## Objetivo\n\nMigrar.\n");
    await writeFile(
      path.join(updateMigrationRoot, ".plan-build-qa", "roadmap.md"),
      `# Roadmap

## Specs

| Spec | Status | Package Atual | Ultima Atualizacao | Evidencia | Proxima Acao |
| --- | --- | --- | --- | --- | --- |
| spec-001-legacy-demo | em andamento | 1 | 2026-07-04 | - | Implementar package 1 |
`
    );
    const legacySpecStat = await stat(legacySpecPath);
    const expectedDateId = formatTestSpecDateId(legacySpecStat.birthtimeMs > 0 ? legacySpecStat.birthtime : legacySpecStat.mtime);
    const updateMigration = spawnSync(process.execPath, [cli, "update", updateMigrationRoot], { encoding: "utf8" });
    assert.equal(updateMigration.status, 0, updateMigration.stderr || updateMigration.stdout);
    assert.match(updateMigration.stdout, /Spec migrated: spec-001-legacy-demo -> spec-\d{6}-[0-9a-f]{4}-legacy-demo/);
    assert.match(updateMigration.stdout, /Roadmap spec references updated/);
    assert.equal(existsSync(legacySpecDir), false, "diretorio legado deve ser renomeado");
    const migratedNames = (await readDirNames(path.join(updateMigrationRoot, ".plan-build-qa", "specs")))
      .filter((name) => name.includes("legacy-demo"));
    assert.equal(migratedNames.length, 1, "deve existir exatamente uma spec migrada");
    assert.match(migratedNames[0], new RegExp(`^spec-${expectedDateId}-[0-9a-f]{4}-legacy-demo$`), "YYMMDD deve vir da criacao de spec.md");
    const migratedRoadmap = await readFile(path.join(updateMigrationRoot, ".plan-build-qa", "roadmap.md"), "utf8");
    assert.match(migratedRoadmap, new RegExp(`\\| ${migratedNames[0]} \\| em andamento \\|`), "roadmap deve apontar para o novo nome");
    assert.doesNotMatch(migratedRoadmap, /spec-001-legacy-demo/, "roadmap nao deve manter referencia antiga");
  } finally {
    await rm(updateMigrationRoot, { recursive: true, force: true });
  }

  const bugUpdateMigrationRoot = await mkdtemp(path.join(tmpdir(), "pbq-update-bug-migration-"));
  try {
    const initBugMigration = spawnSync(process.execPath, [cli, "init", bugUpdateMigrationRoot], { encoding: "utf8" });
    assert.equal(initBugMigration.status, 0, initBugMigration.stderr || initBugMigration.stdout);
    const legacyBugDir = path.join(bugUpdateMigrationRoot, ".plan-build-qa", "bugs", "bug-001-legacy-demo");
    await mkdir(legacyBugDir, { recursive: true });
    const legacyBugPath = path.join(legacyBugDir, "bug.md");
    await writeFile(legacyBugPath, "# Bug: Legacy Demo\n\n## Investigacao\n\nMigrar.\n");
    await writeFile(path.join(legacyBugDir, "progress.md"), "# Progress\n");
    const legacyBugStat = await stat(legacyBugPath);
    const expectedBugDateId = formatTestSpecDateId(legacyBugStat.birthtimeMs > 0 ? legacyBugStat.birthtime : legacyBugStat.mtime);
    const updateBugMigration = spawnSync(process.execPath, [cli, "update", bugUpdateMigrationRoot], { encoding: "utf8" });
    assert.equal(updateBugMigration.status, 0, updateBugMigration.stderr || updateBugMigration.stdout);
    assert.match(updateBugMigration.stdout, /Bug migrated: bug-001-legacy-demo -> bug-\d{6}-[0-9a-f]{4}-legacy-demo/);
    assert.equal(existsSync(legacyBugDir), false, "diretorio legado de bug deve ser renomeado");
    const migratedBugNames = (await readDirNames(path.join(bugUpdateMigrationRoot, ".plan-build-qa", "bugs")))
      .filter((name) => name.includes("legacy-demo"));
    assert.equal(migratedBugNames.length, 1, "deve existir exatamente um bug migrado");
    assert.match(migratedBugNames[0], new RegExp(`^bug-${expectedBugDateId}-[0-9a-f]{4}-legacy-demo$`), "YYMMDD do bug deve vir da criacao de bug.md");
    assert.ok(existsSync(path.join(bugUpdateMigrationRoot, ".plan-build-qa", "bugs", migratedBugNames[0], "bug.md")), "bug.md deve permanecer no diretorio migrado");
  } finally {
    await rm(bugUpdateMigrationRoot, { recursive: true, force: true });
  }

  const second = spawnSync(process.execPath, [cli, "init", root], {
    encoding: "utf8"
  });
  assert.equal(second.status, 0, second.stderr || second.stdout);
  assert.match(second.stdout, /Skipped existing/);

  const freshRoot = await mkdtemp(path.join(tmpdir(), "pbq-dry-run-"));
  try {
    const dryRun = spawnSync(process.execPath, [cli, "init", freshRoot, "--dry-run"], {
      encoding: "utf8"
    });
    assert.equal(dryRun.status, 0, dryRun.stderr || dryRun.stdout);
    assert.match(dryRun.stdout, /Would create:/);
    assert.match(dryRun.stdout, /Would update:/);
  } finally {
    await rm(freshRoot, { recursive: true, force: true });
  }

  // spec-019 package-1: sensor add --on (AC1, AC2)
  const onRoot = await mkdtemp(path.join(tmpdir(), "pbq-on-sensor-"));
  try {
    const initOn = spawnSync(process.execPath, [cli, "init", onRoot], { encoding: "utf8" });
    assert.equal(initOn.status, 0, initOn.stderr || initOn.stdout);

    // AC1: --on commit,close
    const addOn = spawnSync(
      process.execPath,
      [cli, "sensor", "add", onRoot, "--name", "explicit-on-sensor", "--on", "commit,close", "--command", "echo ok"],
      { encoding: "utf8" }
    );
    assert.equal(addOn.status, 0, addOn.stderr || addOn.stdout);
    const sensorsOn = JSON.parse(await readFile(path.join(onRoot, ".plan-build-qa/sensors.json"), "utf8"));
    assert.equal(sensorsOn.version, 2, "sensors.json deve ter version 2 apos sensor add");
    const explicitOn = sensorsOn.sensors.find((s) => s.name === "explicit-on-sensor");
    assert.ok(explicitOn, "sensor com --on deve ser cadastrado");
    assert.deepEqual(explicitOn.on, ["commit", "close"], "on deve ser [commit,close]");

    // AC2: --tier medium (no --on) → on:["close"], tier cosmético preservado
    const addTier = spawnSync(
      process.execPath,
      [cli, "sensor", "add", onRoot, "--name", "tier-only-sensor", "--tier", "medium", "--command", "echo medium"],
      { encoding: "utf8" }
    );
    assert.equal(addTier.status, 0, addTier.stderr || addTier.stdout);
    const sensorsTier = JSON.parse(await readFile(path.join(onRoot, ".plan-build-qa/sensors.json"), "utf8"));
    const tierOnly = sensorsTier.sensors.find((s) => s.name === "tier-only-sensor");
    assert.ok(tierOnly, "sensor com --tier deve ser cadastrado");
    assert.deepEqual(tierOnly.on, ["close"], "tier medium deve derivar on:[close]");
    assert.equal(tierOnly.tier, "medium", "tier deve ser preservado como cosmético");

    // --tier fast → on:["commit","close"]
    const addFast = spawnSync(
      process.execPath,
      [cli, "sensor", "add", onRoot, "--name", "fast-tier-sensor", "--tier", "fast", "--command", "echo fast"],
      { encoding: "utf8" }
    );
    assert.equal(addFast.status, 0, addFast.stderr || addFast.stdout);
    const sensorsFast = JSON.parse(await readFile(path.join(onRoot, ".plan-build-qa/sensors.json"), "utf8"));
    const fastTier = sensorsFast.sensors.find((s) => s.name === "fast-tier-sensor");
    assert.deepEqual(fastTier.on, ["commit", "close"], "tier fast deve derivar on:[commit,close]");

    // evidência real: AC4
    const closeOn = spawnSync(
      process.execPath,
      [cli, "package", "close", onRoot, "--spec", "spec-on-test", "--package", "1", "--tiers", "fast"],
      { encoding: "utf8" }
    );
    // fast-tier-sensor (tier:fast) e explicit-on-sensor (sem tier) passam (echo retorna 0) → Score 1
    assert.equal(closeOn.status, 0, closeOn.stderr || closeOn.stdout);
    const evalOn = await readFile(path.join(onRoot, ".plan-build-qa/specs/spec-on-test/evaluations/package-1.md"), "utf8");
    assert.doesNotMatch(evalOn, /fast-tier-sensor.*Executado em \d{4}/, "evidencia nao deve ser apenas timestamp");
  } finally {
    await rm(onRoot, { recursive: true, force: true });
  }

  // spec-019 package-2: pbq guard + hooks
  const guardRoot = await mkdtemp(path.join(tmpdir(), "pbq-guard-"));
  try {
    const initGuard = spawnSync(process.execPath, [cli, "init", guardRoot], { encoding: "utf8" });
    assert.equal(initGuard.status, 0, initGuard.stderr || initGuard.stdout);

    // Add failing sensor with on:commit
    const addFailing = spawnSync(
      process.execPath,
      [cli, "sensor", "add", guardRoot, "--name", "failing-commit", "--on", "commit", "--command", "exit 1"],
      { encoding: "utf8" }
    );
    assert.equal(addFailing.status, 0, addFailing.stderr || addFailing.stdout);

    // AC1: advisory (no active spec with blocking) → exit 0 even with failing sensor
    const guardAdvisory = spawnSync(
      process.execPath, [cli, "guard", "--event", "commit", guardRoot], { encoding: "utf8" }
    );
    assert.equal(guardAdvisory.status, 0, "AC1: advisory guard deve ter exit 0 mesmo com sensor falhado");
    assert.match(guardAdvisory.stdout, /failing-commit/, "AC1: output deve mencionar o sensor");

    // AC3: 0 specs em andamento → advisory
    const guardZeroSpecs = spawnSync(
      process.execPath, [cli, "guard", "--event", "commit", guardRoot], { encoding: "utf8" }
    );
    assert.equal(guardZeroSpecs.status, 0, "AC3: 0 specs ativas → advisory exit 0");

    // Setup: add spec with Enforcement: blocking to roadmap and spec.md
    await mkdir(path.join(guardRoot, ".plan-build-qa/specs/spec-099-block-test/contracts"), { recursive: true });
    await writeFile(
      path.join(guardRoot, ".plan-build-qa/roadmap.md"),
      `# Roadmap\n\n## Specs\n\n| Spec | Status | Package Atual | Ultima Atualizacao | Evidencia | Proxima Acao |\n| --- | --- | --- | --- | --- | --- |\n| spec-099-block-test | em andamento | 1 | 2026-05-30 | - | - |\n`
    );
    await writeFile(
      path.join(guardRoot, ".plan-build-qa/specs/spec-099-block-test/spec.md"),
      "# Spec: spec-099-block-test\n\nEnforcement: blocking\n"
    );
    await writeFile(
      path.join(guardRoot, ".plan-build-qa/specs/spec-099-block-test/progress.md"),
      "# Progress\n\n## Package Atual\n\nPackage 1\n\n## Packages Concluidos\n\nNenhum.\n"
    );
    await writeFile(
      path.join(guardRoot, ".plan-build-qa/specs/spec-099-block-test/contracts/package-1.md"),
      "# Contract: Package 1\n"
    );

    // AC2: blocking + sensor falhado → exit 1
    const guardBlocking = spawnSync(
      process.execPath, [cli, "guard", "--event", "commit", guardRoot], { encoding: "utf8" }
    );
    assert.equal(guardBlocking.status, 1, "AC2: blocking guard com sensor falhado deve ter exit 1");

    // AC4: >1 spec em andamento → advisory
    await mkdir(path.join(guardRoot, ".plan-build-qa/specs/spec-098-block-test2/contracts"), { recursive: true });
    await writeFile(
      path.join(guardRoot, ".plan-build-qa/roadmap.md"),
      `# Roadmap\n\n## Specs\n\n| Spec | Status | Package Atual | Ultima Atualizacao | Evidencia | Proxima Acao |\n| --- | --- | --- | --- | --- | --- |\n| spec-099-block-test | em andamento | 1 | 2026-05-30 | - | - |\n| spec-098-block-test2 | em andamento | 1 | 2026-05-30 | - | - |\n`
    );
    await writeFile(path.join(guardRoot, ".plan-build-qa/specs/spec-098-block-test2/progress.md"), "# Progress\n\n## Package Atual\n\nPackage 1\n\n## Packages Concluidos\n\nNenhum.\n");
    await writeFile(path.join(guardRoot, ".plan-build-qa/specs/spec-098-block-test2/contracts/package-1.md"), "# Contract: Package 1\n");
    const guardMultiSpec = spawnSync(
      process.execPath, [cli, "guard", "--event", "commit", guardRoot], { encoding: "utf8" }
    );
    assert.equal(guardMultiSpec.status, 0, "AC4: >1 spec ativa → advisory exit 0");

    // AC5: edit event with harness path → runs analyze
    const guardEdit = spawnSync(
      process.execPath,
      [cli, "guard", "--event", "edit", guardRoot, "--path", ".plan-build-qa/roadmap.md"],
      { encoding: "utf8" }
    );
    assert.equal(guardEdit.status, 0, "AC5: guard edit exit code");
    assert.match(guardEdit.stdout, /\[pbq\] Analyze/, "AC5: guard edit deve rodar analyze");

    // AC6: pbq hooks status runs without error
    const hooksStatus = spawnSync(
      process.execPath, [cli, "hooks", "status", guardRoot], { encoding: "utf8" }
    );
    assert.equal(hooksStatus.status, 0, "AC6: pbq hooks status deve rodar sem erro");
    assert.match(hooksStatus.stdout, /hooks status/, "AC6: output legivel");

    // AC7: pbq update gera .plan-build-qa/harness/hooks/pre-commit
    assert.ok(
      existsSync(path.join(guardRoot, ".plan-build-qa/harness/hooks/pre-commit")),
      "AC7: pre-commit hook deve existir apos init"
    );
    assert.ok(
      existsSync(path.join(guardRoot, ".plan-build-qa/harness/hooks/pre-commit.ps1")),
      "AC7: pre-commit.ps1 hook deve existir apos init"
    );
    const preCommitContent = await readFile(path.join(guardRoot, ".plan-build-qa/harness/hooks/pre-commit"), "utf8");
    assert.match(preCommitContent, /pbq guard --event commit/, "AC7: pre-commit deve chamar pbq guard");

    // AC8: pbq update mescla PostToolUse em settings.json preservando hooks existentes
    const existingHook = {
      hooks: {
        PostToolUse: [
          { matcher: "Bash", hooks: [{ type: "command", command: "echo existing-hook" }] }
        ]
      }
    };
    await mkdir(path.join(guardRoot, ".claude"), { recursive: true });
    await writeFile(
      path.join(guardRoot, ".claude/settings.json"),
      JSON.stringify(existingHook, null, 2) + "\n"
    );
    const updateHook = spawnSync(process.execPath, [cli, "update", guardRoot], { encoding: "utf8" });
    assert.equal(updateHook.status, 0, "AC8: pbq update deve rodar sem erro");
    const settingsAfter = JSON.parse(await readFile(path.join(guardRoot, ".claude/settings.json"), "utf8"));
    assert.ok(
      settingsAfter.hooks.PostToolUse.some((e) => e.hooks?.some((h) => h.command === "echo existing-hook")),
      "AC8: hook existente deve ser preservado"
    );
    assert.ok(
      settingsAfter.hooks.PostToolUse.some((e) => e.hooks?.some((h) => h.command === "pbq guard --event edit")),
      "AC8: novo hook pbq guard deve ser adicionado"
    );
    // Run update again — idempotent (no duplicate hook)
    const updateHook2 = spawnSync(process.execPath, [cli, "update", guardRoot], { encoding: "utf8" });
    assert.equal(updateHook2.status, 0, "AC8: segundo update deve rodar sem erro");
    const settingsAfter2 = JSON.parse(await readFile(path.join(guardRoot, ".claude/settings.json"), "utf8"));
    const guardHooks = settingsAfter2.hooks.PostToolUse.filter((e) =>
      e.hooks?.some((h) => h.command === "pbq guard --event edit")
    );
    assert.equal(guardHooks.length, 1, "AC8: hook nao deve ser duplicado em update idempotente");
  } finally {
    await rm(guardRoot, { recursive: true, force: true });
  }

  // spec-019 package-1: migração v1→v2 via pbq update (AC5)
  const migrateRoot = await mkdtemp(path.join(tmpdir(), "pbq-migrate-v1-"));
  try {
    const initMigrate = spawnSync(process.execPath, [cli, "init", migrateRoot], { encoding: "utf8" });
    assert.equal(initMigrate.status, 0, initMigrate.stderr || initMigrate.stdout);
    // overwrite com sensors.json v1 (sem campo on)
    await writeFile(
      path.join(migrateRoot, ".plan-build-qa/sensors.json"),
      JSON.stringify({
        version: 1,
        sensors: [
          { name: "build-core", tier: "medium", command: "echo build", enabled: true },
          { name: "lint-fast", tier: "fast", command: "echo lint", enabled: true }
        ]
      }, null, 2)
    );
    const updateMigrate = spawnSync(process.execPath, [cli, "update", migrateRoot], { encoding: "utf8" });
    assert.equal(updateMigrate.status, 0, updateMigrate.stderr || updateMigrate.stdout);
    const migrated = JSON.parse(await readFile(path.join(migrateRoot, ".plan-build-qa/sensors.json"), "utf8"));
    assert.equal(migrated.version, 2, "sensors.json deve ter version 2 apos pbq update");
    const buildCore = migrated.sensors.find((s) => s.name === "build-core");
    assert.deepEqual(buildCore.on, ["close"], "sensor medium deve ter on:[close] apos migracao");
    const lintFast = migrated.sensors.find((s) => s.name === "lint-fast");
    assert.deepEqual(lintFast.on, ["commit", "close"], "sensor fast deve ter on:[commit,close] apos migracao");
  } finally {
    await rm(migrateRoot, { recursive: true, force: true });
  }

  const migratePhaseStringRoot = await mkdtemp(path.join(tmpdir(), "pbq-migrate-phase-string-"));
  try {
    const initPhaseString = spawnSync(process.execPath, [cli, "init", migratePhaseStringRoot], { encoding: "utf8" });
    assert.equal(initPhaseString.status, 0, initPhaseString.stderr || initPhaseString.stdout);
    await writeFile(
      path.join(migratePhaseStringRoot, ".plan-build-qa/sensors.json"),
      JSON.stringify(
        {
          version: 1,
          sensors: [
            { name: "preflight-docs", tier: "medium", phase: "before,after", command: "echo docs", enabled: true }
          ]
        },
        null,
        2
      )
    );
    const updatePhaseString = spawnSync(process.execPath, [cli, "update", migratePhaseStringRoot], { encoding: "utf8" });
    assert.equal(updatePhaseString.status, 0, updatePhaseString.stderr || updatePhaseString.stdout);
    const migratedPhaseString = JSON.parse(await readFile(path.join(migratePhaseStringRoot, ".plan-build-qa/sensors.json"), "utf8"));
    const sensor = migratedPhaseString.sensors.find((s) => s.name === "preflight-docs");
    assert.deepEqual(sensor.phase, ["before", "after"], "phase string deve normalizar para array");
    assert.deepEqual(sensor.on, ["edit", "close"], "phase string deve gerar on coerente");
  } finally {
    await rm(migratePhaseStringRoot, { recursive: true, force: true });
  }

  // spec-025 package-1: sensor scope local/global foundation
  const scopeRoot = await mkdtemp(path.join(tmpdir(), "pbq-sensor-scope-"));
  try {
    const initScope = spawnSync(process.execPath, [cli, "init", scopeRoot], { encoding: "utf8" });
    assert.equal(initScope.status, 0, initScope.stderr || initScope.stdout);

    await writeFile(
      path.join(scopeRoot, ".plan-build-qa/sensors.json"),
      JSON.stringify(
        {
          version: 2,
          sensors: [
            { name: "legacy-global", tier: "fast", command: "echo legacy", enabled: true, on: ["close"] },
            { name: "explicit-global", scope: "global", tier: "medium", command: "echo explicit", enabled: true, on: ["close"] }
          ]
        },
        null,
        2
      )
    );
    await mkdir(path.join(scopeRoot, ".plan-build-qa/specs/spec-025-scope/contracts"), { recursive: true });
    await writeFile(
      path.join(scopeRoot, ".plan-build-qa/roadmap.md"),
      `# Roadmap

| Spec | Status | Package Atual | Ultima Atualizacao | Evidencia | Proxima Acao |
| --- | --- | --- | --- | --- | --- |
| spec-025-scope | em andamento | 1 | 2026-06-28 | teste | implementar |
`
    );
    await writeFile(
      path.join(scopeRoot, ".plan-build-qa/specs/spec-025-scope/spec.md"),
      `# Spec: spec-025-scope

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Scope | planejado | legacy-global, explicit-global, local-check |
`
    );
    await writeFile(
      path.join(scopeRoot, ".plan-build-qa/specs/spec-025-scope/progress.md"),
      "# Progress\n\n## Package Atual\n\nPackage 1\n\n## Packages Concluidos\n\n_(nenhum)_\n"
    );
    await writeFile(
      path.join(scopeRoot, ".plan-build-qa/specs/spec-025-scope/contracts/package-1.md"),
      `# Contract: Package 1

## Sensores Obrigatorios

| Sensor | Scope | Tier | Comando | Motivo |
| --- | --- | --- | --- | --- |
| legacy-global | global | fast |  | referencia global sem scope no registry |
| explicit-global | global | medium | echo explicit | referencia global explicita |
| local-check | local | fast | echo local | sensor local inline |
| local-sem-comando | local | fast |  | invalido como local executavel |

## Rollback

Reverter fixture.
`
    );

    const dashboardScope = spawnSync(process.execPath, [cli, "dashboard", scopeRoot, "--json"], { encoding: "utf8" });
    assert.equal(dashboardScope.status, 0, dashboardScope.stderr || dashboardScope.stdout);
    const scopeData = JSON.parse(dashboardScope.stdout);
    const legacyGlobal = scopeData.sensors.find((sensor) => sensor.name === "legacy-global");
    const explicitGlobal = scopeData.sensors.find((sensor) => sensor.name === "explicit-global");
    assert.equal(legacyGlobal.scope, "global", "AC1: sensor sem scope deve normalizar para global em memoria");
    assert.equal(explicitGlobal.scope, "global", "AC2: sensor com scope global deve continuar aceito");

    const packageOne = scopeData.specs.find((spec) => spec.name === "spec-025-scope").packages.find((pkg) => pkg.number === 1);
    const legacyRequired = packageOne.requiredSensors.find((sensor) => sensor.name === "legacy-global");
    const localRequired = packageOne.requiredSensors.find((sensor) => sensor.name === "local-check");
    const legacyLocal = packageOne.requiredSensors.find((sensor) => sensor.name === "local-sem-comando");
    assert.equal(legacyRequired.scope, "global", "AC4: contrato legado/global deve continuar como referencia global");
    assert.equal(legacyRequired.registered, true, "AC4: referencia global registrada deve ser reconhecida");
    assert.equal(localRequired.scope, "local", "AC3: sensor local deve preservar scope");
    assert.equal(localRequired.local, true, "AC3: sensor local com comando deve ser classificado como local executavel futuramente");
    assert.equal(localRequired.command, "echo local", "AC3: comando local deve ser parseado");
    assert.equal(localRequired.tier, "fast", "AC3: tier local deve ser parseado");
    assert.equal(legacyLocal.scope, "local", "AC5: linha local sem comando preserva escopo declarado");
    assert.equal(legacyLocal.local, false, "AC5: linha local sem comando nao deve virar local valido");
  } finally {
    await rm(scopeRoot, { recursive: true, force: true });
  }

  // spec-025 package-2: package close executes contract-required global and local sensors
  const packageScopeRoot = await mkdtemp(path.join(tmpdir(), "pbq-package-scope-"));
  try {
    const initPackageScope = spawnSync(process.execPath, [cli, "init", packageScopeRoot], { encoding: "utf8" });
    assert.equal(initPackageScope.status, 0, initPackageScope.stderr || initPackageScope.stdout);

    const packageScopeSensorsPath = path.join(packageScopeRoot, ".plan-build-qa/sensors.json");
    await writeFile(
      packageScopeSensorsPath,
      JSON.stringify(
        {
          version: 2,
          sensors: [
            { name: "selected-global", tier: "fast", command: "node -e \"console.log('selected-ok')\"", enabled: true, on: ["close"] },
            { name: "required-commit", tier: "slow", command: "node -e \"console.log('required-ok')\"", enabled: true, on: ["commit"] }
          ]
        },
        null,
        2
      )
    );
    const packageScopeSensorsBefore = await readFile(packageScopeSensorsPath, "utf8");
    await mkdir(path.join(packageScopeRoot, ".plan-build-qa/specs/spec-025-package-scope/contracts"), { recursive: true });

    await writeFile(
      path.join(packageScopeRoot, ".plan-build-qa/specs/spec-025-package-scope/contracts/package-1.md"),
      `# Contract: Package 1

## Sensores Obrigatorios

| Sensor | Scope | Tier | Comando |
| --- | --- | --- | --- |
| selected-global | global | fast |  |
| required-commit | global | slow |  |
| local-ok | local | fast | node -e "console.log('local-ok')" |
`
    );
    const closeScopeOk = spawnSync(
      process.execPath,
      [cli, "package", "close", packageScopeRoot, "--spec", "spec-025-package-scope", "--package", "1", "--tiers", "fast"],
      { encoding: "utf8" }
    );
    assert.equal(closeScopeOk.status, 0, closeScopeOk.stderr || closeScopeOk.stdout);
    const evalScopeOk = await readFile(path.join(packageScopeRoot, ".plan-build-qa/specs/spec-025-package-scope/evaluations/package-1.md"), "utf8");
    assert.match(evalScopeOk, /Score: 1/, "AC2: sensor local ok deve permitir Score 1");
    assert.match(evalScopeOk, /required-commit[\s\S]*passou/, "AC1: sensor global obrigatorio fora do filtro deve executar");
    assert.match(evalScopeOk, /local-ok[\s\S]*passou[\s\S]*local-ok/, "AC2: sensor local inline deve executar e registrar evidencia");
    assert.equal((evalScopeOk.match(/selected-global/g) || []).length, 1, "AC6: sensor selecionado e obrigatorio deve aparecer uma vez");
    assert.equal(await readFile(packageScopeSensorsPath, "utf8"), packageScopeSensorsBefore, "AC8: sensor local nao deve persistir em sensors.json");

    await writeFile(
      path.join(packageScopeRoot, ".plan-build-qa/specs/spec-025-package-scope/contracts/package-2.md"),
      `# Contract: Package 2

## Sensores Obrigatorios

| Sensor | Scope | Tier | Comando |
| --- | --- | --- | --- |
| local-fail | local | fast | node -e "process.exit(1)" |
`
    );
    const closeLocalFail = spawnSync(
      process.execPath,
      [cli, "package", "close", packageScopeRoot, "--spec", "spec-025-package-scope", "--package", "2", "--tiers", "fast"],
      { encoding: "utf8" }
    );
    assert.equal(closeLocalFail.status, 1, "AC3: sensor local falho deve retornar exit 1");
    const evalLocalFail = await readFile(path.join(packageScopeRoot, ".plan-build-qa/specs/spec-025-package-scope/evaluations/package-2.md"), "utf8");
    assert.match(evalLocalFail, /Score: 0/, "AC3: sensor local falho deve gerar Score 0");
    assert.match(evalLocalFail, /local-fail[\s\S]*falhou/, "AC3: sensor local falho deve aparecer como falhou");

    await writeFile(
      path.join(packageScopeRoot, ".plan-build-qa/specs/spec-025-package-scope/contracts/package-3.md"),
      `# Contract: Package 3

## Sensores Obrigatorios

| Sensor | Scope | Tier | Comando |
| --- | --- | --- | --- |
| local-sem-comando | local | fast |  |
`
    );
    const closeLocalPending = spawnSync(
      process.execPath,
      [cli, "package", "close", packageScopeRoot, "--spec", "spec-025-package-scope", "--package", "3", "--tiers", "fast"],
      { encoding: "utf8" }
    );
    assert.equal(closeLocalPending.status, 1, "AC4: sensor local sem comando deve retornar exit 1");
    const evalLocalPending = await readFile(path.join(packageScopeRoot, ".plan-build-qa/specs/spec-025-package-scope/evaluations/package-3.md"), "utf8");
    assert.match(evalLocalPending, /Score: 0/, "AC4: sensor local sem comando deve gerar Score 0");
    assert.match(evalLocalPending, /local-sem-comando[\s\S]*pendente/, "AC4: sensor local sem comando deve aparecer como pendente");

    await writeFile(
      path.join(packageScopeRoot, ".plan-build-qa/specs/spec-025-package-scope/contracts/package-4.md"),
      `# Contract: Package 4

## Sensores Obrigatorios

| Sensor | Scope | Tier | Comando |
| --- | --- | --- | --- |
| missing-global | global | fast |  |
`
    );
    const closeMissingGlobal = spawnSync(
      process.execPath,
      [cli, "package", "close", packageScopeRoot, "--spec", "spec-025-package-scope", "--package", "4", "--tiers", "fast"],
      { encoding: "utf8" }
    );
    assert.equal(closeMissingGlobal.status, 1, "AC5: sensor global ausente deve retornar exit 1");
    const evalMissingGlobal = await readFile(path.join(packageScopeRoot, ".plan-build-qa/specs/spec-025-package-scope/evaluations/package-4.md"), "utf8");
    assert.match(evalMissingGlobal, /Score: 0/, "AC5: sensor global ausente deve gerar Score 0");
    assert.match(evalMissingGlobal, /missing-global[\s\S]*pendente/, "AC5: sensor global ausente deve aparecer como pendente");

    await writeFile(
      path.join(packageScopeRoot, ".plan-build-qa/specs/spec-025-package-scope/contracts/package-5.md"),
      `# Contract: Package 5

## Objetivo

Sem secao de sensores obrigatorios.
`
    );
    const closeNoRequired = spawnSync(
      process.execPath,
      [cli, "package", "close", packageScopeRoot, "--spec", "spec-025-package-scope", "--package", "5", "--tiers", "fast"],
      { encoding: "utf8" }
    );
    assert.equal(closeNoRequired.status, 0, closeNoRequired.stderr || closeNoRequired.stdout);
    const evalNoRequired = await readFile(path.join(packageScopeRoot, ".plan-build-qa/specs/spec-025-package-scope/evaluations/package-5.md"), "utf8");
    assert.match(evalNoRequired, /selected-global/, "AC7: sem secao obrigatoria deve rodar selecionados por tier/evento");
    assert.doesNotMatch(evalNoRequired, /required-commit/, "AC7: sem secao obrigatoria nao deve incluir sensor fora do filtro");
  } finally {
    await rm(packageScopeRoot, { recursive: true, force: true });
  }

  // spec-025 package-3: sensor add/list --scope and analyze local/global validation
  const sensorCliScopeRoot = await mkdtemp(path.join(tmpdir(), "pbq-sensor-cli-scope-"));
  try {
    const initSensorCliScope = spawnSync(process.execPath, [cli, "init", sensorCliScopeRoot], { encoding: "utf8" });
    assert.equal(initSensorCliScope.status, 0, initSensorCliScope.stderr || initSensorCliScope.stdout);
    const sensorCliScopePath = path.join(sensorCliScopeRoot, ".plan-build-qa/sensors.json");

    const addGlobalScope = spawnSync(
      process.execPath,
      [cli, "sensor", "add", sensorCliScopeRoot, "--name", "scoped-global", "--scope", "global", "--tier", "fast", "--command", "node -e \"console.log('scope')\""],
      { encoding: "utf8" }
    );
    assert.equal(addGlobalScope.status, 0, addGlobalScope.stderr || addGlobalScope.stdout);
    let sensorCliScopeData = JSON.parse(await readFile(sensorCliScopePath, "utf8"));
    assert.equal(
      sensorCliScopeData.sensors.find((sensor) => sensor.name === "scoped-global").scope,
      "global",
      "AC1: sensor add --scope global deve persistir scope global"
    );

    const addDefaultScope = spawnSync(
      process.execPath,
      [cli, "sensor", "add", sensorCliScopeRoot, "--name", "default-global", "--tier", "fast", "--command", "node -e \"console.log('default')\""],
      { encoding: "utf8" }
    );
    assert.equal(addDefaultScope.status, 0, addDefaultScope.stderr || addDefaultScope.stdout);
    sensorCliScopeData = JSON.parse(await readFile(sensorCliScopePath, "utf8"));
    assert.equal(
      sensorCliScopeData.sensors.find((sensor) => sensor.name === "default-global").scope,
      "global",
      "AC2: sensor add sem --scope deve persistir como global"
    );

    const beforeLocalReject = await readFile(sensorCliScopePath, "utf8");
    const addLocalScope = spawnSync(
      process.execPath,
      [cli, "sensor", "add", sensorCliScopeRoot, "--name", "local-registry", "--scope", "local", "--tier", "fast", "--command", "echo local"],
      { encoding: "utf8" }
    );
    assert.notEqual(addLocalScope.status, 0, "AC3: sensor add --scope local deve falhar");
    assert.match(addLocalScope.stderr + addLocalScope.stdout, /Sensores locais devem ser declarados no contrato/, "AC3: rejeicao local deve orientar contrato");
    assert.equal(await readFile(sensorCliScopePath, "utf8"), beforeLocalReject, "AC3: rejeicao local nao deve alterar sensors.json");

    const addPackageScope = spawnSync(
      process.execPath,
      [cli, "sensor", "add", sensorCliScopeRoot, "--name", "package-registry", "--scope", "package", "--tier", "fast", "--command", "echo package"],
      { encoding: "utf8" }
    );
    assert.notEqual(addPackageScope.status, 0, "AC3: sensor add --scope package deve falhar");
    assert.match(addPackageScope.stderr + addPackageScope.stdout, /Sensores locais devem ser declarados no contrato/, "AC3: rejeicao package deve orientar contrato");
    assert.equal(await readFile(sensorCliScopePath, "utf8"), beforeLocalReject, "AC3: rejeicao package nao deve alterar sensors.json");

    const listScope = spawnSync(process.execPath, [cli, "sensor", "list", sensorCliScopeRoot], { encoding: "utf8" });
    assert.equal(listScope.status, 0, listScope.stderr || listScope.stdout);
    assert.match(listScope.stdout, /enabled\tglobal\tfast\tscoped-global/, "AC4: sensor list deve mostrar scope global");
    assert.match(listScope.stdout, /enabled\tglobal\tfast\tdefault-global/, "AC4: sensor list deve mostrar default global");
  } finally {
    await rm(sensorCliScopeRoot, { recursive: true, force: true });
  }

  const analyzeLocalOkRoot = await mkdtemp(path.join(tmpdir(), "pbq-analyze-local-ok-"));
  try {
    const initAnalyzeLocalOk = spawnSync(process.execPath, [cli, "init", analyzeLocalOkRoot], { encoding: "utf8" });
    assert.equal(initAnalyzeLocalOk.status, 0, initAnalyzeLocalOk.stderr || initAnalyzeLocalOk.stdout);
    await mkdir(path.join(analyzeLocalOkRoot, ".plan-build-qa/specs/spec-025-local-ok/contracts"), { recursive: true });
    await writeFile(
      path.join(analyzeLocalOkRoot, ".plan-build-qa/roadmap.md"),
      `# Roadmap

| Spec | Status | Package Atual | Ultima Atualizacao | Evidencia | Proxima Acao |
| --- | --- | --- | --- | --- | --- |
| spec-025-local-ok | em andamento | 1 | 2026-06-28 | teste | validar |
`
    );
    await writeFile(
      path.join(analyzeLocalOkRoot, ".plan-build-qa/specs/spec-025-local-ok/spec.md"),
      `# Spec: spec-025-local-ok

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Local ok | planejado | local-ok |
`
    );
    await writeFile(
      path.join(analyzeLocalOkRoot, ".plan-build-qa/specs/spec-025-local-ok/progress.md"),
      "# Progress\n\n## Package Atual\n\nPackage 1\n\n## Packages Concluidos\n\n_(nenhum)_\n"
    );
    await writeFile(
      path.join(analyzeLocalOkRoot, ".plan-build-qa/specs/spec-025-local-ok/contracts/package-1.md"),
      `# Contract: Package 1

## Sensores Obrigatorios

| Sensor | Scope | Tier | Comando |
| --- | --- | --- | --- |
| local-ok | local | fast | node -e "console.log('ok')" |
`
    );
    const analyzeLocalOk = spawnSync(process.execPath, [cli, "analyze", analyzeLocalOkRoot], { encoding: "utf8" });
    assert.equal(analyzeLocalOk.status, 0, analyzeLocalOk.stderr || analyzeLocalOk.stdout);
    assert.doesNotMatch(analyzeLocalOk.stdout + analyzeLocalOk.stderr, /local-ok" nao cadastrado em sensors\.json/, "AC5: local com comando nao deve exigir registry global");
  } finally {
    await rm(analyzeLocalOkRoot, { recursive: true, force: true });
  }

  const analyzeLocalMissingRoot = await mkdtemp(path.join(tmpdir(), "pbq-analyze-local-missing-"));
  try {
    const initAnalyzeLocalMissing = spawnSync(process.execPath, [cli, "init", analyzeLocalMissingRoot], { encoding: "utf8" });
    assert.equal(initAnalyzeLocalMissing.status, 0, initAnalyzeLocalMissing.stderr || initAnalyzeLocalMissing.stdout);
    await mkdir(path.join(analyzeLocalMissingRoot, ".plan-build-qa/specs/spec-025-local-missing/contracts"), { recursive: true });
    await writeFile(
      path.join(analyzeLocalMissingRoot, ".plan-build-qa/roadmap.md"),
      `# Roadmap

| Spec | Status | Package Atual | Ultima Atualizacao | Evidencia | Proxima Acao |
| --- | --- | --- | --- | --- | --- |
| spec-025-local-missing | em andamento | 1 | 2026-06-28 | teste | validar |
`
    );
    await writeFile(
      path.join(analyzeLocalMissingRoot, ".plan-build-qa/specs/spec-025-local-missing/spec.md"),
      `# Spec: spec-025-local-missing

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Local missing | planejado | local-missing-command |
`
    );
    await writeFile(
      path.join(analyzeLocalMissingRoot, ".plan-build-qa/specs/spec-025-local-missing/progress.md"),
      "# Progress\n\n## Package Atual\n\nPackage 1\n\n## Packages Concluidos\n\n_(nenhum)_\n"
    );
    await writeFile(
      path.join(analyzeLocalMissingRoot, ".plan-build-qa/specs/spec-025-local-missing/contracts/package-1.md"),
      `# Contract: Package 1

## Sensores Obrigatorios

| Sensor | Scope | Tier | Comando |
| --- | --- | --- | --- |
| local-missing-command | local | fast |  |
`
    );
    const analyzeLocalMissing = spawnSync(process.execPath, [cli, "analyze", analyzeLocalMissingRoot], { encoding: "utf8" });
    assert.notEqual(analyzeLocalMissing.status, 0, "AC6: local sem comando deve falhar no analyze");
    assert.match(
      analyzeLocalMissing.stdout + analyzeLocalMissing.stderr,
      /sensor local obrigatorio "local-missing-command" sem comando no contrato/,
      "AC6: local sem comando deve ter diagnostico proprio"
    );
  } finally {
    await rm(analyzeLocalMissingRoot, { recursive: true, force: true });
  }

  const analyzeGlobalMissingRoot = await mkdtemp(path.join(tmpdir(), "pbq-analyze-global-missing-"));
  try {
    const initAnalyzeGlobalMissing = spawnSync(process.execPath, [cli, "init", analyzeGlobalMissingRoot], { encoding: "utf8" });
    assert.equal(initAnalyzeGlobalMissing.status, 0, initAnalyzeGlobalMissing.stderr || initAnalyzeGlobalMissing.stdout);
    await mkdir(path.join(analyzeGlobalMissingRoot, ".plan-build-qa/specs/spec-025-global-missing/contracts"), { recursive: true });
    await writeFile(
      path.join(analyzeGlobalMissingRoot, ".plan-build-qa/roadmap.md"),
      `# Roadmap

| Spec | Status | Package Atual | Ultima Atualizacao | Evidencia | Proxima Acao |
| --- | --- | --- | --- | --- | --- |
| spec-025-global-missing | em andamento | 1 | 2026-06-28 | teste | validar |
`
    );
    await writeFile(
      path.join(analyzeGlobalMissingRoot, ".plan-build-qa/specs/spec-025-global-missing/spec.md"),
      `# Spec: spec-025-global-missing

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Global missing | planejado | missing-global |
`
    );
    await writeFile(
      path.join(analyzeGlobalMissingRoot, ".plan-build-qa/specs/spec-025-global-missing/progress.md"),
      "# Progress\n\n## Package Atual\n\nPackage 1\n\n## Packages Concluidos\n\n_(nenhum)_\n"
    );
    await writeFile(
      path.join(analyzeGlobalMissingRoot, ".plan-build-qa/specs/spec-025-global-missing/contracts/package-1.md"),
      `# Contract: Package 1

## Sensores Obrigatorios

| Sensor | Scope | Tier | Comando |
| --- | --- | --- | --- |
| missing-global | global | fast |  |
`
    );
    const analyzeGlobalMissing = spawnSync(process.execPath, [cli, "analyze", analyzeGlobalMissingRoot], { encoding: "utf8" });
    assert.notEqual(analyzeGlobalMissing.status, 0, "AC7: global ausente deve continuar falhando");
    assert.match(
      analyzeGlobalMissing.stdout + analyzeGlobalMissing.stderr,
      /sensor obrigatorio "missing-global" nao cadastrado em sensors\.json/,
      "AC7: global ausente deve manter diagnostico existente"
    );
  } finally {
    await rm(analyzeGlobalMissingRoot, { recursive: true, force: true });
  }

  const analyzeLocalFailedRoot = await mkdtemp(path.join(tmpdir(), "pbq-analyze-local-failed-"));
  try {
    const initAnalyzeLocalFailed = spawnSync(process.execPath, [cli, "init", analyzeLocalFailedRoot], { encoding: "utf8" });
    assert.equal(initAnalyzeLocalFailed.status, 0, initAnalyzeLocalFailed.stderr || initAnalyzeLocalFailed.stdout);
    await mkdir(path.join(analyzeLocalFailedRoot, ".plan-build-qa/specs/spec-025-local-failed/contracts"), { recursive: true });
    await mkdir(path.join(analyzeLocalFailedRoot, ".plan-build-qa/specs/spec-025-local-failed/evaluations"), { recursive: true });
    await writeFile(
      path.join(analyzeLocalFailedRoot, ".plan-build-qa/roadmap.md"),
      `# Roadmap

| Spec | Status | Package Atual | Ultima Atualizacao | Evidencia | Proxima Acao |
| --- | --- | --- | --- | --- | --- |
| spec-025-local-failed | em andamento | 1 | 2026-06-28 | teste | validar |
`
    );
    await writeFile(
      path.join(analyzeLocalFailedRoot, ".plan-build-qa/specs/spec-025-local-failed/spec.md"),
      `# Spec: spec-025-local-failed

## Packages

| Package | Objetivo | Estado | Sensores |
| --- | --- | --- | --- |
| 1 | Local failed | planejado | local-fail |
`
    );
    await writeFile(
      path.join(analyzeLocalFailedRoot, ".plan-build-qa/specs/spec-025-local-failed/progress.md"),
      "# Progress\n\n## Package Atual\n\nPackage 1\n\n## Packages Concluidos\n\n- Package 1\n"
    );
    await writeFile(
      path.join(analyzeLocalFailedRoot, ".plan-build-qa/specs/spec-025-local-failed/contracts/package-1.md"),
      `# Contract: Package 1

## Sensores Obrigatorios

| Sensor | Scope | Tier | Comando |
| --- | --- | --- | --- |
| local-fail | local | fast | node -e "process.exit(1)" |
`
    );
    await writeFile(
      path.join(analyzeLocalFailedRoot, ".plan-build-qa/specs/spec-025-local-failed/evaluations/package-1.md"),
      `# Evaluation: Package 1

Score: 1

| Sensor | Tier | Obrigatorio | Status | Exit Code | Evidencia |
| --- | --- | --- | --- | --- | --- |
| local-fail | fast | sim | falhou | 1 | falhou |
`
    );
    const analyzeLocalFailed = spawnSync(process.execPath, [cli, "analyze", analyzeLocalFailedRoot], { encoding: "utf8" });
    assert.notEqual(analyzeLocalFailed.status, 0, "AC8: evaluation local falha deve violar enforcement");
    assert.match(
      analyzeLocalFailed.stdout + analyzeLocalFailed.stderr,
      /sensor obrigat.rio "local-fail" n.o passou na evaluation/,
      "AC8: enforcement por nome deve continuar para sensor local"
    );
  } finally {
    await rm(analyzeLocalFailedRoot, { recursive: true, force: true });
  }
} finally {
  await rm(root, { recursive: true, force: true });
}

async function waitFor(task, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      await task();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  await task();
}

async function onceExit(child) {
  if (child.exitCode !== null) return;
  await new Promise((resolve) => child.once("exit", resolve));
}
