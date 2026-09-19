import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {Stage3D, Plane} from './lib/stage3d';
import {Sourdough, ServerMachine} from './lib/kit';
import {RunOfRiver} from './lib/runofriver';
import {ForecastTrace, Reconcile, FCAST, OBSERVED} from './lib/forecast';
import {Simulated} from './lib/simulation';
import {ContactShadow, RimLight, MotionBlur, GradeLayer, tones} from './lib/lighting';
import {VoiceProvider, useVoice} from './lib/voice';
import {entrance, followThrough} from './lib/motion';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';

const C = {
  ink: '#08100F',
  night: '#0E2622',
  ground: '#17332B',
  amber: '#E3873A',
  amberD: '#8C4A18',
  cyan: '#7FD4FF',
  light: '#EAF2EC',
  steel: '#5A6E72',
  moss: '#2E5A46',
  rust: '#B4562A',
};
const FONT = 'Fraunces, Georgia, serif';
const MONO = 'JetBrains Mono, monospace';
const W = 1080, H = 1920;
type Beat = {id: number; at: number; label: string};

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const ease = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.18, 0.76, 0.24, 1)});

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

/** Mono advance is exact, so a plate's width is arithmetic and never judgement.
 *  DISPATCH_STANDARD section 4: size the plate to the string, never the reverse. */
const plateW = (text: string, size: number, ls = 1.5) => text.length * size * 0.602 + ls * (text.length - 1) + 56;

