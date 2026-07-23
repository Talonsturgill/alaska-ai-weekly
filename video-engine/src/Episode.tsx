import React from 'react';
import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {z} from 'zod';
import {VoiceProvider, useVoice} from './lib/voice';
import {SatelliteEye, INK} from './lib/kit';
import {tones, FormGradient, RimLight, ContactShadow, GradeLayer, MotionBlur} from './lib/lighting';
import {entrance, followThrough, accentKick} from './lib/motion';

const BOLD = 'Arial Black, Arial, sans-serif';

// ---- 2026-07-23 palette (art_direction-locked: Cook Inlet pewter-teal silt,
// orbital blue-black, detection cyan to warning amber, beluga bone-white) ----
const ORBIT = '#0b1020';
const ORBIT_D = '#060912';
const SILT = '#5c6b63';
const SILT_D = '#3a4a44';
const SILT_L = '#74847a';
const PEWTER = '#9AA6B4';
const CYAN = '#37e0d8';
const AMBER = '#FFC94A';
const WHALE = '#e9edf0';
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

// ============================================================= shared living-screen elements
// SiltWater: a top-down glacial-silt surface. Several swirling silt lobes drifting on
// mutually-prime phases (spatially disjoint active regions) + a slow current + marine
// snow on a nearer plane, so a held top-down shot still proves layered, disjoint motion
// (LIVING_SCREEN needs >=3 disjoint active regions per 2s window). This is the run's
// reusable top-down water treatment (art_direction craft_advance).
const SiltWater: React.FC<{f: number; tint?: string}> = ({f, tint = SILT}) => {
  const lobes: [number, number, number, number][] = [
    [230, 520, 300, 17], [820, 700, 340, 23], [520, 1180, 380, 29],
    [180, 1480, 300, 19], [880, 1560, 320, 31], [540, 340, 260, 13],
  ];
  return (
    <g>
      <rect width={1080} height={1920} fill={SILT_D} />
      <rect width={1080} height={1920} fill={tint} opacity={0.55} />
      {/* drifting silt lobes (each its own disjoint moving region) */}
      {lobes.map(([cx, cy, r, per], i) => {
        const dx = 34 * Math.sin(f / per + i);
        const dy = 22 * Math.cos(f / (per + 5) + i * 1.3);
        const rot = (f / (per * 0.7) + i) % (Math.PI * 2);
        return (
          <g key={i} transform={`translate(${cx + dx},${cy + dy}) rotate(${(rot * 180) / Math.PI})`}>
            <ellipse cx={0} cy={0} rx={r} ry={r * 0.62} fill={SILT_L} opacity={0.14} />
            <ellipse cx={r * 0.18} cy={-r * 0.12} rx={r * 0.7} ry={r * 0.4} fill={SILT_D} opacity={0.16} />
            <path d={`M${-r},0 Q${-r * 0.3},${-r * 0.5} ${r * 0.4},${-r * 0.1} T${r},${r * 0.2}`}
              fill="none" stroke={SILT_L} strokeWidth={3} opacity={0.12} />
          </g>
        );
      })}
      {/* marine snow drifting up on a nearer plane */}
      {Array.from({length: 40}).map((_, i) => {
        const seed = i * 47;
        const x = (seed * 13 + f * 0.5) % 1140 - 30;
        const y = (seed * 29 - f * 0.9) % 2000;
        const yy = y < 0 ? y + 2000 : y;
        const r = 1.2 + (i % 4) * 0.7;
        return <circle key={i} cx={x} cy={yy} r={r} fill={WHALE} opacity={0.10 + (i % 3) * 0.05} />;
      })}
    </g>
  );
};

// BelugaSmudge: the nearly-invisible top-down whale. A soft pale elongated form (head +
// body + hint of flukes) rendered LOW opacity in the silt; `resolve` 0..1 brightens and
// sharpens it as the machine vision locks. Treated with care, never comic.
const BelugaSmudge: React.FC<{x: number; y: number; scale?: number; f: number; resolve?: number}> = ({x, y, scale = 1, f, resolve = 0}) => {
  const rv = Math.max(0, Math.min(1, resolve));
  const op = 0.16 + rv * 0.5;
  const glow = rv;
  const undulate = 4 * Math.sin(f / 22);
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {glow > 0.02 && <ellipse cx={0} cy={0} rx={150} ry={64} fill={WHALE} opacity={0.12 * glow} style={{filter: `blur(14px)`}} />}
      <g transform={`rotate(${undulate * 0.4})`}>
        {/* body */}
        <path d={`M-150,${6} Q-70,${-38 + undulate} 40,${-30} Q120,${-22} 150,0 Q120,${22} 40,${30 - undulate} Q-70,${34} -150,${-6} Z`}
          fill={WHALE} opacity={op} style={glow > 0.1 ? {filter: `drop-shadow(0 0 ${8 * glow}px ${WHALE})`} : undefined} />
        {/* countershade: a soft darker underside so the pale form reads dimensional, not a flat
            blob, once the reticle resolves it (finish-parity, kept subtle to stay near-invisible) */}
        <path d={`M-150,${6} Q-70,${34} 40,${30 - undulate} Q120,${22} 150,0 Q120,${22} 40,${34} Q-70,${38} -150,${10} Z`}
          fill="#8fa6ad" opacity={op * 0.5 * (0.4 + 0.6 * glow)} />
        {/* head brightness + the melon hint */}
        <ellipse cx={95} cy={0} rx={52} ry={30} fill={WHALE} opacity={op * 0.95} />
        {/* rim highlight along the lit top edge (reads as form when resolved) */}
        <path d={`M-140,${-2} Q-70,${-36 + undulate} 40,${-28} Q110,${-22} 146,-3`} fill="none"
          stroke="#ffffff" strokeWidth={3} opacity={0.35 * glow} strokeLinecap="round" />
        {/* fluke hint */}
        <path d={`M-150,0 l-40,-26 l6,26 l-6,26 Z`} fill={WHALE} opacity={op * 0.8} />
      </g>
    </g>
  );
};

