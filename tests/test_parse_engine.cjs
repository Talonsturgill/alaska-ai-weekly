'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const test = require('node:test');
const {collectSources} = require('../scripts/parse_engine.cjs');

const script = path.resolve(__dirname, '../scripts/parse_engine.cjs');
function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-parse-engine-'));
  t.after(() => fs.rmSync(directory, {recursive: true, force: true}));
  return directory;
}
function run(files) {
  return spawnSync(process.execPath, [script, ...files], {encoding: 'utf8'});
}

test('parses valid TS and TSX with a JSX child comment; writes no outputs', t => {
  const dir = fixture(t);
  const ts = path.join(dir, 'valid.ts'), tsx = path.join(dir, 'valid.tsx');
  // Deliberate type mismatch confirms this remains syntax-only, not a typecheck.
  fs.writeFileSync(ts, 'export const count: number = "not a number";');
  fs.writeFileSync(tsx, 'export const card = (<div>{/* valid JSX child */}<span/></div>);');
  const result = run([ts, tsx]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /2 source file\(s\), 0 failure/);
  assert.deepEqual(fs.readdirSync(dir).sort(), ['valid.ts', 'valid.tsx']);
});

test('invalid TS and misplaced JSX comment both fail with their source paths', t => {
  const dir = fixture(t);
  const ts = path.join(dir, 'broken.ts'), tsx = path.join(dir, 'bad-comment.tsx');
  fs.writeFileSync(ts, 'export const count: = 1;');
  fs.writeFileSync(tsx, 'export const card = ({/* not a JSX child */}<div/>);');
  const result = run([ts, tsx]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /2 source file\(s\), 2 failure/);
  assert.ok(result.stderr.includes(ts));
  assert.ok(result.stderr.includes(tsx));
  assert.match(result.stderr, /ERROR/);
});

test('extension determines loader, so JSX in a .ts file fails', t => {
  const dir = fixture(t), file = path.join(dir, 'wrong-loader.ts');
  fs.writeFileSync(file, 'export const card = <div/>;');
  const result = run([file]);
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes(file));
});

test('default discovery preserves the existing three source globs exactly', t => {
  const dir = fixture(t), src = path.join(dir, 'src');
  fs.mkdirSync(path.join(src, 'lib', 'nested'), {recursive: true});
  for (const relative of ['b.tsx', 'a.tsx', 'c.ts', 'skip.js', 'lib/shelf.tsx',
    'lib/not-in-old-glob.ts', 'lib/nested/not-in-old-glob.tsx']) {
    fs.writeFileSync(path.join(src, relative), '');
  }
  assert.deepEqual(collectSources(dir).map(file => path.relative(src, file)),
    ['a.tsx', 'b.tsx', 'c.ts', 'lib/shelf.tsx']);
});
