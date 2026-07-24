import React from 'react';
import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {z} from 'zod';
import {VoiceProvider, useVoice, ambientMouth} from './lib/voice';
import {Character} from './lib/Character';
import {Petrel, PetrelDock, BoxLabel, StatBurst, FatArrow, INK} from './lib/kit';
import {tones, FormGradient, RimLight, ContactShadow, GradeLayer, MotionBlur} from './lib/lighting';
import {entrance, followThrough, accentKick, idleSway} from './lib/motion';

const BOLD = 'Arial Black, Arial, sans-serif';

// ---- 2026-07-24 palette (art_direction-locked: warm Yukon-Kuskokwim tundra dusk;
// blue quarantined to the industry render; coral RESERVED for human-decisive beats) ----
const SKY = '#F4C15A';
const SKY_D = '#E0922E';   // ember-amber dusk band (kept clear of the reserved coral)
const GROUND = '#7E8B5A';
const GROUND_D = '#5C6A44';
const GOLD = '#C9A24B';
const WATER = '#5E6B45';
const WATER_D = '#45502F';
const CREAM = '#EBD9B0';
const CORAL = '#FF5A3C';    // RESERVED: found bloom + empty WHERE-TO-LOOK slot only
const COLD = '#8B98A6';     // quarantined industry slate
const COLD_D = '#5E6B78';
const SHADOW = '#2A3428';
const TEXT = '#F5ECD6';
const INKW = '#171b10';     // warm near-black
const RED_S = '#B5502F';    // muted brick red (ATV body; distinct from reserved coral)

// smooth 0..1 ramp helper
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// ============================================================ shared tundra/delta world
// Braided Y-K Delta: sky, ember dusk band, distant range, tundra band, and braided sloughs.
// `push` scales the whole world (slow camera push), `parallax` drifts far layers.
const TundraDelta: React.FC<{f: number; push?: number; skyOnly?: boolean}> = ({f, push = 0, skyOnly = false}) => {
  const drift = f * 0.2;
  return (
    <g>
      {/* sky */}
      <defs>
        <linearGradient id="tdSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SKY} />
          <stop offset="46%" stopColor={SKY_D} />
          <stop offset="100%" stopColor="#B87A34" />
        </linearGradient>
      </defs>
      <rect x={-100} y={-100} width={1280} height={2120} fill="url(#tdSky)" />
      {/* low sun glow (screen-left low) */}
      <circle cx={210} cy={430} r={150} fill="#FFE6A8" opacity={0.55} style={{filter: 'blur(30px)'}} />
      {/* drifting clouds */}
      {[[200, 360, 1], [720, 300, 0.8], [500, 520, 0.6]].map(([cx, cy, o], i) => (
        <ellipse key={i} cx={((cx as number) + drift * (0.3 + i * 0.2)) % 1300 - 60} cy={cy as number} rx={150} ry={30} fill="#FFF3D6" opacity={0.22 * (o as number)} />
      ))}
      {!skyOnly && <>
        {/* distant range (parallax) */}
        <g transform={`translate(${-drift * 0.12},0)`}>
          <path d={`M-100,760 L160,650 L360,720 L620,610 L860,700 L1180,640 L1180,900 L-100,900 Z`} fill="#8B7E6A" opacity={0.5} />
          <path d={`M-100,780 L260,700 L520,760 L780,680 L1180,740 L1180,900 L-100,900 Z`} fill="#7A6E5C" opacity={0.4} />
        </g>
        {/* tundra band */}
        <rect x={-100} y={820} width={1280} height={1200} fill={GROUND} />
        <rect x={-100} y={820} width={1280} height={1200} fill={GROUND_D} opacity={0.0} />
        {/* lichen speckle */}
        {Array.from({length: 60}).map((_, i) => {
          const sx = (i * 197) % 1180 - 40, sy = 900 + ((i * 313) % 900);
          return <ellipse key={i} cx={sx} cy={sy} rx={10} ry={5} fill={i % 3 ? GOLD : GROUND_D} opacity={0.16} />;
        })}
      </>}
    </g>
  );
};

