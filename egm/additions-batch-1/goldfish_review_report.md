# Goldfish Review Report

- Target: /home/nicolas/projects/pi-artifact-forger/design_draft_2.md
- Range: full file
- Mode: review
- Date: 2026-11-24T13:53:34.690Z
- Reviewers:
  - zoom_out (ok)
  - design_critic (ok)

## zoom_out (ok)

Severity: Major
Scope: §2 Placement + §4 Sortable/filterable tables
Description: The table enhancer is placed in the shared script on the rationale that "dashboards have tables," but its target `table.doc-table` is kit vocabulary: all table styling (`.doc .doc-table`, `td.num`) is `.doc`-scoped in the kit. No shared table component or styling exists for dashboards, and neither the dashboard starter nor the agent rules put tables on dashboards. A dashboard table would get sort/filter behavior on completely unstyled markup.
Rationale: The placement rationale is speculative (YAGNI) and contradicts the architecture. Either move the enhancer into the kit — simplest, consistent with `.doc-table` being a kit component, and it still no-ops safely — or, if cross-genre tables are genuinely wanted, promote minimal table styling (`doc-table`, `num`) to shared CSS so both genres get the same component. Pick one and align the rationale; today the design's own inertness test ("no `.doc-table` → enhancer no-ops") shows the shared placement buys nothing.

Severity: Major
Scope: §2 Shared script region + §11 first bullet
Description: The design poses the keep-list wording as an open question, but it has a concrete failure mode: `agents/artifact-forger.md` §2 keeps shared JS by enumerating functions (`zoomDiagram`/`copyMermaid`/`downloadSvg`, `charts` registry, etc.). Print handlers and the table enhancer are not in that list, so an agent following the letter of the current keep-list would strip them while believing it complied.
Rationale: This is a silent-breakage path for every generated artifact, not a wording preference. Resolve it in this draft: change the agent keep-list to region-based language ("keep the entire shared script block — tokens, `THEMES`, theme sync, registries, print handlers, table enhancer") and update `agents/artifact-forger.md` §2 accordingly, instead of deferring to implementation time.

Severity: Nit
Scope: §3 Print/PDF mode
Description: The shared `PRINT-MODE` block introduces the first bare element selectors (`h2 { break-after: avoid }`, figure/callout rules) into the shared region, which until now had only class-based selectors; the "no bare element selectors" invariant is documented and tested only for the kit block.
Rationale: Harmless on dashboards in practice, but it quietly weakens a stated contract. Document the print block as an explicit scoping exemption in the contract (and in the §10 test description), and keep the exemption limited to `@media print` so it cannot leak into screen styling.

Severity: Nit
Scope: §9 Genre count note
Description: The arithmetic is self-contradictory: "Six genres total" is followed by a list of seven items that already includes dashboard, plus "— seven including dashboard," which double-counts.
Rationale: This section feeds the routing table the agent treats as source of truth; a wrong count invites confusion. Correct to: "seven genres total (dashboard + six prose genres)".

Severity: Nit
Scope: §4 Sortable/filterable tables (`data-sort-default`)
Description: Auto-sorting a table on load from a `data-sort-default` attribute reorders agent-authored data with no user action, and no current artifact or genre rule calls for it.
Rationale: Speculative feature (YAGNI). Drop it from v1; a one-attribute addition later costs nothing if a real artifact demonstrates the need.

Severity: Nit
Scope: §10 Tests (agent contract bullet)
Description: Naming drift: the bullet says "changelist" while the component is `.changelog-list`, and "IntersectionObserver-style guards" names the wrong mechanism for search (search needs the `.doc` existence guard plus keydown handling; IntersectionObserver belongs to the scrollspy).
Rationale: Tests are written from these markers; wrong names propagate into failing or vacuous tests. Use exact class names and describe the actual guard.

Severity: Nit
Scope: §6–§8 + §10 (agent/skill contract)
Description: The new structure rules (decision, roadmap, release-notes→report, migration→manual) live in this draft, but no section explicitly assigns their landing place in `agents/artifact-forger.md` §2 (routing table lines, genre structures) and the compact SKILL.md mirror — their existence is implied only by §10's test markers.
Rationale: v1 established the agent file as the single source of truth for routing; an implementer should not have to reverse-engineer placement from test names. Add a short "agent contract updates" subsection stating what goes into the agent file and what SKILL.md mirrors.

Severity: Nit
Scope: §5 In-document search
Description: The overlay is specified as a bespoke modal (backdrop + `role="dialog"` + `aria-modal` + Esc handling). The native `<dialog>` element provides Esc close, modality, and focus handling for free and is `file://`-safe.
Rationale: Platform-standard reuse cuts bespoke a11y boilerplate. Caveat: verify happy-dom supports `showModal()` before the §10 behavioral tests; if it does not, keep the bespoke overlay and note why — but state the choice either way.

Severity: Nit
Scope: §11 last bullet (token purity)
Description: The design accepts that the selector-sweep test checks `.doc` scoping but not token purity, leaving v1's "no hardcoded colors" invariant unenforced while four new CSS components (pros-cons, milestone, changelog-list, diff-pair) expand the drift surface.
Rationale: Enforcing a stated invariant is cheap: extend the existing kit sweep to flag hex literals inside the kit block. "Accepted gap" should not mean "untestable forever."

## design_critic (ok)

