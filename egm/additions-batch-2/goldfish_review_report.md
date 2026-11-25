# Goldfish Review Report

- Target: /home/nicolas/projects/pi-artifact-forger/design_draft_3.md
- Range: full file
- Mode: review
- Date: 2026-11-25T19:12:35.456Z
- Reviewers:
  - zoom_out (ok)
  - design_critic (ok)

## zoom_out (ok)

Severity: Major
Scope: §7 Syntax highlighting — "Syntax palette exception (hex sweep)"
Description: The design introduces a second theming mechanism: a fenced SYNTAX-PALETTE block of raw hexes (per mode) plus a permanent exemption carved out of the hex-sweep test. The codebase already has a multi-hue, per-palette/per-mode color mechanism — `THEMES[palette][mode].series` (5 hues), consumed via `getActiveTheme()` and applied from JS by charts, mermaid `themeVariables`, and the swatch strip (`_template.html` §215–291, 486–499).
Rationale: The hex sweep exists to enforce single-source theming; exempting a block re-opens exactly the hole it guards and leaves two parallel color pipelines to maintain across five palettes × two modes. Extend the existing token system instead (e.g., map hljs classes keyword/string/number/comment/function to `series` indices, exposed as `--syntax-*` CSS vars set in `applyTheme`, mirroring how charts re-theme). No test exemption, no new mechanism, and highlighting follows palette changes for free.

Severity: Major
Scope: §5 What-if parameter panels — dual dispatch
Description: Param values are dispatched in two forms: a `params:change` CustomEvent on `document` and a `window.onParams?.(values)` callback authored by the agent. Nothing in the design consumes the CustomEvent — all named consumers (scenes, chart data, table cells) go through `onParams`.
Rationale: Two channels for the same data on the shared infrastructure both flagship features depend on doubles the contract surface (docs §12.3, tests §13, agent authoring rules) to serve no current consumer — a textbook speculative interface. Pick one channel (the agent-authored `onParams` is the simplest, since agent script already exists for registries) or name a concrete multi-consumer scenario that justifies the event.

Severity: Major
Scope: §3, §5–§11, §13 — component placement unspecified
Description: The draft says new wiring lives in "the kit script, guarded", but never states which script region: the shared block (usable by dashboards and doc genres) or the `GENRE:DOCUMENT KIT` block (inert without `.doc`, strippable on dashboards). Meanwhile §5 calls the param panels "shared infrastructure", and §2's registry enables `webgl-stage`/`param-panel` for any artifact.
Rationale: Placement is an architectural decision with contract consequences: kit-block placement silently makes every new component document-genre-only (a dashboard artifact can never use param panels or webgl stages, despite the registry), while shared placement means the stripped-kit tolerance rules (e.g., `typeof measureDiagram` pattern) must apply to six more systems. The design must state placement per component and reconcile the "shared" claim with kit inertness before implementation.

Severity: Major
Scope: §3/§10 vs existing template; §12.3 Agent contract
Description: Three new interactive-diagram surfaces (graph-stage, webgl-stage scenes, sm-sim) now coexist with the established Mermaid figure system, and the agent contract update (§12.3) lists authoring rules for each but gives the agent no selection guidance between them (static mermaid figure vs interactive cytoscape graph vs WebGL scene vs state-machine sim).
Rationale: The existing agent file carries detailed selection guidance for mermaid looks precisely because overlapping options produce inconsistent artifacts; three new overlapping surfaces without routing rules will make tool choice arbitrary. Add a short selection rule to the agent contract (e.g., static illustration → mermaid figure; interactive exploration of node-link data → graph-stage; animated/physical/3D demonstration → webgl-stage scene; discrete-event walkthrough → sm-sim).

Severity: Major
Scope: §1 Scope / §2 Library policy / §14 Examples
Description: All eight additions ride one contract bump (v2→v3), and the bump's riskiest payload — three.js r147 + OrbitControls + cytoscape, ~300 KB of registry weight built on a three.js line frozen in early 2022 with no further fixes — is bundled with low-risk, self-contained wins (highlighting, dataset explorer, ba-slider, playground).
Rationale: Bundling forces regeneration of all eight existing examples and grows the stale-template inline-append fallback for the whole batch, and couples a long-term contract decision (freezing a 2022 UMD build into the canonical template) to a batch review. Split the bump: land the light interactive set as v3, and isolate the heavy 3D/graph libraries behind their own increment once a real artifact demonstrates the need — or explicitly justify the single-bump coupling in §15.

