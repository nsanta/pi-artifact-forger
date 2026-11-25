# User guide

Everything you can ask for and everything you get. This guide covers the
package as of v0.3.0 (contract `artifact-forger v2`).

---

## 1. Generating artifacts

Open a pi session in any project and describe what you want in plain language.
The session delegates to the `artifact-forger` agent (or falls back to the
bundled skill when the agent is not installed), bootstraps the project's
`artifacts/_template.html` if needed, writes `artifacts/<name>.html`, opens it
in your browser, and returns only the path plus a one-line summary — the design
system never enters your session's context.

### Genre auto-detection

You do not need to name a genre. The agent reads the content's shape:

| Your content looks like… | Genre you get |
|---|---|
| KPIs, time series, comparisons, monitoring views | **Dashboard** |
| A summary of work or events mixing prose and data | **Report** |
| A proposal, design, or contract under review (technical framing) | **Tech spec** |
| A proposal framed around users, problem, and solution | **Product spec** |
| A decision record as the deliverable (ADR, trade-off analysis, "compare options") | **Decision** |
| A milestone or phase plan as the main deliverable | **Roadmap** |
| A procedure to follow (manual, runbook, how-to, SOP) | **Manual** |

Precedence rules, in order:

1. An explicit override in your request always wins ("make it a tech spec",
   "as a runbook", "como manual").
2. Spec/review framing outranks data presence — a proposal with a success-
   metrics section is a spec, not a report.
3. Special cases: a decision-records *section* inside a proposal stays a tech
   spec; a rollout *section* inside a product spec stays a product spec; a
   decision record only becomes the **Decision** genre when it is the
   deliverable itself.
4. Ambiguity: a prose spine with any data → report. Prose is never forced
   onto a dashboard layout.

Two ready-made structures ride on other genres: **release notes / changelogs**
(rendered with a version rail and before/after diffs inside the report genre)
and **migration guides** (manual genre with warning callouts and diffs).

### Per-artifact overrides

- Palette: *"use the nordic palette"* — five palettes: dusk (default),
  editorial, nordic, okabe-ito, botanical.
- Mode: *"dark mode"*, *"light mode"* — default is light.
- Diagram look: `classic` (default), `handDrawn` for explainers, `neo` for
  dashboards — same Mermaid source either way.
- Genre: always overridable, per the precedence rules above.

### Honesty rules

Real data from your task is used as-is. Invented data is badged `Sample Data`
in the header; estimates carry an `Estimates` badge. Artifacts that present a
plan or spec end with: *"Markdown remains the source of truth — this artifact
is a projection for review."*

### Project bootstrap and the template contract

The first artifact in a project copies the canonical template to
`artifacts/_template.html`. That file is the versioned design contract — it is
never edited by the agent, and it carries a version marker
(`contract:artifact-forger v2`).

- If your project's copy predates the marker (stale), document-genre artifacts
  still work: the agent embeds the current kit into the generated artifact and
  tells you the template is stale.
- Upgrading the project template is a **full re-bootstrap**: delete
  `artifacts/_template.html`, generate again, and the agent re-copies the
  canonical. Never patch it in place.

---

## 2. Using artifacts

Artifacts are single self-contained HTML files. Double-click them, open them
from your browser, or share them — everything (styles, scripts, fonts via CDN,
icons) is inline or pinned; no server, no build, no dependencies on the
project.

### Theming

Every artifact carries the palette selector and a light/dark toggle in its
header. Your choice persists in the browser (localStorage) per artifact origin.
All charts and diagrams re-theme live — switching palette or mode never
requires a reload.

### Diagrams

- Diagrams start **fit to their container** — small and wide diagrams fill the
  stage; oversized ones scale down to fit entirely.
- **Zoom out / 100% / Zoom in** buttons sit on each diagram card; 100% always
  means fit-to-container. When zoomed past the container, the stage scrolls.
- **Copy** copies the Mermaid source; **SVG** downloads the diagram at its
  natural size regardless of on-screen zoom.

### Document reading layout

Document genres (report, tech-spec, product-spec, manual, decision, roadmap)
use a reading layout instead of cards:

- Sticky **table of contents** on the left (a plain block on narrow screens),
  built from headings with active-section highlighting.
- A ~72-character reading column with the genre's structure and components.
- **Figures** are numbered and captioned by the generator ("Fig. 1 — …") and
  the numbering is validated.

### Search

Press `Ctrl+K` (or `Cmd+K`), or `/` when no input is focused:

- Type to search headings and section text; heading matches rank first.
- `↑` / `↓` to move, `Enter` to jump, `Esc` or click the backdrop to close.
- Focus returns to where you were when you opened it.

