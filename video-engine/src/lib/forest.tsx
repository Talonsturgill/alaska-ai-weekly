import React from 'react';
import {INK} from './Character';
import {tones, paleTones, FormGradient, RimLight, ContactShadow} from './lighting';

// ============================================================================================
// FOREST FAMILY (NET-NEW 2026-11-16, "The Forest Can't Stand on the Ice").
// The shelf had nothing that VOTES and no tree with a face. A random forest is literally a crowd
// of decision trees that each cast a vote, so any machine learning story built on an ensemble
// (random forests, boosted trees, a committee of models) can now cast:
//   VoteTree      one faced decision tree; its crown splits on a visible yes/no fork and its
//                 branch-hand raises a ballot paddle
//   Grove         a troupe of VoteTrees laid out in rows with per-tree seeds, delays and pops
//   Thermometer   a faced wall thermometer (glass tube on a wooden board), the "simple temperature model" character
//   KettleLake    a thermokarst lake polygon set into tundra: ice, cracking, open water, glow
//   SurveyStake   an empty survey stake with a hanging tag, for "not yet checked in the field"
// Everything is wood and water, never metal. No paddle ever shows a count. SurveyStake was not cast in its first film.
// ============================================================================================

const uid = (s: string) => 'fo' + Math.abs([...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)).toString(36);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const h01 = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const MONO_ = "'JetBrains Mono', monospace";

export const FOREST = {
  bark: '#E9DCC1', barkMark: '#2A2622', crown: '#6E8B3D', crownL: '#93AE58', crownD: '#3E5A24',
  ice: '#D8ECEF', iceCrack: '#9CC7CE', water: '#2D6E73', waterL: '#7FC2BF', bank: '#4A3420',
  lime: '#C6F04D', magenta: '#F24FA0', enamel: '#F3EAD8', bulb: '#D9452F', stake: '#C9A46A',
};

export type TreeEmotion = 'calm' | 'curious' | 'puzzled' | 'proud' | 'worried' | 'startled';
export type Paddle = 'ice' | 'water' | null;

/**
 * VoteTree. Origin (x, y) is the trunk's foot on the ground. At scale 1 the tree is about 150 wide and 230 tall.
 *  - pop 0..1       rises out of the ground with squash, overshoot and settle (0 = hidden below ground)
 *  - paddle         'ice' | 'water' | null: the ballot paddle in its right branch-hand
 *  - paddleUp 0..1  raises the paddle (anticipation dip, overshoot)
 *  - flip 0..1      mid-flip of the paddle face (0.5 = edge-on)
 *  - look -1..1     eye direction
 *  - fork 0..1      lights the crown's yes/no split (the decision) in lime
 *  - rim            rim colour (honey by day, lime under the radar)
 *  - snow 0..1      a snow cap on the crown (night shots)
 */