const Plate: React.FC<{text: string; x?: number; y: number; size?: number; tone?: 'dark' | 'amber' | 'cyan'; p?: number}> =
({text, x = 540, y, size = 30, tone = 'dark', p = 1}) => {
  const w = plateW(text, size), h = size + 30;
  // Authored geometry, checked against the LinkedIn crop BEFORE a frame is encoded.
  // A plate that straddles y=420 or y=1500 ships cut in half; this throws instead.
  assertCropSafe(text, y - h / 2, y + h / 2);
  const fill = tone === 'amber' ? C.amberD : tone === 'cyan' ? '#0C2B3C' : '#0B1B1A';
  const edge = tone === 'amber' ? C.amber : tone === 'cyan' ? C.cyan : C.light;
  const k = clamp(p);
  if (k <= 0.01) return null;
  return (
    <g opacity={k} transform={`translate(${x} ${y}) scale(${0.94 + 0.06 * k})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 7} width={w} height={h} rx={7} fill={C.ink} opacity={0.5} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={7} fill={fill} stroke={edge} strokeWidth={3.5} />
      <path d={`M${-w / 2 + 10} ${-h / 2 + 5}h${w - 20}`} stroke={edge} strokeWidth={2} opacity={0.4} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={size} letterSpacing={1.5} fill={edge}>{text}</text>
    </g>
  );
};

const Head: React.FC<{text: string; y: number; size?: number; p?: number}> = ({text, y, size = 58, p = 1}) => {
  // y is the BASELINE, so the cap rises about 0.78em above it and the descender falls
  // about 0.22em below. Same invariant as Plate: a headline cut by the crop line is
  // never the intent, and the square cut is where the audience is.
  assertCropSafe(text, y - size * 0.78, y + size * 0.22);
  return <text x={540} y={y} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={C.light} opacity={clamp(p)}>{text}</text>;
};

const Defs = () => {
  const st = tones(C.steel), gr = tones(C.ground);
  return (
    <defs>
      <linearGradient id="sky19" x1="0" y1="0" x2="0.2" y2="1">
        <stop stopColor="#123029" /><stop offset="0.55" stopColor={C.night} /><stop offset="1" stopColor={C.ink} />
      </linearGradient>
      <linearGradient id="wall19" x1="0" y1="0" x2="0.6" y2="1">
        <stop stopColor="#1B3B33" /><stop offset="0.6" stopColor="#122A25" /><stop offset="1" stopColor="#0A1917" />
      </linearGradient>
      <linearGradient id="steel19" x1="0" y1="0" x2="0.7" y2="1">
        <stop stopColor={st.key} /><stop offset="0.4" stopColor={st.base} /><stop offset="1" stopColor={st.shade} />
      </linearGradient>
      <linearGradient id="grd19" x1="0" y1="0" x2="0.3" y2="1">
        <stop stopColor={gr.base} /><stop offset="1" stopColor={C.ink} />
      </linearGradient>
      <radialGradient id="lamp19" cx="0.5" cy="0.5" r="0.5">
        <stop stopColor={C.amber} stopOpacity="0.55" /><stop offset="1" stopColor={C.amber} stopOpacity="0" />
      </radialGradient>
      <linearGradient id="water19" x1="0" y1="0" x2="0.2" y2="1">
        <stop stopColor="#2A6B7E" /><stop offset="1" stopColor="#0E2C33" />
      </linearGradient>
    </defs>
  );
};

/** The always-running ambient layer. DISPATCH_STANDARD section 8: no scene is
 *  built only out of finished events. */
const Rain: React.FC<{f: number; density?: number}> = ({f, density = 1}) => (
  <g opacity={0.24 * density}>
    {Array.from({length: 26}).map((_, i) => {
      const x = (i * 149) % 1120 - 20;
      const y = ((f * (7 + (i % 5) * 1.3) + i * 213) % 2100) - 90;
      return <path key={i} d={`M${x} ${y}v${34 + (i % 4) * 9}`} stroke={C.light} strokeWidth={2} opacity={0.5} />;
    })}
  </g>
);




/** A NEAR-PLANE FOREGROUND for the valley wides. The exterior detail pass moved the
 *  meter by 0.3 of a point, because thin strokes at low opacity carry almost no local
 *  gradient. What worked indoors was LARGE, HIGH-CONTRAST structure, so this is that:
 *  a dock deck with heavy pilings, a rail with real posts, a rock mass and a fuel drum
 *  rank. It also does the staging job the 9:16 master needs, filling the near plane
 *  below the square band instead of padding it. */
const DockForeground: React.FC<{f: number; drums?: boolean}> = ({f, drums = true}) => (
  <g>
    {/* the rock mass on the left, one big silhouette with a lit crown */}
    <path d="M-220 1560 q120 -190 300 -120 q130 30 190 150 q40 80 10 180 l-500 0 Z"
      fill="#081714" stroke={C.ink} strokeWidth={8} />
    <path d="M-160 1470 q100 -120 240 -70" fill="none" stroke={C.steel} strokeWidth={7} opacity={0.3} />
    <path d="M-120 1520 q90 -90 210 -50" fill="none" stroke={C.light} strokeWidth={4} opacity={0.12} />
    {/* the dock deck, heavy and high contrast */}
    <path d="M-220 1700H1300V1806H-220Z" fill="#14322C" stroke={C.ink} strokeWidth={9} />
    {Array.from({length: 14}).map((_, i) => (
      <path key={i} d={`M${-200 + i * 112} 1700V1806`} stroke={C.ink} strokeWidth={6} opacity={0.75} />
    ))}
    <path d="M-220 1712H1300" stroke={C.light} strokeWidth={5} opacity={0.16} />
    {/* pilings below it, big dark columns */}
    {[0, 1, 2, 3, 4].map((i) => (
      <g key={i} transform={`translate(${-80 + i * 280} 1806)`}>
        <path d="M-34 0h68v294h-68Z" fill="#0A201C" stroke={C.ink} strokeWidth={7} />
        <path d="M14 0h20v294h-20Z" fill={C.ink} opacity={0.45} />
        <path d={`M-40 ${26 + 6 * Math.sin(f / 23 + i)}h80`} stroke="#2C4A44" strokeWidth={9} opacity={0.8} />
      </g>
    ))}
    {/* the rail: posts and two runs, which reads as built at any size */}
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <path key={i} d={`M${-140 + i * 210} 1700v-150`} stroke={C.ink} strokeWidth={11} />
    ))}
    <path d="M-220 1580H1300" stroke={C.ink} strokeWidth={10} />
    <path d="M-220 1636H1300" stroke={C.ink} strokeWidth={8} />
    <path d="M-220 1574H1300" stroke={C.steel} strokeWidth={4} opacity={0.4} />
    {drums && [0, 1, 2].map((i) => (
      <g key={i} transform={`translate(${880 + i * 96} 1690)`}>
        <path d="M-40 0h80v-150h-80Z" fill={C.amberD} stroke={C.ink} strokeWidth={7} />
        <path d="M18 -150h22v150h-22Z" fill={C.ink} opacity={0.4} />
        <path d="M-40 -46h80M-40 -104h80" stroke={C.ink} strokeWidth={6} opacity={0.8} />
        <ellipse cx={0} cy={-150} rx={40} ry={11} fill="#C1712F" stroke={C.ink} strokeWidth={6} />
      </g>
    ))}
  </g>
);

/** Water that is a SURFACE rather than a fill. The dead-space meter reads a flat
 *  gradient as empty and it is right to: the first frame pass fixed the interiors
 *  and left the exteriors at 54 to 61 percent, all of it sky and water. This adds
 *  chop lines, a reflected light column, rain dimples, moored hulls and shore rock. */
const Shore: React.FC<{f: number; y: number; reflectX?: number; boats?: boolean}> =
({f, y, reflectX = 600, boats = true}) => (
  <g>
    <path d={`M-200 ${y}H1300V2100H-200Z`} fill="url(#water19)" opacity={0.92} />
    {/* the light column off the powerhouse door, broken into rungs by the chop */}
    {Array.from({length: 13}).map((_, i) => {
      const yy = y + 26 + i * 44;
      const w = 34 + i * 11 + 9 * Math.sin(f / 17 + i);
      return <path key={i} d={`M${reflectX - w} ${yy}h${w * 2}`} stroke={C.amber} strokeWidth={7}
        opacity={0.30 - i * 0.017} strokeLinecap="round" />;
    })}
    {/* chop: many small strokes, which the meter counts as structure because it is */}
    {Array.from({length: 46}).map((_, i) => {
      const xx = ((i * 137) % 1500) - 180;
      const yy = y + 18 + ((i * 83) % 560);
      const w = 26 + (i % 4) * 14;
      return <path key={i} d={`M${xx} ${yy}q${w / 2} ${4 + 3 * Math.sin(f / 13 + i)} ${w} 0`}
        fill="none" stroke={C.light} strokeWidth={3} opacity={0.12 + 0.08 * ((i * 7) % 3)} />;
    })}
    {/* rain dimples, always running */}
    {Array.from({length: 18}).map((_, i) => {
      const ph = ((f * 0.9 + i * 31) % 60) / 60;
      const xx = ((i * 211) % 1400) - 150;
      const yy = y + 40 + ((i * 167) % 520);
      return <ellipse key={i} cx={xx} cy={yy} rx={6 + 26 * ph} ry={2 + 8 * ph}
        fill="none" stroke={C.light} strokeWidth={2} opacity={0.22 * (1 - ph)} />;
    })}
    {boats && [0, 1].map((i) => (
      <g key={i} transform={`translate(${150 + i * 760} ${y + 96 + i * 38}) scale(${0.72 - i * 0.18})`}>
        <path d="M-96 0 q96 44 192 0 l-26 34 q-70 26 -140 0 Z" fill="#0B1B1C" stroke={C.ink} strokeWidth={5} />
        <path d="M-30 0 v-58 h46 v58" fill="#13302C" stroke={C.ink} strokeWidth={5} />
        <path d="M40 0 v-92" stroke={C.ink} strokeWidth={6} />
        <circle cx={40} cy={-96} r={5} fill={C.amber} opacity={0.5 + 0.4 * Math.sin(f / 9 + i)} />
        <path d={`M-96 ${6 + 3 * Math.sin(f / 21 + i)} q96 20 192 0`} stroke={C.light} strokeWidth={3} opacity={0.2} fill="none" />
      </g>
    ))}
    {/* shore rock along the waterline, so land meets water on an edge with form */}
    {Array.from({length: 22}).map((_, i) => {
      const xx = -80 + i * 58 + (i % 3) * 11;
      const h = 12 + (i % 4) * 9;
      return <path key={i} d={`M${xx} ${y + 4} q${14} ${-h} ${30} 0 Z`} fill="#0A1E1B" stroke={C.ink} strokeWidth={3} />;
    })}
  </g>
);

/** THE INTERIOR BACKDROP. The dead-space meter samples the SQUARE crop (y 420..1500
 *  of the master), and the first graded cut ran 57.4% low-information area against a
 *  42% ceiling because the band between the headline and the subject was an unbroken
 *  gradient. A gradient is not a background, it is an absence with a colour. This puts
 *  real structure there: panel seams, a conduit run with brackets, a pipe bank, vents
 *  and a grated floor, all form-shaded so they read as built rather than as texture. */
const Backdrop: React.FC<{f: number; warm?: number; grate?: boolean}> = ({f, warm = 1, grate = true}) => (
  <g>
    <path d="M-200 -200H1300V2100H-200Z" fill="url(#wall19)" />
    {/* panel seams: the wall is made of things */}
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <g key={i}>
        <path d={`M${-120 + i * 232} -200V2100`} stroke={C.ink} strokeWidth={5} opacity={0.5} />
        <path d={`M${-114 + i * 232} -200V2100`} stroke={C.light} strokeWidth={2} opacity={0.07} />
      </g>
    ))}
    {[0, 1, 2, 3].map((i) => (
      <path key={i} d={`M-200 ${380 + i * 300}H1300`} stroke={C.ink} strokeWidth={4} opacity={0.4} />
    ))}
    {/* a conduit run with real brackets, carrying the eye across the empty band */}
    <path d="M-200 612H1300" stroke={C.ink} strokeWidth={26} />
    <path d="M-200 612H1300" stroke={C.steel} strokeWidth={16} />
    <path d="M-200 604H1300" stroke={C.light} strokeWidth={3} opacity={0.22} />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <g key={i} transform={`translate(${-60 + i * 224} 612)`}>
        <path d="M-16 -22H16V22H-16Z" fill={C.steel} stroke={C.ink} strokeWidth={4} />
        <circle cx={0} cy={0} r={5} fill={C.ink} />
      </g>
    ))}
    {/* a pipe bank on the shadow side, three tones, never a flat fill */}
    <g opacity={0.9}>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <path d={`M${920 + i * 58} -200V2100`} stroke={C.ink} strokeWidth={40} />
          <path d={`M${920 + i * 58} -200V2100`} stroke={i % 2 ? '#3E5550' : C.steel} strokeWidth={28} />
          <path d={`M${910 + i * 58} -200V2100`} stroke={C.light} strokeWidth={4} opacity={0.14} />
          {[0, 1, 2, 3, 4].map((k) => (
            <path key={k} d={`M${898 + i * 58} ${300 + k * 330}h44`} stroke={C.ink} strokeWidth={9} opacity={0.8} />
          ))}
        </g>
      ))}
    </g>
    {/* vents, and a warm bounce off the door so the dark side is never dead black */}
    {[0, 1].map((i) => (
      <g key={i} transform={`translate(${96 + i * 150} 800)`}>
        <rect x={-54} y={-40} width={108} height={80} rx={6} fill="#0B1B1A" stroke={C.ink} strokeWidth={5} />
        {[0, 1, 2, 3].map((k) => (
          <path key={k} d={`M-42 ${-26 + k * 17}h84`} stroke={C.steel} strokeWidth={6} opacity={0.75} />
        ))}
      </g>
    ))}
    <ellipse cx={180} cy={1120} rx={520} ry={680} fill="url(#lamp19)" opacity={0.3 * warm} />
    {grate && (
      <g>
        <path d="M-200 1640H1300V2100H-200Z" fill="#0A1917" />
        <path d="M-200 1640H1300" stroke={C.ink} strokeWidth={8} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <path key={i} d={`M${-160 + i * 190} 1640L${-300 + i * 230} 2100`} stroke={C.steel} strokeWidth={5} opacity={0.3} />
        ))}
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M-200 ${1720 + i * 120}H1300`} stroke={C.steel} strokeWidth={4} opacity={0.22} />
        ))}
      </g>
    )}
  </g>
);