// braided sloughs seen top-down: a DENSE water maze cut into tundra land. `warmOne` (>=0) lights
// ONE channel coral-gold (the signature). `multiply` grows the channel count (the maze multiplies).
const CHANS = [
  'M-60,340 Q220,460 380,340 T760,400 T1200,330',
  'M-60,520 Q300,440 520,560 T980,520 T1200,580',
  'M-60,700 Q200,820 460,720 T900,780 T1200,720',
  'M-60,900 Q320,820 560,940 T1000,900 T1200,960',
  'M-60,1090 Q240,1210 500,1110 T940,1160 T1200,1100',
  'M-60,1290 Q300,1210 580,1330 T1020,1290 T1200,1350',
  'M-60,1480 Q220,1600 480,1500 T920,1560 T1200,1500',
  'M-60,1670 Q320,1590 600,1710 T1040,1670 T1200,1720',
];
// vertical cross-cuts for a real braided-maze feel
const CROSS = ['M240,300 Q300,700 260,1100 T300,1720', 'M620,300 Q560,720 620,1120 T580,1720', 'M900,300 Q960,700 900,1120 T940,1720'];
const SloughMaze: React.FC<{f: number; multiply?: number; warmOne?: number; grey?: boolean; spawn?: number}> = ({f, multiply = 1, warmOne = -1, grey = false, spawn = 1}) => {
  const m = Math.min(1, multiply);
  const land = grey ? '#6f7468' : GROUND;
  const landD = grey ? '#565b50' : GROUND_D;
  const water = grey ? '#4c5346' : WATER;
  const waterCore = grey ? '#5a6252' : '#6E7A50';
  // each channel SPAWNS in (draws itself) as the maze multiplies — a visible branching, not a static grid.
  // channel i is fully in once spawn passes i/total; it draws in over a short window via stroke dashoffset.
  const total = CHANS.length;
  const chanReveal = (i: number, cross = false) => {
    const order = cross ? (total + i * 1.4) : i;           // crosses spawn last
    const denom = total + CROSS.length * 1.4;
    const t = Math.max(0, Math.min(1, (spawn * denom - order) / 1.3));
    return t;
  };
  const drawChan = (d: string, i: number, cross = false) => {
    const isWarm = i === warmOne && !cross;
    const rev = isWarm ? 1 : chanReveal(i, cross);
    if (rev <= 0.01) return null;
    const DASH = 1600, off = DASH * (1 - rev);
    return (
      <g key={`${cross ? 'x' : 'c'}${i}`}>
        <path d={d} fill="none" stroke={landD} strokeWidth={cross ? 44 : 62} strokeLinecap="round" opacity={0.55} strokeDasharray={DASH} strokeDashoffset={off} />
        <path d={d} fill="none" stroke={isWarm ? GOLD : water} strokeWidth={cross ? 30 : 44} strokeLinecap="round"
          style={isWarm ? {filter: `drop-shadow(0 0 16px ${CORAL})`} : undefined} strokeDasharray={DASH} strokeDashoffset={off} />
        <path d={d} fill="none" stroke={isWarm ? '#FFE6A8' : waterCore} strokeWidth={cross ? 12 : 18} strokeLinecap="round" opacity={isWarm ? 0.8 : 0.5} strokeDasharray={DASH} strokeDashoffset={off} />
        {isWarm && <path d={d} fill="none" stroke={CORAL} strokeWidth={7} strokeLinecap="round" opacity={0.6 + 0.35 * Math.sin(f / 5)} />}
      </g>
    );
  };
  return (
    <g>
      <rect x={-60} y={200} width={1260} height={1560} fill={land} />
      {Array.from({length: 16}).map((_, i) => {
        const px = (i * 271) % 1120 - 20, py = 260 + ((i * 421) % 1440);
        return <ellipse key={`p${i}`} cx={px} cy={py} rx={16 + (i % 3) * 8} ry={10 + (i % 2) * 6} fill={grey ? '#565b50' : WATER} opacity={0.5} />;
      })}
      {CROSS.map((d, i) => drawChan(d, i, true))}
      {CHANS.map((d, i) => drawChan(d, i))}
    </g>
  );
};

// warm coral-on-cool thermal wash for the FOUND beat (bespoke, honors the reserved-coral rule).
// The hot bloom is a soft ABSTRACT heat signature (no face/figure). amount 0..1 crossfades it in.
const WarmThermal: React.FC<{f: number; amount: number; bx: number; by: number}> = ({f, amount, bx, by}) => {
  const a = Math.max(0, Math.min(1, amount));
  if (a < 0.01) return null;
  const pulse2 = 0.9 + 0.1 * Math.sin(f / 6);
  return (
    <>
      <rect x={0} y={0} width={1080} height={1920} fill="#123028" opacity={0.6 * a} />
      <svg width={1080} height={1920} style={{position: 'absolute', mixBlendMode: 'screen', opacity: a}}>
        <radialGradient id="wt_field" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#2f6f5a" />
          <stop offset="100%" stopColor="#0c2019" />
        </radialGradient>
        <rect width={1080} height={1920} fill="url(#wt_field)" />
        <radialGradient id="wt_heat" cx={`${(bx / 1080) * 100}%`} cy={`${(by / 1920) * 100}%`} r="16%">
          <stop offset="0%" stopColor="#FFE28A" />
          <stop offset="40%" stopColor={CORAL} />
          <stop offset="100%" stopColor="#0c2019" stopOpacity={0} />
        </radialGradient>
        <rect width={1080} height={1920} fill="url(#wt_heat)" opacity={pulse2} />
      </svg>
      {/* scanlines */}
      <svg width={1080} height={1920} style={{position: 'absolute', opacity: 0.15 * a}}>
        {Array.from({length: 160}).map((_, i) => <line key={i} x1={0} y1={i * 12} x2={1080} y2={i * 12} stroke="#8ff0c0" strokeWidth={1} />)}
      </svg>
    </>
  );
};

