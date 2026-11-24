# Examples

**Start here: [`examples/index.html`](examples/index.html)** — a navigable gallery of all samples.

One sample artifact per use case, each generated from the canonical design contract by
[`scripts/make-examples.mjs`](../scripts/make-examples.mjs) (`npm run make-examples`).
All content is invented and badged accordingly — open them over `file://` and try the
palette/mode pickers, table sort/filter, `Ctrl+K` search, diagram zoom, and print preview.

| File | Use case | What it demonstrates |
|---|---|---|
| `dashboard-quarterly-spend.html` | Dashboard | KPI row, Chart.js card, Mermaid card with zoom/copy/export |
| `report-sprint-42.html` | Report | TL;DR hero, metrics strip, findings with figure + table, appendix |
| `tech-spec-importer-service.html` | Tech spec | Spec header, decision callout, sortable/filterable table, steps, diff-pair |
| `product-spec-onboarding.html` | Product spec | Personas, `handDrawn` UX flow figure, success-metric line chart |
| `manual-importer-runbook.html` | Manual/runbook | Prereq chips, warning callout, steps with states, checklists, troubleshooting table |
| `decision-queue-vendor.html` | Decision (ADR) | Pros/cons pairs, comparison matrix with `Estimates` badge, decision callout, revisit conditions |
| `roadmap-platform-2027h1.html` | Roadmap | Mermaid gantt figure, milestone rail with status + owners, roadmap changelog |
| `release-notes-importer-0.3.0.html` | Release notes | Added/Changed/Fixed/Removed changelog rail, upgrade steps, before/after diff |

Regenerate after editing the canonical template: `npm run make-examples`.
