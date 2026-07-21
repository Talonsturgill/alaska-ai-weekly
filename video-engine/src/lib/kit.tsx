import React from 'react';
import {TalkMouth, ambientMouth} from './voice';
import {tones, FormGradient, RimLight, ContactShadow} from './lighting';

// =============================================================================
// KIT — shared IGS-style drawing helpers for the Dispatch episode. Ink outlines,
// base+shade+highlight tones, characterized objects with faces. Everything here
// is reused across scenes so the cast + look stay continuous.
// =============================================================================

export const INK = '#101423';
export const RED = '#e8402f';
export const RED_D = '#b52c1e';
export const AMBER = '#ffb531';
export const AMBER_D = '#e0921a';
export const ICE = '#eef6ff';
export const SNOW = '#ffffff';
export const STEEL = '#5d7fae';
export const STEEL_D = '#43608c';
export const STEEL_L = '#7fa1cc';
export const LAND = '#3f7a54';
export const LAND_D = '#2e5c3f';
export const CYAN = '#37e0d8';

export const OUT = 7;

const BOLD = 'Arial Black, Arial, sans-serif';

// starburst polygon points
export function burst(cx: number, cy: number, spikes: number, r1: number, r2: number) {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? r1 : r2;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(' ');
}

// A shouty boxed label (the genre's caption card).
export const BoxLabel: React.FC<{
  x: number; y: number; text: string; w?: number; h?: number; fs?: number;
  fill?: string; color?: string; rot?: number; sub?: string;
}> = ({x, y, text, w = 320, h = 74, fs = 40, fill = ICE, color = INK, rot = 0, sub}) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={11} fill={fill} stroke={INK} strokeWidth={7} />
    <text x={0} y={sub ? -4 : fs * 0.34} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={fs} fill={color} letterSpacing={1}>
      {text}
    </text>
    {sub && (
      <text x={0} y={h / 2 - 12} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={fs * 0.5} fill={color} opacity={0.8}>
        {sub}
      </text>
    )}
  </g>
);

// Starburst stat badge with a big number + label lines.
export const StatBurst: React.FC<{
  cx: number; cy: number; scale?: number; big: string; lines?: string[];
  fill?: string; rot?: number; big_fs?: number;
}> = ({cx, cy, scale = 1, big, lines = [], fill = AMBER, rot = 0, big_fs = 88}) => (
  <g transform={`translate(${cx},${cy}) scale(${scale}) rotate(${rot})`}>
    <polygon points={burst(0, 0, 14, 172, 132)} fill={fill} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <polygon points={burst(0, 0, 14, 146, 112)} fill="none" stroke={AMBER_D} strokeWidth={5} opacity={0.7} />
    <text x={0} y={lines.length ? -6 : big_fs * 0.34} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={big_fs} fill={INK}>
      {big}
    </text>
    {lines.map((t, i) => (
      <text key={i} x={0} y={34 + i * 34} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={28} fill={INK} letterSpacing={0.5}>
        {t}
      </text>
    ))}
  </g>
);

// A fat outlined arrow along a cubic path (dashed reveal via revealT 0..1).
export const FatArrow: React.FC<{d: string; revealT: number; color?: string; head?: [number, number]; headRot?: number}> = ({
  d, revealT, color = RED, head, headRot = 0,
}) => (
  <g>
    <path d={d} fill="none" stroke={INK} strokeWidth={44} strokeLinecap="round" strokeDasharray={900} strokeDashoffset={900 * (1 - revealT)} />
    <path d={d} fill="none" stroke={color} strokeWidth={28} strokeLinecap="round" strokeDasharray={900} strokeDashoffset={900 * (1 - revealT)} />
    {head && revealT > 0.96 && (
      <g transform={`translate(${head[0]},${head[1]}) rotate(${headRot})`}>
        <path d="M0,-52 L44,26 L12,16 L0,44 L-12,16 L-44,26 Z" fill={color} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      </g>
    )}
  </g>
);