Severity: Major
Scope: §7 Syntax highlighting — copy button gating; §6 Code playground
Description: Copy button + filename label (`.code-name`) are attached only to *highlighted* blocks, i.e., availability is gated on `data-lang` + `hljs` being loaded. Plain `pre.doc-code` blocks and playground blocks (§6) get no copy affordance, and §6 is silent on whether playground code gets one.
Rationale: Copyability is orthogonal to highlighting; coupling them makes a basic affordance unpredictable across artifacts (present only when an optional 30 KB library loads) and leaves the playground contract ambiguous. State the copy/name rule once for all `pre.doc-code` blocks, independent of highlighting.

Severity: Nit
Scope: §12.1
Description: "added to `agents/artifact-forfer.md`" — misspelled filename; the file is `agents/artifact-forger.md`.
Rationale: The draft elsewhere names files exactly; a wrong path here invites an edit to a nonexistent file. Fix the typo.

Severity: Nit
Scope: §3 webgl-stage — "Resize: integrated with the existing fit system"
Description: The existing fit system is a `window`-resize listener (`reapplyAll`) plus `measureDiagram` for mermaid SVGs; there is no ResizeObserver anywhere in the template. The draft describes a new per-stage ResizeObserver as if it were integration with an existing mechanism.
Rationale: A ResizeObserver is the right tool for a canvas and adding it is justified, but the draft should say honestly that it introduces a second sizing mechanism alongside `reapplyAll`, and state how they coexist (or consolidate on the observer) — otherwise the implementer may assume an integration point that does not exist.

Severity: Nit
Scope: §9 Dataset explorer — "Search upgrades the batch-1 filter to match across all columns"
Description: The batch-1 filter already matches across all columns (`tr.textContent` includes every cell), so there is no upgrade to make; the actual delta is auto-enabling the existing filter input on `data-dataset` tables.
Rationale: As written, the draft invites redundant "upgrade" code; state the reuse plainly ("existing filter, auto-enabled on data-dataset") and specify one real interaction: whether search should match text in hidden (toggled-off) columns, which batch-1 behavior implies it will.

Severity: Nit
Scope: §15 Risks — "strip rule keeps per-artifact cost at zero until used"
Description: This conflates two costs. The ~20–25 KB kit growth is paid by every document-genre artifact (stripping is an optional byte-saving per the existing contract, and self-inertness never depends on it); only the new CDN library bytes are zero until used, via the §2 snippet registry.
Rationale: The accepted-risk statement understates the unconditional cost of the batch; separate the two numbers so reviewers approve the right trade.

## design_critic (ok)

Severity: Major
Scope: §2 Library policy (highlight.js row, registry table)
Description: The pinned hljs URL `https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/highlight.min.js` is almost certainly a 404 — the `highlight.js` npm package does not ship `highlight.min.js` at the package root; the browser bundle lives in the separate `@highlightjs/cdn-assets` package (or cdnjs/`gh/highlightjs/cdn-release`). The other three URLs are correct.
Rationale: §13 asserts the *exact pinned strings* exist in the agent file — a presence test passes on a dead URL, so the defect ships in the v3 contract and every regenerated example, and syntax highlighting silently and permanently degrades to plain mono with no test or guard catching it. Verify the URL resolves before approving; pin via `@highlightjs/cdn-assets` or cdnjs, and consider a pin-time reachability check (HTTP 200 recorded at pin time) so "exact pinned string" can never mean "exact dead string".

Severity: Major
Scope: §5 What-if parameter panels
Description: All `data-param` values are collected into one merged `{name: value}` object and delivered to a single global `window.onParams`, with no panel identity or source in either dispatch form.
Rationale: §5 explicitly targets "standalone what-if sections" anywhere in a document, but two panels in one artifact collide on duplicate param names (silent overwrite) and one `onParams` handler cannot tell which panel fired, forcing the agent to write brittle branching outside the kit vocabulary. Include the originating panel (id/section) in the `params:change` detail and scope collection per-panel (or merge with namespaced keys), and state the single-panel limitation if multi-panel support is out of scope.