// a shouty warm on-screen label built on the form-shaded BoxLabel
const Kicker: React.FC<{x: number; y: number; t: string; c?: string; fill?: string; w?: number; fs?: number; rot?: number}> =
  ({x, y, t, c = INK, fill = CREAM, w = 360, fs = 40, rot = 0}) => <BoxLabel x={x} y={y} text={t} w={w} fs={fs} fill={fill} color={c} rot={rot} />;

// a clear POINTING HAND (fist + extended index finger) at (x,y), aimed by `rot` degrees, `s` scale.
const PointingHand: React.FC<{x: number; y: number; rot?: number; s?: number}> = ({x, y, rot = 0, s = 1}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <ContactShadow cx={40} cy={70} rx={70} ry={14} opacity={0.22} />
    {/* forearm cuff */}
    <path d="M-70,20 Q-70,-24 -30,-24 L10,-24 L10,44 L-30,44 Q-70,44 -70,20 Z" fill="#c98a3a" stroke={INK} strokeWidth={7} />
    {/* fist */}
    <path d="M-6,-28 Q60,-32 66,4 Q68,40 20,46 L-8,46 Q-30,44 -30,10 Q-30,-26 -6,-28 Z" fill="#e8b48c" stroke={INK} strokeWidth={7} />
    {/* curled knuckles */}
    {[-8, 8, 24].map((ky, i) => <path key={i} d={`M40,${ky} q16,3 16,14`} fill="none" stroke={INK} strokeWidth={4} opacity={0.5} />)}
    {/* extended index finger */}
    <path d="M52,-14 L150,-22 Q166,-22 166,-8 Q166,6 150,6 L52,10 Z" fill="#e8b48c" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    {/* thumb */}
    <path d="M2,-24 Q-8,-46 16,-50 Q34,-50 30,-30 Z" fill="#e8b48c" stroke={INK} strokeWidth={6} />
  </g>
);

export const episodeSchema = z.object({
  captions: z.array(z.object({text: z.string(), start: z.number(), end: z.number(), seg: z.number()})),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
});
export type EpisodeProps = z.infer<typeof episodeSchema>;

// ================================================================= S1 — the industry plan
const S1: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const voice = useVoice();
  const push = ramp(f, 0, 232) * 0.05;
  // frame 0 must be a BOLD poster (HOOK_CRAFT): the box already half-open, Petrel already
  // mid-frame with its bold teal eye, and the claim burned in from f=0.
  const lid = 0.5 + 0.5 * spring({frame: f - 3, fps, config: {damping: 11, stiffness: 130}});
  const rise = spring({frame: f, fps, config: {damping: 13, stiffness: 200}});
  const petY = 940 - rise * 40;
  const acc = voice.accentAt(from + f);
  const fleet = ramp(f, 150, 232);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <g transform={`translate(540,960) scale(${1 + push}) translate(-540,-960)`}>
          <TundraDelta f={f} />
          {/* burned-in poster claim, present from frame 0 */}
          <Kicker x={540} y={300} t="REMOVE THE PILOT" fill={COLD} c={TEXT} w={600} fs={56} />
          {/* cold fleet grid stacking in behind (industry scale) */}
          <g opacity={fleet * 0.9} transform="translate(0,-30)">
            {Array.from({length: 8}).map((_, i) => {
              const gx = 720 + (i % 4) * 82, gy = 560 + Math.floor(i / 4) * 92;
              const on = ((f / 6 + i) % 9) < 4;
              return (
                <g key={i} transform={`translate(${gx},${gy}) scale(${0.5 * Math.min(1, fleet * 1.4 - i * 0.08)})`}>
                  <rect x={-52} y={-34} width={104} height={68} rx={8} fill={COLD} stroke={INK} strokeWidth={6} />
                  <rect x={30} y={-34} width={22} height={68} rx={4} fill={COLD_D} opacity={0.6} />
                  <circle cx={-34} cy={-20} r={5} fill={on ? '#7fd7ff' : '#28425a'} stroke={INK} strokeWidth={2} />
                </g>
              );
            })}
          </g>
          {/* the drone-in-a-box + Petrel bragging */}
          <PetrelDock f={f} x={430} y={1200} scale={1.15} lidOpen={lid} />
          <g transform={`translate(0,${accentKick(from + f, fps, from + 90) * -8})`}>
            <Petrel frame={f} x={430} y={petY} scale={0.92} emotion="cocky" eyeDilate={0.8} accent={acc} heading={0} groundY={petY < 1080 ? undefined : 96} />
          </g>
          {/* brag banner */}
          {rise > 0.4 && (
            <g transform={`translate(430,${petY - 150}) rotate(${followThrough(f, fps, 20, 3) * 2})`} opacity={ramp(f, 30, 60)}>
              <Kicker x={0} y={0} t="FLIES ITSELF" fill={GOLD} c={INK} w={340} fs={40} />
            </g>
          )}
          <Kicker x={860} y={470} t="drone-in-a-box" fill={COLD} c={TEXT} w={300} fs={30} />
          <Kicker x={860} y={520} t="SOAR 2025" fill={COLD_D} c={TEXT} w={230} fs={26} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ================================================================= S2 — the enormous delta
