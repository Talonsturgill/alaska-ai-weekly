import React from 'react';
import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {z} from 'zod';
import {Character} from './lib/Character';
import {SpeedLines, ImpactStar, PaperStorm, ZoomVignette} from './lib/FX';
import {
  INK, RED, RED_D, AMBER, AMBER_D, ICE, SNOW, STEEL, STEEL_D, LAND_D, CYAN, OUT,
  burst, BoxLabel, StatBurst, FatArrow, Stamp, ServerMachine, AlaskaMini,
} from './lib/kit';

const BOLD = 'Arial Black, Arial, sans-serif';
const NAVY = '#141b3d';
const NAVY_GLOW = '#27356e';
const RAY = '#1c2752';

export const episodeSchema = z.object({
  captions: z.array(z.object({text: z.string(), start: z.number(), end: z.number(), seg: z.number()})),
  // scene frame boundaries, computed from the VO line timings (scripts/build_scenes.py)
  // so the timeline auto-resyncs when the narration changes. Optional; falls back to defaults.
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
});
export type EpisodeProps = z.infer<typeof episodeSchema>;

// ---------------------------------------------------------------- backgrounds
const BurstBG: React.FC<{f: number; tone?: 'navy' | 'ember'}> = ({f, tone = 'navy'}) => {
  const c = tone === 'navy' ? {bg: NAVY, glow: NAVY_GLOW, ray: RAY} : {bg: '#3a1c14', glow: '#6e3a27', ray: '#52281c'};
  return (
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
      <radialGradient id={`g_${tone}`} cx="50%" cy="46%" r="60%">
        <stop offset="0%" stopColor={c.glow} />
        <stop offset="100%" stopColor={c.bg} />
      </radialGradient>
      <rect width="1080" height="1920" fill={`url(#g_${tone})`} />
      <g transform={`rotate(${f * 0.06} 540 900)`} opacity={0.8}>
        {Array.from({length: 14}).map((_, i) => (
          <path key={i} d="M540,900 L455,-700 L625,-700 Z" fill={c.ray} transform={`rotate(${(i * 360) / 14} 540 900)`} />
        ))}
      </g>
    </svg>
  );
};

const TundraBG: React.FC<{f: number; push: number}> = ({f, push}) => (
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
    <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#2a3f66" />
      <stop offset="100%" stopColor="#4a6a94" />
    </linearGradient>
    <rect width="1080" height="1320" fill="url(#sky2)" />
    <circle cx="852" cy="360" r="86" fill="#f2e8c8" opacity={0.9} />
    <circle cx="852" cy="360" r="132" fill="#f2e8c8" opacity={0.22} />
    <g transform={`translate(${-6 * (push - 1) * 30},0)`}>
      {[[0, 770, 260], [250, 706, 300], [540, 748, 300], [820, 700, 320]].map(([x0, peakY, w], i) => (
        <g key={i}>
          <path d={`M${x0 - 40},1330 L${x0 + w / 2},${peakY} L${x0 + w + 40},1330 Z`} fill={i % 2 ? '#8fa3b8' : '#71869c'} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <path d={`M${x0 + w / 2 - w * 0.12},${peakY + 80} L${x0 + w / 2},${peakY} L${x0 + w / 2 + w * 0.12},${peakY + 80} L${x0 + w / 2 + w * 0.05},${peakY + 60} L${x0 + w / 2},${peakY + 82} L${x0 + w / 2 - w * 0.06},${peakY + 58} Z`} fill="#fff" stroke={INK} strokeWidth={4} />
        </g>
      ))}
    </g>
    <rect x="0" y="1300" width="1080" height="620" fill="#7a8a5e" />
    <path d="M0,1300 q270,-24 540,0 q270,24 540,0 L1080,1920 L0,1920 Z" fill={LAND_D} opacity={0.45} />
    {[120, 360, 720, 960].map((tx, i) => (
      <g key={i} transform={`translate(${tx},${1380 + (i % 2) * 120})`}>
        <path d="M-16,0 q4,-26 10,-30 M0,0 q0,-30 4,-34 M16,0 q-2,-24 -10,-30" fill="none" stroke="#5e6c47" strokeWidth={6} strokeLinecap="round" />
      </g>
    ))}
  </svg>
);

