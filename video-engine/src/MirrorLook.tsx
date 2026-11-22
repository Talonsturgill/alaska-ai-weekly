import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BallotBox} from './lib/ballot';
import {ServerMachine} from './lib/kit';
import {Dotty} from './lib/permit';
import {BushPlane} from './lib/vehicles';
import {Nix} from './lib/canary';

// =============================================================================
// MirrorLook: lib characters that draw text, at facing 1 (left column) and facing -1 (right column)
// (machine pass 2026-11-22, queue mirrored-hero-card). Every label must read the right way round in
// both columns: Nix's NO card, the BALLOTS plate, Dotty's form labels and NEW sticker, the ghost
// machine's ? slots, and the plane's N907AK. scripts/mirror_text_check.py is the source gate.
// Probe it with a remotion still or scripts/probe_frames.sh MirrorLook 1.0
// =============================================================================

export const MirrorLook: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: '#B8C6CF'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect width={1080} height={1920} fill="#B8C6CF" />
        <line x1={540} y1={0} x2={540} y2={1920} stroke="#5A6A74" strokeWidth={3} strokeDasharray="12 10" />
        {([1, -1] as const).map((d) => {
          const cx = d === 1 ? 270 : 810;
          return (
            <g key={d}>
              <Nix f={f} x={cx} y={330} scale={1.4} facing={d} card={1} cardText="NO" flag={1} flagText="FLAG" />
              <BallotBox f={f} x={cx} y={760} s={0.8} facing={d} />
              <Dotty f={f} x={cx} y={1240} scale={0.75} facing={d} fill={4} sticker={1} />
              <ServerMachine frame={f} emotion="ghost" x={cx - 60} y={1560} scale={0.5} facing={d} />
              <BushPlane f={f} x={cx} y={1820} scale={0.9} facing={d} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
