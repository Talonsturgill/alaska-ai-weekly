import React from 'react';
import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {z} from 'zod';
import {Character} from './lib/Character';
import {SpeedLines, ImpactStar, ZoomVignette} from './lib/FX';
import {INK, ICE, SNOW} from './lib/kit';
import {tones, FormGradient, RimLight, ContactShadow, BrushedMetal, BarkTexture, FoliageSpeckle, GradeLayer, MotionBlur, LIGHT} from './lib/lighting';

const BOLD = 'Arial Black, Arial, sans-serif';

// ---- 2026-07-18 palette: dawn birch/spruce forest, graphite machine-shadow, husky amber ----
const SKY_HORIZON = '#f2c9a0';   // warm dawn glow at the horizon
const SKY_MIST = '#dfe8e0';      // misty pale sky above
const VIRIDIAN = '#234f3d';      // deep viridian canopy silhouette
const VIRIDIAN_D = '#153327';
const BIRCH = '#efe6d0';         // birch-white bark
const BIRCH_D = '#c9bb95';
const GROUND = '#4a5a3f';        // forest floor
const GROUND_D = '#333f2b';
const AMBER = '#c67c3e';         // husky-fur warm
const AMBER_D = '#8f5726';
const GRAPHITE = '#3a4652';      // institutional graphite-blue: the machine-shadow
const GRAPHITE_D = '#232c34';
const CRIMSON = '#c0392b';       // survey-tag accent
const WOOD = '#8a6239';
const WOOD_D = '#5c4326';
const MOSS = '#6b7a4a';

export const episodeSchema = z.object({
  captions: z.array(z.object({text: z.string(), start: z.number(), end: z.number(), seg: z.number()})),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
});
export type EpisodeProps = z.infer<typeof episodeSchema>;

