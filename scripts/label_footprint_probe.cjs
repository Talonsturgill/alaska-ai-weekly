// Browser measurement for scripts/label_footprint_check.py. It renders the real composition in
// the same Chrome that renders the film, seeks sampled frames, and asks the document two things
// about every visible SVG <text>: is part of it outside the 1080x1920 frame, and what share of
// its glyph cells sit under art painted AFTER it (a character, a quote card, the corner chip,
// another label). No source parsing, no camera model: getBoundingClientRect carries the Frame's
// CSS camera and elementsFromPoint carries the paint order, so a sign behind Dotty, a plate under
// a quote card and a card past the frame after a push-in are all the same measurement.
// The production source is not instrumented or changed.
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http');
const {createRequire} = require('module');
const engine = path.resolve(__dirname, '../video-engine'), req = createRequire(path.join(engine, 'package.json'));

// Runs inside the page. Element identity across frames is kept on window so a label is followed
// through a shot even when its text or transform changes.
function measureLabels() {
  const W = 1080, H = 1920, FA = W * H, CAPTION_TOP = 1330;
  if (!window.__lfIds) { window.__lfIds = new WeakMap(); window.__lfNext = 1; }
  const idOf = (e) => { if (!window.__lfIds.has(e)) window.__lfIds.set(e, window.__lfNext++); return window.__lfIds.get(e); };
  const styles = new Map(), ops = new Map();
  const st = (e) => { if (!styles.has(e)) styles.set(e, getComputedStyle(e)); return styles.get(e); };
  const op = (e) => {
    if (!(e instanceof Element)) return 1;
    if (ops.has(e)) return ops.get(e);
    const s = st(e);
    const o = s.display === 'none' || s.visibility === 'hidden' ? 0 : Number(s.opacity) * op(e.parentElement);
    ops.set(e, o);
    return o;
  };
  const paints = (e) => {
    const s = st(e);
    const fill = s.fill !== 'none' && s.fill !== 'transparent' ? Number(s.fillOpacity) : 0;
    const stroke = s.stroke !== 'none' && s.stroke !== 'transparent' ? Number(s.strokeOpacity) : 0;
    return Math.max(fill, stroke);
  };
  const isCaption = (e) => !!e.closest('[data-band="ok"]') && e.getBoundingClientRect().top >= CAPTION_TOP;
  const own = (t) => {
    // The label's own group: the nearest transformed <g> that is not much bigger than the text.
    // A plate's rect, its shadow and its sibling lines live there and never count against it.
    const tr = t.getBoundingClientRect(), ta = Math.max(1, tr.width * tr.height);
    let g = t.parentElement, best = null, near = null;
    while (g && g.tagName.toLowerCase() === 'g') {
      const r = g.getBoundingClientRect();
      if (r.width * r.height > 12 * ta) break;
      if (!near) near = g;
      if (g.hasAttribute('transform')) best = g;
      g = g.parentElement;
    }
    return best || near;
  };
  const describe = (e) => {
    const r = e.getBoundingClientRect(), tag = e.tagName.toLowerCase();
    if (tag === 'text') return `the label '${(e.textContent || '').trim().slice(0, 30)}'`;
    return `a ${tag} (${Math.round(r.width)}x${Math.round(r.height)} at x ${Math.round(r.left)}..${Math.round(r.right)}, fill ${st(e).fill})`;
  };
  const out = [];
  for (const t of document.querySelectorAll('svg text')) {
    const text = (t.textContent || '').trim();
    if (!text || op(t) < 0.95 || isCaption(t)) continue;
    const r = t.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 12)) continue;                 // under ~10 px type nobody reads it as clipped
    if (r.right <= 0 || r.left >= W || r.bottom <= 0 || r.top >= H) continue;   // wholly off frame, not shown
    const cut = r.left < -1 || r.right > W + 1 || r.top < -1 || r.bottom > H + 1;
    const mine = own(t);
    const cols = Math.max(4, Math.min(48, Math.round(r.width / 7)));
    let onText = 0, covered = 0, left = 0, right = 0;
    const by = new Map();
    for (const fy of [0.48, 0.72]) {
      for (let i = 0; i < cols; i++) {
        const x = r.left + (i + 0.5) * r.width / cols, y = r.top + fy * r.height;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const stack = document.elementsFromPoint(x, y);
        const at = stack.indexOf(t);
        if (at < 0) continue;                       // between glyph cells of a rotated label
        onText++;
        for (let k = 0; k < at; k++) {
          const e = stack[k];
          if (!(e instanceof SVGElement) || t.contains(e) || (mine && mine.contains(e))) continue;
          const tag = e.tagName.toLowerCase();
          if (tag === 'svg' || tag === 'g' || tag === 'defs' || tag === 'clippath') continue;
          if (isCaption(e)) continue;               // caption_band_check owns the caption band
          const er = e.getBoundingClientRect();
          if (er.width * er.height > 0.5 * FA) continue;     // full-frame grade, sky or wipe
          if (er.width < 10 && er.height < 10) continue;     // a flake or a spark passing over
          if (op(e) * paints(e) < 0.4) continue;
          covered++;
          if (i < cols / 2) left++; else right++;
          const d = describe(e);
          by.set(d, (by.get(d) || 0) + 1);
          break;
        }
      }
    }
    const frac = onText ? covered / onText : 0;
    if (!cut && frac === 0) { out.push({id: idOf(t), text, frac: 0, cut: false, onText}); continue; }
    const top = [...by.entries()].sort((a, b) => b[1] - a[1])[0];
    out.push({id: idOf(t), text, frac, cut, onText, side: left >= right ? 'left' : 'right',
      by: top ? top[0] : null, box: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]});
  }
  return out;
}