Severity: Major
Scope: §6 Code playground
Description: No mitigation or documented hazard for runaway code: an infinite loop in the sandboxed iframe can hang the entire page (file:// documents typically share one renderer process in Chromium), making the Run/Reset buttons unreachable — the user must kill the tab.
Rationale: A "Run this code" affordance makes `while(true){}` a one-click full-page freeze in an artifact meant to be opened and read casually. At minimum document the hazard adjacent to the playground; better, inject a watchdog/loop-guard into the generated srcdoc (e.g., instrumented loop budget or a Web Worker–based runner) or state explicitly in the design that tab-kill is the recovery path and why that is accepted.

Severity: Major
Scope: §4 Simulation genre (routing signals + structure)
Description: Routing signals ("simulation", "physics", "simular") are broader than the genre's only interactive mechanism: the structure mandates a `webgl-stage` 3D view, and no non-WebGL (2D canvas, chart-driven, discrete-event) simulation path exists in scope.
Rationale: A 2D physics or queueing demo routed as SIMULATION must either shoehorn an unjustified 3D scene into the artifact or improvise canvas code outside the kit vocabulary — both are contract drift the genre system is supposed to prevent. Either qualify the signals toward 3D/POC phrasing, or add a minimal 2D canvas stage (same registry/guard/loop pattern as webgl-stage) so the genre's structure can be honored for non-3D simulations.

Severity: Nit
Scope: §3 webgl-stage (guards/fallback)
Description: WebGL context loss (`webglcontextlost` / `webglcontextrestored`) is not handled; a mid-session context loss leaves a dead black stage while the rAF loop keeps running.
Rationale: Context loss is a real, user-visible failure mode (multiple tabs, heavy DPR-2 scenes). Cheap to handle: listen on the canvas, show the existing `.webgl-fallback` on loss, re-init or resume on restore. Rate as POC-grade acceptable, but it should be a named decision, not an omission.

Severity: Nit
Scope: §6 Code playground (runner/message channel)
Description: The kit's `message` listener is not specified to validate `event.source === iframe.contentWindow`; under sandbox the origin is the opaque "null", so origin checks are useless.
Rationale: Any other frame (ads in an embed, dev tools panes, sibling iframes) could post spoofed console lines into the output pane. One-line source check in the listener; state it in the design so it is not forgotten in implementation.

Severity: Nit
Scope: §9 Dataset explorer (numeric summary footer)
Description: Summary semantics are unspecified — "computed from DOM cells" will include rows hidden by the batch-1 search filter (display:none leaves cells in the DOM), and summary `tfoot` cells are not tied to the column toggles.
Rationale: A table whose footer Σ/x̄ contradict the visible filtered rows is exactly the kind of quiet dishonesty this project badges against. Specify whether stats reflect all rows or visible rows (and test it), and hide/show summary cells in lockstep with column toggles.

Severity: Nit
Scope: §2 Library policy / §12.1 Snippet registry
Description: Pinned tags carry no `integrity`/`crossorigin` attributes (SRI).
Rationale: A CDN or registry compromise yields arbitrary script execution in the artifact's page context — the honesty contract elsewhere is strict about what artifacts may do, so supply-chain hardening deserves a stated decision. SRI hashes are compatible with "exact pinned string" (the registry string just grows); note if deliberately omitted.

Severity: Nit
Scope: §11 Before/after slider (markup)
Description: `role="slider"` on the handle is declared without `tabindex`, `aria-label`, or `aria-orientation`; the ARIA slider pattern requires a focusable, labeled control.
Rationale: As specced, keyboard interaction is defined but the control may ship unfocusable/unnamed, making the arrow-key support dead weight for assistive tech. Add tabindex/aria-label to the markup contract and cover focusability in the §13 keyboard test.

Severity: Nit
Scope: §12.1 Agent file reference
Description: Typo: `agents/artifact-forfer.md` should be `artifact-forger.md`.
Rationale: If tests or scripts match this path literally, the registry insertion step silently misses; keep file references exact in a contract document.

Severity: Nit
Scope: §3 webgl-stage (theme + reduced motion)
Description: Two small behavioral gaps: (a) the shipped control markup reads "Pause", but under `prefers-reduced-motion` the stage starts paused and the label should initialize to "Play"; (b) a paused/idle stage has no redraw path on `theme:change` — since recoloring happens in `frame`, a paused scene keeps stale colors until resumed.
Rationale: Both are one-line rules (initialize label from motion state; require a single forced redraw on `theme:change` for non-running scenes) but unstated they produce visibly wrong behavior in the two states the design itself introduces.
