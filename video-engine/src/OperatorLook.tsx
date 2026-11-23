import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Suit} from './lib/people';

// =============================================================================
// OperatorLook: look-dev for the lib Suit's `operate` and `seated` (engine advance, machine pass 2026-11-23,
// queue figure-finish-parity: the 11-23 UAF pilot "stands rather than operating a stick", all seats).
// Row 1: a standing operator (operate 1), a seated operator on a stool, and a seated figure at rest.
// Row 2: the operator at the 11-23 pilot's scale (s 1.5) beside a plain standing Suit at the same scale.
// Cues at 0.5 s and 1.5 s, so the hard stick throw lands inside a strip around frames 15 and 45.
// Probe: remotion still OperatorLook at frames 0, 15, 30, 45.
// =============================================================================

export const OperatorLook: React.FC = () => {
  const f = useCurrentFrame();
  const cues = [15, 45];
  return (
    <AbsoluteFill style={{backgroundColor: '#3A2E48'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect width={1080} height={1920} fill="#3A2E48" />
        <rect x={0} y={860} width={1080} height={140} fill="#4A3C58" />
        <rect x={0} y={1640} width={1080} height={280} fill="#4A3C58" />
        <Suit f={f} x={200} y={860} s={1.2} seed={3} cues={cues} operate={1} face={false} coat="#5A4E66" trousers="#2E2440" />
        <Suit f={f} x={540} y={860} s={1.2} seed={4} cues={cues} operate={1} seated coat="#3E5A6E" />
        <Suit f={f} x={880} y={860} s={1.2} seed={5} cues={cues} seated longHair coat="#6A4E5E" />
        <Suit f={f} x={330} y={1640} s={1.5} seed={3} cues={cues} operate={1} face={false} coat="#5A4E66" trousers="#2E2440" />
        <Suit f={f} x={760} y={1640} s={1.5} seed={9} cues={cues} face={false} coat="#6A4E5E" trousers="#2E2440" />
      </svg>
    </AbsoluteFill>
  );
};
