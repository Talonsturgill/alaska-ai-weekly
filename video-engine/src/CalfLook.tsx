import React from 'react';
import {AbsoluteFill, useCurrentFrame, staticFile} from 'remotion';
import {BeachBG, CabinBG, OrbitBG, WalrusCalf, CarcassMound, ViewFrame, TrailCam, HaulPhoto, BearPrints, Pool, Kennel, Phone} from './lib/calf';

// look-dev harness for lib/calf.tsx, frames 0 beach, 60 cabin, 120 mechanism, 180 orbit
export const CalfLook: React.FC = () => {
  const f = useCurrentFrame();
  const S = Math.floor(f / 60);
  return (
    <AbsoluteFill style={{backgroundColor: '#101423'}}>
      <style>{`@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;}`}</style>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {S === 0 && (<>
          <BeachBG f={f} horizon={820} shore={1000} />
          <CarcassMound x={300} y={1180} scale={1.0} f={f} />
          <CarcassMound x={800} y={1250} scale={0.9} f={f} facing={-1} variant={1} />
          <WalrusCalf x={540} y={1210} f={f} scale={1.2} mood="afraid" shiver={0.5} />
          <BearPrints x={120} y={1500} n={5} />
          <ViewFrame x={540} y={1080} w={640} h={380} f={f} mode="bracket" k={1} lock={1} />
        </>)}
        {S === 1 && (<>
          <CabinBG f={f} />
          <WalrusCalf x={700} y={1180} f={f} scale={1.3} mood="sad" raise={1} call={0.8} />
          <ViewFrame x={700} y={760} w={300} h={360} f={f} mode="window" glow={1} />
        </>)}
        {S === 2 && (<>
          <rect x={0} y={0} width={1080} height={1920} fill="#2A2438" />
          <HaulPhoto x={60} y={520} w={460} h={340} f={f} marks={8} />
          <HaulPhoto x={560} y={520} w={460} h={340} f={f} marks={0} guess={1} learn={0.2} />
          <TrailCam x={300} y={1300} f={f} cone={1} />
          <Kennel x={760} y={1300} f={f} />
          <Pool x={540} y={1700} f={f} />
          <Phone x={900} y={1000} />
        </>)}
        {S === 3 && (<>
          <OrbitBG f={f} />
          <ViewFrame x={720} y={1250} w={300} h={220} f={f} mode="dotted" label="CARCASS?" k={1} />
          <ViewFrame x={300} y={1250} w={300} h={220} f={f} mode="box" label="COUNT" k={1} />
        </>)}
      </svg>
    </AbsoluteFill>
  );
};