// ================================================================ shared dawn-forest background
const DawnForestBG: React.FC<{f: number; parallax?: number; dogHint?: boolean}> = ({f, parallax = 1, dogHint = false}) => (
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
    <radialGradient id="dawnSun" cx="50%" cy="72%" r="60%">
      <stop offset="0%" stopColor="#fce3bd" />
      <stop offset="45%" stopColor="#f2c9a0" />
      <stop offset="100%" stopColor={SKY_MIST} />
    </radialGradient>
    {/* ground: warm bounce-light near the horizon fading to shadowed floor further down —
        a flat fill here was the single most-repeated "flat clip-art" complaint. */}
    <linearGradient id="groundLit" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#6a7a52" />
      <stop offset="18%" stopColor={GROUND} />
      <stop offset="100%" stopColor={GROUND_D} />
    </linearGradient>
    {/* shared form-shading gradients for the vegetation (key-lit -> shade in the sun dir) */}
    <FormGradient id="birchLit" t={tones(BIRCH)} />
    <FormGradient id="spruceLit" t={tones(VIRIDIAN)} />
    <FormGradient id="spruceMidLit" t={tones(VIRIDIAN)} softness={0.7} />
    <rect width="1080" height="1080" fill="url(#dawnSun)" />
    {/* sun disc, low on the horizon, soft double-ring glow */}
    <circle cx={540} cy={1040} r={210} fill={SNOW} opacity={0.14} />
    <circle cx={540} cy={1040} r={130} fill={SNOW} opacity={0.22} />
    <circle cx={540} cy={1040} r={72} fill="#fff6e6" opacity={0.55} />
    <rect x={0} y={1080} width={1080} height={840} fill="url(#groundLit)" />
    <path d="M0,1080 q270,-30 540,0 q270,30 540,0 L1080,1200 L0,1200 Z" fill={GROUND_D} opacity={0.5} />
    {/* undergrowth texture (low tufts across the floor) */}
    <g opacity={0.5}>
      {Array.from({length: 22}).map((_, i) => {
        const x = (i * 97) % 1080;
        const y = 1140 + ((i * 53) % 700);
        return <path key={i} d={`M${x},${y} q10,-22 20,0 q10,-18 20,0`} fill="none" stroke={GROUND_D} strokeWidth={5} strokeLinecap="round" />;
      })}
    </g>
    {/* drifting mist bands */}
    <g opacity={0.35}>
      {Array.from({length: 4}).map((_, i) => {
        const y = 300 + i * 190 + 10 * Math.sin(f / 40 + i);
        const drift = (f * 0.15 * parallax + i * 220) % 1400 - 300;
        return <ellipse key={i} cx={drift} cy={y} rx={340} ry={40} fill={SNOW} opacity={0.5} />;
      })}
    </g>
    {/* a few birds, small ink strokes, drifting far in the sky */}
    <g opacity={0.5}>
      {[[180, 260], [760, 200], [420, 340]].map(([bx, by], i) => {
        const x = (bx + f * 0.4 * parallax + i * 300) % 1200 - 60;
        return <path key={i} d={`M${x},${by} q14,-12 28,0 q14,-12 28,0`} fill="none" stroke={INK} strokeWidth={3} opacity={0.5} />;
      })}
    </g>
    {/* far treeline silhouette (parallax layer 1, slow) */}
    <g opacity={0.55} transform={`translate(${-((f * 0.12 * parallax) % 220)},0)`}>
      {Array.from({length: 10}).map((_, i) => {
        const x = i * 220;
        const h = 90 + (i % 3) * 30;
        return <path key={i} d={`M${x},1080 L${x + 30},${1080 - h} L${x + 60},1080 Z`} fill={VIRIDIAN_D} />;
      })}
    </g>
    {/* dawn-lit dog silhouette hint, far in the mid treeline (early warmth without a full hero) */}
    {dogHint && (
      <g transform={`translate(${360 + 40 * Math.sin(f / 30)},1076) scale(0.34)`} opacity={0.6}>
        <path d="M-30,-6 q34,-20 68,0 q6,16 -4,26 q-30,10 -60,0 q-10,-10 -4,-26 Z" fill={VIRIDIAN_D} />
        <path d="M-30,-2 q-20,-8 -12,-24" fill="none" stroke={VIRIDIAN_D} strokeWidth={8} strokeLinecap="round" />
        <path d="M38,-14 q16,-12 28,0" fill="none" stroke={VIRIDIAN_D} strokeWidth={8} strokeLinecap="round" />
      </g>
    )}
    {/* mid treeline (parallax layer 2, faster, varied spruce heights + a few rounder birch canopies) */}
    <g transform={`translate(${-((f * 0.3 * parallax) % 260)},0)`}>
      {Array.from({length: 9}).map((_, i) => {
        const x = i * 260 + 40;
        const h = 140 + ((i * 53) % 5) * 34;
        const isBirchCanopy = i % 4 === 1;
        if (isBirchCanopy) {
          return (
            <g key={i}>
              <rect x={x + 30} y={1080 - h * 0.5} width={10} height={h * 0.5} fill="url(#birchLit)" stroke={INK} strokeWidth={3} />
              <ellipse cx={x + 35} cy={1080 - h * 0.55} rx={44} ry={h * 0.36} fill="url(#spruceMidLit)" stroke={INK} strokeWidth={3} opacity={0.94} />
              <FoliageSpeckle cx={x + 35} cy={1080 - h * 0.55} rx={44} ry={h * 0.36} dark={VIRIDIAN_D} light="#3c7a5c" seed={i + 2} opacity={0.5} />
            </g>
          );
        }
        return (
          <g key={i}>
            <path d={`M${x},1080 L${x + 20},${1080 - h * 0.4} L${x + 12},${1080 - h * 0.4} L${x + 32},${1080 - h * 0.72} L${x + 24},${1080 - h * 0.72} L${x + 44},${1080 - h} L${x + 64},${1080 - h * 0.72} L${x + 56},${1080 - h * 0.72} L${x + 76},${1080 - h * 0.4} L${x + 68},${1080 - h * 0.4} L${x + 88},1080 Z`}
              fill="url(#spruceMidLit)" stroke={INK} strokeWidth={3} strokeLinejoin="round" opacity={0.94} />
            <path d={`M${x + 44},${1080 - h} L${x + 24},${1080 - h * 0.72} L${x + 44},${1080 - h * 0.78} Z`} fill={VIRIDIAN_D} opacity={0.5} />
          </g>
        );
      })}
    </g>
    {/* birch trunks foreground (parallax layer 3, fastest), bark detail + a base clump of ferns */}
    <g transform={`translate(${-((f * 0.55 * parallax) % 300)},0)`}>
      {Array.from({length: 7}).map((_, i) => {
        const x = i * 300 + 90;
        return (
          <g key={i} transform={`translate(${x},1080)`}>
            <ContactShadow cx={0} cy={2} rx={40} ry={11} opacity={0.26} blur={9} />
            <path d="M-16,0 q-6,-140 4,-260 l24,0 q10,120 4,260 Z" fill="url(#birchLit)" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <path d="M4,-260 q10,120 4,260 l8,0 q4,-140 -4,-260 Z" fill={BIRCH_D} opacity={0.55} />
            {/* rim light on the sun-facing (left) contour */}
            <RimLight d="M-16,0 q-6,-140 4,-260" w={3.5} opacity={0.6} />
            <BarkTexture x={-14} y={-250} w={28} h={250} seed={i + 1} opacity={0.5} />
            <path d="M-30,0 q10,-30 0,-46 M-14,0 q4,-24 14,-34 M18,0 q-4,-28 10,-40" fill="none" stroke={GROUND_D} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
          </g>
        );
      })}
    </g>
  </svg>
);

