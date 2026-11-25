# Goldfish Review Report

- Target: /home/nicolas/projects/pi-artifact-forger/design_draft_4.md
- Range: full file
- Mode: review
- Date: 2026-11-25T19:43:33.272Z
- Reviewers:
  - zoom_out (ok)
  - design_critic (ok)

## zoom_out (ok)

Severity: Major
Scope: §2 Library policy — snippet registry additions
Description: The design pins the full d3 bundle (279.7 KB) over the d3-geo micro-bundle (36.3 KB, verified in the source research), justifying it with "artifacts also use d3 selections, scales and zoom for the choropleth." That justification is circular: the only d3 consumer is the geo-stage runtime itself. No other stage uses d3 (charts = Chart.js, diagrams = Mermaid, graphs = cytoscape, kit runtime = vanilla DOM JS). All five projection presets (equalEarth, naturalEarth1, mercator, conicConformal, albersUsa) live in core d3-geo.
Rationale: This is an ~8x per-artifact byte cost (~243 KB extra per geo artifact) adopted to reuse convenience APIs (selections, quantize scale, d3.zoom) inside a runtime layer that, everywhere else in the kit, deliberately uses vanilla DOM. The project already litigated tens of KB in prior batches (batch-2 review nit on ~20–25 KB kit growth). Either justify full d3 against a concrete second consumer (none is named), or spec the micro-bundle plus the kit's established vanilla selection/scale patterns and accept that pan/zoom is ~30 lines of wheel/drag (or defer zoom, since `fitSize` already fits the region to the stage — zoom mainly pays off for dense sub-national maps, which per the next finding are not shipping in this batch).

Severity: Major
Scope: §1 Scope / §3–§4 geometry pipeline / §6 presets / §7.3 agent rules vs §9 Examples
Description: The design commits sub-national support end to end — us-atlas and Argentina sources (§4), the mapshaper preprocess pipeline written into agent rules (§7.3), an Argentina-specific conic preset (§6) — but §9 ships only `report-world-presence.html`, and §8 covers the mapshaper path with a doc-marker check only, no behavioral test. The source research's proposed scope included `report-argentina-provinces.html`; the draft drops it without a word in Non-goals.
Rationale: This is speculative infrastructure with no consumer: the pipeline guidance, byte targets, and preset tuning will be untested prose until some future artifact exercises it, and the first real sub-national artifact may invalidate the assumptions being codified now. YAGNI cuts one of two ways, and the draft must choose explicitly: keep the Argentina example (it validates the pipeline this design insists on), or defer the whole sub-national track (§4 country packs, mapshaper guidance, conic parallels) to a later batch and shrink the agent-facing rules accordingly. Silent scope drift between the research and the draft is exactly what reviews exist to catch.

Severity: Nit
Scope: §9 Examples — Generator
Description: "Generator: fetches world-atlas 110m at build time and embeds it; caches to `examples/.geo-cache/`" names no owning component. Nothing in `scripts/` fetches remote data today; `make-examples.mjs` generates artifacts from inline strings.
Rationale: A new network-fetching, caching build step is an architectural addition (new dependency of the example pipeline on network + a new cache directory) hidden in a one-line example note. Name the component (extend `make-examples.mjs` vs a new script), and state what happens when the cache is absent and the network is down (fail the generation, or skip the example) — otherwise the repo gains an undocumented build-time network dependency.

## design_critic (ok)

Severity: Blocker
Scope: §4 Data sources + §6 Projection presets (us-atlas / `albersUsa`)
Description: The pipeline in §5 always applies a projection preset (`data-projection` → `d3.geo*()` + `fitSize`) to embedded TopoJSON, but `us-atlas` states/counties are **pre-projected** (coordinates already transformed by `d3.geoAlbersUsa` to planar space with quantization). Rendering that data through the `albersUsa` preset double-projects the geometry, producing a broken/blank map; there is also no identity/no-projection path in the preset table for such sources.
Rationale: `us-atlas` is a first-class listed source, so the core pipeline as specified cannot render one of the design's own use cases. Add an explicit rule: pre-projected sources (us-atlas, and any pack preprocessed to planar coordinates) require a `geoIdentity`/null-transform preset with `fitExtent`, and the contract must state per source whether coordinates are geographic (lon/lat) or planar.

Severity: Major
Scope: §3 Resolution policy + §5 step 3 + §6 (`conicConformal`, regional choropleth)
Description: The design's "regional choropleth" use case has no feature-filtering or fit-to-subset policy. `projection.fitSize([w, h], features)` is specified against the full feature collection, so a "Europe" or "Argentina" map would fit **all** world features (including Antarctica, which is garbage under conic conformal) into the stage, and the 50m embed "all 193 UN states" would still render the whole world.
Rationale: Regional maps are a stated primary scenario (§3, §6 Europe/Argentina presets). Specify region subsetting (filter features by id/name list, fit to the subset) and whether off-region features are hidden, stroked as context, or omitted; otherwise the presets in §6 are unusable as written.

Severity: Major
Scope: §5 step 6 (Markers) + §6 (`albersUsa`, `mercator`, `conicConformal`)
Description: No null/undefined projection guard for markers. `d3.geoAlbersUsa` returns `null` for coordinates outside the US; `mercator` and `conicConformal` clip points far outside their extent. Projected marker coordinates can be `null`/NaN and produce invisible or invalid circles.
Rationale: Agent-authored `MAP_POINTS` with a wrong preset (e.g., a Paris marker on `albersUsa`) must degrade gracefully, not emit NaN paths. Specify: skip markers whose projection returns null, and define marker behavior for coordinates outside the fitted extent (clip to viewport vs. hide).

