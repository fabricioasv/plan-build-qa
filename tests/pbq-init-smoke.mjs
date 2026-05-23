import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
  await writeFile(path.join(root, "AGENTS.md"), "# Agent rules\n\nPreserve me.\n");

  const cli = path.resolve("bin", "pbq.mjs");
  const result = spawnSync(process.execPath, [cli, "init", root], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);

  const required = [
    ".constitution/architecture.md",
    ".constitution/testing.md",
    ".constitution/operations.md",
    ".constitution/repository-rules.md",
    ".harness/README.md",
    ".harness/scripts/check-harness-structure.ps1",
    ".harness/scripts/run-fast.ps1",
    ".harness/scripts/run-medium.ps1",
    ".harness/scripts/run-slow.ps1",
    ".harness/scripts/run-fast.sh",
    ".harness/templates/spec.md",
    ".harness/templates/contract.md",
    ".harness/templates/progress.md",
    ".harness/templates/evaluation.md",
    ".harness/prompts/implement-package.md",
    ".harness/prompts/validate-contract.md",
    ".harness/prompts/run-evaluation.md",
    ".specs/README.md"
  ];

  for (const file of required) {
    assert.ok(existsSync(path.join(root, file)), `missing ${file}`);
  }

  const agents = await readFile(path.join(root, "AGENTS.md"), "utf8");
  assert.match(agents, /Preserve me/);
  assert.match(agents, /Harness Engineering/);

  const claude = await readFile(path.join(root, "CLAUDE.md"), "utf8");
  assert.match(claude, /Harness Engineering/);

  const fast = await readFile(path.join(root, ".harness/scripts/run-fast.ps1"), "utf8");
  assert.match(fast, /npm run lint/);

  const fastResult =
    process.platform === "win32"
      ? spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(root, ".harness/scripts/run-fast.ps1")], {
          encoding: "utf8"
        })
      : spawnSync("sh", [path.join(root, ".harness/scripts/run-fast.sh")], {
          encoding: "utf8"
        });
  assert.equal(fastResult.status, 0, fastResult.stderr || fastResult.stdout);

  const second = spawnSync(process.execPath, [cli, "init", root], {
    encoding: "utf8"
  });
  assert.equal(second.status, 0, second.stderr || second.stdout);
  assert.match(second.stdout, /Skipped existing/);
} finally {
  await rm(root, { recursive: true, force: true });
}
