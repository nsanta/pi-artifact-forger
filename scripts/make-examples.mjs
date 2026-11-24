#!/usr/bin/env node
// Generates examples/*.html — one sample artifact per use case (genre/structure),
// each derived from the canonical template the same way the artifact-forger agent
// derives artifacts: keep tokens + theme sync + kit, replace content per genre,
// strip unused CDN scripts, honor honesty badges. Regenerate with: npm run make-examples
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE = readFileSync(resolve(ROOT, "resources/artifact-forger/_template.html"), "utf8");
const OUT_DIR = resolve(ROOT, "examples");

const CHART_TAG = '  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>\n';
const MERMAID_TAG = '  <script src="https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js"></script>\n';
const START = "<!-- GENRE:DASHBOARD STARTER -->";
const END = "<!-- /GENRE:DASHBOARD STARTER -->";
const FOOTER_NOTE = "Markdown remains the source of truth — this artifact is a projection for review.";

function setHeader(out, { title, badge, subtitle }) {
  return out
    .replace("Artifact Title", title)
    .replace(/>\s*Template\s*</, ">" + badge + "<")
    .replace("Concise subtitle, scope, or date", subtitle);
}

function setDiagrams(out, diagrams) {
  const dedent = (src) => {
    const lines = src.replace(/^\n+/, "").replace(/\s+$/, "").split("\n");
    const base = lines[0].match(/^ */)[0].length;
    return lines.map((l) => l.slice(base)).join("\n");
  };
  const re = /const MERMAID_DIAGRAMS = \{[\s\S]*?\n    \};/;
  const entries = Object.entries(diagrams)
    .map(([id, src]) => "      " + id + ": `\n" + dedent(src) + "\n      `")
    .join(",\n");
  if (!re.test(out)) throw new Error("MERMAID_DIAGRAMS block not found");
  return out.replace(re, "const MERMAID_DIAGRAMS = {\n" + entries + "\n    };");
}

function replaceChart(out, { type, labels, datasets }) {
  const re = /type: 'bar',\n(\s*)data: \{\n\s*labels: \[[^\]]*\],\n\s*datasets: \[[\s\S]*?\]\n\s*\},/;
  if (!re.test(out)) throw new Error("initCharts data block not found");
  const replacement =
    "type: '" + type + "',\n" +
    "$1data: {\n" +
    "$1  labels: [" + labels.join(", ") + "],\n" +
    "$1  datasets: [\n" +
    datasets.map((d) => "$1    { " + d + " }").join(",\n") + "\n" +
    "$1  ]\n" +
    "$1},";
  return out.replace(re, replacement);
}

function docRegion(out, body) {
  const start = out.indexOf(START);
  const end = out.indexOf(END) + END.length;
  return out.slice(0, start) + body.trim() + "\n" + out.slice(end);
}

const figure = (id, caption) =>
  '      <figure class="doc-figure">\n' +
  '        <div class="diagram-stage"><div id="mermaid-' + id + '" class="m-auto"></div></div>\n' +
  '        <figcaption>' + caption + '</figcaption>\n' +
  '      </figure>';

const examples = {};

function makeDashboard(name, { header, swaps }) {
  let out = setHeader(TEMPLATE, header);
  for (const [from, to] of swaps) out = out.replace(from, to);
  examples[name] = out;
}

function makeDoc(name, { header, body, diagrams, chart, keepChart = true, keepMermaid = true }) {
  let out = TEMPLATE;
  if (!keepChart) out = out.replace(CHART_TAG, "");
  if (!keepMermaid) out = out.replace(MERMAID_TAG, "");
  out = setHeader(out, header);
  out = docRegion(out, body);
  if (diagrams) out = setDiagrams(out, diagrams);
  if (chart) out = replaceChart(out, chart);
  examples[name] = out;
}

