import React from 'react';
import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {z} from 'zod';
import {Character} from './lib/Character';
import {SpeedLines, ImpactStar, ZoomVignette} from './lib/FX';
import {
  INK, RED, RED_D, ICE, SNOW,
  BoxLabel, StatBurst, Stamp, ServerMachine,
} from './lib/kit';

const BOLD = 'Arial Black, Arial, sans-serif';

// ---- 2026-07-17 palette: amethyst-plum subsurface, copper machine, citrine ore, lime AI ----
const PLUM = '#3d2a55';
const PLUM_D = '#2a1c3d';
const PLUM_GLOW = '#503a6e';
const CIT = '#ffc21e';        // citrine ore + chip glow
const CIT_D = '#d99a12';
const LIME = '#b6ff3a';       // the AI's signature accent
const LIME_D = '#7fbf1f';
const COP = '#c56b4a';
const COP_D = '#8f4a30';
const GROUND = '#4a3550';     // tundra-over-bedrock band

export const episodeSchema = z.object({
  captions: z.array(z.object({text: z.string(), start: z.number(), end: z.number(), seg: z.number()})),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
});
export type EpisodeProps = z.infer<typeof episodeSchema>;

// ================================================================ shared BG
const SubsurfaceBG: React.FC<{f: number; descent?: number}> = ({f, descent = 0}) => (
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
    <radialGradient id="plumG" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stopColor={PLUM_GLOW} />
      <stop offset="100%" stopColor={PLUM_D} />
    </radialGradient>
    <rect width="1080" height="1920" fill="url(#plumG)" />
    {/* faint bedrock strata drifting up as we descend (parallax) */}
    <g opacity={0.5}>
      {Array.from({length: 9}).map((_, i) => {
        const y = ((i * 230 + descent * 40 + f * 0.25) % 2100) - 100;
        return <path key={i} d={`M-40,${y} q270,${18 - (i % 3) * 12} 560,0 q270,-16 600,4`} fill="none" stroke={PLUM} strokeWidth={10} opacity={0.5} />;
      })}
    </g>
    {/* drifting mineral dust motes */}
    <g opacity={0.55}>
      {Array.from({length: 24}).map((_, i) => {
        const s = i * 53;
        const x = (s * 37) % 1080;
        const y = ((s * 17 + f * (1 + (s % 5) * 0.3)) % 1960);
        const r = 2 + (s % 4);
        return <circle key={i} cx={x} cy={y} r={r} fill={i % 4 === 0 ? CIT : LIME} opacity={0.35} />;
      })}
    </g>
    {/* larger drifting glow orbs (big enough to register as disjoint motion at analysis res,
        spread across the frame so every scene keeps a living, layered background) */}
    <g>
      {Array.from({length: 7}).map((_, i) => {
        const s = i * 97 + 11;
        const bx = (s * 53) % 980 + 50;
        const drift = 60 * Math.sin(f / (22 + (s % 7) * 4) + i);
        const x = bx + drift;
        const y = ((s * 29 + f * (0.9 + (s % 4) * 0.5)) % 2040) - 60;
        const r = 24 + (s % 5) * 8;
        const tw = 0.10 + 0.10 * (0.5 + 0.5 * Math.sin(f / 9 + i * 1.7));
        return <circle key={i} cx={x} cy={y} r={r} fill={i % 2 === 0 ? CIT : LIME} opacity={tw} />;
      })}
    </g>
  </svg>
);

