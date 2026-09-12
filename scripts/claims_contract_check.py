#!/usr/bin/env python3
"""Enforce the obligations a claim's note puts on the BUILD.

WHY THIS EXISTS (2026-08-06, after the panel found seven of these in one run).

claims.json is checked for what strings are ALLOWED on screen. It has never been checked
for what its notes REQUIRE. A note is prose sitting in a data file, so the build reads it,
agrees with it, and then quietly does something else — and nothing anywhere notices.

Every one of these shipped in a graded cut this run:

  c1   note: "SAY ROUGHLY."            -> the VO said "six hundred thousand dollars" flat,
                                          and later the card said "$600,000" bare.
  c6   note: "SCOPE. Plate readers ONLY. Never widen."
                                       -> shipped as "OBJECT RECOGNITION", scope dropped,
                                          and a VO line claimed Anchorage recognises faces.
  c7   note: "HIS CHARACTERIZATION, not a finding. Attribute on screen."
                                       -> the quote shipped bare, so a contested
                                          characterisation read as a finding about the code.
  c13  approved on_screen "NO VENDOR NAMED"
                                       -> the build shortened it to "NOT NAMED", which reads
                                          as a person being unnamed, not a procurement fact.
  c18  note: "Attribute to the chief."  -> stated as fact, on screen and in the VO.
  c19  the Fairbanks counter-point      -> never shipped at all, in any frame or line, while
                                          the other city's counter-cards were drawn.
  c20  note: "MUST SHIP WITH c21."      -> shipped, and its own speaker line rendered
                                          underneath another card, invisible.

Judges caught all seven. That is judge time spent re-deriving something the fact-checker had
already written down, which is the most expensive way possible to learn it.

HOW IT WORKS. Obligations live in a machine-readable `requires` block on the claim, so they
are data rather than prose:

    "requires": {
      "on_screen_verbatim": true,          # the approved string, exactly, no paraphrase
      "spoken_contains": ["roughly"],      # the VO line must carry this hedge
      "attribution_on_screen": "McCORMICK",# a distinctive token from `label` must be drawn
      "must_ship_with": ["c21"],           # if this is drawn, so is that
      "must_ship": true                    # this claim has to appear somewhere at all
    }

`contract.on_screen_all` additionally requires every approved context string
(for example PLANNED and GENERAL METHODS EXAMPLE), even when display wording is
independently amended. These checks resolve source routes, not rendered visibility.

The prose note stays: it is what a human reads. The `requires` block is what the machine
reads. Whoever writes claims.json writes both, and they must agree.

Exit 1 on any unmet obligation.
"""
import argparse
import json
import math
import os
import re
import subprocess
import sys
from functools import lru_cache

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def engine_text(path):
    with open(path) as handle:
        return handle.read()


def _norm(t):
    """Reduce text to comparable content: no punctuation, no case, single spaces.

    Parsing JS string literals with a regex was the first approach and it broke on the
    escaped apostrophe in `'"WE JUST DON\\'T HAVE'`, silently reporting a card that was on
    screen as missing. A checker that cries wolf gets switched off, so this compares CONTENT
    instead: strip the JSX attribute names, drop every character that is not a letter,
    a digit or a space, and collapse. A card split across two `lines` entries, or across
    StatCard's big= and sub=, then reads as the one string it renders as.
    """
    # COMMENTS ARE NOT ON SCREEN. Caught in this checker's own regression test: deleting
    # both MIKE SANDERS attribution plates still passed, because the source comments explain
    # at length why Sanders must be credited. A checker that reads its own documentation as
    # evidence will certify anything that is well described and not drawn.
    t = re.sub(r"/\*.*?\*/", " ", t, flags=re.S)
    t = re.sub(r"^\s*//.*$", " ", t, flags=re.M)
    t = re.sub(r"\b[\w-]+=", " ", t)              # JSX attribute names
    t = t.replace("&quot;", " ").replace("&apos;", " ").replace("\u2019", "'")
    t = re.sub(r"[^A-Za-z0-9 ]+", "", t.upper())
    return " ".join(t.split())


@lru_cache(maxsize=16)
def _normalized_engine(engine):
    return _norm(engine)


def drawn(engine, s):
    """Is this string's CONTENT drawn anywhere in the engine?"""
    if not s:
        return False
    n = _norm(s)
    return bool(n) and n in _normalized_engine(engine)