/* ------------------------------------------------------------------ */
/* 1. Dashboard — the starter itself, retitled into a realistic sample */
/* ------------------------------------------------------------------ */
makeDashboard("dashboard-quarterly-spend.html", {
  header: {
    title: "Q3 FY26 Cloud Spend",
    badge: "Sample Data",
    subtitle: "Spend overview · generated 2026-11-24 · all figures are sample data",
  },
  swaps: [
    ["Primary Metric", "Cloud Spend (Nov)"],
    ["1,284", "$48.2k"],
    ["+12.4% vs prior period", "+8.1% vs October"],
    ["Median Latency", "Budget Used FY26"],
    ["142 ms", "82%"],
    ["p95: 310 ms", "on track for Q4"],
    ["Category Performance", "Spend by Service"],
    ["Workflow Architecture", "Spend Flow"],
  ],
});

/* ------------------------------------------------------------------ */
/* 2. Report — sprint review: TL;DR, metrics strip, findings, appendix */
/* ------------------------------------------------------------------ */
makeDoc("report-sprint-42.html", {
  header: {
    title: "Sprint 42 — Delivery Review",
    badge: "Report",
    subtitle: "Platform team · 2026-11-21 · sample data",
  },
  body: `
  <div class="doc">
    <nav class="doc-toc" aria-label="Table of contents"></nav>
    <article class="doc-body">
      <p class="doc-display">Sprint 42 closed with the batch import live for 5% of vendors.</p>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 0 0 2rem;">
        <div class="card p-4"><p class="text-xs" style="color: var(--text-muted);">Velocity</p><p class="text-2xl font-semibold font-mono tabular-nums mt-1">34 pts</p></div>
        <div class="card p-4"><p class="text-xs" style="color: var(--text-muted);">Escaped defects</p><p class="text-2xl font-semibold font-mono tabular-nums mt-1">1</p></div>
        <div class="card p-4"><p class="text-xs" style="color: var(--text-muted);">Deploy frequency</p><p class="text-2xl font-semibold font-mono tabular-nums mt-1">11</p></div>
      </div>
      <h2>What shipped</h2>
      <p>The batch import endpoint replaced the row API behind a feature flag, and the shadow importer completed its 30-day diff with no unexplained deltas (see Fig. 1).</p>
      ${figure("flow", "Fig. 1 — Sprint 42 delivery flow")}
      <h2>Findings</h2>
      <h3>Batch upserts hold the write budget</h3>
      <p>Thirty-second upsert windows kept p95 write latency inside budget across all vendor burst tests.</p>
      <h3>Dead-letter volume is concentrated</h3>
      <table class="doc-table">
        <thead><tr><th>Vendor</th><th>Failure mode</th><th class="num">Share</th></tr></thead>
        <tbody>
          <tr><td>globex</td><td>encoding mismatch</td><td class="num">71%</td></tr>
          <tr><td>acme</td><td>duplicate keys</td><td class="num">29%</td></tr>
        </tbody>
      </table>
      <h2>Appendix</h2>
      <p>Full telemetry links live in the sprint doc. All figures above are sample data.</p>
      <div class="doc-footer">${FOOTER_NOTE}</div>
    </article>
  </div>`,
  diagrams: {
    flow: `
      flowchart LR
        A([Sprint start]) --> B[Batch import behind flag]
        B --> C[Shadow diff 30d]
        C --> D{Deltas?}
        D -->|none| E[Canary 5%]
        D -->|investigate| F[Bugfix]
        F --> C
    `,
  },
  keepChart: false,
});

