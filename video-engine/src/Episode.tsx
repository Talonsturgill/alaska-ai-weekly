import React from 'react';
import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {z} from 'zod';
import {VoiceProvider, useVoice} from './lib/voice';
import {Salmon, Raven} from './lib/fauna';
import {FishingBoat} from './lib/vehicles';
import {SpeedLines, ImpactStar, PaperStorm, ZoomVignette} from './lib/FX';
import {BoxLabel, Stamp} from './lib/kit';
import {StatCard, Nameplate, SwingSign, PenAndDocument, TallyCounter, VideoWeir} from './lib/props';
import {tones, FormGradient, RimLight, ContactShadow, GradeLayer, MotionBlur} from './lib/lighting';
import {entrance, accentKick, ChipShadow, EASE} from './lib/motion';
import {Character} from './lib/Character';
import {Stage3D, Plane, Atmosphere, CameraMoves, composeCams} from './lib/stage3d';

const BOLD = 'Arial Black, Arial, sans-serif';

// ---- 2026-07-20b palette (art_direction-locked: DAY low-water world) --------
// bone-tan gravel + milky glacial jade + dawn cream amber; sockeye crimson is
// the act-one accent; the act-two accent is the PHYSICAL cream-and-brass
// TallyCounter (motion carries the look-here, not a glow).
const SKY1 = '#f2d8a0';
const SKY2 = '#e8a86b';
const GRAVEL = '#cbb894';
const GRAVEL_D = '#8a7a5c';
const GRAVEL_L = '#e2d4b2';
const WATER = '#7fae9e';
const WATER_D = '#3f6f63';
const CRIM = '#c23b2e';
const BRASS = '#a8763e';
const DIAL = '#f7f1df';
const INKC = '#14201c';
const RIDGE = '#9a8f72';
const SLATE = '#5a6a74';
const CAP_BORDER = '#e8d8b0';

export const episodeSchema = z.object({
  captions: z.array(z.object({text: z.string(), start: z.number(), end: z.number(), seg: z.number()})),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(),
    energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
});
export type EpisodeProps = z.infer<typeof episodeSchema>;

// =============================================================== shared set pieces

// The dawn sky + far ridge that every exterior shares (one world, one light).
const DawnSky: React.FC<{f: number; warm?: number}> = ({f, warm = 0}) => (
  <g>
    <defs>
      <linearGradient id={`sky_${warm}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={SKY1} />
        <stop offset="100%" stopColor={warm > 0 ? '#f0b070' : SKY2} />
      </linearGradient>
    </defs>
    <rect width={1080} height={1920} fill={`url(#sky_${warm})`} />
    {/* low dawn sun from screen-right */}
    <circle cx={950} cy={430} r={90} fill="#fef2d0" opacity={0.9} />
    <circle cx={950} cy={430} r={150} fill="#fde8b8" opacity={0.35} />
    {/* drifting flat clouds (ambient) */}
    {[0, 1, 2].map((i) => {
      const cx = ((f * (0.35 + i * 0.12) + i * 400) % 1400) - 160;
      return <ellipse key={i} cx={cx} cy={280 + i * 90} rx={130 - i * 20} ry={16} fill="#fff" opacity={0.35} />;
    })}
  </g>
);

// The wide low-water two-bank river diorama (the argument stage).
const LowRiverWide: React.FC<{f: number; fish?: number}> = ({f, fish = 0}) => (
  <g>
    <DawnSky f={f} />
    {/* far ridge band in atmosphere */}
    <path d={`M0,760 q180,-60 380,-30 q240,36 420,-16 q160,-40 280,10 L1080,900 L0,900 Z`} fill={RIDGE} opacity={0.55} />
    <path d={`M0,820 q260,-40 520,-8 q300,36 560,-20 L1080,960 L0,960 Z`} fill={RIDGE} opacity={0.75} />
    {/* bone gravel flats */}
    <rect x={0} y={880} width={1080} height={1040} fill={GRAVEL} />
    {/* the exposed ribcage bars raking diagonally */}
    {[0, 1, 2, 3, 4].map((i) => (
      <path key={i} d={`M${-120 + i * 260},${1000 + i * 170} q300,-46 640,-8 q220,24 560,-10 l0,60 q-340,40 -560,18 q-340,-26 -640,4 Z`}
        fill={i % 2 ? GRAVEL_L : GRAVEL_D} opacity={i % 2 ? 0.75 : 0.55} />
    ))}
    {/* long raking shadows from screen-right sun */}
    <path d="M1080,900 L0,1400 L0,1500 L1080,1010 Z" fill={INKC} opacity={0.06} />
    {/* pebble + silt speckle so the bone flats read as gravel, not a fill */}
    {Array.from({length: 26}).map((_, i) => (
      <ellipse key={`pb${i}`} cx={(i * 167) % 1080} cy={920 + (i * 131) % 960} rx={7 + (i % 4) * 4} ry={4 + (i % 3) * 2} fill={i % 3 ? GRAVEL_D : '#a8987a'} opacity={0.55} />
    ))}
    {/* the thin jade channel snaking center */}
    <path d={`M420,880 q140,180 40,400 q-90,210 60,420 q90,130 30,220 L700,1920 q-90,-140 -30,-300 q80,-200 -40,-420 q-100,-200 -10,-320 Z`}
      fill={WATER} stroke={WATER_D} strokeWidth={6} />
    {/* current lines + sparkle (ambient motion) */}
    {[0, 1, 2, 3].map((i) => {
      const yy = 1000 + i * 220 + 8 * Math.sin(f / 17 + i * 2);
      return <path key={i} d={`M${470 + 20 * Math.sin(i * 3)},${yy} q40,30 12,90`} fill="none" stroke="#cfe8dc" strokeWidth={5} opacity={0.5} strokeLinecap="round" />;
    })}
    {[0, 1, 2, 3, 4].map((i) => {
      const on = ((f / 4 + i * 3) % 11) < 4;
      return on ? <circle key={i} cx={500 + ((i * 87) % 140)} cy={980 + i * 190} r={4} fill="#fff" opacity={0.8} /> : null;
    })}
    {/* the sparse fish (composed emptiness: hard cap 3) */}
    {fish >= 1 && <Salmon x={540} y={1240 + 6 * Math.sin(f / 9)} scale={0.34} f={f} />}
    {fish >= 2 && <Salmon x={505} y={1580} scale={0.26} f={f + 20} facing={-1} />}
    {fish >= 3 && <Salmon x={575} y={940} scale={0.22} f={f + 40} />}
  </g>
);

// A jagged speech shard (the argument's shape language). No words: muted shouting.
const Shard: React.FC<{x: number; y: number; s?: number; color: string; rot?: number; op?: number}> = ({x, y, s = 1, color, rot = 0, op = 1}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={op}>
    <path d="M0,0 L90,-26 L70,-4 L150,-18 L118,8 L180,10 L60,34 L78,14 Z" fill={color} stroke={INKC} strokeWidth={5} strokeLinejoin="round" />
  </g>
);

// The macro fogged-lens world (S1 open + S6 button; the loop).
const LensMacro: React.FC<{f: number; digitRoll: number; count: string; resolve?: number}> = ({f, digitRoll, count, resolve = 0}) => {
  const tW = tones(WATER_D);
  return (
    <g>
      <defs>
        <radialGradient id="deepwater" cx="35%" cy="40%" r="90%">
          <stop offset="0%" stopColor="#5d938a" />
          <stop offset="100%" stopColor="#274842" />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#deepwater)" />
      {/* caustic shimmer */}
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${-80 + i * 380},${300 + 40 * Math.sin(f / 21 + i)} q200,${60 + 30 * Math.sin(f / 13 + i * 2)} 420,0 q200,-50 460,10`}
          fill="none" stroke="#bfe8d8" strokeWidth={12} opacity={0.2} />
      ))}
      {/* drifting silt motes (ambient) */}
      {Array.from({length: 10}).map((_, i) => (
        <circle key={i} cx={(i * 131 + f * (0.3 + (i % 3) * 0.2)) % 1080} cy={(i * 217 + f * 0.5) % 1920} r={3 + (i % 3)} fill="#cfe0d0" opacity={0.25} />
      ))}
      {/* the lens: big circular housing, right side */}
      <g transform="translate(770,960)">
        <FormGradient id="lenshouse" t={tones('#3c464f')} />
        <circle r={330} fill="url(#lenshouse)" stroke={INKC} strokeWidth={10} />
        <circle r={270} fill="#9fc4d8" stroke={INKC} strokeWidth={8} />
        <circle r={270} fill="#bcd8e8" opacity={0.35} />
        {/* iris rings + aperture hints (detail density) */}
        <circle r={216} fill="none" stroke="#7fa8c2" strokeWidth={7} opacity={0.7} />
        <circle r={168} fill="none" stroke="#6b93b0" strokeWidth={5} opacity={0.6} />
        <circle r={120} fill="none" stroke="#5d86a6" strokeWidth={4} opacity={0.5} />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <line key={a} x1={0} y1={-120} x2={0} y2={-166} stroke="#54809e" strokeWidth={6} opacity={0.45} transform={`rotate(${a + 8})`} />
        ))}
        <path d="M-180,-120 a216,216 0 0 1 100,-96" fill="none" stroke="#fff" strokeWidth={12} opacity={0.5} strokeLinecap="round" />
        <path d="M-130,-190 a216,216 0 0 1 60,-28" fill="none" stroke="#fff" strokeWidth={8} opacity={0.35} strokeLinecap="round" />
        {/* housing bolts */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <circle key={a} cx={300 * Math.cos((a + 22) * Math.PI / 180)} cy={300 * Math.sin((a + 22) * Math.PI / 180)} r={9} fill="#2c343c" stroke={INKC} strokeWidth={3} />
        ))}
        {/* fog patch that clears then re-blooms with resolve */}
        <ellipse cx={-40} cy={-30} rx={200} ry={160} fill="#e8f2f0" opacity={0.35 + 0.2 * Math.sin(f / 40) - resolve * 0.1} />
        {/* condensation drips crawling (ambient) */}
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${-120 + i * 90},${-180 + ((f * 0.8 + i * 60) % 200)} q6,18 0,34`} stroke="#f4fbfa" strokeWidth={6} opacity={0.5} fill="none" strokeLinecap="round" />
        ))}
        <circle cx={80} cy={-90} r={40} fill="#fff" opacity={0.5} />
        <RimLight d="M-310,-80 a330,330 0 0 1 120,-260" w={6} opacity={0.6} />
        {/* red rec light */}
        <circle cx={-250} cy={-210} r={12} fill={CRIM} opacity={0.5 + 0.5 * Math.sin(f / 8)} stroke={INKC} strokeWidth={4} />
      </g>
      {/* the salmon, nosing the glass (hero) */}
      <g transform={`translate(${205 + 10 * Math.sin(f / 18)},${985 + 8 * Math.sin(f / 12)})`}>
        <Salmon x={0} y={0} scale={2.7} f={f} />
      </g>
      {/* bubbles at the mouth (ambient) */}
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={430 + 10 * Math.sin(f / 7 + i * 2)} cy={(920 - ((f * 2.4 + i * 48) % 300))} r={6 + i * 3} fill="none" stroke="#dff2ea" strokeWidth={3.5} opacity={0.65} />
      ))}
      {/* the mounted odometer chip, flipping */}
      <g transform="translate(770,1450)">
        <ChipShadow><TallyCounter x={0} y={0} s={1.25} f={f} variant="odometer" count={count} roll={digitRoll} /></ChipShadow>
      </g>
    </g>
  );
};

