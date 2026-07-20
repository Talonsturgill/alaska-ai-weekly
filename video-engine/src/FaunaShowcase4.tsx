import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Humpback, Ptarmigan, KingCrab, Mosquito} from './lib/fauna';

export const FaunaShowcase4: React.FC = () => {
  const f = useCurrentFrame();
  const cap = (x: number, y: number, s: string) => (
    <text x={x} y={y} textAnchor="middle" fontFamily="Arial Black" fontWeight={900} fontSize={30} fill="#2c3844" letterSpacing={2}>{s}</text>
  );
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#cdd9de 30%, #6f9ab8 31%, #4a7695)'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <KingCrab x={250} y={280} scale={1.2} f={f} scuttle={0.5} clawSnap={0.8} />
        {cap(250, 380, 'KING CRAB')}
        <Mosquito x={720} y={200} scale={2.2} f={f} />
        {cap(720, 380, 'MOSQUITO hover')}
        <Mosquito x={920} y={150} scale={1.8} f={f} swat={0.9} />
        <Humpback x={270} y={760} scale={1.0} f={f} mode="cruise" />
        {cap(270, 880, 'HUMPBACK cruise')}
        <Humpback x={800} y={700} scale={0.85} f={f} mode="breach" facing={-1} />
        {cap(800, 880, 'HUMPBACK breach')}
        <Humpback x={270} y={1310} scale={1.0} f={f} mode="fluke" />
        {cap(270, 1430, 'HUMPBACK fluke')}
        <Ptarmigan x={700} y={1290} scale={1.7} f={f} season="winter" />
        {cap(700, 1430, 'PTARMIGAN winter')}
        <Ptarmigan x={300} y={1720} scale={1.7} f={f} season="summer" />
        {cap(300, 1830, 'PTARMIGAN summer')}
        <Ptarmigan x={780} y={1700} scale={1.7} f={f} season="winter" flush={0.8} facing={-1} />
        {cap(780, 1830, 'PTARMIGAN flush')}
      </svg>
    </AbsoluteFill>
  );
};
