#!/usr/bin/env node
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MARKER_START = "<!-- PBQ-HARNESS-START -->";
const MARKER_END = "<!-- PBQ-HARNESS-END -->";
const HARNESS_DIR = ".plan-build-qa";
const ADAPTER_SKILLS = ["spec", "sensor", "roadmap", "constitution", "implement", "test", "analyze", "bug"];
const PBQ_TEMPLATE_VERSION = 2;
const ALLOWED_SPEC_STATUS = new Set(["planejado", "em andamento", "bloqueado", "concluido", "cancelado"]);

const ALWAYS_REPLACE_FILES = new Set([`${HARNESS_DIR}/OVERVIEW.md`]);

const REQUIRED_FILES = [
  `${HARNESS_DIR}/constitution/architecture.md`,
  `${HARNESS_DIR}/constitution/testing.md`,
  `${HARNESS_DIR}/constitution/operations.md`,
  `${HARNESS_DIR}/constitution/repository-rules.md`,
  `${HARNESS_DIR}/harness/README.md`,
  `${HARNESS_DIR}/harness/prompts/implement-package.md`,
  `${HARNESS_DIR}/harness/prompts/validate-contract.md`,
  `${HARNESS_DIR}/harness/prompts/run-evaluation.md`,
  `${HARNESS_DIR}/harness/scripts/run-fast.ps1`,
  `${HARNESS_DIR}/harness/scripts/run-medium.ps1`,
  `${HARNESS_DIR}/harness/scripts/run-slow.ps1`,
  `${HARNESS_DIR}/harness/scripts/check-harness-structure.ps1`,
  `${HARNESS_DIR}/harness/scripts/run-fast.sh`,
  `${HARNESS_DIR}/harness/scripts/run-medium.sh`,
  `${HARNESS_DIR}/harness/scripts/run-slow.sh`,
  `${HARNESS_DIR}/harness/scripts/check-harness-structure.sh`,
  `${HARNESS_DIR}/harness/templates/spec.md`,
  `${HARNESS_DIR}/harness/templates/contract.md`,
  `${HARNESS_DIR}/harness/templates/progress.md`,
  `${HARNESS_DIR}/harness/templates/evaluation.md`,
  `${HARNESS_DIR}/harness/templates/bug.md`,
  `${HARNESS_DIR}/harness/templates/bug-progress.md`,
  `${HARNESS_DIR}/roadmap.md`,
  `${HARNESS_DIR}/specs/README.md`,
  `${HARNESS_DIR}/bugs/README.md`,
  `${HARNESS_DIR}/sensors.json`,
  `${HARNESS_DIR}/manifest.json`
];

main().catch((error) => {
  console.error(`[pbq] ${error.message}`);
  process.exitCode = 1;
});

async function main() {
  const args = process.argv.slice(2);
  const command = args.shift();

  if (!command || command === "--help" || command === "-h" || command === "help") {
    printHelp(args[0]);
    return;
  }

  if (command === "sensor") {
    await runSensorCommand(args);
    return;
  }

  if (command === "run" || command === "status" || command === "dashboard") {
    await runDashboardCommand(args);
    return;
  }

  if (command === "analyze") {
    await runAnalyzeCommand(args);
    return;
  }

  if (command === "package") {
    await runPackageCommand(args);
    return;
  }

  if (command === "update") {
    await runUpdateCommand(args);
    return;
  }

  if (command === "guard") {
    await runGuardCommand(args);
    return;
  }

  if (command === "hooks") {
    await runHooksCommand(args);
    return;
  }

  if (command !== "init") {
    throw new Error(`Comando desconhecido: ${command}`);
  }

  const options = parseInitArgs(args);
  const targetRoot = path.resolve(options.targetPath);
  await ensureDirectory(targetRoot);

  const project = await inspectProject(targetRoot);
  const generated = withManifest(await generateFiles(project));
  if (!options.integrateAgents) {
    for (const path of adapterSkillPaths()) delete generated[path];
  }
  const events = [];

  for (const [relativePath, content] of Object.entries(generated)) {
    const effectiveOptions = ALWAYS_REPLACE_FILES.has(relativePath) ? { ...options, force: true } : options;
    await writeManagedFile(targetRoot, relativePath, content, effectiveOptions, events);
  }

  if (options.integrateAgents) {
    await integrateAgentInstructions(targetRoot, project.agentInstructionFiles, options, events);
    await mergeGuardHookInSettings(targetRoot, options, events);
  }

  const catalog = await loadSensorCatalog();
  printSummary(targetRoot, project, events, options, catalog.length);
}

function parseInitArgs(args) {
  const options = {
    targetPath: ".",
    force: false,
    dryRun: false,
    integrateAgents: true
  };

  for (const arg of args) {
    if (arg === "--force") {
      options.force = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--no-agent-integration") {
      options.integrateAgents = false;
    } else if (arg.startsWith("--")) {
      throw new Error(`Opcao desconhecida: ${arg}`);
    } else {
      options.targetPath = arg;
    }
  }

  return options;
}

async function runSensorCommand(args) {
  const action = args.shift();
  if (action === "add") {
    if (args.includes("--from-catalog")) {
      await runSensorAddFromCatalog(args);
      return;
    }
    const options = parseSensorAddArgs(args);
    const targetRoot = path.resolve(options.targetPath);
    await ensureDirectory(targetRoot);
    const sensors = await readSensors(targetRoot);
    const nextSensor = {
      name: options.name,
      command: options.command,
      reason: options.reason || "Sensor adicionado manualmente",
      source: "manual",
      enabled: true
    };
    if (options.tier) nextSensor.tier = options.tier;
    if (options.on.length > 0) {
      nextSensor.on = options.on;
    } else if (options.phase) {
      nextSensor.on = legacyPhaseToOn(options.phase);
      nextSensor.phase = parsePhaseOption(options.phase);
    } else {
      nextSensor.on = legacyTierToOn(options.tier);
    }
    const index = sensors.findIndex((sensor) => sensor.name === nextSensor.name);
    if (index >= 0) sensors[index] = nextSensor;
    else sensors.push(nextSensor);

    await writeSensors(targetRoot, sensors);
    await regenerateSensorScripts(targetRoot, sensors);
    console.log(`[pbq] Sensor ${index >= 0 ? "updated" : "added"}: ${nextSensor.name} (${nextSensor.tier})`);
    return;
  }

  if (action === "catalog") {
    const targetRoot = path.resolve(args[0] || ".");
    const catalog = await loadSensorCatalog();
    if (catalog.length === 0) {
      console.log("[pbq] Catalogo vazio.");
      return;
    }
    let registered = new Set();
    try {
      registered = new Set((await readSensors(targetRoot)).map((sensor) => sensor.name));
    } catch {
      // harness not initialized; proceed without registered set
    }
    for (const entry of catalog) {
      const alreadyAdded = registered.has(entry.name);
      const envNote = entry.requiresEnv && entry.requiresEnv.length > 0 ? ` [requer: ${entry.requiresEnv.join(", ")}]` : "";
      const status = alreadyAdded ? "[cadastrado]" : entry.enabled === false ? "[disabled]" : "[disponivel]";
      console.log(`${status}\t${entry.tier}\t${entry.id}${envNote}\t${entry.reason}`);
    }
    return;
  }

  if (action === "list") {
    const targetRoot = path.resolve(args[0] || ".");
    const sensors = await readSensors(targetRoot);
    if (sensors.length === 0) {
      console.log("[pbq] Nenhum sensor cadastrado.");
      return;
    }
    for (const sensor of sensors) {
      const onStr = sensor.on ? sensor.on.join(",") : "(sem on)";
      console.log(`${sensor.enabled === false ? "disabled" : "enabled"}\t${sensor.tier || "-"}\t${sensor.name}\t${onStr}\t${sensor.command}`);
    }
    return;
  }

  if (action === "suggest") {
    const targetRoot = path.resolve(args[0] || ".");
    const project = await inspectProject(targetRoot);
    const existing = existsSync(path.join(targetRoot, HARNESS_DIR, "sensors.json"))
      ? new Set((await readSensors(targetRoot)).map((sensor) => sensor.command.trim()))
      : new Set();

    const pending = [];
    for (const tier of ["fast", "medium", "slow"]) {
      for (const item of project.commands[tier]) {
        if (existing.has(item.command.trim())) continue;
        pending.push({ tier, ...item });
      }
    }

    if (pending.length === 0) {
      console.log("[pbq] Nenhum candidato pendente.");
      return;
    }

    const targetArg = args[0] || ".";
    for (const candidate of pending.sort((a, b) => `${a.tier}-${a.command}`.localeCompare(`${b.tier}-${b.command}`))) {
      const name = sensorName(candidate.command);
      const reason = candidate.reason || "Sensor detectado";
      const onStr = legacyTierToOn(candidate.tier).join(",");
      console.log(
        `pbq sensor add ${targetArg} --name ${name} --on ${onStr} --command ${shellQuote(candidate.command)} --reason ${shellQuote(reason)}`
      );
    }
    return;
  }

  throw new Error("Uso: pbq sensor add [path] --name <name> --tier <fast|medium|slow> --command <command> [--reason <text>] | pbq sensor add --from-catalog <id> [path] | pbq sensor list [path] | pbq sensor suggest [path] | pbq sensor catalog [path]");
}

async function runSensorAddFromCatalog(args) {
  let catalogId = "";
  let targetPath = ".";
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--from-catalog") {
      catalogId = readOptionValue(args, ++index, "--from-catalog");
    } else if (arg.startsWith("--")) {
      throw new Error(`Opcao desconhecida: ${arg}`);
    } else {
      targetPath = arg;
    }
  }
  if (!catalogId) throw new Error("Informe --from-catalog <id>.");

  const catalog = await loadSensorCatalog();
  const entry = catalog.find((item) => item.id === catalogId);
  if (!entry) throw new Error(`Sensor "${catalogId}" nao encontrado no catalogo. Use 'pbq sensor catalog' para listar.`);

  const targetRoot = path.resolve(targetPath);
  await ensureDirectory(targetRoot);
  const sensors = await readSensors(targetRoot);

  const nextSensor = {
    name: entry.name,
    command: entry.command,
    reason: entry.reason,
    source: "catalog",
    enabled: entry.enabled !== undefined ? entry.enabled : true
  };
  if (entry.tier) nextSensor.tier = entry.tier;
  if (entry.requiresEnv && entry.requiresEnv.length > 0) {
    nextSensor.requiresEnv = entry.requiresEnv;
  }
  // on: prefer explicit catalog.on, fall back to phase mapping or tier
  if (entry.on && entry.on.length > 0) {
    nextSensor.on = entry.on;
  } else if (normalizePhaseList(entry.phase).length > 0) {
    nextSensor.on = legacyPhaseToOn(normalizePhaseList(entry.phase).join(","));
  } else if (entry.tier) {
    nextSensor.on = legacyTierToOn(entry.tier);
  } else {
    nextSensor.on = ["close"];
  }
  // keep phase for backward compatibility with existing contracts
  if (normalizePhaseList(entry.phase).length > 0) {
    nextSensor.phase = normalizePhaseList(entry.phase);
  }

  const index = sensors.findIndex((sensor) => sensor.name === nextSensor.name);
  if (index >= 0) sensors[index] = nextSensor;
  else sensors.push(nextSensor);

  await writeSensors(targetRoot, sensors);
  await regenerateSensorScripts(targetRoot, sensors);
  console.log(`[pbq] Sensor ${index >= 0 ? "updated" : "added"} from catalog: ${nextSensor.name} (${nextSensor.tier})`);
}

function shellQuote(value) {
  if (/^[A-Za-z0-9._\-\/\\:=]+$/.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

function legacyTierToOn(tier) {
  if (tier === "fast") return ["commit", "close"];
  return ["close"];
}

function legacyPhaseToOn(phaseStr) {
  const parts = phaseStr.split(",").map((p) => p.trim());
  const on = [];
  if (parts.includes("before")) on.push("edit");
  if (parts.includes("after")) on.push("close");
  if (on.length === 0) on.push("close");
  return on;
}

function normalizePhaseList(phase) {
  if (Array.isArray(phase)) return phase.map((item) => String(item).trim()).filter(Boolean);
  if (typeof phase === "string") return phase.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function parseOnOption(value) {
  const VALID = new Set(["edit", "commit", "close", "manual"]);
  const parts = value.split(",").map((p) => p.trim()).filter((p) => VALID.has(p));
  if (parts.length === 0) throw new Error("--on deve conter edit, commit, close ou manual (separados por virgula).");
  return [...new Set(parts)];
}

function parseSensorAddArgs(args) {
  const options = {
    targetPath: ".",
    name: "",
    tier: "",
    command: "",
    reason: "",
    phase: "",
    on: []
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--name") options.name = readOptionValue(args, ++index, "--name");
    else if (arg === "--tier") options.tier = readOptionValue(args, ++index, "--tier");
    else if (arg === "--command") options.command = readOptionValue(args, ++index, "--command");
    else if (arg === "--reason") options.reason = readOptionValue(args, ++index, "--reason");
    else if (arg === "--phase") options.phase = readOptionValue(args, ++index, "--phase");
    else if (arg === "--on") options.on = parseOnOption(readOptionValue(args, ++index, "--on"));
    else if (arg.startsWith("--")) throw new Error(`Opcao desconhecida: ${arg}`);
    else options.targetPath = arg;
  }

  if (!options.name) throw new Error("Informe --name.");
  if (!options.command) throw new Error("Informe --command.");
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(options.name)) {
    throw new Error("--name deve conter apenas letras, numeros, ponto, underscore ou hifen.");
  }
  if (options.tier && !["fast", "medium", "slow"].includes(options.tier)) {
    throw new Error("--tier deve ser fast, medium ou slow.");
  }
  if (!options.on.length && !options.tier) {
    throw new Error("Informe --on ou --tier.");
  }

  return options;
}

function parsePhaseOption(value) {
  const parts = value.split(",").map((p) => p.trim()).filter((p) => ["before", "after"].includes(p));
  if (parts.length === 0) throw new Error("--phase deve ser before, after ou before,after.");
  return parts;
}

function isSensorEligibleForEvent(sensor, event) {
  if (sensor.on && sensor.on.length > 0) return sensor.on.includes(event);
  // legacy: no `on` field — check `phase` if present, else default to "close"
  const phase = normalizePhaseList(sensor.phase);
  if (phase.length > 0) {
    return phase.some((p) => (p === "before" ? "edit" : "close") === event);
  }
  return event === "close";
}

function readOptionValue(args, index, optionName) {
  const value = args[index];
  if (!value || value.startsWith("--")) throw new Error(`Informe valor para ${optionName}.`);
  return value;
}

async function readSensors(root) {
  const sensorsPath = path.join(root, HARNESS_DIR, "sensors.json");
  if (!existsSync(sensorsPath)) {
    throw new Error(`Arquivo de sensores nao encontrado: ${path.join(HARNESS_DIR, "sensors.json")}. Rode pbq init primeiro.`);
  }
  const parsed = JSON.parse(await readFile(sensorsPath, "utf8"));
  return Array.isArray(parsed.sensors) ? parsed.sensors : [];
}

// --- pbq guard ---

function parseGuardArgs(args) {
  const options = { targetPath: ".", event: "", filePath: "" };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--event") options.event = readOptionValue(args, ++i, "--event");
    else if (arg === "--path") options.filePath = readOptionValue(args, ++i, "--path");
    else if (arg.startsWith("--")) throw new Error(`Opcao desconhecida: ${arg}`);
    else options.targetPath = arg;
  }
  if (!["edit", "commit", "close"].includes(options.event)) {
    throw new Error("Informe --event edit, commit ou close.");
  }
  return options;
}

async function resolveEnforcement(targetRoot) {
  const roadmapPath = path.join(targetRoot, HARNESS_DIR, "roadmap.md");
  if (!existsSync(roadmapPath)) return "advisory";
  const roadmap = await readFile(roadmapPath, "utf8");
  const activeSpecs = parseRoadmapSpecRows(roadmap).filter((s) => s.status === "em andamento");
  if (activeSpecs.length !== 1) return "advisory";
  const specPath = path.join(targetRoot, HARNESS_DIR, "specs", activeSpecs[0].name, "spec.md");
  if (!existsSync(specPath)) return "advisory";
  const specContent = await readFile(specPath, "utf8");
  const match = specContent.match(/^Enforcement:\s*(blocking|advisory)/im);
  return match ? match[1].toLowerCase() : "advisory";
}

async function runGuardCommand(args) {
  const options = parseGuardArgs(args);
  const targetRoot = path.resolve(options.targetPath);

  let sensors = [];
  try {
    sensors = (await readSensors(targetRoot)).filter(
      (sensor) => sensor.enabled !== false && isSensorEligibleForEvent(sensor, options.event)
    );
  } catch {
    // sensors.json absent — nothing to guard
  }

  const enforcement = await resolveEnforcement(targetRoot);
  let hasFailed = false;

  for (const sensor of sensors) {
    const row = runSensor(targetRoot, sensor);
    const icon = row.status === "passou" ? "✓" : "✗";
    console.log(`[pbq:guard] ${icon} ${row.sensor} (${row.status}): ${row.evidence}`);
    if (row.status !== "passou") hasFailed = true;
  }

  // For edit event on harness files: also run analyze
  const normalizedFilePath = options.filePath.replace(/\\/g, "/");
  if (options.event === "edit" && normalizedFilePath.startsWith(`${HARNESS_DIR}/`)) {
    const report = await analyzeHarness(targetRoot);
    console.log(`[pbq] Analyze: ${report.violations.length} violacoes, ${report.warnings.length} warnings`);
    for (const v of report.violations) console.log(` - ${v}`);
    if (report.violations.length > 0) hasFailed = true;
  }

  if (enforcement === "blocking" && hasFailed) {
    process.exitCode = 1;
  }
}

// --- pbq hooks ---

function shPreCommitHook() {
  return `#!/bin/sh
# pbq guard — advisory pre-commit hook
# Activate with: pbq hooks install
# This hook runs sensors with on:commit before each git commit.
# Exit code is always 0 (advisory) unless Enforcement: blocking is set in the active spec.

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)

if command -v pbq >/dev/null 2>&1; then
  pbq guard --event commit "$REPO_ROOT" || true
elif [ -f "$REPO_ROOT/node_modules/.bin/pbq" ]; then
  "$REPO_ROOT/node_modules/.bin/pbq" guard --event commit "$REPO_ROOT" || true
elif [ -f "$REPO_ROOT/bin/pbq.mjs" ]; then
  node "$REPO_ROOT/bin/pbq.mjs" guard --event commit "$REPO_ROOT" || true
fi
`;
}

function psPreCommitHook() {
  return `# pbq guard — advisory pre-commit hook (PowerShell)
# Activate with: pbq hooks install
$RepoRoot = git rev-parse --show-toplevel 2>$null
if (-not $RepoRoot) { $RepoRoot = (Get-Location).Path }

if (Get-Command pbq -ErrorAction SilentlyContinue) {
  pbq guard --event commit $RepoRoot
} elseif (Test-Path "$RepoRoot\\node_modules\\.bin\\pbq.cmd") {
  & "$RepoRoot\\node_modules\\.bin\\pbq.cmd" guard --event commit $RepoRoot
} elseif (Test-Path "$RepoRoot\\bin\\pbq.mjs") {
  node "$RepoRoot\\bin\\pbq.mjs" guard --event commit $RepoRoot
}
exit 0
`;
}

async function installGitHook(targetRoot) {
  const hooksDir = path.join(targetRoot, HARNESS_DIR, "harness", "hooks");
  if (!existsSync(hooksDir)) {
    throw new Error(`Scripts de hook nao encontrados. Rode 'pbq update ${targetRoot}' primeiro.`);
  }
  const relHooksDir = path.relative(targetRoot, hooksDir).replace(/\\/g, "/");
  const gitResult = spawnSync("git", ["config", "core.hooksPath", relHooksDir], {
    cwd: targetRoot,
    encoding: "utf8",
    shell: true
  });
  if (gitResult.status === 0) {
    console.log(`[pbq] hooks install: core.hooksPath -> ${relHooksDir}`);
    return;
  }
  // Fallback: copy to .git/hooks
  const gitHooksDir = path.join(targetRoot, ".git", "hooks");
  const srcPreCommit = path.join(hooksDir, "pre-commit");
  if (existsSync(srcPreCommit) && existsSync(gitHooksDir)) {
    const dest = path.join(gitHooksDir, "pre-commit");
    await writeFile(dest, await readFile(srcPreCommit, "utf8"), "utf8");
    console.log(`[pbq] hooks install: pre-commit copiado para ${dest}`);
  } else {
    console.log("[pbq] hooks install: nao foi possivel instalar o hook (sem core.hooksPath nem .git/hooks).");
  }
}

async function showHooksStatus(targetRoot) {
  const hooksDir = path.join(targetRoot, HARNESS_DIR, "harness", "hooks");
  const gitResult = spawnSync("git", ["config", "--get", "core.hooksPath"], {
    cwd: targetRoot,
    encoding: "utf8",
    shell: true
  });
  const coreHooksPath = gitResult.status === 0 ? gitResult.stdout.trim() : null;
  const gitHookExists = existsSync(path.join(targetRoot, ".git", "hooks", "pre-commit"));
  let sensors = [];
  try { sensors = await readSensors(targetRoot); } catch { /* harness not initialized */ }
  const enabled = sensors.filter((s) => s.enabled !== false);
  const counts = {
    edit: enabled.filter((s) => isSensorEligibleForEvent(s, "edit")).length,
    commit: enabled.filter((s) => isSensorEligibleForEvent(s, "commit")).length,
    close: enabled.filter((s) => isSensorEligibleForEvent(s, "close")).length
  };
  console.log("[pbq] hooks status:");
  console.log(`  scripts gerados: ${existsSync(hooksDir) ? "sim" : "nao"} (${path.relative(targetRoot, hooksDir)})`);
  console.log(`  core.hooksPath:  ${coreHooksPath || "(nao configurado)"}`);
  console.log(`  .git/hooks/pre-commit: ${gitHookExists ? "presente" : "ausente"}`);
  console.log(`  sensores por evento: edit=${counts.edit} commit=${counts.commit} close=${counts.close}`);
}

async function runHooksCommand(args) {
  const action = args.shift();
  const targetPath = args[0] || ".";
  if (action === "install") {
    await installGitHook(path.resolve(targetPath));
  } else if (action === "status") {
    await showHooksStatus(path.resolve(targetPath));
  } else {
    throw new Error("Uso: pbq hooks install [path] | pbq hooks status [path]");
  }
}

// --- settings.json hook merge ---

const PBQ_GUARD_COMMAND = "pbq guard --event edit";
const PBQ_HOOK_MATCHER = "Edit|Write|MultiEdit";

async function mergeGuardHookInSettings(targetRoot, options, events = []) {
  const settingsPath = path.join(targetRoot, ".claude", "settings.json");
  let settings = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(await readFile(settingsPath, "utf8"));
    } catch {
      return; // invalid JSON — skip merge to avoid corruption
    }
  }
  // Check if our hook already exists
  const postToolUse = settings.hooks?.PostToolUse;
  if (Array.isArray(postToolUse)) {
    const alreadyPresent = postToolUse.some(
      (entry) => Array.isArray(entry.hooks) && entry.hooks.some((h) => h.command === PBQ_GUARD_COMMAND)
    );
    if (alreadyPresent) return;
  }
  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.PostToolUse) settings.hooks.PostToolUse = [];
  settings.hooks.PostToolUse.push({
    matcher: PBQ_HOOK_MATCHER,
    hooks: [{ type: "command", command: PBQ_GUARD_COMMAND }]
  });
  if (!options.dryRun) {
    await mkdir(path.join(targetRoot, ".claude"), { recursive: true });
    await writeFile(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf8");
  }
  events.push({ type: "create", path: ".claude/settings.json" });
}