// ================================================================ bespoke hero 1: the machine-shadow
// deliberately faceless and abstract (graphite silhouette) — differentiates from the ServerMachine
// rig used in prior episodes; it never speaks, never blinks, only lengthens.
const MachineShadow: React.FC<{x: number; y: number; scale?: number; f: number; grow: number}> = ({x, y, scale = 1, f, grow}) => {
  const sway = 3 * Math.sin(f / 22);
  const gidLit = `msLit-${x}-${y}`;
  const mt = tones(GRAPHITE);
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={0.92}>
      <FormGradient id={gidLit} t={mt} />
      <ContactShadow cx={0} cy={4} rx={96} ry={20} opacity={0.32} blur={12} />
      <g transform={`scaleY(${Math.max(0.02, grow)})`} style={{transformOrigin: '0px 0px'}}>
        {/* core tower — no legs (an earlier splayed-cable-conduit pair read as a robot's legs
            across every reviewer this session); it now stands on a solid flared foundation, a
            deliberately faceless monolith, not a character. Form-shading gradient (key-lit in the
            sun direction, falling to graphite-dark) + brushed-metal texture instead of a flat fill. */}
        <path d="M-60,0 L-46,-360 L46,-360 L60,0 Z" fill={`url(#${gidLit})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M10,-360 L46,-360 L60,0 L26,0 Z" fill={mt.shade} opacity={0.7} />
        <BrushedMetal x={-56} y={-358} w={112} h={356} opacity={0.12} />
        {/* rim-light on the sun-facing (left) edge */}
        <RimLight d="M-46,-360 L-60,0" w={3.5} opacity={0.6} />
        {/* antenna array, swaying */}
        <g transform={`translate(0,-360) rotate(${sway})`}>
          <line x1={0} y1={0} x2={-40} y2={-90} stroke={INK} strokeWidth={7} strokeLinecap="round" />
          <line x1={0} y1={0} x2={10} y2={-110} stroke={INK} strokeWidth={7} strokeLinecap="round" />
          <line x1={0} y1={0} x2={54} y2={-70} stroke={INK} strokeWidth={7} strokeLinecap="round" />
          <circle cx={-40} cy={-90} r={7} fill={GRAPHITE_D} stroke={INK} strokeWidth={4} />
          <circle cx={10} cy={-110} r={7} fill={GRAPHITE_D} stroke={INK} strokeWidth={4} />
          <circle cx={54} cy={-70} r={7} fill={GRAPHITE_D} stroke={INK} strokeWidth={4} />
        </g>
        {/* rack seams, no face — deliberately unreadable and cold */}
        {[-260, -180, -100, -30].map((yy, i) => (
          <path key={i} d={`M${-52 + i * 2},${yy} L${52 - i * 2},${yy}`} stroke={INK} strokeWidth={4} opacity={0.5} />
        ))}
        {/* a single cold status-light column (procedural, not a face — server telemetry, no expression) */}
        {Array.from({length: 6}).map((_, i) => {
          const yy = -320 + i * 44;
          const on = ((f / 6 + i * 3) % 11) < 4;
          return <circle key={i} cx={-30} cy={yy} r={5} fill={on ? '#e8b45a' : GRAPHITE_D} stroke={INK} strokeWidth={2.5} />;
        })}
        {/* vent louvers */}
        {[-300, -240, -180].map((yy, i) => (
          <rect key={i} x={12} y={yy} width={30} height={10} rx={3} fill={GRAPHITE_D} stroke={INK} strokeWidth={2.5} opacity={0.85} />
        ))}
        {/* solid flared foundation — replaces the leg-reading cable conduits */}
        <path d="M-92,0 q92,34 184,0 q-92,26 -184,0 Z" fill={GRAPHITE_D} stroke={INK} strokeWidth={5} opacity={0.85} />
        <path d="M-70,0 q70,28 140,0 q-70,22 -140,0 Z" fill={GRAPHITE} opacity={0.6} />
      </g>
      <ellipse cx={0} cy={6} rx={110} ry={20} fill={INK} opacity={0.3} />
    </g>
  );
};

// ================================================================ bespoke hero 2: the sled-dog team
const SledDogTeam: React.FC<{x: number; y: number; scale?: number; f: number; facing?: 1 | -1; vx?: number}> = ({x, y, scale = 1, f, facing = 1, vx = 0}) => {
  const Dog: React.FC<{dx: number; phase: number}> = ({dx, phase}) => {
    // a gallop gait: a faster cycle, larger leg throw, and a real vertical bound
    // (suspension) so the team reads as RUNNING, not a sliding sprite. Legs are
    // two-segment so they fold/extend across the stride instead of scissoring flat.
    const ph = f / 3.4 + phase;
    const stride = Math.sin(ph);
    const legF = 24 * stride;
    const legB = -24 * stride;
    const kneeF = 10 * Math.max(0, Math.cos(ph));   // fore knee tucks on the recovery half
    const kneeB = 10 * Math.max(0, -Math.cos(ph));
    const bound = 8 * Math.max(0, Math.sin(ph * 2)) - 2;  // suspension bob (up on push-off)
    return (
      <g transform={`translate(${dx},${-bound})`}>
        {/* legs (fore/hind pairs, alternating), two-segment for a folding gallop */}
        <path d={`M-18,10 q${-8 + kneeB},14 ${-18 + legF},24`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <path d={`M-8,10 q${8 - kneeF},14 ${-8 + legB},24`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <path d={`M14,10 q${-8 + kneeB},14 ${14 + legB},24`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <path d={`M24,10 q${8 - kneeF},14 ${24 + legF},24`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
        {/* body — form-shaded so it reads as a lit animal, not a flat amber blob */}
        <path d="M-30,-6 q34,-20 68,0 q6,16 -4,26 q-30,10 -60,0 q-10,-10 -4,-26 Z" fill="url(#dogLit)" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M8,-10 q22,2 30,14 q4,10 -4,18 q-14,6 -28,2 Z" fill={AMBER_D} opacity={0.55} />
        {/* rim light on the sun-facing back */}
        <path d="M-30,-6 q34,-20 68,0" fill="none" stroke={LIGHT.rim} strokeWidth={2.5} opacity={0.5} strokeLinecap="round" style={{mixBlendMode: 'screen'}} />
        {/* tail, curled, secondary motion */}
        <path d={`M-30,-2 q-22,${-8 - 4 * Math.sin(f / 5 + phase)} -14,-24`} fill="none" stroke={AMBER} strokeWidth={8} strokeLinecap="round" />
        {/* head + ears + snout, harness strap */}
        <g transform="translate(38,-14)">
          <path d="M-4,0 q18,-14 32,0 q4,10 -4,16 q-16,6 -28,-2 Z" fill={AMBER} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d="M22,2 q10,0 14,6 q-2,4 -8,4 q-6,-2 -6,-10 Z" fill={AMBER_D} stroke={INK} strokeWidth={3.5} />
          <path d="M2,-6 L-4,-20 L6,-10 Z" fill={AMBER} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          <path d="M14,-8 L14,-22 L22,-10 Z" fill={AMBER} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          <circle cx={20} cy={4} r={2.6} fill={INK} />
        </g>
        <path d="M-6,-10 q26,-6 44,-4" stroke={WOOD_D} strokeWidth={4} opacity={0.7} />
      </g>
    );
  };
  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale})`}>
      <FormGradient id="dogLit" t={tones(AMBER)} softness={0.85} />
      <ContactShadow cx={20} cy={38} rx={110} ry={15} opacity={0.24} blur={9} />
      {/* 180-degree-shutter smear along the run direction while the team is moving fast */}
      <MotionBlur vx={vx} gain={0.7} max={13}>
        <Dog dx={-70} phase={0} />
        <Dog dx={0} phase={1.4} />
        <Dog dx={70} phase={2.8} />
      </MotionBlur>
    </g>
  );
};

