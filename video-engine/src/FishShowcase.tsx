import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Salmon, Coho, RainbowTrout, Halibut} from './lib/fauna';
import {GradeLayer} from './lib/lighting';

// Fish-mastery look-dev sheet (2026-07-21). Audition each species at the
// depth-lighting + anatomy bar before an episode uses it. Grid of species and
// phases, plus a big chrome hero (owner: silver-and-shiny is the default look).
const BOLD = 'Arial Black, Arial, sans-serif';
const Label: React.FC<{x: number; y: number; text: string; sz?: number}> = ({x, y, text, sz = 26}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: 'translateX(-50%)',
    fontFamily: BOLD, fontWeight: 900, fontSize: sz, color: '#101423', letterSpacing: 1}}>{text}</div>
);

export const FishShowcase: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#cfe0e6,#8fb2ba)'}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        {/* water depth wash */}
        <rect x={0} y={0} width={1080} height={1920} fill="#3f6f74" opacity={0.12} />
        {/* row 1: sockeye phases */}
        <g transform="translate(268,240)"><Salmon x={0} y={0} scale={1.3} f={f} spawning={false} /></g>
        <g transform="translate(806,240)"><Salmon x={0} y={0} scale={1.3} f={f + 30} spawning /></g>
        {/* row 2: coho phases */}
        <g transform="translate(268,560)"><Coho x={0} y={0} scale={1.3} f={f + 12} spawning={false} /></g>
        <g transform="translate(806,560)"><Coho x={0} y={0} scale={1.3} f={f + 44} spawning /></g>
        {/* row 3: rainbow trout + halibut */}
        <g transform="translate(268,880)"><RainbowTrout x={0} y={0} scale={1.3} f={f + 20} /></g>
        <g transform="translate(790,880)"><Halibut x={0} y={0} scale={1.08} f={f + 8} /></g>
        {/* HERO: ocean coho at scale, the chrome standard-bearer */}
        <g transform="translate(560,1480)"><Coho x={0} y={0} scale={2.55} f={f} spawning={false} /></g>
      </svg>
      <Label x={268} y={340} text="SOCKEYE · OCEAN" />
      <Label x={806} y={340} text="SOCKEYE · SPAWN" />
      <Label x={268} y={660} text="COHO · OCEAN" />
      <Label x={806} y={660} text="COHO · SPAWN" />
      <Label x={268} y={980} text="RAINBOW TROUT" />
      <Label x={790} y={1000} text="PACIFIC HALIBUT" />
      <Label x={560} y={1700} text="COHO HERO · CHROME" sz={30} />
      <GradeLayer f={f} bloom={0.35} vignette={0.4} grain={0.05} />
    </AbsoluteFill>
  );
};
