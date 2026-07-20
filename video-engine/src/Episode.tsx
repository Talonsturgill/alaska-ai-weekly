import React from 'react';
import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {z} from 'zod';
import {VoiceProvider, useVoice} from './lib/voice';
import {Moose} from './lib/fauna';
import {SpeedLines, ImpactStar, ZoomVignette, SmellRings, ScanReticle} from './lib/FX';
import {INK, ICE, SNOW, OUT, StatBurst, BoxLabel, FatArrow, Stamp, AlaskaMini, ServerMachine, Vale} from './lib/kit';
import {tones, FormGradient, RimLight, ContactShadow, GradeLayer, MotionBlur, IRVision} from './lib/lighting';
import {entrance, accentKick, ChipShadow} from './lib/motion';

const BOLD = 'Arial Black, Arial, sans-serif';

// ---- 2026-07-20 palette (storyboard-locked, 9/9 axes fresh vs last 2) ----
// black-spruce green + boreal midnight-blue -> rose-gold horizon + gunmetal drone
// + electric thermal-IR magenta-to-citron + vermilion fireline.
const NIGHT = '#141F38';
const SKY_MID = '#22335C';
const ROSE = '#E8A87C';
const SUNGLOW = '#F4A65B';
const SPRUCE = '#243A2E';
const SPRUCE_D = '#152318';
const SPRUCE_HI = '#38583f';
const GUN = '#8C99A8';
const EYE = '#FFCE6B';
const IR_MAG = '#FF4FD8';
const IR_COR = '#FF7F6B';
const IR_CIT = '#FFE24A';
const FIRE = '#FF6A2F';
const FIRE_D = '#E8402F';
const TARMAC = '#2b3340';
const CAP_BORDER = '#cfe0f2';

export const episodeSchema = z.object({
  captions: z.array(z.object({text: z.string(), start: z.number(), end: z.number(), seg: z.number()})),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(),
    energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
});
export type EpisodeProps = z.infer<typeof episodeSchema>;

// ================================================================ NenanaRangeBG (NET-NEW biome)
// A boreal AIRSTRIP biome: a flat man-made tarmac foreground with a painted runway
// centerline + edge lights receding to a vanishing point, fronted by a LOW distant
// black-spruce treeline band (3-4 parallax sub-bands, the supporting aerial-depth
// refinement), under a boreal midnight-blue -> rose-gold sky. `dawn` 0..1 warms the
// sky from pre-dawn night to sunrise. Distinct from DawnForestBG (full forest, no
// tarmac) and FrostYardBG (utility yard). Params: dawn, parallax, showStrip.
const NenanaRangeBG: React.FC<{f: number; dawn?: number; parallax?: number; showStrip?: boolean}> = ({
  f, dawn = 0, parallax = 1, showStrip = true,
}) => {
  const d = Math.max(0, Math.min(1, dawn));
  const skyTop = NIGHT;
  const horizon = d > 0.02 ? ROSE : '#2a3a63';
  return (
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
      <defs>
        <linearGradient id="nrSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={skyTop} />
          <stop offset="60%" stopColor={SKY_MID} />
          <stop offset="100%" stopColor={horizon} />
        </linearGradient>
        <linearGradient id="nrGround" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={TARMAC} />
          <stop offset="100%" stopColor="#171d26" />
        </linearGradient>
      </defs>
      <rect width="1080" height="1250" fill="url(#nrSky)" />
      {/* sunrise glow at the horizon, grows with dawn */}
      <ellipse cx={640} cy={1220} rx={520} ry={150} fill={SUNGLOW} opacity={0.10 + 0.32 * d} />
      {/* fading stars up top (second disjoint motion region) */}
      <g opacity={0.6 * (1 - d)}>
        {Array.from({length: 26}).map((_, i) => {
          const x = (i * 173) % 1080;
          const y = (i * 89) % 620;
          const tw = 0.4 + 0.5 * Math.sin(f / 19 + i);
          return <circle key={i} cx={x} cy={y} r={1.7} fill="#fff" opacity={Math.max(0, tw)} />;
        })}
      </g>
      {/* low black-spruce treeline: 3 parallax sub-bands, desaturating toward horizon */}
      {[[1180, SPRUCE_D, 0.20, 46], [1215, '#1c3024', 0.4, 60], [1250, SPRUCE, 0.7, 78]].map(([baseY, col, opac, hh], bi) => (
        <g key={bi} transform={`translate(${-((f * 0.05 * parallax * (bi + 1)) % 120)},0)`}>
          {Array.from({length: 26}).map((_, i) => {
            const x = i * 68 - 60;
            const h = (hh as number) * (0.7 + ((i * 37) % 6) / 10);
            return <path key={i} d={`M${x},${baseY as number} l${18},${-h} l${18},${h} Z`} fill={col as string} opacity={opac as number} />;
          })}
        </g>
      ))}
      {/* tarmac ground */}
      <rect x={0} y={1250} width={1080} height={670} fill="url(#nrGround)" />
      {showStrip && (
        <>
          {/* runway centerline dashes receding to a vanishing point */}
          {Array.from({length: 8}).map((_, i) => {
            const t = i / 8;
            const y = 1300 + t * 560;
            const w = 60 - t * 46;
            return <rect key={i} x={540 - w / 2} y={y} width={w} height={30 - t * 22} rx={4} fill={ROSE} opacity={0.55 - t * 0.3} />;
          })}
          {/* edge lights, two receding rows, gentle blink */}
          {Array.from({length: 7}).map((_, i) => {
            const t = i / 7;
            const y = 1300 + t * 560;
            const spread = 360 - t * 300;
            const on = ((f / 6 + i) % 9) < 6;
            return (
              <g key={i}>
                <circle cx={540 - spread} cy={y} r={7 - t * 4} fill={on ? '#6cc8ff' : '#26507a'} />
                <circle cx={540 + spread} cy={y} r={7 - t * 4} fill={on ? '#6cc8ff' : '#26507a'} />
              </g>
            );
          })}
        </>
      )}
      {/* dawn-mist drift bands */}
      <g opacity={0.28}>
        {[1140, 1320].map((baseY, i) => {
          const y = baseY + 14 * Math.sin(f / 33 + i * 2);
          const x = ((f * (0.8 + i * 0.4) * parallax + i * 500) % 1500) - 260;
          return <ellipse key={i} cx={x} cy={y} rx={280} ry={40} fill="#cfe0f2" opacity={0.5} />;
        })}
      </g>
    </svg>
  );
};