### Tables

- Click a column header — or focus it and press `Enter` / `Space` — to sort.
  Click again to reverse. Numeric columns sort numerically; `aria-sort` keeps
  it screen-reader friendly.
- Tables marked filterable get a **filter box** that hides non-matching rows
  as you type.

### Maps

Artifacts with geographic data embed a real **vector map** (world-atlas countries, Natural Earth data) rendered with d3-geo projections:

- **Choropleth**: countries colored by value on a five-step scale from the artifact's palette; a legend shows the value bins.
- **Markers**: cities or points of interest placed by real latitude/longitude.
- **Hover** any region or marker for its name and value; **scroll** to zoom, **drag** to pan, **double-click** to reset the view.
- An accessible **data table** (collapsed below the map) lists every region and marker with its value.

Map geometry is embedded in the artifact — maps render offline like everything else.

### Components you will see

| Component | Where |
|---|---|
| Callouts (note / warning / decision / danger) | All document genres |
| Spec header (Status, Version, Owners, Date, Source) | Tech spec, product spec, decision |
| Numbered steps with states (done / current / pending) | Manual, roadmaps |
| Checklists | Manuals, milestones |
| Prerequisite chips | Manuals |
| Pros/cons pairs | Decision records |
| Comparison / data tables | Everywhere |
| Before/after diff pairs | Interface changes, migrations, release notes |
| Version rail (changelog) | Release notes, roadmaps |
| Milestone rail with status and owners | Roadmaps |
| Geographic maps (choropleth + markers) | Any genre with geographic data |

Checkboxes are deliberately **not** persisted — reloading resets them, so a
runbook never shows stale completion state.

### Printing / PDF

Use the browser's Print dialog directly. Print output:

- Forces your palette's **light values** regardless of the on-screen mode
  (synchronous, snapshot-safe).
- Hides interactive chrome (buttons, filters, search) and flattens the layout
  to a single column.
- Avoids breaking figures, callouts, tables, steps, and spec headers across
  pages.

Tip: artifacts are generated in light mode by default, so printing usually
"just works". If you toggled dark and need light diagrams on paper, toggle
light before printing (dark diagrams may keep their on-screen colors if the
re-render races the print snapshot).

### Keyboard reference

| Keys | Context | Action |
|---|---|---|
| `Ctrl+K` / `Cmd+K` | Document artifacts | Open search |
| `/` | No input focused | Open search |
| `↑` / `↓` | Search results open | Move selection |
| `Enter` | Search result selected | Jump to section |
| `Esc` | Search open | Close, restore focus |
| `Tab` | Search open | Cycle within the panel |
| `Enter` / `Space` | Table header focused | Sort by that column |

---

## 3. Genre reference

Each genre's structure, with the shipped example that demonstrates it:

| Genre | Structure | Example |
|---|---|---|
| Dashboard | KPI row · chart card · diagram card | `dashboard-quarterly-spend.html` |
| Report | TL;DR hero · metrics strip · findings · appendix | `report-sprint-42.html` |
| Tech spec | Spec header · overview · goals · architecture (figure) · data model · rollout · interface changes (diff) | `tech-spec-importer-service.html` |
| Product spec | Spec header · problem · users · solution · UX flow (`handDrawn`) · success metrics (chart) · rollout | `product-spec-onboarding.html` |
| Manual | Audience · prerequisites · steps · verification · troubleshooting · glossary | `manual-importer-runbook.html` |
| Decision | Spec header · context · options with pros/cons · comparison matrix · decision · consequences · revisit conditions | `decision-queue-vendor.html` |
| Roadmap | Header meta · timeline (gantt) · milestone rail · dependencies & risks · roadmap changelog | `roadmap-platform-2027h1.html` |
| Release notes | Summary · Added/Changed/Fixed/Removed rail · upgrade steps · notable diff | `release-notes-importer-0.3.0.html` |

Open `examples/index.html` to browse them all with live palette/mode controls.

---

## 4. Maintaining

| Task | Command / action |
|---|---|
| Run the test suite | `npm test` |
| (Re)install the agent + canonical template | `npm run install:agent` |
| Regenerate `examples/` from the template | `npm run make-examples` |
| Upgrade a project's design contract | Delete `artifacts/_template.html`, generate an artifact, let the agent re-copy the canonical |

Where things live after `npm run install:agent`:

- Agent: `~/.pi/agent/agents/artifact-forger.md`
- Canonical template: `~/.pi/agent/artifact-forger/_template.html`
- Everything else stays in the package (skill ships with pi packages; examples
  and design docs live in the repository).
