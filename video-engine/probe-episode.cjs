// One bundle and browser for an entire breadth-first look pass.
const fs = require('node:fs');
const path = require('node:path');
const {bundle} = require('@remotion/bundler');
const {openBrowser, selectComposition, renderStill} = require('@remotion/renderer');
(async () => {
  const [id, target, frameList] = process.argv.slice(2);
  if (!id || !target) throw new Error('Usage: node probe-episode.cjs COMPOSITION OUTPUT_DIR [framesCSV]');
  const props = JSON.parse(fs.readFileSync('../out/dispatch/episode_props.json'));
  const stamp = JSON.parse(fs.readFileSync('../out/dispatch/.run_stamp.json'));
  if (id !== stamp.composition) throw new Error('Wrong run composition');
  const frames = frameList ? frameList.split(',').map(Number) : [
    ...props.scenes.flatMap(s => [.24,.78].map(p => s.from + Math.floor(s.dur*p))),
    props.total-props.credits.frames+40, props.total-75];
  if(frames.some(f => !Number.isInteger(f) || f<0 || f>=props.total)) throw new Error('Frame out of bounds');
  fs.mkdirSync(target,{recursive:true});
  const serveUrl = await bundle({entryPoint:path.resolve('src/index.ts')});
  const browser = await openBrowser('chrome');
  try {
    const composition = await selectComposition({serveUrl,id,inputProps:props,puppeteerInstance:browser});
    for(const frame of frames) {
      await renderStill({serveUrl,composition,inputProps:props,puppeteerInstance:browser,
        frame,scale:.5,imageFormat:'png',output:path.resolve(target,`frame_${String(frame).padStart(5,'0')}.png`),overwrite:true});
      console.log(`LOOK ${frame}/${props.total}`);
    }
  } finally { await browser.close({silent:true}); }
})().catch(e=>{console.error(e);process.exitCode=1;});
