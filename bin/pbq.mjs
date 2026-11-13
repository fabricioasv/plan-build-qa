#!/usr/bin/env node
import { lstat, mkdir, readFile, readdir, rename, rm, rmdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MARKER_START = "<!-- PBQ-HARNESS-START -->";
const MARKER_END = "<!-- PBQ-HARNESS-END -->";
const HARNESS_DIR = ".plan-build-qa";
const ADAPTER_SKILLS = ["spec", "sensor", "roadmap", "constitution", "implement", "test", "analyze", "bug", "retro", "backlog-sync"];
const PBQ_TEMPLATE_VERSION = 2;
const ALLOWED_SPEC_STATUS = new Set(["planejado", "em andamento", "bloqueado", "concluido", "cancelado"]);
const ALLOWED_AGENTS = new Set(["claude", "codex", "cursor"]);
const MODERN_SPEC_NAME_RE = /^spec-\d{6}-[0-9a-f]{4}-[a-z0-9][a-z0-9-]*$/i;
const LEGACY_SPEC_NAME_RE = /^spec-\d{3}-[a-z0-9][a-z0-9-]*$/i;
const MODERN_BUG_NAME_RE = /^bug-\d{6}-[0-9a-f]{4}-[a-z0-9][a-z0-9-]*$/i;
const LEGACY_BUG_NAME_RE = /^bug-\d{3}-[a-z0-9][a-z0-9-]*$/i;

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
  `${HARNESS_DIR}/harness/scripts/check-harness-structure.ps1`,
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

  if (isHelpRequest(args[0])) {
    printHelp(command);
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

  if (command === "contract") {
    await runContractCommand(args);
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

  const localSkills = options.integrateAgents
    ? await planLocalSkillUpdate(targetRoot, options.agents) : {};
  const project = await inspectProject(targetRoot);
  const agents = options.integrateAgents ? options.agents : new Set();
  const generated = withManifest(await generateFiles(project, agents), [...agents]);
  const events = [];

  for (const [relativePath, content] of Object.entries(generated)) {
    const effectiveOptions = ALWAYS_REPLACE_FILES.has(relativePath) ? { ...options, force: true } : options;
    await writeManagedFile(targetRoot, relativePath, content, effectiveOptions, events);
  }

  // Existing local skills follow the explicit agent priority even without --force.
  const skillEvents = [];
  for (const [relativePath, content] of Object.entries(localSkills)) {
    await updateManagedFile(targetRoot, relativePath, content, options, skillEvents);
  }
  events.push(...skillEvents.map((event) => ({ ...event, type: event.type === "ok" ? "skip"
    : event.type === "update" ? (options.dryRun ? "would-overwrite" : "overwrite")
      : options.dryRun ? "would-create" : "create" })));

  if (options.integrateAgents) {
    await integrateAgentInstructions(targetRoot, project.agentInstructionFiles, options, events);
    await mergeGuardHookInSettings(targetRoot, options, events);
  }

  const catalog = await loadSensorCatalog();
  printSummary(targetRoot, project, events, options, catalog.length);
}

function isHelpRequest(value) {
  return value === "help" || value === "--help" || value === "-h";
}

function parseAgentsOption(value) {
  const agents = new Set(
    value.split(",").map((agent) => agent.trim().toLowerCase()).filter(Boolean)
  );
  for (const agent of agents) {
    if (!ALLOWED_AGENTS.has(agent)) {
      throw new Error(`Agente desconhecido em --agents: ${agent}. Use claude, codex e/ou cursor.`);
    }
  }
  if (agents.size === 0) {
    throw new Error("Informe ao menos um agente em --agents (claude, codex e/ou cursor).");
  }
  return agents;
}

function parseInitArgs(args) {
  const options = {
    targetPath: ".",
    force: false,
    dryRun: false,
    integrateAgents: true,
    agents: null
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--force") {
      options.force = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--no-agent-integration") {
      options.integrateAgents = false;
    } else if (arg === "--agents") {
      options.agents = parseAgentsOption(readOptionValue(args, ++index, "--agents"));
    } else if (arg.startsWith("--")) {
      throw new Error(`Opcao desconhecida: ${arg}`);
    } else {
      options.targetPath = arg;
    }
  }

  if (options.integrateAgents && !options.agents) {
    throw new Error(
      "Informe --agents <claude,codex,cursor> (obrigatorio), ou use --no-agent-integration para pular a integracao de agente."
    );
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
      scope: "global",
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
    console.log(`[pbq] Sensor ${index >= 0 ? "updated" : "added"}: ${nextSensor.name} (on: ${nextSensor.on.join(",")})`);
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
      const onStr = (entry.on || []).join(",") || "-";
      console.log(`${status}\t${onStr}\t${entry.id}${envNote}\t${entry.reason}`);
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
      console.log(`${sensor.enabled === false ? "disabled" : "enabled"}\t${sensor.scope || "global"}\t${sensor.name}\t${onStr}\t${sensor.command}`);
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
    scope: "global",
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

function parseScopeOption(value) {
  const scope = normalizeSensorScope(value);
  if (!["global", "local", "package"].includes(String(value || "").trim().toLowerCase())) {
    throw new Error("--scope deve ser global, local ou package.");
  }
  if (scope !== "global") {
    throw new Error("Sensores locais devem ser declarados no contrato do package; use --scope global para gravar em sensors.json.");
  }
  return scope;
}

function parseSensorAddArgs(args) {
  const options = {
    targetPath: ".",
    name: "",
    scope: "global",
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
    else if (arg === "--scope") options.scope = parseScopeOption(readOptionValue(args, ++index, "--scope"));
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
  return Array.isArray(parsed.sensors) ? parsed.sensors.map(normalizeSensorRecord) : [];
}

function normalizeSensorRecord(sensor) {
  return {
    ...sensor,
    scope: normalizeSensorScope(sensor.scope)
  };
}

function normalizeSensorScope(scope) {
  const value = String(scope || "global").trim().toLowerCase();
  if (value === "package") return "local";
  if (value === "local" || value === "global") return value;
  return "global";
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

async function readSpecEnforcement(targetRoot, specName) {
  const specPath = path.join(targetRoot, HARNESS_DIR, "specs", specName, "spec.md");
  if (!existsSync(specPath)) return "advisory";
  const specContent = await readFile(specPath, "utf8");
  const match = specContent.match(/^Enforcement:\s*(blocking|advisory)/im);
  return match ? match[1].toLowerCase() : "advisory";
}

async function specContractAllowsPath(targetRoot, specName, filePath) {
  const contractsDir = path.join(targetRoot, HARNESS_DIR, "specs", specName, "contracts");
  if (!existsSync(contractsDir)) return false;
  const normalized = filePath.replace(/\\/g, "/");
  const entries = await readdir(contractsDir).catch(() => []);
  for (const entry of entries) {
    if (!entry.endsWith(".md")) continue;
    const content = await readFile(path.join(contractsDir, entry), "utf8").catch(() => "");
    const section = content.match(/## Arquivos Permitidos([\s\S]*?)(\n## |$)/i);
    if (section && section[1].includes(normalized)) return true;
  }
  return false;
}

async function resolveEnforcement(targetRoot, filePath = "") {
  const roadmapPath = path.join(targetRoot, HARNESS_DIR, "roadmap.md");
  if (!existsSync(roadmapPath)) return "advisory";
  const roadmap = await readFile(roadmapPath, "utf8");
  const activeSpecs = parseRoadmapSpecRows(roadmap).filter((s) => s.status === "em andamento");

  if (activeSpecs.length === 1) {
    return readSpecEnforcement(targetRoot, activeSpecs[0].name);
  }

  if (activeSpecs.length > 1 && filePath) {
    const matches = [];
    for (const spec of activeSpecs) {
      if (await specContractAllowsPath(targetRoot, spec.name, filePath)) matches.push(spec);
    }
    if (matches.length === 1) return readSpecEnforcement(targetRoot, matches[0].name);
  }

  return "advisory";
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

  const enforcement = await resolveEnforcement(targetRoot, options.filePath);
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
    const scopedSensor = { ...sensor, scope: "global" };
    if (scopedSensor.on && scopedSensor.on.length > 0) return scopedSensor;
    const phase = normalizePhaseList(sensor.phase);
    const on = phase.length > 0 ? legacyPhaseToOn(phase.join(",")) : legacyTierToOn(sensor.tier);
    return phase.length > 0 ? { ...scopedSensor, phase, on } : { ...scopedSensor, on };
  });
  const sensorsPath = path.join(root, HARNESS_DIR, "sensors.json");
  await writeFile(sensorsPath, JSON.stringify({ version: 2, sensors: normalized }, null, 2) + "\n", "utf8");
}

async function regenerateSensorScripts(root, sensors) {
  const files = {
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

function printHelp(topic = "") {
  const normalized = topic.toLowerCase();
  const helpByTopic = {
    init: `pbq init [path] --agents <claude,codex,cursor> [--force] [--dry-run]
pbq init [path] --no-agent-integration [--force] [--dry-run]

Cria a estrutura inicial em .plan-build-qa/ e adapters para os agentes escolhidos.

Opcoes:
  --agents <lista>        OBRIGATORIO (a menos que --no-agent-integration seja usado).
                          Valores aceitos, separados por virgula: claude, codex, cursor.
                            claude  -> .claude/skills/<skill>/SKILL.md + bloco em CLAUDE.md
                            codex   -> .agents/skills/<skill>/SKILL.md + bloco em AGENTS.md
                            cursor  -> .cursor/commands/<skill>.md + AGENTS.md como referencia
                          O primeiro agente da lista recebe o conteudo integral; os demais,
                          uma referencia direta a ele.
                          skills de agente novo (ex.: retro) sao instaladas junto, conforme os
                          agentes escolhidos.
  --force                 sobrescreve arquivos existentes gerados pelo harness
  --dry-run               mostra o que seria criado/alterado
  --no-agent-integration  nao cria/atualiza AGENTS.md, CLAUDE.md, .claude/skills, .agents/skills
                          ou .cursor/commands; dispensa --agents

Exemplos:
  pbq init . --agents claude
  pbq init . --agents 'claude,codex,cursor'
  pbq init C:\\repo\\app --agents codex --dry-run`,

    update: `pbq update [path] --agents <claude,codex,cursor> [--dry-run] [--force]
pbq update [path] --no-agent-integration [--dry-run] [--force]

Atualiza templates/skills de uma instalacao existente usando .plan-build-qa/manifest.json.

  --agents <lista>        OBRIGATORIO (a menos que --no-agent-integration seja usado); mesmos
                          valores e efeitos de 'pbq init --agents'. O primeiro recebe o conteudo
                          integral. Remover um agente da lista
                          apaga os artefatos exclusivos dele (.claude/skills, .agents/skills ou
                          .cursor/commands) SE ainda estiverem identicos ao ultimo template
                          instalado; se foram customizados, sao preservados (nao apagados).
  --no-agent-integration  dispensa --agents; nao toca integracao de agente nenhuma

Comportamento:
  arquivo ausente                 cria
  arquivo equivalente ao gerado  preserva sem reescrever
  arquivo existente diferente     atualiza diretamente (use source control para revisar)
  diferenca so nas extremidades   considera igual apos trim; nao reescreve
  sensors.json e roadmap.md       preserva como estado local
  constitution/ com regra local   preserva e pede revisao; --force substitui apos revisao

Exemplos:
  pbq update . --agents 'codex,claude,cursor'
  pbq update C:\\repo\\app --agents cursor --dry-run
  pbq update . --agents 'claude,codex' --dry-run

No PowerShell, use aspas quando informar mais de um agente.`,

    sensor: `pbq sensor add [path] --name <name> --on <gatilhos> --command <command> [--reason <text>]
pbq sensor add --from-catalog <id> [path]
pbq sensor list [path]
pbq sensor suggest [path]
pbq sensor catalog [path]

Gerencia sensores computacionais em .plan-build-qa/sensors.json e regenera runners.

  --on     gatilhos de execucao: edit, commit, close, manual (separados por virgula).

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

    contract: `pbq contract check [path] --contract <arquivo>
pbq contract check [path] --spec <spec-name> --package <N> [--json]

Valida mecanicamente um contrato sem executar sensores nem carregar roadmap/progress/evaluations.

Flags:
  --contract  caminho direto para contracts/package-N.md
  --spec      nome da spec em .plan-build-qa/specs/
  --package   numero do package quando usar --spec
  --json      imprime resultado estruturado

Exemplos:
  pbq contract check . --contract .plan-build-qa/specs/spec-001/contracts/package-1.md
  pbq contract check . --spec spec-001-login --package 1`,

    package: `pbq package close [path] --spec <spec-name> --package <N> [--phase before|after]

Executa sensores cadastrados, gera evaluation em .plan-build-qa/specs/<spec>/evaluations/package-N.md e falha se sensor obrigatorio falhar.

  --phase  fase de execucao (default: after). Sensores sem campo phase so rodam na fase after.
           Sensores com phase:["before"] so rodam com --phase before.
  --tiers  alias legado sem efeito para sensores novos (mantido para compatibilidade com
           sensores antigos que ainda tem campo tier); selecao real de sensores usa on:<evento>.

Exemplos:
  pbq package close . --spec spec-001-login --package 1
  pbq package close . --spec spec-001-login --package 1 --phase before
  pbq package close C:\\repo\\app --spec spec-002-checkout --package 3`,

    guard: `pbq guard --event <edit|commit|close> [path] [--path <file>]

Roda sensores com on:<event> e imprime resultado.
Advisory por default (exit 0 sempre). Exit 1 apenas se a spec ativa resolvida
tiver "Enforcement: blocking" E algum sensor falhar. Spec ativa e resolvida assim:
  1. 1 unica spec "em andamento": usa o Enforcement dela.
  2. Mais de 1 spec "em andamento" e --path informado: se o arquivo casar com
     "Arquivos Permitidos" de exatamente uma spec ativa, usa o Enforcement dela.
  3. Qualquer outro caso: advisory (seguro por default).

  edit    sensores de edicao (ex.: lint rapido, analyze)
  commit  sensores de pre-commit (ex.: unit tests, lint)
  close   sensores de gate de aceite (equivalente ao pbq package close)

  --path  caminho do arquivo editado; usado tambem para resolver a spec ativa
          quando ha mais de uma "em andamento"; se estiver em .plan-build-qa/**,
          tambem roda 'pbq analyze' automaticamente

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

O dashboard (.plan-build-qa/dashboard/) e um artefato derivado, nao versionado; gere-o sob
demanda quando precisar.

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

O dashboard (.plan-build-qa/dashboard/) e um artefato derivado, nao versionado; gere-o sob
demanda quando precisar, nao commite o conteudo desse diretorio.

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
  contract   valida mecanicamente contratos de package
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
  pbq help contract
  pbq help package
  pbq help guard
  pbq help hooks
  pbq help dashboard
  pbq help run

Exemplos:
  pbq init . --agents claude
  pbq update . --agents 'codex,claude,cursor' --dry-run
  pbq sensor list .
  pbq analyze .
  pbq contract check . --spec spec-001-exemplo --package 1
  pbq package close . --spec spec-001-exemplo --package 1
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

// --- pbq contract ---

async function runContractCommand(args) {
  const action = args.shift();
  if (action !== "check") {
    throw new Error("Uso: pbq contract check [path] --contract <arquivo> OU --spec <spec-name> --package <N>");
  }

  const options = parseContractCheckArgs(args);
  const targetRoot = path.resolve(options.targetPath);
  const result = await checkContract(targetRoot, options);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.valid) {
    console.log(`[pbq] Contract OK: ${path.relative(targetRoot, result.contractPath) || result.contractPath} (${result.sensors.length} sensores)`);
  } else {
    console.log(`[pbq] Contract invalido: ${path.relative(targetRoot, result.contractPath) || result.contractPath}`);
    for (const problem of result.problems) console.log(` - ${problem}`);
  }

  if (!result.valid) process.exitCode = 1;
}

function parseContractCheckArgs(args) {
  const options = {
    targetPath: ".",
    contractPath: "",
    spec: "",
    packageNumber: "",
    json: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--contract") options.contractPath = readOptionValue(args, ++index, "--contract");
    else if (arg === "--spec") options.spec = readOptionValue(args, ++index, "--spec");
    else if (arg === "--package") options.packageNumber = readOptionValue(args, ++index, "--package");
    else if (arg === "--json") options.json = true;
    else if (arg.startsWith("--")) throw new Error(`Opcao desconhecida: ${arg}`);
    else options.targetPath = arg;
  }

  if (options.contractPath && (options.spec || options.packageNumber)) {
    throw new Error("Use --contract ou --spec/--package, nao ambos.");
  }
  if (!options.contractPath && (!options.spec || !options.packageNumber)) {
    throw new Error("Informe --contract ou --spec e --package.");
  }

  return options;
}

async function checkContract(root, options) {
  const contractPath = resolveContractPath(root, options);
  if (!existsSync(contractPath)) {
    return {
      valid: false,
      contractPath,
      problems: [`Contrato nao encontrado: ${contractPath}`],
      sensors: []
    };
  }

  const contract = await readFile(contractPath, "utf8");
  const sensors = await readSensors(root);
  const result = validateContractContent(contract, sensors);
  return {
    ...result,
    contractPath
  };
}

function resolveContractPath(root, options) {
  if (options.contractPath) {
    return path.isAbsolute(options.contractPath)
      ? options.contractPath
      : path.resolve(root, options.contractPath);
  }
  return path.join(root, HARNESS_DIR, "specs", options.spec, "contracts", `package-${options.packageNumber}.md`);
}

function validateContractContent(contract, registeredSensors) {
  const problems = [];
  const requiredSections = [
    "Objetivo",
    "Arquivos Permitidos",
    "Mudancas Permitidas",
    "Criterios de Aceite",
    "Sensores Obrigatorios",
    "Rollback"
  ];
  const sections = parseMarkdownSections(contract);

  for (const section of requiredSections) {
    const body = sections.get(normalizeHeading(section));
    if (body === undefined) {
      problems.push(`secao ausente: ${section}`);
      continue;
    }
    if (sectionHasPlaceholder(body)) {
      problems.push(`secao ${section} contem placeholder/TODO`);
    }
  }

  const acceptance = sections.get(normalizeHeading("Criterios de Aceite"));
  if (acceptance !== undefined && !hasNonEmptySectionContent(acceptance)) {
    problems.push("secao Criterios de Aceite sem criterio objetivo");
  }

  const requiredSensors = parseContractRequiredSensors(contract).filter((sensor) => sensor.hasName);
  if (requiredSensors.length === 0) {
    problems.push("nenhum sensor obrigatorio declarado");
  }

  const registry = new Map(registeredSensors.map((sensor) => [sensor.name, sensor]));
  const validatedSensors = [];
  for (const sensor of requiredSensors) {
    validatedSensors.push({
      name: sensor.name,
      scope: sensor.scope,
      local: sensor.local,
      registered: registry.has(sensor.name)
    });

    if (sensor.scope === "local") {
      if (!sensor.hasCommand) problems.push(`sensor local sem Comando: ${sensor.name}`);
      if (!sensor.reason) problems.push(`sensor local sem Motivo: ${sensor.name}`);
      continue;
    }

    if (!registry.has(sensor.name)) {
      problems.push(`sensor global nao cadastrado: ${sensor.name}`);
    }
  }

  return {
    valid: problems.length === 0,
    problems,
    sensors: validatedSensors
  };
}

function parseMarkdownSections(markdown) {
  const sections = new Map();
  let current = "";
  let buffer = [];
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^##\s+(.+?)\s*$/);
    if (match) {
      if (current) sections.set(current, buffer.join("\n"));
      current = normalizeHeading(match[1]);
      buffer = [];
      continue;
    }
    if (current) buffer.push(line);
  }
  if (current) sections.set(current, buffer.join("\n"));
  return sections;
}

function normalizeHeading(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function sectionHasPlaceholder(body) {
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .some((line) =>
      line
        .split("|")
        .map((cell) => cleanMarkdownCell(cell.trim().replace(/^-+\s*/, "")))
        .some((cell) => /^<[^>]+>$/.test(cell) || /^todo[:\s-]*$/i.test(cell))
    );
}

function hasNonEmptySectionContent(body) {
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .some((line) => line && !line.startsWith(">") && !/^\|?\s*-+\s*(\|\s*-+\s*)*$/.test(line));
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
          } else if (entry.scope === "local") {
            if (!entry.hasCommand) {
              violations.push(`${spec.name}/${file}: sensor local obrigatorio "${entry.name}" sem comando no contrato`);
            }
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
  let scopeCol = -1;
  let tierCol = -1;
  let commandCol = -1;
  let reasonCol = -1;
  for (const rawLine of sectionMatch[1].split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (trimmed.startsWith("- ")) {
      inTable = false;
      if (trimmed.startsWith("- **")) continue;
      const body = trimmed.slice(2).trim();
      const parts = body.split("|").map((part) => part.trim());
      if (parts.length >= 2) {
        const name = cleanMarkdownCell(parts[1]);
        if (name) {
          entries.push(contractSensorEntry({ name }));
          continue;
        }
      }
      entries.push(contractSensorEntry({ name: null }));
    } else if (trimmed.startsWith("|")) {
      const cells = splitTableRow(trimmed);
      if (cells.every((c) => /^-+$/.test(c))) continue; // separador
      const isHeader = cells.some((c) => /^sensor$/i.test(c) || /^nome$/i.test(c) || /nome em sensors\.json/i.test(c));
      if (isHeader) {
        inTable = true;
        const nomeIdx = cells.findIndex((c) => /^nome$/i.test(c) || /nome em sensors\.json/i.test(c));
        const sensorIdx = cells.findIndex((c) => /^sensor$/i.test(c));
        nameCol = nomeIdx >= 0 ? nomeIdx : sensorIdx >= 0 ? sensorIdx : 0;
        scopeCol = cells.findIndex((c) => /^(scope|escopo)$/i.test(c));
        tierCol = cells.findIndex((c) => /^tier$/i.test(c));
        commandCol = cells.findIndex((c) => /^(comando|command)$/i.test(c));
        reasonCol = cells.findIndex((c) => /^(motivo|reason)$/i.test(c));
        continue;
      }
      if (!inTable) continue;
      const name = cleanMarkdownCell(cells[nameCol] || cells[0] || "");
      if (name) {
        entries.push(contractSensorEntry({
          name,
          scope: scopeCol >= 0 ? cells[scopeCol] : "",
          tier: tierCol >= 0 ? cells[tierCol] : "",
          command: commandCol >= 0 ? cells[commandCol] : "",
          reason: reasonCol >= 0 ? cells[reasonCol] : ""
        }));
      }
    } else if (trimmed.length > 0 && !trimmed.startsWith(">")) {
      inTable = false;
    }
  }
  return entries;
}

function contractSensorEntry({ name, scope = "", tier = "", command = "", reason = "" }) {
  const normalizedScope = normalizeSensorScope(cleanMarkdownCell(scope));
  const cleanedCommand = cleanMarkdownCell(command);
  const local = normalizedScope === "local" && cleanedCommand.length > 0;
  return {
    name,
    hasName: Boolean(name),
    scope: normalizedScope,
    local,
    tier: cleanMarkdownCell(tier),
    command: cleanedCommand,
    hasCommand: cleanedCommand.length > 0,
    reason: cleanMarkdownCell(reason)
  };
}

function cleanMarkdownCell(value) {
  return String(value || "").replace(/^`|`$/g, "").trim();
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
    .filter((row) => isRecognizedSpecName(row.name));
}

function isRecognizedSpecName(name) {
  return MODERN_SPEC_NAME_RE.test(name) || LEGACY_SPEC_NAME_RE.test(name);
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

  // Validate all local skills before any managed file is changed.
  const localSkills = options.integrateAgents
    ? await planLocalSkillUpdate(targetRoot, options.agents) : {};
  const project = await inspectProject(targetRoot);
  const agents = options.integrateAgents ? options.agents : new Set();
  const generated = withManifest(await generateFiles(project, agents), [...agents]);
  Object.assign(generated, localSkills);
  const previousManifest = await readManifest(targetRoot);
  const events = [];
  const manifestPath = `${HARNESS_DIR}/manifest.json`;
  const nextManifest = JSON.parse(generated[manifestPath]);

  for (const [relativePath, latest] of Object.entries(generated)) {
    if (relativePath === `${HARNESS_DIR}/sensors.json` || relativePath === `${HARNESS_DIR}/roadmap.md` || relativePath === manifestPath) continue;
    if (relativePath.startsWith(`${HARNESS_DIR}/constitution/`)) {
      const result = await updateConstitutionFile(targetRoot, relativePath, latest, previousManifest, options, events);
      if (result === null) delete nextManifest.files[relativePath];
      else nextManifest.files[relativePath].sha256 = result;
      continue;
    }
    await updateManagedFile(targetRoot, relativePath, latest, options, events);
  }
  await updateManagedFile(targetRoot, manifestPath, JSON.stringify(nextManifest, null, 2) + "\n", options, events);

  await removeDeprecatedManagedFiles(targetRoot, generated, options, previousManifest, events);

  if (options.integrateAgents) {
    await removeUnselectedAgentFiles(targetRoot, options, previousManifest, generated, events);
  }

  await migrateLegacySpecDirectories(targetRoot, options, events);
  await migrateLegacyBugDirectories(targetRoot, options, events);
  if (!options.dryRun) await migrateSensorsV1ToV2(targetRoot);
  await mergeGuardHookInSettings(targetRoot, options, events);
  const catalog = await loadSensorCatalog();
  printUpdateSummary(targetRoot, events, options, catalog.length);
}

function parseUpdateArgs(args) {
  const options = {
    targetPath: ".",
    dryRun: false,
    force: false,
    integrateAgents: true,
    agents: null
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--force") options.force = true;
    else if (arg === "--no-agent-integration") options.integrateAgents = false;
    else if (arg === "--agents") options.agents = parseAgentsOption(readOptionValue(args, ++index, "--agents"));
    else if (arg.startsWith("--")) throw new Error(`Opcao desconhecida: ${arg}`);
    else options.targetPath = arg;
  }

  if (options.integrateAgents && !options.agents) {
    throw new Error(
      "Informe --agents <claude,codex,cursor> (obrigatorio), ou use --no-agent-integration para pular a integracao de agente."
    );
  }

  return options;
}

async function migrateLegacySpecDirectories(root, options, events) {
  const specsRoot = path.join(root, HARNESS_DIR, "specs");
  if (!existsSync(specsRoot)) return;

  let entries = await readdir(specsRoot, { withFileTypes: true });
  recordModernSlugDuplicateWarnings(entries, "spec", events);
  await cleanupEmptyModernDuplicateDirectories(specsRoot, "spec", entries, options, events);
  entries = await readdir(specsRoot, { withFileTypes: true });
  const renames = [];
  const occupiedNames = new Set(entries.map((entry) => entry.name));

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (MODERN_SPEC_NAME_RE.test(entry.name) || !LEGACY_SPEC_NAME_RE.test(entry.name)) continue;

    const oldName = entry.name;
    const specPath = path.join(specsRoot, oldName, "spec.md");
    if (!existsSync(specPath)) continue;

    const slug = legacyDirectorySlug("spec", oldName);
    await cleanupEmptyModernDirectoriesForSlug(specsRoot, "spec", slug, occupiedNames, options, events);
    const newName = await buildMigratedSpecName(specPath, oldName, occupiedNames);
    if (newName === oldName) continue;

    occupiedNames.delete(oldName);
    occupiedNames.add(newName);
    renames.push({ oldName, newName });
  }

  if (renames.length === 0) return;

  for (const item of renames) {
    if (!options.dryRun) {
      await rename(path.join(specsRoot, item.oldName), path.join(specsRoot, item.newName));
    }
    events.push({ type: "spec-migrate", path: `${HARNESS_DIR}/specs/${item.oldName}`, oldName: item.oldName, newName: item.newName });
  }

  await updateRoadmapSpecNames(root, renames, options, events);
}

async function migrateLegacyBugDirectories(root, options, events) {
  const bugsRoot = path.join(root, HARNESS_DIR, "bugs");
  if (!existsSync(bugsRoot)) return;

  let entries = await readdir(bugsRoot, { withFileTypes: true });
  recordModernSlugDuplicateWarnings(entries, "bug", events);
  await cleanupEmptyModernDuplicateDirectories(bugsRoot, "bug", entries, options, events);
  entries = await readdir(bugsRoot, { withFileTypes: true });
  const renames = [];
  const occupiedNames = new Set(entries.map((entry) => entry.name));

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (MODERN_BUG_NAME_RE.test(entry.name) || !LEGACY_BUG_NAME_RE.test(entry.name)) continue;

    const oldName = entry.name;
    const bugPath = path.join(bugsRoot, oldName, "bug.md");
    if (!existsSync(bugPath)) continue;

    const slug = legacyDirectorySlug("bug", oldName);
    await cleanupEmptyModernDirectoriesForSlug(bugsRoot, "bug", slug, occupiedNames, options, events);
    const newName = await buildMigratedBugName(bugPath, oldName, occupiedNames);
    if (newName === oldName) continue;

    occupiedNames.delete(oldName);
    occupiedNames.add(newName);
    renames.push({ oldName, newName });
  }

  for (const item of renames) {
    if (!options.dryRun) {
      await rename(path.join(bugsRoot, item.oldName), path.join(bugsRoot, item.newName));
    }
    events.push({ type: "bug-migrate", path: `${HARNESS_DIR}/bugs/${item.oldName}`, oldName: item.oldName, newName: item.newName });
  }
}

async function buildMigratedSpecName(specPath, oldName, occupiedNames) {
  const fileStat = await stat(specPath);
  const createdAt = fileStat.birthtimeMs > 0 ? fileStat.birthtime : fileStat.mtime;
  const dateId = formatSpecDateId(createdAt);
  const slug = normalizeSpecSlug(oldName.replace(/^spec-\d+-/i, ""));

  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const hex = specMigrationHex(dateId, oldName, attempt);
    const candidate = `spec-${dateId}-${hex}-${slug}`;
    if (!occupiedNames.has(candidate)) return candidate;
  }

  throw new Error(`Nao foi possivel gerar nome unico para ${oldName}.`);
}