async function migrateSensorsV1ToV2(root) {
  const sensorsPath = path.join(root, HARNESS_DIR, "sensors.json");
  if (!existsSync(sensorsPath)) return;
  let data;
  try {
    data = JSON.parse(await readFile(sensorsPath, "utf8"));
  } catch {
    return;
  }
  const sensors = Array.isArray(data.sensors) ? data.sensors : [];
  if (data.version >= 2 && sensors.every((s) => s.on && s.on.length > 0)) return;
  await writeSensors(root, sensors);
}

async function writeSensors(root, sensors) {
  const normalized = sensors.map((sensor) => {
    if (sensor.on && sensor.on.length > 0) return sensor;
    const phase = normalizePhaseList(sensor.phase);
    const on = phase.length > 0 ? legacyPhaseToOn(phase.join(",")) : legacyTierToOn(sensor.tier);
    return phase.length > 0 ? { ...sensor, phase, on } : { ...sensor, on };
  });
  const sensorsPath = path.join(root, HARNESS_DIR, "sensors.json");
  await writeFile(sensorsPath, JSON.stringify({ version: 2, sensors: normalized }, null, 2) + "\n", "utf8");
}

async function regenerateSensorScripts(root, sensors) {
  const placeholders = sensorPlaceholders(sensors);
  const files = {
    [`${HARNESS_DIR}/harness/scripts/run-fast.ps1`]: psRunScript("fast", sensors, placeholders),
    [`${HARNESS_DIR}/harness/scripts/run-medium.ps1`]: psRunScript("medium", sensors, placeholders),
    [`${HARNESS_DIR}/harness/scripts/run-slow.ps1`]: psRunScript("slow", sensors, placeholders),
    [`${HARNESS_DIR}/harness/scripts/run-fast.sh`]: shRunScript("fast", sensors, placeholders),
    [`${HARNESS_DIR}/harness/scripts/run-medium.sh`]: shRunScript("medium", sensors, placeholders),
    [`${HARNESS_DIR}/harness/scripts/run-slow.sh`]: shRunScript("slow", sensors, placeholders),
    [`${HARNESS_DIR}/harness/scripts/run-commit.ps1`]: psRunEventScript("commit", sensors),
    [`${HARNESS_DIR}/harness/scripts/run-close.ps1`]: psRunEventScript("close", sensors),
    [`${HARNESS_DIR}/harness/scripts/run-commit.sh`]: shRunEventScript("commit", sensors),
    [`${HARNESS_DIR}/harness/scripts/run-close.sh`]: shRunEventScript("close", sensors)
  };

  for (const [relativePath, content] of Object.entries(files)) {
    await writeFile(path.join(root, relativePath), content, "utf8");
  }
}

function sensorEligibleForEventStatic(sensor, event) {
  if (sensor.on && sensor.on.length > 0) return sensor.on.includes(event);
  const phase = normalizePhaseList(sensor.phase);
  if (phase.length > 0) {
    return phase.some((p) => (p === "before" ? "edit" : "close") === event);
  }
  return event === "close";
}

function psRunEventScript(event, sensors) {
  const commands = sensors.filter((s) => s.enabled !== false && sensorEligibleForEventStatic(s, event));
  const label = event;
  if (commands.length === 0) {
    return `# run-${label}.ps1 — nenhum sensor on:${label} cadastrado\nWrite-Host "[harness:${label}] Nenhum sensor on:${label} cadastrado."\nexit 0\n`;
  }
  return `$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..\\..\\..")
Set-Location $Root

function Invoke-HarnessCommand {
  param([string]$Command)
  Write-Host "[harness:${label}] $Command"
  powershell -NoProfile -ExecutionPolicy Bypass -Command $Command
  if ($LASTEXITCODE -ne 0) {
    Write-Host "[harness:${label}] Failed: $Command"
    exit $LASTEXITCODE
  }
}

$Commands = @(
${commands.map((item) => `  "${escapePowerShellString(item.command)}"`).join(",\n")}
)

foreach ($Command in $Commands) {
  Invoke-HarnessCommand $Command
}

Write-Host "[harness:${label}] OK"
exit 0
`;
}

function shRunEventScript(event, sensors) {
  const commands = sensors.filter((s) => s.enabled !== false && sensorEligibleForEventStatic(s, event));
  const label = event;
  if (commands.length === 0) {
    return `#!/usr/bin/env sh\n# run-${label}.sh — nenhum sensor on:${label} cadastrado\nprintf '[harness:${label}] Nenhum sensor on:${label} cadastrado.\\n'\n`;
  }
  return `#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)"
cd "$ROOT"

run_cmd() {
  printf '[harness:${label}] %s\\n' "$1"
  sh -c "$1"
}

${commands.map((item) => `run_cmd "${escapeShellString(item.command)}"`).join("\n")}

printf '[harness:${label}] OK\\n'
`;
}

function sensorPlaceholders(sensors) {
  return ["fast", "medium", "slow"]
    .filter((tier) => !sensors.some((sensor) => sensor.tier === tier && sensor.enabled !== false))
    .map((tier) => ({
      bucket: tier,
      text: `Nenhum sensor ${tier} cadastrado. Use 'pbq sensor add --tier ${tier}' para adicionar.`
    }));
}

function printHelp(topic = "") {
  const normalized = topic.toLowerCase();
  const helpByTopic = {
    init: `pbq init [path] [--force] [--dry-run] [--no-agent-integration]

Cria a estrutura inicial em .plan-build-qa/ e adapters para Claude/Codex.

Opcoes:
  --force                 sobrescreve arquivos existentes gerados pelo harness
  --dry-run               mostra o que seria criado/alterado
  --no-agent-integration  nao cria/atualiza AGENTS.md, CLAUDE.md, .claude/skills ou .agents/skills

Exemplos:
  pbq init .
  pbq init C:\\repo\\app --dry-run`,

    update: `pbq update [path] [--dry-run] [--force]

Atualiza templates/skills de uma instalacao existente usando .plan-build-qa/manifest.json.

Comportamento:
  arquivo ausente                 cria
  arquivo igual ao template antigo atualiza automaticamente
  arquivo customizado             preserva e grava .pbq-new
  sensors.json                    nunca sobrescreve

Exemplos:
  pbq update .
  pbq update C:\\repo\\app --dry-run
  pbq update . --force`,

    sensor: `pbq sensor add [path] --name <name> --on <gatilhos> --command <command> [--reason <text>]
pbq sensor add [path] --name <name> --tier <fast|medium|slow> --command <command> [--reason <text>]
pbq sensor add --from-catalog <id> [path]
pbq sensor list [path]
pbq sensor suggest [path]
pbq sensor catalog [path]

Gerencia sensores computacionais em .plan-build-qa/sensors.json e regenera runners.

  --on     gatilhos de execucao: edit, commit, close, manual (separados por virgula). Preferido.
  --tier   rotulo cosmético de custo (fast|medium|slow). Mapeado para --on se omitido.
           fast -> commit,close | medium -> close | slow -> close

  suggest  escaneia o alvo e imprime comandos 'pbq sensor add' prontos para candidatos detectados
           (scripts soltos, Makefile, sonar*) e ainda nao cadastrados em sensors.json. So imprime;
           nao altera arquivos.
  catalog  lista entradas do catalogo curado de sensores prontos, marcando as ja cadastradas.

Exemplos:
  pbq sensor list .
  pbq sensor suggest .
  pbq sensor catalog .
  pbq sensor add . --name e2e --on close --command "npm run test:e2e" --reason "Valida fluxo principal"
  pbq sensor add . --name lint --on commit,close --command "npm run lint"
  pbq sensor add --from-catalog sonar-dotnet .`,

    analyze: `pbq analyze [path] [--strict]

Valida, em modo somente leitura, a coerencia minima entre roadmap, specs, progress, contracts e evaluations quando houver package fechado.

Flags:
  --strict  warnings tambem causam exit code 1 (por padrao apenas violacoes falham)

Status de saida:
  0  nenhuma violacao critica encontrada (com --strict, tambem nenhum warning)
  1  uma ou mais violacoes criticas encontradas (com --strict, tambem warnings)

Exemplos:
  pbq analyze .
  pbq analyze . --strict
  pbq analyze C:\\repo\\app`,

    package: `pbq package close [path] --spec <spec-name> --package <N> [--tiers fast,medium,slow] [--phase before|after]

Executa sensores cadastrados, gera evaluation em .plan-build-qa/specs/<spec>/evaluations/package-N.md e falha se sensor obrigatorio falhar.

  --phase  fase de execucao (default: after). Sensores sem campo phase so rodam na fase after.
           Sensores com phase:["before"] so rodam com --phase before.

Exemplos:
  pbq package close . --spec spec-001-login --package 1 --tiers fast,medium
  pbq package close . --spec spec-001-login --package 1 --phase before
  pbq package close C:\\repo\\app --spec spec-002-checkout --package 3`,

    guard: `pbq guard --event <edit|commit|close> [path] [--path <file>]

Roda sensores com on:<event> e imprime resultado.
Advisory por default (exit 0 sempre). Exit 1 apenas se spec ativa tiver
"Enforcement: blocking" E algum sensor falhar.

  edit    sensores de edicao (ex.: lint rapido, analyze)
  commit  sensores de pre-commit (ex.: unit tests, lint)
  close   sensores de gate de aceite (equivalente ao pbq package close)

  --path  caminho do arquivo editado; se estiver em .plan-build-qa/**, tambem
          roda 'pbq analyze' automaticamente

Exemplos:
  pbq guard --event commit .
  pbq guard --event edit . --path .plan-build-qa/roadmap.md`,

    hooks: `pbq hooks install [path]
pbq hooks status [path]

Gerencia o hook de pre-commit que chama 'pbq guard --event commit'.

  install  configura git core.hooksPath ou copia script para .git/hooks/pre-commit.
           Exige execucao explicita — nao e ativado automaticamente no pbq init.
  status   exibe estado do hook e contagem de sensores por evento.

Exemplos:
  pbq hooks install .
  pbq hooks status .`,

    run: `pbq run [path] [--resume]
pbq status [path]
pbq dashboard [path] [--json] [--output <dir>] [--serve] [--watch] [--port <N>] [--resume]

Mostra painel textual com specs, contrato, build, QA e score.

Exemplos:
  pbq status .
  pbq run C:\\repo\\app --resume
  pbq dashboard . --json
  pbq dashboard . --json --output .plan-build-qa/dashboard
  pbq dashboard . --serve --watch --port 4173`,

    status: `pbq status [path]

Alias de painel para inspecionar estado atual do harness.

Exemplo:
  pbq status .`,

    dashboard: `pbq dashboard [path] [--json] [--output <dir>] [--serve] [--watch] [--port <N>] [--resume]

Mostra o painel textual ou gera um snapshot JSON do dashboard.

Flags:
  --json          imprime o dashboard em JSON em vez do painel textual
  --output <dir>  grava status.json no diretorio informado
  --serve         sobe servidor HTTP local para servir index.html e status.json
  --watch         regenera snapshots periodicamente enquanto o servidor estiver ativo
  --port <N>      porta do servidor (default: 4173)
  --resume        mantem a etiqueta de modo resume no painel textual

Exemplos:
  pbq dashboard .
  pbq dashboard . --json
  pbq dashboard . --json --output .plan-build-qa/dashboard
  pbq dashboard . --serve --watch --port 4173`
  };

  if (normalized && helpByTopic[normalized]) {
    console.log(helpByTopic[normalized]);
    return;
  }

  if (normalized) {
    console.log(`[pbq] Topico desconhecido: ${topic}\n`);
  }

  console.log(`pbq - Plan Build QA harness

Uso:
  pbq <command> [args]

Comandos:
  init       cria a configuracao inicial do harness
  update     atualiza templates/skills sem sobrescrever customizacoes
  sensor     adiciona ou lista sensores computacionais
  analyze    valida coerencia minima entre artefatos do harness
  package    fecha package executando sensores e gerando evaluation
  guard      roda sensores por evento (advisory por default)
  hooks      instala/verifica hook de pre-commit
  dashboard  gera painel/snapshot do dashboard
  run        mostra painel de execucao
  status     mostra painel de status
  help       mostra ajuda geral ou de um comando

Ajuda por comando:
  pbq help init
  pbq help update
  pbq help sensor
  pbq help analyze
  pbq help package
  pbq help guard
  pbq help hooks
  pbq help dashboard
  pbq help run

Exemplos:
  pbq init .
  pbq update . --dry-run
  pbq sensor list .
  pbq analyze .
  pbq package close . --spec spec-001-exemplo --package 1 --tiers fast,medium
  pbq run . --resume`);
}

