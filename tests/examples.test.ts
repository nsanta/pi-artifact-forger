import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const EXAMPLES = resolve(ROOT, "examples");
const files = readdirSync(EXAMPLES).filter((f) => f.endsWith(".html") && f !== "index.html").sort();

const EXPECTED = [
  "dashboard-quarterly-spend.html",
  "decision-queue-vendor.html",
  "manual-importer-runbook.html",
  "product-spec-onboarding.html",
  "release-notes-importer-0.3.0.html",
  "report-sprint-42.html",
  "roadmap-platform-2027h1.html",
  "tech-spec-importer-service.html",
];

describe("examples", () => {
  it("ships one example per use case", () => {
    expect(files).toEqual(EXPECTED);
  });

  it("each example is a self-contained, honest html document", () => {
    for (const f of files) {
      const html = readFileSync(resolve(EXAMPLES, f), "utf8");
      expect(html.trimStart().startsWith("<!DOCTYPE html>"), f).toBe(true);
      expect(html.trimEnd().endsWith("</html>"), f).toBe(true);
      // honesty: invented content is badged
      expect(html.includes("Sample Data") || html.includes("sample"), f).toBe(true);
      // pinned CDNs only, never @latest
      expect(html).not.toMatch(/@latest/);
      // dashboard keeps the starter; doc genres replace it with the kit layout
      if (f === "dashboard-quarterly-spend.html") {
        expect(html).toContain("GENRE:DASHBOARD STARTER");
      } else {
        expect(html).not.toContain("GENRE:DASHBOARD STARTER");
        expect(html).toContain('class="doc"');
        expect(html).toContain("doc-toc");
        expect(html).toContain("Markdown remains the source of truth");
      }
    }
  });

  it("strips unused CDNs per use case", () => {
    const needs = {
      "dashboard-quarterly-spend.html": ["chart.js@4.4.7", "mermaid@11.4.1"],
      "product-spec-onboarding.html": ["chart.js@4.4.7", "mermaid@11.4.1"],
      "roadmap-platform-2027h1.html": ["mermaid@11.4.1"],
      "manual-importer-runbook.html": [],
      "decision-queue-vendor.html": [],
      "release-notes-importer-0.3.0.html": [],
    };
    for (const [f, libs] of Object.entries(needs)) {
      const html = readFileSync(resolve(EXAMPLES, f), "utf8");
      for (const lib of ["chart.js@4.4.7", "mermaid@11.4.1"]) {
        if (libs.includes(lib)) expect(html).toContain(lib);
        else expect(html, f + " should not load " + lib).not.toContain(lib);
      }
    }
  });

  it("matches the canonical template version marker", () => {
    const template = readFileSync(resolve(ROOT, "resources/artifact-forger/_template.html"), "utf8");
    const version = /contract:artifact-forger v\d+/.exec(template)?.[0];
    expect(version).toBeTruthy();
    for (const f of files) {
      expect(readFileSync(resolve(EXAMPLES, f), "utf8")).toContain(version);
    }
  });

  it("ships a navigable index linking every example", () => {
    const index = readFileSync(resolve(EXAMPLES, "index.html"), "utf8");
    expect(index.trimStart().startsWith("<!DOCTYPE html>")).toBe(true);
    for (const f of EXPECTED) {
      expect(index, "index must link " + f).toContain('href="' + f + '"');
    }
    expect(index).toContain("npm run make-examples");
    // the index is navigation, not a plan: no source-of-truth footer required,
    // but it must not carry the dashboard starter either
    expect(index).not.toContain("GENRE:DASHBOARD STARTER");
  });
});