Severity: Major
Scope: §5 step 5 (Choropleth)
Description: The scale spec is self-contradictory: a `quantize` scale produces **discrete bins**, but the text says values are "interpolated between adjacent series colors" (continuous), and the legend is described as a strip with "min/max labels", which fits neither a quantize ramp nor a discrete-binned legend (which needs bin boundaries).
Rationale: This ambiguity directly changes the rendered output and the legend; an implementer cannot satisfy both readings. Pick one: discrete quantize bins with `series[0..4]` as the range and a legend showing bin thresholds, or an interpolator ramp. Also specify degenerate domains (all values equal, single value) so the scale doesn't produce NaN.

Severity: Major
Scope: §5 step 5 (Choropleth keying) + §4 (world-atlas, us-atlas)
Description: The region matching rule ("region ids/names") is unspecified and fragile across the listed sources: world-atlas features carry numeric ISO 3166-1 string ids plus `properties.name`; us-atlas carries FIPS ids; mapshaper-processed sub-national packs carry whatever properties survive preprocessing. No normalization (zero-padded ids, string vs number, case) or precedence rule (id first, name fallback) is defined.
Rationale: Id/name mismatches are the most common choropleth failure and will surface as silently unfilled regions. Define the canonical join key per source in the resolution rule and require the registry to use it, with unmatched regions reported (e.g., console warning) rather than silently blank.

Severity: Major
Scope: §3 Resolution policy + §10 Risks
Description: No artifact-size budget or simplification requirement for the 50m path. The doc acknowledges ~108 KB for the 110m **example** only, while endorsing 756.4 KB 50m embeds for every "regional choropleth" artifact, plus 279.7 KB of d3 — routinely ~1 MB inline JSON per artifact. The mapshaper "simplify to a byte target" pipeline is mandated only for sub-national packs, not for 50m world geometry.
Rationale: Unbounded inline payload undermines the self-contained-artifact ethos and hurts parse/render latency (a multi-hundred-KB `JSON.parse` plus hundreds of SVG paths). Require mapshaper simplification toward a stated per-artifact byte target for 50m too, or justify why 756 KB is acceptable as a blanket rule.

Severity: Major
Scope: §10 Risks (second bullet)
Description: "ResizeObserver not needed" is asserted without a resize strategy. Sizing "to the stage box directly" implies a one-time measurement at init; on viewport/container resize the map would overflow, letterbox, or stay unscaled unless the SVG uses a `viewBox` with relative sizing — which is not specified.
Rationale: Responsive behavior is a kit-wide concern; an unsupported assertion invites a broken layout. Either specify `viewBox`-based proportional scaling (making the claim true) or add re-fit handling, and say explicitly what happens on window resize.

Severity: Major
Scope: §4 Data sources (Argentina row) + §10 Risks (last bullet)
Description: The license for `mgaitan/departamentos_argentina` is described as "public educational data (source attribution required)", which is not a recognized license; redistribution terms for embedding the derived geometry into shipped artifacts are unverifiable as stated. The risk section acknowledges attribution documentation but not license validity.
Rationale: The sub-national country-pack pattern is built on this source as the template; if redistribution isn't actually permitted, the pattern is unusable. Verify the upstream IGN/CONAE terms before blessing the pattern, and add a license-verification step to the "new country packs" procedure in §4.

Severity: Major
Scope: §5 step 7 (Interaction)
Description: Accessibility is limited to an `aria-label` on the SVG. Pan/zoom is wheel/drag only (pointer-inaccessible), tooltips are hover-driven, and there is no keyboard or data-table alternative for the map's information.
Rationale: An interactive, information-bearing component whose content is unreachable without a pointer excludes keyboard and screen-reader users. Provide at minimum a keyboard-accessible alternative (collapsible data table of region values/markers) and focusable markers, or document why pointer-only interaction is acceptable for this kit.

Severity: Nit
Scope: §5 step 6 (Markers)
Description: `norm(value)` is undefined: normalization range, min==max behavior (division by zero), and behavior when `value` is absent (implied `r = 4`?).
Rationale: Degenerate registries (one marker, or all-equal values) will produce NaN radii. Specify: fixed `r` when values absent, and safe normalization when the range collapses.

Severity: Nit
Scope: §5 step 7 (Tooltips)
Description: Tooltip construction doesn't state whether region/point names are inserted via `textContent` or HTML.
Rationale: Agent-authored `MAP_POINTS` names flow into the DOM; pin the contract to text-only insertion to keep the kit injection-safe by construction.

Severity: Nit
Scope: §3 ("simplify to a byte target") vs §7.3 (`visvalingam=0.1`)
Description: §3 promises simplification "to a byte target", but the example command simplifies by percentage; mapshaper's `-simplify` is percentage/resolution-driven, so a byte target needs an iterative loop that is not spelled out.
Rationale: The guidance as written doesn't achieve the stated policy. Either document the iterate-and-measure loop or restate the policy as a percentage guideline with a checked output size.

Severity: Nit
Scope: §3 ("all 193 UN states")
Description: The 50m world file contains substantially more entities than 193 UN members (dependencies, disputed territories), so the characterization is inaccurate.
Rationale: Precision matters because the choropleth join (see §5 step 5 finding) will encounter non-UN ids/names; document the actual entity population so registry authors aren't surprised.

Severity: Nit
Scope: §5 step 7 (double-click reset)
Description: Double-click-to-reset conflicts with d3.zoom's default dblclick behavior (zoom in); disabling `svg.call(d3.zoom().on('dblclick.zoom', null))` or equivalent is required but unstated, and no test covers reset.
Rationale: As specified, the documented double-click reset won't behave as described. Note the required override and add it to §8's behavioral tests.
