import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const template = readFileSync(resolve(ROOT, "resources/artifact-forger/_template.html"), "utf8");

describe("canonical template design contract", () => {
  it("keeps the design system markers", () => {
    for (const marker of ["THEMES", "DEFAULT_PALETTE = 'dusk'", "applyTheme", "renderAllMermaid", "updateChartsTheme", "diagram-stage"]) {
      expect(template).toContain(marker);
    }
  });

  it("pins CDN builds and never floats @latest", () => {
    for (const pin of ["mermaid@11.4.1", "chart.js@4.4.7", "lucide@0.460.0"]) {
      expect(template).toContain(pin);
    }
    expect(template).not.toMatch(/@latest/);
  });

  it("supports the diagram look knob (classic|neo|handDrawn compatible)", () => {
    // theme 'base' + themeVariables is the palette-agnostic path the rules rely on
    expect(template).toContain("theme: 'base'");
    expect(template).toContain("themeVariables");
  });

  it("is a complete html document", () => {
    expect(template.trimStart().startsWith("<!DOCTYPE html>")).toBe(true);
    expect(template.trimEnd().endsWith("</html>")).toBe(true);
  });
});
