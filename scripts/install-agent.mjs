#!/usr/bin/env node
// Installs the artifact-forger agent and canonical template into the user's
// Pi agent directory (~/.pi/agent). Idempotent; safe to re-run after editing
// the package sources.
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const agentDir = join(homedir(), ".pi", "agent");

const targets = [
  {
    src: join(pkgRoot, "agents", "artifact-forger.md"),
    dest: join(agentDir, "agents", "artifact-forger.md"),
    label: "agent definition",
  },
  {
    src: join(pkgRoot, "resources", "artifact-forger", "_template.html"),
    dest: join(agentDir, "artifact-forger", "_template.html"),
    label: "canonical template",
  },
];

// Legacy names from the pre-package setup (pi-elephant-goldfish, 2026-11-20).
const legacy = [
  join(agentDir, "agents", "artifact-forge.md"),
  join(agentDir, "artifact-forge"),
];

for (const { src, dest, label } of targets) {
  if (!existsSync(src)) {
    console.error(`missing package ${label}: ${src}`);
    process.exitCode = 1;
    continue;
  }
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  console.log(`installed ${label} -> ${dest}`);
}

for (const path of legacy) {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
    console.log(`removed legacy ${path}`);
  }
}

// Sanity: installed agent must reference the new canonical path.
const installed = readFileSync(targets[0].dest, "utf8");
if (installed.includes("artifact-forge/_template.html")) {
  console.error("installed agent still references the legacy template path");
  process.exitCode = 1;
}