// a spinning mechanical auger bit from (x,y) pointing DOWN length L
const DrillBit: React.FC<{x: number; y: number; L: number; f: number; w?: number}> = ({x, y, L, f, wd = 46, w}) => {
  const W = (w ?? wd) as number;
  const wobble = 1.5 * Math.sin(f / 2);
  return (
    <g transform={`translate(${x + wobble},${y})`}>
      {/* motor housing with bolts + cooling vents */}
      <rect x={-W * 0.5} y={-96} width={W} height={64} rx={10} fill={COP} stroke={INK} strokeWidth={6} />
      <rect x={-W * 0.5} y={-96} width={W * 0.34} height={64} rx={10} fill={COP_D} opacity={0.55} />
      {[-1, 1].map((s) => <circle key={s} cx={s * W * 0.3} cy={-64} r={5} fill={INK} />)}
      {[0, 1, 2].map((i) => <rect key={i} x={-W * 0.34} y={-88 + i * 16} width={W * 0.68} height={5} rx={2} fill={INK} opacity={0.5} />)}
      {/* hex drive collar */}
      <rect x={-W * 0.28} y={-34} width={W * 0.56} height={22} rx={4} fill="#9aa2ad" stroke={INK} strokeWidth={5} />
      {/* steel auger shank + conical bit with shaded facets */}
      <path d={`M${-W / 2},-12 L${W / 2},-12 L0,${L} Z`} fill="#b8bcc6" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <path d={`M0,-12 L${W / 2},-12 L0,${L} Z`} fill="#7f8792" opacity={0.5} />
      <path d={`M${-W / 2},-12 L${-W * 0.16},-12 L0,${L * 0.7} Z`} fill="#e6ebf0" opacity={0.5} />
      {/* rotating helical flights (spin cue) */}
      {Array.from({length: 5}).map((_, i) => {
        const t = ((f * 0.6 + i * 5) % 24) / 24;
        const yy = -8 + t * (L + 8);
        const ww = (W / 2) * (1 - t) * 0.95;
        return <path key={i} d={`M${-ww},${yy} q${ww},11 ${2 * ww},0`} fill="none" stroke={INK} strokeWidth={4.5} opacity={0.85} />;
      })}
    </g>
  );
};

// a dashed empty chip-socket (the honest 'missing part'); filled = glowing chip seated
const ChipSocket: React.FC<{x: number; y: number; s?: number; filled?: boolean; match?: number; label?: boolean}> = ({x, y, s = 1, filled = false, match = 0, label = false}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-70} y={-46} width={140} height={92} rx={10} fill={filled ? CIT : 'none'} stroke={filled ? INK : '#d7c2ef'} strokeWidth={6} strokeDasharray={filled ? undefined : '12 9'} />
    {filled && Array.from({length: 6}).map((_, i) => (
      <line key={i} x1={-70} y1={-30 + i * 12} x2={-96} y2={-30 + i * 12} stroke={INK} strokeWidth={5} />
    ))}
    {!filled && <text x={0} y={14} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={40} fill="#d7c2ef">?</text>}
    {match > 0.02 && match < 0.99 && (
      <g transform={`translate(0,${-260 * (1 - match)}) scale(${1 + 0.3 * (1 - match)})`} opacity={0.5 + 0.5 * match}>
        <rect x={-64} y={-40} width={128} height={80} rx={8} fill={CIT} stroke={INK} strokeWidth={6} opacity={0.85} />
      </g>
    )}
    {label && (
      <g transform="translate(0,116)">
        <BoxLabel x={0} y={0} text="MADE WITH" sub="COBALT · GRAPHITE · GALLIUM" w={440} h={94} fs={30} fill={ICE} color={INK} />
      </g>
    )}
  </g>
);

