import React from 'react';
import {INK, ContactShadow, tones, FormGradient, RimLight} from './lighting';
import {MONO, monoW, rnd} from './prospect';

// DEPOT (2026-10-29, "The Reactor Is Still a Dotted Line"). A freight depot at twenty below, dusk.
// Aubergine sky, a raspberry horizon band, blue-white snow, manila shipping tags, ember Sourdough.
// The unknown is ALWAYS a dashed ice-cyan outline with no fill and no shadow. Gold is for money only,
// stamp red only for NOT STATED. NuSun is never drawn as a solid: no document states its size.
export const DEP = {
  sky0: '#1E1230', sky1: '#2B1B3F', band: '#9A4A78', band2: '#D9795F',
  snow: '#CBD5EC', snowShade: '#8E9CC4', snowHi: '#F4F8FF', ink: INK,
  manila: '#E9D08F', manilaShade: '#C9A95A', manilaDeep: '#A98B3E', paper: '#F3EBD7',
  cyan: '#8FE3F2', red: '#D93A3A', gold: '#F2C14E', goldDeep: '#B8860B', wood: '#7A5236', woodDark: '#4B3222',
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** the far world: sky, band, ridge, sheds, a pole line, drifting snow, and the ground to the bottom */
export const DepotBG: React.FC<{f: number; horizon?: number; id?: string; dim?: number; warmLeft?: boolean}> = ({f, horizon = 1000, id = 'dp', dim = 0, warmLeft = true}) => {
  const ridge: string[] = [];
  for (let i = 0; i <= 18; i++) {
    const x = i * 60;
    const y = horizon - 70 - 55 * rnd(i * 7 + 3) - 40 * Math.sin(i / 2.6);
    ridge.push(`${i === 0 ? 'M' : 'L'} ${x},${y}`);
  }
  const ridgeD = `${ridge.join(' ')} L 1080,${horizon + 4} L 0,${horizon + 4} Z`;
  const flakes = Array.from({length: 46}, (_, i) => {
    const sp = 0.5 + rnd(i * 5 + 1) * 1.4;
    const x = ((rnd(i * 3 + 2) * 1200 + f * sp * 0.9) % 1200) - 60;
    const y = ((rnd(i * 11 + 4) * 1900 + f * sp * 1.7) % 1960) - 20;
    return <circle key={i} cx={x} cy={y} r={1.6 + rnd(i * 13) * 2.4} fill="#FFFFFF" opacity={0.25 + 0.4 * rnd(i * 17)} />;
  });
  const poles = [90, 420, 770, 1090];
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={DEP.sky0} />
          <stop offset="0.55" stopColor={DEP.sky1} />
          <stop offset="0.86" stopColor="#5A2E58" />
          <stop offset="1" stopColor={DEP.band} />
        </linearGradient>
        <linearGradient id={`${id}-gr`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B9C4E4" />
          <stop offset="0.25" stopColor={DEP.snow} />
          <stop offset="1" stopColor={DEP.snowShade} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.2" cy="1" r="0.8">
          <stop offset="0" stopColor={DEP.band2} stopOpacity={0.75} />
          <stop offset="1" stopColor={DEP.band2} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={horizon + 6} fill={`url(#${id}-sky)`} />
      {warmLeft && <ellipse cx={120} cy={horizon - 10} rx={620} ry={300} fill={`url(#${id}-glow)`} />}
      {Array.from({length: 22}, (_, i) => (
        <circle key={i} cx={rnd(i * 9 + 5) * 1080} cy={rnd(i * 4 + 1) * (horizon - 380)} r={1.5 + rnd(i) * 1.6} fill="#FFFFFF" opacity={0.25 + 0.3 * Math.abs(Math.sin(f / (30 + i * 3) + i))} />
      ))}
      <path d={ridgeD} fill="#3B2850" stroke={INK} strokeWidth={4} />
      <path d={ridgeD} fill="#53365E" opacity={0.35} transform="translate(0,22)" />
      {/* sheds with lit windows */}
      {[[150, 1], [700, 0.8]].map(([sx, ss], i) => (
        <g key={i} transform={`translate(${sx},${horizon + 2}) scale(${ss})`}>
          <rect x={-90} y={-92} width={180} height={92} fill="#4A3358" stroke={INK} strokeWidth={5} />
          <path d="M-100,-92 L0,-132 L100,-92 Z" fill="#35223F" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          {[-52, 14].map((wx, k) => <rect key={k} x={wx} y={-66} width={36} height={30} fill={DEP.band2} stroke={INK} strokeWidth={3} opacity={0.8 + 0.2 * Math.sin(f / 19 + k + i)} />)}
        </g>
      ))}
      {/* the pole line */}
      {poles.map((px, i) => (
        <g key={i}>
          <rect x={px - 4} y={horizon - 150} width={8} height={152} fill={DEP.woodDark} stroke={INK} strokeWidth={2.5} />
          <rect x={px - 30} y={horizon - 144} width={60} height={6} fill={DEP.woodDark} stroke={INK} strokeWidth={2} />
        </g>
      ))}
      {poles.slice(0, -1).map((px, i) => (
        <path key={i} d={`M ${px - 22},${horizon - 140} Q ${(px + poles[i + 1]) / 2},${horizon - 100 + 6 * Math.sin(f / 40 + i)} ${poles[i + 1] - 22},${horizon - 140}`} stroke={INK} strokeWidth={2.5} fill="none" />
      ))}
      <rect x={0} y={horizon} width={1080} height={1920 - horizon} fill={`url(#${id}-gr)`} />
      <path d={`M0,${horizon} L1080,${horizon}`} stroke={INK} strokeWidth={4} />
      {/* wind-scoured streaks on the snow */}
      {Array.from({length: 14}, (_, i) => {
        const y = horizon + 40 + i * 52 + rnd(i) * 14;
        const x = rnd(i * 3 + 9) * 900;
        return <path key={i} d={`M ${x},${y} q 90,-8 180,0`} stroke={DEP.snowHi} strokeWidth={5} opacity={0.5} fill="none" strokeLinecap="round" />;
      })}
      {flakes}
      {dim > 0 && <rect x={0} y={0} width={1080} height={1920} fill="#0B0714" opacity={dim} />}
    </g>
  );
};

/** the near plane: snow drift mounds across the lower third, under the caption card */
export const NearDrift: React.FC<{f: number; seed?: number; y?: number}> = ({f, seed = 1, y = 1700}) => {
  const pts: string[] = [];
  for (let i = 0; i <= 12; i++) {
    const x = i * 90 + 2 * Math.sin(f / 60 + i);
    const yy = y - 26 * Math.sin(i / 1.7 + seed) - 22 * rnd(i * 5 + seed);
    pts.push(`${i === 0 ? 'M' : 'L'} ${x},${yy}`);
  }
  const d = `${pts.join(' ')} L 1080,1920 L 0,1920 Z`;
  return (
    <g data-band="ok">
      <path d={d} fill={DEP.snowHi} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={d} fill={DEP.snow} opacity={0.6} transform="translate(0,38)" />
      {Array.from({length: 5}, (_, i) => (
        <g key={i} transform={`translate(${120 + i * 210 + 30 * rnd(i + seed)},${y + 70 + 18 * rnd(i * 2 + seed)})`}>
          <path d="M0,0 q-10,-40 -22,-52 M0,0 q4,-48 0,-64 M0,0 q12,-36 24,-46" stroke="#5D6A92" strokeWidth={5} fill="none" strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
};

/** a wooden crate with slats, stenciled label, optional lid angle */
export const Crate: React.FC<{x: number; y: number; s?: number; f: number; lid?: number; label?: string; sub?: string; thump?: number}> = ({x, y, s = 1, f, lid = 0, label = '$25M', sub = 'FROM ALASKA', thump = 0}) => {
  const squash = 1 - 0.08 * thump;
  return (
    <g transform={`translate(${x},${y}) scale(${s * (1 + 0.05 * thump)},${s * squash})`}>
      <ContactShadow cx={0} cy={4} rx={190} ry={20} opacity={0.38} blur={12} />
      <rect x={-170} y={-210} width={340} height={210} fill={DEP.wood} stroke={INK} strokeWidth={8} />
      {[-130, -50, 30, 110].map((sx, i) => <rect key={i} x={sx - 6} y={-206} width={12} height={202} fill={DEP.woodDark} opacity={0.5} />)}
      {[-150, -80].map((sy, i) => <line key={i} x1={-166} y1={sy} x2={166} y2={sy} stroke={DEP.woodDark} strokeWidth={4} opacity={0.6} />)}
      <path d="M-170,-210 L170,-210 L170,-196 L-170,-196 Z" fill="#9B6B47" />
      <g transform={`rotate(${-lid * 34} -170 -210)`}>
        <rect x={-178} y={-232} width={356} height={26} fill="#8A5E40" stroke={INK} strokeWidth={7} />
      </g>
      <rect x={-130} y={-170} width={260} height={104} rx={4} fill={DEP.paper} stroke={INK} strokeWidth={5} opacity={0.96} />
      <text x={0} y={-112} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={54} fill={INK}>{label}</text>
      <text x={0} y={-80} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} letterSpacing={2} fill="#5B3A25">{sub}</text>
      <RimLight d="M-170,-206 L-170,0" w={4} opacity={0.35} />
    </g>
  );
};

export type LineState = 'blank' | 'asked' | 'stamped';
const LINES = ['SIZE', 'SITE', 'PRICE', 'DATE'];

/** THE THROUGHLINE: the NUSUN shipping tag. Origin is the eyelet. The front has four blank ruled lines; the back is passed in. */
export const NuSunTag: React.FC<{
  x: number; y: number; s?: number; f: number; flip?: number; sway?: number; states?: LineState[]; stampP?: number[];
  back?: React.ReactNode; flutter?: number; subtitle?: boolean; hang?: boolean; id?: string;
}> = ({x, y, s = 1, f, flip = 0, sway = 1, states = ['blank', 'blank', 'blank', 'blank'], stampP = [0, 0, 0, 0], back, flutter = 0, subtitle = true, hang = true, id = 'tg'}) => {
  const W = 380, H = 560;
  const ang = sway * (2.2 * Math.sin(f / 31) + 1.1 * Math.sin(f / 13.7 + 1)) + flutter * 7 * Math.sin(f / 4.3);
  const sx = Math.cos(Math.PI * clamp01(flip));
  const showBack = flip > 0.5;
  const T = tones(DEP.manila);
  const body = `M ${-W / 2 + 60},0 L ${W / 2 - 60},0 L ${W / 2},64 L ${W / 2},${H} L ${-W / 2},${H} L ${-W / 2},64 Z`;
  return (
    <g transform={`translate(${x},${y}) rotate(${ang}) scale(${s})`}>
      {hang && <path d="M-20,-60 Q0,-30 0,6 M20,-60 Q0,-30 0,6" stroke={INK} strokeWidth={5} fill="none" />}
      <g transform={`scale(${Math.abs(sx) < 0.02 ? 0.02 : sx},1)`}>
        <FormGradient id={`${id}-m`} t={T} softness={0.6} />
        <path d={body} fill={`url(#${id}-m)`} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <path d={`M ${-W / 2 + 12},70 L ${-W / 2 + 12},${H - 12}`} stroke="#FFF4C4" strokeWidth={6} opacity={0.35} />
        <circle cx={0} cy={26} r={15} fill={DEP.sky1} stroke={INK} strokeWidth={5} />
        <circle cx={0} cy={26} r={22} fill="none" stroke="#B9B9B9" strokeWidth={5} opacity={0.8} />
        {!showBack && (
          <g>
            <rect x={-W / 2 + 28} y={64} width={W - 56} height={74} rx={4} fill={DEP.sky1} stroke={INK} strokeWidth={5} />
            <text x={0} y={118} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={64} letterSpacing={3} fill={DEP.manila}>NUSUN</text>
            {subtitle && <text x={0} y={166} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} letterSpacing={0.6} fill="#5B4310">SOLID-STATE, HEAT-PIPE-COOLED</text>}
            {LINES.map((ln, i) => {
              const ly = 232 + i * 76;
              const st = states[i];
              const glow = st === 'asked' ? 0.55 + 0.4 * Math.sin(f / 5 + i) : 0;
              return (
                <g key={ln}>
                  <text x={-W / 2 + 30} y={ly - 10} fontFamily={MONO} fontWeight={800} fontSize={26} letterSpacing={2} fill="#4A3510">{ln}</text>
                  {glow > 0 && <rect x={-W / 2 + 26} y={ly - 40} width={W - 52} height={60} rx={4} fill={DEP.cyan} opacity={0.22 * glow} />}
                  <line x1={-W / 2 + 30} y1={ly + 8} x2={W / 2 - 30} y2={ly + 8} stroke={st === 'asked' || st === 'stamped' ? '#1E7F93' : '#7A6020'} strokeWidth={4} strokeDasharray="14 9" strokeDashoffset={-f * 0.5} />
                  {stampP[i] > 0.02 && (
                    <g transform={`translate(${60},${ly - 6}) rotate(-7) scale(${0.7 + 0.3 * clamp01(stampP[i] * 1.4)})`} opacity={clamp01(stampP[i] * 2.2)}>
                      <rect x={-112} y={-26} width={224} height={46} rx={5} fill="none" stroke={DEP.red} strokeWidth={5} />
                      <text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={27} letterSpacing={2} fill={DEP.red}>NOT STATED</text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        )}
        {showBack && <g transform="scale(-1,1)">{back}</g>}
      </g>
    </g>
  );
};

/** a wooden post with a crossarm and hook that carries the tag */
export const TagPost: React.FC<{x: number; y: number; s?: number; top?: number}> = ({x, y, s = 1, top = 900}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ContactShadow cx={0} cy={6} rx={70} ry={12} opacity={0.35} blur={9} />
    <rect x={-14} y={-top} width={28} height={top} fill={DEP.wood} stroke={INK} strokeWidth={7} />
    <rect x={-14} y={-top} width={10} height={top} fill="#9B6B47" opacity={0.5} />
    <rect x={-96} y={-top - 8} width={192} height={24} rx={4} fill={DEP.wood} stroke={INK} strokeWidth={7} />
    <path d={`M-14,${-top + 26} L-60,${-top + 46}`} stroke={INK} strokeWidth={6} />
    <ellipse cx={0} cy={0} rx={46} ry={10} fill={DEP.snowHi} stroke={INK} strokeWidth={4} opacity={0.9} />
  </g>
);

/** NuSun: a dashed ice-cyan OUTLINE, no fill, no shadow. k draws it on. Never a solid. */
export const NuSunOutline: React.FC<{x: number; y: number; s?: number; f: number; k?: number; label?: boolean; alpha?: number; name?: string; variant?: 'unknown' | 'oklo'}> = ({x, y, s = 1, f, k = 1, label = false, alpha = 1, name = 'NUSUN', variant = 'unknown'}) => {
  const oklo = variant === 'oklo';
  const col = oklo ? INK : DEP.cyan;
  const body = 'M -110,0 L -110,-230 Q -110,-330 0,-340 Q 110,-330 110,-230 L 110,0 Z';
  const skirt = 'M -150,0 L -150,22 L 150,22 L 150,0';
  const pipes = [-60, 0, 60].map((px) => `M ${px},-30 L ${px},-290`);
  const len = 1500;
  const dash = `16 11`;
  const wob = 1 + 0.004 * Math.sin(f / 17);
  return (
    <g transform={`translate(${x},${y}) scale(${s * wob})`} opacity={alpha * clamp01(k * 3)} style={oklo ? undefined : {filter: `drop-shadow(0 0 ${5 + 3 * Math.sin(f / 12)}px ${col})`}}>
      <path d={body} fill={oklo ? DEP.paper : "none"} fillOpacity={oklo ? 0.5 : 1} stroke={col} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} strokeDashoffset={-f * 0.7 + len * (1 - clamp01(k))} />
      <path d={skirt} fill="none" stroke={col} strokeWidth={7} strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={-f * 0.7} />
      {pipes.map((p, i) => <path key={i} d={p} fill="none" stroke={col} strokeWidth={5} strokeLinecap="round" strokeDasharray="10 12" strokeDashoffset={f * 0.5 + i * 6} opacity={0.8} />)}
      <path d="M -50,-120 L 50,-120 M -40,-170 L 40,-170" stroke={col} strokeWidth={4} strokeDasharray="6 8" opacity={0.6} />
      {label && (
        <g>
          <rect x={-100} y={-440} width={200} height={50} rx={5} fill={DEP.sky1} stroke={oklo ? DEP.manila : col} strokeWidth={4} />
          <text x={0} y={-405} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} letterSpacing={2} fill={oklo ? DEP.manila : col}>{name}</text>
        </g>
      )}
    </g>
  );
};

/** a small paper chip with a label (AIDEA's list, conditions) */
export const Chip: React.FC<{x: number; y: number; text: string; size?: number; tone?: 'paper' | 'dark' | 'cyan' | 'red' | 'gold'; rot?: number; k?: number}> = ({x, y, text, size = 28, tone = 'paper', rot = 0, k = 1}) => {
  const w = monoW(text, size) + 36, h = size + 28;
  const t = {
    paper: {fill: DEP.paper, fg: INK, edge: INK},
    dark: {fill: DEP.sky1, fg: DEP.manila, edge: DEP.manila},
    cyan: {fill: DEP.sky1, fg: DEP.cyan, edge: DEP.cyan},
    red: {fill: '#2B0F14', fg: '#FF9A9A', edge: DEP.red},
    gold: {fill: DEP.gold, fg: INK, edge: INK},
  }[tone];
  if (k <= 0.01) return null;
  const sc = 0.8 + 0.2 * clamp01(k * 1.2);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${sc})`} opacity={clamp01(k * 2)}>
      <rect x={-w / 2 + 5} y={-h / 2 + 7} width={w} height={h} rx={6} fill="#000" opacity={0.3} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={t.fill} stroke={t.edge} strokeWidth={4} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={1.5} fill={t.fg}>{text}</text>
    </g>
  );
};

/** wall calendar: 30 day squares, the first n grayed and crossed (a stated shortage, not a countdown) */
export const Calendar: React.FC<{x: number; y: number; s?: number; f: number; n?: number; slam?: number; frost?: number; cross?: number}> = ({x, y, s = 1, f, n = 18, slam = 1, frost = 0, cross = 1}) => {
  const drop = (1 - slam) * -700;
  const sq = 1 + 0.06 * Math.max(0, 1 - Math.abs(slam - 1) * 10);
  return (
    <g transform={`translate(${x},${y + drop}) scale(${s * sq})`}>
      <ContactShadow cx={0} cy={6} rx={200} ry={14} opacity={0.2 * slam} blur={9} />
      <rect x={-200} y={-420} width={400} height={420} rx={8} fill={DEP.paper} stroke={INK} strokeWidth={8} />
      <rect x={-200} y={-420} width={400} height={78} rx={8} fill={DEP.sky1} stroke={INK} strokeWidth={8} />
      <text x={0} y={-366} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={34} letterSpacing={3} fill={DEP.manila}>THIS WINTER</text>
      {Array.from({length: 30}, (_, i) => {
        const cx = -160 + (i % 6) * 64, cy = -318 + Math.floor(i / 6) * 62;
        const hit = i < n * clamp01(cross) - 0.001;
        return (
          <g key={i}>
            <rect x={cx - 26} y={cy - 24} width={52} height={50} rx={4} fill={hit ? '#8F8AA5' : '#FFFFFF'} stroke={INK} strokeWidth={3} opacity={hit ? 1 : 0.92} />
            {hit && <path d={`M ${cx - 18},${cy - 16} L ${cx + 18},${cy + 18} M ${cx + 18},${cy - 16} L ${cx - 18},${cy + 18}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />}
          </g>
        );
      })}
      {frost > 0 && (
        <g opacity={frost}>
          <path d="M-200,-420 L-200,0 L-130,0 Q-170,-120 -150,-250 Q-190,-340 -200,-420 Z" fill="#FFFFFF" opacity={0.65} />
          <path d="M200,0 L200,-130 Q150,-90 120,0 Z" fill="#FFFFFF" opacity={0.65} />
        </g>
      )}
    </g>
  );
};

