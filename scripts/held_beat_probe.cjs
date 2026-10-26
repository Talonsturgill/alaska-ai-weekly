// Browser frames for scripts/held_beat_check.py --source (machine pass 2026-10-26).
//
// The camera-solved held-beat measure ran only on the delivered master, so a beat whose objects
// are statues was named after a 20 minute render, and on 10-22, 10-24, 10-25 and 10-26 the panel
// named it first. Every input to that measure except the pixels is known before the render: the
// strip windows come from the board and the VO clock (build_evidence.conformed_moves). This
// renders exactly those frames in the same Chrome that renders the film, using the same bundle
// and seek path as label_footprint_probe.cjs, and writes one PNG per requested frame. The
// production source is not instrumented or changed.
//
//   node scripts/held_beat_probe.cjs <options.json> <outdir>
//   options: {source, props, frames: [int...], component?}
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http');
const {createRequire} = require('module');
const engine = path.resolve(__dirname, '../video-engine'), req = createRequire(path.join(engine, 'package.json'));

async function run(options, outdir) {
  const source = fs.realpathSync(options.source), props = JSON.parse(fs.readFileSync(options.props, 'utf8'));
  const raw = fs.readFileSync(source, 'utf8');
  const exported = options.component || raw.match(/export\s+const\s+(Ep\w+)\s*:/)?.[1];
  if (!exported) throw new Error('No unambiguous episode export; pass component');
  if (!Array.isArray(props.scenes) || !props.scenes.length) throw new Error('Props need scene ranges');
  const total = props.scenes.at(-1).from + props.scenes.at(-1).dur;
  const frames = [...new Set((options.frames || []).map((f) => Math.max(0, Math.min(total - 1, Math.round(f)))))].sort((a, b) => a - b);
  if (!frames.length) throw new Error('No frames requested');
  fs.mkdirSync(outdir, {recursive: true});
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-held-beat-'));
  let browser, server;
  try {
    const entry = path.join(temporary, 'entry.tsx');
    fs.writeFileSync(entry, `import React from "react";
import {registerRoot,Composition} from "remotion";
import {${exported} as Film} from ${JSON.stringify(source)};
registerRoot(()=> <Composition id="HeldBeat" component={Film} width={1080} height={1920} fps={30} durationInFrames={${total}} defaultProps={${JSON.stringify(props)}}/>);`);
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
    await renderStill({serveUrl: url, composition: {id: 'HeldBeat', width: 1080, height: 1920, fps: 30, durationInFrames: total, props, defaultProps: props},
      inputProps: props, frame: frames[0], puppeteerInstance: browser, logLevel: 'error', imageFormat: 'png'});
    browser.newPage = newPage;
    const dist = path.dirname(req.resolve('@remotion/renderer'));
    const {seekToFrame} = require(path.join(dist, 'seek-to-frame.js'));
    const {screenshot} = require(path.join(dist, 'puppeteer-screenshot.js'));
    let n = 0;
    for (const frame of frames) {
      await seekToFrame({frame, page, composition: 'HeldBeat', timeoutInMilliseconds: 30000, logLevel: 'error', indent: false, attempt: 0});
      await page.evaluate(() => document.fonts.ready.then(() => true));
      await screenshot({page, type: 'png', path: path.join(outdir, `f${String(frame).padStart(5, '0')}.png`),
        omitBackground: false, width: 1080, height: 1920, scale: 1});
      if (++n % 40 === 0) process.stderr.write(`held beat probe ${n}/${frames.length} frames\n`);
    }
    await closePage();
    return {version: 1, source, frames, total};
  } finally {
    if (browser) await browser.close({silent: true});
    if (server) await new Promise((resolve) => server.close(resolve));
    fs.rmSync(temporary, {recursive: true, force: true});
  }
}
if (require.main === module) run(JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), process.argv[3])
  .then((data) => process.stdout.write(JSON.stringify(data) + '\n'))
  .catch((error) => { process.stderr.write(error.stack + '\n'); process.exitCode = 1; });
module.exports = {run};