# This is deliberately a SMALL adapter, not a TSX interpreter or permission to search
# arbitrary props. The installed TypeScript parser proves this episode's live data path.
# Unsupported changes add NO dynamic evidence. Comments/dead string literals cannot
# impersonate JSX; changing the renderer, binding, timing, or wrapper invalidates it.
_EP0903_ROUTE = r"""
const fs = require('fs'), ts = require(process.argv[1]);
const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const parse = s => ts.createSourceFile('episode.tsx', s, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const file = parse(input.engine), printer = ts.createPrinter({removeComments:true});
const canon = n => printer.printNode(ts.EmitHint.Unspecified, n, n.getSourceFile()).replace(/\s+/g, '');
const expr = s => parse('const probe='+s+';').statements[0].declarationList.declarations[0].initializer;
const same = (n,s) => n && canon(n)===canon(expr(s));
const need = (ok, why) => {if (!ok) throw Error(why);};
const walk = (n, fn) => {fn(n); ts.forEachChild(n,c=>walk(c,fn));};
function declaration(name) {
  const found=[];
  for(const s of file.statements) if(ts.isVariableStatement(s))
    for(const d of s.declarationList.declarations) if(d.name.getText(file)===name) found.push(d.initializer);
  need(found.length===1 && ts.isArrowFunction(found[0]), 'unresolved '+name+' component');
  return found[0];
}
function returned(fn) {
  need(ts.isBlock(fn.body),'expected component block');
  const returns=[];
  function visit(n) {
    if(n!==fn.body && ts.isFunctionLike(n)) return;
    if(ts.isReturnStatement(n)) returns.push(n);
    ts.forEachChild(n,visit);
  }
  visit(fn.body);
  need(returns.length===1 && fn.body.statements.at(-1)===returns[0], 'conditional/early component return');
  return returns[0].expression;
}
const tag = n => (ts.isJsxElement(n)?n.openingElement:ts.isJsxSelfClosingElement(n)?n:null)?.tagName.getText(file);
const children = n => n.children?.filter(c=>!ts.isJsxText(c)||c.text.trim()) || [];
function bare(n,name) {
  return ts.isJsxElement(n) && tag(n)===name && n.openingElement.attributes.properties.length===0;
}
try {
  need(!file.parseDiagnostics.length,'invalid TSX');
  const templates = {
    SVG: "({children})=><svg width={W} height={H} viewBox=\"0 0 1080 1920\" style={{position:'absolute',inset:0,overflow:'visible'}}>{children}</svg>",
    Type: "({text,x=540,y,size=42,color=INK,width=900,weight=900})=><text x={x} y={y} fill={color} textAnchor=\"middle\" fontFamily={FONT} fontWeight={weight} fontSize={Math.min(size,width/(text.length*.61))}>{text}</text>",
    Label: "({text,x=540,y,width=810,color=CREAM})=><g><rect x={x-width/2+5} y={y-35+7} width={width} height={54} rx={9} fill={INK} opacity={.18}/><rect x={x-width/2} y={y-35} width={width} height={54} rx={9} fill={color} stroke={INK} strokeWidth={3}/><Type text={text} x={x} y={y} size={29} width={width-28}/></g>"
  };
  for(const [name,template] of Object.entries(templates))
    need(same(declaration(name),template), 'unsupported '+name+' text/visibility binding');
  const shot=declaration('Shot');
  need(shot.parameters.length===1 && canon(shot.parameters[0])==='{n,from,dur,beats,lines}', 'unresolved Shot props');
  const bindings={f:'useCurrentFrame()',g:'f+from',seconds:'g/30',elapsed:'beats.filter(b=>b.at<=seconds+.005)',active:'elapsed[elapsed.length-1]'};
  for(const [name,value] of Object.entries(bindings)) {
    const ds=shot.body.statements.filter(ts.isVariableStatement).flatMap(s=>[...s.declarationList.declarations]).filter(d=>d.name.getText(file)===name);
    need(ds.length===1 && same(ds[0].initializer,value),'unresolved '+name+' timeline binding');
  }
  const protectedNames=new Set(['f','g','seconds','elapsed','active','n','from','beats']);
  const rootName=n=>ts.isIdentifier(n)?n.text:(ts.isPropertyAccessExpression(n)||ts.isElementAccessExpression(n))?rootName(n.expression):'';
  walk(shot.body,n=>{
    if(ts.isBinaryExpression(n) && n.operatorToken.kind>=ts.SyntaxKind.FirstAssignment && n.operatorToken.kind<=ts.SyntaxKind.LastAssignment)
      need(!protectedNames.has(rootName(n.left)),'mutated label/timeline binding');
    if(ts.isPrefixUnaryExpression(n)||ts.isPostfixUnaryExpression(n)||ts.isDeleteExpression(n))
      need(!protectedNames.has(rootName(n.operand||n.expression)),'mutated label/timeline binding');
    if(ts.isCallExpression(n) && protectedNames.has(rootName(n.expression)))
      need(ts.isPropertyAccessExpression(n.expression)&&['filter','find'].includes(n.expression.name.text),'unsupported timeline mutation/call');
  });
  const render=returned(shot);
  need(bare(render,'AbsoluteFill'),'unsupported Shot return wrapper');
  const labels=[];
  for(const svg of children(render).filter(n=>bare(n,'SVG')))
    for(const c of children(svg)) if(ts.isJsxExpression(c)&&c.expression) {
      const m=canon(c.expression).match(/^active&&!\(\[([\d,]*)\]\.includes\(n\)\)&&<Labeltext=\{active\.label\}y=\{1278\}width=\{900\}\/>$/);
      if(m) labels.push(m[1]?m[1].split(',').map(Number):[]);
    }
  need(labels.length===1,'missing or unresolved live active.label renderer/suppression');
  const ep=declaration('Ep0903');
  need(ep.parameters.length===1 && canon(ep.parameters[0])==='{captions=[],scenes=[],total=3932,lines=[],beats=[],credits,mouth=[],accents=[]}', 'unresolved episode props');
  need(ep.body.statements.length===2 && canon(ep.body.statements[0])==='constend=total-(credits?.frames??369);','unresolved credits timing');
  need(same(returned(ep), `<VoiceProvider data={{fps:30,mouth,accents}}><AbsoluteFill style={{backgroundColor:SAGE}}>{scenes.map((s,i)=><Sequence key={i} from={s.from} durationInFrames={s.dur} name={\`S\${i+1}\`}><Shot n={i+1} from={s.from} dur={s.dur} beats={beats} lines={lines}/></Sequence>)}<Captions cues={captions}/>{credits&&<Sequence from={end} durationInFrames={credits.frames} name="CREDITS"><EndCredits data={credits} durationInFrames={credits.frames}/></Sequence>}</AbsoluteFill></VoiceProvider>`),'unresolved episode-to-scene/beat routing');
  // The selected source must also be a real 30fps composition, not a stranded file.
  const root=parse(input.root), compositions=[];
  need(!root.parseDiagnostics.length,'invalid Root TSX');
  const imports=root.statements.filter(ts.isImportDeclaration).filter(s=>s.moduleSpecifier.text==='./Ep0903');
  need(imports.some(s=>s.importClause?.namedBindings && ts.isNamedImports(s.importClause.namedBindings) && s.importClause.namedBindings.elements.some(e=>e.name.text==='Ep0903' && (!e.propertyName||e.propertyName.text==='Ep0903'))), 'unresolved Ep0903 import');
  const roots=root.statements.filter(ts.isVariableStatement).flatMap(s=>[...s.declarationList.declarations]).filter(d=>d.name.getText(root)==='RemotionRoot');
  need(roots.length===1 && ts.isArrowFunction(roots[0].initializer),'unresolved RemotionRoot');
  let tree=returned(roots[0].initializer);
  while(ts.isParenthesizedExpression(tree)) tree=tree.expression;
  need(ts.isJsxFragment(tree),'unsupported Root composition wrapper');
  for(const n of children(tree)) if(ts.isJsxSelfClosingElement(n)&&n.tagName.getText(root)==='Composition') {
    const attrs=Object.fromEntries(n.attributes.properties.filter(ts.isJsxAttribute).map(a=>[a.name.getText(root),a.initializer]));
    if(attrs.component && ts.isJsxExpression(attrs.component) && attrs.component.expression?.getText(root)==='Ep0903') compositions.push(attrs);
  }
  need(compositions.length===1 && compositions[0].fps && canon(compositions[0].fps)==='{30}', 'unresolved 30fps composition');
  need(compositions[0].calculateMetadata && same(compositions[0].calculateMetadata.expression, '({props})=>({durationInFrames:(props as {total?:number}).total??3765})'), 'unresolved composition duration');
  console.log(JSON.stringify({suppressed:labels[0],fps:30}));
} catch(e) { console.log(JSON.stringify({error:e.message})); }
"""


