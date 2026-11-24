# Design Draft — Artifact Genre System

**Source:** `concepts_brief.md` · **Status:** draft for Goldfish review · **Date:** 2026-11-23

## 1. Problem and goals

Every artifact-forger output is a dashboard of cards. When the source content is prose — a product spec, a tech spec, a manual, an executive report — the card-grid layout fights the content: no reading column, no table of contents, no place for long text, no spec metadata.

**Goals**

- A shared **document foundation** (layout + typography + components) used by all prose genres.
- **Genre presets**: `report`, `tech-spec`, `product-spec`, `manual` — each with a defined structure and genre-specific components.
- **Hybrid spec capability**: prose spine with numbered, captioned figures (charts/diagrams) inline, plus a spec metadata header.
- **Procedural kit**: steps with state, checklists, prerequisite/role badges.
- **Auto-detection routing** in the agent: content shape picks the genre; user override always wins.

**Non-goals (deferred)**: print/PDF mode; markdown front-matter genre directive; reference/API-docs preset.

## 2. Architecture: one contract, two layout modes

**Decision:** the canonical `_template.html` stays the single bootstrap target. It gains two things: a contract **version marker** in the head (`<!-- contract:artifact-forger v2 -->`) and a self-contained **Document Kit** block. The dashboard starter gets a matching delimiter pair, so both layout regions are machine-findable and testable:

```text
_template.html
├── <!-- contract:artifact-forger v2 -->            ← staleness marker agents can detect
├── <!-- GENRE:DASHBOARD STARTER --> … <!-- /GENRE:DASHBOARD STARTER -->   ← existing demo, now delimited
└── <!-- GENRE:DOCUMENT KIT --> … <!-- /GENRE:DOCUMENT KIT -->
    ├── document CSS — every rule scoped under the `.doc` container class (no bare element selectors)
    └── document JS — no-ops unless a `.doc` element exists (DOM-guarded)
```

**Inertness contract (review resolution F1):** the kit is *self-inert*. All document CSS is scoped under `.doc`; kit JS checks for a `.doc` element before doing anything. Because of this, stripping the kit from dashboard artifacts is an **optional byte-saving**, never a required step — a forgotten strip cannot break a dashboard. Agents may still strip regions to keep files small, but correctness never depends on it.

**Marker collision rule (F4):** the four marker strings are contract-internal. Artifacts whose content documents this design system must display markers via the documented display variant (`GENRE·DOCUMENT KIT`, middle dot) so a literal search-and-cut never amputates valid content. Template tests assert each marker pair occurs exactly once.

**Stale-template fallback (F6):** if a project's bootstrapped `artifacts/_template.html` predates the kit (no `contract:artifact-forger v2` marker), the agent must not edit it. When generating a document artifact there, the agent reads the canonical installed template, **inline-appends the kit block into the generated artifact**, and reports the staleness in its return summary. The protected file stays untouched; upgrade to the template is a user-driven full re-bootstrap (delete + re-copy the canonical), never a surgical in-place edit (F2).

- Alternative rejected: two canonical templates (`_template-dashboard.html`, `_template-document.html`) — cleaner separation but changes the bootstrap contract, doubles migration surface, and complicates "never overwrite" semantics for existing projects.

## 3. Shared invariants (unchanged)

Single file, `file://`-safe, pinned UMD CDNs (`lucide@0.460.0`, `chart.js@4.4.7`, `mermaid@11.4.1`), five palettes + light/dark with theme sync, honesty badges, source-of-truth footer, kebab-case filename, markdown-as-source-of-truth. All existing tests keep passing; new markers get new tests.

## 4. Document foundation (layout + typography + components)

### 4.1 Layout

- Grid: `TOC sidebar (220px, sticky, hidden < 1024px) | reading column` with reading measure `max-width: 46rem` (~72ch), generous vertical rhythm.
- Header: project label + artifact title + genre badge (e.g. `TECH SPEC`) + palette/mode pickers (same as dashboard) — one visual system across genres.
- Footer unchanged (source-of-truth line).

### 4.2 Typography (prose-first)

- Built with the template's existing **Tailwind utility vocabulary** (arbitrary values where precision is needed), extended by a handful of `.doc`-scoped rules — not a parallel px-scale system. Body text **15px / 1.75** for long-form readability; scale: display 28/34 semibold, h1 22/28, h2 17/24, h3 14/20, small 12. Inter body; JetBrains Mono for code, IDs, version numbers (`tabular-nums`).

### 4.3 Components (all genres)

| Component | Markup contract | Notes |
|---|---|---|
| Callout | `.callout.note/.warning/.decision/.danger` with lucide icon | `decision` records a decided choice with rationale |
| Data table | `.doc-table` styled `table` | zebra-free, border-only, `tabular-nums` on numeric cells |
| Code block | `pre.doc-code` | static, **no highlighter library** in v1, no token-emphasis markup; JetBrains Mono, muted bg. The `pre.doc-code` contract keeps a highlighter slot open for later without breaking artifacts |
| Figure | `figure.doc-figure` with `figcaption` | **static numbering authored by the agent** (`Fig. 3 — caption`); JS only validates the sequence and warns on gaps/repeats (F8). Body: `.diagram-stage` (mermaid, with zoom/copy/export) or Chart.js canvas — both reuse existing theme sync |
| Badge | `.badge` variants | reused from dashboard header for status/genre |
| Spec header | `.spec-meta` grid | Status (Draft/Review/Approved), Version, Owners, Date, **Source** (relative path to the markdown SoT) |

