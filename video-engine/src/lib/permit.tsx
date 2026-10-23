import React from 'react';
import {ContactShadow, FormGradient, INK, RimLight, tones} from './lighting';
import {MONO, monoW, rnd, snap} from './prospect';

// THE PERMIT KIT, 2026-10-23 ("The Rule That Stops at the Fence"). One idea drawn as paper. A borough application form with a face
// (Dotty) is the throughline: blank, then its four boxes filled, then pinned to the borough's own ground, then a fifth dashed teal box
// that has nothing in it, then that box held up like a question. Around her: an ink stamp (Clerk), a three-floor cutaway building
// (Building) whose only lit floor is the one the rule can reach, a tilted parcel plane, and a snow-morning backdrop.
// Everything is SVG in the 1080 x 1920 frame at a caller-set x, y and scale. Every animated value is passed in. The only strings this kit
// paints are the form's own box labels (the claim c3 list and OUTSIDE CHECK) and the NEW sticker. Dotty is a labelled metaphor for a form,
// never a verdict: she never lights up on a result and her fifth box only ever says NOT REPORTED.
export const PM = {
  mist: '#A9BFCF', mistHi: '#C8D8E3', ivory: '#EDE6D3', snow: '#DCE3E8', snowShade: '#B9C4CB', snowDeep: '#98A5AE',
  spruce: '#1E4B3F', spruceHi: '#2C6554', spruceDeep: '#0F1F1B', night: '#0A1411',   // 'fir': trees and the parcels the rule doesn't reach
  // the borough's own ground and rule: emerald, spent only on what the rule can reach
  marigold: '#2FA36B', marigoldDeep: '#1C6B45', marigoldHi: '#6FD6A0', marigoldRim: '#B9F1D4',
  paper: '#FFFDF4', paperShade: '#E5DCC3', paperDeep: '#C9BD9D', cheek: '#F2A9A0',
  // the sky floor (indigo) and the state floor (plum-gray)
  lav: '#3A3F7A', lavDeep: '#2B3170', lavHi: '#9AA3E0', lavNight: '#1A1E45',
  slate: '#5A4A63', slateDeep: '#352B3D', slateHi: '#8A7896',
  // the open question: amber, the loose dashed outline only
  teal: '#E8A21B', tealHi: '#FFD27A', tealDeep: '#8A5A07',
  kraft: '#DCCFA8', kraftShade: '#A89A6E', bone: '#F4EEDC', glow: '#FFF2C9', cream: '#F3DFA8', blind: '#6E7590',
  steel: '#8C99A8', flare: '#F26B45', water: '#5E9AC0', waterHi: '#9ACBE6', waterDeep: '#2F6A8F',
  summerGrass: '#7DA856', summerGrassDeep: '#4F7A38', sun: '#F5C453', bay: '#3F8FBF', bayDeep: '#2A6A94',
  wood: '#C9B28A', woodHi: '#E3D2AE', woodDeep: '#9A8560',
  ink: INK,
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rad = (d: number) => (d * Math.PI) / 180;

// ---- Dotty: the form with a face -----------------------------------------------------------------------------------------------------------
export type DottyMood = 'proud' | 'read' | 'cross' | 'wobble' | 'ask' | 'beam' | 'flat';
/** the labels on her four boxes (claim c3) and the fifth box (an outside check). The only strings the form paints. */
export const DOTTY_ROWS = ['CHEMICALS', 'FLARES', 'FLIGHTS', 'INTENDED OUTCOME'];
const ROW_TOP = (i: number) => -340 + i * 60;
const SHOULDER_Y = -300;
/** where her hand ends up for an arm held at `a` degrees (0 straight down, 90 straight out, 180 straight up), in the form's own frame */
export const dottyHand = (side: -1 | 1, a: number, len = 118) => {
  const r = rad(a);
  return {x: side * 140 + side * Math.sin(r) * len, y: SHOULDER_Y + Math.cos(r) * len};
};
const Arm: React.FC<{side: -1 | 1; a: number; f: number; ph: number; hold?: React.ReactNode}> = ({side, a, f, ph, hold}) => {
  const aa = a + 3 * Math.sin(f / 17 + ph);
  const mid = dottyHand(side, aa * 0.55 - 4, 66);
  const hand = dottyHand(side, aa, 118);
  const d = `M${side * 138},${SHOULDER_Y} Q${mid.x + side * 8},${mid.y} ${hand.x},${hand.y}`;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" />
      <path d={d} fill="none" stroke={PM.paper} strokeWidth={8} strokeLinecap="round" />
      <circle cx={hand.x} cy={hand.y} r={17} fill={PM.paper} stroke={INK} strokeWidth={5} />
      <ellipse cx={hand.x - 4} cy={hand.y - 5} rx={6} ry={4} fill="#FFFFFF" opacity={0.7} />
      {hold && <g transform={`translate(${hand.x},${hand.y})`}>{hold}</g>}
    </g>
  );
};

