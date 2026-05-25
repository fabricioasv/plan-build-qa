import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = await mkdtemp(path.join(tmpdir(), "pbq-init-"));

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
    ".plan-build-qa/roadmap.md",
    ".plan-build-qa/manifest.json",
    ".plan-build-qa/harness/prompts/implement-package.md",
    ".plan-build-qa/harness/prompts/validate-contract.md",
    ".plan-build-qa/harness/prompts/run-evaluation.md",
    ".plan-build-qa/specs/README.md",
    ".plan-build-qa/sensors.json",
    ".claude/skills/spec/SKILL.md",
    ".claude/skills/sensor/SKILL.md",
    ".claude/skills/roadmap/SKILL.md",
    ".claude/skills/constitution/SKILL.md",
    ".claude/skills/implement/SKILL.md",
    ".claude/skills/test/SKILL.md",
    ".claude/skills/analyze/SKILL.md",
    ".agents/skills/spec/SKILL.md",
    ".agents/skills/sensor/SKILL.md",
    ".agents/skills/roadmap/SKILL.md",
    ".agents/skills/constitution/SKILL.md",
    ".agents/skills/implement/SKILL.md",
    ".agents/skills/test/SKILL.md",
    ".agents/skills/analyze/SKILL.md"
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

  const analyzeInvalid = spawnSync(process.execPath, [cli, "analyze", root], {
    encoding: "utf8"
  });
  assert.equal(analyzeInvalid.status, 1, analyzeInvalid.stderr || analyzeInvalid.stdout);
  assert.match(analyzeInvalid.stdout, /Violations:/);
  assert.match(analyzeInvalid.stdout, /Nenhuma spec encontrada na tabela do roadmap/);

  const specSkill = await readFile(path.join(root, ".claude/skills/spec/SKILL.md"), "utf8");
  assert.match(specSkill, /roadmap\.md/);

  // spec-011 package-2: implement delega verificacao a test (nao roda pbq package close direto)
  const codexImplementSkill = await readFile(path.join(root, ".agents/skills/implement/SKILL.md"), "utf8");
  assert.doesNotMatch(codexImplementSkill, /pbq package close/, "implement skill deve delegar verificacao, nao citar pbq package close");
  assert.match(codexImplementSkill, /[Dd]elegate verification to the .test. skill/, "implement skill deve delegar a test");

  const claudeTestSkill = await readFile(path.join(root, ".claude/skills/test/SKILL.md"), "utf8");
  assert.match(claudeTestSkill, /NEVER.*missing sensor evidence as success/);
  // spec-011 package-2: test skill expoe os dois modos do gate independente
  assert.match(claudeTestSkill, /contract-check/, "test skill deve documentar o modo contract-check");
  assert.match(claudeTestSkill, /acceptance-check/, "test skill deve documentar o modo acceptance-check");

  // spec-014 package-3: sensor skill deve documentar fluxo recomendado e exemplos
  const claudeSensorSkill = await readFile(path.join(root, ".claude/skills/sensor/SKILL.md"), "utf8");
  assert.match(claudeSensorSkill, /pbq sensor suggest/, "claude sensor skill deve citar pbq sensor suggest");
  assert.match(claudeSensorSkill, /sonar|Makefile|scripts\//, "claude sensor skill deve citar exemplo concreto");
  assert.match(claudeSensorSkill, /non-zero exit code/, "claude sensor skill deve preservar regra de exit code");

  const codexSensorSkill = await readFile(path.join(root, ".agents/skills/sensor/SKILL.md"), "utf8");
  assert.match(codexSensorSkill, /pbq sensor suggest/, "codex sensor skill deve citar pbq sensor suggest");
  assert.match(codexSensorSkill, /sonar|Makefile|scripts\//, "codex sensor skill deve citar exemplo concreto");
  assert.match(codexSensorSkill, /non-zero exit code/, "codex sensor skill deve preservar regra de exit code");

  const cliDir = path.resolve(path.dirname(cli), "..");
  const templateSensorSkill = await readFile(path.join(cliDir, "templates/adapters/skills/sensor/SKILL.md"), "utf8");
  assert.match(templateSensorSkill, /pbq sensor suggest/, "template sensor skill deve citar pbq sensor suggest");
  assert.match(templateSensorSkill, /sonar|Makefile|scripts\//, "template sensor skill deve citar exemplo concreto");
  assert.match(templateSensorSkill, /non-zero exit code/, "template sensor skill deve preservar regra de exit code");

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

  const architecture = await readFile(path.join(root, ".plan-build-qa/constitution/architecture.md"), "utf8");
  assert.match(architecture, /Varredura Arquitetural Inicial/);
  assert.match(architecture, /Use a estrutura atual como evidencia/);
  assert.match(architecture, /NUNCA.*arquitetura atual/);

  const evaluationTemplate = await readFile(path.join(root, ".plan-build-qa/harness/templates/evaluation.md"), "utf8");
  assert.match(evaluationTemplate, /Resumo De Sensores/);
  assert.match(evaluationTemplate, /\| Sensor \| Tier \| Obrigatorio \| Status \| Comando \| Exit Code \| Evidencia \|/);

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
    assert.match(suggestPending.stdout, /--tier fast --command.*lint\.sh/);
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

  const closePackage = spawnSync(
    process.execPath,
    [cli, "package", "close", root, "--spec", "spec-001-smoke", "--package", "1", "--tiers", "fast"],
    { encoding: "utf8" }
  );
  assert.equal(closePackage.status, 0, closePackage.stderr || closePackage.stdout);

  const evaluation = await readFile(path.join(root, ".plan-build-qa/specs/spec-001-smoke/evaluations/package-1.md"), "utf8");
  assert.match(evaluation, /Score: 1/);
  assert.match(evaluation, /\| npm-run-lint \| fast \| sim \| passou \|/);

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
} finally {
  await rm(root, { recursive: true, force: true });
}