async function buildMigratedBugName(bugPath, oldName, occupiedNames) {
  const fileStat = await stat(bugPath);
  const createdAt = fileStat.birthtimeMs > 0 ? fileStat.birthtime : fileStat.mtime;
  const dateId = formatSpecDateId(createdAt);
  const slug = normalizeSpecSlug(oldName.replace(/^bug-\d{3}-/i, ""));

  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const hex = specMigrationHex(dateId, oldName, attempt);
    const candidate = `bug-${dateId}-${hex}-${slug}`;
    if (!occupiedNames.has(candidate)) return candidate;
  }

  throw new Error(`Nao foi possivel gerar nome unico para ${oldName}.`);
}

function recordModernSlugDuplicateWarnings(entries, prefix, events) {
  for (const [slug, names] of modernDirectoriesBySlug(entries, prefix)) {
    if (names.length > 1) {
      events.push({ type: "modern-slug-duplicate", kind: prefix, slug, names });
    }
  }
}

async function cleanupEmptyModernDuplicateDirectories(root, prefix, entries, options, events) {
  for (const [slug, names] of modernDirectoriesBySlug(entries, prefix)) {
    if (names.length < 2) continue;

    const emptyNames = [];
    const populatedNames = [];
    for (const name of names) {
      if (await isEmptyDirectory(path.join(root, name))) emptyNames.push(name);
      else populatedNames.push(name);
    }

    if (populatedNames.length === 0) continue;
    for (const name of emptyNames) {
      await cleanupEmptyModernDirectory(root, prefix, slug, name, options, events);
    }
  }
}

