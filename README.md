# pi-artifact-forger

**Artifact generation system for the [Pi coding agent](https://github.com/earendil-works/pi-coding-agent): turn plans, reports, and data into self-contained, reviewable HTML artifacts — dashboards, diagrams, visual explainers — from one versioned design contract.**

Extracted from `../pi-elephant-goldfish` (which uses it to make EGM plans reviewable) so any project on any machine can forge artifacts with the same design system.

## What it is

Three pieces:

| Piece | Path | Role |
| --- | --- | --- |
| **Design contract** | `resources/artifact-forger/_template.html` | Single-file HTML design system: five palettes (dusk default), light/dark, Chart.js 4 + Mermaid 11 theming, zoom/copy/export diagram controls, and a self-inert Document Kit for prose genres (report, tech-spec, product-spec, manual). Versioned (`contract:artifact-forger v2`); never overwritten in target projects — upgrade by full re-bootstrap. |
| **Agent** | `agents/artifact-forger.md` | Zero-context `artifact-forger` subagent (read/grep/write/edit/bash). Delegating generation here keeps the ~19 KB design system out of the main session's context. |
| **Skill** | `skills/artifact-forger/SKILL.md` | Ships with the pi package; trigger rules + inline-generation fallback when the agent isn't installed. |

## Install

From a published git repository (owner placeholder until published):

```sh
pi install git:github.com/nsanta/pi-artifact-forger
```

Development, from a clone:

```sh
git clone <this-repo> && cd pi-artifact-forger
npm install && npm test
```

## Set up the agent (one-time per machine)

Pi packages can ship skills but **not agents**, so the agent installs user-global:

```sh
npm run install:agent
```

This copies the agent to `~/.pi/agent/agents/artifact-forger.md`, the canonical template to `~/.pi/agent/artifact-forger/_template.html`, and removes legacy `artifact-forge` copies from the pre-package setup. Re-run it after editing the package sources — never edit the installed copies in place.

## Usage

In any pi session, in any project:

- *"Make a dashboard of our Q3 cloud spend"* → the session delegates to `artifact-forger`, which bootstraps `artifacts/_template.html` if the project has none, generates `artifacts/<name>.html`, and opens it in your browser. It returns just the path — no design-system context leaks into your session.
- *"Draft a tech spec for the importer"* / *"write up this migration as a runbook"* → the agent auto-detects the genre: dense data → dashboard; work summary → report; proposal for review → tech-spec / product-spec; procedure → manual. Document genres get a reading layout with TOC, callouts, tables, and statically numbered figures; you can always force a genre in the request.
- *"Use the nordic palette"* / *"hand-drawn diagram style"* → per-artifact overrides.
- Small tweaks ("add a chart", "change the wording") → edited in place, no delegation.

## Design rules (summary)

- Artifacts must work over `file://`: one HTML file, inline CSS/JS, pinned UMD CDNs (`lucide@0.460.0`, `chart.js@4.4.7`, `mermaid@11.4.1`), never `@latest`.
- Markdown is the source of truth; artifacts are human-facing projections. Plan changes go into markdown first, then the artifact is regenerated — never the reverse.
- Invented data is badged `Sample Data`; estimates are badged `Estimates`.
- Diagram look: `classic` default, `handDrawn` (seeded) for explainers, `neo` for dashboards — same Mermaid source either way.
- The Document Kit is self-inert: its CSS is scoped under `.doc` and its JS no-ops without a `.doc` element, so stripping it from dashboard artifacts is optional. Its marker comments (`GENRE:DASHBOARD STARTER`, `GENRE:DOCUMENT KIT`) are contract-internal — artifacts display them with the `GENRE·…` variant (middle dot).
- Projects with a pre-v2 bootstrapped `_template.html`: generating a document artifact there inline-appends the kit into the artifact (the project template is never edited). Upgrade the template by full re-bootstrap: delete `artifacts/_template.html` and let the agent re-copy the canonical.

## Relationship to pi-elephant-goldfish

`pi-elephant-goldfish` (EGM for pi) adopts this system for plan-review artifacts via a thin `AGENTS.md` trigger that delegates to the agent installed from this package. The Goldfish review mechanism itself is unrelated and lives there — this package only forges artifacts.
