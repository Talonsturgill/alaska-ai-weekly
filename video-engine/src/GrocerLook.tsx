import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame} from 'remotion';
import {FlightCrate} from './lib/clinic';
import {KraftTag, Rotors, GroceryShelf, CodeSheet, ZoneBeam, DriftStack, UsdaGate, Calipers, RuralSwirl, SteelTag, PAL} from './lib/grocer';
import {GradeLayer} from './lib/lighting';
import {AlaskaMini} from './lib/kit';
import {StampBot} from './lib/credentials';
import {ReviewPen, TallyCounter} from './lib/props';
import {Raven} from './lib/fauna';
import {AnchorageSkylineBG} from './lib/biomes';

// Look-dev sheet for the new GROCER assets. Frames pick the panel: 0 tags, 30 shelf+code, 60 beam+gate, 90 crate+rotors, 120 misc.
export const GrocerLook: React.FC = () => {
  const f = useCurrentFrame();
  const panel = Math.floor(f / 30);
  return (
    <AbsoluteFill style={{backgroundColor: '#243B5A'}}>
      <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;}`}</style>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect width={1080} height={1920} fill="#2d4a70" />
        {panel === 0 && <g>
          <KraftTag x={270} y={420} f={f} front="blank" />
          <KraftTag x={800} y={420} f={f} front="smudge" />
          <KraftTag x={270} y={820} f={f} front="ruled" tick={0} />
          <KraftTag x={800} y={820} f={f} front="ruled" tick={1} />
          <KraftTag x={270} y={1220} f={f} front="measured" />
          <KraftTag x={800} y={1220} f={f} front="stamped" stamp={1} />
          <KraftTag x={270} y={1620} f={f} front="rule" back="rule" />
          <KraftTag x={800} y={1620} f={f} front="blank" destDots={1} />
        </g>}
        {panel === 1 && <g>
          <GroceryShelf x={540} y={1100} f={f} mess={1} />
          <CodeSheet x={540} y={1500} f={f} w={420} h={300} progress={0.7} comb={0.5} />
        </g>}
        {panel === 2 && <g>
          <ZoneBeam x={540} y={500} f={f} />
          <SteelTag x={540} y={600} f={f} />
          <UsdaGate x={540} y={1700} f={f} scale={0.9} />
        </g>}
        {panel === 3 && <g>
          <rect y={1300} width={1080} height={620} fill="#EEF3F5" />
          <Rotors x={540} y={1000} f={f} spin={1} />
          <FlightCrate x={540} y={1000} f={f} proposed={false} scale={1} groundY={1250} />
          <KraftTag x={540 - 0} y={780} f={f} front="blank" scale={0.5} />
        </g>}
        {panel === 5 && <g>
          <AlaskaMini frame={f} x={300} y={400} scale={1} />
          <StampBot f={f} x={800} y={400} />
          <ReviewPen x={300} y={900} f={f} color="#D9362B" grip={1} />
          <TallyCounter x={780} y={900} f={f} />
          <Raven x={300} y={1300} f={f} scale={1.5} mode="fly" />
          <Raven x={780} y={1300} f={f} scale={1.5} />
        </g>}
        {panel === 6 && <g><AnchorageSkylineBG f={f} season="fall" denali={false} floatplane={false} /></g>}
        {panel === 4 && <g>
          <DriftStack x={250} y={900} f={f} h={500} />
          <Calipers x={700} y={400} f={f} />
          <RuralSwirl f={f} cx={540} cy={1300} />
        </g>}
      </svg>
      <GradeLayer f={f} bloom={0.04} vignette={0.2} grain={0.04} warmth={0.02} />
    </AbsoluteFill>
  );
};
