import React from 'react';
import {INK, tones, FormGradient, ContactShadow} from './lighting';

// =============================================================================
// THE FORTUNE FAMILY (2026-10-07, "Ask Again"). A dented, taped, mended fortune ball with a face
// living in its window, and everything it is asked about, drawn with edges: a faceted answer die,
// angular pebbles, cut-tip survey stakes with cloth flags and kraft reason tags, a creased report
// booklet, a boulder, a bucket. Shape grammar: ROUND AND MENDED against FACETED AND CREASED.
//
// COLOUR LICENCE (each colour has ONE meaning, see art_direction.json): CRANBERRY means only the
// finance and insurance sector, CYAN means only what the ball says (window, die faces, labeled
// blank), WARM (#F4D9A0) means only the labeled blank, OCHRE is report data, BONE is paper.
// =============================================================================

export const FT = {
  ink: '#1B1F2A', inkDeep: '#0E1118', ball: '#232837', ballHi: '#4B5368', cranberry: '#8E1B3A', cranberryHi: '#B8466A',
  ochre: '#D9A441', ochreDk: '#9E742A', ochreHi: '#F0C770', bone: '#F2EDE4', boneDk: '#CFC7B6', cyan: '#7FB5C9', cyanDk: '#4E8399',
  cyanHi: '#C4E3EE', slate: '#B9C3CA', slateDk: '#8F9BA4', gravel: '#9C9684', gravelDk: '#7A7565', gravelHi: '#BDB6A2',
  wool: '#8E8A94', woolDk: '#6B6772', kraft: '#B79B6B', kraftDk: '#8A6F44', warm: '#F4D9A0', raven: '#2B3446', rim: '#EAF0F4',
  tape: '#9DA3A8', tapeDk: '#6F767C', river: '#8FA3AE', riverDk: '#5E7480', tundra: '#8C7A55', tundraDk: '#6E5F40', rift: '#EBDDBF',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const hash = (i: number) => {
  let x = (Math.floor(i) + 1013) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x ^= x >>> 16;
  return x >>> 0;
};
const rnd = (i: number) => (hash(i) % 10000) / 10000;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type Mood = 'neutral' | 'startled' | 'wary' | 'sweat' | 'mortified' | 'calm' | 'relieved' | 'anxious' | 'smug';

// ------------------------------------------------------------------ the ball's face (window coordinates)
const Face: React.FC<{f: number; mood: Mood; look: [number, number]; r: number; blinkAt?: number}> = ({f, mood, look, r, blinkAt = 0}) => {
  const k = r / 120;
  const period = 118;
  const bt = (f + blinkAt) % period;
  const blink = bt < 5 ? Math.sin((bt / 5) * Math.PI) : 0;
  const lx = look[0] * 9 * k, ly = look[1] * 7 * k;
  const eyeY = -26 * k, eyeDX = 42 * k;
  const wide = mood === 'startled' || mood === 'sweat' || mood === 'anxious';
  const squint = mood === 'wary' || mood === 'smug';
  const arcs = mood === 'calm' || mood === 'relieved';
  const sad = mood === 'mortified';
  const er = (wide ? 25 : 20) * k;
  const lid = squint ? 0.5 : mood === 'relieved' ? 0.35 : mood === 'mortified' ? 0.3 : 0;
  const lidK = Math.max(lid, blink);
  const eye = (sx: number) => {
    const cx = sx * eyeDX;
    if (arcs && blink < 0.5) {
      return (
        <path d={`M${cx - er},${eyeY + 4 * k} Q${cx},${eyeY - er * 1.05} ${cx + er},${eyeY + 4 * k}`} fill="none" stroke={INK} strokeWidth={7 * k} strokeLinecap="round" />
      );
    }
    return (
      <g>
        <ellipse cx={cx} cy={eyeY} rx={er} ry={er * 1.12} fill={FT.bone} stroke={INK} strokeWidth={4.5 * k} />
        <circle cx={cx + lx} cy={eyeY + ly + (sad ? 6 * k : 0)} r={er * 0.46} fill={INK} />
        <circle cx={cx + lx - er * 0.14} cy={eyeY + ly - er * 0.16} r={er * 0.14} fill={FT.bone} />
        {lidK > 0.02 && <rect x={cx - er - 3} y={eyeY - er * 1.2} width={er * 2 + 6} height={er * 2.4 * lidK} fill={FT.cyanDk} stroke={INK} strokeWidth={4 * k} />}
      </g>
    );
  };
  const brow = (sx: number) => {
    const cx = sx * eyeDX;
    const base = eyeY - er * 1.5;
    const tilt = sad ? -sx * 14 : mood === 'anxious' ? -sx * 10 : squint ? sx * 8 : mood === 'startled' ? 0 : 0;
    const raise = wide ? -8 * k : 0;
    return <path d={`M${cx - er},${base + tilt * k + raise} L${cx + er},${base - tilt * k + raise}`} stroke={INK} strokeWidth={6 * k} strokeLinecap="round" />;
  };
  const my = 40 * k;
  const wob = Math.sin(f / 3.2);
  let mouth: React.ReactNode;
  if (mood === 'startled') mouth = <ellipse cx={0} cy={my + 6 * k} rx={13 * k} ry={17 * k} fill={INK} />;
  else if (mood === 'sweat' || mood === 'anxious') mouth = <path d={`M${-30 * k},${my} q${10 * k},${-9 * k + wob * 3} ${20 * k},0 t${20 * k},0 t${20 * k},0`} stroke={INK} strokeWidth={6 * k} fill="none" strokeLinecap="round" />;
  else if (mood === 'mortified') mouth = <path d={`M${-30 * k},${my + 10 * k} Q0,${my - 12 * k} ${30 * k},${my + 10 * k}`} stroke={INK} strokeWidth={6 * k} fill="none" strokeLinecap="round" />;
  else if (mood === 'calm' || mood === 'relieved') mouth = <path d={`M${-30 * k},${my - 4 * k} Q0,${my + 22 * k} ${30 * k},${my - 4 * k}`} stroke={INK} strokeWidth={6 * k} fill="none" strokeLinecap="round" />;
  else if (mood === 'smug') mouth = <path d={`M${-26 * k},${my + 4 * k} Q${6 * k},${my + 8 * k} ${32 * k},${my - 8 * k}`} stroke={INK} strokeWidth={6 * k} fill="none" strokeLinecap="round" />;
  else if (mood === 'wary') mouth = <path d={`M${-24 * k},${my} L${24 * k},${my + 2 * k}`} stroke={INK} strokeWidth={6 * k} strokeLinecap="round" />;
  else mouth = <path d={`M${-22 * k},${my} Q0,${my + 8 * k + wob * 1.2} ${22 * k},${my}`} stroke={INK} strokeWidth={6 * k} fill="none" strokeLinecap="round" />;
  return (
    <g>
      {eye(-1)}{eye(1)}{brow(-1)}{brow(1)}{mouth}
    </g>
  );
};

// ------------------------------------------------------------------ THE FORTUNE BALL
/** A dented, taped, mended matte sphere with a round window. Origin (0,0) is the ball centre, radius 250 * s.
 *  `answer` prints a bone plate in the window's lower half (the classic answer), `sweat` 0..1 slides drops down the glass. */
export const FortuneBall: React.FC<{
  x: number; y: number; s?: number; f: number; mood?: Mood; look?: [number, number]; answer?: string; answerA?: number;
  tilt?: number; squash?: number; sweat?: number; shadow?: boolean; glow?: number; seed?: number; sloshing?: number; faceA?: number;
}> = ({x, y, s = 1, f, mood = 'neutral', look = [0, 0], answer, answerA = 1, tilt = 0, squash = 0, sweat = 0, shadow = true, glow = 1, seed = 0, sloshing = 0, faceA = 1}) => {
  const id = `fb${Math.round(x)}${Math.round(y)}${seed}`;
  const R = 250;
  const wy = -34, wr = 122;
  const t = tones(FT.ball);
  const sx = 1 + squash * 0.1, sy = 1 - squash * 0.1;
  const swirl = f / 40;
  const slosh = sloshing * 18 * Math.sin(f / 2.3);
  const bubbles = Array.from({length: 9}, (_, i) => {
    const h = rnd(i * 7 + seed);
    const bx = (h - 0.5) * wr * 1.5;
    const by = wr * 0.8 - (((f * (0.5 + h * 0.8) + i * 31) % (wr * 1.7)));
    return {bx, by, br: 2.5 + h * 5};
  });
  return (
    <g transform={`translate(${x},${y}) rotate(${tilt}) scale(${s * sx},${s * sy})`}>
      {shadow && <ContactShadow cx={20} cy={R - 6} rx={R * 0.92} ry={32} opacity={0.5} blur={14} />}
      <defs>
        <radialGradient id={`${id}b`} cx="34%" cy="26%" r="82%">
          <stop offset="0" stopColor={FT.ballHi} />
          <stop offset="0.38" stopColor={FT.ball} />
          <stop offset="0.8" stopColor={FT.ink} />
          <stop offset="1" stopColor={FT.inkDeep} />
        </radialGradient>
        <radialGradient id={`${id}w`} cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor={FT.cyanHi} />
          <stop offset="0.5" stopColor={FT.cyan} />
          <stop offset="1" stopColor={FT.cyanDk} />
        </radialGradient>
        <clipPath id={`${id}c`}><circle cx={0} cy={wy} r={wr - 8} /></clipPath>
      </defs>
      {/* the body */}
      <circle r={R} fill={`url(#${id}b)`} stroke={INK} strokeWidth={9} />
      {/* cool top-left rim so the ball keeps a silhouette against sky */}
      <path d={`M${-R * 0.88},${-R * 0.42} A${R * 0.98},${R * 0.98} 0 0 1 ${-R * 0.1},${-R * 0.97}`} fill="none" stroke={FT.rim} strokeWidth={7} strokeLinecap="round" opacity={0.42} />
      {/* dents: a dark crescent and a lit lip */}
      {[{cx: -150, cy: 110, rx: 54, ry: 38, r: -24}, {cx: 150, cy: -120, rx: 44, ry: 30, r: 28}, {cx: 60, cy: 168, rx: 62, ry: 36, r: 6}, {cx: -176, cy: -80, rx: 34, ry: 24, r: -40}].map((d, i) => (
        <g key={i} transform={`translate(${d.cx},${d.cy}) rotate(${d.r})`}>
          <ellipse rx={d.rx} ry={d.ry} fill={FT.inkDeep} opacity={0.5} />
          <path d={`M${-d.rx},0 A${d.rx},${d.ry} 0 0 1 ${d.rx},0`} fill="none" stroke={FT.ballHi} strokeWidth={4} opacity={0.6} transform="translate(0,-4)" />
        </g>
      ))}
      {/* thumb smudges */}
      {[{cx: -96, cy: 150}, {cx: -70, cy: 168}, {cx: 120, cy: 40}].map((d, i) => <ellipse key={i} cx={d.cx} cy={d.cy} rx={20} ry={26} fill={FT.ballHi} opacity={0.2} transform={`rotate(${20 + i * 18} ${d.cx} ${d.cy})`} />)}
      {/* the mend: a stitched seam */}
      <path d={`M${-R * 0.82},${R * 0.38} Q${-R * 0.2},${R * 0.74} ${R * 0.62},${R * 0.62}`} fill="none" stroke={FT.bone} strokeWidth={4} strokeDasharray="14 11" opacity={0.7} />
      {/* duct tape across the lower right */}
      <g transform={`translate(${R * 0.54},${R * 0.3}) rotate(-38)`}>
        <rect x={-92} y={-30} width={184} height={60} rx={4} fill={FT.tape} stroke={INK} strokeWidth={5} />
        {[-70, -38, -6, 26, 58].map((lx) => <line key={lx} x1={lx} y1={-26} x2={lx + 6} y2={26} stroke={FT.tapeDk} strokeWidth={2} opacity={0.6} />)}
        <path d="M-92,-30 l16,10 l-16,10 Z" fill={FT.tapeDk} opacity={0.6} />
        <rect x={-92} y={-30} width={184} height={14} fill={FT.rim} opacity={0.35} />
      </g>
      {/* the window: bezel, liquid, face */}
      <circle cx={0} cy={wy} r={wr + 14} fill={FT.inkDeep} stroke={INK} strokeWidth={6} />
      <circle cx={0} cy={wy} r={wr + 6} fill="none" stroke={FT.tapeDk} strokeWidth={6} />
      <circle cx={0} cy={wy} r={wr - 4} fill={`url(#${id}w)`} stroke={INK} strokeWidth={5} />
      <g clipPath={`url(#${id}c)`}>
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${-wr},${-30 + i * 38 + 12 * Math.sin(swirl + i * 2)} Q${-wr * 0.3},${-60 + i * 38 + 16 * Math.sin(swirl * 1.3 + i) + slosh} ${wr * 0.4},${-24 + i * 38 + 12 * Math.cos(swirl + i)} T${wr},${-40 + i * 38}`}
            fill="none" stroke={FT.cyanHi} strokeWidth={5} opacity={0.4} transform={`translate(0,${wy})`} />
        ))}
        <g opacity={clamp01(faceA)} transform={`translate(0,${wy + 4}) rotate(${slosh * 0.25})`}>
          <Face f={f} mood={mood} look={look} r={wr} blinkAt={seed * 17} />
        </g>
        {bubbles.map((b, i) => <circle key={i} cx={b.bx} cy={wy + b.by} r={b.br} fill={FT.cyanHi} stroke={FT.bone} strokeWidth={1.2} opacity={0.65} />)}
        {answer && (
          <g opacity={clamp01(answerA)} transform={`translate(0,${wy + wr * 0.62})`}>
            <rect x={-wr * 0.78} y={-18} width={wr * 1.56} height={36} rx={8} fill={FT.bone} stroke={INK} strokeWidth={4} />
            <text x={0} y={9} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={800} fontSize={Math.min(24, (wr * 1.4) / (answer.length * 0.602))} letterSpacing={0.5} fill={INK}>{answer}</text>
          </g>
        )}
        {/* glass highlight */}
        <path d={`M${-wr * 0.7},${wy - wr * 0.1 - wy} Q${-wr * 0.5},${-wr * 0.75} ${-wr * 0.1},${-wr * 0.82}`} transform={`translate(0,${wy})`} fill="none" stroke={FT.bone} strokeWidth={8} strokeLinecap="round" opacity={0.5} />
      </g>
      {/* glow on the nearest ground */}
      <circle cx={0} cy={wy} r={wr + 14} fill="none" stroke={FT.cyanHi} strokeWidth={3} opacity={0.4 * glow} />
      {/* sweat drops slide down the glass */}
      {sweat > 0.02 && [0, 1, 2].map((i) => {
        const p = clamp01(sweat * 1.3 - i * 0.2);
        if (p <= 0) return null;
        const dx = -wr * 0.62 + i * wr * 0.62;
        const dy = wy - wr * 0.72 + p * wr * 1.3 + 8 * Math.sin(f / 5 + i);
        return <path key={i} d={`M${dx},${dy - 16} q10,16 0,26 q-10,-10 0,-26 Z`} fill={FT.cyanHi} stroke={FT.bone} strokeWidth={2.2} opacity={0.9} />;
      })}
    </g>
  );
};

// ------------------------------------------------------------------ THE ANSWER DIE
/** An icosahedron-like faceted die seen with three facet rings: a front triangle (the face) and six edge facets.
 *  Origin is its centre, outer radius 260 * s. `lines` prints on the front face. `flip` 0..1 squashes it through edge-on. */
export const AnswerDie: React.FC<{
  x: number; y: number; s?: number; f: number; lines?: string[]; rot?: number; flip?: number; blank?: boolean; glowWarm?: number; textSize?: number; ink?: string; seed?: number;
}> = ({x, y, s = 1, f, lines = [], rot = 0, flip = 0, blank = false, glowWarm = 0, textSize = 30, ink = INK, seed = 0}) => {
  const R = 260;
  const hex = Array.from({length: 6}, (_, i) => [R * Math.cos((i * Math.PI) / 3 - Math.PI / 2), R * Math.sin((i * Math.PI) / 3 - Math.PI / 2)] as [number, number]);
  const tri = [0, 2, 4].map((i) => [hex[i][0] * 0.74, hex[i][1] * 0.74] as [number, number]);
  const sc = Math.abs(Math.cos(flip * Math.PI));
  const shade = ['#8FB6C6', '#6D98AB', '#4F7C90', '#5E8DA1', '#7FA9BB', '#A6C8D6'];
  const poly = (pts: [number, number][]) => pts.map((p) => p.join(',')).join(' ');
  const bob = 5 * Math.sin(f / 21 + seed);
  const showBack = flip > 0.5;
  return (
    <g transform={`translate(${x},${y + bob}) rotate(${rot}) scale(${s * Math.max(0.04, sc)},${s})`}>
      {/* six edge facets */}
      {hex.map((p, i) => {
        const q = hex[(i + 1) % 6];
        const tv = tri[i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : 2];
        const tw = tri[(i + 1) % 2 === 0 ? 1 : 2];
        const inner = i % 2 === 0 ? tri[(i / 2) % 3] : tri[((i - 1) / 2 + 1) % 3];
        void tv; void tw;
        return <polygon key={i} points={poly([p, q, inner])} fill={shade[i]} stroke={INK} strokeWidth={6} strokeLinejoin="round" />;
      })}
      {/* the front face */}
      <polygon points={poly(tri)} fill={blank ? '#CFE3EA' : '#E8F2F5'} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <polygon points={poly(tri)} fill={FT.warm} opacity={0.55 * glowWarm} />
      {/* the face text, FITTED INSIDE the front facet (2026-10-07 round 1: S7/S11 face text overhung the triangle and read
          rotated after a 120 degree tumble). The facet is the triangle (0,-192) (166,96) (-166,96), half width at y is
          166*(y+192)/288. Lines sit low in the facet, where it is widest, and one size shrinks until every line's cap top fits
          with 14% margin. The text counter-rotates by the nearest multiple of 120 degrees, which maps the facet onto itself,
          so a die that lands at rot 120 reads UPRIGHT and the text never leaves its facet mid-tumble. */}
      {!blank && lines.length > 0 && (() => {
        const n = lines.length;
        const hw = (y: number) => Math.max(0, (166 * (y + 192)) / 288);
        const fits = (sz: number) => lines.every((l, i) => {
          const base = 84 - (n - 1 - i) * (sz + 8);
          return l.length * sz * 0.602 + 0.5 * (l.length - 1) <= 2 * hw(base - sz * 0.74) * 0.86;
        });
        let ts = textSize;
        while (ts > 12 && !fits(ts)) ts -= 1;
        const up = -120 * Math.round(rot / 120);
        return (
          <g transform={`rotate(${up})`} opacity={showBack ? 0 : 1}>
            {lines.map((l, i) => (
              <text key={i} x={0} y={84 - (n - 1 - i) * (ts + 8)} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={800}
                fontSize={ts} letterSpacing={0.5} fill={ink}>{l}</text>
            ))}
          </g>
        );
      })()}
      {/* a rim facet highlight */}
      <polyline points={poly([hex[5], hex[0], hex[1]])} fill="none" stroke={FT.bone} strokeWidth={5} opacity={0.55} strokeLinejoin="round" />
    </g>
  );
};

// ------------------------------------------------------------------ THE WORLD INSIDE THE WINDOW
/** The cyan liquid world, full frame. Round 1 (2026-10-07) read S3, S7 and S11 as "one repeated blue slab", so each window shot
 *  now gets its own WATER: `variant` sets the tint, the angle and count of the caustic light shafts, the floor and what drifts.
 *    shallow (S3)  bright, shafts slanting in from top left, a rippled silt floor under a crawling caustic net
 *    river   (S7)  teal, shafts from top right, a floor of rounded river stones, a sideways current carrying silt
 *    deep    (S11) dark, ONE vertical cone from above (the cool spot), a black silt floor, slow motes
 *  Bubbles come in three depths: far (small, faint, slow), mid, and near (large, soft-blurred, fast, with a highlight). */
type DieVariant = 'shallow' | 'river' | 'deep';
const DIE_LOOK: Record<DieVariant, {top: string; mid: string; bot: string; shaftFrom: number; slant: number; shafts: number; floorY: number; floor: string; floorHi: string}> = {
  shallow: {top: '#C9E8F1', mid: '#86BCD0', bot: '#2D5567', shaftFrom: 120, slant: 0.32, shafts: 5, floorY: 1560, floor: '#7FA6AE', floorHi: '#B9D7DC'},
  river: {top: '#BFE2DC', mid: '#73ADB5', bot: '#1F4A52', shaftFrom: 980, slant: -0.36, shafts: 4, floorY: 1600, floor: '#5E7F86', floorHi: '#93B3B6'},
  deep: {top: '#86B2C4', mid: '#4C7F95', bot: '#0F2230', shaftFrom: 540, slant: 0, shafts: 1, floorY: 1640, floor: '#1A2A33', floorHi: '#3C5562'},
};
export const DieWorld: React.FC<{f: number; id?: string; warm?: number; dim?: number; variant?: DieVariant}> = ({f, id = 'dw', warm = 0, dim = 0, variant = 'shallow'}) => {
  const L = DIE_LOOK[variant];
  const fy = L.floorY;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}g`} cx="50%" cy="40%" r="78%">
          <stop offset="0" stopColor={L.top} />
          <stop offset="0.5" stopColor={L.mid} />
          <stop offset="1" stopColor={L.bot} />
        </radialGradient>
        <radialGradient id={`${id}w`} cx="50%" cy="46%" r="46%">
          <stop offset="0" stopColor={FT.warm} stopOpacity={0.9} />
          <stop offset="1" stopColor={FT.warm} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={FT.cyanHi} stopOpacity={variant === 'deep' ? 0.55 : 0.5} />
          <stop offset="0.7" stopColor={FT.cyanHi} stopOpacity={0.08} />
          <stop offset="1" stopColor={FT.cyanHi} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={L.floorHi} />
          <stop offset="0.35" stopColor={L.floor} />
          <stop offset="1" stopColor={L.bot} />
        </linearGradient>
        <filter id={`${id}b`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={3.2} /></filter>
      </defs>
      <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill={`url(#${id}g)`} />
      {/* far bubbles: small, faint, slow, behind the shafts */}
      {Array.from({length: 30}, (_, i) => {
        const x = 30 + rnd(i * 13 + 5) * 1020 + 8 * Math.sin(f / (40 + i) + i);
        const y = fy - (((f * (0.35 + rnd(i * 7) * 0.5)) + i * 97) % (fy + 40));
        return <circle key={`fb${i}`} data-band="ok" cx={x} cy={y} r={1.6 + rnd(i * 3) * 3} fill={FT.cyanHi} opacity={0.3} />;
      })}
      {/* caustic light shafts from the surface, each breathing on its own period */}
      {Array.from({length: L.shafts}, (_, i) => {
        const x0 = L.shaftFrom + (variant === 'deep' ? 0 : (i - (L.shafts - 1) / 2) * 190);
        const w0 = variant === 'deep' ? 150 : 46 + rnd(i * 5 + 1) * 60;
        const w1 = variant === 'deep' ? 560 : w0 * 3.2;
        const br = 0.5 + 0.5 * Math.sin(f / (23 + i * 6) + i * 1.9);
        const len = fy + 60;
        const x1 = x0 + L.slant * len;
        const sway = 14 * Math.sin(f / (37 + i * 4) + i);
        return (
          <polygon key={`sh${i}`} data-band="ok" points={`${x0 - w0 / 2 + sway},-40 ${x0 + w0 / 2 + sway},-40 ${x1 + w1 / 2},${len} ${x1 - w1 / 2},${len}`}
            fill={`url(#${id}s)`} opacity={(variant === 'deep' ? 0.5 : 0.32) + 0.3 * br} />
        );
      })}
      {/* the caustic crawl on the water column */}
      {Array.from({length: 6}, (_, i) => {
        const y0 = 220 + i * 230;
        const ph = f / (variant === 'river' ? 22 : 36) + i * 1.7;
        return <path key={`cc${i}`} data-band="ok" d={`M-40,${y0} Q${200 + 90 * Math.sin(ph)},${y0 - 70} ${520},${y0 + 20 * Math.cos(ph)} T1120,${y0 - 30 + 40 * Math.sin(ph * 0.8)}`} fill="none" stroke={FT.cyanHi} strokeWidth={variant === 'deep' ? 10 : 20} opacity={variant === 'deep' ? 0.07 : 0.12} />;
      })}
      {/* the floor */}
      <path data-band="ok" d={`M-40,${fy + 30} Q270,${fy - 26} 540,${fy + 6} T1120,${fy - 10} L1120,1960 L-40,1960 Z`} fill={`url(#${id}f)`} />
      {variant === 'shallow' && (
        <g>
          {Array.from({length: 7}, (_, i) => (
            <path key={`rp${i}`} data-band="ok" d={`M-40,${fy + 60 + i * 46} q90,${-16 - i} 180,0 t180,0 t180,0 t180,0 t180,0 t180,0 t180,0`} fill="none" stroke={FT.cyanDk} strokeWidth={3} opacity={0.35} />
          ))}
          {/* the caustic net crawling over the silt */}
          {Array.from({length: 14}, (_, i) => {
            const cx = ((i * 97 + f * 0.9) % 1240) - 80, cy = fy + 70 + (i % 5) * 62;
            const r = 34 + 10 * Math.sin(f / 17 + i);
            return <path key={`cn${i}`} data-band="ok" d={`M${cx - r},${cy} Q${cx},${cy - r * 0.5} ${cx + r},${cy} Q${cx},${cy + r * 0.45} ${cx - r},${cy}`} fill="none" stroke={FT.cyanHi} strokeWidth={4} opacity={0.45} />;
          })}
        </g>
      )}
      {variant === 'river' && (
        <g>
          {Array.from({length: 26}, (_, i) => {
            const cx = rnd(i * 17 + 2) * 1120 - 20, cy = fy + 40 + rnd(i * 5 + 9) * 300;
            const rr = (18 + rnd(i * 3) * 30) * (0.7 + (cy - fy) / 500);
            return (
              <g key={`rs${i}`}>
                <ellipse data-band="ok" cx={cx} cy={cy} rx={rr} ry={rr * 0.62} fill={['#6F8E94', '#57767D', '#86A3A6'][i % 3]} stroke={FT.inkDeep} strokeWidth={2.5} />
                <ellipse data-band="ok" cx={cx - rr * 0.2} cy={cy - rr * 0.25} rx={rr * 0.5} ry={rr * 0.2} fill={FT.cyanHi} opacity={0.3 + 0.2 * Math.sin(f / 14 + i)} />
              </g>
            );
          })}
          {/* the current: silt streaks running right to left */}
          {Array.from({length: 18}, (_, i) => {
            const y = 160 + rnd(i * 23) * 1340;
            const x = 1160 - ((f * (5 + rnd(i) * 4) + i * 180) % 1320);
            return <line key={`cu${i}`} data-band="ok" x1={x} y1={y} x2={x + 60 + rnd(i * 2) * 70} y2={y + 4} stroke={FT.cyanHi} strokeWidth={3} strokeLinecap="round" opacity={0.35} />;
          })}
        </g>
      )}
      {variant === 'deep' && (
        <g>
          <ellipse data-band="ok" cx={540} cy={fy + 60} rx={300} ry={40} fill={FT.cyanHi} opacity={0.14} />
          {Array.from({length: 9}, (_, i) => {
            const cx = 80 + i * 118 + rnd(i) * 40, cy = fy + 70 + rnd(i * 7) * 180;
            return <polygon key={`ds${i}`} data-band="ok" points={`${cx - 22},${cy} ${cx - 8},${cy - 16} ${cx + 18},${cy - 12} ${cx + 24},${cy + 4} ${cx},${cy + 12}`} fill="#25353F" stroke={FT.inkDeep} strokeWidth={2} />;
          })}
          {Array.from({length: 24}, (_, i) => {
            const x = 60 + rnd(i * 29 + 4) * 960 + 30 * Math.sin(f / (60 + i * 3) + i);
            const y = 200 + ((rnd(i * 31) * 1300 + f * (0.25 + rnd(i) * 0.3)) % 1400);
            return <circle key={`mo${i}`} data-band="ok" cx={x} cy={y} r={2 + rnd(i * 5) * 2.5} fill={FT.cyanHi} opacity={0.35} />;
          })}
        </g>
      )}
      {/* mid bubbles */}
      {Array.from({length: variant === 'deep' ? 12 : 22}, (_, i) => {
        const h = rnd(i * 11 + 3);
        const x = 40 + h * 1000 + 16 * Math.sin(f / (30 + i) + i);
        const y = 2040 - (((f * (0.9 + rnd(i * 5) * 2.2) * 1.4) + i * 140) % 2200);
        return <circle key={`mb${i}`} data-band="ok" cx={x} cy={y} r={5 + rnd(i * 3 + 1) * 11} fill={FT.cyanHi} stroke={FT.bone} strokeWidth={2} opacity={0.5} />;
      })}
      {/* near bubbles: big, soft, fast, nearest the glass */}
      {Array.from({length: variant === 'deep' ? 3 : 6}, (_, i) => {
        const x = (variant === 'river' ? 900 : 120) + (variant === 'river' ? -1 : 1) * rnd(i * 41 + 7) * 380 + 30 * Math.sin(f / 19 + i);
        const y = 2100 - (((f * (4.5 + rnd(i * 9) * 3)) + i * 410) % 2400);
        const r = 24 + rnd(i * 13) * 22;
        return (
          <g key={`nb${i}`} filter={`url(#${id}b)`}>
            <circle data-band="ok" cx={x} cy={y} r={r} fill={FT.cyanHi} opacity={0.22} stroke={FT.bone} strokeWidth={3} />
            <circle data-band="ok" cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.22} fill={FT.bone} opacity={0.6} />
          </g>
        );
      })}
      {warm > 0.01 && <ellipse data-band="ok" cx={540} cy={900} rx={560} ry={520} fill={`url(#${id}w)`} opacity={warm * 0.7} />}
      {dim > 0.01 && <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill={FT.inkDeep} opacity={dim} />}
    </g>
  );
};

