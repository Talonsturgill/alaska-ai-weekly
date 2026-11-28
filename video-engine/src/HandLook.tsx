import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Hand, HandPencil} from './lib/hand';
import {CheckHand, Tick} from './lib/nib';

// =============================================================================
// HandLook: the measuring stand for lib Hand (machine pass 2026-11-28, queue lib-hand-asset, repeat 1,
// with the 11-26 doctor's hand). Ep1128's CheckHand, as shipped, presses by translating and squashing
// one silhouette (press 1 for six frames); seat 1 read "no wrist or finger articulation and no
// anticipation, press, recoil or settle". `rig` 'hand' draws lib Hand with a pencil and a strike at
// HAND_LOOK_CUE, 'legacy' draws the shipped CheckHand pressing the way Ep1128 drives it, 'point' draws
// the Hand in its pointing grip (the doctor's touch), 'frozen' the Hand at gain 0 with no cue,
// 'check' CheckHand given cues (role 'ours', the pine clicker), which wraps lib Hand. `mark` false hides
// the tick the pencil draws, so the measure reads the hand alone.
// scripts/hand_check.py renders it through the held_beat_check Chrome path and measures it.
// =============================================================================

export const HAND_LOOK_CUE = 60;
export const HAND_BOX = {x: 300, y: 560, w: 560, h: 900};

export const HandLook: React.FC<{rig?: 'hand' | 'legacy' | 'point' | 'frozen' | 'check'; mark?: boolean}> = ({rig = 'hand', mark = true}) => {
  const f = useCurrentFrame();
  const cue = HAND_LOOK_CUE;
  const X = 520, Y = 1300;
  const tickP = Math.max(0, Math.min(1, (f - cue) / 8));
  return (
    <AbsoluteFill style={{backgroundColor: '#CFC4B0'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect width={1080} height={1920} fill="#CFC4B0" />
        <rect x={0} y={1300} width={1080} height={620} fill="#E9D7AE" />
        <rect x={0} y={1296} width={1080} height={8} fill="#B79E74" />
        {mark && rig !== 'frozen' && rig !== 'point' && <Tick x={X + 22} y={Y - 6} p={tickP} s={1.2} />}
        {rig === 'legacy' && (
          <CheckHand f={f} x={X} y={Y} s={1.6} angle={-10} role="study" press={f >= cue && f < cue + 6 ? 1 : 0} />
        )}
        {(rig === 'hand' || rig === 'frozen') && (
          <Hand f={f} x={X} y={Y} s={1.6} angle={-10} cues={rig === 'hand' ? [cue] : []} gain={rig === 'frozen' ? 0 : 1}
            sleeve="#CDBFA3" seed={3}>
            <HandPencil />
          </Hand>
        )}
        {rig === 'check' && <CheckHand f={f} x={X} y={Y} s={1.6} angle={-10} role="ours" cues={[cue]} />}
        {rig === 'point' && (
          <Hand f={f} x={X} y={Y} s={1.6} angle={-20} grip="point" cues={[cue]} strength={0.5} sleeve="#E8ECEF" cuff="#7FA7C8" seed={5} />
        )}
      </svg>
    </AbsoluteFill>
  );
};
