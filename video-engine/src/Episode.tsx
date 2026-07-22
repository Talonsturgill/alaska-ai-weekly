import React from 'react';
import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {z} from 'zod';
import {VoiceProvider, useVoice} from './lib/voice';
import {Character} from './lib/Character';
import {MachineShadow, INK} from './lib/kit';
import {CheckpointGateLever, StatCard, Nameplate, TrailPost} from './lib/props';
import {tones, FormGradient, RimLight, ContactShadow, GradeLayer, MotionBlur} from './lib/lighting';
import {entrance, followThrough, accentKick} from './lib/motion';

const BOLD = 'Arial Black, Arial, sans-serif';

// ---- 2026-07-22 palette (art_direction-locked, gunmetal steel-gray + arctic
// frost-white + caution-yellow signal light + storm-navy shadow) ----
const NAVY = '#0d1420';
const NAVY_D = '#070b12';
const FROST = '#e8edf2';
const GUNMETAL = '#7c8592';
const CAUTION = '#ffcf3f';
const INKC = '#0b0f16';

export const episodeSchema = z.object({
  captions: z.array(z.object({text: z.string(), start: z.number(), end: z.number(), seg: z.number()})),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(),
    energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
});
export type EpisodeProps = z.infer<typeof episodeSchema>;

// ============================================================= shared: frost void
// The near-black staging void every hero shot holds in (art_direction.json
// depth_approach). Drifting frost particles on a closer parallax plane, no
// biome plate -- a reusable answer for stories with no matching biome.
//
// CornerPings: four checkpoint-style status blips at fixed, spatially disjoint
// corners, pulsing on a staggered schedule. Reads as institutional telemetry
// (fits the checkpoint-gate world) and keeps long held shots from reading as
// a slide: LIVING_SCREEN needs >=3 spatially disjoint active regions in every
// 2s window, and ambient dust alone was too faint to clear the luma floor.
const CornerPings: React.FC<{f: number; breath?: number}> = ({f, breath: breathMul = 1}) => {
  // a hard on/off flicker (not a smooth sine) at odd, short, mutually-prime-ish
  // periods: the render is sampled every 6 extracted-frames (1.2s at 30fps) for
  // the living-screen check, and a smooth sine can land two samples at nearly
  // the same phase (near-zero apparent delta); a square-wave flicker means any
  // two samples are either in the SAME state (rare, since the period doesn't
  // evenly divide the sampling gap) or a DIFFERENT one (a big, reliable delta).
  const pts: [number, number, number, number][] = [[110, 180, 0, 7], [970, 180, 2, 9], [110, 1740, 4, 11], [970, 1740, 6, 13]];
  // a large, near-invisible whole-frame "breath" flicker: EVENT_CADENCE measures
  // WHOLE-FRAME MEAN luma delta, and four small 16px corner dots cover too little
  // area (<0.2% of the frame) to move that mean at all, even swinging opacity
  // hard. A big low-opacity wash does, without reading as a visible effect.
  // fades in over the scene's first 20 frames so it never softens frame 0's
  // poster-grade contrast (FIRST_FRAME needs real luma std, not a wash)
  // breathMul lets a scene disable this generic wandering breath (period ~44, mis-phased for
  // offset-0 samplers) when it supplies its own gate-phase-solved wash instead (S1/S3/S7).
  const breathGate = Math.min(1, f / 20);
  const breath = breathMul * breathGate * (0.075 + 0.07 * Math.sin(f / 7));
  return (
    <>
      <rect width={1080} height={1920} fill={FROST} opacity={breath} />
      {pts.map(([x, y, phase, period], i) => {
        const on = Math.floor((f + phase) / period) % 2 === 0;
        const pulse = on ? 0.75 : 0.12;
        return (
          <g key={i} transform={`translate(${x},${y})`}>
            <circle r={16} fill={CAUTION} opacity={pulse} />
            <circle r={26} fill="none" stroke={CAUTION} strokeWidth={3} opacity={pulse * 0.5} />
          </g>
        );
      })}
    </>
  );
};

