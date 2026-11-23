import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function frontmatter(path: string): Record<string, string> {
  const raw = readFileSync(path, "utf8");
  const match = /^---\n([\s\S]*?)\n---/.exec(raw);
  expect(match, `frontmatter block in ${path}`).toBeTruthy();
  const out: Record<string, string> = {};
  for (const line of match![1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return out;
}

describe("artifact-forger agent definition", () => {
  const agent = resolve(ROOT, "agents/artifact-forger.md");
  const fm = frontmatter(agent);
  const body = readFileSync(agent, "utf8");

  it("is named artifact-forger with a description", () => {
    expect(fm.name).toBe("artifact-forger");
    expect(fm.description?.length ?? 0).toBeGreaterThan(20);
  });

  it("allowlists only real built-in tools (glob is extension-provided and breaks foreground children)", () => {
    const tools = (fm.tools ?? "").split(",").map((t) => t.trim());
    for (const tool of ["read", "grep", "write", "edit", "bash"]) expect(tools).toContain(tool);
    expect(tools).not.toContain("glob");
  });

  it("references the installed canonical template path, not the legacy one", () => {
    expect(body).toContain("~/.pi/agent/artifact-forger/_template.html");
    expect(body).not.toContain("artifact-forge/_template.html");
  });

  it("protects project design contracts and defaults to dusk/light", () => {
    expect(body).toContain("NEVER overwrite");
    expect(body).toContain("Default palette `dusk`");
  });
});

describe("package surface", () => {
  it("ships the artifact-forger skill with frontmatter", () => {
    const fm = frontmatter(resolve(ROOT, "skills/artifact-forger/SKILL.md"));
    expect(fm.name).toBe("artifact-forger");
    expect(fm.description).toBeTruthy();
  });

  it("declares pi skills and the installer script", () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
    expect(pkg.pi.skills).toEqual(["skills/*"]);
    expect(pkg.scripts["install:agent"]).toBe("node scripts/install-agent.mjs");
  });
});