/** the merger jar: a glass hopper that fills with coins; fill 0..1 and aideaFill is the gold share counted toward it */
export const MergerJar: React.FC<{x: number; y: number; s?: number; f: number; fill?: number; aidea?: number}> = ({x, y, s = 1, f, fill = 0.33, aidea = 1}) => {
  const H = 420, W = 300;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ContactShadow cx={0} cy={6} rx={170} ry={16} opacity={0.35} blur={10} />
      <path d={`M -${W / 2},-${H} L ${W / 2},-${H} L ${W / 2 - 24},0 L -${W / 2 - 24},0 Z`} fill="#9FC3E6" opacity={0.5} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      <path d={`M -${W / 2 - 26},-${H - 30} L -${W / 2 - 34},-60`} stroke="#FFFFFF" strokeWidth={12} opacity={0.5} strokeLinecap="round" />
      <path d={`M -${W / 2 - 24 * (1 - fill)},-${H * fill} L ${W / 2 - 24 * (1 - fill)},-${H * fill} L ${W / 2 - 24},0 L -${W / 2 - 24},0 Z`} fill={DEP.gold} opacity={0.9} stroke={INK} strokeWidth={5} />
      {aidea > 0 && <path d={`M -${W / 2 - 24},0 L ${W / 2 - 24},0 L ${W / 2 - 24 + 24 * (1 - 0.33)},-${H * 0.33 * aidea} L -${W / 2 - 24 + 24 * (1 - 0.33)},-${H * 0.33 * aidea} Z`} fill="#FFE08A" opacity={0.0} />}
      {[0.25, 0.5, 0.75, 1].map((m, i) => <line key={i} x1={-W / 2 + 6} y1={-H * m + 4} x2={-W / 2 + 36} y2={-H * m + 4} stroke={INK} strokeWidth={4} />)}
      <rect x={-W / 2 - 14} y={-H - 18} width={W + 28} height={22} rx={6} fill={DEP.wood} stroke={INK} strokeWidth={6} />
      <path d={`M ${-W / 2 + 4},${-H * 0.33} L ${W / 2 - 4},${-H * 0.33}`} stroke={INK} strokeWidth={5} strokeDasharray="12 8" strokeDashoffset={-f * 0.4} />
    </g>
  );
};