export const Dotty: React.FC<{
  x: number; y: number; f: number; scale?: number; facing?: 1 | -1; mood?: DottyMood; look?: number;
  fill?: number; armL?: number; armR?: number; walk?: number; lean?: number;
  sticker?: number; sq?: number; shadow?: boolean; ph?: number; id?: string; holdR?: React.ReactNode; tack?: number; mouthOpen?: number;
}> = ({x, y, f, scale = 1, facing = 1, mood = 'proud', look = 0, fill = 0, armL = 12, armR = 12, walk = 0, lean = 0, sticker = 0, sq = 0, shadow = true, ph = 0, id = 'dt', holdR, tack = 0, mouthOpen = 0}) => {
  const gid = `${id}${Math.round(x)}${Math.round(y)}`;
  const t = tones(PM.paper);
  const breath = 1 + 0.012 * Math.sin(f / 22 + ph);
  const sway = lean + 1.4 * Math.sin(f / 41 + ph) + 0.8 * Math.sin(f / 23 + ph * 2);
  const blink = Math.sin(f / 51 + ph * 3) > 0.975 ? 0.15 : 1;
  const eyeH = 50 * blink * (mood === 'wobble' ? 1.12 : mood === 'cross' ? 0.82 : mood === 'read' ? 0.72 : 1);
  const px = look * 7, py = mood === 'read' ? 8 : mood === 'wobble' ? -2 : 0;
  const inner = mood === 'cross' ? -9 : mood === 'wobble' ? 12 : mood === 'read' ? 3 : 0;
  const outer = mood === 'cross' ? 12 : mood === 'wobble' ? -8 : mood === 'beam' ? -8 : -3;
  const stepA = walk ? Math.sin(walk) : 0;
  const wob = mood === 'wobble' ? 1.4 * Math.sin(f * 0.55 + ph) : 0;
  const rows = DOTTY_ROWS.map((lb, i) => ({lb, k: clamp01(fill - i), y: ROW_TOP(i)}));
  return (
    <g transform={`translate(${x},${y}) rotate(${sway + wob}) scale(${scale * facing * (1 + 0.04 * sq)},${scale * (1 - 0.05 * sq)})`}>
      {shadow && <ContactShadow cx={0} cy={4} rx={118} ry={16} opacity={0.34} blur={9} />}
      <g transform={`scale(1,${breath})`}>
        {/* noodle legs and boots */}
        {[-1, 1].map((s) => {
          const lf = Math.max(0, Math.sin((walk || 0) + (s > 0 ? Math.PI : 0))) * 16;
          const fx = s * 58 + s * stepA * 12;
          return (
            <g key={s}>
              <path d={`M${s * 58},-46 L${fx},${-lf - 12}`} stroke={INK} strokeWidth={12} strokeLinecap="round" />
              <path d={`M${fx - 20},${-lf - 12} Q${fx},${-lf - 28} ${fx + 22},${-lf - 12} L${fx + 26},${-lf} L${fx - 24},${-lf} Z`} fill={PM.lavDeep} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            </g>
          );
        })}
        <Arm side={-1} a={armL} f={f} ph={ph} />
        <FormGradient id={`${gid}p`} t={t} softness={0.55} />
        {/* the sheet: rounded corners, a folded bottom right corner */}
        <path d="M-140,-452 Q-140,-482 -110,-482 L110,-482 Q140,-482 140,-452 L140,-96 L94,-40 L-112,-40 Q-140,-40 -140,-68 Z" fill="#000" opacity={0.2} transform="translate(9,10)" />
        <path d="M-140,-452 Q-140,-482 -110,-482 L110,-482 Q140,-482 140,-452 L140,-96 L94,-40 L-112,-40 Q-140,-40 -140,-68 Z" fill={`url(#${gid}p)`} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d="M140,-96 L94,-40 L100,-100 Z" fill={PM.paperDeep} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M-132,-60 Q-134,-200 -130,-420" fill="none" stroke="#FFFFFF" strokeWidth={6} opacity={0.5} strokeLinecap="round" />
        <RimLight d="M-136,-456 Q-136,-478 -110,-478 L100,-478" w={3} color="#FFFFFF" opacity={0.6} />
        {/* the marigold header band, the borough's one accent */}
        <path d="M-134,-452 Q-134,-476 -108,-476 L108,-476 Q134,-476 134,-452 L134,-462 L-134,-462 Z" fill={PM.marigold} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        {/* the face: two checkbox eyes, brows, cheeks and a mouth */}
        {[-1, 1].map((s) => (
          <g key={s}>
            <rect x={s * 44 - 25} y={-428 - eyeH / 2} width={50} height={Math.max(5, eyeH)} rx={10} fill={PM.bone} stroke={INK} strokeWidth={5} />
            {eyeH > 14 && <rect x={s * 44 - 8 + px} y={-428 - 8 + py} width={16} height={16} rx={3} fill={INK} />}
            {eyeH > 14 && <rect x={s * 44 - 4 + px} y={-428 - 8 + py} width={6} height={5} rx={2} fill="#FFFFFF" opacity={0.85} />}
            <path d={`M${s * 18},${-462 + inner + (mood === 'ask' && s > 0 ? -12 : 0)} Q${s * 46},${-472 + (outer + inner) / 2 + (mood === 'ask' && s > 0 ? -12 : 0)} ${s * 72},${-462 + outer + (mood === 'ask' && s > 0 ? -12 : 0)}`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
            <ellipse cx={s * 86} cy={-396} rx={16} ry={10} fill={PM.cheek} opacity={mood === 'cross' ? 0.35 : 0.75} />
          </g>
        ))}
        {mood === 'proud' && <path d="M-26,-394 Q0,-374 26,-394" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />}
        {mood === 'beam' && <path d="M-30,-398 Q0,-366 30,-398 Q0,-388 -30,-398 Z" fill={PM.cheek} stroke={INK} strokeWidth={5} strokeLinejoin="round" />}
        {mood === 'cross' && <path d="M-22,-388 Q0,-398 22,-388" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />}
        {mood === 'wobble' && <path d={`M-22,-390 q8,-9 15,0 q8,9 15,0 q8,-9 15,0`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />}
        {mood === 'read' && <path d="M-14,-392 L14,-392" stroke={INK} strokeWidth={5} strokeLinecap="round" />}
        {mood === 'flat' && <path d="M-16,-390 L16,-390" stroke={INK} strokeWidth={5} strokeLinecap="round" />}
        {mood === 'ask' && <ellipse cx={0} cy={-390} rx={9} ry={mouthOpen ? 11 : 7} fill={PM.cheek} stroke={INK} strokeWidth={4.5} />}
        {/* her four boxes: a label, a white slot, typed ink as the form fills, a marigold tick when a box is complete */}
        {rows.map((r, i) => (
          <g key={r.lb}>
            <text x={-116} y={r.y - 2} fontFamily={MONO} fontWeight={800} fontSize={14} letterSpacing={0.6} fill={PM.slateDeep}>{r.lb}</text>
            <rect x={-116} y={r.y + 4} width={232} height={30} rx={5} fill="#FFFFFF" stroke={INK} strokeWidth={3.4} />
            {r.k > 0 && [0, 1, 2, 3].map((j) => {
              const w = [64, 44, 52, 30][(i + j) % 4];
              const done = clamp01(r.k * 4 - j);
              return done > 0 ? <rect key={j} x={-108 + [0, 72, 124, 182][j]} y={r.y + 15} width={w * done * (j === 3 ? 0.9 : 1)} height={8} rx={3} fill={PM.slateDeep} /> : null;
            })}
            {r.k >= 1 && (
              <g transform={`translate(98,${r.y + 19}) scale(${snap(f, 0, 1) * 1})`}>
                <circle r={11} fill={PM.marigold} stroke={INK} strokeWidth={3} />
                <path d="M-5,0 L-1,5 L6,-5" fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            )}
          </g>
        ))}
        {sticker > 0.02 && (
          <g transform={`translate(-96,-76) rotate(-12) scale(${snap(f, 0, 1) * clamp01(sticker)})`} opacity={clamp01(sticker * 2)}>
            <circle r={26} fill={PM.marigoldHi} stroke={INK} strokeWidth={4} />
            <text x={0} y={6} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} fill={INK}>NEW</text>
          </g>
        )}
        {tack > 0.02 && (
          <g transform={`translate(0,${-486 - 24 * (1 - clamp01(tack))})`} opacity={clamp01(tack * 2)}>
            <circle r={13} fill="#101423" stroke={INK} strokeWidth={4} />
            <ellipse cx={-4} cy={-4} rx={4} ry={3} fill="#FFFFFF" opacity={0.7} />
          </g>
        )}
        {/* the paper clip and the cowlick curl */}
        <path d="M-96,-488 L-96,-452 Q-96,-440 -86,-440 Q-76,-440 -76,-452 L-76,-478 Q-76,-490 -86,-490 Q-96,-490 -96,-478" fill="none" stroke={PM.steel} strokeWidth={5} strokeLinecap="round" />
        <path d={`M24,-482 q${12 + 3 * Math.sin(f / 15 + ph)},-28 ${30},-22 q${18},${10} ${4},${24}`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <path d={`M24,-482 q${12 + 3 * Math.sin(f / 15 + ph)},-28 ${30},-22 q${18},${10} ${4},${24}`} fill="none" stroke={PM.paper} strokeWidth={4} strokeLinecap="round" />
        <Arm side={1} a={armR} f={f} ph={ph + 1.3} hold={holdR} />
      </g>
    </g>
  );
};

// ---- the rain gauge: the story's own object ------------------------------------------------------------------------------------------------
/** A putty or amber tag on a string. Sized to its text by arithmetic. Origin is the knot at the top. */
export const PTag: React.FC<{lines: string[]; size?: number; tone?: 'putty' | 'amber'; k?: number; f?: number; drop?: number; sway?: number; rot?: number}> =
({lines, size = 20, tone = 'putty', k = 1, f = 0, drop = 34, sway = 3, rot = 0}) => {
  const kk = clamp01(k);
  if (kk <= 0.02) return null;
  const w = Math.max(...lines.map((l) => monoW(l, size, 1.2))) + 34;
  const h = lines.length * (size + 10) + 18;
  const fill = tone === 'amber' ? '#FFE9B0' : PM.kraft;
  const edge = tone === 'amber' ? PM.tealDeep : PM.kraftShade;
  const fg = tone === 'amber' ? PM.tealDeep : INK;
  return (
    <g opacity={Math.min(1, kk * 1.8)} transform={`rotate(${rot + sway * Math.sin(f / 19)}) scale(${0.8 + 0.2 * Math.min(1, kk * 1.2)})`}>
      <path d={`M0,0 L0,${drop}`} stroke={PM.bone} strokeWidth={2.4} />
      <circle cx={0} cy={0} r={3.6} fill={edge} stroke={INK} strokeWidth={2} />
      <g transform={`translate(0,${drop})`}>
        <rect x={-w / 2 + 5} y={5} width={w} height={h} rx={6} fill="#000" opacity={0.26} />
        <path d={`M${-w / 2},12 L-14,0 L14,0 L${w / 2},12 L${w / 2},${h} L${-w / 2},${h} Z`} fill={fill} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d={`M${-w / 2 + 6},${h - 6} L${w / 2 - 6},${h - 6}`} stroke={edge} strokeWidth={4} />
        <circle cx={0} cy={9} r={4} fill="#1B2233" />
        {lines.map((l, i) => <text key={i} x={0} y={14 + (size + 10) * (i + 0.5) + size * 0.34} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={1.2} fill={fg}>{l}</text>)}
      </g>
    </g>
  );
};

/**
 * RainGauge: a clear cylinder on a post, one inch tall (300 px at scale 1), so a hundredth of an inch is a 3 px hairline. A cup anemometer
 * spins on top, and a short arm carries two brass hooks. Hook one can carry a tag, hook two stays bare until the caller hangs a tag on it.
 * Origin is the base of the post. It paints only the strings the caller passes in (tags) and the scale marks 0 and 1 IN.
 */
export const RainGauge: React.FC<{x: number; y: number; f: number; scale?: number; level?: number; tag1?: string[]; tag1k?: number; tag2?: string[]; tag2k?: number; spin?: number; hairline?: number; id?: string; shadow?: boolean; labels?: boolean}> =
({x, y, f, scale = 1, level = 0.01, tag1, tag1k = 0, tag2, tag2k = 0, spin = 1, hairline = 0, id = 'rg', shadow = true, labels = true}) => {
  const t = tones(PM.woodHi);
  const gid = `${id}${Math.round(x)}${Math.round(y)}`;
  const cupA = (f * 9 * spin) % 360;
  const wp = Math.max(0, level) * 300;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <FormGradient id={`${gid}w`} t={t} softness={0.6} />
      {shadow && <ContactShadow cx={4} cy={4} rx={58} ry={11} opacity={0.34} blur={8} />}
      {/* the post and its foot */}
      <path d="M-40,0 L-30,-30 L30,-30 L40,0 Z" fill={`url(#${gid}w)`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <rect x={-11} y={-140} width={22} height={112} fill={`url(#${gid}w)`} stroke={INK} strokeWidth={5} />
      {/* the clear cylinder: one inch of scale */}
      <rect x={-34} y={-440} width={68} height={304} rx={9} fill="#EAF6FB" fillOpacity={0.55} stroke={INK} strokeWidth={5.5} />
      <rect x={-27} y={-434} width={9} height={292} rx={4} fill="#FFFFFF" opacity={0.55} />
      {Array.from({length: 11}).map((_, i) => <path key={i} d={`M${i % 5 === 0 ? 8 : 18},${-140 - i * 30} L34,${-140 - i * 30}`} stroke={INK} strokeWidth={i % 5 === 0 ? 3.4 : 2.2} opacity={0.8} />)}
      {labels && <text x={-44} y={-436} textAnchor="end" fontFamily={MONO} fontWeight={800} fontSize={20} fill={PM.slateDeep}>1 IN</text>}
      {labels && <text x={-44} y={-134} textAnchor="end" fontFamily={MONO} fontWeight={800} fontSize={20} fill={PM.slateDeep}>0</text>}
      {/* the water: at a hundredth of an inch it is a hairline */}
      <rect x={-31} y={-140 - Math.max(1.5, wp)} width={62} height={Math.max(1.5, wp)} fill={PM.water} />
      <path d={`M-31,${-140 - Math.max(1.5, wp)} L31,${-140 - Math.max(1.5, wp)}`} stroke={PM.waterDeep} strokeWidth={1.8} />
      {hairline > 0.02 && (
        <g opacity={clamp01(hairline)}>
          <path d={`M-31,${-140 - Math.max(1.5, wp)} L-112,${-140 - Math.max(1.5, wp)}`} stroke={PM.teal} strokeWidth={3.4} strokeDasharray="8 6" strokeDashoffset={-f * 0.6} />
          <circle cx={-112} cy={-140 - Math.max(1.5, wp)} r={7} fill={PM.teal} stroke={INK} strokeWidth={3} />
        </g>
      )}
      <rect x={-40} y={-452} width={80} height={16} rx={6} fill={`url(#${gid}w)`} stroke={INK} strokeWidth={5} />
      {/* the cup anemometer spinning on top */}
      <path d="M0,-452 L0,-486" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <g transform={`translate(0,-488) rotate(${cupA})`}>
        {[0, 120, 240].map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <path d="M0,0 L44,0" stroke={INK} strokeWidth={5} strokeLinecap="round" />
            <path d="M44,-12 A12,12 0 0 1 44,12 Z" fill={PM.paper} stroke={INK} strokeWidth={4} />
          </g>
        ))}
        <circle r={6} fill={PM.steel} stroke={INK} strokeWidth={3.4} />
      </g>
      {/* the arm with two brass hooks */}
      <path d="M11,-300 L186,-300" stroke={INK} strokeWidth={11} strokeLinecap="round" />
      <path d="M11,-300 L186,-300" stroke={PM.woodHi} strokeWidth={5} strokeLinecap="round" />
      {[90, 170].map((hx, i) => (
        <g key={hx} transform={`translate(${hx},-300)`}>
          <path d="M0,0 L0,16 Q0,28 10,24" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
          <path d="M0,0 L0,16 Q0,28 10,24" fill="none" stroke="#C9A24A" strokeWidth={3.6} strokeLinecap="round" />
          {i === 0 && tag1 && <g transform="translate(0,10)"><PTag lines={tag1} size={17} tone="putty" k={tag1k} f={f} drop={26} sway={3} /></g>}
          {i === 1 && tag2 && <g transform="translate(0,10)"><PTag lines={tag2} size={17} tone="amber" k={tag2k} f={f + 11} drop={26} sway={4} /></g>}
          {i === 1 && !(tag2 && tag2k > 0.05) && <circle cx={10} cy={30 + 2 * Math.sin(f / 13)} r={4} fill="#C9A24A" stroke={INK} strokeWidth={2} />}
        </g>
      ))}
    </g>
  );
};