/* ------------------------------------------------------------------ */
/* 3. Tech spec — importer service (exercises most kit vocabulary)     */
/* ------------------------------------------------------------------ */
makeDoc("tech-spec-importer-service.html", {
  header: {
    title: "Importer Service — Tech Spec",
    badge: "Tech Spec",
    subtitle: "Platform team · v0.3.0 · 2026-11-24 · sample content",
  },
  body: `
  <div class="doc">
    <nav class="doc-toc" aria-label="Table of contents"></nav>
    <article class="doc-body">
      <p class="doc-display">Importer Service — Tech Spec</p>
      <dl class="spec-meta">
        <div><dt>Status</dt><dd>Review</dd></div>
        <div><dt>Version</dt><dd>0.3.0</dd></div>
        <div><dt>Owners</dt><dd>platform team</dd></div>
        <div><dt>Date</dt><dd>2026-11-24</dd></div>
        <div><dt>Source</dt><dd>docs/importer-spec.md</dd></div>
      </dl>
      <h2>Overview</h2>
      <p>This spec proposes a streaming importer that turns vendor CSV drops into normalized ledger events.</p>
      <div class="callout decision">
        <i data-lucide="git-branch"></i>
        <div><span class="callout-label">Decision</span>Batch upserts every 30&nbsp;s instead of per-row writes — bounded write amplification under vendor bursts.</div>
      </div>
      <h2>Architecture</h2>
      <p>The importer runs as a queue consumer; ordering is preserved per vendor partition (see Fig. 1).</p>
      ${figure("flow", "Fig. 1 — Import pipeline from vendor drop to ledger")}
      <h2>Data model</h2>
      <table class="doc-table" data-filterable>
        <thead><tr><th>Vendor</th><th>Field</th><th class="num">Size</th></tr></thead>
        <tbody>
          <tr><td>acme</td><td>vendor_id</td><td class="num">12</td></tr>
          <tr><td>globex</td><td>amount</td><td class="num">18.2</td></tr>
          <tr><td>acme</td><td>batch_ts</td><td class="num">8</td></tr>
        </tbody>
      </table>
      <h2>Rollout steps</h2>
      <ol class="steps">
        <li class="is-done">Shadow-import last 30 days of vendor drops.</li>
        <li class="is-current">Enable 5% of vendors; watch error budget.</li>
        <li>Ramp to 100% and remove the legacy path.</li>
      </ol>
      <h2>Interface changes</h2>
      <div class="diff-pair">
        <div><span class="diff-label">Before</span><pre class="doc-code"><code>POST /v1/imports
{ "vendor": "acme", "rows": [...] }</code></pre></div>
        <div><span class="diff-label">After</span><pre class="doc-code"><code>POST /v1/imports/batches
<ins>{ "vendor": "acme", "batch": "2026-11-24" }</ins></code></pre></div>
      </div>
      <div class="doc-footer">${FOOTER_NOTE}</div>
    </article>
  </div>`,
  diagrams: {
    flow: `
      flowchart LR
        A([Vendor drop]) --> B[Queue]
        B --> C{Validate}
        C -->|ok| D[Batch upsert 30s]
        C -->|bad| E[Dead letter]
        D --> F[(Ledger)]
    `,
  },
  keepChart: false,
});

/* ------------------------------------------------------------------ */
/* 4. Product spec — onboarding revamp (handDrawn UX flow + metric)    */
/* ------------------------------------------------------------------ */
makeDoc("product-spec-onboarding.html", {
  header: {
    title: "Onboarding Revamp — Product Spec",
    badge: "Product Spec",
    subtitle: "Growth team · v0.2.0 · 2026-11-24 · sample content",
  },
  body: `
  <div class="doc">
    <nav class="doc-toc" aria-label="Table of contents"></nav>
    <article class="doc-body">
      <p class="doc-display">Onboarding Revamp — Product Spec</p>
      <dl class="spec-meta">
        <div><dt>Status</dt><dd>Draft</dd></div>
        <div><dt>Version</dt><dd>0.2.0</dd></div>
        <div><dt>Owners</dt><dd>growth team</dd></div>
        <div><dt>Date</dt><dd>2026-11-24</dd></div>
        <div><dt>Source</dt><dd>docs/onboarding-spec.md</dd></div>
      </dl>
      <h2>Problem</h2>
      <p>Sixty percent of sign-ups never reach first value within the first session; activation is the top-of-funnel bottleneck.</p>
      <h2>Users</h2>
      <dl>
        <dt><strong>Solo operator</strong></dt><dd>Wants a working dashboard in under ten minutes; abandons on empty states.</dd>
        <dt><strong>Team lead</strong></dt><dd>Evaluates with two teammates; needs an invite path that does not block personal progress.</dd>
      </dl>
      <h2>Solution</h2>
      <p>Replace the empty workspace with a guided sample project that reaches first value without real data (see Fig. 1).</p>
      ${figure("uxflow", "Fig. 1 — Onboarding flow to first value")}
      <h2>Success metrics</h2>
      <p>Target: 58% activation within one session and time-to-first-value under eight minutes by week six.</p>
      <div class="relative h-72 w-full"><canvas id="sample-chart"></canvas></div>
      <h2>Rollout plan</h2>
      <ol class="steps">
        <li class="is-current">Ship the guided sample project to 10% of new sign-ups.</li>
        <li>Iterate on checklist nudges from session replays.</li>
        <li>Full rollout once activation holds for two consecutive weeks.</li>
      </ol>
      <div class="doc-footer">${FOOTER_NOTE}</div>
    </article>
  </div>`,
  diagrams: {
    uxflow: `
      ---
      config:
        look: handDrawn
        handDrawnSeed: 42
      ---
      flowchart TD
        A([Sign-up]) --> B[Workspace created]
        B --> C{First-value action}
        C -->|guided| D[Sample project]
        D --> E([Aha moment])
        C -->|stuck| F[Checklist nudge]
        F --> D
    `,
  },
  keepChart: true,
  keepMermaid: true,
  chart: {
    type: "line",
    labels: ["'W1'", "'W2'", "'W3'", "'W4'", "'W5'", "'W6'"],
    datasets: [
      "label: 'Activation rate %', data: [22, 31, 38, 44, 51, 58], _colorIdx: 0, borderColor: t.series[0], backgroundColor: t.series[0], tension: 0.3, pointRadius: 3",
      "label: 'Time-to-first-value (min)', data: [18, 15, 12, 10, 9, 7], _colorIdx: 2, borderColor: t.series[2], backgroundColor: t.series[2], tension: 0.3, pointRadius: 3",
    ],
  },
});

