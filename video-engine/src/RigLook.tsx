import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Character} from './lib/Character';
import {NIRReader, BRASS} from './lib/otolith';
import {ContactShadow, tones} from './lib/lighting';

// =============================================================================
// RigLook — the look-dev sheet for lib/Character.tsx (2026-10-02 machine pass).
//
// WHY IT EXISTS. Two panels running (2026-09-30, 2026-10-02) graded the cast BELOW the props
// beside it: flat face discs, flat hair, a slab jacket jutting past the hips, oval hands. The rig
// is shared by every registered episode, so it gets judged here, against a brass prop at the SAME
// scale, before a film spends a panel round on it. Frame numbers are GLOBAL film frames, so a
// still at frame 2724 shows the rig exactly as Dispatch1002 drew it at 90.8 s.
//
// RigLightLook draws one figure facing each way with its idle frozen, and scripts/rig_check.py
// reads which half of each face the key lights. RigHoldLook is the measuring stand for a HELD
// gesture: the S11 manager's exact props, a dead-held point (gesture 1, no scene-driven head
// turn), nothing else moving in frame.
// =============================================================================

const BG = '#1b1712';
const WALL = '#241d16';
const LABEL = '#a89a84';

const Cap: React.FC<{x: number; y: number; children: React.ReactNode}> = ({x, y, children}) => (
  <text x={x} y={y} fontSize={20} fontFamily="JetBrains Mono, ui-monospace, monospace"
        fill={LABEL} textAnchor="middle">{children}</text>
);

const Room: React.FC = () => (
  <g>
    <rect width={1080} height={1920} fill={WALL} />
    <radialGradient id="rl_lamp" cx="0.25" cy="0.2" r="0.75">
      <stop offset="0" stopColor="#ffd58a" stopOpacity={0.22} />
      <stop offset="1" stopColor="#ffd58a" stopOpacity={0} />
    </radialGradient>
    <rect width={1080} height={1920} fill="url(#rl_lamp)" />
    {[960, 1440, 1900].map((y) => <rect key={y} x={0} y={y - 6} width={1080} height={12} fill={BG} />)}
  </g>
);

export const RigLook: React.FC = () => {
  const f = useCurrentFrame();
  const brass = tones(BRASS);
  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Room />
        {/* ROW 1: the film's own pair at the film's own scale, beside the brass machine they lost to */}
        <Cap x={540} y={60}>10-02 cast at film scale vs the NIR reader (brass, same scale)</Cap>
        <Character frame={f} x={170} y={950} scale={0.9} facing={1} pose="carry" gesture={1} emotion="neutral"
          outfit="flannel" hairStyle="long" glasses headgear="bare" idleGain={1.2} />
        <NIRReader x={560} y={950} scale={0.82} f={f} beam={0} spectrum={0.6} seed={3} plate="" cloth={0} rails={false} />
        <Character frame={f} x={930} y={950} scale={0.9} facing={-1} pose="point" gesture={1} emotion="neutral"
          outfit="vest" glasses headgear="cap" idleGain={1.4} lightWrap={0} />
        {/* ROW 2 + 3: every outfit and headgear at background scale */}
        <Cap x={540} y={1000}>outfits x headgear x poses, 0.62</Cap>
        {([
          {x: 140, outfit: 'puffer', headgear: 'beanie', pose: 'stand'},
          {x: 400, outfit: 'suit', headgear: 'bare', pose: 'arms-crossed', hair: '#2b2118'},
          {x: 660, outfit: 'worker', headgear: 'bare', pose: 'carry'},
          {x: 920, outfit: 'nomex', headgear: 'hardhat', pose: 'raise'},
        ] as const).map((c, i) => (
          <Character key={c.x} frame={f + i * 37} x={c.x} y={1430} scale={0.62} facing={i % 2 ? -1 : 1}
            pose={c.pose} gesture={1} outfit={c.outfit} headgear={c.headgear} />
        ))}
        {([
          {x: 140, outfit: 'parka', headgear: 'bare', pose: 'panic', emotion: 'shock'},
          {x: 400, outfit: 'referee', headgear: 'bare', pose: 'point', emotion: 'smug', hair: '#c9a46a', skin: '#f0c9a8'},
          {x: 660, outfit: 'puffer', headgear: 'hood', pose: 'stand', emotion: 'worried', skin: '#8d5a3b'},
          {x: 920, outfit: 'flannel', headgear: 'bare', pose: 'stand', emotion: 'neutral', hair: '#1c1410', skin: '#c68a5e'},
        ] as const).map((c, i) => (
          <Character key={c.x} frame={f + i * 53} x={c.x} y={1890} scale={0.62} facing={i % 2 ? 1 : -1}
            pose={c.pose} gesture={1} emotion={c.emotion} outfit={c.outfit} headgear={c.headgear}
            hair={'hair' in c ? c.hair : undefined} skin={'skin' in c ? c.skin : undefined}
            hairStyle={i === 3 ? 'long' : 'short'} />
        ))}
        <g transform="translate(540,1180)">
          <ContactShadow cx={0} cy={60} rx={60} ry={10} opacity={0.4} />
          <rect x={-44} y={-60} width={88} height={120} rx={8} fill={brass.base} stroke="#101423" strokeWidth={5} />
          <rect x={-36} y={-52} width={20} height={104} rx={6} fill={brass.key} opacity={0.7} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** The same figure facing each way, idle frozen (idleGain 0) so the head sits exactly at
 *  (x, feet - 368 * scale): scripts/rig_check.py reads which half of each face the key lights. */
export const RigLightLook: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: WALL}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect width={1080} height={1920} fill={WALL} />
        <Character frame={f} x={300} y={1500} scale={1.4} facing={1} pose="stand" idleGain={0}
          emotion="neutral" outfit="puffer" headgear="bare" />
        <Character frame={f} x={780} y={1500} scale={1.4} facing={-1} pose="stand" idleGain={0}
          emotion="neutral" outfit="puffer" headgear="bare" />
      </svg>
    </AbsoluteFill>
  );
};

/** The S11 manager of Dispatch1002, alone, dead-held on his point: the rig's own life and nothing else. */
export const RigHoldLook: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: WALL}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect width={1080} height={1920} fill={WALL} />
        <Character frame={f} x={540} y={1200} scale={0.62} facing={-1} pose="point" gesture={1}
          emotion="neutral" outfit="vest" glasses headgear="cap" idleGain={1.4} lightWrap={0} />
      </svg>
    </AbsoluteFill>
  );
};
