import React from 'react';
import {INK} from './lighting';
import {LENS} from './scope';

// =============================================================================
// PIER — the DAWN PIER family (2026-10-08, "Who Writes the Study").
// PierDawn: a driftwood pier deck over a khaki-olive inlet at sunrise, with the sun low
//   at upper left (frame 150,520) so everything backlit gets a peach rim.
// StudySheet: a white sheet of ruled question lines. A line can be BURNED (an amber ink
//   line that is drawn on, glows, then cools to dark ink), PENCILLED (graphite, honest
//   about a lighter ask) or left BLANK. The sheet can slide, rotate and hang over an edge.
// BurnBeam: the focused cone of dawn light from a lens to a focal spot on the sheet, with
//   a flickering spot, a wisp of smoke and a jitter control for the stall.
// All colours are the film's palette roles (out/dispatch/art_direction.json). The lens is
// the only saturated yellow round form, so nothing here uses LENS.rim.
// =============================================================================

export const PC = {
  sky: '#C9B98E',
  skyDeep: '#8E9A9E',
  peach: '#FFB98A',
  water: '#5B5E3F',
  waterDk: '#44472F',
  horizon: '#6E7468',
  pier: '#7A5A3C',
  pierDk: '#3F2E20',
  paper: '#F4F2EA',
  ink: '#17202A',
  amber: '#F29A2E',
  cool: '#2A2118',
  glow: '#EADFB4',
  slate: '#3D4C52',
  stamp: '#4A3470',
};

const hash = (i: number) => {
  let x = (Math.floor(i) + 1013) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x ^= x >>> 16;
  return x >>> 0;
};
const rnd = (i: number) => (hash(i) % 10000) / 10000;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export const SUN = {x: 150, y: 520};

/** the pier deck, in the lower part of the frame. view 'front' is eye level looking out over the inlet,
 *  'overhead' is straight down on planks, 'three' is a three-quarter view with a lower horizon. */
