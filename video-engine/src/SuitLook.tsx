import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Suit} from './lib/people';

// =============================================================================
// SuitLook: the look-dev stand for the lib Suit (machine pass 2026-11-21, queue suit-rig-necktie-default).
// Row 1: the neutral default (no tie), a tie={true} figure, and longHair with no tie, the 11-21 ombudsman.
// Row 2: a two-handed gesture (reach + reachL rising over the first second), a walking figure crossing
// (walk={f}), and facing={-1} with a coloured tie. Cues land at 0.5 s and 1.5 s so the beat idle shows.
// Probe it with a remotion still or scripts/probe_frames.sh SuitLook 0,0.5,1.0,1.5,2.0
// =============================================================================

export const SuitLook: React.FC = () => {
  const f = useCurrentFrame();
  const up = Math.max(0, Math.min(1, f / 30));
  const cues = [15, 45];
  return (
    <AbsoluteFill style={{backgroundColor: '#B39A76'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect width={1080} height={1920} fill="#B39A76" />
        <rect x={0} y={860} width={1080} height={120} fill="#6E4A2E" />
        <rect x={0} y={1500} width={1080} height={120} fill="#6E4A2E" />
        <Suit f={f} x={200} y={860} s={1.2} seed={1} cues={cues} />
        <Suit f={f} x={540} y={860} s={1.2} seed={2} cues={cues} tie coat="#4A4048" />
        <Suit f={f} x={880} y={860} s={1.2} seed={3} cues={cues} longHair coat="#3E5A6E" />
        <Suit f={f} x={200} y={1500} s={1.2} seed={4} cues={cues} reach={up} reachL={up} coat="#5A4A3A" />
        <Suit f={f} x={420 + f * 2} y={1500} s={1.2} seed={5} walk={f} coat="#3E5A6E" longHair />
        <Suit f={f} x={900} y={1500} s={1.2} seed={6} cues={cues} facing={-1} tie="#2F5FD0" reach={0.5} />
      </svg>
    </AbsoluteFill>
  );
};
