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

describe("document kit contract", () => {
  const kitStart = template.indexOf("<!-- GENRE:DOCUMENT KIT -->");
  const kitEnd = template.indexOf("<!-- /GENRE:DOCUMENT KIT -->");
  const kit = kitStart >= 0 && kitEnd > kitStart ? template.slice(kitStart, kitEnd) : "";
  const count = (haystack: string, needle: string) => haystack.split(needle).length - 1;

  it("marks the contract version and delimits both layout blocks exactly once", () => {
    expect(count(template, "contract:artifact-forger v3")).toBe(1);
    expect(count(template, "<!-- GENRE:DASHBOARD STARTER -->")).toBe(1);
    expect(count(template, "<!-- /GENRE:DASHBOARD STARTER -->")).toBe(1);
    expect(count(template, "<!-- GENRE:DOCUMENT KIT -->")).toBe(1);
    expect(count(template, "<!-- /GENRE:DOCUMENT KIT -->")).toBe(1);
  });

  it("keeps the kit self-inert: .doc-scoped CSS and DOM-guarded JS", () => {
    const css = kit
      .slice(kit.indexOf("<style>"), kit.indexOf("</style>"))
      .replace(/\/\*[\s\S]*?\*\//g, "");
    const selectors = [...css.matchAll(/([^{}]+)\{/g)].map((m) => m[1].trim());
    expect(selectors.length).toBeGreaterThan(20);
    for (const sel of selectors) {
      expect(sel.startsWith("@") || sel.includes(".doc")).toBe(true);
    }
    const js = kit.slice(kit.indexOf("<script>"), kit.lastIndexOf("</script>"));
    expect(js).toContain("querySelector('.doc')");
    expect(js).toContain("if (!doc) return");
    // F3: checklist persistence is deliberately absent in v1
    expect(js).not.toContain("localStorage");
  });

  it("validates static figure numbering authored by the agent", () => {
    expect(kit).toContain("Fig\\.");
    expect(kit).toContain("expected Fig.");
  });

  it("defers shared boot until the document is parsed (fit-before-kit race)", () => {
    // boot must not run while the kit <style> is still unparsed, or diagram
    // fitting measures an unstyled layout and the svg overflows the stage
    expect(template).toContain("document.readyState === 'loading'");
    expect(template).toContain("addEventListener('DOMContentLoaded', bootShared)");
    // fit system re-applies on load as belt-and-suspenders (shared region)
    expect(template).toContain("addEventListener('load', reapplyAll)");
    // shared render must tolerate a stripped kit (dashboard artifacts)
    expect(template).toContain("typeof measureDiagram === 'function'");
  });

  it("keeps kit CSS token-pure (no hex literals — token purity enforced)", () => {
    const css = kit
      .slice(kit.indexOf("<style>"), kit.indexOf("</style>"))
      .replace(/\/\*[\s\S]*?\*\//g, "");
    expect(css).not.toMatch(/#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b/);
  });

  it("ships batch-3 interactive vocabulary with library guards", () => {
    for (const marker of [
      ".webgl-stage",
      ".param-panel",
      ".sm-sim",
      ".graph-stage",
      ".ba-slider",
      ".col-menu",
      ".playground-output",
      "--syntax-1",
      "theme:change",
      "typeof THREE === 'undefined'",
      "typeof hljs !== 'undefined'",
      "typeof cytoscape === 'undefined'",
      "webglcontextlost",
      "worker.terminate()",
    ]) {
      expect(kit).toContain(marker);
    }
    // M1: no parallel syntax color pipeline — highlighting reads token vars
    expect(kit).toContain("pre.doc-code[data-lang] .hljs-keyword");
  });

  it("ships print mode in the shared region with a persistence bypass", () => {
    const dashEnd = template.indexOf("<!-- /GENRE:DASHBOARD STARTER -->");
    const printJs = template.indexOf("/* PRINT-MODE:BEGIN");
    expect(printJs).toBeGreaterThan(dashEnd);
    expect(printJs).toBeLessThan(kitStart);
    for (const marker of [
      "--print-bg",
      "beforeprint",
      "afterprint",
      "-webkit-print-color-adjust",
      "print-color-adjust",
      "PRINT-MODE:END",
    ]) {
      expect(template).toContain(marker);
    }
    // forced-light persistence bypass: dark preference survives the print job
    expect(template).toMatch(/applyTheme\(\);[\s\S]{0,160}localStorage\.setItem\('artifact-mode', 'dark'\)/);
  });

  it("ships the batch-1 kit vocabulary with named guards", () => {
    for (const marker of [
      "aria-sort",
      "data-filterable",
      "table-filter",
      ".pros-cons",
      ".milestone",
      ".diff-pair",
      ".changelog-list",
      "pre.doc-code del",
      ".doc-search",
      "ctrlKey || e.metaKey",
    ]) {
      expect(kit).toContain(marker);
    }
    // keyboard activation for sort + search focus management
    expect(kit).toContain("e.key === 'Enter' || e.key === ' '");
    expect(kit).toContain("lastFocus.focus()");
    // bespoke overlay by design — native <dialog> deliberately not used
    expect(kit).not.toContain("showModal");
  });
});
