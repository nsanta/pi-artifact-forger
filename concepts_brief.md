# Concepts Brief — Artifact Genre System

**Idea:** When a user asks for a "report," the artifact-forger should not always produce the same dashboard-of-containers format. Some content is prose: documentation, manuals, product specs, tech specs. The design contract needs first-class *document genres* alongside the dashboard.

**Date:** 2026-11-23 · **Status:** concepts chosen by operator, ready for draft

## Chosen concepts (operator selection)

1. **Full genre family (preset 2).** More than dashboard-vs-document: distinct genre presets with their own structure and components — executive report, tech spec, product spec, manual/runbook, (reference/API docs deferred until needed).
2. **Hybrid spec layout (preset 3).** Prose is the spine; charts and diagrams appear as numbered, captioned figures *inside* the prose flow. Spec artifacts carry a metadata header (status, version, owners, date, source-of-truth path).
3. **Prose-first typography foundation (preset 4).** One shared document foundation all genres build on: reading measure, heading hierarchy, callouts, tables, code blocks, figure numbering.
4. **Procedural kit (preset 7).** Step components (numbered, with optional state), checklists, prerequisite/role badges — for manuals, runbooks, SOPs.

## Routing decision (operator selection)

**Auto-detection.** The agent picks the genre from the source content's shape (dense data → dashboard; prose/spec/manual → the matching document genre). The user can always override in the request ("make it a tech spec"). No markdown front-matter directive, no always-ask gate.

## Explicit non-goals (deferred)

- Print/PDF mode (`@media print`) — suggested, not selected.
- Markdown front-matter genre directive — suggested, not selected.
- Reference/API-docs preset — mentioned in the family but not selected; build later if needed.

## Invariants that do not change

- Single self-contained HTML file, works over `file://`, pinned UMD CDNs only.
- The five palettes, light/dark modes, and all theme-sync infrastructure are shared by every genre — a tech spec and a dashboard from the same project look like siblings.
- Markdown is the source of truth; artifacts are projections; honesty badges (`Sample Data`, `Estimates`) and the source-of-truth footer stay.
- The canonical `_template.html` remains the single design contract; bootstrapped copies are never overwritten.

## Open questions for the draft

- How does one canonical template serve dashboard + document genres without becoming an unmaintainable kitchen sink?
- Static code coloring vs. a pinned highlight.js for code blocks?
- Interactive checklists (localStorage over file://) or static-only states in v1?
