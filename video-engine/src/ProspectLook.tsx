import React from 'react';
import {AbsoluteFill, useCurrentFrame, staticFile} from 'remotion';
import {GradeLayer} from './lib/lighting';
import {AlaskaMini} from './lib/kit';
import {Character} from './lib/Character';
import {PR, Plumb, plumbTip, DrillBit, VellumSheet, HangTag, HollowQ, Zzz, SurveyHeli, Globe, RockBlock, TableBG, LampArm, DuskTundraBG, PaperPlane, PinOutline, DownloadArrow, DepositBlob, ReleaseScroll, RollTube, Pedestal, Loupe} from './lib/prospect';

// look-dev harness for lib/prospect.tsx: frame 0 table, 60 bit states, 120 heli + tundra, 180 globe, 240 block, 300 paper kit, 360 bench
export const ProspectLook: React.FC = () => {
  const f = useCurrentFrame();
  const S = Math.floor(f / 60);
  const g = f % 60 + 40;
  return (
    <AbsoluteFill style={{backgroundColor: PR.night}}>
      <style>{`@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;}`}</style>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {S === 0 && (<>
          <TableBG f={g} lampX={420} lampY={900} />
          <VellumSheet x={540} y={1000} w={820} h={1040} rot={-3} f={g} contours={1} rows={0.6} patch={1} patchX={-40} patchY={60} glow={0.4} />
          <Plumb x={540} y={160} len={780} f={g} mood="wary" tremble={1} tag={<HangTag text="ITS WORDS" size={26} f={g} />} />
          <DrillBit x={850} y={1660} f={g} scale={0.9} tilt={1} tarp={1} twitch={0.5} />
          <Zzz x={760} y={1560} f={g} />
          <LampArm x={80} y={80} f={g} />
          <HollowQ x={250} y={1100} f={g} />
        </>)}
        {S === 1 && (<>
          <TableBG f={g} lampX={540} lampY={900} />
          <DrillBit x={200} y={900} f={g} scale={0.9} tilt={1} tarp={1} />
          <DrillBit x={540} y={900} f={g} scale={0.9} tilt={0.6} tarp={0.1} eyes={1} yawn={0.8} />
          <DrillBit x={880} y={900} f={g} scale={0.9} tilt={0} tarp={0} cape={0} brow={8} shake={1} />
          <DrillBit x={300} y={1500} f={g} scale={1.2} tilt={0} tarp={0} cape={1} />
          <DrillBit x={780} y={1500} f={g} scale={1.2} tilt={0} tarp={0} spin={1} dust={1} sink={26} />
        </>)}
        {S === 2 && (<>
          <DuskTundraBG f={g} />
          <SurveyHeli x={500} y={700} f={g} scale={1.2} bird={220} swing={10} tilt={-3} />
          <SurveyHeli x={300} y={1200} f={g} scale={0.6} facing={-1} bird={120} swing={-6} />
        </>)}
        {S === 3 && (<>
          <rect x={0} y={0} width={1080} height={1920} fill={PR.spruceDeep} />
          <VellumSheet x={320} y={1500} w={420} h={300} f={g} rows={1} rowCount={10} />
          <Globe x={560} y={900} r={270} f={g} wrap={1.45} tail={1} />
        </>)}
        {S === 4 && (<>
          <rect x={0} y={0} width={1080} height={1920} fill={PR.spruceDeep} />
          <RockBlock x={500} y={1300} f={g} field={1} glow={1} bend={1} />
          <DrillBit x={900} y={1500} f={g} scale={0.9} tilt={0} eyes={1} brow={10} />
        </>)}
        {S === 5 && (<>
          <TableBG f={g} lampX={540} lampY={900} />
          <AlaskaMini frame={g} x={80} y={500} scale={1.6} pin={false} />
          <PinOutline x={470} y={900} f={g} />
          <PaperPlane x={700} y={700} rot={-14} f={g} />
          <DownloadArrow x={900} y={1000} f={g} />
          <DepositBlob x={300} y={1300} f={g} />
          <ReleaseScroll x={760} y={1350} f={g} unroll={0.8} />
          <RollTube x={120} y={1620} f={g} out={0.6} />
          <Pedestal x={900} y={1700} />
        </>)}
        {S === 6 && (<>
          <TableBG f={g} lampX={540} lampY={900} />
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <Character frame={g} x={120 + i * 210} y={1200} scale={0.5} facing={1} pose="carry" emotion="neutral" outfit={i % 2 ? 'flannel' : 'puffer'} headgear="bare" />
              <Loupe x={120 + i * 210 + 120 * 0.5} y={1200 - 190 * 0.5} scale={0.7} />
            </g>
          ))}
        </>)}
      </svg>
      <GradeLayer f={f} bloom={0.05} vignette={0.28} grain={0.05} warmth={0.02} />
    </AbsoluteFill>
  );
};
