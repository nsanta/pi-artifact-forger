# Design Draft — Batch 3: Geographic maps (geo-stage)

**Source:** `docs/research-geo-maps.md` · **Status:** draft for Goldfish review · **Date:** 2026-11-25

## 1. Scope

A `geo-stage` kit component rendering worldwide geographical maps as inline SVG — the
Claude-style pipeline: embedded TopoJSON → `topojson.feature` → `d3.geoPath` with a
projection preset → SVG region paths, plus lat/lon markers projected through the same
projection, and an optional choropleth mode. Sub-national geometry (provinces,
departments, states) is supported via an agent-side mapshaper preprocessing pipeline;
the artifact always embeds the (simplified) geometry inline.

Non-goals: slippy tiles (Leaflet/MapLibre), 2D canvas stage, interactive drawing.

## 2. Library policy — snippet registry additions (verified 200 at design time)

| Library | Tag (exact string) | Size | Global | Enables |
|---|---|---|---|---|
| d3-array (d3-geo runtime dependency — Adder; load BEFORE d3-geo) | `https://cdn.jsdelivr.net/npm/d3-array@3.2.4/dist/d3-array.min.js` | 17.2 KB | `d3` (extends global namespace) | geo-stage |
| d3-geo standalone (projections + geoPath; kit pan/zoom is vanilla — no full-d3 bundle, per approved M1) | `https://cdn.jsdelivr.net/npm/d3-geo@3.1.1/dist/d3-geo.min.js` | 36.3 KB | `d3` (extends global namespace) | geo-stage |
| topojson-client | `https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js` | 7.2 KB | `topojson` | TopoJSON decode |

Full d3 (not the 36 KB d3-geo micro-bundle) because artifacts also use d3 selections,
scales and zoom for the choropleth — one tag, one API surface. Kit guards:
`typeof d3 !== 'undefined' && typeof topojson !== 'undefined'`, else the
`.geo-fallback` message renders (stripped kit / stale template / offline behave
identically).

## 3. Geometry delivery and resolution policy

- Geometry is **embedded inline** via `<script type="application/json" id="geo-…">` —
  `file://` pages cannot `fetch()` (null origin, verified MDN + Chromium behavior), and
  embedding honors the self-contained contract.
- **Resolution is the agent's decision**, per rule: **110m** (107.8 KB, world overview,
  markers) by default; **50m** (756.4 KB, all 193 UN states, choropleth-grade) when the
  artifact is a regional choropleth or needs sub-state detail; sub-national geometry
  comes from country sources and is **preprocessed with mapshaper before embedding**
  (union → filter → `-simplify` to a byte target). Snippet-registry guidance states the
  rule; the artifact never fetches at runtime.

## 4. Data sources

| Source | Geometry | License |
|---|---|---|
| `world-atlas@2.0.2` (Natural Earth derived) | world countries/land, 10m/50m/110m TopoJSON | ISC over public-domain Natural Earth |
| `us-atlas@2` | US states/counties TopoJSON | ISC |
| `mgaitan/departamentos_argentina` (IGN/CONAE-derived) | Argentina provinces/departments | public educational data (source attribution required) |

New country packs follow the same pattern: public source → mapshaper preprocess →
embed → document in the snippet registry section.

## 5. Component contract

Markup:

```html
<script type="application/json" id="geo-world">{ …TopoJSON… }</script>
<div class="geo-stage" data-geo="world" data-object="countries"
     data-projection="equalEarth" data-embed="geo-world"
     data-values="REGION_VALUES" data-points="MAP_POINTS">
  <p class="geo-fallback">Map data unavailable.</p>
</div>
```

Kit runtime (`initGeoStages()`, `.doc`-guarded, guarded on `d3`/`topojson`):

1. Parse the embedded JSON (`JSON.parse(el.textContent)` of the `data-embed` script);
   missing JSON/script → fallback message.
2. Convert: `topojson.feature(topo, topo.objects[data-object])` (default object
   `countries`).