const S2: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const voice = useVoice();
  // crane pull-back reveal: start close+low, rise and pull back to reveal the scale (a real camera move)
  const outT = interpolate(f, [0, 150], [1.6, 1.0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const camY = interpolate(f, [0, 150], [360, -140], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const droneX = 540 + 40 * Math.sin(f / 40);
  const people = ramp(f, 96, 150);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <g transform={`translate(540,760) scale(${outT}) translate(-540,${-760 + camY})`}>
          <TundraDelta f={f} />
          <g transform="translate(0,120)"><SloughMaze f={f} multiply={1} spawn={0.55} /></g>
          {/* tiny lone drone against the huge country */}
          <Petrel frame={f} x={droneX} y={640} scale={0.34} emotion="eager" eyeDilate={1} />
          <g opacity={people}>
            {/* two SAR volunteers dwarfed at the edge */}
            <Character frame={f} x={470} y={1560} scale={0.5} pose="stand" emotion="neutral" outfit="parka" headgear="beanie" facing={1} />
            <Character frame={f + 20} x={600} y={1575} scale={0.46} pose="stand" emotion="neutral" outfit="worker" headgear="cap" facing={-1} />
            <Kicker x={540} y={1350} t="A SMALL TEAM" fill={CREAM} w={380} fs={38} />
          </g>
        </g>
        <g opacity={ramp(f, 20, 50)}><Kicker x={540} y={260} t="Yukon-Kuskokwim Delta" fill={CREAM} w={560} fs={40} /></g>
      </svg>
    </AbsoluteFill>
  );
};

// ================================================================= S3 — Byron Petluska / SAR
const S3: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const voice = useVoice();
  const talk = ambientMouth(voice.opennessAt(from + f), f);
  // radio pings scratch track-lines across the land behind him
  const pings = [40, 78, 120, 158];
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <TundraDelta f={f} push={0} />
        {/* accumulating SEARCH TRACKS on the land (thin dashed GPS-style paths, a start dot + arrow tip) */}
        {pings.map((p, i) => {
          const t = ramp(f, p, p + 16);
          const y = 980 + i * 52;
          const d = `M150,${y} Q380,${y - 46} 640,${y - 6} T1000,${y - 26}`;
          const DASH = 1100;
          return (
            <g key={i} opacity={t}>
              <path d={d} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" opacity={0.35} strokeDasharray="2 20" strokeDashoffset={DASH * (1 - t)} />
              <path d={d} fill="none" stroke={GOLD} strokeWidth={5} strokeLinecap="round" strokeDasharray="18 14" strokeDashoffset={DASH * (1 - t)} />
              <circle cx={150} cy={y} r={9} fill={GOLD} stroke={INK} strokeWidth={4} />
              {t > 0.9 && <path d={`M1000,${y - 26} l-26,-8 M1000,${y - 26} l-20,16`} stroke={GOLD} strokeWidth={6} strokeLinecap="round" />}
            </g>
          );
        })}
        {/* Byron, dignified, keying a radio */}
        <Character frame={f} x={430} y={1620} scale={1.0} pose="point" emotion="neutral" outfit="parka" headgear="beanie" facing={1} talking={talk} />
        {/* four-wheeler (ATV): fat knobby tires, fenders, seat, handlebars, front rack + antenna */}
        <g transform="translate(720,1540)">
          <ContactShadow cx={0} cy={92} rx={150} ry={22} opacity={0.32} />
          {/* wheels (fat knobby) */}
          {[-96, 96].map((wx, i) => (
            <g key={i}><circle cx={wx} cy={62} r={50} fill={INKW} stroke={INK} strokeWidth={8} /><circle cx={wx} cy={62} r={22} fill={GROUND_D} stroke={INK} strokeWidth={5} />
              {Array.from({length: 8}).map((_, k) => <line key={k} x1={wx + 50 * Math.cos(k * 0.785)} y1={62 + 50 * Math.sin(k * 0.785)} x2={wx + 40 * Math.cos(k * 0.785)} y2={62 + 40 * Math.sin(k * 0.785)} stroke={INK} strokeWidth={4} />)}
            </g>
          ))}
          {/* fenders over the wheels */}
          <path d="M-150,44 Q-96,-18 -42,44 Z" fill={RED_S} stroke={INK} strokeWidth={7} />
          <path d="M42,44 Q96,-18 150,44 Z" fill={RED_S} stroke={INK} strokeWidth={7} />
          {/* body + seat */}
          <path d="M-120,26 Q-120,-8 -70,-8 L70,-8 Q120,-8 120,26 L120,40 L-120,40 Z" fill={RED_S} stroke={INK} strokeWidth={7} />
          <path d="M-8,-8 Q-8,-40 40,-38 Q86,-36 86,-8 Z" fill={INKW} stroke={INK} strokeWidth={7} />
          {/* handlebars + front rack + antenna */}
          <line x1={-96} y1={-8} x2={-118} y2={-64} stroke={INK} strokeWidth={9} strokeLinecap="round" />
          <line x1={-134} y1={-64} x2={-100} y2={-64} stroke={INK} strokeWidth={9} strokeLinecap="round" />
          <rect x={-140} y={-2} width={44} height={22} rx={5} fill={GOLD} stroke={INK} strokeWidth={5} />
          <line x1={112} y1={0} x2={128} y2={-96} stroke={INK} strokeWidth={5} strokeLinecap="round" transform={`rotate(${idleSway(f, 0, 3, 40)} 112 0)`} />
        </g>
        <g opacity={ramp(f, 10, 30)}><Kicker x={540} y={250} t="Byron Petluska" fill={CREAM} w={430} fs={40} /></g>
        <g opacity={ramp(f, 30, 50)}><Kicker x={540} y={320} t="Quinhagak SAR" fill={GOLD} c={INK} w={330} fs={30} /></g>
        <g opacity={ramp(f, 96, 120)}><Kicker x={540} y={1810} t="weekly, sometimes daily" fill={GOLD} c={INK} w={470} fs={36} /></g>
      </svg>
    </AbsoluteFill>
  );
};

