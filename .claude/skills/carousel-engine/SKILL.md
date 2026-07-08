---
name: carousel-engine
description: Render engine + QA harness for Alaska.Ai LinkedIn carousel slides. Turns per-slide HTML/CSS/SVG/Canvas art into exact 1080x1350 PNGs (2x scale), a vector-text PDF for LinkedIn upload, feed-size thumbnails, and a contact sheet — with objective machine QA (render errors, missing fonts, clipped/offscreen/tiny text, contrast estimates, safe-zone violations). Use whenever building or reviewing carousel slides. The engine is a HARNESS, not a template — every deck's art is bespoke code written per run.
---

# carousel-engine — render + QA harness

The quality layer is fixed; the art is not. Slides are hand-coded HTML files
(one per slide) using any mix of CSS, SVG, Canvas 2D, D3, and the committed
art libraries. This engine renders them deterministically, checks them
objectively, and assembles the deliverables.

## Pipeline (per run)

```bash
bash .claude/skills/carousel-engine/bootstrap.sh          # once per session; installs pip deps

# 1. write slides to      out/<run>/slides/slide-01.html ... slide-NN.html
python .claude/skills/carousel-engine/render.py \
    --slides-dir out/<run>/slides --out-dir out/<run>/render        # PNGs + render_report.json
python .claude/skills/carousel-engine/qa.py --render-dir out/<run>/render   # machine_qa.json, exit!=0 on FAIL
python .claude/skills/carousel-engine/assemble.py \
    --slides-dir out/<run>/slides --render-dir out/<run>/render \
    --out-dir out/<run>/final --title "<document title>"            # carousel.pdf (VECTOR text) + contact sheet + thumbs
```

Re-render only fixed slides with `--only 3,7`. Read every report; never ship a
FAIL. `qa.py` warnings are advisories for the pixel critics, not free passes.

## Slide HTML contract

- One file per slide: `slide-01.html`, `slide-02.html`, ... Design for the
  viewport: exactly **1080x1350 CSS px**. `margin: 0`; nothing may scroll.
- Reference committed assets ONLY via the `@@ASSETS@@` token (the engine
  resolves it to an absolute `file://` path):
  ```html
  <link rel="stylesheet" href="@@ASSETS@@/fonts/fonts.css">
  <script src="@@ASSETS@@/js/noise.js"></script>      <!-- AK.simplex2/fbm2/warp2/rng -->
  <script src="@@ASSETS@@/js/ak3d.js"></script>        <!-- AK3D software 3D renderer -->
  <script src="@@ASSETS@@/js/zdog.min.js"></script>    <!-- Zdog pseudo-3D (no GPU) -->
  <script src="@@ASSETS@@/js/d3.v7.min.js"></script>
  <script src="@@ASSETS@@/js/topojson-client.min.js"></script>
  ```
  Geodata via `fetch("@@ASSETS@@/geo/alaska-state.geo.json")` (boroughs,
  us-states, world-land, alaska-places also available). **NO external URLs,
  no CDNs, no Google Fonts** — render.py rejects any `http(s)://` reference.
- **Async art must gate the screenshot**: set
  `window.renderReady = new Promise(resolve => { ...draw, then resolve() })`.
  The engine awaits it (30s cap). Without it you get a 400ms grace only.
- **Canvas = 2x backing store.** Any `<canvas>` styled at `W x H` CSS px must
  have `canvas.width = W*2; canvas.height = H*2; ctx.scale(2,2)`. Screenshots
  are taken at deviceScaleFactor 2 and the PDF embeds the canvas bitmap — a
  1x canvas ships blurry.
- **Text is HTML/SVG, never canvas.** Canvas text rasterizes in the PDF;
  HTML/SVG text stays vector, survives LinkedIn's recompression, and feeds
  LinkedIn's semantic ranker + accessibility mode. Draw art on canvas; set
  type in DOM/SVG layers above it.
- Mark intentionally-tiny or bleeding text (footers, coordinates, watermark
  type used as texture) with `data-decorative` so QA doesn't flag it:
  `<div data-decorative class="coords">61°13'N</div>`
- Determinism: seed all noise (`AK.reseed(seed)`, `AK.rng(seed)`). Derive the
  seed from the run date. Same inputs must reproduce the same pixels.
- Fonts: use `assets/fonts/fonts.css` families — Fraunces (100-900 + italic,
  opsz), JetBrains Mono (400/500/700), Space Grotesk (300-700), Archivo
  (100-900, stretch 62%-125%), Manrope (200-800), Instrument Serif (+italic),
  Bricolage Grotesque (200-800, stretch 75-100%), Unbounded (200-900).
  Never request a weight/family not declared there (QA fails missing fonts).
  No faux bold/italic.

## Hard numbers (from the knowledge base; QA enforces the starred ones)

- Canvas 1080x1350 (4:5). PDF page = same. *Body overflow = hard fail.*
- *Text floor 24px* (warn), body text >= 32px, headlines 60-110px, hook
  display 120-170px. A 1080px canvas reads at ~390px on phones (x0.36).
- Safe zone: primary text inside **80px margins** (warn outside); keep
  ~150px clear top/bottom on the panorama's text columns for platform UI.
- Contrast: body text >= 4.5:1 against its local background. QA estimates;
  the pixel critic verifies the worst-case point.
- PDF: vector mode required (assemble_report.json `pdf_mode: "vector"`);
  target 2-25 MB.

## In this directory

- `render.py` — HTML -> PNG at 2x + in-page QA extraction (`render_report.json`)
- `qa.py` — machine gate over PNGs + report (`machine_qa.json`, exit 1 on FAIL)
- `assemble.py` — vector PDF (Chromium print + pypdf merge), contact sheet,
  432px feed thumbs (`assemble_report.json`)
- `bootstrap.sh` — pip deps (playwright, pypdf, img2pdf; Pillow/numpy present)

## Art libraries (committed, offline)

- `assets/js/noise.js` — seeded simplex 2D/3D, fbm, domain warp (`AK.*`)
- `assets/js/ak3d.js` — software 3D: perspective camera, heightfield/box
  meshes, painter's z-sort, Lambert + fog, 3D polylines & point clouds (`AK3D.*`)
- `assets/js/zdog.min.js` — Zdog round pseudo-3D engine (canvas, no GPU)
- `assets/js/d3.v7.min.js` + `topojson-client.min.js` — maps & dataviz
- `assets/geo/alaska-state.geo.json` — Alaska outline, true lon/lat (137 rings)
- `assets/geo/alaska-boroughs.geo.json` — all 29 boroughs/census areas
- `assets/geo/alaska-places.json` — 40+ places with lon/lat/tags + the
  canonical Alaska projection recipe:
  `d3.geoConicEqualArea().parallels([55,65]).rotate([154,0]).fitExtent(...)`
- `assets/geo/us-states-10m.json` (pre-projected AlbersUsa TopoJSON, lower-48
  context only), `assets/geo/world-land-110m.json` (unprojected TopoJSON —
  use for globes/great-circle work)

WebGL/three.js: `--enable-unsafe-swiftshader` is passed but treat WebGL as
**experimental** — probe `canvas.getContext('webgl')` and keep a Canvas-2D
fallback. Everything needed is achievable without it (AK3D, Zdog, CSS 3D
transforms, SVG lighting filters all render reliably headless).

## Review artifacts

The pixel critics must Read (as images): every `render/slide-XX.png` (full
size) AND `final/thumbs/slide-XX-thumb.png` (feed size) AND
`final/contact_sheet.png` (the whole deck in sequence for flow/continuity).
