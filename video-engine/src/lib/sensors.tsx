import React from 'react';
import {INK, tones, FormGradient, RimLight} from './lighting';

// Net-new sensor assets for the 2026-07-21c beluga Dispatch: the robot EYE (SatelliteEye /
// GAIA) and the robot EAR (ListeningMooring / passive-acoustic node). Flat-vector IGS 2.5D
// house style: thick ink outlines, form-shaded fills, the sensors are the only sharp
// synthetic light in a soft natural world. Reusable for any future remote-sensing / PAM story.

const uid = (s: string) => 'sx' + Math.abs([...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)).toString(36);
const MINT = '#31e0b6';
const GOLD = '#ffd24a';

// ---- the ORBITAL EYE: angular bus, twin solar wings, comms dish, down-looking lens ----
export const SatelliteEye: React.FC<{
  x: number; y: number; scale?: number; f: number; facing?: 1 | -1;
  scanCone?: number; lensGlow?: number;
}> = ({x, y, scale = 1, f, facing = 1, scanCone = 0, lensGlow = 0.3}) => {
  const id = uid(`sat${x}${y}`);
  const hull = tones('#6b7683');
  const gold = tones('#ffd24a');
  const cone = Math.max(0, Math.min(1, scanCone));
  const glow = Math.max(0, Math.min(1, lensGlow));
  const yaw = Math.sin(f / 42) * 6;                 // orbital drift (visible idle)
  const bob = Math.sin(f / 34) * 10;
  const dish = (f * 2.6) % 360;
  const blink = (Math.sin(f / 8) > 0.6) ? 1 : 0.25;
  const wing = Math.sin(f / 40) * 2.4;
  return (
    <g transform={`translate(${x},${y + bob}) scale(${scale * facing},${scale}) rotate(${yaw})`}>
      <FormGradient id={id} t={hull} />
      <FormGradient id={`${id}_g`} t={gold} />
      {/* the scan cone driving down (the eye looking at the inlet) */}
      {cone > 0.02 && (
        <g opacity={cone} style={{mixBlendMode: 'screen'}}>
          <path d={`M-28,58 L${-56 - 130 * cone},520 L${56 + 130 * cone},520 L28,58 Z`} fill={GOLD} opacity={0.16} />
          <line x1={0} y1={58} x2={0} y2={520} stroke={GOLD} strokeWidth={3} opacity={0.4} />
        </g>
      )}
      {/* solar wings on struts */}
      <line x1={-54} y1={0} x2={-30} y2={0} stroke={hull.shade} strokeWidth={6} />
      <line x1={54} y1={0} x2={30} y2={0} stroke={hull.shade} strokeWidth={6} />
      <g transform={`translate(-102,0) rotate(${wing})`}>
        <rect x={-48} y={-34} width={96} height={68} rx={4} fill="#26303a" stroke={INK} strokeWidth={4} />
        {[0, 1, 2].map((i) => <line key={i} x1={-48 + (i + 1) * 24} y1={-34} x2={-48 + (i + 1) * 24} y2={34} stroke="#3d4a57" strokeWidth={2} />)}
        <line x1={-48} y1={0} x2={48} y2={0} stroke="#3d4a57" strokeWidth={2} />
      </g>
      <g transform={`translate(102,0) rotate(${-wing})`}>
        <rect x={-48} y={-34} width={96} height={68} rx={4} fill="#26303a" stroke={INK} strokeWidth={4} />
        {[0, 1, 2].map((i) => <line key={i} x1={-48 + (i + 1) * 24} y1={-34} x2={-48 + (i + 1) * 24} y2={34} stroke="#3d4a57" strokeWidth={2} />)}
        <line x1={-48} y1={0} x2={48} y2={0} stroke="#3d4a57" strokeWidth={2} />
      </g>
      {/* comms dish */}
      <g transform={`translate(0,-56) rotate(${Math.sin(dish * Math.PI / 180) * 6})`}>
        <ellipse cx={0} cy={0} rx={22} ry={10} fill={`url(#${id}_g)`} stroke={INK} strokeWidth={3} />
        <line x1={0} y1={2} x2={0} y2={20} stroke={hull.shade} strokeWidth={4} />
      </g>
      {/* the bus body */}
      <rect x={-34} y={-40} width={68} height={80} rx={6} fill={`url(#${id})`} stroke={INK} strokeWidth={5} />
      <RimLight d="M-34,-38 L34,-38" w={4} opacity={0.6} />
      <rect x={-24} y={-26} width={18} height={14} rx={3} fill="#26303a" stroke={INK} strokeWidth={2.5} />
      {/* down-looking lens barrel */}
      <rect x={-14} y={38} width={28} height={28} rx={4} fill={hull.core} stroke={INK} strokeWidth={4} />
      <circle cx={0} cy={70} r={16} fill={GOLD} stroke={INK} strokeWidth={4} opacity={0.45 + 0.55 * glow} />
      <circle cx={-4} cy={66} r={6} fill="#fff" opacity={0.55 * glow} style={{mixBlendMode: 'screen'}} />
      {/* telemetry light */}
      <circle cx={22} cy={-30} r={5} fill="#ff6a4a" opacity={blink} />
    </g>
  );
};