### 4.4 TOC

- JS builds the TOC from `h2`/`h3` (slugified ids), sticky, active section highlighted via `IntersectionObserver` scrollspy. Collapses to a `<details>` block under 1024px.

## 5. Genre presets

Each preset = agent-side structure guidance (sections + which components to use). The template ships the foundation; **presets live in the agent/skill rules, not as separate template code** — structure is content, not CSS.

| Genre | Badge | Structure | Genre-specific components |
|---|---|---|---|
| `report` | REPORT | TL;DR hero → Key metrics strip → Findings (h2 per finding, prose + figures) → Appendix | metrics strip (3–5 KPI tiles, reused card styling); figures inline |
| `tech-spec` | TECH SPEC | Spec header → Overview → Goals / Non-goals → Architecture (mermaid figure) → Interfaces/API (code + tables) → Data model → Risks & open questions → Decision records (callouts) → Milestones | spec header mandatory; decision-record callouts |
| `product-spec` | PRODUCT SPEC | Spec header → Problem → Users/personas → Solution → UX flows (mermaid `handDrawn`) → Success metrics (chart) → Rollout plan | personas as definition lists; metrics chart |
| `manual` | MANUAL | Title + audience line → Prerequisites box (kit) → Steps (kit) → Verification → Troubleshooting (table) → Glossary | procedural kit throughout |

## 6. Procedural kit (manual/runbook)

- **Step**: `ol.steps` → each `li` = numbered circle + step title + body; optional state class `is-done` / `is-current` / `is-pending` (**static, agent-set**).
- **Checklist**: `ul.checklist` with real `<input type="checkbox">`; **no persistence in v1** (resolution F3) — state resets on reload; a checkbox that remembers across regenerations can mislead a user mid-runbook. Content-hash persistence deferred until a real need is demonstrated.
- **Prerequisite badge**: `.prereq` chips with lucide icon (`terminal`, `key-round`, `user`), grouped in the Prerequisites box.
- All kit components inherit theme tokens; no hardcoded colors.

## 7. Auto-detection routing (agent + skill)

Signals, in priority order:

1. **Explicit override** in the request ("como tech spec", "as a runbook") — wins always.
2. **Task/source shape** (within this tier, **spec/review framing outranks data presence**: a proposal with a success-metrics section is a spec, not a report):
   - Dense data: KPIs, time series, comparisons, monitoring → `dashboard`.
   - Summary of work/events with mixed prose+data → `report`.
   - Proposal/design/contract for review ("spec", RFC, design doc, ADR) → `tech-spec` (technical) or `product-spec` (users/problem/solution framing).
   - Procedure to follow ("manual", runbook, how-to, guía, SOP) → `manual`.
3. **Ambiguity rule**: prose spine with any data → `report`; never force dashboard onto prose.

The decision table lives in `agents/artifact-forger.md` §2 as the **single source of truth**; `skills/artifact-forger/SKILL.md` mirrors it only compactly and points to the agent file. The agent states the chosen genre in its one-line return summary, so the delegator can redirect cheaply.

## 8. Tests and migration

- `tests/template.test.ts` contract tests: version marker present; each marker pair (`GENRE:DASHBOARD STARTER`, `GENRE:DOCUMENT KIT`) occurs **exactly once**; kit CSS is `.doc`-scoped (no bare element selectors inside the kit block); kit JS is DOM-guarded (references `.doc` existence check before side effects); all existing markers still pass; pinned CDNs unchanged.
- `tests/agent.test.ts`: routing markers in the agent file (genre names, override-wins, tie-break rule, ambiguity rule, stale-template fallback, static figure numbering, checklist without persistence); skill mirror points to the agent file as source of truth.
- **Behavioral tests (F7)**: add `happy-dom` to vitest; extract the kit script between markers and run it against sample document markup: TOC builds from `h2`/`h3` with slugified ids, figure validator accepts sequential static numbers and warns on gaps, kit JS no-ops when no `.doc` element exists (dashboard inertness), scrollspy guarded when `IntersectionObserver` is absent.
- **Migration**: existing artifacts are dashboards by intent and keep working — no patch script. Existing bootstrapped `_template.html` copies become stale by design; the sanctioned upgrade is a user-driven **full re-bootstrap** (delete + re-copy canonical), documented in the README. Agents never surgically edit a bootstrapped template (F2) and use the inline-append fallback (F6) for document artifacts in stale projects.

## 9. Resolved from review / remaining open questions

**Resolved by review (F1–F8)**: kit inertness mechanism (self-inert `.doc` scoping + DOM guard, stripping optional); migration path (full re-bootstrap + version marker, never surgical edits); checklist persistence (dropped in v1); marker collision (display variant + exactly-once tests); dashboard starter delimiters; stale-template fallback (inline-append into the generated artifact); behavioral test strategy (happy-dom); figure references (static agent-authored numbers, JS validates).

**Still open for reviewers/implementers**:

- Template growth (~8–10 KB) — accepted, but watch that the kit stays genuinely inert if later edits loosen `.doc` scoping.
- A pinned `highlight.js@11` may slot into `pre.doc-code` later — deferred until a real spec artifact needs it.
- Does genre-in-agent-rules (not template) hold up when a fifth genre arrives, or do presets eventually need template representation?