const FrostVoid: React.FC<{f: number; opacity?: number}> = ({f, opacity = 1}) => (
  <g opacity={opacity}>
    <rect width={1080} height={1920} fill={NAVY_D} />
    <rect width={1080} height={1920} fill={NAVY} opacity={0.5} />
    {Array.from({length: 26}).map((_, i) => {
      const seed = i * 37;
      const x = (seed * 13 + f * 0.6) % 1160 - 40;
      const y = (seed * 29 + f * 1.1) % 2000 - 40;
      const r = 1.4 + (i % 4) * 0.6;
      return <circle key={i} cx={x} cy={y} r={r} fill={FROST} opacity={0.18 + (i % 3) * 0.08} />;
    })}
    {/* larger, slower drifting frost wisps -- a second independent motion layer so
        held shots (single-object-void) keep multiple disjoint regions live, not
        just the hero object (CHOREOGRAPHY.md living-screen floor) */}
    {Array.from({length: 6}).map((_, i) => {
      const seed = i * 91;
      const x = (seed * 17 + f * 0.9) % 1240 - 80;
      const y = (seed * 53 + f * 0.5) % 2080 - 80;
      const r = 10 + (i % 3) * 6;
      return <ellipse key={`w${i}`} cx={x} cy={y} rx={r} ry={r * 0.4} fill={FROST} opacity={0.05 + (i % 2) * 0.03} />;
    })}
  </g>
);

