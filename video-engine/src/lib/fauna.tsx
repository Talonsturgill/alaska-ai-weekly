import React from 'react';
import {INK} from './Character';
import {tones, FormGradient, RimLight, ContactShadow, LIGHT, MotionBlur} from './lighting';

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

// ---------------------------------------------------------------- WOLF
// NET-NEW 2026-07-20c (asset-library session #2). The gray wolf: lean deep-
// chested frame, straight bushy tail (never curled — that's the dog tell),
// grizzled gray saddle over cream legs/belly, amber eyes. `howl` 0..1 tips the
// muzzle skyward with a closed-eye throat stretch; `stalk` 0..1 lowers the head
// below the shoulder line, ears pinned forward, tail flat. Idles: breath, ear
// swivel, tail sway.
export const Wolf: React.FC<{
  x: number; y: number; scale?: number; f: number; facing?: 1 | -1;
  howl?: number; stalk?: number; emotion?: 'calm' | 'alert';
}> = ({x, y, scale = 1, f, facing = 1, howl = 0, stalk = 0, emotion = 'calm'}) => {
  const id = uid(`wolf${x}${y}`);
  const t = tones('#6e7480');            // grizzled gray
  const hw = Math.max(0, Math.min(1, howl));
  const st = Math.max(0, Math.min(1, stalk)) * (1 - hw);
  const breath = 1 + 0.013 * Math.sin(f / 15);
  const earSwivel = emotion === 'alert' || st > 0.3 ? -10 : 4 * Math.sin(f / 18);
  const tailSway = (1 - st) * 5 * Math.sin(f / 13);
  const headDrop = st * 44;
  const headTip = -hw * 52 + st * 10;
  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale})`}>
      <FormGradient id={id} t={t} />
      <ContactShadow cx={0} cy={4} rx={116} ry={18} opacity={0.3} blur={11} />
      {/* legs: cream, lean */}
      {[[-78, 0], [-40, Math.PI], [42, Math.PI], [80, 0]].map(([lx, ph], i) => (
        <g key={i} transform={`translate(${lx},-96) rotate(${st * 6 * Math.sin((ph as number) + 1)})`}>
          <rect x={-8} y={0} width={16} height={94 - st * 18} rx={6} fill={i % 2 ? '#c9c2b4' : '#b5ac9c'} stroke={INK} strokeWidth={5} />
        </g>
      ))}
      {/* body: deep chest tapering to lean hips; stalk crouches it */}
      <g transform={`translate(0,${st * 16}) scale(1,${breath})`}>
        <path d="M-116,-108 q-10,-40 18,-54 l52,-14 q60,-10 104,0 q34,8 44,36 q8,24 -4,44 q-70,18 -156,4 q-38,-8 -58,-16 Z"
          fill={`url(#${id})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* the grizzled saddle: a BAND along the topline (not a closed oval) */}
        <path d="M-98,-160 l52,-14 q60,-10 104,0 q20,5 32,16 l-6,10 q-24,-12 -60,-14 q-56,-4 -100,8 q-16,5 -26,10 Z" fill={t.shade} opacity={0.65} />
        {/* cream belly */}
        <path d="M-96,-90 q60,18 150,8 q-4,12 -22,16 q-80,10 -122,-10 Z" fill="#c9c2b4" stroke={INK} strokeWidth={3.5} opacity={0.9} />
        <RimLight d="M-112,-104 q-8,-44 30,-58 q44,-18 96,-14" w={3.5} opacity={0.55} />
        {/* fur break-up */}
        {[[-64, -122, 9], [-18, -128, 10], [30, -120, 9]].map(([fx, fy, fl], i) => (
          <path key={i} d={`M${fx},${fy} q${(fl as number) / 2},5 ${fl},2`} fill="none" stroke={t.shade} strokeWidth={2.5} strokeLinecap="round" opacity={0.75} />
        ))}
      </g>
      {/* STRAIGHT bushy tail (the wolf tell) */}
      <g transform={`translate(-112,${-118 + st * 22}) rotate(${tailSway + st * 14})`}>
        <path d="M0,0 q-40,6 -64,28 q-10,12 -4,24 q22,4 44,-10 q22,-16 24,-42 Z" fill={t.core} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
        <path d="M-56,24 q-8,10 -4,22 q14,2 26,-6 Z" fill="#c9c2b4" stroke={INK} strokeWidth={3.5} />
      </g>
      {/* neck wedge into the chest, then the head (bigger, connected) */}
      <path d={`M64,${-150 + headDrop * 0.5} q28,-16 56,-10 l14,26 q-30,14 -58,6 Z`} fill={t.base} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <g transform={`translate(112,${-152 + headDrop}) rotate(${headTip}) scale(1.28)`}>
        <path d="M-30,4 q0,-30 26,-38 q28,-8 42,10 q10,14 6,30 q-8,20 -34,18 q-30,-2 -40,-20 Z" fill={`url(#${id})`} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
        {/* long tapered muzzle */}
        <path d="M34,-12 q28,-2 40,8 q4,10 -6,15 q-18,7 -32,-2 q-6,-12 -2,-21 Z" fill={t.core} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
        <ellipse cx={72} cy={0} rx={6} ry={5} fill={INK} />
        {/* cream chin/cheek */}
        <path d="M-2,14 q18,10 36,4 q-4,10 -18,12 q-16,0 -18,-16 Z" fill="#c9c2b4" stroke={INK} strokeWidth={3.5} />
        {/* howl: closed-arc eye + open muzzle; else amber eye */}
        {hw > 0.4 ? (
          <path d="M8,-14 q7,5 14,0" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
        ) : (
          <>
            <ellipse cx={14} cy={-12} rx={6.5} ry={st > 0.3 ? 5 : 6.5} fill="#e8b23e" stroke={INK} strokeWidth={3} />
            <circle cx={16} cy={-11} r={3} fill={INK} />
          </>
        )}
        {hw > 0.4 && <path d={`M56,4 q10,6 6,${14 + hw * 6} q-12,2 -16,-8 Z`} fill="#5b1b1b" stroke={INK} strokeWidth={3.5} />}
        {/* pricked ears */}
        {[[-8, -30, -6], [14, -34, 8]].map(([ex, ey, er], i) => (
          <g key={i} transform={`translate(${ex},${ey}) rotate(${(er as number) + earSwivel})`}>
            <path d="M0,0 L-9,-24 L10,-6 Z" fill={i ? t.base : t.core} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
          </g>
        ))}
      </g>
      {/* howl breath puff */}
      {hw > 0.6 && (
        <g opacity={(hw - 0.6) * 2}>
          {[0, 1, 2].map((k) => (
            <circle key={k} cx={150 + k * 12} cy={-210 - k * 18} r={6 - k} fill="#e8eef5" opacity={0.7 - k * 0.2} />
          ))}
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- RED FOX
// NET-NEW 2026-07-20c (asset-library session #2). Small, quick, delicate:
// flame-red coat, black stockings + ear tips, white chest bib and tail tip
// (the diagnostic), huge triangular ears, a lush tail nearly body-length.
// `pounce` 0..1 arcs the mouse-jump (crouch -> vault, forepaws tucked);
// idles: light bounce, ear radar, tail curl.
export const RedFox: React.FC<{
  x: number; y: number; scale?: number; f: number; facing?: 1 | -1; pounce?: number;
}> = ({x, y, scale = 1, f, facing = 1, pounce = 0}) => {
  const id = uid(`fox${x}${y}`);
  const t = tones('#c25a28');            // flame red
  const po = Math.max(0, Math.min(1, pounce));
  // pounce arc: crouch (0-0.3), vault up (0.3-0.7), nose-down dive (0.7-1)
  const crouch = po < 0.3 ? po / 0.3 : Math.max(0, 1 - (po - 0.3) / 0.25);
  const vault = po > 0.3 ? Math.sin(((po - 0.3) / 0.7) * Math.PI) : 0;
  const dive = po > 0.7 ? (po - 0.7) / 0.3 : 0;
  const bounce = (1 - po) * 1.8 * Math.sin(f / 11);
  const earRadar = 6 * Math.sin(f / 16);
  const tailCurl = 8 * Math.sin(f / 14) + po * 22;
  return (
    <g transform={`translate(${x},${y + bounce - vault * 88}) scale(${scale * facing},${scale}) rotate(${-vault * 10 + dive * 38 + crouch * 4})`}>
      <FormGradient id={id} t={t} />
      {po < 0.2 && <ContactShadow cx={0} cy={4} rx={74} ry={13} opacity={0.28} blur={9} />}
      {/* black-stocking legs (tucked in the vault) */}
      {[[-46, 0], [-20, Math.PI], [24, Math.PI], [48, 0]].map(([lx, ph], i) => (
        <g key={i} transform={`translate(${lx},-58) rotate(${vault * (i < 2 ? 34 : -20)})`}>
          <rect x={-6} y={0} width={12} height={56 - crouch * 14 - vault * 10} rx={5} fill="#1c1c22" stroke={INK} strokeWidth={4} />
        </g>
      ))}
      {/* body: small and delicate */}
      <g transform={`scale(1,${1 - crouch * 0.14})`}>
        <path d="M-64,-62 q-6,-30 22,-40 q30,-12 62,-8 q28,4 38,24 q8,18 0,32 q-44,14 -94,4 q-24,-6 -28,-12 Z"
          fill={`url(#${id})`} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
        {/* white chest bib */}
        <path d="M38,-84 q18,10 20,32 q-2,16 -14,20 q-8,-30 -22,-46 Z" fill="#f2ede2" stroke={INK} strokeWidth={3.5} />
        <RimLight d="M-64,-62 q-6,-30 22,-40 q30,-12 62,-8" w={3} opacity={0.55} />
      </g>
      {/* the LUSH tail with the white tip (diagnostic) */}
      <g transform={`translate(-62,${-70}) rotate(${tailCurl})`}>
        <path d="M0,0 q-44,-2 -72,20 q-16,14 -12,30 q20,10 48,-2 q30,-14 36,-48 Z" fill={t.base} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M-78,44 q-8,8 -6,18 q16,4 30,-6 Z" fill="#f2ede2" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d="M-6,4 q-30,0 -50,14" fill="none" stroke={t.shade} strokeWidth={3} opacity={0.6} />
      </g>
      {/* head: sharp small face, huge ears */}
      <g transform={`translate(64,${-84 + crouch * 10}) rotate(${dive * 24})`}>
        <path d="M-22,2 q-2,-22 18,-28 q22,-6 32,8 q8,12 2,24 q-8,14 -28,12 q-20,-2 -24,-16 Z" fill={`url(#${id})`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {/* white cheek + sharp muzzle */}
        <path d="M22,-4 q18,-2 26,6 q2,8 -6,10 q-14,4 -22,-4 q-2,-8 2,-12 Z" fill="#f2ede2" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
        <ellipse cx={46} cy={4} rx={4.5} ry={4} fill={INK} />
        <ellipse cx={6} cy={-8} rx={5} ry={po > 0.3 ? 6 : 5} fill="#e8b23e" stroke={INK} strokeWidth={2.5} />
        <circle cx={7.5} cy={-7} r={2.4} fill={INK} />
        {/* HUGE triangular ears, black-tipped, radar-swiveling */}
        {[[-10, -22, -8], [10, -24, 10]].map(([ex, ey, er], i) => (
          <g key={i} transform={`translate(${ex},${ey}) rotate(${(er as number) + earRadar})`}>
            <path d="M0,0 L-10,-28 L12,-8 Z" fill={t.base} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
            <path d="M-10,-28 L-4,-12 L4,-16 Z" fill="#1c1c22" />
          </g>
        ))}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- DALL SHEEP
// NET-NEW 2026-07-20c (asset-library session #2). The white mountain monarch:
// snow-white coat, massive amber curl horns (ram; `ewe` swaps to short spikes),
// blocky roman nose, perched on crags. `graze` 0..1 drops the head to feed;
// idles: breath, jaw chew when grazing, ear flick, weight shift.
export const DallSheep: React.FC<{
  x: number; y: number; scale?: number; f: number; facing?: 1 | -1;
  ewe?: boolean; graze?: number;
}> = ({x, y, scale = 1, f, facing = 1, ewe = false, graze = 0}) => {
  const id = uid(`dall${x}${y}`);
  const t = tones('#e8e4da');            // snow white (warm)
  const gz = Math.max(0, Math.min(1, graze));
  const breath = 1 + 0.012 * Math.sin(f / 15);
  const shift = 2 * Math.sin(f / 28);
  const chew = gz * 3 * Math.sin(f / 5);
  const headDrop = gz * 58;
  const earFlick = 4 * Math.sin(f / 19 + 1);
  return (
    <g transform={`translate(${x + shift},${y}) scale(${scale * facing},${scale})`}>
      <FormGradient id={id} t={t} />
      <ContactShadow cx={0} cy={4} rx={96} ry={16} opacity={0.28} blur={10} />
      {/* sturdy legs, dark hooves */}
      {[-62, -30, 30, 60].map((lx, i) => (
        <g key={i}>
          <rect x={lx - 8} y={-88} width={16} height={82} rx={6} fill={i % 2 ? t.core : t.base} stroke={INK} strokeWidth={5} />
          <rect x={lx - 8} y={-12} width={16} height={12} rx={3} fill="#3a342c" stroke={INK} strokeWidth={3.5} />
        </g>
      ))}
      {/* compact woolly body */}
      <g transform={`scale(1,${breath})`}>
        <path d="M-92,-92 q-10,-40 22,-56 q36,-20 84,-16 q40,4 54,30 q10,22 2,42 q-58,18 -128,6 q-28,-6 -34,-6 Z"
          fill={`url(#${id})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M64,-134 q10,22 2,42 q-26,9 -54,10 q38,-26 30,-56 Z" fill={t.shade} opacity={0.55} />
        <RimLight d="M-92,-92 q-10,-40 22,-56 q36,-20 84,-16" w={3.5} opacity={0.6} />
        {/* wool texture scallops */}
        {[[-58, -108, 10], [-20, -118, 11], [16, -112, 10], [-40, -96, 9]].map(([wx, wy, wr], i) => (
          <path key={i} d={`M${wx},${wy} q${(wr as number) / 2},${(wr as number) / 2} ${wr},0`} fill="none" stroke={t.shade} strokeWidth={2.5} strokeLinecap="round" opacity={0.6} />
        ))}
      </g>
      {/* stub tail */}
      <path d="M-88,-96 q-10,2 -12,12 q8,4 14,-2 Z" fill={t.core} stroke={INK} strokeWidth={4} />
      {/* neck + head with the horn curl */}
      <g transform={`translate(78,${-118 + headDrop}) rotate(${gz * 26})`}>
        <path d="M-24,4 q-2,-26 20,-32 q24,-6 36,8 q10,12 6,26 q-6,18 -30,16 q-24,-2 -32,-18 Z" fill={`url(#${id})`} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
        {/* roman nose muzzle */}
        <path d={`M30,-6 q18,2 24,${12 + chew * 0.4} q0,10 -12,11 q-14,2 -20,-8 q-2,-10 8,-15 Z`} fill={t.core} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
        <ellipse cx={48} cy={10} rx={4.5} ry={4} fill={INK} />
        <ellipse cx={8} cy={-10} rx={5.5} ry={5} fill="#e8b23e" stroke={INK} strokeWidth={2.5} />
        <circle cx={9} cy={-9} r={2.6} fill={INK} />
        {/* ear */}
        <g transform={`translate(-12,-20) rotate(${earFlick})`}>
          <path d="M0,0 q-14,-4 -20,-14 q10,-5 20,2 Z" fill={t.core} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        </g>
        {/* horns: massive amber curl (ram) or ewe spikes */}
        {ewe ? (
          <path d="M-2,-26 q-2,-16 8,-22 q8,8 4,22 Z" fill="#c9a06a" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        ) : (
          <>
            {/* far horn */}
            <path d="M-8,-24 q-30,-12 -34,-40 q-2,-24 16,-34 q22,-10 36,6 q10,14 2,26 q-6,10 -16,10 q-8,0 -12,-8"
              fill="none" stroke="#b08a54" strokeWidth={13} strokeLinecap="round" opacity={0.75} />
            {/* near horn: the full curl */}
            <path d="M2,-28 q-34,-14 -38,-46 q-2,-28 20,-38 q26,-12 42,8 q12,16 2,30 q-8,12 -20,11 q-10,-1 -14,-10"
              fill="none" stroke="#c9a06a" strokeWidth={15} strokeLinecap="round" />
            {/* growth ridges */}
            {[0.25, 0.5, 0.75].map((tt, i) => (
              <circle key={i} cx={2 - 36 * Math.sin(tt * 3.6)} cy={-28 - 40 * Math.sin(tt * 2.6)} r={2.2} fill="#8a6a3e" opacity={0.8} />
            ))}
          </>
        )}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- SEA OTTER
// NET-NEW 2026-07-20c (asset-library session #2). The charmer: floats on its
// back, paws on chest, big whiskered muzzle. `mode`: 'float' (backstroke bob,
// optional `withRock` cracking a shell with tick-tock paws) or 'dive' (arched
// porpoise silhouette). Idles: water bob, paw tap, whisker twitch, kicky feet.
export const SeaOtter: React.FC<{
  x: number; y: number; scale?: number; f: number; facing?: 1 | -1;
  mode?: 'float' | 'dive'; withRock?: boolean;
}> = ({x, y, scale = 1, f, facing = 1, mode = 'float', withRock = true}) => {
  const id = uid(`otter${x}${y}`);
  const t = tones('#5a4634');            // rich brown
  const bob = 3 * Math.sin(f / 14);
  const paw = withRock ? 10 * Math.sin(f / 6) : 3 * Math.sin(f / 12);
  const feetKick = 8 * Math.sin(f / 9);
  if (mode === 'dive') {
    return (
      <g transform={`translate(${x},${y}) scale(${scale * facing},${scale}) rotate(-18)`}>
        <FormGradient id={id} t={t} />
        <path d="M-90,-20 q-14,-26 8,-38 q50,-26 118,-14 q34,8 40,30 q4,18 -12,26 q-70,20 -128,6 q-22,-6 -26,-10 Z"
          fill={`url(#${id})`} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
        <path d="M-88,-24 q-30,10 -40,30 q16,8 34,-2 q14,-10 16,-26 Z" fill={t.core} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <circle cx={62} cy={-34} r={5} fill={INK} />
        <RimLight d="M-90,-20 q-14,-26 8,-38 q50,-26 118,-14" w={3.5} opacity={0.55} />
      </g>
    );
  }
  return (
    <g transform={`translate(${x},${y + bob}) scale(${scale * facing},${scale})`}>
      <FormGradient id={id} t={t} />
      {/* water line hint */}
      <path d={`M-120,6 q60,${4 + 2 * Math.sin(f / 10)} 120,0 q60,-4 130,2`} fill="none" stroke="#7fb6d9" strokeWidth={5} strokeLinecap="round" opacity={0.7} />
      {/* the floating back-body: a relaxed banana */}
      <path d="M-104,-10 q-16,-24 6,-36 q40,-22 106,-18 q46,4 64,24 q10,14 0,26 q-40,18 -104,14 q-52,-4 -72,-10 Z"
        fill={`url(#${id})`} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      {/* pale chest/face fur */}
      <path d="M18,-52 q30,-4 46,10 q6,10 -2,18 q-24,10 -44,-2 q-8,-16 0,-26 Z" fill="#a8886a" stroke={INK} strokeWidth={3.5} opacity={0.9} />
      <RimLight d="M-104,-10 q-16,-24 6,-36 q40,-22 106,-18" w={3.5} opacity={0.5} />
      {/* kicky webbed feet up out of the water */}
      <g transform={`translate(-92,-34) rotate(${feetKick})`}>
        <path d="M0,0 q-18,-14 -34,-12 q-4,10 8,18 q14,8 26,2 Z" fill={t.core} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
      </g>
      <g transform={`translate(-70,-40) rotate(${-feetKick * 0.7})`}>
        <path d="M0,0 q-16,-16 -32,-16 q-6,10 6,20 q14,9 26,4 Z" fill={t.shade} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
      </g>
      {/* head: big round, whiskered muzzle */}
      <g transform={`translate(64,-46)`}>
        <circle r={30} fill={`url(#${id})`} stroke={INK} strokeWidth={5.5} />
        <circle cx={6} cy={6} r={19} fill="#a8886a" stroke={INK} strokeWidth={3.5} />
        {/* muzzle + nose */}
        <ellipse cx={10} cy={4} rx={9} ry={7} fill="#e8ddcb" stroke={INK} strokeWidth={3} />
        <path d="M6,0 l8,0 l-4,5 Z" fill={INK} />
        {/* whiskers twitch */}
        {[-1, 0, 1].map((k) => (
          <path key={k} d={`M18,${2 + k * 4} q14,${k * 2 + 2 * Math.sin(f / 8)} 26,${k * 3}`} fill="none" stroke="#e8ddcb" strokeWidth={2} strokeLinecap="round" />
        ))}
        {/* eyes + tiny ears */}
        <circle cx={-6} cy={-8} r={4} fill={INK} />
        <circle cx={-4.6} cy={-9.4} r={1.4} fill="#fff" />
        <circle cx={-24} cy={-14} r={5} fill={t.core} stroke={INK} strokeWidth={3} />
      </g>
      {/* paws on chest, cracking a shell tick-tock */}
      <g transform={`translate(30,-56) rotate(${paw})`}>
        <circle cx={0} cy={0} r={9} fill={t.core} stroke={INK} strokeWidth={4} />
        <circle cx={-18} cy={2} r={9} fill={t.shade} stroke={INK} strokeWidth={4} />
        {withRock && <ellipse cx={-9} cy={-8} rx={11} ry={8} fill="#8b93a0" stroke={INK} strokeWidth={3.5} />}
      </g>
      {/* splash droplets on the paw beat */}
      {withRock && Math.abs(Math.sin(f / 6)) > 0.92 && (
        <g opacity={0.8}>
          {[0, 1].map((k) => <circle key={k} cx={26 + k * 14} cy={-78 - k * 6} r={3} fill="#cfe6f2" />)}
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- HUMPBACK
// NET-NEW 2026-07-20c (asset-library session #2). The whale of Southeast:
// knobbled head (tubercles), impossibly long white pectorals, throat grooves,
// the fluke-up dive. `mode`: 'breach' (body arcing clear, pecs flung, spray),
// 'fluke' (the classic tail-up dive silhouette), 'cruise' (level swim, blow).
export const Humpback: React.FC<{
  x: number; y: number; scale?: number; f: number; facing?: 1 | -1;
  mode?: 'cruise' | 'breach' | 'fluke';
}> = ({x, y, scale = 1, f, facing = 1, mode = 'cruise'}) => {
  const id = uid(`hump${x}${y}`);
  const t = tones('#2c3a4a');            // slate blue-gray
  const undul = 3 * Math.sin(f / 12);
  if (mode === 'fluke') {
    // the classic dive: tail stock rising out of the water, flukes spread
    const drip = (f % 40) / 40;
    return (
      <g transform={`translate(${x},${y}) scale(${scale * facing},${scale})`}>
        <FormGradient id={id} t={t} />
        {/* waterline */}
        <path d={`M-140,0 q70,${5 + 3 * Math.sin(f / 9)} 140,0 q70,-5 150,2`} fill="none" stroke="#7fb6d9" strokeWidth={6} strokeLinecap="round" opacity={0.8} />
        {/* tail stock arcing up */}
        <path d="M-40,6 q-10,-70 24,-118 q10,-12 24,-10 q16,26 10,64 q-6,42 -30,70 Z"
          fill={`url(#${id})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* the flukes: two trailing-edge-scalloped blades, white beneath */}
        <g transform={`translate(10,-120) rotate(${4 * Math.sin(f / 16)})`}>
          <path d="M0,0 q-46,-28 -88,-20 q-10,14 4,26 q40,22 82,10 Z" fill={t.base} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
          <path d="M2,0 q48,-30 92,-24 q12,14 -2,28 q-42,24 -88,12 Z" fill={t.core} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
          <path d="M-84,-16 q40,18 80,10 l-2,8 q-40,10 -76,-8 Z" fill="#e8eef4" opacity={0.85} />
        </g>
        {/* dripping water off the flukes */}
        {[0, 1, 2].map((k) => (
          <circle key={k} cx={-30 + k * 34} cy={-96 + drip * 90 + k * 8} r={3.5 - k * 0.6} fill="#cfe6f2" opacity={Math.max(0, 0.9 - drip)} />
        ))}
      </g>
    );
  }
  if (mode === 'breach') {
    return (
      <g transform={`translate(${x},${y}) scale(${scale * facing},${scale}) rotate(-34)`}>
        <FormGradient id={id} t={t} />
        {/* arcing body clear of the water */}
        <path d="M-140,-10 q-16,-40 20,-58 q60,-34 150,-28 q60,6 76,40 q10,26 -8,44 q-90,30 -180,14 q-46,-8 -58,-12 Z"
          fill={`url(#${id})`} stroke={INK} strokeWidth={6.5} strokeLinejoin="round" />
        {/* throat grooves */}
        {[0, 1, 2, 3].map((k) => (
          <path key={k} d={`M${-60 + k * 6},${10 - k * 10} q90,22 170,6`} fill="none" stroke="#e8eef4" strokeWidth={3} opacity={0.5} />
        ))}
        {/* the LONG white pectoral flung out */}
        <g transform={`translate(30,-6) rotate(${18 + 6 * Math.sin(f / 10)})`}>
          <path d="M0,0 q40,44 96,58 q16,-4 12,-20 q-30,-44 -84,-56 q-20,2 -24,18 Z" fill="#e8eef4" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          {/* knobbled leading edge */}
          {[0.25, 0.5, 0.75].map((tt, i) => <circle key={i} cx={tt * 96} cy={tt * 52 - 6} r={3} fill={t.shade} opacity={0.7} />)}
        </g>
        {/* knobbled rostrum (tubercles) + eye + jaw line */}
        {[[112, -54], [128, -44], [140, -30]].map(([tx, ty], i) => <circle key={i} cx={tx} cy={ty} r={3.4} fill={t.key} stroke={INK} strokeWidth={2} />)}
        <circle cx={104} cy={-6} r={6} fill={INK} />
        <path d="M150,-16 q-40,18 -96,14" fill="none" stroke={INK} strokeWidth={4} opacity={0.7} />
        <RimLight d="M-140,-10 q-16,-40 20,-58 q60,-34 150,-28" w={4} opacity={0.6} />
        {/* breach spray sheeting off */}
        {[0, 1, 2, 3, 4].map((k) => (
          <circle key={k} cx={-100 - k * 22 + 8 * Math.sin(f / 5 + k)} cy={30 + k * 12} r={7 - k} fill="#cfe6f2" opacity={0.8 - k * 0.14} />
        ))}
      </g>
    );
  }
  // cruise: level swim with the blow
  return (
    <g transform={`translate(${x},${y + undul}) scale(${scale * facing},${scale})`}>
      <FormGradient id={id} t={t} />
      <path d={`M-160,-16 q70,${6 + 3 * Math.sin(f / 8)} 160,0 q80,-6 170,4`} fill="none" stroke="#7fb6d9" strokeWidth={6} strokeLinecap="round" opacity={0.7} />
      {/* long back breaking the surface, small dorsal hump */}
      <path d="M-130,-18 q-8,-30 30,-40 q70,-22 150,-12 q44,6 56,26 q6,14 -4,22 q-100,18 -186,8 q-40,-6 -46,-4 Z"
        fill={`url(#${id})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M28,-62 q12,-10 22,-2 q4,8 -4,14 q-14,2 -18,-12 Z" fill={t.base} stroke={INK} strokeWidth={4.5} />
      {/* knobbled rostrum + eye */}
      {[[86, -50], [100, -42], [112, -32]].map(([tx, ty], i) => <circle key={i} cx={tx} cy={ty} r={3} fill={t.key} stroke={INK} strokeWidth={2} />)}
      <circle cx={78} cy={-18} r={5.5} fill={INK} />
      <RimLight d="M-130,-18 q-8,-30 30,-40 q70,-22 150,-12" w={3.5} opacity={0.55} />
      {/* the blow: a tall V mist column */}
      <g opacity={0.5 + 0.3 * Math.sin(f / 20)}>
        {[0, 1, 2, 3].map((k) => (
          <circle key={k} cx={96 + (k % 2 ? 7 : -7) * (k / 2)} cy={-72 - k * 16} r={5 + k * 2.4} fill="#dcecf5" opacity={0.65 - k * 0.12} />
        ))}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- PTARMIGAN
// NET-NEW 2026-07-20c (asset-library session #2). The state bird: a plump
// grouse; `season` 'winter' (all-white with the black tail edge + red eye comb)
// or 'summer' (mottled brown). Feathered snowshoe feet. Idles: pecking bob,
// head jerk, feather shake; `flush` 0..1 startles it into a wing-burst.
export const Ptarmigan: React.FC<{
  x: number; y: number; scale?: number; f: number; facing?: 1 | -1;
  season?: 'winter' | 'summer'; flush?: number;
}> = ({x, y, scale = 1, f, facing = 1, season = 'winter', flush = 0}) => {
  const id = uid(`ptar${x}${y}${season}`);
  const t = tones(season === 'winter' ? '#eef0ee' : '#8a6a44');
  const flu = Math.max(0, Math.min(1, flush));
  const peck = flu > 0.2 ? 0 : Math.max(0, Math.sin(f / 8)) * 12;
  const jerk = 4 * Math.sin(f / 23);
  const wingBurst = flu * (26 + 10 * Math.sin(f / 1.8));
  return (
    <g transform={`translate(${x},${y - flu * 40}) scale(${scale * facing},${scale}) rotate(${-flu * 14})`}>
      <FormGradient id={id} t={t} />
      {flu < 0.2 && <ContactShadow cx={0} cy={2} rx={44} ry={9} opacity={0.28} blur={8} />}
      {/* feathered snowshoe feet */}
      {[-12, 12].map((fx, i) => (
        <g key={i}>
          <path d={`M${fx - 10},-4 q10,-6 20,0 l-4,6 -12,0 Z`} fill={t.base} stroke={INK} strokeWidth={3} />
        </g>
      ))}
      {/* plump body */}
      <path d="M-40,-30 q-10,-38 18,-52 q26,-14 50,-2 q20,12 18,38 q-2,22 -20,30 q-34,12 -58,-4 q-8,-6 -8,-10 Z"
        fill={`url(#${id})`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {/* summer mottling / winter purity */}
      {season === 'summer' && [[-18, -52, 5], [4, -60, 4], [18, -44, 5], [-8, -38, 4]].map(([mx, my, mr], i) => (
        <circle key={i} cx={mx} cy={my} r={mr} fill="#5f4a2c" opacity={0.65} />
      ))}
      {/* the black tail edge (winter diagnostic) */}
      <path d="M-38,-34 q-14,2 -20,10 q8,8 20,4 Z" fill={season === 'winter' ? '#1c1c22' : '#3a2c1c'} stroke={INK} strokeWidth={3.5} />
      <RimLight d="M-40,-30 q-10,-38 18,-52 q26,-14 50,-2" w={3} opacity={0.6} />
      {/* wing (bursts on flush) */}
      <g transform={`translate(-8,-52) rotate(${wingBurst})`}>
        <path d="M0,0 q-24,4 -34,18 q12,10 30,4 q10,-8 4,-22 Z" fill={t.core} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      </g>
      {/* head on a pecking bob */}
      <g transform={`translate(30,${-64 + peck}) rotate(${jerk})`}>
        <circle r={16} fill={`url(#${id})`} stroke={INK} strokeWidth={4.5} />
        {/* the red eye comb */}
        <path d="M-6,-12 q6,-8 14,-4 q-2,6 -12,7 Z" fill="#e8402f" stroke={INK} strokeWidth={2.5} />
        <circle cx={4} cy={-4} r={3.4} fill={INK} />
        <circle cx={5.2} cy={-5} r={1.2} fill="#fff" />
        {/* stubby beak */}
        <path d="M14,0 l10,3 -10,4 Z" fill="#3a342c" stroke={INK} strokeWidth={2.5} />
      </g>
      {/* flush snow-poof */}
      {flu > 0.3 && (
        <g opacity={(flu - 0.3) * 1.4}>
          {[0, 1, 2].map((k) => <circle key={k} cx={-20 - k * 12} cy={6 + k * 4} r={5 - k} fill="#f2f6f8" opacity={0.8 - k * 0.2} />)}
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- KING CRAB
// NET-NEW 2026-07-20c (asset-library session #2). The Bering Sea money crab:
// spiky carmine carapace, one oversized right claw, six walking legs that
// scuttle. `scuttle` 0..1 walks it sideways (legs ripple in wave phase);
// `clawSnap` 0..1 snaps the big claw open-shut. Eyestalks with googly reach.
export const KingCrab: React.FC<{
  x: number; y: number; scale?: number; f: number; facing?: 1 | -1;
  scuttle?: number; clawSnap?: number;
}> = ({x, y, scale = 1, f, facing = 1, scuttle = 0, clawSnap = 0}) => {
  const id = uid(`crab${x}${y}`);
  const t = tones('#c23a28');            // carmine
  const sc = Math.max(0, Math.min(1, scuttle));
  const snap = Math.max(0, Math.min(1, clawSnap)) * (0.5 + 0.5 * Math.sin(f / 4));
  const bob = 2 * Math.sin(f / 12) + sc * 2 * Math.sin(f / 3);
  return (
    <g transform={`translate(${x + sc * 3 * Math.sin(f / 3)},${y + bob}) scale(${scale * facing},${scale})`}>
      <FormGradient id={id} t={t} />
      <ContactShadow cx={0} cy={4} rx={92} ry={14} opacity={0.3} blur={10} />
      {/* six walking legs, wave-phase scuttle, spiky joints */}
      {[[-70, 0], [-46, 1], [-22, 2], [26, 2.4], [50, 1.2], [74, 0.2]].map(([lx, ph], i) => {
        const lift = sc * 8 * Math.max(0, Math.sin(f / 3 + (ph as number) * 2));
        const spread = i < 3 ? -1 : 1;
        return (
          <g key={i} transform={`translate(${lx},-40)`}>
            <path d={`M0,0 q${spread * 12},14 ${spread * 10},${34 - lift} q${spread * 2},8 ${spread * 12},${10 - lift * 0.4}`}
              fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
            <path d={`M0,0 q${spread * 12},14 ${spread * 10},${34 - lift} q${spread * 2},8 ${spread * 12},${10 - lift * 0.4}`}
              fill="none" stroke={i % 2 ? t.core : t.base} strokeWidth={5.5} strokeLinecap="round" />
          </g>
        );
      })}
      {/* spiky carapace */}
      <path d="M-78,-56 q-8,-34 24,-46 q34,-14 74,-10 q34,4 48,26 q10,20 0,36 q-46,16 -104,8 q-34,-6 -42,-14 Z"
        fill={`url(#${id})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {/* carapace spikes */}
      {[[-58, -96], [-28, -106], [6, -108], [38, -100], [62, -84]].map(([sx2, sy2], i) => (
        <path key={i} d={`M${sx2},${sy2} l5,-12 l6,11 Z`} fill={t.key} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      ))}
      {/* shell mottling */}
      {[[-40, -74, 5], [-6, -82, 4], [24, -72, 5]].map(([mx, my, mr], i) => (
        <circle key={i} cx={mx} cy={my} r={mr} fill={t.shade} opacity={0.5} />
      ))}
      <RimLight d="M-78,-56 q-8,-34 24,-46 q34,-14 74,-10" w={3.5} opacity={0.55} />
      {/* the OVERSIZED right claw, snapping */}
      <g transform="translate(96,-64) rotate(-8)">
        <path d="M-10,10 q-4,-18 12,-24 q20,-6 34,4 q12,10 10,26 q-4,18 -24,20 q-22,2 -32,-26 Z" fill={t.base} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
        {/* fixed finger */}
        <path d="M28,10 q22,2 34,12 q-4,10 -16,10 q-16,-2 -24,-12 Z" fill={t.core} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
        {/* snapping thumb */}
        <g transform={`rotate(${-18 - snap * 26} 22 2)`}>
          <path d="M22,2 q24,-8 38,-2 q0,10 -12,12 q-16,2 -26,-10 Z" fill={t.key} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
        </g>
      </g>
      {/* smaller left claw */}
      <g transform="translate(-92,-58) rotate(14)">
        <path d="M0,0 q-16,-4 -22,6 q2,10 14,10 q12,-2 8,-16 Z" fill={t.core} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
      </g>
      {/* eyestalks */}
      {[[46, -8], [66, 6]].map(([ex], i) => (
        <g key={i} transform={`translate(${28 + i * 22},-102)`}>
          <line x1={0} y1={14} x2={0} y2={0} stroke={INK} strokeWidth={4.5} />
          <circle cy={-4} r={7} fill="#fff" stroke={INK} strokeWidth={3.5} />
          <circle cx={1.5} cy={-4} r={3} fill={INK} />
        </g>
      ))}
    </g>
  );
};

// ---------------------------------------------------------------- MOSQUITO
// NET-NEW 2026-07-20c (asset-library session #2). The unofficial state bird,
// built for COMIC beats: comically oversized proboscis, whiny wing blur,
// dangling legs. `divebomb` 0..1 arcs an attack run; `swat` 0..1 sends it
// tumbling with dizzy stars. Hover wobble idle.
export const Mosquito: React.FC<{
  x: number; y: number; scale?: number; f: number; facing?: 1 | -1;
  divebomb?: number; swat?: number;
}> = ({x, y, scale = 1, f, facing = 1, divebomb = 0, swat = 0}) => {
  const id = uid(`mosq${x}${y}`);
  const t = tones('#4a4436');
  const dv = Math.max(0, Math.min(1, divebomb)) * (1 - swat);
  const sw = Math.max(0, Math.min(1, swat));
  const wob = (1 - dv - sw) * 4;
  const hx = wob * Math.sin(f / 5) + dv * 30;
  const hy = wob * Math.cos(f / 4) + dv * 46 - sw * 20;
  const tumble = sw * (f * 14 % 360);
  return (
    <g transform={`translate(${x + hx},${y + hy}) scale(${scale * facing},${scale}) rotate(${dv * 38 + tumble})`}>
      <FormGradient id={id} t={t} />
      {/* wing blur (the whine) */}
      {[-1, 1].map((s2, i) => (
        <ellipse key={i} cx={-6} cy={-16 + s2 * 2} rx={26} ry={7} fill="#cdd6e0" opacity={0.4}
          transform={`rotate(${s2 * (28 + 14 * Math.sin(f * 2.2 + i))} -6 -14)`} />
      ))}
      {/* thorax + striped abdomen */}
      <ellipse cx={0} cy={-6} rx={16} ry={12} fill={`url(#${id})`} stroke={INK} strokeWidth={4.5} />
      <g transform="rotate(24 10 0)">
        <ellipse cx={-22} cy={4} rx={20} ry={9} fill={t.core} stroke={INK} strokeWidth={4} />
        {[0, 1, 2].map((k) => <line key={k} x1={-32 + k * 8} y1={-2} x2={-30 + k * 8} y2={10} stroke={t.shade} strokeWidth={3} />)}
      </g>
      {/* dangly legs */}
      {[[-4, 0], [4, 0.8], [10, 1.6]].map(([lx, ph], i) => (
        <path key={i} d={`M${lx},4 q${2 + Math.sin(f / 6 + (ph as number)) * 2},10 ${8 + Math.sin(f / 6 + (ph as number)) * 3},16`}
          fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
      ))}
      {/* head + big eye + THE PROBOSCIS */}
      <g transform="translate(16,-10)">
        <circle r={9} fill={t.base} stroke={INK} strokeWidth={4} />
        <circle cx={2} cy={-2} r={4.5} fill="#e8402f" stroke={INK} strokeWidth={2.5} />
        <circle cx={3.4} cy={-3.2} r={1.6} fill="#fff" />
        {/* comically long needle */}
        <line x1={8} y1={2} x2={40} y2={12} stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <line x1={8} y1={2} x2={40} y2={12} stroke="#8b93a0" strokeWidth={2} strokeLinecap="round" />
      </g>
      {/* swat dizzy stars */}
      {sw > 0.3 && (
        <g opacity={(sw - 0.3) * 1.4}>
          {[0, 120, 240].map((rot, i) => (
            <path key={i} d="M0,-8 L2,-2 L8,0 L2,2 L0,8 L-2,2 L-8,0 L-2,-2 Z" fill="#ffd23e" stroke={INK} strokeWidth={1.5}
              transform={`rotate(${rot + f * 8}) translate(20,0)`} />
          ))}
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- SLED DOG TEAM
// PROMOTED 2026-07-20d from Episode.tsx (built 07-18, gallop gait + motion blur;
// flagged "needs refactor" in the manifest since). Now parameterized: `dogs`
// sets the string length, `vx` drives the 180-degree-shutter smear while the
// team is moving. Gallop: faster cycle, two-segment folding legs, a real
// vertical bound (suspension) so the team reads as RUNNING, not a sliding
// sprite. A gang line links the dogs.
export const SledDogTeam: React.FC<{x: number; y: number; scale?: number; f: number; facing?: 1 | -1; vx?: number; dogs?: number}> = ({
  x, y, scale = 1, f, facing = 1, vx = 0, dogs = 3,
}) => {
  const id = uid(`sled${x}${y}`);
  const AMBER = '#c67c3e';
  const AMBER_D = '#8f5726';
  const HARNESS = '#5c4326';
  const n = Math.max(1, Math.min(6, Math.round(dogs)));
  const Dog: React.FC<{dx: number; phase: number}> = ({dx, phase}) => {
    const ph = f / 3.4 + phase;
    const stride = Math.sin(ph);
    const legF = 24 * stride;
    const legB = -24 * stride;
    const kneeF = 10 * Math.max(0, Math.cos(ph));
    const kneeB = 10 * Math.max(0, -Math.cos(ph));
    const bound = 8 * Math.max(0, Math.sin(ph * 2)) - 2;
    return (
      <g transform={`translate(${dx},${-bound})`}>
        <path d={`M-18,10 q${-8 + kneeB},14 ${-18 + legF},24`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <path d={`M-8,10 q${8 - kneeF},14 ${-8 + legB},24`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <path d={`M14,10 q${-8 + kneeB},14 ${14 + legB},24`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <path d={`M24,10 q${8 - kneeF},14 ${24 + legF},24`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <path d="M-30,-6 q34,-20 68,0 q6,16 -4,26 q-30,10 -60,0 q-10,-10 -4,-26 Z" fill={`url(#${id})`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M8,-10 q22,2 30,14 q4,10 -4,18 q-14,6 -28,2 Z" fill={AMBER_D} opacity={0.55} />
        <path d="M-30,-6 q34,-20 68,0" fill="none" stroke={LIGHT.rim} strokeWidth={2.5} opacity={0.5} strokeLinecap="round" style={{mixBlendMode: 'screen'}} />
        <path d={`M-30,-2 q-22,${-8 - 4 * Math.sin(f / 5 + phase)} -14,-24`} fill="none" stroke={AMBER} strokeWidth={8} strokeLinecap="round" />
        <g transform="translate(38,-14)">
          <path d="M-4,0 q18,-14 32,0 q4,10 -4,16 q-16,6 -28,-2 Z" fill={AMBER} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d="M22,2 q10,0 14,6 q-2,4 -8,4 q-6,-2 -6,-10 Z" fill={AMBER_D} stroke={INK} strokeWidth={3.5} />
          <path d="M2,-6 L-4,-20 L6,-10 Z" fill={AMBER} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          <path d="M14,-8 L14,-22 L22,-10 Z" fill={AMBER} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          <circle cx={20} cy={4} r={2.6} fill={INK} />
        </g>
        <path d="M-6,-10 q26,-6 44,-4" stroke={HARNESS} strokeWidth={4} opacity={0.7} />
      </g>
    );
  };
  const spread = (n - 1) * 70;
  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale})`}>
      <FormGradient id={id} t={tones(AMBER)} softness={0.85} />
      <ContactShadow cx={0} cy={38} rx={60 + spread / 2 + 50} ry={15} opacity={0.24} blur={9} />
      <MotionBlur vx={vx} gain={0.7} max={13}>
        {/* gang line linking the string */}
        {n > 1 && <path d={`M${-spread / 2 - 30},-4 L${spread / 2 + 40},-8`} stroke={HARNESS} strokeWidth={4} opacity={0.6} />}
        {Array.from({length: n}).map((_, i) => (
          <Dog key={i} dx={-spread / 2 + i * 70} phase={i * 1.4} />
        ))}
      </MotionBlur>
    </g>
  );
};