async function runAnalyzeCommand(args) {
  const positional = args.filter((arg) => arg !== "--strict");
  const strict = args.includes("--strict");
  const targetRoot = path.resolve(positional[0] || ".");
  const report = await analyzeHarness(targetRoot);

  console.log(`[pbq] Analyze target: ${targetRoot}`);
  console.log(`[pbq] Specs no roadmap: ${report.specCount}`);

  if (report.violations.length > 0) {
    console.log("[pbq] Violations:");
    for (const violation of report.violations) {
      console.log(` - ${violation}`);
    }
  } else {
    console.log("[pbq] Violations: nenhuma");
  }

  if (report.warnings.length > 0) {
    console.log("[pbq] Warnings:");
    for (const warning of report.warnings) {
      console.log(` - ${warning}`);
    }
  } else {
    console.log("[pbq] Warnings: nenhum");
  }

  console.log(
    `[pbq] Resumo: ${report.violations.length} violacoes, ${report.warnings.length} warnings em ${report.specCount} specs`
  );

  const strictFailure = strict && report.warnings.length > 0;
  const failed = report.violations.length > 0 || strictFailure;
  console.log(`[pbq] Resultado: ${failed ? "FALHOU" : "OK"}`);

  if (failed) {
    process.exitCode = 1;
  }
}

async function analyzeHarness(root) {
  const violations = [];
  const warnings = [];
  const roadmapPath = path.join(root, HARNESS_DIR, "roadmap.md");

  if (!existsSync(roadmapPath)) {
    return {
      specCount: 0,
      violations: [`Arquivo obrigatorio ausente: ${path.join(HARNESS_DIR, "roadmap.md")}`],
      warnings
    };
  }

  const roadmap = await readFile(roadmapPath, "utf8");
  const specRows = parseRoadmapSpecRows(roadmap);
  const sensorsResult = await loadSensorNames(root);
  const sensorNames = sensorsResult.names;
  if (sensorsResult.parseError) {
    warnings.push(`sensors.json invalido: ${sensorsResult.parseError}`);
  }

  if (specRows.length === 0) {
    violations.push("Nenhuma spec encontrada na tabela do roadmap.");
  }

  for (const spec of specRows) {
    const specRoot = path.join(root, HARNESS_DIR, "specs", spec.name);
    const progressPath = path.join(specRoot, "progress.md");
    const contractsDir = path.join(specRoot, "contracts");

    if (spec.status && !ALLOWED_SPEC_STATUS.has(spec.status)) {
      violations.push(`${spec.name}: status invalido no roadmap: "${spec.status}". Permitidos: planejado, em andamento, bloqueado, concluido, cancelado.`);
    }

    if (!existsSync(specRoot)) {
      const message = `${spec.name}: pasta da spec ausente em ${path.join(HARNESS_DIR, "specs", spec.name)}`;
      if (spec.status === "planejado") warnings.push(message);
      else violations.push(message);
      continue;
    }

    if (!existsSync(progressPath)) {
      violations.push(`${spec.name}: progress.md ausente`);
    }

    if (!existsSync(contractsDir)) {
      violations.push(`${spec.name}: diretorio contracts ausente`);
    }

    if (spec.currentPackage && existsSync(contractsDir)) {
      const contractPath = path.join(contractsDir, `package-${spec.currentPackage}.md`);
      if (!existsSync(contractPath)) {
        violations.push(`${spec.name}: contrato ausente para package atual ${spec.currentPackage}`);
      }
    }

    if (existsSync(contractsDir) && sensorNames !== null) {
      const contractFiles = await readdir(contractsDir);
      for (const file of contractFiles) {
        if (!/^package-\d+\.md$/.test(file)) continue;
        const contractText = await readFile(path.join(contractsDir, file), "utf8");
        for (const entry of parseContractRequiredSensors(contractText)) {
          if (!entry.hasName) {
            warnings.push(`${spec.name}/${file}: sensor obrigatorio citado sem nome cadastrado em sensors.json`);
          } else if (!sensorNames.has(entry.name)) {
            violations.push(`${spec.name}/${file}: sensor obrigatorio "${entry.name}" nao cadastrado em sensors.json`);
          }
        }
      }
    }

    if (!existsSync(progressPath)) {
      continue;
    }

    const progress = await readFile(progressPath, "utf8");
    const closedPackages = parseClosedPackages(progress);
    for (const packageNumber of closedPackages) {
      const evaluationPath = path.join(specRoot, "evaluations", `package-${packageNumber}.md`);
      if (!existsSync(evaluationPath)) {
        violations.push(`${spec.name}: evaluation ausente para package concluido ${packageNumber}`);
      }
    }

    await analyzePackageMatrix(spec, specRoot, contractsDir, closedPackages, violations, warnings);
    await analyzeSensorEnforcement(spec, specRoot, contractsDir, closedPackages, violations, warnings);

    const progressCurrent = parseProgressCurrentPackage(progress);
    if (spec.currentPackage && progressCurrent && spec.currentPackage !== progressCurrent) {
      violations.push(`${spec.name}: Package Atual divergente - roadmap=${spec.currentPackage}, progress.md=${progressCurrent}`);
    }

    if (spec.status === "concluido" && closedPackages.length === 0) {
      warnings.push(`${spec.name}: roadmap marca a spec como concluida, mas progress.md nao lista packages concluidos`);
    }
  }

  return {
    specCount: specRows.length,
    violations,
    warnings
  };
}

async function analyzePackageMatrix(spec, specRoot, contractsDir, closedPackages, violations, warnings) {
  const specPath = path.join(specRoot, "spec.md");
  if (!existsSync(specPath)) return;
  const specMd = await readFile(specPath, "utf8");
  const declared = parseSpecPackageRows(specMd);
  const contracts = await listPackageFiles(contractsDir);
  const evaluationsDir = path.join(specRoot, "evaluations");
  const evaluations = await listPackageFiles(evaluationsDir);

  // 1. Naming integer-only: sub-packages na tabela e arquivos invalidos
  for (const sub of declared.subpackages) {
    violations.push(`${spec.name}: numeração inválida na tabela: "${sub}" (sub-packages não são suportados; use inteiros contíguos)`);
  }
  for (const file of [...contracts.invalid, ...evaluations.invalid]) {
    violations.push(`${spec.name}: numeração inválida: ${file} (sub-packages não são suportados; use inteiros contíguos)`);
  }

  // 2. Sequencia materializada (contracts ∪ evaluations) deve ser contigua a partir de 1
  const materialized = [...new Set([...contracts.integers, ...evaluations.integers])].sort((a, b) => a - b);
  if (materialized.length > 0) {
    const max = materialized[materialized.length - 1];
    const present = new Set(materialized);
    const holes = [];
    for (let n = 1; n <= max; n += 1) {
      if (!present.has(n)) holes.push(n);
    }
    if (holes.length > 0) {
      violations.push(`${spec.name}: packages materializados com buracos: faltam ${holes.join(", ")} (materializados: ${materialized.join(", ")})`);
    }
  }

  // 3. Evaluation orfã (sem contract correspondente)
  const contractSet = new Set(contracts.integers);
  for (const n of evaluations.integers) {
    if (!contractSet.has(n)) {
      violations.push(`${spec.name}: evaluation package-${n} sem contract correspondente`);
    }
  }

  // 4. Materializado fora da declaracao (respeitando cauda aberta N+)
  for (const n of materialized) {
    const isDeclared = declared.integers.has(n);
    const inOpenTail = declared.openEndedFrom !== null && n >= declared.openEndedFrom;
    if (!isDeclared && !inOpenTail) {
      violations.push(`${spec.name}: package ${n} materializado mas ausente da tabela da spec`);
    }
  }

  // 5. Score 0 nas evaluations
  const closedSet = new Set(closedPackages.map((p) => parseInt(p, 10)).filter((n) => !Number.isNaN(n)));
  for (const n of evaluations.integers) {
    const evalMd = await readFile(path.join(evaluationsDir, `package-${n}.md`), "utf8");
    const score = parseEvaluationScore(evalMd);
    if (score === 0) {
      if (closedSet.has(n)) {
        violations.push(`${spec.name}: package ${n} fechado mas evaluation tem Score 0`);
      } else {
        warnings.push(`${spec.name}: evaluation package-${n} tem Score 0 (package não fechado)`);
      }
    }
  }

  // 6. Declarado-sem-contract (cauda N+ e planejados nao materializados → warning)
  for (const n of declared.integers) {
    if (!contractSet.has(n)) {
      warnings.push(`${spec.name}: package ${n} declarado na spec sem contract`);
    }
  }
}

async function analyzeSensorEnforcement(spec, specRoot, contractsDir, closedPackages, violations, warnings) {
  if (!existsSync(contractsDir)) return;
  const evaluationsDir = path.join(specRoot, "evaluations");
  const closedSet = new Set(closedPackages.map((p) => parseInt(p, 10)).filter((n) => !Number.isNaN(n)));
  for (const file of await readdir(contractsDir)) {
    const match = file.match(/^package-(\d+)\.md$/);
    if (!match) continue;
    const n = match[1];
    const packageNumber = parseInt(n, 10);
    const evalPath = path.join(evaluationsDir, `package-${n}.md`);
    if (!existsSync(evalPath)) continue; // sem evaluation: matriz estrutural cuida disso

    const contractText = await readFile(path.join(contractsDir, file), "utf8");
    const required = parseContractRequiredSensors(contractText).filter((e) => e.hasName);
    if (required.length === 0) continue;

    const evalText = await readFile(evalPath, "utf8");
    if (parseEvaluationScore(evalText) === 0 && !closedSet.has(packageNumber)) {
      warnings.push(`${spec.name}/package-${n}: enforcement de sensores ignorado porque evaluation tem Score 0 e package nao esta fechado`);
      continue;
    }

    const evalRows = parseEvaluationSensorRows(evalText);
    if (evalRows.length === 0) continue; // evaluation sem tabela de sensores: nada a comparar
    const byName = new Map(evalRows.map((r) => [r.name, r.status]));

    for (const entry of required) {
      if (!byName.has(entry.name)) {
        violations.push(`${spec.name}/package-${n}: sensor obrigatório "${entry.name}" do contract ausente na evaluation`);
        continue;
      }
      const status = byName.get(entry.name);
      // Só falha se houver status reconhecido e não-aprovado. Status desconhecido
      // (tabela manual sem coluna Status) não vira violação de "não passou".
      const passed = /passou|^pass|aprovado/i.test(status);
      const failed = /falhou|^fail|reprovado|pendente|nao-aplicavel/i.test(status);
      if (!passed && failed) {
        violations.push(`${spec.name}/package-${n}: sensor obrigatório "${entry.name}" não passou na evaluation (status: ${status})`);
      }
    }
  }
}

async function loadSensorNames(root) {
  const sensorsPath = path.join(root, HARNESS_DIR, "sensors.json");
  if (!existsSync(sensorsPath)) return { names: null, parseError: null };
  try {
    const data = JSON.parse(await readFile(sensorsPath, "utf8"));
    return {
      names: new Set((data.sensors || []).map((sensor) => sensor.name).filter(Boolean)),
      parseError: null
    };
  } catch (error) {
    return { names: null, parseError: error.message };
  }
}

function parseProgressCurrentPackage(progress) {
  const sectionMatch = progress.match(/## Package Atual([\s\S]*?)(?:\n## |\s*$)/);
  if (!sectionMatch) return "";
  const lineMatch = sectionMatch[1].match(/(?:^|\n)\s*Package\s+(\d+)\b/);
  return lineMatch ? lineMatch[1] : "";
}

function parseProgressStageRows(progress) {
  const rows = [];
  let inTable = false;
  let stageCol = 0;
  let statusCol = 1;
  for (const line of progress.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) {
      inTable = false;
      continue;
    }
    const cells = splitTableRow(trimmed);
    if (cells.every((cell) => /^-+$/.test(cell))) continue;
    const isHeader = cells.some((cell) => /^etapa$/i.test(cell)) && cells.some((cell) => /^status$/i.test(cell));
    if (isHeader) {
      inTable = true;
      stageCol = cells.findIndex((cell) => /^etapa$/i.test(cell));
      statusCol = cells.findIndex((cell) => /^status$/i.test(cell));
      continue;
    }
    if (!inTable) continue;
    const stage = (cells[stageCol] || "").trim();
    const status = (cells[statusCol] || "").trim().toLowerCase();
    if (!stage) continue;
    rows.push({ stage, status });
  }
  return rows;
}