/* ------------------------------------------------------------------ */
/* 5. Manual — importer runbook (procedural kit, no CDN extras)        */
/* ------------------------------------------------------------------ */
makeDoc("manual-importer-runbook.html", {
  header: {
    title: "Importer Rollback Runbook",
    badge: "Manual",
    subtitle: "Platform on-call · 2026-11-24 · sample procedure",
  },
  body: `
  <div class="doc">
    <nav class="doc-toc" aria-label="Table of contents"></nav>
    <article class="doc-body">
      <p class="doc-display">Importer Rollback Runbook</p>
      <p>Audience: platform on-call engineers. Time to execute: about fifteen minutes.</p>
      <h2>Prerequisites</h2>
      <p>
        <span class="prereq"><i data-lucide="terminal"></i>kubectl on ops-cluster</span>
        <span class="prereq"><i data-lucide="key-round"></i>deploy role in ops</span>
        <span class="prereq"><i data-lucide="user"></i>on-call approval</span>
      </p>
      <div class="callout warning">
        <i data-lucide="alert-triangle"></i>
        <div><span class="callout-label">Warning</span>Rollback drops in-flight batches. Announce in #platform before step&nbsp;3.</div>
      </div>
      <h2>Steps</h2>
      <ol class="steps">
        <li class="is-done">Freeze the importer scheduler: <code>kubectl -n importer scale deploy scheduler --replicas=0</code></li>
        <li class="is-done">Drain the queue and record the lag snapshot.</li>
        <li class="is-current">Flip traffic to the legacy path: <code>kubectl set env deploy importer USE_LEGACY=true</code></li>
        <li>Verify vendor drops land in the ledger (see Verification).</li>
        <li>Unfreeze the scheduler and reopen the queue.</li>
      </ol>
      <h2>Verification</h2>
      <ul class="checklist">
        <li><input type="checkbox"> Ledger row counts match the vendor drop for the last hour</li>
        <li><input type="checkbox"> Dead-letter depth is flat for ten minutes</li>
        <li><input type="checkbox"> No new pages for fifteen minutes</li>
      </ul>
      <h2>Troubleshooting</h2>
      <table class="doc-table">
        <thead><tr><th>Symptom</th><th>Cause</th><th>Action</th></tr></thead>
        <tbody>
          <tr><td>Queue depth grows</td><td>legacy consumer not scaled</td><td>scale legacy deploy to 3</td></tr>
          <tr><td>Duplicate ledger rows</td><td>batch replay after freeze</td><td>run dedup job, then continue</td></tr>
          <tr><td>Vendors see 503</td><td>ingress still on batch API</td><td>revert ingress rule</td></tr>
        </tbody>
      </table>
      <h2>Glossary</h2>
      <dl>
        <dt><strong>Batch</strong></dt><dd>One vendor drop, ingested as a unit.</dd>
        <dt><strong>Dead letter</strong></dt><dd>Messages that failed validation twice.</dd>
      </dl>
      <div class="doc-footer">${FOOTER_NOTE}</div>
    </article>
  </div>`,
  keepChart: false,
  keepMermaid: false,
});