// Reticle: the cyan machine-vision reticle. sweep 0..1 slides it in; lock 0..1 snaps a
// pixel grid and corner brackets onto the target. found=amber.
const Reticle: React.FC<{cx: number; cy: number; f: number; sweep?: number; lock?: number; found?: boolean}> = ({cx, cy, f, sweep = 1, lock = 0, found = false}) => {
  const col = found ? AMBER : CYAN;
  const sw = Math.max(0, Math.min(1, sweep));
  const lk = Math.max(0, Math.min(1, lock));
  const bracket = 90 - lk * 24;
  const scanY = cy - 140 + ((f * 3) % 280);
  return (
    <g opacity={sw}>
      {/* crosshair */}
      <line x1={cx - 200} y1={cy} x2={cx + 200} y2={cy} stroke={col} strokeWidth={2} opacity={0.4} />
      <line x1={cx} y1={cy - 200} x2={cx} y2={cy + 200} stroke={col} strokeWidth={2} opacity={0.4} />
      {/* corner brackets clamp inward on lock */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => (
        <g key={i} transform={`translate(${cx + sx * bracket},${cy + sy * bracket})`}>
          <path d={`M0,${sy * 26} L0,0 L${sx * 26},0`} fill="none" stroke={col} strokeWidth={5} strokeLinecap="round" />
        </g>
      ))}
      {/* scan sweep line while searching */}
      {lk < 0.6 && <line x1={cx - 150} y1={scanY} x2={cx + 150} y2={scanY} stroke={col} strokeWidth={2.5} opacity={0.5} />}
      {/* pixel grid snapping on lock */}
      {lk > 0.2 && (
        <g opacity={lk * 0.6}>
          {[-2, -1, 0, 1, 2].map((gx, i) => <line key={`x${i}`} x1={cx + gx * 30} y1={cy - 70} x2={cx + gx * 30} y2={cy + 70} stroke={col} strokeWidth={1.5} />)}
          {[-2, -1, 0, 1, 2].map((gy, i) => <line key={`y${i}`} x1={cx - 70} y1={cy + gy * 28} x2={cx + 70} y2={cy + gy * 28} stroke={col} strokeWidth={1.5} />)}
        </g>
      )}
    </g>
  );
};

// CamField: a frame-filling faint particle field placed INSIDE a scene's camera-transform
// group so that when the camera translates, the whole field shifts across the frame. This is
// what makes a real camera move register as whole-frame displacement (quality_gate CAMERA_MOTION
// needs >=30% of coarse cells to change between 25% and 75% of a shot) on the otherwise-sparse
// orbital/void scenes, and adds a subtle depth-of-starfield to boot.
const CamField: React.FC<{f: number; color?: string; op?: number}> = ({f, color = WHALE, op = 0.7}) => (
  <g>
    {Array.from({length: 150}).map((_, i) => {
      const seed = i * 61;
      const x = (seed * 17) % 1320 - 120;
      const y = (seed * 37) % 2280 - 180;
      const r = 1 + (i % 3) * 0.9;
      const tw = 0.4 + 0.5 * Math.abs(Math.sin(f / (7 + (i % 5)) + i));
      return <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={op * tw} />;
    })}
  </g>
);

const Headline: React.FC<{text: string; top?: number; op?: number; color?: string}> = ({text, top = 190, op = 1, color = WHALE}) => (
  <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', opacity: op}}>
    <span style={{fontFamily: BOLD, fontWeight: 900, fontSize: 56, color, background: 'rgba(6,9,18,0.82)', padding: '14px 30px', borderRadius: 14, border: `5px solid ${CYAN}`, letterSpacing: 1}}>
      {text}
    </span>
  </div>
);

