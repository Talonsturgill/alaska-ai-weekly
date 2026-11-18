import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Moose} from './lib/fauna';

// =============================================================================
// MooseLook: the look-dev stand for the redrawn lib Moose (machine pass 2026-11-18).
// The 11-18 panel read S7's moose as "a bison" and docked it for not ambling: it slid across the
// map on frozen legs. Row 1 walks a moose across at hero scale with `walk={f}` (mode 'slide' draws
// the same travel with no `walk`, which is what Ep1118 did); row 2 grazes (`graze` eases 0 to 1
// over the first two seconds); row 3 is alert and wary facing left; row 4 is the two scales the
// recent films cast it at (0.55 walking, Ep1118; 0.42 calm, Ep1110). Probe it with
//   scripts/probe_frames.sh MooseLook 0,0.27,0.53,0.8,2.5
// =============================================================================

export const MooseLook: React.FC<{mode?: 'walk' | 'slide'}> = ({mode = 'walk'}) => {
  const f = useCurrentFrame();
  const walk = mode === 'walk' ? f : undefined;
  const graze = Math.max(0, Math.min(1, (f - 15) / 45));
  return (
    <AbsoluteFill style={{backgroundColor: '#DCE6EE'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect width={1080} height={1920} fill="#DCE6EE" />
        {[520, 960, 1400, 1820].map((y) => <rect key={y} x={0} y={y} width={1080} height={8} fill="#9AA9B6" />)}
        <Moose x={360 + f * 1.6} y={520} scale={1.15} f={f} walk={walk} />
        <Moose x={420} y={960} scale={1.0} f={f} graze={graze} />
        <Moose x={700} y={1400} scale={0.9} f={f} facing={-1} emotion="wary" alert={0.8} />
        <Moose x={760 - f * 1.2} y={1820} scale={0.55} f={f} facing={-1} walk={walk} />
        <Moose x={260} y={1820} scale={0.42} f={f} emotion="calm" />
      </svg>
    </AbsoluteFill>
  );
};