function parseContractRequiredSensors(contract) {
  const sectionMatch = contract.match(/## Sensores Obrigatorios([\s\S]*?)(?:\n## |\s*$)/);
  if (!sectionMatch) return [];
  const entries = [];
  let inTable = false;
  let nameCol = 0;
  for (const rawLine of sectionMatch[1].split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (trimmed.startsWith("- ")) {
      inTable = false;
      if (trimmed.startsWith("- **")) continue;
      const body = trimmed.slice(2).trim();
      const parts = body.split("|").map((part) => part.trim());
      if (parts.length >= 2) {
        const name = parts[1].replace(/^`|`$/g, "").trim();
        if (name) {
          entries.push({ name, hasName: true });
          continue;
        }
      }
      entries.push({ name: null, hasName: false });
    } else if (trimmed.startsWith("|")) {
      const cells = splitTableRow(trimmed);
      if (cells.every((c) => /^-+$/.test(c))) continue; // separador
      const isHeader = cells.some((c) => /^sensor$/i.test(c));
      if (isHeader) {
        inTable = true;
        const nomeIdx = cells.findIndex((c) => /nome/i.test(c));
        const sensorIdx = cells.findIndex((c) => /^sensor$/i.test(c));
        nameCol = nomeIdx >= 0 ? nomeIdx : sensorIdx >= 0 ? sensorIdx : 0;
        continue;
      }
      if (!inTable) continue;
      const name = (cells[nameCol] || cells[0] || "").replace(/`/g, "").trim();
      if (name) entries.push({ name, hasName: true });
    } else if (trimmed.length > 0 && !trimmed.startsWith(">")) {
      inTable = false;
    }
  }
  return entries;
}

function splitTableRow(line) {
  const cells = line.split("|").map((c) => c.trim());
  if (cells.length && cells[0] === "") cells.shift();
  if (cells.length && cells[cells.length - 1] === "") cells.pop();
  return cells;
}

function parseEvaluationSensorRows(evalMd) {
  const rows = [];
  let inTable = false;
  let nameCol = 0;
  let statusCol = -1;
  for (const line of evalMd.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) {
      inTable = false;
      continue;
    }
    const cells = splitTableRow(trimmed);
    if (cells.every((c) => /^-+$/.test(c))) continue;
    const isHeader = cells.some((c) => /^sensor$/i.test(c));
    if (isHeader) {
      inTable = true;
      nameCol = cells.findIndex((c) => /^sensor$/i.test(c));
      if (nameCol < 0) nameCol = 0;
      statusCol = cells.findIndex((c) => /^status$/i.test(c));
      continue;
    }
    if (!inTable) continue;
    const name = (cells[nameCol] || "").replace(/`/g, "").trim();
    if (!name) continue;
    let status = "";
    if (statusCol >= 0 && cells[statusCol]) {
      status = cells[statusCol];
    } else {
      const found = cells.find((c) => /^(passou|falhou|pendente|nao-aplicavel|pass|fail|aprovado|reprovado)$/i.test(c));
      if (found) status = found;
    }
    rows.push({ name, status: status.toLowerCase() });
  }
  return rows;
}

function parseSpecPackageRows(specMd) {
  const result = { integers: new Set(), subpackages: [], openEndedFrom: null };
  // Localiza a linha de header "## Packages" exata (nao mencao inline), e coleta
  // ate o proximo header "## ".
  const lines = specMd.split(/\r?\n/);
  let inSection = false;
  const sectionLines = [];
  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      inSection = /^##\s+Packages\s*$/.test(line);
      continue;
    }
    if (inSection) sectionLines.push(line);
  }
  for (const line of sectionLines) {
    if (!line.trimStart().startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    const token = (cells[1] || "").replace(/`|\*/g, "").trim();
    // header / separator rows
    if (!token || /^-+$/.test(token) || /^package$/i.test(token)) continue;
    if (/^\d+\+$/.test(token)) {
      result.openEndedFrom = parseInt(token, 10);
    } else if (/^\d+$/.test(token)) {
      result.integers.add(parseInt(token, 10));
    } else if (/^\d+\.\d+$/.test(token)) {
      result.subpackages.push(token);
    }
    // anything else (prose) is ignored
  }
  return result;
}

async function listPackageFiles(dir) {
  const result = { integers: [], invalid: [] };
  if (!existsSync(dir)) return result;
  for (const file of await readdir(dir)) {
    const match = file.match(/^package-(.+)\.md$/);
    if (!match) continue;
    const token = match[1];
    if (/^\d+$/.test(token)) result.integers.push(parseInt(token, 10));
    else result.invalid.push(file);
  }
  result.integers.sort((a, b) => a - b);
  return result;
}

function parseEvaluationScore(evalMd) {
  const match = evalMd.match(/Score:\s*\**\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

function parseRoadmapSpecRows(roadmap) {
  return roadmap
    .split(/\r?\n/)
    .filter((line) => line.trimStart().startsWith("|"))
    .map((line) => line.split("|").map((cell) => cell.trim()))
    .map((cells) => ({
      name: stripCellDecoration(cells[1] || ""),
      status: normalizeRoadmapStatus(cells[2] || ""),
      currentPackage: parsePackageNumber(cells[3] || ""),
      updatedAt: parseRoadmapUpdatedAt(cells[4] || "")
    }))
    .filter((row) => /^spec-\d+/i.test(row.name));
}

function stripCellDecoration(value) {
  return value.replace(/`/g, "").trim();
}

function normalizeRoadmapStatus(value) {
  return value
    .replace(/[^\p{L}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function parsePackageNumber(value) {
  const match = value.match(/\d+/);
  return match ? match[0] : "";
}

function parseRoadmapUpdatedAt(value) {
  const normalized = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : "";
}

function parseClosedPackages(progress) {
  const sectionMatch = progress.match(/## Packages Concluidos([\s\S]*?)(?:\n## |\s*$)/);
  if (!sectionMatch) return [];

  const packages = new Set();
  for (const match of sectionMatch[1].matchAll(/package\s+(\d+)/gi)) {
    if (match[1]) packages.add(match[1]);
  }
  return [...packages];
}

async function runUpdateCommand(args) {
  const options = parseUpdateArgs(args);
  const targetRoot = path.resolve(options.targetPath);
  await ensureDirectory(targetRoot);
  const harnessRoot = path.join(targetRoot, HARNESS_DIR);
  if (!existsSync(harnessRoot)) {
    throw new Error(`Harness nao encontrado em ${HARNESS_DIR}. Rode pbq init primeiro.`);
  }

  const project = await inspectProject(targetRoot);
  const generated = withManifest(await generateFiles(project));
  const previousManifest = await readManifest(targetRoot);
  const events = [];

  for (const [relativePath, latest] of Object.entries(generated)) {
    if (relativePath === `${HARNESS_DIR}/sensors.json`) continue;
    const effectiveOptions = ALWAYS_REPLACE_FILES.has(relativePath) ? { ...options, force: true } : options;
    await updateManagedFile(targetRoot, relativePath, latest, previousManifest, effectiveOptions, events);
  }

  await migrateSensorsV1ToV2(targetRoot);
  await mergeGuardHookInSettings(targetRoot, options, events);
  const catalog = await loadSensorCatalog();
  printUpdateSummary(targetRoot, events, options, catalog.length);
}

function parseUpdateArgs(args) {
  const options = {
    targetPath: ".",
    dryRun: false,
    force: false
  };

  for (const arg of args) {
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--force") options.force = true;
    else if (arg.startsWith("--")) throw new Error(`Opcao desconhecida: ${arg}`);
    else options.targetPath = arg;
  }

  return options;
}

async function readManifest(root) {
  const manifestPath = path.join(root, HARNESS_DIR, "manifest.json");
  if (!existsSync(manifestPath)) return null;
  try {
    return JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    return null;
  }
}

async function updateManagedFile(root, relativePath, latest, previousManifest, options, events) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    if (!options.dryRun) {
      await mkdir(path.dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, latest, "utf8");
    }
    events.push({ type: "create", path: relativePath });
    return;
  }

  const current = await readFile(absolutePath, "utf8");
  if (current === latest) {
    events.push({ type: "ok", path: relativePath });
    return;
  }

  const currentHash = sha256(current);
  const previousHash = previousManifest?.files?.[relativePath]?.sha256;
  const canAutoUpdate = options.force || (previousHash && currentHash === previousHash);

  if (canAutoUpdate) {
    if (!options.dryRun) await writeFile(absolutePath, latest, "utf8");
    events.push({ type: options.force ? "force-update" : "auto-update", path: relativePath });
    return;
  }

  const candidatePath = `${relativePath}.pbq-new`;
  if (!options.dryRun) {
    const absoluteCandidatePath = path.join(root, candidatePath);
    await mkdir(path.dirname(absoluteCandidatePath), { recursive: true });
    await writeFile(absoluteCandidatePath, latest, "utf8");
  }
  events.push({ type: "candidate", path: candidatePath });
}

function printUpdateSummary(targetRoot, events, options, catalogCount = 0) {
  const grouped = groupBy(events, "type");
  console.log(`[pbq] Update target: ${targetRoot}`);
  if (options.dryRun) console.log("[pbq] Dry run: nenhum arquivo foi alterado.");
  console.log(`[pbq] Created missing: ${(grouped.create || []).length}`);
  console.log(`[pbq] Auto updated: ${(grouped["auto-update"] || []).length}`);
  console.log(`[pbq] Force updated: ${(grouped["force-update"] || []).length}`);
  console.log(`[pbq] Candidates written: ${(grouped.candidate || []).length}`);
  console.log(`[pbq] Already current: ${(grouped.ok || []).length}`);
  if ((grouped.candidate || []).length > 0) {
    console.log("[pbq] Review .pbq-new files and merge manually; existing custom files were preserved.");
  }
  if (catalogCount > 0) {
    console.log(`[pbq] ${catalogCount} sensores no catalogo. Rode 'pbq sensor catalog' ou /sensor para adicionar.`);
  }
}

async function runPackageCommand(args) {
  const action = args.shift();
  if (action !== "close") {
    throw new Error("Uso: pbq package close [path] --spec <spec-name> --package <N> [--tiers fast,medium,slow]");
  }

  const options = parsePackageCloseArgs(args);
  const targetRoot = path.resolve(options.targetPath);
  const event = options.phase === "before" ? "edit" : "close";
  const sensors = (await readSensors(targetRoot)).filter(
    (sensor) =>
      sensor.enabled !== false &&
      (sensor.tier === undefined || options.tiers.includes(sensor.tier)) &&
      isSensorEligibleForEvent(sensor, event)
  );
  const result = executePackageSensors(targetRoot, sensors);
  await writePackageEvaluation(targetRoot, options, result);

  console.log(`[pbq] Package ${options.packageNumber} evaluation Score: ${result.score}`);
  if (result.score !== 1) {
    process.exitCode = 1;
  }
}

function parsePackageCloseArgs(args) {
  const options = {
    targetPath: ".",
    spec: "",
    packageNumber: "",
    tiers: ["fast", "medium", "slow"],
    phase: "after"
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--spec") options.spec = readOptionValue(args, ++index, "--spec");
    else if (arg === "--package") options.packageNumber = readOptionValue(args, ++index, "--package");
    else if (arg === "--tiers") options.tiers = readOptionValue(args, ++index, "--tiers").split(",").map((tier) => tier.trim());
    else if (arg === "--phase") options.phase = readOptionValue(args, ++index, "--phase");
    else if (arg.startsWith("--")) throw new Error(`Opcao desconhecida: ${arg}`);
    else options.targetPath = arg;
  }

  if (!options.spec) throw new Error("Informe --spec.");
  if (!options.packageNumber) throw new Error("Informe --package.");
  if (options.tiers.some((tier) => !["fast", "medium", "slow"].includes(tier))) {
    throw new Error("--tiers deve conter apenas fast, medium ou slow.");
  }
  if (!["before", "after"].includes(options.phase)) {
    throw new Error("--phase deve ser before ou after.");
  }

  return options;
}

function buildSensorEvidence(rawOutput, startedAt) {
  if (!rawOutput) return `Executado em ${startedAt}`;
  const MAX_CHARS = 500;
  return rawOutput.length > MAX_CHARS ? `...${rawOutput.slice(-MAX_CHARS)}` : rawOutput;
}

function runSensor(root, sensor) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(sensor.command, {
    cwd: root,
    encoding: "utf8",
    shell: true,
    stdio: ["ignore", "pipe", "pipe"]
  });
  const exitCode = typeof result.status === "number" ? result.status : 1;
  const rawOutput = ((result.stdout || "") + (result.stderr || "")).trim();
  return {
    sensor: sensor.name,
    tier: sensor.tier || "-",
    required: "sim",
    status: exitCode === 0 ? "passou" : "falhou",
    command: sensor.command,
    exitCode,
    evidence: buildSensorEvidence(rawOutput, startedAt)
  };
}

function executePackageSensors(root, sensors) {
  if (sensors.length === 0) {
    return {
      score: 0,
      executedAt: new Date().toISOString(),
      rows: [
        {
          sensor: "nenhum",
          tier: "-",
          required: "sim",
          status: "pendente",
          command: "-",
          exitCode: "-",
          evidence: "Nenhum sensor cadastrado para os tiers solicitados."
        }
      ]
    };
  }

  const rows = sensors.map((sensor) => runSensor(root, sensor));

  return {
    score: rows.every((row) => row.status === "passou") ? 1 : 0,
    executedAt: new Date().toISOString(),
    rows
  };
}

async function writePackageEvaluation(root, options, result) {
  const evaluationDir = path.join(root, HARNESS_DIR, "specs", options.spec, "evaluations");
  await mkdir(evaluationDir, { recursive: true });
  const evaluationPath = path.join(evaluationDir, `package-${options.packageNumber}.md`);
  await writeFile(evaluationPath, packageEvaluationContent(options, result), "utf8");
}

function packageEvaluationContent(options, result) {
  return `# Evaluation: Package ${options.packageNumber}

Score: ${result.score}

## Resumo De Sensores

| Sensor | Tier | Obrigatorio | Status | Comando | Exit Code | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
${result.rows.map((row) => `| ${escapeMarkdownCell(row.sensor)} | ${row.tier} | ${row.required} | ${row.status} | \`${escapeMarkdownCell(row.command)}\` | ${row.exitCode} | ${escapeMarkdownCell(row.evidence)} |`).join("\n")}

Status permitidos:

- \`passou\`
- \`falhou\`
- \`pendente\`
- \`nao-aplicavel\`

Regra:

- Todo sensor obrigatorio do contrato deve aparecer nesta tabela.
- \`Score: 1\` exige todos os sensores obrigatorios com status \`passou\`.
- Se algum sensor obrigatorio estiver \`falhou\`, \`pendente\` ou ausente, o Score deve ser \`0\`.

## Log De Execucao Dos Sensores

- Executado em: ${result.executedAt}
- Tiers: ${options.tiers.join(", ")}

## Resultado

${result.score === 1 ? "Todos os sensores executados passaram." : "Um ou mais sensores falharam ou ficaram pendentes."}

## Evidencias

Ver tabela de sensores.

## Violacoes Encontradas

${result.score === 1 ? "Nenhuma violacao critica encontrada pelos sensores executados." : "Ha falha ou pendencia em sensor obrigatorio."}

## Riscos Residuais

Registrar manualmente riscos que os sensores nao cobrem.

## Proxima Acao Recomendada

${result.score === 1 ? "Atualizar progress.md e roadmap.md se a spec foi concluida." : "Corrigir falhas e executar novamente pbq package close."}
`;
}

function escapeMarkdownCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

async function runDashboardCommand(args) {
  const options = parseDashboardArgs(args);
  const targetRoot = path.resolve(options.targetPath);
  const dashboard = await collectDashboardState(targetRoot);
  if (options.serve) {
    const outputDir = options.outputDir || path.join(HARNESS_DIR, "dashboard");
    const snapshot = await writeDashboardSnapshot(targetRoot, dashboard, outputDir);
    const server = await startDashboardServer(snapshot.outputDir, options.port);
    if (options.watch) {
      startDashboardWatcher(targetRoot, snapshot.outputDir, server);
    }
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : options.port;
    console.log(`[pbq] Dashboard server: http://127.0.0.1:${port}/`);
    console.log(`[pbq] Snapshot dir: ${snapshot.outputDir}`);
    return;
  }
  if (options.outputDir) {
    const snapshot = await writeDashboardSnapshot(targetRoot, dashboard, options.outputDir);
    if (options.json) {
      console.log(`[pbq] Dashboard snapshot written: ${snapshot.outputDir}`);
      return;
    }
    if (!options.resume) {
      console.log(`[pbq] Dashboard snapshot written: ${snapshot.outputDir}`);
      return;
    }
  }
  if (options.json) {
    console.log(JSON.stringify(sanitizeDashboardForJson(dashboard), null, 2));
    return;
  }
  renderDashboard(dashboard, options);
}

function parseDashboardArgs(args) {
  const options = {
    targetPath: ".",
    resume: false,
    json: false,
    outputDir: "",
    serve: false,
    watch: false,
    port: 4173
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--resume") {
      options.resume = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--output") {
      options.outputDir = readOptionValue(args, ++index, "--output");
    } else if (arg === "--serve") {
      options.serve = true;
    } else if (arg === "--watch") {
      options.watch = true;
    } else if (arg === "--port") {
      options.port = Number(readOptionValue(args, ++index, "--port"));
    } else if (arg.startsWith("--")) {
      throw new Error(`Opcao desconhecida: ${arg}`);
    } else {
      options.targetPath = arg;
    }
  }

  if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535) {
    throw new Error("--port deve ser um inteiro entre 0 e 65535.");
  }

  return options;
}

async function collectDashboardState(root) {
  const harnessRoot = path.join(root, HARNESS_DIR);
  if (!existsSync(harnessRoot)) {
    throw new Error(`Harness nao encontrado em ${HARNESS_DIR}. Rode pbq init primeiro.`);
  }

  const sensors = await readSensors(root).catch(() => []);
  const roadmapPath = path.join(harnessRoot, "roadmap.md");
  const roadmapRows = existsSync(roadmapPath) ? parseRoadmapSpecRows(await readFile(roadmapPath, "utf8")) : [];
  const specsRoot = path.join(harnessRoot, "specs");
  const specs = await listSpecDirectories(specsRoot);
  const specByName = new Map(specs.map((spec) => [spec.name, spec]));
  const orderedNames = [];

  for (const row of roadmapRows) {
    if (!orderedNames.includes(row.name)) orderedNames.push(row.name);
  }
  for (const spec of specs.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!orderedNames.includes(spec.name)) orderedNames.push(spec.name);
  }

  const dashboardSpecs = [];
  for (const name of orderedNames) {
    dashboardSpecs.push(
      await buildDashboardSpecEntry({
        root,
        spec: specByName.get(name) || null,
        roadmap: roadmapRows.find((row) => row.name === name) || null,
        sensors
      })
    );
  }

  dashboardSpecs.sort((a, b) => compareDashboardSpecs(a, b, "updated-desc"));
  const rows = dashboardSpecs.map((spec) => buildSpecDashboardRow(spec, sensors));

  if (rows.length === 0) {
    rows.push({
      number: 1,
      goal: "--",
      contract: "--",
      build: sensorBucketStatus(sensors, ["fast", "medium"], null),
      qa: sensorBucketStatus(sensors, ["slow"], null),
      score: "--"
    });
  }

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    root,
    sensors,
    summary: summarizeDashboardSpecs(dashboardSpecs),
    specs: dashboardSpecs,
    rows,
    activity: dashboardActivity(dashboardSpecs, rows, sensors)
  };
}

async function listSpecDirectories(specsRoot) {
  const entries = await readdir(specsRoot, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isDirectory() && /^spec-/i.test(entry.name))
    .map((entry) => ({
      name: entry.name,
      path: path.join(specsRoot, entry.name)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildSpecDashboardRow(spec, sensors) {
  const latestEvaluation = findLatestSpecEvaluation(spec, sensors);
  return {
    number: Number((spec.name.match(/^spec-(\d+)/i) || [])[1]) || 1,
    goal: spec.name,
    contract: spec.materialized && spec.packages.length > 0 && spec.packages.every((pkg) => !pkg.declaredInSpec || pkg.contractExists)
      ? "AGREED"
      : "PENDING",
    build: sensorBucketStatus(sensors, ["fast", "medium"], latestEvaluation),
    qa: sensorBucketStatus(sensors, ["slow"], latestEvaluation),
    score: latestEvaluation?.score ?? "--"
  };
}

async function listMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isFile() && /\.md$/i.test(entry.name))
    .map((entry) => path.join(directory, entry.name))
    .sort((a, b) => a.localeCompare(b));
}

function parseEvaluation(content) {
  const score = (content.match(/^Score:\s*([01])/m) || [])[1] || "--";
  const sensorRows = [];
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|") || /^(\|\s*-+\s*)+\|$/.test(trimmed)) continue;
    const cells = trimmed
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim().toLowerCase());
    if (cells.length < 4 || cells[0] === "sensor") continue;
    sensorRows.push({
      sensor: cells[0],
      tier: cells[1],
      required: cells[2],
      status: cells[3]
    });
  }

  return { score, sensorRows };
}

async function buildDashboardSpecEntry({ root, spec, roadmap, sensors }) {
  const entry = {
    name: roadmap?.name || spec?.name || "spec-desconhecida",
    status: roadmap?.status || "planejado",
    currentPackage: roadmap?.currentPackage || "",
    updatedAt: roadmap?.updatedAt || "",
    materialized: Boolean(spec),
    progress: {
      currentPackage: "",
      closedPackages: [],
      stages: []
    },
    packages: [],
    warnings: []
  };

  if (!spec) {
    if (!["planejado", "cancelado"].includes(entry.status)) {
      entry.warnings.push(`Spec ${entry.name} esta no roadmap com status "${entry.status}" mas nao possui pasta materializada.`);
    }
    entry.integrity = entry.warnings.length > 0 ? "warning" : "healthy";
    entry.integrityReason = summarizeSpecIntegrityReason(entry);
    return entry;
  }

  const specPath = path.join(spec.path, "spec.md");
  const progressPath = path.join(spec.path, "progress.md");
  const contractsDir = path.join(spec.path, "contracts");
  const evaluationsDir = path.join(spec.path, "evaluations");

  const specMd = existsSync(specPath) ? await readFile(specPath, "utf8") : "";
  const progressMd = existsSync(progressPath) ? await readFile(progressPath, "utf8") : "";
  const declared = parseSpecPackageRows(specMd);
  const contractFiles = await listPackageFiles(contractsDir);
  const evaluationFiles = await listPackageFiles(evaluationsDir);
  entry.progress.currentPackage = parseProgressCurrentPackage(progressMd);
  entry.progress.closedPackages = parseClosedPackages(progressMd);
  entry.progress.stages = parseProgressStageRows(progressMd);

  const packageNumbers = new Set([
    ...declared.integers,
    ...contractFiles.integers,
    ...evaluationFiles.integers
  ]);

  if (entry.currentPackage) packageNumbers.add(Number(entry.currentPackage));
  if (entry.progress.currentPackage) packageNumbers.add(Number(entry.progress.currentPackage));

  const sortedPackages = [...packageNumbers]
    .filter((num) => Number.isInteger(num) && num > 0)
    .sort((a, b) => a - b);

  for (const packageNumber of sortedPackages) {
    const contractPath = path.join(contractsDir, `package-${packageNumber}.md`);
    const evaluationPath = path.join(evaluationsDir, `package-${packageNumber}.md`);
    const contractExists = existsSync(contractPath);
    const evaluationExists = existsSync(evaluationPath);
    const contractMd = contractExists ? await readFile(contractPath, "utf8") : "";
    const evaluationMd = evaluationExists ? await readFile(evaluationPath, "utf8") : "";
    const requiredSensors = contractExists
      ? parseContractRequiredSensors(contractMd)
          .filter((sensor) => sensor.hasName)
          .map((sensor) => {
            const known = sensors.find((item) => item.name === sensor.name);
            return { name: sensor.name, registered: Boolean(known), tier: known?.tier || "-" };
          })
      : [];
    const evaluationSensors = evaluationExists
      ? parseEvaluationSensorRows(evaluationMd).map((sensor) => ({
          name: sensor.name,
          status: sensor.status
        }))
      : [];
    const score = evaluationExists ? parseEvaluationScore(evaluationMd) : null;

    entry.packages.push({
      number: packageNumber,
      declaredInSpec: declared.integers.has(packageNumber),
      contractExists,
      evaluationExists,
      score,
      requiredSensors,
      evaluationSensors
    });

    if (declared.integers.has(packageNumber) && !contractExists) {
      entry.warnings.push(`Package ${packageNumber} declarado na spec sem contract.`);
    }
    for (const required of requiredSensors) {
      if (!required.registered) {
        entry.warnings.push(`Package ${packageNumber} exige sensor "${required.name}" ausente de sensors.json.`);
      }
    }
  }

  if (entry.status === "concluido" && !entry.packages.some((pkg) => pkg.evaluationExists && pkg.score === 1)) {
    entry.warnings.push(`Spec ${entry.name} esta concluida no roadmap sem evaluation Score 1 visivel no dashboard.`);
  }

  entry.integrity = summarizeSpecIntegrity(entry);
  entry.integrityReason = summarizeSpecIntegrityReason(entry);
  return entry;
}