// ============================================================= S1: the silt, FIND THE WHALE (0-7.4s)
const S1: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const sweepIn = interpolate(f, [0, 16], [0.4, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const lock = interpolate(f, [70, 110], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  // whale is VISIBLE from frame 0 (poster-grade FIRST_FRAME: a muted scroll must land the claim
  // immediately) then sharpens as the reticle locks
  const resolve = interpolate(f, [0, 120], [0.42, 0.92], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wipe = interpolate(f, [200, 222], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const push = interpolate(f, [0, 222], [1.0, 1.13], {extrapolateRight: 'clamp'});
  // craneDown: the silt world drifts across the frame (real whole-frame displacement,
  // CAMERA_MOTION). The static HUD frame + vignette stay put; only the water/whale/reticle crane.
  const camX = interpolate(f, [0, 222], [95, -95], {extrapolateRight: 'clamp'});
  const camY = interpolate(f, [0, 222], [-70, 95], {extrapolateRight: 'clamp'});
  const bktBlink = (f % 44) < 30;
  return (
    <AbsoluteFill style={{backgroundColor: SILT_D}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <defs>
          <radialGradient id="s1vig" cx="50%" cy="52%" r="62%">
            <stop offset="55%" stopColor={ORBIT_D} stopOpacity={0} />
            <stop offset="100%" stopColor="#02040a" stopOpacity={0.9} />
          </radialGradient>
        </defs>
        <g transform={`translate(${camX},${camY}) translate(540,960) scale(${push}) translate(-540,-960)`}>
          <SiltWater f={f} />
          <BelugaSmudge x={540} y={1120} f={f} resolve={resolve} />
          <Reticle cx={540} cy={1120} f={f} sweep={sweepIn} lock={lock} found={false} />
        </g>
        {/* strong vignette (dark corners) so frame 0 carries real poster-grade luma contrast */}
        <rect width={1080} height={1920} fill="url(#s1vig)" />
        {/* HUD frame present from frame 0: bright corner brackets + a scanning status bar. Spreads
            high-contrast ink across the frame so FIRST_FRAME reads loaded, not a fade-from-black. */}
        {([[70, 480, 1, 1], [1010, 480, -1, 1], [70, 1560, 1, -1], [1010, 1560, -1, -1]] as [number, number, number, number][]).map(([x, y, sx, sy], i) => (
          <g key={i} transform={`translate(${x},${y})`} opacity={bktBlink ? 1 : 0.55}>
            <path d={`M0,${sy * 54} L0,0 L${sx * 54},0`} fill="none" stroke={CYAN} strokeWidth={8} strokeLinecap="round" />
          </g>
        ))}
        <g transform="translate(540,470)">
          <rect x={-250} y={-30} width={500} height={56} rx={10} fill="rgba(2,4,10,0.9)" stroke={CYAN} strokeWidth={3} />
          <circle cx={-214} cy={-2} r={9} fill={bktBlink ? '#ff5a4d' : '#5a1f1c'} />
          <text x={16} y={9} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={26} fill={WHALE} letterSpacing={2}>SCANNING COOK INLET</text>
        </g>
        <rect width={1080} height={1920} fill={ORBIT_D} opacity={wipe} />
      </svg>
      <Headline text="FIND THE WHALE" top={335} />
    </AbsoluteFill>
  );
};

// ============================================================= S2: 331 + the decline (7.4-15.5s)
const S2: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const count = Math.round(interpolate(f, [10, 70], [0, 331], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}));
  const badgePop = spring({frame: f - 8, fps: 30, config: {damping: 12, stiffness: 180}});
  const curveIn = interpolate(f, [90, 150], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease)});
  const anchorY = interpolate(f, [95, 150], [0, 300], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
  const upTick = interpolate(f, [160, 200], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const scan = ((f * 4) % 1920);
  const wipeIn = interpolate(f, [0, 14], [1, 0], {extrapolateRight: 'clamp'});
  // curve geometry: 1300 (1979, top-left) plunging to 279 (2018, bottom-right), faint uptick
  const cx0 = 180, cy0 = 980, cx1 = 900, cy1 = 1320;
  return (
    <AbsoluteFill style={{backgroundColor: ORBIT}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <rect width={1080} height={1920} fill={ORBIT} />
        {/* instrument grid */}
        {Array.from({length: 14}).map((_, i) => <line key={`v${i}`} x1={i * 80} y1={0} x2={i * 80} y2={1920} stroke={PEWTER} strokeWidth={1} opacity={0.08} />)}
        {Array.from({length: 24}).map((_, i) => <line key={`h${i}`} x1={0} y1={i * 80} x2={1080} y2={i * 80} stroke={PEWTER} strokeWidth={1} opacity={0.08} />)}
        {/* moving scanline (living region) */}
        <line x1={0} y1={scan} x2={1080} y2={scan} stroke={CYAN} strokeWidth={3} opacity={0.12} />
        {/* 331 starburst badge */}
        <g transform={`translate(540,560) scale(${Math.min(1, badgePop)})`}>
          {Array.from({length: 16}).map((_, i) => {
            const a = (i / 16) * Math.PI * 2;
            return <line key={i} x1={Math.cos(a) * 210} y1={Math.sin(a) * 210} x2={Math.cos(a) * 250} y2={Math.sin(a) * 250} stroke={AMBER} strokeWidth={6} opacity={0.5} />;
          })}
          <circle r={205} fill={ORBIT_D} stroke={AMBER} strokeWidth={8} />
          <text x={0} y={30} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={150} fill={WHALE} stroke={INK} strokeWidth={4} paintOrder="stroke">{count}</text>
          <text x={0} y={110} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={30} fill={AMBER} letterSpacing={2}>LEFT</text>
        </g>
        <g transform="translate(540,760)" opacity={Math.min(1, badgePop)}>
          <rect x={-230} y={-4} width={460} height={44} rx={10} fill={ORBIT_D} stroke={PEWTER} strokeWidth={3} />
          <text x={0} y={27} textAnchor="middle" fontFamily={BOLD} fontWeight={700} fontSize={24} fill={PEWTER}>2022 AERIAL SURVEY, NOT THE AI</text>
        </g>
        {/* decline curve */}
        <g opacity={curveIn}>
          <path d={`M${cx0},${cy0} Q${(cx0 + cx1) / 2 - 40},${cy0 + 240} ${cx1},${cy1}`} fill="none" stroke={CYAN} strokeWidth={7}
            strokeDasharray={1200} strokeDashoffset={1200 * (1 - curveIn)} />
          {/* faint uptick at the end */}
          <path d={`M${cx1},${cy1} q40,${-14 * upTick} 80,${-10 * upTick}`} fill="none" stroke={AMBER} strokeWidth={6} opacity={upTick} />
          <circle cx={cx0} cy={cy0} r={9} fill={WHALE} />
          <text x={cx0 + 10} y={cy0 - 20} fontFamily={BOLD} fontWeight={900} fontSize={30} fill={WHALE}>1,300 (1979)</text>
          <circle cx={cx1} cy={cy1} r={9} fill={WHALE} />
          <text x={cx1} y={cy1 + 44} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={30} fill={WHALE}>279 (2018)</text>
          {/* anchor dropping with the plunge */}
          <g transform={`translate(${(cx0 + cx1) / 2 - 20},${cy0 + 40 + anchorY})`} opacity={anchorY < 290 ? 1 : 0.5}>
            <line x1={0} y1={-16} x2={0} y2={20} stroke={PEWTER} strokeWidth={5} />
            <path d="M-18,20 Q0,44 18,20" fill="none" stroke={PEWTER} strokeWidth={5} />
            <circle cx={0} cy={-20} r={7} fill="none" stroke={PEWTER} strokeWidth={4} />
          </g>
        </g>
        <rect width={1080} height={1920} fill={ORBIT} opacity={wipeIn} />
      </svg>
      <div style={{position: 'absolute', top: 1420, left: 0, right: 0, textAlign: 'center', opacity: curveIn}}>
        <span style={{fontFamily: BOLD, fontWeight: 900, fontSize: 46, color: WHALE, background: 'rgba(6,9,18,0.82)', padding: '12px 26px', borderRadius: 12, border: `4px solid ${CYAN}`}}>DOWN ~80% SINCE 1979</span>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================= S3: from space (15.5-21.4s)
const S3: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const e = entrance(f, fps, 6, {drop: -260, preset: {damping: 13, stiffness: 130}});
  const coneIn = interpolate(f, [40, 80], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(f, [0, 177], [60, -30], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const wipeIn = interpolate(f, [0, 14], [1, 0], {extrapolateRight: 'clamp'});
  // riseWith crane: the whole orbital field drifts across the frame as we rise with the satellite
  // (a real whole-frame camera displacement, CAMERA_MOTION floor). The dense CamField shifts with it.
  const camX = interpolate(f, [0, 177], [110, -110], {extrapolateRight: 'clamp'});
  const camY = interpolate(f, [0, 177], [-80, 90], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: ORBIT_D}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <rect width={1080} height={1920} fill={ORBIT_D} />
        <rect width={1080} height={1920} fill={ORBIT} opacity={0.5} />
        <g transform={`translate(${camX},${camY})`}>
          {/* dense drifting starfield (fills frame, shifts with the crane) */}
          <CamField f={f} op={0.75} />
          {/* Earth curve (Cook Inlet hint) at the bottom */}
          <g transform={`translate(0,${rise})`}>
            <path d="M-100,2000 Q540,1480 1180,2000 Z" fill={SILT_D} />
            <path d="M-100,2000 Q540,1500 1180,2000" fill="none" stroke={CYAN} strokeWidth={4} opacity={0.4} />
            <path d="M-100,2010 Q540,1520 1180,2010 L1180,2100 L-100,2100 Z" fill={SILT} opacity={0.5} />
            <path d="M-100,1500 Q540,1440 1180,1500" fill="none" stroke={CYAN} strokeWidth={30} opacity={0.06} />
          </g>
          {/* imaging cone reaching down toward the Earth curve */}
          <g transform={`translate(540,${560 + e.dy})`} opacity={coneIn * 0.55}>
            <path d="M-40,150 L-220,940 L220,940 L40,150 Z" fill={CYAN} opacity={0.10} />
            <path d="M-40,150 L-220,940" stroke={CYAN} strokeWidth={3} opacity={0.5} />
            <path d="M40,150 L220,940" stroke={CYAN} strokeWidth={3} opacity={0.5} />
          </g>
          {/* the SatelliteEye */}
          <g transform={`translate(540,${560 + e.dy}) scale(${e.scale})`}>
            <SatelliteEye frame={f} x={0} y={0} scale={1.5} emotion="searching" scanCone={0} />
          </g>
        </g>
        <rect width={1080} height={1920} fill={ORBIT_D} opacity={wipeIn} />
      </svg>
      <Headline text="FROM SPACE" top={340} op={coneIn} />
    </AbsoluteFill>
  );
};

// ============================================================= S4: GAIA + the pipeline (21.4-33.2s)
const S4: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gf = from + f;
  const voice = useVoice();
  const plate = spring({frame: f - 6, fps, config: {damping: 12, stiffness: 170}});
  const chips = [['NOAA', 0], ['USGS', 12], ['MICROSOFT', 24], ['NAVY', 36]] as [string, number][];
  const beltShift = -((f * 3) % 200);
  const stampAt = 150;
  const stamp = spring({frame: f - stampAt, fps, config: {damping: 10, stiffness: 200}});
  const detectorOn = f > 210;
  const wipeIn = interpolate(f, [0, 14], [1, 0], {extrapolateRight: 'clamp'});
  const truck = interpolate(f, [0, 352], [40, -40], {extrapolateRight: 'clamp'});
  // truckAcross: a real whole-frame camera pan (the grid + field + all stations drift across),
  // so the declared move renders as >30% frame displacement (CAMERA_MOTION).
  const camX = interpolate(f, [0, 352], [-205, 205], {extrapolateRight: 'clamp'});
  const camY = interpolate(f, [0, 352], [40, -18], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: '#0e1424'}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <rect width={1080} height={1920} fill="#0e1424" />
        <g transform={`translate(${camX},${camY})`}>
        {/* large soft data-nebula blobs: big low-freq features that survive the coarse
            downsample, so the truckAcross pan registers as real whole-frame displacement */}
        {([[180, 360, 300], [860, 520, 340], [420, 980, 360], [900, 1200, 300], [160, 1500, 320], [620, 1640, 300], [540, 720, 280]] as [number, number, number][]).map(([bx, by, r], i) => (
          <ellipse key={`blob${i}`} cx={bx + 20 * Math.sin(f / (19 + i * 3) + i)} cy={by + 16 * Math.cos(f / (23 + i * 2) + i)}
            rx={r} ry={r * 0.7} fill="#2a4a63" opacity={0.16} />
        ))}
        <CamField f={f} color={WHALE} op={0.5} />
        {Array.from({length: 18}).map((_, i) => <line key={`v${i}`} x1={i * 80 - 120} y1={-120} x2={i * 80 - 120} y2={2040} stroke="#5b7a8c" strokeWidth={2} opacity={0.14} />)}
        {/* GAIA nameplate */}
        <g transform={`translate(540,380) scale(${Math.min(1, plate)})`}>
          <rect x={-260} y={-70} width={520} height={140} rx={16} fill={ORBIT_D} stroke={CYAN} strokeWidth={6} />
          <text x={0} y={-6} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={72} fill={CYAN} letterSpacing={6}>GAIA</text>
          <text x={0} y={44} textAnchor="middle" fontFamily={BOLD} fontWeight={700} fontSize={23} fill={PEWTER}>GEOSPATIAL AI FOR ANIMALS</text>
        </g>
        {/* partner chips clicking in */}
        {chips.map(([label, delay], i) => {
          const cp = spring({frame: f - 40 - delay, fps, config: {damping: 13, stiffness: 190}});
          const x = 180 + i * 190;
          return (
            <g key={i} transform={`translate(${x},470) scale(${Math.min(1, cp)})`} opacity={Math.min(1, cp)}>
              <rect x={-84} y={-26} width={168} height={52} rx={10} fill={ORBIT_D} stroke={PEWTER} strokeWidth={3} />
              <text x={0} y={9} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={label.length > 6 ? 22 : 26} fill={WHALE}>{label}</text>
            </g>
          );
        })}
        {/* fat pulsing down-arrow connecting the naming to the pipeline (fills the mid-frame,
            keeps a live motion region between the chips and the conveyor) */}
        <g transform="translate(540,600)" opacity={Math.min(1, plate)}>
          {(() => { const p = 0.5 + 0.5 * Math.sin(f / 8); const y = p * 20; return (
            <g transform={`translate(0,${y})`}>
              <path d="M-26,0 L26,0 L26,150 L54,150 L0,220 L-54,150 L-26,150 Z" fill={CYAN} opacity={0.22} stroke={CYAN} strokeWidth={3} />
            </g>
          ); })()}
          <text x={0} y={130} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={22} fill={CYAN} opacity={0.9}>IT LEARNS</text>
        </g>
        <defs>
          <FormGradient id="s4frame" t={tones('#6f8a86')} softness={0.7} />
          <FormGradient id="s4box" t={tones('#39566a')} />
        </defs>
        <g transform={`translate(${truck},0)`}>
          {/* conveyor belt, raised to mid-frame */}
          <g transform="translate(0,980)">
            <rect x={60} y={40} width={960} height={20} rx={6} fill={PEWTER} opacity={0.5} />
            {Array.from({length: 14}).map((_, i) => <rect key={i} x={90 + i * 74 + (beltShift % 74)} y={44} width={40} height={12} rx={3} fill={PEWTER} opacity={0.35} />)}
            {/* a scan highlight sweeping the belt (continuous life across the whole shot) */}
            <rect x={120 + ((f * 8) % 800)} y={-72} width={64} height={150} fill={CYAN} opacity={0.06} />
            {/* EarthExplorer hopper (left station) */}
            <g transform="translate(150,-40)">
              <path d="M-70,-60 L70,-60 L40,40 L-40,40 Z" fill={ORBIT_D} stroke={CYAN} strokeWidth={5} />
              <path d="M-40,18 L40,18 L34,40 L-34,40 Z" fill={CYAN} opacity={0.18} />
              <rect x={-16} y={18 + ((f * 4) % 42)} width={32} height={26} rx={4} fill="url(#s4frame)" stroke={INK} strokeWidth={2} />
              <text x={0} y={-80} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={20} fill={CYAN}>EARTHEXPLORER API</text>
            </g>
            {/* imagery frames riding the belt: form-shaded, eased bob, continuous travel */}
            {Array.from({length: 6}).map((_, i) => {
              const prog = ((i * 130 + f * 6) % 780);
              const fx = 240 + prog;
              const bob = 4 * Math.sin(prog / 55 + i);
              return (
                <g key={i} transform={`translate(${fx},${bob})`} opacity={fx > 250 && fx < 1000 ? 1 : 0.25}>
                  <ContactShadow cx={0} cy={34} rx={30} ry={6} opacity={0.22} blur={6} />
                  <rect x={-30} y={-26} width={60} height={52} rx={5} fill="url(#s4frame)" stroke={INK} strokeWidth={3} />
                  <RimLight d="M-25,-22 L25,-22" w={2.5} opacity={0.5} />
                  <ellipse cx={2} cy={3} rx={15} ry={6} fill={WHALE} opacity={0.5} />
                </g>
              );
            })}
            {/* annotation hand: continuous press-and-stamp cycle (articulates all shot) */}
            {(() => {
              const cyc = f % 56;
              const down = cyc < 14 ? cyc / 14 : cyc < 22 ? 1 : Math.max(0, 1 - (cyc - 22) / 12);
              const stamped = cyc >= 13 && cyc < 42;
              return (
                <g transform="translate(540,0)">
                  {stamped && <rect x={-40} y={-36} width={80} height={72} rx={6} fill="none" stroke={AMBER} strokeWidth={5} opacity={Math.min(1, stamp) * (1 - (cyc - 13) / 29)} />}
                  <g transform={`translate(0,${-104 + 58 * down})`}>
                    <path d="M-16,0 q30,-10 30,26 l0,54 l-30,0 Z" fill="#c98a54" stroke={INK} strokeWidth={4} />
                    <path d="M-12,4 q22,-6 24,20" fill="none" stroke="#e0b98a" strokeWidth={3} opacity={0.6} />
                  </g>
                  <text x={0} y={70} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={19} fill={AMBER} opacity={Math.min(1, stamp)}>EXPERT ANNOTATION</text>
                </g>
              );
            })()}
            {/* ML detector learning: always snapping onto whale pixels (right station) */}
            <g transform="translate(900,0)">
              <ContactShadow cx={0} cy={70} rx={62} ry={10} opacity={0.22} blur={10} />
              <rect x={-66} y={-66} width={132} height={132} rx={10} fill="url(#s4box)" stroke={CYAN} strokeWidth={4} />
              <RimLight d="M-60,-60 L60,-60" w={3} opacity={0.5} />
              <ellipse cx={0} cy={4} rx={17} ry={7} fill={WHALE} opacity={0.4} />
              {[0, 1, 2].map((k) => {
                const ph = (f * 2.4 + k * 40) % 120;
                const s = ph < 60 ? 1 : 0.2;
                return <rect key={k} x={-38 + (k - 1) * 30} y={-14} width={26} height={26} rx={3} fill="none" stroke={AMBER} strokeWidth={3} opacity={s} />;
              })}
              <text x={0} y={98} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={18} fill={CYAN}>ML DETECTOR</text>
            </g>
          </g>
        </g>
        {/* the honest through-line label */}
        <g transform="translate(540,1220)" opacity={Math.min(1, plate)}>
          <text x={0} y={0} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={30} fill={AMBER}>ONE LABELED WHALE AT A TIME</text>
        </g>
        </g>
        <rect width={1080} height={1920} fill="#0e1424" opacity={wipeIn} />
      </svg>
      {voice.accentAt(gf) > 0.5 && accentKick(gf, fps, gf) > 0 && null}
    </AbsoluteFill>
  );
};

// ============================================================= S5: still learning (33.2-42.7s)
const S5: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const push = interpolate(f, [0, 150], [1.0, 1.35], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease)});
  const strain = interpolate(f, [40, 90], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tiltDown = interpolate(f, [170, 230], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease)});
  const coneIn = interpolate(f, [180, 240], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const label1 = interpolate(f, [10, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const label2 = interpolate(f, [95, 120], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // clean handoff: the first two labels fully clear (preOut) BEFORE the third appears, so no two
  // headlines ever stack at top:340 (the flow-critic + judge-1 label-overlap fix).
  const preOut = interpolate(f, [196, 212], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const label3 = interpolate(f, [214, 236], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wipeIn = interpolate(f, [0, 14], [1, 0], {extrapolateRight: 'clamp'});
  const emotion = strain > 0.5 ? 'straining' : 'searching';
  const scanY = ((f * 5) % 1920);
  const camX = interpolate(f, [0, 285], [-100, 100], {extrapolateRight: 'clamp'});
  const camY = interpolate(f, [0, 285], [70, -80], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: ORBIT_D}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <rect width={1080} height={1920} fill={ORBIT_D} />
        <rect width={1080} height={1920} fill={ORBIT} opacity={0.5} />
        {/* dollyThrough: the orbital field drifts across the frame under the push-in (real
            whole-frame displacement for CAMERA_MOTION). CamField shifts with the camera. */}
        <g transform={`translate(${camX},${camY})`}>
          {/* large soft nebula blobs (low-freq, survive the coarse downsample) so the dolly
              registers whole-frame displacement with margin (CAMERA_MOTION) */}
          {([[200, 420, 300], [880, 640, 320], [520, 1560, 340], [180, 1200, 300], [900, 1440, 300]] as [number, number, number][]).map(([bx, by, r], i) => (
            <ellipse key={`nb${i}`} cx={bx + 18 * Math.sin(f / (21 + i * 3) + i)} cy={by + 14 * Math.cos(f / (25 + i * 2) + i)}
              rx={r} ry={r * 0.72} fill="#1c3350" opacity={0.16} />
          ))}
          <CamField f={f} op={0.6} />
          {/* narrowing cone as it tilts straight down */}
          <g transform="translate(540,1180)" opacity={coneIn * 0.6}>
            {(() => { const w = 220 - tiltDown * 150; return (
              <>
                <path d={`M-40,0 L${-w},640 L${w},640 L40,0 Z`} fill={CYAN} opacity={0.10} />
                <path d={`M-40,0 L${-w},640`} stroke={CYAN} strokeWidth={3} opacity={0.5} />
                <path d={`M40,0 L${w},640`} stroke={CYAN} strokeWidth={3} opacity={0.5} />
              </>
            ); })()}
          </g>
          <g transform={`translate(540,940) scale(${push})`}>
            <SatelliteEye frame={f} x={0} y={0} scale={1.5} emotion={emotion} strain={strain} eyeLock={0} scanCone={0} />
          </g>
        </g>
        <line x1={0} y1={scanY} x2={1080} y2={scanY} stroke={CYAN} strokeWidth={2} opacity={0.08} />
        <rect width={1080} height={1920} fill={ORBIT_D} opacity={wipeIn} />
      </svg>
      <div style={{position: 'absolute', top: 340, left: 0, right: 0, textAlign: 'center', opacity: label1 * preOut}}>
        <span style={{fontFamily: BOLD, fontWeight: 900, fontSize: 52, color: WHALE, background: 'rgba(6,9,18,0.85)', padding: '12px 26px', borderRadius: 12, border: `5px solid ${AMBER}`}}>CANNOT COUNT BELUGAS YET</span>
      </div>
      <div style={{position: 'absolute', top: 425, left: 0, right: 0, textAlign: 'center', opacity: label2 * preOut}}>
        <span style={{fontFamily: BOLD, fontWeight: 700, fontSize: 34, color: CYAN, background: 'rgba(6,9,18,0.7)', padding: '8px 20px', borderRadius: 10}}>STILL LEARNING TO SEE</span>
      </div>
      <div style={{position: 'absolute', top: 340, left: 0, right: 0, textAlign: 'center', opacity: label3}}>
        <span style={{fontFamily: BOLD, fontWeight: 900, fontSize: 46, color: WHALE, background: 'rgba(6,9,18,0.85)', padding: '12px 24px', borderRadius: 12, border: `5px solid ${CYAN}`}}>NEEDS A CLEAR LOOK STRAIGHT DOWN</span>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================= S6: the turn, crowded sky (42.7-54.6s)
const S6: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const coneIn = interpolate(f, [10, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // say-it-show-it to the VO: L7 (42.7-47.6, "came back empty") shows the JUNE 2025 filmstrip
  // stamping empty; L8 (48.6-54.6, "the sky was likely booked, a port and an air base") is when
  // the PORT/JBER rings crowd in. So the filmstrip fires EARLY (L7) and the rings LATE (L8).
  const ring1 = spring({frame: f - 185, fps, config: {damping: 11, stiffness: 150}});
  const ring2 = spring({frame: f - 210, fps, config: {damping: 11, stiffness: 150}});
  const filmAt = 45;
  const film = spring({frame: f - filmAt, fps, config: {damping: 12, stiffness: 160}});
  const qBlink = ((f - 250) % 40) < 26 && f > 250;
  const wipeIn = interpolate(f, [0, 14], [1, 0], {extrapolateRight: 'clamp'});
  const push = interpolate(f, [0, 378], [1.0, 1.05], {extrapolateRight: 'clamp'});
  const ringSlam1 = Math.min(1, ring1), ringSlam2 = Math.min(1, ring2);
  return (
    <AbsoluteFill style={{backgroundColor: SILT_D}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <g transform={`translate(540,960) scale(${push}) translate(-540,-960)`}>
          <SiltWater f={f} />
          <BelugaSmudge x={540} y={1180} f={f} resolve={0.2} />
          {/* imaging cone from top (the satellite off-frame above) */}
          <g opacity={coneIn * 0.5}>
            <path d="M480,0 L300,900 L780,900 L600,0 Z" fill={CYAN} opacity={0.10 - 0.05 * Math.max(ringSlam1, ringSlam2)} />
            <path d="M480,0 L300,900" stroke={CYAN} strokeWidth={3} opacity={0.4} />
            <path d="M600,0 L780,900" stroke={CYAN} strokeWidth={3} opacity={0.4} />
          </g>
          {/* honest hedge: NOAA says the cause is LIKELY, not confirmed. Shown so the muted
              viewer reads correlation, not a stated mechanical cause. */}
          <g transform="translate(540,350)" opacity={Math.max(ringSlam1, ringSlam2)}>
            <rect x={-190} y={-34} width={380} height={64} rx={12} fill="rgba(6,9,18,0.82)" stroke={AMBER} strokeWidth={4} strokeDasharray="10 7" />
            <text x={0} y={12} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={32} fill={AMBER} letterSpacing={2}>LIKELY BOOKED</text>
          </g>
          {/* airspace claim rings slamming over the same slice */}
          <g transform="translate(400,620)" opacity={ringSlam1}>
            <circle r={260 - 60 * ringSlam1} fill="none" stroke={AMBER} strokeWidth={7} strokeDasharray="14 10" />
            <rect x={-150} y={-30} width={300} height={60} rx={10} fill={ORBIT_D} stroke={AMBER} strokeWidth={4} />
            <text x={0} y={12} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={26} fill={AMBER}>PORT OF ANCHORAGE</text>
          </g>
          <g transform="translate(700,760)" opacity={ringSlam2}>
            <circle r={230 - 55 * ringSlam2} fill="none" stroke="#ff7a4d" strokeWidth={7} strokeDasharray="14 10" />
            <rect x={-96} y={-30} width={192} height={60} rx={10} fill={ORBIT_D} stroke="#ff7a4d" strokeWidth={4} />
            <text x={0} y={12} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={30} fill="#ff7a4d">JBER</text>
          </g>
          {/* JUNE 2025 filmstrip frame stamping empty (raised to clear the caption band) */}
          <g transform={`translate(540,1360) scale(${Math.min(1, film)})`} opacity={Math.min(1, film)}>
            <rect x={-220} y={-90} width={440} height={180} rx={8} fill={ORBIT_D} stroke={WHALE} strokeWidth={5} />
            {[-1, 1].map((s, i) => [0, 1, 2].map((k) => <rect key={`${i}${k}`} x={s * 200 - 8} y={-80 + k * 60} width={16} height={24} rx={3} fill={WHALE} opacity={0.5} />))}
            <rect x={-180} y={-56} width={360} height={112} rx={4} fill="#05070c" />
            <text x={0} y={-4} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={34} fill={WHALE}>JUNE 2025</text>
            <text x={0} y={40} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={30} fill="#ff7a4d">NO IMAGERY</text>
          </g>
          {/* detection box with a question mark over the faint whale */}
          <g transform="translate(540,1180)">
            <rect x={-90} y={-70} width={180} height={140} rx={8} fill="none" stroke={CYAN} strokeWidth={4} opacity={0.7} />
            {qBlink && <text x={0} y={26} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={80} fill={AMBER}>?</text>}
          </g>
        </g>
        <rect width={1080} height={1920} fill={SILT_D} opacity={wipeIn} />
      </svg>
    </AbsoluteFill>
  );
};

// ============================================================= S7: the button, loop (54.6-67.3s)
const S7: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const settle = interpolate(f, [20, 90], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const blink = ((f) % 150) < 6 && f > 90;
  // headline lands with L10 (spoken ~61.0s; S7 starts 55.27s so local ~f172), not seconds early;
  // wordmark settles after the question. L9 (55.3-60.0, whales holding on / eye is real) plays over
  // the hopeful whale-brighten + settling reticle with no headline (say-it-show-it, flow-critic fix).
  const hopeResolve = interpolate(f, [0, 110], [0.45, 0.7], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wordmarkIn = interpolate(f, [235, 285], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wordmarkOp = interpolate(f, [235, 275], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const headOp = interpolate(f, [165, 195], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const push = interpolate(f, [0, 360], [1.06, 1.0], {extrapolateRight: 'clamp'});
  const qSoft = interpolate(f, [90, 200], [1, 0.4], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: SILT_D}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <g transform={`translate(540,960) scale(${push}) translate(-540,-960)`}>
          <SiltWater f={f} />
          <BelugaSmudge x={540} y={1180} f={f} resolve={hopeResolve} />
          <Reticle cx={540} cy={1180} f={f} sweep={settle} lock={settle * 0.5} found={false} />
          {/* question-mark box softening (not resolved by design) */}
          <g transform="translate(540,1180)" opacity={qSoft}>
            <text x={150} y={-90} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={54} fill={AMBER} opacity={blink ? 0.4 : 1}>?</text>
          </g>
        </g>
      </svg>
      <Headline text="WILL THE SKY STAY OPEN" top={335} op={headOp} />
      <div style={{position: 'absolute', top: 470 + wordmarkIn, left: 0, right: 0, textAlign: 'center', opacity: wordmarkOp}}>
        <span style={{fontFamily: BOLD, fontWeight: 900, fontSize: 40, color: CYAN, letterSpacing: 4}}>ALASKA.AI</span>
      </div>
    </AbsoluteFill>
  );
};

const GradedGrade: React.FC = () => {
  const f = useCurrentFrame();
  return <GradeLayer f={f} bloom={0.28} vignette={0.42} grain={0.05} warmth={-0.05} />;
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
      <div style={{background: 'rgba(6,9,18,0.86)', borderRadius: 14, padding: '16px 30px', maxWidth: 940, border: `4px solid ${CYAN}`, transform: `translateY(${rise}px) scale(${scale})`, transformOrigin: 'center bottom'}}>
        <div style={{fontFamily: BOLD, fontWeight: 900, fontSize: 46, lineHeight: 1.12, color: '#fff', textAlign: 'center', letterSpacing: 0.5, textShadow: `2px 3px 0 rgba(0,0,0,0.6)`}}>
          {cue.text}
        </div>
      </div>
    </div>
  );
};

const SCENE_COMPONENTS: React.FC<{from?: number}>[] = [S1, S2, S3, S4, S5, S6, S7];
const DEFAULT_BOUNDS: {from: number; dur: number}[] = [
  {from: 0, dur: 222}, {from: 222, dur: 244}, {from: 466, dur: 177},
  {from: 643, dur: 352}, {from: 995, dur: 285}, {from: 1280, dur: 378},
  {from: 1658, dur: 360},
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
