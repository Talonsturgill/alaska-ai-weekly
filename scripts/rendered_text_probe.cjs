// Browser-native text preflight for local SVG Box/Type episodes. No raster/OCR,
// copied font-width formula, guessed camera matrix, or production-source edits.
const fs=require('fs'),path=require('path'),os=require('os'),http=require('http');
const {createRequire}=require('module');
const engine=path.resolve(__dirname,'../video-engine'), req=createRequire(path.join(engine,'package.json'));
const {instrument}=require('./rendered_text_loader.cjs');

// Runs in the same Chrome document as the actual Remotion composition.
async function measureDocument() {
  await document.fonts.ready;
  const sites=[],texts=[],fit=[],bounds=[],issues=[];
  const styles=new Map(),opacities=new Map();
  const styleOf=e=>{if(!styles.has(e))styles.set(e,getComputedStyle(e));return styles.get(e);};
  const opacity=e=>{if(!(e instanceof Element))return 1;if(opacities.has(e))return opacities.get(e);const s=styleOf(e);const o=s.display==='none'||s.visibility==='hidden'?0:Number(s.opacity)*opacity(e.parentElement);opacities.set(e,o);return o;};
  const loadedFonts=new Set(Array.from(document.fonts).filter(f=>f.status==='loaded').map(f=>f.family.replace(/["']/g,'')));
  const boxRect=e=>Array.from(e.querySelectorAll('rect')).find(r=>r.closest('[data-guard-kind="Box"]')===e);
  const rectData=r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom});
  for(const e of document.querySelectorAll('[data-guard-site]')) {
    const site=e.getAttribute('data-guard-site'),kind=e.getAttribute('data-guard-kind');
    sites.push(site);
    if(['Type','Box','Flap'].includes(kind)&&e.getAttribute('data-guard-text-type')!=='string')issues.push({site,why:'Display text is not a resolved string'});
    if(kind==='Box') {
      const r=boxRect(e),runs=Array.from(e.querySelectorAll('text'));
      if(!r||!runs.length) {issues.push({site,why:'Box has no measurable plate and text rows'});continue;}
      // getBBox is local font geometry. The actual glyphs must fit the actual
      // rectangle; a camera cannot excuse an overflow inside a plate.
      const plate=r.getBBox(), sw=parseFloat(styleOf(r).strokeWidth)||0;
      for(const t of runs) {
        const b=t.getBBox(),style=styleOf(t);
        const family=style.fontFamily.split(',')[0].replace(/["']/g,'').trim();
        if(!loadedFonts.has(family) ||
           !document.fonts.check(`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`))issues.push({site,why:'Declared rendered font not loaded; fallback metrics are not evidence'});
        fit.push({site,text:t.textContent,size:parseFloat(style.fontSize),text_w:b.width,
          plate:[plate.x,plate.x+plate.width],margin_l:b.x-plate.x-sw/2,
          margin_r:plate.x+plate.width-b.x-b.width-sw/2,
          top:b.y-plate.y-sw/2,bottom:plate.y+plate.height-b.y-b.height-sw/2});
      }
      if(opacity(e)>=.95)bounds.push({site,kind:'Box',text:runs.map(t=>t.textContent).join(' '),...rectData(r.getBoundingClientRect())});
    }
  }
  for(const e of document.querySelectorAll('svg text')) {
    const text=e.textContent||'',parent=e.closest('[data-guard-site]');
    const site=parent?.getAttribute('data-guard-site')||'rendered-library-text';
    if(!text.trim())continue;
    // Include opacity-hidden mounted text for copy coverage: it can appear later.
    texts.push({site,text});
    if(!e.closest('[data-guard-kind="Box"]')&&opacity(e)>=.95) {
      const r=e.getBoundingClientRect();
      if(!Number.isFinite(r.width)||r.width<=0)issues.push({site,why:'Nonempty text has no measurable bounds'});
      // Captions/credits have their own layout contracts. They remain in copy
      // extraction; here only instrumented local Type is claimed for projection.
      if(parent)bounds.push({site,kind:'Type',text,...rectData(r)});
    }
  }
  return {sites,texts,fit,bounds,issues};
}

async function run(options) {
  const source=fs.realpathSync(options.source),props=JSON.parse(fs.readFileSync(options.props,'utf8'));
  const raw=fs.readFileSync(source,'utf8'),meta=instrument(raw,source);
  const exported=options.component||raw.match(/export\s+const\s+(Ep\w+)\s*:/)?.[1];
  if(!exported)throw new Error('No unambiguous episode export; specify component');
  if(!Array.isArray(props.scenes)||!props.scenes.length||props.scenes.some(s=>!Number.isInteger(s.from)||!Number.isInteger(s.dur)||s.from<0||s.dur<=0))throw new Error('Actual props need nonempty integer scene ranges');
  for(let i=0;i<props.scenes.length;i++)if(props.scenes[i].from!==(i?props.scenes[i-1].from+props.scenes[i-1].dur:0))throw new Error('Actual scene ranges must be contiguous from frame zero');
  const total=props.scenes.at(-1).from+props.scenes.at(-1).dur;
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'dispatch-text-preflight-'));
  let browser,server;
  try {
    const entry=path.join(temporary,'entry.tsx');
    fs.writeFileSync(entry,`import React from "react";
import {registerRoot,Composition} from "remotion";
import {${exported} as Film} from ${JSON.stringify(source)};
registerRoot(()=> <Composition id="TextPreflight" component={Film} width={1080} height={1920} fps={30} durationInFrames={${total}} defaultProps={${JSON.stringify(props)}}/>);`);
    const {bundle}=req('@remotion/bundler');
    const folder=await bundle({entryPoint:entry,rootDir:engine,outDir:path.join(temporary,'bundle'),publicDir:path.join(engine,'public'),
      webpackOverride:config=>{config.module.rules.unshift({test:/\.tsx?$/,include:[source],enforce:'pre',use:[{loader:path.join(__dirname,'rendered_text_loader.cjs')}]});return config;}});
    server=http.createServer((request,response)=>{
      const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
      const file=path.resolve(folder,'.'+(pathname==='/'?'/index.html':pathname));
      if(!file.startsWith(folder+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){response.writeHead(404);response.end();return;}
      const mime={'.js':'text/javascript','.html':'text/html','.css':'text/css','.ttf':'font/ttf','.woff2':'font/woff2','.json':'application/json'}[path.extname(file)]||'application/octet-stream';
      response.writeHead(200,{'Content-Type':mime});fs.createReadStream(file).pipe(response);
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const url=`http://127.0.0.1:${server.address().port}`;
    const {openBrowser,renderStill}=req('@remotion/renderer');
    browser=await openBrowser('chrome',{logLevel:'error'});
    let page,closePage;
    const newPage=browser.newPage.bind(browser);
    browser.newPage=async function(args){page=await newPage(args);closePage=page.close.bind(page);page.close=async()=>{};return page;};
    await renderStill({serveUrl:url,composition:{id:'TextPreflight',width:1080,height:1920,fps:30,durationInFrames:total,props,defaultProps:props},
      inputProps:props,frame:0,puppeteerInstance:browser,logLevel:'error',imageFormat:'png'});
    browser.newPage=newPage;
    const {seekToFrame}=require(path.join(path.dirname(req.resolve('@remotion/renderer')),'seek-to-frame.js'));
    const seen=new Set(),copies=new Map(),fit=new Map(),bounds=new Map(),issues=new Map(),perScene={};
    const retain=(map,key,item)=>{if(!map.has(key))map.set(key,item);};
    const frames=options.previewFrames||Array.from({length:total},(_,i)=>i);
    if(!frames.length||frames.some(f=>!Number.isInteger(f)||f<0||f>=total))throw new Error('Invalid advisory preview frames');
    for(const frame of frames) {
      if(frame)await seekToFrame({frame,page,composition:'TextPreflight',timeoutInMilliseconds:30000,logLevel:'error',indent:false,attempt:0});
      const data=await page.evaluate(measureDocument);
      const scene=props.scenes.findIndex(s=>frame>=s.from&&frame<s.from+s.dur)+1;
      perScene[scene]=(perScene[scene]||0)+1;
      for(const site of data.sites)seen.add(site);
      for(const item of data.texts)retain(copies,item.site+'|'+item.text,item);
      for(const item of data.fit){const key=item.site+'|'+item.text;const old=fit.get(key);if(!old||Math.min(item.margin_l,item.margin_r,item.top,item.bottom)<Math.min(old.margin_l,old.margin_r,old.top,old.bottom))fit.set(key,{...item,frame,scene});}
      for(const item of data.bounds){const key=item.site+'|'+item.text+'|'+scene;const old=bounds.get(key);if(!old)bounds.set(key,{...item,frame,scene});else bounds.set(key,{...old,left:Math.min(old.left,item.left),right:Math.max(old.right,item.right),top:Math.min(old.top,item.top),bottom:Math.max(old.bottom,item.bottom)});}
      for(const item of data.issues)retain(issues,item.site+'|'+item.why,{...item,frame,scene});
      if(frame%300===0)process.stderr.write(`Rendered text preflight ${frame}/${total} frames\n`);
    }
    for(const site of meta.sites)if(!seen.has(site.site))issues.set(site.site,{...site,why:'Source display site never mounted in actual frame range; coverage unresolved'});
    if(!fit.size||!bounds.size||!copies.size)issues.set('zero',{why:'ZERO runtime text/plate/projection coverage'});
    await closePage();
    return {version:1,source,props:options.props,complete:!options.previewFrames,frames_measured:frames.length,story_frames:total,scene_frames:perScene,sites_expected:meta.sites.length,sites_measured:seen.size,
      fit:[...fit.values()],bounds:[...bounds.values()],copy_literals:[...copies.values()],issues:[...issues.values()],
      limits:'Every story frame measured using actual Chrome SVG fonts and CSS3D projection. Plate fit is local glyph-to-rect; frame bounds cover local Box/Type at cumulative opacity>=0.95. Does not detect character occlusion, clipping by unrelated shapes, or imported artwork plate geometry. Credits excluded from geometry and checked separately through actual props.'};
  } finally {
    if(browser)await browser.close({silent:true});
    if(server)await new Promise(resolve=>server.close(resolve));
    fs.rmSync(temporary,{recursive:true,force:true});
  }
}
if(require.main===module)run(JSON.parse(fs.readFileSync(process.argv[2],'utf8'))).then(data=>fs.writeFileSync(process.argv[3],JSON.stringify(data,null,2)+'\n')).catch(error=>{process.stderr.write(error.stack+'\n');process.exitCode=1;});
module.exports={measureDocument,run};
