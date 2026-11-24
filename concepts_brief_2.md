# Concepts Brief — Additions Batch 1

**Idea:** Next batch of additions to the artifact-forger design system, selected by the operator from a 10-item proposal.

**Date:** 2026-11-24 · **Status:** concepts chosen by operator, ready for draft

## Selected (6)

1. **Print/PDF mode** — `@media print` stylesheet; manuals/specs get printed, dark backgrounds must not.
2. **Sortable/filterable data tables** — client-side sort + filter, inline JS, `file://`-safe.
3. **In-document search** — Ctrl+K palette / TOC filter to jump around long documents.
4. **Decision/comparison genre** — ADR layout: option matrices, pros/cons, scoring, final-decision callout.
5. **Roadmap/timeline genre** — milestones, gantt/phases, per-milestone status and owners.
6. **Release-notes/diff components** — before/after code diffs, migration guides, changelog timeline.

## Not selected this round (deferred)

Reference/API genre · markdown front-matter genre directive · re-bootstrap helper script · gallery + `pi.image` previews.

## Invariants unchanged

Single file, `file://`-safe, pinned CDNs, markdown source of truth, honesty badges, source-of-truth footer, five palettes + light/dark theme sync, self-inert kit scoping contract (all new kit CSS stays `.doc`-scoped, new kit JS stays DOM-guarded), never overwrite project templates.

## Open questions for the draft

- Placement: which new JS is kit-only (doc genre) vs shared (both genres)? Tables and print apply to dashboards too.
- Diff colors without breaking the token-purity rule.
- Do the two new genres (decision, roadmap) stress the genre-in-agent-rules model at 6 total?