@lru_cache(maxsize=8)
def _dynamic_route(engine, root):
    result = subprocess.run(
        ["node", "-e", _EP0903_ROUTE, os.path.join(REPO, "video-engine", "node_modules", "typescript")],
        input=json.dumps({"engine": engine, "root": root}), capture_output=True,
        text=True, timeout=20, check=True)
    route = json.loads(result.stdout)
    if route.get("error"):
        raise ValueError(route["error"])
    return route


def dynamic_labels(engine, props, root):
    """Return only reachable Ep0903 beat labels, with inclusive/exclusive frame spans.

    This adds source-route evidence, NOT an image visibility/readability audit. Other
    episode structures retain the legacy source check; their props earn no credit.
    """
    if not re.search(r"\bEp0903\b", engine):
        return [], "no supported dynamic-label adapter for this episode"
    try:
        route = _dynamic_route(engine, root)
        if not isinstance(props, dict):
            raise ValueError("props must be an object")
        scenes, beats, total = props.get("scenes"), props.get("beats"), props.get("total")
        integer = lambda n: type(n) is int and n >= 0
        if not integer(total) or total == 0 or not isinstance(scenes, list) or not scenes or not isinstance(beats, list):
            raise ValueError("missing/invalid total, scenes, or beats")
        end = total
        if props.get("credits") is not None:
            credits = props["credits"]
            if not isinstance(credits, dict) or not integer(credits.get("frames")) or not 0 < credits["frames"] <= total:
                raise ValueError("unresolved credits interval")
            end -= credits["frames"]
        previous_end = 0
        for s in scenes:
            if (not isinstance(s, dict) or not integer(s.get("from")) or not integer(s.get("dur"))
                    or s["dur"] == 0 or s["from"] < previous_end or s["from"] + s["dur"] > total):
                raise ValueError("invalid/overlapping scene frame routing")
            previous_end = s["from"] + s["dur"]
        previous_at, ids = -1, set()
        for b in beats:
            if (not isinstance(b, dict) or not integer(b.get("id")) or b["id"] in ids
                    or type(b.get("at")) not in (int, float) or not math.isfinite(b["at"])
                    or b["at"] <= previous_at or b["at"] < 0
                    or not isinstance(b.get("label"), str) or not b["label"].strip()):
                raise ValueError("invalid/unsorted/duplicate beat routing")
            previous_at = b["at"]
            ids.add(b["id"])
        evidence = []
        # Simulate the same 30fps comparison as Shot, not rounded beat onset times.
        # One interval can cross a cut; suppressed scenes contribute NO frames.
        for number, s in enumerate(scenes, 1):
            if number in route["suppressed"]:
                continue
            spans = {}
            for frame in range(s["from"], min(s["from"] + s["dur"], end)):
                active = None
                for b in beats:
                    if b["at"] <= frame / route["fps"] + .005:
                        active = b
                    else:
                        break
                if active:
                    span = spans.setdefault(active["id"], {"beat_id": active["id"], "label": active["label"],
                                                          "scene": number, "from": frame, "to": frame + 1})
                    span["to"] = frame + 1
            evidence.extend(spans.values())
        return evidence, "Ep0903 beat → active.label → Label → SVG text; frame spans resolved"
    except (OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError) as exc:
        return [], f"dynamic labels NOT RESOLVED (no props credit): {exc}"


