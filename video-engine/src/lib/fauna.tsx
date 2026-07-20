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
// LIBRARY DOCTRINE (rebalanced 2026-07-20): CAST from this bestiary by default —
// reuse with fresh staging is the point. Grow it when a story finds a real gap
// (see prompts/dispatch_routine.md §4.3a and lib/ASSET_MANIFEST.md).
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
// `bumpKick` (0..1, e.g. from lib/motion accentKick at the gag's frame) drives the
// NEW 2026-07-19 comic reaction pose: a sharp squash-and-recoil sideways stagger,
// antlers wobbling, ears pinned back indignant, added for the recurring
// bumped-from-the-ticket-line gag — the growth mandate's new-pose-on-an-existing-
// asset requirement. 0 = no effect (normal idle), rises to 1 at the impact frame
// then relaxes back per the caller's easing.
export const Moose: React.FC<{x: number; y: number; scale?: number; f: number; facing?: 1 | -1; emotion?: 'calm' | 'wary'; bumpKick?: number; alert?: number}> = ({
  x, y, scale = 1, f, facing = 1, emotion = 'calm', bumpKick = 0, alert = 0,
}) => {
  const id = uid(`moose${x}${y}`);
  const t = tones('#5a4632');       // dark brown coat
  const bumped = Math.max(0, Math.min(1, bumpKick));
  // NEW 2026-07-20 pose `alert` (0..1): ears perk fully UP + forward, head/neck
  // RAISES, a nostril-flare sniff, eyes track upward at the passing drone. The
  // OPPOSITE motion from `bumpKick` (a lateral squash-recoil): no shove, an upward
  // watching lift. Satisfies the existing-asset new-pose growth quota.
  const al = Math.max(0, Math.min(1, alert));
  const bob = 3 * Math.sin(f / 26) - bumped * 10;
  const earFlick = (emotion === 'wary' ? 8 * Math.sin(f / 5) : 3 * Math.sin(f / 18)) - bumped * 22 - al * 26;
  const tail = 6 * Math.sin(f / 9);
  // squash-and-stagger: a lateral shove + a volume-preserving squash at the moment
  // of impact, recoiling back upright as bumped relaxes to 0.
  const staggerX = -bumped * 68 * facing;
  const sx = 1 + bumped * 0.26;
  const sy = 1 - bumped * 0.2;
  return (
    <g transform={`translate(${x + staggerX},${y}) scale(${scale * facing * sx},${scale * sy})`}>
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
      {/* neck + head — `alert` raises + tilts the head up to watch the sky */}
      <g transform={`translate(120,${-150 + bob - al * 26}) rotate(${bob * 0.4 - bumped * 16 * facing - al * 12 * facing})`}>
        <path d="M-40,10 q10,-46 46,-54 q40,-8 52,26 q6,44 -18,72 q-30,22 -52,4 q-26,-20 -28,-48 Z" fill={`url(#${id})`} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        {/* long muzzle */}
        <path d="M44,20 q46,4 58,34 q4,20 -16,28 q-30,8 -50,-8 q-8,-40 8,-54 Z" fill={t.core} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <ellipse cx={92} cy={54} rx={11} ry={9} fill={INK} />
        {/* dewlap (the bell) */}
        <path d="M20,58 q8,44 -4,66 q-14,-6 -14,-40 q0,-22 18,-26 Z" fill={t.shade} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {/* eye + brow: bumped adds a wide indignant take; alert tracks the pupil UP */}
        <ellipse cx={40} cy={4} rx={8} ry={bumped > 0.3 || al > 0.3 ? 11 : emotion === 'wary' ? 10 : 8} fill="#fff" stroke={INK} strokeWidth={3} />
        <circle cx={42 + (bumped > 0.3 ? -3 : 0)} cy={5 - al * 5} r={bumped > 0.3 ? 3.4 : 4.5} fill={INK} />
        {/* alert: a nostril-flare sniff line at the muzzle tip */}
        {al > 0.3 && <path d="M96,50 q10,-4 14,2" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={Math.min(1, (al - 0.3) * 2)} />}
        <path d={bumped > 0.3 ? 'M26,-16 q18,-10 32,-2' : emotion === 'wary' ? 'M28,-12 q16,-8 30,-2' : 'M28,-8 q16,-4 30,2'} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        {/* ear, flicking (pinned back indignant when bumped) */}
        <g transform={`translate(6,-28) rotate(${earFlick})`}>
          <path d="M0,0 q-22,-10 -30,-30 q18,-4 34,10 Z" fill={t.core} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        </g>
        {/* palmate antlers — wobble on impact */}
        {[1, -1].map((s, i) => (
          <g key={i} transform={`translate(${8 + s * 2},-46) rotate(${bumped * 10 * s}) scale(${s},1)`}>
            <path d="M0,0 q34,-22 78,-14 q22,4 30,-14 q6,26 -18,34 q10,-2 26,-16 q0,24 -22,30 q10,0 22,-10 q-4,22 -30,24 q-46,4 -84,-24 Z"
              fill={t.key} stroke={INK} strokeWidth={6} strokeLinejoin="round" opacity={0.96} />
          </g>
        ))}
        {/* small impact stars when the bump lands, cheap comic punctuation */}
        {bumped > 0.5 && (
          <g transform="translate(70,-20)" opacity={Math.min(1, (bumped - 0.5) * 3)}>
            {[0, 120, 240].map((rot, i) => (
              <path key={i} d="M0,-14 L4,-3 L14,0 L4,3 L0,14 L-4,3 L-14,0 L-4,-3 Z" fill="#ffd23e" stroke={INK} strokeWidth={2.5}
                transform={`rotate(${rot + f * 6}) translate(${18 + i * 6},0)`} />
            ))}
          </g>
        )}
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

// ---------------------------------------------------------------- GRIZZLY (v2)
// NET-NEW 2026-07-20c (asset-library session, UPGRADE #2). Brown bear with
// PURPOSE-BUILT anatomy per stance (v1 rotated one body path and read as a
// potato — taste-loop redo): 'all4' (massive horizontal bulk, hump the highest
// point, head slung forward BELOW the hump line), 'stand' (the iconic upright
// tower: pear-shaped trunk, wide planted hind legs, dangling forepaws),
// 'fish' (all4 with the head dropped to the waterline, jaw ready). Idle: breath
// swell + head sway + ear flicks. `roar` 0..1 throws the head + opens the jaw.
export const Grizzly: React.FC<{
  x: number; y: number; scale?: number; f: number; facing?: 1 | -1;
  stance?: 'all4' | 'stand' | 'fish'; emotion?: 'calm' | 'alert'; roar?: number;
}> = ({x, y, scale = 1, f, facing = 1, stance = 'all4', emotion = 'calm', roar = 0}) => {
  const id = uid(`griz${x}${y}${stance}`);
  const t = tones('#6b4a2f');
  const rr = Math.max(0, Math.min(1, roar));
  const breath = 1 + 0.014 * Math.sin(f / 16);
  const sway = 3 * Math.sin(f / 24);
  const earFlick = emotion === 'alert' ? -14 : 3 * Math.sin(f / 19 + 2);

  // ---- the head is shared (drawn at a stance-chosen anchor) ----
  const Head: React.FC<{hx: number; hy: number; rot?: number}> = ({hx, hy, rot = 0}) => (
    <g transform={`translate(${hx},${hy + sway}) rotate(${rot + sway * 0.5 - rr * 18})`}>
      <path d="M-36,-8 q4,-40 42,-46 q36,-6 52,20 q10,18 2,38 q-14,26 -48,22 q-40,-4 -48,-34 Z"
        fill={`url(#${id})`} stroke={INK} strokeWidth={6.5} strokeLinejoin="round" />
      <path d="M52,-16 q26,-2 32,14 q2,14 -12,18 q-20,6 -32,-6 q-2,-20 12,-26 Z" fill="#8a6a48" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <ellipse cx={78} cy={2} rx={8} ry={6.5} fill={INK} />
      <g transform={`rotate(${rr * 26} 30 16)`}>
        <path d="M30,14 q26,4 42,14 q-4,12 -22,12 q-22,-2 -26,-14 Z" fill={t.core} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {rr > 0.25 && [0, 1].map((k) => <path key={k} d={`M${44 + k * 12},22 l4,8 l5,-7`} fill="#fff" stroke={INK} strokeWidth={2} />)}
      </g>
      <ellipse cx={24} cy={-18} rx={7} ry={emotion === 'alert' ? 9 : 7} fill="#fff" stroke={INK} strokeWidth={3} />
      <circle cx={26} cy={-17} r={3.8} fill={INK} />
      <path d={emotion === 'alert' ? 'M12,-32 q14,-8 26,-3' : 'M12,-28 q14,-4 26,0'} fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
      <g transform={`translate(-14,-42) rotate(${earFlick})`}>
        <circle r={13} fill={t.core} stroke={INK} strokeWidth={5} /><circle r={6} fill={t.shade} />
      </g>
      <g transform="translate(24,-48) rotate(6)">
        <circle r={12} fill={t.base} stroke={INK} strokeWidth={5} /><circle r={5.5} fill={t.shade} />
      </g>
    </g>
  );

  if (stance === 'stand') {
    // ---- UPRIGHT TOWER: purpose-built pear trunk, planted hinds, dangling paws ----
    const paw = 5 * Math.sin(f / 18);
    return (
      <g transform={`translate(${x},${y}) scale(${scale * facing},${scale})`}>
        <FormGradient id={id} t={t} />
        <ContactShadow cx={0} cy={4} rx={104} ry={20} opacity={0.3} blur={12} />
        {/* planted hind legs, wide */}
        {[-58, 22].map((lx, i) => (
          <path key={i} d={`M${lx},-90 q-8,50 -4,88 l38,0 q4,-40 -4,-86 Z`} fill={i ? t.shade : t.core} stroke={INK} strokeWidth={6} />
        ))}
        {/* pear-shaped trunk: narrow shoulders swelling to a wide rump, hump at the top-back */}
        <g transform={`scale(1,${breath})`} style={{transformOrigin: '0px -220px'} as any}>
          <path d="M-92,-84 q-24,-96 -8,-196 q10,-72 66,-92 q60,-20 104,22 q30,32 26,96 q-4,88 -22,170 q-72,28 -166,0 Z"
            fill={`url(#${id})`} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          <path d="M70,-350 q30,32 26,96 q-4,88 -22,170 q-34,12 -60,12 q52,-120 20,-256 Z" fill={t.shade} opacity={0.5} />
          {/* hump at the top-back shoulder */}
          <path d="M-66,-358 q26,-26 66,-24 q-30,12 -44,34 Z" fill={t.key} opacity={0.45} />
          <RimLight d="M-92,-84 q-24,-96 -8,-196 q10,-72 66,-92" w={4} opacity={0.55} />
          {/* belly fur break-up */}
          {[[-40, -160, 10], [-8, -120, 12], [24, -180, 10], [-52, -240, 9]].map(([fx, fy, fl], i) => (
            <path key={i} d={`M${fx},${fy} q${(fl as number) / 2},6 ${fl},2`} fill="none" stroke={t.shade} strokeWidth={3} strokeLinecap="round" opacity={0.7} />
          ))}
          {/* dangling forepaws with claws, gentle idle swing */}
          {[-1, 1].map((s2, i) => (
            <g key={i} transform={`translate(${s2 * 66},-232) rotate(${s2 * (6 + paw)})`}>
              <path d="M-14,0 q-4,54 6,96 q16,6 26,-2 q6,-46 -2,-92 Z" fill={i ? t.core : t.shade} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
              {[0, 1, 2].map((c) => <path key={c} d={`M${-6 + c * 9},94 l-2,12`} stroke="#e8dcc8" strokeWidth={4} strokeLinecap="round" />)}
            </g>
          ))}
        </g>
        <Head hx={10} hy={-392} rot={-4} />
      </g>
    );
  }

  // ---- ALL4 / FISH: horizontal bulk, hump the HIGHEST point, head slung forward ----
  const fishing = stance === 'fish';
  const headY = fishing ? -60 : -138;
  const headRot = fishing ? 16 : 0;
  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale})`}>
      <FormGradient id={id} t={t} />
      <ContactShadow cx={0} cy={4} rx={150} ry={22} opacity={0.3} blur={12} />
      {/* four planted legs */}
      {[-112, -64, 46, 96].map((lx, i) => (
        <path key={i} d={`M${lx},-104 q-4,46 -2,100 l30,0 q2,-50 -4,-98 Z`} fill={i % 2 ? t.shade : t.core} stroke={INK} strokeWidth={6} />
      ))}
      {/* claws on the near front paw */}
      {[0, 1, 2].map((c) => <path key={c} d={`M${104 + c * 8},-6 l2,10`} stroke="#e8dcc8" strokeWidth={4} strokeLinecap="round" />)}
      {/* the bulk: hump peaks over the FRONT shoulders, back slopes to the rump */}
      <g transform={`scale(1,${breath})`} style={{transformOrigin: '0px -140px'} as any}>
        <path d="M-152,-116 q-14,-58 30,-88 q40,-26 96,-30 q52,-4 94,20 q26,18 22,52 q-4,40 -52,52 q-104,18 -170,-6 q-18,-10 -20,-24 Z"
          fill={`url(#${id})`} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        {/* hump highlight at the front-shoulder peak */}
        <path d="M18,-230 q28,-14 56,-6 q-24,10 -36,28 Z" fill={t.key} opacity={0.5} />
        <path d="M68,-198 q26,18 22,52 q-4,40 -52,52 q46,-54 30,-104 Z" fill={t.shade} opacity={0.5} />
        <RimLight d="M-152,-116 q-14,-58 30,-88 q40,-26 96,-30" w={4} opacity={0.55} />
        {/* fur break-up along belly + hump */}
        {[[-90, -104, 10], [-40, -96, 11], [10, -98, 10], [-120, -150, 9], [46, -110, 9]].map(([fx, fy, fl], i) => (
          <path key={i} d={`M${fx},${fy} q${(fl as number) / 2},6 ${fl},2`} fill="none" stroke={t.shade} strokeWidth={3} strokeLinecap="round" opacity={0.7} />
        ))}
      </g>
      {/* head slung FORWARD of the shoulders, below the hump line */}
      <Head hx={124} hy={headY} rot={headRot} />
      {/* fishing: a water hint under the dropped jaw */}
      {fishing && (
        <g opacity={0.7}>
          {[0, 1, 2].map((w) => (
            <path key={w} d={`M${120 + w * 34},${6 + 3 * Math.sin(f / 7 + w)} q14,-6 28,0`} fill="none" stroke="#7fb6d9" strokeWidth={4} strokeLinecap="round" />
          ))}
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- CARIBOU
// NET-NEW 2026-07-20c (asset-library session #2). The barren-ground caribou:
// lighter build than the moose, C-swept beam antlers with forward shovel, pale
// neck/mane against a brown body, short tail. `trot` 0..1 blends a leggy trot
// cycle (diagonal pairs, head pumping) over the idle graze-lift. Emotion via
// ear + eye. Pairs with multiplicity: scatter several at depth for a herd.
export const Caribou: React.FC<{
  x: number; y: number; scale?: number; f: number; facing?: 1 | -1;
  trot?: number; emotion?: 'calm' | 'wary';
}> = ({x, y, scale = 1, f, facing = 1, trot = 0, emotion = 'calm'}) => {
  const id = uid(`cari${x}${y}`);
  const t = tones('#7a5c3e');            // warm brown coat
  const tr = Math.max(0, Math.min(1, trot));
  const gait = f / 4.2;                   // trot cycle phase
  const bob = 3 * Math.sin(f / 22) + tr * 5 * Math.sin(gait * 2);
  const earFlick = emotion === 'wary' ? -12 : 3 * Math.sin(f / 17);
  // diagonal-pair trot: FL+RR vs FR+RL swing in opposition
  const legSwing = (ph: number) => tr * 24 * Math.sin(gait + ph);
  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale})`}>
      <FormGradient id={id} t={t} />
      <ContactShadow cx={0} cy={4} rx={118} ry={19} opacity={0.3} blur={11} />
      {/* legs: slender, dark socks; diagonal trot pairs */}
      {[[-86, 0], [-44, Math.PI], [40, Math.PI], [84, 0]].map(([lx, ph], i) => (
        <g key={i} transform={`translate(${lx},-108) rotate(${legSwing(ph as number)})`}>
          <rect x={-8} y={0} width={16} height={78} rx={6} fill={i % 2 ? t.core : t.shade} stroke={INK} strokeWidth={5} />
          <rect x={-8} y={72} width={16} height={38} rx={5} fill="#3d2e1e" stroke={INK} strokeWidth={4.5} />
        </g>
      ))}
      {/* body: lighter/leggier than the moose */}
      <g transform={`translate(0,${bob * 0.4})`}>
        <path d="M-118,-124 q6,-52 58,-64 q56,-14 108,-2 q42,10 48,48 q6,36 -12,60 q-84,20 -172,2 q-28,-12 -30,-44 Z"
          fill={`url(#${id})`} stroke={INK} strokeWidth={6.5} strokeLinejoin="round" />
        <path d="M84,-140 q6,36 -12,60 q-36,10 -66,10 q54,-34 42,-82 Z" fill={t.shade} opacity={0.5} />
        <RimLight d="M-118,-124 q6,-52 58,-64 q56,-14 108,-2" w={4} opacity={0.55} />
        {/* the pale mane wrapping the chest/neck (species read #1) */}
        <path d="M42,-186 q34,6 44,34 q10,30 -2,58 q-16,8 -30,4 q16,-50 -12,-96 Z" fill="#e8ddcb" stroke={INK} strokeWidth={5} strokeLinejoin="round" opacity={0.95} />
        {/* short tail */}
        <path d="M-116,-118 q-14,4 -14,20 q10,2 16,-6 Z" fill="#e8ddcb" stroke={INK} strokeWidth={4.5} />
        {/* flank fur break-up */}
        {[[-70, -104, 9], [-28, -96, 10], [16, -100, 9]].map(([fx, fy, fl], i) => (
          <path key={i} d={`M${fx},${fy} q${(fl as number) / 2},5 ${fl},2`} fill="none" stroke={t.shade} strokeWidth={2.5} strokeLinecap="round" opacity={0.7} />
        ))}
      </g>
      {/* neck + head, pumping with the trot */}
      <g transform={`translate(96,${-168 + bob}) rotate(${bob * 0.6 - tr * 4})`}>
        <path d="M-24,6 q2,-34 30,-42 q30,-8 44,14 q10,18 4,36 q-10,22 -38,20 q-32,-4 -40,-28 Z" fill={`url(#${id})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* pale muzzle */}
        <path d="M42,-8 q22,0 28,12 q2,12 -10,15 q-16,4 -26,-5 q-2,-16 8,-22 Z" fill="#e8ddcb" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
        <ellipse cx={64} cy={8} rx={6.5} ry={5.5} fill={INK} />
        <ellipse cx={16} cy={-14} rx={6.5} ry={emotion === 'wary' ? 8.5 : 6.5} fill="#fff" stroke={INK} strokeWidth={3} />
        <circle cx={18} cy={-13} r={3.4} fill={INK} />
        {/* ear */}
        <g transform={`translate(-6,-30) rotate(${earFlick})`}>
          <path d="M0,0 q-16,-8 -22,-24 q14,-3 26,8 Z" fill={t.core} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
        </g>
        {/* C-swept beam antlers + the forward shovel (species read #2) */}
        {[1, -1].map((s2, i) => (
          <g key={i} transform={`translate(${2 + s2 * 3},-34) scale(${(s2 === 1 ? 1 : 0.92) * 1.55},1.55) rotate(${s2 * 2})`} opacity={i ? 0.85 : 1}>
            {/* main beam: sweeps back then curves forward high */}
            <path d="M0,0 q-26,-34 -18,-72 q6,-30 34,-44 q-14,26 -8,48 q22,-8 34,-26 q-2,24 -20,38 q16,-2 28,-14 q-4,22 -24,30 q-14,28 -26,40 Z"
              fill={t.key} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            {/* the forward brow shovel over the muzzle */}
            {i === 0 && <path d="M4,-6 q22,2 34,16 q-8,10 -22,6 q-14,-6 -12,-22 Z" fill={t.key} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />}
          </g>
        ))}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- ORCA
// NET-NEW 2026-07-20c (asset-library session #2). The killer whale: glossy
// black body, white eye patch + chin + belly sweep, gray saddle patch behind
// the tall dorsal fin. `surface` 0..1 arcs the body through a breach curve
// (0 = level cruise, 1 = full porpoising arc); swim undulation + pec/fluke
// secondary motion; a blowhole spray puff near the top of the arc.
export const Orca: React.FC<{
  x: number; y: number; scale?: number; f: number; facing?: 1 | -1; surface?: number;
}> = ({x, y, scale = 1, f, facing = 1, surface = 0}) => {
  const id = uid(`orca${x}${y}`);
  const t = tones('#1a222e');            // glossy near-black
  const su = Math.max(0, Math.min(1, surface));
  const undul = 4 * Math.sin(f / 9);
  const arc = -su * 22;                   // body pitch through the breach
  const fluke = 10 * Math.sin(f / 7) + su * 8;
  const spray = su > 0.6;
  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale}) rotate(${arc})`}>
      <FormGradient id={id} t={t} />
      {/* body: torpedo with the blunt orca head */}
      <g transform={`translate(0,${undul})`}>
        <path d="M-150,-40 q-24,-34 -6,-58 q40,-38 130,-40 q86,-2 132,30 q28,20 24,44 q-6,30 -50,40 q-110,26 -196,2 q-28,-8 -34,-18 Z"
          fill={`url(#${id})`} stroke={INK} strokeWidth={6.5} strokeLinejoin="round" />
        {/* white belly sweep */}
        <path d="M-140,-32 q60,26 180,16 q46,-6 88,-24 q6,18 -22,30 q-96,30 -196,4 q-36,-10 -50,-26 Z" fill="#eef4f8" stroke={INK} strokeWidth={4.5} opacity={0.96} />
        {/* gray saddle patch behind the dorsal */}
        <path d="M-24,-92 q30,-8 54,2 q-6,16 -26,20 q-22,2 -28,-22 Z" fill="#8fa0ae" stroke={INK} strokeWidth={3.5} opacity={0.9} />
        {/* the TALL dorsal fin (species read #1): a genuine upright blade */}
        <path d={`M-24,-92 q-2,-92 22,-152 q34,40 38,104 q2,34 -18,50 Z`} fill={t.base} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
        <path d="M0,-240 q28,38 32,96 q-8,-12 -22,-16 Z" fill={t.shade} opacity={0.6} />
        {/* white eye patch (species read #2) + eye + chin white */}
        <path d="M66,-72 q36,-16 62,0 q6,18 -18,26 q-36,8 -44,-26 Z" fill="#eef4f8" stroke={INK} strokeWidth={4.5} />
        <circle cx={66} cy={-42} r={5.5} fill={INK} />
        <path d="M118,-42 q18,4 22,16 q-14,8 -28,0 Z" fill="#eef4f8" stroke={INK} strokeWidth={3.5} />
        <RimLight d="M-150,-40 q-24,-34 -6,-58 q40,-38 130,-40" w={4} opacity={0.6} />
        {/* pectoral paddle, sculling */}
        <g transform={`translate(52,-14) rotate(${8 + 6 * Math.sin(f / 8)})`}>
          <path d="M0,0 q26,10 30,36 q-20,10 -36,-2 q-6,-22 6,-34 Z" fill={t.core} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        </g>
        {/* tail stock + flukes with follow-through */}
        <g transform={`translate(-152,-52) rotate(${fluke})`}>
          <path d="M0,0 q-30,4 -44,-10 q-8,-14 4,-24 q10,-4 18,4 Z" fill={t.base} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d="M-40,-8 q-26,-18 -28,-42 q22,2 34,20 Z" fill={t.core} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d="M-40,-12 q-30,10 -40,32 q24,4 38,-12 Z" fill={t.core} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        </g>
        {/* blowhole spray at the top of the arc */}
        {spray && (
          <g opacity={Math.min(1, (su - 0.6) * 3)}>
            {[0, 1, 2, 3].map((k) => (
              <circle key={k} cx={96 + k * 4 - 6 * Math.sin(k * 2)} cy={-112 - k * 14 - 4 * Math.sin(f / 3 + k)} r={5 - k} fill="#cfe6f2" opacity={0.8 - k * 0.15} />
            ))}
          </g>
        )}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- PUFFIN
// NET-NEW 2026-07-20c (asset-library session #2). The horned puffin: upright
// tuxedo seabird, oversized orange-yellow parrot bill, orange feet, white face
// disc. Endearing by build (big head, short body). `flap` 0..1 whirrs the
// stubby wings (they beat FAST); idle: waddle-shift + head tilt + blink.
export const Puffin: React.FC<{
  x: number; y: number; scale?: number; f: number; facing?: 1 | -1; flap?: number;
}> = ({x, y, scale = 1, f, facing = 1, flap = 0}) => {
  const id = uid(`puff${x}${y}`);
  const t = tones('#1c2430');
  const fl = Math.max(0, Math.min(1, flap));
  const waddle = 3 * Math.sin(f / 14);
  const tilt = 6 * Math.sin(f / 21);
  const wing = fl * 34 * Math.sin(f / 1.6) + (1 - fl) * (4 + 3 * Math.sin(f / 18));
  const blink = ((f + 40) % 130) < 5;
  return (
    <g transform={`translate(${x + waddle},${y}) scale(${scale * facing},${scale}) rotate(${waddle * 0.6})`}>
      <FormGradient id={id} t={t} />
      <ContactShadow cx={0} cy={2} rx={54} ry={12} opacity={0.3} blur={9} />
      {/* orange feet */}
      {[-16, 14].map((fx, i) => (
        <path key={i} d={`M${fx},-6 l-8,8 l10,0 l-4,-8 l8,8 l6,-2 Z`} fill="#f08a2e" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      ))}
      {/* tuxedo body: black back, white front */}
      <path d="M-44,-64 q-10,-64 22,-96 q30,-28 62,-8 q26,18 24,62 q-2,44 -22,66 q-44,18 -74,-6 q-10,-8 -12,-18 Z"
        fill={`url(#${id})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M-26,-58 q-6,-52 18,-76 q22,-18 38,-2 q18,20 14,54 q-4,38 -18,52 q-32,10 -52,-28 Z" fill="#f2f6f8" stroke={INK} strokeWidth={4} />
      <RimLight d="M-44,-64 q-10,-64 22,-96 q30,-28 62,-8" w={3.5} opacity={0.55} />
      {/* stubby wing (fast whirr when flapping) */}
      <g transform={`translate(-30,-96) rotate(${wing})`}>
        <path d="M0,0 q-34,10 -44,38 q22,10 40,-4 q10,-16 4,-34 Z" fill={t.core} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      </g>
      {/* head: white face disc + the BILL */}
      <g transform={`translate(18,-136) rotate(${tilt})`}>
        <circle r={34} fill={t.base} stroke={INK} strokeWidth={5.5} />
        <circle cx={8} cy={2} r={24} fill="#f2f6f8" stroke={INK} strokeWidth={4} />
        {/* oversized parrot bill: orange with a yellow ridge */}
        <path d="M26,-8 q30,-8 44,6 q-8,22 -32,20 q-16,-2 -18,-14 q0,-8 6,-12 Z" fill="#f08a2e" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
        <path d="M28,-10 q26,-6 40,6 l-6,5 q-16,-10 -34,-4 Z" fill="#ffd23e" stroke={INK} strokeWidth={3} />
        {/* eye + the little horn tick */}
        {blink ? (
          <path d="M2,-8 q6,4 12,0" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
        ) : (
          <>
            <circle cx={8} cy={-8} r={5.5} fill={INK} />
            <circle cx={10} cy={-10} r={1.8} fill="#fff" />
          </>
        )}
        <path d="M4,-16 q4,-8 12,-8" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
      </g>
    </g>
  );
};
