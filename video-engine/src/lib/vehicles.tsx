import React from 'react';
import {INK} from './Character';
import {tones, FormGradient, RimLight, ContactShadow} from './lighting';

// =============================================================================
// VEHICLES — the Alaska machine kit (asset-library session #2, 2026-07-20c).
// Same conventions as fauna.tsx: local coords, base/contact near y=0, facing
// right, caller passes frame. Built to the depth bar (tones/FormGradient/
// RimLight/ContactShadow) with idle life on every machine.
// =============================================================================

const uid = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `vh${(h >>> 0).toString(36)}`;
};

// ---------------------------------------------------------------- BUSH PLANE
// The Alaska icon: a high-wing taildragger (Super Cub silhouette) on oversized
// tundra tires or floats. `mode`: 'ground' (parked/taxi, prop idling slow),
// 'fly' (prop a blur disc, gentle bank bob), 'float' (on water, gentle heave).
// `propSpeed` 0..1 overrides the mode default. Rivets, struts, N-number panel.
export const BushPlane: React.FC<{
  x: number; y: number; scale?: number; f: number; facing?: 1 | -1;
  mode?: 'ground' | 'fly' | 'float'; propSpeed?: number; body?: string;
}> = ({x, y, scale = 1, f, facing = 1, mode = 'ground', propSpeed, body = '#c8452c'}) => {
  const id = uid(`plane${x}${y}`);
  const t = tones(body);
  const ps = propSpeed ?? (mode === 'ground' ? 0.25 : 1);
  const heave = mode === 'float' ? 3 * Math.sin(f / 18) : mode === 'fly' ? 4 * Math.sin(f / 22) : 0;
  const bank = mode === 'fly' ? 2.5 * Math.sin(f / 30) : 0;
  const prop = (f * (8 + ps * 80)) % 360;
  return (
    <g transform={`translate(${x},${y + heave}) scale(${scale * facing},${scale}) rotate(${bank})`}>
      <FormGradient id={id} t={t} />
      {mode === 'ground' && <ContactShadow cx={0} cy={4} rx={140} ry={20} opacity={0.3} blur={12} />}
      {/* floats or tundra tires */}
      {mode === 'float' ? (
        <g>
          {[-56, 44].map((fx, i) => (
            <g key={i}>
              <path d={`M${fx - 58},-14 q10,-16 36,-16 l84,0 q18,2 22,14 q-2,12 -22,12 l-98,0 q-18,-2 -22,-10 Z`}
                fill="#c9d2da" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
              <line x1={fx - 6} y1={-28} x2={fx + 4} y2={-64} stroke={INK} strokeWidth={7} />
              <line x1={fx + 34} y1={-28} x2={fx + 22} y2={-64} stroke={INK} strokeWidth={7} />
            </g>
          ))}
        </g>
      ) : (
        <g>
          {/* oversized tundra tires + tailwheel */}
          {[-6, 0].slice(0, 1).map(() => null)}
          <circle cx={38} cy={-16} r={26} fill="#20242c" stroke={INK} strokeWidth={6} />
          <circle cx={38} cy={-16} r={10} fill="#5d6570" stroke={INK} strokeWidth={4} />
          <line x1={38} y1={-40} x2={16} y2={-74} stroke={INK} strokeWidth={8} />
          <circle cx={-128} cy={-8} r={11} fill="#20242c" stroke={INK} strokeWidth={4.5} />
        </g>
      )}
      {/* fuselage: taildragger attitude (nose high) */}
      <g transform="rotate(-6)">
        <path d="M-150,-58 q-12,-4 -10,-16 q2,-10 16,-12 l44,-2 q30,-22 84,-24 l60,-2 q34,2 44,22 q8,18 -4,32 q-16,18 -52,20 l-120,4 q-42,-2 -62,-22 Z"
          fill={`url(#${id})`} stroke={INK} strokeWidth={6.5} strokeLinejoin="round" />
        {/* tail fin + stabilizer: a real rudder blade */}
        <path d="M-142,-72 q-14,-44 6,-72 q28,6 30,36 q2,24 -14,36 Z" fill={t.base} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
        <path d="M-152,-62 q-30,-2 -40,-16 q18,-12 48,-6 Z" fill={t.core} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {/* cabin glass */}
        <path d="M-6,-96 q10,-14 34,-14 l30,0 q-2,18 -16,24 q-24,6 -48,-2 Z" fill="#bfe0ef" stroke={INK} strokeWidth={5} />
        <path d="M-2,-92 q8,-10 26,-11 l-4,14 q-12,4 -22,-3 Z" fill="#eef8fd" opacity={0.7} />
        {/* the high wing over the cabin: a real airfoil slab + lift strut */}
        <path d="M-88,-112 l196,-8 q20,2 20,15 q0,13 -20,15 l-196,6 q-16,-2 -16,-14 q0,-12 16,-14 Z" fill={t.key} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
        <path d="M-84,-102 l188,-7" stroke={t.shade} strokeWidth={4} opacity={0.6} />
        <line x1={-20} y1={-96} x2={4} y2={-56} stroke={INK} strokeWidth={7} />
        <line x1={44} y1={-99} x2={22} y2={-56} stroke={INK} strokeWidth={7} />
        {/* engine cowl + exhaust */}
        <path d="M114,-88 q22,2 26,20 q2,14 -10,22 q-14,8 -26,2 l2,-42 Z" fill={t.shade} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
        {/* N-number panel + rivets (detail density) */}
        <rect x={-96} y={-72} width={64} height={20} rx={4} fill="#f2ead8" stroke={INK} strokeWidth={3.5} />
        <text x={-64} y={-57} textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight={900} fontSize={14} fill={INK}>N907AK</text>
        {[-120, -40, 20, 76].map((rx2, i) => <circle key={i} cx={rx2} cy={-46} r={2.5} fill={t.shade} opacity={0.8} />)}
        <RimLight d="M-150,-58 q-12,-4 -10,-16 q2,-10 16,-12 l44,-2 q30,-22 84,-24" w={3.5} opacity={0.55} />
        {/* the prop: blur disc at speed, visible blades slow */}
        <g transform={`translate(146,-64) rotate(${prop})`}>
          {ps > 0.55 ? (
            <>
              <ellipse cx={0} cy={0} rx={10} ry={64} fill="#cdd6e0" opacity={0.5} />
              <ellipse cx={0} cy={0} rx={10} ry={64} fill="none" stroke="#eef4fb" strokeWidth={2.5} opacity={0.6} />
            </>
          ) : (
            <>
              <rect x={-4} y={-54} width={8} height={50} rx={4} fill="#3a2e22" stroke={INK} strokeWidth={3.5} />
              <rect x={-4} y={4} width={8} height={50} rx={4} fill="#3a2e22" stroke={INK} strokeWidth={3.5} />
            </>
          )}
          <circle r={8} fill="#8b93a0" stroke={INK} strokeWidth={4} />
        </g>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- SNOWMACHINE
// The rural winter workhorse (snowmobile), with an optional parka rider lean.
// `speed` 0..1: track blur + kicked snow spray + forward lean.
export const Snowmachine: React.FC<{
  x: number; y: number; scale?: number; f: number; facing?: 1 | -1; speed?: number; body?: string;
}> = ({x, y, scale = 1, f, facing = 1, speed = 0, body = '#2e6fb8'}) => {
  const id = uid(`snow${x}${y}`);
  const t = tones(body);
  const sp = Math.max(0, Math.min(1, speed));
  const vib = sp * 1.6 * Math.sin(f * 1.9);
  return (
    <g transform={`translate(${x},${y + vib})`}>
      <g transform={`scale(${scale * facing},${scale})`}>
        <FormGradient id={id} t={t} />
        <ContactShadow cx={0} cy={4} rx={110} ry={16} opacity={0.3} blur={10} />
        {/* track (rear) + ski (front) */}
        <path d="M-96,-12 q-8,-22 12,-28 l70,-4 q16,4 18,18 q0,12 -16,14 l-68,4 q-12,0 -16,-4 Z" fill="#1c222c" stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
        {/* track lugs scroll with speed */}
        {[0, 1, 2, 3, 4].map((k) => (
          <rect key={k} x={-88 + ((k * 18 + f * sp * 6) % 86)} y={-14} width={7} height={10} rx={2} fill="#3a4350" />
        ))}
        <path d={`M52,-8 q4,-10 18,-10 l44,0 q10,2 8,10 l-6,4 -58,0 Z`} fill="#c9d2da" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <line x1={78} y1={-16} x2={64} y2={-46} stroke={INK} strokeWidth={7} />
        {/* body/tunnel + hood */}
        <path d="M-92,-36 q-6,-18 12,-24 l58,-8 q40,-18 78,-10 q26,6 30,26 q2,16 -14,22 l-118,10 q-36,2 -46,-16 Z"
          fill={`url(#${id})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M52,-78 q22,-2 32,12 q6,12 -2,20 q-18,-22 -44,-22 Z" fill={t.shade} opacity={0.6} />
        {/* windshield + handlebars + seat */}
        <path d="M46,-84 q16,-16 34,-12 l-6,22 q-16,2 -28,-10 Z" fill="#bfe0ef" stroke={INK} strokeWidth={4.5} />
        <line x1={70} y1={-92} x2={84} y2={-72} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <path d="M-78,-52 l64,-6 q10,4 2,12 l-62,6 q-8,-4 -4,-12 Z" fill="#20242c" stroke={INK} strokeWidth={4.5} />
        <RimLight d="M-92,-36 q-6,-18 12,-24 l58,-8 q40,-18 78,-10" w={3.5} opacity={0.55} />
        {/* headlight */}
        <circle cx={96} cy={-52} r={7} fill={sp > 0.1 ? '#ffe9a8' : '#8b93a0'} stroke={INK} strokeWidth={3.5} />
      </g>
      {/* kicked snow spray behind, at speed (drawn unflipped-safe) */}
      {sp > 0.15 && (
        <g transform={`scale(${facing},1)`} opacity={0.7 * sp}>
          {[0, 1, 2, 3, 4].map((k) => (
            <circle key={k} cx={-108 - k * 16 - ((f * 5 + k * 9) % 22)} cy={-8 - (k % 3) * 8 - ((f * 3 + k * 7) % 14)}
              r={5 + (k % 3) * 3} fill="#eef4fb" opacity={0.8 - k * 0.13} />
          ))}
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- FISHING BOAT
// A seiner/troller work boat: hull with a bow sheer, wheelhouse, mast + boom,
// net drum aft. `heave` 0..1 rocks it on a swell; nav light blinks; a gull-
// perch point at the masthead (pair with Raven/Puffin).
export const FishingBoat: React.FC<{
  x: number; y: number; scale?: number; f: number; facing?: 1 | -1; heave?: number; hull?: string;
}> = ({x, y, scale = 1, f, facing = 1, heave = 0.5, hull = '#2f5f4e'}) => {
  const id = uid(`boat${x}${y}`);
  const t = tones(hull);
  const hv = Math.max(0, Math.min(1, heave));
  const rock = hv * 2.2 * Math.sin(f / 16);
  const lift = hv * 3 * Math.sin(f / 13);
  return (
    <g transform={`translate(${x},${y + lift}) scale(${scale * facing},${scale}) rotate(${rock})`}>
      <FormGradient id={id} t={t} />
      {/* hull with bow sheer */}
      <path d="M-150,-38 q-10,-16 2,-26 l282,-6 q26,2 34,20 l10,24 q-60,14 -170,14 q-100,0 -146,-14 Z"
        fill={`url(#${id})`} stroke={INK} strokeWidth={6.5} strokeLinejoin="round" />
      <path d="M134,-70 q26,2 34,20 l10,24 q-30,7 -72,11 q24,-30 28,-55 Z" fill={t.shade} opacity={0.5} />
      {/* waterline stripe + hull rub rail */}
      <path d="M-148,-36 l290,-8" stroke="#e8dcc8" strokeWidth={5} opacity={0.9} />
      <RimLight d="M-150,-38 q-10,-16 2,-26 l282,-6" w={4} opacity={0.55} />
      {/* wheelhouse forward */}
      <path d="M42,-118 q2,-24 24,-26 l44,-2 q18,2 20,20 l2,56 -90,4 Z" fill="#f2ead8" stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      <rect x={58} y={-132} width={58} height={22} rx={5} fill={t.core} stroke={INK} strokeWidth={4.5} />
      <path d="M62,-136 l50,0 0,-8 -50,0 Z" fill={t.shade} stroke={INK} strokeWidth={3.5} />
      {/* windows */}
      {[70, 96].map((wx, i) => <rect key={i} x={wx} y={-112} width={20} height={16} rx={3} fill="#bfe0ef" stroke={INK} strokeWidth={3.5} />)}
      {/* mast + boom + rigging */}
      <line x1={-10} y1={-64} x2={-10} y2={-188} stroke={INK} strokeWidth={8} />
      <line x1={-10} y1={-168} x2={-118} y2={-92} stroke={INK} strokeWidth={6} />
      <line x1={-10} y1={-188} x2={-128} y2={-70} stroke="#8b93a0" strokeWidth={2.5} />
      <line x1={-10} y1={-188} x2={104} y2={-118} stroke="#8b93a0" strokeWidth={2.5} />
      {/* nav light blink at the masthead */}
      <circle cx={-10} cy={-194} r={6} fill={((f % 50) < 25) ? '#ff5a4d' : '#5a1f1c'} stroke={INK} strokeWidth={3} />
      {/* net drum aft with wound net */}
      <g transform="translate(-104,-72)">
        <circle r={26} fill="#8b93a0" stroke={INK} strokeWidth={5} />
        <circle r={16} fill="#5d6570" stroke={INK} strokeWidth={4} />
        {[0, 1, 2].map((k) => <circle key={k} r={20 - k * 3} fill="none" stroke="#3a4350" strokeWidth={2} opacity={0.8} />)}
      </g>
      {/* buoys along the rail */}
      {[-56, -20, 14].map((bx, i) => (
        <circle key={i} cx={bx} cy={-52} r={9} fill={i % 2 ? '#f08a2e' : '#c8452c'} stroke={INK} strokeWidth={3.5} />
      ))}
    </g>
  );
};