// A wet-ink rubber STAMP that thuds down (scale/settle handled by caller via s).
// `onPaper` (NEW 2026-07-21, clears the flat-HUD-chip deferral for this run's central
// accent, ASSET_MANIFEST.md): draws a form-shaded ink-on-paper card behind the ring
// (tones/FormGradient + ContactShadow) so the stamp sits IN the lit scene instead of
// floating as a flat overlay. Off by default so existing episode-local calls render
// unchanged; new scenes should pass onPaper.
export const Stamp: React.FC<{cx: number; cy: number; s: number; text: string; rot?: number; color?: string; onPaper?: boolean}> = ({
  cx, cy, s, text, rot = -8, color = RED, onPaper = false,
}) => {
  const paperTones = tones('#f4efe0');
  const gid = `stampPaper_${cx}_${cy}`;
  return (
    <g transform={`translate(${cx},${cy})`} opacity={Math.min(1, s * 1.4)}>
      {onPaper && (
        <>
          <ContactShadow cx={0} cy={92 * s} rx={340 * s} ry={26 * s} opacity={0.28} />
          <defs><FormGradient id={gid} t={paperTones} softness={0.7} /></defs>
          <rect x={-330 * s} y={-96 * s} width={660 * s} height={192 * s} rx={14 * s} fill={`url(#${gid})`} stroke={INK} strokeWidth={6} />
        </>
      )}
      <g transform={`rotate(${rot}) scale(${s})`}>
        <rect x={-300} y={-70} width={600} height={140} rx={12} fill="none" stroke={color} strokeWidth={12} />
        <rect x={-300} y={-70} width={600} height={140} rx={12} fill="none" stroke={color} strokeWidth={3} opacity={0.5} transform="rotate(0.6)" />
        {/* ink-bleed edge irregularity, a real rubber-stamp impression is never a clean vector ring */}
        <rect x={-296} y={-66} width={592} height={132} rx={10} fill="none" stroke={color} strokeWidth={2} opacity={0.35} transform="rotate(-0.8) translate(2,-3)" />
        <text x={0} y={26} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={82} fill={color} letterSpacing={6}>
          {text}
        </text>
      </g>
    </g>
  );
};

// =============================================================================
// SERVER MACHINE — the antagonist hero, characterized with a face + emotions.
// Draw space local ~ 360 wide x 520 tall, base at (0,0). Emotions:
//   'greedy'   — hungry eyes, grin, drool
//   'nervous'  — worried eyes, wavy mouth, sweat, fast red LEDs
//   'shock'    — wide eyes, open mouth
//   'ghost'    — dashed unbuilt outline, hollow (the honest caveat)
// =============================================================================
export type MachineEmotion = 'greedy' | 'focused' | 'nervous' | 'shock' | 'ghost';

