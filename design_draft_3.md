# Design Draft — Additions Batch 2 (WebGL + interactive)

**Source:** `concepts_brief_3.md` · **Status:** draft for Goldfish review · **Date:** 2026-11-25

## 1. Scope

Eight approved additions: WebGL full scope (webgl-stage + simulation genre + live parameters), code playground, syntax highlighting, state-machine simulator, dataset explorer, graph explorer, before/after slider, and what-if parameter panels (shared infrastructure with WebGL). Not selected: API reference genre, request/CLI builder.

Contract version bumps **`contract:artifact-forger v2` → `v3`**. All existing invariants hold: single file, `file://`, pinned CDNs, markdown source of truth, honesty badges, palette/mode theme sync, self-inert kit scoping, never overwrite project templates.

## 2. Library policy: opt-in pinned tag registry

The three new libraries are heavy (three ~150 KB, cytoscape ~120 KB, hljs ~30 KB). **The resting template does not load them.** Instead, the agent file gains a **snippet registry** — exact, pinned `<script>` tags the agent adds to an artifact only when that artifact uses the matching component. **All URLs verified reachable (HTTP 200) at pin time** (review M7):

| Library | Tag (exact string, pinned, verified 200) | Global | Enables |
|---|---|---|---|
| three.js | `https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js` | `THREE` | webgl-stage |
| OrbitControls | `https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/controls/OrbitControls.js` | `THREE.OrbitControls` | orbit in webgl-stage |
| highlight.js | `https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/highlight.min.js` | `hljs` | code highlighting |
| cytoscape | `https://cdn.jsdelivr.net/npm/cytoscape@3.28.0/dist/cytoscape.min.js` | `cytoscape` | graph-stage |

- r147 is pinned deliberately: the last three.js line shipping UMD builds — keeps the no-ESM, file:// contract intact.
- Every kit consumer of a library guards with `typeof` checks and renders a styled fallback message when absent — identical behavior for stripped kit, stale templates, and offline opens.
- Tests assert the exact pinned strings exist in the agent file (registry) and that no `@latest` appears anywhere.
- **SRI deliberately omitted in v1** (stated decision): four libraries × future re-pins make hash maintenance disproportionate for POC-grade artifacts; revisit if artifacts ever embed third-party content.

## 3. webgl-stage component

Markup (agent-authored):

```html
<div class="webgl-stage" data-scene="orbital">
  <div class="stage-controls"><button class="btn" data-act="toggle-run">Pause</button></div>
  <p class="webgl-fallback">WebGL is not available in this browser.</p>
</div>
```

Kit runtime (`initWebGLStages()`, in the kit script, guarded):

- Looks up `WEBGL_SCENES[data-scene]` — a registry **the agent authors in the artifact**: `{ setup(ctx), frame(t, dt, values), dispose() }`, where `ctx` = `{ scene, camera, renderer, theme, container }`.
- Guards: `typeof THREE !== 'undefined'` and `typeof THREE.OrbitControls !== 'undefined'`; WebGL context probe (`canvas.getContext('webgl2') || getContext('webgl')`); on failure the `.webgl-fallback` message is shown and the stage idles.
- Loop: `requestAnimationFrame`, **DPR capped at 2**, pauses when `document.hidden`, when the stage scrolls out of view (IntersectionObserver), when the user presses Pause, and by default when `prefers-reduced-motion` matches (the button initializes as **Play** in that case).
- Theme: `setup` receives the active palette theme; `applyTheme()` dispatches `theme:change` (new CustomEvent) — running scenes re-read colors via `frame`; **paused scenes get one forced render on `theme:change`** so colors never go stale.
- Sizing: a **per-stage ResizeObserver** (a new mechanism — the existing `reapplyAll` is a window-resize listener for mermaid fits; the two coexist: observer = canvas pixel size, window listener = layout-wide refit). Renderer resizes to the stage box, capped height.
- **Context loss (named decision):** `webglcontextlost` shows the `.webgl-fallback` message and stops the loop; `webglcontextrestored` re-runs `setup` and resumes. POC-grade handling, but a named behavior, not an omission.
- `dispose()` is called on `pagehide` — no leaks across SPA-like embeds.

## 4. Simulation genre

- Badge `SIMULATION`; routing signals are **qualified to 3D/POC phrasing**: "simulation", "POC", "3D", "physics/orbit/particle demo", "visualize in 3D", "simular en 3D". Non-3D simulations (2D physics, queueing, discrete-event) route to report/manual with Mermaid figures; a 2D canvas stage is deferred. Overrides win; spec framing outranks data presence (consistent with batch-1 rules).
- Structure: Objective (what the POC demonstrates) → Assumptions & parameters (`.param-panel`) → **Interactive 3D view** (`webgl-stage`) → Observations (what runs show; invented results badged) → Next steps.
- Structure-only genre: reuses shared kit vocabulary (`param-panel`, `webgl-stage`, callouts, doc-tables). No new template code beyond the kit components.

## 5. What-if parameter panels

