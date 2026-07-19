import React from 'react';
import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {z} from 'zod';
import {VoiceProvider, useVoice} from './lib/voice';
import {Character} from './lib/Character';
import {Moose} from './lib/fauna';
import {ZoomVignette} from './lib/FX';
import {INK, ICE, SNOW, StatBurst, BoxLabel, FatArrow, Stamp, Sourdough, Cell} from './lib/kit';
import {tones, FormGradient, RimLight, ContactShadow, GradeLayer, MotionBlur, HazeOverlay} from './lib/lighting';
import {entrance, accentKick, idleSway, ChipShadow} from './lib/motion';

const BOLD = 'Arial Black, Arial, sans-serif';

// ---- 2026-07-19 palette: cold indigo pre-sunrise + ember-orange (hero) + server-teal (queue) + ash-red (haze turn) ----
const SKY = '#1B2A4A';
const SKY_HI = '#33456e';
const GROUND = '#3A4A63';
const GROUND_HI = '#F2DCC4';
const GROUND_D = '#232f45';
const EMBER = '#FF8C42';
const TEAL = '#3DDBD9';
const TEAL_D = '#1f8f8c';
const HAZE = '#C0392B';
const SNOW_C = '#eef4fb';

export const episodeSchema = z.object({
  captions: z.array(z.object({text: z.string(), start: z.number(), end: z.number(), seg: z.number()})),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(),
    energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
});
export type EpisodeProps = z.infer<typeof episodeSchema>;

// ================================================================ shared frost-yard background
// A cold Interior Alaska pre-dawn: an industrial utility yard rather than the
// boreal-forest biome used in prior episodes (that environment stays reserved
// for wilderness stories). Layered parallax: far town-skyline silhouette, mid
// snowbank ridge, near drifting frost/snow particles.
const FrostYardBG: React.FC<{f: number; parallax?: number}> = ({f, parallax = 1}) => (
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor={SKY} />
      <stop offset="55%" stopColor={SKY_HI} />
      <stop offset="100%" stopColor="#4a5a78" />
    </linearGradient>
    <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor={GROUND_HI} stopOpacity={0.5} />
      <stop offset="22%" stopColor={GROUND} />
      <stop offset="100%" stopColor={GROUND_D} />
    </linearGradient>
    <rect width="1080" height="1180" fill="url(#skyGrad)" />
    {/* faint horizon glow where the coming sunrise will break (rim-only, never a shadow-casting key) */}
    <ellipse cx={860} cy={1150} rx={340} ry={110} fill={EMBER} opacity={0.12} />
    {/* stars fading with the dawn */}
    <g opacity={0.5}>
      {Array.from({length: 24}).map((_, i) => {
        const x = (i * 173) % 1080;
        const y = (i * 97) % 640;
        const tw = 0.4 + 0.4 * Math.sin(f / 20 + i);
        return <circle key={i} cx={x} cy={y} r={1.6} fill="#fff" opacity={Math.max(0, tw)} />;
      })}
    </g>
    {/* distant North Pole skyline silhouette, slow parallax */}
    <g opacity={0.55} transform={`translate(${-((f * 0.08 * parallax) % 260)},0)`}>
      {Array.from({length: 9}).map((_, i) => {
        const x = i * 260;
        const h = 60 + ((i * 47) % 5) * 22;
        return <rect key={i} x={x} y={1150 - h} width={34 + (i % 3) * 10} height={h} fill="#111a30" />;
      })}
    </g>
    <rect x={0} y={1150} width={1080} height={770} fill="url(#groundGrad)" />
    {/* snowbank ridge line */}
    <path d="M0,1150 q270,-26 540,0 q270,26 540,0 L1080,1200 L0,1200 Z" fill={GROUND_D} opacity={0.5} />
    {/* window flicker on the distant skyline -- a second, independent, spatially
        disjoint motion source up top so the frame never reads as a single blob
        of action (CHOREOGRAPHY.md / LIVING_SCREEN gate) */}
    <g>
      {Array.from({length: 10}).map((_, i) => {
        const bx = (i * 107 + 40) % 1080;
        const by = 1080 - ((i * 61) % 90);
        const on = ((f / 4 + i * 5) % 23) < 3;
        return on ? <rect key={i} x={bx} y={by} width={5} height={7} fill="#ffd9a0" opacity={0.7} /> : null;
      })}
    </g>
    {/* three soft mist/gust bands at different screen heights, drifting at
        different speeds -- guarantees disjoint active regions top/mid/low even
        in scenes where the hero cast is small or still */}
    <g opacity={0.3}>
      {[420, 900, 1400].map((baseY, i) => {
        const y = baseY + 16 * Math.sin(f / 34 + i * 2);
        const x = ((f * (0.9 + i * 0.35) * parallax + i * 500) % 1500) - 260;
        return <ellipse key={i} cx={x} cy={y} rx={260} ry={46} fill={SNOW_C} opacity={0.5} />;
      })}
    </g>
    {/* drifting frost/snow particles, nearest parallax layer -- bigger + brighter
        so they clear the luma-delta active-region floor, not just decorative */}
    <g opacity={0.75}>
      {Array.from({length: 34}).map((_, i) => {
        const seed = i * 71;
        const x = (seed + f * (0.6 + (seed % 5) * 0.2) * parallax) % 1150 - 40;
        const y = 200 + ((seed * 13) % 1500);
        const r = 3 + (seed % 5);
        return <circle key={i} cx={x} cy={y} r={r} fill={SNOW_C} opacity={0.55 + 0.35 * Math.sin(f / 12 + i)} />;
      })}
    </g>
  </svg>
);