/** The exterior counterpart: layered ridges, a treeline and town lights, so a night
 *  sky is a PLACE rather than a gradient. */
const NightRidge: React.FC<{f: number; town?: boolean}> = ({f, town = true}) => (
  <g>
    <path d="M-200 -200H1300V1240H-200Z" fill="url(#sky19)" />
    {[0, 1, 2].map((i) => (
      <path key={i}
        d={`M-200 ${560 + i * 120} L${120 + i * 60} ${380 + i * 110} L${430 + i * 40} ${540 + i * 100} L${720 - i * 50} ${350 + i * 120} L${1010 + i * 30} ${520 + i * 96} L1300 ${420 + i * 110} V1240 H-200 Z`}
        fill={i === 0 ? '#0C2420' : i === 1 ? '#0A1E1B' : '#081815'}
        stroke={C.ink} strokeWidth={4} opacity={0.92} />
    ))}
    {/* rock faces and snow gullies ON the ridges, inside the square band. Flat
        silhouettes carry no information; these are large forms with their own light. */}
    {Array.from({length: 9}).map((_, i) => {
      const bx = -40 + i * 145, by = 470 + (i % 3) * 86;
      return (
        <g key={i}>
          <path d={`M${bx} ${by + 190} l${44} ${-150} l${40} ${60} l${34} ${-96} l${46} ${186} Z`}
            fill="#0F2A25" stroke={C.ink} strokeWidth={5} opacity={0.95} />
          <path d={`M${bx + 44} ${by + 40} l${40} ${60}`} stroke={C.light} strokeWidth={7} opacity={0.14} />
          <path d={`M${bx + 118} ${by + 4} l${24} ${96}`} stroke={C.light} strokeWidth={5} opacity={0.1} />
        </g>
      );
    })}
    {/* a transmission line across the sky: this is a grid story and the band was empty */}
    <g opacity={0.9}>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${150 + i * 420} 980)`}>
          <path d="M0 0v-330" stroke={C.ink} strokeWidth={12} />
          <path d="M-64 -280h128" stroke={C.ink} strokeWidth={9} />
          <path d="M-46 -214h92" stroke={C.ink} strokeWidth={8} />
          {[-56, 56].map((k) => <circle key={k} cx={k} cy={-288} r={7} fill="#2C4A44" stroke={C.ink} strokeWidth={3} />)}
          {i < 2 && [0, 1].map((r) => (
            <path key={r} d={`M56 ${-288 + r * 68} q210 ${62 + 7 * Math.sin(f / 29 + i + r)} 364 0`}
              fill="none" stroke={C.ink} strokeWidth={5} opacity={0.85} />
          ))}
        </g>
      ))}
    </g>
    {/* a spruce treeline: small marks, but they are OBJECTS and the meter knows it */}
    {Array.from({length: 34}).map((_, i) => {
      const x = -60 + i * 35 + (i % 3) * 9;
      const h = 54 + (i % 5) * 16;
      return <path key={i} d={`M${x} 1180 l${-11} 0 l11 ${-h} l11 ${h} Z`} fill="#071512" stroke={C.ink} strokeWidth={2} />;
    })}
    {town && Array.from({length: 16}).map((_, i) => (
      <circle key={i} cx={640 + i * 27} cy={1150 - (i % 3) * 13} r={3.5}
        fill={C.amber} opacity={0.4 + 0.4 * Math.sin(f / 13 + i)} />
    ))}
    {/* low cloud, drifting, on an irrational period */}
    {[0, 1, 2].map((i) => (
      <ellipse key={i} cx={((f * (0.5 + i * 0.22) + i * 420) % 1700) - 250} cy={300 + i * 86}
        rx={260 - i * 40} ry={30 - i * 6} fill={C.light} opacity={0.045} />
    ))}
  </g>
);

/** The server rack. Six parts, three zones, per the board's hero block. */
const Rack: React.FC<{x: number; y: number; scale?: number; f: number; lit?: number; plate?: boolean}> =
({x, y, scale = 1, f, lit = 1, plate = true}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ContactShadow cx={0} cy={186} rx={188} ry={22} opacity={0.42} />
    <path d="M-168 -190H168V186H-168Z" fill="url(#steel19)" stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    <path d="M96 -190H168V186H96Z" fill={C.ink} opacity={0.42} />
    <RimLight d="M-168 -190H168" w={4} opacity={0.55} />
    {[0, 1, 2].map((r) => (
      <g key={r} transform={`translate(0 ${-118 + r * 118})`}>
        <rect x={-146} y={-46} width={292} height={92} rx={6} fill="#0C1A1C" stroke={C.ink} strokeWidth={5} />
        {[0, 1].map((c) => (
          <g key={c} transform={`translate(${-72 + c * 144} 0)`}>
            <circle r={36} fill="#08110F" stroke={C.ink} strokeWidth={4} />
            <g transform={`rotate(${(f * (5.4 + r * 0.7 + c * 0.4)) % 360})`}>
              {[0, 1, 2, 3, 4].map((b) => (
                <path key={b} d="M0 0 L26 -9 L23 9 Z" transform={`rotate(${b * 72})`} fill={C.steel} opacity={0.85} />
              ))}
              <circle r={7} fill={C.amberD} />
            </g>
            <circle r={36} fill="none" stroke={C.steel} strokeWidth={2} opacity={0.5} />
          </g>
        ))}
        {[0, 1, 2, 3].map((l) => (
          <circle key={l} cx={120} cy={-28 + l * 18} r={4}
            fill={l % 2 ? C.amber : C.cyan}
            opacity={lit * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(f / (6 + l * 2.7) + l)))} />
        ))}
      </g>
    ))}
    {/* cable bundle falling off the back */}
    <path d={`M150 150q54 ${34 + 5 * Math.sin(f / 31)} 96 96`} fill="none" stroke={C.ink} strokeWidth={13} />
    <path d={`M150 146q54 ${34 + 5 * Math.sin(f / 31)} 96 96`} fill="none" stroke="#2C4A44" strokeWidth={6} />
    {plate && (
      <g transform="translate(0 216)">
        <rect x={-104} y={-19} width={208} height={38} rx={5} fill="#0B1B1A" stroke={C.light} strokeWidth={3} />
        <text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={24} letterSpacing={1.5} fill={C.light}>GREENSPARC</text>
      </g>
    )}
  </g>
);

/** The two stencilled boxes, as they appear UNEXPLAINED on the powerhouse wall. */
const WallBoxes: React.FC<{x: number; y: number; scale?: number; f: number; op?: number}> = ({x, y, scale = 1, f, op = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={clamp(op)}>
    {[-1, 1].map((s, i) => (
      <g key={i} transform={`translate(${s * 104} 0)`}>
        <rect x={-92} y={-52} width={184} height={104} rx={5} fill="none" stroke={C.light} strokeWidth={4} opacity={0.5}
          strokeDasharray="14 9" strokeDashoffset={-(f * 0.5) % 4000} />
        <text x={0} y={-66} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={21} letterSpacing={1.5} fill={C.light} opacity={0.55}>
          {i ? 'MEASURED' : 'CLAIMED'}
        </text>
      </g>
    ))}
  </g>
);

const Turbine: React.FC<{x: number; y: number; scale?: number; f: number}> = ({x, y, scale = 1, f}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ContactShadow cx={0} cy={130} rx={196} ry={24} opacity={0.4} />
    <path d="M-176 -110H176V130H-176Z" fill="url(#steel19)" stroke={C.ink} strokeWidth={7} />
    <path d="M104 -110H176V130H104Z" fill={C.ink} opacity={0.4} />
    <circle cx={0} cy={10} r={92} fill="#0B1B1C" stroke={C.ink} strokeWidth={6} />
    <g transform={`translate(0 10) rotate(${(f * 3.1) % 360})`}>
      {[0, 1, 2, 3, 4, 5].map((b) => (
        <path key={b} d="M0 0 L66 -22 Q78 0 66 22 Z" transform={`rotate(${b * 60})`} fill={C.steel} stroke={C.ink} strokeWidth={3} />
      ))}
      <circle r={17} fill={C.amberD} stroke={C.ink} strokeWidth={4} />
    </g>
    {[0, 1, 2].map((i) => (
      <circle key={i} cx={-132 + i * 40} cy={-72} r={11} fill="#0B1B1C" stroke={C.steel} strokeWidth={3} />
    ))}
    <RimLight d="M-176 -110H176" w={4} opacity={0.5} />
  </g>
);

/** Water sheeting past, a continuous motion that spans any hold. */
const WaterSheet: React.FC<{x: number; y: number; w: number; h: number; f: number}> = ({x, y, w, h, f}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill="url(#water19)" opacity={0.85} />
    {Array.from({length: 7}).map((_, i) => (
      <path key={i}
        d={`M${x + 8} ${y + ((f * 6 + i * 130) % (h + 60)) - 30}q${w / 3} ${10 + 5 * Math.sin(f / 17 + i)} ${w / 2} 0t${w / 2 - 16} 0`}
        fill="none" stroke={C.light} strokeWidth={3} opacity={0.2} />
    ))}
  </g>
);

const Drip: React.FC<{x: number; y0: number; y1: number; f: number; at: number; dur?: number}> =
({x, y0, y1, f, at, dur = 26}) => {
  const t = clamp((f - at) / dur);
  if (t <= 0 || t >= 1) return null;
  const y = y0 + (y1 - y0) * (t * t);
  return <ellipse cx={x} cy={y} rx={5} ry={9 + 7 * t} fill={C.light} opacity={0.8} />;
};

const DieselStack: React.FC<{x: number; y: number; scale?: number; f: number; fire: number}> = ({x, y, scale = 1, f, fire}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ContactShadow cx={0} cy={8} rx={72} ry={12} opacity={0.4} />
    <path d="M-46 -210H46V4H-46Z" fill="url(#steel19)" stroke={C.ink} strokeWidth={6} />
    <path d="M22 -210H46V4H22Z" fill={C.ink} opacity={0.42} />
    {[0, 1, 2].map((i) => <path key={i} d={`M-46 ${-168 + i * 56}H46`} stroke={C.ink} strokeWidth={4} opacity={0.6} />)}
    <g opacity={clamp(fire)}>
      <ellipse cx={0} cy={-232} rx={30 + 8 * Math.sin(f / 5)} ry={44 + 12 * Math.sin(f / 4.1)} fill={C.amber} opacity={0.75} />
      <ellipse cx={0} cy={-238} rx={15 + 5 * Math.sin(f / 3.7)} ry={26} fill={C.light} opacity={0.6} />
      <ellipse cx={0} cy={-250} rx={120} ry={90} fill="url(#lamp19)" opacity={0.6} />
    </g>
  </g>
);

const Gauge: React.FC<{x: number; y: number; scale?: number; f: number; v: number; slamAt?: number}> =
({x, y, scale = 1, f, v, slamAt}) => {
  const kick = slamAt !== undefined ? entrance(f, 30, slamAt, {drop: 0, preset: {damping: 9, stiffness: 210, mass: 0.7}}).t : 1;
  const ang = -120 + 240 * clamp(v) * kick;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle r={62} fill="#0B1B1A" stroke={C.ink} strokeWidth={6} />
      <circle r={62} fill="none" stroke={C.steel} strokeWidth={3} opacity={0.7} />
      {Array.from({length: 9}).map((_, i) => (
        <path key={i} d="M0 -50V-40" stroke={i > 5 ? C.amber : C.light} strokeWidth={4} opacity={0.8}
          transform={`rotate(${-120 + i * 30})`} />
      ))}
      <g transform={`rotate(${ang})`}>
        <path d="M0 8 L-5 -46 L5 -46 Z" fill={C.amber} stroke={C.ink} strokeWidth={3} />
      </g>
      <circle r={9} fill={C.ink} />
      <text x={0} y={44} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={17} fill={C.light} opacity={0.75}>GAL</text>
    </g>
  );
};

const Bar: React.FC<{x: number; y: number; h: number; grow: number; block: number; f: number}> =
({x, y, h, grow, block, f}) => {
  const hh = h * clamp(grow);
  const bh = 52 * clamp(block);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-52} y={-h} width={104} height={h} rx={5} fill="none" stroke={C.light} strokeWidth={2} opacity={0.22} />
      <rect x={-52} y={-hh} width={104} height={hh} rx={5} fill={FCAST} opacity={0.32} stroke={FCAST} strokeWidth={3} />
      <rect x={-52} y={-bh} width={104} height={bh} rx={4} fill={C.amber}
        opacity={0.55 + 0.25 * Math.sin(f / 13)} stroke={C.amber} strokeWidth={3} />
    </g>
  );
};

const MapAK: React.FC<{f: number; bloom: number; thread: number}> = ({f, bloom, thread}) => {
  // A recognisable Alaska, drawn as one closed path: the Southeast panhandle, the
  // Gulf coast, the Alaska Peninsula reaching southwest, the Y-K delta, Seward and
  // the North Slope. The first rough cut drew a blob and a viewer cannot place a
  // dot on a blob.
  const AK =
    'M232,706 L318,676 L404,700 L470,672 L556,690 L642,660 L742,678 L836,652 ' +
    'L900,684 L934,742 L906,802 L842,826 L806,882 L836,930 L812,986 L742,1010 ' +
    'L690,1066 L612,1084 L556,1050 L496,1076 L452,1044 L398,1072 L352,1046 ' +
    'L300,1074 L262,1036 L286,978 L252,930 L280,872 L240,826 L262,766 Z';
  const PENINSULA = 'M262,1036 L206,1096 L150,1122 L92,1176 L46,1168 L78,1114 L142,1080 L200,1050 Z';
  const PANHANDLE = 'M812,986 L866,1036 L912,1104 L946,1178 L906,1188 L862,1120 L812,1058 Z';
  const ISLANDS = [[112, 1214], [70, 1236], [28, 1252], [176, 1174]];
  const dots = Array.from({length: 44}).map((_, i) => {
    const a = i * 2.399;
    const r = 96 + (i % 7) * 44 + (i % 3) * 22;
    return [568 + Math.cos(a) * r * 1.02, 878 + Math.sin(a) * r * 0.62] as [number, number];
  });
  return (
    <g>
      <path d={AK} fill="url(#grd19)" stroke={C.moss} strokeWidth={6} strokeLinejoin="round" />
      <path d={PENINSULA} fill="url(#grd19)" stroke={C.moss} strokeWidth={5} strokeLinejoin="round" />
      <path d={PANHANDLE} fill="url(#grd19)" stroke={C.moss} strokeWidth={5} strokeLinejoin="round" />
      {ISLANDS.map(([ix, iy], i) => (
        <ellipse key={i} cx={ix} cy={iy} rx={18 - i * 2} ry={8} fill="url(#grd19)" stroke={C.moss} strokeWidth={4} />
      ))}
      {dots.map(([dx, dy], i) => {
        const on = clamp((bloom - i / dots.length) * 4);
        if (on <= 0.02) return null;
        return (
          <g key={i} opacity={on}>
            <circle cx={dx} cy={dy} r={5 + 3 * on} fill={C.amber} opacity={0.5 + 0.4 * Math.sin(f / 11 + i)} />
            <path d={`M${dx - 5} ${dy + 12}h10v12h-10Z`} fill={C.amberD} stroke={C.ink} strokeWidth={2} opacity={0.85} />
          </g>
        );
      })}
      <circle cx={742} cy={952} r={17} fill={C.amber} stroke={C.ink} strokeWidth={4} />
      <circle cx={742} cy={952} r={17 + 28 * ((f / 40) % 1)} fill="none" stroke={C.amber} strokeWidth={3}
        opacity={0.55 * (1 - ((f / 40) % 1))} />
      <text x={742} y={1010} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={22}
        letterSpacing={1.5} fill={C.amber}>CORDOVA</text>
      {thread > 0.02 && (
        <path d={`M726 946 q${-80 * thread} ${-34 * thread} ${-132 * thread} ${-14 * thread}`}
          fill="none" stroke={FCAST} strokeWidth={5} opacity={0.85 * (1 - thread * 0.45)} strokeDasharray="10 9" />
      )}
    </g>
  );
};

/** THE TWIN'S SILHOUETTE. lib/absence and lib/simulation both stroke a path with
 *  no fill, so whatever the path omits simply is not there. A rounded dome read as
 *  an egg in the first rough cut. This carries the whole subject: knit cap, head,
 *  shoulders, the furnace-window chest, both arms and both boots, so a viewer sees
 *  a copy of the hero rather than a shape. */
const TWIN_BODY =
  'M-64,-206 q-4,-34 22,-44 q42,-14 84,0 q26,10 22,44 ' +
  'q28,10 30,44 l0,126 q0,26 -22,26 l-6,0 l0,96 l-132,0 l0,-96 l-6,0 ' +
  'q-22,0 -22,-26 l0,-126 q2,-34 30,-44 Z';
const TWIN_ARM_L = 'M-94,-150 q-34,10 -38,54 q-4,42 10,72 q10,20 26,14';
const TWIN_ARM_R = 'M94,-150 q34,10 38,54 q4,42 -10,72 q-10,20 -26,14';
const TWIN_BOOT_L = 'M-58,36 q-22,4 -24,26 q-2,18 18,18 l34,0 q10,0 10,-18 l0,-26 Z';
const TWIN_BOOT_R = 'M58,36 q22,4 24,26 q2,18 -18,18 l-34,0 q-10,0 -10,-18 l0,-26 Z';
const TWIN_WINDOW = 'M-38,-122 l76,0 l0,84 l-76,0 Z';

/** Draws the whole twin as a stated model: every part goes through Simulated, so
 *  none of it casts, contacts or reads as present. */
const Twin: React.FC<{x: number; y: number; scale?: number; f: number; fidelity: number; drawn: number; sag?: number}> =
({x, y, scale = 1, f, fidelity, drawn, sag = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <Simulated d={TWIN_BODY} fidelity={fidelity} f={f} drawn={drawn} color={FCAST} strokeWidth={3.6} occupied={0.45 * drawn} />
    <Simulated d={TWIN_WINDOW} fidelity={fidelity} f={f} drawn={drawn} color={FCAST} strokeWidth={3} occupied={0.8 * drawn} phase={0.31} />
    <g transform={`translate(0 ${18 * sag})`} opacity={1 - 0.35 * sag}>
      <Simulated d={TWIN_ARM_L} fidelity={fidelity * (1 - sag)} f={f} drawn={drawn} color={FCAST} strokeWidth={3.2} phase={0.57} />
      <Simulated d={TWIN_ARM_R} fidelity={fidelity * (1 - sag)} f={f} drawn={drawn} color={FCAST} strokeWidth={3.2} phase={0.73} />
    </g>
    <g transform={`translate(0 ${26 * sag})`} opacity={1 - 0.5 * sag}>
      <Simulated d={TWIN_BOOT_L} fidelity={fidelity * (1 - sag)} f={f} drawn={drawn} color={FCAST} strokeWidth={3} phase={0.11} />
      <Simulated d={TWIN_BOOT_R} fidelity={fidelity * (1 - sag)} f={f} drawn={drawn} color={FCAST} strokeWidth={3} phase={0.19} />
    </g>
  </g>
);

const Shot: React.FC<{n: number; from: number; dur: number; beats: Beat[]}> = ({n, from, dur, beats}) => {
  const local = useCurrentFrame();
  const voice = useVoice();
  const f = local + from;
  const at = (id: number) => (beats.find((b) => b.id === id)?.at ?? 0) * 30;
  const q = (id: number, d = 24, lag = 0) => ease(f, at(id) + lag, d);
  const pop = (id: number) => entrance(f, 30, at(id), {drop: 0, preset: {damping: 13, stiffness: 160, mass: 0.8}}).t;
  const travel = ease(local, 0, Math.max(40, dur));
  const acc = voice.accentAt(f);

  let picture: React.ReactNode;

  if (n === 1) {
    picture = (
      <g>
        <Backdrop f={f} />
        <path d={`M700 -120q-40 420 40 700`} fill="none" stroke={C.ink} strokeWidth={96} />
        <path d={`M700 -120q-40 420 40 700`} fill="none" stroke="url(#steel19)" strokeWidth={78} />
        <ellipse cx={330} cy={1340} rx={430} ry={560} fill="url(#lamp19)" opacity={0.55} />
        {/* The rack carried its own nameplate below the chassis, which put the label at
         *  master y 1481: inside the 9:16 master, straight through the square crop's
         *  bottom edge at 1500. The LinkedIn cut showed half the word GREENSPARC and the
         *  170 kW plate not at all. Both labels now sit in the band between the headline
         *  and the rack, where BOTH cuts read them. */}
        <Rack x={520} y={1035} scale={1.32} f={f} lit={1} plate={false} />
        <Drip x={742} y0={600} y1={1246} f={f} at={at(2)} />
        <Head text="SERVERS INSIDE" y={585} p={q(1, 20)} />
        <Head text="THE POWERHOUSE" y={654} p={q(1, 20, 6)} />
        <Plate text="GREENSPARC" x={250} y={725} size={26} p={q(1, 18, 10)} />
        <g transform={`translate(${-420 + 420 * q(3, 22)} 0)`} opacity={q(3, 18)}>
          <Plate text="170 kW  ·  PER CLEANTECHNICA" x={700} y={725} size={26} tone="amber" />
        </g>
      </g>
    );
  } else if (n === 2) {
    picture = (
      <g>
        <Backdrop f={f} grate={false} />
        <WaterSheet x={-60} y={-100} w={300} h={2100} f={f} />
        <g opacity={q(5, 26)}><WallBoxes x={700} y={560} scale={1.02} f={f} /></g>
        <g transform={`translate(0 ${-140 + 140 * travel})`}>
          <Rack x={420} y={620} scale={0.62} f={f} plate={false} />
        </g>
        <Turbine x={560} y={1290} scale={1.18} f={f} />
        <path d={`M560 1140 q${150 + 10 * Math.sin(f / 23)} -120 250 -40`} fill="none" stroke={C.cyan} strokeWidth={9} opacity={0.35 * q(6)} />
        <ellipse cx={300} cy={1560} rx={360} ry={230} fill="url(#lamp19)" opacity={0.4} />
        <Drip x={742} y0={640} y1={612 + 110} f={f} at={at(7)} dur={20} />
        <Plate text="COOLED BY THE SAME WATER" y={1660} size={30} p={q(6, 22)} />
        <Plate text="REMEMBER THEM" y={1730} size={30} tone="amber" p={q(7, 18)} />
      </g>
    );
  } else if (n === 3) {
    picture = (
      <g>
        <NightRidge f={f} />
        <Shore f={f} y={1180} reflectX={620} />
        <g transform="translate(580 1230) scale(1.46)">
          <RunOfRiver f={f} flow={0.8} gate={0.7} spill={0.18} lamp={1} lampColor={C.amber} water="#2A6B7E" />
        </g>
        {Array.from({length: 11}).map((_, i) => (
          <circle key={i} cx={760 + i * 26} cy={1150 - (i % 3) * 14} r={4} fill={C.amber} opacity={0.55 + 0.35 * Math.sin(f / 9 + i)} />
        ))}
        <Head text="CORDOVA" y={560} p={q(8, 20)} />
        <Plate text="NO WIRE OUT" y={1780} size={34} tone="amber" p={q(9, 22)} />
      </g>
    );
  } else if (n === 4) {
    // Shot 4 covers L4 alone: "About eighty percent hydro, from two creeks. Ten
    // point eight megawatts of diesel behind it." A two-up with a hard centre
    // seam, which is the recipe book's COMPARISON, and the share bar beneath it.
    const seam = q(10, 26), share = q(10, 30, 10);
    picture = (
      <g>
        <NightRidge f={f} town={false} />
        {/* the water side */}
        <g>
          <path d="M-200 900H540V2100H-200Z" fill="url(#water19)" opacity={0.85} />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M-180 ${960 + i * 150}q160 ${10 + 6 * Math.sin(f / 19 + i)} 340 0t340 0`}
              fill="none" stroke={C.light} strokeWidth={3} opacity={0.2} />
          ))}
          <g transform="translate(300 1300) scale(0.66)">
            <RunOfRiver f={f} flow={0.9} gate={0.9} spill={0.12} lamp={0.8} lampColor={C.amber} water="#2A6B7E" />
          </g>
        </g>
        {/* the fuel side */}
        <g>
          <path d="M540 900H1300V2100H540Z" fill="url(#grd19)" />
          <DieselStack x={860} y={1560} scale={1.02} f={f} fire={0.22 + 0.16 * Math.sin(f / 11)} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={640 + i * 56} y={1500 + (i % 2) * 14} width={44} height={58} rx={5}
              fill={C.amberD} stroke={C.ink} strokeWidth={4} opacity={0.9} />
          ))}
        </g>
        {/* the hard centre seam */}
        <path d={`M540 ${900 - 120 * seam}V2100`} stroke={C.ink} strokeWidth={16} />
        <path d={`M540 ${900 - 120 * seam}V2100`} stroke={C.light} strokeWidth={5} opacity={0.55} />
        <Head text="TWO CREEKS" y={585} p={q(9, 20)} />
        <Head text="AND A BACKSTOP" y={654} p={q(9, 20, 6)} />
        {/* the share bar: eighty percent, drawn rather than asserted */}
        <g opacity={share} transform={`translate(0 ${20 - 20 * share})`}>
          <rect x={120} y={700} width={840} height={56} rx={8} fill="none" stroke={C.light} strokeWidth={4} opacity={0.5} />
          <rect x={124} y={704} width={672 * share} height={48} rx={6} fill="#2A6B7E" stroke={C.cyan} strokeWidth={3} />
          <rect x={124 + 672 * share} y={704} width={168 * share} height={48} rx={6} fill={C.amberD} stroke={C.amber} strokeWidth={3} />
          <Plate text="ABOUT 80% HYDRO" x={330} y={820} size={26} tone="cyan" />
          <Plate text="10.8 MW DIESEL" x={800} y={820} size={26} tone="amber" />
        </g>
      </g>
    );
  } else if (n === 5) {
    const fire = q(12, 10);
    picture = (
      <g>
        <NightRidge f={f} town={false} />
        <path d="M-200 1240H1300V2100H-200Z" fill="url(#grd19)" />
        <path d="M-200 1240 L1300 1180" stroke={C.moss} strokeWidth={6} opacity={0.6} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M${-140 + i * 230} 1260 L${-300 + i * 280} 2100`} stroke={C.moss} strokeWidth={4} opacity={0.2} />
        ))}
        {/* power poles and a sagging span: this is a grid story, so draw the grid */}
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${120 + i * 400} 1250)`}>
            <path d="M0 0v-300" stroke={C.ink} strokeWidth={13} />
            <path d="M0 -300v-8" stroke="#2C4A44" strokeWidth={9} />
            <path d="M-56 -258h112" stroke={C.ink} strokeWidth={9} />
            {[-46, 46].map((k) => <circle key={k} cx={k} cy={-266} r={7} fill="#2C4A44" stroke={C.ink} strokeWidth={3} />)}
            {i < 2 && (
              <path d={`M46 -266 q200 ${58 + 6 * Math.sin(f / 31 + i)} 354 0`} fill="none" stroke={C.ink} strokeWidth={5} opacity={0.85} />
            )}
          </g>
        ))}
        {/* scrub and rock so the ground plane has objects on it */}
        {Array.from({length: 26}).map((_, i) => {
          const xx = -70 + i * 47 + (i % 3) * 13;
          const yy = 1320 + ((i * 97) % 540);
          return <path key={i} d={`M${xx} ${yy} q10 ${-14 - (i % 4) * 7} 22 0 Z`} fill="#12302A" stroke={C.ink} strokeWidth={3} opacity={0.85} />;
        })}
        <DieselStack x={880} y={1250} scale={0.92} f={f} fire={fire} />
        <g transform={`translate(0 ${6 * Math.sin(f / 37)})`}>
          <Sourdough frame={f} x={420} y={1250} scale={1.28} emotion={fire > 0.5 ? 'faltering' : 'proud'}
            glow={1 - 0.55 * fire} accent={acc} />
        </g>
        <Gauge x={620} y={1080} scale={0.92} f={f} v={0.2 + 0.62 * fire} slamAt={at(12)} />
        <Head text="GUESS WRONG" y={585} p={q(11, 20)} />
        <Plate text="IT BURNS FUEL" y={1640} size={34} tone="amber" p={q(12, 16)} />
        <g opacity={q(13, 20)}>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={760 + i * 34} y={1560 - 30 * Math.abs(Math.sin(f / 13 + i))} width={26} height={30} rx={3}
              fill={C.amber} stroke={C.ink} strokeWidth={3} opacity={0.85} />
          ))}
          <Plate text="GALLONS" x={820} y={1690} size={28} tone="amber" />
        </g>
      </g>
    );
  } else if (n === 6) {
    const build = q(14, 30), twin = q(16, 34);
    picture = (
      <g>
        <Backdrop f={f} warm={0.55} />
        <Rain f={f} density={0.5} />
        {/* An acronym and its expansion have to stack in reading order. The second
         *  expansion line was sitting ABOVE the acronym and the money row was cutting
         *  through it, so the square cut showed AURORA-AI sandwiched illegible between
         *  two plates. Four rows, top to bottom, with air between them. */}
        <g opacity={build}>
          <Plate text="AURORA-AI" y={540} size={46} tone="cyan" />
          <Plate text="ALASKA UTILITY RESILIENCE AND" y={607} size={24} tone="cyan" />
          <Plate text="OPTIMIZATION USING REAL-TIME AI" y={659} size={24} tone="cyan" />
        </g>
        <g opacity={q(15, 22)}>
          <Plate text="$725,000  ·  PER UAF" x={330} y={735} size={26} />
          <Plate text="GENESIS MISSION  ·  EO 14363" x={770} y={735} size={26} />
        </g>
        <g>
          <Sourdough frame={f} x={296} y={1268} scale={0.78} emotion="confident" glow={0.72} accent={acc} />
          <Twin x={700} y={1268} scale={0.86} f={f} fidelity={0.3 + 0.55 * twin} drawn={twin} />
          <g opacity={twin * 0.8}>
            {[0, 1, 2, 3].map((i) => (
              <path key={i} d={`M${384 + i * 6} ${1040 + i * 58} H${612 - i * 6}`}
                stroke={FCAST} strokeWidth={3} strokeDasharray="9 8"
                strokeDashoffset={-(f * 1.4 + i * 17) % 4000} opacity={0.5} />
            ))}
          </g>
        </g>
        <Bar x={720} y={1330} h={300} grow={twin} block={q(16, 26, 20)} f={f} />
        {/* This list was at 1560 to 1756, entirely below the square crop, so the cut that
         *  actually ships on LinkedIn held a still frame for four seconds while the 9:16
         *  built a four-line list. INTENDED, NOT MEASURED is the honesty beat of the
         *  film; it does not get to be a TikTok-only element. */}
        <g opacity={q(17, 18)}>
          <Plate text="FORECAST DEMAND" x={540} y={806} size={24} tone="cyan" p={pop(17)} />
          <Plate text="DETECT ABNORMAL CONDITIONS" x={540} y={864} size={24} tone="cyan" p={q(17, 16, 6)} />
          <Plate text="OPTIMIZE HYDRO AND DIESEL" x={540} y={922} size={24} tone="cyan" p={q(17, 16, 12)} />
          <Plate text="INTENDED, NOT MEASURED" x={540} y={980} size={24} tone="amber" p={q(17, 16, 20)} />
        </g>
      </g>
    );
  } else if (n === 7) {
    const drain = q(18, 26);
    picture = (
      <g>
        <Backdrop f={f} warm={0.45} />
        <g>
          <Twin x={540} y={1246} scale={1.12} f={f} fidelity={1 - 0.72 * drain} drawn={1 - 0.42 * drain} sag={drain} />
          <g opacity={drain * 0.9}>
            <path d={`M416 ${1250 + 30 * drain} H664`} stroke={C.ink} strokeWidth={9} opacity={0.5} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <path key={i} d={`M${424 + i * 42} ${1258 + 30 * drain} l26 42`} stroke={C.light}
                strokeWidth={3} opacity={0.18} />
            ))}
          </g>
        </g>
        <Head text="IT HASN'T STARTED" y={612} p={q(18, 18)} />
        {/* 1500 is exactly the square crop's bottom edge, so PHASE 1 was sliced in half
         *  and 9 MONTHS sat below the world. They are the two facts of the shot. */}
        <g transform={`translate(0 ${-30 + 30 * pop(19)})`} opacity={q(19, 12)}>
          <Plate text="PHASE 1  ·  STARTS OCT 1" y={700} size={28} tone="amber" />
          <Plate text="9 MONTHS  ·  RESEARCH" y={768} size={28} tone="amber" />
        </g>
      </g>
    );
  } else if (n === 8) {
    // Shot 8 covers L11 to L13: "Now, those servers" / "Just a load on the same
    // grid" / "Whatever it predicts, it predicts them too". It has to carry the
    // rack, the reveal that the block in the bar IS the rack, and then the
    // forecast trace that has to include it. One shot, three moves.
    const grow = q(21, 30), reveal = q(21, 22, 14);
    const draw = q(24, 30), slide = q(25, 24);
    const obs: Array<[number, number]> = [[0, 40], [70, 10], [140, 54], [210, 0], [280, 34]];
    const pred: Array<[number, number]> = [[280, 34], [350, 8], [420, 46], [490, 18], [560, 40]];
    const toTrace = q(24, 26);
    picture = (
      <g>
        <Backdrop f={f} />
        <path d="M-200 1700H1300V2100H-200Z" fill={C.ink} opacity={0.6} />
        {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${-100 + i * 240} 1700 L${-260 + i * 300} 2100`} stroke={C.steel} strokeWidth={4} opacity={0.22} />)}
        <ellipse cx={300} cy={1520} rx={420} ry={260} fill="url(#lamp19)" opacity={0.42 * (1 - 0.6 * toTrace)} />
        <g transform={`translate(${-60 * toTrace} ${180 * toTrace}) scale(${1 - 0.52 * toTrace})`}
           opacity={1 - 0.18 * toTrace}>
          <Rack x={360} y={1180} scale={1.22} f={f} plate={false} />
        </g>
        <g transform={`translate(${-140 * toTrace} ${-120 * toTrace}) scale(${1 - 0.28 * toTrace})`}>
          <Bar x={800} y={1560} h={640} grow={grow} block={reveal} f={f} />
        </g>
        <g opacity={reveal * (1 - toTrace)}>
          <Plate text="THE LOAD WAS ALWAYS THERE" x={760} y={880} size={27} tone="amber" />
        </g>
        <g opacity={q(22, 12) * (1 - toTrace)} transform={`translate(${-24 + 24 * pop(22)} 0)`}>
          <Plate text="NOT PART OF THIS PROJECT" x={430} y={700} size={28} />
          <Plate text="GREENSPARC, 2024" x={430} y={764} size={28} />
        </g>
        <g opacity={toTrace}>
          {/* Raised 80px: the 170 kW chip that slides in under the trace was landing at
           *  1336, behind the caption bar, and the axis labels were at 1700, below the
           *  square entirely. An unlabelled forecast chart is not a forecast chart. */}
          <g transform="translate(300 1160)">
            {[0, 1, 2, 3].map((i) => <path key={i} d={`M0 ${-40 + i * 40}H600`} stroke={C.light} strokeWidth={2} opacity={0.12} />)}
            <ForecastTrace observed={obs} predicted={pred} spread={92} f={f} drawn={draw} observedDrawn={q(24, 20)}
              nowLabel="NOW" strokeWidth={6} />
            <g opacity={slide} transform={`translate(${290 * slide} 0)`}>
              <rect x={-40} y={96} width={120} height={40} rx={5} fill={C.amber} stroke={C.ink} strokeWidth={3} opacity={0.9} />
              <text x={20} y={124} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={20} fill={C.ink}>170 kW</text>
            </g>
          </g>
          <Plate text="OBSERVED" x={330} y={1040} size={26} tone="amber" p={q(24, 16)} />
          <Plate text="CLAIMED" x={760} y={1040} size={26} tone="cyan" p={q(24, 16, 10)} />
        </g>
        <Head text="NOW, THOSE SERVERS" y={592} p={q(20, 16) * (1 - toTrace)} />
        <Head text="IT PREDICTS THEM TOO" y={592} p={q(25, 18) * toTrace} />
      </g>
    );
  } else if (n === 9) {
    const settled = 0;
    picture = (
      <g>
        <Backdrop f={f} warm={0.5} />
        <Rain f={f} density={0.6} />
        <g transform="translate(540 940) scale(1.34)">
          <Reconcile predicted={0} actual={0} settled={settled} predictedLabel="9 MONTHS" f={f}
            unit="GALLONS SAVED" pendingLabel="NOT YET MEASURED" />
        </g>
        <g opacity={q(26, 20)}>
          <Plate text="BY NEXT JUNE" y={620} size={34} tone="cyan" />
        </g>
        <Sourdough frame={f} x={540} y={1480} scale={0.92} emotion="confident" glow={0.62} accent={acc} />
        <g opacity={q(30, 20)} transform={`translate(0 ${18 - 18 * q(30, 20)})`}>
          <Plate text='"A REALLY SHORT PERIOD' y={1700} size={27} />
          <Plate text='OF PERFORMANCE"' y={1758} size={27} />
          <Plate text="RICHARD WIES  ·  UAF" y={1822} size={24} tone="amber" />
        </g>
      </g>
    );
  } else if (n === 10) {
    picture = (
      <g>
        <NightRidge f={f} />
        <Shore f={f} y={1180} reflectX={660} boats={false} />
        <g transform="translate(600 1250) scale(1.52)">
          <RunOfRiver f={f} flow={0.95} gate={0.95} spill={0.2 + 0.7 * q(31, 26)} lamp={1} lampColor={C.amber} water="#2A6B7E" />
        </g>
        <Rain f={f} density={0.7} />
        <Head text="THE EASY CASE" y={560} p={q(30, 18)} />
        <Plate text="HYDRO  ·  ENGINEERS  ·  GOOD RECORDS" y={1790} size={26} p={q(30, 20, 10)} />
        <Plate text="SPILLING PAST UNUSED" x={300} y={1690} size={25} tone="cyan" p={q(31, 20)} />
      </g>
    );
  } else if (n === 11) {
    picture = (
      <g>
        <NightRidge f={f} town={false} />
        <path d="M-200 1240H1300V2100H-200Z" fill="url(#sky19)" opacity={0.85} />
        {/* a graticule and sea hatching: the ocean is a chart, not a void */}
        <g opacity={0.5}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <path key={i} d={`M-200 ${480 + i * 210}H1300`} stroke={C.moss} strokeWidth={2} opacity={0.35} strokeDasharray="14 18" />
          ))}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M${-40 + i * 220} 380V1760`} stroke={C.moss} strokeWidth={2} opacity={0.28} strokeDasharray="14 18" />
          ))}
          {Array.from({length: 40}).map((_, i) => {
            const xx = ((i * 179) % 1400) - 150;
            const yy = 420 + ((i * 233) % 1280);
            return <path key={i} d={`M${xx} ${yy}q22 ${4 + 3 * Math.sin(f / 15 + i)} 44 0`} fill="none"
              stroke={C.light} strokeWidth={2} opacity={0.09} />;
          })}
        </g>
        <MapAK f={f} bloom={q(33, 40)} thread={q(34, 26)} />
        <Head text="193 COMMUNITIES" y={585} p={q(33, 18)} />
        <Plate text="82,000 ALASKANS  ·  PER AEA" y={1640} size={28} tone="amber" p={q(33, 20, 12)} />
        <Plate text="LEAST DATA TO BUILD ONE" y={1712} size={28} tone="cyan" p={q(34, 20)} />
      </g>
    );
  } else {
    const narrow = q(37, 40);
    picture = (
      <g>
        <Backdrop f={f} grate={false} />
        <path d="M-200 1720H1300V2100H-200Z" fill="url(#water19)" opacity={0.75} />
        <g>
          {/* the door frame, so the light has an edge rather than being a fill */}
          <path d={`M312 542H${748 - 330 * narrow}V1558H312Z`} fill={C.ink} />
          <path d={`M330 560H${730 - 330 * narrow}V1540H330Z`} fill={C.amberD} />
          <path d={`M346 578H${714 - 330 * narrow}V1522H346Z`} fill={C.amber} opacity={0.30 + 0.12 * Math.sin(f / 29)} />
          {/* mullions and a lit threshold: three tones and a real horizon inside the slot */}
          {[0, 1, 2].map((i) => {
            const mx = 400 + i * 108 - 110 * narrow;
            return mx < 700 - 330 * narrow
              ? <path key={i} d={`M${mx} 578V1522`} stroke={C.amberD} strokeWidth={9} opacity={0.75} />
              : null;
          })}
          <path d={`M346 1424H${714 - 330 * narrow}V1522H346Z`} fill={C.ink} opacity={0.38} />
          <path d={`M346 1424H${714 - 330 * narrow}`} stroke={C.light} strokeWidth={4} opacity={0.35} />
          <ellipse cx={530 - 165 * narrow} cy={1050} rx={340 - 150 * narrow} ry={612} fill="url(#lamp19)" opacity={0.42} />
        </g>
        <g opacity={0.9}><Rack x={520} y={1180} scale={0.62} f={f} plate={false} /></g>
        <WallBoxes x={800} y={860} scale={0.82} f={f} op={0.85} />
        <Drip x={800} y0={700} y1={922} f={f} at={at(36)} dur={22} />
        <Rain f={f} density={0.8} />
        <Plate text="WATCH FOR GALLONS" y={585} size={36} tone="amber" p={q(35, 20)} />
        {/* The closing question is the whole point of the last shot and it was living at
         *  1730, below the square crop, in the sparsest frame of the film. */}
        <g opacity={q(37, 20)}>
          <Plate text="WHAT WOULD CONVINCE YOU" y={950} size={30} />
          <Plate text="IT WORKED?" y={1016} size={30} />
        </g>
      </g>
    );
  }

  const lens = [
    {z: 40 - 34 * travel, rotY: -7 + 5 * travel, rotX: -3, y: 6},
    {z: -80 + 70 * travel, rotX: 12 - 7 * travel, rotY: 4, y: -18 + 16 * travel},
    {z: -180 + 110 * travel, rotX: -6 + 4 * travel, rotY: 9 - 6 * travel, y: 18},
    {z: 10 + 30 * travel, rotX: 6 - 4 * travel, rotY: -6 + 4 * travel, y: 4},
    {z: -60 + 52 * travel, rotY: 8 - 6 * travel, rotX: -4, y: 10},
    {z: 20 + 22 * travel, rotY: -5 + 4 * travel, rotX: 3, y: -6},
    {z: -110 + 82 * travel, rotX: 14 - 6 * travel, rotY: -9 + 6 * travel, y: -14},
    {z: -30 + 34 * travel, rotX: -8 + 5 * travel, rotY: 6 - 5 * travel, y: 12},
    {z: 30 - 24 * travel, rotY: -4 + 3 * travel, rotX: -2, y: 6},
    {z: -150 + 96 * travel, rotY: 11 - 8 * travel, rotX: 5 - 3 * travel, y: 14},
    {z: -220 + 130 * travel, rotX: -10 + 6 * travel, rotY: -7 + 5 * travel, y: 22},
    {z: 15 + 40 * travel, rotY: 5 - 4 * travel, rotX: -3, y: 8},
  ];
  const camera = lens[n - 1];

  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Stage3D camera={camera} background={C.ink}>
        <Plane z={650}>
          <SVG><Defs />{n === 3 || n === 10 || n === 11 ? <g /> : <path d="M-300 -300H1400V2200H-300Z" fill="url(#sky19)" opacity={0.6} />}</SVG>
        </Plane>
        <Plane z={0}><SVG><Defs />{picture}</SVG></Plane>
        <Plane z={-170}>
          <SVG>{n !== 11 && <Rain f={f} density={n === 6 || n === 8 || n === 9 ? 0.35 : 0.8} />}</SVG>
        </Plane>
      </Stage3D>
      <SVG>
        <g opacity={0.72}>
          <text x={72} y={505} fontFamily={MONO} fontWeight={700} fontSize={26} letterSpacing={3} fill={C.light}>ALASKA.AI</text>
        </g>
      </SVG>
      <GradeLayer f={f} bloom={0.03} vignette={0.12} grain={0.02} warmth={0.02} />
    </AbsoluteFill>
  );
};