Markup: `<div class="param-panel"><label>Rate <input type="range" data-param="rate" min max step value></label> …</div>` (range/number/checkbox/select supported; each control has `data-param`).

Kit wiring (kit script, guarded):

- On any `input` event inside a `.param-panel`, collect that **panel's** values `{name: value}` (numbers for range/number, booleans for checkbox, strings for select) and dispatch — throttled to one call per animation frame — to a **single channel**: `window.onParams?.(values, panel)` where `panel = { id, label }` identifies the originating panel (M8: per-panel collection; two panels never collide on duplicate names).
- Initial dispatch on boot (with default values) so scenes initialize from the panel.
- The agent authors `onParams` to update scene objects, chart data, or table cells live. One handler per artifact; panels are distinguished via the `panel` argument.
- Print CSS: panels hidden; v1 does not print current values (accepted gap, noted).

This is the shared infrastructure both the simulation genre and standalone what-if sections use.

## 6. Code playground

- Markup: `pre.doc-code` with `data-playground` → the kit adds **Run** / **Stop** buttons and an output pane (`pre.playground-output`).
- Execution (M9 — runaway-code hazard): the code runs in a **Web Worker** created from a blob URL — a `while (true) {}` burns a background thread, never the page; **Stop terminates the worker** and is always reachable. The worker captures `console.log/warn/error` and `error` events, postMessages lines back to the output pane, and posts `done` on completion. Runner code is pure computation — **no DOM access inside playground code** (by design; documented).
- The kit's `message` listener validates `event.source === worker's expected channel` pairing per playground instance (spoofing guard).
- **Honesty contract (docs + skill):** the worker isolates computation and can be terminated, but it does **not** block network access. Playground code is agent-authored sample code; the rule "artifacts never make network calls" applies to authors, not the mechanism.
- Reset: terminates any running worker, re-creates it, clears the output. Multiple independent playgrounds per artifact supported (index-keyed).

## 7. Syntax highlighting

- Opt-in: `pre.doc-code` with `data-lang="js"` → if `hljs` is loaded, `hljs.highlightElement` runs at boot (guarded `typeof hljs !== 'undefined'`; without the library the block renders as plain mono, per the existing contract).
- **Syntax colors from the existing token system (M1 — no hex exception):** `applyTheme()` exposes five syntax vars `--syntax-1 … --syntax-5` mapped to `getActiveTheme().series` (the same multi-hue source charts and Mermaid use). hljs classes map to the vars: keyword→`--syntax-1`, string→`--syntax-3`, number→`--syntax-4`, comment→`--text-muted`, function/title→`--syntax-2`. Highlighting follows the active palette and mode with **no new color pipeline and no hex-sweep exemption** — the sweep stays strict everywhere.
- **Copy button + filename label on every `pre.doc-code`** (M6): `.code-name` label and copy affordance are universal, independent of highlighting; playground blocks inherit them too.
- **Line numbers deferred** — per-line wrapping breaks multi-line tokens; noted as a known gap.

## 8. State-machine simulator

- Markup: `<div class="sm-sim" data-sim="checkout">` plus agent-authored registry `SM_SIMS = { checkout: { initial: 'cart', states: {…labels}, transitions: [{ from, event, to }] } }`.
- Kit renders: current-state badge, buttons for every event valid from the current state (disabled otherwise), and a rolling event log (last 10 entries: `event — from → to`).
- State reducer is a pure function (`reduce(current, event, transitions)`) extracted for behavioral tests. Illegal events are disabled in UI and logged if somehow invoked.
- v1 does **not** highlight the Mermaid svg nodes (id matching unreliable across mermaid renders) — the badge + log carry state; noted as a gap.

## 9. Dataset explorer

- Extends `.doc-table` with `data-dataset`:
  - Column toggles: a `<details class="col-menu">` above the table with one checkbox per column; unchecked columns hide `th`/`td` cells by index.
  - Search: **reuses the existing batch-1 filter verbatim** (it already matches across all columns via `tr.textContent`) — auto-enabled on dataset tables; no new code. Search text includes hidden (toggled-off) columns — accepted, noted.
  - Numeric summary footer: per numeric column (`td.num`), `n`, `Σ`, `x̄` rendered as a `tfoot.doc-summary` row — computed from **visible rows only** (search-filtered), and summary cells hide/show in lockstep with column toggles (honesty: stats never contradict the visible table).
- All DOM-guarded and `.doc`-scoped; sorts (batch 1) compose with hidden columns (sort by visible cells).

## 10. Graph explorer

- Markup: `<div class="graph-stage" data-graph="topology"></div>` + agent registry `GRAPHS = { topology: { elements: […], layout: 'cose' } }` (cytoscape elements JSON).
- Kit init (guarded `typeof cytoscape !== 'undefined'`): container fixed height 24rem, token colors (nodes/edges/labels from theme), pan/zoom enabled, `fit()` after layout. Print: cytoscape renders as canvas — prints as-is.

## 11. Before/after slider

- Markup: `<div class="ba-slider"><div class="ba-pane ba-before">…</div><div class="ba-pane ba-after">…</div><div class="ba-handle" role="slider" tabindex="0" aria-label="Compare before and after" aria-valuemin="0" aria-valuemax="100"></div></div>` — panes accept any content (styled HTML mock screens, code, images).
- Interaction: pointer drag on the handle; keyboard: arrow keys move 5%, Home/End to 0/100%; `aria-valuenow` kept current; the handle is focusable and labelled (ARIA slider pattern). Panes clip via `clip-path`/width positioning; stacked (before then after) in print.

## 12. Agent + skill contract updates

1. **Snippet registry** (§2) added to `agents/artifact-forger.md` — exact pinned, verified tags, one per library, with "add only when the artifact uses it".
2. **Routing**: simulation genre line (qualified 3D/POC signals per §4) with the standard override/precedence clauses.
3. **Component selection rule (M4)**: static illustration → Mermaid figure; interactive exploration of node-link data → `graph-stage`; animated/physical/3D demonstration → `webgl-stage` scene; discrete-event walkthrough → `sm-sim`. Mirrors the existing mermaid-look guidance style.
4. **Component authoring rules**: `WEBGL_SCENES` factory contract (setup/frame/dispose, theme in ctx, no hardcoded hexes — use `ctx.theme`), `GRAPHS`/`SM_SIMS` registries, `onParams(values, panel)` handler, `data-playground`/`data-lang`/`data-dataset` attributes, `ba-slider` markup with focusable labelled handle, "playground code is pure computation — no DOM, no network".
5. `SKILL.md` mirrors: one compact block (simulation genre + component names), agent file stays single source of truth.
6. README + `docs/user-guide.md` updated after implementation (features matrix, keyboard/usage additions, genre table row).

## 13. Tests

- Contract (`tests/template.test.ts`): v3 marker; snippet-registry pinned tags asserted **in the agent file** (exact verified URLs with versions — including `@highlightjs/cdn-assets`); kit markers per component (`.webgl-stage`, `.param-panel`, `.sm-sim`, `.graph-stage`, `.ba-slider`, `.col-menu`, `.playground-output`); **hex sweep stays strict everywhere** (no syntax exception block exists); guards (`typeof THREE`, `typeof hljs`, `typeof cytoscape`) present; DOMContentLoaded boot + load re-fit unchanged; syntax vars (`--syntax-1`) set in applyTheme.
- Agent contract (`tests/agent.test.ts`): simulation routing markers, registry tag strings, component selection rule, authoring-rule markers (`onParams`, worker/no-DOM playground rule, no-network-authoring rule, ba-slider a11y).
- Behavioral (`tests/kit.test.ts`): param collection per panel + throttled `onParams` dispatch (values + panel identity correct, one call per frame); sm reducer (legal/illegal transitions); ba-slider position via keyboard events + focusability (`tabindex`, `aria-label`); dataset column toggle hides cells, summary computes from **visible rows**; playground worker-builder function output (escapes code, includes runner); webgl/graph/playground/sm no-op cleanly when libraries absent (guard paths).

## 14. Examples

Six new generated examples (generator gains content + meta), all at v3:

| File | Use case | Demonstrates |
|---|---|---|
| `simulation-orbital-poc.html` | Simulation (WebGL) | webgl-stage + OrbitControls + param panel driving the scene live |
| `tech-spec-protocol-states.html` | Tech spec + state machine | sm-sim over a checkout protocol, highlighted code with copy/name |
| `graph-service-topology.html` | Tech spec + graph explorer | cytoscape dependency map, token-colored |
| `dataset-explorer-spend.html` | Report + dataset explorer | data-dataset table: column toggles, search, visible-row summaries |
| `playground-string-utils.html` | Code playground | data-playground snippets (Web Worker runner, Stop button), highlighted |
| `design-slider-onboarding.html` | Report + before/after slider | HTML-mock screens compared with the draggable, keyboard-accessible divider |

Plus: all eight existing examples regenerate at v3; `examples/index.html` gains six cards (meta list drives the index); `examples/README.md` table extended.

## 15. Risks / open questions for reviewers

- **Single-bump justification (M5, resolved by operator):** v2→v3 carries the whole batch including three.js/cytoscape because **WebGL is the operator's explicit headline request** and the simulation genre is its demonstration artifact; splitting would defer the requested feature. r147 is frozen-in-time (early 2022, no further fixes) — accepted for POC-grade scenes; revisit if WebGL becomes central.
- Cost, separated (review nit): the kit grows ~20–25 KB — paid **unconditionally by every document-genre artifact** (stripping is optional; self-inertness never depends on it). The new CDN library bytes are zero until an artifact opts in via the snippet registry.
- Playground runner is a Web Worker: pure computation only (no DOM) — the design consequence is stated in authoring rules; network is still possible in workers, covered by the no-network authoring rule, not the mechanism.
- Reduced-motion default-pause may confuse users expecting motion — Play button is prominent, labeled; label initializes from the motion state.
- v2→v3 marker: stale-project fallback (inline-append) now must copy a bigger kit — same mechanism, no change needed.