# Imported source is not evidence merely because an import exists. This bounded
# adapter follows the live Ep0912 -> Shot 4 -> EEGDemo0912 -> SVG text path. It
# accepts only literal text at the two verified text sinks, never comments,
# arbitrary helper strings, props metadata, or conditionally dead JSX.
_EP0912_HELPER_ROUTE = r"""
const fs=require('fs'), ts=require(process.argv[1]);
const input=JSON.parse(fs.readFileSync(0,'utf8'));
const parse=s=>ts.createSourceFile('scene.tsx',s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const printer=ts.createPrinter({removeComments:true});
const canon=n=>printer.printNode(ts.EmitHint.Unspecified,n,n.getSourceFile()).replace(/\s+/g,'');
const expr=s=>parse('const probe='+s+';').statements[0].declarationList.declarations[0].initializer;
const same=(n,s)=>n&&canon(n)===canon(expr(s));
const need=(ok,why)=>{if(!ok)throw Error(why);};
const walk=(n,fn)=>{fn(n);ts.forEachChild(n,c=>walk(c,fn));};
const unwrap=n=>ts.isParenthesizedExpression(n)?unwrap(n.expression):n;
function variable(file,name){
 const found=file.statements.filter(ts.isVariableStatement).flatMap(s=>[...s.declarationList.declarations]).filter(d=>d.name.getText(file)===name);
 need(found.length===1,'unresolved '+name); return found[0].initializer;
}
function returned(fn){
 need(ts.isArrowFunction(fn)&&ts.isBlock(fn.body),'unresolved component function');
 const ret=[]; function visit(n){if(n!==fn.body&&ts.isFunctionLike(n))return;if(ts.isReturnStatement(n))ret.push(n);ts.forEachChild(n,visit);}
 visit(fn.body);need(ret.length===1&&fn.body.statements.at(-1)===ret[0],'conditional/early return');return unwrap(ret[0].expression);
}
const opening=n=>ts.isJsxElement(n)?n.openingElement:ts.isJsxSelfClosingElement(n)?n:null;
const tag=n=>opening(n)?.tagName.getText(n.getSourceFile());
const attrs=n=>Object.fromEntries([...opening(n).attributes.properties].filter(ts.isJsxAttribute).map(a=>[a.name.getText(),a.initializer]));
function imported(file,module,name){return file.statements.filter(ts.isImportDeclaration).some(s=>s.moduleSpecifier.text===module&&s.importClause?.namedBindings&&ts.isNamedImports(s.importClause.namedBindings)&&s.importClause.namedBindings.elements.some(e=>e.name.text===name&&(!e.propertyName||e.propertyName.text===name)));}
try{
 const file=parse(input.engine),helper=parse(input.helper),root=parse(input.root);
 need(![file,helper,root].some(f=>f.parseDiagnostics.length),'invalid TSX');
 need(imported(file,'./EEGDemo0912','EEGDemo0912'),'missing live helper import');
 need(imported(root,'./Ep0912','Ep0912'),'missing episode import');
 const rootTree=returned(variable(root,'RemotionRoot'));need(ts.isJsxFragment(rootTree),'unresolved composition wrapper');
 const compositions=rootTree.children.filter(n=>tag(n)==='Composition'&&same(attrs(n).component?.expression,'Ep0912')).map(attrs);
 need(compositions.length===1&&same(compositions[0].fps?.expression,'30'),'missing 30fps episode composition');
 const episode=variable(file,'Ep0912');
 const episodeTree=returned(episode);
 need(tag(episodeTree)==='VoiceProvider'&&same(attrs(episodeTree).data?.expression,'{fps:30,mouth,accents}'),'unresolved episode provider');
 const fills=episodeTree.children.filter(n=>tag(n)==='AbsoluteFill');
 need(fills.length===1&&same(attrs(fills[0]).style?.expression,'{backgroundColor:SKY}'),'unresolved episode wrapper');
 const sceneMaps=fills[0].children.filter(n=>ts.isJsxExpression(n)&&same(n.expression,'scenes.map((s,i)=><Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i+1}`}><Shot n={i+1} from={s.from} dur={s.dur} beats={beats}/></Sequence>)'));
 need(sceneMaps.length===1,'unresolved episode-to-Shot routing');
 const shot=variable(file,'Shot'),shotTree=returned(shot);
 const shotBindings=shot.body.statements.filter(ts.isVariableStatement).flatMap(s=>[...s.declarationList.declarations]);
 for(const [name,value]of Object.entries({f:'useCurrentFrame()',g:'f+from'})){
  const ds=shotBindings.filter(d=>d.name.getText(file)===name);need(ds.length===1&&same(ds[0].initializer,value),'unresolved helper frame clock');
 }
 need(same(variable(file,'e'),`(f:number,a=0,d=24)=>interpolate(f,[a,a+d],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.18,.8,.25,1)})`),'unresolved helper easing clock');
 const bpBindings=shotBindings.filter(d=>d.name.getText(file)==='bp');
 need(bpBindings.length===1&&same(bpBindings[0].initializer,'(id:number,d=25,lag=0)=>e(g-lag,(beats.find(b=>b.id===id)?.at??999)*30,d)'),'unresolved helper beat function');
 const starts=shot.body.statements.filter(s=>ts.isIfStatement(s)&&same(s.expression,'n===1'));
 need(starts.length===1,'unresolved numbered shot chain');let branch=starts[0];
 for(let i=1;i<=4;i++){need(ts.isIfStatement(branch)&&same(branch.expression,'n==='+i),'unresolved shot condition');if(i<4)branch=branch.elseStatement;}
 need(same(branch.thenStatement.expression,'art=<EEGDemo0912 f={g} observationAt={(beats.find(b=>b.id===11)?.at??999)*30} bp={bp}/>'),'helper not directly assigned to Shot 4');
 const artHosts=[];walk(shotTree,n=>{if(tag(n)==='Plane'&&same(attrs(n).z?.expression,'0'))artHosts.push(n);});
 need(artHosts.length===1&&same(artHosts[0],'<Plane z={0}><SVG><PaperFiber id="fiber0912" ruleColor={GROUND}/>{art}</SVG></Plane>'),'missing live art plane');
 need(same(variable(file,'SVG'),`({children})=><svg width={W} height={H} viewBox="0 0 1080 1920" style={{position:'absolute',inset:0,overflow:'visible'}}>{children}</svg>`),'unresolved SVG children sink');
 // Reject hiding/conditional wrappers on the helper's art route.
 for(let n=artHosts[0];n&&n!==shotTree.parent;n=n.parent){
  if(ts.isJsxExpression(n)||ts.isBinaryExpression(n)||ts.isConditionalExpression(n))throw Error('conditional art route');
  if(opening(n)){const a=attrs(n);need(!a.opacity&&!a.display&&!a.visibility&&!a.style,'hidden/unsupported art wrapper');}
 }
 const demo=variable(helper,'EEGDemo0912'),tree=returned(demo);
 need(helper.statements.some(s=>ts.isVariableStatement(s)&&s.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword)&&s.declarationList.declarations.some(d=>d.name.getText(helper)==='EEGDemo0912')),'helper is not exported');
 const ds=demo.body.statements.filter(ts.isVariableStatement).flatMap(s=>[...s.declarationList.declarations]);
 const local=name=>{const d=ds.filter(d=>d.name.getText(helper)===name);need(d.length===1,'unresolved helper '+name);return d[0].initializer;};
 // Only these clocks control the verified text routes. The contact hand's
 // reach/release/touch animation contains no claim text, and its unsupported
 // opacity subtrees remain opaque to scan() below. A decorative clock rename
 // must not invalidate unrelated text or grant labels in a new route credit.
 const expected={observe:'clamp(bp(11,32))',isolate:'clamp(bp(12,26))',signal:'clamp(bp(10,56))'};
 for(const [name,value]of Object.entries(expected))need(same(local(name),value),'unresolved visibility binding '+name);
 need(same(variable(helper,'clamp'),'(n:number)=>Math.max(0,Math.min(1,n))'),'unresolved visibility clamp');
 const label=local('label');need(ts.isArrowFunction(label),'unresolved label function');
 const sink=unwrap(label.body);
 need(tag(sink)==='text'&&same(sink,'<text x={x} y={y} textAnchor="middle" fill={fill} fontFamily={MONO} fontSize={size} fontWeight={800}>{text}</text>'),'unresolved label text sink');
 const protectedNames=new Set(Object.keys(expected));
 walk(demo.body,n=>{if(ts.isBinaryExpression(n)&&n.operatorToken.kind>=ts.SyntaxKind.FirstAssignment&&n.operatorToken.kind<=ts.SyntaxKind.LastAssignment)need(!protectedNames.has(n.left.getText(helper)),'mutated helper visibility');});
 const allowedOpacity=new Set(['1-isolate','signal','isolate','observe*(1-isolate)']);
 const labels=[];
 function scan(n){
  if(ts.isJsxExpression(n)){
   const e=n.expression;if(!e)return;
   if(ts.isCallExpression(e)&&e.expression.getText(helper)==='label'&&ts.isStringLiteral(e.arguments[0])){
    need(e.arguments.length>=3&&e.arguments.slice(1).every(a=>ts.isNumericLiteral(a)||ts.isIdentifier(a)||ts.isBinaryExpression(a)),'unresolved label arguments');
    if(e.arguments[3])need(ts.isNumericLiteral(e.arguments[3])&&Number(e.arguments[3].text)>0,'hidden label size');
    labels.push(e.arguments[0].text);
   }else if(ts.isJsxElement(e)||ts.isJsxSelfClosingElement(e))scan(e);
   return; // No credit for conditional expressions or unrelated calls.
  }
  if(!opening(n))return;
  const a=attrs(n);if(a.display||a.visibility||a.style)return;
  if(a.transform&&ts.isStringLiteral(a.transform)&&/scale\(\s*0(?:\s|,|\))/.test(a.transform.text))return;
  if(a.opacity){if(!ts.isJsxExpression(a.opacity)||!allowedOpacity.has(canon(a.opacity.expression)))return;}
  if(tag(n)==='text'){
   if(a.fill&&ts.isStringLiteral(a.fill)&&a.fill.text==='none')return;
   if(a.fontSize&&(!ts.isJsxExpression(a.fontSize)||!ts.isNumericLiteral(a.fontSize.expression)||Number(a.fontSize.expression.text)<=0))return;
   if(n.children?.every(c=>ts.isJsxText(c)))labels.push(n.children.map(c=>c.text).join(' ').trim());
   return;
  }
  if(!['g'].includes(tag(n)))return;
  for(const c of n.children||[])scan(c);
 }
 scan(tree);console.log(JSON.stringify({labels:[...new Set(labels.filter(Boolean))]}));
}catch(e){console.log(JSON.stringify({error:e.message}));}
"""