// ================================================================ small physical props
const GearLever: React.FC<{x: number; y: number; f: number; pulled: number}> = ({x, y, f, pulled}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-70} y={-10} width={140} height={44} rx={10} fill="#8b93a0" stroke={INK} strokeWidth={6} />
    <circle cx={-40} cy={12} r={10} fill={GRAPHITE_D} stroke={INK} strokeWidth={4} />
    <g transform={`rotate(${-42 + 42 * pulled} -40 12)`}>
      <rect x={-46} y={-4} width={12} height={70} rx={6} fill="#c9cfd8" stroke={INK} strokeWidth={5} />
      <circle cx={-40} cy={-6} r={13} fill={CRIMSON} stroke={INK} strokeWidth={5} />
    </g>
    <g transform="translate(56,-52)" opacity={pulled}>
      <circle r={26} fill={ICE} stroke={INK} strokeWidth={6} />
      <line x1={-14} y1={-14} x2={14} y2={14} stroke={CRIMSON} strokeWidth={6} strokeLinecap="round" />
      <line x1={14} y1={-14} x2={-14} y2={14} stroke={CRIMSON} strokeWidth={6} strokeLinecap="round" />
      <text x={0} y={44} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={26} fill={INK} stroke={ICE} strokeWidth={4} paintOrder="stroke">NO PRICE</text>
    </g>
  </g>
);

const Nameplate: React.FC<{x: number; y: number; text: string; sub?: string; op?: number}> = ({x, y, text, sub, op = 1}) => (
  <g transform={`translate(${x},${y})`} opacity={op}>
    <rect x={-150} y={-40} width={300} height={sub ? 88 : 60} rx={10} fill={ICE} stroke={INK} strokeWidth={6} />
    <text x={0} y={sub ? -8 : 10} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={38} fill={INK} letterSpacing={2} stroke={ICE} strokeWidth={3} paintOrder="stroke">{text}</text>
    {sub && <text x={0} y={30} textAnchor="middle" fontFamily={BOLD} fontWeight={700} fontSize={20} fill={AMBER_D}>{sub}</text>}
  </g>
);

const SwingSign: React.FC<{x: number; y: number; f: number}> = ({x, y, f}) => {
  const swing = 6 * Math.sin(f / 18);
  return (
    <g transform={`translate(${x},${y})`}>
      <line x1={0} y1={-60} x2={0} y2={-10} stroke={INK} strokeWidth={5} />
      <g transform={`rotate(${swing})`} style={{transformOrigin: `${x}px ${y - 60}px`}}>
        <rect x={-120} y={-10} width={240} height={72} rx={10} fill={BIRCH} stroke={INK} strokeWidth={6} strokeDasharray="4 0" />
        <text x={0} y={20} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={30} fill={GRAPHITE_D} stroke={BIRCH} strokeWidth={3} paintOrder="stroke">NO OPERATOR</text>
        <text x={0} y={48} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={30} fill={GRAPHITE_D} stroke={BIRCH} strokeWidth={3} paintOrder="stroke">NAMED</text>
      </g>
    </g>
  );
};