// ================================================================ small helpers
const Flame: React.FC<{x: number; y: number; s: number; f: number; out?: number}> = ({x, y, s, f, out = 0}) => {
  const life = 1 - Math.max(0, Math.min(1, out));
  const flick = 1 + 0.12 * Math.sin(f / 4);
  if (life <= 0.02) return null;
  return (
    <g transform={`translate(${x},${y}) scale(${s * life},${s * life * flick})`} opacity={life}>
      <path d={`M0,0 q${-26},${-30} ${-14},${-70} q${-4},${-30} ${14},${-56} q${-6},34 ${10},${52} q${8 + 4 * Math.sin(f / 5)},${20} 0,${22} q${-14},2 ${-20},${-8} Z`}
        fill={FIRE_D} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d={`M0,-6 q${-14},${-24} ${-6},${-52} q${6},20 ${12},${36} q${4},${16} ${-6},${16} Z`} fill={IR_CIT} opacity={0.85} />
    </g>
  );
};

const HeadCard: React.FC<{text: string; sub?: string; op: number; y?: number}> = ({text, sub, op, y = 300}) => (
  <div style={{position: 'absolute', top: y, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: op}}>
    <div style={{background: IR_CIT, color: INK, fontFamily: BOLD, fontWeight: 900, fontSize: 82, letterSpacing: 1,
      padding: '10px 30px', borderRadius: 12, border: `7px solid ${INK}`, transform: 'rotate(-2deg)', boxShadow: '0 8px 0 rgba(0,0,0,0.35)', textAlign: 'center', lineHeight: 1.02}}>
      {text}
    </div>
    {sub && <div style={{marginTop: 14, background: INK, color: '#fff', fontFamily: BOLD, fontWeight: 900, fontSize: 40, letterSpacing: 2, padding: '6px 22px', borderRadius: 8}}>{sub}</div>}
  </div>
);

