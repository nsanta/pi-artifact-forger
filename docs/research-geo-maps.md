# Research — Geographic maps in artifacts (worldwide)

**Question:** how do we render geographical maps (like Claude's inline SVG maps, but
world-wide) inside self-contained `file://` artifacts, in the style of the Argentina
province-map pipeline (TopoJSON → project → SVG paths → projected markers)?

**Date:** 2026-11-25 · **Status:** research for batch-3 candidate · all sizes/URLs verified live

---

## 1. Three approaches compared

### A. Vector: d3-geo + embedded TopoJSON — **recommended**

Exactly the pipeline the Argentina example uses: project geometry with `d3.geo*`,
render with `d3.geoPath` to SVG paths, place markers by projecting `[lon, lat]`.

- ✅ Fully offline once geometry is embedded — matches the `file://` contract.
- ✅ Any projection: `geoEqualEarth`/`geoNaturalEarth1` (world), `geoMercator`,
  `geoConicConformal` with custom parallels (the standard for Argentina), `geoAlbersUsa`, …
  (`fitSize`/`fitExtent` handles fitting to the stage).
- ✅ Choropleth-ready: region values → color scale from the palette's `series`.
- ✅ Prints perfectly (SVG), theme re-colorable via token vars.
- ⚠️ Geometry must be **embedded inline** — see §2 (fetch is blocked on `file://`).

### B. Slippy tiles: Leaflet / MapLibre — rejected for v1

- Tile servers mean dozens of runtime network requests per map, usage policies,
  and (for most providers) API keys — a different class than our pinned-libraries
  model, and it breaks offline reading.
- Interactive street-level zoom is its only advantage; our use case (project/review
  artifacts) needs country/world overview + markers, not street tiles.

### C. Pre-rendered static SVG/image — rejected

- No projection flexibility, no markers from data, no theme sync; Claude-style
  generation implies computing geometry at generation time, which approach A does
  natively.

## 2. Geometry delivery: fetch is blocked — embed inline

`file://` pages have a `null` origin; Chromium and Firefox block `fetch()`/XHR from
them, and even where a CDN answers `Access-Control-Allow-Origin: *`, relying on it is
against the self-contained contract. **Decision: geometry is embedded in the artifact**
inside `<script type="application/json" id="geo-…">` (no `fetch`, no `eval`), exactly
like the Argentina pipeline ships the simplified provinces with the page.

## 3. Verified building blocks (live sizes, HTTP 200)

| Asset | Pinned URL | Size | License |
|---|---|---|---|
| d3 v7 UMD (includes d3-geo: `geoConicConformal`, `geoPath` verified in bundle) | `cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js` | 279.7 KB | ISC |
| topojson-client UMD (TopoJSON → GeoJSON features) | `cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js` | 7.2 KB | ISC |
| World countries TopoJSON, 110m (overview) | `cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json` | 107.8 KB | ISC (Natural Earth, public domain) |
| World countries TopoJSON, 50m (choropleth-grade, all 193 UN states) | `cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json` | 756.4 KB | same |
| Alternative micro-bundle: `d3-geo@3.1.1` standalone | `cdn.jsdelivr.net/npm/d3-geo@3.1.1/dist/d3-geo.min.js` | 36.3 KB | ISC |
| Argentina departments (IGN/CONAE-derived, GeoJSON+TopoJSON per province + union) | `github.com/mgaitan/departamentos_argentina` → `departamentos-argentina.topojson` | ~1.0 MB unsimplified |IGN-derived public educational data |

Guidance from the world-atlas maintainers: **50m for interactive world maps and every
choropleth** (all UN member states present), 110m only for small overview maps; 10m
for print/deep zoom. Node-based **mapshaper** (`-simplify`, `-filter`, union) is the
preprocessing tool for sub-national sources like the Argentina departments file
(union departments → provinces, drop Antarctica/islands, simplify to a target size)
before embedding.

## 4. Projection presets ("worldwide" done right)

One global preset table (agent-selectable, overridable in the request):

| Scope | Projection | Notes |
|---|---|---|
| World overview | `geoEqualEarth` | equal-area, no polar distortion spikes |
| World (familiar shape) | `geoNaturalEarth1` | pseudocylindrical, balanced |
| Web-style | `geoMercator` | only when explicitly requested |
| South America / Argentina | `geoConicConformal().parallels([-24, -48])` (tune) | the conic conformal is the standard for Argentina (IGN practice) — same as the reference pipeline |
| USA | `geoAlbersUsa` | handles Alaska/Hawaii insets |
| Europe | `geoConicConformal().parallels([40, 60])` | |

Markers: `MAP_POINTS` registry entries (`{ name, lon, lat, value? }`) project through
the **same** projection — the exact mechanism of the reference pipeline.

## 5. Component sketch: `geo-stage`

```html
<script type="application/json" id="geo-world-110m">{ …TopoJSON… }</script>
<div class="geo-stage" data-geo="world" data-object="countries"
     data-projection="equalEarth" data-embed="geo-world-110m">
  <p class="geo-fallback">Map data unavailable.</p>
</div>
```

- Kit (guarded `typeof d3 !== 'undefined'`): reads the embedded JSON, converts with
  `topojson.feature`, picks the projection preset (or an inline
  `data-projection-config`), `fitSize` to the stage, renders region paths + optional
  `topojson.mesh` interior borders + `MAP_POINTS` markers.
- Optional choropleth: `data-value-key` on regions in a `MAP_REGION_VALUES` registry →
  quantize scale over the palette `series`.
- Interaction: hover tooltip (region name + value), d3.zoom pan/zoom (wheel/drag,
  double-click reset), theme re-color on `theme:change`.
- Print-safe (SVG); no runtime network; degrades to the fallback when d3 or the
  embedded JSON is missing (stripped/stale), like every kit component.

## 6. Sizing reality

- A world-overview artifact embedding 110m countries pays ~+108 KB — same order as
  the three.js opt-in; acceptable.
- A 50m choropleth artifact pays ~+756 KB — allowed but the agent should prefer 110m
  unless region detail matters, or cut/simplify (mapshaper) to the region of interest.
- Sub-national detail (e.g. Argentina departments) uses country-specific sources and
  **must** be unioned/simplified before embedding (the reference file is ~1 MB for
  all departments unsimplified).

## 7. Proposed scope for implementation

1. `geo-stage` kit component (world overview + markers + optional choropleth), presets per §4.
2. Snippet registry entries: d3@7.9.0 + topojson-client@3.1.0 (verified URLs).
3. Routing rule: "geographic distribution / where / regions / map" → geo-stage in the
   fitting genre (report/tech-spec/dashboard).
4. Examples: `report-world-presence.html` (world markers + choropleth) and
   `report-argentina-provinces.html` (conic conformal + projected markers, per the
   reference pipeline, with a mapshaper-simplified embed).
5. Docs: user-guide section (pan/zoom, hover, choropleth), README feature row.