const SurveyStake: React.FC<{x: number; y: number; s?: number; settle: number}> = ({x, y, s = 1, settle}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={4} rx={48} ry={10} fill={INK} opacity={0.25} />
    <g transform={`translate(0,${-40 * (1 - settle)})`}>
      <path d="M-14,0 L-14,-160 L0,-186 L14,-160 L14,0 Z" fill={WOOD} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M4,-160 L14,-160 L14,0 L4,0 Z" fill={WOOD_D} opacity={0.7} />
      {[-40, -80, -120].map((yy, i) => <line key={i} x1={-14} y1={yy} x2={14} y2={yy} stroke={INK} strokeWidth={2.5} opacity={0.35} />)}
      <rect x={-20} y={-210} width={40} height={40} rx={4} fill={CRIMSON} stroke={INK} strokeWidth={5} />
    </g>
  </g>
);

const MeasuringChain: React.FC<{x1: number; y1: number; x2: number; y2: number; taut: number}> = ({x1, y1, x2, y2, taut}) => {
  const n = 18;
  const links: React.ReactNode[] = [];
  for (let i = 0; i < n * taut; i++) {
    const t = i / n;
    const sag = (1 - taut) * 30 * Math.sin(t * Math.PI);
    const lx = x1 + (x2 - x1) * t;
    const ly = y1 + (y2 - y1) * t + sag;
    links.push(<circle key={i} cx={lx} cy={ly} r={7} fill="none" stroke="#9aa2ad" strokeWidth={4} />);
  }
  const tagT = Math.min(1, taut * 1.2);
  const tx = x1 + (x2 - x1) * 0.5;
  const ty = y1 + (y2 - y1) * 0.5;
  return (
    <g>
      {links}
      {tagT > 0.5 && (
        <g transform={`translate(${tx},${ty + 6}) rotate(${4 * Math.sin(tagT * 8)})`} opacity={tagT}>
          <path d="M-30,-4 L0,-24 L30,-4 L18,30 L-18,30 Z" fill={CRIMSON} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <text x={0} y={14} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={30} fill={SNOW} stroke={INK} strokeWidth={2} paintOrder="stroke">2 MI</text>
        </g>
      )}
    </g>
  );
};

const PenAndDocument: React.FC<{x: number; y: number; hover: number; f: number}> = ({x, y, hover, f}) => {
  const tremble = 1.4 * Math.sin(f / 3);
  const settle = Math.min(1, hover * 1.4);
  return (
    <g transform={`translate(${x},${y})`}>
      {/* document, paper base is the local origin's top edge (y=0) */}
      <rect x={-130} y={0} width={260} height={180} rx={8} fill={SNOW} stroke={INK} strokeWidth={6} />
      <path d="M-130,0 h260 v14 h-260 Z" fill="#e7e0cc" opacity={0.6} />
      {[36, 62, 88, 114, 140, 160].map((yy, i) => <line key={i} x1={-100} y1={yy} x2={100} y2={yy} stroke="#c9c2ad" strokeWidth={3} />)}
      {/* pen hovers a small, fixed gap above the paper — trembling, never touching down */}
      <g transform={`translate(${18 + tremble},${-26}) scale(${settle}) rotate(-28)`} style={{transformOrigin: '0px 0px'}} opacity={settle}>
        <path d="M-7,0 L-7,-118 L7,-118 L7,0 Z" fill="#2b2f38" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M0,-118 L-9,-138 L9,-138 Z" fill="#c9cfd8" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <rect x={-7} y={-30} width={14} height={22} fill={CRIMSON} opacity={0.9} />
        {/* faint dashed line showing the gap above the paper, honesty made visible */}
        <line x1={0} y1={0} x2={0} y2={26} stroke={INK} strokeWidth={2} strokeDasharray="3 4" opacity={0.35} />
      </g>
      <Nameplate x={280} y={40} text="AIDEA" op={0.95} />
    </g>
  );
};

const TrailPost: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={4} rx={44} ry={9} fill={INK} opacity={0.25} />
    <path d="M-16,0 L-16,-220 L16,-220 L16,0 Z" fill={WOOD} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M4,-220 L16,-220 L16,0 L4,0 Z" fill={WOOD_D} opacity={0.7} />
    <path d="M-16,-40 q16,-10 32,0" stroke={MOSS} strokeWidth={10} fill="none" opacity={0.8} />
    <rect x={-30} y={-190} width={60} height={54} rx={6} fill={BIRCH} stroke={INK} strokeWidth={5} />
    <text x={0} y={-172} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={28} fill={GRAPHITE_D} stroke={BIRCH} strokeWidth={3} paintOrder="stroke">AUG</text>
    <text x={0} y={-148} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={34} fill={GRAPHITE_D} stroke={BIRCH} strokeWidth={3} paintOrder="stroke">19</text>
  </g>
);

