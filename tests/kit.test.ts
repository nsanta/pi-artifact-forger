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
});
