#!/usr/bin/env node
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MARKER_START = "<!-- PBQ-HARNESS-START -->";
const MARKER_END = "<!-- PBQ-HARNESS-END -->";
const HARNESS_DIR = ".plan-build-qa";
const ADAPTER_SKILLS = ["spec", "sensor", "roadmap", "constitution", "implement", "test", "analyze"];
const PBQ_TEMPLATE_VERSION = 2;
const ALLOWED_SPEC_STATUS = new Set(["planejado", "em andamento", "bloqueado", "concluido", "cancelado"]);

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
  `${HARNESS_DIR}/roadmap.md`,
  `${HARNESS_DIR}/specs/README.md`,
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

  if (command === "run" || command === "status") {
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
    await writeManagedFile(targetRoot, relativePath, content, options, events);
  }

  if (options.integrateAgents) {
    await integrateAgentInstructions(targetRoot, project.agentInstructionFiles, options, events);
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
      tier: options.tier,
      command: options.command,
      reason: options.reason || "Sensor adicionado manualmente",
      source: "manual",
      enabled: true
    };
    if (options.phase) {
      nextSensor.phase = parsePhaseOption(options.phase);
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
      console.log(`${sensor.enabled === false ? "disabled" : "enabled"}\t${sensor.tier}\t${sensor.name}\t${sensor.command}`);
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
      console.log(
        `pbq sensor add ${targetArg} --name ${name} --tier ${candidate.tier} --command ${shellQuote(candidate.command)} --reason ${shellQuote(reason)}`
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
    tier: entry.tier,
    command: entry.command,
    reason: entry.reason,
    source: "catalog",
    enabled: entry.enabled !== undefined ? entry.enabled : true
  };
  if (entry.requiresEnv && entry.requiresEnv.length > 0) {
    nextSensor.requiresEnv = entry.requiresEnv;
  }
  if (entry.phase && entry.phase.length > 0) {
    nextSensor.phase = entry.phase;
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

function parseSensorAddArgs(args) {
  const options = {
    targetPath: ".",
    name: "",
    tier: "",
    command: "",
    reason: "",
    phase: ""
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--name") options.name = readOptionValue(args, ++index, "--name");
    else if (arg === "--tier") options.tier = readOptionValue(args, ++index, "--tier");
    else if (arg === "--command") options.command = readOptionValue(args, ++index, "--command");
    else if (arg === "--reason") options.reason = readOptionValue(args, ++index, "--reason");
    else if (arg === "--phase") options.phase = readOptionValue(args, ++index, "--phase");
    else if (arg.startsWith("--")) throw new Error(`Opcao desconhecida: ${arg}`);
    else options.targetPath = arg;
  }

  if (!options.name) throw new Error("Informe --name.");
  if (!["fast", "medium", "slow"].includes(options.tier)) throw new Error("Informe --tier fast, medium ou slow.");
  if (!options.command) throw new Error("Informe --command.");
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(options.name)) {
    throw new Error("--name deve conter apenas letras, numeros, ponto, underscore ou hifen.");
  }

  return options;
}

function parsePhaseOption(value) {
  const parts = value.split(",").map((p) => p.trim()).filter((p) => ["before", "after"].includes(p));
  if (parts.length === 0) throw new Error("--phase deve ser before, after ou before,after.");
  return parts;
}

function isSensorEligibleForPhase(sensor, phase) {
  if (!sensor.phase) return phase === "after";
  return sensor.phase.includes(phase);
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

async function writeSensors(root, sensors) {
  const sensorsPath = path.join(root, HARNESS_DIR, "sensors.json");
  await writeFile(sensorsPath, JSON.stringify({ version: 1, sensors }, null, 2) + "\n", "utf8");
}

async function regenerateSensorScripts(root, sensors) {
  const placeholders = sensorPlaceholders(sensors);
  const files = {
    [`${HARNESS_DIR}/harness/scripts/run-fast.ps1`]: psRunScript("fast", sensors, placeholders),
    [`${HARNESS_DIR}/harness/scripts/run-medium.ps1`]: psRunScript("medium", sensors, placeholders),
    [`${HARNESS_DIR}/harness/scripts/run-slow.ps1`]: psRunScript("slow", sensors, placeholders),
    [`${HARNESS_DIR}/harness/scripts/run-fast.sh`]: shRunScript("fast", sensors, placeholders),
    [`${HARNESS_DIR}/harness/scripts/run-medium.sh`]: shRunScript("medium", sensors, placeholders),
    [`${HARNESS_DIR}/harness/scripts/run-slow.sh`]: shRunScript("slow", sensors, placeholders)
  };

  for (const [relativePath, content] of Object.entries(files)) {
    await writeFile(path.join(root, relativePath), content, "utf8");
  }
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

    sensor: `pbq sensor add [path] --name <name> --tier <fast|medium|slow> --command <command> [--reason <text>]
pbq sensor add --from-catalog <id> [path]
pbq sensor list [path]
pbq sensor suggest [path]
pbq sensor catalog [path]

Gerencia sensores computacionais em .plan-build-qa/sensors.json e regenera runners.

  suggest  escaneia o alvo e imprime comandos 'pbq sensor add' prontos para candidatos detectados
           (scripts soltos, Makefile, sonar*) e ainda nao cadastrados em sensors.json. So imprime;
           nao altera arquivos.
  catalog  lista entradas do catalogo curado de sensores prontos, marcando as ja cadastradas.

Exemplos:
  pbq sensor list .
  pbq sensor suggest .
  pbq sensor catalog .
  pbq sensor add . --name e2e --tier slow --command "npm run test:e2e" --reason "Valida fluxo principal"
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

    run: `pbq run [path] [--resume]
pbq status [path]

Mostra painel textual com specs, contrato, build, QA e score.

Exemplos:
  pbq status .
  pbq run C:\\repo\\app --resume`,

    status: `pbq status [path]

Alias de painel para inspecionar estado atual do harness.

Exemplo:
  pbq status .`
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
  run        mostra painel de execucao
  status     mostra painel de status
  help       mostra ajuda geral ou de um comando

Ajuda por comando:
  pbq help init
  pbq help update
  pbq help sensor
  pbq help analyze
  pbq help package
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
      violations.push(`${spec.name}: pasta da spec ausente em ${path.join(HARNESS_DIR, "specs", spec.name)}`);
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

function parseContractRequiredSensors(contract) {
  const sectionMatch = contract.match(/## Sensores Obrigatorios([\s\S]*?)(?:\n## |\s*$)/);
  if (!sectionMatch) return [];
  const entries = [];
  for (const rawLine of sectionMatch[1].split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed.startsWith("- ")) continue;
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
  }
  return entries;
}

function parseRoadmapSpecRows(roadmap) {
  return roadmap
    .split(/\r?\n/)
    .filter((line) => line.trimStart().startsWith("|"))
    .map((line) => line.split("|").map((cell) => cell.trim()))
    .map((cells) => ({
      name: stripCellDecoration(cells[1] || ""),
      status: normalizeRoadmapStatus(cells[2] || ""),
      currentPackage: parsePackageNumber(cells[3] || "")
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
    await updateManagedFile(targetRoot, relativePath, latest, previousManifest, options, events);
  }

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
  const sensors = (await readSensors(targetRoot)).filter(
    (sensor) => sensor.enabled !== false && options.tiers.includes(sensor.tier) && isSensorEligibleForPhase(sensor, options.phase)
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

  const rows = sensors.map((sensor) => {
    const startedAt = new Date().toISOString();
    const result = spawnSync(sensor.command, {
      cwd: root,
      encoding: "utf8",
      shell: true,
      stdio: ["ignore", "pipe", "pipe"]
    });
    const exitCode = typeof result.status === "number" ? result.status : 1;
    return {
      sensor: sensor.name,
      tier: sensor.tier,
      required: "sim",
      status: exitCode === 0 ? "passou" : "falhou",
      command: sensor.command,
      exitCode,
      evidence: `Executado em ${startedAt}`
    };
  });

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
  renderDashboard(dashboard, options);
}

function parseDashboardArgs(args) {
  const options = {
    targetPath: ".",
    resume: false
  };

  for (const arg of args) {
    if (arg === "--resume") {
      options.resume = true;
    } else if (arg.startsWith("--")) {
      throw new Error(`Opcao desconhecida: ${arg}`);
    } else {
      options.targetPath = arg;
    }
  }

  return options;
}

async function collectDashboardState(root) {
  const harnessRoot = path.join(root, HARNESS_DIR);
  if (!existsSync(harnessRoot)) {
    throw new Error(`Harness nao encontrado em ${HARNESS_DIR}. Rode pbq init primeiro.`);
  }

  const sensors = await readSensors(root).catch(() => []);
  const specsRoot = path.join(harnessRoot, "specs");
  const specs = await listSpecDirectories(specsRoot);
  const rows = [];

  for (const spec of specs) {
    rows.push(await buildSpecDashboardRow(spec, sensors));
  }

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
    root,
    sensors,
    rows,
    activity: dashboardActivity(rows, sensors)
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

async function buildSpecDashboardRow(spec, sensors) {
  const contracts = await listMarkdownFiles(path.join(spec.path, "contracts"));
  const evaluations = await listMarkdownFiles(path.join(spec.path, "evaluations"));
  const latestEvaluation = evaluations.at(-1);
  const evaluation = latestEvaluation ? parseEvaluation(await readFile(latestEvaluation, "utf8")) : null;

  return {
    number: Number((spec.name.match(/^spec-(\d+)/i) || [])[1]) || 1,
    goal: spec.name,
    contract: contracts.length > 0 ? "AGREED" : "PENDING",
    build: sensorBucketStatus(sensors, ["fast", "medium"], evaluation),
    qa: sensorBucketStatus(sensors, ["slow"], evaluation),
    score: evaluation?.score ?? "--"
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

function dashboardActivity(rows, sensors) {
  if (rows.some((row) => row.contract === "PENDING")) return "Waiting for contract agreement...";
  if (rows.some((row) => row.build === "PENDING")) return "Waiting for build sensors...";
  if (rows.some((row) => row.qa === "PENDING")) return "Waiting for QA sensors...";
  if (rows.some((row) => row.score === "0" || row.score === "--")) return "Waiting for package evaluation...";
  if (sensors.length === 0) return "No sensors registered yet.";
  return "All visible stages are complete.";
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
    [`${HARNESS_DIR}/harness/templates/spec.md`, await loadTemplate("harness/templates/spec.md")],
    [`${HARNESS_DIR}/harness/templates/contract.md`, await loadTemplate("harness/templates/contract.md")],
    [`${HARNESS_DIR}/harness/templates/progress.md`, await loadTemplate("harness/templates/progress.md")],
    [`${HARNESS_DIR}/harness/templates/evaluation.md`, await loadTemplate("harness/templates/evaluation.md")],
    [`${HARNESS_DIR}/roadmap.md`, await loadTemplate("roadmap.md")],
    [`${HARNESS_DIR}/specs/README.md`, await loadTemplate("specs/README.md")],
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

## Sensores Detectados

Fast:

${commandMd(project.commands.fast, "- Placeholder: nenhum comando rapido detectado.")}

Medium:

${commandMd(project.commands.medium, "- Placeholder: nenhum comando medio detectado.")}

Slow:

${commandMd(project.commands.slow, "- Placeholder: nenhum comando lento detectado.")}

## Quando Rodar

- Mudanca pequena: \`${HARNESS_DIR}/harness/scripts/run-fast.ps1\` ou \`${HARNESS_DIR}/harness/scripts/run-fast.sh\`.
- Mudanca media: fast + \`${HARNESS_DIR}/harness/scripts/run-medium.ps1\` ou \`${HARNESS_DIR}/harness/scripts/run-medium.sh\`.
- Mudanca grande: fast + medium + slow quando houver sensor real aplicavel.

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

Comandos:

\`\`\`powershell
.\\${HARNESS_DIR}\\harness\\scripts\\run-fast.ps1
.\\${HARNESS_DIR}\\harness\\scripts\\run-medium.ps1
.\\${HARNESS_DIR}\\harness\\scripts\\run-slow.ps1
\`\`\`

Em Unix:

\`\`\`sh
sh ./${HARNESS_DIR}/harness/scripts/run-fast.sh
sh ./${HARNESS_DIR}/harness/scripts/run-medium.sh
sh ./${HARNESS_DIR}/harness/scripts/run-slow.sh
\`\`\`

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
