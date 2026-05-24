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
    ".agents/skills/spec/SKILL.md",
    ".agents/skills/sensor/SKILL.md",
    ".agents/skills/roadmap/SKILL.md",
    ".agents/skills/constitution/SKILL.md",
    ".agents/skills/implement/SKILL.md",
    ".agents/skills/test/SKILL.md"
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

  const codexImplementSkill = await readFile(path.join(root, ".agents/skills/implement/SKILL.md"), "utf8");
  assert.match(codexImplementSkill, /pbq package close/);

  const claudeTestSkill = await readFile(path.join(root, ".claude/skills/test/SKILL.md"), "utf8");
  assert.match(claudeTestSkill, /NEVER.*missing sensor evidence as success/);

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