Severity: Major
Scope: §3 Print/PDF mode (interaction with shared-script `applyTheme()`/`renderAllMermaid()`)
Description: The `beforeprint` handler "saves current mode, applies the light theme" implies reusing the existing theme pipeline, but `applyTheme()` re-themes charts via `chart.update()` and re-renders all Mermaid diagrams through an `async` `renderAllMermaid()` (`await mermaid.render(...)`). Browsers snapshot the page for print before such async re-renders complete, so a dark-mode artifact will print dark-themed diagrams (light text/fills on white paper) regardless of the JS theme swap. Additionally, `applyTheme()` persists mode to `localStorage`; if `afterprint` never fires (crash, print-preview kill), the artifact is permanently restored as light.
Rationale: The core promise of the feature — "manuals/specs get printed, dark backgrounds must not" — silently fails for the highest-value print content (diagrams/charts). The design must specify a print-safe path: e.g. print CSS that forces token values onto diagram containers, synchronous/snapshot-safe re-theming, disabling Mermaid re-render on print, and an idempotent save/restore guard (only save when not already forced; bypass `localStorage` persistence for the print-forced mode). Add a behavioral or manual verification step for "dark artifact prints readable".

Severity: Major
Scope: §2 Placement table / §4 Sortable-filterable tables (rationale contradiction)
Description: §2 justifies placing the table enhancer in the shared script because it "applies to both genres (dashboards have tables)", but §4 targets `table.doc-table` — a kit-scoped class (`.doc .doc-table`) that exists only inside `.doc` documents. The current `_template.html` contains no `<table>` outside the kit, and §10's own inertness test ("no `.doc-table` → enhancer no-ops") models dashboards as having none. As designed, the enhancer can never fire in a dashboard, contradicting its placement rationale.
Rationale: Either the enhancer belongs in the Document Kit (simplest; drop the shared-script claim), or the design must define a dashboard-side table contract (class/markup that works without `.doc` styling, since `.doc`-scoped CSS no-ops there). Leaving it as-is produces dead shared-script code, a false "applies to both genres" claim in the agent/skill docs, and a misleading inertness test. Resolve the contradiction and make the test assert the real dashboard behavior.

Severity: Major
Scope: §6 Decision genre (routing conflict with design_draft.md §7)
Description: §6 lists "ADR", "decision record", and trade-off analysis as DECISION routing signals, but the existing routing table (design_draft.md §7) routes "spec, RFC, design doc, **ADR**" to `tech-spec`/`product-spec`. No precedence rule disambiguates the overlap; the retained rules ("spec/review framing outranks data presence; ambiguity → report") do not, since both candidates are spec-framed. The roadmap genre got an explicit carve-out for exactly this problem (§7: rollout *section* stays a product spec); the equivalent decision-vs-tech-spec rule is missing.
Rationale: Two competing genre assignments for the same trigger word will produce inconsistent genre selection and flaky agent tests. Add an explicit precedence rule mirroring the roadmap one — e.g. "an ADR/decision record *as the deliverable* → DECISION; a decision-records *section* inside a technical proposal stays tech-spec (kit `.callout.decision`)" — and encode it in the agent routing table and `tests/agent.test.ts`.

Severity: Nit
Scope: §9 Genre count note
Description: "Six genres total (dashboard, report, tech-spec, product-spec, manual, decision, roadmap — seven including dashboard)" is self-contradictory: the parenthetical lists seven names.
Rationale: Count confusion in the section that defines the graduation rule invites test/agent marker mismatches. State "six document genres plus dashboard" and keep dashboard out of the parenthetical list.

Severity: Nit
Scope: §3 Print/PDF mode (`color-adjust: exact`)
Description: `color-adjust` is the obsolete spelling; Chromium and Safari require `-webkit-print-color-adjust` (and the standard `print-color-adjust`).
Rationale: With only the legacy name, tint preservation silently fails in the most common browsers. Specify both `-webkit-print-color-adjust: exact` and `print-color-adjust: exact` in the PRINT-MODE block.

Severity: Nit
Scope: §5 In-document search (overlay behavior)
Description: Focus management is unspecified: no statement that focus moves to the input on open, is trapped within the dialog, or returns to the triggering element on close — despite `role="dialog" aria-modal="true"`.
Rationale: `aria-modal` without focus trapping misleads screen-reader users and leaves keyboard focus outside the dialog. Specify open-focus, trap, and restore-to-trigger in the component contract and the behavioral test.

Severity: Nit
Scope: §4 Sortable/filterable tables (sort control)
Description: Sorting is click-only on `th`; no `tabindex`/`role`/keyboard (Enter/Space) activation is specified, though `aria-sort` is.
Rationale: Keyboard and screen-reader users can see sort state but cannot change it, inconsistent with the kit's otherwise specified aria usage. Add keyboard activation to the enhancer contract and behavioral test.

Severity: Nit
Scope: §10 Tests
Description: The search test bullet names "`IntersectionObserver`-style guards", but search uses no IntersectionObserver — the needed guards are `.doc` existence and keydown/key detection, making the test contract ambiguous. Also untested: `data-sort-default` on-load sorting and print-mode save/restore behavior beyond handler presence.
Rationale: Test contracts should name the actual mechanism being asserted; ambiguous markers let the wrong guard pass the sweep. Spell out the guards and add the two missing behaviors (or explicitly defer print behavior with a rationale).

Severity: Nit
Scope: §8 Release-notes / diff components (`del`/`ins` block rendering)
Description: Block-level `del`/`ins` inside `pre.doc-code` interacts with preserved `pre` newlines: newlines adjacent to block boundaries render as extra blank lines unless markup/CSS neutralizes them, and per-line gutter glyphs still require one `del`/`ins` element per changed line — "no per-line spans required" understates this. The planned check is a static CSS-presence test only.
Rationale: A plausible rendering artifact (doubled blank lines in every diff) that static tests cannot catch. Specify the expected markup pattern (line-per-element, newline placement) and add one behavioral rendering check or a documented authoring rule in the skill.
