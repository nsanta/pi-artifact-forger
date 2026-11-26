# pi-artifact-forger

**Artifact generation system for the [Pi coding agent](https://github.com/earendil-works/pi-coding-agent): turn plans, reports, and data into self-contained, reviewable HTML artifacts — dashboards, specs, manuals, decision records, roadmaps — from one versioned design contract.**

Extracted from `../pi-elephant-goldfish` (which uses it to make EGM plans reviewable) so any project on any machine can forge artifacts with the same design system.

> **User guide:** [`docs/user-guide.md`](docs/user-guide.md) — everything you can ask for, everything artifacts can do, keyboard reference, printing, and maintenance.

## Features

**Generation** — in any pi session, in any project:

- **Genre auto-detection**: dashboard, report, tech spec, product spec, decision (ADR), roadmap, manual — routed from your content's shape, overridable in the request.
- **Ready-made structures**: release notes with version rails and diffs; migration guides with warning callouts.
- **Per-artifact overrides**: five palettes (dusk default), light/dark, diagram look (`classic` / `handDrawn` / `neo`).
- **Honesty by default**: invented data badged `Sample Data`, estimates badged `Estimates`, markdown stays the source of truth.

**Artifacts** — single self-contained HTML files that work over `file://`:

- Five palettes + light/dark with live theme sync across charts (Chart.js 4) and diagrams (Mermaid 11).
- Fit-to-container diagrams with zoom controls, Mermaid source copy, and natural-size SVG export.
- Document genres get a reading layout: sticky table of contents with scrollspy, `Ctrl+K` search, callouts, sortable/filterable tables, numbered figures, spec headers, steps, checklists, prereq chips, pros/cons, before/after diffs, and version rails.
- Print/PDF styling: light values forced per palette, page-break hygiene, interactive chrome hidden.

**Operations**:

- Project bootstrap of the versioned design contract (`contract:artifact-forger v2`); stale templates detected, never edited — upgrade by full re-bootstrap.
- `examples/` — one sample artifact per use case with a navigable [`index`](examples/index.html), regenerable via `npm run make-examples`.

| Piece | Path | Role |
| --- | --- | --- |
| **Design contract** | `resources/artifact-forger/_template.html` | Single-file HTML design system: five palettes (dusk default), light/dark, Chart.js 4 + Mermaid 11 theming, zoom/copy/export diagram controls, and a self-inert Document Kit for prose genres (report, tech-spec, product-spec, manual, decision, roadmap). Versioned (`contract:artifact-forger v2`); never overwritten in target projects — upgrade by full re-bootstrap. |
| **Agent** | `agents/artifact-forger.md` | Zero-context `artifact-forger` subagent (read/grep/write/edit/bash). Delegating generation here keeps the design system out of the main session's context. |
| **Skill** | `skills/artifact-forger/SKILL.md` | Ships with the pi package; trigger rules + inline-generation fallback when the agent isn't installed. |
| **User guide** | `docs/user-guide.md` | Generation phrases, genre reference, artifact features, keyboard shortcuts, printing, maintenance. |
| **Examples** | `examples/` | One sample artifact per use case (dashboard, report, tech-spec, product-spec, manual, decision, roadmap, release notes) — see [`examples/README.md`](examples/README.md). Regenerate with `npm run make-examples`. |

## Install

From the git repository (works today):

```sh
pi install git:github.com/nsanta/pi-artifact-forger
```

Or from a local clone:

```sh
pi install ./pi-artifact-forger
```

An npm package is prepared (`files`, keywords, `pi-package` marker) but **not yet published** — once it is, `pi install npm:pi-artifact-forger` will work.

Development, from a clone:

```sh
git clone <this-repo> && cd pi-artifact-forger
npm install && npm test
```

## Set up the agent (one-time per machine)

### Why this step exists

Pi packages can ship **skills** (the `artifact-forger` skill loads automatically), but **not agents** — pi has no mechanism to install agents from a package. The zero-context `artifact-forger` agent therefore must be copied manually into your user-global agent directory (`~/.pi/agent/agents/`). That is all `npm run install:agent` does.

Skipping it is safe: the skill includes an inline-generation fallback, so artifacts still get generated — just in your main session's context instead of a fresh subagent. Installing the agent keeps the design system out of your session's context.

### Run it from wherever the package lives

Installed with `pi install` (git or npm):

```sh
cd ~/.pi/agent/npm/node_modules/pi-artifact-forger
npm run install:agent        # or: node scripts/install-agent.mjs
```

No `npm install` needed first — the script uses only Node built-ins and no dependencies.

From a dev clone:

```sh
npm run install:agent
```

### What it copies

| Source in the package | Installed to |
| --- | --- |
| `agents/artifact-forger.md` | `~/.pi/agent/agents/artifact-forger.md` |
| `resources/artifact-forger/_template.html` | `~/.pi/agent/artifact-forger/_template.html` |

It also removes legacy `artifact-forge` copies left over from the pre-package setup.

### Re-run after package updates

The script **copies** files, so updating the package (`git pull`, or a fresh `pi install`) does **not** refresh the user-global copies on its own — re-run the script after every update. And never edit the installed copies in place: edit the package source, then re-run.

## Usage

In any pi session, in any project — the full phrase reference lives in the [user guide](docs/user-guide.md):

- *"Make a dashboard of our Q3 cloud spend"* → the session delegates to `artifact-forger`, which bootstraps `artifacts/_template.html` if the project has none, generates `artifacts/<name>.html`, and opens it in your browser. It returns just the path — no design-system context leaks into your session.
- *"Draft a tech spec for the importer"* / *"write up this migration as a runbook"* → the agent auto-detects the genre: dense data → dashboard; work summary → report; proposal → tech-spec / product-spec; decision record → ADR-style decision layout; milestone plan → roadmap; release notes/changelog and migration guides get dedicated structures; procedure → manual. Document genres get a reading layout with TOC, callouts, tables, sortable/filterable tables, `Ctrl+K` search, print-friendly styling, and statically numbered figures; you can always force a genre in the request.
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