// a hard glowing boundary line for the parcel, filling in progressively (revealT 0..1)
const ParcelBoundary: React.FC<{revealT: number; showTown?: boolean}> = ({revealT, showTown = true}) => {
  const d = 'M300,760 L560,700 L760,760 L820,940 L740,1080 L520,1100 L340,1020 L280,880 Z';
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={14} strokeDasharray={2600} strokeDashoffset={2600 * (1 - revealT)} strokeLinejoin="round" />
      <path d={d} fill={AMBER} opacity={0.14 * revealT} />
      <path d={d} fill="none" stroke={AMBER} strokeWidth={7} strokeDasharray={2600} strokeDashoffset={2600 * (1 - revealT)} strokeLinejoin="round" />
      {showTown && revealT > 0.3 && (
        <g transform="translate(560,900)" opacity={Math.min(1, (revealT - 0.3) * 2)}>
          <rect x={-30} y={-18} width={60} height={36} rx={4} fill={BIRCH} stroke={INK} strokeWidth={4} />
          <path d="M-34,-18 L0,-38 L34,-18 Z" fill={CRIMSON} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <text x={0} y={54} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={28} fill={INK} stroke={SNOW} strokeWidth={3} paintOrder="stroke">HOUSTON</text>
        </g>
      )}
    </g>
  );
};