/** coins falling in a column from (x, y0) */
export const CoinStream: React.FC<{x: number; y0: number; y1: number; f: number; on?: number; seed?: number}> = ({x, y0, y1, f, on = 1, seed = 0}) => (
  <g opacity={on}>
    {Array.from({length: 9}, (_, i) => {
      const t = ((f * 0.04 + i / 9 + rnd(i + seed)) % 1);
      const cy = y0 + (y1 - y0) * t;
      const cx = x + 18 * Math.sin(i * 2.1 + seed);
      const sq = 0.4 + 0.6 * Math.abs(Math.cos(f / 5 + i));
      return <ellipse key={i} cx={cx} cy={cy} rx={20} ry={20 * sq} fill={DEP.gold} stroke={INK} strokeWidth={3.5} />;
    })}
  </g>
);

/** the filing and the release as paper with ruled text blocks and a heading */
export const PaperDoc: React.FC<{x: number; y: number; w?: number; h?: number; rot?: number; head: string; rows?: number; f: number; hot?: number}> = ({x, y, w = 360, h = 300, rot = 0, head, rows = 5, f, hot = -1}) => (
  <g transform={`translate(${x},${y}) rotate(${rot + 0.6 * Math.sin(f / 33 + x)})`}>
    <rect x={-w / 2 + 7} y={-h / 2 + 9} width={w} height={h} rx={5} fill="#000" opacity={0.28} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={5} fill={DEP.paper} stroke={INK} strokeWidth={6} />
    <rect x={-w / 2 + 22} y={-h / 2 + 20} width={w - 44} height={34} fill={DEP.sky1} />
    <text x={0} y={-h / 2 + 46} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} letterSpacing={1.5} fill={DEP.manila}>{head}</text>
    {Array.from({length: rows}, (_, i) => (
      <rect key={i} x={-w / 2 + 26} y={-h / 2 + 78 + i * 34} width={i === rows - 1 ? (w - 52) * 0.5 : w - 52} height={12} rx={4} fill={i === hot ? DEP.gold : '#3A2E1B'} opacity={i === hot ? 0.9 : 0.2} />
    ))}
  </g>
);

