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
  mist: '#A9BFCF', mistHi: '#C8D8E3', ivory: '#EDE6D3', snow: '#EFF1EE', snowShade: '#CBD3D6', snowDeep: '#A9B5BC',
  spruce: '#1E4B3F', spruceHi: '#2C6554', spruceDeep: '#0F1F1B', night: '#0A1411',
  marigold: '#F2B632', marigoldDeep: '#B57F10', marigoldHi: '#FFD66B', marigoldRim: '#FFE9A8',
  paper: '#FFFDF4', paperShade: '#E5DCC3', paperDeep: '#C9BD9D', cheek: '#F2A9A0',
  lav: '#7C7FA6', lavDeep: '#4D5078', lavHi: '#B1B3D6', lavNight: '#2C2F4C',
  slate: '#4A5560', slateDeep: '#2B333B', slateHi: '#76838F',
  teal: '#3E8E95', tealHi: '#8CCDD2', tealDeep: '#245C62',
  kraft: '#B58B55', kraftShade: '#7E5C35', bone: '#F4EEDC',
  steel: '#8C99A8', flare: '#F26B45', water: '#5E9AC0', waterHi: '#9ACBE6', waterDeep: '#2F6A8F',
  wood: '#8A5A33', woodHi: '#B7824F', woodDeep: '#5A3A20',
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
  fill?: number; slot5?: 0 | 1 | 2; slotLift?: number; armL?: number; armR?: number; walk?: number; lean?: number;
  sticker?: number; sq?: number; shadow?: boolean; ph?: number; id?: string; holdR?: React.ReactNode; tack?: number; mouthOpen?: number;
}> = ({x, y, f, scale = 1, facing = 1, mood = 'proud', look = 0, fill = 0, slot5 = 0, slotLift = 0, armL = 12, armR = 12, walk = 0, lean = 0, sticker = 0, sq = 0, shadow = true, ph = 0, id = 'dt', holdR, tack = 0, mouthOpen = 0}) => {
  const gid = `${id}${Math.round(x)}${Math.round(y)}`;
  const t = tones(PM.paper);
  const breath = 1 + 0.012 * Math.sin(f / 22 + ph);
  const sway = lean + 1.4 * Math.sin(f / 41 + ph) + 0.8 * Math.sin(f / 23 + ph * 2);
  const blink = Math.sin(f / 51 + ph * 3) > 0.975 ? 0.15 : 1;
  const eyeH = 50 * blink * (mood === 'wobble' ? 1.12 : mood === 'cross' ? 0.82 : mood === 'read' ? 0.72 : 1);
  const px = look * 7, py = mood === 'read' ? 8 : mood === 'wobble' ? -2 : 0;
  const inner = mood === 'cross' ? -9 : mood === 'wobble' ? 12 : mood === 'read' ? 3 : 0;
  const outer = mood === 'cross' ? 12 : mood === 'wobble' ? -8 : mood === 'beam' ? -8 : -3;
  const lift = clamp01(slotLift);
  const stepA = walk ? Math.sin(walk) : 0;
  const wob = mood === 'wobble' ? 1.4 * Math.sin(f * 0.55 + ph) : 0;
  const rows = DOTTY_ROWS.map((lb, i) => ({lb, k: clamp01(fill - i), y: ROW_TOP(i)}));
  const slotY = ROW_TOP(4) + 2;
  // the lifted fifth box rises on an arc to the raised right hand
  const hand = dottyHand(1, armR, 118);
  const sx = lerp(0, hand.x + 4, lift), sy = lerp(slotY, hand.y - 40, lift) - 40 * Math.sin(lift * Math.PI);
  const ss = lerp(1, 1.18, lift);
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
        {/* the fifth box, the only cool thing on a warm form: dashed teal, empty, and at last stamped NOT REPORTED */}
        {slot5 > 0 && (
          <g transform={`translate(${sx},${sy}) scale(${ss}) rotate(${lift * 6 * Math.sin(f / 5 + ph)})`} opacity={slot5 > 0 ? 1 : 0}>
            {lift > 0.02 && <rect x={-122} y={-26} width={244} height={74} rx={7} fill="#000" opacity={0.22} transform="translate(6,8)" />}
            {lift > 0.02 && <rect x={-122} y={-26} width={244} height={74} rx={7} fill={PM.paper} stroke={INK} strokeWidth={4.5} />}
            <text x={-116} y={-2} fontFamily={MONO} fontWeight={800} fontSize={14} letterSpacing={0.6} fill={PM.tealDeep}>OUTSIDE CHECK</text>
            <rect x={-116} y={4} width={232} height={30} rx={5} fill="#F3FAFA" stroke={PM.teal} strokeWidth={3.4} strokeDasharray="12 8" strokeDashoffset={-f * 0.7} />
            {slot5 === 2 && (
              <g transform={`translate(0,19) rotate(-4)`}>
                <rect x={-96} y={-14} width={192} height={28} rx={4} fill="none" stroke={PM.teal} strokeWidth={3.4} />
                <text x={0} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={19} letterSpacing={1.4} fill={PM.tealDeep}>NOT REPORTED</text>
              </g>
            )}
          </g>
        )}
        {sticker > 0.02 && (
          <g transform={`translate(-96,-76) rotate(-12) scale(${snap(f, 0, 1) * clamp01(sticker)})`} opacity={clamp01(sticker * 2)}>
            <circle r={26} fill={PM.marigoldHi} stroke={INK} strokeWidth={4} />
            <text x={0} y={6} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} fill={INK}>NEW</text>
          </g>
        )}
        {tack > 0.02 && (
          <g transform={`translate(0,${-486 - 24 * (1 - clamp01(tack))})`} opacity={clamp01(tack * 2)}>
            <circle r={13} fill={PM.flare} stroke={INK} strokeWidth={4} />
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

// ---- Clerk: an ink stamp (a prop, no face) -------------------------------------------------------------------------------------------------
/** origin is the centre of the rubber face. `down` 0 is raised, 1 is pressed. */
export const Stamp: React.FC<{x: number; y: number; scale?: number; down?: number; tilt?: number; f?: number; ink?: string}> = ({x, y, scale = 1, down = 0, tilt = 0, f = 0, ink = PM.marigold}) => {
  const lift = (1 - clamp01(down)) * 120;
  const t = tones(PM.wood);
  return (
    <g transform={`translate(${x},${y - lift}) rotate(${tilt}) scale(${scale},${scale * (1 - 0.06 * clamp01(down))})`}>
      <FormGradient id={`stamp${Math.round(x)}`} t={t} softness={0.6} />
      <ellipse cx={0} cy={lift + 4} rx={86} ry={11} fill="#000" opacity={0.2 * clamp01(down + 0.3)} />
      <rect x={-72} y={-8} width={144} height={26} rx={6} fill={ink} stroke={INK} strokeWidth={5} />
      <rect x={-86} y={-44} width={172} height={42} rx={9} fill="#3A4150" stroke={INK} strokeWidth={5.5} />
      <rect x={-78} y={-38} width={156} height={9} rx={4} fill="#FFFFFF" opacity={0.18} />
      <path d="M-18,-44 L-18,-116 L18,-116 L18,-44 Z" fill={`url(#stamp${Math.round(x)})`} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      <ellipse cx={0} cy={-132} rx={46} ry={34} fill={`url(#stamp${Math.round(x)})`} stroke={INK} strokeWidth={6} />
      <path d="M-30,-146 Q-8,-162 18,-152" fill="none" stroke={PM.woodHi} strokeWidth={7} strokeLinecap="round" opacity={0.7} />
      <circle cx={-10} cy={-96} r={10} fill={PM.bone} stroke={INK} strokeWidth={3.4} />
      <circle cx={14} cy={-96} r={10} fill={PM.bone} stroke={INK} strokeWidth={3.4} />
    </g>
  );
};

/** the ink print a Stamp leaves: a rounded rectangle with the caller's text, pops with the strike */
export const StampPrint: React.FC<{x: number; y: number; text: string; k: number; size?: number; rot?: number; color?: string; f?: number}> = ({x, y, text, k, size = 34, rot = -4, color = PM.marigoldDeep, f = 0}) => {
  const kk = clamp01(k);
  if (kk <= 0.02) return null;
  const w = monoW(text, size, 2) + 40;
  const sc = 1 + 0.18 * (1 - kk) + 0.012 * Math.sin(f / 9);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${sc})`} opacity={Math.min(1, kk * 2.4)}>
      <rect x={-w / 2} y={-size * 0.8} width={w} height={size * 1.6} rx={6} fill="none" stroke={color} strokeWidth={5} />
      <rect x={-w / 2 + 6} y={-size * 0.8 + 6} width={w - 12} height={size * 1.6 - 12} rx={3} fill="none" stroke={color} strokeWidth={2} opacity={0.7} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={2} fill={color}>{text}</text>
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
  const wall = (k: FloorKey) => (k === 'sky' ? PM.lavNight : k === 'state' ? PM.slateDeep : '#E9D9B4');
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
            {glow > 0.01 && <rect x={BLD.x} y={y0} width={BLD.w} height={FLOOR_H} fill={PM.marigold} opacity={(0.1 + 0.012 * Math.sin(f / 7)) * glow} />}
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

/** a warm paper room for the courtroom of paper: a wall, a desk plane and one lamp pool */
export const PaperRoomBG: React.FC<{f: number; id?: string; deskY?: number; pool?: number}> = ({f, id = 'pr', deskY = 1250, pool = 1}) => (
  <g>
    <defs>
      <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C9B994" /><stop offset="1" stopColor="#E7D9B6" /></linearGradient>
      <radialGradient id={`${id}l`} cx="0.5" cy="0.2" r="0.8"><stop offset="0" stopColor="#FFF1C4" stopOpacity={0.9 * pool} /><stop offset="1" stopColor="#FFF1C4" stopOpacity={0} /></radialGradient>
    </defs>
    <rect x={-60} y={-60} width={1200} height={deskY + 60} fill={`url(#${id}w)`} />
    {Array.from({length: 16}).map((_, i) => <rect key={i} x={-20 + i * 72} y={0} width={5} height={deskY} fill="#B6A67E" opacity={0.35} />)}
    <rect x={-60} y={deskY} width={1200} height={1920 - deskY + 60} fill={PM.woodHi} stroke={INK} strokeWidth={8} />
    {Array.from({length: 9}).map((_, i) => <path key={i} d={`M-60,${deskY + 24 + i * 60} Q540,${deskY + 8 + i * 60 + (i % 2) * 10} 1140,${deskY + 28 + i * 60}`} fill="none" stroke={PM.wood} strokeWidth={3} opacity={0.5} />)}
    <ellipse cx={540} cy={deskY - 140} rx={620} ry={700} fill={`url(#${id}l)`} />
    {Array.from({length: 18}).map((_, i) => <circle key={i} cx={(rnd(i + 90) * 1100 + f * 0.25 * (1 + rnd(i + 91))) % 1140 - 30} cy={200 + rnd(i + 92) * (deskY - 260) + 14 * Math.sin(f / 40 + i)} r={1.4 + rnd(i + 93) * 2} fill="#FFF6D6" opacity={0.28 + 0.3 * rnd(i + 94)} />)}
  </g>
);

/** a hanging brass desk lamp's shade (the one warm metal in the courtroom of paper) */
export const DeskLamp: React.FC<{x: number; y: number; f: number; scale?: number}> = ({x, y, f, scale = 1}) => {
  const sw = 2.2 * Math.sin(f / 43);
  return (
    <g transform={`translate(${x},${y}) rotate(${sw}) scale(${scale})`}>
      <path d="M0,-400 L0,-60" stroke={INK} strokeWidth={9} />
      <path d="M-70,0 L70,0 L44,-62 L-44,-62 Z" fill={PM.marigold} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <ellipse cx={0} cy={0} rx={70} ry={10} fill={PM.marigoldRim} stroke={INK} strokeWidth={4} />
      <path d="M-34,-48 L-48,-6" stroke={PM.marigoldRim} strokeWidth={6} strokeLinecap="round" opacity={0.7} />
    </g>
  );
};

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