def imported_labels(engine_path, engine, props, root):
    """Resolve the one supported imported SVG-text route, never a source glob."""
    if os.path.basename(engine_path) != "Ep0912.tsx":
        return [], "no supported imported-label adapter for this episode"
    try:
        scenes, beats = props["scenes"], props["beats"]
        if (not isinstance(scenes, list) or not isinstance(beats, list)
                or len({b["id"] for b in beats}) != len(beats)
                or any(type(b["at"]) not in (int, float) or not math.isfinite(b["at"]) for b in beats)):
            raise ValueError("invalid helper scene/beat data")
        scene = scenes[3]
        start, end = scene["from"] / 30, (scene["from"] + scene["dur"]) / 30
        at = {b["id"]: b["at"] for b in beats}
        content_end = (props["total"] - (props.get("credits") or {}).get("frames", 0)) / 30
        if not (0 <= start < at[10] < at[11] < at[12] < end <= content_end
                and at[11] + 1 < at[12] and start <= at[40] < at[12]):
            raise ValueError("no resolved recording/credit visibility interval in Shot 4")
        helper_path = os.path.join(os.path.dirname(os.path.abspath(engine_path)), "EEGDemo0912.tsx")
        result = subprocess.run(
            ["node", "-e", _EP0912_HELPER_ROUTE,
             os.path.join(REPO, "video-engine", "node_modules", "typescript")],
            input=json.dumps({"engine": engine, "helper": engine_text(helper_path), "root": root}),
            capture_output=True, text=True, timeout=20, check=True)
        route = json.loads(result.stdout)
        if route.get("error"):
            raise ValueError(route["error"])
        return [{"label": s, "source": helper_path, "scene": 4} for s in route["labels"]], \
            "Ep0912 -> Shot 4 -> EEGDemo0912 -> literal SVG text; source route resolved"
    except (OSError, ValueError, KeyError, IndexError, TypeError, subprocess.SubprocessError) as exc:
        return [], f"imported labels NOT RESOLVED (no helper credit): {exc}"


