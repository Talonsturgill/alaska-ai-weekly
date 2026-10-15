import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {HeldProp} from './lib/heldidle';

// =============================================================================
// HeldPropLook: the measuring stand for lib/heldidle.tsx (machine pass 2026-10-15).
// Left column: four held props drawn bare, the way 10-15's guide, clinic box, dial panel and
// condition plate were drawn. Right column: the same four drawings wrapped in <HeldProp>. Nothing
// else in the frame moves and there is no camera, so a frame-1-vs-frame-8 diff of each half is the
// prop's own life and nothing else.
// =============================================================================

const INK = '#141a22';
const PAPER = '#f3ead8';
const BRASS = '#c99a3c';
const CRAN = '#9e2c3c';
const TEAL = '#1f5d63';

const Box: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g>
    <rect x={x - 120} y={y - 170} width={240} height={170} fill={TEAL} stroke={INK} strokeWidth={6} />
    <rect x={x - 120} y={y - 200} width={240} height={34} fill="#2b7a80" stroke={INK} strokeWidth={6} />
    <rect x={x - 26} y={y - 120} width={52} height={52} fill={PAPER} stroke={INK} strokeWidth={4} />
    <rect x={x - 8} y={y - 112} width={16} height={36} fill={CRAN} />
    <rect x={x - 18} y={y - 102} width={36} height={16} fill={CRAN} />
  </g>
);

const Plate: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g>
    <line x1={x - 80} y1={y} x2={x - 80} y2={y + 40} stroke={INK} strokeWidth={4} />
    <line x1={x + 80} y1={y} x2={x + 80} y2={y + 40} stroke={INK} strokeWidth={4} />
    <rect x={x - 150} y={y + 40} width={300} height={110} rx={8} fill={BRASS} stroke={INK} strokeWidth={6} />
    <text x={x} y={y + 108} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight={800}
      fontSize={30} fill={INK}>IF STANDARDS</text>
  </g>
);

const Dials: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g>
    <rect x={x - 170} y={y - 150} width={340} height={150} rx={10} fill="#2a2f38" stroke={INK} strokeWidth={6} />
    {[0, 1, 2, 3].map((i) => (
      <g key={i}>
        <circle cx={x - 120 + i * 80} cy={y - 75} r={30} fill={PAPER} stroke={INK} strokeWidth={4} />
        <line x1={x - 120 + i * 80} y1={y - 75} x2={x - 120 + i * 80 + 18} y2={y - 92} stroke={CRAN} strokeWidth={5} />
      </g>
    ))}
  </g>
);

const Guide: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g>
    <rect x={x - 100} y={y - 70} width={200} height={140} fill={PAPER} stroke={INK} strokeWidth={6} />
    <rect x={x - 100} y={y - 70} width={200} height={40} fill={CRAN} stroke={INK} strokeWidth={6} />
    {[0, 1, 2].map((i) => <rect key={i} x={x - 80} y={y - 14 + i * 24} width={160 - i * 30} height={8} fill={INK} opacity={0.6} />)}
  </g>
);

export const HeldPropLook: React.FC = () => {
  const f = useCurrentFrame();
  const rows = [
    {y: 520, el: (x: number) => <Box x={x} y={520} />, kind: 'rest' as const, px: 0, py: 520, w: 240, h: 200},
    {y: 640, el: (x: number) => <Plate x={x} y={640} />, kind: 'hang' as const, px: 0, py: 640, w: 300, h: 150},
    {y: 1180, el: (x: number) => <Dials x={x} y={1180} />, kind: 'rest' as const, px: 0, py: 1180, w: 340, h: 150},
    {y: 1500, el: (x: number) => <Guide x={x} y={1500} />, kind: 'float' as const, px: 0, py: 1500, w: 200, h: 140},
  ];
  return (
    <AbsoluteFill style={{backgroundColor: '#d9dde0'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect width={1080} height={1920} fill="#d9dde0" />
        <line x1={540} y1={0} x2={540} y2={1920} stroke={INK} strokeWidth={2} opacity={0.3} />
        <text x={270} y={150} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize={28} fill={INK}>BARE</text>
        <text x={810} y={150} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize={28} fill={INK}>HELDPROP</text>
        {rows.map((r, i) => (
          <g key={i}>
            {r.el(270)}
            <HeldProp f={f} px={810} py={r.py} w={r.w} h={r.h} kind={r.kind} seed={i + 1}>{r.el(810)}</HeldProp>
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