// ---- the SEAFLOOR EAR: anchor base, ribbed cylinder, mint hydrophone dome, tether float ----
export const ListeningMooring: React.FC<{
  x: number; y: number; scale?: number; f: number; detect?: number;
}> = ({x, y, scale = 1, f, detect = 0}) => {
  const id = uid(`moor${x}${y}`);
  const metal = tones('#5b6672');
  const d = Math.max(0, Math.min(1, detect));
  const floatBob = Math.sin(f / 20) * 7;
  const throb = 0.6 + 0.4 * Math.sin(f / 6);
  const DOME_Y = -150;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <FormGradient id={id} t={metal} />
      {/* sonar rings blooming from the dome when it detects a call */}
      {d > 0.04 && [0, 1, 2, 3].map((i) => {
        const phase = ((f / 26) + i / 4) % 1;
        const r = 16 + phase * 260 * d;
        return <circle key={i} cx={0} cy={DOME_Y} r={r} fill="none" stroke={MINT} strokeWidth={6 * (1 - phase) + 1} opacity={(1 - phase) * 0.6 * d} />;
      })}
      {/* tether up to a small surface float */}
      <line x1={0} y1={DOME_Y} x2={0} y2={DOME_Y - 190} stroke={metal.shade} strokeWidth={3} opacity={0.5} strokeDasharray="4 7" />
      <g transform={`translate(0,${DOME_Y - 200 + floatBob})`}>
        <circle cx={0} cy={0} r={15} fill={GOLD} stroke={INK} strokeWidth={4} />
        <circle cx={-4} cy={-4} r={4} fill="#fff" opacity={0.5} style={{mixBlendMode: 'screen'}} />
      </g>
      {/* anchor base sitting on the seabed */}
      <path d="M-70,0 L70,0 L46,-40 L-46,-40 Z" fill={metal.core} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <ellipse cx={0} cy={2} rx={78} ry={12} fill={INK} opacity={0.28} />
      {/* ribbed cylinder body */}
      <rect x={-26} y={-150} width={52} height={112} rx={10} fill={`url(#${id})`} stroke={INK} strokeWidth={5} />
      {[0, 1, 2].map((i) => <line key={i} x1={-26} y1={-120 + i * 34} x2={26} y2={-120 + i * 34} stroke={metal.shade} strokeWidth={3} opacity={0.6} />)}
      <RimLight d="M-24,-148 L24,-148" w={3.5} opacity={0.55} />
      {/* the mint hydrophone dome (the ear) */}
      <circle cx={0} cy={DOME_Y} r={22} fill="#0f1c1a" stroke={INK} strokeWidth={5} />
      <circle cx={0} cy={DOME_Y} r={13} fill={MINT} opacity={0.35 + 0.5 * throb} />
      <circle cx={0} cy={DOME_Y} r={6} fill="#eafff8" opacity={0.6 * throb} style={{mixBlendMode: 'screen'}} />
    </g>
  );
};
