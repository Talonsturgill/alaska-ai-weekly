import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {SatelliteEye, SatEmotion} from './lib/kit';

// =============================================================================
// EyeLook: the measuring stand for kit SatelliteEye's `idle` (machine pass 2026-10-24).
// Left column: the Eye as every film through 10-24 drew it (idle 0). Right column: the same Eye
// with idle 1. Three held states, top to bottom: found and locked (the 10-24 held beats the panel
// named at 1.7 percent), searching, and waiting. No camera and no background motion, so a diff of
// each half over a strip window is the Eye's own life and nothing else.
// =============================================================================

const ROWS: {y: number; emotion: SatEmotion; lock: number}[] = [
  {y: 420, emotion: 'found', lock: 0.8},
  {y: 980, emotion: 'searching', lock: 0},
  {y: 1540, emotion: 'waiting', lock: 0},
];

export const EyeLook: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: '#0e1a2e'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect width={1080} height={1920} fill="#0e1a2e" />
        <line x1={540} y1={0} x2={540} y2={1920} stroke="#e8f0ff" strokeWidth={2} opacity={0.25} />
        <text x={270} y={110} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize={28} fill="#e8f0ff">IDLE 0</text>
        <text x={810} y={110} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize={28} fill="#e8f0ff">IDLE 1</text>
        {ROWS.map((r, i) => (
          <g key={i}>
            <SatelliteEye frame={f} x={270} y={r.y} scale={0.9} emotion={r.emotion} eyeLock={r.lock} />
            <SatelliteEye frame={f} x={810} y={r.y} scale={0.9} emotion={r.emotion} eyeLock={r.lock} idle={1} />
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