export const ServerMachine: React.FC<{
  frame: number; emotion?: MachineEmotion; x?: number; y?: number; scale?: number;
  facing?: 1 | -1; lookX?: number; tint?: 'steel' | 'copper';
  /** 0..1 mouth openness from lib/voice — when set (and not ghost) the machine's
      mouth flaps with the narration */
  talking?: number;
}> = ({frame: f, emotion = 'greedy', x = 0, y = 0, scale = 1, facing = 1, lookX = 0, tint = 'steel', talking}) => {
  const ghost = emotion === 'ghost';
  // tint lets the same rig re-skin per episode (copper = the 2026-07-17 prospecting machine,
  // literally made of mined metal). Ghost stays the dashed hollow caveat regardless of tint.
  const PAL = tint === 'copper'
    ? {base: '#c56b4a', shade: '#8f4a30', hi: '#e0a07f'}
    : {base: STEEL, shade: STEEL_D, hi: STEEL_L};
  const body = ghost ? 'none' : PAL.base;
  const stroke = ghost ? '#9fb2d6' : INK;
  const dash = ghost ? '16 12' : undefined;
  const blink = ((f + 20) % 96) < 5 && emotion !== 'shock';
  const ledRed = emotion === 'nervous';
  const ledOn = (i: number) => (ledRed ? (f / 4 + i) % 3 < 1 : (f / 7 + i) % 5 < 1.6);
  const sweat = emotion === 'nervous';

  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale})`}>
      {/* ground shadow */}
      {!ghost && <ellipse cx={0} cy={6} rx={185} ry={30} fill={INK} opacity={0.3} />}
      {/* body */}
      <rect x={-165} y={-470} width={330} height={470} rx={34} fill={body} stroke={stroke} strokeWidth={OUT + 2} strokeDasharray={dash} />
      {!ghost && (
        <>
          <path d="M70,-462 h64 a26,26 0 0 1 26,26 v418 a26,26 0 0 1 -26,26 h-64 Z" fill={PAL.shade} opacity={0.8} />
          <rect x={-150} y={-452} width={48} height={168} rx={20} fill={PAL.hi} opacity={0.65} />
          {/* rack seams */}
          <path d="M-158,-250 h300" stroke={INK} strokeWidth={5} opacity={0.7} />
          <path d="M-158,-170 h300" stroke={INK} strokeWidth={5} opacity={0.7} />
          {/* side vents */}
          {[0, 1, 2].map((i) => (
            <rect key={i} x={-150} y={-150 + i * 40} width={120} height={17} rx={8} fill={PAL.shade} stroke={INK} strokeWidth={4} />
          ))}
          {/* LED row */}
          {[0, 1, 2, 3].map((i) => (
            <circle key={i} cx={-120 + i * 44} cy={-206} r={11} fill={ledOn(i) ? (ledRed ? RED : AMBER) : '#2b3a55'} stroke={INK} strokeWidth={4} />
          ))}
        </>
      )}
      {ghost && (
        <>
          {/* empty chip slot + empty customer port, labeled */}
          <rect x={-96} y={-250} width={190} height={70} rx={8} fill="none" stroke="#9fb2d6" strokeWidth={5} strokeDasharray="10 8" />
          <text x={0} y={-208} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={30} fill="#9fb2d6">?</text>
          <rect x={-96} y={-150} width={190} height={60} rx={8} fill="none" stroke="#9fb2d6" strokeWidth={5} strokeDasharray="10 8" />
          <text x={0} y={-108} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={26} fill="#9fb2d6">?</text>
        </>
      )}
      {/* ---- FACE ---- */}
      {(() => {
        const ex = lookX; // pupils track
        const eyeFill = ghost ? 'none' : ICE;
        const es = ghost ? '#9fb2d6' : INK;
        return (
          <g>
            {/* eye whites */}
            <ellipse cx={-64} cy={-360} rx={54} ry={emotion === 'shock' ? 66 : 58} fill={eyeFill} stroke={es} strokeWidth={OUT} strokeDasharray={dash} />
            <ellipse cx={64} cy={-360} rx={54} ry={emotion === 'shock' ? 66 : 58} fill={eyeFill} stroke={es} strokeWidth={OUT} strokeDasharray={dash} />
            {!ghost && !blink && (
              <>
                <circle cx={-64 + ex} cy={-352} r={emotion === 'shock' ? 16 : 21} fill={INK} />
                <circle cx={64 + ex} cy={-352} r={emotion === 'shock' ? 16 : 21} fill={INK} />
                <circle cx={-58 + ex} cy={-360} r={7} fill={ICE} />
                <circle cx={70 + ex} cy={-360} r={7} fill={ICE} />
              </>
            )}
            {!ghost && blink && (
              <>
                <rect x={-112} y={-372} width={96} height={26} rx={12} fill={PAL.base} stroke={INK} strokeWidth={5} />
                <rect x={16} y={-372} width={96} height={26} rx={12} fill={PAL.base} stroke={INK} strokeWidth={5} />
              </>
            )}
            {/* brows */}
            {emotion === 'greedy' && (
              <g>
                <path d={`M-118,-410 q54,${-12 - 3 * Math.sin(f / 18)} 104,8`} fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" />
                <path d={`M14,-402 q54,${-20 - 3 * Math.sin(f / 18)} 104,-10`} fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" />
              </g>
            )}
            {/* 'focused' — the WORKING driller (no hungry arch, no drool): brows set
                level-and-inward on the task. Differentiates this hero from the 07-16 grinning mascot. */}
            {emotion === 'focused' && (
              <g>
                <path d="M-120,-406 q54,-4 104,6" fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" />
                <path d="M16,-400 q54,-4 104,6" fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" />
              </g>
            )}
            {emotion === 'nervous' && (
              <g>
                <path d="M-118,-420 q50,-22 100,-4" fill="none" stroke={INK} strokeWidth={11} strokeLinecap="round" />
                <path d="M118,-420 q-50,-22 -100,-4" fill="none" stroke={INK} strokeWidth={11} strokeLinecap="round" />
              </g>
            )}
            {/* mouth — `talking` (0..1, lib/voice) overrides the static shape so
                the machine speaks/reacts in sync with the narration */}
            {!ghost && talking !== undefined ? (
              <g transform="translate(0,-262)">
                <TalkMouth openness={ambientMouth(talking, f, x * 0.05 + 2.6) ?? 0} w={110} ink={INK}
                           mood={emotion === 'nervous' ? 'frown' : emotion === 'greedy' ? 'smile' : 'neutral'} />
              </g>
            ) : (
              <>
                {emotion === 'greedy' && (
                  <g>
                    <path d="M-70,-286 q70,64 140,0 q-12,72 -70,72 q-58,0 -70,-72 Z" fill="#5b1b1b" stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
                    {[0, 1, 2, 3].map((i) => (
                      <path key={i} d={`M${-52 + i * 36},${-280 + (i === 1 || i === 2 ? 8 : 2)} l12,20 l12,-16 Z`} fill={SNOW} stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
                    ))}
                    {/* drool */}
                    <path d={`M74,-238 q9,${14 + 5 * Math.sin(f / 10)} 0,${26 + 5 * Math.sin(f / 10)} q-9,-11 0,-26 Z`} fill="#9fd8ff" stroke={INK} strokeWidth={3.4} />
                  </g>
                )}
                {emotion === 'focused' && (
                  <g>
                    {/* a set, concentrating mouth: a short level line with a faint downward focus */}
                    <path d="M-42,-248 q42,14 84,0" fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
                  </g>
                )}
                {emotion === 'nervous' && (
                  <path d={`M-64,-250 q32,-20 64,0 q32,20 64,0`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" transform="translate(-32,0)" />
                )}
                {emotion === 'shock' && <ellipse cx={0} cy={-250} rx={34} ry={44} fill="#5b1b1b" stroke={INK} strokeWidth={OUT} />}
              </>
            )}
            {ghost && <path d="M-56,-250 q56,0 112,0" fill="none" stroke="#9fb2d6" strokeWidth={7} strokeLinecap="round" strokeDasharray="10 8" />}
            {/* sweat beads */}
            {sweat && (
              <g>
                <path d={`M120,-392 q11,${14 + 5 * Math.sin(f / 7)} 0,${28 + 5 * Math.sin(f / 7)} q-11,-13 0,-28 Z`} fill="#9fd8ff" stroke={INK} strokeWidth={4} />
                <path d={`M-120,-380 q-10,${12 + 4 * Math.cos(f / 8)} 0,${24 + 4 * Math.cos(f / 8)} q10,-11 0,-24 Z`} fill="#9fd8ff" stroke={INK} strokeWidth={4} />
              </g>
            )}
          </g>
        );
      })()}
    </g>
  );
};

// A compact Alaska landmass with a pulsing North Slope pin (reused hook + map).
export const AlaskaMini: React.FC<{frame: number; x: number; y: number; scale?: number; pin?: boolean; pinLabel?: string}> = ({
  frame: f, x, y, scale = 1, pin = true, pinLabel,
}) => {
  const pinPulse = 1 + 0.22 * Math.sin(f / 9);
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <path
        d="M30,120 L95,78 L150,88 L172,58 L215,66 L238,40 L268,52 L310,46 L355,64 L420,58
           L465,88 L448,118 L400,130 L418,162 L378,172 L360,214 L308,224 L280,202 L252,232
           L212,222 L182,254 L152,232 L120,254 L90,222 L108,182 L64,172 L84,142 L30,132 Z"
        fill={LAND} stroke={INK} strokeWidth={OUT} strokeLinejoin="round"
      />
      <path d="M310,46 L355,64 L420,58 L465,88 L448,118 L400,130 L418,162 L378,172 L360,214 L308,224 L280,202 L300,150 L285,100 Z" fill={LAND_D} opacity={0.5} />
      {[[150, 150, 30], [200, 145, 38], [255, 152, 32]].map(([mx, my, s], i) => (
        <g key={i}>
          <path d={`M${mx - s},${my + s * 0.9} L${mx},${my - s} L${mx + s},${my + s * 0.9} Z`} fill="#6b7f8f" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d={`M${mx - s * 0.32},${my - s * 0.3} L${mx},${my - s} L${mx + s * 0.32},${my - s * 0.3} L${mx + s * 0.14},${my - s * 0.12} L${mx},${my - s * 0.28} L${mx - s * 0.16},${my - s * 0.1} Z`} fill={SNOW} stroke={INK} strokeWidth={3} />
        </g>
      ))}
      {pin && (
        <>
          <g transform={`translate(300,64) scale(${pinPulse})`}>
            <circle r={24} fill="none" stroke={RED} strokeWidth={5} opacity={Math.max(0, 1.3 - pinPulse)} />
          </g>
          <g transform="translate(300,64)">
            <path d="M0,26 C -20,2 -20,-16 0,-24 C 20,-16 20,2 0,26 Z" fill={RED} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
            <circle cx={0} cy={-6} r={7.5} fill={ICE} stroke={INK} strokeWidth={4} />
          </g>
        </>
      )}
    </g>
  );
};

// =============================================================================
// SOURDOUGH — 2026-07-19 NET-NEW HERO. A personified regional power plant: warm,
// competent, rounded/blocky (deliberately the OPPOSITE shape language from the
// cold rectilinear ServerMachine/MachineShadow institutional heroes). Draw space
// local ~300 wide x 470 tall, feet/base at (0,0). His furnace-window chest IS his
// emotional tell (glow dims at the story's turn); a rounded friendly head carries
// the face. Emotions: proud (cold open) / confident (the competence beat) /
// faltering (the PM2.5 turn, glow dims + mask lowers) / frozen (the final freeze,
// no idle motion, held breath).
// =============================================================================
export type SourdoughEmotion = 'proud' | 'confident' | 'faltering' | 'frozen';

export const Sourdough: React.FC<{
  frame: number; x?: number; y?: number; scale?: number; facing?: 1 | -1;
  emotion?: SourdoughEmotion;
  /** 0..1 chest-glow intensity; 1 = full warm ember, dims toward 0 at the turn */
  glow?: number;
  /** 0..1 accent pulse (lib/motion accentKick) — a small reactive flinch/brighten */
  accent?: number;
}> = ({frame: f, x = 0, y = 0, scale = 1, facing = 1, emotion = 'proud', glow = 1, accent = 0}) => {
  const idle = emotion === 'frozen' ? 0 : 1;
  const breath = 1 + idle * 0.012 * Math.sin(f / 15);
  const bob = idle * 2 * Math.sin(f / 21);
  const blink = idle > 0 && ((f + 30) % 110) < 5 && emotion !== 'faltering';
  const bodyT = tones('#c9741f');   // warm ember-adjacent housing color
  const capT = tones('#3A4A63');    // frost-blue knit cap, matches the palette's ground tone
  const idg = `sd${Math.round(x)}_${Math.round(y)}`;
  const chestGlow = Math.max(0.08, glow) * (1 + accent * 0.35);
  const browDrop = emotion === 'faltering' ? 6 : 0;
  const mouthCurve = emotion === 'confident' ? 10 : emotion === 'faltering' ? -6 : 4;
  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale})`}>
      <FormGradient id={`${idg}_body`} t={bodyT} />
      <FormGradient id={`${idg}_cap`} t={capT} softness={0.85} />
      <ContactShadow cx={0} cy={4} rx={150} ry={26} opacity={0.32} blur={12} />
      {/* rounded blocky foundation/body — homely, not institutional */}
      <g transform={`translate(0,${bob}) scale(1,${breath})`} style={{transformOrigin: '0px -230px'}}>
        <path d="M-136,0 Q-150,-360 -70,-410 Q0,-446 70,-410 Q150,-360 136,0 Z"
          fill={`url(#${idg}_body)`} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
        <path d="M20,-420 Q120,-370 118,0 L60,0 Q86,-320 20,-420 Z" fill={bodyT.shade} opacity={0.55} />
        {/* panel seams: break the fill into riveted plates instead of one flat
            gradient blob (the rubric's 'plain fill' note) — a center seam plus
            two side seams, each with a hairline highlight on the lit edge */}
        <path d="M0,-440 L4,-4" stroke={bodyT.shade} strokeWidth={5} opacity={0.6} />
        <path d="M-70,-320 Q-40,-330 0,-330" fill="none" stroke={bodyT.key} strokeWidth={3} opacity={0.45} />
        <path d="M-92,-40 Q-40,-56 40,-52 Q90,-48 118,-30" fill="none" stroke={bodyT.core} strokeWidth={4} opacity={0.4} />
        {/* a secondary specular streak on the lit shoulder, offset from the rim,
            for a metal-enamel read rather than a flat vector fill */}
        <path d="M-92,-330 Q-104,-220 -90,-90" stroke="#ffe8c4" strokeWidth={10} strokeLinecap="round" opacity={0.22} />
        {/* weathering flecks -- small worn patches near the base, grounded detail */}
        {[[-70, -30], [56, -18], [-30, -12]].map(([wx, wy], i) => (
          <ellipse key={i} cx={wx} cy={wy} rx={10} ry={5} fill={bodyT.shade} opacity={0.3} transform={`rotate(${i * 35} ${wx} ${wy})`} />
        ))}
        <RimLight d="M-136,0 Q-150,-360 -70,-410" w={4} opacity={0.5} />
        {/* frost-rimmed rivets along the body seam */}
        {[-320, -260, -200, -140, -80, -30].map((yy, i) => (
          <g key={i}>
            <circle cx={-108 + (i % 2) * 216} cy={yy} r={7} fill={bodyT.core} stroke={INK} strokeWidth={3} />
            <circle cx={-108 + (i % 2) * 216} cy={yy} r={2.4} fill="#eef6ff" opacity={0.8} />
          </g>
        ))}
        {/* the furnace-window chest — his emotional tell, dims at the turn */}
        <g transform="translate(0,-190)">
          <rect x={-78} y={-58} width={156} height={116} rx={16} fill="#241a12" stroke={INK} strokeWidth={7} />
          <rect x={-64} y={-44} width={128} height={88} rx={10}
            fill={`rgba(255,140,66,${0.35 + 0.55 * chestGlow})`} />
          {/* flame licks inside, brighter with glow */}
          {[-30, 0, 30].map((fx, i) => (
            <path key={i} d={`M${fx},${34 - 10 * Math.sin(f / 9 + i)} q${10},${-30 - 8 * chestGlow} 0,${-52 - 10 * chestGlow} q${-10},22 0,${52}`}
              fill="#ffd9a0" opacity={0.35 + 0.5 * chestGlow} />
          ))}
          <rect x={-78} y={-58} width={156} height={116} rx={16} fill="none" stroke={INK} strokeWidth={4} opacity={0.4} />
        </g>
        {/* stubby mitten arms */}
        <path d="M-130,-260 q-46,20 -50,80" fill="none" stroke={INK} strokeWidth={30} strokeLinecap="round" />
        <path d="M-130,-260 q-46,20 -50,80" fill="none" stroke={bodyT.shade} strokeWidth={18} strokeLinecap="round" />
        <circle cx={-182} cy={-182} r={22} fill="#f2e6d4" stroke={INK} strokeWidth={6} />
        <path d="M130,-260 q46,20 50,80" fill="none" stroke={INK} strokeWidth={30} strokeLinecap="round" />
        <path d="M130,-260 q46,20 50,80" fill="none" stroke={bodyT.core} strokeWidth={18} strokeLinecap="round" />
        <circle cx={182} cy={-182} r={22} fill="#f2e6d4" stroke={INK} strokeWidth={6} />
      </g>
      {/* head */}
      <g transform={`translate(0,${-436 + bob * 1.3})`}>
        <circle r={72} fill="#f2e6d4" stroke={INK} strokeWidth={OUT} />
        <path d="M18,-68 a72,72 0 0 1 50,68 l-16,0 a54,54 0 0 0 -44,-54 Z" fill="#d8cbb0" opacity={0.5} />
        {/* knit watch-cap, frost-rimmed */}
        <path d="M-74,-38 a74,64 0 0 1 148,0 q0,-74 -74,-74 q-74,0 -74,74 Z" fill={`url(#${idg}_cap)`} stroke={INK} strokeWidth={7} />
        <rect x={-78} y={-50} width={156} height={22} rx={11} fill={capT.shade} stroke={INK} strokeWidth={6} />
        <circle cx={0} cy={-108} r={14} fill="#eef6ff" stroke={INK} strokeWidth={5} />
        {/* eyes */}
        {blink ? (
          <g>
            <path d="M-38,-10 q12,7 24,0" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
            <path d="M14,-10 q12,7 24,0" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          </g>
        ) : (
          <g>
            <ellipse cx={-26} cy={-10} rx={13} ry={15} fill="#fff" stroke={INK} strokeWidth={5} />
            <ellipse cx={26} cy={-10} rx={13} ry={15} fill="#fff" stroke={INK} strokeWidth={5} />
            <circle cx={-24} cy={-8} r={6} fill={INK} />
            <circle cx={28} cy={-8} r={6} fill={INK} />
          </g>
        )}
        {/* brows: proud/confident lift, faltering drops + worries */}
        <path d={`M-42,${-36 + browDrop} q14,${emotion === 'faltering' ? 2 : -8} 28,${-2 + browDrop}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <path d={`M42,${-36 + browDrop} q-14,${emotion === 'faltering' ? 2 : -8} -28,${-2 + browDrop}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        {/* mouth */}
        <path d={`M-20,20 q20,${mouthCurve} 40,0`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        {emotion === 'faltering' && (
          <path d={`M60,-30 q9,${12 + 4 * Math.sin(f / 8)} 0,${24 + 4 * Math.sin(f / 8)} q-9,-11 0,-24 Z`} fill="#9fd8ff" stroke={INK} strokeWidth={3.5} />
        )}
      </g>
    </g>
  );
};