// ================================================================= S4 — the maze it cannot resolve
const S4: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const voice = useVoice();
  const mult = interpolate(f, [15, 130], [0.35, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const slotPulse = 0.6 + 0.4 * Math.sin(f / 6);
  const scanSweep = 260 * Math.sin(f / 22);            // the cone rakes side to side, finding nothing
  const petLost = 12 * Math.sin(f / 14) + 5 * Math.sin(f / 31);
  const acc = voice.accentAt(from + f);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect width={1080} height={1920} fill={WATER_D} />
        {/* top-down maze VISIBLY multiplying (channels spawn in); NO answer path shown yet */}
        <SloughMaze f={f} multiply={1} spawn={mult} warmOne={-1} grey={false} />
        {/* scan cone raking, finding nothing */}
        <path d={`M540,880 L${400 + scanSweep},1240 L${680 + scanSweep},1240 Z`} fill={CREAM} opacity={0.12} />
        {/* Petrel hovering uncertain over the maze (a bigger lost wobble + drift) */}
        <g transform={`translate(${18 * Math.sin(f / 26)},0) rotate(${petLost} 540 800)`}>
          <Petrel frame={f} x={540} y={800} scale={0.7} emotion="lost" eyeDilate={1} accent={acc} heading={petLost} />
        </g>
        {/* the empty WHERE TO LOOK slot (coral, blinking, unfilled) — held clear of the caption with a dark backing */}
        <g transform="translate(540,1250)" opacity={ramp(f, 55, 85)}>
          <rect x={-280} y={-62} width={560} height={124} rx={16} fill={SHADOW} opacity={0.72} />
          <rect x={-280} y={-62} width={560} height={124} rx={16} fill="none" stroke={CORAL} strokeWidth={8} strokeDasharray="20 15" opacity={slotPulse} />
          <text x={0} y={18} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={56} fill={CORAL} opacity={slotPulse} letterSpacing={2}>WHERE TO LOOK?</text>
        </g>
        <g opacity={ramp(f, 6, 24)}><Kicker x={540} y={170} t="flies anywhere" fill={COLD} c={TEXT} w={340} fs={36} /></g>
      </svg>
    </AbsoluteFill>
  );
};