// ================================================================ small reusable props (this run's palette)
const Nameplate: React.FC<{x: number; y: number; text: string; sub?: string; op?: number}> = ({x, y, text, sub, op = 1}) => (
  <g transform={`translate(${x},${y})`} opacity={op}>
    <rect x={-150} y={-40} width={300} height={sub ? 88 : 60} rx={10} fill={ICE} stroke={INK} strokeWidth={6} />
    <text x={0} y={sub ? -8 : 10} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={36} fill={INK} letterSpacing={1.5} stroke={ICE} strokeWidth={3} paintOrder="stroke">{text}</text>
    {sub && <text x={0} y={30} textAnchor="middle" fontFamily={BOLD} fontWeight={700} fontSize={20} fill={TEAL_D}>{sub}</text>}
  </g>
);

const SwingSign: React.FC<{x: number; y: number; f: number; text: string; sub: string; year: string; op?: number}> = ({x, y, f, text, sub, year, op = 1}) => {
  const swing = 6 * Math.sin(f / 18);
  return (
    <g transform={`translate(${x},${y})`} opacity={op}>
      <line x1={0} y1={-60} x2={0} y2={-10} stroke={INK} strokeWidth={5} />
      <g transform={`rotate(${swing})`} style={{transformOrigin: `${x}px ${y - 60}px`}}>
        <ChipShadow>
          <rect x={-150} y={-10} width={300} height={104} rx={10} fill={SNOW_C} stroke={INK} strokeWidth={6} />
        </ChipShadow>
        <text x={0} y={20} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={28} fill={INK}>{text}</text>
        <text x={0} y={48} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={28} fill={INK}>{sub}</text>
        <text x={0} y={80} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={24} fill={HAZE}>{year}</text>
      </g>
    </g>
  );
};

const GearLever: React.FC<{x: number; y: number; f: number; pulled: number}> = ({x, y, f, pulled}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-80} y={-12} width={160} height={50} rx={12} fill="#8b93a0" stroke={INK} strokeWidth={6} />
    <circle cx={-46} cy={14} r={11} fill={GROUND_D} stroke={INK} strokeWidth={4} />
    <g transform={`rotate(${-38 + 38 * pulled} -46 14)`}>
      <rect x={-53} y={-4} width={13} height={78} rx={6.5} fill="#c9cfd8" stroke={INK} strokeWidth={5} />
      <circle cx={-46} cy={-6} r={14} fill={TEAL} stroke={INK} strokeWidth={5} />
    </g>
  </g>
);

