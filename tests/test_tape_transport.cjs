// Run: node --test tests/test_tape_transport.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const engineRequire = createRequire(path.resolve(__dirname, '../video-engine/package.json'));
const ts = engineRequire('typescript');
const React = engineRequire('react');
const {renderToStaticMarkup} = engineRequire('react-dom/server');

// Narrow loader for the actual TSX asset and its local TypeScript dependencies.
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
      fileName: filename,
    });
    module._compile(compiled.outputText, filename);
  };
}
const {FullTapeMachine, PAPER, TAPE_BRAKE_FRAMES, tapeReelPhase} =
  require('../video-engine/src/lib/paper.tsx');
const {GearLever, GripHand} = require('../video-engine/src/lib/props.tsx');
const draw = (props) => renderToStaticMarkup(React.createElement('svg', null,
  React.createElement(FullTapeMachine, {f: 60, x: 0, y: 0, ...props})));
const angularDifference = (a, b) => ((a - b + 540) % 360) - 180;

test('omitted transport preserves the exact legacy fill formula', () => {
  for (const f of [-1, 0, 0.5, 11, 100, 3000]) {
    for (const fill of [-1, 0, 0.5, 0.994, 0.995, 1, 2]) {
      const k = Math.max(0, Math.min(1, fill));
      assert.equal(tapeReelPhase(f, fill), k >= 0.995 ? 0 : (f * (5.5 - k * 4.6)) % 360);
    }
  }
  const legacy = draw({fill: 0});
  assert.ok(legacy.includes(`fill="${PAPER.brass}"`));
  assert.ok(legacy.includes(`fill="${PAPER.stamp}"`));
  assert.ok(!legacy.includes('>FULL</text>'));
  assert.ok(draw({fill: 1}).includes('>FULL</text>'));
});

test('global-frame pause is position/velocity continuous and brakes to an exact hold', () => {
  for (const pausedAt of [0, 75.5, 2958]) {
    for (const fill of [0, 0.5]) {
      const speed = 5.5 - fill * 4.6;
      const phase = (f) => tapeReelPhase(f, fill, 'paused', pausedAt);
      assert.equal(phase(pausedAt), tapeReelPhase(pausedAt, fill, 'running'));
      assert.equal(phase(pausedAt - 1), tapeReelPhase(pausedAt - 1, fill, 'running'));
      const epsilon = 0.00001;
      assert.ok(Math.abs(angularDifference(phase(pausedAt + epsilon), phase(pausedAt)) / epsilon - speed) < 0.0001);
      let previousStep = speed;
      for (let elapsed = 1; elapsed <= TAPE_BRAKE_FRAMES; elapsed++) {
        const step = angularDifference(phase(pausedAt + elapsed), phase(pausedAt + elapsed - 1));
        assert.ok(step >= 0 && step < previousStep);
        previousStep = step;
      }
      const stopped = phase(pausedAt + TAPE_BRAKE_FRAMES);
      assert.equal(phase(pausedAt + 1000), stopped);
      // Seeking backwards after a later frame cannot change the result.
      phase(pausedAt + 10000);
      assert.equal(phase(pausedAt + TAPE_BRAKE_FRAMES), stopped);
    }
  }
});

test('initially paused stays parked; pause does not imply full or erase tape', () => {
  for (const f of [0, 3, 30, 3000]) assert.equal(tapeReelPhase(f, 0.4, 'paused'), 0);
  const paused = draw({f: 3000, fill: 0.4, transport: 'paused', pausedAt: 2958});
  assert.ok(!paused.includes('>FULL</text>'));
  assert.ok(paused.includes('r="29.6"'));
  assert.ok(paused.includes('r="36.4"'));
  assert.ok(!paused.includes(`fill="${PAPER.stamp}"`));
  // FULL remains capacity information if the caller independently fills the tape.
  assert.ok(draw({fill: 1, transport: 'paused'}).includes('>FULL</text>'));
});

test('palette overrides and gradient ids remain isolated at shared coordinates', () => {
  const renderPair = (x) => renderToStaticMarkup(React.createElement('svg', null,
    React.createElement(FullTapeMachine, {f: 30, x, y: 0, bodyColor: '#207864', accentColor: '#EA8C60'}),
    React.createElement(FullTapeMachine, {f: 30, x, y: 0, bodyColor: '#355D50', accentColor: '#E5F0D9'})));
  const markup = renderPair(0);
  const ids = [...markup.matchAll(/<linearGradient id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, 2);
  assert.equal(new Set(ids).size, 2);
  for (const id of ids) assert.ok(markup.includes(`fill="url(#${id})"`));
  assert.ok(markup.includes('fill="#EA8C60"'));
  assert.ok(markup.includes('fill="#E5F0D9"'));
  assert.deepEqual([...renderPair(100).matchAll(/<linearGradient id="([^"]+)"/g)].map((m) => m[1]), ids);
  assert.equal(renderPair(0), markup);
});

test('long-throw lever shares one shaft/grip pivot and preserves legacy defaults', () => {
  const renderLever = (props) => renderToStaticMarkup(React.createElement('svg', null,
    React.createElement(GearLever, {x: 0, y: 0, pulled: 0, ...props})));
  const legacy = renderLever({pulled: 1});
  assert.ok(legacy.includes('rotate(0 -46 14)'));
  assert.ok(legacy.includes('x="-53" y="-4" width="13" height="78"'));
  assert.ok(legacy.includes('cx="-46" cy="-6" r="14"'));
  const start = renderLever({longThrow: true, pulled: 0, accentColor: '#EA8C60'});
  const finish = renderLever({longThrow: true, pulled: 1, accentColor: '#EA8C60'});
  assert.ok(start.includes('rotate(-40 -46 14)'));
  assert.ok(finish.includes('rotate(40 -46 14)'));
  assert.ok(finish.includes('x="-53" y="-105" width="14" height="119"'));
  assert.ok(finish.includes('cx="-46" cy="-105" r="19" fill="#EA8C60"'));
  assert.ok(!finish.includes('>DENIED<'));
  assert.ok(renderLever({longThrow: true, pulled: 1, deniedLabel: 'STOP'}).includes('>STOP</text>'));
  const travel = 2 * 119 * Math.sin(40 * Math.PI / 180);
  assert.ok(travel > 150, 'grip must visibly travel more than 150 local pixels');
});

test('grip hand approaches actual world grip and has continuous articulated anatomy', () => {
  const hand = (reach, scale = 1) => renderToStaticMarkup(React.createElement('svg', null,
    React.createElement(GripHand, {x: 520, y: 880, reach, scale, skin: '#d4a17d', cuffColor: '#207864'})));
  assert.ok(hand(0).includes('translate(920,880) scale(1)'));
  assert.ok(hand(0.5, 2).includes('translate(720,880) scale(2)'));
  assert.ok(hand(1).includes('translate(520,880) scale(1)'));
  assert.equal(hand(-1), hand(0));
  assert.equal(hand(2), hand(1));
  const markup = hand(1);
  assert.equal([...markup.matchAll(/data-part="finger"/g)].length, 4);
  for (const part of ['sleeve', 'wrist', 'palm', 'thumb', 'thumbnail', 'cuff']) {
    assert.ok(markup.includes(`data-part="${part}"`));
  }
  assert.ok(markup.includes('640,-54'), 'continuous sleeve extends offscreen right');
  assert.ok(markup.includes('<linearGradient'), 'skin and cuff use form shading');
  assert.equal(hand(1), markup, 'rendering is deterministic under seeking');
});