/* ------------------------------------------------------------------ */
/* 6. Decision — queue vendor ADR                                      */
/* ------------------------------------------------------------------ */
makeDoc("decision-queue-vendor.html", {
  header: {
    title: "ADR-014 — Queue Vendor for the Importer",
    badge: "Decision",
    subtitle: "Platform team · Accepted · 2026-11-20 · sample decision",
  },
  body: `
  <div class="doc">
    <nav class="doc-toc" aria-label="Table of contents"></nav>
    <article class="doc-body">
      <p class="doc-display">ADR-014 — Queue Vendor for the Importer</p>
      <dl class="spec-meta">
        <div><dt>Status</dt><dd>Accepted</dd></div>
        <div><dt>Date</dt><dd>2026-11-20</dd></div>
        <div><dt>Deciders</dt><dd>platform, sre</dd></div>
        <div><dt>Source</dt><dd>docs/adr/014-queue-vendor.md</dd></div>
      </dl>
      <h2>Context</h2>
      <p>The importer needs ordered per-partition delivery with at-least-once semantics and a managed dead-letter path. Vendor burst tests show up to 40k messages per minute at peak.</p>
      <h2>Options</h2>
      <h3>Option A — Managed cloud queue</h3>
      <div class="pros-cons">
        <div><h4>Pros</h4><ul><li>Managed DLQ and retention</li><li>Zero ops toil</li><li>IAM integration</li></ul></div>
        <div><h4>Cons</h4><ul><li>Per-message cost at peak</li><li>Provider lock-in</li></ul></div>
      </div>
      <h3>Option B — Self-hosted broker</h3>
      <div class="pros-cons">
        <div><h4>Pros</h4><ul><li>Flat cost at scale</li><li>Full config control</li></ul></div>
        <div><h4>Cons</h4><ul><li>On-call burden for partitions</li><li>DLQ tooling is ours to build</li></ul></div>
      </div>
      <h2>Comparison</h2>
      <table class="doc-table" data-filterable>
        <thead><tr><th>Criterion</th><th>A — Managed</th><th>B — Self-hosted</th></tr></thead>
        <tbody>
          <tr><td>Ordered delivery</td><td>Yes</td><td>Yes</td></tr>
          <tr><td>Managed DLQ</td><td>Yes</td><td>Build it</td></tr>
          <tr><td>Cost at 40k msg/min</td><td class="num">$310/mo (est.)</td><td class="num">$90/mo + ops (est.)</td></tr>
          <tr><td>Ops toil</td><td>Low</td><td>High</td></tr>
        </tbody>
      </table>
      <div class="callout warning"><i data-lucide="alert-triangle"></i><div><span class="callout-label">Estimates</span>Cost figures are rough estimates, not quotes.</div></div>
      <h2>Recommendation & decision</h2>
      <div class="callout decision">
        <i data-lucide="git-branch"></i>
        <div><span class="callout-label">Decision</span>Option A. Ops toil outweighs the cost delta at current volume; revisit at 10x traffic.</div>
      </div>
      <h2>Consequences</h2>
      <p>Importer adopts the managed client; SRE drops broker tooling from the roadmap. DLQ alerts route to the platform rotation.</p>
      <h2>Revisit conditions</h2>
      <p>Re-open when sustained traffic exceeds 400k messages per minute or the provider changes partition pricing.</p>
      <div class="doc-footer">${FOOTER_NOTE}</div>
    </article>
  </div>`,
  keepChart: false,
  keepMermaid: false,
});