// ------------------------------------------------------------------ PEBBLES, faceted and angular
export const Pebble: React.FC<{x: number; y: number; r?: number; seed?: number; color?: string; rot?: number; lit?: number; shadow?: boolean}> = ({x, y, r = 18, seed = 0, color = FT.ochre, rot = 0, lit = 0, shadow = true}) => {
  const n = 6 + (hash(seed) % 2);
  const pts = Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2 + rnd(seed + i) * 0.5;
    const rr = r * (0.72 + rnd(seed * 3 + i) * 0.4);
    return [Math.cos(a) * rr, Math.sin(a) * rr * 0.82] as [number, number];
  });
  const top = pts.filter((p) => p[1] <= 0.02 * r);
  const d = pts.map((p) => p.join(',')).join(' ');
  const t = tones(color);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      {shadow && <ellipse cx={r * 0.18} cy={r * 0.6} rx={r * 1.05} ry={r * 0.3} fill={FT.inkDeep} opacity={0.3} />}
      <polygon points={d} fill={t.base} stroke={INK} strokeWidth={Math.max(2, r * 0.13)} strokeLinejoin="round" />
      {top.length > 2 && <polygon points={top.map((p) => p.join(',')).join(' ')} fill={t.key} opacity={0.75} />}
      <polygon points={[pts[0], pts[1], [0, 0]].map((p) => p.join(',')).join(' ')} fill={t.shade} opacity={0.35} />
      {lit > 0 && <polygon points={d} fill={FT.bone} opacity={lit * 0.35} />}
    </g>
  );
};

