import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Suit} from './lib/people';

// =============================================================================
// SuitHoldLook: the measuring stand for a lib Suit HOLDING a gesture between its cues (machine pass
// 2026-11-26, queue held-figure-no-idle, repeat 2). Ep1126 S11 stood Kelly Isaacs (facing -1, face off,
// long hair, s 1.2) with her hand out for the whole shot, and seats 1 and 3 read one frozen pose across
// all eight filmstrip frames at 75.1 s and 79.2 s: the cues were at the shot's ends, so the strips the
// judges read fell between them, where the reaching hand was pinned to a fixed point.
// `pose` 'reach' holds reach={1} (the Isaacs pose), 'stand' holds no gesture. `frozen` passes gain={0},
// the statue the panel describes, as the floor the live figure is measured against.
// scripts/suit_hold_check.py renders strips well away from the only cue (frame 20) through the
// held_beat_check Chrome path and measures the changed share of the figure's own box.
// =============================================================================

export const SUIT_HOLD_CUES = [20];

export const SuitHoldLook: React.FC<{pose?: 'reach' | 'stand'; frozen?: boolean}> = ({pose = 'reach', frozen = false}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: '#CFC4B0'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect width={1080} height={1920} fill="#CFC4B0" />
        <rect x={0} y={1300} width={1080} height={200} fill="#8C6B4E" />
        <Suit f={f} x={540} y={1300} s={1.2} seed={13} cues={SUIT_HOLD_CUES} coat="#5E6E7A" face={false} longHair
          facing={-1} reach={pose === 'reach' ? 1 : 0} gain={frozen ? 0 : 1} />
      </svg>
    </AbsoluteFill>
  );
};
