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

describe("genre routing contract", () => {
  const agentBody = readFileSync(resolve(ROOT, "agents/artifact-forger.md"), "utf8");
  const skill = resolve(ROOT, "skills/artifact-forger/SKILL.md");
  const skillBody = readFileSync(skill, "utf8");

  it("routes all genres with override-wins, tie-break, and ambiguity rules", () => {
    for (const marker of ["dashboard", "report", "tech-spec", "product-spec", "manual"]) {
      expect(agentBody).toContain(marker);
    }
    expect(agentBody.toLowerCase()).toContain("override");
    expect(agentBody).toContain("outranks data presence");
    expect(agentBody).toContain("prose spine with any data");
  });

  it("defines the stale-template fallback without editing protected templates", () => {
    expect(agentBody).toContain("contract:artifact-forger v2");
    expect(agentBody).toContain("inline-append");
    expect(agentBody).toContain("NEVER overwrite");
  });

  it("keeps figure numbering static and checklists persistence-free", () => {
    expect(agentBody).toContain("static numbering");
    expect(agentBody).toContain("no persistence");
  });

  it("routes decision/roadmap with precedence and shared-region keep-list", () => {
    expect(agentBody).toContain("decision");
    expect(agentBody).toContain("roadmap");
    expect(agentBody).toContain("as the deliverable");
    expect(agentBody).toContain("rollout *section*");
    expect(agentBody.toLowerCase()).toContain("release notes");
    expect(agentBody).toContain("migration guide");
    expect(agentBody).toContain("entire shared script block");
    expect(agentBody).toContain("one `<del>`/`<ins>` element per changed line");
    expect(agentBody).toContain("data-filterable");
    expect(agentBody).toContain("Ctrl+K");
  });

  it("skill mirrors the batch-1 additions compactly", () => {
    expect(skillBody).toContain("decision");
    expect(skillBody).toContain("roadmap");
    expect(skillBody).toContain("release notes");
    expect(skillBody).toContain("Ctrl+K");
  });

  it("skill mirrors genres compactly and defers to the agent file", () => {
    for (const marker of ["dashboard", "tech-spec", "product-spec", "manual"]) {
      expect(skillBody).toContain(marker);
    }
    expect(skillBody).toContain("source of truth");
    expect(skillBody).toContain("contract:artifact-forger v2");
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