/* ------------------------------------------------------------------ */
/* 7. Roadmap — platform H1 2027 (gantt + milestones)                  */
/* ------------------------------------------------------------------ */
makeDoc("roadmap-platform-2027h1.html", {
  header: {
    title: "Platform Roadmap — H1 2027",
    badge: "Roadmap",
    subtitle: "Platform team · horizon 6 months · 2026-11-24 · sample plan",
  },
  body: `
  <div class="doc">
    <nav class="doc-toc" aria-label="Table of contents"></nav>
    <article class="doc-body">
      <p class="doc-display">Platform Roadmap — H1 2027</p>
      <dl class="spec-meta">
        <div><dt>Horizon</dt><dd>2027-01 → 2027-06</dd></div>
        <div><dt>Owner</dt><dd>platform team</dd></div>
        <div><dt>Last updated</dt><dd>2026-11-24</dd></div>
        <div><dt>Source</dt><dd>docs/roadmap-h1-2027.md</dd></div>
      </dl>
      <h2>Timeline at a glance</h2>
      <p>Four milestones across two tracks; the batch import ships before the legacy decommission starts (see Fig. 1).</p>
      ${figure("gantt", "Fig. 1 — H1 2027 milestone timeline")}
      <h2>Milestones</h2>
      <div class="milestone is-done">
        <h3>M0 — Batch import API</h3>
        <div class="ms-meta"><span class="badge">done</span><span class="ms-date">2027-01-31</span><span>platform</span></div>
        <p>Batch endpoint live behind a flag; shadow diff clean for 30 days.</p>
      </div>
      <div class="milestone is-current">
        <h3>M1 — 5% canary</h3>
        <div class="ms-meta"><span class="badge">current</span><span class="ms-date">2027-02-28</span><span>platform + sre</span></div>
        <p>Error budget holds for two consecutive weeks before ramp approval.</p>
        <ul class="checklist">
          <li><input type="checkbox"> Canary dashboard published</li>
          <li><input type="checkbox"> Rollback runbook rehearsed</li>
        </ul>
      </div>
      <div class="milestone">
        <h3>M2 — Full ramp</h3>
        <div class="ms-meta"><span class="badge">pending</span><span class="ms-date">2027-04-15</span><span>platform</span></div>
        <p>All vendors on the batch API; per-vendor rollout gates.</p>
      </div>
      <div class="milestone">
        <h3>M3 — Legacy decommission</h3>
        <div class="ms-meta"><span class="badge">pending</span><span class="ms-date">2027-05-31</span><span>platform</span></div>
        <p>Legacy importer deleted; docs and dashboards archived.</p>
      </div>
      <h2>Dependencies & risks</h2>
      <div class="callout warning">
        <i data-lucide="alert-triangle"></i>
        <div><span class="callout-label">Risk</span>M2 depends on the vendor certification tooling shipping in February; slip risk is one sprint.</div>
      </div>
      <h2>Roadmap changelog</h2>
      <ul class="changelog-list">
        <li><span class="cl-version">r3</span><span class="cl-date">2026-11-24</span><ul><li>M1 window extended by two weeks after canary review.</li></ul></li>
        <li><span class="cl-version">r2</span><span class="cl-date">2026-11-10</span><ul><li>M0 marked done; shadow diff accepted.</li></ul></li>
      </ul>
      <div class="doc-footer">${FOOTER_NOTE}</div>
    </article>
  </div>`,
  diagrams: {
    gantt: `
      gantt
        title H1 2027
        dateFormat YYYY-MM-DD
        section Foundations
        Batch import API      :done, m0, 2027-01-04, 2027-01-31
        Canary 5 percent      :active, m1, 2027-02-01, 2027-02-28
        section Rollout
        Full ramp             :m2, 2027-03-01, 2027-04-15
        Legacy decommission   :m3, 2027-04-16, 2027-05-31
    `,
  },
  keepChart: false,
});

