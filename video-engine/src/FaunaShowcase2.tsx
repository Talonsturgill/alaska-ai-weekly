import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Wolf, RedFox, DallSheep, SeaOtter} from './lib/fauna';

// look-dev batch 2: each asset in clear space on a neutral tundra-dusk ground
export const FaunaShowcase2: React.FC = () => {
  const f = useCurrentFrame();
  const cap = (x: number, y: number, s: string) => (
    <text x={x} y={y} textAnchor="middle" fontFamily="Arial Black" fontWeight={900} fontSize={30} fill="#3a4350" letterSpacing={2}>{s}</text>
  );
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#c9d6dc 40%, #8a9aa4 41%, #6e7d88)'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <Wolf x={270} y={520} scale={1.15} f={f} />
        {cap(270, 610, 'WOLF idle')}
        <Wolf x={800} y={520} scale={1.1} f={f} howl={1} facing={-1} />
        {cap(800, 610, 'WOLF howl')}
        <Wolf x={270} y={1050} scale={1.15} f={f} stalk={1} />
        {cap(270, 1140, 'WOLF stalk')}
        <RedFox x={780} y={1030} scale={1.5} f={f} />
        {cap(780, 1120, 'FOX idle')}
        <RedFox x={280} y={1600} scale={1.5} f={f} pounce={0.55} />
        {cap(280, 1700, 'FOX pounce')}
        <RedFox x={790} y={1620} scale={1.5} f={f} pounce={0.9} facing={-1} />
        {cap(790, 1700, 'FOX dive')}
      </svg>
    </AbsoluteFill>
  );
};
