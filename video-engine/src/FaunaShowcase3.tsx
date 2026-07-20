import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {DallSheep, SeaOtter} from './lib/fauna';

export const FaunaShowcase3: React.FC = () => {
  const f = useCurrentFrame();
  const cap = (x: number, y: number, s: string) => (
    <text x={x} y={y} textAnchor="middle" fontFamily="Arial Black" fontWeight={900} fontSize={30} fill="#3a4350" letterSpacing={2}>{s}</text>
  );
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#cdd9de 55%, #7fa8c9 56%, #5f88a9)'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <DallSheep x={270} y={480} scale={1.25} f={f} />
        {cap(270, 570, 'DALL RAM')}
        <DallSheep x={790} y={480} scale={1.25} f={f} graze={1} ewe facing={-1} />
        {cap(790, 570, 'DALL EWE graze')}
        <SeaOtter x={270} y={1200} scale={1.4} f={f} mode="float" withRock />
        {cap(270, 1330, 'OTTER float+rock')}
        <SeaOtter x={790} y={1180} scale={1.3} f={f} mode="dive" facing={-1} />
        {cap(790, 1330, 'OTTER dive')}
      </svg>
    </AbsoluteFill>
  );
};