// ================================================================= S5 — knowledge fills the slot
const S5: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const voice = useVoice();
  const talk = ambientMouth(voice.opennessAt(from + f), f);
  const acc = voice.accentAt(from + f);
  // sub-beat A (0..~140): the maze, a hand traces ONE slough -> it warms coral-gold (signature)
  // sub-beat B (~150..end): the pilot points, Petrel snaps to heading, thermal begins
  const trace = ramp(f, 40, 110);
  const snap = spring({frame: f - 165, fps, config: {damping: 8, stiffness: 135}});  // overshoots then settles
  const heading = -40 * snap;                       // Petrel snaps to the pointed heading
  const petRot = -18 * snap;                        // body commits with a visible rotation
  const snapVx = -95 * Math.max(0, Math.min(1, snap * (1 - snap) * 4));  // smear PEAKS mid-turn, not at rest
  const thermalIn = ramp(f, 210, 300);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect width={1080} height={1920} fill={WATER_D} />
        <SloughMaze f={f} multiply={1} warmOne={trace > 0.4 ? 2 : -1} grey={trace < 0.9} />
        {/* the tracing hand (macro, dignified, no full portrait) */}
        <g opacity={ramp(f, 10, 40)}>
          <PointingHand x={280 + trace * 250} y={940 - trace * 30} rot={-14} s={1.15} />
        </g>
        {/* Petrel snapping to the pointed heading (anticipation dip built into the spring, real smear) */}
        <g opacity={ramp(f, 150, 180)}>
          <MotionBlur vx={snapVx} gain={0.6}>
            <g transform={`translate(${640 + snapVx * 0.4},760) rotate(${petRot})`}>
              <Petrel frame={f} x={0} y={0} scale={0.66} emotion={snap > 0.5 ? 'purposeful' : 'eager'} eyeDilate={1 - snap * 0.75} accent={acc} heading={heading} />
            </g>
          </MotionBlur>
        </g>
        {/* Gleason, dignified, gesturing at the land */}
        <g opacity={ramp(f, 20, 50)}>
          <Character frame={f} x={190} y={1640} scale={0.72} pose="point" emotion="neutral" outfit="vest" headgear="cap" facing={1} talking={talk} />
        </g>
        {/* thermal begins to flood in ONLY after the snap (honesty pin) */}
        <WarmThermal f={f} amount={thermalIn * 0.5} bx={640} by={760} />
        <g opacity={ramp(f, 30, 60)}><Kicker x={620} y={220} t="Sean Gleason" fill={CREAM} w={400} fs={38} /></g>
        <g opacity={ramp(f, 90, 130)}><Kicker x={540} y={1780} t="because it is where they grew up" fill={GOLD} c={INK} w={620} fs={34} /></g>
        <g opacity={ramp(f, 230, 270)}><Kicker x={540} y={300} t="thermal camera" fill={CREAM} c={INK} w={330} fs={32} /></g>
      </svg>
    </AbsoluteFill>
  );
};