async function cleanupEmptyModernDirectoriesForSlug(root, prefix, slug, occupiedNames, options, events) {
  for (const name of [...occupiedNames]) {
    if (modernDirectorySlug(prefix, name) !== slug) continue;
    if (!(await isEmptyDirectory(path.join(root, name)))) continue;
    await cleanupEmptyModernDirectory(root, prefix, slug, name, options, events);
    occupiedNames.delete(name);
  }
}

async function cleanupEmptyModernDirectory(root, prefix, slug, name, options, events) {
  if (!options.dryRun) {
    await rmdir(path.join(root, name));
  }
  events.push({ type: "empty-modern-cleanup", kind: prefix, slug, name });
}

function modernDirectoriesBySlug(entries, prefix) {
  const groups = new Map();
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const slug = modernDirectorySlug(prefix, entry.name);
    if (!slug) continue;
    const names = groups.get(slug) || [];
    names.push(entry.name);
    groups.set(slug, names);
  }
  return groups;
}

function modernDirectorySlug(prefix, name) {
  const match = String(name || "").match(new RegExp(`^${prefix}-\\d{6}-[0-9a-f]{4}-(.+)$`, "i"));
  return match ? normalizeSpecSlug(match[1]) : "";
}

function legacyDirectorySlug(prefix, name) {
  const match = String(name || "").match(new RegExp(`^${prefix}-\\d{3}-(.+)$`, "i"));
  return match ? normalizeSpecSlug(match[1]) : "";
}

async function isEmptyDirectory(dirPath) {
  try {
    return (await readdir(dirPath)).length === 0;
  } catch {
    return false;
  }
}

