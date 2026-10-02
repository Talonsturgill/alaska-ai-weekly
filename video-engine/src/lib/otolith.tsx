import React from 'react';
import {INK, tones, paleTones, FormGradient, ContactShadow, RimLight} from './lighting';

// THE OTOLITH FAMILY (net-new 2026-10-02, "Who Counted").
// A fish ear stone, the instruments that read it (a brass tally counter for the human reader, a
// near-infrared spectrometer for the machine), the microscope objective, the archive drawer wall
// and a paper age tag. Built to the bench.tsx brass bar: tones() ramps, ink outlines, contact
// shadows, rivets and screws. Everything is parameterized so the next fisheries or lab story can
// cast it without touching the drawing code.
//
// Palette roles are fixed here as defaults and every one is overridable by prop.

export const PEARL = '#EDE3CC';
export const BRASS = '#C8963E';
export const NIR = '#E0336B';
export const LAMP = '#FFD58A';
export const ENAMEL = '#1F4A55';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => {
  const k = clamp01(t);
  return k * k * (3 - 2 * k);
};
const uid = (s: string) => 'ot' + Math.abs([...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)).toString(36);
const hash = (i: number) => Math.imul(i + 911, 2654435761) >>> 0;

// ---------------------------------------------------------------------------------------------
// OTOLITH GEOMETRY. A sagittal otolith in side view: an elongated, slightly asymmetric oval with a
// pointed rostrum at the front, a rounded posterior, a scalloped (crenulated) dorsal edge and the
// sulcus groove along the face. Rings are the SAME outline scaled about an off-centre core, which
// is how growth bands actually sit (the core is nearer the rostrum and the ventral edge).
// ---------------------------------------------------------------------------------------------
const CORE = {x: 18, y: 10};

/** One point of the outline at scale k and polar angle a (radians), in stone-local coordinates.
 *  The single source of the stone's geometry: otolithPath samples it, and a scene that needs to
 *  land something exactly on a growth band (the finale's ticks) asks it for the band's points. */
export function otolithPoint(k: number, a: number, crenul = 1, seed = 3): [number, number] {
  const ca = Math.cos(a), sa = Math.sin(a);
  // base ellipse 160 x 96 half-axes, rostrum pull toward +x, flatter ventral side
  const rx = 160 + (ca > 0 ? 36 * Math.pow(ca, 6) : 0);
  const ry = sa < 0 ? 98 : 84;
  // dorsal scallops (lobes), stronger on the outer bands
  const lobe = sa < -0.15 ? 7 * crenul * Math.pow(Math.abs(Math.sin(a * 9 + seed)), 2.2) : 0;
  const vent = sa > 0.2 ? 3 * crenul * Math.sin(a * 13 + seed) : 0;
  const r = 1 + (lobe + vent) / 100;
  return [CORE.x + ca * rx * k * r - CORE.x * k, CORE.y + sa * ry * k * r - CORE.y * k];
}

/** The band scales an Otolith with `rings` rings draws, outermost first, and each band's scallop. */
export const ringScales = (rings: number) => Array.from({length: rings}, (_, i) => 1 - (i + 1) / (rings + 1.4));
export const bandCrenul = (k: number) => 0.4 + 0.6 * (1 - k);

/** Outline sampled in polar form around CORE, scale k (1 = full stone). */
export function otolithPath(k = 1, crenul = 1, seed = 3): string {
  const n = 72;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const [x, y] = otolithPoint(k, (i / n) * Math.PI * 2, crenul, seed);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}

export interface OtolithProps {
  x: number; y: number; scale?: number; f: number;
  /** how many annual rings the stone carries (drawn as alternating opaque and translucent bands) */
  rings?: number;
  /** 0..1, how far the "count" has travelled core-outward. Each ring lights as it is reached. */
  counted?: number;
  /** 0..1, a ripple pulse travelling outward (drive it from the click). */
  pulse?: number;
  /** pearl = under the lamp, xray = glowing inside a fish, nir = the machine's light passing through */
  mode?: 'pearl' | 'xray' | 'nir';
  rot?: number;
  shadow?: boolean;
  /** optional paper age tag on a string, written in the reader's hand */
  tag?: string;
  tagSwing?: number;
}