async function run(options) {
  const source = fs.realpathSync(options.source), props = JSON.parse(fs.readFileSync(options.props, 'utf8'));
  const raw = fs.readFileSync(source, 'utf8');
  const exported = options.component || raw.match(/export\s+const\s+(Ep\w+)\s*:/)?.[1];
  if (!exported) throw new Error('No unambiguous episode export; pass component');
  if (!Array.isArray(props.scenes) || !props.scenes.length) throw new Error('Props need scene ranges');
  const total = props.scenes.at(-1).from + props.scenes.at(-1).dur;
  const step = Math.max(1, options.step || 3);
  const shots = options.shots && options.shots.length ? new Set(options.shots) : null;
  const frames = [];
  props.scenes.forEach((s, i) => {
    if (shots && !shots.has(i + 1)) return;
    for (let f = s.from; f < s.from + s.dur; f += step) frames.push(f);
  });
  if (!frames.length) throw new Error('No frames selected');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-label-footprint-'));
  let browser, server;
  try {
    const entry = path.join(temporary, 'entry.tsx');
    fs.writeFileSync(entry, `import React from "react";
import {registerRoot,Composition} from "remotion";
import {${exported} as Film} from ${JSON.stringify(source)};
registerRoot(()=> <Composition id="LabelFootprint" component={Film} width={1080} height={1920} fps={30} durationInFrames={${total}} defaultProps={${JSON.stringify(props)}}/>);`);
    const {bundle} = req('@remotion/bundler');
    const folder = await bundle({entryPoint: entry, rootDir: engine, outDir: path.join(temporary, 'bundle'), publicDir: path.join(engine, 'public')});
    server = http.createServer((request, response) => {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const file = path.resolve(folder, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(folder + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404); response.end(); return; }
      const mime = {'.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.json': 'application/json'}[path.extname(file)] || 'application/octet-stream';
      response.writeHead(200, {'Content-Type': mime}); fs.createReadStream(file).pipe(response);
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}`;
    const {openBrowser, renderStill} = req('@remotion/renderer');
    browser = await openBrowser('chrome', {logLevel: 'error'});
    let page, closePage;
    const newPage = browser.newPage.bind(browser);
    browser.newPage = async function (args) { page = await newPage(args); closePage = page.close.bind(page); page.close = async () => {}; return page; };
    await renderStill({serveUrl: url, composition: {id: 'LabelFootprint', width: 1080, height: 1920, fps: 30, durationInFrames: total, props, defaultProps: props},
      inputProps: props, frame: frames[0], puppeteerInstance: browser, logLevel: 'error', imageFormat: 'png'});
    browser.newPage = newPage;
    const {seekToFrame} = require(path.join(path.dirname(req.resolve('@remotion/renderer')), 'seek-to-frame.js'));
    const samples = [];
    for (const frame of frames) {
      await seekToFrame({frame, page, composition: 'LabelFootprint', timeoutInMilliseconds: 30000, logLevel: 'error', indent: false, attempt: 0});
      await page.evaluate(() => document.fonts.ready.then(() => true));
      const labels = await page.evaluate(measureLabels);
      const shot = props.scenes.findIndex((s) => frame >= s.from && frame < s.from + s.dur) + 1;
      samples.push({frame, shot, labels});
      if (samples.length % 200 === 0) process.stderr.write(`label footprint ${samples.length}/${frames.length} frames\n`);
    }
    await closePage();
    return {version: 1, source, props: options.props, step, frames: frames.length, total, samples};
  } finally {
    if (browser) await browser.close({silent: true});
    if (server) await new Promise((resolve) => server.close(resolve));
    fs.rmSync(temporary, {recursive: true, force: true});
  }
}
if (require.main === module) run(JSON.parse(fs.readFileSync(process.argv[2], 'utf8')))
  .then((data) => fs.writeFileSync(process.argv[3], JSON.stringify(data) + '\n'))
  .catch((error) => { process.stderr.write(error.stack + '\n'); process.exitCode = 1; });
module.exports = {measureLabels, run};
