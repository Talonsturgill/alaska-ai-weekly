// Pure-function checks for video-engine/src/lib/focus.ts (the focal-plane helper).
import {blurAt, valueLadder, passAlpha, perspScale} from '../video-engine/src/lib/focus.ts';
const eq = (a, b, m) => { if (Math.abs(a - b) > 1e-9) { console.error('FAIL', m, a, b); process.exit(1); } };
eq(blurAt(2, 2), 0, 'on the focal plane is sharp');
eq(blurAt(2.2, 2), 0, 'inside the sharp band is sharp');
eq(blurAt(5, 2, 1.6, 0.35, 9) > 0 ? 1 : 0, 1, 'far plane blurs');
eq(blurAt(50, 2, 1.6, 0.35, 9), 9, 'blur is capped');
eq(blurAt(5, 2, 1.6, 0.35, 9, true), 0, 'a pinned plane is always in focus');
eq(valueLadder(0, 5), 1.0, 'top of ladder');
eq(valueLadder(4, 5), 0.62, 'bottom of ladder');
eq(passAlpha(0.2), 1, 'in front of camera is opaque');
eq(passAlpha(-0.35), 0, 'fully passed is gone');
eq(perspScale(0) > perspScale(3) ? 1 : 0, 1, 'nearer is larger');
console.log('PASS [focus_check] blurAt, valueLadder, passAlpha, perspScale');
