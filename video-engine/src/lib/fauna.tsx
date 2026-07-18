import React from 'react';
import {INK} from './Character';
import {tones, FormGradient, RimLight, ContactShadow, LIGHT} from './lighting';

// =============================================================================
// FAUNA — the Alaska bestiary. The cast library had exactly one animal (the sled
// dog team, inline in an episode). Alaska stories constantly want wildlife, so
// this is the seed of a growing bestiary: land / air / water, each a bespoke,
// parameterized, idle-animated creature built to the depth-lighting bar
// (tones()/RimLight/ContactShadow) so it reads lit, not like flat clip-art.
//
// GROWTH DOCTRINE: every run ADDS to this file (a new creature, or a new pose/
// action on an existing one) — see prompts/dispatch_routine.md and
// lib/ASSET_MANIFEST.md. Do NOT let it stagnate into a fixed reuse pool.
//
// Convention: each creature draws in a local space with feet/belly near y=0,
// facing right by default; callers place with x/y/scale/facing and pass frame.
// =============================================================================

const uid = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `fa${(h >>> 0).toString(36)}`;
};

// ---------------------------------------------------------------- MOOSE
// The bull moose: heavy body, dropped muzzle, palmate antlers. Idle: slow head
// bob + ear flick + tail swish. Emotion via ear/brow set.
export const Moose: React.FC<{x: number; y: number; scale?: number; f: number; facing?: 1 | -1; emotion?: 'calm' | 'wary'}> = ({
  x, y, scale = 1, f, facing = 1, emotion = 'calm',
}) => {
  const id = uid(`moose${x}${y}`);
  const t = tones('#5a4632');       // dark brown coat
  const bob = 3 * Math.sin(f / 26);
  const earFlick = emotion === 'wary' ? 8 * Math.sin(f / 5) : 3 * Math.sin(f / 18);
  const tail = 6 * Math.sin(f / 9);
  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale})`}>
      <FormGradient id={id} t={t} />
      <ContactShadow cx={0} cy={4} rx={132} ry={22} opacity={0.3} blur={12} />
      {/* legs */}
      {[-84, -50, 54, 90].map((lx, i) => (
        <rect key={i} x={lx} y={-118} width={20} height={122} rx={7} fill={i < 2 ? t.core : t.shade} stroke={INK} strokeWidth={6} />
      ))}
      {/* body */}
      <path d="M-108,-150 q40,-56 118,-48 q70,4 96,44 q14,44 -8,86 q-100,26 -210,4 q-16,-44 4,-86 Z" fill={`url(#${id})`} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <path d="M96,-154 q14,44 -8,86 q-40,10 -84,10 q64,-40 40,-96 Z" fill={t.shade} opacity={0.55} />
      <RimLight d="M-108,-150 q40,-56 118,-48" w={4} opacity={0.55} />
      {/* shoulder hump */}
      <path d="M-70,-150 q30,-30 74,-24 q-30,-2 -50,20 Z" fill={t.key} opacity={0.4} />
      {/* neck + head */}
      <g transform={`translate(120,${-150 + bob}) rotate(${bob * 0.4})`}>
        <path d="M-40,10 q10,-46 46,-54 q40,-8 52,26 q6,44 -18,72 q-30,22 -52,4 q-26,-20 -28,-48 Z" fill={`url(#${id})`} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        {/* long muzzle */}
        <path d="M44,20 q46,4 58,34 q4,20 -16,28 q-30,8 -50,-8 q-8,-40 8,-54 Z" fill={t.core} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <ellipse cx={92} cy={54} rx={11} ry={9} fill={INK} />
        {/* dewlap (the bell) */}
        <path d="M20,58 q8,44 -4,66 q-14,-6 -14,-40 q0,-22 18,-26 Z" fill={t.shade} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {/* eye + brow */}
        <ellipse cx={40} cy={4} rx={8} ry={emotion === 'wary' ? 10 : 8} fill="#fff" stroke={INK} strokeWidth={3} />
        <circle cx={42} cy={5} r={4.5} fill={INK} />
        <path d={emotion === 'wary' ? 'M28,-12 q16,-8 30,-2' : 'M28,-8 q16,-4 30,2'} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        {/* ear, flicking */}
        <g transform={`translate(6,-28) rotate(${earFlick})`}>
          <path d="M0,0 q-22,-10 -30,-30 q18,-4 34,10 Z" fill={t.core} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        </g>
        {/* palmate antlers */}
        {[1, -1].map((s, i) => (
          <g key={i} transform={`translate(${8 + s * 2},-46) scale(${s},1)`}>
            <path d="M0,0 q34,-22 78,-14 q22,4 30,-14 q6,26 -18,34 q10,-2 26,-16 q0,24 -22,30 q10,0 22,-10 q-4,22 -30,24 q-46,4 -84,-24 Z"
              fill={t.key} stroke={INK} strokeWidth={6} strokeLinejoin="round" opacity={0.96} />
          </g>
        ))}
      </g>
      {/* tail */}
      <g transform={`translate(-116,-96) rotate(${tail})`}>
        <path d="M0,0 q-14,10 -10,30 q10,-4 14,-18 Z" fill={t.shade} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- RAVEN
// The trickster. Perched or in flight. Idle perched: head tilt + throat-hackle
// ruffle + occasional wing settle. Flight: wing-beat cycle. Iridescent black.
export const Raven: React.FC<{x: number; y: number; scale?: number; f: number; facing?: 1 | -1; mode?: 'perch' | 'fly'}> = ({
  x, y, scale = 1, f, facing = 1, mode = 'perch',
}) => {
  const id = uid(`raven${x}${y}`);
  const t = tones('#1b2230');       // near-black with a cool sheen
  const tilt = mode === 'perch' ? 5 * Math.sin(f / 20) : 0;
  const beat = Math.sin(f / 3.2);
  const wingA = mode === 'fly' ? 40 * beat : 8 + 4 * Math.sin(f / 22);
  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale})`}>
      <FormGradient id={id} t={t} />
      {mode === 'perch' && <ContactShadow cx={2} cy={6} rx={40} ry={9} opacity={0.28} blur={7} />}
      {/* far wing */}
      <g transform={`translate(-6,-52) rotate(${-wingA})`}>
        <path d="M0,0 q-56,6 -96,42 q40,6 70,-6 q-30,20 -54,20 q44,10 84,-24 Z" fill={t.shade} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      </g>
      {/* body */}
      <path d="M-34,-30 q10,-40 44,-40 q40,0 46,40 q4,44 -22,66 q-40,16 -68,-8 q-14,-30 0,-58 Z" fill={`url(#${id})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <RimLight d="M-34,-30 q10,-40 44,-40" w={3.5} opacity={0.5} />
      {/* iridescent sheen streak */}
      <path d="M-18,-56 q22,-8 40,4 q-6,18 -26,20 Z" fill="#3a5a7a" opacity={0.4} />
      {/* tail wedge */}
      <path d="M-30,20 q-40,10 -66,34 q30,2 52,-8 q-6,16 -22,26 q40,-2 60,-40 Z" fill={t.core} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {/* near wing */}
      <g transform={`translate(6,-54) rotate(${wingA})`}>
        <path d="M0,0 q60,4 104,44 q-44,6 -76,-8 q34,22 60,22 q-48,12 -92,-26 Z" fill={`url(#${id})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <RimLight d="M0,0 q60,4 104,44" w={3} opacity={0.45} />
      </g>
      {/* head + heavy beak, throat hackles */}
      <g transform={`translate(34,-70) rotate(${tilt})`}>
        <circle r={26} fill={`url(#${id})`} stroke={INK} strokeWidth={6} />
        <path d="M20,4 q40,-6 58,10 q-2,12 -18,12 q-30,0 -42,-10 Z" fill={t.core} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M20,10 q34,0 52,10" fill="none" stroke={INK} strokeWidth={3} opacity={0.6} />
        <circle cx={10} cy={-4} r={7} fill="#e8e0d0" stroke={INK} strokeWidth={3} />
        <circle cx={12} cy={-3} r={3.6} fill={INK} />
        {/* shaggy throat hackles */}
        <path d="M6,22 q-6,18 -18,26 q10,-2 18,-10 q-2,14 -12,22 q18,-6 24,-30 Z" fill={t.shade} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      </g>
      {mode === 'perch' && (
        <g stroke={INK} strokeWidth={5} strokeLinecap="round">
          <path d="M-8,30 l-4,24 M-14,54 l-8,4 M-14,54 l8,2 M12,30 l2,24 M8,54 l-8,4 M8,54 l10,2" />
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- BALD EAGLE
// In flight: broad plank wings, white head/tail, yellow hooked beak. Idle:
// wing-tip flex + slow soar tilt.
export const BaldEagle: React.FC<{x: number; y: number; scale?: number; f: number; facing?: 1 | -1}> = ({
  x, y, scale = 1, f, facing = 1,
}) => {
  const id = uid(`eagle${x}${y}`);
  const t = tones('#4a3524');       // dark chocolate body
  const flex = 6 * Math.sin(f / 8);
  const soar = 3 * Math.sin(f / 30);
  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale}) rotate(${soar})`}>
      <FormGradient id={id} t={t} />
      {/* wings, spread wide with fingered primaries */}
      {[1, -1].map((s, i) => (
        <g key={i} transform={`translate(0,-6) scale(${s},1) rotate(${s * flex})`}>
          <path d="M0,-6 q80,-30 150,-16 q26,4 44,-8 q-6,20 -28,26 q22,-2 40,-14 q-8,22 -34,28 q20,0 38,-10 q-10,22 -40,26 q-70,10 -120,-18 Z"
            fill={`url(#${id})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <RimLight d="M0,-6 q80,-30 150,-16" w={3} opacity={0.45} />
        </g>
      ))}
      {/* body */}
      <path d="M-22,-16 q22,-16 44,0 q14,44 4,96 q-26,16 -52,0 q-10,-52 4,-96 Z" fill={t.core} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {/* white tail */}
      <path d="M-18,74 q22,10 40,0 q-4,30 -20,40 q-16,-10 -20,-40 Z" fill="#f0ece0" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {/* white head + hooked yellow beak */}
      <g transform="translate(0,-40)">
        <circle r={26} fill="#f2eee2" stroke={INK} strokeWidth={6} />
        <path d="M-6,-52 a26,26 0 0 1 12,2 l-3,20 a20,20 0 0 0 -9,-2 Z" fill="#d8d2c2" opacity={0.6} />
        <path d="M18,2 q26,-2 30,14 q-4,10 -18,10 q4,8 -6,10 q-14,-2 -14,-18 Z" fill="#f2b937" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <circle cx={6} cy={-6} r={7} fill="#f2c94c" stroke={INK} strokeWidth={3} />
        <circle cx={8} cy={-5} r={3.4} fill={INK} />
        <path d="M-2,-14 q14,-6 24,2" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      </g>
      {/* talons tucked */}
      <path d="M-10,96 q-6,14 2,22 M6,96 q6,14 -2,22" fill="none" stroke="#f2b937" strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

// ---------------------------------------------------------------- SALMON
// The sockeye run. Idle/swim: body S-curve undulation + tail sweep. Spawning
// red body / green head option via `spawning`.
export const Salmon: React.FC<{x: number; y: number; scale?: number; f: number; facing?: 1 | -1; spawning?: boolean}> = ({
  x, y, scale = 1, f, facing = 1, spawning = true,
}) => {
  const id = uid(`salmon${x}${y}`);
  const body = spawning ? '#c0392b' : '#8fa2b0';
  const t = tones(body);
  const head = spawning ? '#3f6b3a' : '#5a6b74';
  const th = tones(head);
  const und = 10 * Math.sin(f / 6);        // body undulation
  const tailSweep = 22 * Math.sin(f / 5);
  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale})`}>
      <FormGradient id={id} t={t} />
      <FormGradient id={`${id}h`} t={th} />
      {/* tail */}
      <g transform={`translate(-96,${und * 0.4}) rotate(${tailSweep})`}>
        <path d="M0,0 q-34,-30 -48,-6 q10,6 22,4 q-16,20 -18,34 q30,-8 44,-26 q6,18 4,32 q22,-30 -4,-48 Z" fill={t.core} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      </g>
      {/* body, curved */}
      <path d={`M-92,${und * 0.4} q40,-52 96,${-40 + und} q60,${8 + und} 84,2 q-24,44 -84,${44 + und} q-56,${8 - und} -96,${-6 + und * 0.4} Z`}
        fill={`url(#${id})`} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <RimLight d={`M-92,${und * 0.4} q40,-52 96,${-40 + und}`} w={4} opacity={0.5} />
      {/* dorsal + adipose + pelvic fins */}
      <path d={`M-6,${-38 + und} q18,-22 40,-14 q-8,16 -30,20 Z`} fill={t.shade} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d={`M-24,${34 + und} q10,20 30,22 q-4,-18 -16,-28 Z`} fill={t.shade} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {/* green kype head */}
      <g transform={`translate(78,${und})`}>
        <path d="M0,-40 q40,-6 58,16 q10,20 -2,40 q-30,16 -58,2 q-14,-30 2,-58 Z" fill={`url(#${id}h)`} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        {/* hooked jaw (kype) */}
        <path d="M50,14 q30,2 40,22 q-2,10 -16,8 q6,10 -8,12 q-20,-2 -24,-24 Z" fill={th.core} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <circle cx={22} cy={-6} r={9} fill="#f0e6c8" stroke={INK} strokeWidth={3} />
        <circle cx={24} cy={-5} r={4.5} fill={INK} />
        <path d="M8,20 q22,6 40,2" fill="none" stroke={INK} strokeWidth={3} opacity={0.6} />
      </g>
    </g>
  );
};
