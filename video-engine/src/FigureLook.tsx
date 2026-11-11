import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {FigureFinish, IdleFigure, StrikeProp, headTransform, type FigurePose} from './lib/figureidle';

// =============================================================================
// FigureLook: the measuring stand for lib/figureidle.tsx (machine pass 2026-11-09).
// The left half is the episode-local Person the 11-06 and 11-09 films drew (breath and a sine nod,
// copied as shipped in Ep1109), the right half is a SEALED stamp coming down onto a page. `mode`
// 'bare' draws both as shipped: the person breathes, the stamp eases down into place. 'rig'
// wraps the person in <IdleFigure cues> with the pose driving head and arms, and the stamp in
// <StrikeProp>. scripts/figure_look_check.py renders the frames either side of every cue through the
// held_beat_check Chrome path and measures the same camera-solved whole-frame change, one subject
// drawn at a time (`subject`), so each number is on the panel's own scale.
// 'finish' (machine pass 2026-11-11) is 'rig' with the Person inside lib <FigureFinish>, measured by
// scripts/figure_finish_check.py against 'rig' for the tonal range across the figure.
// =============================================================================

const INK = '#14101C';
const SKIN = '#E3B48C';
const SEAL = '#C41E3A';
export const CUES = [30, 75, 120, 165, 210];

const Person: React.FC<{x: number; y: number; s?: number; f: number; pose?: FigurePose}> = ({x, y, s = 1, f, pose}) => {
  // as shipped in Ep1109 when no pose is given: breath, a sine nod and a sine bob
  const breathe = pose ? 1 : 1 + 0.014 * Math.sin(f / 16);
  const nod = pose ? 0 : 2.2 * Math.sin(f / 31);
  const bob = pose ? 0 : 3 * Math.sin(f / 21);
  const blink = pose ? (pose.blink ? 0.15 : 1) : (f % 130) > 124 ? 0.15 : 1;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s})`}>
      <ellipse cx={0} cy={142} rx={66} ry={11} fill="#000" opacity={0.42} />
      <rect x={-34} y={126} width={30} height={16} rx={7} fill="#2A1A2E" stroke={INK} strokeWidth={4} />
      <rect x={4} y={126} width={30} height={16} rx={7} fill="#2A1A2E" stroke={INK} strokeWidth={4} />
      <g transform={`scale(1 ${breathe})`}>
        <rect x={-48} y={-10} width={96} height={146} rx={30} fill="#2B3F6B" stroke={INK} strokeWidth={7} />
        <path d="M -30,-6 q 30,26 60,0" fill="#F4EBC6" stroke={INK} strokeWidth={4} />
      </g>
      {[-1, 1].map((d) => (
        <g key={d} transform={`rotate(${pose ? (d < 0 ? pose.armL : pose.armR) : 0} ${d * 49} 6)`}>
          <rect x={d > 0 ? 36 : -62} y={0} width={26} height={96} rx={13} fill="#2B3F6B" stroke={INK} strokeWidth={6} />
          <circle cx={d * 49} cy={104} r={13} fill={SKIN} stroke={INK} strokeWidth={5} />
        </g>
      ))}
      <rect x={-12} y={-24} width={24} height={22} rx={8} fill={SKIN} stroke={INK} strokeWidth={5} />
      <g transform={pose ? headTransform(pose, 0, -10) : `rotate(${nod} 0 -10)`}>
        <circle cy={-52} r={40} fill={SKIN} stroke={INK} strokeWidth={7} />
        <path d="M -40,-58 q 40,-52 80,0 q -40,-16 -80,0 Z" fill="#3A2218" stroke={INK} strokeWidth={4} />
        {[-14, 14].map((ex) => <ellipse key={ex} cx={ex} cy={-50} rx={4.5} ry={4.5 * blink} fill={INK} />)}
        <path d="M -14,-30 q 14,10 28,0" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
};

const Stamp: React.FC = () => (
  <g>
    <rect x={770} y={900} width={80} height={110} rx={14} fill="#5A2D14" stroke={INK} strokeWidth={6} />
    <rect x={730} y={1000} width={160} height={44} rx={8} fill="#3A2218" stroke={INK} strokeWidth={6} />
    <rect x={724} y={1040} width={172} height={18} rx={4} fill={SEAL} stroke={INK} strokeWidth={4} />
  </g>
);

export const FigureLook: React.FC<{mode?: 'bare' | 'rig' | 'finish'; subject?: 'both' | 'figure' | 'stamp'}> = ({mode = 'bare', subject = 'both'}) => {
  const f = useCurrentFrame();
  // the bare stamp eases down into place on each cue: a prop that slides rather than acts
  const last = CUES.filter((c) => c - 9 <= f).pop() ?? CUES[0];
  const k = interpolate(f, [last - 9, last + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{backgroundColor: '#6B1E24'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect width={1080} height={1920} fill="#6B1E24" />
        <rect y={1300} width={1080} height={620} fill="#3B2315" />
        <rect x={700} y={1060} width={220} height={240} fill="#F4ECD8" stroke={INK} strokeWidth={6} />
        {subject !== 'stamp' && mode === 'finish' && (
          // machine pass 2026-11-11: the same rigged Person lit by lib FigureFinish (rim, core shade, floor shadow)
          <FigureFinish x={290} footY={1300} w={190} h={330}>
            <IdleFigure f={f} x={290} footY={1300} h={330} seed={2} cues={CUES}>
              {(pose) => <Person x={290} y={1100} s={1.4} f={f} pose={pose} />}
            </IdleFigure>
          </FigureFinish>
        )}
        {subject !== 'stamp' && mode !== 'finish' && (mode === 'rig' ? (
          <IdleFigure f={f} x={290} footY={1300} h={330} seed={2} cues={CUES}>
            {(pose) => <Person x={290} y={1100} s={1.4} f={f} pose={pose} />}
          </IdleFigure>
        ) : (
          <Person x={290} y={1100} s={1.4} f={f} />
        ))}
        {subject !== 'figure' && (mode !== 'bare' ? (
          <StrikeProp f={f} at={CUES} px={810} py={1058}><Stamp /></StrikeProp>
        ) : (
          <g transform={`translate(0 ${-40 * (1 - k)})`}><Stamp /></g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