function formatSpecDateId(date) {
  const year = String(date.getFullYear()).slice(-2).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function specMigrationHex(dateId, oldName, attempt) {
  return createHash("sha256").update(`${dateId}:${oldName}:${attempt}`, "utf8").digest("hex").slice(0, 4);
}

function normalizeSpecSlug(slug) {
  return String(slug || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "spec";
}

async function updateRoadmapSpecNames(root, renames, options, events) {
  const roadmapPath = path.join(root, HARNESS_DIR, "roadmap.md");
  if (!existsSync(roadmapPath)) return;

  const roadmap = await readFile(roadmapPath, "utf8");
  let nextRoadmap = roadmap;
  for (const { oldName, newName } of renames) {
    nextRoadmap = replaceAllLiteral(nextRoadmap, oldName, newName);
  }

  if (nextRoadmap === roadmap) return;
  if (!options.dryRun) await writeFile(roadmapPath, nextRoadmap, "utf8");
  events.push({ type: "roadmap-spec-migrate", path: `${HARNESS_DIR}/roadmap.md` });
}

function replaceAllLiteral(value, search, replacement) {
  return value.split(search).join(replacement);
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

async function updateManagedFile(root, relativePath, latest, options, events) {
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
  if (Buffer.isBuffer(latest) ? (await readFile(absolutePath)).equals(latest) : current.trim() === latest.trim()) {
    events.push({ type: "ok", path: relativePath });
    return;
  }

  if (!options.dryRun) await writeFile(absolutePath, latest, "utf8");
  events.push({ type: "update", path: relativePath });
}

async function updateConstitutionFile(root, relativePath, latest, previousManifest, options, events) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    await updateManagedFile(root, relativePath, latest, options, events);
    return sha256(latest);
  }

  const current = await readFile(absolutePath, "utf8");
  if (current.trim() === latest.trim()) {
    events.push({ type: "ok", path: relativePath });
    return sha256(current);
  }

  const previousHash = previousManifest?.files?.[relativePath]?.sha256;
  if (options.force || (previousHash && sha256(current) === previousHash)) {
    if (!options.dryRun) await writeFile(absolutePath, latest, "utf8");
    events.push({ type: "update", path: relativePath });
    return sha256(latest);
  }

  events.push({
    type: "constitution-review",
    path: relativePath,
    reason: previousHash ? "alterado localmente" : "sem versao anterior confiavel"
  });
  return previousHash || null;
}

async function removeDeprecatedManagedFiles(targetRoot, generated, options, previousManifest, events) {
  if (!previousManifest?.files) return;

  const skip = new Set(adapterSkillPaths());
  skip.add(`${HARNESS_DIR}/sensors.json`);
  skip.add(`${HARNESS_DIR}/manifest.json`);

  for (const [relativePath, previousEntry] of Object.entries(previousManifest.files)) {
    if (skip.has(relativePath)) continue;
    if (Object.prototype.hasOwnProperty.call(generated, relativePath)) continue;

    const absolutePath = path.join(targetRoot, relativePath);
    if (!existsSync(absolutePath)) continue;

    const current = await readFile(absolutePath, "utf8").catch(() => null);
    if (current === null) continue;

    if (sha256(current) !== previousEntry.sha256) {
      events.push({ type: "deprecated-file-preserved-customized", path: relativePath });
      continue;
    }

    if (!options.dryRun) {
      await rm(absolutePath, { force: true });
    }
    events.push({ type: "deprecated-file-removed", path: relativePath });
  }
}

async function removeUnselectedAgentFiles(targetRoot, options, previousManifest, generated, events) {
  if (!previousManifest?.files) return;

  for (const relativePath of adapterSkillPaths()) {
    if (Object.prototype.hasOwnProperty.call(generated, relativePath)) continue;
    const previousEntry = previousManifest.files?.[relativePath];
    if (!previousEntry) continue;

    const absolutePath = path.join(targetRoot, relativePath);
    if (!existsSync(absolutePath)) continue;

    const current = await readFile(absolutePath, "utf8").catch(() => null);
    if (current === null) continue;

    if (sha256(current) !== previousEntry.sha256) {
      events.push({ type: "agent-file-preserved-customized", path: relativePath });
      continue;
    }

    if (!options.dryRun) {
      await rm(absolutePath, { force: true });
    }
    events.push({ type: "agent-file-removed", path: relativePath });
  }
}

function printUpdateSummary(targetRoot, events, options, catalogCount = 0) {
  const grouped = groupBy(events, "type");
  console.log(`[pbq] Update target: ${targetRoot}`);
  if (options.dryRun) console.log("[pbq] Dry run: nenhum arquivo foi alterado.");
  console.log(`[pbq] Created missing: ${(grouped.create || []).length}`);
  console.log(`[pbq] Updated: ${(grouped.update || []).length}`);
  console.log(`[pbq] Already current: ${(grouped.ok || []).length}`);
  printConstitutionTable(events, options, "update");
  for (const event of grouped["deprecated-file-removed"] || []) {
    const action = options.dryRun ? "Would remove deprecated file" : "Deprecated file removed";
    console.log(`[pbq] ${action}: ${event.path}`);
  }
  for (const event of grouped["deprecated-file-preserved-customized"] || []) {
    console.log(`[pbq] Deprecated file preservado (customizado): ${event.path}`);
  }
  for (const event of grouped["agent-file-removed"] || []) {
    const action = options.dryRun ? "Would remove agent file" : "Agent file removed";
    console.log(`[pbq] ${action} (agente retirado de --agents): ${event.path}`);
  }
  for (const event of grouped["agent-file-preserved-customized"] || []) {
    console.log(`[pbq] Agent file de agente retirado preservado (customizado): ${event.path}`);
  }
  for (const event of grouped["spec-migrate"] || []) {
    console.log(`[pbq] Spec migrated: ${event.oldName} -> ${event.newName}`);
  }
  for (const event of grouped["bug-migrate"] || []) {
    console.log(`[pbq] Bug migrated: ${event.oldName} -> ${event.newName}`);
  }
  for (const event of grouped["empty-modern-cleanup"] || []) {
    const action = options.dryRun ? "Would remove empty" : "Empty";
    const suffix = options.dryRun ? "" : " removed";
    console.log(`[pbq] ${action} ${event.kind} directory${suffix}: ${event.name}`);
  }
  for (const event of grouped["modern-slug-duplicate"] || []) {
    console.log(`[pbq] Warning: duplicate ${event.kind} slug "${event.slug}": ${event.names.join(", ")}`);
  }
  if ((grouped["roadmap-spec-migrate"] || []).length > 0) {
    console.log("[pbq] Roadmap spec references updated.");
  }
  if (catalogCount > 0) {
    console.log(`[pbq] ${catalogCount} sensores no catalogo. Rode 'pbq sensor catalog' ou /sensor para adicionar.`);
  }
}

function printConstitutionTable(events, options, command) {
  const rows = events.filter((event) => event.path?.startsWith(`${HARNESS_DIR}/constitution/`));
  if (rows.length === 0) return;

  console.log("[pbq] Constitution:");
  console.log("| Arquivo | Resultado | Motivo |");
  console.log("| --- | --- | --- |");
  for (const event of rows) {
    let result;
    let reason;
    if (event.type === "constitution-review") {
      result = "preservado para revisao";
      reason = event.reason;
    } else if (event.type === "ok") {
      result = "mantido";
      reason = "equivalente ao gerado";
    } else if (event.type === "skip") {
      result = "preservado";
      reason = "ja existia; init nao sobrescreve";
    } else if (event.type === "create" || event.type === "would-create") {
      result = options.dryRun ? "criaria" : "criado";
      reason = "arquivo ausente";
    } else if (["update", "overwrite", "would-overwrite"].includes(event.type)) {
      result = options.dryRun ? "atualizaria" : "atualizado";
      reason = command === "init" ? "--force" : "versao gerada diferente";
    } else {
      continue;
    }
    console.log(`| ${event.path} | ${result} | ${reason} |`);
  }
}

async function runPackageCommand(args) {
  const action = args.shift();
  if (action !== "close") {
    throw new Error("Uso: pbq package close [path] --spec <spec-name> --package <N> [--phase before|after]");
  }

  const options = parsePackageCloseArgs(args);
  const targetRoot = path.resolve(options.targetPath);
  const event = options.phase === "before" ? "edit" : "close";
  const allSensors = await readSensors(targetRoot);
  const selectedSensors = allSensors.filter((sensor) => {
    const legacyBucket = sensor.tier || sensor.runnerBucket;
    return (
      sensor.enabled !== false &&
      (legacyBucket === undefined || options.tiers.includes(legacyBucket)) &&
      isSensorEligibleForEvent(sensor, event)
    );
  });
  const requiredSensors = await readPackageRequiredSensors(targetRoot, options);
  const sensors = resolvePackageSensors(selectedSensors, allSensors, requiredSensors);
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

async function readPackageRequiredSensors(root, options) {
  const contractPath = path.join(root, HARNESS_DIR, "specs", options.spec, "contracts", `package-${options.packageNumber}.md`);
  if (!existsSync(contractPath)) return [];
  return parseContractRequiredSensors(await readFile(contractPath, "utf8")).filter((sensor) => sensor.hasName);
}

function resolvePackageSensors(selectedSensors, allSensors, requiredSensors) {
  const resolved = [];
  const byName = new Map(allSensors.map((sensor) => [sensor.name, sensor]));
  const added = new Set();

  function addSensor(sensor, required = "sim") {
    if (!sensor?.name || added.has(sensor.name)) return;
    resolved.push({ ...sensor, required });
    added.add(sensor.name);
  }

  for (const sensor of selectedSensors) addSensor(sensor, "sim");

  for (const required of requiredSensors) {
    if (added.has(required.name)) continue;

    if (required.local) {
      addSensor({
        name: required.name,
        tier: required.tier || "-",
        command: required.command,
        source: "contract-local",
        scope: "local"
      }, "sim");
      continue;
    }

    if (required.scope === "local") {
      addSensor(pendingSensor(required.name, required.tier, "-", "Sensor local obrigatorio sem comando no contrato."));
      continue;
    }

    const registered = byName.get(required.name);
    if (registered && registered.enabled !== false) {
      addSensor(registered, "sim");
      continue;
    }

    const evidence = registered
      ? "Sensor obrigatorio do contrato esta disabled em sensors.json."
      : "Sensor obrigatorio do contrato nao registrado em sensors.json.";
    addSensor(pendingSensor(required.name, required.tier || registered?.tier, registered?.command || "-", evidence));
  }

  return resolved;
}

function pendingSensor(name, tier = "-", command = "-", evidence = "Sensor obrigatorio pendente.") {
  return {
    name,
    tier: tier || "-",
    command: command || "-",
    required: "sim",
    pending: true,
    pendingEvidence: evidence
  };
}

function buildSensorEvidence(rawOutput, startedAt) {
  if (!rawOutput) return `Executado em ${startedAt}`;
  const MAX_CHARS = 500;
  return rawOutput.length > MAX_CHARS ? `...${rawOutput.slice(-MAX_CHARS)}` : rawOutput;
}

function runSensor(root, sensor) {
  if (sensor.pending) {
    return {
      sensor: sensor.name,
      tier: sensor.tier || "-",
      required: sensor.required || "sim",
      status: "pendente",
      command: sensor.command || "-",
      exitCode: "-",
      evidence: sensor.pendingEvidence || "Sensor obrigatorio pendente."
    };
  }
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
    required: sensor.required || "sim",
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
    artifacts: { spec: false, progress: false, roadmap: Boolean(roadmap) },
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

  entry.artifacts.spec = existsSync(specPath);
  entry.artifacts.progress = existsSync(progressPath);
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
            return {
              name: sensor.name,
              registered: Boolean(known),
              tier: sensor.tier || known?.tier || "-",
              scope: sensor.scope || "global",
              local: sensor.local === true,
              command: sensor.command || ""
            };
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
      if (!required.registered && required.scope !== "local") {
        entry.warnings.push(`Package ${packageNumber} exige sensor "${required.name}" ausente de sensors.json.`);
      }
      if (required.scope === "local" && !required.command) {
        entry.warnings.push(`Package ${packageNumber} exige sensor local "${required.name}" sem comando no contract.`);
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
    sensors: dashboard.sensors,
    summary: dashboard.summary,
    specs: dashboard.specs
  };
}

const DASHBOARD_FLOW_STAGES = [
  { name: "1. spec", title: "Especificar", description: "Definir o problema, o escopo e o aceite." },
  { name: "2. contract (validacao)", title: "Validar contrato", description: "Conferir limites e sensores antes de implementar." },
  { name: "3. implement", title: "Implementar", description: "Construir dentro do contrato aprovado." },
  { name: "4. test/qa", title: "Testar e avaliar", description: "Executar sensores e registrar o aceite." },
  { name: "5. roadmap", title: "Atualizar roadmap", description: "Registrar o resultado e o proximo passo." }
];

function buildDashboardFlow(spec, pkg = null) {
  const progressPackage = Number(spec.progress.currentPackage) || null;
  const roadmapPackage = Number(spec.currentPackage) || null;
  const currentPackage = progressPackage || roadmapPackage;
  const ambiguous = progressPackage && roadmapPackage && progressPackage !== roadmapPackage;
  const applies = !ambiguous && (pkg ? currentPackage === pkg.number : !spec.packages.length);
  const reports = new Map((applies ? spec.progress.stages : []).map((stage) => [normalizeStageName(stage.stage), normalizeStageName(stage.status)]));
  const states = { ok: ["reported", "Concluido (declarado)"], "em andamento": ["running", "Em andamento"], pendente: ["pending", "Pendente"], falhou: ["failed", "Falhou"], "nao-aplicavel": ["skipped", "Nao se aplica"] };
  const nodes = DASHBOARD_FLOW_STAGES.map((stage, index) => {
    const report = reports.get(stage.name);
    const [state, label] = Object.hasOwn(states, report) ? states[report] : ["missing", "Sem registro"];
    return { ...stage, state, label, index, source: state === "missing" ? "" : "progress.md",
      note: state === "missing" ? ambiguous ? "Package atual diverge entre roadmap e progress; o quadro nao foi atribuido."
        : pkg && currentPackage !== pkg.number ? "O quadro atual nao comprova esta etapa neste package." : "Nenhuma execucao registrada para esta etapa."
        : `Quadro de etapas: ${report}. Declaracao do progress, sem log de chamada da skill.` };
  });
  if (spec.artifacts?.spec && nodes[0].state === "missing") Object.assign(nodes[0], { state: "artifact", label: "Spec presente", source: "spec.md", note: "Arquivo encontrado. A execucao da skill nao esta registrada." });
  if (pkg?.contractExists) {
    nodes[1].note += " Contrato presente; a existencia do arquivo nao comprova o contract-check.";
    if (!nodes[1].source) nodes[1].source = `contracts/package-${pkg.number}.md`;
  } else if (pkg && nodes[1].state === "reported") Object.assign(nodes[1], { state: "conflict", label: "Registro divergente", note: "Progress declara validacao concluida, mas o contrato nao foi encontrado." });
  if (pkg?.evaluationExists) {
    const missing = pkg.requiredSensors.filter((required) => !pkg.evaluationSensors.some((sensor) => sensor.name === required.name && sensor.status === "passou"));
    const failed = pkg.evaluationSensors.some((sensor) => sensor.status === "falhou");
    const report = reports.get("4. test/qa");
    const contradicts = report && report !== "ok";
    const conflict = pkg.score === 1 && (missing.length > 0 || failed || contradicts);
    Object.assign(nodes[3], { state: conflict ? "conflict" : pkg.score === 1 ? "verified" : pkg.score === 0 ? "failed" : "conflict",
      label: conflict ? "Registro divergente" : pkg.score === 1 ? "Confirmado por evaluation" : pkg.score === 0 ? "Reprovado" : "Resultado incompleto",
      source: `evaluations/package-${pkg.number}.md`, note: `Score: ${pkg.score ?? "ausente"}. `
        + (missing.length ? `Sensores obrigatorios sem aprovacao: ${missing.map((sensor) => sensor.name).join(", ")}. ` : "")
        + (failed ? "Ha sensor com falha. " : "") + (contradicts ? `O progress declara: ${report}. ` : "")
        + "Resultado registrado; nao comprova execucao das etapas anteriores." });
  }
  if (spec.artifacts?.roadmap && nodes[4].state === "missing") { nodes[4].source = "roadmap.md"; nodes[4].note += ` Status da spec no roadmap: ${spec.status}.`; }
  return nodes;
}

function renderDashboardHtml(dashboard) {
  const escape = escapeHtml;
  const initialSpec = Math.max(0, dashboard.specs.findIndex((spec) => spec.status === "em andamento"));
  const currentPkg = (spec) => spec.packages.find((pkg) => pkg.number === (Number(spec.progress.currentPackage) || Number(spec.currentPackage))) || null;
  const initialPackage = dashboard.specs[initialSpec] ? currentPkg(dashboard.specs[initialSpec]) : null;
  const flowIcon = (state) => ({ reported: "&#10003;", verified: "&#10003;", running: "&#9654;", pending: "&#9675;", failed: "&#215;", conflict: "!", skipped: "&ndash;", artifact: "&#9633;", missing: "?" })[state];
  const completed = (node) => ["reported", "verified"].includes(node.state);
  const stageStats = DASHBOARD_FLOW_STAGES.map((stage, index) => {
    const nodes = dashboard.specs.map((spec) => buildDashboardFlow(spec, currentPkg(spec))[index]);
    return { ...stage, done: nodes.filter(completed).length, running: nodes.filter((node) => node.state === "running").length,
      failed: nodes.filter((node) => ["failed", "conflict"].includes(node.state)).length,
      remaining: nodes.filter((node) => !completed(node) && !["running", "failed", "conflict"].includes(node.state)).length };
  });
  const renderFlow = (spec, pkg) => {
    const nodes = buildDashboardFlow(spec, pkg);
    const prefix = `.plan-build-qa/specs/${spec.name}/`;
    const sensors = pkg ? [...new Set([...pkg.requiredSensors.map((sensor) => sensor.name), ...pkg.evaluationSensors.map((sensor) => sensor.name)])] : [];
    const sensorRows = sensors.map((name) => {
      const required = pkg.requiredSensors.some((sensor) => sensor.name === name);
      const status = pkg.evaluationSensors.find((sensor) => sensor.name === name)?.status || "sem registro";
      const style = status === "passou" ? "verified" : status === "falhou" ? "failed" : status === "pendente" ? "pending" : "missing";
      return `<tr><th scope="row">${escape(name)}</th><td>${required ? "Obrigatorio" : "Registrado"}</td><td><span class="badge ${style}">${escape(status)}</span></td></tr>`;
    }).join("");
    return `<div class="flow-context"><div><span class="eyebrow">FLUXO DE EXECUCAO</span><h3>${escape(spec.name)}</h3><p>${pkg ? `Package ${pkg.number}` : "Sem package selecionado"} &middot; status da spec: ${escape(spec.status)}</p></div><span class="badge neutral">${nodes.filter(completed).length}/5 etapas com conclusao registrada</span></div>
      <ol class="pipeline" aria-label="Etapas PBQ">${nodes.map((node) => `<li class="flow-node ${node.state}" data-stage="${node.index + 1}" data-flow-state="${node.state}"><div class="step-top"><span class="step-number">0${node.index + 1}</span><span class="step-symbol" aria-hidden="true">${flowIcon(node.state)}</span></div><h4>${escape(node.title)}</h4><p class="step-description">${escape(node.description)}</p><span class="badge ${node.state}">${escape(node.label)}</span><p class="evidence-note">${escape(node.note)}</p><div class="evidence-source"><span>Fonte</span><code>${node.source ? escape(node.source === "roadmap.md" ? ".plan-build-qa/roadmap.md" : prefix + node.source) : "Nenhum registro"}</code></div></li>`).join("")}</ol>
      <div class="flow-evidence"><div class="evidence-explainer"><h4>Como ler este fluxo</h4><p><strong>Declarado</strong> vem do quadro de etapas do progress. <strong>Confirmado</strong> vem da evaluation e dos sensores obrigatorios registrados.</p><p><strong>Pendente</strong> e um estado explicito. <strong>Sem registro</strong> significa que os arquivos nao permitem afirmar se a etapa foi executada.</p><p>O quadro do progress vale para o package atual identificado. Packages anteriores exibem apenas suas proprias evidencias. O painel nao registra chamadas da LLM.</p></div><div class="sensor-panel"><div class="section-heading"><h4>Sensores do package</h4><span class="count-label">${sensors.length} registrados</span></div>${sensors.length ? `<div class="table-scroll"><table class="sensor-table"><thead><tr><th>Sensor</th><th>Obrigatoriedade</th><th>Resultado</th></tr></thead><tbody>${sensorRows}</tbody></table></div>` : `<p class="empty">${pkg ? "Nenhum sensor registrado neste package." : "Selecione um package com contrato ou evaluation para ver os sensores."}</p>`}</div></div>`;
  };
  const flowTemplates = dashboard.specs.map((spec, index) => [null, ...spec.packages].map((pkg) => `<template id="flow-${index}-${pkg?.number || 0}">${renderFlow(spec, pkg)}</template>`).join("")).join("");
  const statusColors = { planejado: "#94a3b8", "em andamento": "#38a1dd", concluido: "#20b67a", bloqueado: "#ed6675", cancelado: "#c5cad3" };
  const statusLabels = { planejado: "Planejadas", "em andamento": "Em andamento", concluido: "Concluidas", bloqueado: "Bloqueadas", cancelado: "Canceladas" };
  let cumulative = 0;
  const statusParts = Object.entries(statusColors).map(([status, color]) => {
    const count = dashboard.summary.specsByStatus[status] || 0;
    const from = cumulative; cumulative += dashboard.specs.length ? count / dashboard.specs.length * 100 : 0;
    return { status, color, count, gradient: `${color} ${from}% ${cumulative}%` };
  });
  const donut = dashboard.specs.length ? statusParts.map((part) => part.gradient).join(",") : "#e5e9ef 0% 100%";
  const tableRows = dashboard.specs.map((spec, index) => {
    const flow = buildDashboardFlow(spec, currentPkg(spec));
    const attributes = `data-spec-name="${escape(spec.name.toLowerCase())}" data-spec-status="${escape(spec.status)}" data-spec-integrity="${escape(spec.integrity)}" data-spec-updated-at="${escape(spec.updatedAt || "")}" data-spec-number="${escape(String(specSequenceNumber(spec)))}"`;
    return `<tr class="gantt-row" ${attributes}><th scope="row"><button type="button" class="spec-link" data-open-flow="${index}">${escape(spec.name.replace(/^spec-/, ""))}</button><span class="spec-meta">${escape(spec.updatedAt || "Sem data")} &middot; ${spec.materialized ? "spec materializada" : "apenas no roadmap"}</span></th><td><span class="integrity-label ${spec.integrity}" title="${escape(spec.integrityReason)}"><span class="dot"></span>${escape(spec.integrity)}</span></td><td><span class="badge neutral">${escape(spec.status)}</span></td><td class="numeric">${spec.packages.length}</td><td class="numeric">${spec.packages.filter((pkg) => pkg.evaluationExists).length}</td><td><div class="mini-pipeline" aria-label="Resumo das etapas">${flow.map((node) => `<span class="mini-step ${node.state}" title="${escape(node.title + ": " + node.label)}" aria-label="${escape(node.title + ": " + node.label)}">${flowIcon(node.state)}</span>`).join("")}</div></td><td><button type="button" class="text-button" data-open-flow="${index}" aria-label="Ver fluxo de ${escape(spec.name)}">Ver fluxo &#8599;</button></td></tr>
      <tr class="gantt-detail-row" ${attributes}><td colspan="7"><details class="gantt-collapse"><summary>Ver packages (${spec.packages.length})${spec.integrity !== "healthy" ? ` &middot; ${escape(spec.integrityReason)}` : ""}</summary><div class="package-list">${spec.packages.length ? spec.packages.map((pkg) => `<button type="button" class="package-chip" data-open-flow="${index}" data-open-package="${pkg.number}"><strong>Package ${pkg.number}</strong><span>Contrato: ${pkg.contractExists ? "presente" : "ausente"}</span><span>Evaluation: ${pkg.evaluationExists ? "presente" : "ausente"}</span><span>Score: ${pkg.score ?? "sem registro"}</span></button>`).join("") : `<p class="empty">Nenhum package registrado.</p>`}</div></details></td></tr>`;
  }).join("");
  const warningRows = dashboard.specs.filter((spec) => spec.warnings.length || spec.integrity !== "healthy").map((spec) => {
    const reasons = [...new Set([...spec.warnings, ...(spec.integrity !== "healthy" ? [spec.integrityReason] : [])])];
    return `<details class="warning-group"><summary><span class="dot warning-dot"></span>${escape(spec.name)}<span class="count-label">${reasons.length} alertas</span></summary><ul>${reasons.map((warning) => `<li>${escape(warning)}</li>`).join("")}</ul></details>`;
  }).join("");
  const bars = stageStats.map((stage, index) => {
    const width = (value) => dashboard.specs.length ? (value / dashboard.specs.length * 100).toFixed(3) : 0;
    return `<div class="stage-bar-row"><span class="stage-bar-label"><b>0${index + 1}</b>${escape(stage.title)}</span><div class="stacked-bar" role="img" aria-label="${escape(stage.title)}: ${stage.done} com conclusao, ${stage.running} em andamento, ${stage.failed} falhas ou divergencias, ${stage.remaining} outros estados"><i class="bar-done" style="width:${width(stage.done)}%"></i><i class="bar-running" style="width:${width(stage.running)}%"></i><i class="bar-failed" style="width:${width(stage.failed)}%"></i><i class="bar-remaining" style="width:${width(stage.remaining)}%"></i></div><strong>${stage.done}<small> / ${dashboard.specs.length}</small></strong></div>`;
  }).join("");
  const stageLegend = `<span class="badge reported">Concluido (declarado)</span><span class="badge verified">Confirmado por evaluation</span><span class="badge running">Em andamento</span><span class="badge pending">Pendente</span><span class="badge failed">Falhou</span><span class="badge conflict">Registro divergente</span><span class="badge skipped">Nao se aplica</span><span class="badge missing">Sem registro</span>`;
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PBQ Dashboard</title>
<style>
:root{--bg:#f1f3f6;--ink:#192435;--muted:#718096;--line:#e1e6ed;--green:#19ad78;--header-height:76px;font-family:"Segoe UI",Arial,sans-serif;color:var(--ink);background:var(--bg)}*{box-sizing:border-box}body{margin:0;font-size:14px;line-height:1.5}button,input,select{font:inherit}button{cursor:pointer}a{color:inherit;text-decoration:none}button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid #269edc;outline-offset:4px}[hidden]{display:none!important}
.topbar{position:sticky;top:0;z-index:20;background:#151921;color:white;display:flex;align-items:center;gap:30px;padding:18px 32px;height:var(--header-height);min-height:var(--header-height)}.brand{font-size:26px;font-weight:750;letter-spacing:-1px;display:flex;align-items:center;gap:10px}.brand-mark{display:grid;place-items:center;width:32px;height:32px;border:1px solid #5ce0ac;border-radius:9px;color:#5ce0ac;font-size:20px}.brand small{font-size:10px;color:#94a3b8;letter-spacing:2px;font-weight:500}.top-divider{height:26px;width:1px;background:#414752}.workspace-name{font-size:14px}.snapshot{margin-left:auto;font-size:12px;color:#bcc5d2;display:flex;align-items:center;gap:8px}.live-dot{height:7px;width:7px;background:#50c79b;border-radius:50%}.nav{position:sticky;top:var(--header-height);z-index:19;background:#fff;border-bottom:1px solid var(--line);display:flex;gap:30px;padding:0 32px;overflow-x:auto}.nav a{padding:17px 0;color:#718096;white-space:nowrap;border-bottom:2px solid transparent}.nav a:first-child{border-color:var(--green);color:var(--ink)}.nav a:hover{color:var(--green)}
main { width: 100%; max-width:1680px;margin:auto;padding:30px 32px 42px;}h1,h2,h3,h4,p{margin:0}h1{font-size:27px;font-weight:650;letter-spacing:-.7px}h2{font-size:18px;font-weight:600;letter-spacing:-.3px}h3{font-size:16px;font-weight:600}h4{font-size:14px}p{color:var(--muted)}.page-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:24px}.page-heading p{margin-top:4px}.readonly{background:#e8f4ee;color:#20815d;border:1px solid #d1e9dd;border-radius:5px;padding:6px 10px;font-size:12px;white-space:nowrap}.eyebrow{font-size:10px;font-weight:700;letter-spacing:1.4px;color:#8391a5;display:block;margin-bottom:7px}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin-bottom:22px}.metric{background:white;border:1px solid var(--line);border-radius:8px;padding:20px 22px;position:relative}.metric-icon{position:absolute;right:19px;top:19px;color:#92a6ba;background:#f1f5f9;border-radius:6px;padding:4px 9px;font-size:18px}.metric p{font-size:12px}.metric strong{display:block;font-size:32px;font-weight:600;letter-spacing:-1px;line-height:1.3;margin:8px 0}.metric small{color:var(--muted);font-size:11px}.positive{color:#11996c!important}.attention{color:#bf5d66!important}
.overview-grid{display:grid;grid-template-columns:1.45fr 1fr;gap:22px;margin-bottom:26px}.panel{background:white;border:1px solid var(--line);border-radius:8px;min-width:0}.panel-header{padding:20px 22px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:14px}.panel-header p{font-size:12px;margin-top:4px}.count-label{font-size:11px;font-weight:400;color:#8190a3;white-space:nowrap}.chart-content{padding:22px}.chart-legend{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:20px;font-size:11px;color:#748094}.chart-legend span{display:flex;align-items:center;gap:5px}.chart-legend i{height:8px;width:8px;border-radius:2px}.stage-bar-row{display:grid;grid-template-columns:162px minmax(50px,1fr) 52px;align-items:center;gap:10px;margin:14px 0}.stage-bar-label{font-size:12px}.stage-bar-label b{display:inline-block;color:#a3afbf;font-weight:500;width:27px;font-size:10px}.stacked-bar{height:16px;border-radius:3px;background:#edf0f5;display:flex;overflow:hidden}.stacked-bar i{height:100%;display:block}.bar-done{background:#22b77d}.bar-running{background:#42a9de}.bar-failed{background:#ed7a88}.bar-remaining{background:#e7ebf1}.stage-bar-row>strong{font-size:13px;text-align:right;font-weight:600}.stage-bar-row small{color:#9aa5b4;font-weight:400}.chart-note{font-size:11px;color:#8b97a7;margin-top:18px}.allocation{display:flex;align-items:center;justify-content:center;gap:30px;padding:34px 24px;min-height:275px}.donut{width:188px;height:188px;flex-shrink:0;border-radius:50%;display:grid;place-items:center}.donut-center{width:132px;height:132px;border-radius:50%;background:white;display:grid;align-content:center;text-align:center}.donut-center strong{font-size:31px;line-height:1.1;font-weight:600}.donut-center span{font-size:11px;color:var(--muted);margin-top:5px}.allocation-list{list-style:none;padding:0;margin:0;min-width:145px}.allocation-list li{display:grid;grid-template-columns:9px 1fr auto;gap:9px;align-items:center;margin:11px 0;font-size:12px}.allocation-list i{width:8px;height:8px;border-radius:2px}.allocation-list strong{font-weight:600}.allocation-list small{display:block;font-size:10px;color:var(--muted)}
.flow-section{margin-bottom:26px;scroll-margin-top:152px}.section-tag{font-size:10px;color:#718096;background:#f4f7fa;padding:4px 8px;border-radius:4px}.flow-selectors{display:flex;gap:16px;padding:17px 22px;background:#fbfcfe;border-bottom:1px solid var(--line);flex-wrap:wrap}.filter-control{display:flex;flex-direction:column;gap:5px;min-width:145px}.filter-control>span{font-size:11px;font-weight:500;color:#7c8798}.filter-control select,.filter-control input{border:1px solid #dbe1e9;background:white;border-radius:5px;color:#334155;padding:9px 11px;max-width:100%;min-height:39px}.flow-selectors .filter-control:first-child{flex:1;min-width:220px}.flow-selectors .filter-control:last-child{width:170px}.flow-main{padding:22px}.flow-context{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:24px}.flow-context h3{overflow-wrap:anywhere}.flow-context p{font-size:12px;margin-top:4px}.pipeline{list-style:none;padding:0;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:17px;margin:0}.flow-node{position:relative;background:#fcfdfe;border:1px solid var(--line);border-top:3px solid #bdc8d6;border-radius:6px;padding:16px 14px;min-width:0}.flow-node:not(:last-child):after{content:'→';position:absolute;right:-17px;top:27px;color:#9caabb;width:16px;text-align:center;font-size:16px}.flow-node.reported,.flow-node.verified{border-top-color:#24af7e}.flow-node.running{border-top-color:#41a5da}.flow-node.failed,.flow-node.conflict{border-top-color:#e36c7b}.flow-node.pending{border-top-color:#d2a858}.step-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.step-number{color:#9aa8b9;font-size:11px;letter-spacing:1px}.step-symbol{height:27px;width:27px;display:grid;place-items:center;border-radius:50%;background:#eaf0f5;color:#8090a4;font-weight:600}.reported .step-symbol,.verified .step-symbol{background:#e1f5eb;color:#12a270}.running .step-symbol{background:#e4f2fc;color:#278dc6}.failed .step-symbol,.conflict .step-symbol{background:#fce9ed;color:#d8546b}.flow-node h4{margin-bottom:6px;font-size:14px}.step-description{font-size:11px;min-height:36px;margin-bottom:15px;line-height:1.6}.badge{display:inline-flex;align-items:center;padding:4px 7px;border-radius:4px;font-size:10px;font-weight:500;line-height:1.4;gap:4px}.badge.reported,.badge.verified{color:#16885f;background:#e7f6ee}.badge.running{color:#237fae;background:#e7f3fc}.badge.pending{color:#9c741d;background:#fbf3df}.badge.failed,.badge.conflict{color:#bf4c62;background:#fcecf0}.badge.skipped,.badge.missing,.badge.neutral,.badge.artifact{color:#748295;background:#eef2f6}.evidence-note{font-size:11px;line-height:1.65;margin:13px 0;color:#738196}.evidence-source{border-top:1px solid #e7edf3;padding-top:10px;margin-top:12px}.evidence-source>span{display:block;color:#9aa6b5;font-size:9px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}code{font-family:Consolas,monospace;font-size:10px;overflow-wrap:anywhere;color:#708197}.flow-legend{padding:0 22px 20px;display:flex;gap:8px;flex-wrap:wrap}.flow-evidence{display:grid;grid-template-columns:1fr 1.4fr;gap:24px;margin-top:24px;border-top:1px solid var(--line);padding-top:22px}.evidence-explainer p{font-size:11px;line-height:1.7;margin-top:8px;max-width:510px}.evidence-explainer strong{font-weight:600;color:#66778c}.section-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:10px}.sensor-table{width:100%;border-collapse:collapse;font-size:11px}.sensor-table th,.sensor-table td{text-align:left;border-bottom:1px solid #edf0f4;padding:9px 8px}.sensor-table thead th{background:#f5f7fa;color:#8491a2;font-size:10px;font-weight:500}.sensor-table tbody th{font-weight:500;overflow-wrap:anywhere}
#overview,#integrity-matrix{scroll-margin-top:152px}.execution{margin-bottom:26px;scroll-margin-top:152px}.dashboard-filters{display:grid;grid-template-columns:minmax(200px,1.5fr) repeat(3,minmax(130px,1fr));gap:14px;padding:18px 22px}.table-scroll{overflow-x:auto}.spec-table{width:100%;border-collapse:collapse;min-width:1000px}.spec-table thead th{padding:13px 15px;font-size:10px;font-weight:500;color:#7e8fa6;text-align:left;background:#f1f4f8;white-space:nowrap;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.spec-table tbody th,.spec-table tbody td{padding:16px 15px;text-align:left;border-bottom:1px solid #edf0f4}.spec-table tbody th{width:34%;font-weight:500}.gantt-row:nth-of-type(4n+3){background:#fafbfd}.spec-link{border:0;background:none;padding:0;color:#253a50;font-size:12px;font-weight:600;text-align:left;overflow-wrap:anywhere}.spec-link:hover,.text-button:hover{color:#0f9f75}.spec-meta{display:block;font-size:10px;color:#9aa6b5;margin-top:5px}.integrity-label{font-size:10px;color:#73849a;display:inline-flex;gap:6px;align-items:center}.dot{width:6px;height:6px;background:#32b284;border-radius:50%;display:inline-block;flex-shrink:0}.warning .dot,.warning-dot{background:#d3a548}.critical .dot{background:#e06c7c}.numeric{font-size:12px;color:#60748b}.mini-pipeline{display:flex;align-items:center;gap:5px}.mini-step{width:22px;height:22px;display:grid;place-items:center;font-size:11px;border-radius:4px;background:#eef2f6;color:#97a6b6}.mini-step.reported,.mini-step.verified{background:#e2f6eb;color:#159969}.mini-step.running{background:#e3f1fc;color:#278dbd}.mini-step.pending{background:#fbf3e1;color:#aa822a}.mini-step.failed,.mini-step.conflict{background:#fbe8ee;color:#cf5c71}.text-button{background:none;border:0;padding:4px 0;font-size:11px;color:#60829d;white-space:nowrap}.gantt-detail-row td{padding:0 15px!important}.gantt-collapse summary{font-size:10px;color:#8998aa;cursor:pointer;padding:7px 0;overflow-wrap:anywhere}.package-list{display:flex;flex-wrap:wrap;gap:10px;padding:7px 0 15px}.package-chip{background:white;border:1px solid #e0e7ef;border-radius:5px;display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:10px 14px;color:#7c8a9d;font-size:10px}.package-chip:hover{border-color:#45b99a}.package-chip strong{font-size:11px;color:#3b526b;margin-bottom:3px}.table-footer{padding:13px 22px;display:flex;justify-content:space-between;gap:10px;color:#8d9bad;font-size:11px;border-top:1px solid var(--line)}.empty{padding:20px;color:#8a98a8;font-size:12px}.warning-group{margin:0 22px;border-bottom:1px solid #edf0f4}.warning-group:last-child{border-bottom:0}.warning-group summary{display:flex;align-items:center;gap:8px;cursor:pointer;padding:14px 0;font-size:11px;overflow-wrap:anywhere}.warning-group summary .count-label{margin-left:auto}.warning-group ul{font-size:11px;color:#7b899c;padding-left:22px;line-height:1.8;margin:0 0 15px}.footer{font-size:10px;color:#8b99aa;display:flex;justify-content:space-between;gap:20px;margin-top:22px}.skip-link{position:absolute;left:20px;top:-100px;background:white;color:#192435;padding:10px;z-index:30}.skip-link:focus{top:10px}
@media(max-width:1150px){.allocation{gap:18px;padding:30px 18px}.donut{width:150px;height:150px}.donut-center{width:104px;height:104px}.pipeline{grid-template-columns:repeat(5,minmax(170px,1fr));min-width:920px}.flow-main{overflow-x:auto}.stage-bar-row{grid-template-columns:145px 1fr 46px}}
@media(max-width:800px){main{padding:22px 16px}.topbar{padding:15px 18px;gap:16px}.brand small,.top-divider,.workspace-name{display:none}.snapshot{font-size:10px}.nav{padding:0 18px;gap:24px;font-size:12px}.metrics{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.metric{padding:16px}.metric strong{font-size:27px}.metric-icon{display:none}.overview-grid{grid-template-columns:1fr}.allocation{min-height:220px;gap:34px}.page-heading{align-items:center}h1{font-size:23px}.readonly{font-size:10px}.panel-header{padding:17px 16px;align-items:flex-start}.flow-selectors,.dashboard-filters{padding:16px}.flow-main{padding:16px;overflow-x:visible}.flow-context{align-items:flex-start;flex-direction:column}.pipeline{min-width:0;grid-template-columns:1fr;gap:18px}.flow-node{padding:15px 16px}.flow-node:not(:last-child):after{content:'↓';right:auto;left:24px;top:auto;bottom:-19px}.step-top{margin-bottom:6px}.step-description{min-height:0;margin-bottom:10px}.evidence-note{margin:10px 0}.evidence-source{margin-top:8px}.flow-evidence{grid-template-columns:1fr}.flow-legend{padding:0 16px 18px}.dashboard-filters{grid-template-columns:1fr 1fr}.filter-control{min-width:0}.filter-control select{width:100%}.flow-selectors .filter-control:first-child{min-width:0;flex-basis:100%}.flow-selectors .filter-control:last-child{width:100%}.footer{flex-direction:column;gap:6px}.table-footer{flex-direction:column}.warning-group{margin:0 16px}}
@media(prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}@media print{.topbar,.nav,.dashboard-filters,.flow-selectors,.text-button{display:none}.pipeline{min-width:0}.flow-main{overflow:visible}main{padding:0}.spec-table{min-width:0}}
</style></head><body>
<a class="skip-link" href="#pbq-flow">Ir para o fluxo</a>
<header class="topbar"><a class="brand" href="#overview" aria-label="PBQ Dashboard"><span class="brand-mark" aria-hidden="true">&#8599;</span>pbq<small>PLAN BUILD QA</small></a><span class="top-divider"></span><span class="workspace-name">${escape(path.basename(dashboard.root))}</span><span class="snapshot"><span class="live-dot"></span>Snapshot &middot; ${escape(dashboard.generatedAt.replace("T", " ").slice(0, 16))} UTC</span></header>
<nav class="nav" aria-label="Navegacao do dashboard"><a href="#overview">Visao geral</a><a href="#pbq-flow">Fluxo PBQ</a><a href="#gantt-execution">Specs e packages</a><a href="#integrity-matrix">Integridade</a></nav>
<main id="overview"><div class="page-heading"><div><span class="eyebrow">ACOMPANHAMENTO DO HARNESS</span><h1>PBQ Dashboard</h1><p>Do planejamento ao aceite. Veja o que tem registro e o que ainda precisa de evidencia.</p></div><span class="readonly">Somente leitura</span></div>
<section class="metrics" aria-label="Totais Gerais do projeto"><article class="metric"><span class="metric-icon" aria-hidden="true">&#9638;</span><p>Specs no projeto</p><strong>${dashboard.specs.length}</strong><small>${dashboard.summary.totals.materializedSpecs} materializadas &middot; ${dashboard.summary.totals.plannedOnlySpecs} apenas no roadmap</small></article><article class="metric"><span class="metric-icon" aria-hidden="true">&#9655;</span><p>Em andamento</p><strong>${dashboard.summary.specsByStatus["em andamento"] || 0}</strong><small>Specs com trabalho em curso no roadmap</small></article><article class="metric"><span class="metric-icon positive" aria-hidden="true">&#10003;</span><p>Packages com Score 1</p><strong class="positive">${dashboard.specs.reduce((sum, spec) => sum + spec.packages.filter((pkg) => pkg.score === 1).length, 0)}<span style="font-size:15px;color:#9ba6b5;font-weight:400"> / ${dashboard.summary.totals.packages}</span></strong><small>Resultado informado nas evaluations</small></article><article class="metric"><span class="metric-icon attention" aria-hidden="true">!</span><p>Specs com alertas</p><strong class="attention">${dashboard.summary.integrity.warning + dashboard.summary.integrity.critical}</strong><small>${dashboard.summary.integrity.critical} critical &middot; ${dashboard.summary.integrity.warning} warning</small></article></section>
<section class="overview-grid" aria-label="Resumo global do projeto"><article class="panel"><div class="panel-header"><div><h2>Registro das etapas</h2><p>Conclusoes registradas por etapa &middot; quadro do package atual de cada spec</p></div><span class="section-tag">GLOBAL</span></div><div class="chart-content"><div class="chart-legend"><span><i class="bar-done"></i>Com conclusao</span><span><i class="bar-running"></i>Em andamento</span><span><i class="bar-failed"></i>Falha / divergencia</span><span><i class="bar-remaining"></i>Outros estados</span></div>${bars}<p class="chart-note">Declaracoes do progress e resultados de evaluations. Ausencia de registro nao comprova que a etapa nao ocorreu.</p></div></article><article class="panel"><div class="panel-header"><div><h2>Distribuicao das specs</h2><p>Status registrados no roadmap</p></div><span class="section-tag">GLOBAL</span></div><div class="allocation"><div class="donut" style="background:conic-gradient(${donut})" role="img" aria-label="Distribuicao por status; valores na lista ao lado"><div class="donut-center"><strong>${dashboard.specs.length}</strong><span>specs no projeto</span></div></div><ul class="allocation-list">${statusParts.map((part) => `<li><i style="background:${part.color}"></i><span>${statusLabels[part.status]}</span><strong>${part.count}<small>${dashboard.specs.length ? Math.round(part.count / dashboard.specs.length * 100) : 0}%</small></strong></li>`).join("")}</ul></div></article></section>
<section class="panel flow-section" id="pbq-flow"><header class="panel-header"><div><h2>O fluxo do PBQ</h2><p>Especificar &rarr; validar o contrato &rarr; implementar &rarr; testar &rarr; registrar o resultado</p></div><span class="section-tag">5 ETAPAS</span></header><div class="flow-selectors"><label class="filter-control"><span>Spec em acompanhamento</span><select id="flow-spec" ${dashboard.specs.length ? "" : "disabled"}>${dashboard.specs.map((spec, index) => `<option value="${index}" ${index === initialSpec ? "selected" : ""}>${escape(spec.name)} &middot; ${escape(spec.status)}</option>`).join("")}</select></label><label class="filter-control"><span>Package</span><select id="flow-package" ${dashboard.specs.length ? "" : "disabled"}><option value="0">Quadro da spec</option>${dashboard.specs[initialSpec]?.packages.map((pkg) => `<option value="${pkg.number}" ${pkg.number === initialPackage?.number ? "selected" : ""}>Package ${pkg.number}</option>`).join("") || ""}</select></label></div><div class="flow-main" id="flow-content" aria-live="polite">${dashboard.specs[initialSpec] ? renderFlow(dashboard.specs[initialSpec], initialPackage) : `<div class="empty">Nenhuma spec registrada. Adicione uma spec ao roadmap para acompanhar o fluxo.</div>`}</div><div class="flow-legend" aria-label="Legenda das etapas">${stageLegend}</div></section>
<section class="panel execution" id="gantt-execution"><header class="panel-header"><div><h2>Specs e packages</h2><p>Abra uma spec para acompanhar o fluxo ou expanda seus packages.</p></div><span class="section-tag">${dashboard.specs.length} SPECS</span></header><div class="dashboard-filters" aria-label="Filtros das specs"><label class="filter-control"><span>Buscar spec</span><input id="filter-spec-text" type="search" placeholder="Nome da spec..."></label><label class="filter-control"><span>Status</span><select id="filter-spec-status"><option value="">Todos os status</option>${Object.keys(statusColors).map((status) => `<option value="${escape(status)}">${escape(status)}</option>`).join("")}</select></label><label class="filter-control"><span>Integridade</span><select id="filter-spec-integrity"><option value="">Todas</option><option value="healthy">healthy</option><option value="warning">warning</option><option value="critical">critical</option></select></label><label class="filter-control"><span>Ordenar</span><select id="filter-spec-sort"><option value="updated-desc">Mais atual &rarr; mais antiga</option><option value="updated-asc">Mais antiga &rarr; mais atual</option><option value="name-asc">Nome A &rarr; Z</option><option value="name-desc">Nome Z &rarr; A</option></select></label></div><div class="table-scroll"><table class="spec-table" id="gantt-grid"><thead><tr><th scope="col">Spec</th><th scope="col">Integridade</th><th scope="col">Status</th><th scope="col">Packages</th><th scope="col">Evaluations</th><th scope="col">Etapas PBQ</th><th scope="col">Acompanhar</th></tr></thead><tbody id="spec-rows">${tableRows}</tbody></table></div><p class="empty" id="filter-empty" ${dashboard.specs.length ? "hidden" : ""}>Nenhuma spec encontrada para os filtros selecionados.</p><div class="table-footer"><span id="filter-count">${dashboard.specs.length} de ${dashboard.specs.length} specs</span><span>Indicadores do topo representam o projeto inteiro.</span></div></section>
<section class="panel" id="integrity-matrix"><header class="panel-header"><div><h2>Integridade do harness</h2><p>Alertas nos artefatos, contratos e sensores</p></div><span class="section-tag">${dashboard.summary.integrity.healthy} HEALTHY</span></header>${warningRows || `<p class="empty">Nenhum alerta de integridade neste snapshot.</p>`}</section><footer class="footer"><span>PBQ &middot; Plan &rarr; Build &rarr; QA &middot; Estado derivado dos artefatos do projeto.</span><span>Gerado localmente &middot; Sem LLM na geracao &middot; Funciona offline</span></footer></main>
${flowTemplates}<script id="pbq-dashboard-data" type="application/json">${escapeScriptJson(JSON.stringify(dashboard))}</script><script>
const initialDashboard=JSON.parse(document.getElementById('pbq-dashboard-data').textContent);
const specSelect=document.getElementById('flow-spec'),packageSelect=document.getElementById('flow-package'),flowContent=document.getElementById('flow-content');
function showFlow(){const template=document.getElementById('flow-'+specSelect.value+'-'+packageSelect.value);if(template)flowContent.replaceChildren(template.content.cloneNode(true));}
function selectFlow(index,packageNumber){const spec=initialDashboard.specs[index];if(!spec)return;specSelect.value=String(index);packageSelect.replaceChildren(new Option('Quadro da spec','0'));for(const pkg of spec.packages)packageSelect.add(new Option('Package '+pkg.number,String(pkg.number)));const current=Number(spec.progress.currentPackage)||Number(spec.currentPackage);packageSelect.value=String(packageNumber??(spec.packages.some(pkg=>pkg.number===current)?current:0));showFlow();}
specSelect.addEventListener('change',()=>selectFlow(Number(specSelect.value)));packageSelect.addEventListener('change',showFlow);
for(const button of document.querySelectorAll('[data-open-flow]'))button.addEventListener('click',()=>{selectFlow(Number(button.dataset.openFlow),button.dataset.openPackage?Number(button.dataset.openPackage):undefined);document.getElementById('pbq-flow').scrollIntoView({block:'start'});specSelect.focus({preventScroll:true});});
const textFilter=document.getElementById('filter-spec-text'),statusFilter=document.getElementById('filter-spec-status'),integrityFilter=document.getElementById('filter-spec-integrity'),sortFilter=document.getElementById('filter-spec-sort'),specRows=document.getElementById('spec-rows');
function applyDashboardFilters(){const text=textFilter.value.trim().toLowerCase(),status=statusFilter.value,integrity=integrityFilter.value;let visible=0;for(const row of specRows.querySelectorAll('.gantt-row')){const matches=(!text||row.dataset.specName.includes(text))&&(!status||row.dataset.specStatus===status)&&(!integrity||row.dataset.specIntegrity===integrity);row.hidden=!matches;if(row.nextElementSibling?.classList.contains('gantt-detail-row'))row.nextElementSibling.hidden=!matches;if(matches)visible++;}document.getElementById('filter-empty').hidden=visible>0;document.getElementById('filter-count').textContent=visible+' de '+initialDashboard.specs.length+' specs';}
function applyDashboardSort(){const mode=sortFilter.value;const blocks=Array.from(specRows.querySelectorAll('.gantt-row')).map(row=>({row,detail:row.nextElementSibling}));blocks.sort((a,b)=>{const x=a.row.dataset,y=b.row.dataset;if(mode==='name-asc')return x.specName.localeCompare(y.specName);if(mode==='name-desc')return y.specName.localeCompare(x.specName);const ascending=mode==='updated-asc';return (ascending?1:-1)*(x.specUpdatedAt.localeCompare(y.specUpdatedAt)||Number(x.specNumber)-Number(y.specNumber)||x.specName.localeCompare(y.specName));});for(const block of blocks){specRows.appendChild(block.row);specRows.appendChild(block.detail);}applyDashboardFilters();}
textFilter.addEventListener('input',applyDashboardFilters);statusFilter.addEventListener('change',applyDashboardFilters);integrityFilter.addEventListener('change',applyDashboardFilters);sortFilter.addEventListener('change',applyDashboardSort);applyDashboardSort();
if(location.protocol.startsWith('http'))setInterval(async()=>{try{const response=await fetch('./status.json',{cache:'no-store'});if(!response.ok)return;const next=await response.json();if(JSON.stringify({...next,generatedAt:null})!==JSON.stringify({...initialDashboard,generatedAt:null}))location.reload();}catch{}},2000);
</script></body></html>`;
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
  return value.replace(/</g, "\\u003c");
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
      text: "Nenhum E2E/integracao pesada foi detectado. Adicione um sensor com 'pbq sensor add --on close' quando houver um real."
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

async function generateFiles(project, agents) {
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
    [`${HARNESS_DIR}/harness/scripts/check-harness-structure.sh`, shCheckHarnessStructure()],
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
    ...(await adapterSkillEntries(agents))
  ]);
}

function withManifest(generated, agents = null) {
  const files = {};
  for (const [relativePath, content] of Object.entries(generated)) {
    if (relativePath === `${HARNESS_DIR}/manifest.json`) continue;
    files[relativePath] = {
      sha256: sha256(content)
    };
  }
  const manifest = {
    version: PBQ_TEMPLATE_VERSION,
    files
  };
  if (agents) manifest.agents = [...agents];
  return {
    ...generated,
    [`${HARNESS_DIR}/manifest.json`]: JSON.stringify(manifest, null, 2) + "\n"
  };
}

function sha256(content) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function localSkillPath(agent, skill) {
  return agent === "cursor" ? `.cursor/commands/${skill}.md`
    : `${agent === "claude" ? ".claude" : ".agents"}/skills/${skill}/SKILL.md`;
}

// Only the exact PBQ wrapper is a reference; ordinary skill instructions stay opaque.
function localSkillReference(skill, content) {
  const target = content.match(/Execute a skill `[^`]+` deste projeto conforme `([^`]+)`\./)?.[1];
  if (!target) return null;
  return [skillReferenceContent(skill, target, content), cursorCommandContent(skill, target)]
    .some((wrapper) => wrapper.trim() === content.trim()) ? target : null;
}

async function planLocalSkillUpdate(root, agents) {
  const definitions = new Map();
  const names = new Set();
  const order = [...agents, ...[...ALLOWED_AGENTS].filter((agent) => !agents.has(agent))];
  for (const agent of order) {
    const directory = agent === "cursor" ? ".cursor/commands"
      : `${agent === "claude" ? ".claude" : ".agents"}/skills`;
    const absolute = path.join(root, directory);
    if (!existsSync(absolute)) continue;
    if ((await lstat(absolute)).isSymbolicLink() || (await lstat(path.dirname(absolute))).isSymbolicLink()) {
      throw new Error(`Skills: link simbolico nao suportado: ${directory}`);
    }
    for (const entry of await readdir(absolute, { withFileTypes: true })) {
      const skill = agent === "cursor" ? entry.name.replace(/\.md$/, "") : entry.name;
      if (ADAPTER_SKILLS.includes(skill)) continue;
      if (agent === "cursor" ? !entry.isFile() || !entry.name.endsWith(".md") : !entry.isDirectory()) continue;
      const relative = localSkillPath(agent, skill);
      if (!existsSync(path.join(root, relative))) continue;
      if ((await lstat(path.join(root, relative))).isSymbolicLink()) throw new Error(`Skills: link simbolico: ${relative}`);
      definitions.set(relative, { agent, skill, relative, content: await readFile(path.join(root, relative), "utf8") });
      names.add(skill);
    }
  }
  const planned = {};
  const readResources = async (directory, prefix = "", cursorSkill = null) => {
    const files = {};
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const relative = prefix + entry.name;
      if (!prefix && cursorSkill && entry.name !== cursorSkill) continue;
      if (!prefix && entry.name === "SKILL.md") continue;
      if (entry.isSymbolicLink()) throw new Error(`Skills: recurso com link simbolico: ${path.join(directory, entry.name)}`);
      if (entry.isDirectory()) Object.assign(files, await readResources(path.join(directory, entry.name), relative + "/"));
      else if (entry.isFile()) files[relative] = await readFile(path.join(directory, entry.name));
    }
    return files;
  };
  for (const skill of [...names].sort()) {
    const candidates = order.map((agent) => definitions.get(localSkillPath(agent, skill))).filter(Boolean);
    // Skills belonging exclusively to unselected agents remain untouched.
    if (!candidates.some((entry) => agents.has(entry.agent))) continue;
    const resolve = (entry, seen = new Set()) => {
      if (seen.has(entry.relative)) throw new Error(`Skills: referencia circular: ${entry.relative}`);
      seen.add(entry.relative);
      const target = localSkillReference(skill, entry.content);
      if (!target) return entry;
      const next = definitions.get(target);
      if (!next || next.skill !== skill) throw new Error(`Skills: referencia quebrada: ${entry.relative} -> ${target}`);
      return resolve(next, seen);
    };
    // The first agent is authoritative. Secondary copies are replaced, not merged.
    // Resolve only the chosen base so stale secondary wrappers cannot block it.
    const source = resolve(candidates[0]);
    const primary = [...agents][0];
    const destination = localSkillPath(primary, skill);
    const resources = await readResources(path.dirname(path.join(root, source.relative)), "", source.agent === "cursor" ? skill : null);
    if (primary === "cursor" && Object.keys(resources).some((relative) => !relative.startsWith(`${skill}/`))) {
      throw new Error(`Skills: recursos Cursor devem estar sob ${skill}/ antes de trocar o principal: ${source.relative}`);
    }
    for (const agent of agents) {
      planned[localSkillPath(agent, skill)] = agent === primary ? source.content
        : agent === "cursor" ? cursorCommandContent(skill, destination)
          : skillReferenceContent(skill, destination, source.content);
    }
    for (const [relative, content] of Object.entries(resources)) {
      const target = path.posix.join(path.posix.dirname(destination), relative);
      if (Object.hasOwn(planned, target) && !Buffer.from(planned[target]).equals(content)) {
        throw new Error(`Skills: conflito de destino: ${target}`);
      }
      planned[target] = content;
    }
  }
  for (const relative of Object.keys(planned)) {
    let current = path.join(root, relative);
    while (current !== root) {
      if (existsSync(current) && (await lstat(current)).isSymbolicLink()) {
        throw new Error(`Skills: destino com link simbolico: ${relative}`);
      }
      current = path.dirname(current);
    }
  }
  return planned;
}

async function adapterSkillEntries(agents) {
  const entries = [];
  const primary = agents.values().next().value;
  const primaryPath = (skill) => primary === "claude"
    ? `.claude/skills/${skill}/SKILL.md`
    : primary === "codex" ? `.agents/skills/${skill}/SKILL.md` : `.cursor/commands/${skill}.md`;
  for (const skill of ADAPTER_SKILLS) {
    const content = await loadTemplate(`adapters/skills/${skill}/SKILL.md`);
    if (agents.has("claude")) {
      entries.push([`.claude/skills/${skill}/SKILL.md`, primary === "claude"
        ? content : skillReferenceContent(skill, primaryPath(skill), content)]);
    }
    if (agents.has("codex")) {
      entries.push([`.agents/skills/${skill}/SKILL.md`, primary === "codex"
        ? content : skillReferenceContent(skill, primaryPath(skill), content)]);
    }
    if (agents.has("cursor")) {
      entries.push([`.cursor/commands/${skill}.md`, primary === "cursor"
        ? content : cursorCommandContent(skill, primaryPath(skill))]);
    }
  }
  return entries;
}

function skillReferenceContent(skill, target, content) {
  const frontmatter = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/)?.[0] ?? "";
  return `${frontmatter}\n# ${skill}\n\nExecute a skill \`${skill}\` deste projeto conforme \`${target}\`.\n`;
}

function cursorCommandContent(skill, target) {
  return `# /${skill}\n\nExecute a skill \`${skill}\` deste projeto conforme \`${target}\`.\n`;
}

function adapterSkillPaths() {
  return ADAPTER_SKILLS.flatMap((skill) => [
    `.claude/skills/${skill}/SKILL.md`,
    `.agents/skills/${skill}/SKILL.md`,
    `.cursor/commands/${skill}.md`
  ]);
}

function buildSensors(commands) {
  const sensors = [];
  for (const tier of ["fast", "medium", "slow"]) {
    for (const item of commands[tier]) {
      const sensor = {
        name: sensorName(item.command),
        on: legacyTierToOn(tier),
        // runnerBucket (nao "tier"): usado por 'pbq package close --tiers' para selecionar
        // qual subconjunto de sensores detectados roda por padrao. Nao e mais usado para
        // gerar runners run-fast/medium/slow (removidos).
        runnerBucket: tier,
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
  printConstitutionTable(events, options, "init");
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
- \`${HARNESS_DIR}/sensors.json\` e o registry de sensores globais reutilizaveis.

## Escopo local/global

- Sensor global: fica em \`${HARNESS_DIR}/sensors.json\`, pode ser reutilizado por qualquer contrato e deve ser adicionado com \`pbq sensor add --scope global\` ou edicao equivalente.
- Sensor local: vive no \`contracts/package-N.md\` e na \`evaluations/package-N.md\` do package, com \`Scope: local\` ou \`Scope: package\`, comando preenchido e motivo objetivo.
- Sensor local obrigatorio tambem passa pelo gate: ele deve aparecer na evaluation e precisa ter status \`passou\` para \`Score: 1\`.
- Promocao local -> global e decisao explicita. Nao promova checks historicos, temporarios ou especificos de um package para o registry global sem novo motivo reutilizavel.

## Modelo de Gatilho-por-Evento (campo \`on\`)

Cada sensor declara **quando** deve rodar via o campo \`on\`:

- **\`edit\`** — hook PostToolUse (early-warning, advisory)
- **\`commit\`** — hook pre-commit (early-warning, advisory por default)
- **\`close\`** — gate de aceite \`pbq package close\` (bloqueante)
- **\`manual\`** — so sob invocacao explicita

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
- Mudanca media: crie uma spec em \`${HARNESS_DIR}/specs/spec-YYMMDD-hex-nome/\` e um contrato em \`contracts/package-N.md\`.
- Specs legadas \`spec-NNN-nome\` continuam compativeis; \`pbq update\` migra specs materializadas usando a data de criacao de \`spec.md\`.
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

## Progresso

Cada spec deve manter \`progress.md\` com estado atual, decisoes, sensores executados, falhas anteriores e contexto para retomada.

O roadmap em \`${HARNESS_DIR}/roadmap.md\` e o indice consolidado das specs:

- Ao criar uma spec, registre status \`em andamento\`.
- Ao concluir uma spec, registre status \`concluido\`, data e evidencia.
- Nao marque \`concluido\` se houver package obrigatorio sem evaluation Score 1, salvo excecao documentada.

## Nova Spec

1. Copie \`${HARNESS_DIR}/harness/templates/spec.md\` para \`${HARNESS_DIR}/specs/spec-YYMMDD-hex-nome/spec.md\`.
2. Copie \`${HARNESS_DIR}/harness/templates/progress.md\` para \`${HARNESS_DIR}/specs/spec-YYMMDD-hex-nome/progress.md\`.
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

function escapePowerShellString(value) {
  return value.replace(/`/g, "``").replace(/"/g, '`"');
}

function escapeShellString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/`/g, "\\`");
}

// Keep import.meta.url referenced so npm pack keeps this file as an executable entry point.
fileURLToPath(import.meta.url);
