// Preflight-only instrumentation. The production source and renderer are unchanged.
const path = require('path');
const {createRequire} = require('module');
const req = createRequire(path.resolve(__dirname, '../video-engine/package.json'));
const ts = req('typescript');
const COMPONENTS = new Set(['Box', 'Type', 'Flap', 'Scope']);
function instrument(source, filename) {
  let sf = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (sf.parseDiagnostics.length) throw new Error('Preflight source has TSX parse errors');
  const sites = [], edits = [], declarations = new Set();
  const walk = (n, fn) => {fn(n); ts.forEachChild(n, c => walk(c, fn));};
  walk(sf, n => {
    if (ts.isVariableDeclaration(n) && COMPONENTS.has(n.name.getText(sf))) declarations.add(n.name.getText(sf));
    if (!(ts.isJsxSelfClosingElement(n) || ts.isJsxOpeningElement(n))) return;
    const name = n.tagName.getText(sf);
    if (!COMPONENTS.has(name)) return;
    const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
    const site = `${name}:${line}:${n.getStart(sf)}`;
    sites.push({site, line, component: name});
    edits.push([n.tagName.end, ` __guardSite=${JSON.stringify(site)}`]);
  });
  for (const name of COMPONENTS) {
    if (sites.some(s => s.component === name) && !declarations.has(name)) {
      throw new Error(`Uninstrumented imported ${name}; no runtime coverage contract`);
    }
  }
  for (const [at, insert] of edits.sort((a,b) => b[0]-a[0])) source = source.slice(0,at)+insert+source.slice(at);
  sf = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const wraps = [];
  walk(sf, n => {
    if (!ts.isVariableDeclaration(n) || !COMPONENTS.has(n.name.getText(sf))) return;
    const name = n.name.getText(sf), init = n.initializer;
    if (!init || !ts.isArrowFunction(init)) throw new Error(`Unsupported ${name} declaration; no runtime instrumentation`);
    // A neutral SVG group neither changes transforms nor adds layout. The real
    // component still executes its actual wrapping, font, geometry and props.
    const wrapped = `((__render:any)=>(__p:any)=><g data-guard-kind="${name}" data-guard-site={__p.__guardSite} data-guard-text-type={typeof __p.text}>{__render(__p)}</g>)(${init.getText(sf)})`;
    wraps.push([init.getStart(sf), init.end, wrapped]);
  });
  for (const [start,end,insert] of wraps.sort((a,b) => b[0]-a[0])) source=source.slice(0,start)+insert+source.slice(end);
  return {source, sites};
}
module.exports = function(source) {return instrument(source, this.resourcePath).source;};
module.exports.instrument = instrument;