export const VoteTree: React.FC<{
  x: number; y: number; scale?: number; f: number; seed?: number; pop?: number; paddle?: Paddle; paddleUp?: number;
  flip?: number; look?: number; emotion?: TreeEmotion; fork?: number; rim?: string; snow?: number; facing?: 1 | -1; shadow?: boolean;
  /** a long cast shadow on the ground: + falls right, - falls left, magnitude is its length in tree heights (0 = none) */
  cast?: number;
  /** which edge the key light rims: 1 the right lobe (default), -1 the left lobe (a dusk sun at screen left) */
  rimSide?: 1 | -1;
}> = ({x, y, scale = 1, f, seed = 0, pop = 1, paddle = null, paddleUp = 0, flip = 0, look = 0, emotion = 'calm', fork = 0,
       rim = '#FFD98A', snow = 0, facing = 1, shadow = true, cast = 0, rimSide = 1}) => {
  const id = uid(`vt${seed}`);
  const p = clamp01(pop);
  if (p <= 0.001) return null;
  // rise: below-ground to standing, overshoot then settle; squash on the way up
  const rise = p < 0.7 ? (p / 0.7) * 1.12 : 1.12 - 0.12 * Math.sin(((p - 0.7) / 0.3) * Math.PI / 2);
  const sq = 1 + 0.18 * Math.sin(Math.min(1, p) * Math.PI) * (p < 0.7 ? -1 : 0.6);
  const sway = Math.sin(f / (17 + seed % 7) + seed) * 3.2 + Math.sin(f / 41 + seed * 2) * 1.6;
  const breathe = 1 + 0.018 * Math.sin(f / 13 + seed);
  const blink = ((f + seed * 13) % 97) < 4;
  const bark = paleTones(FOREST.bark);
  const crown = tones(FOREST.crown);
  const up = clamp01(paddleUp);
  const upE = up < 0.25 ? -up * 0.6 : (up - 0.25) / 0.75 * 1.1 - 0.15 * Math.sin(clamp01((up - 0.6) / 0.4) * Math.PI);
  const fl = clamp01(flip);
  const edge = Math.abs(Math.cos(fl * Math.PI));
  const shown: Paddle = fl < 0.5 ? paddle : paddle === 'ice' ? 'water' : paddle === 'water' ? 'ice' : null;
  const eyeX = look * 4;
  const mouth = {
    calm: 'M -9 2 Q 0 7 9 2', curious: 'M -6 3 Q 0 8 6 3', puzzled: 'M -9 4 Q -2 1 9 5', proud: 'M -11 1 Q 0 11 11 1',
    worried: 'M -9 6 Q 0 0 9 6', startled: 'M -5 2 Q 0 12 5 2 Q 0 -2 -5 2',
  }[emotion];
  const brow = {calm: 0, curious: -3, puzzled: 3, proud: -2, worried: 4, startled: -6}[emotion];
  const crownPath = 'M -70 -130 C -96 -150 -92 -200 -58 -208 C -52 -236 -14 -246 0 -222 C 14 -246 52 -236 58 -208 C 92 -200 96 -150 70 -130 C 54 -112 18 -118 0 -128 C -18 -118 -54 -112 -70 -130 Z';
  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale})`}>
      {cast !== 0 && (
        <g transform={`scale(${facing},1)`} opacity={0.26 * p}>
          <path d={`M -16 0 L 16 0 L ${cast * 230 + 60} 18 L ${cast * 230 - 60} 18 Z`} fill={INK} style={{filter: 'blur(4px)'}} />
        </g>
      )}
      {shadow && <ContactShadow cx={0} cy={2} rx={58 * p} ry={12} opacity={0.32} blur={7} />}
      <clipPath id={`${id}_g`}><rect x={-200} y={-400} width={400} height={402} /></clipPath>
      <g clipPath={`url(#${id}_g)`}>
        <g transform={`translate(0,${(1 - rise) * 240}) scale(${1 / Math.sqrt(sq)},${sq * breathe}) rotate(${sway * 0.25})`}>
          <defs>
            <FormGradient id={`${id}_b`} t={bark} />
            <FormGradient id={`${id}_c`} t={crown} />
          </defs>
          {/* trunk */}
          <path d="M -20 0 C -18 -40 -16 -80 -14 -118 L 14 -118 C 16 -80 18 -40 20 0 Z" fill={`url(#${id}_b)`} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
          {[18, 44, 70, 96].map((yy, i) => (
            <path key={i} d={`M ${-14 + (i % 2) * 8} ${-yy} q 6 -3 12 0`} stroke={FOREST.barkMark} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.8} />
          ))}
          <path d="M 10 -6 C 12 -40 12 -80 10 -116" stroke="#000" strokeWidth={6} opacity={0.12} fill="none" />
          {/* the decision fork: a Y branch that splits the crown */}
          <path d="M 0 -116 L 0 -140 M 0 -140 L -40 -168 M 0 -140 L 40 -168" stroke={INK} strokeWidth={9} strokeLinecap="round" fill="none" />
          <path d="M 0 -116 L 0 -140 M 0 -140 L -40 -168 M 0 -140 L 40 -168" stroke={FOREST.bark} strokeWidth={4} strokeLinecap="round" fill="none" />
          {/* crown in two lobes, each split again (a tree of decisions) */}
          <g transform={`rotate(${sway * 0.5} 0 -130)`}>
            <path d={crownPath} fill={`url(#${id}_c)`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <path d="M 0 -128 L 0 -222" stroke={FOREST.crownD} strokeWidth={4} opacity={0.75} />
            <path d="M -40 -168 L -62 -196 M -40 -168 L -22 -204 M 40 -168 L 22 -204 M 40 -168 L 62 -196" stroke={FOREST.crownD} strokeWidth={3.5} strokeLinecap="round" opacity={0.7} />
            {[[-58, -190, 12], [-24, -212, 10], [28, -214, 11], [60, -186, 12], [-70, -152, 9], [72, -150, 9]].map(([cx, cy, r], i) => (
              <circle key={i} cx={cx} cy={cy} r={r} fill={FOREST.crownL} opacity={0.55 + 0.1 * Math.sin(f / 19 + i + seed)} />
            ))}
            <RimLight d={rimSide * facing > 0 ? "M 70 -130 C 96 -150 92 -200 58 -208 C 52 -236 14 -246 0 -222" : "M -70 -130 C -96 -150 -92 -200 -58 -208 C -52 -236 -14 -246 0 -222"} color={rim} w={5} opacity={0.75} />
            {fork > 0.01 && (
              <path d="M 0 -116 L 0 -140 M 0 -140 L -40 -168 M 0 -140 L 40 -168" stroke={FOREST.lime} strokeWidth={6} strokeLinecap="round" fill="none"
                opacity={clamp01(fork)} style={{filter: 'drop-shadow(0 0 6px #C6F04D)'}} />
            )}
            {snow > 0.01 && (
              <path d="M -58 -208 C -52 -236 -14 -246 0 -222 C 14 -246 52 -236 58 -208 C 40 -214 22 -206 0 -214 C -22 -206 -40 -214 -58 -208 Z"
                fill="#F4F7FA" stroke={INK} strokeWidth={3} opacity={clamp01(snow)} />
            )}
          </g>
          {/* face on the trunk */}
          <g transform="translate(0,-74)">
            <path d={`M -14 ${-14 + brow} l 9 ${-brow * 0.3}`} stroke={INK} strokeWidth={3} strokeLinecap="round" />
            <path d={`M 14 ${-14 + brow} l -9 ${-brow * 0.3}`} stroke={INK} strokeWidth={3} strokeLinecap="round" />
            {blink ? (
              <g stroke={INK} strokeWidth={3} strokeLinecap="round"><path d="M -14 -4 h 9" /><path d="M 5 -4 h 9" /></g>
            ) : (
              <g>
                <ellipse cx={-9} cy={-4} rx={6} ry={emotion === 'startled' ? 8.5 : 7} fill="#fff" stroke={INK} strokeWidth={2.4} />
                <ellipse cx={9} cy={-4} rx={6} ry={emotion === 'startled' ? 8.5 : 7} fill="#fff" stroke={INK} strokeWidth={2.4} />
                <circle cx={-9 + eyeX} cy={-3} r={3.2} fill={INK} />
                <circle cx={9 + eyeX} cy={-3} r={3.2} fill={INK} />
              </g>
            )}
            <path d={mouth} transform="translate(0,10)" stroke={INK} strokeWidth={3} fill={emotion === 'startled' ? INK : 'none'} strokeLinecap="round" />
          </g>
          {/* branch arms */}
          <path d="M -15 -60 C -34 -66 -42 -76 -48 -88" stroke={INK} strokeWidth={8} strokeLinecap="round" fill="none" />
          <path d="M -15 -60 C -34 -66 -42 -76 -48 -88" stroke={FOREST.bark} strokeWidth={3.5} strokeLinecap="round" fill="none" />
          {paddle ? (
            <g transform={`translate(18,-60) rotate(${-48 * upE})`}>
              <path d={`M 0 0 C 18 -4 30 -12 ${38} ${-40 - 30 * upE}`} stroke={INK} strokeWidth={8} strokeLinecap="round" fill="none" />
              <path d={`M 0 0 C 18 -4 30 -12 ${38} ${-40 - 30 * upE}`} stroke={FOREST.bark} strokeWidth={3.5} strokeLinecap="round" fill="none" />
              <g transform={`translate(38,${-40 - 30 * upE}) scale(${Math.max(0.06, edge)},1)`}>
                <line x1={0} y1={0} x2={0} y2={-34} stroke={INK} strokeWidth={6} />
                <rect x={-44} y={-84} width={88} height={52} rx={10} fill={shown === 'water' ? FOREST.water : FOREST.ice} stroke={INK} strokeWidth={4.5} />
                <rect x={-44} y={-84} width={88} height={52} rx={10} fill="none" stroke={FOREST.lime} strokeWidth={2.5} opacity={0.85} />
                <text x={0} y={-50} textAnchor="middle" fontFamily={MONO_} fontWeight={800} fontSize={shown === 'water' ? 19 : 24} letterSpacing={1}
                  fill={shown === 'water' ? '#F4FBFA' : '#1B3A40'}>{shown === 'water' ? 'WATER' : 'ICE'}</text>
              </g>
            </g>
          ) : (
            <g>
              <path d="M 15 -60 C 34 -66 42 -76 48 -88" stroke={INK} strokeWidth={8} strokeLinecap="round" fill="none" />
              <path d="M 15 -60 C 34 -66 42 -76 48 -88" stroke={FOREST.bark} strokeWidth={3.5} strokeLinecap="round" fill="none" />
            </g>
          )}
        </g>
      </g>
      {/* snow or soil kicked up as it punches through */}
      {p > 0.05 && p < 0.9 && [0, 1, 2, 3, 4].map((i) => {
        const t = (p - 0.05) / 0.85;
        const a = -Math.PI / 2 + (i - 2) * 0.5;
        return <circle key={i} cx={Math.cos(a) * 70 * t} cy={Math.sin(a) * 60 * t + 30 * t * t} r={7 * (1 - t)} fill="#F4F7FA" stroke={INK} strokeWidth={1.5} opacity={1 - t} />;
      })}
    </g>
  );
};

