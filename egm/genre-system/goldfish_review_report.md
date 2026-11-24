# Goldfish Review Report

- Target: /home/nicolas/projects/pi-artifact-forger/design_draft.md
- Range: full file
- Mode: review
- Date: 2026-11-24T12:58:44.920Z
- Reviewers:
  - zoom_out (ok)
  - design_critic (ok)

## zoom_out (ok)

Severity: Major
Scope: §2 Architecture / §4 Document foundation
Description: The draft declares the Document Kit "inert until used" but never specifies the mechanism that guarantees inertness (e.g., all document CSS scoped under a container class vs. bare element selectors like `body`/`h2`/`p`, and kit JS guarded by element existence). At the same time §2 mandates that dashboard artifacts strip the kit, mirroring the Mermaid/Chart.js script-tag stripping model.
Rationale: These two choices are in tension. If the kit is genuinely self-inert (DOM-guarded JS, class-scoped CSS), stripping it from dashboards buys only bytes while adding a mandatory, error-prone transformation to every dashboard generation — the majority of artifacts. If it is not self-inert (e.g., prose typography rules applied to bare elements), a forgotten strip silently breaks dashboards and "inert" is an unenforced promise. Specify the inertness contract explicitly (scoped container class, JS no-ops without document DOM), then make stripping optional best-effort for dashboards rather than a required step; the existing hard rule "only include what the artifact uses" concerns CDN fetches, not dead inline bytes, so it does not mandate this stripping.

Severity: Major
Scope: §8 Tests and migration (README re-copy line) vs. agents/artifact-forger.md §1 rule 3 ("NEVER overwrite or modify")
Description: The migration plan tells projects to update by manually re-copying the kit block into their existing bootstrapped `artifacts/_template.html` — the exact file the design contract forbids anyone (agent or otherwise) from modifying ("If it looks wrong, report that and stop"). No reconciliation of this contradiction is given, and there is no template version marker an agent could use to detect a stale template.
Rationale: Every existing bootstrapped project becomes stale the moment this ships, and the only sanctioned update path contradicts the most protected invariant in the system. Define the upgrade as a user-driven full re-bootstrap (delete + re-copy the whole canonical template — never a surgical in-place edit), and add a version marker to the template header so a zero-context agent can detect and report stale templates instead of guessing. Otherwise the genre system is unreachable for all existing projects.