// ---- Building: three floors in cutaway, only the ground floor lit -------------------------------------------------------------------------------
export const FLOOR_H = 262;
export type FloorKey = 'sky' | 'state' | 'ground';
/** the building's frame: its left x, top y and width. Floors are stacked sky, state, ground (top to bottom). */
export const BLD = {x: 110, y: 560, w: 860};
export const floorTop = (k: FloorKey) => BLD.y + (k === 'sky' ? 0 : k === 'state' ? FLOOR_H : FLOOR_H * 2);
export const Building: React.FC<{f: number; lit?: {sky?: number; state?: number; ground?: number}; id?: string; roof?: boolean; children?: React.ReactNode; stairDashed?: number}> = ({f, lit = {ground: 1}, id = 'bd', roof = true, children}) => {
  const L = {sky: lit.sky ?? 0, state: lit.state ?? 0, ground: lit.ground ?? 1};
  const wall = (k: FloorKey) => (k === 'sky' ? PM.lavNight : k === 'state' ? PM.slateDeep : PM.cream);
  const flo = (k: FloorKey) => (k === 'sky' ? PM.lavDeep : k === 'state' ? PM.slate : PM.woodHi);
  const dark = (k: FloorKey) => 1 - L[k];
  return (
    <g>
      <rect x={BLD.x - 16} y={BLD.y - 10} width={BLD.w + 32} height={FLOOR_H * 3 + 34} rx={10} fill="#000" opacity={0.22} transform="translate(10,14)" />
      {(['sky', 'state', 'ground'] as FloorKey[]).map((k) => {
        const y0 = floorTop(k);
        const glow = L[k];
        return (
          <g key={k}>
            <rect x={BLD.x} y={y0} width={BLD.w} height={FLOOR_H} fill={wall(k)} />
            {/* wallpaper rhythm */}
            {Array.from({length: 14}).map((_, i) => <rect key={i} x={BLD.x + 30 + i * 60} y={y0 + 10} width={4} height={FLOOR_H - 56} fill={k === 'ground' ? '#D4C08C' : '#FFFFFF'} opacity={k === 'ground' ? 0.5 : 0.05} />)}
            {/* the floor plank */}
            <rect x={BLD.x} y={y0 + FLOOR_H - 40} width={BLD.w} height={40} fill={flo(k)} stroke={INK} strokeWidth={5} />
            <path d={`M${BLD.x},${y0 + FLOOR_H - 22} L${BLD.x + BLD.w},${y0 + FLOOR_H - 22}`} stroke={INK} strokeWidth={2} opacity={0.35} />
            {/* a window on each side that shows the weather */}
            {[BLD.x + 90, BLD.x + BLD.w - 230].map((wx, i) => (
              <g key={i}>
                <rect x={wx} y={y0 + 44} width={140} height={108} rx={6} fill={k === 'ground' ? PM.mistHi : '#1A1D30'} stroke={INK} strokeWidth={6} />
                {k === 'ground' ? <rect x={wx + 6} y={y0 + 50} width={128} height={96} rx={3} fill={PM.mist} opacity={0.8} /> : <g>{Array.from({length: 7}).map((_, j) => <circle key={j} cx={wx + 16 + rnd(j + i * 9 + k.length) * 108} cy={y0 + 60 + rnd(j + 31 + i) * 80} r={1.4 + rnd(j + 5) * 1.6} fill="#FFFFFF" opacity={0.25 + 0.3 * Math.abs(Math.sin(f / (26 + j) + j))} />)}</g>}
                <path d={`M${wx + 70},${y0 + 44} L${wx + 70},${y0 + 152} M${wx},${y0 + 98} L${wx + 140},${y0 + 98}`} stroke={INK} strokeWidth={4} />
              </g>
            ))}
            {/* the dark floors sit under a cool shade; the lit one glows */}
            {dark(k) > 0.01 && <rect x={BLD.x} y={y0} width={BLD.w} height={FLOOR_H} fill="#0A0D1C" opacity={0.46 * dark(k)} />}
            {glow > 0.01 && <rect x={BLD.x} y={y0} width={BLD.w} height={FLOOR_H} fill={PM.glow} opacity={(0.14 + 0.014 * Math.sin(f / 7)) * glow} />}
            <rect x={BLD.x} y={y0} width={BLD.w} height={FLOOR_H} fill="none" stroke={INK} strokeWidth={8} />
          </g>
        );
      })}
      {roof && (
        <g>
          <path d={`M${BLD.x - 30},${BLD.y} L${BLD.x + BLD.w / 2},${BLD.y - 92} L${BLD.x + BLD.w + 30},${BLD.y} Z`} fill={PM.lavDeep} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
          <path d={`M${BLD.x - 14},${BLD.y - 6} L${BLD.x + BLD.w / 2},${BLD.y - 80}`} stroke={PM.lavHi} strokeWidth={5} opacity={0.5} strokeLinecap="round" />
        </g>
      )}
      <rect x={BLD.x - 30} y={BLD.y + FLOOR_H * 3} width={BLD.w + 60} height={26} rx={5} fill={PM.snowShade} stroke={INK} strokeWidth={6} />
      {children}
    </g>
  );
};

