# Concepts Brief — Additions Batch 2 (WebGL + interactive)

**Idea:** Batch 2 of additions — product/code-flavored interactivity, headlined by WebGL support for simulations and 3D POCs.

**Date:** 2026-11-25 · **Status:** concepts chosen by operator, ready for draft

## Selected (8)

1. **WebGL / 3D — FULL scope** (operator chose "Full: + live parameters"):
   - `webgl-stage` component usable inside document genres.
   - A **simulation genre** (Objective → Assumptions & parameters → Interactive 3D view → Observations → Next steps).
   - **What-if parameter panels** wired to drive the 3D scene live.
2. **Code playground** — runnable JS snippets with output panel, sandboxed, per-snippet reset.
3. **Syntax highlighting** — pin highlight.js into the reserved `pre.doc-code` slot.
4. **State-machine simulator** — fire events, track current state, event log.
5. **Dataset explorer** — embedded dataset grid: column toggles, search, numeric summaries.
6. **Graph explorer** — pan/zoom node-link graphs (dependency maps, service topology).
7. **Before/after slider** — draggable divider between two states of a design/screen.
8. **What-if parameter panels** — sliders/toggles that recompute charts, tables, and the 3D scene live (shared with #1).

## Not selected (deferred again)

API reference genre · request/CLI builder · markdown genre directive · re-bootstrap helper · gallery/pi.image · accessibility pass · custom palettes.

## Invariants unchanged

Single file, `file://`-safe, pinned CDNs only, markdown source of truth, honesty badges, five palettes + light/dark theme sync, self-inert kit scoping, never overwrite project templates. New: all interactive systems must degrade gracefully when their library is absent (stripped or stale template).

## Known open design questions

- New CDN libraries are heavy — opt-in tag registry (agent rules) vs resting template inclusion.
- highlight.js needs multi-hue syntax colors — conflicts with the kit hex sweep; needs a documented exception mechanism.
- Playground sandbox: iframe sandbox does NOT block network — honesty in docs required.
- Three.js versions ≥ r150 are ESM-only; UMD requires pinning r147 (last UMD line) — keeps the no-ESM contract.