/* ------------------------------------------------------------------ */
/* 8. Release notes — importer 0.3.0 (report structure)                */
/* ------------------------------------------------------------------ */
makeDoc("release-notes-importer-0.3.0.html", {
  header: {
    title: "Importer 0.3.0 — Release Notes",
    badge: "Release Notes",
    subtitle: "Platform team · 2026-11-24 · sample release",
  },
  body: `
  <div class="doc">
    <nav class="doc-toc" aria-label="Table of contents"></nav>
    <article class="doc-body">
      <p class="doc-display">Importer 0.3.0 — Release Notes</p>
      <h2>Summary</h2>
      <p>0.3.0 replaces the row-based import API with batch upserts, adds a dead-letter replay tool, and hardens duplicate-key handling. Breaking change for API consumers.</p>
      <h2>Added</h2>
      <ul class="changelog-list">
        <li><span class="cl-version">0.3.0</span><span class="cl-date">2026-11-24</span>
          <ul>
            <li><code>POST /v1/imports/batches</code> — batch upsert endpoint with 30&nbsp;s windows.</li>
            <li><code>importctl replay</code> — dead-letter replay tool with dry-run mode.</li>
          </ul>
        </li>
      </ul>
      <h2>Changed</h2>
      <ul class="changelog-list">
        <li><span class="cl-version">0.3.0</span><span class="cl-date">2026-11-24</span>
          <ul><li>Validation failures now land in the dead letter after two attempts instead of one.</li></ul>
        </li>
      </ul>
      <h2>Fixed</h2>
      <ul class="changelog-list">
        <li><span class="cl-version">0.3.0</span><span class="cl-date">2026-11-24</span>
          <ul><li>Duplicate keys from vendor replays no longer create double ledger rows.</li></ul>
        </li>
      </ul>
      <h2>Removed</h2>
      <ul class="changelog-list">
        <li><span class="cl-version">0.3.0</span><span class="cl-date">2026-11-24</span>
          <ul><li>Row-based <code>POST /v1/imports</code> (deprecated since 0.2.0).</li></ul>
        </li>
      </ul>
      <h2>Upgrade steps</h2>
      <ol class="steps">
        <li class="is-done">Migrate clients to the batch endpoint (see the diff below).</li>
        <li class="is-current">Run <code>importctl replay --dry-run</code> against the dead letter.</li>
        <li>Remove row-API ingress rules after one quiet week.</li>
      </ol>
      <h2>Notable diff</h2>
      <div class="diff-pair">
        <div><span class="diff-label">Before</span><pre class="doc-code"><code>POST /v1/imports
{ "vendor": "acme", "rows": [...] }</code></pre></div>
        <div><span class="diff-label">After</span><pre class="doc-code"><code>POST /v1/imports/batches
<ins>{ "vendor": "acme", "batch": "2026-11-24" }</ins></code></pre></div>
      </div>
      <div class="doc-footer">${FOOTER_NOTE}</div>
    </article>
  </div>`,
  keepChart: false,
  keepMermaid: false,
});

/* ------------------------------------------------------------------ */

const EXAMPLE_META = [
  { file: "dashboard-quarterly-spend.html", label: "Dashboard", title: "Q3 FY26 Cloud Spend", blurb: "KPI row, Chart.js card and a Mermaid spend flow with zoom, copy and SVG export.", tags: "KPIs · chart · diagram" },
  { file: "report-sprint-42.html", label: "Report", title: "Sprint 42 — Delivery Review", blurb: "TL;DR hero, metrics strip, findings with a figure and a table, appendix.", tags: "TOC · metrics · figure" },
  { file: "tech-spec-importer-service.html", label: "Tech Spec", title: "Importer Service — Tech Spec", blurb: "Spec header, decision callout, sortable/filterable table, steps, before/after diff.", tags: "TOC · callouts · table · diff" },
  { file: "product-spec-onboarding.html", label: "Product Spec", title: "Onboarding Revamp — Product Spec", blurb: "Personas, handDrawn UX flow figure, success-metric line chart.", tags: "TOC · handDrawn · chart" },
  { file: "manual-importer-runbook.html", label: "Manual", title: "Importer Rollback Runbook", blurb: "Prereq chips, warning callout, steps with states, checklists, troubleshooting.", tags: "steps · checklists · prereqs" },
  { file: "decision-queue-vendor.html", label: "Decision", title: "ADR-014 — Queue Vendor for the Importer", blurb: "Pros/cons pairs, comparison matrix, decision callout, revisit conditions.", tags: "pros-cons · matrix" },
  { file: "roadmap-platform-2027h1.html", label: "Roadmap", title: "Platform Roadmap — H1 2027", blurb: "Gantt figure, milestone rail with statuses and owners, roadmap changelog.", tags: "gantt · milestones · changelog" },
  { file: "release-notes-importer-0.3.0.html", label: "Release Notes", title: "Importer 0.3.0 — Release Notes", blurb: "Changelog rail (Added/Changed/Fixed/Removed), upgrade steps, before/after diff.", tags: "changelog · steps · diff" },
];