/** the stair that rises from the ground floor to the sky floor's hatch. Solid up to the painted borough line, dashed beyond it. `top` is how far (0..1) the dashed part has been drawn on. */
export const stairPoint = (u: number) => ({x: BLD.x + 70 + u * 480, y: floorTop('ground') + FLOOR_H - 40 - u * (FLOOR_H * 2 - 6)});
export const Stair: React.FC<{f: number; draw?: number; solidTo?: number}> = ({f, draw = 1, solidTo = 0.5}) => {
  const steps = 14;
  return (
    <g>
      {Array.from({length: steps}).map((_, i) => {
        const u = i / steps;
        if (u > clamp01(draw)) return null;
        const p = stairPoint(u);
        const q = stairPoint((i + 1) / steps);
        const solid = u < solidTo;
        return (
          <g key={i}>
            <path d={`M${p.x},${p.y} L${p.x + 34},${p.y} L${p.x + 34},${q.y} L${q.x + 34},${q.y}`} fill="none" stroke={INK} strokeWidth={solid ? 12 : 8} strokeLinecap="round" strokeLinejoin="round" opacity={solid ? 1 : 0.9} />
            <path d={`M${p.x},${p.y} L${p.x + 34},${p.y} L${p.x + 34},${q.y} L${q.x + 34},${q.y}`} fill="none" stroke={solid ? PM.woodHi : PM.tealHi} strokeWidth={solid ? 6 : 4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={solid ? undefined : '10 9'} strokeDashoffset={-f * 0.5} />
          </g>
        );
      })}
    </g>
  );
};

/** the FAA's locked hatch: a round steel hatch with a wheel and a padlock. `shake` makes the padlock rattle. */
export const Hatch: React.FC<{x: number; y: number; scale?: number; f: number; shake?: number; open?: number}> = ({x, y, scale = 1, f, shake = 0, open = 0}) => {
  const t = tones(PM.steel);
  const rat = shake * Math.sin(f * 1.7) * 3;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <FormGradient id={`hatch${Math.round(x)}`} t={t} softness={0.55} />
      <ellipse cx={0} cy={0} rx={96} ry={36} fill="#000" opacity={0.3} transform="translate(0,6)" />
      <ellipse cx={0} cy={0} rx={92} ry={32} fill={`url(#hatch${Math.round(x)})`} stroke={INK} strokeWidth={7} />
      <ellipse cx={0} cy={-2} rx={68} ry={21} fill="none" stroke={PM.slateDeep} strokeWidth={5} opacity={0.7} />
      {[-1, 1].map((s) => <rect key={s} x={s * 78 - 8} y={-9} width={16} height={18} rx={4} fill={PM.slateHi} stroke={INK} strokeWidth={3.6} />)}
      <path d="M-34,-4 L34,-4 M0,-20 L0,12" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d="M-34,-4 L34,-4 M0,-20 L0,12" stroke={PM.steel} strokeWidth={4.4} strokeLinecap="round" />
      <g transform={`translate(${rat},${30 + Math.abs(rat)})`}>
        <path d="M-9,-12 Q-9,-26 0,-26 Q9,-26 9,-12" fill="none" stroke={INK} strokeWidth={5.6} />
        <rect x={-14} y={-12} width={28} height={22} rx={4} fill={PM.marigoldHi} stroke={INK} strokeWidth={4.4} />
        <circle cx={0} cy={-1} r={3} fill={INK} />
      </g>
    </g>
  );
};