// ================================================================ S1 HOOK + APPETITE
const S1: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const headIn = spring({frame: f - 4, fps, config: {damping: 12, stiffness: 120}});
  const akIn = spring({frame: f - 30, fps, config: {damping: 13, stiffness: 90}});
  const machIn = spring({frame: f - 16, fps, config: {damping: 12, stiffness: 90}});
  const akFloat = 6 * Math.sin(f / 26);
  const lookX = 10 + 6 * Math.sin(f / 40);
  // plug reach + gigawatt around L1 (~f96+)
  const plugT = interpolate(f, [150, 196], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const sqT = spring({frame: f - 120, fps, config: {damping: 10, stiffness: 130}});
  const gwT = spring({frame: f - 210, fps, config: {damping: 8, stiffness: 150}});
  const gwPump = 1 + 0.06 * Math.sin(f / 5) * (gwT > 0.5 ? 1 : 0);
  return (
    <AbsoluteFill style={{backgroundColor: NAVY}}>
      <BurstBG f={f} />
      {/* Alaska floating */}
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', transform: `translateY(${akFloat - 50 * (1 - akIn)}px)`, opacity: akIn}}>
        <AlaskaMini frame={f} x={150} y={360} scale={1.4} />
        <g opacity={sqT}>
          <BoxLabel x={735} y={470} text="1 SQUARE MILE" w={320} h={62} fs={34} fill={ICE} rot={3} />
        </g>
      </svg>
      {/* Machine */}
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', transform: `translateY(${180 * (1 - machIn)}px)`, opacity: machIn}}>
        <g transform="translate(560,1740)">
          <ServerMachine frame={f} emotion="greedy" scale={1.12} lookX={lookX} />
        </g>
        {/* plug arm reaching up-left toward the pin */}
        <g opacity={plugT > 0.02 ? 1 : 0}>
          <FatArrow d="M690,1230 C 840,1040 760,720 610,556" revealT={plugT} color={AMBER} head={[610, 556]} headRot={-46} />
        </g>
        {/* GIGAWATT plug label that pumps up */}
        {gwT > 0.02 && (
          <g transform={`translate(770,690) scale(${gwT * gwPump})`}>
            <StatBurst cx={0} cy={0} big="1+ GW" lines={['GIGAWATT']} fill={AMBER} rot={-6} big_fs={70} />
          </g>
        )}
      </svg>
      {/* headline */}
      <div style={{position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `translateY(${-150 * (1 - headIn)}px) rotate(-2deg)`}}>
        <div style={{background: RED, border: `9px solid ${INK}`, borderRadius: 14, padding: '22px 40px', boxShadow: `0 13px 0 ${INK}55`, maxWidth: 860}}>
          <div style={{fontFamily: BOLD, fontWeight: 900, fontSize: 82, lineHeight: 1.03, color: '#fff', textAlign: 'center', textTransform: 'uppercase', textShadow: `4px 5px 0 ${RED_D}`}}>
            The AI Boom Wants Alaska
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================ S2 SCALE-STACK
const S2: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const barA = interpolate(f, [10, 46], [0, 470], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}); // urban AK
  const barB = interpolate(f, [58, 104], [0, 660], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}); // one building
  const tickIn = spring({frame: f - 108, fps, config: {damping: 9, stiffness: 150}});
  const baseY = 1560;
  return (
    <AbsoluteFill style={{backgroundColor: NAVY}}>
      <BurstBG f={f} />
      <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', fontFamily: BOLD, fontWeight: 900, fontSize: 62, color: '#fff', textShadow: `3px 4px 0 ${INK}`}}>ONE BUILDING</div>
      <div style={{position: 'absolute', top: 232, width: '100%', textAlign: 'center', fontFamily: BOLD, fontWeight: 900, fontSize: 26, color: ICE, opacity: 0.85}}>vs all of urban Alaska's peak power demand &middot; Northern Journal</div>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        {/* ground line */}
        <path d={`M120,${baseY} h840`} stroke={INK} strokeWidth={8} strokeLinecap="round" />
        {/* Bar A: all urban Alaska (cities/lights) */}
        <g>
          <rect x={230} y={baseY - barA} width={230} height={barA} rx={8} fill={STEEL} stroke={INK} strokeWidth={OUT} />
          <rect x={230} y={baseY - barA} width={70} height={Math.min(barA, 300)} rx={8} fill="#7fa1cc" opacity={0.5} />
          {/* little windows */}
          {barA > 60 && Array.from({length: Math.floor(barA / 46)}).map((_, i) => (
            <g key={i}>
              <rect x={258} y={baseY - 34 - i * 46} width={22} height={22} fill={AMBER} stroke={INK} strokeWidth={3} />
              <rect x={330} y={baseY - 34 - i * 46} width={22} height={22} fill={AMBER} stroke={INK} strokeWidth={3} />
            </g>
          ))}
          <BoxLabel x={345} y={baseY + 66} text="ALL URBAN ALASKA" w={340} h={56} fs={28} fill={ICE} />
        </g>
        {/* Bar B: one data center, taller, casts a shadow on A */}
        <g>
          {barB > 20 && <path d={`M620,${baseY - barB} L620,${baseY} L470,${baseY} L470,${baseY - Math.min(barA, barB)} Z`} fill={INK} opacity={0.22} />}
          <rect x={620} y={baseY - barB} width={250} height={barB} rx={8} fill={RED} stroke={INK} strokeWidth={OUT} />
          <rect x={620} y={baseY - barB} width={72} height={Math.min(barB, 340)} rx={8} fill="#ff6a52" opacity={0.55} />
          {/* server rack seams */}
          {barB > 80 && Array.from({length: Math.floor(barB / 60)}).map((_, i) => (
            <path key={i} d={`M628,${baseY - 40 - i * 60} h234`} stroke={INK} strokeWidth={4} opacity={0.7} />
          ))}
          <BoxLabel x={745} y={baseY + 66} text="ONE DATA CENTER" w={300} h={56} fs={28} fill={RED} color="#fff" />
        </g>
        {/* dashed guide from top of urban-AK bar across to the data-center bar */}
        {tickIn > 0.02 && (
          <path d={`M345,${baseY - barA} L745,${baseY - barA}`} stroke={AMBER} strokeWidth={6} strokeDasharray="14 10" opacity={0.85 * tickIn} />
        )}
        {/* +30% badge: the hardest number, parked at the overshoot of the red bar */}
        {tickIn > 0.02 && (
          <g transform={`translate(745,${baseY - barB - 40}) scale(${tickIn})`}>
            <StatBurst cx={0} cy={0} big="+30%" lines={['MORE POWER']} fill={AMBER} rot={-5} big_fs={78} />
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

// ================================================================ S3 PRICE SEESAW
const S3: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lowIn = spring({frame: f - 20, fps, config: {damping: 11, stiffness: 130}});
  const highIn = spring({frame: f - 96, fps, config: {damping: 9, stiffness: 130}});
  // seesaw rocks harder once both numbers exist and never settles
  const both = f > 100 ? 1 : lowIn * 0.4;
  const tilt = 13 * Math.sin(f / 9) * both;
  const xIn = spring({frame: f - 150, fps, config: {damping: 10, stiffness: 140}});
  return (
    <AbsoluteFill style={{backgroundColor: '#3a1c14'}}>
      <BurstBG f={f} tone="ember" />
      <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', fontFamily: BOLD, fontWeight: 900, fontSize: 58, color: '#fff', textShadow: `3px 4px 0 ${INK}`}}>THE COMPANY'S OWN MATH</div>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        {/* fulcrum */}
        <path d="M500,1180 L580,1320 L420,1320 Z" fill={STEEL_D} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
        {/* the plank (rocking) */}
        <g transform={`translate(540,1170) rotate(${tilt})`}>
          <rect x={-420} y={-22} width={840} height={44} rx={14} fill={AMBER} stroke={INK} strokeWidth={OUT} />
          <rect x={-420} y={-22} width={840} height={16} rx={8} fill="#ffd27a" opacity={0.6} />
          {/* low side */}
          <g opacity={lowIn} transform="translate(-300,-150)">
            <rect x={-150} y={-70} width={300} height={140} rx={14} fill={ICE} stroke={INK} strokeWidth={OUT} />
            <text x={0} y={-6} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={62} fill={INK}>$500M</text>
            <text x={0} y={40} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={22} fill={INK}>SITE WORK (LEASE DOCS)</text>
          </g>
          {/* high side */}
          <g opacity={highIn} transform="translate(300,-150)">
            <rect x={-160} y={-70} width={320} height={140} rx={14} fill={RED} stroke={INK} strokeWidth={OUT} />
            <text x={0} y={-6} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={58} fill="#fff">$10B+</text>
            <text x={0} y={40} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={20} fill="#fff">FULL BUILD (COMPANY EST.)</text>
          </g>
        </g>
        {/* 20x bracket that flickers, never locks */}
        {xIn > 0.02 && (
          <g transform={`translate(540,900) scale(${xIn})`} opacity={0.7 + 0.3 * Math.sin(f / 3)}>
            <StatBurst cx={0} cy={0} big="20x" lines={['SPREAD']} fill={CYAN} rot={-4} big_fs={72} />
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

// ================================================================ S4 THE REVOLT
const S4: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const push = interpolate(f, [0, 170], [1.0, 1.06], {extrapolateRight: 'clamp'});
  const badgeIn = spring({frame: f - 40, fps, config: {damping: 9, stiffness: 140}});
  const count = Math.round(interpolate(f, [40, 78], [0, 500], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}));
  const tallyIn = spring({frame: f - 108, fps, config: {damping: 10, stiffness: 130}});
  // varied everyday Alaskan gear (NOT the fur-ruff parka) so the crowd reads as
  // generic residents, never a monolithic Alaska Native depiction.
  const crowd = [
    {x: 190, s: 0.82, sk: '#e8b48c', hair: '#2b1d12', out: 'puffer', hg: 'beanie', d: 6},
    {x: 365, s: 0.95, sk: '#c98d63', hair: '#3d2c1e', out: 'flannel', hg: 'cap', d: 0},
    {x: 545, s: 1.05, sk: '#f0c9a0', hair: '#5a4632', out: 'vest', hg: 'trapper', d: 10},
    {x: 725, s: 0.95, sk: '#8a5a3c', hair: '#1c1c1c', out: 'worker', hg: 'bare', d: 3},
    {x: 900, s: 0.82, sk: '#e8b48c', hair: '#6b4a2a', out: 'puffer', hg: 'hood', d: 8},
  ];
  return (
    <AbsoluteFill style={{backgroundColor: '#2a3f66'}}>
      <div style={{position: 'absolute', width: 1080, height: 1920, transform: `scale(${push})`, transformOrigin: '540px 900px'}}>
        <TundraBG f={f} push={push} />
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
          {/* crowd of everyresidents pointing */}
          {crowd.map((c, i) => (
            <g key={i}>
              <Character frame={f + c.d * 7} pose={i === 2 ? 'point' : 'arms-crossed'} emotion="angry" outfit={c.out as any} headgear={c.hg as any} hair={c.hair} skin={c.sk} facing={1} scale={c.s * 1.02} x={c.x} y={1760} />
            </g>
          ))}
          <PaperStorm frame={f} count={18} originX={-80} originY={1180} targetX={980} targetY={880} />
          {/* 500+ badge */}
          {badgeIn > 0.02 && (
            <g transform={`translate(300,560) scale(${badgeIn})`}>
              <StatBurst cx={0} cy={0} big={`${count}+`} lines={['PUBLIC', 'COMMENTS']} fill={AMBER} rot={-5} big_fs={82} />
            </g>
          )}
          {/* fewer than a dozen tally */}
          {tallyIn > 0.5 && (
            <g transform="translate(792,690)">
              <BoxLabel x={0} y={0} text="FEWER THAN A DOZEN" sub="IN FAVOR" w={360} h={96} fs={30} fill={ICE} color={RED} rot={-3 + 2 * Math.sin(f / 20)} />
            </g>
          )}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================ S5 HELL NO (standoff)
const S5: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  // Hold both HELL NO + NO AI legible in the wide shot (the silent-hold beat),
  // THEN punch the snap-zoom onto the face as the closing punctuation.
  const push = interpolate(f, [0, 96], [1.0, 1.06], {extrapolateRight: 'clamp'});
  const snap = spring({frame: f - 100, fps, config: {damping: 14, stiffness: 190}});
  const zoomed = f >= 100;
  const scale = zoomed ? 1.06 + snap * 1.15 : push;
  const ox = zoomed ? interpolate(snap, [0, 1], [0, 150]) : 0;
  const oy = zoomed ? interpolate(snap, [0, 1], [0, -250]) : 0;
  const hellIn = spring({frame: f - 16, fps, config: {damping: 10, stiffness: 150}});
  const noaiIn = spring({frame: f - 50, fps, config: {damping: 10, stiffness: 150}});
  const trembleX = 3.6 * Math.sin(f / 3.1);
  return (
    <AbsoluteFill style={{backgroundColor: '#2a3f66', overflow: 'hidden'}}>
      <div style={{position: 'absolute', width: 1080, height: 1920, transform: `scale(${scale}) translate(${ox}px,${oy}px)`, transformOrigin: '400px 1000px'}}>
        <TundraBG f={f} push={push} />
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
          {/* cowering machine */}
          <g transform={`translate(${820 + trembleX},1710)`} opacity={0.98}>
            <ServerMachine frame={f} emotion="nervous" scale={0.92} facing={-1} />
          </g>
          {/* the Alaskan, planted, furious (everyday gear: puffer + beanie) */}
          <Character frame={f} pose="point" emotion="angry" outfit="puffer" headgear="beanie" hair="#2b1d12" facing={1} scale={1.3} x={360} y={1720} />
          {/* HELL NO speech box */}
          {hellIn > 0.02 && (
            <g transform={`translate(430,690) scale(${hellIn}) rotate(-4)`}>
              <rect x={-240} y={-96} width={480} height={192} rx={22} fill="#fff" stroke={INK} strokeWidth={10} />
              <path d="M-120,86 l-30,80 l90,-58 Z" fill="#fff" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
              <text x={0} y={30} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={130} fill={RED} letterSpacing={2}>HELL NO</text>
            </g>
          )}
          {/* NO AI quote card */}
          {noaiIn > 0.02 && (
            <g transform={`translate(792,540) scale(${noaiIn}) rotate(5)`}>
              <rect x={-150} y={-56} width={300} height={112} rx={12} fill={AMBER} stroke={INK} strokeWidth={8} />
              <text x={0} y={16} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={72} fill={INK}>NO AI</text>
            </g>
          )}
          {zoomed && snap > 0.3 && <SpeedLines cx={360} cy={1230} frame={f} intensity={Math.min(1, snap)} />}
          {zoomed && snap > 0.55 && <ImpactStar cx={470} cy={1120} r={42 + 24 * snap} rot={f * 1.5} />}
        </svg>
      </div>
      <ZoomVignette amount={zoomed ? Math.min(1, snap) * 0.85 : 0} />
    </AbsoluteFill>
  );
};

// ================================================================ S6 THE TURN (proposal)
const S6: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const stampS = spring({frame: f - 30, fps, config: {damping: 9, stiffness: 220}});
  const ghostIn = interpolate(f, [40, 70], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const l1 = spring({frame: f - 84, fps, config: {damping: 11, stiffness: 140}});
  const l2 = spring({frame: f - 108, fps, config: {damping: 11, stiffness: 140}});
  const gavelIn = spring({frame: f - 140, fps, config: {damping: 10, stiffness: 130}});
  const gavelHover = 8 * Math.sin(f / 8);
  return (
    <AbsoluteFill style={{backgroundColor: '#161b2e'}}>
      <BurstBG f={f} />
      {/* ghost (unbuilt) machine */}
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', opacity: 0.4 + 0.6 * ghostIn}}>
        <g transform="translate(540,1500)">
          <ServerMachine frame={f} emotion="ghost" scale={1.15} />
        </g>
      </svg>
      {/* PROPOSAL stamp */}
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <g transform="translate(540,760)">
          <Stamp cx={0} cy={0} s={stampS} text="PROPOSAL" rot={-8} color={RED} />
        </g>
        {/* honest caveat labels */}
        {l1 > 0.02 && <BoxLabel x={300} y={1030} text="NO CONFIRMED CHIPS" w={430} h={64} fs={30} fill={ICE} color={INK} rot={-3} />}
        {l2 > 0.02 && <BoxLabel x={770} y={1130} text="NO CUSTOMERS" w={360} h={64} fs={30} fill={ICE} color={INK} rot={3} />}
        {/* gavel: state has not decided */}
        {gavelIn > 0.02 && (
          <g transform={`translate(560,1640) scale(${gavelIn})`}>
            <g transform={`translate(0,${gavelHover}) rotate(-24)`}>
              <rect x={-18} y={-150} width={36} height={150} rx={12} fill="#8a5a2b" stroke={INK} strokeWidth={6} />
              <rect x={-64} y={-210} width={128} height={72} rx={16} fill="#a06a34" stroke={INK} strokeWidth={7} />
            </g>
            <BoxLabel x={0} y={70} text="STATE HAS NOT DECIDED" w={470} h={62} fs={30} fill={AMBER} color={INK} />
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

// ================================================================ S7 LAST CALL
const S7: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const calIn = spring({frame: f - 8, fps, config: {damping: 12, stiffness: 110}});
  const flip = spring({frame: f - 40, fps, config: {damping: 14, stiffness: 120}});
  const bannerT = interpolate(f, [70, 104], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const tick = Math.sin(f / 3) * 6;
  return (
    <AbsoluteFill style={{backgroundColor: '#3a1c14'}}>
      <BurstBG f={f} tone="ember" />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        {/* wall calendar */}
        <g transform={`translate(540,760) scale(${calIn})`}>
          <rect x={-320} y={-300} width={640} height={620} rx={26} fill={ICE} stroke={INK} strokeWidth={10} />
          <rect x={-320} y={-300} width={640} height={120} rx={26} fill={RED} stroke={INK} strokeWidth={10} />
          <text x={0} y={-216} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={64} fill="#fff">JULY</text>
          {/* rings */}
          {[-200, -80, 40, 160].map((rx, i) => (
            <rect key={i} x={rx} y={-330} width={26} height={54} rx={12} fill="#c9cfd8" stroke={INK} strokeWidth={5} />
          ))}
          {/* the big date, flipping in */}
          <g transform={`scale(1, ${0.15 + 0.85 * flip})`}>
            <text x={0} y={120} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={300} fill={INK}>17</text>
          </g>
          <text x={0} y={250} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={40} fill={RED}>COMMENTS CLOSE</text>
        </g>
        {/* sourcing line, tucked just under the calendar (clear of captions) */}
        <text x={540} y={1180} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={28} fill={ICE} opacity={calIn}>
          4:30 PM AKDT  •  ALASKA DNR  •  ADL 422741
        </text>
        {/* LAST CALL banner unrolling */}
        <g transform={`translate(540,1330)`}>
          <g transform={`scale(${bannerT},1)`}>
            <rect x={-460} y={-58} width={920} height={116} rx={12} fill={RED} stroke={INK} strokeWidth={9} transform={`rotate(${-2})`} />
            <text x={0} y={20} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={84} fill="#fff" letterSpacing={3} transform={`rotate(${-2})`}>LAST CALL</text>
          </g>
        </g>
        {/* clock ticking */}
        <g transform={`translate(540,1520)`} opacity={bannerT}>
          <circle r={64} fill={ICE} stroke={INK} strokeWidth={8} />
          <line x1={0} y1={0} x2={0} y2={-44} stroke={INK} strokeWidth={8} strokeLinecap="round" transform={`rotate(${tick})`} />
          <line x1={0} y1={0} x2={30} y2={0} stroke={INK} strokeWidth={7} strokeLinecap="round" transform={`rotate(${tick * 4})`} />
          <circle r={7} fill={RED} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ================================================================ S8 BUTTON (mailbox)
const S8: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const boxIn = spring({frame: f - 8, fps, config: {damping: 12, stiffness: 110}});
  const stuff = interpolate(f, [30, 90], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const qIn = spring({frame: f - 30, fps, config: {damping: 12, stiffness: 120}});
  const qPulse = 1 + 0.02 * Math.sin(f / 9);
  const flag = 8 * Math.sin(f / 10);
  return (
    <AbsoluteFill style={{backgroundColor: '#2a3f66'}}>
      <TundraBG f={f} push={1.0} />
      {/* faint ghost machine, defeated in the back */}
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', opacity: 0.28}}>
        <g transform="translate(840,1500) scale(0.8)"><ServerMachine frame={f} emotion="ghost" scale={0.9} /></g>
      </svg>
      {/* the little Alaskan, re-crossing arms (loop to HELL NO) */}
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <Character frame={f} pose="arms-crossed" emotion="angry" outfit="flannel" headgear="beanie" hair="#3d2c1e" facing={1} scale={0.9} x={210} y={1740} />
        {/* MAILBOX overstuffed with comment slips */}
        <g transform={`translate(620,1360) scale(${boxIn})`}>
          {/* post */}
          <rect x={-16} y={40} width={32} height={300} fill="#5b4632" stroke={INK} strokeWidth={6} />
          {/* box */}
          <path d="M-150,-60 q0,-90 150,-90 q150,0 150,90 v150 h-300 Z" fill={RED} stroke={INK} strokeWidth={OUT} />
          <path d="M150,-60 v150 h-40 v-150 q0,-70 -110,-84 q110,4 150,84 Z" fill={RED_D} opacity={0.7} />
          {/* flag */}
          <g transform={`translate(150,-40) rotate(${flag})`}>
            <rect x={0} y={-70} width={12} height={70} fill={INK} />
            <path d="M12,-70 h50 l-14,18 l14,18 h-50 Z" fill={AMBER} stroke={INK} strokeWidth={5} />
          </g>
          {/* stuffed comment papers bulging out */}
          {stuff > 0.02 && Array.from({length: 10}).map((_, i) => {
            const a = -1.2 + (i / 9) * 2.4;
            const r = 70 + (i % 3) * 26;
            return (
              <g key={i} transform={`translate(${Math.sin(a) * r},${-70 - Math.cos(a) * r * 0.7 * stuff}) rotate(${a * 30})`} opacity={stuff}>
                <rect x={-20} y={-28} width={40} height={56} rx={4} fill="#f4efe4" stroke={INK} strokeWidth={4} />
                <line x1={-10} y1={-14} x2={10} y2={-14} stroke={INK} strokeWidth={3} opacity={0.6} />
                <line x1={-10} y1={-2} x2={10} y2={-2} stroke={INK} strokeWidth={3} opacity={0.6} />
              </g>
            );
          })}
        </g>
      </svg>
      {/* the question button (the payoff CTA — big, bold, held) */}
      <div style={{position: 'absolute', top: 430, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${qIn * qPulse})`}}>
        <div style={{background: AMBER, border: `11px solid ${INK}`, borderRadius: 20, padding: '30px 48px', boxShadow: `0 16px 0 ${INK}66`, maxWidth: 960, transform: 'rotate(-2deg)'}}>
          <div style={{fontFamily: BOLD, fontWeight: 900, fontSize: 92, lineHeight: 1.02, color: INK, textAlign: 'center', textTransform: 'uppercase', textShadow: `3px 4px 0 ${AMBER_D}`}}>
            What would your<br />comment say?
          </div>
        </div>
      </div>
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
    <div style={{position: 'absolute', bottom: 330, left: 0, right: 0, display: 'flex', justifyContent: 'center', padding: '0 60px'}}>
      <div style={{background: 'rgba(16,20,35,0.82)', borderRadius: 14, padding: '16px 30px', maxWidth: 940, border: `4px solid ${INK}`}}>
        <div style={{fontFamily: BOLD, fontWeight: 900, fontSize: 46, lineHeight: 1.12, color: '#fff', textAlign: 'center', letterSpacing: 0.5, textShadow: `2px 3px 0 rgba(0,0,0,0.6)`}}>
          {cue.text}
        </div>
      </div>
    </div>
  );
};

// ================================================================ TIMELINE
const SCENE_COMPONENTS: React.FC[] = [S1, S2, S3, S4, S5, S6, S7, S8];
const DEFAULT_BOUNDS: {from: number; dur: number}[] = [
  {from: 0, dur: 309}, {from: 309, dur: 206}, {from: 515, dur: 224}, {from: 739, dur: 171},
  {from: 910, dur: 138}, {from: 1048, dur: 201}, {from: 1249, dur: 168}, {from: 1417, dur: 233},
];

export const Episode: React.FC<EpisodeProps> = ({captions, scenes}) => {
  const bounds = scenes && scenes.length === SCENE_COMPONENTS.length ? scenes : DEFAULT_BOUNDS;
  return (
    <AbsoluteFill style={{backgroundColor: NAVY}}>
      {SCENE_COMPONENTS.map((C, i) => (
        <Sequence key={i} from={bounds[i].from} durationInFrames={bounds[i].dur} name={`S${i + 1}`}>
          <C />
        </Sequence>
      ))}
      <Captions captions={captions} />
    </AbsoluteFill>
  );
};
