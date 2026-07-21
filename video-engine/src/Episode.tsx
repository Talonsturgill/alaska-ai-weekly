import React from 'react';
import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {z} from 'zod';
import {VoiceProvider, useVoice} from './lib/voice';
import {Beluga, Raven} from './lib/fauna';
import {SatelliteEye, ListeningMooring} from './lib/sensors';
import {SmellRings, ScanReticle, ImpactStar, SpeedLines, ZoomVignette} from './lib/FX';
import {BoxLabel} from './lib/kit';
import {StatCard} from './lib/props';
import {AnchorageSkylineBG} from './lib/biomes';
import {tones, FormGradient, RimLight, ContactShadow, GradeLayer, MotionBlur, WaterColumn} from './lib/lighting';

const BOLD = 'Arial Black, Arial, sans-serif';

// ---- 2026-07-21c palette ("Ear and Eye on the Ice-White Whale", art_direction-locked) ----
// silty pewter water + ice-white beluga hero + mint synthetic sonar + signal-gold lock + ink.
const SKY = '#b9c4c7';
const WSURF = '#7f9791';
const WDEEP = '#33463f';
const MINT = '#31e0b6';
const GOLD = '#ffd24a';
const INKC = '#141d1b';
const PANEL = '#e9efe9';

export const episodeSchema = z.object({
  captions: z.array(z.object({text: z.string(), start: z.number(), end: z.number(), seg: z.number()})),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(),
    energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
});
export type EpisodeProps = z.infer<typeof episodeSchema>;

// ============================================================= shared: the whale
// A single reusable beluga staging with an optional mint "sweep rim" that fires ONLY
// while a sensor sweep is touching it (the sensors are the only sharp man-made light).
const Whale: React.FC<{x: number; y: number; scale?: number; f: number; facing?: 1 | -1; mode?: 'cruise' | 'spy'; blow?: number; sweep?: number}> = ({x, y, scale = 1, f, facing = 1, mode = 'cruise', blow = 0, sweep = 0}) => (
  <g>
    <Beluga x={x} y={y} scale={scale} f={f} facing={facing} mode={mode} blow={blow} />
    {sweep > 0.05 && (
      <g transform={`translate(${x},${y}) scale(${scale})`} opacity={Math.min(1, sweep)} style={{mixBlendMode: 'screen'}}>
        <ellipse cx={0} cy={-6} rx={172} ry={70} fill="none" stroke={MINT} strokeWidth={6} opacity={0.7} />
      </g>
    )}
  </g>
);