const SurveyStake: React.FC<{x: number; y: number; s?: number; settle: number; f: number}> = ({x, y, s = 1, settle, f}) => {
  const spin = f * 4;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx={0} cy={4} rx={40} ry={9} fill={INK} opacity={0.25} />
      <g transform={`translate(0,${-32 * (1 - settle)})`} opacity={Math.min(1, settle * 1.6)}>
        <path d="M-10,0 L-10,-110 L0,-124 L10,-110 L10,0 Z" fill="#8a6239" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {/* small wind-turbine icon: a mast + spinning blades, the honest unresolved alternative */}
        <g transform="translate(0,-140)">
          <line x1={0} y1={0} x2={0} y2={-30} stroke={INK} strokeWidth={5} />
          <g transform={`translate(0,-30) rotate(${spin})`}>
            {[0, 120, 240].map((rot, i) => (
              <path key={i} d="M0,0 L5,-4 L34,0 L5,4 Z" fill={ICE} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" transform={`rotate(${rot})`} />
            ))}
            <circle r={5} fill={INK} />
          </g>
        </g>
      </g>
    </g>
  );
};

const PriceRuler: React.FC<{x: number; y: number; growT: number}> = ({x, y, growT}) => {
  const w = 460 * growT;
  return (
    <g transform={`translate(${x},${y})`} opacity={Math.min(1, growT * 3)}>
      <rect x={0} y={-22} width={w} height={44} rx={10} fill={HAZE} stroke={INK} strokeWidth={6} />
      {growT > 0.15 && (
        <text x={Math.min(w - 14, 14)} y={9} textAnchor="start" fontFamily={BOLD} fontWeight={900} fontSize={30} fill={SNOW} stroke={INK} strokeWidth={2} paintOrder="stroke">$90M</text>
      )}
      {growT > 0.9 && (
        <text x={w - 14} y={9} textAnchor="end" fontFamily={BOLD} fontWeight={900} fontSize={30} fill={SNOW} stroke={INK} strokeWidth={2} paintOrder="stroke">$120M</text>
      )}
    </g>
  );
};