// ================================================================= S6 — REMOVE vs MULTIPLY
const S6: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const voice = useVoice();
  // sub-beat A (0..~110): soft abstract coral heat bloom (found) on cool field
  // sub-beat B (~120..250): the REMOVE vs MULTIPLY split
  // sub-beat C (~250..end): Nalaquq origin -> spark hops villages
  const bloom = ramp(f, 20, 70);
  const split = ramp(f, 120, 170);
  const villages = ramp(f, 250, 340);
  // REMOVE side is NON-NUMERIC (no unsupported counts): a lone operator dissolves to an empty seat.
  const removeT = ramp(f, 135, 205);
  // MULTIPLY side counts the villages the program actually TRAINED (c14: Quinhagak, Eek, Goodnews Bay = 3).
  const vilCount = Math.min(3, Math.max(1, Math.floor(interpolate(f, [150, 240], [1, 3.9], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))));
  const vLabel = vilCount === 1 ? 'VILLAGE' : 'VILLAGES';
  // Nalaquq is the COMPANY origin (not a trained village); the three villages are the trained ones.
  const vnodes: [string, number, number, string][] = [['Nalaquq', 200, 1180, 'origin'], ['Quinhagak', 430, 1080, 'v'], ['Eek', 680, 1220, 'v'], ['Goodnews Bay', 900, 1090, 'v']];
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect width={1080} height={1920} fill={SHADOW} />
        {/* A: the found bloom (abstract, dignified, no figure) */}
        {f < 130 && <>
          <WarmThermal f={f} amount={bloom} bx={540} by={900} />
          <g opacity={bloom} transform="translate(540,900)">
            <circle r={70 + 8 * Math.sin(f / 6)} fill={CORAL} opacity={0.5} style={{filter: 'blur(12px)'}} />
            <circle r={34} fill="#FFE28A" opacity={0.9} />
          </g>
          <g opacity={ramp(f, 50, 80)}><Kicker x={540} y={1500} t="found" fill={CORAL} c={TEXT} w={240} fs={40} /></g>
        </>}
        {/* B: the split */}
        {f >= 110 && f < 260 && <g opacity={split}>
          {/* seam */}
          <rect x={534} y={120} width={12} height={1680} fill={INK} opacity={0.5} />
          {/* LEFT: REMOVE (cold box spinning; a lone operator dissolves to an empty seat, NO number) */}
          <g transform="translate(280,760)">
            <g transform={`rotate(${f * 3})`}><PetrelDock f={f} x={0} y={0} scale={0.7} lidOpen={0.3} /></g>
            <Kicker x={0} y={-220} t="REMOVE" fill={COLD} c={TEXT} w={300} fs={48} />
            {/* operator silhouette fading out */}
            <g transform="translate(0,300)" opacity={1 - removeT}>
              <circle cx={0} cy={-46} r={30} fill={COLD} stroke={INK} strokeWidth={6} />
              <path d="M-46,64 Q-46,-6 0,-6 Q46,-6 46,64 Z" fill={COLD} stroke={INK} strokeWidth={6} />
            </g>
            {/* empty seat + NO OPERATOR (supported: 'no operator needed', c16) */}
            <g opacity={removeT}>
              <path d="M-40,300 l80,0 l0,10 l-80,0 Z M-34,310 l0,44 M34,310 l0,44" fill="none" stroke={COLD_D} strokeWidth={7} strokeLinecap="round" />
              <BoxLabel x={0} y={260} text="NO OPERATOR" w={340} fs={38} fill={COLD} color={TEXT} />
            </g>
          </g>
          {/* RIGHT: MULTIPLY (pilot + Petrel as one line over a climbing village count) */}
          <g transform="translate(800,760)">
            <Petrel frame={f} x={0} y={-40} scale={0.42} emotion="deferential" eyeDilate={0.2} heading={-20} />
            <Character frame={f} x={-30} y={200} scale={0.5} pose="raise" emotion="neutral" outfit="parka" headgear="beanie" facing={1} />
            <Kicker x={0} y={-220} t="MULTIPLY" fill={GOLD} c={INK} w={330} fs={48} />
            <StatBurst cx={0} cy={330} scale={0.72} big={`${vilCount}`} lines={[vLabel]} fill={GOLD} />
          </g>
        </g>}
        {/* C: the village spark relay (Nalaquq origin -> Quinhagak -> Eek -> Goodnews Bay) */}
        {f >= 250 && <g opacity={villages}>
          <TundraDelta f={f} skyOnly={false} />
          {/* thin connecting spark paths (drawn first, behind the nodes) */}
          {vnodes.map(([, x, y], i) => {
            if (i === 0) return null;
            const [, px, py] = vnodes[i - 1];
            const lit = ramp(f, 258 + i * 24, 280 + i * 24);
            const d = `M${px},${py} Q${(px + x) / 2},${Math.min(py, y) - 130} ${x},${y}`;
            return (
              <g key={`arc${i}`}>
                <path d={d} fill="none" stroke={INK} strokeWidth={11} strokeLinecap="round" strokeDasharray={520} strokeDashoffset={520 * (1 - lit)} />
                <path d={d} fill="none" stroke={GOLD} strokeWidth={6} strokeLinecap="round" strokeDasharray={520} strokeDashoffset={520 * (1 - lit)} />
                {/* travelling spark */}
                {lit > 0.05 && lit < 0.99 && <circle r={9} fill="#FFE6A8" style={{filter: `drop-shadow(0 0 8px ${GOLD})`}}>
                  <animate attributeName="opacity" values="1;1" dur="0.1s" />
                </circle>}
              </g>
            );
          })}
          {vnodes.map(([name, x, y, kind], i) => {
            const lit = ramp(f, 255 + i * 24, 278 + i * 24);
            const origin = kind === 'origin';
            return (
              <g key={i} opacity={lit} transform={`translate(${x},${y})`}>
                <circle r={origin ? 20 : 17} fill={origin ? CREAM : GOLD} stroke={INK} strokeWidth={5} style={{filter: lit > 0.8 ? `drop-shadow(0 0 12px ${origin ? CREAM : GOLD})` : undefined}} />
                {!origin && <Petrel frame={f + i * 10} x={0} y={-74} scale={0.15} emotion="eager" eyeDilate={0.6} />}
                <BoxLabel x={0} y={70} text={name} w={name.length * 19 + 56} fs={26} fill={origin ? CREAM : GOLD} color={INK} />
                {origin && <BoxLabel x={0} y={112} text="the company" w={220} fs={20} fill={CREAM} color={INK} />}
              </g>
            );
          })}
        </g>}
      </svg>
    </AbsoluteFill>
  );
};