export const Otolith: React.FC<OtolithProps> = ({
  x, y, scale = 1, f, rings = 14, counted = 1, pulse = 0, mode = 'pearl', rot = 0, shadow = true, tag, tagSwing = 0,
}) => {
  const id = uid(`oto${x}${y}${scale}${mode}${rings}`);
  const base = mode === 'xray' ? '#CFE9F2' : PEARL;
  const t = paleTones(base);
  const outer = otolithPath(1, 1);
  const breathe = 1 + 0.006 * Math.sin(f / 23);
  const glow = mode === 'xray' ? 0.85 : mode === 'nir' ? 0.6 : 0.25;
  // ring list from the outside in, so inner bands paint over outer ones
  const bands = ringScales(rings).map((k, i) => {
    const at = 1 - k; // how far out this band is (0 core .. 1 edge)
    return {i, k, at};
  });
  const pk = clamp01(pulse);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${scale * breathe})`}>
      <defs>
        <FormGradient id={`${id}g`} t={t} softness={0.9} />
        <radialGradient id={`${id}glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={mode === 'nir' ? NIR : mode === 'xray' ? '#BFF4FF' : LAMP} stopOpacity={glow} />
          <stop offset="1" stopColor={mode === 'nir' ? NIR : LAMP} stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${id}c`}><path d={outer} /></clipPath>
      </defs>
      {shadow && mode === 'pearl' && <ContactShadow cx={8} cy={104} rx={170} ry={22} opacity={0.42} blur={9} />}
      <ellipse cx={0} cy={0} rx={300} ry={200} fill={`url(#${id}glow)`} />
      {/* body */}
      <path d={outer} fill={`url(#${id}g)`} />
      <g clipPath={`url(#${id}c)`}>
        {/* growth bands: alternating opaque (summer) and translucent (winter) */}
        {bands.map(({i, k, at}) => {
          const lit = counted >= at - 0.02;
          const winter = i % 2 === 0;
          return (
            <path key={i} d={otolithPath(k, bandCrenul(k))}
              fill={winter ? (mode === 'nir' ? '#B8566F' : t.core) : 'none'}
              fillOpacity={winter ? (lit ? 0.42 : 0.16) : 0}
              stroke={lit ? (mode === 'nir' ? '#FF9DB8' : '#8C7A5C') : t.core}
              strokeWidth={lit ? 2.6 : 1.6} strokeOpacity={lit ? 0.85 : 0.4} />
          );
        })}
        {/* the core (nucleus) */}
        <ellipse cx={0} cy={0} rx={13} ry={9} fill={mode === 'nir' ? NIR : '#8C7A5C'} opacity={0.75} />
        <ellipse cx={-3} cy={-3} rx={4} ry={3} fill="#FFFFFF" opacity={0.7} />
        {/* the travelling ripple: one bright band riding outward */}
        {pk > 0 && pk < 1 && (
          <path d={otolithPath(Math.max(0.05, pk), 0.6)} fill="none"
            stroke={mode === 'nir' ? '#FFC2D4' : LAMP} strokeWidth={7 * (1 - pk) + 2} opacity={0.9 * (1 - pk * 0.6)}
            style={{mixBlendMode: 'screen'} as any} />
        )}
        {/* the sulcus groove along the face */}
        <path d="M-120,4 C-60,-14 40,-14 150,10" fill="none" stroke={t.shade} strokeWidth={9} opacity={0.32} strokeLinecap="round" />
        <path d="M-118,0 C-60,-18 40,-18 148,6" fill="none" stroke="#FFFFFF" strokeWidth={2.5} opacity={0.35} strokeLinecap="round" />
        {/* nacre sheen */}
        <ellipse cx={-50} cy={-46} rx={70} ry={20} fill="#FFFFFF" opacity={mode === 'pearl' ? 0.28 : 0.18} transform="rotate(-12)" />
      </g>
      <path d={outer} fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <RimLight d={otolithPath(1, 1).split(' L').slice(30, 52).join(' L').replace(/^M?/, 'M')} w={4} color={mode === 'nir' ? '#FF9DB8' : LAMP} opacity={0.55} />
      {tag && (
        <AgeTag x={150} y={-30} text={tag} swing={tagSwing} f={f} />
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------
// AGE TAG: a small manila tag on a string, the number written by hand. Anchored at its string
// knot (x, y) so it can hang from anything.
// ---------------------------------------------------------------------------------------------
export const AgeTag: React.FC<{x: number; y: number; text: string; swing?: number; f: number; scale?: number; flip?: number}> = ({
  x, y, text, swing = 0, f, scale = 1, flip = 0,
}) => {
  const a = swing + 4 * Math.sin(f / 19);
  const t = tones('#E3C98F');
  const id = uid(`tag${x}${y}${text}`);
  // flip 0..1 rotates the card about its vertical axis (a departure-board turn)
  const sx = Math.cos(flip * Math.PI);
  return (
    <g transform={`translate(${x},${y}) scale(${scale}) rotate(${a})`}>
      <defs><FormGradient id={id} t={t} softness={0.8} /></defs>
      <path d="M0,0 C10,20 18,40 30,58" fill="none" stroke="#6B5A3C" strokeWidth={3} />
      <g transform={`translate(30,58) rotate(-14) scale(${sx},1)`}>
        <path d="M-6,-18 L96,-18 L96,26 L-6,26 L-24,4 Z" fill={`url(#${id})`} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <circle cx={-10} cy={4} r={5} fill="none" stroke={INK} strokeWidth={3} />
        {Math.abs(sx) > 0.15 && (
          <text x={44} y={14} textAnchor="middle" fontFamily="'Caveat', 'Comic Sans MS', cursive" fontWeight={700}
            fontSize={34} fill="#1E2A6B" transform={`scale(${sx < 0 ? -1 : 1},1)`}>{text}</text>
        )}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------------------------
// TALLY COUNTER: the human reader's brass hand clicker. Four rolling digits behind a window, a
// plunger on top, a finger ring below. `count` may be fractional: the units wheel rolls between
// integers, and every wheel above it carries when the one below passes 9.
// Anchor (x, y) is the centre of the body.
// ---------------------------------------------------------------------------------------------
export const TallyCounter: React.FC<{
  x: number; y: number; scale?: number; count: number; press?: number; steam?: number; f?: number; worn?: number; plate?: string;
}> = ({x, y, scale = 1, count, press = 0, steam = 0, f = 0, worn = 0, plate}) => {
  const id = uid(`tc${x}${y}${scale}`);
  const b = tones(BRASS);
  const c = Math.max(0, count);
  const digits = [1000, 100, 10, 1].map((p) => {
    const whole = Math.floor(c / p) % 10;
    // a wheel only moves while every wheel below it is rolling over 9 -> 0
    const below = c % p;
    const roll = p === 1 ? c - Math.floor(c) : below > p - 1 ? below - (p - 1) : 0;
    return {whole, roll};
  });
  const pr = clamp01(press);
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <defs>
        <FormGradient id={`${id}b`} t={b} softness={0.9} />
        <radialGradient id={`${id}face`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={b.key} /><stop offset="0.6" stopColor={b.base} /><stop offset="1" stopColor={b.shade} />
        </radialGradient>
        <clipPath id={`${id}w`}><rect x={-78} y={-24} width={156} height={48} rx={6} /></clipPath>
      </defs>
      {/* plunger */}
      <g transform={`translate(0,${-118 + 18 * pr})`}>
        <rect x={-16} y={0} width={32} height={40} rx={4} fill={b.core} stroke={INK} strokeWidth={4} />
        <rect x={-30} y={-14} width={60} height={20} rx={8} fill={`url(#${id}b)`} stroke={INK} strokeWidth={4.5} />
        <rect x={-24} y={-11} width={34} height={5} rx={2.5} fill="#FFF3D0" opacity={0.6} />
      </g>
      {/* finger ring */}
      <path d="M-34,96 C-46,150 46,150 34,96" fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" />
      <path d="M-34,96 C-46,150 46,150 34,96" fill="none" stroke={b.base} strokeWidth={12} strokeLinecap="round" />
      <path d="M-30,104 C-38,136 0,146 18,136" fill="none" stroke={b.key} strokeWidth={3} opacity={0.6} strokeLinecap="round" />
      {/* body */}
      <circle cx={0} cy={0} r={112} fill={`url(#${id}face)`} stroke={INK} strokeWidth={7} />
      <circle cx={0} cy={0} r={96} fill="none" stroke={b.shade} strokeWidth={4} opacity={0.7} />
      {Array.from({length: 4}, (_, i) => {
        const a = (i / 4) * Math.PI * 2 + 0.6;
        return <g key={i}>
          <circle cx={Math.cos(a) * 82} cy={Math.sin(a) * 82} r={7} fill={b.core} stroke={INK} strokeWidth={2.5} />
          <path d={`M${Math.cos(a) * 82 - 4},${Math.sin(a) * 82} h8`} stroke={INK} strokeWidth={2} />
        </g>;
      })}
      {/* wear: the thumb polishes the top */}
      <ellipse cx={-10} cy={-74} rx={48 + 20 * worn} ry={12} fill="#FFF6DA" opacity={0.25 + 0.35 * worn} />
      {/* digit window */}
      <rect x={-86} y={-32} width={172} height={64} rx={9} fill="#0E1418" stroke={INK} strokeWidth={5} />
      <g clipPath={`url(#${id}w)`}>
        {digits.map((d, i) => {
          const cx = -58 + i * 39;
          return (
            <g key={i} transform={`translate(${cx},${-d.roll * 48})`}>
              {[0, 1].map((k) => (
                <g key={k} transform={`translate(0,${k * 48})`}>
                  <rect x={-17} y={-22} width={34} height={44} rx={3} fill="#F2EBDA" />
                  <text x={0} y={14} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={800}
                    fontSize={36} fill={INK}>{(d.whole + k) % 10}</text>
                </g>
              ))}
            </g>
          );
        })}
        <rect x={-78} y={-24} width={156} height={12} fill="#000" opacity={0.35} />
        <rect x={-78} y={12} width={156} height={12} fill="#000" opacity={0.35} />
      </g>
      <rect x={-86} y={-32} width={172} height={10} rx={5} fill="#FFFFFF" opacity={0.12} />
      {plate && (
        <g transform="translate(0,62)">
          <rect x={-Math.max(70, plate.length * 15 * 0.602 / 2 + 14)} y={-13} width={Math.max(140, plate.length * 15 * 0.602 + 28)} height={26} rx={5} fill={b.core} stroke={INK} strokeWidth={3} />
          <text x={0} y={7} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={800} fontSize={15} fill={INK}>{plate}</text>
        </g>
      )}
      {/* steam (the 30,000 a year pace) */}
      {steam > 0.02 && Array.from({length: 5}, (_, i) => {
        const ph = ((f * 0.9 + i * 17) % 60) / 60;
        return <path key={i} d={`M${-50 + i * 25},${-112 - ph * 90} q10,-14 0,-28 q-10,-14 0,-28`} fill="none"
          stroke="#E8EEF0" strokeWidth={6} strokeLinecap="round" opacity={steam * 0.55 * (1 - ph)} />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------
// SPECTRAL SIGNATURE: a deterministic jagged near-infrared spectrum (absorbance against
// wavelength), as a list of points across width w. `seed` changes the stone. `ticks` converts the
// same line into a column of short tally ticks, which is the film's turn: the curve is built out
// of counts.
// ---------------------------------------------------------------------------------------------
export function spectrumPoints(w: number, h: number, seed = 1, n = 64): Array<[number, number]> {
  return Array.from({length: n}, (_, i) => {
    const u = i / (n - 1);
    const v = 0.5 + 0.28 * Math.sin(u * 7 + seed) + 0.14 * Math.sin(u * 23 + seed * 2.1)
      + 0.08 * Math.sin(u * 51 + seed * 3.7) - 0.2 * Math.exp(-Math.pow((u - 0.62) / 0.05, 2));
    return [u * w, (1 - v) * h];
  });
}

export const SpectralLine: React.FC<{
  x: number; y: number; w: number; h: number; seed?: number; progress?: number; color?: string;
  /** 0..1 dissolve the polyline into vertical tally ticks standing on the same points */
  ticks?: number; width?: number;
}> = ({x, y, w, h, seed = 1, progress = 1, color = NIR, ticks = 0, width = 6}) => {
  const pts = spectrumPoints(w, h, seed);
  const n = Math.max(2, Math.round(pts.length * clamp01(progress)));
  const shown = pts.slice(0, n);
  const d = 'M' + shown.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' L');
  const tk = smooth(ticks);
  return (
    <g transform={`translate(${x},${y})`}>
      {tk < 0.99 && (
        <g opacity={1 - tk}>
          <path d={d} fill="none" stroke={INK} strokeWidth={width + 6} strokeLinejoin="round" strokeLinecap="round" opacity={0.6} />
          <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round" strokeLinecap="round" />
          <path d={d} fill="none" stroke="#FFD3E0" strokeWidth={width * 0.3} strokeLinejoin="round" opacity={0.8} />
        </g>
      )}
      {tk > 0.01 && shown.map(([a, b], i) => (
        // groups of five, the fifth struck across the four, like a reader's tally
        i % 5 === 4
          ? <path key={i} d={`M${a - 34},${b + 12} L${a + 4},${b - 12}`} stroke={LAMP} strokeWidth={5} strokeLinecap="round" opacity={tk} />
          : <path key={i} d={`M${a},${b - 16 * tk} L${a},${b + 16 * tk}`} stroke={i % 2 ? '#FFE7B0' : LAMP} strokeWidth={5} strokeLinecap="round" opacity={tk} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------
// NIR READER: the near-infrared spectrometer, rectilinear brass and enamel on two rails. A sample
// port on the left takes an otolith, a magenta beam crosses it, a small screen draws the spectrum,
// and a brass name plate on the front can wear a draped cloth (cloth 1 = covered, 0 = pulled off).
// The AGE OUT slot on the right holds whatever the scene passes as `slot`.
// Anchor (x, y) is the centre of the base line (where the feet touch the rails).
// ---------------------------------------------------------------------------------------------
export const NIRReader: React.FC<{
  x: number; y: number; scale?: number; f: number; beam?: number; spectrum?: number; seed?: number;
  plate?: string; cloth?: number; slot?: React.ReactNode; rails?: boolean; trophy?: number; screenTicks?: number;
  /** size of the engineers' trophy relative to the machine (a credit can be drawn large) */
  trophyScale?: number;
}> = ({x, y, scale = 1, f, beam = 0, spectrum = 0, seed = 2, plate = '', cloth = 1, slot, rails = true, trophy = 0, screenTicks = 0, trophyScale = 1}) => {
  const id = uid(`nir${x}${y}${scale}`);
  const b = tones(BRASS);
  const e = tones(ENAMEL);
  const cl = clamp01(cloth);
  const hum = 0.5 + 0.5 * Math.sin(f / 7);
  // plate width from the string: 20px mono at 0.602em plus 1px tracking, 24px clear each side
  const pw = Math.max(200, plate.length * 20 * 0.602 + Math.max(0, plate.length - 1) + 48);
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <defs>
        <FormGradient id={`${id}b`} t={b} softness={0.9} />
        <FormGradient id={`${id}e`} t={e} softness={0.8} />
        <clipPath id={`${id}scr`}><rect x={-150} y={-300} width={300} height={130} rx={8} /></clipPath>
      </defs>
      {rails && <g>
        <rect x={-460} y={-6} width={920} height={14} rx={5} fill={b.core} stroke={INK} strokeWidth={4} />
        <rect x={-460} y={18} width={920} height={14} rx={5} fill={b.shade} stroke={INK} strokeWidth={4} />
        {Array.from({length: 10}, (_, i) => <rect key={i} x={-440 + i * 96} y={-8} width={10} height={42} fill={INK} opacity={0.5} />)}
      </g>}
      <ContactShadow cx={0} cy={6} rx={300} ry={18} opacity={0.45} />
      {/* feet */}
      {[-230, 230].map((fx) => <rect key={fx} x={fx - 30} y={-34} width={60} height={34} rx={6} fill={b.core} stroke={INK} strokeWidth={4} />)}
      {/* body */}
      <rect x={-290} y={-360} width={580} height={330} rx={22} fill={`url(#${id}e)`} stroke={INK} strokeWidth={7} />
      <rect x={-276} y={-346} width={552} height={40} rx={14} fill={e.key} opacity={0.28} />
      {/* brass trim band and rivets */}
      <rect x={-290} y={-120} width={580} height={30} fill={`url(#${id}b)`} stroke={INK} strokeWidth={4} />
      {Array.from({length: 12}, (_, i) => <circle key={i} cx={-266 + i * 48} cy={-105} r={4.5} fill={b.key} stroke={INK} strokeWidth={2} />)}
      {/* sample port, left */}
      <g transform="translate(-200,-210)">
        <circle r={58} fill="#081014" stroke={INK} strokeWidth={6} />
        <circle r={58} fill="none" stroke={b.base} strokeWidth={10} />
        <circle r={40} fill={NIR} opacity={0.15 + 0.5 * beam * hum} />
      </g>
      {/* screen with the spectrum */}
      <rect x={-158} y={-308} width={316} height={146} rx={12} fill={b.core} stroke={INK} strokeWidth={5} />
      <rect x={-150} y={-300} width={300} height={130} rx={8} fill="#071116" />
      <g clipPath={`url(#${id}scr)`}>
        {Array.from({length: 6}, (_, i) => <path key={i} d={`M${-150 + i * 60},-300 v130`} stroke="#18343C" strokeWidth={1.5} />)}
        {Array.from({length: 4}, (_, i) => <path key={i} d={`M-150,${-300 + i * 33} h300`} stroke="#18343C" strokeWidth={1.5} />)}
        <SpectralLine x={-140} y={-290} w={280} h={110} seed={seed} progress={spectrum} width={4} ticks={screenTicks} />
      </g>
      {/* AGE OUT slot, right */}
      <g transform="translate(205,-215)">
        <rect x={-64} y={-62} width={128} height={124} rx={10} fill="#081014" stroke={INK} strokeWidth={6} />
        <rect x={-64} y={-62} width={128} height={124} rx={10} fill="none" stroke={b.base} strokeWidth={8} />
        <text x={0} y={-74} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={800} fontSize={22} fill={b.key}>AGE OUT</text>
        {slot}
      </g>
      {/* name plate, sized to its own string by arithmetic, with the cloth */}
      <g transform="translate(0,-60)">
        <rect x={-pw / 2} y={-22} width={pw} height={44} rx={7} fill={`url(#${id}b)`} stroke={INK} strokeWidth={4} />
        <text x={0} y={9} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={800} fontSize={20} fill={INK} letterSpacing={1}>{plate}</text>
        {cl > 0.01 && (
          // pulled UP and off, fading as it lifts, so it never exits past the frame edge as a stray shape
          <g transform={`translate(${-pw / 2 - 20 + 140 * (1 - cl)},${-40 - 260 * (1 - cl)}) rotate(${-18 * (1 - cl)}) scale(${(pw + 40) / 340},1)`} opacity={Math.min(1, cl * 1.6)}>
            <path d="M0,0 C80,-8 260,-8 340,0 L350,70 C300,86 260,66 220,84 C170,98 120,72 70,88 C40,96 14,80 -8,74 Z"
              fill="#7B2B3C" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <path d="M40,8 C50,40 46,60 60,82 M150,6 C160,40 150,60 166,88 M260,6 C270,36 262,56 276,76" fill="none" stroke="#4E1625" strokeWidth={5} opacity={0.6} />
            <path d="M6,6 C90,0 250,0 334,6" fill="none" stroke="#B5546A" strokeWidth={4} opacity={0.7} />
          </g>
        )}
      </g>
      {/* beam: from the port down through the stone stage */}
      {beam > 0.01 && (
        <g opacity={beam} style={{mixBlendMode: 'screen'} as any}>
          <path d="M-200,-152 L-226,40 L-174,40 Z" fill={NIR} opacity={0.35 + 0.15 * hum} />
          <path d="M-200,-152 L-200,40" stroke="#FFC2D4" strokeWidth={4} opacity={0.8} />
        </g>
      )}
      {/* engineers' trophy (a sincere concession, not a gag) */}
      {trophy > 0.01 && (
        <g transform={`translate(150,${-360 - 40 * (1 - smooth(clamp01(trophy)))}) scale(${trophyScale})`} opacity={clamp01(trophy * 2)}>
          <ContactShadow cx={0} cy={0} rx={50} ry={8} opacity={0.4} />
          <rect x={-34} y={-24} width={68} height={24} rx={4} fill={b.core} stroke={INK} strokeWidth={4} />
          <rect x={-10} y={-62} width={20} height={40} fill={b.base} stroke={INK} strokeWidth={4} />
          <path d="M-48,-136 L48,-136 C48,-86 24,-62 0,-62 C-24,-62 -48,-86 -48,-136 Z" fill={`url(#${id}b)`} stroke={INK} strokeWidth={5} />
          <path d="M-48,-126 C-78,-126 -74,-90 -40,-88 M48,-126 C78,-126 74,-90 40,-88" fill="none" stroke={INK} strokeWidth={8} />
          <path d="M-48,-126 C-78,-126 -74,-90 -40,-88 M48,-126 C78,-126 74,-90 40,-88" fill="none" stroke={b.base} strokeWidth={4} />
          <path d="M-30,-128 C-30,-100 -18,-84 -6,-78" fill="none" stroke="#FFF3D0" strokeWidth={5} opacity={0.6} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------
// BENCH SCOPE: the microscope objective, seen close. A knurled brass tube drops into frame from
// above (drop 0 = out of frame, 1 = seated), ending in an objective lens that throws a ring of
// lamp light on the stage below. Anchor (x, y) is the centre of the light ring on the stage.
// ---------------------------------------------------------------------------------------------
export const BenchScope: React.FC<{x: number; y: number; scale?: number; drop?: number; lamp?: number; f?: number}> = ({
  x, y, scale = 1, drop = 1, lamp = 1, f = 0,
}) => {
  const id = uid(`bs${x}${y}${scale}`);
  const b = tones(BRASS);
  const d = clamp01(drop);
  // overshoot then settle on the drop
  const over = d < 1 ? smooth(d) * 1.06 : 1;
  const ty = -900 + 520 * over;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <defs>
        <FormGradient id={`${id}b`} t={b} softness={0.95} />
        <radialGradient id={`${id}l`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF4D6" stopOpacity={0.85 * lamp} />
          <stop offset="0.55" stopColor={LAMP} stopOpacity={0.4 * lamp} />
          <stop offset="1" stopColor={LAMP} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={0} rx={330} ry={250} fill={`url(#${id}l)`} />
      <g transform={`translate(0,${ty})`}>
        <rect x={-70} y={-300} width={140} height={300} fill={`url(#${id}b)`} stroke={INK} strokeWidth={6} />
        {Array.from({length: 14}, (_, i) => <path key={i} d={`M${-70 + i * 10},-260 v60`} stroke={INK} strokeWidth={2.5} opacity={0.5} />)}
        <rect x={-70} y={-262} width={140} height={64} fill="none" stroke={INK} strokeWidth={4} />
        <path d="M-70,0 L-46,70 L46,70 L70,0 Z" fill={b.core} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <ellipse cx={0} cy={70} rx={46} ry={12} fill="#0B1418" stroke={INK} strokeWidth={4} />
        <ellipse cx={-6} cy={67} rx={18} ry={4} fill="#BFE6FF" opacity={0.7} />
        <rect x={-58} y={-150} width={20} height={130} fill="#FFF3D0" opacity={0.35} />
      </g>
      {/* the light ring on the stage */}
      <ellipse cx={0} cy={0} rx={250} ry={180} fill="none" stroke="#FFF4D6" strokeWidth={4} opacity={0.35 * lamp * (0.85 + 0.15 * Math.sin(f / 11))} />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------
// ARCHIVE DRAWERS: a wall of small specimen drawers receding to a vanishing point, each with a
// brass pull and a label card, a few glinting like stars. Draw it full-frame; vx/vy is the
// vanishing point. `open` slides one drawer (row, col) out toward the camera.
// ---------------------------------------------------------------------------------------------
export const ArchiveDrawers: React.FC<{
  w?: number; h?: number; vx?: number; vy?: number; f: number; rows?: number; cols?: number; depth?: number;
  open?: {row: number; col: number; t: number}; glint?: number; wood?: string;
}> = ({w = 1080, h = 1920, vx = 540, vy = 860, f, rows = 9, cols = 7, depth = 6, open, glint = 1, wood = '#5A3A22'}) => {
  const wt = tones(wood);
  const out: React.ReactNode[] = [];
  // depth slices from far (k small) to near
  for (let s = depth - 1; s >= 0; s--) {
    const k = Math.pow(0.62, s);
    const cw = (w * 1.3 * k) / cols, ch = (h * 0.9 * k) / rows;
    const x0 = vx - (cols * cw) / 2, y0 = vy - (rows * ch) / 2;
    const fade = 0.25 + 0.75 * Math.pow(1 - s / depth, 1.3);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // keep a corridor down the middle so the far wall reads as depth
        if (c > 1 && c < cols - 2 && r > 1 && r < rows - 2) continue;
        const hx = hash(s * 997 + r * 31 + c);
        const x = x0 + c * cw, y = y0 + r * ch;
        const isOpen = open && s === 0 && open.row === r && open.col === c;
        const slide = isOpen ? smooth(open!.t) * ch * 0.9 : 0;
        const tw = 0.5 + 0.5 * Math.sin(f / (20 + (hx % 30)) + (hx % 100));
        out.push(
          <g key={`${s}-${r}-${c}`} opacity={fade}>
            <rect x={x + 2} y={y + 2} width={cw - 4} height={ch - 4} fill={s === 0 ? wt.base : wt.core} stroke={INK} strokeWidth={Math.max(1, 4 * k)} />
            <g transform={`translate(0,${slide})`}>
              <rect x={x + cw * 0.08} y={y + ch * 0.1} width={cw * 0.84} height={ch * 0.8} fill={s === 0 ? wt.key : wt.base} stroke={INK} strokeWidth={Math.max(1, 3 * k)} />
              <rect x={x + cw * 0.3} y={y + ch * 0.2} width={cw * 0.4} height={ch * 0.22} fill="#EFE6CF" opacity={0.85} />
              <rect x={x + cw * 0.34} y={y + ch * 0.27} width={cw * 0.3 * ((hx % 60) / 100 + 0.4)} height={Math.max(1, ch * 0.05)} fill="#5A5040" opacity={0.6} />
              <rect x={x + cw * 0.42} y={y + ch * 0.58} width={cw * 0.16} height={ch * 0.1} rx={2} fill={BRASS} stroke={INK} strokeWidth={Math.max(1, 2 * k)} />
            </g>
            {glint > 0 && hx % 7 === 0 && (
              <circle cx={x + cw * 0.5} cy={y + ch * 0.62} r={(3 + 5 * k) * (0.6 + tw)} fill="#FFF4D6" opacity={glint * tw * 0.9} />
            )}
          </g>
        );
      }
    }
  }
  return <g>{out}</g>;
};

// ---------------------------------------------------------------------------------------------
// TREE RINGS: a sawn tree cross-section that counts the same way the Otolith does, so a film can
// light stone rings and tree rings one for one. `counted` 0..1 travels core outward exactly like
// Otolith.counted. Bark, a radial check (crack), saw marks. Anchor (x, y) is the pith.
// ---------------------------------------------------------------------------------------------
export const TreeRings: React.FC<{x: number; y: number; scale?: number; rings?: number; counted?: number; pulse?: number; f?: number}> = ({
  x, y, scale = 1, rings = 14, counted = 1, pulse = 0, f = 0,
}) => {
  const id = uid(`tr${x}${y}${scale}`);
  const wood = tones('#C99A62');
  const R = 190;
  const wob = (k: number, a: number) => R * k * (1 + 0.035 * Math.sin(a * 3 + 1.3) + 0.02 * Math.sin(a * 7));
  const ring = (k: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      pts.push(`${(Math.cos(a) * wob(k, a)).toFixed(1)},${(Math.sin(a) * wob(k, a) * 0.92).toFixed(1)}`);
    }
    return `M${pts.join(' L')} Z`;
  };
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <defs><FormGradient id={id} t={wood} softness={0.9} /></defs>
      <ContactShadow cx={0} cy={R * 0.95} rx={R * 0.95} ry={20} opacity={0.4} />
      <path d={ring(1.1)} fill="#5A3A22" stroke={INK} strokeWidth={7} />
      {Array.from({length: 16}, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <path key={i} d={`M${Math.cos(a) * R * 1.02},${Math.sin(a) * R * 0.94} L${Math.cos(a) * R * 1.09},${Math.sin(a) * R * 1.0}`} stroke="#3A2414" strokeWidth={5} />;
      })}
      <path d={ring(1)} fill={`url(#${id})`} stroke={INK} strokeWidth={4} />
      {Array.from({length: rings}, (_, i) => {
        const k = 1 - (i + 1) / (rings + 1.2);
        const at = 1 - k;
        const lit = counted >= at - 0.02;
        return <path key={i} d={ring(k)} fill="none" stroke={lit ? '#7A4A22' : wood.core} strokeWidth={lit ? 3.4 : 2} opacity={lit ? 0.9 : 0.45} />;
      })}
      {pulse > 0 && pulse < 1 && (
        <path d={ring(Math.max(0.05, pulse))} fill="none" stroke={LAMP} strokeWidth={7 * (1 - pulse) + 2} opacity={0.85 * (1 - pulse * 0.6)} style={{mixBlendMode: 'screen'} as any} />
      )}
      {/* saw marks and a radial check */}
      {Array.from({length: 7}, (_, i) => <path key={i} d={`M${-R * 0.9},${-R * 0.6 + i * 34} q${R * 0.9},-10 ${R * 1.8},0`} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.08} />)}
      <path d={`M${R * 0.15},${-R * 0.1} L${R * 0.55},${-R * 0.42} L${R * 0.62},${-R * 0.5}`} fill="none" stroke="#3A2414" strokeWidth={4} />
      <circle cx={0} cy={0} r={6} fill="#7A4A22" />
      <path d={ring(1)} fill="none" stroke={INK} strokeWidth={6} />
      <RimLight d={`M${-R * 0.7},${-R * 0.72} Q0,${-R * 1.02} ${R * 0.7},${-R * 0.72}`} w={4} color={LAMP} opacity={0.5} />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------
// YEAR DRUM: a horizontal brass calendar drum that shows a YEAR, deliberately a different shape
// from the round TallyCounter so a film can show a date and a count side by side without the two
// reading as one instrument. `year` may be fractional; the units drum rolls between integers.
// ---------------------------------------------------------------------------------------------
export const YearDrum: React.FC<{x: number; y: number; scale?: number; year: number; label?: string}> = ({x, y, scale = 1, year, label}) => {
  const id = uid(`yd${x}${y}${scale}`);
  const b = tones(BRASS);
  const yr = Math.max(0, year);
  const digits = [1000, 100, 10, 1].map((p) => {
    const whole = Math.floor(yr / p) % 10;
    const below = yr % p;
    const roll = p === 1 ? yr - Math.floor(yr) : below > p - 1 ? below - (p - 1) : 0;
    return {whole, roll};
  });
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <defs>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={b.shade} /><stop offset="0.3" stopColor={b.key} /><stop offset="0.55" stopColor={b.base} /><stop offset="1" stopColor={b.shade} />
        </linearGradient>
        <clipPath id={`${id}w`}><rect x={-104} y={-30} width={208} height={60} rx={4} /></clipPath>
      </defs>
      <ContactShadow cx={0} cy={86} rx={150} ry={12} opacity={0.4} />
      <rect x={-170} y={-62} width={26} height={124} rx={10} fill={b.core} stroke={INK} strokeWidth={5} />
      <rect x={144} y={-62} width={26} height={124} rx={10} fill={b.core} stroke={INK} strokeWidth={5} />
      <rect x={-150} y={-56} width={300} height={112} rx={20} fill={`url(#${id}c)`} stroke={INK} strokeWidth={6} />
      {Array.from({length: 9}, (_, i) => <path key={i} d={`M${-130 + i * 32},-56 v112`} stroke={INK} strokeWidth={2} opacity={0.18} />)}
      <rect x={-112} y={-38} width={224} height={76} rx={8} fill="#0E1418" stroke={INK} strokeWidth={5} />
      <g clipPath={`url(#${id}w)`}>
        {digits.map((d, i) => (
          <g key={i} transform={`translate(${-78 + i * 52},${-d.roll * 58})`}>
            {[0, 1].map((k) => (
              <g key={k} transform={`translate(0,${k * 58})`}>
                <rect x={-22} y={-26} width={44} height={52} rx={3} fill="#F2EBDA" />
                <text x={0} y={16} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={800} fontSize={44} fill={INK}>{(d.whole + k) % 10}</text>
              </g>
            ))}
          </g>
        ))}
        <rect x={-104} y={-30} width={208} height={14} fill="#000" opacity={0.35} />
        <rect x={-104} y={16} width={208} height={14} fill="#000" opacity={0.35} />
      </g>
      {label && (
        <g transform="translate(0,96)">
          <rect x={-(label.length * 26 * 0.602 / 2 + 20)} y={-22} width={label.length * 26 * 0.602 + 40} height={44} rx={6} fill={b.core} stroke={INK} strokeWidth={4} />
          <text x={0} y={9} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={800} fontSize={26} fill={INK}>{label}</text>
        </g>
      )}
    </g>
  );
};