/** A row of pebbles on a line. `n` pebbles from (x,y) running right with step `gap`. `from` skips the first pebbles, `drop`
 *  lets the LAST `fall` pebbles roll off the end (rolling right and down) by progress `p`. */
export const PebbleRow: React.FC<{
  x: number; y: number; n: number; gap?: number; r?: number; color?: string; seed?: number; f?: number; stacks?: number; fall?: number; p?: number; lit?: number;
  dropY?: number; dropX?: number;
}> = ({x, y, n, gap = 34, r = 16, color = FT.ochre, seed = 0, f = 0, stacks = 2, fall = 0, p = 0, lit = 0, dropY = 380, dropX = 160}) => {
  const items = [];
  const total = n * stacks;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < stacks; j++) {
      const k = i * stacks + j;
      const falling = k >= total - fall;
      const kk = k - (total - fall);
      const delay = falling ? clamp01((p * 1.4 - (kk / Math.max(1, fall)) * 0.4)) : 0;
      const px = x + i * gap + (rnd(seed + k) - 0.5) * 8 + delay * (dropX + rnd(k) * 120);
      const py = y - j * (r * 1.4) + (rnd(seed + k + 40) - 0.5) * 5 + delay * delay * dropY - (falling ? Math.sin(delay * Math.PI) * 60 : 0);
      items.push(<Pebble key={k} x={px} y={py + 2 * Math.sin(f / 30 + k)} r={r * (0.92 + rnd(seed + k + 9) * 0.2)} seed={seed * 17 + k} color={color} rot={rnd(k) * 60 + delay * 300} lit={lit} shadow={!falling || delay < 0.05} />);
    }
  }
  return <g>{items}</g>;
};