3. Projection from the preset table (`data-projection`): `equalEarth` (default),
   `naturalEarth1`, `mercator`, `conicConformal` (parallels via
   `data-parallels="-24,-48"`), `albersUsa`; unknown name → `equalEarth`.
   `projection.fitSize([w, h], features)` fits the stage.
4. Render SVG: region paths (`fill: var(--surface-muted)`, `stroke: var(--border)`),
   interior borders via `topojson.mesh`, then markers.
5. **Choropleth:** if the registry named in `data-values` maps region ids/names to
   numbers, a quantize scale over those values maps to the palette `series[0..4]`
   (interpolated between adjacent series colors); legend strip rendered top-right with
   min/max labels.
6. **Markers:** entries of the registry named in `data-points`
   (`{ name, lon, lat, value? }`) project to circles (`r = 4 + 2×norm(value)` when
   values present) with tooltips.
7. Interaction: hover tooltip (region/point name + value), pan/zoom via `d3.zoom`
   (wheel/drag; double-click resets; `aria-label` on the svg).
8. Theme: `theme:change` re-colors paths/markers/legend.
9. Print-safe (SVG); fallback when `d3`/`topojson`/JSON missing.

Registries (`REGION_VALUES`, `MAP_POINTS`) are agent-authored in the artifact, same
pattern as `WEBGL_SCENES`/`GRAPHS`/`SM_SIMS`.

## 6. Projection presets

| `data-projection` | d3 call | Use |
|---|---|---|
| `equalEarth` (default) | `d3.geoEqualEarth()` | world overview |
| `naturalEarth1` | `d3.geoNaturalEarth1()` | world, familiar shape |
| `mercator` | `d3.geoMercator()` | explicit requests only |
| `conicConformal` | `d3.geoConicConformal().parallels([…])` | Argentina `[-24, -48]` (IGN standard, per reference pipeline), Europe `[40, 60]` |
| `albersUsa` | `d3.geoAlbersUsa()` | USA |

## 7. Agent + skill contract updates

1. Snippet registry gains the two tags (§2) with "add only when the artifact embeds a
   geo-stage".
2. Routing rule: "geographic distribution / where / regions / map of …" → include a
   `geo-stage` figure in the fitting genre (report/tech-spec/dashboard) — selection
   rule gains: geographic data → geo-stage (vs mermaid for non-geographic flows).
3. Resolution rule (§3) + sub-national mapshaper pipeline guidance
   (`npx mapshaper source.json -union -filter-… -simplify visvalingam=0.1 -o fmt=topojson out.json` shape) with the source table.
4. Honesty: region values are data → real values or `Sample Data` badge; markers need
   real coordinates (city/country centroids are fine, no invented lat/lon).

## 8. Tests

- Contract: kit markers (`.geo-stage`, `.geo-fallback`, `initGeoStages` guarded
  `typeof d3`/`typeof topojson`, projection preset names); agent registry tags;
  resolution-rule and mapshaper markers; hex sweep unchanged (choropleth uses series
  vars, no new hexes).
- Behavioral: preset table lookup (unknown → equalEarth); choropleth quantize maps
  values → series indices; summary/tooltip structures build from fixture JSON with a
  tiny fake projection (no d3 in happy-dom — guard paths verified: no d3 → fallback).

## 9. Examples

- `report-world-presence.html` — report genre: world map (110m embed), markers for
  presence cities/regions, choropleth of a sample metric (`Sample Data` badge).
- Generator: fetches `world-atlas` 110m at build time and embeds it (network needed on
  the dev machine only); caches to `examples/.geo-cache/` so regeneration is offline
  after the first run.

## 10. Risks

- 110m embed adds ~108 KB to that example — accepted (one artifact).
- d3 zoom + the fit system: the geo svg is not a mermaid svg; it sizes to the stage box
  directly (no fit-zoom interaction) — ResizeObserver not needed; zoom transform is
  internal to the svg.
- Projection preset tuning (Argentina parallels) is best-effort in v1; adjustable via
  `data-parallels` without code changes.
- Sub-national packs depend on third-party public data availability per country —
  agent documents source + attribution per artifact.
