import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {MaterialDefs, matFill, MaterialName} from './lib/materials';
import {Stage3D, Extrude} from './lib/stage3d';

// look-dev: the eight materials as swatches on representative base colors,
// plus an Extrude demo proving a textured front face + lit side walls at depth.
const SWATCHES: Array<{m: MaterialName; base: string; label: string}> = [
  {m: 'brushedMetal', base: '#8C99A8', label: 'brushedMetal'},
  {m: 'corrugated', base: '#6a7a88', label: 'corrugated'},
  {m: 'tarmac', base: '#2b3340', label: 'tarmac'},
  {m: 'granite', base: '#7a7468', label: 'granite'},
  {m: 'bark', base: '#5c4326', label: 'bark'},
  {m: 'planks', base: '#8a6239', label: 'planks'},
  {m: 'snowpack', base: '#e8edf2', label: 'snowpack'},
  {m: 'ice', base: '#9cc6e0', label: 'ice'},
];

export const MaterialShowcase: React.FC = () => {
  const f = useCurrentFrame();
  const orbit = -14 + 10 * Math.sin(f / 40);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#3a4658, #232c38)'}}>
      <svg width={1080} height={1400} viewBox="0 0 1080 1400" style={{position: 'absolute'}}>
        <MaterialDefs />
        {SWATCHES.map((s, i) => {
          const col = i % 2, row = Math.floor(i / 2);
          const x = 70 + col * 500, y = 60 + row * 320;
          const d = `M${x},${y + 20} q0,-20 20,-20 l380,0 q20,0 20,20 l0,200 q0,20 -20,20 l-380,0 q-20,0 -20,-20 Z`;
          return (
            <g key={s.m}>
              <path d={d} fill={s.base} />
              <path d={d} fill={matFill(s.m)} />
              <path d={d} fill="none" stroke="#101423" strokeWidth={5} />
              <text x={x + 210} y={y + 280} textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight={800} fontSize={30} fill="#cfe0f2">{s.label}</text>
            </g>
          );
        })}
      </svg>
      {/* Extrude demo: planks sign slab, front textured, walls lit by orbit */}
      <div style={{position: 'absolute', top: 1360, left: 0, width: 1080, height: 560}}>
        <Stage3D camera={{rotY: orbit}}>
          <Extrude depth={70} slices={12} camRotY={orbit} base="#8a6239"
            render={(face, shade) => (
              <svg width={1080} height={560} viewBox="0 0 1080 560" style={{position: 'absolute'}}>
                <MaterialDefs />
                {face === 'front' ? (
                  <g>
                    <rect x={340} y={120} width={400} height={260} rx={18} fill="#8a6239" />
                    <rect x={340} y={120} width={400} height={260} rx={18} fill={matFill('planks')} />
                    <rect x={340} y={120} width={400} height={260} rx={18} fill="none" stroke="#101423" strokeWidth={7} />
                    <text x={540} y={230} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={44} fill="#efe6d0">EXTRUDE +</text>
                    <text x={540} y={300} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={44} fill="#efe6d0">MATERIAL</text>
                  </g>
                ) : (
                  <rect x={340} y={120} width={400} height={260} rx={18} fill={shade} />
                )}
              </svg>
            )} />
        </Stage3D>
      </div>
    </AbsoluteFill>
  );
};
