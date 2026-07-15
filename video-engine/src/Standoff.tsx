import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {Character, INK} from './lib/Character';
import {SpeedLines, ImpactStar, PaperStorm, ZoomVignette} from './lib/FX';

// =============================================================================
// STANDOFF — beat: "Alaskans wrote in. More than 500 comments. Fewer than a
// dozen in favor." Drawn as a CONFRONTATION: an Alaskan in a parka, arms
// crossed, stares down the (now sweating) server-machine while a storm of
// comment papers rains toward it. Cinematic grammar: slow push-in, then the
// IGS dramatic SNAP-ZOOM onto the Alaskan's face with speed lines + star.
// A scene = a SET (tundra diorama), a CAST (two characters with emotions),
// an EVENT (the paper storm + zoom), and ANNOTATION (starburst tallies).
// =============================================================================

const SKY_TOP = '#2a3f66';
const SKY_LOW = '#4a6a94';
const SUN = '#f2e8c8';
const TUNDRA = '#7a8a5e';
const TUNDRA_D = '#5e6c47';
const MOUNT = '#8fa3b8';
const MOUNT_D = '#71869c';
const STEEL = '#5d7fae';
const STEEL_D = '#43608c';
const AMBER = '#ffb531';
const RED = '#e8402f';

export const Standoff: React.FC<{yesCount: number; noLabel: string}> = ({yesCount, noLabel}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();

  // ---- camera: slow push, then SNAP-ZOOM onto the Alaskan's face at f=150 ----
  const push = interpolate(f, [0, 148], [1.0, 1.07], {extrapolateRight: 'clamp'});
  const snap = spring({frame: f - 150, fps, config: {damping: 14, stiffness: 190}});
  const zoomed = f >= 150;
  const scale = zoomed ? 1.07 + snap * 1.5 : push;
  // zoom target: the Alaskan's FACE. Head center in scene space: feet (330,1700),
  // rig head local y=-368 at scale 1.28 -> y = 1700 - 368*1.28 = 1229. With
  // transformOrigin (540,1000) and final scale ~2.57, offsets that land the face
  // center-frame (slightly high for drama): ox=210, oy=-283.
  const ox = zoomed ? interpolate(snap, [0, 1], [0, 210]) : 0;
  const oy = zoomed ? interpolate(snap, [0, 1], [0, -283]) : 0;

  const alaskanIn = spring({frame: f - 8, fps, config: {damping: 12, stiffness: 100}});
  const machineIn = spring({frame: f - 20, fps, config: {damping: 12, stiffness: 100}});
  const tallyIn = spring({frame: f - 70, fps, config: {damping: 9, stiffness: 150}});
  const count = Math.round(interpolate(f, [70, 118], [0, yesCount], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}));
  const machTrembleX = 3.5 * Math.sin(f / 3.2);

  const burst = (cx: number, cy: number, spikes: number, r1: number, r2: number) => {
    const pts: string[] = [];
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? r1 : r2;
      const a = (Math.PI * i) / spikes - Math.PI / 2;
      pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
    }
    return pts.join(' ');
  };

  return (
    <AbsoluteFill style={{backgroundColor: SKY_TOP, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          width: 1080,
          height: 1920,
          transform: `scale(${scale}) translate(${ox}px, ${oy}px)`,
          transformOrigin: '540px 1000px',
        }}
      >
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
          {/* ---------------- SET: tundra diorama ---------------- */}
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SKY_TOP} />
            <stop offset="100%" stopColor={SKY_LOW} />
          </linearGradient>
          <rect width="1080" height="1300" fill="url(#sky)" />
          {/* low arctic sun + haze */}
          <circle cx="850" cy="360" r="86" fill={SUN} opacity={0.9} />
          <circle cx="850" cy="360" r="130" fill={SUN} opacity={0.25} />
          {/* far range (parallax drifts slightly against push) */}
          <g transform={`translate(${-8 * (push - 1) * 30},0)`}>
            {[
              [0, 760, 260, 620],
              [260, 700, 300, 680],
              [560, 740, 280, 640],
              [820, 700, 300, 700],
            ].map(([x0, peakY, w], i) => (
              <g key={i}>
                <path d={`M${x0 - 40},1310 L${x0 + w / 2},${peakY} L${x0 + w + 40},1310 Z`} fill={i % 2 ? MOUNT : MOUNT_D} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
                <path
                  d={`M${x0 + w / 2 - w * 0.13},${peakY + 84} L${x0 + w / 2},${peakY} L${x0 + w / 2 + w * 0.13},${peakY + 84} L${x0 + w / 2 + w * 0.05},${peakY + 62} L${x0 + w / 2 - 4},${peakY + 86} L${x0 + w / 2 - w * 0.07},${peakY + 60} Z`}
                  fill="#fff"
                  stroke={INK}
                  strokeWidth={4}
                />
              </g>
            ))}
          </g>
          {/* tundra ground bands */}
          <rect x="0" y="1290" width="1080" height="640" fill={TUNDRA} />
          <path d="M0,1290 q270,-26 540,0 q270,26 540,0 L1080,1930 L0,1930 Z" fill={TUNDRA_D} opacity={0.5} />
          {/* frost-heave polygon cracks */}
          {[
            'M60,1400 l150,40 l-30,90 l-160,-30 Z',
            'M840,1380 l180,30 l-20,110 l-190,-40 Z',
            'M420,1560 l190,30 l-30,110 l-200,-30 Z',
          ].map((d, i) => (
            <path key={i} d={d} fill="none" stroke={TUNDRA_D} strokeWidth={7} strokeLinejoin="round" opacity={0.8} />
          ))}
          {/* scrubby sedge tufts */}
          {[120, 320, 720, 940, 540].map((tx, i) => (
            <g key={i} transform={`translate(${tx},${1360 + (i % 3) * 150})`}>
              <path d="M-16,0 q4,-26 10,-30 M0,0 q0,-30 4,-34 M16,0 q-2,-24 -10,-30" fill="none" stroke={TUNDRA_D} strokeWidth={6} strokeLinecap="round" />
            </g>
          ))}

          {/* ---------------- PAPER STORM (the 500+ made physical) ---------------- */}
          <PaperStorm frame={f} count={16} originX={-80} originY={1180} targetX={880} targetY={980} />

          {/* ---------------- CAST ---------------- */}
          {/* the machine: cowering, sweating, trembling */}
          <g transform={`translate(${machTrembleX + 120 * (1 - machineIn)},0)`} opacity={machineIn}>
            <g transform="translate(790,1500) scale(1.05)">
              <ellipse cx={0} cy={4} rx={190} ry={30} fill={INK} opacity={0.3} />
              <rect x={-150} y={-430} width={300} height={420} rx={30} fill={STEEL} stroke={INK} strokeWidth={8} />
              <path d="M62,-424 h58 a24,24 0 0 1 24,24 v370 a24,24 0 0 1 -24,24 h-58 Z" fill={STEEL_D} opacity={0.8} />
              <rect x={-134} y={-416} width={44} height={150} rx={20} fill="#7fa1cc" opacity={0.6} />
              {/* worried eyes (leaning back) */}
              <ellipse cx={-52} cy={-330} rx={42} ry={48} fill="#eef6ff" stroke={INK} strokeWidth={6.5} />
              <ellipse cx={58} cy={-330} rx={42} ry={48} fill="#eef6ff" stroke={INK} strokeWidth={6.5} />
              <circle cx={-62} cy={-322} r={15} fill={INK} />
              <circle cx={48} cy={-322} r={15} fill={INK} />
              {/* worried brows + wavy mouth + sweat */}
              <path d="M-92,-388 q34,-18 66,-6" fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
              <path d="M96,-388 q-34,-18 -66,-6" fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
              <path d="M-56,-236 q28,-18 56,0 q28,18 56,0" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
              <path d={`M118,-392 q12,${16 + 5 * Math.sin(f / 7)} 0,${30 + 5 * Math.sin(f / 7)} q-12,-14 0,-30 Z`} fill="#9fd8ff" stroke={INK} strokeWidth={4} />
              <path d={`M-120,-380 q-10,${14 + 4 * Math.cos(f / 8)} 0,${26 + 4 * Math.cos(f / 8)} q10,-12 0,-26 Z`} fill="#9fd8ff" stroke={INK} strokeWidth={4} />
              {/* LEDs blinking nervously fast */}
              {[0, 1, 2].map((i) => (
                <circle key={i} cx={-96 + i * 44} cy={-120} r={12} fill={(f / 4 + i) % 3 < 1 ? RED : '#2b3a55'} stroke={INK} strokeWidth={4.5} />
              ))}
              {/* stubby arms up (surrender-ish) */}
              <path d={`M-148,-260 q-52,-30 -44,${-92 + 4 * Math.sin(f / 7)}`} fill="none" stroke={INK} strokeWidth={34} strokeLinecap="round" />
              <path d={`M-148,-260 q-52,-30 -44,${-92 + 4 * Math.sin(f / 7)}`} fill="none" stroke={STEEL_D} strokeWidth={22} strokeLinecap="round" />
              <path d={`M148,-260 q52,-30 44,${-92 - 4 * Math.sin(f / 7)}`} fill="none" stroke={INK} strokeWidth={34} strokeLinecap="round" />
              <path d={`M148,-260 q52,-30 44,${-92 - 4 * Math.sin(f / 7)}`} fill="none" stroke={STEEL_D} strokeWidth={22} strokeLinecap="round" />
            </g>
          </g>

          {/* the Alaskan: parka, arms crossed, planted, unimpressed */}
          <g transform={`translate(${-120 * (1 - alaskanIn)},0)`} opacity={alaskanIn}>
            <Character frame={f} pose="arms-crossed" emotion="angry" outfit="parka" facing={1} scale={1.28} x={330} y={1700} />
          </g>

          {/* ---------------- ANNOTATION: tallies (clear out during the zoom) ---------------- */}
          <g opacity={tallyIn * (zoomed ? Math.max(0, 1 - snap * 2) : 1)}>
            <g transform={`scale(${tallyIn})`} style={{transformOrigin: '250px 700px'} as any}>
              <g transform={`rotate(${4 * Math.sin(f / 24)} 250 700)`}>
                <polygon points={burst(250, 700, 13, 165, 128)} fill={AMBER} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
                <text x={250} y={686} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={76} fill={INK}>
                  {count}+
                </text>
                <text x={250} y={738} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={28} fill={INK}>
                  SAY NO
                </text>
              </g>
            </g>
            {tallyIn > 0.9 && (
              <g transform="translate(790,1010)">
                <rect x={-150} y={-34} width={300} height={64} rx={10} fill="#eef6ff" stroke={INK} strokeWidth={6} transform={`rotate(${-3 + 2 * Math.sin(f / 20)})`} />
                <text x={0} y={12} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={30} fill={RED} transform={`rotate(${-3 + 2 * Math.sin(f / 20)})`}>
                  {noLabel.toUpperCase()}
                </text>
                {/* pointer nub down toward the machine */}
                <path d="M-20,30 l20,26 l20,-26 Z" fill="#eef6ff" stroke={INK} strokeWidth={5} strokeLinejoin="round" transform={`rotate(${-3 + 2 * Math.sin(f / 20)})`} />
              </g>
            )}
          </g>

          {/* ---------------- DRAMATIC ZOOM JUICE (targets the FACE) ---------------- */}
          {zoomed && snap > 0.25 && <SpeedLines cx={330} cy={1229} frame={f} intensity={Math.min(1, snap)} />}
          {zoomed && snap > 0.5 && (
            <ImpactStar cx={480} cy={1090} r={44 + 26 * snap} rot={f * 1.4} />
          )}
        </svg>
      </div>
      <ZoomVignette amount={zoomed ? Math.min(1, snap) * 0.9 : 0} />
    </AbsoluteFill>
  );
};
