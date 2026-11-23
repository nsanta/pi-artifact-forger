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

  it("sizes diagrams from a fit-to-container baseline, not natural scale", () => {
    // 100% must adapt to diagram size: fit computed from viewBox vs stage box,
    // applied as explicit pixel width (mermaid's width:100%/max-width collapses
    // to the browser's 300x150 default inside a flex wrapper)
    for (const marker of ["measureDiagram", "computeFit", "applyDiagramSize", "state.natural[id]", "viewBox"]) {
      expect(template).toContain(marker);
    }
    expect(template).toContain("Math.min(availW / nat.w, availH / nat.h)");
    // the old transform-scale approach must not come back
    expect(template).not.toContain("style.transform = `scale(");
    // flex centering must stay overflow-safe (scrollable when zoomed in)
    expect(template).toContain('class="m-auto"');
    expect(template).not.toContain("items-center justify-center\">\n          <div id=");
  });

  it("is a complete html document", () => {
    expect(template.trimStart().startsWith("<!DOCTYPE html>")).toBe(true);
    expect(template.trimEnd().endsWith("</html>")).toBe(true);
  });
});