Severity: Major
Scope: §6 Procedural kit — Checklist persistence (and §9 third open question)
Description: Checklist persistence via `localStorage` is the only interactive, stateful behavior in v1, chosen without stated need, and it introduces a correctness hazard in the very genre it serves: keys based on filename (+ item index, which §6 states but §9's parenthetical contradicts as "filename only") go stale when a manual is regenerated, leaving pre-checked steps that mislead a user actually following the runbook. §9 waves this off as "acceptable".
Rationale: This is YAGNI plus a real hazard: a checkbox that resets on reload is harmless; a checkbox that remembers across content changes is wrong in a procedural document. Either drop persistence in v1 (agent-set static `is-done` states already cover the presentation need) or key by a content-derived hash so regeneration invalidates state. Also reconcile the §6/§9 key description — the draft contradicts itself on what the key contains.

Severity: Nit
Scope: §4.2 Typography (prose-first)
Description: The document kit defines a bespoke px-based type scale (display 28/34, h1 22/28, …) while the existing dashboard side of the same template is styled entirely with Tailwind utility classes (text-xs/sm/base/2xl).
Rationale: Two parallel typography systems in one canonical template is a pattern-consistency and maintenance cost the design doesn't acknowledge. Either build the document kit on the same Tailwind utility vocabulary or state why a separate scale is warranted (e.g., reading measure needs precise line-height control) — otherwise the "one visual system across genres" claim in §4.1 is undermined at the CSS layer.

Severity: Nit
Scope: §4.3 Components — Code block row
Description: The spec directs the agent to wrap code tokens in `<em>`/`<b>` for "minimal emphasis (renders as color-neutral weight shift)" — a micro-style hack that abuses semantic elements as a poor-man's syntax highlighter.
Rationale: This is an in-the-weeds instruction to a zero-context agent that produces semantically wrong markup (`<em>` meaning "this is a keyword", not emphasis) for marginal visual gain, in a version that explicitly defers highlight.js precisely to keep code blocks simple. Drop it: plain mono in v1; the stated `pre.doc-code` contract already keeps the highlighter slot open without it.

## design_critic (ok)

Severity: Major
Scope: §2 Architecture (lines 26–33)
Description: The kit-strip mechanism relies on the agent performing exact literal string surgery on `<!-- GENRE:DOCUMENT KIT -->` / `<!-- /GENRE:DOCUMENT KIT -->`, with no collision or escaping rule. A document genre artifact that legitimately documents this very design system (e.g., a tech-spec about artifact-forger) will contain the literal marker text in its body or code blocks, and the strip will amputate valid content.
Rationale: The delimited-kit model is the load-bearing decision of the whole design; its failure mode corrupts output silently. Add a contract rule: markers inside code blocks/inline code are protected by the agent's editing rules (e.g., markers must be authored with a zero-width joiner or documented escaping variant when displayed), plus a template test asserting the marker does not appear elsewhere in `_template.html`.

Severity: Major
Scope: §2 Architecture (lines 31–32)
Description: The stripping contract is asymmetric: the Document Kit gets exact delimiters, but the dashboard side ("strips the dashboard cards/KPI section") has no marker contract. In `_template.html` the dashboard sections are delimited only by casual comments (`<!-- KPI Row -->`) with no BEGIN/END pair, so the strip boundary is left to agent judgment.
Rationale: Document-artifact correctness depends on stripping exactly the right region of the starter; an imprecise cut removes needed styles/JS or keeps demo cards. Delimit the dashboard demo section with a matching contract marker pair (e.g., `<!-- GENRE:DASHBOARD STARTER -->`) and test both delimiters occur exactly once.

Severity: Major
Scope: §8 Tests and migration (line 106)
Description: Existing target projects hold old `_template.html` copies that will never contain the Document Kit. The design defines no behavior for "agent asked for a `tech-spec` in a project whose bootstrapped template predates the kit" — the README one-liner only covers manual re-bootstrap.
Rationale: This is the primary real-world path for the feature's first users. Without a defined fallback (agent inline-appends the kit block from the skill, or refuses/degrades to dashboard with a stated reason), routing will produce broken document artifacts in every pre-existing project. Specify the fallback in `agents/artifact-forger.md` §2 and mirror it in the skill.

Severity: Major
Scope: §6 Procedural kit (line 94) and §9 open questions (line 100)
Description: Checklist persistence keys are filename + item index. Regenerating an artifact with the same filename and the same number of items but different step content silently restores stale checked state onto the wrong steps. The design's own mitigation in §9 ("stale keys are inert") is only true when the item count changes; it is false for equal-count edits.
Rationale: A manual/runbook whose procedure is edited (steps reworded or reordered, count unchanged) will present wrong completion state — worse than no persistence for a procedural document. Include a short content hash of the item labels in the localStorage key, and fix the §9 claim accordingly.

Severity: Major
Scope: §8 Tests and migration (lines 100–103)
Description: All proposed tests are marker-presence assertions. No behavioral test strategy exists for the four shipped JS behaviors: TOC builder, IntersectionObserver scrollspy, checklist persistence, and figure auto-numbering. The vitest config has no DOM environment, and IntersectionObserver is not implemented in jsdom/happy-dom without stubs.
Rationale: Presence tests cannot catch the exact class of bugs this design risks (the §6 keying flaw, scrollspy never activating, figure numbers colliding with hand-authored "Fig. N" text). Specify the test environment and at least one behavioral test per JS behavior (persistence round-trip, TOC id/slug generation, figure numbering against authored captions).

Severity: Major
Scope: §4.3 Components, Figure row (line 60) vs §1 goals
Description: Figure numbering is deferred to JS at render time, but the genre promise is "numbered, captioned figures inline" in prose. No contract defines how body text references figures ("see Fig. 3"): JS-assigned numbers can diverge from agent-authored references whenever figures are reordered, added, or one is stripped.
Rationale: Dangling or misnumbered cross-references directly defeat the hybrid-spec capability the draft exists to deliver. Decide pre-implementation: either the agent numbers figures statically in the `figcaption` (JS only validates/renumbers and warns), or the contract forbids hard-coded figure references in prose in favor of section anchors.

Severity: Nit
Scope: §6 Procedural kit (line 94)
Description: "Persistence via `localStorage` … (works over `file://`)" is asserted without a browser matrix; `file://` storage behavior varies (opaque origins, per-directory partitioning in some browsers/versions).
Rationale: It is the only interactive feature in v1, so the claim should be evidenced or bounded. Verify Chrome/Firefox/Safari/Edge behavior over `file://`, document the matrix in the skill, and state the degradation mode (checkbox works in-session; persistence silently absent) so it is a documented limitation rather than a surprise.

Severity: Nit
Scope: §4.3 Components, Code block row (line 56)
Description: The contract says agent-authored `<em>`/`<b>` in code blocks "renders as color-neutral weight shift", but `<em>` defaults to italic, not weight.
Rationale: The stated rendering property is factually wrong for one of the two sanctioned tags. Either restrict the contract to `<b>` or state that the Document Kit CSS overrides `em` inside `.doc-code` to weight-only (no italic).

Severity: Nit
Scope: §7 Auto-detection routing (lines 84–92)
Description: Priority order is defined across tiers but not within tier 2: a proposal with a success-metrics section matches both "Summary of work/events with mixed prose+data → `report`" and "Proposal/design for review → `tech-spec`/`product-spec`". Additionally, the routing table is mirrored across `agents/artifact-forger.md` and `skills/artifact-forger/SKILL.md`, and the planned tests only assert marker presence, so semantic drift between the two copies is unchecked.
Rationale: Routing consistency is the headline behavior of §7. Add one tie-break rule (e.g., "review-request framing outranks data presence → spec genres") and either declare the agent file the single source of truth with the skill pointing to it, or add a parity test that extracts the table from both files and diffs them.

Severity: Nit
Scope: §4.2 Typography (line 52)
Description: Body text is specified at 14px/1.7 for long-form prose — small for extended reading; typical documentation reading columns use 15–16px.
Rationale: The entire feature targets long prose documents; an undersized body measure undermines the "prose-first" goal. Either raise body to 15–16px or record the 14px choice as a deliberate token inherited from the dashboard system, with the rationale stated so reviewers can contest it.