const captions = z.array(z.object({t: z.number(), d: z.number(), text: z.string()}));
export const ep0919Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep0919Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:100 900;font-display:block;}`}</style>
);

const Captions: React.FC<{cues: Props['captions']}> = ({cues}) => {
  const t = useCurrentFrame() / 30;
  const c = cues.find((x) => t >= x.t && t < x.t + x.d);
  if (!c) return null;
  const words = c.text.split(' ');
  const rows: string[] = [];
  let row = '';
  for (const w of words) {
    if ((row + ' ' + w).trim().length > 34 && row) { rows.push(row); row = w; } else row = (row + ' ' + w).trim();
  }
  if (row) rows.push(row);
  const fs = rows.length > 2 ? 32 : 39;
  return (
    <SVG>
      <rect x={68} y={1336} width={944} height={136} rx={16} fill="#06100E" stroke={C.light} strokeWidth={3} opacity={0.96} />
      {rows.slice(0, 3).map((s, i) => (
        <text key={i} x={540}
          y={rows.length === 1 ? 1420 : rows.length === 2 ? 1390 + i * 49 : 1378 + i * 37}
          textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={fs} fill={C.light}>{s}</text>
      ))}
    </SVG>
  );
};

export const Ep0919: React.FC<Props> = ({captions = [], scenes, beats, credits, mouth = [], accents = []}) => {
  const fallback = [0, 7, 17.5, 27, 38, 49, 56, 67, 75, 89, 96, 109, 120].map((x) => Math.round(x * 30));
  const slots = scenes ?? fallback.slice(0, -1).map((from, i) => ({from, dur: fallback[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={i + 1} from={s.from} dur={s.dur} beats={bs} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><Captions cues={captions} /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
