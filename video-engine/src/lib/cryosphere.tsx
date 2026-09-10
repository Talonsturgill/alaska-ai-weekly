import React from 'react';
import {ContactShadow, FormGradient, INK, RimLight, tones} from './lighting';
import {EvidenceTrace} from './spaceweather';
import {EvidenceState} from './evidence_state';

const ROCK = '#8E7356';
const ICE = '#69D2E7';
const SNOW = '#EAF4F4';

/**
 * A reusable rock-glacier cutaway whose evidence grammar is part of the asset.
 * The surface trace is solid and physical. Interpretation is an attributed chip.
 * A modeled water path is dotted and shadowless. Missing underground observations
 * are dashed empty geometry, so a caller cannot accidentally paint a model as proof.
 */
export const RockGlacierCore: React.FC<{
  f: number; x?: number; y?: number; scale?: number;
  creep?: number; pulse?: number; cutaway?: number;
  evidenceState?: 'observed' | 'interpreted' | 'modeled';
}> = ({f, x = 540, y = 900, scale = 1, creep = 0.5, pulse = 0,
  cutaway = 0, evidenceState = 'observed'}) => {
  const rock = tones(ROCK);
  const shift = Math.max(0, Math.min(1, creep)) * 24;
  const beat = Math.max(0, Math.min(1, pulse));
  const open = Math.max(0, Math.min(1, cutaway));
  const body = 'M-405 118 L-360 -8 L-286 -54 L-208 -28 L-135 -112 L-54 -78 L30 -154 L118 -104 L190 -121 L268 -42 L352 -8 L410 118 Q210 165 0 146 Q-220 172 -405 118Z';
  return <g transform={`translate(${x + shift},${y}) scale(${scale})`}>
    <defs><FormGradient id="rockGlacierCore" t={rock} softness={0.58}/></defs>
    <ContactShadow cx={0} cy={153} rx={390} ry={42} opacity={0.38}/>
    <path d={body} fill={`url(#rockGlacierCore)`} stroke={INK} strokeWidth={13} strokeLinejoin="round"/>
    <path d="M-376 110L-305 15L-236 42L-147-52L-70-21L26-91L117-48L188-70L270 4L366 112"
      fill="none" stroke={SNOW} strokeWidth={18} opacity={0.62}/>
    {open > 0.03 && <g opacity={open}>
      <path d="M-335 91Q-210 22-90 68T148 44T332 88L330 126Q160 153 0 137Q-170 151-335 124Z"
        fill="#173C48" stroke={INK} strokeWidth={8}/>
      {[-235,-92,54,196].map((xx,i)=><path key={xx} d={`M${xx} 105q42 ${-58-i*5} 83 -4`}
        fill="none" stroke={ICE} strokeWidth={12} strokeLinecap="round" opacity={0.72}/>) }
    </g>}
    <RimLight d="M-390 103L-352-2L-286-47L-208-22L-135-106L-54-72L30-148L118-98" w={7} opacity={0.68}/>
    <g transform="translate(-515 -340) scale(.92)">
      <EvidenceTrace d="M120 510C310 450 470 455 650 420C790 395 905 335 1005 285" f={f}
        state="observed" progress={Math.min(1, 0.25 + creep)} width={20} color={ICE}/>
    </g>
    {[0,1].map(i=><g key={i} opacity={beat} transform={`translate(${i ? 135 : -65},${-104-i*8})`}>
      <circle r={28 + 9*Math.sin(f/5+i)} fill="#FF4F8B" opacity={0.28}/>
      <circle r={13} fill="#FF4F8B" stroke={INK} strokeWidth={5}/>
    </g>)}
    {evidenceState === 'interpreted' && <EvidenceState state="interpreted" x={0} y={255}
      source="JGR EARTH SURFACE" label="INTERPRETED COMPONENTS" sublabel="SOURCE-LINKED" w={410}/>}
    {evidenceState === 'modeled' && <EvidenceState state="modeled"
      d="M-250 -210C-170 -95-190 20-90 80S75 120 182 42" fidelity={0.42} f={f}
      drawn={1} occupied={0} strokeWidth={5} phase={3}/>}
  </g>;
};