// ---- the tilted parcel plane ----------------------------------------------------------------------------------------------------------------
/** a deterministic 5 x 6 grid of parcels. `borough` lists the cell indexes that are the borough's own and lit marigold. */
export const PARCEL = {cols: 5, rows: 6, w: 150, h: 120};
export const cellXY = (i: number) => ({x: (i % PARCEL.cols) * PARCEL.w, y: Math.floor(i / PARCEL.cols) * PARCEL.h});
export const ParcelPlane: React.FC<{x: number; y: number; scale?: number; borough: number[]; lit?: number; f: number; children?: React.ReactNode; id?: string; hot?: number[]; water?: boolean}> = ({x, y, scale = 1, borough, lit = 1, f, children, id = 'pp', hot = [], water = true}) => {
  const W = PARCEL.cols * PARCEL.w, H = PARCEL.rows * PARCEL.h;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <g transform="matrix(1,0,-0.42,0.62,0,0)">
        <rect x={-14} y={-14} width={W + 28} height={H + 28} rx={10} fill="#000" opacity={0.26} transform="translate(16,20)" />
        <rect x={-14} y={-14} width={W + 28} height={H + 28} rx={10} fill={PM.snow} stroke={INK} strokeWidth={8} />
        {water && (
          <g>
            <path d={`M${W * 0.0},${H * 0.62} Q${W * 0.18},${H * 0.54} ${W * 0.3},${H * 0.64} Q${W * 0.38},${H * 0.78} ${W * 0.2},${H * 1.0} L0,${H} Z`} fill={PM.water} stroke={INK} strokeWidth={5} />
            <path d={`M10,${H * 0.76} Q${W * 0.1},${H * 0.7} ${W * 0.2},${H * 0.78}`} fill="none" stroke={PM.waterHi} strokeWidth={4} strokeDasharray="10 12" strokeDashoffset={-f * 0.4} opacity={0.8} />
          </g>
        )}
        {Array.from({length: PARCEL.cols * PARCEL.rows}).map((_, i) => {
          const c = cellXY(i);
          const isB = borough.includes(i);
          const jx = (rnd(i + 3) - 0.5) * 10, jy = (rnd(i + 17) - 0.5) * 8;
          const inWater = water && c.x < W * 0.28 && c.y > H * 0.62;
          if (inWater) return null;
          return (
            <g key={i}>
              <rect x={c.x + 6 + jx} y={c.y + 6 + jy} width={PARCEL.w - 12} height={PARCEL.h - 12} rx={6} fill={isB ? PM.marigold : rnd(i + 5) > 0.5 ? PM.snowShade : PM.spruceHi} opacity={isB ? 0.35 + 0.65 * lit : 0.9} stroke={INK} strokeWidth={isB ? 5 : 3.2} />
              {isB && lit > 0.3 && <rect x={c.x + 12 + jx} y={c.y + 12 + jy} width={PARCEL.w - 24} height={PARCEL.h - 24} rx={4} fill="none" stroke={PM.marigoldRim} strokeWidth={3} strokeDasharray="8 7" strokeDashoffset={-f * 0.5} opacity={0.9} />}
              {hot.includes(i) && <rect x={c.x + 6 + jx} y={c.y + 6 + jy} width={PARCEL.w - 12} height={PARCEL.h - 12} rx={6} fill={PM.marigoldHi} opacity={0.35 + 0.2 * Math.sin(f / 6)} />}
            </g>
          );
        })}
        {children}
      </g>
    </g>
  );
};