// A small cluster of shouting bank residents.
const Crowd: React.FC<{f: number; x: number; y: number; s?: number; side: 'left' | 'right'; lower?: number}> = ({f, x, y, s = 1, side, lower = 0}) => {
  const facing = side === 'left' ? 1 : -1;
  // lower 0..1: signs drop and mouths close (the referee hush)
  const signY = 40 * lower;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <Character frame={f} x={0} y={0} scale={0.62} facing={facing} outfit={side === 'left' ? 'flannel' : 'worker'} headgear={side === 'left' ? 'beanie' : 'cap'} emotion={lower > 0.5 ? 'worried' : 'angry'} pose={lower > 0.5 ? 'stand' : 'point'} />
      <Character frame={f + 30} x={facing * -110} y={16} scale={0.56} facing={facing} outfit="puffer" headgear="bare" emotion={lower > 0.5 ? 'neutral' : 'angry'} pose={lower > 0.5 ? 'stand' : 'panic'} hair="#6a4a2a" />
      {/* their protest sign lowers with the hush */}
      <g transform={`translate(${facing * 60},${-360 + signY}) rotate(${facing * (6 - 5 * lower)})`} opacity={1 - lower * 0.25}>
        <rect x={-8} y={0} width={16} height={150} fill="#8a6239" stroke={INKC} strokeWidth={4} />
        <rect x={-95} y={-72} width={190} height={76} rx={8} fill="#efe6d0" stroke={INKC} strokeWidth={5} />
        {/* hand-scrawled tallies + a fat question mark: counts nobody agrees on */}
        {[0, 1, 2, 3].map((i) => <line key={i} x1={-70 + i * 16} y1={-56} x2={-70 + i * 16} y2={-14} stroke={INKC} strokeWidth={5} />)}
        <line x1={-76} y1={-50} x2={-8} y2={-22} stroke={INKC} strokeWidth={5} />
        <text x={40} y={-20} fontFamily={BOLD} fontWeight={900} fontSize={52} fill={side === 'left' ? CRIM : SLATE}>?</text>
      </g>
    </g>
  );
};

// =============================================================== S1: the question
const S1: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const voice = useVoice();
  const gf = from + f;
  const PULL = 62; // line 1 starts at 2.04s: macro -> wide
  const macroOut = interpolate(f, [PULL - 10, PULL + 8], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wideIn = spring({frame: f - PULL, fps, config: {damping: 15, stiffness: 90}});
  // digit flips 0000 -> 0001 at ~0.5s (the hook's motion-by mark)
  const roll = interpolate(f, [12, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  // dueling cards slam at ~6.0s scene-time
  const CARDS = 126; // ~4.2s scene-time: the dueling cards land inside S1's 6.7s
  const cardIn = spring({frame: f - CARDS, fps, config: {damping: 11, stiffness: 190}});
  const ravenGo = interpolate(f, [CARDS + 40, CARDS + 62], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  return (
    <AbsoluteFill>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        {f >= PULL - 10 && (
          <g opacity={1 - macroOut}>
            <g transform={`translate(540,960) scale(${0.92 + 0.08 * wideIn}) translate(-540,-960)`}>
              <LowRiverWide f={f} fish={1} />
              {/* the two crowds, mouths open, shouting PAST each other */}
              <Crowd f={f} x={190} y={1280} side="left" />
              <Crowd f={f} x={890} y={1300} side="right" />
              {/* speech shards colliding mid-river, splinters raining (reaction) */}
              <Shard x={290} y={880} color={CRIM} rot={-4} op={0.95} />
              <Shard x={560} y={960} color={SLATE} rot={176} op={0.95} />
              <Shard x={330} y={1040 + 5 * Math.sin(f / 7)} color={CRIM} rot={8} s={0.7} />
              <Shard x={620} y={820 + 5 * Math.sin(f / 9 + 2)} color={SLATE} rot={188} s={0.65} />
              {f % 4 < 2 && <circle cx={475 + (f % 30)} cy={900 + ((f * 7) % 120)} r={5} fill={INKC} opacity={0.4} />}
              {/* dueling tally cards slam in (beat 3) */}
              {f >= CARDS && (
                <g>
                  <g transform={`translate(250,770) rotate(-7) scale(${cardIn})`}>
                    <rect x={-140} y={-90} width={280} height={180} rx={12} fill="#efe6d0" stroke={INKC} strokeWidth={7} />
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                      <line key={i} x1={-105 + (i % 4) * 26 + Math.floor(i / 4) * 120} y1={-56 + Math.floor(i / 4) * 70} x2={-105 + (i % 4) * 26 + Math.floor(i / 4) * 120} y2={-16 + Math.floor(i / 4) * 70} stroke={CRIM} strokeWidth={7} />
                    ))}
                    <line x1={-110} y1={-40} x2={-30} y2={-26} stroke={CRIM} strokeWidth={7} />
                    <text x={60} y={30} fontFamily={BOLD} fontWeight={900} fontSize={80} fill={CRIM}>?</text>
                  </g>
                  <g transform={`translate(830,758) rotate(6) scale(${cardIn})`}>
                    <rect x={-140} y={-90} width={280} height={180} rx={12} fill="#efe6d0" stroke={INKC} strokeWidth={7} />
                    {[0, 1, 2].map((i) => (
                      <line key={i} x1={-90 + i * 30} y1={-50} x2={-90 + i * 30} y2={-6} stroke={SLATE} strokeWidth={7} />
                    ))}
                    <text x={50} y={26} fontFamily={BOLD} fontWeight={900} fontSize={80} fill={SLATE}>?</text>
                  </g>
                  {/* the raven steals a tally stroke off the left card (gag seed) */}
                  <g transform={`translate(${250 + ravenGo * 430},${706 - ravenGo * 380 + 20 * Math.sin(ravenGo * 6)})`}>
                    <MotionBlur vx={ravenGo > 0 && ravenGo < 1 ? 16 : 0} gain={0.5}>
                      <Raven x={0} y={0} scale={1.0} f={f} mode={ravenGo > 0.05 ? 'fly' : 'perch'} />
                    </MotionBlur>
                    {ravenGo > 0.05 && <line x1={26} y1={16} x2={26} y2={54} stroke={CRIM} strokeWidth={7} />}
                  </g>
                  {cardIn > 0.9 && <BoxLabel x={540} y={468} w={660} h={78} text="ONE RIVER. TWO COUNTS." fs={40} />}
                </g>
              )}
            </g>
          </g>
        )}
        {/* the macro open sits ON TOP and dissolves off */}
        {macroOut > 0.01 && (
          <g opacity={macroOut}>
            <LensMacro f={f} digitRoll={roll} count={roll > 0.5 ? '0001' : '0000'} />
          </g>
        )}
      </svg>
      {/* frame-1 burned-in headline (the hook; moving via pop-in + digit flip) */}
      <div style={{position: 'absolute', top: 320, left: 0, right: 0, textAlign: 'center', opacity: macroOut}}>
        <span style={{fontFamily: BOLD, fontWeight: 900, fontSize: 76, color: '#fff', background: 'rgba(20,32,28,0.85)', padding: '12px 34px', borderRadius: 14, border: `6px solid ${DIAL}`, textShadow: '3px 4px 0 rgba(0,0,0,0.5)', letterSpacing: 1}}>
          WHO COUNTS THIS FISH?
        </span>
      </div>
      {gf > 0 && voice.accentAt(gf) > 0.5 && <ZoomVignette amount={0.12 * voice.accentAt(gf)} />}
    </AbsoluteFill>
  );
};