/** a plank sled with runners that carries a jar or a crate */
export const Sled: React.FC<{x: number; y: number; s?: number; f: number; w?: number; children?: React.ReactNode}> = ({x, y, s = 1, f, w = 420, children}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ContactShadow cx={0} cy={6} rx={w * 0.55} ry={14} opacity={0.35} blur={10} />
    <path d={`M ${-w / 2 - 30},-6 Q ${-w / 2 - 60},-30 ${-w / 2 - 20},-44 M ${w / 2 + 30},-6 Q ${w / 2 + 60},-30 ${w / 2 + 20},-44`} stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />
    {[-w / 2 + 40, w / 2 - 40].map((rx, i) => <rect key={i} x={rx - 10} y={-40} width={20} height={36} fill={DEP.woodDark} stroke={INK} strokeWidth={5} />)}
    <rect x={-w / 2} y={-62} width={w} height={26} rx={4} fill={DEP.wood} stroke={INK} strokeWidth={7} />
    <rect x={-w / 2 - 20} y={-10} width={w + 40} height={12} rx={6} fill="#8A8F99" stroke={INK} strokeWidth={5} />
    <g transform="translate(0,-62)">{children}</g>
  </g>
);

/** a pole light: a pole, an arm and a warm cone onto the snow */
export const PoleLight: React.FC<{x: number; y: number; f: number; h?: number}> = ({x, y, f, h = 720}) => {
  const fl = 1 + 0.03 * Math.sin(f / 7);
  return (
    <g transform={`translate(${x},${y})`}>
      <path d={`M -150,0 L 150,0 L 90,${-h} L -90,${-h} Z`} fill="#FFD58A" opacity={0.1 * fl} />
      <rect x={-9} y={-h} width={18} height={h} fill={DEP.woodDark} stroke={INK} strokeWidth={5} />
      <rect x={-9} y={-h} width={92} height={14} fill={DEP.woodDark} stroke={INK} strokeWidth={4} />
      <path d={`M 60,${-h + 14} q 22,0 22,26 l -44,0 q 0,-26 22,-26 Z`} fill="#3E7A5E" stroke={INK} strokeWidth={4} />
      <ellipse cx={82} cy={-h + 42} rx={22} ry={6} fill="#FFE9A8" opacity={0.9} />
    </g>
  );
};

