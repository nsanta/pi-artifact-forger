# Changelog

All notable changes to this project are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-11-24

### Added

- Document genres: prose documents (report, tech-spec, product-spec, manual) alongside dashboards, with reading layout, table of contents, callouts, step/checklist blocks, and statically numbered figures.
- Self-inert Document Kit inside the canonical `_template.html` (contract `artifact-forger v2`): CSS scoped under `.doc`, DOM-guarded JS — stripping it from dashboard artifacts is optional, never correctness-bearing.
- Genre auto-detection routing in the `artifact-forger` agent (dense data → dashboard; summary → report; proposal → spec; procedure → manual), with explicit genre override.
- Behavioral test suite for the Document Kit (happy-dom).
- Fit-to-container baseline for diagram zoom: `100%` adapts to the diagram's measured size; user zoom is a fit-relative multiplier (fixes Mermaid SVGs collapsing to 300×150 inside flex wrappers).

### Changed

- Template upgrades are a full re-bootstrap of `artifacts/_template.html` (version marker `contract:artifact-forger v2`), never surgical edits of bootstrapped copies.
- `checklist` blocks do not persist checked state (no localStorage) in v1 — stale checkmarks would mislead runbook users.

## [0.1.0] - 2026-11-23

### Added

- Initial package: single-file HTML design contract (`resources/artifact-forger/_template.html`, five palettes, light/dark, Chart.js 4 + Mermaid 11 theming, zoom/copy/export diagram controls), zero-context `artifact-forger` subagent, `artifact-forger` skill with trigger rules and inline-generation fallback, user-global agent installer (`npm run install:agent`), and the package manifest test suite.