// =============================================================== S2: two honest banks
const S2: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const voice = useVoice();
  const gf = from + f;
  // scene covers ~9.5-20.5s: A smokehouse (0-4s), whip to B fleet deck (4-8s), C ocean slice (8-11s)
  const A_END = 150, B_END = 264;
  const whipA = interpolate(f, [A_END - 8, A_END + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const whipB = interpolate(f, [B_END - 8, B_END + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const flingT = interpolate(f, [A_END + 30, A_END + 48], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const curveDrop = spring({frame: f - (B_END + 24), fps, config: {damping: 13, stiffness: 60}});
  const stageX = -1080 * (whipA + whipB); // three worlds side by side, whipped between
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${stageX}px)`, width: 3240}}>
        {/* A: the quiet smokehouse (left world) */}
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0}}>
          <DawnSky f={f} />
          <rect x={0} y={1100} width={1080} height={820} fill={GRAVEL} />
          {/* ground bands + pebbles (never a flat fill) */}
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M0,${1200 + i * 220} q300,-26 600,-4 q260,20 480,-10 l0,50 q-220,26 -480,12 q-300,-18 -600,2 Z`} fill={i % 2 ? GRAVEL_L : GRAVEL_D} opacity={i % 2 ? 0.6 : 0.45} />
          ))}
          {Array.from({length: 14}).map((_, i) => (
            <ellipse key={i} cx={(i * 173) % 1080} cy={1250 + (i * 97) % 560} rx={11 + (i % 3) * 5} ry={6} fill={GRAVEL_D} opacity={0.5} />
          ))}
          {/* the smokehouse cabin: gable, planks, stovepipe (no smoke: it is cold) */}
          <g transform="translate(540,1180)">
            <ContactShadow cx={0} cy={4} rx={250} ry={20} opacity={0.28} />
            <path d="M-230,0 L-230,-240 L0,-360 L230,-240 L230,0 Z" fill="#8a6239" stroke={INKC} strokeWidth={8} strokeLinejoin="round" />
            <path d="M40,0 L40,-300 L230,-240 L230,0 Z" fill="#6a4a28" opacity={0.65} />
            <path d="M-250,-232 L0,-368 L250,-232 L232,-208 L0,-330 L-232,-208 Z" fill="#5c4326" stroke={INKC} strokeWidth={7} strokeLinejoin="round" />
            {[-180, -120, -60, 0, 60, 120, 180].map((px, i) => (
              <line key={i} x1={px} y1={-6} x2={px} y2={px > -60 && px < 60 ? -196 : -230 + Math.abs(px) * 0.5 - 110} stroke={INKC} strokeWidth={3} opacity={0.3} />
            ))}
            {/* cold stovepipe */}
            <rect x={110} y={-420} width={34} height={90} fill="#4a4a4a" stroke={INKC} strokeWidth={5} />
            <rect x={100} y={-432} width={54} height={16} rx={4} fill="#3a3a3a" stroke={INKC} strokeWidth={4} />
            {/* dark doorway, closed */}
            <rect x={-52} y={-160} width={104} height={160} rx={8} fill="#4a3520" stroke={INKC} strokeWidth={6} />
            <circle cx={28} cy={-78} r={6} fill="#c9bfa8" stroke={INKC} strokeWidth={3} />
            <RimLight d="M-230,-240 L0,-360" w={5} opacity={0.5} />
          </g>
          <SwingSign x={540} y={880} f={f} lines={['SMOKEHOUSE']} />
          {/* drying racks, bare, with drooping empty twine + hooks */}
          {[210, 870].map((rx, i) => (
            <g key={i} transform={`translate(${rx},1420)`}>
              <ContactShadow cx={0} cy={6} rx={130} ry={14} opacity={0.22} />
              <line x1={-110} y1={0} x2={-110} y2={-190} stroke="#6a5232" strokeWidth={14} />
              <line x1={110} y1={0} x2={110} y2={-190} stroke="#6a5232" strokeWidth={14} />
              <line x1={-122} y1={-190} x2={122} y2={-190} stroke="#6a5232" strokeWidth={10} />
              <line x1={-122} y1={-140} x2={122} y2={-140} stroke="#6a5232" strokeWidth={8} />
              {[-80, -30, 20, 70].map((hx, k) => (
                <path key={k} d={`M${hx},-188 q3,${18 + 4 * Math.sin(f / 15 + k + i)} 0,30 l8,10`} stroke="#c9bfa8" strokeWidth={4} fill="none" />
              ))}
              {/* ghost outline of where fish would hang */}
              <path d="M-64,-96 q20,-14 40,0 q-10,10 -20,10 q-12,0 -20,-10 Z" fill="none" stroke="#a89878" strokeWidth={3} strokeDasharray="6 6" opacity={0.7} />
            </g>
          ))}
          {/* the family, quiet, close enough to read */}
          <Character frame={f} x={330} y={1720} scale={1.05} outfit="flannel" headgear="beanie" emotion="worried" pose="stand" facing={1} />
          <Character frame={f + 40} x={520} y={1740} scale={0.78} outfit="puffer" headgear="bare" emotion="worried" pose="stand" facing={-1} hair="#1e1610" />
          {/* a distant raven crosses the sky (ambient life in the quiet beat) */}
          <g transform={`translate(${1200 - ((f * 3.2) % 1500)},${560 + 18 * Math.sin(f / 11)}) scale(0.55)`}>
            <Raven x={0} y={0} scale={1} f={f} mode="fly" facing={-1} />
          </g>
          {/* low drifting mist (ambient) */}
          <ellipse cx={(f * 0.7) % 1300 - 100} cy={1620} rx={220} ry={26} fill="#fff" opacity={0.13} />
          <g transform="translate(540,420)">
            <ChipShadow>
              <g>
                <rect x={-420} y={-46} width={840} height={122} rx={14} fill="rgba(20,32,28,0.85)" stroke={DIAL} strokeWidth={5} />
                <text x={0} y={-6} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={34} fill="#fff">Yukon kings: "a prolonged period</text>
                <text x={0} y={36} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={34} fill="#fff">of low productivity" (ADFG)</text>
              </g>
            </ChipShadow>
          </g>
        </svg>
        {/* B: the fleet's deck (middle world) */}
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', left: 1080}}>
          <DawnSky f={f} />
          {/* open sea horizon */}
          <rect x={0} y={980} width={1080} height={940} fill={WATER} />
          <path d={`M0,980 q270,${14 + 8 * Math.sin(f / 14)} 540,0 q270,-14 540,${10 + 6 * Math.sin(f / 11)} L1080,1920 L0,1920 Z`} fill={WATER_D} opacity={0.5} />
          {/* whitecaps (ambient) */}
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${((f * (1.2 + i * 0.3) + i * 300) % 1300) - 120},${1040 + i * 160} q30,-12 60,0 q-14,8 -30,8 q-18,0 -30,-8 Z`} fill="#dff2ea" opacity={0.5} />
          ))}
          <FishingBoat x={520} y={1560} scale={2.6} f={f} heave={0.8} />
          {/* the crew ON the deck (feet on the deck line) */}
          <g transform={`translate(420,${1408 + 8 * Math.sin(f / 13)}) rotate(${1.8 * Math.sin(f / 16)})`}>
            <Character frame={f} x={0} y={0} scale={0.62} outfit="worker" headgear="cap" emotion={flingT > 0.6 ? 'smug' : 'angry'} pose={flingT < 1 ? 'point' : 'stand'} facing={1} />
          </g>
          <g transform={`translate(640,${1416 + 8 * Math.sin(f / 13 + 0.4)}) rotate(${1.8 * Math.sin(f / 16)})`}>
            <Character frame={f + 25} x={0} y={0} scale={0.58} outfit="puffer" headgear="beanie" emotion={flingT > 0.8 ? 'shock' : 'neutral'} pose="stand" facing={-1} />
          </g>
          {/* the flung salmon arcs overboard with blur; splash on the neighbor */}
          {flingT > 0 && flingT < 1 && (
            <g transform={`translate(${460 + flingT * 340},${1300 - 340 * Math.sin(flingT * Math.PI)}) rotate(${flingT * 190})`}>
              <MotionBlur vx={18} vy={-10} gain={0.6}>
                <Salmon x={0} y={0} scale={0.85} f={f} />
              </MotionBlur>
            </g>
          )}
          {flingT >= 0.8 && (
            <g opacity={interpolate(flingT, [0.8, 1], [1, 0.4])}>
              {[0, 1, 2, 3, 4].map((i) => (
                <circle key={i} cx={700 + (i - 2) * 30} cy={1330 - 40 * Math.sin((flingT - 0.8) * 12 + i)} r={9 - i} fill="#cfe8dc" opacity={0.85} />
              ))}
            </g>
          )}
          <g transform="translate(540,430)">
            <ChipShadow>
              <g>
                <rect x={-330} y={-40} width={660} height={80} rx={12} fill="rgba(20,32,28,0.85)" stroke={DIAL} strokeWidth={5} />
                <text x={0} y={12} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={36} fill="#fff">bycatch: incidental and capped</text>
              </g>
            </ChipShadow>
          </g>
        </svg>
        {/* C: the honest ocean cross-section (right world) */}
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', left: 2160}}>
          <DawnSky f={f} />
          <rect x={0} y={840} width={1080} height={1080} fill={WATER_D} />
          {/* waterline; small boat above, tipping as the mass shoves */}
          <path d={`M0,840 q270,${10 + 6 * Math.sin(f / 12)} 540,0 q270,-10 540,${8 + 5 * Math.sin(f / 10)}`} fill="none" stroke="#cfe8dc" strokeWidth={8} />
          <g transform={`translate(560,790) rotate(${-4 * curveDrop * Math.sin(f / 18)})`}>
            <FishingBoat x={0} y={0} scale={1.15} f={f} heave={0.9} />
          </g>
          {/* the cold current mass, physically shoving down (primary): scalloped belly + bubbles */}
          <g>
            <path d={`M-40,880 L1120,880 L1120,${1010 + 50 * curveDrop} q-140,${70 + 20 * Math.sin(f / 22)} -280,26 q-160,-50 -300,10 q-150,${60 + 16 * Math.sin(f / 18 + 2)} -290,8 q-130,-46 -250,6 Z`}
              fill="#a8ccd8" opacity={0.9} stroke="#7fa8bc" strokeWidth={5} />
            {Array.from({length: 7}).map((_, i) => (
              <circle key={i} cx={120 + i * 140} cy={1010 + 40 * curveDrop + 14 * Math.sin(f / 9 + i)} r={5 + (i % 3) * 3} fill="none" stroke="#e8f4f8" strokeWidth={3} opacity={0.6} />
            ))}
            <BoxLabel x={540} y={960} text="COLD OCEAN" fs={40} />
          </g>
          {/* the red run-curve being pressed down */}
          <path d={`M60,${1250 + 260 * curveDrop * 0.4} q240,${-140 + 320 * curveDrop} 480,${40 + 140 * curveDrop} q260,${120 + 60 * curveDrop} 480,${180 + 80 * curveDrop}`}
            fill="none" stroke={CRIM} strokeWidth={20} strokeLinecap="round" />
          {/* fat pressed arrows */}
          {[300, 620, 900].map((ax, i) => (
            <g key={i} transform={`translate(${ax},${1130 + i * 40 + 200 * curveDrop * 0.5})`}>
              <path d="M-18,-60 L18,-60 L18,-10 L38,-10 L0,44 L-38,-10 L-18,-10 Z" fill="#a8ccd8" stroke={INKC} strokeWidth={5} strokeLinejoin="round" opacity={0.95} />
            </g>
          ))}
          <g transform="translate(540,430)">
            <ChipShadow>
              <g>
                <rect x={-410} y={-40} width={820} height={80} rx={12} fill="rgba(20,32,28,0.85)" stroke={DIAL} strokeWidth={5} />
                <text x={0} y={12} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={34} fill="#fff">ocean and climate drive much of the decline</text>
              </g>
            </ChipShadow>
          </g>
        </svg>
      </div>
      {/* whip streaks during the pans */}
      {(whipA > 0.05 && whipA < 0.95) || (whipB > 0.05 && whipB < 0.95) ? (
        <SpeedLines cx={540} cy={960} frame={f} intensity={1.4} color="#fff" />
      ) : null}
      {voice.accentAt(gf) > 0.5 && <ZoomVignette amount={0.1 * voice.accentAt(gf)} />}
    </AbsoluteFill>
  );
};

// =============================================================== S3: the counting room
const S3: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const voice = useVoice();
  const gf = from + f;
  // scene ~20.5-28.5s: buried observer (0-3.5s) -> tower build (3.5-5.8s) -> sweep + HOURS (5.8-8s)
  const TOWER = 73, SWEEP = 120;
  const towerT = interpolate(f, [TOWER, TOWER + 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const sweepT = interpolate(f, [SWEEP, SWEEP + 34], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const clockT = spring({frame: f - (SWEEP + 30), fps, config: {damping: 12, stiffness: 150}});
  const shake = towerT > 0 && towerT < 1 ? 3 * Math.sin(f * 2.6) * (1 - towerT) : 0;
  return (
    <AbsoluteFill style={{background: '#4a4438'}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', transform: `translate(${shake}px,${shake * 0.6}px)`}}>
        {/* dim interior wall: the net-cam frame GRID */}
        <rect width={1080} height={1920} fill="#3c382e" />
        <rect x={250} y={200} width={790} height={880} fill="#2e2b24" stroke={INKC} strokeWidth={8} rx={12} />
        {Array.from({length: 20}).map((_, i) => {
          const cx = 290 + (i % 5) * 150, cy = 250 + Math.floor(i / 5) * 205;
          const swept = sweepT * 1080 > cx;
          return (
            <g key={i}>
              <rect x={cx} y={cy} width={130} height={175} rx={6} fill={swept ? '#2f4a38' : '#4a5a64'} stroke={INKC} strokeWidth={4} />
              {/* a tiny fish silhouette per frame */}
              <path d={`M${cx + 34},${cy + 90} q22,-16 44,0 q-10,10 -22,10 q-12,0 -22,-10 Z`} fill={swept ? '#9fe8b0' : '#8fa2b0'} opacity={0.9} />
              <path d={`M${cx + 78},${cy + 90} l14,-10 l0,20 Z`} fill={swept ? '#9fe8b0' : '#8fa2b0'} />
              {swept && <path d={`M${cx + 94},${cy + 24} l10,12 l16,-20`} stroke="#9fe8b0" strokeWidth={6} fill="none" strokeLinecap="round" />}
            </g>
          );
        })}
        {/* the brass counting head strafes on a rail (mechanical, not HUD) */}
        <rect x={250} y={158} width={790} height={16} rx={8} fill="#5a5244" stroke={INKC} strokeWidth={4} />
        <g transform={`translate(${300 + sweepT * 690},176) scale(1.35)`}>
          <MotionBlur vx={sweepT > 0.02 && sweepT < 0.98 ? 22 : 0} gain={0.7}>
            <g>
              <rect x={-52} y={0} width={104} height={70} rx={12} fill={BRASS} stroke={INKC} strokeWidth={6} />
              <circle cx={0} cy={36} r={22} fill={DIAL} stroke={INKC} strokeWidth={5} />
              <line x1={0} y1={36} x2={0} y2={18} stroke={CRIM} strokeWidth={5} transform={`rotate(${sweepT * 720} 0 36)`} />
              <path d={`M-8,70 L8,70 L0,96 Z`} fill="#ffe9b0" opacity={0.8} />
            </g>
          </MotionBlur>
        </g>
        {/* the buried observer at the light table */}
        <g transform="translate(300,1640)">
          <ContactShadow cx={0} cy={10} rx={220} ry={24} opacity={0.3} />
          <Character frame={f} x={0} y={0} scale={1.0} outfit="vest" headgear="bare" emotion={sweepT > 0.5 ? 'shock' : 'worried'} pose="stand" facing={1} hair="#4a3421" />
          {/* light table in front, glowing */}
          <rect x={-260} y={-150} width={520} height={130} rx={10} fill="#6a5f4c" stroke={INKC} strokeWidth={7} />
          <rect x={-228} y={-138} width={456} height={78} rx={6} fill="#f8f0d8" />
          <rect x={-228} y={-138} width={456} height={78} rx={6} fill="#fff" opacity={0.5 + 0.1 * Math.sin(f / 7)} />
          <path d="M-60,-118 q20,-14 40,0 q-10,10 -20,10 q-12,0 -20,-10 Z" fill="#8fa2b0" stroke={INKC} strokeWidth={3} />
          {/* the paper drift burying him to the chest */}
          {Array.from({length: 12}).map((_, i) => (
            <rect key={i} x={-300 + (i * 57) % 560 + 6 * Math.sin(f / 11 + i)} y={-64 + (i % 4) * 26} width={92} height={62} rx={4}
              fill={i % 2 ? '#efe6d0' : '#e2d6ba'} stroke={INKC} strokeWidth={3.5} transform={`rotate(${-14 + (i * 7) % 26})`} opacity={0.97} />
          ))}
        </g>
        {/* calendar shedding DAYS / WEEKS */}
        <g transform="translate(850,1310)">
          <rect x={-110} y={-140} width={220} height={260} rx={10} fill="#efe6d0" stroke={INKC} strokeWidth={6} />
          <rect x={-110} y={-140} width={220} height={56} rx={10} fill={CRIM} stroke={INKC} strokeWidth={6} />
          <text x={0} y={-100} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={30} fill="#fff">REVIEW</text>
          {f < SWEEP && [0, 1].map((i) => {
            const t = ((f / 40 + i * 0.5) % 1);
            return (
              <g key={i} transform={`translate(${-40 + t * -240},${-20 + t * 260}) rotate(${-t * 70})`} opacity={1 - t * 0.7}>
                <rect x={-70} y={-46} width={140} height={92} rx={6} fill="#f7f1df" stroke={INKC} strokeWidth={4} />
                <text x={0} y={12} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={32} fill={INKC}>{i % 2 ? 'WEEKS' : 'DAYS'}</text>
              </g>
            );
          })}
          {/* the clock lands on HOURS after the sweep */}
          {clockT > 0.02 && (
            <g transform={`translate(0,20) scale(${clockT})`}>
              <circle r={84} fill={DIAL} stroke={INKC} strokeWidth={7} />
              <line x1={0} y1={0} x2={0} y2={-56} stroke={INKC} strokeWidth={8} transform={`rotate(${clockT * 340})`} strokeLinecap="round" />
              <line x1={0} y1={0} x2={38} y2={0} stroke={CRIM} strokeWidth={6} strokeLinecap="round" transform={`rotate(${clockT * 40})`} />
              <circle r={7} fill={INKC} />
              <rect x={-84} y={96} width={168} height={46} rx={8} fill={BRASS} stroke={INKC} strokeWidth={5} />
              <text x={0} y={128} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={32} fill="#fff">HOURS</text>
            </g>
          )}
        </g>
        {/* the pollock tower through the ceiling + salmon pile with flag */}
        {towerT > 0 && (
          <g>
            <g transform="translate(125,1150)">
              <ContactShadow cx={0} cy={8} rx={90} ry={14} opacity={0.3} />
              {Array.from({length: 10}).map((_, i) => {
                const h = interpolate(towerT, [i / 10, Math.min(1, i / 10 + 0.25)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
                return h > 0 ? (
                  <g key={i} transform={`translate(0,${-i * 94}) scale(1,${h})`}>
                    <rect x={-92} y={-86} width={184} height={86} rx={6} fill={i % 2 ? '#93a8b8' : '#7e94a6'} stroke={INKC} strokeWidth={5} />
                    <path d="M-40,-43 q20,-16 40,0 q-10,10 -20,10 q-12,0 -20,-10 Z" fill="#e8eef2" opacity={0.8} />
                    <path d="M0,-43 l16,-10 l0,20 Z" fill="#e8eef2" opacity={0.8} />
                  </g>
                ) : null;
              })}
              <rect x={-95} y={16} width={190} height={54} rx={8} fill="#5a6a74" stroke={INKC} strokeWidth={5} />
              <text x={0} y={53} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={24} fill="#fff">73,394 pollock labels</text>
            </g>
            {/* the ceiling breaks at the tower top */}
            {towerT > 0.8 && (
              <g transform="translate(125,290)">
                <path d="M-90,0 L-40,-26 L0,4 L44,-22 L90,0" stroke={INKC} strokeWidth={7} fill="none" />
                <ImpactStar cx={0} cy={-10} r={50} color={DIAL} />
              </g>
            )}
            {/* modest salmon pile, waving its flag (reaction) */}
            <g transform="translate(480,1300)">
              <ContactShadow cx={0} cy={6} rx={110} ry={14} opacity={0.28} />
              <path d="M-100,0 q100,-90 200,0 Z" fill={CRIM} stroke={INKC} strokeWidth={6} />
              <path d="M-50,-24 q18,-14 36,0 q-9,9 -18,9 q-10,0 -18,-9 Z" fill="#f4d8cc" opacity={0.9} />
              <path d="M14,-40 q16,-12 32,0 q-8,8 -16,8 q-9,0 -16,-8 Z" fill="#f4d8cc" opacity={0.9} />
              <rect x={-108} y={14} width={216} height={50} rx={8} fill={CRIM} stroke={INKC} strokeWidth={5} />
              <text x={0} y={49} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={23} fill="#fff">11,572 salmon labels</text>
              <g transform={`translate(70,-78) rotate(${14 * Math.sin(f / 6)})`}>
                <line x1={0} y1={0} x2={0} y2={-70} stroke={INKC} strokeWidth={5} />
                <path d="M0,-70 L64,-56 L0,-40 Z" fill={DIAL} stroke={INKC} strokeWidth={4} />
                <text x={8} y={-49} fontFamily={BOLD} fontWeight={700} fontSize={16} fill={INKC}>STILL HERE</text>
              </g>
            </g>
          </g>
        )}
        {/* HOURS chip lands with the sweep (annotation) */}
        {clockT > 0.5 && (
          <g transform="translate(540,1418)">
            <ChipShadow>
              <g>
                <rect x={-430} y={-40} width={860} height={80} rx={12} fill="rgba(20,32,28,0.88)" stroke={DIAL} strokeWidth={5} />
                <text x={0} y={12} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={34} fill="#fff">days or weeks becomes HOURS (per National Fisherman)</text>
              </g>
            </ChipShadow>
          </g>
        )}
      </svg>
      <PaperStorm frame={f} count={10} originX={220} originY={1500} targetX={420} targetY={1200} spread={500} />
      {voice.accentAt(gf) > 0.5 && <ZoomVignette amount={0.1 * voice.accentAt(gf)} />}
    </AbsoluteFill>
  );
};

// =============================================================== S4: the lineup + the bill
const S4: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const voice = useVoice();
  const gf = from + f;
  // scene ~28.5-36.5s: lineup + chips + stamp (0-4.5s) -> bill close (4.5-8s)
  const BILL = 229;
  const billT = interpolate(f, [BILL - 8, BILL + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const chip1 = spring({frame: f - 33, fps, config: {damping: 12, stiffness: 170}});   // 85,000 latches on first tick
  const chip2 = spring({frame: f - 116, fps, config: {damping: 12, stiffness: 170}});  // 97% follows
  const stampT = spring({frame: f - 176, fps, config: {damping: 14, stiffness: 220}});
  const clickSpin = interpolate(f, [20, 100], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const inkStamp = spring({frame: f - (BILL + 64), fps, config: {damping: 16, stiffness: 110}});
  return (
    <AbsoluteFill style={{background: '#4a5a5f'}}>
      {/* A: the lineup room */}
      <div style={{position: 'absolute', inset: 0, opacity: 1 - billT}}>
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
          <rect width={1080} height={1920} fill="#46565c" />
          {/* height-chart wall */}
          <rect x={60} y={300} width={960} height={900} fill="#54666c" stroke={INKC} strokeWidth={8} rx={10} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i}>
              <line x1={70} y1={380 + i * 140} x2={1010} y2={380 + i * 140} stroke="#e8e2d0" strokeWidth={3} opacity={0.5} />
              <text x={90} y={372 + i * 140} fontFamily={BOLD} fontWeight={700} fontSize={22} fill="#e8e2d0" opacity={0.6}>{6 - i} ft</text>
            </g>
          ))}
          {/* the lineup: two ROWS so each fish owns its band */}
          <g transform={`translate(430,${700 + 3 * Math.sin(f / 12)})`}>
            <g transform="scale(1.9)"><Salmon x={0} y={0} scale={1} f={f} spawning={false} /></g>
            {/* one sweat bead */}
            <path d={`M120,-60 q10,${12 + 3 * Math.sin(f / 8)} 0,24 q-10,-12 0,-24 Z`} fill="#9fd8ff" stroke={INKC} strokeWidth={3} />
            <rect x={-310} y={54} width={200} height={46} rx={8} fill="#54666c" stroke={INKC} strokeWidth={4} />
            <text x={-210} y={87} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={28} fill="#cfd8dc">POLLOCK</text>
          </g>
          <g transform={`translate(560,${1020 + 3 * Math.sin(f / 10 + 2)})`}>
            <g transform="scale(1.9)"><Salmon x={0} y={0} scale={1} f={f + 15} spawning /></g>
            <rect x={-440} y={54} width={200} height={46} rx={8} fill="#7c4438" stroke={INKC} strokeWidth={4} />
            <text x={-340} y={87} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={28} fill="#f0c8b8">SOCKEYE</text>
          </g>
          {/* the clicker ratchets big in the foreground, tallying the sockeye */}
          <g transform="translate(840,1360)">
            <TallyCounter x={0} y={0} s={1.6} f={f} variant="clicker" spin={clickSpin} count={clickSpin >= 1 ? '0001' : '0000'} />
          </g>
          {/* chips latch with the spoken numbers */}
          {chip1 > 0.05 && (
            <g transform={`translate(320,410) scale(${chip1})`}>
              <ChipShadow><StatCard x={0} y={0} big="85,000+" sub="fish labels (per NOAA AFSC)" color={BRASS} scale={0.92} /></ChipShadow>
            </g>
          )}
          {chip2 > 0.05 && (
            <g transform={`translate(740,560) scale(${chip2})`}>
              <ChipShadow><StatCard x={0} y={0} big="97% spotted" sub="82% accuracy (per NOAA)" color={SLATE} scale={0.92} /></ChipShadow>
            </g>
          )}
          {/* the hard metal die stamp */}
          {stampT > 0.05 && <Stamp cx={540} cy={1240} s={stampT} text="STILL RESEARCH" rot={-9} color={CRIM} />}
        </svg>
      </div>
      {/* B: the bill close-up (a carried calendar page becomes the bill) */}
      {billT > 0.01 && (
        <div style={{position: 'absolute', inset: 0, opacity: billT}}>
          <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
            <rect width={1080} height={1920} fill="#5c5244" />
            {/* dust motes crossing the lamp light (ambient) */}
            {[0, 1, 2, 3].map((i) => (
              <circle key={`m${i}`} cx={(i * 271 + f * (0.5 + i * 0.2)) % 1080} cy={500 + ((i * 173 + f * 0.4) % 700)} r={3 + (i % 2)} fill="#efe8d0" opacity={0.35} />
            ))}
            {/* wood desk grain */}
            {[0, 1, 2, 3].map((i) => (
              <path key={i} d={`M0,${300 + i * 420} q540,${30 - i * 14} 1080,0`} stroke="#4a4236" strokeWidth={8} fill="none" opacity={0.5} />
            ))}
            {/* the bill itself: title block, seal, text lines, signature line */}
            <g transform="translate(540,980)">
              <ContactShadow cx={0} cy={430} rx={330} ry={30} opacity={0.35} />
              <rect x={-330} y={-420} width={660} height={850} rx={12} fill="#faf6ea" stroke={INKC} strokeWidth={8} />
              <rect x={-330} y={-420} width={660} height={110} rx={12} fill="#e8e0cc" stroke={INKC} strokeWidth={6} />
              <text x={0} y={-372} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={34} fill={INKC}>U.S. SENATE</text>
              <text x={0} y={-338} textAnchor="middle" fontFamily={BOLD} fontWeight={700} fontSize={22} fill="#6a6252">A BILL</text>
              <circle cx={-250} cy={-365} r={38} fill="none" stroke="#8a7a5c" strokeWidth={5} />
              <circle cx={-250} cy={-365} r={26} fill="none" stroke="#8a7a5c" strokeWidth={3} />
              <text x={0} y={-270} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={30} fill={INKC}>BYCATCH REDUCTION</text>
              <text x={0} y={-234} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={30} fill={INKC}>AND RESEARCH ACT</text>
              {Array.from({length: 9}).map((_, i) => (
                <line key={i} x1={-270} y1={-170 + i * 46} x2={i % 3 === 2 ? 140 : 270} y2={-170 + i * 46} stroke="#b8ae94" strokeWidth={7} strokeLinecap="round" />
              ))}
              <line x1={-270} y1={330} x2={110} y2={330} stroke={INKC} strokeWidth={4} />
              {/* page corner lifts in a draft (keeps the locked shot alive) */}
              <path d={`M330,${430 - 14 - 8 * Math.sin(f / 16)} q-40,${10 + 6 * Math.sin(f / 16)} -70,-6 L330,380 Z`} fill="#efe8d4" stroke={INKC} strokeWidth={4} opacity={0.9} transform="translate(-330,-430) translate(330,430)" />
              <text x={-270} y={368} fontFamily={BOLD} fontWeight={700} fontSize={20} fill="#6a6252">SIGNATURE</text>
              {/* the pen hovers trembling over the signature line, never signing */}
              <g transform={`translate(${170 + 3 * Math.sin(f / 3)},${240 + 4 * Math.sin(f / 5)}) rotate(-34)`}>
                <path d="M-12,0 L-12,-190 L12,-190 L12,0 Z" fill="#2b2f38" stroke={INKC} strokeWidth={6} strokeLinejoin="round" />
                <path d="M0,0 L-14,34 L14,34 Z" fill="#c9cfd8" stroke={INKC} strokeWidth={5} strokeLinejoin="round" transform="translate(0,0)" />
                <rect x={-12} y={-60} width={24} height={34} fill={CRIM} opacity={0.9} />
              </g>
            </g>
            <g transform="translate(540,470)">
              <ChipShadow>
                <g>
                  <rect x={-440} y={-46} width={880} height={122} rx={14} fill="rgba(20,32,28,0.88)" stroke={DIAL} strokeWidth={5} />
                  <text x={0} y={-6} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={36} fill="#fff">Bycatch Reduction and Research Act</text>
                  <text x={0} y={36} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={28} fill={DIAL}>introduced January 7 · revamped July 17 (KUCB)</text>
                </g>
              </ChipShadow>
            </g>
            {/* the wet ink pad press (distinct timbre from the die) */}
            {inkStamp > 0.05 && (
              <g opacity={Math.min(1, inkStamp * 1.3)}>
                <g transform={`translate(540,1310) rotate(-6) scale(${0.9 + 0.1 * inkStamp})`}>
                  <rect x={-260} y={-60} width={520} height={120} rx={14} fill="none" stroke="#2c5c8a" strokeWidth={10} />
                  <text x={0} y={22} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={62} fill="#2c5c8a" opacity={0.92}>TRANSPARENCY</text>
                  {/* ink bleed */}
                  <rect x={-260} y={-60} width={520} height={120} rx={14} fill="#2c5c8a" opacity={0.08} />
                </g>
              </g>
            )}
          </svg>
        </div>
      )}
      {voice.accentAt(gf) > 0.5 && <ZoomVignette amount={0.12 * voice.accentAt(gf)} />}
    </AbsoluteFill>
  );
};

// =============================================================== S5: the referee (Stage3D signature)
const S5: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const voice = useVoice();
  const gf = from + f;
  // ~36.5-45s: whistle + hush (0-3.5s), then the composed BOOM-UP (3.5-8.5s)
  const RISE = 140;
  const riseP = interpolate(f, [RISE, RISE + 130], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const whistle = spring({frame: f - 50, fps, config: {damping: 13, stiffness: 200}});
  const hush = interpolate(f, [56, 80], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const clickSpin = interpolate(f, [26, 58], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // the camera: rise + pull back (the art-directed crane), composed from vocab moves
  const cam = composeCams(
    CameraMoves.riseWith(riseP, 520),
    CameraMoves.dollyThrough(riseP, -400),  // negative travel = pull BACK
  );
  // world scale shrink sells the pull-back beyond the dolly (kept gentle so the
  // overscanned world plane always covers the frame; no cut-out box)
  const worldS = 1 - riseP * 0.34;
  const lonely = interpolate(f, [RISE + 100, RISE + 150], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <Stage3D camera={cam} background={SKY1}>
        {/* sky */}
        <Plane z={1600} fill>
          <svg width="1080" height="1920" viewBox="0 0 1080 1920"><DawnSky f={f} /></svg>
        </Plane>
        {/* far ridge in atmosphere */}
        <Plane z={1000} fill>
          <Atmosphere z={1000}>
            <svg width="1080" height="1920" viewBox="0 0 1080 1920">
              <path d="M0,860 q200,-70 420,-30 q260,44 400,-20 q140,-50 260,6 L1080,1000 L0,1000 Z" fill={RIDGE} />
              <path d="M0,940 q300,-40 560,-4 q280,30 520,-24 L1080,1080 L0,1080 Z" fill={RIDGE} opacity={0.85} />
            </svg>
          </Atmosphere>
        </Plane>
        {/* the river valley diorama: a FULL overscanned world (2400x3200) so the
            rising, pulling-back camera never reveals a cut-out edge */}
        <Plane z={200}>
          <div style={{position: 'absolute', left: -660, top: -640, width: 2400, height: 3200, transform: `scale(${worldS})`, transformOrigin: '50% 58%'}}>
            <svg width="2400" height="3200" viewBox="0 0 2400 3200" style={{position: 'absolute'}}>
              {/* the world's own sky + horizon (self-contained, no see-through) */}
              <defs>
                <linearGradient id="s5sky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SKY1} />
                  <stop offset="100%" stopColor={SKY2} />
                </linearGradient>
              </defs>
              <rect width={2400} height={1560} fill="url(#s5sky)" />
              <circle cx={1620} cy={960} r={110} fill="#fef2d0" opacity={0.85} />
              <path d="M0,1380 q400,-90 840,-40 q520,56 800,-30 q280,-60 760,10 L2400,1600 L0,1600 Z" fill={RIDGE} opacity={0.7} />
              <rect x={0} y={1520} width={2400} height={1680} fill={GRAVEL} />
              {/* ribcage bars across the whole flat */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <path key={i} d={`M${-200 + i * 400},${1660 + i * 220} q640,-60 1320,-10 q480,30 1160,-16 l0,70 q-680,46 -1160,24 q-680,-30 -1320,6 Z`}
                  fill={i % 2 ? GRAVEL_L : GRAVEL_D} opacity={i % 2 ? 0.65 : 0.48} />
              ))}
              {/* pebble field across the world's flats */}
              {Array.from({length: 40}).map((_, i) => (
                <ellipse key={`wp${i}`} cx={(i * 211) % 2400} cy={1600 + (i * 173) % 1500} rx={8 + (i % 4) * 5} ry={5 + (i % 3) * 2} fill={i % 3 ? GRAVEL_D : '#a8987a'} opacity={0.5} />
              ))}
              {/* the thin channel down the middle of the world */}
              <path d={`M1140,1520 q180,260 60,560 q-110,280 90,560 q110,170 40,300 L1440,3200 L1250,3200 q-110,-180 -40,-390 q95,-270 -65,-560 q-135,-270 -25,-450 Z`}
                fill={WATER} stroke={WATER_D} strokeWidth={7} />
              {/* cloud shadow raking across the gravel during the hold */}
              {riseP > 0.6 && (
                <path d={`M${-700 + ((f - RISE) * 9)},1540 l700,0 l-220,1660 l-700,0 Z`} fill={INKC} opacity={0.08} />
              )}
              {/* the crowds, signs lowered, shrinking to specks */}
              <g transform="translate(660,60)"><Crowd f={f} x={185} y={2100} side="left" lower={hush} /></g>
              <g transform="translate(660,60)"><Crowd f={f} x={895} y={2120} side="right" lower={hush} /></g>
              {/* THE REFEREE mid-river on the dry bar */}
              <g transform="translate(1200,2180)">
                <ellipse cx={0} cy={-2} rx={70} ry={13} fill={WATER} opacity={0.85} />
                <ellipse cx={0} cy={-2} rx={92} ry={17} fill="none" stroke="#cfe8dc" strokeWidth={4} opacity={0.7 + 0.3 * Math.sin(f / 9)} />
                <Character frame={f} x={0} y={0} scale={1.15} outfit="referee" headgear="bare" emotion="neutral" pose="raise" facing={1} hair="#2c2018" />
                {/* the raised clicker with its honest tag */}
                <g transform="translate(74,-566)">
                  <TallyCounter x={0} y={0} s={0.95} f={f} variant="clicker" spin={clickSpin} count={clickSpin >= 1 ? '0001' : '0000'} tag="STILL RESEARCH" />
                </g>
                {/* long raking dawn shadow */}
                <path d="M-30,6 L-360,120 L-300,140 L-6,10 Z" fill={INKC} opacity={0.16} />
                {/* whistle blast juice */}
                {whistle > 0.1 && whistle < 0.96 && (
                  <g>
                    <SpeedLines cx={36} cy={-500} frame={f} intensity={1.2} color="#fff" />
                    <ImpactStar cx={48} cy={-520} r={52} color={DIAL} />
                  </g>
                )}
              </g>
              {/* the sparse truth: at most 3 fish, one crossing lonely under the hold */}
              <Salmon x={1180} y={1960} scale={0.34} f={f} />
              {lonely > 0 && <Salmon x={1060 + lonely * 260} y={2560} scale={0.3} f={f} facing={1} />}
              {riseP > 0.8 && <Salmon x={1265} y={1700} scale={0.24} f={f + 30} facing={-1} />}
            </svg>
          </div>
        </Plane>
      </Stage3D>
      {/* annotation chip */}
      {hush > 0.9 && riseP < 0.55 && (
        <div style={{position: 'absolute', top: 360, left: 0, right: 0, textAlign: 'center'}}>
          <span style={{fontFamily: BOLD, fontWeight: 900, fontSize: 42, color: '#fff', background: 'rgba(20,32,28,0.85)', padding: '10px 28px', borderRadius: 12, border: `5px solid ${DIAL}`}}>one count both sides can read</span>
        </div>
      )}
      {riseP > 0.75 && (
        <div style={{position: 'absolute', top: 380, left: 0, right: 0, textAlign: 'center', opacity: interpolate(riseP, [0.75, 0.95], [0, 1])}}>
          <span style={{fontFamily: BOLD, fontWeight: 900, fontSize: 44, color: '#fff', background: 'rgba(20,32,28,0.85)', padding: '10px 30px', borderRadius: 12, border: `5px solid ${CRIM}`}}>a true count. an almost empty river.</span>
        </div>
      )}
      {voice.accentAt(gf) > 0.5 && <ZoomVignette amount={0.1 * voice.accentAt(gf)} />}
    </AbsoluteFill>
  );
};

// =============================================================== S6: the count comes home
const S6: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const voice = useVoice();
  const gf = from + f;
  // ~45s-end: telegraph + plant (0-2s), fish + tally + raven (2-8s), button macro (8s-end)
  const BUTTON = 207;
  const plantT = spring({frame: f - 56, fps, config: {damping: 13, stiffness: 90}});
  const buttonT = interpolate(f, [BUTTON - 12, BUTTON + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  // fish pass the lane; the odometer rolls on each pass
  const passes = [100, 145, 185];
  let count = 0;
  let roll = 0;
  for (const p of passes) {
    if (f > p + 14) count += 1;
    else if (f > p) roll = (f - p) / 14;
  }
  const resolveT = interpolate(f, [BUTTON + 76, BUTTON + 106], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      {/* A: Redoubt Lake weir, warm */}
      <div style={{position: 'absolute', inset: 0, opacity: 1 - buttonT}}>
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
          <DawnSky f={f} warm={1} />
          {/* spruce shore: staggered REAL trees breaking the band edge */}
          <path d="M0,800 q200,-40 400,-16 q300,30 680,-20 L1080,900 L0,900 Z" fill="#4a5c3c" opacity={0.85} />
          {[60, 250, 430, 640, 830, 1010].map((sx, i) => (
            <g key={i} transform={`translate(${sx},${820 + (i % 3) * 18}) scale(${1.5 + (i % 2) * 0.5}) rotate(${1.5 * Math.sin(f / 30 + i)})`}>
              <path d="M0,-60 L-20,-10 L-8,-10 L-30,44 L-12,44 L-38,100 L38,100 L12,44 L30,44 L8,-10 L20,-10 Z" fill={i % 2 ? '#3c4c30' : '#324226'} stroke={INKC} strokeWidth={4} strokeLinejoin="round" />
              <rect x={-6} y={100} width={12} height={22} fill="#5c4326" stroke={INKC} strokeWidth={3} />
            </g>
          ))}
          <rect x={0} y={980} width={1080} height={940} fill={WATER} />
          {/* warm dawn shimmer + drifting rings (ambient) */}
          <path d={`M0,${1050 + 8 * Math.sin(f / 15)} q270,20 540,0 q270,-20 540,10 l0,40 q-270,26 -540,6 q-270,-20 -540,4 Z`} fill="#f6d8a8" opacity={0.35} />
          {[0, 1, 2].map((i) => (
            <ellipse key={i} cx={200 + i * 350} cy={1120 + i * 240} rx={30 + ((f + i * 40) % 60)} ry={6 + ((f + i * 40) % 60) * 0.15} fill="none" stroke="#dff2ea" strokeWidth={3} opacity={0.5 - ((f + i * 40) % 60) * 0.008} />
          ))}
          {/* the weir, planted with a settle, feet IN the water (reflection + ripples) */}
          <VideoWeir x={540} y={1400} s={1.5} f={f} plant={plantT} count={String(count).padStart(4, '0')} roll={roll} />
          <ellipse cx={540} cy={1408} rx={300 * plantT} ry={20} fill="#dff2ea" opacity={0.35} />
          {[-150, -50, 50, 150].map((lx, i) => (
            <ellipse key={i} cx={540 + lx * 1.5} cy={1406} rx={26} ry={7} fill="none" stroke="#dff2ea" strokeWidth={3} opacity={0.6 + 0.3 * Math.sin(f / 8 + i)} />
          ))}
          {/* the biologist standing at her weir, hand on the walkway */}
          <Character frame={f} x={222} y={1620} scale={1.0} outfit="vest" headgear="beanie" emotion="neutral" pose={f < 70 ? 'point' : 'stand'} facing={1} hair="#1e1610" skin="#c9915c" />
          {/* the raven's honest scratch tally on the walkway (gag payoff) */}
          <g transform="translate(816,1190)">
            <Raven x={0} y={0} scale={0.8} f={f} mode="perch" />
            <g transform="translate(52,10)">
              {Array.from({length: Math.min(3, count)}).map((_, i) => (
                <line key={i} x1={i * 14} y1={0} x2={i * 14 - 5} y2={30} stroke="#f7f1df" strokeWidth={5} />
              ))}
            </g>
          </g>
          {/* salmon passing THROUGH the picket lane (waterline level) */}
          {passes.map((p, i) => {
            const t = interpolate(f, [p - 40, p + 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return t > 0 && t < 1 ? (
              <g key={i}>
                <Salmon x={180 + t * 740} y={1452 + i * 22} scale={0.62} f={f + i * 12} />
                {/* wake ripple behind the moving fish */}
                <path d={`M${140 + t * 740},${1452 + i * 22} q-24,8 -48,0`} stroke="#dff2ea" strokeWidth={4} fill="none" opacity={0.6} />
              </g>
            ) : null;
          })}
          {/* identity + grant chips (custom width; Nameplate is too narrow for this) */}
          <g transform="translate(540,360)">
            <ChipShadow>
              <g>
                <rect x={-390} y={-52} width={780} height={118} rx={14} fill="rgba(20,32,28,0.88)" stroke={DIAL} strokeWidth={5} />
                <text x={0} y={-8} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={44} fill="#fff">SITKA TRIBE OF ALASKA</text>
                <text x={0} y={38} textAnchor="middle" fontFamily={BOLD} fontWeight={700} fontSize={24} fill={DIAL}>federally recognized tribal government</text>
              </g>
            </ChipShadow>
          </g>
          {plantT > 0.9 && (
            <g transform="translate(540,540)">
              <ChipShadow><StatCard x={0} y={0} big="$200,000" sub="USFWS Tribal Wildlife Grant" color={BRASS} scale={0.9} /></ChipShadow>
            </g>
          )}
          {count >= 2 && <BoxLabel x={540} y={706} text="their river · their count" fs={34} />}
        </svg>
      </div>
      {/* B: the button (the loop) */}
      {buttonT > 0.01 && (
        <div style={{position: 'absolute', inset: 0, opacity: buttonT}}>
          <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
            <LensMacro f={f} digitRoll={resolveT > 0 && resolveT < 1 ? resolveT : 0} count={resolveT > 0 ? '0002' : '0001'} resolve={resolveT} />
          </svg>
          <div style={{position: 'absolute', top: 320, left: 0, right: 0, textAlign: 'center'}}>
            <span style={{fontFamily: BOLD, fontWeight: 900, fontSize: 72, color: '#fff', background: 'rgba(20,32,28,0.85)', padding: '12px 32px', borderRadius: 14, border: `6px solid ${DIAL}`, letterSpacing: 1}}>
              WHO COUNTS THIS FISH?
            </span>
          </div>
          {resolveT > 0.6 && (
            <div style={{position: 'absolute', top: 470, left: 0, right: 0, textAlign: 'center', opacity: interpolate(resolveT, [0.6, 1], [0, 1])}}>
              <span style={{fontFamily: BOLD, fontWeight: 900, fontSize: 88, color: INKC, background: DIAL, padding: '10px 40px', borderRadius: 14, border: `6px solid ${INKC}`, transform: 'rotate(-2deg)', display: 'inline-block'}}>
                YOU DO.
              </span>
            </div>
          )}
        </div>
      )}
      {voice.accentAt(gf) > 0.5 && <ZoomVignette amount={0.1 * voice.accentAt(gf)} />}
    </AbsoluteFill>
  );
};

// ================================================================ TIMELINE
const SCENE_COMPONENTS: React.FC<{from?: number}>[] = [S1, S2, S3, S4, S5, S6];
const DEFAULT_BOUNDS: {from: number; dur: number}[] = [
  {from: 0, dur: 201}, {from: 201, dur: 341}, {from: 542, dur: 198},
  {from: 740, dur: 365}, {from: 1105, dur: 329}, {from: 1434, dur: 395},
];

const GradedGrade: React.FC = () => {
  const f = useCurrentFrame();
  return <GradeLayer f={f} bloom={0.45} vignette={0.42} grain={0.065} warmth={0.1} />;
};

// Persistent corner chrome (LIVING_SCREEN: two spatially isolated motion regions):
// left, a small swimming salmon loop; right, a slow-rolling tally chip.
const CornerChrome: React.FC = () => {
  const f = useCurrentFrame();
  const roll = (f % 90) < 12 ? ((f % 90) / 12) : 0;
  const n = Math.floor(f / 90) % 10;
  return (
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', pointerEvents: 'none'}}>
      <g transform={`translate(${70 + 12 * Math.sin(f / 22)},96)`} opacity={0.85}>
        <Salmon x={0} y={0} scale={0.32} f={f} />
      </g>
      <g transform="translate(972,96)" opacity={0.9}>
        <TallyCounter x={0} y={0} s={0.5} f={f} variant="odometer" count={`000${n}`} roll={roll} />
      </g>
    </svg>
  );
};

const Captions: React.FC<{captions: EpisodeProps['captions']}> = ({captions}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const cue = captions.find((c) => t >= c.start && t < c.end + 0.05);
  if (!cue) return null;
  return (
    <div style={{position: 'absolute', bottom: 340, left: 0, right: 0, display: 'flex', justifyContent: 'center', padding: '0 60px'}}>
      <div style={{background: 'rgba(20,32,28,0.84)', borderRadius: 14, padding: '16px 30px', maxWidth: 940, border: `4px solid ${CAP_BORDER}`}}>
        <div style={{fontFamily: BOLD, fontWeight: 900, fontSize: 46, lineHeight: 1.12, color: '#fff', textAlign: 'center', letterSpacing: 0.5, textShadow: `2px 3px 0 rgba(0,0,0,0.6)`}}>
          {cue.text}
        </div>
      </div>
    </div>
  );
};

export const Episode: React.FC<EpisodeProps> = ({captions, scenes, mouth, accents}) => {
  const bounds = scenes && scenes.length === SCENE_COMPONENTS.length ? scenes : DEFAULT_BOUNDS;
  const voice = mouth && mouth.length ? {fps: 30, mouth, accents: accents ?? []} : null;
  return (
    <AbsoluteFill style={{backgroundColor: INKC}}>
      <VoiceProvider data={voice}>
        {SCENE_COMPONENTS.map((C, i) => (
          <Sequence key={i} from={bounds[i].from} durationInFrames={bounds[i].dur} name={`S${i + 1}`}>
            <C from={bounds[i].from} />
          </Sequence>
        ))}
        <GradedGrade />
        <CornerChrome />
        <Captions captions={captions} />
      </VoiceProvider>
    </AbsoluteFill>
  );
};