// ================================================================= S7 — the button (loop)
const S7: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const voice = useVoice();
  // the pilot's hand arrives, then Petrel DEFERS: anticipation dip -> rotate toward the hand ->
  // overshoot -> settle, eye clamping. This is the signature payoff move and must clearly read.
  const handIn = ramp(f, 40, 85);
  const trig = f - 58;                                   // the defer starts as the hand lands
  const turnS = spring({frame: trig, fps, config: {damping: 8, stiffness: 110}});  // overshoots then settles
  const bodyRot = -24 * turnS;                           // visible body rotation toward the hand (lower-left)
  const dipY = 34 * Math.max(0, Math.sin((Math.min(18, Math.max(0, trig)) / 18) * Math.PI));  // anticipation dip
  const turnVx = -80 * Math.max(0, Math.min(1, turnS * (1 - turnS) * 4));  // horizontal smear, peaks mid-turn
  const petEmotion = turnS > 0.5 ? 'deferential' : 'eager';
  const petDil = 1 - 0.72 * Math.min(1, turnS);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <TundraDelta f={f} push={0} />
        {/* the pilot's pointing hand rising into frame, aimed at Petrel (loop to the open) */}
        <g opacity={handIn}>
          <PointingHand x={300} y={1520 - handIn * 70} rot={-32} s={1.6} />
        </g>
        {/* Petrel hovers eager, then defers: dips, rotates to the hand with overshoot, eye clamps */}
        <MotionBlur vx={turnVx} gain={0.5}>
          <g transform={`translate(560,${860 + dipY}) rotate(${bodyRot})`}>
            <Petrel frame={f} x={0} y={0} scale={0.9} emotion={petEmotion} eyeDilate={petDil} heading={-34 * turnS} />
          </g>
        </MotionBlur>
        <g opacity={ramp(f, 90, 140)}><Kicker x={540} y={300} t="it waits for someone" fill={CREAM} w={520} fs={40} /></g>
        <g opacity={ramp(f, 120, 170)}><Kicker x={540} y={372} t="who knows the land" fill={GOLD} c={INK} w={460} fs={40} /></g>
      </svg>
    </AbsoluteFill>
  );
};

const GradedGrade: React.FC = () => {
  const f = useCurrentFrame();
  return <GradeLayer f={f} bloom={0.24} vignette={0.4} grain={0.05} warmth={0.06} />;
};

const Captions: React.FC<{captions: EpisodeProps['captions']}> = ({captions}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const cue = captions.find((c) => t >= c.start && t < c.end + 0.05);
  if (!cue) return null;
  const local = f - Math.round(cue.start * fps);
  const pop = spring({frame: local, fps, config: {damping: 9, stiffness: 130}});
  const scale = interpolate(pop, [0, 1], [0.82, 1], {extrapolateRight: 'clamp'});
  const rise = interpolate(pop, [0, 1], [26, 0], {extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 340, left: 0, right: 0, display: 'flex', justifyContent: 'center', padding: '0 60px'}}>
      <div style={{background: 'rgba(20,16,8,0.86)', borderRadius: 14, padding: '16px 30px', maxWidth: 940, border: `4px solid ${GOLD}`, transform: `translateY(${rise}px) scale(${scale})`, transformOrigin: 'center bottom'}}>
        <div style={{fontFamily: BOLD, fontWeight: 900, fontSize: 46, lineHeight: 1.12, color: '#fff', textAlign: 'center', letterSpacing: 0.5, textShadow: `2px 3px 0 rgba(0,0,0,0.6)`}}>
          {cue.text}
        </div>
      </div>
    </div>
  );
};

const SCENE_COMPONENTS: React.FC<{from?: number}>[] = [S1, S2, S3, S4, S5, S6, S7];
const DEFAULT_BOUNDS: {from: number; dur: number}[] = [
  {from: 0, dur: 232}, {from: 232, dur: 211}, {from: 443, dur: 188},
  {from: 631, dur: 151}, {from: 782, dur: 324}, {from: 1106, dur: 357},
  {from: 1463, dur: 224},
];

export const Episode: React.FC<EpisodeProps> = ({captions, scenes, mouth, accents}) => {
  const bounds = scenes && scenes.length === SCENE_COMPONENTS.length ? scenes : DEFAULT_BOUNDS;
  const voice = mouth && mouth.length ? {fps: 30, mouth, accents: accents ?? []} : null;
  return (
    <AbsoluteFill style={{backgroundColor: INKW}}>
      <VoiceProvider data={voice}>
        {SCENE_COMPONENTS.map((C, i) => (
          <Sequence key={i} from={bounds[i].from} durationInFrames={bounds[i].dur} name={`S${i + 1}`}>
            <C from={bounds[i].from} />
          </Sequence>
        ))}
        <GradedGrade />
        <Captions captions={captions} />
      </VoiceProvider>
    </AbsoluteFill>
  );
};