/**
 * Grove. A troupe of VoteTrees on rows receding toward the horizon (back rows smaller and higher).
 * (x, y) is the centre of the front row's feet.
 *  - pop 0..1          global rise; each tree is staggered by its seed so they punch up like whack-a-moles
 *  - paddle / paddleUp all trees vote together; `flipAt` 0..1 drives a ripple flip across the troupe
 *  - lookAt x          every tree turns its eyes toward this screen x
 */
export const Grove: React.FC<{
  x: number; y: number; f: number; cols?: number; rows?: number; dx?: number; dy?: number; scale?: number; pop?: number;
  paddle?: Paddle; paddleUp?: number; flipAt?: number; lookAt?: number; emotion?: TreeEmotion; fork?: number; rim?: string; snow?: number; seed?: number;
  cast?: number; rimSide?: 1 | -1;
}> = ({x, y, f, cols = 5, rows = 3, dx = 150, dy = 70, scale = 0.8, pop = 1, paddle = null, paddleUp = 0, flipAt = 0, lookAt, emotion = 'calm',
       fork = 0, rim, snow = 0, seed = 0, cast = 0, rimSide = 1}) => {
  const trees: React.ReactNode[] = [];
  for (let r = rows - 1; r >= 0; r--) {
    const k = 1 - r * 0.16;
    const n = cols + (r % 2 ? -1 : 0);
    for (let c = 0; c < n; c++) {
      const s = seed + r * 17 + c * 5;
      const tx = x + (c - (n - 1) / 2) * dx * k + (h01(s) - 0.5) * 22;
      const ty = y - r * dy;
      const delay = h01(s, 3) * 0.45;
      const tp = clamp01((pop - delay) / 0.55);
      const flipLocal = clamp01((flipAt - (c / Math.max(1, n - 1)) * 0.5) / 0.5);
      const look = lookAt === undefined ? Math.sin(f / 37 + s) * 0.5 : Math.max(-1, Math.min(1, (lookAt - tx) / 260));
      trees.push(
        <VoteTree key={`${r}-${c}`} x={tx} y={ty} scale={scale * k} f={f} seed={s} pop={tp} paddle={paddle}
          paddleUp={clamp01((paddleUp - delay * 0.4) / 0.8)} flip={flipLocal} look={look} emotion={emotion} fork={fork} rim={rim} snow={snow} cast={cast * k} rimSide={rimSide} />,
      );
    }
  }
  return <g>{trees}</g>;
};

