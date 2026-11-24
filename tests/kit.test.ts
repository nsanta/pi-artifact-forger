// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const template = readFileSync(resolve(ROOT, "resources/artifact-forger/_template.html"), "utf8");

const kitBlock = template.slice(
  template.indexOf("<!-- GENRE:DOCUMENT KIT -->"),
  template.indexOf("<!-- /GENRE:DOCUMENT KIT -->")
);
const kitScript = kitBlock.slice(
  kitBlock.indexOf("<script>") + "<script>".length,
  kitBlock.lastIndexOf("</script>")
);

function run() {
  (0, eval)(kitScript);
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("document kit behavior", () => {
  it("no-ops on dashboard markup (inertness contract F1)", () => {
    document.body.innerHTML = `
      <header><h1>Dashboard</h1></header>
      <main><nav class="doc-toc"></nav><div id="mermaid-main"></div></main>`;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    run();
    expect(document.querySelector(".doc-toc")?.innerHTML).toBe("");
    expect(warn).not.toHaveBeenCalled();
  });

  it("builds the TOC from h2/h3 with slugified unique ids", () => {
    document.body.innerHTML = `
      <div class="doc">
        <nav class="doc-toc"></nav>
        <article class="doc-body">
          <h2>Overview</h2><p>intro</p>
          <h2>Architecture</h2>
          <h3>Data model</h3>
          <h3>Data model</h3>
        </article>
      </div>`;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    run();
    const links = [...document.querySelectorAll(".doc-toc a")].map((a) => [
      a.getAttribute("href"),
      a.textContent,
    ]);
    expect(links).toEqual([
      ["#overview", "Overview"],
      ["#architecture", "Architecture"],
      ["#data-model", "Data model"],
      ["#data-model-2", "Data model"],
    ]);
    expect(document.getElementById("data-model")).toBeTruthy();
    expect(document.getElementById("data-model-2")).toBeTruthy();
    expect(warn).not.toHaveBeenCalled();
  });

  it("accepts sequential static figure numbers without warnings", () => {
    document.body.innerHTML = `
      <div class="doc"><nav class="doc-toc"></nav><article class="doc-body">
        <figure class="doc-figure"><figcaption>Fig. 1 — Architecture</figcaption></figure>
        <figure class="doc-figure"><figcaption>Fig. 2 — Data flow</figcaption></figure>
      </article></div>`;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    run();
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns when static figure numbers skip (F8)", () => {
    document.body.innerHTML = `
      <div class="doc"><nav class="doc-toc"></nav><article class="doc-body">
        <figure class="doc-figure"><figcaption>Fig. 1 — Architecture</figcaption></figure>
        <figure class="doc-figure"><figcaption>Fig. 3 — Data flow</figcaption></figure>
      </article></div>`;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    run();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("expected Fig. 2"));
  });

  it("warns when a figure caption lacks a static number", () => {
    document.body.innerHTML = `
      <div class="doc"><nav class="doc-toc"></nav><article class="doc-body">
        <figure class="doc-figure"><figcaption>pretty picture</figcaption></figure>
      </article></div>`;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    run();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('must start with "Fig. N"'));
  });

  it("sorts tables on th click (numeric + toggle) and Enter on text columns", () => {
    document.body.innerHTML = `
      <div class="doc"><nav class="doc-toc"></nav><article class="doc-body">
        <table class="doc-table" id="t">
          <thead><tr><th id="name">Name</th><th id="size" class="num">Size</th></tr></thead>
          <tbody>
            <tr><td>alpha</td><td class="num">30</td></tr>
            <tr><td>beta</td><td class="num">10</td></tr>
            <tr><td>gamma</td><td class="num">20</td></tr>
          </tbody>
        </table>
      </article></div>`;
    run();
    const name = document.getElementById("name");
    const size = document.getElementById("size");
    size.click();
    let sizes = [...document.querySelectorAll("#t tbody tr")].map((tr) => tr.children[1].textContent.trim());
    expect(sizes).toEqual(["10", "20", "30"]);
    expect(size.getAttribute("aria-sort")).toBe("ascending");
    size.click();
    sizes = [...document.querySelectorAll("#t tbody tr")].map((tr) => tr.children[1].textContent.trim());
    expect(sizes).toEqual(["30", "20", "10"]);
    name.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    const names = [...document.querySelectorAll("#t tbody tr")].map((tr) => tr.children[0].textContent.trim());
    expect(names).toEqual(["alpha", "beta", "gamma"]);
    expect(name.getAttribute("aria-sort")).toBe("ascending");
  });

  it("injects a working filter input for data-filterable tables", () => {
    document.body.innerHTML = `
      <div class="doc"><nav class="doc-toc"></nav><article class="doc-body">
        <table class="doc-table" id="tf" data-filterable>
          <thead><tr><th>Name</th></tr></thead>
          <tbody><tr><td>alpha</td></tr><tr><td>beta</td></tr></tbody>
        </table>
      </article></div>`;
    run();
    const input = document.querySelector(".table-filter");
    expect(input).toBeTruthy();
    (input as HTMLInputElement).value = "beta";
    input!.dispatchEvent(new Event("input", { bubbles: true }));
    const visible = [...document.querySelectorAll("#tf tbody tr")].filter((tr) => tr.style.display !== "none");
    expect(visible).toHaveLength(1);
    expect(visible[0].textContent).toContain("beta");
  });

  it("opens search via '/', lists matches, closes on Escape with focus restore", () => {
    document.body.innerHTML = `
      <div class="doc"><nav class="doc-toc"></nav><article class="doc-body">
        <button id="trigger">focus me</button>
        <h2>Overview</h2><p>ledger importer details</p>
        <h2>Architecture</h2><p>queue consumer</p>
      </article></div>`;
    run();
    const trigger = document.getElementById("trigger");
    trigger!.focus();
    // '/' shortcut (no modifier keys — happy-dom keydown does not deliver ctrlKey)
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "/", bubbles: true }));
    const overlay = document.querySelector(".doc-search");
    expect(overlay).toBeTruthy();
    expect(overlay!.classList.contains("open")).toBe(true);
    const input = overlay!.querySelector(".search-input");
    expect(document.activeElement).toBe(input);
    (input as HTMLInputElement).value = "ledger";
    input!.dispatchEvent(new Event("input", { bubbles: true }));
    const links = [...overlay!.querySelectorAll(".search-results a")];
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe("#overview");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(overlay!.classList.contains("open")).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("print handlers force light without persisting it (PRINT-MODE bypass)", () => {
    const begin = template.indexOf("/* PRINT-MODE:BEGIN");
    const end = template.indexOf("/* PRINT-MODE:END */");
    const printScript = template.slice(begin, end);
    const g = globalThis as Record<string, unknown>;
    g.state = { mode: "dark" };
    g.THEMES = { dusk: { light: { bg: "#f8f8f6" } } };
    const calls: string[] = [];
    g.applyTheme = () => calls.push("applyTheme:" + (g.state as { mode: string }).mode);
    localStorage.setItem("artifact-mode", "dark");
    (0, eval)(printScript);
    window.dispatchEvent(new Event("beforeprint"));
    expect((g.state as { mode: string }).mode).toBe("light");
    expect(localStorage.getItem("artifact-mode")).toBe("dark");
    window.dispatchEvent(new Event("afterprint"));
    expect((g.state as { mode: string }).mode).toBe("dark");
    expect(calls).toEqual(["applyTheme:light", "applyTheme:dark"]);
    delete g.state;
    delete g.THEMES;
    delete g.applyTheme;
    localStorage.removeItem("artifact-mode");
  });
});