function summarizeSpecIntegrity(spec) {
  if (!spec.materialized && !["planejado", "cancelado"].includes(spec.status)) return "critical";
  if (spec.packages.some((pkg) => pkg.evaluationExists && pkg.score !== 1)) return "critical";
  if (spec.warnings.length > 0) return "warning";
  return "healthy";
}

function summarizeSpecIntegrityReason(spec) {
  if (!spec.materialized && !["planejado", "cancelado"].includes(spec.status)) {
    return `spec em ${spec.status} sem pasta materializada`;
  }
  const failedPackage = spec.packages.find((pkg) => pkg.evaluationExists && pkg.score !== 1);
  if (failedPackage) {
    return `package ${failedPackage.number} com evaluation Score ${failedPackage.score ?? "-"}`;
  }
  if (spec.warnings.length > 0) {
    return spec.warnings[0];
  }
  return spec.materialized ? "materialized" : "roadmap-only";
}

function summarizeDashboardSpecs(specs) {
  const summary = {
    specsByStatus: {},
    integrity: {
      healthy: 0,
      warning: 0,
      critical: 0
    },
    totals: {
      specs: specs.length,
      materializedSpecs: 0,
      plannedOnlySpecs: 0,
      packages: 0,
      contracts: 0,
      evaluations: 0
    }
  };

  for (const spec of specs) {
    summary.specsByStatus[spec.status] = (summary.specsByStatus[spec.status] || 0) + 1;
    summary.integrity[spec.integrity] = (summary.integrity[spec.integrity] || 0) + 1;
    if (spec.materialized) summary.totals.materializedSpecs += 1;
    else summary.totals.plannedOnlySpecs += 1;
    summary.totals.packages += spec.packages.length;
    summary.totals.contracts += spec.packages.filter((pkg) => pkg.contractExists).length;
    summary.totals.evaluations += spec.packages.filter((pkg) => pkg.evaluationExists).length;
  }

  return summary;
}

function specSequenceNumber(spec) {
  return Number((spec?.name?.match(/^spec-(\d+)/i) || [])[1]) || 0;
}

function compareDashboardSpecs(left, right, mode = "updated-desc") {
  const leftUpdated = left.updatedAt || "";
  const rightUpdated = right.updatedAt || "";
  const nameCompare = left.name.localeCompare(right.name);
  const numberCompare = specSequenceNumber(left) - specSequenceNumber(right);

  if (mode === "updated-asc") {
    if (leftUpdated !== rightUpdated) return leftUpdated.localeCompare(rightUpdated);
    if (numberCompare !== 0) return numberCompare;
    return nameCompare;
  }
  if (mode === "name-asc") return nameCompare;
  if (mode === "name-desc") return right.name.localeCompare(left.name);

  if (leftUpdated !== rightUpdated) return rightUpdated.localeCompare(leftUpdated);
  if (numberCompare !== 0) return rightNumberFallback(numberCompare);
  return right.name.localeCompare(left.name);
}

function rightNumberFallback(numberCompare) {
  return numberCompare * -1;
}

function findLatestSpecEvaluation(spec, sensors = []) {
  const candidates = spec.packages
    .filter((pkg) => pkg.evaluationExists)
    .sort((a, b) => a.number - b.number);
  if (candidates.length === 0) return null;
  const latest = candidates[candidates.length - 1];
  return {
    score: latest.score ?? "--",
    sensorRows: latest.evaluationSensors.map((sensor) => ({
      sensor: sensor.name,
      tier: inferSensorTier(latest, sensors, sensor.name),
      required: latest.requiredSensors.some((required) => required.name === sensor.name) ? "sim" : "nao",
      status: sensor.status
    }))
  };
}

function inferSensorTier(pkg, sensors, sensorName) {
  const known = sensors.find((sensor) => sensor.name === sensorName);
  if (known?.tier) return known.tier;
  const required = pkg.requiredSensors.find((sensor) => sensor.name === sensorName);
  return required?.tier || "-";
}

function sensorBucketStatus(sensors, tiers, evaluation) {
  const expected = sensors.filter((sensor) => tiers.includes(sensor.tier) && sensor.enabled !== false);
  if (expected.length === 0) return "--";
  if (!evaluation || evaluation.sensorRows.length === 0) return "PENDING";

  const relevant = evaluation.sensorRows.filter((row) => tiers.includes(row.tier) && row.required !== "nao");
  if (relevant.length === 0) return "PENDING";
  if (relevant.some((row) => row.status === "falhou")) return "FAILED";
  if (relevant.some((row) => row.status === "pendente")) return "PENDING";
  if (relevant.every((row) => row.status === "passou" || row.status === "nao-aplicavel")) return "PASS";
  return "PENDING";
}

function dashboardActivity(specs, rows, sensors) {
  if (specs.some((spec) => spec.integrity === "critical")) return "Critical integrity issues need attention.";
  if (rows.some((row) => row.contract === "PENDING")) return "Waiting for contract agreement...";
  if (rows.some((row) => row.build === "PENDING")) return "Waiting for build sensors...";
  if (rows.some((row) => row.qa === "PENDING")) return "Waiting for QA sensors...";
  if (rows.some((row) => row.score === "0" || row.score === "--")) return "Waiting for package evaluation...";
  if (sensors.length === 0) return "No sensors registered yet.";
  return "All visible stages are complete.";
}

async function writeDashboardSnapshot(targetRoot, dashboard, outputDirArg) {
  const payload = JSON.stringify(sanitizeDashboardForJson(dashboard), null, 2);
  const outputDir = path.isAbsolute(outputDirArg) ? outputDirArg : path.join(targetRoot, outputDirArg);
  await mkdir(outputDir, { recursive: true });
  const statusPath = path.join(outputDir, "status.json");
  const htmlPath = path.join(outputDir, "index.html");
  await writeFile(statusPath, `${payload}\n`, "utf8");
  await writeFile(htmlPath, renderDashboardHtml(sanitizeDashboardForJson(dashboard)), "utf8");
  return { outputDir, statusPath, htmlPath };
}

function sanitizeDashboardForJson(dashboard) {
  return {
    schemaVersion: dashboard.schemaVersion,
    generatedAt: dashboard.generatedAt,
    root: dashboard.root,
    summary: dashboard.summary,
    specs: dashboard.specs
  };
}