// ================================================================ S1 — COLD OPEN (beats 0-1)
const S1: React.FC = () => {
  const f = useCurrentFrame();
  const voice = useVoice();
  // VALE hovers over the dark treeline; eye snaps to lock on the spark by ~1.2s (36f)
  const lock = interpolate(f, [24, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sparkGrow = interpolate(f, [10, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // headline is poster-grade from frame 0 (bold ink present at f0 for FIRST_FRAME);
  // the hook's MOTION by ~1.2s is the eye-snap + spark, not the card's fade-in.
  const headOp = interpolate(f, [0, 10], [0.92, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // beat 1 (~line 1, local ~105f+): ghost controller crossed out
  const ghost = interpolate(f, [110, 130], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const crossT = interpolate(f, [120, 140], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const push = interpolate(f, [0, 120], [1.0, 1.08], {extrapolateRight: 'clamp'});
  const eyeFlick = f > 118 && f < 132 ? 1 : 0;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${push})`, transformOrigin: '540px 760px'}}>
        <NenanaRangeBG f={f} dawn={0} showStrip={false} />
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
          {/* the spark igniting below the treeline */}
          <g transform="translate(540,1230)">
            <circle r={6 + sparkGrow * 10} fill={IR_CIT} opacity={0.9} />
            {sparkGrow > 0.2 && <Flame x={0} y={18} s={0.5 * sparkGrow} f={f} />}
            {[0, 1, 2, 3, 4].map((i) => (
              <circle key={i} cx={Math.cos(i * 1.3 + f / 6) * (14 + sparkGrow * 20)} cy={-Math.abs(Math.sin(i + f / 7)) * (20 + sparkGrow * 30)} r={2.5} fill={IR_COR} opacity={sparkGrow * 0.8} />
            ))}
          </g>
          {/* VALE holding station, eye snaps to lock */}
          <g transform="translate(540,720)">
            <Vale frame={f} scale={1.05} emotion={lock > 0.5 ? 'locked' : 'vigilant'} eyeLock={lock} accent={voice.accentAt(f)} />
          </g>
          {/* ghost controller + cross (beat 1) */}
          {ghost > 0.02 && (
            <g transform="translate(300,1120)" opacity={ghost}>
              <rect x={-70} y={-34} width={140} height={68} rx={14} fill="#5a6b86" stroke={INK} strokeWidth={5} opacity={0.7} />
              <circle cx={-40} cy={0} r={12} fill="#3a4a63" stroke={INK} strokeWidth={4} />
              <circle cx={40} cy={0} r={12} fill="#3a4a63" stroke={INK} strokeWidth={4} />
              <ellipse cx={0} cy={-58} rx={40} ry={20} fill="#c9d6e8" opacity={0.5} />
            </g>
          )}
          {crossT > 0.02 && (
            <g transform="translate(300,1120)" opacity={crossT}>
              <line x1={-86} y1={-52} x2={86} y2={52} stroke={FIRE_D} strokeWidth={16} strokeLinecap="round" />
              <line x1={86} y1={-52} x2={-86} y2={52} stroke={FIRE_D} strokeWidth={16} strokeLinecap="round" />
            </g>
          )}
        </svg>
      </div>
      {lock > 0.8 && f < 52 && <ZoomVignette amount={interpolate(f, [40, 50], [0, 0.5], {extrapolateRight: 'clamp'})} />}
      <HeadCard text="FIREFIGHTING ROBOTS." sub="TESTED IN ALASKA" op={headOp} />
      {crossT > 0.3 && <div style={{position: 'absolute', top: 1230, left: 0, right: 0, textAlign: 'center', fontFamily: BOLD, fontWeight: 900, fontSize: 54, color: '#fff', opacity: crossT, textShadow: '2px 3px 0 #000'}}>NO CREW  ·  NO PILOT</div>}
    </AbsoluteFill>
  );
};

// ================================================================ S2 — SETUP (beats 2-4)
const S2: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  // beat 2 (~0-3.5s): XPRIZE badge slam
  const badge = spring({frame: f - 6, fps, config: {damping: 12, stiffness: 170}});
  const ringWind = interpolate(f, [18, 54], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // beat 3 (~3.5-7s / local ~105f): funnel 300->3
  const funnelT = interpolate(f, [96, 150], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const platesIn = interpolate(f, [150, 180], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dualTag = interpolate(f, [186, 200], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // beat 4 (~7-10.5s / local ~210f): pin drops on Alaska
  const mapIn = interpolate(f, [206, 236], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const stage = f < 190 ? 0 : 1;   // 0 = badge+funnel, 1 = map+pin
  const finalists = ['ANDURIL', 'AURA FORESIGHT', 'DRYAD'];
  return (
    <AbsoluteFill style={{backgroundColor: NIGHT}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <rect width="1080" height="1920" fill="url(#nrSky)" opacity={0.5} />
        {/* HUD scanline shimmer */}
        {Array.from({length: 14}).map((_, i) => <line key={i} x1={0} y1={i * 140 + (f % 140)} x2={1080} y2={i * 140 + (f % 140)} stroke={IR_MAG} strokeWidth={1} opacity={0.05} />)}
      </svg>
      {stage === 0 && (
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
          {/* XPRIZE badge */}
          <g transform={`translate(540,560) scale(${0.5 + badge * 0.6})`}>
            <StatBurst cx={0} cy={0} big="$11M" lines={['XPRIZE WILDFIRE', '4 YEARS']} fill={IR_CIT} big_fs={92} />
            <g transform="rotate(-90)" opacity={0.5}>
              <circle r={190} fill="none" stroke={IR_COR} strokeWidth={6} strokeDasharray={`${ringWind * 1194} 1194`} />
            </g>
          </g>
          {/* funnel 300 -> 3 */}
          {funnelT > 0.02 && (
            <g transform="translate(540,1080)" opacity={Math.min(1, funnelT * 2)}>
              <path d="M-260,0 L260,0 L120,220 L-120,220 Z" fill="#1b2740" stroke={INK} strokeWidth={7} opacity={0.85} />
              <text x={0} y={-24} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={48} fill="#fff">~300 TEAMS</text>
              {Array.from({length: 22}).map((_, i) => {
                const prog = (funnelT * 1.6 + i / 22) % 1;
                const cx = Math.cos(i * 2.1) * 220 * (1 - prog);
                const cy = prog * 210;
                return <rect key={i} x={cx - 9} y={cy - 9} width={18} height={18} rx={3} fill={STEELish(i)} opacity={1 - prog} />;
              })}
              {/* 3 finalist plates clank out */}
              {finalists.map((n, i) => (
                <g key={i} transform={`translate(${(i - 1) * 240},${300 + (1 - platesIn) * 40})`} opacity={platesIn}>
                  <rect x={-112} y={-34} width={224} height={68} rx={10} fill={ICE} stroke={INK} strokeWidth={6} />
                  <text x={0} y={9} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={n.length > 10 ? 23 : n.length > 8 ? 30 : 38} fill={INK}>{n}</text>
                  {i === 0 && dualTag > 0.1 && (
                    <g transform="translate(0,-56)" opacity={dualTag}>
                      <rect x={-96} y={-20} width={192} height={34} rx={6} fill={IR_MAG} stroke={INK} strokeWidth={4} />
                      <text x={0} y={4} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={20} fill="#fff">DEFENSE PRIME · DUAL-USE</text>
                    </g>
                  )}
                </g>
              ))}
              <text x={0} y={340 + 44} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={26} fill={IR_CIT}>3 FINALISTS · Autonomous Wildfire Response track</text>
            </g>
          )}
        </svg>
      )}
      {stage === 1 && (
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
          <g transform={`translate(300,700) scale(${1.4 * mapIn + 0.001})`} opacity={mapIn}>
            <AlaskaMini frame={f} x={0} y={0} scale={1} pin={mapIn > 0.6} />
          </g>
          {mapIn > 0.6 && (
            <g transform="translate(720,760)" opacity={interpolate(f, [230, 250], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
              <BoxLabel x={0} y={0} text="NENANA" sub="ALASKA" w={300} h={96} fs={54} fill={IR_CIT} />
            </g>
          )}
        </svg>
      )}
    </AbsoluteFill>
  );
};
function STEELish(i: number) { return ['#5d7fae', '#7fa1cc', '#4a5a78'][i % 3]; }

// ================================================================ S3 — ALASKA AIRSPACE (beats 5-6)
const S3: React.FC = () => {
  const f = useCurrentFrame();
  // beat 5 (airspace grid sweep over the map + ACUASI nameplate) — scene dur ~143f
  const sweep = interpolate(f, [6, 50], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const nameIn = interpolate(f, [34, 58], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // beat 6 (dive through the pin into the treeline, Moose alert)
  const dive = interpolate(f, [60, 98], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const mapScale = 1 + dive * 5;
  const showGround = dive > 0.55;
  const mooseAlert = interpolate(f, [100, 134], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: NIGHT}}>
      {!showGround ? (
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
          <rect width="1080" height="1920" fill="url(#nrSky)" opacity={0.55} />
          <g transform={`translate(540,900) scale(${1.5 * mapScale}) translate(-240,-130)`} opacity={dive < 0.8 ? 1 : interpolate(dive, [0.8, 1], [1, 0])}>
            <AlaskaMini frame={f} x={0} y={0} scale={1} pin pinLabel="NENANA" />
            {/* airspace lattice sweeping across */}
            <g opacity={0.85}>
              {Array.from({length: 12}).map((_, i) => {
                const gx = i * 44;
                const on = gx / 528 < sweep;
                return on ? <line key={`v${i}`} x1={gx} y1={20} x2={gx} y2={280} stroke={IR_CIT} strokeWidth={2} opacity={0.5} /> : null;
              })}
              {Array.from({length: 7}).map((_, i) => {
                const gy = 20 + i * 44;
                const on = (i * 44) / 264 < sweep;
                return on ? <line key={`h${i}`} x1={0} y1={gy} x2={528} y2={gy} stroke={IR_CIT} strokeWidth={2} opacity={0.5} /> : null;
              })}
              {/* a drifting aircraft blip on the lattice */}
              <circle cx={80 + (f * 2) % 400} cy={120} r={5} fill={IR_MAG} />
            </g>
          </g>
        </svg>
      ) : (
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
          <NenanaRangeBG f={f} dawn={0.15} parallax={1.3} showStrip={false} />
          {/* Moose watcher on the treeline, alert (new pose) */}
          <g transform="translate(210,1360) scale(0.8)">
            <Moose x={0} y={0} f={f} facing={1} emotion="calm" alert={mooseAlert} />
          </g>
        </svg>
      )}
      {nameIn > 0.02 && !showGround && (
        <div style={{position: 'absolute', top: 1340, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: nameIn}}>
          <div style={{background: INK, color: '#fff', fontFamily: BOLD, fontWeight: 900, fontSize: 46, padding: '10px 28px', borderRadius: 10, border: `5px solid ${IR_CIT}`, textAlign: 'center'}}>UAF ACUASI</div>
          <div style={{marginTop: 8, background: 'rgba(16,20,30,0.85)', color: '#fff', fontFamily: BOLD, fontWeight: 700, fontSize: 30, padding: '6px 18px', borderRadius: 8}}>managed the airspace · Dr. Catherine Cahill, Director</div>
        </div>
      )}
      {showGround && (
        <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', fontFamily: BOLD, fontWeight: 900, fontSize: 40, color: '#fff', textShadow: '2px 3px 0 #000'}}>NENANA · June 15-28, 2026</div>
      )}
    </AbsoluteFill>
  );
};

// ================================================================ S4 — MECHANISM / SIGNATURE (beats 7-9)
const S4: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const voice = useVoice();
  // beat 7 (sensor smells smoke (rings), VALE eye wakes) — scene dur ~260f
  const sniff = interpolate(f, [6, 44], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wake = interpolate(f, [28, 52], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // beat 8 (launch + IR reticle lock, the snap-zoom peak)
  const launch = spring({frame: f - 80, fps, config: {damping: 13, stiffness: 130}});
  const lock = interpolate(f, [124, 142], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const irOn = interpolate(f, [104, 134], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const snapZoom = interpolate(f, [138, 150, 176], [1, 2.3, 1.5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // beat 9 (suppressant drop, fire out)
  const drop = interpolate(f, [180, 212], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fireOut = interpolate(f, [206, 246], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const valeX = 300 + launch * 240;
  const valeY = 640 - launch * 40 + 30 * Math.sin(f / 12);
  const vx = launch > 0.02 && launch < 0.98 ? 22 : 0;
  const heatX = 700, heatY = 1180;
  return (
    <AbsoluteFill style={{backgroundColor: NIGHT}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${snapZoom})`, transformOrigin: `${valeX}px ${valeY}px`}}>
        <NenanaRangeBG f={f} dawn={0.1} parallax={1.6} showStrip={false} />
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
          {/* the fire on the range floor */}
          <Flame x={heatX} y={1210} s={1.3} f={f} out={fireOut} />
          {/* sensor node on a spruce trunk, smelling smoke */}
          <g transform="translate(430,1150)">
            <rect x={-10} y={0} width={20} height={80} fill={SPRUCE_D} stroke={INK} strokeWidth={4} />
            <SmellRings cx={0} cy={-6} frame={f} intensity={sniff} maxR={300} />
          </g>
          {/* smoke wisps */}
          {sniff > 0.2 && Array.from({length: 5}).map((_, i) => (
            <ellipse key={i} cx={heatX - 20 + 30 * Math.sin(f / 20 + i)} cy={1150 - ((f * 1.4 + i * 40) % 240)} rx={26} ry={18} fill="#6b7280" opacity={0.25 * sniff * (1 - fireOut)} />
          ))}
          {/* VALE flying out, then locking + dropping */}
          <g transform={`translate(${valeX},${valeY})`}>
            <MotionBlur vx={vx} gain={0.6}>
              <Vale frame={f} scale={0.8} emotion={lock > 0.5 ? 'locked' : 'resolute'} eyeLock={lock} accent={voice.accentAt(f)} />
            </MotionBlur>
          </g>
          {/* suppressant arc + splash */}
          {drop > 0.02 && drop < 1 && (
            <path d={`M${valeX},${valeY + 70} Q${(valeX + heatX) / 2},${valeY - 40} ${heatX},1200`} fill="none" stroke="#8fd4ff" strokeWidth={16 * (1 - drop)} strokeLinecap="round" opacity={0.85} />
          )}
          {fireOut > 0.1 && fireOut < 1 && (
            <g opacity={1 - fireOut}>{Array.from({length: 8}).map((_, i) => (
              <ellipse key={i} cx={heatX + Math.cos(i) * 40 * fireOut} cy={1180 - ((f * 2 + i * 30) % 200) * fireOut} rx={30} ry={22} fill="#e8eef5" opacity={0.4 * fireOut} />
            ))}</g>
          )}
        </svg>
        {/* the IR thermal-vision look, on during the lock (the drone's-eye view) */}
        <IRVision f={f} amount={irOn * (1 - fireOut)} heat={{x: heatX, y: heatY, r: 300}} tag="THERMAL" />
        {lock > 0.05 && (
          <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
            <ScanReticle cx={heatX} cy={1195} frame={f} lock={lock} size={170} />
          </svg>
        )}
      </div>
      {lock > 0.55 && f < 176 && (
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
          <SpeedLines cx={heatX} cy={1195} frame={f} intensity={interpolate(f, [156, 168], [1, 0], {extrapolateRight: 'clamp'})} color={IR_CIT} />
          <ImpactStar cx={heatX} cy={1195} r={interpolate(f, [154, 162], [0, 70], {extrapolateRight: 'clamp'})} color={IR_CIT} />
        </svg>
      )}
      <HeadCard text="THERMAL LOCK" op={interpolate(f, [138, 152, 190, 202], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} y={230} />
      {drop > 0.3 && <div style={{position: 'absolute', top: 1560, left: 0, right: 0, textAlign: 'center', fontFamily: BOLD, fontWeight: 900, fontSize: 44, color: '#fff', textShadow: '2px 3px 0 #000', opacity: Math.min(1, drop)}}>up to 100 L suppressant · per Dryad</div>}
    </AbsoluteFill>
  );
};

// ================================================================ S5 — THE TURN (beats 10-11)
const S5: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const voice = useVoice();
  // beat 10 (~0-3.5s): DRYAD SAYS readout ribbon off VALE, over drifting steam
  const ribbon = interpolate(f, [8, 44], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const quote = "...no longer a vision. It is a reality.";
  const chars = Math.floor(interpolate(f, [16, 70], [0, quote.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const stamp = spring({frame: f - 72, fps, config: {damping: 9, stiffness: 200}});
  const stage = f < 96 ? 0 : 1;
  // beat 11 (~3.5-7s): megafire wall rises to dwarf the test flame
  const wall = interpolate(f, [100, 150], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: NIGHT}}>
      {stage === 0 ? (
        <>
          <NenanaRangeBG f={f} dawn={0.12} showStrip={false} />
          <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
            {/* drifting steam from the doused fire */}
            {Array.from({length: 6}).map((_, i) => (
              <ellipse key={i} cx={640 + 40 * Math.sin(f / 18 + i)} cy={1240 - ((f * 1.2 + i * 50) % 300)} rx={40} ry={26} fill="#e8eef5" opacity={0.22} />
            ))}
            {/* VALE hovering, a readout ribbon unspooling from its hull */}
            <g transform="translate(300,760)"><Vale frame={f} scale={0.9} emotion="calm" eyeLock={0.2} accent={voice.accentAt(f)} /></g>
            {ribbon > 0.02 && (
              <g transform="translate(420,760)" opacity={ribbon}>
                <path d={`M0,0 L${520 * ribbon},0`} stroke={IR_CIT} strokeWidth={4} />
                <rect x={40} y={-70} width={560} height={150} rx={12} fill="#0f1626" stroke={IR_CIT} strokeWidth={5} opacity={0.95} />
                <text x={64} y={-24} fontFamily={BOLD} fontWeight={900} fontSize={30} fill="#fff">{quote.slice(0, chars)}</text>
                <text x={64} y={42} fontFamily={BOLD} fontWeight={700} fontSize={24} fill={IR_COR}>- Carsten Brinkschulte, CEO, Dryad</text>
              </g>
            )}
          </svg>
          {stamp > 0.05 && <Stamp cx={700} cy={640} s={stamp} text="DRYAD SAYS" rot={-14} color={IR_MAG} />}
        </>
      ) : (
        <>
          <NenanaRangeBG f={f} dawn={0.05} showStrip={false} />
          <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
            {/* the towering megafire wall rising, spreading across a roadless horizon */}
            <g opacity={Math.min(1, wall * 1.2)}>
              <path d={`M0,1920 L0,${1300 - wall * 700} Q270,${1180 - wall * 760} 540,${1280 - wall * 700} Q810,${1180 - wall * 760} 1080,${1300 - wall * 700} L1080,1920 Z`}
                fill={FIRE_D} stroke={INK} strokeWidth={6} />
              <path d={`M0,1920 L0,${1420 - wall * 620} Q300,${1320 - wall * 660} 640,${1400 - wall * 620} Q900,${1330 - wall * 660} 1080,${1420 - wall * 620} L1080,1920 Z`}
                fill={FIRE} opacity={0.85} />
              {/* flame licks along the ridge */}
              {Array.from({length: 10}).map((_, i) => (
                <path key={i} d={`M${60 + i * 108},${1300 - wall * 690} q${-16},${-46 - 10 * Math.sin(f / 5 + i)} 0,${-84} q16,40 0,84 Z`} fill={IR_CIT} opacity={0.7 * wall} />
              ))}
              {/* roiling smoke + ash */}
              {Array.from({length: 8}).map((_, i) => (
                <ellipse key={i} cx={100 + i * 130} cy={(1200 - wall * 700) - ((f * 1.5 + i * 40) % 300)} rx={70} ry={50} fill="#4a4038" opacity={0.35 * wall} />
              ))}
            </g>
            {/* the tiny fenced test flame + small VALE, dwarfed */}
            <g transform="translate(540,1560)">
              <rect x={-90} y={-10} width={180} height={12} fill="#6b7280" stroke={INK} strokeWidth={3} />
              <Flame x={0} y={-10} s={0.4} f={f} />
              <g transform="translate(120,-30) scale(0.32)"><Vale frame={f} scale={1} emotion="calm" eyeLock={0.1} /></g>
              <text x={0} y={60} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={30} fill="#fff" style={{textShadow: '2px 2px 0 #000'} as any}>one test ignition</text>
            </g>
          </svg>
          <div style={{position: 'absolute', top: 340, left: 0, right: 0, textAlign: 'center', fontFamily: BOLD, fontWeight: 900, fontSize: 52, color: IR_CIT, textShadow: '2px 3px 0 #000', opacity: wall}}>NOT a roadless megafire</div>
        </>
      )}
    </AbsoluteFill>
  );
};

// ================================================================ S6 — BUTTON (beats 12-14)
const S6: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const voice = useVoice();
  // beat 12 (~0-3.5s): pending trophy on September
  const trophyFlick = 0.5 + 0.5 * Math.sin(f / 5);
  const pendStamp = spring({frame: f - 30, fps, config: {damping: 10, stiffness: 180}});
  // beat 13 (~3.5-7s / local ~105f): extraction rig recedes vs VALE guarding
  const serverShrink = interpolate(f, [110, 160], [1, 0.2], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const serverX = interpolate(f, [110, 170], [640, 1200], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const armPull = interpolate(f, [104, 128], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // beat 14 (~7-14s / local ~210f): VALE liftoff, dawn, ACUASI lower-third (signature)
  const dawn = interpolate(f, [210, 300], [0.2, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const liftoff = spring({frame: f - 220, fps, config: {damping: 15, stiffness: 90}});
  const stage = f < 96 ? 0 : (f < 200 ? 1 : 2);
  return (
    <AbsoluteFill style={{backgroundColor: NIGHT}}>
      {stage === 0 && (
        <>
          <NenanaRangeBG f={f} dawn={0.12} showStrip={false} />
          <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
            {/* dashed-ghost pending trophy on a calendar */}
            <g transform="translate(540,820)" opacity={0.5 + 0.5 * trophyFlick}>
              <path d="M-60,-80 h120 v30 a60,60 0 0 1 -120,0 Z" fill="none" stroke={IR_CIT} strokeWidth={6} strokeDasharray="12 10" />
              <rect x={-20} y={-10} width={40} height={50} fill="none" stroke={IR_CIT} strokeWidth={6} strokeDasharray="12 10" />
              <rect x={-56} y={40} width={112} height={20} rx={5} fill="none" stroke={IR_CIT} strokeWidth={6} strokeDasharray="12 10" />
            </g>
            <g transform="translate(540,1060)">
              <rect x={-180} y={-70} width={360} height={140} rx={12} fill="#0f1626" stroke="#fff" strokeWidth={5} />
              <text x={0} y={-10} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={64} fill="#fff">SEPTEMBER</text>
              <text x={0} y={44} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={40} fill={IR_COR}>2026</text>
            </g>
          </svg>
          {pendStamp > 0.05 && <Stamp cx={540} cy={900} s={pendStamp} text="JUDGING PENDING" rot={-8} color="#9fb2d6" />}
        </>
      )}
      {stage === 1 && (
        <>
          <NenanaRangeBG f={f} dawn={0.35} showStrip={false} />
          <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
            {/* the greedy extraction machine drives a pipe into the land + drags a
                resource-arrow OUT, then recedes (take), vs VALE shielding the treeline */}
            <g transform={`translate(${serverX},900) scale(${serverShrink})`} opacity={serverShrink}>
              <ServerMachine frame={f} x={0} y={0} scale={0.7} emotion="ghost" />
              {/* pipe into the land + reversed resource arrow */}
              <path d="M-20,180 L-20,300" stroke={INK} strokeWidth={14} />
              <g opacity={armPull}>
                <FatArrow d="M-20,300 L-20,120" revealT={armPull} color={IR_MAG} head={[-20, 120]} headRot={-90} />
              </g>
            </g>
            {/* VALE plants a shielding guard stance over the treeline */}
            <g transform="translate(360,1120)"><Vale frame={f} scale={1.0} emotion="resolute" eyeLock={0.4} accent={voice.accentAt(f)} groundY={200} /></g>
            {/* Moose watching, smug (alert eases to calm) */}
            <g transform="translate(840,1340) scale(0.6)"><Moose x={0} y={0} f={f} facing={-1} emotion="calm" alert={0.4} /></g>
          </svg>
          <div style={{position: 'absolute', top: 320, left: 0, right: 0, textAlign: 'center'}}>
            <span style={{fontFamily: BOLD, fontWeight: 900, fontSize: 46, color: '#fff', background: 'rgba(16,20,30,0.8)', padding: '8px 24px', borderRadius: 10, textShadow: '2px 2px 0 #000'}}>not TAKING from the land · PROTECTING it</span>
          </div>
        </>
      )}
      {stage === 2 && (
        <>
          <NenanaRangeBG f={f} dawn={dawn} parallax={1} showStrip />
          <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
            {/* VALE lifting off the airstrip at dawn (signature shot), loops to the open */}
            <g transform={`translate(540,${1300 - liftoff * 420})`}>
              <MotionBlur vy={liftoff > 0.05 && liftoff < 0.95 ? 14 : 0} gain={0.6}>
                <Vale frame={f} scale={1.15} emotion="resolute" eyeLock={0.3} accent={voice.accentAt(f)} groundY={liftoff < 0.1 ? 150 : undefined} />
              </MotionBlur>
            </g>
          </svg>
          <div style={{position: 'absolute', bottom: 470, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{background: INK, color: '#fff', fontFamily: BOLD, fontWeight: 900, fontSize: 40, padding: '10px 26px', borderRadius: 10, border: `5px solid ${IR_CIT}`}}>UAF ACUASI · Nenana, Alaska</div>
            <div style={{marginTop: 10, background: IR_CIT, color: INK, fontFamily: BOLD, fontWeight: 900, fontSize: 44, padding: '8px 24px', borderRadius: 10, transform: 'rotate(-1.5deg)'}}>Alaska built the RANGE</div>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

// ================================================================ TIMELINE
const SCENE_COMPONENTS: React.FC[] = [S1, S2, S3, S4, S5, S6];
const DEFAULT_BOUNDS: {from: number; dur: number}[] = [
  {from: 0, dur: 210}, {from: 210, dur: 315}, {from: 525, dur: 210},
  {from: 735, dur: 315}, {from: 1050, dur: 240}, {from: 1290, dur: 420},
];

const GradedGrade: React.FC = () => {
  const f = useCurrentFrame();
  return <GradeLayer f={f} bloom={0.5} vignette={0.5} grain={0.05} warmth={0.06} />;
};

// Persistent thermal-telemetry dial chrome, top corners (LIVING_SCREEN: two large,
// high-contrast, spatially isolated motion regions), in the run's IR palette.
const TelemetryDial: React.FC<{x: number; y: number; f: number; color: string; phase: number}> = ({x, y, f, color, phase}) => {
  const spin = (f * 5 + phase * 90) % 360;
  const pulse = 1 + 0.14 * Math.sin(f / 10 + phase);
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r={44 * pulse} fill="#0f1522" stroke={color} strokeWidth={5} opacity={0.9} />
      <circle r={30} fill="none" stroke={color} strokeWidth={2.5} opacity={0.5} />
      <g transform={`rotate(${spin})`}><rect x={-3} y={-38} width={6} height={30} rx={3} fill={color} /></g>
      <circle r={5} fill={color} />
    </g>
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
      <div style={{background: 'rgba(16,20,30,0.82)', borderRadius: 14, padding: '16px 30px', maxWidth: 940, border: `4px solid ${CAP_BORDER}`}}>
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
    <AbsoluteFillWithTelemetry>
      <VoiceProvider data={voice}>
        {SCENE_COMPONENTS.map((C, i) => (
          <Sequence key={i} from={bounds[i].from} durationInFrames={bounds[i].dur} name={`S${i + 1}`}>
            <C />
          </Sequence>
        ))}
        <GradedGrade />
        <Captions captions={captions} />
      </VoiceProvider>
    </AbsoluteFillWithTelemetry>
  );
};

const AbsoluteFillWithTelemetry: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: NIGHT}}>
      {children}
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', pointerEvents: 'none'}}>
        <TelemetryDial x={90} y={100} f={f} color={IR_CIT} phase={0} />
        <TelemetryDial x={990} y={100} f={f} color={IR_MAG} phase={1} />
      </svg>
    </AbsoluteFill>
  );
};
