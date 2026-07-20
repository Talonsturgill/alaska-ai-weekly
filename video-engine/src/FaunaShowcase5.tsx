import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Lynx, MountainGoat, BlackBear, Walrus, Beluga} from './lib/fauna';

// look-dev: the five gap-list species that complete the bestiary, both poses.
const cap = (x: number, y: number, t: string) => (
  <text x={x} y={y} textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight={800} fontSize={26} fill="#5a6a74">{t}</text>
);

export const FaunaShowcase5: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#dfe8ee, #c8d6de)'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <Lynx x={190} y={300} f={f} scale={1.05} stance="sit" />
        {cap(190, 350, 'Lynx sit')}
        <Lynx x={700} y={290} f={f} scale={1.05} stance="stalk" />
        {cap(700, 350, 'Lynx stalk')}

        <MountainGoat x={210} y={640} f={f} scale={1.0} stance="stand" />
        {cap(210, 700, 'MountainGoat stand')}
        <MountainGoat x={720} y={620} f={f} scale={1.0} stance="climb" />
        {cap(720, 700, 'MountainGoat climb')}

        <BlackBear x={230} y={1010} f={f} scale={1.0} stance="all4" />
        {cap(230, 1060, 'BlackBear all4')}
        <BlackBear x={740} y={1010} f={f} scale={0.92} stance="stand" sniff={0.7} />
        {cap(740, 1060, 'BlackBear stand+sniff')}

        <Walrus x={250} y={1370} f={f} scale={1.05} huff={0.8} />
        {cap(250, 1424, 'Walrus huff')}
        <Beluga x={760} y={1330} f={f} scale={0.95} mode="spy" />
        {cap(760, 1424, 'Beluga spy')}

        <Beluga x={420} y={1660} f={f} scale={1.15} mode="cruise" blow={0.8} />
        {cap(420, 1780, 'Beluga cruise+blow')}
      </svg>
    </AbsoluteFill>
  );
};