function renderDashboardHtml(dashboard) {
  const specsByStatus = new Map();
  for (const status of ["planejado", "em andamento", "bloqueado", "concluido", "cancelado"]) {
    specsByStatus.set(status, dashboard.specs.filter((spec) => spec.status === status));
  }

  const stageColumns = [
    "1. spec",
    "2. contract (validacao)",
    "3. implement",
    "4. test/qa",
    "5. roadmap"
  ];

  const cardsHtml = [...specsByStatus.entries()]
    .map(([status, specs]) => {
      const cards = specs.length
        ? specs
            .map(
              (spec) => `
          <article class="spec-card integrity-${escapeHtml(spec.integrity)}">
            <header>
              <h3>${escapeHtml(spec.name)}</h3>
              <span class="pill">${escapeHtml(spec.materialized ? "materialized" : "roadmap-only")}</span>
            </header>
            <p class="meta">package atual: ${escapeHtml(spec.currentPackage || "-")}</p>
            <p class="meta">packages: ${spec.packages.length} | warnings: ${spec.warnings.length}</p>
          </article>`
            )
            .join("")
        : `<div class="empty">Nenhuma spec</div>`;
      return `
      <section class="kanban-column">
        <header>
          <h2>${escapeHtml(status)}</h2>
          <span>${specs.length}</span>
        </header>
        <div class="kanban-cards">${cards}</div>
      </section>`;
    })
    .join("");

  const ganttRows = dashboard.specs
    .map((spec) => {
      const evaluationsCount = spec.packages.filter((pkg) => pkg.evaluationExists).length;
      const stageByName = new Map(spec.progress.stages.map((stage) => [normalizeStageName(stage.stage), stage.status]));
      const packageSummary = spec.packages.length
        ? spec.packages
            .map(
              (pkg) => `
            <div class="collapse-package">
              <strong>package ${pkg.number}</strong>
              <span>contract: ${pkg.contractExists ? "yes" : "no"}</span>
              <span>evaluation: ${pkg.evaluationExists ? "yes" : "no"}</span>
              <span>score: ${pkg.score ?? "-"}</span>
            </div>`
            )
            .join("")
        : `<div class="collapse-empty">Sem packages materializados; aguardando pasta/contratos.</div>`;
      const stageCells = stageColumns
        .map((stage) => {
          const status = stageByName.get(stage) || "";
          const statusClass = normalizeStageName(status || "missing").replace(/[^a-z0-9]+/g, "-");
          return `<span class="stage-cell stage-${escapeHtml(statusClass)}" title="${escapeHtml(
            `${stage}: ${status || "sem evidencia"}`
          )}">${stageStatusEmoji(status)}</span>`;
        })
        .join("");
      return `
        <div class="gantt-row integrity-${escapeHtml(spec.integrity)}" data-spec-name="${escapeHtml(spec.name.toLowerCase())}" data-spec-status="${escapeHtml(spec.status)}" data-spec-integrity="${escapeHtml(spec.integrity)}" data-spec-updated-at="${escapeHtml(spec.updatedAt || "")}" data-spec-number="${escapeHtml(String(specSequenceNumber(spec)))}">
          <div class="gantt-spec">
            <strong>${escapeHtml(spec.name)}</strong>
            <span class="gantt-sub">${escapeHtml(spec.integrity !== "healthy" ? spec.integrityReason : (spec.materialized ? "materialized" : "roadmap-only"))}</span>
          </div>
          <div class="gantt-integrity"><span class="swatch swatch-${escapeHtml(spec.integrity)}"></span><span>${escapeHtml(spec.integrity)}</span></div>
          <div class="gantt-status">${escapeHtml(spec.status)}</div>
          <div class="gantt-count">${spec.packages.length}</div>
          <div class="gantt-count">${evaluationsCount}</div>
          ${stageCells}
        </div>
        <div class="gantt-detail-row" data-spec-name="${escapeHtml(spec.name.toLowerCase())}" data-spec-status="${escapeHtml(spec.status)}" data-spec-integrity="${escapeHtml(spec.integrity)}" data-spec-updated-at="${escapeHtml(spec.updatedAt || "")}" data-spec-number="${escapeHtml(String(specSequenceNumber(spec)))}">
          <div class="gantt-detail-cell">
            <details class="gantt-collapse">
              <summary>ver packages (${spec.packages.length})</summary>
              <div class="gantt-collapse-body">${packageSummary}</div>
            </details>
          </div>
        </div>`;
    })
    .join("");

  const warnings = dashboard.specs.flatMap((spec) =>
    spec.warnings.map((warning) => `<li><strong>${escapeHtml(spec.name)}:</strong> ${escapeHtml(warning)}</li>`)
  );
  const statusSummaryCards = ["planejado", "em andamento", "concluido", "bloqueado", "cancelado"]
    .filter((status) => dashboard.summary.specsByStatus[status] !== undefined)
    .map(
      (status) =>
        `<article><strong>${dashboard.summary.specsByStatus[status]}</strong><span>status: ${escapeHtml(status)}</span></article>`
    )
    .join("");
  const integritySummaryCards = ["healthy", "warning", "critical"]
    .map(
      (integrity) =>
        `<article><strong>${dashboard.summary.integrity[integrity] || 0}</strong><span>integridade: ${escapeHtml(integrity)}</span></article>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PBQ Dashboard</title>
  <style>
    :root {
      --bg: #f2efe8;
      --panel: #fbf8f2;
      --ink: #172126;
      --muted: #5e6a70;
      --line: #d8d0c3;
      --accent: #0f766e;
      --accent-soft: #d8efe9;
      --warning: #b45309;
      --warning-soft: #fde8c8;
      --critical: #b42318;
      --critical-soft: #fee4e2;
      --shadow: 0 18px 40px rgba(39, 30, 19, 0.08);
      --radius: 8px;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", "Helvetica Neue", sans-serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, rgba(15, 118, 110, 0.08), transparent 28%),
        linear-gradient(180deg, #f8f4ec 0%, var(--bg) 100%);
    }
    main {
      width: 100%;
      padding: 28px 20px 48px;
    }
    .hero, .panel {
      background: rgba(251, 248, 242, 0.92);
      border: 1px solid var(--line);
      box-shadow: var(--shadow);
      border-radius: var(--radius);
    }
    .hero {
      padding: 28px;
      display: grid;
      gap: 18px;
    }
    .hero h1 {
      margin: 0;
      font-size: clamp(32px, 4vw, 54px);
      font-weight: 700;
    }
    .hero p {
      margin: 0;
      color: var(--muted);
      max-width: 940px;
      line-height: 1.5;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
    }
    .summary article {
      padding: 14px 16px;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: var(--radius);
    }
    .summary strong {
      display: block;
      font-size: 24px;
    }
    .summary span {
      color: var(--muted);
      font-size: 13px;
    }
    .summary-stack {
      display: grid;
      gap: 14px;
    }
    .summary-section {
      display: grid;
      gap: 10px;
    }
    .summary-section h2 {
      margin: 0;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--muted);
    }
    section.panel {
      margin-top: 20px;
      padding: 20px;
    }
    section.panel > header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: baseline;
      margin-bottom: 16px;
    }
    section.panel h2 {
      margin: 0;
      font-size: 20px;
    }
    section.panel p {
      margin: 0;
      color: var(--muted);
    }
    .gantt-wrapper {
      overflow-x: auto;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: rgba(255,255,255,0.5);
    }
    .gantt-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 10px 18px;
      align-items: center;
      margin: 0 0 12px;
      font-size: 12px;
      color: var(--muted);
    }
    .dashboard-filters {
      display: grid;
      grid-template-columns: minmax(220px, 1.4fr) repeat(3, minmax(160px, 0.5fr));
      gap: 10px;
      margin: 0 0 12px;
    }
    .filter-control {
      display: grid;
      gap: 6px;
      font-size: 12px;
      color: var(--muted);
    }
    .filter-control input,
    .filter-control select {
      width: 100%;
      min-height: 38px;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 8px 10px;
      background: rgba(255,255,255,0.82);
      color: var(--ink);
      font: inherit;
    }
    .gantt-legend strong {
      color: var(--ink);
      font-size: 12px;
    }
    .legend-group {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }
    .gantt-grid {
      min-width: 1180px;
      display: grid;
    }
    .gantt-head,
    .gantt-row {
      display: grid;
      grid-template-columns: minmax(280px, 1.7fr) 120px 110px 88px 98px repeat(5, minmax(84px, 0.5fr));
      align-items: center;
    }
    .gantt-head {
      position: sticky;
      top: 0;
      z-index: 1;
      background: rgba(244, 239, 231, 0.98);
      border-bottom: 1px solid var(--line);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--muted);
    }
    .gantt-head span,
    .gantt-row > * {
      padding: 14px 16px;
      border-right: 1px solid var(--line);
    }
    .gantt-head span:last-child,
    .gantt-row > *:last-child {
      border-right: 0;
    }
    .gantt-row {
      background: rgba(251, 248, 242, 0.92);
      border-bottom: 1px solid var(--line);
      font-size: 13px;
    }
    .gantt-row:last-child {
      border-bottom: 1px solid var(--line);
    }
    .gantt-spec {
      display: grid;
      gap: 4px;
    }
    .gantt-sub {
      color: var(--muted);
      font-size: 11px;
    }
    .gantt-integrity,
    .gantt-status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--muted);
    }
    .swatch {
      width: 12px;
      height: 12px;
      border-radius: 2px;
      border: 1px solid rgba(0, 0, 0, 0.12);
      display: inline-block;
      flex: 0 0 auto;
    }
    .swatch-healthy { background: #16a34a; }
    .swatch-warning { background: #d97706; }
    .swatch-critical { background: #dc2626; }
    .gantt-status {
      text-transform: lowercase;
    }
    .gantt-count {
      text-align: center;
      font-weight: 700;
      font-size: 15px;
    }
    .stage-cell {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 48px;
      font-size: 18px;
      background: transparent;
    }
    .stage-icon-soon {
      display: inline-grid;
      justify-items: center;
      line-height: 1;
      gap: 2px;
      font-size: 11px;
      font-weight: 700;
      color: #b45309;
    }
    .stage-icon-soon .arrow {
      font-size: 14px;
    }
    .gantt-detail-row {
      display: block;
      background: rgba(247, 241, 232, 0.86);
      border-bottom: 1px solid var(--line);
    }
    .gantt-detail-cell {
      padding: 0 16px 14px 16px;
    }
    .gantt-collapse {
      width: 100%;
    }
    .gantt-collapse summary {
      cursor: pointer;
      list-style: none;
      color: var(--accent);
      font-size: 12px;
      font-weight: 700;
    }
    .gantt-collapse summary::-webkit-details-marker {
      display: none;
    }
    .gantt-collapse summary::before {
      content: "▸";
      display: inline-block;
      margin-right: 8px;
      color: var(--muted);
    }
    .gantt-collapse[open] summary::before {
      content: "▾";
    }
    .gantt-collapse-body {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 10px;
      align-items: flex-start;
    }
    .collapse-package {
      display: grid;
      gap: 3px;
      min-width: 132px;
      padding: 10px 12px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: rgba(255,255,255,0.62);
      color: var(--muted);
      font-size: 12px;
    }
    .collapse-package strong {
      color: var(--ink);
      font-size: 12px;
    }
    .collapse-empty {
      color: var(--muted);
      font-size: 12px;
      align-self: center;
    }
    .kanban {
      display: grid;
      grid-template-columns: repeat(5, minmax(220px, 1fr));
      gap: 14px;
      overflow-x: auto;
    }
    .kanban-column {
      min-width: 220px;
      background: linear-gradient(180deg, rgba(255,255,255,0.82), rgba(247,241,232,0.92));
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: 14px;
    }
    .kanban-column > header,
    .spec-card > header {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: baseline;
    }
    .kanban-column h2,
    .spec-card h3 {
      margin: 0;
    }
    .kanban-cards {
      display: grid;
      gap: 10px;
      margin-top: 12px;
    }
    .spec-card {
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--panel);
      padding: 12px;
    }
    .meta {
      margin: 8px 0 0;
      color: var(--muted);
      font-size: 13px;
    }
    .pill {
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 12px;
      background: var(--accent-soft);
      color: var(--accent);
      white-space: nowrap;
    }
    .integrity-warning { border-color: var(--warning); background: var(--warning-soft); }
    .integrity-critical { border-color: var(--critical); background: var(--critical-soft); }
    .warnings {
      margin: 0;
      padding-left: 18px;
      display: grid;
      gap: 8px;
    }
    .empty {
      color: var(--muted);
      font-size: 13px;
      padding: 12px 4px;
    }
    @media (max-width: 960px) {
      .kanban {
        grid-template-columns: repeat(5, minmax(240px, 1fr));
      }
    }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <div>
        <h1>PBQ Dashboard</h1>
        <p>Visualizacao derivada do harness. O estado exibido vem de roadmap, specs, contracts, progress, evaluations e sensors; o dashboard nao e fonte manual de verdade.</p>
      </div>
      <div class="summary-stack">
        <div class="summary-section">
          <h2>Totais Gerais</h2>
          <div class="summary">
            <article><strong>${dashboard.summary.totals.specs}</strong><span>specs visiveis</span></article>
            <article><strong>${dashboard.summary.totals.materializedSpecs}</strong><span>specs materializadas</span></article>
            <article><strong>${dashboard.summary.totals.packages}</strong><span>packages rastreados</span></article>
            <article><strong>${dashboard.summary.integrity.warning + dashboard.summary.integrity.critical}</strong><span>alertas de integridade</span></article>
          </div>
        </div>
        <div class="summary-section">
          <h2>Status</h2>
          <div class="summary">${statusSummaryCards}</div>
        </div>
        <div class="summary-section">
          <h2>Integridade</h2>
          <div class="summary">${integritySummaryCards}</div>
        </div>
      </div>
    </section>

    <section class="panel" id="gantt-execution">
      <header>
        <h2>Grade De Execucao</h2>
        <p>Uma linha por spec, com packages, evaluations e etapas concluidas</p>
      </header>
      <div class="dashboard-filters" aria-label="Filtros da grade de execucao">
        <label class="filter-control">
          <span>Buscar spec</span>
          <input id="filter-spec-text" type="search" placeholder="nome da spec" />
        </label>
        <label class="filter-control">
          <span>Status</span>
          <select id="filter-spec-status">
            <option value="">todos</option>
            <option value="planejado">planejado</option>
            <option value="em andamento">em andamento</option>
            <option value="concluido">concluido</option>
            <option value="bloqueado">bloqueado</option>
            <option value="cancelado">cancelado</option>
          </select>
        </label>
        <label class="filter-control">
          <span>Integridade</span>
          <select id="filter-spec-integrity">
            <option value="">todas</option>
            <option value="healthy">healthy</option>
            <option value="warning">warning</option>
            <option value="critical">critical</option>
          </select>
        </label>
        <label class="filter-control">
          <span>Ordenar</span>
          <select id="filter-spec-sort">
            <option value="updated-desc">mais atual -> mais antiga</option>
            <option value="updated-asc">mais antiga -> mais atual</option>
            <option value="name-asc">nome A -> Z</option>
            <option value="name-desc">nome Z -> A</option>
          </select>
        </label>
      </div>
      <div class="gantt-legend" aria-label="Legenda da grade de execucao">
        <div class="legend-group">
          <strong>Integridade</strong>
          <span class="legend-item"><span class="swatch swatch-healthy"></span><span>healthy</span></span>
          <span class="legend-item"><span class="swatch swatch-warning"></span><span>warning</span></span>
          <span class="legend-item"><span class="swatch swatch-critical"></span><span>critical</span></span>
        </div>
        <div class="legend-group">
          <strong>Etapas</strong>
          <span class="legend-item"><span>✅</span><span>ok</span></span>
          <span class="legend-item"><span>🟡</span><span>em andamento</span></span>
          <span class="legend-item"><span class="stage-icon-soon"><span class="arrow">↑</span><span>SOON</span></span><span>pendente</span></span>
          <span class="legend-item"><span>❌</span><span>falhou</span></span>
          <span class="legend-item"><span>∅</span><span>nao-aplicavel</span></span>
          <span class="legend-item"><span>▫️</span><span>sem evidencia</span></span>
        </div>
      </div>
      <div class="gantt-wrapper">
        <div class="gantt-grid" id="gantt-grid">
          <div class="gantt-head">
            <span>Spec</span>
            <span>Integridade</span>
            <span>Status</span>
            <span>Packages</span>
            <span>Evaluations</span>
            ${stageColumns.map((stage) => `<span>${escapeHtml(stage)}</span>`).join("")}
          </div>
          ${ganttRows}
        </div>
      </div>
    </section>

    <section class="panel" id="integrity-matrix">
      <header>
        <h2>Integridade</h2>
        <p>Warnings e lacunas detectadas no snapshot</p>
      </header>
      ${warnings.length > 0 ? `<ul class="warnings">${warnings.join("")}</ul>` : `<div class="empty">Nenhum warning neste snapshot.</div>`}
    </section>
  </main>

  <script id="pbq-dashboard-data" type="application/json">${escapeScriptJson(JSON.stringify(dashboard))}</script>
  <script>
    const embedded = document.getElementById("pbq-dashboard-data");
    const initialDashboard = embedded ? JSON.parse(embedded.textContent) : null;
    const textFilter = document.getElementById("filter-spec-text");
    const statusFilter = document.getElementById("filter-spec-status");
    const integrityFilter = document.getElementById("filter-spec-integrity");
    const sortFilter = document.getElementById("filter-spec-sort");
    const ganttGrid = document.getElementById("gantt-grid");
    const compareSpecBlocks = (left, right, mode) => {
      const leftUpdated = left.row.getAttribute("data-spec-updated-at") || "";
      const rightUpdated = right.row.getAttribute("data-spec-updated-at") || "";
      const leftNumber = Number(left.row.getAttribute("data-spec-number") || "0");
      const rightNumber = Number(right.row.getAttribute("data-spec-number") || "0");
      const leftName = left.row.getAttribute("data-spec-name") || "";
      const rightName = right.row.getAttribute("data-spec-name") || "";
      if (mode === "updated-asc") {
        if (leftUpdated !== rightUpdated) return leftUpdated.localeCompare(rightUpdated);
        if (leftNumber !== rightNumber) return leftNumber - rightNumber;
        return leftName.localeCompare(rightName);
      }
      if (mode === "name-asc") return leftName.localeCompare(rightName);
      if (mode === "name-desc") return rightName.localeCompare(leftName);
      if (leftUpdated !== rightUpdated) return rightUpdated.localeCompare(leftUpdated);
      if (leftNumber !== rightNumber) return rightNumber - leftNumber;
      return rightName.localeCompare(leftName);
    };
    const applyDashboardSort = () => {
      if (!ganttGrid) return;
      const mode = sortFilter?.value || "updated-desc";
      const rows = Array.from(ganttGrid.querySelectorAll(".gantt-row"));
      const blocks = rows.map((row) => {
        const detail = row.nextElementSibling && row.nextElementSibling.classList.contains("gantt-detail-row")
          ? row.nextElementSibling
          : null;
        return { row, detail };
      });
      blocks.sort((left, right) => compareSpecBlocks(left, right, mode));
      for (const block of blocks) {
        ganttGrid.appendChild(block.row);
        if (block.detail) ganttGrid.appendChild(block.detail);
      }
    };
    const applyDashboardFilters = () => {
      const textValue = (textFilter?.value || "").trim().toLowerCase();
      const statusValue = statusFilter?.value || "";
      const integrityValue = integrityFilter?.value || "";
      const rows = document.querySelectorAll(".gantt-row");
      for (const row of rows) {
        const name = row.getAttribute("data-spec-name") || "";
        const status = row.getAttribute("data-spec-status") || "";
        const integrity = row.getAttribute("data-spec-integrity") || "";
        const matches =
          (!textValue || name.includes(textValue)) &&
          (!statusValue || status === statusValue) &&
          (!integrityValue || integrity === integrityValue);
        row.style.display = matches ? "" : "none";
        const detail = row.nextElementSibling;
        if (detail && detail.classList.contains("gantt-detail-row")) {
          detail.style.display = matches ? "" : "none";
        }
      }
    };
    textFilter?.addEventListener("input", applyDashboardFilters);
    statusFilter?.addEventListener("change", applyDashboardFilters);
    integrityFilter?.addEventListener("change", applyDashboardFilters);
    sortFilter?.addEventListener("change", applyDashboardSort);
    applyDashboardSort();
    applyDashboardFilters();
    if (location.protocol.startsWith("http")) {
      setInterval(async () => {
        try {
          const response = await fetch("./status.json", { cache: "no-store" });
          if (!response.ok) return;
          const next = await response.json();
          if (next.generatedAt && initialDashboard && next.generatedAt !== initialDashboard.generatedAt) {
            location.reload();
          }
        } catch {
        }
      }, 4000);
    }
  </script>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeScriptJson(value) {
  return value.replace(/<\//g, "<\\/");
}

function normalizeStageName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function stageStatusEmoji(status) {
  const normalized = normalizeStageName(status);
  if (normalized === "ok") return "✅";
  if (normalized === "em andamento") return "🟡";
  if (normalized === "pendente") return '<span class="stage-icon-soon"><span class="arrow">↑</span><span>SOON</span></span>';
  if (normalized === "falhou") return "❌";
  if (normalized === "nao-aplicavel") return "∅";
  return "▫️";
}

function startDashboardWatcher(targetRoot, outputDir, server) {
  let lastPayload = "";
  const run = async () => {
    const dashboard = await collectDashboardState(targetRoot);
    const payload = JSON.stringify(sanitizeDashboardForJson(dashboard));
    if (payload === lastPayload) return;
    lastPayload = payload;
    await writeDashboardSnapshot(targetRoot, dashboard, outputDir);
  };

  run().catch((error) => {
    console.error(`[pbq] dashboard watch failed: ${error.message}`);
  });

  const interval = setInterval(() => {
    run().catch((error) => {
      console.error(`[pbq] dashboard watch failed: ${error.message}`);
    });
  }, 1500);

  server.on("close", () => clearInterval(interval));
}

function startDashboardServer(outputDir, port) {
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url || "/", "http://127.0.0.1").pathname;
    const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    if (!["index.html", "status.json"].includes(relativePath)) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const filePath = path.join(outputDir, relativePath);
    if (!existsSync(filePath)) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": relativePath.endsWith(".json") ? "application/json; charset=utf-8" : "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    });
    response.end(body);
  });

  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

function renderDashboard(dashboard, options) {
  const width = 92;
  console.log(boxLine(width));
  console.log(boxText("pbq - Autonomous Development Pipeline", width));
  console.log(boxLine(width));
  console.log("");
  console.log(sectionBox("Sprints", renderSprintRows(dashboard.rows), width));
  console.log("");
  console.log(sectionBox("Activity", [dashboard.activity], width));
  console.log("");
  const status = options.resume ? "resume" : "status";
  console.log(sectionBox("Run", [`mode ${status}   specs ${dashboard.rows.length}   sensors ${dashboard.sensors.length}`], width));
}

function renderSprintRows(rows) {
  const output = [];
  output.push(padColumns(["#", "Goal", "Contract", "Build", "QA", "Score"], [5, 34, 14, 12, 12, 8]));
  output.push(padColumns(["-", "----", "--------", "-----", "--", "-----"], [5, 34, 14, 12, 12, 8]));
  for (const row of rows) {
    output.push(
      padColumns(
        [String(row.number), row.goal, row.contract, row.build, row.qa, String(row.score)],
        [5, 34, 14, 12, 12, 8]
      )
    );
  }
  return output;
}

function sectionBox(title, lines, width) {
  const content = [title, "", ...lines];
  return [boxLine(width), ...content.map((line) => boxText(line, width)), boxLine(width)].join("\n");
}

function boxLine(width) {
  return `+${"-".repeat(width - 2)}+`;
}

function boxText(text, width) {
  const clean = text.length > width - 4 ? text.slice(0, width - 7) + "..." : text;
  return `| ${clean.padEnd(width - 4, " ")} |`;
}

function padColumns(values, widths) {
  return values
    .map((value, index) => {
      const text = String(value);
      const width = widths[index];
      return (text.length > width - 1 ? text.slice(0, width - 4) + "..." : text).padEnd(width, " ");
    })
    .join("");
}

async function inspectProject(root) {
  const files = await listFiles(root, {
    maxFiles: 2000,
    ignoredDirectories: new Set([
      ".git",
      HARNESS_DIR,
      ".claude",
      "node_modules",
      "dist",
      "build",
      "out",
      "bin",
      "obj",
      ".next",
      ".nuxt",
      ".venv",
      "venv",
      "__pycache__"
    ])
  });

  const fileSet = new Set(files.map((file) => toPosix(file)));
  const packageJson = await readJsonIfExists(path.join(root, "package.json"));
  const agentInstructionFiles = findAgentInstructionFiles(files);
  const docs = await collectRepositoryDocs(root, files);
  const looseScriptCandidates = detectLooseScriptCandidates(fileSet);
  const makefileCandidates = await detectMakefileCandidates(root, fileSet);
  const commands = detectCommands(fileSet, packageJson, [...looseScriptCandidates, ...makefileCandidates]);
  const languages = detectLanguages(fileSet, packageJson);
  const risks = detectRisks(fileSet, packageJson);
  const architecture = inspectArchitecture(fileSet);

  return {
    root,
    files: [...fileSet].sort(),
    fileSet,
    packageJson,
    agentInstructionFiles,
    docs,
    commands,
    languages,
    risks,
    architecture
  };
}

async function listFiles(root, options, relative = "") {
  const current = path.join(root, relative);
  const entries = await readdir(current, { withFileTypes: true }).catch(() => []);
  const files = [];

  for (const entry of entries) {
    const nextRelative = path.join(relative, entry.name);
    if (entry.isDirectory()) {
      if (options.ignoredDirectories.has(entry.name)) continue;
      files.push(...(await listFiles(root, options, nextRelative)));
    } else if (entry.isFile()) {
      files.push(nextRelative);
      if (files.length >= options.maxFiles) break;
    }
  }

  return files.slice(0, options.maxFiles);
}

async function readJsonIfExists(file) {
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

function findAgentInstructionFiles(files) {
  const normalized = files.map((file) => toPosix(file));
  const exact = new Set([
    "AGENTS.md",
    "CLAUDE.md",
    ".cursorrules",
    ".windsurfrules",
    "GEMINI.md"
  ]);

  return normalized
    .filter((file) => {
      if (exact.has(file)) return true;
      if (file.startsWith(".cursor/rules/") && /\.(md|mdc|txt)$/i.test(file)) return true;
      if (file.startsWith(".windsurf/rules/") && /\.(md|txt)$/i.test(file)) return true;
      return false;
    })
    .sort();
}

async function collectRepositoryDocs(root, files) {
  const candidates = files
    .map((file) => toPosix(file))
    .filter((file) => {
      const base = path.posix.basename(file).toLowerCase();
      return (
        base === "readme.md" ||
        base === "agents.md" ||
        base === "claude.md" ||
        base === ".cursorrules" ||
        base === ".windsurfrules" ||
        file.toLowerCase().startsWith("docs/") ||
        file.toLowerCase().startsWith(".github/")
      );
    })
    .slice(0, 40);

  const docs = [];
  for (const relativePath of candidates) {
    const absolutePath = path.join(root, relativePath);
    let content = "";
    try {
      content = await readFile(absolutePath, "utf8");
    } catch {
      continue;
    }
    docs.push({
      path: relativePath,
      snippets: extractOperationalSnippets(content)
    });
  }
  return docs;
}

function extractOperationalSnippets(content) {
  const lines = content.split(/\r?\n/);
  const snippets = [];
  const patterns = [
    /\b(npm|pnpm|yarn|bun|dotnet|mvn|gradle|pytest|ruff|cargo|go test|make)\b/i,
    /\b(test|build|lint|format|deploy|rollback|architecture|arquitetura|regra|rule|must|deve|nao deve|não deve)\b/i
  ];

  for (const line of lines) {
    const clean = line.trim();
    if (!clean || clean.length > 220) continue;
    if (patterns.some((pattern) => pattern.test(clean))) {
      snippets.push(clean);
    }
    if (snippets.length >= 12) break;
  }

  return snippets;
}

function detectLanguages(fileSet, packageJson) {
  const languages = [];
  const add = (name) => {
    if (!languages.includes(name)) languages.push(name);
  };

  if (packageJson || hasAny(fileSet, ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb"])) {
    add("JavaScript/TypeScript");
  }
  if ([...fileSet].some((file) => /\.(cs|csproj|sln)$/i.test(file))) add(".NET");
  if ([...fileSet].some((file) => /\.(java|kt|kts)$/i.test(file)) || hasAny(fileSet, ["pom.xml", "build.gradle", "build.gradle.kts"])) {
    add("Java/JVM");
  }
  if ([...fileSet].some((file) => /\.py$/i.test(file)) || hasAny(fileSet, ["pyproject.toml", "requirements.txt", "pytest.ini"])) {
    add("Python");
  }
  if ([...fileSet].some((file) => /\.go$/i.test(file)) || hasAny(fileSet, ["go.mod"])) add("Go");
  if ([...fileSet].some((file) => /\.rs$/i.test(file)) || hasAny(fileSet, ["Cargo.toml"])) add("Rust");

  return languages;
}

function detectRisks(fileSet, packageJson) {
  const risks = [];
  if (hasAny(fileSet, [".env", ".env.local", ".env.production"])) {
    risks.push("Arquivos .env detectados: evitar leitura ou exposicao de segredos.");
  }
  if (hasAny(fileSet, ["docker-compose.yml", "docker-compose.yaml", "Dockerfile"])) {
    risks.push("Projeto usa Docker: sensores slow podem acionar servicos externos ou estado persistente.");
  }
  if (packageJson?.scripts) {
    for (const [name, value] of Object.entries(packageJson.scripts)) {
      if (/deploy|publish|release|migration|migrate|seed|db/i.test(`${name} ${value}`)) {
        risks.push(`Script sensivel detectado em package.json: ${name}. Exigir aprovacao humana antes de executar.`);
      }
    }
  }
  return [...new Set(risks)];
}

function inspectArchitecture(fileSet) {
  const files = [...fileSet];
  const directories = [...new Set(files.map((file) => file.split("/").slice(0, -1).join("/")).filter(Boolean))].sort();
  const topLevel = [...new Set(files.map((file) => file.split("/")[0]))].filter(Boolean).sort();

  const signals = [
    ["Presentation/UI", /(controllers?|views?|pages?|components?|screens?|ui|frontend|web|api)$/i],
    ["Application/Use cases", /(application|usecases?|handlers?|commands?|queries?)$/i],
    ["Domain/Model", /(domain|entities|models|valueobjects?|core)$/i],
    ["Infrastructure", /(infra|infrastructure|adapters?|persistence|repositories?|data|db|database)$/i],
    ["Tests", /(tests?|specs?|e2e|integrationtests?|unittests?)$/i],
    ["Configuration", /(\.github|config|configs|settings|deploy|k8s|helm)$/i]
  ].map(([name, pattern]) => ({
    name,
    matches: directories.filter((directory) => directory.split("/").some((part) => pattern.test(part))).slice(0, 12)
  })).filter((signal) => signal.matches.length > 0);

  const connectors = [];
  const addConnector = (name, pattern) => {
    const matches = files.filter((file) => pattern.test(file)).slice(0, 12);
    if (matches.length > 0) connectors.push({ name, matches });
  };

  addConnector("HTTP/API", /(controllers?|routes?|endpoints?|openapi|swagger|\.http$)/i);
  addConnector("Persistence/Database", /(dbcontext|migrations?|repositories?|\.sql$|entityframework|dapper|sequelize|prisma|typeorm)/i);
  addConnector("Messaging/Async", /(queue|queues|consumer|consumers|producer|producers|kafka|rabbit|servicebus|sqs|pubsub|eventbus)/i);
  addConnector("External services", /(clients?|gateways?|integrations?|providers?|httpclient|refit|grpc|\.proto$)/i);
  addConnector("Deployment/Runtime", /(dockerfile|docker-compose|kubernetes|deployment|helm|terraform|bicep|appsettings|\.env\.example$)/i);
  addConnector("Authentication/Security", /(auth|authentication|authorization|identity|jwt|oauth|security|permissions?)/i);

  return {
    topLevel: topLevel.slice(0, 30),
    signals,
    connectors
  };
}

function architectureSignalMd(architecture) {
  const sections = [];
  sections.push("Top-level detectado:");
  sections.push("");
  sections.push(mdList(architecture.topLevel, "- Nenhum diretorio/arquivo de topo detectado."));
  sections.push("");
  sections.push("Sinais de camadas/modulos:");
  sections.push("");
  if (architecture.signals.length === 0) {
    sections.push("- Nenhum sinal estrutural forte detectado automaticamente.");
  } else {
    for (const signal of architecture.signals) {
      sections.push(`- ${signal.name}: ${signal.matches.join(", ")}`);
    }
  }
  sections.push("");
  sections.push("Conectores e fronteiras tecnicas:");
  sections.push("");
  if (architecture.connectors.length === 0) {
    sections.push("- Nenhum conector tecnico forte detectado automaticamente.");
  } else {
    for (const connector of architecture.connectors) {
      sections.push(`- ${connector.name}: ${connector.matches.join(", ")}`);
    }
  }
  return sections.join("\n");
}

function detectCommands(fileSet, packageJson, extraCandidates = []) {
  const commands = {
    fast: [],
    medium: [],
    slow: [],
    placeholders: []
  };

  const add = (bucket, command, reason) => {
    if (!commands[bucket].some((item) => item.command === command)) {
      commands[bucket].push({ command, reason });
    }
  };

  const addCandidate = (candidate) => {
    if (!commands[candidate.tier].some((item) => item.command === candidate.command)) {
      const reason = candidate.tierUncertain
        ? `${candidate.reason} [tier-incerto]`
        : candidate.reason;
      commands[candidate.tier].push({
        command: candidate.command,
        reason,
        tierUncertain: candidate.tierUncertain || undefined
      });
    }
  };

  if (packageJson?.scripts) {
    const manager = detectNodePackageManager(fileSet);
    const scripts = packageJson.scripts;
    for (const name of ["lint", "typecheck", "check", "test:unit"]) {
      if (scripts[name]) add("fast", `${manager} run ${name}`, `package.json script '${name}'`);
    }
    if (scripts.test && !commands.fast.some((item) => item.command.includes("test:unit"))) {
      add("medium", `${manager} run test`, "package.json script 'test'");
    }
    for (const name of ["build", "test:integration", "integration"]) {
      if (scripts[name]) add("medium", `${manager} run ${name}`, `package.json script '${name}'`);
    }
    for (const name of ["test:e2e", "e2e", "test:slow", "playwright", "cypress"]) {
      if (scripts[name]) add("slow", `${manager} run ${name}`, `package.json script '${name}'`);
    }
  }

  if ([...fileSet].some((file) => /\.(sln|csproj)$/i.test(file))) {
    add("medium", "dotnet build", "Projeto .NET detectado");
    add("medium", "dotnet test", "Projeto .NET detectado");
    for (const projectFile of [...fileSet].filter((file) => /\.csproj$/i.test(file) && /(e2e|endtoend|end-to-end|playwright|selenium)/i.test(file))) {
      add("slow", `dotnet test "${projectFile}"`, `Projeto .NET E2E detectado: ${projectFile}`);
    }
  }

  if (hasAny(fileSet, ["gradlew", "gradlew.bat", "build.gradle", "build.gradle.kts"])) {
    const gradle = hasAny(fileSet, ["gradlew.bat"]) ? ".\\gradlew.bat" : "./gradlew";
    add("medium", `${gradle} build`, "Projeto Gradle detectado");
    add("medium", `${gradle} test`, "Projeto Gradle detectado");
  }

  if (hasAny(fileSet, ["pom.xml"])) {
    add("medium", "mvn test", "Projeto Maven detectado");
    add("medium", "mvn package -DskipTests", "Projeto Maven detectado");
  }

  if (hasAny(fileSet, ["pyproject.toml", "pytest.ini", "requirements.txt"]) || [...fileSet].some((file) => /\.py$/i.test(file))) {
    add("medium", "python -m pytest", "Projeto Python detectado");
  }

  if (hasAny(fileSet, ["go.mod"])) {
    add("medium", "go test ./...", "Projeto Go detectado");
  }

  if (hasAny(fileSet, ["Cargo.toml"])) {
    add("medium", "cargo test", "Projeto Rust detectado");
  }

  for (const candidate of extraCandidates) {
    addCandidate(candidate);
  }

  if (commands.fast.length === 0) {
    commands.placeholders.push({
      bucket: "fast",
      text: `Nenhum lint/typecheck/teste unitario rapido foi detectado. Use 'pbq sensor add' ou edite ${HARNESS_DIR}/sensors.json quando existir.`
    });
  }
  if (commands.medium.length === 0) {
    commands.placeholders.push({
      bucket: "medium",
      text: `Nenhum build/teste completo foi detectado. Use 'pbq sensor add' ou edite ${HARNESS_DIR}/sensors.json quando existir.`
    });
  }
  if (commands.slow.length === 0) {
    commands.placeholders.push({
      bucket: "slow",
      text: "Nenhum E2E/integracao pesada foi detectado. Mantenha run-slow como placeholder ate haver sensor real."
    });
  }

  return commands;
}

function detectNodePackageManager(fileSet) {
  if (fileSet.has("pnpm-lock.yaml")) return "pnpm";
  if (fileSet.has("yarn.lock")) return "yarn";
  if (fileSet.has("bun.lockb")) return "bun";
  return "npm";
}

function hasAny(fileSet, files) {
  return files.some((file) => fileSet.has(file));
}

async function generateFiles(project) {
  const sensors = buildSensors(project.commands);
  return Object.fromEntries([
    [`${HARNESS_DIR}/constitution/architecture.md`, constitutionArchitecture(project)],
    [`${HARNESS_DIR}/constitution/testing.md`, constitutionTesting(project)],
    [`${HARNESS_DIR}/constitution/operations.md`, constitutionOperations(project)],
    [`${HARNESS_DIR}/constitution/repository-rules.md`, constitutionRepositoryRules(project)],
    [`${HARNESS_DIR}/harness/README.md`, harnessReadme(project)],
    [`${HARNESS_DIR}/harness/prompts/implement-package.md`, await loadTemplate("harness/prompts/implement-package.md")],
    [`${HARNESS_DIR}/harness/prompts/validate-contract.md`, await loadTemplate("harness/prompts/validate-contract.md")],
    [`${HARNESS_DIR}/harness/prompts/run-evaluation.md`, await loadTemplate("harness/prompts/run-evaluation.md")],
    [`${HARNESS_DIR}/harness/scripts/check-harness-structure.ps1`, psCheckHarnessStructure()],
    [`${HARNESS_DIR}/harness/scripts/run-fast.ps1`, psRunScript("fast", sensors, project.commands.placeholders)],
    [`${HARNESS_DIR}/harness/scripts/run-medium.ps1`, psRunScript("medium", sensors, project.commands.placeholders)],
    [`${HARNESS_DIR}/harness/scripts/run-slow.ps1`, psRunScript("slow", sensors, project.commands.placeholders)],
    [`${HARNESS_DIR}/harness/scripts/check-harness-structure.sh`, shCheckHarnessStructure()],
    [`${HARNESS_DIR}/harness/scripts/run-fast.sh`, shRunScript("fast", sensors, project.commands.placeholders)],
    [`${HARNESS_DIR}/harness/scripts/run-medium.sh`, shRunScript("medium", sensors, project.commands.placeholders)],
    [`${HARNESS_DIR}/harness/scripts/run-slow.sh`, shRunScript("slow", sensors, project.commands.placeholders)],
    [`${HARNESS_DIR}/harness/scripts/run-commit.ps1`, psRunEventScript("commit", sensors)],
    [`${HARNESS_DIR}/harness/scripts/run-close.ps1`, psRunEventScript("close", sensors)],
    [`${HARNESS_DIR}/harness/scripts/run-commit.sh`, shRunEventScript("commit", sensors)],
    [`${HARNESS_DIR}/harness/scripts/run-close.sh`, shRunEventScript("close", sensors)],
    [`${HARNESS_DIR}/harness/hooks/pre-commit`, shPreCommitHook()],
    [`${HARNESS_DIR}/harness/hooks/pre-commit.ps1`, psPreCommitHook()],
    [`${HARNESS_DIR}/harness/templates/spec.md`, await loadTemplate("harness/templates/spec.md")],
    [`${HARNESS_DIR}/harness/templates/contract.md`, await loadTemplate("harness/templates/contract.md")],
    [`${HARNESS_DIR}/harness/templates/progress.md`, await loadTemplate("harness/templates/progress.md")],
    [`${HARNESS_DIR}/harness/templates/evaluation.md`, await loadTemplate("harness/templates/evaluation.md")],
    [`${HARNESS_DIR}/harness/templates/bug.md`, await loadTemplate("harness/templates/bug.md")],
    [`${HARNESS_DIR}/harness/templates/bug-progress.md`, await loadTemplate("harness/templates/bug-progress.md")],
    [`${HARNESS_DIR}/roadmap.md`, await loadTemplate("roadmap.md")],
    [`${HARNESS_DIR}/OVERVIEW.md`, await loadTemplate("harness/OVERVIEW.md")],
    [`${HARNESS_DIR}/specs/README.md`, await loadTemplate("specs/README.md")],
    [`${HARNESS_DIR}/bugs/README.md`, await loadTemplate("bugs/README.md")],
    [`${HARNESS_DIR}/sensors.json`, JSON.stringify({ version: 1, sensors }, null, 2) + "\n"],
    ...(await adapterSkillEntries())
  ]);
}

function withManifest(generated) {
  const files = {};
  for (const [relativePath, content] of Object.entries(generated)) {
    if (relativePath === `${HARNESS_DIR}/manifest.json`) continue;
    files[relativePath] = {
      sha256: sha256(content)
    };
  }
  return {
    ...generated,
    [`${HARNESS_DIR}/manifest.json`]: JSON.stringify(
      {
        version: PBQ_TEMPLATE_VERSION,
        files
      },
      null,
      2
    ) + "\n"
  };
}

function sha256(content) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

async function adapterSkillEntries() {
  const entries = [];
  for (const skill of ADAPTER_SKILLS) {
    const content = await loadTemplate(`adapters/skills/${skill}/SKILL.md`);
    entries.push([`.claude/skills/${skill}/SKILL.md`, content]);
    entries.push([`.agents/skills/${skill}/SKILL.md`, content]);
  }
  return entries;
}

function adapterSkillPaths() {
  return ADAPTER_SKILLS.flatMap((skill) => [
    `.claude/skills/${skill}/SKILL.md`,
    `.agents/skills/${skill}/SKILL.md`
  ]);
}

function buildSensors(commands) {
  const sensors = [];
  for (const tier of ["fast", "medium", "slow"]) {
    for (const item of commands[tier]) {
      const sensor = {
        name: sensorName(item.command),
        tier,
        on: legacyTierToOn(tier),
        command: item.command,
        reason: item.reason,
        source: "detected",
        enabled: true
      };
      if (item.tierUncertain) sensor.tierUncertain = true;
      sensors.push(sensor);
    }
  }
  return sensors;
}

function detectLooseScriptCandidates(fileSet) {
  const candidates = [];
  const tierByPrefix = [
    { prefixes: ["sonar", "lint", "typecheck", "format"], tier: "fast", uncertain: false },
    { prefixes: ["test", "build", "coverage"], tier: "medium", uncertain: false },
    { prefixes: ["e2e", "smoke", "integration"], tier: "slow", uncertain: false },
    { prefixes: ["qa"], tier: "medium", uncertain: true }
  ];

  for (const file of fileSet) {
    const isRoot = !file.includes("/");
    const isScriptsDir = file.startsWith("scripts/") && file.split("/").length === 2;
    if (!isRoot && !isScriptsDir) continue;

    const match = file.match(/^(?:scripts\/)?([^/]+)\.(bat|cmd|sh|ps1)$/i);
    if (!match) continue;
    const stem = match[1].toLowerCase();
    const ext = match[2].toLowerCase();

    const classification = tierByPrefix.find((entry) =>
      entry.prefixes.some((prefix) => stem === prefix || stem.startsWith(`${prefix}-`) || stem.startsWith(`${prefix}_`) || stem.startsWith(prefix + "."))
    );
    if (!classification) continue;

    let command;
    if (ext === "bat" || ext === "cmd") {
      command = `.\\${file.replace(/\//g, "\\")}`;
    } else if (ext === "ps1") {
      command = `powershell -NoProfile -ExecutionPolicy Bypass -File .\\${file.replace(/\//g, "\\")}`;
    } else {
      command = `sh ./${file}`;
    }

    candidates.push({
      tier: classification.tier,
      command,
      reason: `Script detectado em ${file}`,
      tierUncertain: classification.uncertain
    });
  }

  return candidates;
}

async function detectMakefileCandidates(root, fileSet) {
  const makefileName = fileSet.has("Makefile") ? "Makefile" : fileSet.has("makefile") ? "makefile" : null;
  if (!makefileName) return [];
  let content;
  try {
    content = await readFile(path.join(root, makefileName), "utf8");
  } catch {
    return [];
  }
  const targets = new Set();
  for (const line of content.split(/\r?\n/)) {
    const targetMatch = line.match(/^([A-Za-z][A-Za-z0-9_.-]*)\s*:/);
    if (targetMatch) targets.add(targetMatch[1].toLowerCase());
  }
  const mapping = [
    { target: "test", tier: "medium" },
    { target: "build", tier: "medium" },
    { target: "lint", tier: "fast" },
    { target: "e2e", tier: "slow" }
  ];
  const candidates = [];
  for (const { target, tier } of mapping) {
    if (targets.has(target)) {
      candidates.push({
        tier,
        command: `make ${target}`,
        reason: `Target detectado em Makefile: ${target}`,
        tierUncertain: false
      });
    }
  }
  return candidates;
}

function sensorName(command) {
  return command
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function loadTemplate(relativePath) {
  const templateRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "templates");
  return readFile(path.join(templateRoot, relativePath), "utf8");
}

async function loadSensorCatalog() {
  const catalogPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "templates", "sensor-catalog.json");
  try {
    const data = JSON.parse(await readFile(catalogPath, "utf8"));
    return Array.isArray(data.sensors) ? data.sensors : [];
  } catch {
    return [];
  }
}