// ------------------------------------------------------------------ SURVEY STAKES AND FLAGS
export const KraftTag: React.FC<{x: number; y: number; w: number; text: string[]; size?: number; swing?: number; rot?: number; p?: number}> = ({x, y, w, text, size = 18, swing = 0, rot = 0, p = 1}) => {
  const h = text.length * (size + 6) + 18;
  const k = clamp01(p);
  if (k <= 0.01) return null;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot + swing}) scale(${0.7 + 0.3 * k})`} opacity={Math.min(1, k * 2)}>
      <line x1={0} y1={-30} x2={0} y2={0} stroke={FT.kraftDk} strokeWidth={3} />
      <rect x={-w / 2 + 5} y={5} width={w} height={h} rx={4} fill={FT.inkDeep} opacity={0.25} />
      <path d={`M${-w / 2},4 h${w} v${h} h${-w} Z`} fill={FT.kraft} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <circle cx={0} cy={14} r={4.5} fill={FT.inkDeep} />
      {text.map((l, i) => (
        <text key={i} x={0} y={22 + (size + 6) * (i + 0.9)} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={800} fontSize={size} letterSpacing={0.4} fill={INK}>{l}</text>
      ))}
    </g>
  );
};

/** A survey stake with an angular cut tip and a cloth flag. Origin is the ground point. `p` 0..1 plants it (drops from above and
 *  lands), `cloth` is the flag colour, `h` the stake height. The flag flutters on an irrational period, `unfurl` 0..1 opens it. */
export const StakeFlag: React.FC<{
  x: number; y: number; s?: number; f: number; cloth?: string; clothDk?: string; h?: number; p?: number; unfurl?: number; phase?: number; label?: string[]; labelSize?: number; glow?: number; bare?: boolean; lean?: number;
}> = ({x, y, s = 1, f, cloth = FT.ochre, clothDk = FT.ochreDk, h = 330, p = 1, unfurl = 1, phase = 0, label, labelSize = 20, glow = 0, bare = false, lean = 0}) => {
  const k = clamp01(p);
  if (k <= 0.005) return null;
  const drop = (1 - k) * -520;
  const settle = k >= 1 ? 0 : 0;
  void settle;
  const fl = Math.sin(f / (9 + phase * 1.7) + phase) * 7 * unfurl;
  const fl2 = Math.sin(f / (13 + phase) + phase * 2) * 5 * unfurl;
  const fw = (bare ? 0 : 190) * clamp01(unfurl), fh = 108;
  const top = -h;
  return (
    <g transform={`translate(${x},${y + drop}) rotate(${lean}) scale(${s})`}>
      <ContactShadow cx={4} cy={4} rx={46} ry={11} opacity={0.4} blur={7} />
      {/* the stake: a rectangular post with an angular cut tip */}
      <polygon points={`-11,0 11,0 11,${top + 40} 0,${top} -11,${top + 52}`} fill={FT.bone} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <polygon points={`-11,0 -3,0 -3,${top + 46} -11,${top + 52}`} fill={FT.boneDk} opacity={0.7} />
      <rect x={-11} y={-4} width={22} height={10} fill={FT.boneDk} stroke={INK} strokeWidth={3} />
      {glow > 0 && <circle cx={0} cy={top + 60} r={150} fill={FT.warm} opacity={0.26 * glow} style={{mixBlendMode: 'screen'}} />}
      {fw > 2 && (
        <g transform={`translate(11,${top + 18})`}>
          <path d={`M0,0 C${fw * 0.3},${-10 + fl} ${fw * 0.62},${10 - fl2} ${fw},${fl2 * 0.8} L${fw - 6 + fl * 0.4},${fh * 0.5 + fl2} L${fw},${fh + fl} C${fw * 0.62},${fh + 12 + fl2} ${fw * 0.3},${fh - 8 - fl} 0,${fh} Z`}
            fill={cloth} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d={`M0,${fh * 0.5} C${fw * 0.3},${fh * 0.5 - 10 + fl} ${fw * 0.62},${fh * 0.5 + 6 - fl2} ${fw},${fh * 0.5 + fl2}`} fill="none" stroke={clothDk} strokeWidth={4} opacity={0.5} />
          {label && label.map((l, i) => (
            <text key={i} x={fw * 0.5} y={fh * 0.5 + 6 + (i - (label.length - 1) / 2) * (labelSize + 4)} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={800} fontSize={labelSize} fill={INK}>{l}</text>
          ))}
        </g>
      )}
    </g>
  );
};

// ------------------------------------------------------------------ REPORT, BOULDER, BUCKET, STAMP
/** The report booklet seen from above: a creased bone cover with an ochre band. Origin is its centre. */
export const ReportBooklet: React.FC<{x: number; y: number; s?: number; rot?: number; f: number; open?: number; lines?: string[]; lift?: number}> = ({x, y, s = 1, rot = 0, f, open = 0, lines = [], lift = 0}) => {
  const w = 440, h = 560;
  const curl = 5 * Math.sin(f / 16) * (0.4 + lift);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-w / 2 + 14} y={-h / 2 + 18} width={w} height={h} fill={FT.inkDeep} opacity={0.3} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={FT.bone} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <rect x={-w / 2} y={-h / 2} width={22} height={h} fill={FT.boneDk} stroke={INK} strokeWidth={4} />
      <rect x={-w / 2 + 22} y={-h / 2 + 60} width={w - 22} height={86} fill={FT.ochre} stroke={INK} strokeWidth={4} />
      {/* creases */}
      <path d={`M${-w / 2 + 40},${h * 0.12} L${w / 2 - 20},${h * 0.1 + curl}`} stroke={FT.boneDk} strokeWidth={3} opacity={0.8} />
      <path d={`M${w * 0.1},${-h / 2 + 8} L${w * 0.14},${h / 2 - 12}`} stroke={FT.boneDk} strokeWidth={3} opacity={0.6} />
      <path d={`M${w / 2 - 40},${h / 2} l${34},${-curl * 2 - 24} l-6,${curl * 2 + 24} Z`} fill={FT.boneDk} stroke={INK} strokeWidth={3} />
      {lines.map((l, i) => (
        <text key={i} x={22} y={-h / 2 + 108 + i * 38} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={800} fontSize={25} fill={INK}>{l}</text>
      ))}
      {open > 0 && <rect x={-w / 2 - open * 20} y={-h / 2} width={w} height={h} fill={FT.bone} stroke={INK} strokeWidth={4} opacity={0} />}
    </g>
  );
};

export const Boulder: React.FC<{x: number; y: number; s?: number; seed?: number}> = ({x, y, s = 1, seed = 4}) => {
  const pts = Array.from({length: 9}, (_, i) => {
    const a = (i / 9) * Math.PI * 2;
    const r = 120 * (0.78 + rnd(seed + i) * 0.34);
    return [Math.cos(a) * r, Math.sin(a) * r * 0.78] as [number, number];
  });
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ContactShadow cx={14} cy={86} rx={140} ry={24} opacity={0.5} blur={12} />
      <polygon points={pts.map((p) => p.join(',')).join(' ')} fill={FT.gravelDk} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <polygon points={[pts[7], pts[8], pts[0], pts[1], [0, 0]].map((p) => p.join(',')).join(' ')} fill={FT.gravel} />
      <polygon points={[pts[3], pts[4], pts[5], [0, 20]].map((p) => p.join(',')).join(' ')} fill={FT.tundraDk} opacity={0.5} />
      <polyline points={[pts[6], [0, 6], pts[2]].map((p) => p.join(',')).join(' ')} fill="none" stroke={INK} strokeWidth={4} opacity={0.5} />
      <polyline points={[pts[7], pts[8], pts[0]].map((p) => p.join(',')).join(' ')} fill="none" stroke={FT.rim} strokeWidth={5} opacity={0.5} />
    </g>
  );
};

export const Bucket: React.FC<{x: number; y: number; s?: number; rock?: number; label?: string[]; labelSize?: number}> = ({x, y, s = 1, rock = 0, label = [], labelSize = 22}) => (
  <g transform={`translate(${x},${y}) rotate(${rock}) scale(${s})`}>
    <ContactShadow cx={10} cy={4} rx={120} ry={16} opacity={0.5} blur={9} />
    <path d="M-100,-210 L-84,0 L84,0 L100,-210 Z" fill={FT.slateDk} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M-100,-210 L-92,-90 L-60,-80 L-66,-210 Z" fill={FT.slate} opacity={0.6} />
    <ellipse cx={0} cy={-210} rx={100} ry={22} fill={FT.inkDeep} stroke={INK} strokeWidth={6} />
    <path d="M-100,-210 Q0,-300 100,-210" fill="none" stroke={FT.tapeDk} strokeWidth={6} />
    <rect x={-86} y={-140} width={172} height={label.length * (labelSize + 6) + 16} rx={4} fill={FT.bone} stroke={INK} strokeWidth={4} />
    {label.map((l, i) => <text key={i} x={0} y={-140 + 12 + (labelSize + 6) * (i + 0.85)} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={800} fontSize={labelSize} fill={INK}>{l}</text>)}
  </g>
);

/** A round stamp (an ink-on-bone circle). The film's +2.6% stamp, which the window iris matches. */
export const RoundStamp: React.FC<{x: number; y: number; r?: number; text: string; p?: number; rot?: number; size?: number}> = ({x, y, r = 130, text, p = 1, rot = -8, size = 56}) => {
  const k = clamp01(p);
  if (k <= 0.01) return null;
  const sc = 1.5 - 0.5 * (1 - Math.pow(1 - k, 3)) + (k >= 1 ? 0 : 0);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${sc})`} opacity={Math.min(1, k * 2.2)}>
      <circle r={r + 8} fill={FT.inkDeep} opacity={0.25} transform="translate(8,10)" />
      <circle r={r} fill={FT.bone} stroke={INK} strokeWidth={9} />
      <circle r={r - 18} fill="none" stroke={INK} strokeWidth={3.5} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={800} fontSize={size} fill={INK}>{text}</text>
    </g>
  );
};

export {clamp01, hash, rnd, lerp, FormGradient};