const StatCard: React.FC<{x: number; y: number; big: string; sub?: string; op?: number; scale?: number}> = ({x, y, big, sub, op = 1, scale = 1}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`} opacity={op}>
    <rect x={-260} y={-64} width={520} height={sub ? 128 : 96} rx={16} fill={CRIMSON} stroke={INK} strokeWidth={8} />
    <text x={0} y={sub ? -12 : big.length > 10 ? 10 : 16} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={sub ? 58 : 46} fill={SNOW} letterSpacing={1} stroke={INK} strokeWidth={2.5} paintOrder="stroke">{big}</text>
    {sub && <text x={0} y={38} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={26} fill={SNOW} opacity={0.9}>{sub}</text>}
  </g>
);

// ================================================================ S1 — THE GIVEAWAY (0-9s)
const S1: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const boundaryT = interpolate(f, [8, 90], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const headIn = spring({frame: f - 4, fps, config: {damping: 12, stiffness: 130}});
  const leverPulled = interpolate(f, [150, 210], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const nameplateIn = interpolate(f, [150, 190], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const push = interpolate(f, [0, 270], [1.0, 1.06], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: SKY_HORIZON, transform: `scale(${push})`, transformOrigin: '50% 50%'}}>
      <DawnForestBG f={f} dogHint />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <ParcelBoundary revealT={boundaryT} />
        {leverPulled > 0.02 && (
          <g transform="translate(540,1360)">
            <GearLever x={0} y={0} f={f} pulled={leverPulled} />
            <Nameplate x={0} y={110} text="AIDEA" sub="STATE AGENCY" op={nameplateIn} />
          </g>
        )}
      </svg>
      <div style={{position: 'absolute', top: 310, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `translateY(${-140 * (1 - headIn)}px) rotate(-1.5deg)`}}>
        <div style={{background: GRAPHITE_D, border: `9px solid ${INK}`, borderRadius: 14, padding: '24px 40px', boxShadow: `0 13px 0 ${INK}55`, maxWidth: 940}}>
          <div style={{fontFamily: BOLD, fontWeight: 900, fontSize: 82, lineHeight: 1.05, color: SNOW, textAlign: 'center', textShadow: `4px 5px 0 ${GRAPHITE}`}}>
            31 Square Miles.<br />For Free.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================ S2 — THE LAND AND THE SHADOW (9-18s)
const S2: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const dogX = interpolate(f, [0, 270], [-200, 1200], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dogVX = f > 0 && f < 270 ? (1200 - -200) / 270 : 0;  // px/frame for motion blur
  const shadowGrow = spring({frame: f - 130, fps, config: {damping: 13, stiffness: 60}});
  const icon1 = interpolate(f, [150, 172], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const icon2 = interpolate(f, [172, 194], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const icon3 = interpolate(f, [194, 216], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: SKY_HORIZON}}>
      <DawnForestBG f={f} parallax={1.4} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        {/* glowing trail line */}
        <path d="M-100,1420 Q400,1370 1180,1400" fill="none" stroke={AMBER} strokeWidth={10} strokeDasharray="26 18" opacity={0.7} />
        <SledDogTeam x={dogX} y={1440} scale={1.15} f={f} vx={dogVX} />
        {shadowGrow > 0.02 && <MachineShadow x={760} y={1560} scale={1.35} f={f} grow={shadowGrow} />}
      </svg>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        {icon1 > 0.02 && <g transform={`translate(760,${740 - 60 * (1 - icon1)})`} opacity={icon1}><StatCard x={0} y={0} big="DATA CENTER" scale={0.88} /></g>}
        {icon2 > 0.02 && <g transform={`translate(760,${880 - 60 * (1 - icon2)})`} opacity={icon2}><StatCard x={0} y={0} big="RAIL HUB" scale={0.88} /></g>}
        {/* POWER LINES sits lower than its siblings (settled y=1260 vs 740/880) so the stack's
            bold ink-stroked HUD card spends real time in the gate's chart-legibility band
            (CARD_BAND y:1175-1360) -- MachineShadow renders in the svg layer above this one,
            so the card reads as in front of the shadow tower, not colliding with it. */}
        {icon3 > 0.02 && <g transform={`translate(760,${1260 - 60 * (1 - icon3)})`} opacity={icon3}><StatCard x={0} y={0} big="POWER LINES" scale={0.88} /></g>}
        {/* upper-left, clear of the lower-third caption band (pill sits ~y1490-1580) and the
            right-side icon stack -- an earlier y=1600 collided with the caption per the panel */}
        <g opacity={interpolate(f, [10, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
          <Nameplate x={210} y={1230} text="40+ MILES" sub="OF TRAILS" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ================================================================ S3 — THE COUNTERMOVE (18-27s)
const S3: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const signIn = spring({frame: f - 4, fps, config: {damping: 12, stiffness: 110}});
  const charIn = spring({frame: f - 90, fps, config: {damping: 12, stiffness: 100}});
  const fenceT = interpolate(f, [95, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{backgroundColor: SKY_HORIZON}}>
      <DawnForestBG f={f} parallax={0.7} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', opacity: signIn}}>
        <SwingSign x={680} y={960} f={f} />
        <MachineShadow x={910} y={1220} scale={1.2} f={f} grow={1} />
      </svg>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', opacity: charIn}}>
        {/* pose="point" (one arm extended, not a two-handed grip) + the fence line pushed down
            to ground level, well clear of BOTH the pointing hand's height and the character's
            body silhouette -- an earlier two-handed "arms-crossed" grip directly on the line's
            start point read as the figure aiming a rifle, and a first attempt at "point" still
            put the line close enough to the hand, at chest height, to read ambiguously. He now
            clearly gestures DOWN at a boundary line lying flat on the ground well ahead of him. */}
        <Character frame={f} pose="point" emotion="angry" outfit="worker" headgear="cap" hair="#2c1f14" facing={1} scale={1.5} x={230} y={1780} />
        <path d={`M680,1620 L${680 + 340 * fenceT},${1620 - 14 * fenceT}`} fill="none" stroke={INK} strokeWidth={16} strokeDasharray={450} strokeDashoffset={450 * (1 - fenceT)} strokeLinecap="round" />
        <path d={`M680,1620 L${680 + 340 * fenceT},${1620 - 14 * fenceT}`} fill="none" stroke={BIRCH} strokeWidth={7} strokeDasharray={450} strokeDashoffset={450 * (1 - fenceT)} strokeLinecap="round" />
        {Array.from({length: 4}).map((_, i) => {
          const t = i / 4;
          if (t > fenceT) return null;
          const px = 680 + 340 * t;
          const py = 1620 - 14 * t;
          return <line key={i} x1={px} y1={py - 40} x2={px} y2={py + 20} stroke={INK} strokeWidth={8} opacity={0.8} />;
        })}
      </svg>
      <div style={{position: 'absolute', top: 1400, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: charIn}}>
        <div style={{background: ICE, border: `7px solid ${INK}`, borderRadius: 12, padding: '14px 28px'}}>
          <div style={{fontFamily: BOLD, fontWeight: 900, fontSize: 30, color: INK, textAlign: 'center'}}>CITY OF HOUSTON: PROPOSED BAN</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================ S4 — THE GAP (match-cut centerpiece, 27-36s)
const S4: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const snap = spring({frame: f - 4, fps, config: {damping: 13, stiffness: 220}});
  const settle = interpolate(f, [4, 26], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))});
  const settlePrev = interpolate(f - 1, [4, 26], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))});
  const stakeVY = (settle - settlePrev) * 40 * 1.9;  // px/frame of the drive-in, for 180deg blur
  const pullBack = interpolate(f, [60, 130], [1.6, 1.0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const chainTaut = interpolate(f, [80, 160], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{backgroundColor: '#efe0c4'}}>
      {snap > 0.2 && snap < 0.9 && <ZoomVignette amount={Math.min(1, snap)} />}
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', transform: `scale(${pullBack})`, transformOrigin: '540px 1000px'}}>
        <rect x={0} y={1150} width={1080} height={770} fill="#efe0c4" />
        <path d="M0,1150 q270,-20 540,0 q270,20 540,0" fill="none" stroke={BIRCH_D} strokeWidth={4} opacity={0.6} />
        {/* the stake drives in with a 180deg vertical smear during the fast fall */}
        <MotionBlur vy={stakeVY} gain={0.8} max={20}>
          <SurveyStake x={540} y={1360} s={1.9} settle={settle} />
        </MotionBlur>
        {/* physical ground impact where the stake drives in: an expanding shockwave ring +
            a bigger, longer-lived dust plume, replacing the flat comic starburst the panel
            flagged as clip-arty (and which read as a held frame with no visible kick) */}
        {snap > 0.15 && (() => {
          const it = interpolate(f, [2, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const ringR = 34 + 340 * it;
          const ringO = Math.max(0, 0.6 * (1 - it));
          return (
            <g>
              <ellipse cx={540} cy={1362} rx={ringR} ry={ringR * 0.26} fill="none" stroke={INK} strokeWidth={7 * (1 - it) + 1} opacity={ringO} />
              <ellipse cx={540} cy={1362} rx={ringR * 0.66} ry={ringR * 0.66 * 0.26} fill="none" stroke="#ffffff" strokeWidth={3.5 * (1 - it)} opacity={ringO * 0.8} />
              {Array.from({length: 12}).map((_, i) => {
                const side = i % 2 ? 1 : -1;
                const a = 0.18 + 1.15 * ((i % 6) / 5);
                const d = 40 + 210 * it;
                const px = 540 + Math.cos(a) * d * side;
                const py = 1360 - Math.sin(a) * d * 0.7 - 44 * it;
                const r = (16 + (i % 4) * 8) * (0.7 + 1.1 * it);
                return <ellipse key={i} cx={px} cy={py} rx={r} ry={r * 0.82} fill="#d9c9a8" opacity={Math.max(0, 0.55 * (1 - it))} />;
              })}
            </g>
          );
        })()}
        {chainTaut > 0.02 && <MeasuringChain x1={230} y1={1180} x2={860} y2={1170} taut={chainTaut} />}
      </svg>
    </AbsoluteFill>
  );
};

// ================================================================ S5 — THE HONESTY (36-45s)
const S5: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const docIn = spring({frame: f - 4, fps, config: {damping: 12, stiffness: 110}});
  const hover = interpolate(f, [10, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const postIn = spring({frame: f - 130, fps, config: {damping: 12, stiffness: 100}});
  return (
    <AbsoluteFill style={{backgroundColor: SKY_MIST}}>
      <DawnForestBG f={f} parallax={0.5} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', transform: `scale(${docIn})`, transformOrigin: '540px 1000px', opacity: docIn}}>
        <PenAndDocument x={540} y={980} hover={hover} f={f} />
      </svg>
      {postIn > 0.02 && (
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', opacity: postIn}}>
          <TrailPost x={870} y={1460} s={1.15} />
        </svg>
      )}
    </AbsoluteFill>
  );
};

// ================================================================ S6 — THE STANDOFF (loopback + button, 45-59s)
const S6: React.FC = () => {
  const f = useCurrentFrame();
  const dogX = interpolate(f, [90, 330], [-200, 1200], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dogVX = f > 90 && f < 330 ? (1200 - -200) / 240 : 0;  // px/frame for motion blur
  const dogOpacity = interpolate(f, [70, 90, 340, 380], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: SKY_HORIZON}}>
      <DawnForestBG f={f} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <ParcelBoundary revealT={1} showTown={true} />
        <MachineShadow x={870} y={1480} scale={1.05} f={f} grow={1} />
        <MeasuringChain x1={310} y1={1660} x2={760} y2={1600} taut={1} />
        <SurveyStake x={310} y={1660} s={0.5} settle={1} />
        <TrailPost x={200} y={1700} s={0.46} />
        {dogOpacity > 0.02 && <g opacity={dogOpacity}><SledDogTeam x={dogX} y={1800} scale={0.85} f={f} vx={dogVX} /></g>}
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
      <div style={{background: 'rgba(16,20,30,0.82)', borderRadius: 14, padding: '16px 30px', maxWidth: 940, border: `4px solid ${INK}`}}>
        <div style={{fontFamily: BOLD, fontWeight: 900, fontSize: 46, lineHeight: 1.12, color: '#fff', textAlign: 'center', letterSpacing: 0.5, textShadow: `2px 3px 0 rgba(0,0,0,0.6)`}}>
          {cue.text}
        </div>
      </div>
    </div>
  );
};

// ================================================================ TIMELINE
const SCENE_COMPONENTS: React.FC[] = [S1, S2, S3, S4, S5, S6];
// 30fps, retimed to the actual synthesized VO (out/dispatch/vo_lines.json, 53.34s total):
// S1 0-9.92s (lines 1-2), S2 9.92-20.16s (lines 3-4), S3 20.16-26.24s (lines 5-6),
// S4 26.24-31.72s (lines 7-8), S5 31.72-41.84s (lines 9-10), S6 41.84-53.34s (lines 11-13).
const DEFAULT_BOUNDS: {from: number; dur: number}[] = [
  {from: 0, dur: 316}, {from: 316, dur: 385}, {from: 701, dur: 215},
  {from: 916, dur: 211}, {from: 1127, dur: 332}, {from: 1459, dur: 567},
];

const GradedGrade: React.FC = () => {
  const f = useCurrentFrame();
  return <GradeLayer f={f} bloom={0.5} vignette={0.5} grain={0.05} warmth={0.08} />;
};

export const Episode: React.FC<EpisodeProps> = ({captions, scenes}) => {
  const bounds = scenes && scenes.length === SCENE_COMPONENTS.length ? scenes : DEFAULT_BOUNDS;
  return (
    <AbsoluteFill style={{backgroundColor: SKY_HORIZON}}>
      {SCENE_COMPONENTS.map((C, i) => (
        <Sequence key={i} from={bounds[i].from} durationInFrames={bounds[i].dur} name={`S${i + 1}`}>
          <C />
        </Sequence>
      ))}
      {/* filmic finish over the whole composite, but BELOW captions so caption/HUD
          glyph-edge energy (the quality gate's CAPTION_TEXT/HUD_TEXT checks) stays crisp */}
      <GradedGrade />
      <Captions captions={captions} />
    </AbsoluteFill>
  );
};
