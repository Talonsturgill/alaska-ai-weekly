import React from 'react';
import {AbsoluteFill, useCurrentFrame, staticFile} from 'remotion';
import {RingedSeal, SurveyPod} from './lib/iceseal';

// look-dev harness for lib/iceseal.tsx, frames 0 seal poses, 60 thermal + pixels, 120 survey pod states
export const SealLook: React.FC = () => {
  const f = useCurrentFrame();
  const S = Math.floor(f / 60);
  return (
    <AbsoluteFill style={{backgroundColor: '#BFE3F2'}}>
      <style>{`@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;}`}</style>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <rect x={0} y={900} width={1080} height={1020} fill="#F2F7F9" />
        {S === 0 && (<>
          <RingedSeal x={420} y={700} f={f} scale={1.4} emotion="calm" />
          <RingedSeal x={540} y={1150} f={f} scale={1.6} lift={1} emotion="curious" />
          <RingedSeal x={600} y={1600} f={f} scale={1.3} facing={-1} look={1} emotion="squint" />
        </>)}
        {S === 1 && (<>
          <rect x={0} y={0} width={1080} height={1920} fill="#2A1A40" />
          <RingedSeal x={540} y={700} f={f} scale={1.6} thermal={1} lift={0.5} />
          <RingedSeal x={540} y={1300} f={f} scale={3} pixels={1} thermal={1} />
          <RingedSeal x={540} y={1600} f={f} scale={3} pixels={1} />
        </>)}
        {S === 2 && (<>
          <SurveyPod x={540} y={300} f={f} scale={1.5} text="2019 · ARTIFICIAL INTELLIGENCE" plateSize={22} shutter={120} />
          <SurveyPod x={540} y={900} f={f} scale={1.5} text="SUPER INTELLIGENCE" gold plateGrow={1.5} lookDown={1} />
          <SurveyPod x={540} y={1450} f={f} scale={1.5} text="SUPER INTELLIGENCE" backText="SAME LEGAL DEFINITION" gold plateSpin={0.25} tilt={8} />
        </>)}
      </svg>
    </AbsoluteFill>
  );
};