def _report_prose(prose_only, total):
    """Never let a clean line imply coverage this gate did not provide."""
    if not prose_only:
        return
    n = sum(k for _, k in prose_only)
    print(f"\nNOT MACHINE-CHECKED HERE: {n} prose obligation(s) across "
          f"{len(prose_only)} of {total} claim(s).")
    print("  " + ", ".join(f"{cid}({k})" for cid, k in prose_only))
    print("  These are written for a human and for vo_claims_check.py, which covers the "
          "NARRATION side only.")
    print("  Nothing here verified them against what is DRAWN. An obligation about an "
          "on-screen string")
    print("  (a qualifier, an as-of date, an attribution) is invisible to every gate in this "
          "repo unless")
    print("  it is also written as a `contract` block. If one of these constrains a card, "
          "write it as one.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--claims", default=os.path.join(REPO, "out", "dispatch", "claims.json"))
    ap.add_argument("--vo", default=os.path.join(REPO, "out", "dispatch", "vo_script.txt"))
    ap.add_argument("--engine", default=None)
    ap.add_argument("--props", default=os.path.join(REPO, "out", "dispatch", "episode_props.json"))
    a = ap.parse_args()

    eng_path = a.engine
    if eng_path is None:
        sys.path.insert(0, os.path.join(REPO, "scripts"))
        from caption_band_check import default_targets
        eng_path = default_targets()[0]

    doc = json.loads(engine_text(a.claims))
    claims = doc["claims"] if isinstance(doc, dict) and "claims" in doc else doc
    engine = engine_text(eng_path)
    try:
        props = json.loads(engine_text(a.props))
        root = engine_text(os.path.join(os.path.dirname(os.path.abspath(eng_path)), "Root.tsx"))
        label_evidence, route_note = dynamic_labels(engine, props, root)
        helper_evidence, helper_note = imported_labels(eng_path, engine, props, root)
    except (OSError, ValueError) as exc:
        label_evidence, route_note = [], f"dynamic labels NOT RESOLVED (no props credit): {exc}"
        helper_evidence, helper_note = [], "imported labels NOT RESOLVED (no helper credit)"
    print(f"Dynamic label evidence: {len(label_evidence)} scene/beat interval(s); {route_note}.")
    print(f"Imported label evidence: {len(helper_evidence)} label(s); {helper_note}.")
    print("  Source-route evidence only; rendered legibility and occlusion require visual QA.")

    def appears(text):
        # Keep each label separate: adjacent metadata strings must not invent a card.
        return drawn(engine, text) or any(drawn(item["label"], text)
                                         for item in label_evidence + helper_evidence)

    vo = engine_text(a.vo)
    by_id = {c["id"]: c for c in claims}

    problems, checked, prose_only = [], 0, []
    for c in claims:
        # `requires` may be PROSE (a list written by the fact-checker for humans and for
        # vo_claims_check.py) or a machine contract (a dict). A list used to crash this
        # gate outright with AttributeError, which BLOCKED the panel on a shape mismatch
        # rather than on a defect. Machine assertions now live in `contract`; a prose-only
        # claim is skipped here and still checked by vo_claims_check.py.  (2026-08-08)
        req = c.get("contract") or c.get("requires") or {}
        if isinstance(req, list):
            # PROSE OBLIGATIONS ARE STILL OBLIGATIONS, AND THIS GATE MUST SAY SO (2026-08-09).
            # Skipping them silently was the whole defect. On this run all 22 claims carried
            # prose `requires` and not one carried a machine `contract`, so the gate printed
            # "0 obligation(s) met, none outstanding" -- a sentence indistinguishable from a
            # film whose every obligation was checked and honoured. Two judges then found, by
            # reading, that c17's own requirement ("labelled on screen as of 2026-08-09") was
            # unmet on screen. A gate whose clean output means "I checked nothing" is worse
            # than no gate, because a run reads it and moves on.
            if [x for x in req if str(x).strip()]:
                prose_only.append((c["id"], len([x for x in req if str(x).strip()])))
            req = {}
        elif isinstance(req, str):
            # THE SAME PROSE OBLIGATION, WRITTEN AS ONE STRING INSTEAD OF A LIST (2026-08-12).
            # The list branch above was added on 08-09 because prose obligations were being
            # skipped silently. It only ever handled the list spelling, so a fact-checker who
            # wrote `"requires": "..."` as a plain sentence, which is the natural way to write
            # one obligation and which this run's claims all use, walked straight into
            # req.get("must_ship") on a str and took the whole gate down with an AttributeError.
            #
            # A crash is at least loud, so this is not the silent-skip defect returning. But
            # preflight reported it as one FAIL line among fourteen checks and the run read
            # past it, so in practice this gate has not evaluated a single obligation all run.
            # Count it as prose, the same as the list spelling, and let vo_claims_check.py
            # carry it.
            if req.strip():
                prose_only.append((c["id"], 1))
            req = {}
        if not req:
            continue
        cid = c["id"]
        on = c.get("on_screen") or ""
        is_drawn = appears(on)

        # COUNT THE EVALUATION, NOT THE FAILURE (2026-08-08). This increment sat inside the
        # failure branch, so a run where every must_ship obligation was SATISFIED reported
        # "0 obligation(s) met, none outstanding" — a passing gate and a gate that graded
        # nothing print the identical line. That distinction is the whole value of the
        # report. Twice already this run a checker announced clean while reading the wrong
        # file or returning early, and the only reason either was caught is that a number
        # somewhere looked wrong. A counter that cannot tell 8-and-all-fine from 0 takes
        # that last signal away.
        if req.get("must_ship"):
            checked += 1
            if not is_drawn and not appears(c.get("spoken") or ""):
                problems.append(f"{cid}: requires must_ship, but its approved string "
                                f"{on!r} appears nowhere in {os.path.basename(eng_path)}.")

        if req.get("on_screen_verbatim") and on:
            checked += 1
            if not is_drawn:
                near = [ln.strip() for ln in engine.split("\n")
                        if on.split(":")[0][:16] and on.split(":")[0][:16] in ln][:1]
                hint = f" Closest line drawn: {near[0][:90]}" if near else ""
                problems.append(f"{cid}: requires on_screen_verbatim, so the card must read "
                                f"exactly {on!r}. It does not.{hint}")

        for tok in req.get("spoken_contains") or []:
            checked += 1
            if tok.lower() not in vo.lower():
                problems.append(f"{cid}: note requires the narration to carry {tok!r} "
                                f"(its `note` says so); vo_script.txt does not contain it.")

        # Equivalent display wording may be independently approved in claims.json,
        # but its attribution/status/limit context must remain an obligation too.
        context = req.get("on_screen_all", [])
        if not isinstance(context, list) or any(not isinstance(t, str) or not _norm(t) for t in context):
            checked += 1
            problems.append(f"{cid}: invalid on_screen_all context contract; use a list of nonempty display strings.")
            context = []
        for text in context:
            checked += 1
            if not appears(text):
                problems.append(f"{cid}: requires on-screen context {text!r}; it is missing.")

        att = req.get("attribution_on_screen")
        if att:
            checked += 1
            if is_drawn and not appears(att):
                problems.append(f"{cid}: its note requires an on-screen attribution and the "
                                f"quote IS drawn, but no card carries {att!r}. "
                                f"Speaker per claims.json: {c.get('label')!r}.")

        for other in req.get("must_ship_with") or []:
            checked += 1
            o = by_id.get(other)
            if is_drawn and o and not appears(o.get("on_screen") or ""):
                problems.append(f"{cid} requires must_ship_with {other}, and {cid} is drawn, "
                                f"but {other} ({o.get('on_screen')!r}) is not.")

    if problems:
        for p in problems:
            print(f"FAIL {p}")
        print(f"\nclaims_contract_check: {len(problems)} unmet obligation(s) "
              f"across {checked} check(s).")
        print("These are instructions the fact-checker wrote FOR the build, in the claim")
        print("record. A note the build can decline is not a safeguard, it is a suggestion.")
        _report_prose(prose_only, len(claims))
        return 1
    print(f"claims_contract_check: {checked} machine obligation(s) met, none outstanding")
    _report_prose(prose_only, len(claims))
    return 0


if __name__ == "__main__":
    sys.exit(main())
