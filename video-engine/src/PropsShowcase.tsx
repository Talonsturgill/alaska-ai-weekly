import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {StatCard, Nameplate, SwingSign, GearLever, SurveyStake, MeasuringChain, PenAndDocument, TrailPost, BoundaryReveal} from './lib/props';
import {SledDogTeam} from './lib/fauna';

// look-dev: the generalized props kit + the promoted SledDogTeam, labeled.
const cap = (x: number, y: number, t: string) => (
  <text x={x} y={y} textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight={800} fontSize={26} fill="#5a6a74">{t}</text>
);

export const PropsShowcase: React.FC = () => {
  const f = useCurrentFrame();
  const cycle = (f % 90) / 90; // reveal/settle params loop so motion is visible
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#dfe8ee, #c8d6de)'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <StatCard x={280} y={140} big="$984M" sub="ANY STAT" scale={0.85} />
        {cap(280, 250, 'StatCard')}
        <Nameplate x={800} y={130} text="ANY ORG" sub="any subtitle" />
        {cap(800, 250, 'Nameplate')}

        <SwingSign x={280} y={430} f={f} lines={['ANY LINE ONE', 'LINE TWO', '2026']} dimLast />
        {cap(280, 610, 'SwingSign')}
        <GearLever x={790} y={480} pulled={cycle} deniedLabel="DENIED" />
        {cap(790, 610, 'GearLever')}

        <SurveyStake x={160} y={900} settle={Math.min(1, cycle * 1.5)} />
        {cap(160, 950, 'SurveyStake')}
        <MeasuringChain x1={260} y1={840} x2={640} y2={860} taut={cycle} label="2 MI" />
        {cap(450, 950, 'MeasuringChain')}
        <TrailPost x={880} y={900} top="AUG" bottom="19" />
        {cap(880, 950, 'TrailPost')}

        <PenAndDocument x={300} y={1060} hover={cycle} f={f} plate="ANY ORG" />
        {cap(400, 1310, 'PenAndDocument')}

        <BoundaryReveal revealT={cycle}
          d="M180,1420 L400,1380 L560,1420 L610,1540 L540,1640 L360,1660 L220,1590 L170,1500 Z"
          perim={1500} town={{x: 390, y: 1520, label: 'ANYTOWN'}} />
        {cap(390, 1710, 'BoundaryReveal')}

        <SledDogTeam x={780} y={1560} f={f} scale={1.1} vx={0} dogs={4} />
        {cap(780, 1710, 'SledDogTeam (4 dogs)')}
      </svg>
    </AbsoluteFill>
  );
};