async function writeManagedFile(root, relativePath, content, options, events) {
  const absolutePath = path.join(root, relativePath);
  const exists = existsSync(absolutePath);

  if (exists && !options.force) {
    events.push({ type: "skip", path: relativePath, reason: "exists" });
    return;
  }

  if (options.dryRun) {
    events.push({ type: exists ? "would-overwrite" : "would-create", path: relativePath });
    return;
  }

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, content, "utf8");
  events.push({ type: exists ? "overwrite" : "create", path: relativePath });
}

async function ensureDirectory(absolutePath, options = { dryRun: false }, events = []) {
  if (existsSync(absolutePath)) {
    const item = await stat(absolutePath);
    if (!item.isDirectory()) throw new Error(`Nao e diretorio: ${absolutePath}`);
    return;
  }

  if (options.dryRun) {
    events.push({ type: "would-create-dir", path: path.basename(absolutePath) });
    return;
  }

  await mkdir(absolutePath, { recursive: true });
}

async function integrateAgentInstructions(root, files, options, events) {
  const section = `${MARKER_START}
## Harness Engineering

Este repositorio possui um harness em \`${HARNESS_DIR}/\`.

Para mudancas medias ou grandes:
1. criar ou localizar uma spec em \`${HARNESS_DIR}/specs/\`
2. trabalhar contra um contrato em \`contracts/package-N.md\`
3. rodar sensores obrigatorios
4. registrar resultado em \`progress.md\` e \`evaluations/package-N.md\`

Mudancas pequenas podem usar contrato inline, desde que respeitem \`${HARNESS_DIR}/constitution/\` e os sensores aplicaveis.
${MARKER_END}
`;

  const targets = new Set(files);
  targets.add("AGENTS.md");
  targets.add("CLAUDE.md");

  for (const relativePath of [...targets].sort()) {
    const absolutePath = path.join(root, relativePath);
    if (!existsSync(absolutePath)) {
      if (options.dryRun) {
        events.push({ type: "would-create", path: relativePath });
        continue;
      }
      await writeFile(absolutePath, `# Agent Instructions\n\n${section}`, "utf8");
      events.push({ type: "create", path: relativePath });
      continue;
    }

    const current = await readFile(absolutePath, "utf8").catch(() => null);
    if (current === null) continue;
    if (current.includes(MARKER_START)) {
      events.push({ type: "skip", path: relativePath, reason: "marker exists" });
      continue;
    }

    if (options.dryRun) {
      events.push({ type: "would-append", path: relativePath });
      continue;
    }

    const next = current.endsWith("\n") ? `${current}\n${section}` : `${current}\n\n${section}`;
    await writeFile(absolutePath, next, "utf8");
    events.push({ type: "append", path: relativePath });
  }
}