// =============================================================================
// CELL — 2026-07-19 NET-NEW SIDEKICK. A squat cold-hardened battery unit on sled
// runners, riding alongside Sourdough as the real parallel bet (the USDA-backed
// storage hedge). Two-bar charge face; a spring-overshoot pop on `chargeLevel`
// change is left to the caller (entrance() from lib/motion). Draw space local
// ~140 wide x 160 tall, base at (0,0).
// =============================================================================
export const Cell: React.FC<{
  frame: number; x?: number; y?: number; scale?: number; facing?: 1 | -1; chargeLevel?: 0 | 1 | 2;
}> = ({frame: f, x = 0, y = 0, scale = 1, facing = 1, chargeLevel = 1}) => {
  const t = tones('#2f7d6b');   // cold-hardened teal-green casing
  const bob = 1.6 * Math.sin(f / 17 + 1);
  const idg = `cl${Math.round(x)}_${Math.round(y)}`;
  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale})`}>
      <FormGradient id={idg} t={t} />
      <ContactShadow cx={0} cy={2} rx={78} ry={13} opacity={0.28} blur={8} />
      {/* sled runners */}
      <path d="M-64,4 q64,16 128,0 l-10,14 q-54,12 -108,0 Z" fill="#8b93a0" stroke={INK} strokeWidth={5} />
      <g transform={`translate(0,${bob})`}>
        <rect x={-58} y={-140} width={116} height={140} rx={18} fill={`url(#${idg})`} stroke={INK} strokeWidth={6.5} strokeLinejoin="round" />
        <path d="M18,-140 q40,6 40,60 l0,80 l-40,0 Z" fill={t.shade} opacity={0.6} />
        <RimLight d="M-58,-140 Q-58,-70 -58,0" w={3} opacity={0.5} />
        {/* charge face: two bars, glow scales with chargeLevel */}
        <rect x={-38} y={-104} width={76} height={54} rx={8} fill="#132018" stroke={INK} strokeWidth={5} />
        <rect x={-30} y={-96} width={26} height={38} rx={4} fill={chargeLevel >= 1 ? '#3DDBD9' : '#284038'} opacity={chargeLevel >= 1 ? 0.9 : 0.5} />
        <rect x={4} y={-96} width={26} height={38} rx={4} fill={chargeLevel >= 2 ? '#3DDBD9' : '#284038'} opacity={chargeLevel >= 2 ? 0.9 : 0.5} />
        {/* a small friendly bolt-eye */}
        <circle cx={0} cy={-30} r={10} fill="#eef6ff" stroke={INK} strokeWidth={4} />
        <path d="M-4,-34 l6,6 l-3,2 l6,6" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
      </g>
    </g>
  );
};

