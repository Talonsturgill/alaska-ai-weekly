import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Character} from './lib/Character';
import {ServerMachine, StatBurst, BoxLabel, INK, AMBER, ICE} from './lib/kit';
import {entrance, followThrough, accentKick, ChipShadow, SNAP} from './lib/motion';
import {MotionBlur} from './lib/lighting';
import {TalkMouth} from './lib/voice';

// =============================================================================
// CRAFT SHOWCASE — look-dev harness for the 2026-07-18 craft systems:
//   left   : Character with TalkMouth flapping (openness follows a test wave)
//   right  : ServerMachine talking + flinching on a synthetic accent
//   top    : StatBurst dropping in through entrance() (anticipation -> overshoot
//            -> squash) with MotionBlur fed by its velocity, on a ChipShadow
//   bottom : a pennant showing followThrough secondary swing after the drop
// Render stills at f=10 (pre), f=26 (impact), f=40 (settle), f=70 (talk open).
// =============================================================================
export const CraftShowcase: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();

  // synthetic mouth wave: talk bursts with silence gaps (mimics a real envelope)
  const openness = Math.max(0, Math.sin(f / 3.2)) * (Math.sin(f / 17) > -0.2 ? 1 : 0);
  // synthetic accent at f=70 (like an emphasis word landing)
  const kick = accentKick(f, fps, 70);

  const e = entrance(f, fps, 18, {drop: 320, preset: SNAP});
  const swing = followThrough(f, fps, 30, {amp: 22, freq: 2.2});

  return (
    <AbsoluteFill style={{backgroundColor: '#22304a'}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        {/* ---- entrance() + ChipShadow + MotionBlur ---- */}
        {e.on && (
          <MotionBlur vy={e.vy} gain={0.9}>
            <g transform={`translate(540,${430 + e.dy}) scale(${e.scale}) scale(${e.sx},${e.sy})`}>
              <ChipShadow>
                <StatBurst cx={0} cy={0} big="500+" lines={['ENTRANCE']} fill={AMBER} />
              </ChipShadow>
            </g>
          </MotionBlur>
        )}

        {/* ---- followThrough pennant hanging off the burst ---- */}
        <g transform={`translate(540,620) rotate(${swing})`}>
          <rect x={-6} y={0} width={12} height={120} fill={INK} />
          <path d="M-6,120 h170 l-40,26 40,26 h-170 Z" fill={ICE} stroke={INK} strokeWidth={6} />
          <text x={72} y={152} textAnchor="middle" fontFamily="Arial Black" fontWeight={900} fontSize={22} fill={INK}>FOLLOW</text>
        </g>

        {/* ---- talking Character (left) ---- */}
        <Character frame={f} pose="point" emotion="neutral" outfit="flannel" headgear="beanie"
                   facing={1} scale={1.1} x={300} y={1560} talking={openness} />

        {/* ---- talking + accent-flinching ServerMachine (right) ---- */}
        <g transform={`translate(0,${-14 * kick})`}>
          <g transform={`translate(790,1560) scale(${1 + 0.05 * kick})`}>
            <ServerMachine frame={f} emotion="nervous" scale={0.9} talking={openness * 0.8} />
          </g>
        </g>

        {/* ---- raw TalkMouth ramp for shape QC ---- */}
        {[0, 0.25, 0.5, 0.75, 1].map((o, i) => (
          <g key={i} transform={`translate(${170 + i * 190},900)`}>
            <circle r={62} fill="#e8b48c" stroke={INK} strokeWidth={5} />
            <g transform="translate(0,18)"><TalkMouth openness={o} w={56} /></g>
            <text y={92} textAnchor="middle" fontFamily="Arial" fontSize={24} fill={ICE}>{o}</text>
          </g>
        ))}
        <BoxLabel x={540} y={1050} text="CRAFT SHOWCASE" w={430} h={58} fs={30} fill={ICE} />
      </svg>
    </AbsoluteFill>
  );
};