// ---- backdrops -------------------------------------------------------------------------------------------------------------------------------
/** a snow morning: mist-blue sky to ivory at the horizon, soft cloud puffs, a far spruce ridge, white ground and drifting snow */
export const SnowMorningBG: React.FC<{f: number; horizon?: number; id?: string; tint?: number; dawn?: number; flakes?: number; near?: boolean}> = ({f, horizon = 980, id = 'sm', tint = 0, dawn = 0, flakes = 46, near = true}) => {
  return (
    <g>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={dawn > 0 ? '#8FA6C4' : PM.mist} />
          <stop offset="1" stopColor={dawn > 0 ? '#F4DDB8' : PM.ivory} />
        </linearGradient>
        <linearGradient id={`${id}gr`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={PM.snow} /><stop offset="1" stopColor={PM.snowShade} /></linearGradient>
      </defs>
      <rect x={-60} y={-60} width={1200} height={horizon + 70} fill={`url(#${id}sky)`} />
      {[[160, 220, 1.2], [620, 160, 1.5], [900, 300, 1.0], [320, 420, 0.9], [760, 520, 1.1]].map(([cx, cy, s], i) => {
        const dx = ((f * (0.12 + i * 0.03) + cx * 3) % 1500) - 200;
        return (
          <g key={i} transform={`translate(${dx},${cy}) scale(${s})`} opacity={0.82}>
            <ellipse cx={0} cy={0} rx={150} ry={34} fill="#FFFFFF" />
            <ellipse cx={-70} cy={-20} rx={80} ry={36} fill="#FFFFFF" />
            <ellipse cx={50} cy={-26} rx={90} ry={40} fill="#FFFFFF" />
            <ellipse cx={0} cy={14} rx={170} ry={14} fill={PM.mistHi} opacity={0.7} />
          </g>
        );
      })}
      {/* far hills and spruce ridge */}
      <path d={`M-60,${horizon - 60} Q120,${horizon - 150} 300,${horizon - 80} Q470,${horizon - 190} 650,${horizon - 90} Q860,${horizon - 170} 1140,${horizon - 70} L1140,${horizon + 6} L-60,${horizon + 6} Z`} fill="#8EA3B8" opacity={0.85} />
      <path d={`M-60,${horizon - 20} L1140,${horizon - 20} L1140,${horizon + 8} L-60,${horizon + 8} Z`} fill="#6F8798" />
      {Array.from({length: 26}).map((_, i) => {
        const tx = -40 + i * 44 + rnd(i + 2) * 20, th = 60 + rnd(i + 11) * 48;
        return <path key={i} d={`M${tx},${horizon - 6} L${tx - 16},${horizon - 6} L${tx},${horizon - th} L${tx + 16},${horizon - 6} Z`} fill={PM.spruce} stroke={INK} strokeWidth={2.2} opacity={0.92} />;
      })}
      <rect x={-60} y={horizon} width={1200} height={1920 - horizon + 60} fill={`url(#${id}gr)`} />
      <path d={`M-60,${horizon + 40} Q300,${horizon + 6} 620,${horizon + 36} T1140,${horizon + 24}`} fill="none" stroke={PM.snowDeep} strokeWidth={4} opacity={0.5} />
      {near && Array.from({length: 7}).map((_, i) => <ellipse key={i} cx={rnd(i + 40) * 1080} cy={horizon + 120 + rnd(i + 41) * 700} rx={90 + rnd(i + 42) * 120} ry={12 + rnd(i + 43) * 12} fill="#FFFFFF" opacity={0.6} />)}
      {tint > 0 && <rect x={-60} y={-60} width={1200} height={2040} fill={PM.marigold} opacity={0.06 * tint} />}
      {Array.from({length: flakes}).map((_, i) => {
        const sp = 0.7 + rnd(i + 70) * 1.4;
        const fx = (rnd(i + 71) * 1200 + f * (0.8 + rnd(i + 72)) + 40 * Math.sin(f / 30 + i)) % 1200 - 60;
        const fy = (rnd(i + 73) * 2000 + f * sp * 1.6) % 2000 - 40;
        return <circle key={i} cx={fx} cy={fy} r={1.8 + rnd(i + 74) * 2.6} fill="#FFFFFF" opacity={0.55 + 0.35 * rnd(i + 75)} />;
      })}
    </g>
  );
};

/** a cool room with a tall snow window: a pale wall, a birch floor and a window key, no lamp pool anywhere */
export const PaperRoomBG: React.FC<{f: number; id?: string; deskY?: number; pool?: number}> = ({f, id = 'pr', deskY = 1250, pool = 1}) => (
  <g>
    <defs>
      <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#CFD8DD" /><stop offset="1" stopColor="#E8ECEA" /></linearGradient>
      <linearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.75 * pool} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0} /></linearGradient>
    </defs>
    <rect x={-60} y={-60} width={1200} height={deskY + 60} fill={`url(#${id}w)`} />
    {Array.from({length: 16}).map((_, i) => <rect key={i} x={-20 + i * 72} y={0} width={4} height={deskY} fill="#B5C0C6" opacity={0.4} />)}
    {/* the tall snow window and its key light falling across the room */}
    <rect x={640} y={170} width={330} height={640} rx={10} fill={PM.mistHi} stroke={INK} strokeWidth={9} />
    <rect x={652} y={182} width={306} height={616} rx={4} fill={PM.mist} opacity={0.9} />
    {Array.from({length: 26}).map((_, i) => <circle key={i} cx={660 + ((rnd(i + 120) * 290 + f * (0.4 + rnd(i + 121))) % 290)} cy={190 + ((rnd(i + 122) * 600 + f * (1.2 + rnd(i + 123))) % 600)} r={1.6 + rnd(i + 124) * 2} fill="#FFFFFF" opacity={0.7} />)}
    <path d="M805,182 L805,798 M652,490 L958,490" stroke={INK} strokeWidth={7} />
    <path d={`M640,810 L970,810 L${760},${deskY} L${180},${deskY} Z`} fill={`url(#${id}l)`} />
    <rect x={-60} y={deskY} width={1200} height={1920 - deskY + 60} fill={PM.woodHi} stroke={INK} strokeWidth={8} />
    {Array.from({length: 9}).map((_, i) => <path key={i} d={`M-60,${deskY + 24 + i * 60} Q540,${deskY + 8 + i * 60 + (i % 2) * 10} 1140,${deskY + 28 + i * 60}`} fill="none" stroke={PM.woodDeep} strokeWidth={3} opacity={0.5} />)}
  </g>
);