export const PierDawn: React.FC<{
  f: number;
  view?: 'front' | 'overhead' | 'three';
  /** 0..1 how much cloud covers the sun */
  cloud?: number;
  /** warm paper wash for the counterpoint, 0..1 */
  paperWash?: number;
  sunGlow?: number;
}> = ({f, view = 'front', cloud = 0, paperWash = 0, sunGlow = 1}) => {
  const hz = view === 'three' ? 560 : 620;
  const deckTop = view === 'three' ? 940 : 980;
  const sunA = (1 - 0.8 * cloud) * sunGlow;
  const planks = Array.from({length: 14}, (_, i) => i);
  return (
    <g>
      <defs>
        <linearGradient id="pdSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PC.skyDeep} />
          <stop offset="0.65" stopColor={PC.sky} />
          <stop offset="1" stopColor="#E3CBA0" />
        </linearGradient>
        <linearGradient id="pdWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PC.horizon} />
          <stop offset="0.3" stopColor={PC.water} />
          <stop offset="1" stopColor={PC.waterDk} />
        </linearGradient>
        <radialGradient id="pdSun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF4DA" stopOpacity="1" />
          <stop offset="0.25" stopColor={PC.peach} stopOpacity="0.85" />
          <stop offset="1" stopColor={PC.peach} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pdDeck" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8A6643" />
          <stop offset="1" stopColor={PC.pierDk} />
        </linearGradient>
      </defs>
      {view !== 'overhead' && (
        <g>
          <rect data-band="ok" x={-40} y={-40} width={1160} height={hz + 40} fill="url(#pdSky)" />
          {/* sun and its glow */}
          <circle cx={SUN.x} cy={SUN.y} r={620} fill="url(#pdSun)" opacity={0.55 * sunA} />
          <circle cx={SUN.x} cy={SUN.y} r={60} fill="#FFF7E6" opacity={0.95 * sunA} />
          {/* drifting haze bands and clouds */}
          {[0, 1, 2, 3].map((i) => {
            const cx = ((f * (0.3 + i * 0.16) + i * 330) % 1500) - 200;
            return (
              <g key={i} opacity={0.34 + 0.45 * cloud * (i % 2)}>
                <ellipse cx={cx} cy={120 + i * 105} rx={260 + i * 30} ry={30 + i * 5} fill="#E9E0CB" />
                <ellipse cx={cx + 120} cy={134 + i * 105} rx={170} ry={22} fill="#D9CFB6" />
              </g>
            );
          })}
          {cloud > 0.01 && <ellipse cx={SUN.x + 30} cy={SUN.y - 10} rx={330} ry={150} fill="#B7B29C" opacity={0.85 * cloud} />}
          {/* far shore: layered khaki and umber ridges */}
          <polygon points={`-40,${hz} -40,${hz - 54} 140,${hz - 74} 330,${hz - 40} 520,${hz - 96} 760,${hz - 52} 960,${hz - 82} 1120,${hz - 44} 1120,${hz}`} fill="#8F8A66" />
          <polygon points={`-40,${hz} -40,${hz - 26} 200,${hz - 38} 420,${hz - 18} 640,${hz - 44} 900,${hz - 20} 1120,${hz - 34} 1120,${hz}`} fill="#7C7855" />
          {/* the inlet */}
          <rect data-band="ok" x={-40} y={hz} width={1160} height={deckTop - hz + 20} fill="url(#pdWater)" />
          {/* sun path glitter */}
          {Array.from({length: 18}, (_, i) => {
            const y = hz + 8 + i * 17;
            const w = 18 + i * 3.2;
            const x = mix(SUN.x, 240, i / 18) + 26 * Math.sin(f / 17 + i * 1.7);
            return <rect key={i} x={x - w / 2} y={y} width={w} height={3.5} rx={2} fill={PC.peach} opacity={(0.55 - i * 0.02) * sunA} />;
          })}
          {Array.from({length: 22}, (_, i) => {
            const y = hz + 20 + rnd(i * 3) * (deckTop - hz - 40);
            const x = (rnd(i * 7) * 1300 + f * (0.15 + 0.1 * rnd(i))) % 1200 - 60;
            return <rect key={`r${i}`} x={x} y={y} width={30 + 50 * rnd(i + 20)} height={2.5} fill="#8A8E69" opacity={0.28} />;
          })}
          {/* far fishing boats, slate and rim only */}
          {[[690, hz + 36, 0.5], [880, hz + 62, 0.7], [440, hz + 78, 0.6]].map(([bx, by, s], i) => (
            <g key={i} transform={`translate(${bx},${by + 2.4 * Math.sin(f / 19 + i)}) scale(${s})`}>
              <path d="M-46,0 L46,0 L36,18 L-34,18 Z" fill={PC.slate} stroke={INK} strokeWidth={3} />
              <rect x={-12} y={-24} width={26} height={24} fill="#55666C" stroke={INK} strokeWidth={3} />
              <path d="M2,-24 L2,-58" stroke={INK} strokeWidth={3} />
              <path d="M-46,0 L46,0" stroke={PC.peach} strokeWidth={2.5} opacity={0.7} />
            </g>
          ))}
          {/* gulls */}
          {[0, 1, 2].map((i) => {
            const gx = ((f * (1.1 + i * 0.4) + i * 400) % 1400) - 150;
            const gy = 250 + i * 70 + 14 * Math.sin(f / 21 + i * 2);
            const flap = Math.sin(f / (5 + i)) * 7;
            return (
              <path key={i} d={`M${gx - 22},${gy + flap} Q${gx - 8},${gy - 8} ${gx},${gy} Q${gx + 8},${gy - 8} ${gx + 22},${gy + flap}`} fill="none" stroke={PC.paper}
                strokeWidth={3} strokeLinecap="round" opacity={0.8} />
            );
          })}
        </g>
      )}
      {/* the deck */}
      {view === 'overhead' ? (
        <g>
          <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill="url(#pdDeck)" />
          {Array.from({length: 11}, (_, i) => (
            <g key={i}>
              <rect x={-40 + i * 112} y={-40} width={110} height={2000} fill={i % 2 ? '#80603F' : '#745636'} opacity={0.9} stroke={PC.pierDk} strokeWidth={4} />
              {Array.from({length: 8}, (_, k) => (
                <path key={k} d={`M${-40 + i * 112 + 12 + rnd(i * 9 + k) * 80},${rnd(i * 5 + k) * 1900} l${rnd(i + k) * 6 - 3},${70 + rnd(k) * 120}`} stroke={PC.pierDk} strokeWidth={2.5} opacity={0.35} />
              ))}
              {[200, 640, 1080, 1520].map((y, k) => (
                <circle key={k} cx={-40 + i * 112 + 26} cy={y + (i % 3) * 20} r={4} fill={PC.pierDk} />
              ))}
            </g>
          ))}
          <rect x={-40} y={-40} width={1160} height={2000} fill={PC.peach} opacity={0.1} />
        </g>
      ) : (
        <g>
          <rect data-band="ok" x={-40} y={deckTop} width={1160} height={1960 - deckTop} fill="url(#pdDeck)" />
          {planks.map((i) => {
            const y = deckTop + Math.pow(i / planks.length, 1.45) * (1920 - deckTop);
            const y2 = deckTop + Math.pow((i + 1) / planks.length, 1.45) * (1920 - deckTop);
            return (
              <g key={i}>
                <rect x={-40} y={y} width={1160} height={y2 - y} fill={i % 2 ? '#85633F' : '#765737'} opacity={0.85} />
                <rect x={-40} y={y} width={1160} height={3.5} fill={PC.pierDk} />
                {Array.from({length: 5}, (_, k) => (
                  <path key={k} d={`M${rnd(i * 11 + k) * 1100},${y + 6} l${60 + rnd(k + i) * 120},${(y2 - y) * 0.2}`} stroke={PC.pierDk} strokeWidth={2} opacity={0.3} />
                ))}
              </g>
            );
          })}
          {/* pier edge lip and a rope */}
          <rect data-band="ok" x={-40} y={deckTop - 14} width={1160} height={22} fill={PC.pierDk} />
          <rect x={-40} y={deckTop - 14} width={1160} height={6} fill="#5A4430" />
          <path d={`M-40,${deckTop - 70} Q300,${deckTop - 30} 520,${deckTop - 64} T1120,${deckTop - 58}`} fill="none" stroke="#A89874" strokeWidth={9} strokeLinecap="round" />
          <path d={`M-40,${deckTop - 70} Q300,${deckTop - 30} 520,${deckTop - 64} T1120,${deckTop - 58}`} fill="none" stroke={PC.pierDk} strokeWidth={3} strokeDasharray="10 12" />
          {[60, 1020].map((px) => (
            <g key={px}>
              <rect x={px - 22} y={deckTop - 150} width={44} height={150} fill="#6A4E33" stroke={INK} strokeWidth={4} />
              <rect x={px - 22} y={deckTop - 150} width={44} height={14} fill={PC.peach} opacity={0.5} />
            </g>
          ))}
          <rect x={-40} y={deckTop} width={1160} height={1960 - deckTop} fill={PC.peach} opacity={0.07} />
        </g>
      )}
      {paperWash > 0.01 && <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill={PC.paper} opacity={0.25 * paperWash} />}
    </g>
  );
};