// =============================================================================
// VALE — 2026-07-20 NET-NEW HERO. A characterized autonomous wildfire-response
// drone (the guardian). Deliberate shape language: rounded, symmetric, protective
// gunmetal machine, the OPPOSITE of both the fire's jagged chaos and the greedy
// rectilinear ServerMachine. Its single big camera-EYE is the emotional tell (an
// iris that dilates when scanning and CLAMPS small + hard on a lock). Quad rotor
// arms with spinning blur discs, a suppressant-tank belly with a fill gauge,
// landing skids, blinking running lights. Built to the depth bar (tones/FormGradient/
// RimLight/ContactShadow) with an idle hover-bob + blink. Draw space local, hub at
// (0,0); caller places with x/y/scale/facing/frame. `emotion`: vigilant (scanning) /
// locked (clamped on target, brows in) / resolute (steady, determined) / calm.
// `eyeLock` 0..1 drives the iris clamp; `accent` 0..1 a reactive brighten (lib/motion
// accentKick); `groundY` (px below hub) draws a ground contact shadow when landed.
// =============================================================================
export type ValeEmotion = 'vigilant' | 'locked' | 'resolute' | 'calm';

export const Vale: React.FC<{
  frame: number; x?: number; y?: number; scale?: number; facing?: 1 | -1;
  emotion?: ValeEmotion; eyeLock?: number; accent?: number; groundY?: number; rotor?: boolean;
}> = ({frame: f, x = 0, y = 0, scale = 1, facing = 1, emotion = 'vigilant', eyeLock = 0, accent = 0, groundY, rotor = true}) => {
  const bodyT = tones('#8C99A8');   // cool gunmetal
  const tankT = tones('#3f6f6a');   // teal suppressant tank
  const idg = `vale${Math.round(x)}_${Math.round(y)}`;
  const bob = 4 * Math.sin(f / 16);
  const lock = Math.max(0, Math.min(1, eyeLock));
  // iris: wide when scanning, clamps SMALL and bright when locked
  const iris = 20 - lock * 11 + (emotion === 'vigilant' ? 2 * Math.sin(f / 7) : 0);
  const eyeGlow = 0.5 + 0.5 * lock + accent * 0.4;
  const blink = ((f + 12) % 150) < 5 && lock < 0.3;
  const rot = (f * 34) % 360;       // rotor spin phase
  const browIn = emotion === 'locked' ? 8 : emotion === 'resolute' ? 4 : 0;
  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale})`}>
      <FormGradient id={`${idg}_b`} t={bodyT} />
      <FormGradient id={`${idg}_t`} t={tankT} />
      {groundY !== undefined && <ContactShadow cx={0} cy={groundY} rx={128} ry={20} opacity={0.3} blur={12} />}
      <g transform={`translate(0,${bob})`}>
        {/* ---- rotor arms (X-quad), spinning blur discs at each tip ---- */}
        {[[-150, -20, 1], [150, -20, -1], [-120, 34, 1], [120, 34, -1]].map(([ax, ay, dir], i) => (
          <g key={i}>
            <path d={`M0,-4 L${ax},${ay}`} stroke={INK} strokeWidth={17} strokeLinecap="round" />
            <path d={`M0,-4 L${ax},${ay}`} stroke={bodyT.core} strokeWidth={9} strokeLinecap="round" />
            {/* motor housing */}
            <circle cx={ax} cy={ay} r={16} fill={`url(#${idg}_b)`} stroke={INK} strokeWidth={5} />
            {/* spinning rotor disc: two translucent blurred ellipses + a hint blade */}
            {rotor && (
              <g transform={`translate(${ax},${ay - 6})`}>
                <ellipse cx={0} cy={0} rx={54} ry={9} fill="#cdd6e0" opacity={0.22} />
                <ellipse cx={0} cy={0} rx={54} ry={9} fill="none" stroke="#eef4fb" strokeWidth={2} opacity={0.4} />
                <line x1={-52 * Math.cos(rot / 57)} y1={0} x2={52 * Math.cos(rot / 57)} y2={0} stroke="#eef4fb" strokeWidth={3} opacity={0.5} transform={`rotate(${(dir as number) * rot})`} />
              </g>
            )}
          </g>
        ))}
        {/* ---- landing skids ---- */}
        {[-1, 1].map((s, i) => (
          <g key={i}>
            <path d={`M${s * 44},96 L${s * 70},150`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
            <path d={`M${s * 40},150 L${s * 96},150`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
            <path d={`M${s * 40},150 L${s * 96},150`} stroke={bodyT.shade} strokeWidth={4} strokeLinecap="round" />
          </g>
        ))}
        {/* ---- suppressant tank belly (with fill gauge + nozzle) ---- */}
        <g transform="translate(0,74)">
          <ellipse cx={0} cy={0} rx={70} ry={44} fill={`url(#${idg}_t)`} stroke={INK} strokeWidth={6} />
          <path d="M18,-40 q40,10 40,40 q0,26 -20,38 q28,-30 -20,-78 Z" fill={tankT.shade} opacity={0.5} />
          <RimLight d="M-64,-10 q6,-34 60,-38" w={3} opacity={0.5} />
          {/* fill gauge: 3 ticks lit */}
          <rect x={-30} y={-8} width={60} height={16} rx={5} fill="#10201d" stroke={INK} strokeWidth={3} />
          {[-1, 0, 1].map((k, i) => <rect key={i} x={-24 + i * 18} y={-4} width={12} height={8} rx={2} fill="#37e0d8" opacity={0.9} />)}
          {/* nozzle */}
          <path d="M0,40 l-10,20 l20,0 Z" fill={bodyT.core} stroke={INK} strokeWidth={4} />
        </g>
        {/* ---- central hub body ---- */}
        <g>
          <path d="M-96,-6 Q-96,-58 0,-58 Q96,-58 96,-6 Q96,44 0,44 Q-96,44 -96,-6 Z"
            fill={`url(#${idg}_b)`} stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
          <path d="M20,-56 Q96,-46 96,-6 Q96,40 30,44 Q86,-4 20,-56 Z" fill={bodyT.shade} opacity={0.5} />
          {/* panel seams + rivets (detail density) */}
          <path d="M-70,-30 Q0,-40 70,-30" fill="none" stroke={bodyT.key} strokeWidth={3} opacity={0.45} />
          <path d="M-78,16 Q0,26 78,16" fill="none" stroke={bodyT.core} strokeWidth={4} opacity={0.4} />
          {[-70, -36, 36, 70].map((rx2, i) => (
            <g key={i}><circle cx={rx2} cy={-40} r={5} fill={bodyT.core} stroke={INK} strokeWidth={2.5} /><circle cx={rx2} cy={-40} r={1.8} fill="#eef6ff" opacity={0.8} /></g>
          ))}
          {/* top sensor mast + blinking running lights */}
          <rect x={-4} y={-78} width={8} height={22} rx={3} fill={bodyT.core} stroke={INK} strokeWidth={3} />
          <circle cx={0} cy={-82} r={6} fill={((f % 40) < 20) ? '#ff5a4d' : '#5a1f1c'} stroke={INK} strokeWidth={2.5} />
          <circle cx={-84} cy={0} r={5} fill={((f % 46) < 23) ? '#4dff9e' : '#1c5a3a'} />
          <circle cx={84} cy={0} r={5} fill={((f % 46) < 23) ? '#4dff9e' : '#1c5a3a'} />
          <RimLight d="M-96,-6 Q-96,-58 0,-58 Q96,-58 96,-6" w={4} opacity={0.55} />
        </g>
        {/* ---- the camera-EYE (the emotional tell) ---- */}
        <g transform="translate(0,-6)">
          {/* housing ring */}
          <circle r={42} fill="#12161f" stroke={INK} strokeWidth={OUT} />
          <circle r={42} fill="none" stroke={bodyT.key} strokeWidth={3} opacity={0.5} />
          {blink ? (
            <path d="M-30,0 q30,16 60,0" fill="none" stroke="#FFCE6B" strokeWidth={7} strokeLinecap="round" transform="translate(-30,0)" />
          ) : (
            <>
              {/* glowing iris ring */}
              <circle r={30} fill="none" stroke="#FFCE6B" strokeWidth={5} opacity={0.5 + 0.4 * eyeGlow} />
              {/* lens iris (dilates/clamps) */}
              <circle r={iris} fill={`rgba(255,206,107,${0.55 + 0.45 * eyeGlow})`} stroke="#FF7F3D" strokeWidth={3} />
              <circle r={Math.max(4, iris * 0.42)} fill="#2a1400" />
              {/* catch-light glint */}
              <circle cx={-iris * 0.4} cy={-iris * 0.4} r={3.4} fill="#fff" opacity={0.9} />
              {/* lock ticks appear as it clamps */}
              {lock > 0.4 && [0, 90, 180, 270].map((deg, i) => (
                <line key={i} x1={0} y1={-34} x2={0} y2={-40} stroke="#FFE24A" strokeWidth={3}
                  transform={`rotate(${deg})`} opacity={Math.min(1, (lock - 0.4) * 2.5)} />
              ))}
            </>
          )}
          {/* brows: drive the read (locked = hard inward, resolute = set) */}
          <path d={`M-40,${-44 + browIn} q18,${-6 + browIn * 0.4} 34,${browIn * 0.5}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
          <path d={`M40,${-44 + browIn} q-18,${-6 + browIn * 0.4} -34,${browIn * 0.5}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
        </g>
      </g>
    </g>
  );
};
