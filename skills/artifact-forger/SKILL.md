---
name: artifact-forger
license: Apache-2.0
description: >-
  Turn plans, reports, and data into self-contained, file://-safe HTML
  artifacts (dashboards, diagrams, visual explainers) using a versioned
  design system with five palettes, light/dark modes, Chart.js and
  Mermaid theming. Prefer delegating to the artifact-forger subagent
  when it is installed; fall back to inline generation with these rules.
---

# Artifact Forging

When asked for a dashboard, report, diagram, visual explainer, or interactive tool, produce a single self-contained HTML file in the target project's `artifacts/` directory.

## Prefer delegation (when available)

If the `subagent` tool is available and an `artifact-forger` agent is installed (user-global: `~/.pi/agent/agents/artifact-forger.md`), **delegate generation to it** with the task and the working directory as cwd — the design system is bulky and stays out of the main session's context. Small tweaks to an existing artifact (add a chart, switch a value, change wording) are edited in place; no delegation needed.

## Inline generation rules (fallback)

0. **Genre.** Route by content (source of truth: the agent file's routing table, summarized here): dense data → **dashboard**; work/event summary with prose+data → **report**; proposal for review → **tech-spec** / **product-spec**; decision record as the deliverable → **decision** (a decision-records *section* stays tech-spec); milestone plan as the main deliverable → **roadmap** (a rollout *section* stays product-spec); 3D/physics/POC simulation as the deliverable → **simulation**; release notes / changelog → **report** with the release-notes structure; migration guide → **manual** with before/after diffs; procedure to follow → **manual**. Explicit override in the request always wins; spec framing outranks data presence; prose spine with any data → report, never a dashboard. Document genres use the template's `GENRE:DOCUMENT KIT` block: `<div class="doc"><nav class="doc-toc"></nav><article class="doc-body">…</article></div>`, callouts, `.doc-table` (sortable/filterable automatically, `data-dataset` for dataset explorer), `.pros-cons`, `.milestone`, `.diff-pair`, `.changelog-list`, static-numbered figures (`Fig. 1 — caption`), spec header (`.spec-meta`) for specs, steps/checklist/prereqs for manuals — no checklist persistence. Search (`Ctrl+K`) and print styling come for free; default light mode prints correctly. Interactive components (opt-in pinned CDN tags listed in the agent file): `webgl-stage` + `WEBGL_SCENES` (three.js 3D/physics/POC), `graph-stage` + `GRAPHS` (cytoscape), `sm-sim` + `SM_SIMS` (discrete-event walkthrough), `.param-panel` + `window.onParams(values, panel)` (live what-if), `data-playground` (Web Worker, pure compute — no DOM/no network), `data-lang` (highlighting). Geographic maps: `geo-stage` + embedded TopoJSON (`world-atlas` 110m overview, 50m choropleth; agent picks resolution) + `REGION_VALUES`/`MAP_POINTS` — geometry is embedded, never fetched. If the project's `_template.html` lacks `contract:artifact-forger v3`, inline-append the kit block into the generated artifact and report the staleness; never edit the project's template.
1. **Design contract.** Read `artifacts/_template.html` in the project. If missing, bootstrap it by copying the canonical template (`~/.pi/agent/artifact-forger/_template.html`, or `resources/artifact-forger/_template.html` in the package). Never overwrite an existing `artifacts/_template.html`.
2. **file://-safe.** One HTML file; all CSS/JS inline; no local `fetch()`, relative imports, or ESM. Pinned UMD CDNs only, never `@latest`: `cdn.tailwindcss.com`, `lucide@0.460.0`, `chart.js@4.4.7`, `mermaid@11.4.1` — include only what the artifact uses.
3. **Design system.** Keep the template's CSS variables, `THEMES` palette registry, palette selector + light/dark toggle, and theme-sync infrastructure (`applyTheme`, `updateChartsTheme`, `renderAllMermaid`). Never hardcode hex colors in chart datasets — use `getActiveTheme().series` with `_colorIdx`; skip adjacent indices for 2–3 series.
4. **Charts.** Chart.js 4; `<canvas>` inside a relative container with explicit height; `responsive: true, maintainAspectRatio: false`.
5. **Diagrams.** Mermaid 11; `startOnLoad: false`, `theme: 'base'`, `themeVariables` from `getActiveTheme()`; definitions in `MERMAID_DIAGRAMS`; `.diagram-stage` with zoom/copy/export controls. Default look `classic`; `look: 'handDrawn'` (`handDrawnSeed: 42`) for explainers, `look: 'neo'` for dashboards, on request.
6. **Defaults.** `dusk` palette, light mode; override per task (e.g. "use the nordic palette").
7. **Honesty.** Real data when given; invented data badged `Sample Data`; estimates badged `Estimates`. Artifacts presenting a plan carry the footer: "Markdown remains the source of truth — this artifact is a projection for review."
8. **Deliver.** Save as `artifacts/<kebab-case>.html`, open it headless-safe (`xdg-open`/`open` guarded), and report the path — never paste the HTML into chat.

## Source of truth

Markdown is the source of truth; HTML artifacts are human-facing projections. Plan changes go into the markdown first, then the artifact is regenerated — never the reverse.
