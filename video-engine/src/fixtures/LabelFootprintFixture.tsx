// Test fixture for scripts/label_footprint_check.py --self-test. Not a film and not registered in
// Root.tsx. Shot 1 holds a sign with a character standing over its right end (must FAIL), a clean
// label, a label whose own group draws a rivet over it (must pass), a label a ball crosses for
// about 9 frames (a NOTE) and a label wholly under a card (hidden, a NOTE). Shot 2 pushes in 2x on
// a card that then runs past the right frame edge (must FAIL as cut).
import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';

const MONO = 'monospace';
const T: React.FC<{x: number; y: number; children: string; size?: number}> = ({x, y, children, size = 40}) => (
  <text x={x} y={y} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} fill="#111">{children}</text>
);

const ShotOne: React.FC = () => {
  const f = useCurrentFrame();
  const ballX = 300 + (f - 10) * 50;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <rect width={1080} height={1920} fill="#E8E2D0" />
      <T x={540} y={400}>CLEAR LABEL</T>
      <g transform="translate(540,700)">
        <rect x={-180} y={-40} width={360} height={60} fill="#F2C14E" stroke="#111" strokeWidth={4} />
        <T x={0} y={0}>BOROUGH LAND</T>
      </g>
      {/* the character, painted after the sign and over its right end for the whole shot */}
      <circle cx={700} cy={720} r={90} fill="#3A6EA5" stroke="#111" strokeWidth={5} />
      <g transform="translate(540,850)">
        <rect x={-170} y={-38} width={340} height={56} fill="#FFFFFF" stroke="#111" strokeWidth={4} />
        <T x={0} y={0}>ON ITS PLATE</T>
        <rect x={-30} y={-26} width={24} height={24} fill="#888" />
      </g>
      <T x={540} y={1000}>BRIEF PASS</T>
      {f >= 10 && f <= 18 && <circle cx={ballX} cy={988} r={44} fill="#C8553D" />}
      <T x={540} y={1200}>UNDER THE CARD</T>
      <rect x={300} y={1150} width={480} height={80} fill="#2B2B2B" />
    </svg>
  );
};

const ShotTwo: React.FC = () => {
  const f = useCurrentFrame();
  const z = 1 + Math.min(1, f / 6);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translate(540px, 960px) scale(${z}) translate(-540px, -960px)`, transformOrigin: '0 0'}}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <rect width={1080} height={1920} fill="#D9E4EC" />
          <T x={800} y={960}>CARD PAST THE EDGE</T>
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export const EpLabelFixture: React.FC<{scenes?: Array<{from: number; dur: number}>}> = ({scenes = [{from: 0, dur: 45}, {from: 45, dur: 45}]}) => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <Sequence from={scenes[0].from} durationInFrames={scenes[0].dur}><ShotOne /></Sequence>
    <Sequence from={scenes[1].from} durationInFrames={scenes[1].dur}><ShotTwo /></Sequence>
  </AbsoluteFill>
);