// The order queue: a ticket-dispenser + a conveyor of riveted turbine crates
// receding to a horizon, with a running backlog counter and server-blue
// data-center silhouettes cutting into the line.
const TheQueue: React.FC<{f: number; recede: number; blueShare: number; counter: number}> = ({f, recede, blueShare, counter}) => {
  const n = 9;
  return (
    <g>
      {Array.from({length: n}).map((_, i) => {
        const t = i / (n - 1);
        const px = 200 + t * 780 * recede;
        const scale = 1.55 - t * 0.95;
        const py = 1280 - t * 260;
        const isBlue = i / n < blueShare;
        const t2 = tones(isBlue ? TEAL_D : '#7a8598');
        return (
          <g key={i} transform={`translate(${px},${py}) scale(${scale})`}>
            <FormGradient id={`q${i}`} t={t2} />
            <ContactShadow cx={0} cy={44} rx={70} ry={14} opacity={0.28} blur={8} />
            <rect x={-58} y={-90} width={116} height={130} rx={12} fill={`url(#q${i})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <rect x={-58} y={-90} width={30} height={130} rx={10} fill={t2.shade} opacity={0.5} />
            {isBlue && <circle cx={0} cy={-30} r={10} fill="#eafffe" opacity={0.8 + 0.2 * Math.sin(f / 5 + i)} />}
            {[-56, -20, 16].map((yy, j) => <line key={j} x1={-52} y1={yy} x2={52} y2={yy} stroke={INK} strokeWidth={3} opacity={0.4} />)}
          </g>
        );
      })}
      {/* ticket dispenser at the head of the line */}
      <g transform="translate(150,1290) scale(1.35)">
        <rect x={-56} y={-96} width={112} height={140} rx={14} fill={SNOW_C} stroke={INK} strokeWidth={6} />
        <rect x={-44} y={-80} width={88} height={44} rx={6} fill={INK} />
        <text x={0} y={-52} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={20} fill={TEAL}>NOW SERVING</text>
        <text x={0} y={20} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={38} fill={INK}>{Math.round(counter)}</text>
      </g>
    </g>
  );
};

// ================================================================ Patrice Lee's verbatim quote card (typewriter reveal)
const QuoteCard: React.FC<{x: number; y: number; revealT: number; op: number}> = ({x, y, revealT, op}) => {
  const full = 'You cannot add to the pollution\nin a non-attainment area, and\nbe legally correct.';
  const chars = Math.round(full.length * revealT);
  const shown = full.slice(0, chars);
  return (
    <g transform={`translate(${x},${y})`} opacity={op}>
      <rect x={-330} y={-118} width={660} height={200} rx={16} fill="#0f1522ee" stroke={SNOW_C} strokeWidth={5} />
      <text x={-300} y={-70} fontFamily="Georgia, serif" fontStyle="italic" fontSize={30} fill={SNOW_C}>
        {shown.split('\n').map((ln, i) => (
          <tspan key={i} x={-300} dy={i === 0 ? 0 : 38}>{ln}</tspan>
        ))}
      </text>
      <text x={-300} y={64} fontFamily={BOLD} fontWeight={900} fontSize={22} fill={TEAL}>PATRICE LEE, clean-air advocate</text>
    </g>
  );
};

// ================================================================ S1 — THE TICKET (cold open)
const S1: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const voice = useVoice();
  const e = entrance(f, fps, 2, {preset: {damping: 14, stiffness: 130}});
  const push = interpolate(f, [0, 205], [1.0, 1.035], {extrapolateRight: 'clamp'});
  const labelIn = spring({frame: f - 30, fps, config: {damping: 13, stiffness: 140}});
  const accent = accentKick(f, fps, 76);
  return (
    <AbsoluteFill style={{backgroundColor: SKY, transform: `scale(${push})`, transformOrigin: '50% 62%'}}>
      <FrostYardBG f={f} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <g transform={`translate(0,${20 * (1 - e.scale)}) scale(${e.scale})`} style={{transformOrigin: '540px 1300px'}}>
          <Sourdough frame={f} x={540} y={1440} scale={1.5} emotion="proud" glow={1} accent={accent} />
        </g>
        {labelIn > 0.02 && (
          <g transform={`translate(720,${1200 - 40 * (1 - labelIn)})`} opacity={labelIn}>
            <ChipShadow><BoxLabel x={0} y={0} text="$50,000 HOLD" w={340} h={78} fs={36} fill={EMBER} color={INK} /></ChipShadow>
          </g>
        )}
      </svg>
      <div style={{position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `translateY(${-120 * (1 - e.scale)}px)`}}>
        <div style={{background: '#0f1522', border: `8px solid ${SNOW_C}`, borderRadius: 14, padding: '22px 38px', maxWidth: 900}}>
          <div style={{fontFamily: BOLD, fontWeight: 900, fontSize: 68, lineHeight: 1.08, color: SNOW, textAlign: 'center'}}>
            He Paid $50K<br />Just To Wait.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================ S2 — THE GLOBAL QUEUE
const S2: React.FC = () => {
  const f = useCurrentFrame();
  const recede = interpolate(f, [0, 130], [0.15, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const pullBack = interpolate(f, [0, 100], [1.3, 1.0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const blueShare = interpolate(f, [60, 180], [0, 0.35], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const counter = interpolate(f, [90, 230], [0, 96], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const statIn = spring({frame: f - 180, fps: 30, config: {damping: 12, stiffness: 120}});
  return (
    <AbsoluteFill style={{backgroundColor: SKY, transform: `scale(${pullBack})`, transformOrigin: '540px 900px'}}>
      <FrostYardBG f={f} parallax={0.6} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <MotionBlur vx={recede < 0.9 ? 6 : 0}>
          <TheQueue f={f} recede={recede} blueShare={blueShare} counter={counter} />
        </MotionBlur>
      </svg>
      {statIn > 0.02 && (
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
          <g transform={`translate(780,${820 - 40 * (1 - statIn)}) scale(${statIn})`}>
            <ChipShadow><StatBurst cx={0} cy={0} scale={1.05} big="~100 GW" lines={['GE VERNOVA', 'BACKLOG']} fill={TEAL} /></ChipShadow>
          </g>
        </svg>
      )}
      <div style={{position: 'absolute', top: 260, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{background: '#0f1522cc', border: `6px solid ${TEAL}`, borderRadius: 12, padding: '14px 30px'}}>
          <div style={{fontFamily: BOLD, fontWeight: 900, fontSize: 30, color: SNOW, textAlign: 'center'}}>A GLOBAL AI-DRIVEN BACKLOG</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================ S3 — THE STAT PANEL (Moose gag + Siemens)
const S3: React.FC = () => {
  const f = useCurrentFrame();
  const bumpKick = accentKick(f, 30, 20, 0.5) + accentKick(f, 30, 150, 0.5) * 0.85;
  const fifthIn = spring({frame: f - 4, fps: 30, config: {damping: 12, stiffness: 130}});
  const siemensIn = spring({frame: f - 100, fps: 30, config: {damping: 12, stiffness: 110}});
  const blueShare2 = interpolate(f, [100, 210], [0.15, 0.65], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: '#111a30'}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        {/* HUD instrument frame */}
        <rect x={40} y={220} width={1000} height={1480} rx={28} fill="none" stroke={TEAL} strokeWidth={5} opacity={0.4} />
        <g transform="translate(0,380) scale(1.35)">
          <TheQueue f={f} recede={1} blueShare={blueShare2} counter={96} />
        </g>
        {/* the Moose, bumped from the dispenser -- comic gag, dramatizes the AI share */}
        <g transform="translate(880,1360) scale(1.1)">
          <Moose x={0} y={0} f={f} scale={1} facing={-1} bumpKick={Math.min(1, bumpKick)} />
        </g>
      </svg>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <g transform={`translate(300,${820 - 30 * (1 - fifthIn)}) scale(${fifthIn})`}>
          <ChipShadow><StatBurst cx={0} cy={0} scale={0.92} big="1/5" lines={['OF IT:', 'DATA CENTERS']} fill={TEAL} /></ChipShadow>
        </g>
        {siemensIn > 0.02 && (
          <g transform={`translate(780,${820 - 30 * (1 - siemensIn)}) scale(${siemensIn})`} opacity={siemensIn}>
            <ChipShadow><StatBurst cx={0} cy={0} scale={1.05} big="60%+" lines={['SIEMENS ENERGY', '2026 ORDERS']} fill={HAZE} /></ChipShadow>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

// ================================================================ S4 — THE DOORS CLOSE / THE BET (two-up)
const S4: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sign1 = spring({frame: f - 4, fps, config: {damping: 12, stiffness: 120}});
  const sign2 = spring({frame: f - 130, fps, config: {damping: 12, stiffness: 120}});
  const turbineIn = spring({frame: f - 220, fps, config: {damping: 13, stiffness: 100}});
  const rulerT = interpolate(f, [260, 360], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const cellCharge: 0 | 1 | 2 = f > 330 ? 2 : f > 260 ? 1 : 0;
  const accent = accentKick(f, fps, 260);
  return (
    <AbsoluteFill style={{backgroundColor: '#233047'}}>
      <FrostYardBG f={f} parallax={0.4} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        {sign1 > 0.02 && <g opacity={sign1}><SwingSign x={280} y={520} f={f} text="CHEAP SOUTHCENTRAL" sub="POWER: LOST" year="2024" /></g>}
        {sign2 > 0.02 && <g opacity={sign2}><SwingSign x={720} y={620} f={f} text="ENSTAR GAS" sub="CONTRACT: ENDED" year="2025" /></g>}
      </svg>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        {/* the veteran 2006 unit */}
        <g transform="translate(320,1500) scale(0.5)" opacity={0.85}>
          <Sourdough frame={f} x={0} y={0} scale={1} emotion="confident" glow={0.85} />
        </g>
        {/* the new turbine + battery bet, sliding in */}
        <g transform={`translate(${760 - 60 * (1 - turbineIn)},1500) scale(${0.62 * Math.min(1, turbineIn)})`} opacity={Math.min(1, turbineIn * 1.4)}>
          <Sourdough frame={f} x={0} y={0} scale={1} emotion="confident" glow={1} accent={accent} />
          <Cell frame={f} x={190} y={40} scale={0.9} chargeLevel={cellCharge} />
        </g>
        {rulerT > 0.01 && <PriceRuler x={310} y={1780} growT={rulerT} />}
      </svg>
      <div style={{position: 'absolute', top: 1840, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: rulerT > 0.5 ? 1 : 0}}>
        <div style={{fontFamily: BOLD, fontWeight: 900, fontSize: 26, color: SNOW_C}}>+ A BATTERY BET</div>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================ S5 — THE HAZE (signature turn: push through chest, tilt up)
const S5: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const push = interpolate(f, [0, 90], [1.0, 1.5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
  const tiltUp = interpolate(f, [40, 130], [0, -260], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const hazeAmount = interpolate(f, [70, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const glow = interpolate(f, [70, 170], [1, 0.35], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const stampIn = spring({frame: f - 90, fps, config: {damping: 12, stiffness: 140}});
  const leeIn = spring({frame: f - 150, fps, config: {damping: 12, stiffness: 110}});
  const quoteT = interpolate(f, [180, 260], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const stakeSettle = interpolate(f, [240, 270], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: SKY, transform: `scale(${push}) translateY(${tiltUp}px)`, transformOrigin: '50% 68%'}}>
      <FrostYardBG f={f} parallax={0.3} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <Sourdough frame={f} x={420} y={1560} scale={1.4} emotion={hazeAmount > 0.4 ? 'faltering' : 'confident'} glow={glow} />
        {leeIn > 0.02 && (
          <g opacity={leeIn} transform="translate(0,0)">
            <Character frame={f} pose="arms-crossed" emotion="worried" outfit="puffer" headgear="beanie" facing={-1} scale={1.3} x={860} y={1660} />
          </g>
        )}
        {stakeSettle > 0.01 && <SurveyStake x={720} y={1740} s={1.0} settle={stakeSettle} f={f} />}
      </svg>
      <HazeOverlay amount={hazeAmount} color={HAZE} />
      {stampIn > 0.02 && (
        <div style={{position: 'absolute', top: 460, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: stampIn, transform: `scale(${stampIn})`}}>
          <div style={{background: HAZE, border: `8px solid ${INK}`, borderRadius: 14, padding: '18px 32px'}}>
            <div style={{fontFamily: BOLD, fontWeight: 900, fontSize: 34, color: SNOW, textAlign: 'center', letterSpacing: 1}}>FEDERAL PM2.5<br />NON-ATTAINMENT ZONE</div>
          </div>
        </div>
      )}
      {quoteT > 0.02 && <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}><QuoteCard x={540} y={960} revealT={quoteT} op={Math.min(1, quoteT * 3)} /></svg>}
    </AbsoluteFill>
  );
};

// ================================================================ S6 — THE FREEZE (loopback button)
const S6: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const leverIn = spring({frame: f - 4, fps, config: {damping: 12, stiffness: 120}});
  const pulled = interpolate(f, [30, 80], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const pullBack2 = interpolate(f, [30, 80], [1, 0.5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const freezeIn = spring({frame: f - 85, fps, config: {damping: 14, stiffness: 100}});
  const mooseIn = spring({frame: f - 110, fps, config: {damping: 12, stiffness: 130}});
  const sway = idleSway(f, 3, 1.2, 60);
  return (
    <AbsoluteFill style={{backgroundColor: SKY}}>
      <FrostYardBG f={f} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <g opacity={Math.max(0, 1 - pullBack2)}>
          <GearLever x={540} y={800} f={f} pulled={pulled * 0.4} />
          <Nameplate x={540} y={900} text="BOARD VOTE" sub="JULY 28, 2026" op={leverIn} />
        </g>
        <g transform={`translate(0,${freezeIn < 0.6 ? (1 - freezeIn) * 40 : sway})`}>
          <Sourdough frame={f} x={540} y={1440} scale={1.5} emotion="frozen" glow={0.55} />
        </g>
        {/* pen hovering over an unsigned ballot */}
        {freezeIn > 0.2 && (
          <g transform={`translate(700,1300) rotate(-18) translate(0,${3 * Math.sin(f / 3)})`} opacity={Math.min(1, freezeIn)}>
            <rect x={-90} y={0} width={180} height={130} rx={8} fill={SNOW} stroke={INK} strokeWidth={5} />
            {[24, 46, 68, 90].map((yy, i) => <line key={i} x1={-70} y1={yy} x2={70} y2={yy} stroke="#c9c2ad" strokeWidth={3} />)}
            <path d="M-6,-90 L-6,10 L8,10 L8,-90 Z" fill="#2b2f38" stroke={INK} strokeWidth={4} strokeLinejoin="round" transform="translate(30,0) rotate(20)" />
          </g>
        )}
        {mooseIn > 0.02 && (
          <g transform={`translate(160,${1620 - 30 * (1 - mooseIn)}) scale(0.5)`} opacity={mooseIn}>
            <Moose x={0} y={0} f={f} scale={1} facing={1} />
            <g transform="translate(140,-260)">
              <ChipShadow><BoxLabel x={0} y={0} text="#4,000,001" w={280} h={64} fs={30} fill={ICE} sub="DATA CENTERS AHEAD OF YOU" /></ChipShadow>
            </g>
          </g>
        )}
      </svg>
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
      <div style={{background: 'rgba(16,20,30,0.82)', borderRadius: 14, padding: '16px 30px', maxWidth: 940, border: `4px solid ${SNOW_C}`}}>
        <div style={{fontFamily: BOLD, fontWeight: 900, fontSize: 46, lineHeight: 1.12, color: '#fff', textAlign: 'center', letterSpacing: 0.5, textShadow: `2px 3px 0 rgba(0,0,0,0.6)`}}>
          {cue.text}
        </div>
      </div>
    </div>
  );
};

// ================================================================ TIMELINE
const SCENE_COMPONENTS: React.FC[] = [S1, S2, S3, S4, S5, S6];
// Fallback bounds (30fps); scripts/build_scenes.py overrides with the actual
// synthesized VO timing at render time (out/dispatch/episode_props.json).
const DEFAULT_BOUNDS: {from: number; dur: number}[] = [
  {from: 0, dur: 205}, {from: 205, dur: 252}, {from: 457, dur: 215},
  {from: 672, dur: 388}, {from: 1060, dur: 275}, {from: 1335, dur: 214},
];

const GradedGrade: React.FC = () => {
  const f = useCurrentFrame();
  return <GradeLayer f={f} bloom={0.5} vignette={0.52} grain={0.05} warmth={0.07} />;
};

export const Episode: React.FC<EpisodeProps> = ({captions, scenes, mouth, accents}) => {
  const bounds = scenes && scenes.length === SCENE_COMPONENTS.length ? scenes : DEFAULT_BOUNDS;
  const voice = mouth && mouth.length ? {fps: 30, mouth, accents: accents ?? []} : null;
  return (
    <AbsoluteFill style={{backgroundColor: SKY}}>
      <VoiceProvider data={voice}>
      {SCENE_COMPONENTS.map((C, i) => (
        <Sequence key={i} from={bounds[i].from} durationInFrames={bounds[i].dur} name={`S${i + 1}`}>
          <C />
        </Sequence>
      ))}
      <GradedGrade />
      <Captions captions={captions} />
      </VoiceProvider>
    </AbsoluteFill>
  );
};