// ============================================================= S1: cold open
const S1: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const voice = useVoice();
  const gf = from + f;
  const drop = interpolate(f, [0, 167], [-26, 10], {extrapolateRight: 'clamp', easing: Easing.out(Easing.ease)});
  const push = interpolate(f, [0, 167], [1.0, 1.06], {extrapolateRight: 'clamp'});
  const blow = interpolate(f, [20, 44, 70], [0, 1, 0.2], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const LOCK_AT = 70;
  const lock = spring({frame: f - LOCK_AT, fps, config: {damping: 11, stiffness: 190}});
  const sweep = interpolate(f, [LOCK_AT - 6, LOCK_AT + 8, 130], [0, 1, 0.5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const headlineOp = interpolate(f, [0, 130, 160], [1, 1, 0.9], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: WDEEP}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <g transform={`translate(540,${960 + drop}) scale(${push}) translate(-540,-960)`}>
          <g opacity={0.5}><g transform="translate(0,-560)"><AnchorageSkylineBG f={f} season="summer" denali floatplane={false} train={false} /></g></g>
          <g transform="translate(0,300)"><WaterColumn f={f} intensity={1} surfaceY={-360} deep={WDEEP} shallow={WSURF} rays={6} /></g>
          <Whale x={520} y={1000} scale={1.5} f={f} facing={1} mode="cruise" blow={blow} sweep={sweep} />
          <g transform="translate(520,995)">
            {lock > 0.05 && <SmellRings cx={-52} cy={0} frame={f} color={MINT} count={4} maxR={300} intensity={Math.min(1, lock)} />}
            <ScanReticle cx={40} cy={-6} frame={f} lock={Math.min(1, lock)} color={GOLD} size={250} />
          </g>
          {lock > 0.55 && lock < 1.5 && <SpeedLines cx={560} cy={990} frame={f} intensity={0.7} color={GOLD} />}
          {lock > 0.85 && lock < 1.4 && <ImpactStar cx={690} cy={840} r={40} color={GOLD} />}
        </g>
      </svg>
      <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', opacity: headlineOp}}>
        <span style={{fontFamily: BOLD, fontWeight: 900, fontSize: 66, color: '#fff', background: 'rgba(20,29,27,0.82)', padding: '14px 34px', borderRadius: 14, border: `6px solid ${MINT}`, textShadow: '3px 4px 0 rgba(0,0,0,0.5)', letterSpacing: 0.5}}>
          TWO EYES ON THE LAST WHALES
        </span>
      </div>
      {voice.accentAt(gf) > 0.5 && <ZoomVignette amount={0.09 * voice.accentAt(gf)} />}
    </AbsoluteFill>
  );
};

// ============================================================= S2: the two watchers
const S2: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const rise = interpolate(f, [0, 131], [120, -120], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease)});
  const satOn = interpolate(f, [16, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const moorOn = interpolate(f, [8, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: INKC}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <g transform={`translate(0,${rise})`}>
          <rect x={0} y={-260} width={1080} height={760} fill={SKY} />
          <rect x={0} y={-260} width={1080} height={760} fill={GOLD} opacity={0.04} />
          <g opacity={satOn} transform="translate(760,150)"><SatelliteEye x={0} y={0} scale={0.62} f={f} scanCone={0} lensGlow={0.3} /></g>
          <rect x={0} y={500} width={1080} height={1620} fill={WDEEP} />
          <g transform="translate(0,500)"><WaterColumn f={f} intensity={0.85} surfaceY={0} deep={WDEEP} shallow={WSURF} rays={5} /></g>
          <rect x={0} y={492} width={1080} height={16} fill={WSURF} opacity={0.9} />
          <Whale x={430} y={980} scale={0.82} f={f} facing={1} mode="cruise" />
          <g opacity={moorOn} transform="translate(300,1700)"><ListeningMooring x={0} y={0} scale={0.9} f={f} detect={0.2} /></g>
        </g>
      </svg>
      <BoxLabel x={540} y={250} text="NOAA · 2 AI SYSTEMS" fs={34} w={520} h={70} fill={PANEL} color={INKC} />
    </AbsoluteFill>
  );
};

// ============================================================= S3: the robot ear
const S3: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const push = interpolate(f, [0, 60], [1.15, 1.0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const detect = interpolate(f, [14, 40], [0.2, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const boxIn = interpolate(f, [70, 88], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const tagIn = interpolate(f, [96, 112], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wavePts = Array.from({length: 40}).map((_, i) => {
    const spike = i === 20 ? 46 * detect : 0;
    const y = Math.sin((i + f * 0.5) / 2) * 6 + spike * Math.exp(-Math.pow(i - 20, 2) / 8);
    return `${-190 + i * 9.5},${-y}`;
  }).join(' ');
  return (
    <AbsoluteFill style={{backgroundColor: WDEEP}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <WaterColumn f={f} intensity={0.9} surfaceY={0} deep="#22322c" shallow={WDEEP} rays={4} />
        <g transform={`translate(540,1150) scale(${push})`}>
          <ListeningMooring x={0} y={220} scale={1.25} f={f} detect={detect} />
        </g>
        {/* the readout: waveform gets boxed DETECT, then labeled BELUGA */}
        <g transform="translate(540,620)">
          <rect x={-230} y={-70} width={460} height={140} rx={12} fill="#0f1c1a" stroke={INKC} strokeWidth={5} opacity={0.94} />
          <polyline points={wavePts} fill="none" stroke={MINT} strokeWidth={3.5} transform="translate(0,0)" />
          <g opacity={boxIn}>
            <rect x={-18} y={-52} width={70} height={104} fill="none" stroke={GOLD} strokeWidth={4} />
          </g>
          <g opacity={tagIn}><BoxLabel x={150} y={-40} text="BELUGA" fs={26} w={150} h={48} fill={MINT} color={INKC} /></g>
        </g>
      </svg>
      <BoxLabel x={540} y={250} text="DEEP LEARNING · LISTENS" fs={32} w={560} h={66} fill={PANEL} color={INKC} />
    </AbsoluteFill>
  );
};

// ============================================================= S4: the robot eye (SIGNATURE) + stereo payoff
const S4: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  // orbital punch-down, then the reticle clamps the white smudge, then the stereo payoff.
  const dive = interpolate(f, [0, 60], [0.55, 1.0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const cone = interpolate(f, [6, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const LOCK_AT = 78;
  const lock = spring({frame: f - LOCK_AT, fps, config: {damping: 11, stiffness: 200}});
  const phaseB = interpolate(f, [96, 120], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}); // stereo reveal
  const camY = interpolate(dive, [0.55, 1], [-140, 0]);
  return (
    <AbsoluteFill style={{backgroundColor: '#9fb0b2'}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        {/* cloud deck up top, silty inlet below */}
        <rect width={1080} height={1920} fill="#aebfc0" />
        <g opacity={interpolate(f, [0, 50], [1, 0.3], {extrapolateRight: 'clamp'})}>
          {[0, 1, 2, 3].map((i) => <ellipse key={i} cx={(i * 330 + f * 1.5) % 1200 - 60} cy={220 + (i % 2) * 90} rx={190} ry={70} fill="#ffffff" opacity={0.5} />)}
        </g>
        <g transform="translate(0,760)"><WaterColumn f={f} intensity={0.7} surfaceY={0} deep={WDEEP} shallow={WSURF} rays={5} /></g>
        <g transform={`translate(540,${300 + camY}) scale(${0.5 + dive * 0.5})`}>
          <SatelliteEye x={0} y={0} scale={0.66} f={f} scanCone={cone} lensGlow={0.5} />
        </g>
        {/* the white smudge that resolves into a whale, at the inlet */}
        <g transform={`translate(540,1250)`}>
          <Whale x={0} y={0} scale={0.5 + phaseB * 0.92} f={f} facing={1} mode="cruise" sweep={phaseB} />
          <g transform="translate(0,-6)">
            <ScanReticle cx={0} cy={0} frame={f} lock={Math.min(1, lock)} color={GOLD} size={190} />
            {phaseB > 0.2 && <SmellRings cx={-40} cy={0} frame={f} color={MINT} count={3} maxR={220} intensity={phaseB} />}
          </g>
          {lock > 0.85 && lock < 1.4 && <ImpactStar cx={150} cy={-120} r={38} color={GOLD} />}
        </g>
      </svg>
      <BoxLabel x={540} y={250} text={phaseB > 0.4 ? 'EAR + EYE · FIRST TIME' : 'GAIA · DETECTED'} fs={32} w={560} h={66} fill={PANEL} color={INKC} />
    </AbsoluteFill>
  );
};

// ============================================================= S5: the number 331
const S5: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cardIn = spring({frame: f - 4, fps, config: {damping: 12, stiffness: 170}});
  const push = interpolate(f, [0, 122], [1.0, 1.07], {extrapolateRight: 'clamp'});
  // the count climbs UP to 331 and LANDS; NEVER displays a value above 331 (false count = a
  // labeled beluga population above NOAA's estimate; the panel hard-blocked an overshoot).
  const countUp = interpolate(f, [8, 44], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const shown = Math.min(331, Math.round(331 * countUp));
  const landed = f >= 44;
  const led = landed && (Math.sin(f / 7) > 0.2) ? 1 : 0.3;
  return (
    <AbsoluteFill style={{backgroundColor: INKC}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <rect width={1080} height={1920} fill={INKC} />
        <g transform="translate(0,0)"><WaterColumn f={f} intensity={0.4} surfaceY={0} deep="#101816" shallow="#1c2b28" rays={4} /></g>
        <g transform={`translate(540,1250) scale(${push})`}>
          <g transform={`scale(${cardIn})`}>
            <StatCard x={0} y={0} big={String(shown)} sub="COOK INLET BELUGAS" formShaded color={MINT} scale={1.2} />
          </g>
          <circle cx={220} cy={-150} r={12} fill={landed ? '#e06a4a' : MINT} opacity={led} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ============================================================= S6: the decline
const S6: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  // a real cranedown + slight dolly-out (the CAMERA_MOTION gate needs >=30% whole-frame
  // displacement across the shot; the old 36px drop read as a locked frame).
  const camY = interpolate(f, [0, 145], [-300, 230], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease)});
  const camX = interpolate(f, [0, 145], [70, -70], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease)});
  const camS = interpolate(f, [0, 145], [1.3, 1.0], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease)});
  const drop = 0;
  const collapse = interpolate(f, [6, 40], [1, 0.255], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const bounce = f > 40 && f < 58 ? -0.028 * Math.sin((f - 40) / 18 * Math.PI) : 0;
  const barFrac = Math.max(0.2, collapse + bounce);
  const ghostOp = interpolate(f, [2, 26], [0, 0.72], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const STAMP_AT = 78;
  const stampS = spring({frame: f - STAMP_AT, fps, config: {damping: 9, stiffness: 210}});
  const H = 760;
  return (
    <AbsoluteFill style={{backgroundColor: INKC}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <rect width={1080} height={1920} fill="#12201d" />
        <g transform={`translate(${540 + camX},${960 + camY}) scale(${camS}) translate(-540,-960)`}>
          {/* full-frame moving texture INSIDE the camera group so the crane registers as real
              whole-frame displacement (a flat bg outside the group read as a locked frame) */}
          <WaterColumn f={f} intensity={0.5} surfaceY={-420} deep="#101816" shallow="#1f302c" rays={5} />
          {/* ghost pod of the ~1,000 missing belugas */}
          <g opacity={ghostOp}>
            {Array.from({length: 22}).map((_, i) => (
              <g key={i} transform={`translate(${60 + (i % 6) * 165},${230 + Math.floor(i / 6) * 80}) scale(0.34)`}>
                <Beluga x={0} y={0} scale={1} f={f + i * 7} facing={i % 2 ? 1 : -1} mode="cruise" swim={0.4} />
              </g>
            ))}
          </g>
          {/* the bar */}
          <rect x={360} y={1500 - H * barFrac} width={200} height={H * barFrac} rx={8} fill={MINT} stroke={INKC} strokeWidth={5} />
          <rect x={360} y={1500 - H * barFrac} width={200} height={16} fill="#fff" opacity={0.3} />
          <line x1={80} y1={1500} x2={1000} y2={1500} stroke={WSURF} strokeWidth={4} />
          {/* readout: sublabel ABOVE the value, both clear of the bar */}
          <text x={540} y={1208} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={30} fill={MINT} letterSpacing={1}>BELUGAS · 1979 TO TODAY</text>
          <text x={540} y={1270} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={52} fill="#ffffff" stroke={INKC} strokeWidth={4} paintOrder="stroke" letterSpacing={2}>1,300 → 279 → 331</text>
        </g>
        <g transform="translate(540,760)" opacity={Math.min(1, stampS)}>
          <g transform={`rotate(-8) scale(${stampS})`}>
            <rect x={-190} y={-46} width={380} height={92} rx={8} fill="none" stroke="#e0483a" strokeWidth={7} />
            <text x={0} y={16} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={44} fill="#e0483a">-80% · ENDANGERED</text>
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ============================================================= S7: the turn
const S7: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const swim = interpolate(f, [0, 210], [0, 1], {extrapolateRight: 'clamp'});
  const wakeX = interpolate(f, [20, 90], [-300, 1200], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const threats = ['OCEAN NOISE', 'LOST SALMON', 'HABITAT'];
  return (
    <AbsoluteFill style={{backgroundColor: WDEEP}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <WaterColumn f={f} intensity={0.8} surfaceY={0} deep="#2a3a34" shallow={WDEEP} rays={5} />
        {/* boat wake rolling over the whale */}
        <g transform={`translate(${wakeX},420)`} opacity={0.5}>
          <path d="M-120,0 q120,50 240,0 q-60,40 -120,40 q-60,0 -120,-40 Z" fill="#101816" opacity={0.5} />
          <ellipse cx={60} cy={20} rx={140} ry={20} fill="#0c1512" opacity={0.4} />
        </g>
        <g transform="translate(500,980)">
          <Whale x={0} y={0} scale={1.15} f={f} facing={1} mode="cruise" sweep={0.4} />
          <ScanReticle cx={30} cy={-6} frame={f} lock={0.9} color={GOLD} size={210} />
          <SmellRings cx={-40} cy={0} frame={f} color={MINT} count={3} maxR={200} intensity={0.5} />
        </g>
        {/* empty net drifting */}
        <g transform={`translate(${820 - swim * 60},1320)`} opacity={0.5}>
          <path d="M0,0 l120,0 l-14,120 l-92,0 Z" fill="#0d1815" opacity={0.55} stroke="#9fb3ab" strokeWidth={3} strokeLinejoin="round" />
          <path d="M0,0 l120,0 l-14,120 l-92,0 Z" fill="none" stroke="#cfe0d8" strokeWidth={1.5} strokeDasharray="6 7" />
        </g>
        {/* threat labels drifting past the useless HUD */}
        {threats.map((tx, i) => {
          const op = interpolate(f, [40 + i * 26, 60 + i * 26, 150 + i * 26, 175 + i * 26], [0, 0.9, 0.9, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return <g key={i} opacity={op}><BoxLabel x={760} y={640 + i * 90} text={tx} fs={26} w={280} h={54} fill="#1c2b28" color="#e06a4a" /></g>;
        })}
      </svg>
      <div style={{position: 'absolute', top: 260, left: 0, right: 0, textAlign: 'center'}}>
        <span style={{fontFamily: BOLD, fontWeight: 900, fontSize: 52, color: '#fff', background: 'rgba(20,29,27,0.85)', padding: '10px 30px', borderRadius: 12, border: `5px solid #e06a4a`}}>WATCHING ≠ SAVING</span>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================= S8: the hard, open number
const S8: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const push = interpolate(f, [0, 90], [1.08, 1.0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const keyIn = interpolate(f, [10, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tagIn = interpolate(f, [40, 58], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const cursor = (f % 30) < 15 ? 1 : 0.1;
  return (
    <AbsoluteFill style={{backgroundColor: INKC}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <rect width={1080} height={1920} fill="#0f1c1a" />
        <g transform={`translate(540,960) scale(${push})`}>
          <rect x={-300} y={-190} width={600} height={380} rx={18} fill="#12201d" stroke={MINT} strokeWidth={5} opacity={0.94} />
          <text x={0} y={40} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={200} fill="#ffffff" opacity={keyIn}>331</text>
          <rect x={150} y={-60} width={10} height={90} fill={MINT} opacity={cursor * keyIn} />
          <g opacity={tagIn}><BoxLabel x={0} y={120} text="OPEN · UPDATED 06/25/2026" fs={28} w={480} h={56} fill={MINT} color={INKC} /></g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ============================================================= S9: the button
const S9: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const forkIn = interpolate(f, [10, 50], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const countdown = 331 - Math.floor(interpolate(f, [50, 150], [0, 41], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const RETURN_AT = 120;
  const back = interpolate(f, [RETURN_AT, RETURN_AT + 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const forkLabelOp = Math.max(0, Math.min(1, (0.55 - back) / 0.55));
  const headerOp = Math.max(0, Math.min(1, (back - 0.55) / 0.45));
  const ravenIn = interpolate(f, [RETURN_AT + 30, RETURN_AT + 52], [-160, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const blow = interpolate(f, [RETURN_AT + 20, RETURN_AT + 44], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // the whale dives under at the button (with real directional motion blur — panel ask)
  const diveY = interpolate(f, [RETURN_AT + 50, RETURN_AT + 100], [0, 360], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
  const diveVy = interpolate(f, [RETURN_AT + 50, RETURN_AT + 75, RETURN_AT + 100], [0, 13, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const diveOp = interpolate(f, [RETURN_AT + 80, RETURN_AT + 105], [1, 0.35], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: INKC}}>
      {/* the fork (fades out as the loop returns) */}
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', opacity: 1 - back}}>
        <rect width={1080} height={1920} fill="#12201d" />
        <text x={540} y={520} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={150} fill="#ffffff">331</text>
        {/* floor branch */}
        <line x1={540} y1={560} x2={900} y2={560 + 0} stroke={MINT} strokeWidth={8} opacity={forkIn} strokeDasharray="1000" strokeDashoffset={(1 - forkIn) * 400} />
        <g transform="translate(760,900)"><Whale x={0} y={0} scale={0.7} f={f} facing={1} mode="cruise" /></g>
        {/* countdown branch */}
        <line x1={540} y1={560} x2={200} y2={900} stroke="#e06a4a" strokeWidth={8} opacity={forkIn} />
        <text x={190} y={960} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={54} fill="#e06a4a" opacity={forkIn}>{countdown}</text>
        <g opacity={forkLabelOp}><BoxLabel x={540} y={360} text="FLOOR or COUNTDOWN?" fs={34} w={520} h={70} fill={PANEL} color={INKC} /></g>
      </svg>
      {/* the loopback: return to the cold-open whale, sensors still on */}
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', opacity: back}}>
        <g opacity={0.5}><g transform="translate(0,-560)"><AnchorageSkylineBG f={f} season="summer" denali floatplane={false} train={false} /></g></g>
        <g transform="translate(0,300)"><WaterColumn f={f} intensity={1} surfaceY={-360} deep={WDEEP} shallow={WSURF} rays={6} /></g>
        <g opacity={diveOp}>
          <MotionBlur vy={diveVy} gain={0.8}>
            <Whale x={520} y={1010 + diveY} scale={1.4} f={f} facing={1} mode="cruise" blow={blow} sweep={0.5} />
          </MotionBlur>
          <g transform={`translate(520,${1005 + diveY})`}>
            <SmellRings cx={-52} cy={0} frame={f} color={MINT} count={3} maxR={260} intensity={0.5} />
            <ScanReticle cx={40} cy={-6} frame={f} lock={0.95} color={GOLD} size={230} />
          </g>
        </g>
        <g transform={`translate(160,${1260 + ravenIn}) scale(1.2)`}><Raven x={0} y={0} f={f} mode="perch" /></g>
      </svg>
      <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', opacity: headerOp}}>
        <span style={{fontFamily: BOLD, fontWeight: 900, fontSize: 48, color: '#fff', background: 'rgba(20,29,27,0.82)', padding: '10px 28px', borderRadius: 12, border: `4px solid ${MINT}`}}>NO MACHINE DECIDES</span>
      </div>
    </AbsoluteFill>
  );
};

const SCENE_COMPONENTS: React.FC<{from?: number}>[] = [S1, S2, S3, S4, S5, S6, S7, S8, S9];
const DEFAULT_BOUNDS: {from: number; dur: number}[] = [
  {from: 0, dur: 168}, {from: 168, dur: 131}, {from: 299, dur: 175},
  {from: 474, dur: 210}, {from: 684, dur: 150}, {from: 834, dur: 150},
  {from: 984, dur: 240}, {from: 1224, dur: 180}, {from: 1404, dur: 240},
];

const GradedGrade: React.FC = () => {
  const f = useCurrentFrame();
  return <GradeLayer f={f} bloom={0.38} vignette={0.44} grain={0.06} warmth={-0.02} />;
};

const CornerChrome: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', pointerEvents: 'none'}}>
      <g transform="translate(78,90) scale(0.4)" opacity={0.75}><Raven x={0} y={0} scale={1} f={f} mode="perch" /></g>
      <g transform="translate(980,96)" opacity={0.85}>
        <circle cx={0} cy={0} r={26} fill="none" stroke={MINT} strokeWidth={3} opacity={0.6} />
        <circle cx={0} cy={0} r={4 + 3 * Math.sin(f / 6)} fill={MINT} opacity={0.7} />
        {[0, 1, 2].map((i) => {
          const ph = ((f / 24) + i / 3) % 1;
          return <circle key={i} cx={0} cy={0} r={6 + ph * 30} fill="none" stroke={MINT} strokeWidth={2} opacity={(1 - ph) * 0.5} />;
        })}
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
  const local = f - Math.round(cue.start * fps);
  const pop = spring({frame: local, fps, config: {damping: 9, stiffness: 130}});
  const scale = interpolate(pop, [0, 1], [0.82, 1], {extrapolateRight: 'clamp'});
  const rise = interpolate(pop, [0, 1], [26, 0], {extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 340, left: 0, right: 0, display: 'flex', justifyContent: 'center', padding: '0 60px'}}>
      <div style={{background: 'rgba(20,29,27,0.84)', borderRadius: 14, padding: '16px 30px', maxWidth: 940, border: `4px solid ${MINT}`, transform: `translateY(${rise}px) scale(${scale})`, transformOrigin: 'center bottom'}}>
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