/** a window pane of cold light (kept for compatibility, no lamp is drawn) */
export const DeskLamp: React.FC<{x: number; y: number; f: number; scale?: number}> = () => null;

/** a book with a hard spine, used for WEATHER SCIENCE next to a form */
export const BigBook: React.FC<{x: number; y: number; w?: number; h?: number; f?: number; label?: string; tilt?: number}> = ({x, y, w = 260, h = 340, f = 0, label, tilt = 0}) => {
  const t = tones(PM.lavDeep);
  return (
    <g transform={`translate(${x},${y}) rotate(${tilt})`}>
      <FormGradient id={`bk${Math.round(x)}`} t={t} softness={0.55} />
      <ContactShadow cx={w * 0.04} cy={4} rx={w * 0.62} ry={14} opacity={0.34} blur={8} />
      <rect x={-w / 2} y={-h} width={w} height={h} rx={10} fill={`url(#bk${Math.round(x)})`} stroke={INK} strokeWidth={7} />
      <rect x={-w / 2 + 22} y={-h + 20} width={w - 44} height={h - 40} rx={6} fill="none" stroke={PM.lavHi} strokeWidth={3.4} opacity={0.7} />
      <rect x={-w / 2} y={-h} width={26} height={h} rx={9} fill={PM.lavNight} stroke={INK} strokeWidth={6} />
      <path d={`M${-w / 2 + 40},${-h + 14} L${-w / 2 + 40},${-14}`} stroke="#FFFFFF" strokeWidth={5} opacity={0.18} strokeLinecap="round" />
      {label && <text x={14} y={-h / 2 + 8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={Math.min(30, (w - 70) / (label.length * 0.602 + 0.04))} letterSpacing={1.4} fill={PM.bone}>{label}</text>}
      <path d={`M${w / 2 - 4},${-h + 14} q8,${h / 2} 0,${h - 28}`} fill="none" stroke={PM.paperDeep} strokeWidth={5} opacity={0.9} />
    </g>
  );
};