function printSummary(targetRoot, project, events, options, catalogCount = 0) {
  const grouped = groupBy(events, "type");
  console.log(`[pbq] Harness target: ${targetRoot}`);
  if (options.dryRun) {
    console.log("[pbq] Dry run: nenhum arquivo foi alterado.");
    console.log(`[pbq] Would create: ${((grouped["would-create"] || []).length + (grouped["would-create-dir"] || []).length)}`);
    console.log(`[pbq] Would update: ${((grouped["would-overwrite"] || []).length + (grouped["would-append"] || []).length)}`);
  }
  console.log(`[pbq] Languages: ${project.languages.join(", ") || "nao detectadas"}`);
  console.log(`[pbq] Agent instruction files: ${project.agentInstructionFiles.join(", ") || "nenhum"}`);
  console.log(`[pbq] Created: ${(grouped.create || []).length}`);
  console.log(`[pbq] Updated: ${((grouped.append || []).length + (grouped.overwrite || []).length)}`);
  console.log(`[pbq] Skipped existing: ${(grouped.skip || []).length}`);
  console.log("[pbq] Fast sensors:");
  printCommandList(project.commands.fast);
  console.log("[pbq] Medium sensors:");
  printCommandList(project.commands.medium);
  console.log("[pbq] Slow sensors:");
  printCommandList(project.commands.slow);
  if (project.commands.placeholders.length > 0) {
    console.log("[pbq] Placeholders:");
    for (const placeholder of project.commands.placeholders) console.log(`  - ${placeholder.bucket}: ${placeholder.text}`);
  }
  if (catalogCount > 0) {
    console.log(`[pbq] ${catalogCount} sensores no catalogo. Rode 'pbq sensor catalog' ou /sensor para adicionar.`);
  }
}

function printCommandList(commands) {
  if (commands.length === 0) {
    console.log("  - nenhum comando real detectado");
    return;
  }
  for (const item of commands) console.log(`  - ${item.command} (${item.reason})`);
}

function groupBy(items, property) {
  return items.reduce((acc, item) => {
    const key = item[property];
    acc[key] ||= [];
    acc[key].push(item);
    return acc;
  }, {});
}

function toPosix(file) {
  return file.split(path.sep).join("/");
}

function mdList(items, fallback = "- Nao detectado no bootstrap.") {
  if (!items || items.length === 0) return fallback;
  return items.map((item) => `- ${item}`).join("\n");
}

function commandMd(commands, fallback) {
  if (!commands || commands.length === 0) return fallback;
  return commands.map((item) => `- \`${item.command}\` - ${item.reason}`).join("\n");
}

function constitutionArchitecture(project) {
  return `# Constitution: Architecture

Este arquivo contem regras permanentes de arquitetura para agentes e humanos. Ele deve evoluir quando o time encontrar desvios recorrentes.

## Contexto Detectado

Linguagens/frameworks detectados:

${mdList(project.languages)}

Arquivos de instrucao existentes:

${mdList(project.agentInstructionFiles)}

## Varredura Arquitetural Inicial

Esta secao e informativa. Ela descreve sinais encontrados no repositorio para orientar investigacao, mas nao transforma a arquitetura atual em regra permanente.

${architectureSignalMd(project.architecture)}

## Principios

> **Regra de arquitetura**
> **NUNCA** trate a arquitetura atual como autoridade absoluta. Use-a como evidencia e aplique boas praticas de engenharia.

- Use a estrutura atual como evidencia, nao como autoridade absoluta.
- Prefira boas praticas de engenharia: coesao alta, acoplamento baixo, separacao de responsabilidades, nomes claros, testes objetivos e fronteiras explicitas.
- Prefira mudancas pequenas, reversiveis e testaveis.
- Nao misture refactor estrutural com mudanca funcional no mesmo package sem contrato explicito.
- Nao crie dependencias globais, estado compartilhado ou atalhos transversais sem justificativa registrada na spec.
- Modulos de baixo nivel nao devem conhecer detalhes de UI, transporte, banco ou infraestrutura sem uma fronteira clara e justificada.

## Limites Entre Camadas e Modulos

- Extraia os limites reais do codigo antes de alterar chamadas entre diretorios ou camadas.
- Se o limite atual contrariar boas praticas, registre o risco e proponha migracao incremental em spec propria.
- Ao tocar uma fronteira publica, registre consumidores afetados e sensores que cobrem a mudanca.
- Alteracoes em contratos publicos exigem criterio de aceite objetivo e, quando aplicavel, migracao documentada.

## Dependencias Permitidas e Proibidas

- Permitido: dependencias que ja fazem parte do padrao local ou que estejam justificadas na spec.
- Proibido: dependencia nova para conveniencia local sem avaliacao de impacto.
- Proibido: chamadas diretas que contornem camadas de dominio, aplicacao ou infraestrutura ja existentes.

## Refactors

- Refactor deve preservar comportamento observavel.
- Refactor amplo exige package proprio e sensores antes/depois.
- Nao renomeie ou mova arquivos em massa sem contrato que delimite o escopo.

## Mudancas Estruturais

Mudancas estruturais exigem spec + contrato quando:

- alteram diretorios compartilhados ou interfaces publicas
- mudam fluxo de dados entre camadas
- introduzem infraestrutura, fila, cache, banco, autenticacao ou observabilidade
- afetam mais de um modulo funcional
`;
}

function constitutionTesting(project) {
  return `# Constitution: Testing

## Estrategia

> **Regra de bloqueio**
> **NUNCA** declare uma mudanca concluida sem evidencia dos sensores obrigatorios.

- Sensores computacionais valem mais que julgamento subjetivo do agente.
- Todo package deve listar sensores obrigatorios antes da implementacao.
- Se um sensor nao puder rodar, registre motivo, evidencia e risco residual em \`progress.md\` e na evaluation.
- Sensores cadastrados ficam em \`${HARNESS_DIR}/sensors.json\`.

## Modelo de Gatilho-por-Evento (campo \`on\`)

Cada sensor declara **quando** deve rodar via o campo \`on\`:

- **\`edit\`** — hook PostToolUse (early-warning, advisory)
- **\`commit\`** — hook pre-commit (early-warning, advisory por default)
- **\`close\`** — gate de aceite \`pbq package close\` (bloqueante)
- **\`manual\`** — so sob invocacao explicita

O campo \`tier\` e cosmético (rotulo de custo). Migracao automatica: \`fast → commit,close\`; \`medium|slow → close\`.

## Hooks Advisory vs Gate Bloqueante

Hooks (\`pbq guard\`) sao **early-warning nao-bloqueantes por default**.
O gate bloqueante autoritativo e \`pbq package close\` (event \`close\`).
A flag \`Enforcement: blocking\` em \`spec.md\` torna hooks bloqueantes para aquela spec.

## Sensores Detectados

Fast:

${commandMd(project.commands.fast, "- Placeholder: nenhum comando rapido detectado.")}

Medium:

${commandMd(project.commands.medium, "- Placeholder: nenhum comando medio detectado.")}

Slow:

${commandMd(project.commands.slow, "- Placeholder: nenhum comando lento detectado.")}

## Verificacao Independente

Pipeline de 5 etapas:

1. **spec** - \`spec.md\` criada/atualizada.
2. **contract (validacao)** - contrato criado e validado pela skill \`test\` em modo \`contract-check\`.
3. **implement** - codigo escrito contra o contrato. \`implement\` **nao** roda sensores.
4. **test/qa** - skill \`test\` em modo \`acceptance-check\` valida o contrato e roda sensores obrigatorios.
5. **roadmap** - status/evidencia atualizados.

Regras:
- A skill \`test\` e o **unico ponto de verificacao** do harness.
- A verificacao e **bloqueante**: nenhuma etapa avanca com sensor obrigatorio \`falhou\` ou \`pendente\`.
- O bypass manual (\`skip test\`) e raro, deve ser documentado em \`progress.md\`.

## Quando Rodar

- Hooks (early-warning): \`pbq guard --event commit\` no pre-commit, \`pbq guard --event edit\` no PostToolUse.
- Gate de package: \`pbq package close . --spec <spec> --package <N>\`.
- Runners diretos (deprecated): \`${HARNESS_DIR}/harness/scripts/run-commit.ps1\` ou \`.sh\`.

## Criterio Minimo de Validacao

- Todos os sensores obrigatorios do contrato passaram.
- Falhas conhecidas foram registradas com evidencia.
- Nenhum teste foi removido, ignorado ou relaxado sem justificativa no contrato.
- A evaluation do package recebeu Score 1 apenas se nao houver violacao critica e nenhum sensor obrigatorio pendente.

## Testes Pendentes ou Impossiveis

- Nao declare sucesso pleno com sensor pendente.
- Marque Score 0 quando um sensor obrigatorio nao executou.
- Transforme pendencias recorrentes em sensores computacionais ou regras do harness.
`;
}

function constitutionOperations(project) {
  return `# Constitution: Operations

## Seguranca Operacional

> **Regra de seguranca**
> **PARE** antes de executar comando destrutivo, deploy, publish, migration, seed ou alteracao de ambiente sem aprovacao humana explicita.

- Nao execute comandos destrutivos, deploy, publish, migration, seed ou alteracao de ambiente sem aprovacao humana explicita.
- Nao leia, imprima ou copie segredos de arquivos \`.env\`, cofres, variaveis sensiveis ou logs privados.
- Nao altere configuracoes de CI/CD, seguranca, lint ou testes para fazer sensores passarem sem contrato explicito.

## Riscos Detectados

${mdList(project.risks, "- Nenhum risco operacional especifico foi detectado automaticamente.")}

## Rollback

- Cada contrato deve indicar como desfazer a mudanca.
- Mudancas pequenas devem ser isoladas para revert simples.
- Mudancas com dados, migracoes ou efeitos externos exigem plano de rollback validado por humano.

## Observabilidade

- Mudancas em comportamento de runtime devem considerar logs, metricas ou rastros ja usados pelo projeto.
- Nao introduza logs ruidosos nem exponha dados sensiveis.
- Quando nao houver observabilidade aplicavel, registre isso no contrato.

## Ambientes

- Sensores fast e medium devem evitar dependencia de servicos externos sempre que possivel.
- Sensores slow podem exigir ambiente especifico, mas devem falhar de forma explicita quando pre-condicoes estiverem ausentes.
`;
}

function constitutionRepositoryRules(project) {
  const docs = project.docs
    .map((doc) => {
      const snippets = doc.snippets.length > 0 ? doc.snippets.map((line) => `  - ${line}`).join("\n") : "  - Nenhum trecho operacional objetivo extraido automaticamente.";
      return `### ${doc.path}\n\n${snippets}`;
    })
    .join("\n\n");

  return `# Constitution: Repository Rules

Este arquivo consolida regras existentes detectadas no repositorio durante o bootstrap. Ele nao substitui os arquivos originais.

## Fontes Lidas

${mdList(project.docs.map((doc) => doc.path), "- Nenhuma fonte documental detectada.")}

## Trechos Operacionais Extraidos

${docs || "Nenhum trecho operacional foi extraido automaticamente."}

## Regras de Preservacao

- Regras existentes do repositorio tem prioridade sobre este harness.
- Se este arquivo divergir de \`AGENTS.md\`, \`CLAUDE.md\`, README, CI ou documentacao local, siga a regra mais especifica e atualize esta consolidacao.
- Nao invente convencoes: derive regras de codigo, testes, scripts e documentos existentes.
`;
}

function harnessReadme(project) {
  return `# Harness Engineering

Este harness e a camada externa de controle para agentes de IA neste repositorio. Ele combina guias de feedforward, sensores de feedback e registro de progresso.

Referencias:

- https://martinfowler.com/articles/harness-engineering.html
- https://www.youtube.com/watch?v=dLs-Pbn8stU

## Quando Usar Spec

- Mudanca pequena: contrato inline e sensores fast podem ser suficientes.
- Mudanca media: crie uma spec em \`${HARNESS_DIR}/specs/spec-XXX-nome/\` e um contrato em \`contracts/package-N.md\`.
- Mudanca grande: divida em varios packages pequenos, reversiveis e validaveis.

## Quando Usar Contrato Formal

Use contrato formal quando houver alteracao de fluxo, fronteira publica, persistencia, integracao externa, arquitetura, seguranca, CI/CD ou mais de um modulo afetado.

## Sensores

Fast:

${commandMd(project.commands.fast, "- Apenas \`check-harness-structure\` foi configurado; adicione lint/typecheck/teste rapido com \`pbq sensor add\` quando existir.")}

Medium:

${commandMd(project.commands.medium, "- Placeholder: nenhum build/teste completo detectado.")}

Slow:

${commandMd(project.commands.slow, "- Placeholder: nenhum E2E/integracao pesada detectado.")}

Comandos (por evento):

\`\`\`powershell
.\\${HARNESS_DIR}\\harness\\scripts\\run-commit.ps1  # sensores on:commit
.\\${HARNESS_DIR}\\harness\\scripts\\run-close.ps1   # sensores on:close (gate)
\`\`\`

Em Unix:

\`\`\`sh
sh ./${HARNESS_DIR}/harness/scripts/run-commit.sh
sh ./${HARNESS_DIR}/harness/scripts/run-close.sh
\`\`\`

Ou via pbq guard:

\`\`\`sh
pbq guard --event commit .
pbq guard --event close .
\`\`\`

Runners por tier (deprecated — use os runners por evento acima):
\`run-fast.ps1\`, \`run-medium.ps1\`, \`run-slow.ps1\`

## Progresso

Cada spec deve manter \`progress.md\` com estado atual, decisoes, sensores executados, falhas anteriores e contexto para retomada.

O roadmap em \`${HARNESS_DIR}/roadmap.md\` e o indice consolidado das specs:

- Ao criar uma spec, registre status \`em andamento\`.
- Ao concluir uma spec, registre status \`concluido\`, data e evidencia.
- Nao marque \`concluido\` se houver package obrigatorio sem evaluation Score 1, salvo excecao documentada.

## Nova Spec

1. Copie \`${HARNESS_DIR}/harness/templates/spec.md\` para \`${HARNESS_DIR}/specs/spec-XXX-nome/spec.md\`.
2. Copie \`${HARNESS_DIR}/harness/templates/progress.md\` para \`${HARNESS_DIR}/specs/spec-XXX-nome/progress.md\`.
3. Crie \`contracts/package-N.md\` a partir de \`${HARNESS_DIR}/harness/templates/contract.md\`.
4. Liste sensores obrigatorios antes da implementacao.

## Concluir Package

1. Confirme que o escopo do contrato foi respeitado.
2. Rode sensores obrigatorios.
3. Atualize \`progress.md\`.
4. Gere \`evaluations/package-N.md\` com Score 0 ou 1.
5. Score 1 exige todos os sensores obrigatorios passando e nenhuma violacao critica.

## Hierarquia de Regras

1. instrucoes superiores da plataforma/ferramenta
2. regras ja existentes do repositorio
3. \`${HARNESS_DIR}/constitution/\`
4. \`${HARNESS_DIR}/harness/\`
5. \`spec.md\`
6. \`contracts/\`
7. prompts locais
8. implementacao
`;
}

function psCheckHarnessStructure() {
  return `$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..\\..\\..")
$Required = @(
${REQUIRED_FILES.map((file) => `  "${file.replace(/\//g, "\\")}"`).join(",\n")}
)

$Missing = @()
foreach ($Item in $Required) {
  $Path = Join-Path $Root $Item
  if (-not (Test-Path $Path)) {
    $Missing += $Item
  }
}

if ($Missing.Count -gt 0) {
  Write-Host "[harness] Missing required files:"
  $Missing | ForEach-Object { Write-Host " - $_" }
  exit 1
}

Write-Host "[harness] Structure OK"
exit 0
`;
}

function psRunScript(kind, sensors, placeholders) {
  const scopedPlaceholders = placeholders.filter((item) => item.bucket === kind);
  const commands = sensors.filter((sensor) => sensor.tier === kind && sensor.enabled);
  return `$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..\\..\\..")
Set-Location $Root

function Invoke-HarnessCommand {
  param([string]$Command)
  Write-Host "[harness:${kind}] $Command"
  powershell -NoProfile -ExecutionPolicy Bypass -Command $Command
  if ($LASTEXITCODE -ne 0) {
    Write-Host "[harness:${kind}] Failed: $Command"
    exit $LASTEXITCODE
  }
}

Invoke-HarnessCommand ".\\${HARNESS_DIR}\\harness\\scripts\\check-harness-structure.ps1"

$Commands = @(
${commands.map((item) => `  "${escapePowerShellString(item.command)}"`).join(",\n")}
)

foreach ($Command in $Commands) {
  Invoke-HarnessCommand $Command
}

${scopedPlaceholders.map((item) => `Write-Host "[harness:${kind}] PLACEHOLDER: ${escapePowerShellString(item.text)}"`).join("\n")}

Write-Host "[harness:${kind}] OK"
exit 0
`;
}

function shCheckHarnessStructure() {
  return `#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)"
missing=""

for item in \\
${REQUIRED_FILES.map((file) => `  "${file}"`).join(" \\\n")}; do
  if [ ! -e "$ROOT/$item" ]; then
    missing="$missing
$item"
  fi
done

if [ -n "$missing" ]; then
  printf '[harness] Missing required files:%s\\n' "$missing"
  exit 1
fi

printf '[harness] Structure OK\\n'
`;
}

function shRunScript(kind, sensors, placeholders) {
  const scopedPlaceholders = placeholders.filter((item) => item.bucket === kind);
  const commands = sensors.filter((sensor) => sensor.tier === kind && sensor.enabled);
  return `#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)"
cd "$ROOT"

run_cmd() {
  printf '[harness:${kind}] %s\\n' "$1"
  sh -c "$1"
}

run_cmd "sh ./${HARNESS_DIR}/harness/scripts/check-harness-structure.sh"

${commands.map((item) => `run_cmd "${escapeShellString(item.command)}"`).join("\n")}

${scopedPlaceholders.map((item) => `printf '[harness:${kind}] PLACEHOLDER: ${escapeShellString(item.text)}\\n'`).join("\n")}

printf '[harness:${kind}] OK\\n'
`;
}

function escapePowerShellString(value) {
  return value.replace(/`/g, "``").replace(/"/g, '`"');
}

function escapeShellString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/`/g, "\\`");
}

// Keep import.meta.url referenced so npm pack keeps this file as an executable entry point.
fileURLToPath(import.meta.url);