function makeIndex() {
  let out = TEMPLATE.replace(CHART_TAG, "").replace(MERMAID_TAG, "");
  out = setHeader(out, {
    title: "Artifact Examples",
    badge: "Index",
    subtitle: "One sample per use case · generated 2026-11-24 · all content is sample data",
  });
  const card = (m) =>
    '        <a class="example-card" href="' + m.file + '">\n' +
    '          <div class="ec-top"><span class="ec-pill">' + m.label + '</span><i data-lucide="arrow-up-right" class="ec-icon"></i></div>\n' +
    '          <h2>' + m.title + '</h2>\n' +
    '          <p>' + m.blurb + '</p>\n' +
    '          <p class="ec-tags">' + m.tags + '</p>\n' +
    '        </a>';
  const cards = EXAMPLE_META.map(card).join("\n");
  const gallery = [
    '  <style>',
    '    /* index-only styles (scoped to .example-card) */',
    '    .example-card { display: block; padding: 1.25rem; color: var(--text); text-decoration: none; background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04); transition: border-color 120ms ease, transform 120ms ease; }',
    '    .example-card:hover { border-color: var(--accent); transform: translateY(-2px); }',
    '    .example-card h2 { font-size: 15px; font-weight: 600; margin: 0.6rem 0 0.4rem; }',
    '    .example-card p { margin: 0; font-size: 13px; color: var(--text-muted); }',
    '    .ec-top { display: flex; align-items: center; justify-content: space-between; }',
    '    .ec-pill { font-size: 11px; font-weight: 500; padding: 0.1rem 0.55rem; border-radius: 9999px; background: var(--surface-muted); color: var(--text-muted); border: 1px solid var(--border); }',
    '    .ec-icon { width: 14px; height: 14px; color: var(--text-muted); }',
    '    .ec-tags { margin-top: 0.7rem !important; font-size: 11.5px !important; font-family: \'JetBrains Mono\', ui-monospace, monospace; }',
    '  </style>',
    '  <main class="max-w-6xl mx-auto p-6">',
    '    <section class="grid grid-cols-1 md:grid-cols-2 gap-4">',
    cards,
    '    </section>',
    '    <p class="text-xs mt-6" style="color: var(--text-muted);">All content is sample data. Regenerate with <code>npm run make-examples</code>.</p>',
    '  </main>',
  ].join("\n");
  const start = out.indexOf(START);
  const end = out.indexOf(END) + END.length;
  out = out.slice(0, start) + gallery + out.slice(end);
  return out;
}

examples["index.html"] = makeIndex();

/* ------------------------------------------------------------------ */

mkdirSync(OUT_DIR, { recursive: true });
let count = 0;
for (const [name, html] of Object.entries(examples)) {
  writeFileSync(resolve(OUT_DIR, name), html);
  console.log("wrote", name, "(" + html.length + " bytes)");
  count++;
}

/* index must link every example */
const indexHtml = readFileSync(resolve(OUT_DIR, "index.html"), "utf8");
for (const m of EXAMPLE_META) {
  if (!indexHtml.includes('href="' + m.file + '"')) throw new Error("index.html: missing link to " + m.file);
}

/* content contracts per example */
let validated = 0;
for (const m of EXAMPLE_META) {
  const html = readFileSync(resolve(OUT_DIR, m.file), "utf8");
  const isDoc = m.file !== "dashboard-quarterly-spend.html";
  if (isDoc && !html.includes(FOOTER_NOTE)) throw new Error(m.file + ": missing source-of-truth footer");
  if (isDoc && html.includes(START)) throw new Error(m.file + ": dashboard starter not replaced");
  if (!isDoc && !html.includes("Sample Data")) throw new Error(m.file + ": missing Sample Data badge");
  validated++;
}
console.log("validated index links + content contracts (" + validated + " examples)");
console.log("done:", count, "files written");
