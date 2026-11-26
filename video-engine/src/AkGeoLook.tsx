import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AK_PATH} from './lib/akmap';
import {AlaskaOutline, akProject, AK_TOWNS} from './lib/akgeo';

// AkGeoLook: the look-dev stand for lib/akgeo.tsx (machine pass 2026-11-26). Top: the stylised AK_PATH as
// films have drawn it. Below: AlaskaOutline, the true projected coastline, with every AK_TOWNS pin placed by
// akProject and a cited lon/lat (Point Lay, 69.74 N 163.01 W) to show a town off the gazetteer.
// Probe: scripts/probe_frames.sh AkGeoLook 0
const INK = '#1B1A22';
export const AkGeoLook: React.FC = () => {
  const fit = {x: 40, y: 760, w: 1000};
  const [plx, ply] = akProject(-163.01, 69.74, fit);
  return (
    <AbsoluteFill style={{backgroundColor: '#9FB7C2'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect width={1080} height={1920} fill="#9FB7C2" />
        <g transform="translate(140 120) scale(0.8)"><path d={AK_PATH} fill="#D9CFB8" stroke={INK} strokeWidth={4} /></g>
        <text x={540} y={700} textAnchor="middle" fontFamily="monospace" fontSize={30} fill={INK}>AK_PATH (stylised) above, AlaskaOutline (true) below</text>
        <AlaskaOutline {...fit} fill="#E7E2D2" stroke={INK} strokeWidth={2.5} towns={Object.keys(AK_TOWNS)} townR={5} />
        <circle cx={plx} cy={ply} r={8} fill="#2F5FD0" stroke={INK} strokeWidth={2} />
        <text x={plx + 12} y={ply + 6} fontFamily="monospace" fontSize={20} fill={INK}>POINT LAY</text>
      </svg>
    </AbsoluteFill>
  );
};