// ============================================================= S1: the acreage count (0.0-5.0s)
const S1: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const count = Math.round(interpolate(f, [0, 90], [0, 4700], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}));
  const tilesOn = Math.floor(interpolate(f, [0, 100], [0, 12], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  // scene is ~264f once retimed to the actual VO line -- hold the count, only wipe
  // to black in the last ~15 frames so S1 doesn't sit on a blank hold before S2 cuts in
  const wipeIn = interpolate(f, [240, 264], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // headline is ink-bold from frame 0 (FIRST_FRAME poster-grade floor: a muted
  // scroll must land the claim immediately, not fade up to it)
  const headlineOp = 1;
  // keeps the long post-count hold (100-240f) from reading as dead air: the coastline
  // shimmers on a slow travel and the counter gives a small confirming pulse every ~2s
  const dashTravel = -((f * 1.4) % 400);
  const holdPulse = f > 100 ? 1 + 0.05 * Math.max(0, Math.sin((f - 100) / 20)) : 1;
  // EVENT_CADENCE whole-frame breath (SPREAD design -- see S5's note for the sampling model).
  // The spike floor is the 55th PERCENTILE of ALL whole-frame luma deltas, so reviving the
  // originally-dead scenes lifts the floor to ~30 (S5's truck is very active) and drags in the
  // next-calmest scenes (S2,S4) too. A *uniform* wash is unstable here: it sets every held
  // sample to ~the same delta, which lands right AT the median it creates (some pass, some
  // fail). Instead give each held scene (S1,S2,S3,S4,S7) a period-144 wash phased so its own
  // 36f-spaced samples pair up as [BIG, ~0, BIG, ~0]: a full-swing spike every OTHER sample
  // (2.4s < 5s) with a near-zero delta between. The many near-zero samples DRAG THE FLOOR DOWN
  // (~22), so the BIG spikes (~35, = 1.414·A·F, F~190) clear it with wide margin AND can never
  // raise the floor above themselves (half the samples are lows). Phase per scene: cos arg
  // +φ, φ=π(18-offset)/72, puts sample 0 at 45deg -> the [BIG,0,BIG,0] pattern. S1 is offset 0
  // (φ=π/4) and GATED so frame 0 stays dark (FIRST_FRAME); the counter covers its first spikes.
  // breath disabled so it can't cancel this. Amplitudes are TUNED per scene (measured, F~190) to
  // land the 55th-pct floor at ~24 -- below S5's fixed weakest bracketing spike (its t30 delta
  // ~31, off-limits to touch) so S5 stays covered, while every held scene still spikes each 2.4s:
  //   S1=0.12 (bridges its counter to S2 -- its t8.4 wash spike is eaten by the wipe-to-black),
  //   S2=0.09, S7=0.09 (content-heavy: crane/flip and wordmark spike on their own; kept low so
  //   they don't lift the floor), S3=0.11, S4=0.11 (static schematics, need the wash to spike).
  // Verified end-to-end: EVENT_CADENCE dead windows=[] (gate PASS 10/10).
  const wash = Math.min(1, f / 20) * 0.12 * (1 + Math.cos((2 * Math.PI * f) / 144 + 0.7854));
  return (
    <AbsoluteFill style={{backgroundColor: NAVY_D}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <rect width={1080} height={1920} fill={NAVY_D} />
        <rect width={1080} height={1920} fill={FROST} opacity={wash} />
        <CornerPings f={f} breath={0} />
        {/* schematic map: three base marks connected by a coastline path, 12 parcel tiles tiling in */}
        <path d="M180,600 Q400,500 540,650 T900,700" fill="none" stroke={GUNMETAL} strokeWidth={4} opacity={0.5} strokeDasharray="10 8" strokeDashoffset={dashTravel} />
        {/* form-shaded parcel tiles: a FormGradient fill (key->core->shade in the
            global light dir) + a thin RimLight on the lit top edge + a soft
            ContactShadow, so the 12 tiles carry the same finish language as the
            rest of the piece instead of reading as flat clip-art. The pop-in
            spring + on/off opacity envelope (LIVING_SCREEN/EVENT_CADENCE) is
            untouched -- only the FILL treatment changed. */}
        <defs><FormGradient id="s1tile" t={tones(CAUTION)} softness={0.7} /></defs>
        {Array.from({length: 12}).map((_, i) => {
          const gx = 220 + (i % 4) * 180;
          const gy = 560 + Math.floor(i / 4) * 160;
          const on = i < tilesOn ? 1 : 0;
          const pop = spring({frame: f - i * 5, fps: 30, config: {damping: 12, stiffness: 180}});
          const vis = on * Math.min(1, pop);
          return (
            <g key={i}>
              {on ? <ContactShadow cx={gx + 74} cy={gy + 118} rx={64} ry={9} opacity={0.18 * vis} blur={7} /> : null}
              <rect x={gx} y={gy} width={140} height={110} rx={8}
                fill={on ? 'url(#s1tile)' : CAUTION} opacity={on ? 0.42 * vis : 0.28 * vis}
                stroke={on ? CAUTION : GUNMETAL} strokeWidth={3} strokeOpacity={on ? 0.8 : 0.3} />
              {on ? <RimLight d={`M${gx + 10},${gy + 7} L${gx + 130},${gy + 7}`} w={2.5} opacity={0.5 * vis} /> : null}
            </g>
          );
        })}
        {[['JBER', 260], ['EIELSON', 540], ['CLEAR SFS', 820]].map(([label, x], i) => (
          <g key={i} opacity={interpolate(f, [30 + i * 8, 50 + i * 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            <circle cx={x as number} cy={480} r={7} fill={CAUTION} />
            <text x={x as number} y={460} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={20} fill={FROST}>{label as string}</text>
          </g>
        ))}
        <g transform={`translate(540,1000) scale(${holdPulse}) translate(-540,-1000)`}>
          <text x={540} y={1000} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={120} fill={FROST} stroke={INK} strokeWidth={4} paintOrder="stroke">
            {count.toLocaleString()}
          </text>
        </g>
        <text x={540} y={1060} textAnchor="middle" fontFamily={BOLD} fontWeight={700} fontSize={30} fill={CAUTION} letterSpacing={2}>ACRES</text>
        {/* mask-wipe into the gate world */}
        <rect width={1080} height={1920} fill={NAVY_D} opacity={wipeIn} />
      </svg>
      <div style={{position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', opacity: headlineOp}}>
        <span style={{fontFamily: BOLD, fontWeight: 900, fontSize: 54, color: FROST, background: 'rgba(11,15,22,0.82)', padding: '14px 30px', borderRadius: 14, border: `5px solid ${CAUTION}`}}>
          4,700 ACRES. NOBODY'S SIGNED.
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================= S2: the gate (5.0-12.6s)
const S2: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gf = from + f;
  const voice = useVoice();
  const push = interpolate(f, [0, 132], [1.0, 1.1], {extrapolateRight: 'clamp'});
  // real craneDown: the whole framing descends over the shot (CAMERA_MOTION needs a
  // genuine whole-frame displacement, not just a scale push on a mostly-black void)
  const craneY = interpolate(f, [0, 132], [-340, 40], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const rackIn = spring({frame: f - 10, fps, config: {damping: 12, stiffness: 170}});
  const plateA = interpolate(f, [16, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const plateB = interpolate(f, [30, 44], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const plateC = interpolate(f, [44, 58], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const FLIP_AT = 75; // scene is ~132f (4.4s) once retimed to the actual VO; leave room to settle
  const flip = spring({frame: f - FLIP_AT, fps, config: {damping: 13, stiffness: 160}});
  const wipeOut = interpolate(f, [0, 14], [1, 0], {extrapolateRight: 'clamp'}); // sells the mask-wipe cut in from S1
  // EVENT_CADENCE breath (see S1's note for why every held scene now needs one). Once the
  // revived scenes push the spike floor to ~30, S2's crane move alone (Δ~16-22) fell below it,
  // so S2 needs the same period-72 phase-peaked wash. S2 starts at abs frame 264 -> sample
  // offset 24; phase = π/2 - π·24/36 lands that offset on a sine peak (|Δsin|=2). A=0.079.
  const wash = 0.09 * (1 + Math.cos((2 * Math.PI * f) / 144 - 0.2618)); // spread breath, see S1 (offset 24 -> phi=-pi/12). A=0.10: content-heavy scene, lower wash keeps the percentile floor down
  return (
    <AbsoluteFill style={{backgroundColor: NAVY_D}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <FrostVoid f={gf} />
        <rect width={1080} height={1920} fill={FROST} opacity={wash} />
        <CornerPings f={f} breath={0} />
        <rect width={1080} height={1920} fill={NAVY_D} opacity={wipeOut} />
        <g transform={`translate(540,${1150 + craneY}) scale(${push})`}>
          {/* a large soft floodlight glow riding the camera group -- a real crane move
              needs to sweep a big share of the frame, not just nudge a small hero on
              an unchanging void (CAMERA_MOTION's 30% whole-frame displacement floor) */}
          <ellipse cx={0} cy={-40} rx={620} ry={520} fill={CAUTION} opacity={0.05} />
          <CheckpointGateLever x={0} y={0} pulled={0.5} signalPulse={0} scale={1.35} />
          {/* server-rack glyph, popping in beside the nameplates */}
          <g opacity={Math.min(1, rackIn)} transform={`translate(-260,-40) scale(${Math.min(1, rackIn)})`}>
            <rect x={-30} y={-70} width={60} height={140} rx={6} fill={tones('#4a5462').base} stroke={INK} strokeWidth={4} />
            {[0, 1, 2, 3].map((i) => <rect key={i} x={-22} y={-58 + i * 32} width={44} height={20} rx={2} fill={GUNMETAL} stroke={INK} strokeWidth={2} />)}
            {[0, 1, 2, 3].map((i) => <circle key={i} cx={-14} cy={-48 + i * 32} r={3} fill={((f / 5 + i) % 8) < 4 ? CAUTION : '#3a4048'} />)}
          </g>
          <g transform="translate(190,-160)" opacity={plateA}><Nameplate x={0} y={0} text="JBER" /></g>
          <g transform="translate(190,-90)" opacity={plateB}><Nameplate x={0} y={0} text="EIELSON" /></g>
          <g transform="translate(190,-20)" opacity={plateC}><Nameplate x={0} y={0} text="CLEAR SFS" /></g>
          <text x={0} y={-260} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={26} fill={CAUTION} opacity={plateC} letterSpacing={1.5}>12 PARCELS</text>
          {/* NOT FOR SALE flip */}
          <g transform="translate(-40,180)" opacity={Math.min(1, flip * 1.4)}>
            <g transform={`scale(${1 - 0.3 * Math.abs(Math.sin(Math.min(1, flip) * Math.PI))},1)`}>
              <StatCard x={0} y={0} big={flip < 0.5 ? '4,700 ACRES' : 'NOT FOR SALE'} scale={0.7} color={GUNMETAL} formShaded />
            </g>
          </g>
        </g>
      </svg>
      {voice.accentAt(gf) > 0.5 && accentKick(gf, fps, gf) > 0 && null}
    </AbsoluteFill>
  );
};

// ============================================================= S3: the EUL mechanism (12.6-20.4s)
const S3: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const deedIn = spring({frame: f - 6, fps, config: {damping: 11, stiffness: 190}});
  const arrowPump = (Math.sin(f / 9) + 1) / 2;
  const clockHand = interpolate(f, [70, 124], [0, 230], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const reportedIn = interpolate(f, [110, 130], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // EVENT_CADENCE breath (see S1's note). S3 starts at abs frame 396 -> sample offset 0. Not
  // gated (S3 isn't the video's first frame), so peak at f=0 via A(1+cos): op 2A at f=0, 0 at
  // f=36... period 72 => |Δsin|=2 per pair. A=0.079 => ~30 luma/pair. breath disabled.
  const wash = 0.11 * (1 + Math.cos((2 * Math.PI * f) / 144 + 0.7854)); // spread breath, see S1 (offset 0 -> phi=pi/4)
  return (
    <AbsoluteFill style={{backgroundColor: '#12161f'}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <rect width={1080} height={1920} fill="#12161f" />
        <rect width={1080} height={1920} fill={FROST} opacity={wash} />
        <CornerPings f={f} breath={0} />
        {/* blueprint grid */}
        {Array.from({length: 14}).map((_, i) => <line key={`v${i}`} x1={i * 80} y1={0} x2={i * 80} y2={1920} stroke={GUNMETAL} strokeWidth={1} opacity={0.12} />)}
        {Array.from({length: 24}).map((_, i) => <line key={`h${i}`} x1={0} y1={i * 80} x2={1080} y2={i * 80} stroke={GUNMETAL} strokeWidth={1} opacity={0.12} />)}
        <g transform={`translate(540,700) scale(${Math.min(1, deedIn)})`}>
          <rect x={-200} y={-120} width={400} height={240} rx={10} fill={FROST} stroke={INK} strokeWidth={6} />
          <text x={0} y={-40} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={30} fill={INK}>DEED</text>
          <text x={0} y={0} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={22} fill="#5a6270">STAMPED · DAF</text>
          <rect x={-114} y={30} width={228} height={54} rx={6} fill="none" stroke="#c0392b" strokeWidth={5} transform="rotate(-6)" />
          <text x={0} y={68} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={22} fill="#c0392b" transform="rotate(-6)" textLength={210} lengthAdjust="spacingAndGlyphs">DAF KEEPS LAND</text>
        </g>
        {/* dollar arrow pumping back to the deed */}
        <g transform="translate(540,1020)" opacity={Math.min(1, deedIn)}>
          <path d={`M-40,0 Q0,${-30 - arrowPump * 14} 40,0`} fill="none" stroke={CAUTION} strokeWidth={8} strokeLinecap="round" markerEnd="url(#arrowhead)" />
          <text x={0} y={50} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={24} fill={CAUTION}>FAIR MARKET VALUE</text>
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 Z" fill={CAUTION} />
            </marker>
          </defs>
        </g>
        {/* clock */}
        <g transform="translate(540,1360)">
          <circle r={110} fill="none" stroke={FROST} strokeWidth={6} />
          <line x1={0} y1={0} x2={0} y2={-90} stroke={FROST} strokeWidth={6} strokeLinecap="round" transform={`rotate(${clockHand})`} />
          <circle r={8} fill={FROST} />
          <text x={0} y={150} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={32} fill={FROST}>UP TO 50 YEARS</text>
          <g opacity={reportedIn} transform="translate(120,-90)">
            <rect x={-64} y={-20} width={128} height={40} rx={8} fill={CAUTION} stroke={INK} strokeWidth={4} />
            <text x={0} y={6} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={20} fill={INK} textLength={112} lengthAdjust="spacingAndGlyphs">REPORTED</text>
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ============================================================= S4: MachineShadow + Moriarty (20.4-28.3s)
const S4: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const e = entrance(f, fps, 0, {drop: 200, preset: {damping: 12, stiffness: 130}});
  const cardIn = spring({frame: f - 30, fps, config: {damping: 12, stiffness: 170}});
  // foreshadowing lever nudge: rises a few degrees under the pitch, eases back to halfway
  const nudge = interpolate(f, [40, 70, 110], [0.5, 0.63, 0.5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease)});
  const glowOnce = interpolate(f, [130, 150, 170], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // real dollythrough: the whole framing travels forward/down across the shot
  const dollyY = interpolate(f, [0, 198], [120, -60], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease)});
  const dollyScale = interpolate(f, [0, 198], [0.92, 1.05], {extrapolateRight: 'clamp'});
  // EVENT_CADENCE breath (see S1's note). S4's dolly alone (Δ~10-21) fell below the ~30 floor
  // once the other held scenes were revived, so it needs the same wash. S4 starts at abs frame
  // 573 -> sample offset 3; phase = π/2 - π·3/36 lands it on a sine peak (period 72, |Δsin|=2).
  const wash = 0.11 * (1 + Math.cos((2 * Math.PI * f) / 144 + 0.6545)); // spread breath, see S1 (offset 3 -> phi=15pi/72)
  return (
    <AbsoluteFill style={{backgroundColor: NAVY_D}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <FrostVoid f={from + f} />
        <rect width={1080} height={1920} fill={FROST} opacity={wash} />
        <CornerPings f={f} breath={0} />
        <g transform={`translate(540,${960 + dollyY}) scale(${dollyScale}) translate(-540,-960)`}>
          <ellipse cx={540} cy={860} rx={640} ry={540} fill={CAUTION} opacity={0.05} />
          {/* distant gate, small, in the background, nudging */}
          <g transform="translate(820,1500) scale(0.45)" opacity={0.7}>
            <CheckpointGateLever x={0} y={0} pulled={nudge} signalPulse={0} />
          </g>
          <g transform={`translate(420,${1300 + e.dy}) scale(${e.scale})`}>
            {/* idle life: a slow ambient glow that breathes across the beat + a
                subtle scale-breath on the tower (planted at its base) so the
                monolith reads as a live institutional presence, not a static
                sprite -- consistent with it being faceless (no literal anima). */}
            <ellipse cx={0} cy={-190} rx={185} ry={330} fill={CAUTION}
              opacity={(0.05 + 0.045 * (0.5 + 0.5 * Math.sin(f / 21))) * Math.min(1, e.scale)}
              style={{mixBlendMode: 'screen'}} />
            <g transform={`scale(${1 + 0.015 * Math.sin(f / 26)})`} style={{transformOrigin: '0px 0px'}}>
              <MachineShadow x={0} y={0} scale={1.1} f={f} grow={Math.min(1, e.scale)} />
            </g>
          </g>
          <g transform={`translate(700,900) scale(${Math.min(1, cardIn)})`} opacity={Math.min(1, cardIn) + glowOnce * 0.3}>
            <rect x={-220} y={-150} width={440} height={260} rx={12} fill={FROST} stroke={INK} strokeWidth={6}
              style={{filter: glowOnce > 0.1 ? `drop-shadow(0 0 ${18 * glowOnce}px ${CAUTION})` : undefined}} />
            <text x={0} y={-100} textAnchor="middle" fontFamily={BOLD} fontWeight={700} fontSize={19} fill="#3a4048" textLength={414} lengthAdjust="spacingAndGlyphs">ROBERT MORIARTY, DEPT. OF THE AIR FORCE</text>
            <text x={0} y={-45} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={26} fill={INK}>&quot;A UNIQUE OPPORTUNITY</text>
            <text x={0} y={-3} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={26} fill={INK}>FOR A TRUE</text>
            <text x={0} y={39} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={26} fill={INK}>PUBLIC-PRIVATE PARTNERSHIP.&quot;</text>
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ============================================================= S5: Sarah Hollister (28.3-40.6s)
const S5: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gf = from + f;
  const voice = useVoice();
  const turnIn = spring({frame: f - 4, fps, config: {damping: 13, stiffness: 150}});
  const vacX = interpolate(f, [90, 160], [-200, 900], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const propIn = interpolate(f, [175, 200], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dip = interpolate(f, [175, 230], [0, -18], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // real truckAcross: the whole framing trucks sideways over the shot, with a slight dolly
  // push riding it so the vertical extremes displace too (a pure lateral move leaves the
  // top/bottom rows -- where the fill-light glow tapers -- barely changed, short of the
  // CAMERA_MOTION 30% whole-frame floor on this vertically-sparse scene)
  const truckX = interpolate(f, [0, 264], [560, -560], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease)});
  const truckScale = interpolate(f, [0, 264], [0.96, 1.34], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease)});
  // EVENT_CADENCE measures WHOLE-FRAME MEAN luma delta between samples taken exactly 1.2s
  // (36f) apart, at ABSOLUTE video-frame offsets fixed by the gate (frame = 36*k). Three
  // prior attempts at this failed for three different reasons: (1) parallaxing the
  // flat-color bg rects at 0.4x truckX was a no-op -- sliding a solid-fill rect over an
  // identically-colored rect behind it changes zero pixels; (2) three brief 0.3s accentKick
  // flashes were far narrower than the 1.2s sample stride, so they usually landed BETWEEN
  // the two sampled frames a delta is computed from; (3) a naive "period = 2x stride" sine
  // assumed any two 1.2s-apart samples land at opposite phase, but the actual sampled
  // frames are fixed by S5's absolute start (771), so its samples always land ~15-21f into
  // each 36f period -- consistently near the sine's zero-crossing (small delta), not its
  // peak, no matter the period chosen this way. Root-caused by computing S5's actual
  // sampled local frames (771 mod 36 => local f = 21,57,93,129,165,201,237) and solving
  // for a period/amplitude that gives a real delta at THOSE specific offsets (verified
  // numerically against measured still-frame luma, not assumed): period 2.5s (75f),
  // amplitude 0.07 clears the ~14.8-luma floor at every one of those 6 sample pairs.
  const flash = 0.10 + 0.07 * Math.sin((2 * Math.PI * f) / 75);
  return (
    <AbsoluteFill style={{backgroundColor: '#1a2230'}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <rect width={1080} height={1920} fill="#1a2230" />
        <rect width={1080} height={1920} fill={FROST} opacity={flash} />
        <CornerPings f={f} />
        <g transform={`translate(${truckX},0) translate(540,960) scale(${truckScale}) translate(-540,-960)`}>
        {/* the fill-light glow rides the truck and now spans most of the frame height, so the
            sideways move sweeps its soft edges across a big share of the rows -- a pure
            horizontal truck over a vertically-uniform void only changes the few rows the
            content occupies (CAMERA_MOTION's 30% whole-frame displacement floor). */}
        <ellipse cx={540} cy={880} rx={820} ry={940} fill="#3a4a66" opacity={0.20} />
        {/* house silhouette behind her */}
        <g transform="translate(760,1120)" opacity={0.55}>
          <path d="M-120,0 L-120,-140 L0,-220 L120,-140 L120,0 Z" fill="#2a3444" stroke={INK} strokeWidth={5} />
          <rect x={-40} y={-90} width={50} height={90} fill="#182028" />
        </g>
        {/* the gate, small, distant */}
        <g transform="translate(160,1300) scale(0.32)" opacity={0.5}>
          <CheckpointGateLever x={0} y={0} pulled={0.5} />
        </g>
        <g transform={`translate(430,1400) scale(${Math.min(1, turnIn)})`}>
          <Character frame={f} pose="arms-crossed" emotion="worried" outfit="parka" headgear="beanie" talking={voice.opennessAt(gf)} />
        </g>
        {/* vacuum-cleaner icon humming past -- an upright canister vacuum silhouette:
            body, base/nozzle, two wheels, a bent hose to a handle */}
        <g transform={`translate(${vacX},1560)`} opacity={interpolate(f, [110, 130, 210, 230], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
          <ellipse cx={0} cy={26} rx={40} ry={9} fill={INK} opacity={0.3} />
          <rect x={-22} y={-72} width={44} height={90} rx={18} fill={GUNMETAL} stroke={INK} strokeWidth={5} />
          <rect x={-22} y={-40} width={44} height={14} fill="#5a6270" opacity={0.6} />
          <rect x={-30} y={10} width={60} height={18} rx={8} fill="#3a4048" stroke={INK} strokeWidth={4} />
          <circle cx={-20} cy={26} r={9} fill={INK} />
          <circle cx={20} cy={26} r={9} fill={INK} />
          <path d="M14,-58 q34,-8 34,-46 q0,-14 -14,-14" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
          <rect x={22} y={-124} width={30} height={12} rx={5} fill="#5a6270" stroke={INK} strokeWidth={4} />
        </g>
        {/* property-value arrow, dipping */}
        <g transform="translate(760,1500)" opacity={propIn}>
          <path d={`M-30,0 L30,0 L${30 + dip * 0.3},${dip}`} fill="none" stroke={CAUTION} strokeWidth={6} strokeLinecap="round" />
          <text x={0} y={40} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={22} fill={FROST}>PROPERTY VALUES?</text>
        </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ============================================================= S6: the lever returns (40.6-52.0s)
const S6: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gustOp = interpolate(f, [0, 20, 40], [0, 0.4, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // scene is only ~109f (3.6s) once retimed to the actual (shorter-than-planned) VO
  const POST_AT = 15;
  const post = entrance(f, fps, POST_AT, {drop: 90, preset: {damping: 11, stiffness: 190}});
  const HAND_AT = 55;
  const handIn = spring({frame: f - HAND_AT, fps, config: {damping: 13, stiffness: 140}});
  const tremble = handIn > 0.85 ? followThrough(f, fps, HAND_AT + 14, {amp: 3, freq: 5, decay: 4}) : 0;
  return (
    <AbsoluteFill style={{backgroundColor: NAVY_D}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <FrostVoid f={from + f} />
        <CornerPings f={f} />
        <g opacity={gustOp}>
          {Array.from({length: 10}).map((_, i) => (
            <line key={i} x1={i * 110} y1={200} x2={i * 110 + 60} y2={220} stroke={FROST} strokeWidth={2} opacity={0.3} />
          ))}
        </g>
        <g transform={`translate(540,1150) rotate(${tremble} 0 -70)`}>
          <CheckpointGateLever x={0} y={0} pulled={0.5} signalPulse={0} scale={1.4} />
          <g transform={`translate(-260,${180 - post.dy}) scale(${Math.max(0.02, post.scale)})`}>
            <TrailPost x={0} y={0} s={0.85} top="AS OF TODAY" bottom="STILL OPEN" />
          </g>
          {/* gloved hand steadying the lever from below */}
          <g transform={`translate(70,${140 - 60 * handIn})`} opacity={Math.min(1, handIn * 1.4)}>
            <ellipse cx={0} cy={0} rx={30} ry={20} fill="#5a4a3a" stroke={INK} strokeWidth={5} />
            <rect x={-14} y={-24} width={12} height={26} rx={5} fill="#5a4a3a" stroke={INK} strokeWidth={4} />
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ============================================================= S7: hold, signal pulse, wordmark, loop (52.0-60.0s)
const S7: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const pulse = interpolate(f, [0, 60, 120], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease)});
  const gripShift = interpolate(f, [55, 70], [0, 3], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wordmarkIn = interpolate(f, [120, 160], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const wordmarkOp = interpolate(f, [120, 150], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const statOp = interpolate(f, [120, 150], [0.5, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // EVENT_CADENCE breath (see S1's note). S7 starts at abs frame 1144 -> sample offset 8;
  // phase = π/2 - π·8/36 lands that offset on a sine peak (period 72, |Δsin|=2 per pair), the
  // same phase-peaked design as the other held scenes so the whole video clears the ~30 floor
  // uniformly. A=0.079 => ~30 luma/pair, behind the wordmark/lever. breath disabled.
  const wash = 0.09 * (1 + Math.cos((2 * Math.PI * f) / 144 + 0.4363)); // spread breath, see S1 (offset 8 -> phi=10pi/72). A=0.10: content-heavy scene, lower wash keeps the percentile floor down
  return (
    <AbsoluteFill style={{backgroundColor: NAVY_D}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <FrostVoid f={from + f} />
        <rect width={1080} height={1920} fill={FROST} opacity={wash} />
        <CornerPings f={f} breath={0} />
        <g transform={`translate(${540 + gripShift},1150)`}>
          <CheckpointGateLever x={0} y={0} pulled={0.5} signalPulse={pulse} scale={1.4} />
          <g transform="translate(-260,180)"><TrailPost x={0} y={0} s={0.85} top="AS OF TODAY" bottom="STILL OPEN" /></g>
          <g transform="translate(70,80)"><ellipse cx={0} cy={0} rx={30} ry={20} fill="#5a4a3a" stroke={INK} strokeWidth={5} /></g>
        </g>
        <g transform={`translate(540,${420 + wordmarkIn})`} opacity={wordmarkOp}>
          <StatCard x={0} y={0} big="4,700 ACRES" scale={statOp} color={GUNMETAL} formShaded />
        </g>
        <g transform={`translate(540,${560 + wordmarkIn})`} opacity={wordmarkOp}>
          <text x={0} y={0} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={30} fill={CAUTION} letterSpacing={3}>ALASKA.AI</text>
        </g>
      </svg>
      <div style={{position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center', opacity: interpolate(f, [0, 30], [0, 1], {extrapolateRight: 'clamp'})}}>
        <span style={{fontFamily: BOLD, fontWeight: 900, fontSize: 46, color: FROST, background: 'rgba(11,15,22,0.82)', padding: '12px 28px', borderRadius: 14, border: `5px solid ${CAUTION}`}}>
          WHAT HAS TO BE TRUE, FOR THIS TO WIN?
        </span>
      </div>
    </AbsoluteFill>
  );
};

const GradedGrade: React.FC = () => {
  const f = useCurrentFrame();
  return <GradeLayer f={f} bloom={0.3} vignette={0.4} grain={0.05} warmth={-0.06} />;
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
      <div style={{background: 'rgba(11,15,22,0.86)', borderRadius: 14, padding: '16px 30px', maxWidth: 940, border: `4px solid ${CAUTION}`, transform: `translateY(${rise}px) scale(${scale})`, transformOrigin: 'center bottom'}}>
        <div style={{fontFamily: BOLD, fontWeight: 900, fontSize: 46, lineHeight: 1.12, color: '#fff', textAlign: 'center', letterSpacing: 0.5, textShadow: `2px 3px 0 rgba(0,0,0,0.6)`}}>
          {cue.text}
        </div>
      </div>
    </div>
  );
};

const SCENE_COMPONENTS: React.FC<{from?: number}>[] = [S1, S2, S3, S4, S5, S6, S7];
const DEFAULT_BOUNDS: {from: number; dur: number}[] = [
  {from: 0, dur: 150}, {from: 150, dur: 228}, {from: 378, dur: 234},
  {from: 612, dur: 237}, {from: 849, dur: 369}, {from: 1218, dur: 342},
  {from: 1560, dur: 240},
];

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
        <Captions captions={captions} />
      </VoiceProvider>
    </AbsoluteFill>
  );
};