// ================================================================ S1 HOOK — the driller
const S1: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  // frame 0 is the poster: machine + headline fully settled at t=0 (edges/contrast graded),
  // the hook's motion comes from the spinning drill + dust + drifting orbs, not an entrance slide.
  const machIn = spring({frame: f + 34, fps, config: {damping: 14, stiffness: 100}});
  const headIn = spring({frame: f + 34, fps, config: {damping: 13, stiffness: 120}});
  const lookX = 4 + 3 * Math.sin(f / 30);
  const dustN = 10;
  const fleck = interpolate(f, [118, 150], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const ghostChip = f > 120 ? 0.4 + 0.4 * Math.sin(f / 7) : 0;
  return (
    <AbsoluteFill style={{backgroundColor: PLUM_D}}>
      <SubsurfaceBG f={f} descent={1} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <rect x={0} y={1560} width={1080} height={360} fill={GROUND} />
        <path d="M0,1560 q270,-22 540,0 q270,22 540,0 L1080,1920 L0,1920 Z" fill={PLUM_D} opacity={0.5} />
        {/* ink-outlined ore chunks embedded in the bedrock band */}
        {[[120, 1660, '#5a7fd6'], [340, 1720, '#d98cc4'], [820, 1690, '#7fae7a'], [980, 1650, CIT]].map(([x, y, c], i) => (
          <g key={i} transform={`translate(${x},${y})`}>
            <path d="M-34,0 l22,-30 l38,6 l20,32 l-16,34 l-42,4 Z" fill={c as string} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <path d="M-16,-14 l16,10 l-8,18" fill="none" stroke={INK} strokeWidth={3} opacity={0.6} />
          </g>
        ))}
      </svg>
      {/* floating faceted mineral crystals the AI is hunting (fills the frame, on-theme, edge-rich) */}
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        {[[180, 700, CIT, 1.1], [900, 720, '#5a7fd6', 0.9], [770, 900, LIME, 0.8], [300, 940, '#d98cc4', 0.85], [560, 640, '#c9d0dc', 0.7]].map(([x, y, c, s], i) => {
          const bob = 10 * Math.sin(f / (24 + i * 6) + i);
          const S = s as number;
          return (
            <g key={i} transform={`translate(${x},${(y as number) + bob}) scale(${S})`} opacity={0.92}>
              <path d="M0,-58 l40,26 l-14,54 l-52,0 l-14,-54 Z" fill={c as string} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
              <path d="M0,-58 l0,80 M-40,-32 l40,54 l40,-54" fill="none" stroke={INK} strokeWidth={4} opacity={0.65} />
              <path d="M0,-58 l40,26 l-40,10 l-40,-10 Z" fill={SNOW} opacity={0.25} />
            </g>
          );
        })}
      </svg>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', transform: `translateY(${150 * (1 - machIn)}px)`, opacity: machIn}}>
        <g transform="translate(470,1360)">
          <ServerMachine frame={f} emotion="focused" tint="copper" scale={1.06} lookX={lookX} />
        </g>
        {ghostChip > 0.02 && (
          <g opacity={ghostChip}>
            <rect x={396} y={1120} width={128} height={80} rx={8} fill="none" stroke="#ffe9a8" strokeWidth={5} strokeDasharray="11 8" />
          </g>
        )}
        <g>
          <path d="M600,1230 q90,40 96,150" fill="none" stroke={COP} strokeWidth={40} strokeLinecap="round" />
          <path d="M600,1230 q90,40 96,150" fill="none" stroke={COP_D} strokeWidth={18} strokeLinecap="round" opacity={0.6} />
          <DrillBit x={697} y={1400} L={190} f={f} />
          {Array.from({length: dustN}).map((_, i) => {
            const t = ((f * 1.3 + i * 26) % 60) / 60;
            const a = -1.1 + (i / dustN) * 2.2;
            const px = 697 + Math.sin(a) * 90 * t;
            const py = 1600 - 60 * t - Math.cos(a) * 20;
            return <circle key={i} cx={px} cy={py} r={(1 - t) * 16 + 3} fill={CIT} opacity={(1 - t) * 0.5} />;
          })}
        </g>
        {fleck > 0.02 && (
          <g transform={`translate(${697 + 30 * fleck},${1560 - 180 * fleck})`} opacity={fleck}>
            <rect x={-20} y={-14} width={40} height={26} rx={5} fill={CIT} stroke={INK} strokeWidth={5} />
            <g transform="translate(0,-2)"><ImpactStar cx={0} cy={0} r={16 + 6 * Math.sin(f / 4)} color={SNOW} /></g>
          </g>
        )}
      </svg>
      <div style={{position: 'absolute', top: 330, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `translateY(${-150 * (1 - headIn)}px) rotate(-2deg)`}}>
        <div style={{background: RED, border: `9px solid ${INK}`, borderRadius: 14, padding: '20px 40px', boxShadow: `0 13px 0 ${INK}55`, maxWidth: 900}}>
          <div style={{fontFamily: BOLD, fontWeight: 900, fontSize: 96, lineHeight: 1.02, color: '#fff', textAlign: 'center', textTransform: 'uppercase', textShadow: `4px 5px 0 ${RED_D}`}}>
            AI is Digging<br />in Alaska
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================ S2 THE AWARD (UAF + $15M + NSF)
const S2: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cardIn = spring({frame: f - 6, fps, config: {damping: 13, stiffness: 110}});
  const bootWipe = interpolate(f, [6, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const badge = spring({frame: f - 70, fps, config: {damping: 9, stiffness: 150}});
  const seal = spring({frame: f - 150, fps, config: {damping: 10, stiffness: 200}});
  const lookUp = 2 + 2 * Math.sin(f / 24);
  return (
    <AbsoluteFill style={{backgroundColor: PLUM_D}}>
      <SubsurfaceBG f={f} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <g transform="translate(560,2020) scale(0.9)">
          <ServerMachine frame={f} emotion="focused" tint="copper" scale={1} lookX={lookUp} />
        </g>
      </svg>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <g transform={`translate(540,470) scale(${cardIn})`} opacity={cardIn}>
          <rect x={-360} y={-120} width={720} height={240} rx={22} fill={ICE} stroke={INK} strokeWidth={10} />
          <rect x={-360} y={-120} width={720 * bootWipe} height={240} rx={22} fill="#dfeeff" opacity={0.5} />
          <text x={0} y={-18} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={116} fill={INK} letterSpacing={4}>UAF</text>
          <text x={0} y={64} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={31} fill={COP_D}>UNIVERSITY OF ALASKA FAIRBANKS</text>
        </g>
        {badge > 0.02 && (
          <g transform={`translate(300,930) scale(${badge})`}>
            <StatBurst cx={0} cy={0} big="$15M" lines={['FIRST 2 YRS']} fill={CIT} rot={-6} big_fs={92} />
          </g>
        )}
        {seal > 0.02 && (
          <g transform={`translate(790,950) scale(${seal})`} opacity={Math.min(1, seal * 1.3)}>
            <circle r={140} fill="#eef2ff" stroke={INK} strokeWidth={10} />
            <circle r={140} fill="none" stroke={LIME_D} strokeWidth={6} transform="scale(0.86)" />
            <text x={0} y={-8} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={76} fill={INK}>NSF</text>
            <text x={0} y={48} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={22} fill={COP_D}>NAT'L SCIENCE</text>
            <text x={0} y={78} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={22} fill={COP_D}>FOUNDATION</text>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

// ================================================================ S3 THE MAP (1 of 12, 20 states)
const bigAlaska = "M120,470 L260,395 L360,405 L430,350 L520,362 L560,300 L640,330 L720,318 L820,360 L940,350 L1000,430 L968,486 L880,510 L916,566 L840,588 L806,672 L700,690 L648,650 L596,706 L520,686 L456,742 L396,700 L336,742 L276,690 L312,610 L224,588 L268,530 L120,500 Z";
const S3: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const mapIn = spring({frame: f - 4, fps, config: {damping: 14, stiffness: 90}});
  const callout = spring({frame: f - 20, fps, config: {damping: 9, stiffness: 150}});
  const r = interpolate(f, [10, 50, 55, 92], [560, 150, 150, 70], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const dots = [[430, 470], [560, 430], [660, 500], [770, 450], [520, 560], [360, 500], [640, 610], [720, 560], [470, 620], [820, 520]];
  const cx = 600, cy = 500;
  const dotPulse = 1 + 0.25 * Math.sin(f / 6);
  return (
    <AbsoluteFill style={{backgroundColor: PLUM_D}}>
      <SubsurfaceBG f={f} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', opacity: mapIn}}>
        <g transform={`translate(0,300) scale(1.05)`}>
          <path d={bigAlaska} fill={PLUM_GLOW} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
          <path d={bigAlaska} fill={PLUM} opacity={0.4} transform="translate(6,10)" />
          {dots.map(([x, y], i) => {
            const near = Math.hypot(x - cx, y - cy) < r;
            return <circle key={i} cx={x} cy={y} r={13} fill={near ? RED : '#7a5a86'} opacity={near ? 1 : 0.5} stroke={INK} strokeWidth={4} />;
          })}
          <g transform={`translate(${cx},${cy}) scale(${dotPulse})`}>
            <circle r={20} fill={CIT} stroke={INK} strokeWidth={5} />
          </g>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={LIME} strokeWidth={7} strokeDasharray="20 14" opacity={0.95} />
          <circle cx={cx} cy={cy} r={r} fill={LIME} opacity={0.05} />
        </g>
      </svg>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        {callout > 0.02 && (
          <g transform={`translate(540,1270) scale(${0.82 * callout})`}>
            <StatBurst cx={0} cy={0} big="1 OF 12" lines={['NSF ENGINES', '20 STATES']} fill={LIME} rot={-4} big_fs={58} />
          </g>
        )}
        <g opacity={callout}>
          <BoxLabel x={540} y={1410} text="AI NARROWS THE SEARCH" w={640} h={72} fs={40} fill={ICE} color={INK} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ================================================================ S4 CROSS-SECTION + PERIODIC + MINERALS
const VEINS = [
  {d: 'M120,300 q120,60 260,40 q160,-24 320,60', col: '#5a7fd6', name: 'COBALT'},
  {d: 'M80,470 q160,-40 340,20 q180,52 380,-10', col: '#3f4a55', name: 'GRAPHITE'},
  {d: 'M140,640 q150,60 320,30 q170,-30 360,50', col: '#c9d0dc', name: 'GALLIUM'},
  {d: 'M100,800 q170,-30 340,30 q170,58 380,-14', col: '#7fae7a', name: 'NICKEL'},
  {d: 'M160,940 q140,54 320,24 q160,-26 340,44', col: '#d98cc4', name: 'RARE EARTHS'},
];
const S4: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const openG = interpolate(f, [4, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const wallIn = spring({frame: f - 120, fps, config: {damping: 13, stiffness: 90}});
  const wallOut = interpolate(f, [232, 252], [1, 0.16], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const lit = Math.round(interpolate(f, [128, 176], [0, 56], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const circleT = interpolate(f, [180, 210], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // all five mineral names land within the spoken window (local f240-300 = 28-30s), one per word
  const nameOn = (i: number) => f > 238 + i * 12;
  const pencilSnap = f > 200;
  return (
    <AbsoluteFill style={{backgroundColor: PLUM_D}}>
      <SubsurfaceBG f={f} descent={2} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <g transform="translate(0,540)" opacity={openG}>
          {/* layered rock strata (the cross-section read): banded bedrock behind the ore veins */}
          <g>
            {[[220, '#33244a'], [400, '#2c1f40'], [600, '#38285230'], [790, '#2a1c3d'], [980, '#34254c']].map(([yy, c], i) => (
              <g key={i}>
                <rect x={0} y={yy as number} width={1080} height={i === 4 ? 200 : ([400, 600, 790, 980][i] - (yy as number))} fill={c as string} opacity={0.9} />
                <path d={`M0,${yy} q270,${-14 + (i % 2) * 26} 540,4 q270,18 540,-6`} fill="none" stroke={INK} strokeWidth={5} opacity={0.55} />
              </g>
            ))}
          </g>
          <path d="M0,180 q270,-30 540,0 q270,30 540,0" fill="none" stroke={LIME} strokeWidth={6} strokeDasharray="18 12" opacity={0.8} />
          {VEINS.map((v, i) => (
            <g key={i} opacity={openG}>
              <path d={v.d} fill="none" stroke={INK} strokeWidth={30} strokeLinecap="round" />
              <path d={v.d} fill="none" stroke={v.col} strokeWidth={18} strokeLinecap="round" opacity={nameOn(i) ? 1 : 0.7} />
              {nameOn(i) && (
                <g transform={`translate(858,${290 + i * 128})`}>
                  <BoxLabel x={0} y={0} text={v.name} w={v.name === 'RARE EARTHS' ? 350 : 250} h={58} fs={30} fill={v.col} color={INK} rot={-2} />
                </g>
              )}
            </g>
          ))}
        </g>
      </svg>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', opacity: wallIn * wallOut}}>
        <g transform={`translate(140,300)`}>
          {Array.from({length: 60}).map((_, i) => {
            const col = i % 10, row = Math.floor(i / 10);
            const on = i < lit;
            const dark = i >= 56;
            const x = col * 80, y = row * 80;
            const pencil = i === 34;
            if (pencil && pencilSnap) {
              return (
                <g key={i} transform={`translate(${x},${y})`}>
                  <rect width={64} height={64} rx={8} fill="#ffd23e" stroke={INK} strokeWidth={5} />
                  <path d="M14,50 l18,-40" stroke={COP_D} strokeWidth={6} strokeLinecap="round" />
                  <path d="M40,8 l8,-10" stroke={INK} strokeWidth={5} />
                </g>
              );
            }
            return (
              <rect key={i} x={x} y={y} width={64} height={64} rx={8}
                fill={dark ? '#2c2438' : on ? LIME : '#3a3350'}
                stroke={INK} strokeWidth={5} opacity={dark ? 0.9 : 1} />
            );
          })}
          {circleT > 0.02 && (
            <path d="M-30,-30 q420,-40 830,20 q40,240 -20,470 q-420,40 -820,-10 q-30,-240 10,-470 Z"
              fill="none" stroke={LIME} strokeWidth={9} strokeDasharray={2600} strokeDashoffset={2600 * (1 - circleT)} opacity={0.9} />
          )}
        </g>
        <g opacity={wallIn}>
          <BoxLabel x={540} y={770} text="56 OF 60 CRITICAL MINERALS" w={730} h={70} fs={38} fill={CIT} color={INK} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ================================================================ S5 ORE-TO-CHIP + SOCKET (the irony)
const S5: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lift = interpolate(f, [0, 26], [80, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const crack = spring({frame: f - 34, fps, config: {damping: 12, stiffness: 160}});
  const snap = spring({frame: f - 40, fps, config: {damping: 14, stiffness: 200}});
  const match = interpolate(f, [120, 210], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const showLabel = f > 200;
  const emo = f > 44 ? 'shock' : 'focused';
  return (
    <AbsoluteFill style={{backgroundColor: PLUM_D}}>
      <SubsurfaceBG f={f} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <g transform="translate(470,1400)">
          <ServerMachine frame={f} emotion={emo as any} tint="copper" scale={1.22} />
        </g>
        <g opacity={f > 110 ? 1 : 0}>
          <ChipSocket x={470} y={1215} s={1.05} filled={false} match={match} label={showLabel} />
        </g>
      </svg>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', transform: `translateY(${lift}px)`}}>
        {f < 130 && (
          <g transform="translate(620,560)">
            <g stroke={INK} strokeWidth={7} fill={COP}>
              <path d="M-120,-180 q40,120 30,180" />
              <path d="M120,-180 q-40,120 -30,180" />
              <rect x={-26} y={-230} width={52} height={90} rx={12} />
            </g>
            {crack < 0.5 ? (
              <g>
                <path d="M-70,0 l40,-56 l70,10 l40,60 l-30,66 l-80,6 Z" fill={CIT_D} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
                <path d="M-30,-30 l30,20 l-14,30" fill="none" stroke={INK} strokeWidth={4} opacity={0.6} />
              </g>
            ) : (
              <g>
                <path d={`M-70,0 l40,-56 l40,8 l-20,110 l-30,4 Z`} fill={CIT_D} stroke={INK} strokeWidth={7} strokeLinejoin="round" transform={`translate(${-40 * crack},0) rotate(${-14 * crack})`} />
                <path d={`M50,-38 l70,10 l40,60 l-30,66 l-52,4 Z`} fill={CIT_D} stroke={INK} strokeWidth={7} strokeLinejoin="round" transform={`translate(${40 * crack},0) rotate(${14 * crack})`} />
                <g opacity={crack}>
                  <rect x={-56} y={-40} width={112} height={80} rx={8} fill={CIT} stroke={INK} strokeWidth={6} />
                  {[0, 1, 2].map((i) => (
                    <g key={i}>
                      <line x1={-56} y1={-24 + i * 24} x2={-84} y2={-24 + i * 24} stroke={INK} strokeWidth={5} />
                      <line x1={56} y1={-24 + i * 24} x2={84} y2={-24 + i * 24} stroke={INK} strokeWidth={5} />
                    </g>
                  ))}
                </g>
              </g>
            )}
            {snap > 0.3 && <SpeedLines cx={0} cy={0} frame={f} intensity={Math.min(1, snap)} color={CIT} />}
            {snap > 0.55 && <ImpactStar cx={0} cy={0} r={54 + 26 * snap} rot={f * 1.4} color={CIT} />}
          </g>
        )}
      </svg>
      <ZoomVignette amount={snap > 0 && f < 90 ? Math.min(1, snap) * 0.7 : 0} />
    </AbsoluteFill>
  );
};

// ================================================================ S6 THE MONEY (solid $15M vs ghost $160M)
const S6: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ghostRise = spring({frame: f - 6, fps, config: {damping: 14, stiffness: 70}});
  const ghostPulse = 0.8 + 0.2 * Math.sin(f / 8);
  const solidIn = spring({frame: f - 20, fps, config: {damping: 13, stiffness: 100}});
  const stampS = spring({frame: f - 116, fps, config: {damping: 9, stiffness: 200}});
  const deflate = interpolate(f, [116, 150], [1, 0.7], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: PLUM_D}}>
      <SubsurfaceBG f={f} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <g transform={`translate(760,1620) scale(${1.85 * ghostRise * deflate})`} opacity={ghostRise * (0.5 + 0.5 * ghostPulse)}>
          <ServerMachine frame={f} emotion="ghost" scale={1} />
        </g>
        <g transform={`translate(300,1560) scale(${0.9 * solidIn})`} opacity={solidIn}>
          <ServerMachine frame={f} emotion="focused" tint="copper" scale={1} />
        </g>
      </svg>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        {ghostRise > 0.3 && (
          <g transform="translate(770,470)">
            <BoxLabel x={0} y={0} text="UP TO $160M" sub="OVER 10 YEARS" w={430} h={112} fs={52} fill={PLUM} color={LIME} rot={-3} />
          </g>
        )}
        {solidIn > 0.3 && (
          <g transform="translate(300,560)">
            <BoxLabel x={0} y={0} text="$15M" sub="FUNDED" w={260} h={112} fs={62} fill={CIT} color={INK} rot={2} />
          </g>
        )}
        {stampS > 0.02 && (
          <g transform="translate(660,900)">
            <Stamp cx={0} cy={0} s={stampS} text="NOT AWARDED" rot={-9} color={RED} />
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

// ================================================================ S7 CAVEAT + BUTTON (loop)
const S7: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const swing = Math.sin(Math.max(0, f - 20) / 6) * (f > 20 && f < 96 ? 1 : 0);
  const doink = f > 60 && f < 96;
  const stampS = spring({frame: f - 70, fps, config: {damping: 9, stiffness: 200}});
  const toButton = f > 120;
  const click = spring({frame: f - 150, fps, config: {damping: 11, stiffness: 150}});
  const lookX = 4 + 3 * Math.sin(f / 30);
  const black = interpolate(f, [312, 326], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pullBack = interpolate(f, [130, 200], [1.25, 1.0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{backgroundColor: PLUM_D}}>
      <SubsurfaceBG f={f} descent={1} />
      {!toButton && (
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
          <rect x={0} y={1560} width={1080} height={360} fill={GROUND} />
          <Character frame={f} pose="panic" emotion={doink ? 'shock' : 'neutral'} outfit="worker" headgear="cap" hair="#3d2c1e" facing={1} scale={1.25} x={430} y={1720} />
          <g transform={`translate(560,1300) rotate(${-40 + swing * 46})`}>
            <rect x={-8} y={0} width={16} height={210} rx={6} fill="#8a5a2b" stroke={INK} strokeWidth={6} />
            <path d="M-70,0 q70,-30 140,0 q-70,18 -140,0 Z" fill="#9aa2ad" stroke={INK} strokeWidth={6} strokeLinejoin="round" transform="translate(0,-6)" />
          </g>
          {doink && (
            <g transform="translate(660,1560)">
              <ImpactStar cx={0} cy={0} r={40} color={ICE} rot={f * 2} />
              <path d="M0,-20 q30,-30 8,-70" fill="none" stroke={INK} strokeWidth={5} opacity={0.7} />
            </g>
          )}
          {stampS > 0.02 && (
            <g transform={`translate(540,720) scale(${stampS}) rotate(-7)`} opacity={Math.min(1, stampS * 1.3)}>
              <rect x={-300} y={-90} width={600} height={180} rx={14} fill="none" stroke={RED} strokeWidth={12} />
              <text x={0} y={-8} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={92} fill={RED} letterSpacing={4}>UNPROVEN</text>
              <text x={0} y={64} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={54} fill={RED} letterSpacing={6}>AT SCALE</text>
            </g>
          )}
        </svg>
      )}
      {toButton && (
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', transform: `scale(${pullBack})`, transformOrigin: '540px 1000px'}}>
          <rect x={0} y={1560} width={1080} height={360} fill={GROUND} />
          <path d="M0,1560 q270,-22 540,0 q270,22 540,0 L1080,1920 L0,1920 Z" fill={PLUM_D} opacity={0.5} />
          <g transform="translate(470,1360)">
            <ServerMachine frame={f} emotion="focused" tint="copper" scale={1.06} lookX={lookX} />
          </g>
          <ChipSocket x={420} y={1215} s={0.7} filled={click > 0.5} match={0} />
          <ChipSocket x={545} y={1215} s={0.7} filled={false} match={0} />
          {click > 0.5 && <ImpactStar cx={420} cy={1215} r={26 + 8 * Math.sin(f / 4)} color={CIT} />}
          {/* the AI search-circle flashlight callback (flow-critic note) */}
          {click > 0.4 && (
            <circle cx={697} cy={1500} r={120 + 30 * Math.sin(f / 5)} fill="none" stroke={LIME} strokeWidth={6} strokeDasharray="18 12" opacity={0.5} />
          )}
          <g>
            <path d="M600,1230 q90,40 96,150" fill="none" stroke={COP} strokeWidth={40} strokeLinecap="round" />
            <DrillBit x={697} y={1400} L={190} f={f} />
          </g>
        </svg>
      )}
      <div style={{position: 'absolute', inset: 0, background: '#000', opacity: black}} />
    </AbsoluteFill>
  );
};

// ================================================================ CAPTIONS overlay
const Captions: React.FC<{captions: EpisodeProps['captions']}> = ({captions}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const cue = captions.find((c) => t >= c.start && t < c.end + 0.05);
  if (!cue) return null;
  return (
    <div style={{position: 'absolute', bottom: 340, left: 0, right: 0, display: 'flex', justifyContent: 'center', padding: '0 60px'}}>
      <div style={{background: 'rgba(20,14,30,0.84)', borderRadius: 14, padding: '16px 30px', maxWidth: 940, border: `4px solid ${INK}`}}>
        <div style={{fontFamily: BOLD, fontWeight: 900, fontSize: 46, lineHeight: 1.12, color: '#fff', textAlign: 'center', letterSpacing: 0.5, textShadow: `2px 3px 0 rgba(0,0,0,0.6)`}}>
          {cue.text}
        </div>
      </div>
    </div>
  );
};

// ================================================================ TIMELINE
const SCENE_COMPONENTS: React.FC[] = [S1, S2, S3, S4, S5, S6, S7];
// 30fps. Shots: S1 0-8s, S2 8-16s, S3 16-20s, S4 20-32s, S5 32-40s, S6 40-48s, S7 48-59s.
const DEFAULT_BOUNDS: {from: number; dur: number}[] = [
  {from: 0, dur: 240}, {from: 240, dur: 240}, {from: 480, dur: 120}, {from: 600, dur: 360},
  {from: 960, dur: 240}, {from: 1200, dur: 240}, {from: 1440, dur: 330},
];

export const Episode: React.FC<EpisodeProps> = ({captions, scenes}) => {
  const bounds = scenes && scenes.length === SCENE_COMPONENTS.length ? scenes : DEFAULT_BOUNDS;
  return (
    <AbsoluteFill style={{backgroundColor: PLUM_D}}>
      {SCENE_COMPONENTS.map((C, i) => (
        <Sequence key={i} from={bounds[i].from} durationInFrames={bounds[i].dur} name={`S${i + 1}`}>
          <C />
        </Sequence>
      ))}
      <Captions captions={captions} />
    </AbsoluteFill>
  );
};
