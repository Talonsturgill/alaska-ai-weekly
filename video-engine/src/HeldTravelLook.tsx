import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {HeldProp, HeldTravel, TravelMode} from './lib/heldidle';

// =============================================================================
// HeldTravelLook: the measuring stand for HeldTravel in lib/heldidle.tsx (machine pass 2026-10-26).
// One held prop the size of 10-26's painted map (a 460x320 sheet on a wall) and the cord that feeds
// it, wrapped in <HeldProp> as the 10-15 rig prescribes, with no camera. `mode` 'none' is HeldProp
// alone; 'sweep', 'shadow' and 'runner' add the travelling element. scripts/held_travel_look_check.py
// renders each through the same Chrome path as held_beat_check --source and measures the same
// camera-solved, whole-frame change that names a beat HELD under 6 percent.
// =============================================================================

const INK = '#141a22';
const PAPER = '#efe2c4';
const WALL = '#c9d6cf';
const SEA = '#8fb3c4';
const LAND = '#d9b97a';

const Sheet: React.FC = () => (
  <g>
    <rect x={310} y={760} width={460} height={320} rx={6} fill={PAPER} stroke={INK} strokeWidth={6} />
    <rect x={334} y={784} width={412} height={272} fill={SEA} opacity={0.55} />
    <path d="M360 1010 L380 900 L450 850 L560 840 L640 870 L700 930 L690 990 L600 1020 L520 1000 L440 1030 Z"
      fill={LAND} stroke={INK} strokeWidth={4} />
    <circle cx={470} cy={990} r={10} fill="#9e2c3c" stroke={INK} strokeWidth={3} />
    <circle cx={620} cy={880} r={10} fill="#9e2c3c" stroke={INK} strokeWidth={3} />
    {/* a label under the travel, so label_footprint can prove the travel never counts as cover */}
    <text x={540} y={1050} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight={800}
      fontSize={30} fill={INK}>SOUTH COAST</text>
  </g>
);

export const HeldTravelLook: React.FC<{mode?: TravelMode | 'none'}> = ({mode = 'none'}) => {
  const f = useCurrentFrame();
  const cord: [number, number][] = [[120, 300], [200, 520], [330, 640], [420, 760]];
  return (
    <AbsoluteFill style={{backgroundColor: WALL}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect width={1080} height={1920} fill={WALL} />
        <rect y={1300} width={1080} height={620} fill="#b48a55" />
        <polyline points={cord.map((p) => p.join(',')).join(' ')} fill="none" stroke={INK} strokeWidth={8} />
        <HeldProp f={f} px={540} py={760} w={460} h={320} kind="hang" seed={2}>
          <Sheet />
          {mode !== 'none' && mode !== 'runner' && <HeldTravel f={f} x={310} y={760} w={460} h={320} mode={mode} seed={1} />}
        </HeldProp>
        {mode === 'runner' && <HeldTravel f={f} x={120} y={300} w={300} h={460} mode="runner" path={cord} seed={1} />}
      </svg>
    </AbsoluteFill>
  );
};
