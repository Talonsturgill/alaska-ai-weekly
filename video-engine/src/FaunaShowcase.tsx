import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Moose, Raven, BaldEagle, Salmon, Grizzly} from './lib/fauna';
import {GradeLayer} from './lib/lighting';

// Look-dev sheet for the Alaska bestiary (lib/fauna.tsx). Not part of a dispatch;
// a place to audition new creatures at the depth-lighting bar before an episode
// uses them. Add a cell here whenever you add a creature.
const BOLD = 'Arial Black, Arial, sans-serif';

const Label: React.FC<{x: number; y: number; text: string}> = ({x, y, text}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: 'translateX(-50%)',
    fontFamily: BOLD, fontWeight: 900, fontSize: 30, color: '#101423', letterSpacing: 1}}>{text}</div>
);

export const FaunaShowcase: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#dfe8e0,#f2c9a0)'}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <rect x={0} y={1150} width={1080} height={770} fill="#4a5a3f" />
        <Moose x={300} y={520} scale={1.15} f={f} />
        <Grizzly x={300} y={1080} scale={0.95} f={f} stance="all4" />
        <Grizzly x={780} y={1780} scale={0.85} f={f} stance="stand" emotion="alert" facing={-1} />
        <BaldEagle x={800} y={430} scale={1.0} f={f} />
        <Raven x={250} y={1180} scale={1.4} f={f} mode="perch" />
        <Raven x={560} y={900} scale={1.1} f={f} mode="fly" />
        <Salmon x={800} y={1150} scale={1.5} f={f} />
      </svg>
      <Label x={300} y={640} text="MOOSE" />
      <Label x={800} y={560} text="BALD EAGLE" />
      <Label x={250} y={1300} text="RAVEN" />
      <Label x={800} y={1280} text="SOCKEYE" />
      <GradeLayer f={f} bloom={0.4} vignette={0.45} grain={0.05} />
    </AbsoluteFill>
  );
};
