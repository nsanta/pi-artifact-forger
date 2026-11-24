# Design Draft — Additions Batch 1

**Source:** `concepts_brief_2.md` · **Status:** draft for Goldfish review · **Date:** 2026-11-24

## 1. Scope

Six approved additions in one batch: print/PDF mode, sortable/filterable tables, in-document search, decision genre, roadmap genre, release-notes/diff components. Non-goals (not selected): reference/API genre, markdown front-matter directive, re-bootstrap helper, gallery previews.

All additions extend the existing v2 contract. The kit self-inertness contract (design_draft.md §2: `.doc`-scoped CSS, DOM-guarded JS, optional stripping) applies to every new kit piece.

## 2. Placement: shared vs kit

Three code regions in `_template.html`:

| Region | Contents | Guard |
|---|---|---|
| Dashboard starter (delimited) | demo cards/KPIs/charts | agent strips freely |
| Shared script (outside starter, after `</main>`) | tokens, `THEMES`, theme sync, mermaid/charts registries, **NEW: print handlers** | self-guarded by element/type existence |
| Document Kit (delimited) | doc layout CSS/JS, **NEW: table sort/filter enhancer, search palette, diff/changelog/milestone/pros-cons CSS** | existing `.doc` guard |

Rationale (revised per review): the table enhancer targets `table.doc-table`, which is **kit vocabulary** — `.doc-table` styling only exists inside `.doc` documents, so the enhancer lives in the **kit** and no-ops on dashboards exactly like every other kit behavior. Only the print handlers are shared (anything can be printed, both genres); they are self-inert by existence checks. New-genre structures (decision, roadmap, release notes) are **agent-side structure rules** — no template code beyond the kit components they reuse.

## 3. Print/PDF mode

- **Snapshot-safe light forcing (M4):** `applyTheme()` additionally maintains light-value twin variables (`--print-bg`, `--print-surface`, … — light values of the active palette), and the shared `@media print` block (marker `PRINT-MODE`) overrides the live tokens synchronously: `:root { --bg: var(--print-bg) !important; … }`. CSS-var-driven chrome (text, surfaces, borders) prints light **per active palette** regardless of JS state or timing. Per-palette light twins avoid forcing dusk-light values onto other palettes.
- **Diagrams/charts** (colors baked into SVG attributes / canvas pixels at render time): `beforeprint` applies light mode via the existing pipeline and kicks `renderAllMermaid()` best-effort; the print snapshot may still capture a dark-rendered diagram if the browser snapshots before the async re-render completes. Documented degradation — default mode is already light, so this only affects artifacts where the user toggled dark. `afterprint` restores the saved mode.
- **Persistence bypass:** the forced light mode must never survive the print job: the beforeprint handler re-writes the persisted `localStorage` preference to the saved (dark) value immediately after applying light, and restore-on-afterprint reads an in-memory variable, not localStorage. Idempotent: forcing only fires when the current mode is dark.
- Shared print CSS also: hides interactive chrome (header pickers/buttons, filter inputs, search overlay), removes sticky positioning, break hygiene (`h2 { break-after: avoid }`; avoid breaking inside figures, callouts, table rows, steps, checklists, spec-meta, milestones), dashboard cards single-column, `-webkit-print-color-adjust: exact` **and** `print-color-adjust: exact` (obsolete-name nit). The `@media print` block is the contract's **explicit scoping exemption** allowing bare element selectors (h2, figure, …) — limited to `@media print` so nothing leaks into screen styling; noted in tests.
- Kit CSS: `.doc`-specific print tweaks (TOC as borderless list, full-width reading column).
- No persistence, no UI toggle: printing uses the browser's Print dialog; no "Export PDF" button in v1.

## 4. Sortable/filterable tables (kit)

- Progressive enhancement on every `table.doc-table` **inside `.doc` documents** (kit guard; M1/M2: dashboards have no styled tables, so shared placement was dead code):
  - **Sort:** `th` click toggles asc/desc; also keyboard-activatable (`tabindex="0"`, Enter/Space). Indicator via `aria-sort` + CSS `::after` glyph; detection: `td.num` cells or numeric-parse fallback, else `localeCompare`; single-column sorts only.
  - **Filter:** when the table has `data-filterable`, inject a text input above it (`.table-filter`); typing hides non-matching rows (case-insensitive substring on row text). Hidden in print.
