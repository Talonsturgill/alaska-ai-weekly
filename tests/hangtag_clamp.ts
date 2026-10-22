// HangTag edge clamp (machine pass 2026-10-22). Run with
//   video-engine/node_modules/.bin/esbuild tests/hangtag_clamp.ts --bundle --platform=node --log-level=error --outfile=out/machine/hangtag_clamp.cjs && node out/machine/hangtag_clamp.cjs
import {tagShift, monoW} from '../video-engine/src/lib/prospect';
const w = monoW('A MAP READER · METAPHOR', 19, 1.2) + 40;
let bad = 0;
const check = (name: string, ok: boolean) => { console.log(`  [${ok ? 'x' : ' '}] ${name}`); if (!ok) bad++; };
for (const atX of [850, 880, 910]) {
  for (const cam of [1, 1.08]) {
    const dx = tagShift(atX, w, cam);
    const right = 540 + (atX + dx + w / 2 + 7 - 540) * cam;
    const left = 540 + (atX + dx - w / 2 - 7 - 540) * cam;
    check(`knot x ${atX} cam ${cam}: shift ${dx.toFixed(1)}, renders ${left.toFixed(0)}..${right.toFixed(0)} inside 54..1026`, left >= 53.99 && right <= 1026.01);
  }
}
check('a tag that already fits does not move', tagShift(540, w) === 0);
check('left edge clamps rightward', tagShift(120, w) > 0);
console.log(bad ? 'SELF-TEST FAIL' : 'SELF-TEST PASS');
process.exit(bad ? 1 : 0);
