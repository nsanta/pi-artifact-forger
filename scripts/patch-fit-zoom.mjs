#!/usr/bin/env node
// One-off migration: port the fit-to-container zoom fix from the canonical
// template (pi-artifact-forger) into already-generated artifacts and
// bootstrapped _template.html copies. Fails loudly if a copy deviates.
import { readFileSync, writeFileSync } from "node:fs";

const OLD_LOOP = `      for (const [id, src] of Object.entries(MERMAID_DIAGRAMS)) {
        const el = document.getElementById(\`mermaid-\${id}\`);
        if (!el) continue;
        const { svg } = await mermaid.render(\`svg-\${id}-\${Date.now()}\`, src.trim());
        el.innerHTML = svg;
      }
    }

    function zoomDiagram(id, delta) {
      state.zoom[id] = delta === 0 ? 1 : Math.min(2.2, Math.max(0.5, (state.zoom[id] || 1) + delta));
      const el = document.getElementById(\`mermaid-\${id}\`);
      if (el) el.style.transform = \`scale(\${state.zoom[id]})\`;
    }`;

const NEW_LOOP = `      for (const [id, src] of Object.entries(MERMAID_DIAGRAMS)) {
        const el = document.getElementById(\`mermaid-\${id}\`);
        if (!el) continue;
        const { svg } = await mermaid.render(\`svg-\${id}-\${Date.now()}\`, src.trim());
        el.innerHTML = svg;
        measureDiagram(id);
        applyDiagramSize(id);
      }
    }

    function measureDiagram(id) {
      const svg = document.querySelector(\`#mermaid-\${id} svg\`);
      if (!svg) return;
      const box = svg.getBoundingClientRect();
      const vb = (svg.getAttribute('viewBox') || '').split(/[\\s,]+/).map(Number);
      state.natural[id] = {
        w: vb.length === 4 && vb[2] > 0 ? vb[2] : box.width || 300,
        h: vb.length === 4 && vb[3] > 0 ? vb[3] : box.height || 150
      };
    }

    /* Fit baseline: "100%" adapts to the diagram's natural size, so wide or
       small diagrams fill the stage instead of floating tiny in empty space.
       Upscale is capped so tiny diagrams don't blow up absurdly; oversized
       diagrams downscale to fit fully. */
    function computeFit(id) {
      const stage = document.getElementById(\`mermaid-\${id}\`)?.closest('.diagram-stage');
      const nat = state.natural[id];
      if (!stage || !nat) return 1;
      const availW = Math.max(0, stage.clientWidth - 32);  // p-4 on both sides
      const availH = Math.max(0, stage.clientHeight - 32);
      return Math.min(Math.min(availW / nat.w, availH / nat.h), 2.5);
    }

    function applyDiagramSize(id) {
      const svg = document.querySelector(\`#mermaid-\${id} svg\`);
      const nat = state.natural[id];
      if (!svg || !nat) return;
      state.fit[id] = computeFit(id);
      const scale = (state.zoom[id] || 1) * state.fit[id];
      // explicit pixel size: overrides mermaid's width:100%/max-width, which
      // collapses to the browser's 300x150 default inside a flex wrapper
      svg.style.maxWidth = 'none';
      svg.style.width = \`\${Math.round(nat.w * scale)}px\`;
      svg.style.height = \`\${Math.round(nat.h * scale)}px\`;
    }

    function zoomDiagram(id, delta) {
      state.zoom[id] = delta === 0 ? 1 : Math.min(3, Math.max(0.4, (state.zoom[id] || 1) + delta));
      applyDiagramSize(id);
    }

    let fitRaf = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(fitRaf);
      fitRaf = requestAnimationFrame(() => {
        for (const id of Object.keys(MERMAID_DIAGRAMS)) applyDiagramSize(id);
      });
    });`;

const OLD_DLSVG = `    function downloadSvg(id, filename) {
      const svg = document.querySelector(\`#mermaid-\${id} svg\`);
      if (!svg) return;
      const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml;charset=utf-8' });`;

const NEW_DLSVG = `    function downloadSvg(id, filename) {
      const svg = document.querySelector(\`#mermaid-\${id} svg\`);
      if (!svg) return;
      // export at the diagram's natural size, not the on-screen fitted zoom
      const out = svg.cloneNode(true);
      out.style.maxWidth = '';
      out.style.width = '';
      out.style.height = '';
      const nat = state.natural[id];
      if (nat) {
        out.setAttribute('width', nat.w);
        out.setAttribute('height', nat.h);
      }
      const blob = new Blob([out.outerHTML], { type: 'image/svg+xml;charset=utf-8' });`;

const RX_STAGE =
  /(<div class="diagram-stage[^"]*?) items-center justify-center(">\s*<div id="mermaid-[A-Za-z0-9-]+" class=")origin-center transition-transform duration-150(" \/><\/div>|">)/g;

const files = process.argv.slice(2);
let failures = 0;

for (const file of files) {
  let src = readFileSync(file, "utf8");
  const log = [];
  const before = src;

  // 1. stage centering -> overflow-safe (all diagram stages)
  src = src.replace(
    /(<div class="diagram-stage[^"]*?) items-center justify-center(">)/g,
    "$1$2"
  );
  src = src.replace(
    /(class=")origin-center transition-transform duration-150(")/g,
    "$1m-auto$2"
  );

  // 2. reset button title
  src = src.replaceAll('title="Reset zoom"', 'title="Reset to fit (100%)"');

  // 3. state: fit + natural registries (keep existing zoom keys)
  src = src.replace(
    /^([ \t]*)(zoom: \{[^}]*\})\n/m,
    "$1$2,  // user zoom multiplier relative to fit: 1 (100%) = fit-to-container\n" +
      "$1fit: {},            // per-diagram fit scale: natural size vs stage box\n" +
      "$1natural: {}         // per-diagram natural { w, h } from the mermaid viewBox\n"
  );

  // 4. render loop + fit/zoom functions
  if (!src.includes(OLD_LOOP)) { log.push("MISS old loop/zoom block"); } else { src = src.replace(OLD_LOOP, NEW_LOOP); }

  // 5. downloadSvg natural-size export
  if (!src.includes(OLD_DLSVG)) { log.push("MISS old downloadSvg block"); } else { src = src.replace(OLD_DLSVG, NEW_DLSVG); }

  const ok =
    src !== before &&
    src.includes("applyDiagramSize") &&
    !src.includes("style.transform = `scale(") &&
    !log.length;

  if (ok) {
    writeFileSync(file, src);
    console.log(`patched  ${file}`);
  } else {
    failures++;
    console.error(`FAILED   ${file}${log.length ? " -> " + log.join("; ") : ""}`);
  }
}

process.exitCode = failures ? 1 : 0;