export type SheetLine = {
  text: string;
  /** 0..1 how much of the amber ink has been drawn on */
  burn?: number;
  /** 0..1 how far it has cooled from amber to dark ink */
  cool?: number;
  /** a graphite pencil line instead of a burn */
  pencil?: number;
};

const lerpHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const m = pa.map((v, i) => Math.round(mix(v, pb[i], clamp01(t))));
  return `#${m.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

/** line anchors in sheet space, so a beam can aim at line n */
export const sheetLineY = (h: number, n: number) => 86 + n * ((h - 120) / 4) + (h - 120) / 8;

export const StudySheet: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  rot?: number;
  lines?: SheetLine[];
  header?: string;
  shadowDx?: number;
  shadowDy?: number;
  /** 0..1 fraction of the sheet hanging over the lower edge, as a skew of its far corner */
  hang?: number;
  f?: number;
  /** a glow on the blank line, 0..1 */
  pulse?: number;
  opacity?: number;
}> = ({x, y, w = 560, h = 360, rot = 0, lines = [], header = 'QUESTIONS THIS STUDY MUST ANSWER', shadowDx = 22, shadowDy = 21, hang = 0, f = 0, pulse = 0, opacity = 1}) => {
  const id = `sh${React.useId().replace(/:/g, '')}`;
  const nLines = 4;
  const lineH = (h - 120) / nLines;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`} opacity={opacity} data-study-sheet="true">
      <defs>
        <filter id={`${id}-glow`} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id={`${id}-sh`} x="-20%" y="-20%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <g transform={`translate(${w / 2},${h / 2})`}>
        <g transform={`rotate(${hang * 14}) translate(${-w / 2},${-h / 2})`}>
          <rect x={shadowDx} y={shadowDy} width={w} height={h} fill="#000" opacity={0.34} filter={`url(#${id}-sh)`} />
          <rect x={0} y={0} width={w} height={h} fill={PC.paper} stroke={INK} strokeWidth={4} />
          <rect x={0} y={0} width={w} height={h} fill="#fff" opacity={0.0} />
          <path d={`M${w},${h} L${w - 34},${h} Q${w},${h - 14} ${w},${h - 34} Z`} fill={INK} opacity={0.2} />
          <text x={w / 2} y={52} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={800} fontSize={Math.min(24, (w - 50) / (header.length * 0.62))}
            letterSpacing={1} fill={INK}>{header}</text>
          <path d={`M26,70 L${w - 26},70`} stroke={INK} strokeWidth={3} />
          {Array.from({length: nLines}, (_, n) => {
            const ly = 86 + n * lineH + lineH * 0.72;
            const ln = lines[n];
            const burn = ln?.burn ?? 0;
            const pencil = ln?.pencil ?? 0;
            const cool = ln?.cool ?? 0;
            const fs = 33;
            const tw = ln ? ln.text.length * fs * 0.6 : 0;
            const col = lerpHex(PC.amber, PC.cool, cool);
            const blankGlow = !ln && pulse > 0 ? pulse : 0;
            return (
              <g key={n}>
                <text x={36} y={ly - 4} fontFamily="'JetBrains Mono', monospace" fontWeight={800} fontSize={20} fill={INK} opacity={0.5}>{n + 1}</text>
                <path d={`M70,${ly + 8} L${w - 30},${ly + 8}`} stroke={INK} strokeWidth={2.2} opacity={0.55} />
                {blankGlow > 0 && <rect x={66} y={ly - 24} width={w - 94} height={40} rx={8} fill={PC.amber} opacity={0.22 * blankGlow + 0.1 * Math.sin(f / 5) * blankGlow} filter={`url(#${id}-glow)`} />}
                {ln && burn > 0 && (
                  <g>
                    <clipPath id={`${id}-c${n}`}><rect x={64} y={ly - 34} width={Math.max(1, Math.min(w - 90, (tw + 20) * clamp01(burn)))} height={52} /></clipPath>
                    <g clipPath={`url(#${id}-c${n})`}>
                      {cool < 0.9 && <text x={72} y={ly} fontFamily="'JetBrains Mono', monospace" fontWeight={800} fontSize={fs} fill={PC.amber}
                        opacity={0.85 * (1 - cool)} filter={`url(#${id}-glow)`}>{ln.text}</text>}
                      <text x={72} y={ly} fontFamily="'JetBrains Mono', monospace" fontWeight={800} fontSize={fs} fill={col}>{ln.text}</text>
                    </g>
                    {burn < 0.98 && (
                      <circle cx={64 + (tw + 20) * clamp01(burn)} cy={ly - 10} r={10 + 2 * Math.sin(f / 2)} fill="#FFF1C4" opacity={0.9} />
                    )}
                  </g>
                )}
                {ln && pencil > 0 && (
                  <g>
                    <clipPath id={`${id}-p${n}`}><rect x={64} y={ly - 34} width={Math.max(1, (tw + 20) * clamp01(pencil))} height={52} /></clipPath>
                    <text x={74} y={ly - 2} clipPath={`url(#${id}-p${n})`} fontFamily="'JetBrains Mono', monospace" fontWeight={600} fontSize={fs - 4} fill="#5A5F66"
                      opacity={0.85}>{ln.text}</text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </g>
    </g>
  );
};

/** the cone of focused dawn from the lens glass to the focal spot. Positions are absolute frame coordinates. */
export const BurnBeam: React.FC<{
  f: number;
  lens: {x: number; y: number; R: number};
  spot: {x: number; y: number};
  intensity?: number;
  jitter?: number;
  wisp?: number;
}> = ({f, lens, spot, intensity = 1, jitter = 0, wisp = 1}) => {
  const id = `bb${React.useId().replace(/:/g, '')}`;
  const jx = jitter * 14 * Math.sin(f * 1.9) * Math.cos(f * 0.7);
  const jy = jitter * 10 * Math.sin(f * 2.3 + 1);
  const sx = spot.x + jx, sy = spot.y + jy;
  const a = intensity;
  // the cone leaves the lower third of the glass
  const lx1 = lens.x - lens.R * 0.42, lx2 = lens.x + lens.R * 0.42, ly = lens.y + lens.R * 0.78;
  const flick = 0.82 + 0.18 * Math.sin(f / 2.3) * Math.cos(f / 3.7);
  return (
    <g opacity={a}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="#FFE9B0" stopOpacity="0.38" />
          <stop offset="1" stopColor="#FFF4D2" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id={`${id}-s`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="0.35" stopColor="#FFE08A" stopOpacity="0.9" />
          <stop offset="1" stopColor={PC.amber} stopOpacity="0" />
        </radialGradient>
      </defs>
      <polygon points={`${lx1},${ly} ${lx2},${ly} ${sx + 10},${sy} ${sx - 10},${sy}`} fill={`url(#${id}-g)`} />
      <circle cx={sx} cy={sy} r={46 * flick} fill={`url(#${id}-s)`} />
      <circle cx={sx} cy={sy} r={9} fill="#FFFFFF" />
      {wisp > 0 && (
        <path
          d={`M${sx},${sy - 8} q${14 * Math.sin(f / 9)},-30 ${-6 + 10 * Math.sin(f / 7)},-62 t${12 * Math.cos(f / 8)},-60`}
          fill="none" stroke="#D9D2C0" strokeWidth={4} strokeLinecap="round" opacity={0.5 * wisp}
        />
      )}
    </g>
  );
};

export {LENS};