- No persistence of sort/filter state; **no auto-sort attribute in v1** (`data-sort-default` dropped — YAGNI).

## 5. In-document search (kit)

- Trigger: `Ctrl+K` / `Cmd+K` (preventDefault) or `/` when no input is focused; kit-only (`.doc` guard — dashboards don't get an overlay). Guards, named exactly for tests: `.doc` existence check and keydown detection (no IntersectionObserver involved).
- **Bespoke overlay, not native `<dialog>`** — choice stated: deterministic behavior and testability in happy-dom (showModal support varies); revisit if a need for native focus semantics appears.
- Overlay `.doc-search`: fixed backdrop + centered panel, `role="dialog" aria-modal="true"`, labeled input, results list (max 20), `Esc` and backdrop-click close, `↑/↓` + `Enter` navigation.
- **Focus contract:** on open, focus moves to the input; `Tab` is trapped within the panel; on close, focus returns to the element that had it before opening.
- Index: lazily built on first open from `.doc-body`: heading entries (id + text) and section text (content between headings, truncated snippets, query-highlight-free in v1). Match: case-insensitive substring on heading text and section text; heading matches rank above body matches.
- Result click/Enter → `location.hash` jump (existing `scroll-margin-top` handles offset) and close. No in-page match highlighting in v1.

## 6. Decision genre (ADR)

- Badge `DECISION`; routing signals: "ADR", "decision record", trade-off analysis, "compare options / cuál debemos usar", evaluation matrices. **Precedence rule (M5, mirrors the roadmap carve-out):** an ADR/decision record **as the deliverable** → decision genre; a decision-records *section* inside a technical proposal stays tech-spec (kit `.callout.decision`). Existing rules stand: explicit override wins; spec/review framing outranks data presence; ambiguity → report.
- Structure (agent rules): `.spec-meta` (Status: Proposed/Accepted/Superseded-by, Date, Deciders) → Context (problem + constraints) → Options (one `h3` each, each with `.pros-cons` two-column pros/cons lists) → Comparison matrix (`.doc-table`, criteria × options; plain Yes/No/values; invented weighted scores get the `Estimates` badge) → Recommendation & Decision (`.callout.decision` with rationale) → Consequences → Revisit conditions (what would re-open this).
- New kit CSS (`.doc`-scoped): `.doc .pros-cons { grid, 2 cols, stacks on print/narrow }` with lucide `check`/`x` icons (accent/muted tokens, no hardcoded colors).

## 7. Roadmap genre

- Badge `ROADMAP`; routing signals: "roadmap", launch plan, milestone/phase plan as the main deliverable, "plan de hitos", phased rollout overview. A rollout *section* inside a product spec stays a product spec — roadmap genre only when the plan is the artifact.
- Structure: header meta (Horizon, Owner, Last updated) → Timeline at a glance (Mermaid gantt figure, `classic` look, `Fig. N`) → Milestones: one `h3` per milestone with status badge (done/current/pending — static, agent-set), target date (mono), owner; deliverables as `.checklist`; blocked/dependency notes as callouts → Risks (`.doc-table` or callouts) → Roadmap changelog (`.changelog-list`, §8).
- New kit CSS: `.doc .milestone` (left rail + status dot per state, token-pure) — visual sibling of `ol.steps`.

## 8. Release-notes / diff components

- New kit CSS components (`.doc`-scoped, token-pure — no diff-library, no hardcoded colors):
  - `.doc .diff-pair`: two-column before/after (stacks on narrow/print); each half a labeled `pre.doc-code`.
  - `del`/`ins` inside `pre.doc-code` render block-level: removed lines get strikethrough + muted color + `−` gutter glyph; added lines get `+` gutter glyph + accent left border. Semantic markup, no per-line spans required.
  - `.doc .changelog-list`: version rail — entry = version badge (mono) + date + bullets; visual sibling of `.milestone`.
- Agent structure rules (no new genre):
  - "release notes / changelog" → **report** genre with release-notes structure: Summary → Added/Changed/Fixed/Removed (`.changelog-list` groups) → Upgrade steps (`ol.steps`) → notable diffs (`.diff-pair`).
  - "migration guide" → **manual** genre; before/after snippets use `.diff-pair`; breaking changes as `.callout.warning`.

## 9. Genre count + agent contract updates

**Six document genres plus dashboard** (report, tech-spec, product-spec, manual, decision, roadmap). Structure-only genres stay in agent rules; a genre graduates to kit CSS only when it needs components beyond the shared kit vocabulary — decision and roadmap reuse shared vocabulary (`.pros-cons`, `.milestone`, `.changelog-list`, `.diff-pair` are shared kit components).

**Agent contract updates (landing place, M3/nits — resolve now, not at implementation time):**

1. `agents/artifact-forger.md` §2 keep-list switches to **region-based language**: "keep the entire shared script block — tokens, `THEMES`, theme sync, registries, print handlers — and the entire `GENRE:DOCUMENT KIT` block for document genres" instead of enumerating functions, so new shared behavior can never be stripped by a compliant agent.
2. Routing table gains two lines: decision (with the ADR-deliverable precedence rule) and roadmap (with the rollout-section carve-out).
3. Genre structures gain **decision** and **roadmap** entries; document-components line gains `.pros-cons`, `.milestone`, `.diff-pair`, `.changelog-list`.
4. New routing lines: "release notes / changelog" → **report** with release-notes structure; "migration guide" → **manual** with `.diff-pair` before/after snippets and `.callout.warning` for breaking changes.
5. Diff authoring rule in agent + skill: one `del`/`ins` element per changed line inside `pre.doc-code`, elements contiguous (no stray newlines between blocks) so block-glyph CSS renders without doubled blank lines.
6. `SKILL.md` mirrors: the two new genre lines, release-notes/migration routing, and the print note (default light prints correctly; dark-toggled artifacts may print diagrams dark if snapshot races) — compact, agent file remains single source of truth.

## 10. Tests

- Contract (`tests/template.test.ts`): `PRINT-MODE` block present, inside shared region (not inside either delimited block), and documented scoping exemption; print-var twins markers (`--print-bg`) + beforeprint/afterprint handlers + persistence-bypass (localStorage write-back) in shared script; kit markers: enhancer (`aria-sort`, `data-filterable`, `.table-filter`, keyboard activation), search (`.doc-search`, `metaKey`/`ctrlKey` detection, focus-trap markers), components (`.pros-cons`, `.milestone`, `.diff-pair`, `.changelog-list`, `pre.doc-code del`/`ins` rules); **hex-literal sweep**: kit CSS must contain no hex colors (token purity now enforced, closes the accepted gap); marker exactly-once pairs unchanged.
- Agent contract (`tests/agent.test.ts`): decision + roadmap genre markers, precedence rules ("as the deliverable", "rollout" carve-out), release-notes→report and migration→manual routing lines, region-based keep-list language ("entire shared script"), diff authoring rule; skill mirror lines present.
- Behavioral (`tests/kit.test.ts`): sort flips row order on `th` click **and** Enter keypress (numeric + text columns, within `.doc` markup); filter input hides non-matching rows; search overlay opens on keydown, lists matches, closes on Escape, focus returns; dashboard inertness re-verified (no `.doc` → kit still no-ops entirely).
- Print behavioral: dispatch `beforeprint`/`afterprint` on the shared-script print IIFE (extracted via `/* PRINT-MODE */` markers): dark → forced light display while persisted localStorage stays dark; restore on afterprint. CSS break/hide rules asserted statically only (no print emulation in happy-dom — rationale stated here, per review).

## 11. Risks / remaining open questions

- ~~Keep-list wording~~ resolved (agent contract updates, §9); ~~token purity gap~~ resolved (hex sweep, §10).
- Ctrl+K is intercepted by some browsers (address-bar search) — `/` fallback documented; acceptable v1.
- Gantt diagrams under Mermaid `base` theme: verified only visually in v1; classic look accepted.
- Mermaid dark→light re-render on print is best-effort (async race documented in §3); verified manually during implementation, not in CI.