/**
 * Thermometer. A classic wall thermometer: a glass tube on a wooden backing board, wood not enamel, with a dot-eye face on
 * the board above the tube. Origin (x, y) is the foot of the board on the ground. At scale 1 it stands about 300 tall.
 *  - level 0..1   the red column (physical, the one red)
 *  - lean -1..1   leans
 *  - glasses      reading glasses (the teacher)
 *  - point 0..1   raises its left arm to point
 *  - rim          rim colour on the lit edge; cast  a long ground shadow (+ right, - left)
 */
export const Thermometer: React.FC<{
  x: number; y: number; scale?: number; f: number; level?: number; lean?: number; glasses?: boolean; point?: number;
  emotion?: TreeEmotion; seed?: number; rim?: string; cast?: number; rimSide?: 1 | -1;
}> = ({x, y, scale = 1, f, level = 0.6, lean = 0, glasses = false, point = 0, emotion = 'calm', seed = 3, rim = '#FFF4D8', cast = 0, rimSide = 1}) => {
  const id = uid(`th${seed}`);
  const wood = tones('#B07A48');
  const bob = Math.sin(f / 15 + seed) * 2.2;
  const blink = ((f + seed * 7) % 89) < 4;
  const lv = clamp01(level) * (1 + 0.015 * Math.sin(f / 9));
  const mouth = {calm: 'M -10 0 Q 0 6 10 0', curious: 'M -7 1 Q 0 7 7 1', puzzled: 'M -10 2 Q -2 -1 10 3', proud: 'M -12 -1 Q 0 10 12 -1',
    worried: 'M -10 5 Q 0 -1 10 5', startled: 'M -6 0 Q 0 10 6 0 Q 0 -3 -6 0'}[emotion];
  const pt = clamp01(point);
  const board = 'M -44 -6 L -44 -282 Q -44 -306 -20 -306 L 20 -306 Q 44 -306 44 -282 L 44 -6 Z';
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {cast !== 0 && <path d={`M -40 0 L 40 0 L ${cast * 300 + 70} 22 L ${cast * 300 - 70} 22 Z`} fill={INK} opacity={0.24} style={{filter: 'blur(4px)'}} />}
      <ContactShadow cx={0} cy={4} rx={60} ry={12} opacity={0.34} blur={7} />
      <g transform={`rotate(${lean * 9} 0 0) translate(0,${bob})`}>
        <defs><FormGradient id={`${id}_w`} t={wood} /></defs>
        <path d={board} fill={`url(#${id}_w)`} stroke={INK} strokeWidth={5} />
        {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M -36 ${-40 - i * 52} q 18 ${6 + i % 2 * 4} 30 0 q 12 -6 34 2`} stroke="#7A5030" strokeWidth={2.2} fill="none" opacity={0.55} />)}
        {/* the glass tube */}
        <rect x={-12} y={-250} width={24} height={210} rx={12} fill="#EAF4F6" stroke={INK} strokeWidth={4} opacity={0.95} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <line key={i} x1={16} x2={i % 2 ? 30 : 24} y1={-70 - i * 26} y2={-70 - i * 26} stroke={INK} strokeWidth={2.5} opacity={0.75} />
        ))}
        <rect x={-6} y={-60 - 170 * lv} width={12} height={170 * lv + 14} rx={6} fill={FOREST.bulb} stroke={INK} strokeWidth={2} />
        <circle cx={0} cy={-40} r={24} fill={FOREST.bulb} stroke={INK} strokeWidth={4.5} />
        <circle cx={-7} cy={-47} r={6} fill="#F4B7A8" opacity={0.6} />
        <path d="M -6 -244 L -6 -70" stroke="#FFFFFF" strokeWidth={3} opacity={0.7} />
        <RimLight d={rimSide > 0 ? "M 44 -282 L 44 -10" : "M -44 -282 L -44 -10"} color={rim} w={4} opacity={0.65} />
        {/* face on the board, above the tube */}
        <g transform="translate(0,-276)">
          {blink ? (
            <g stroke={INK} strokeWidth={3} strokeLinecap="round"><path d="M -20 0 h 10" /><path d="M 10 0 h 10" /></g>
          ) : (
            <g>
              <ellipse cx={-15} cy={0} rx={6} ry={7} fill="#fff" stroke={INK} strokeWidth={2.4} />
              <ellipse cx={15} cy={0} rx={6} ry={7} fill="#fff" stroke={INK} strokeWidth={2.4} />
              <circle cx={-14 + lean * 3} cy={1} r={3.2} fill={INK} />
              <circle cx={16 + lean * 3} cy={1} r={3.2} fill={INK} />
            </g>
          )}
          {glasses && <g fill="none" stroke={INK} strokeWidth={2.6}><circle cx={-15} cy={0} r={11} /><circle cx={15} cy={0} r={11} /><path d="M -4 0 L 4 0" /></g>}
          <path d={mouth} transform="translate(0,16) scale(0.8)" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
        </g>
        {/* arms from the board's sides */}
        <path d={`M -44 -160 C -62 -150 ${-70 - 20 * pt} ${-138 - 70 * pt} ${-76 - 30 * pt} ${-122 - 90 * pt}`} stroke={INK} strokeWidth={7} strokeLinecap="round" fill="none" />
        <path d={`M -44 -160 C -62 -150 ${-70 - 20 * pt} ${-138 - 70 * pt} ${-76 - 30 * pt} ${-122 - 90 * pt}`} stroke="#D9B07A" strokeWidth={3} strokeLinecap="round" fill="none" />
        <path d="M 44 -160 C 62 -150 70 -130 72 -114" stroke={INK} strokeWidth={7} strokeLinecap="round" fill="none" />
        <path d="M 44 -160 C 62 -150 70 -130 72 -114" stroke="#D9B07A" strokeWidth={3} strokeLinecap="round" fill="none" />
      </g>
    </g>
  );
};

/** a seeded thermokarst polygon around (0,0) */
export function lakePath(rx: number, ry: number, seed: number, n = 9): string {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + h01(seed, i) * 0.25;
    const r = 0.78 + h01(seed + 3, i) * 0.3;
    pts.push(`${(Math.cos(a) * rx * r).toFixed(1)} ${(Math.sin(a) * ry * r).toFixed(1)}`);
  }
  return `M ${pts.join(' L ')} Z`;
}

/**
 * KettleLake. Origin (x, y) is the lake centre. A thermokarst polygon set into the ground with a dark bank.
 *  - ice 0..1     1 frozen (celadon, crack lines), 0 open water (teal with travelling ripples)
 *  - crack 0..1   cracks race across the ice (breakup)
 *  - glow 0..1    a fuchsia field-flag on the rim: flagged for a field check, an open question, never heat or error
 *  - radar 0..1   a lime scan line sweeps across it
 *  - detail       false for tiny lakes in a field of many
 */
export const KettleLake: React.FC<{
  x: number; y: number; rx: number; ry: number; f: number; seed?: number; ice?: number; crack?: number; glow?: number; radar?: number;
  detail?: boolean; dim?: number;
}> = ({x, y, rx, ry, f, seed = 1, ice = 1, crack = 0, glow = 0, radar = 0, detail = true, dim = 0}) => {
  const id = uid(`kl${seed}${rx}`);
  const d = lakePath(rx, ry, seed);
  const bank = lakePath(rx * 1.08, ry * 1.14, seed);
  const ic = clamp01(ice);
  const gl = clamp01(glow) * (0.75 + 0.25 * Math.sin(f / 7 + seed));
  return (
    <g transform={`translate(${x},${y})`}>
      <path d={bank} fill={FOREST.bank} stroke={INK} strokeWidth={detail ? 4 : 2} />
      <clipPath id={`${id}_c`}><path d={d} /></clipPath>
      <g clipPath={`url(#${id}_c)`}>
        <rect x={-rx * 1.3} y={-ry * 1.3} width={rx * 2.6} height={ry * 2.6} fill={FOREST.water} />
        {detail && [0, 1, 2, 3].map((i) => {
          const yy = -ry + ((i * ry * 0.55 + f * 0.6 + seed * 9) % (ry * 2.2));
          return <path key={i} d={`M ${-rx} ${yy} q ${rx * 0.25} -6 ${rx * 0.5} 0 t ${rx * 0.5} 0 t ${rx * 0.5} 0 t ${rx * 0.5} 0`} stroke={FOREST.waterL} strokeWidth={3} fill="none" opacity={0.55 * (1 - ic)} />;
        })}
        <g opacity={ic}>
          <rect x={-rx * 1.3} y={-ry * 1.3} width={rx * 2.6} height={ry * 2.6} fill={FOREST.ice} />
          <ellipse cx={-rx * 0.25} cy={-ry * 0.3} rx={rx * 0.5} ry={ry * 0.25} fill="#fff" opacity={0.45} />
          {detail && [0, 1, 2].map((i) => (
            <path key={i} d={`M ${-rx + i * rx * 0.6} ${-ry} l ${rx * 0.25} ${ry * 0.7} l ${-rx * 0.1} ${ry * 0.6}`} stroke={FOREST.iceCrack} strokeWidth={2} fill="none" opacity={0.6} />
          ))}
        </g>
        {detail && crack > 0.01 && [0, 1, 2, 3, 4].map((i) => {
          const len = clamp01(crack * 1.4 - i * 0.12);
          const a = h01(seed, i + 9) * Math.PI * 2;
          return <line key={`c${i}`} x1={0} y1={0} x2={Math.cos(a) * rx * 1.2 * len} y2={Math.sin(a) * ry * 1.2 * len} stroke={INK} strokeWidth={3} opacity={ic} strokeLinecap="round" />;
        })}
        {radar > 0.01 && (
          <rect x={-rx * 1.3 + ((f * 9 + seed * 40) % (rx * 2.6))} y={-ry * 1.3} width={rx * 0.22} height={ry * 2.6} fill={FOREST.lime} opacity={0.5 * clamp01(radar)} />
        )}
        {dim > 0 && <rect x={-rx * 1.3} y={-ry * 1.3} width={rx * 2.6} height={ry * 2.6} fill="#1C1A33" opacity={clamp01(dim)} />}
      </g>
      <path d={d} fill="none" stroke={INK} strokeWidth={detail ? 3.5 : 1.6} opacity={1 - 0.75 * clamp01(glow)} />
      {gl > 0.01 && (
        <path d={d} fill="none" stroke={FOREST.magenta} strokeWidth={detail ? 9 : 5} opacity={gl} style={{filter: 'drop-shadow(0 0 8px #F24FA0)'}} />
      )}
    </g>
  );
};

/** SurveyStake. (x, y) is where the stake enters the ground; a flagging ribbon and a tag on a string sway. */
export const SurveyStake: React.FC<{x: number; y: number; scale?: number; f: number; tag?: string; seed?: number; tagSize?: number}> = (
  {x, y, scale = 1, f, tag = '', seed = 5, tagSize = 22}) => {
  const sway = Math.sin(f / 21 + seed) * 6;
  const tw = tag ? tag.length * tagSize * 0.602 + 1.5 * (tag.length - 1) + 30 : 0;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={2} rx={26} ry={7} opacity={0.35} blur={5} />
      <rect x={-9} y={-210} width={18} height={214} fill={FOREST.stake} stroke={INK} strokeWidth={4} />
      <path d="M -9 4 L 0 22 L 9 4 Z" fill={FOREST.stake} stroke={INK} strokeWidth={3} opacity={0.5} />
      <g transform={`translate(9,-196) rotate(${sway})`}>
        <path d={`M 0 0 q 34 ${6 + sway} 64 ${-4 + sway * 0.5} l -6 16 q -30 8 -58 2 Z`} fill="#E8C46A" stroke={INK} strokeWidth={3} />
      </g>
      {tag && (
        <g transform={`translate(0,-150) rotate(${sway * 0.4})`}>
          <line x1={0} y1={0} x2={0} y2={30} stroke={INK} strokeWidth={2.5} />
          <rect x={-tw / 2} y={30} width={tw} height={tagSize + 22} rx={6} fill="#FFF6E3" stroke={INK} strokeWidth={3.5} />
          <text x={0} y={30 + tagSize * 0.98 + 6} textAnchor="middle" fontFamily={MONO_} fontWeight={800} fontSize={tagSize} letterSpacing={1.5} fill={INK}>{tag}</text>
        </g>
      )}
    </g>
  );
};