/** a cold mailroom wall: pale blue-grey plaster, a cork board with pushpins, a fluorescent tube */
export const Mailroom: React.FC<{f: number; id: string}> = ({f, id}) => (
  <g>
    <defs>
      <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7C88AE" /><stop offset="1" stopColor="#566085" /></linearGradient>
      <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#E8F1FF" stopOpacity={0} /><stop offset="0.5" stopColor="#E8F1FF" stopOpacity={0.9} /><stop offset="1" stopColor="#E8F1FF" stopOpacity={0} /></linearGradient>
    </defs>
    <rect data-band="ok" x={-40} y={0} width={1160} height={1960} fill={`url(#${id}w)`} />
    {Array.from({length: 9}, (_, i) => <line key={i} data-band="ok" x1={-40} y1={i * 230} x2={1120} y2={i * 230} stroke="#3F486A" strokeWidth={3} opacity={0.4} />)}
    <g transform="translate(540,60)" opacity={0.85 + 0.1 * Math.sin(f / 3.1)}>
      <rect x={-300} y={-6} width={600} height={22} rx={10} fill="#E8F1FF" stroke={INK} strokeWidth={5} />
      <rect x={-420} y={14} width={840} height={440} fill={`url(#${id}t)`} opacity={0.18} />
    </g>
    <g transform="translate(540,960)">
      <rect x={-440} y={-420} width={880} height={820} rx={10} fill="#B98B5A" stroke={INK} strokeWidth={10} />
      <rect x={-440} y={-420} width={880} height={820} rx={10} fill="none" stroke="#7A5236" strokeWidth={22} opacity={0.6} />
      {Array.from({length: 120}, (_, i) => <circle key={i} cx={-420 + (i * 97) % 840} cy={-400 + (i * 53) % 790} r={2 + (i % 3)} fill="#8A6040" opacity={0.5} />)}
    </g>
    <rect x={-40} y={1500} width={1160} height={460} fill="#3F486A" stroke={INK} strokeWidth={6} />
  </g>
);

/** a plain count-up box: a dark case with one big paper digit, a hand-cranked counter */
export const CountBox: React.FC<{x: number; y: number; s?: number; digit: string; label: string; f: number; pop?: number}> = ({x, y, s = 1, digit, label, f, pop = 0}) => (
  <g transform={`translate(${x},${y}) scale(${s * (1 + 0.1 * pop)})`}>
    <ContactShadow cx={0} cy={6} rx={130} ry={12} opacity={0.35} blur={9} />
    <rect x={-120} y={-170} width={240} height={170} rx={12} fill="#2A2438" stroke={INK} strokeWidth={8} />
    <rect x={-96} y={-146} width={192} height={96} rx={6} fill={DEP.paper} stroke={INK} strokeWidth={5} />
    <text x={0} y={-68} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={86} fill={INK}>{digit}</text>
    <text x={0} y={-16} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} letterSpacing={3} fill={DEP.manila}>{label}</text>
    <circle cx={104} cy={-140 + 2 * Math.sin(f / 5)} r={8} fill={DEP.manilaShade} stroke={INK} strokeWidth={3} />
  </g>
);
