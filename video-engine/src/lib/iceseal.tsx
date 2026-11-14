import React from 'react';
import {INK} from './Character';
import {tones, FormGradient, RimLight, ContactShadow} from './lighting';
import {MONO, monoW} from './prospect';
import {AK_PATH} from './akmap';

// ============================================================================================
// ICE SEAL FAMILY (NET-NEW 2026-11-14, "Two Pixels, One New Name").
// The shelf had only RingedSealGhost, an unfilled dashed contour. Any Arctic sea-ice, subsistence,
// survey or marine-mammal story can now cast a finished ice seal and the survey camera that looks
// for it. Both are reusable: every look is a prop, nothing is episode-local.
// ============================================================================================

const uid = (s: string) => 'is' + Math.abs([...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)).toString(36);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * RingedSeal. A ringed seal hauled out on ice, side-on, facing right at facing=1. Slate back, pale ring
 * rosettes, a lighter belly, big dark eyes, whiskers, clawed fore flippers, fanned hind flippers.
 *  - lift 0..1 raises the head and chest (a seal looking up from the ice)
 *  - look -1..1 turns the head (back toward the tail / toward the viewer)
 *  - emotion calm | curious | squint (lids and brow)
 *  - pixels 0..1 collapses the seal into two warm pixels on the ice (the survey's-eye view)
 *  - thermal 0..1 lays the IR heat glow over the body (magenta to coral to white-hot, hottest at the face and chest)
 * Idles: breath, blink (seeded), whisker twitch, a slow hind-flipper curl. Origin is the belly
 * contact point; the contact shadow is drawn by the asset.
 */
export const RingedSeal: React.FC<{
  x: number; y: number; scale?: number; f: number; facing?: 1 | -1;
  lift?: number; look?: number; emotion?: 'calm' | 'curious' | 'squint';
  pixels?: number; thermal?: number; seed?: number;
}> = ({x, y, scale = 1, f, facing = 1, lift = 0, look = 0, emotion = 'calm', pixels = 0, thermal = 0, seed = 1}) => {
  const id = uid(`seal${x}${y}${seed}`);
  const t = tones('#6B6A73');
  const belly = tones('#B9B6BD');
  const lf = clamp01(lift);
  const px = clamp01(pixels);
  const th = clamp01(thermal);
  const breath = 1 + 0.025 * Math.sin(f / 14 + seed);
  const blinkPhase = (f + seed * 37) % 110;
  const blink = blinkPhase < 5 ? 1 - Math.abs(blinkPhase - 2.5) / 2.5 : 0;
  const lid = emotion === 'squint' ? 0.5 : emotion === 'curious' ? 0.0 : 0.06;
  const lidAmt = Math.max(lid, blink);
  const whisk = 2 * Math.sin(f / 7 + seed);
  const curl = 8 * Math.sin(f / 26 + seed);
  const headRot = -lf * 28 + look * 10;
  const lk = Math.max(-1, Math.min(1, look));
  // the body fades out as the pixel view fades in, so a cross-fade reads as a resolve
  const bodyOp = 1 - px;
  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale})`}>
      <FormGradient id={id} t={t} />
      <FormGradient id={`${id}b`} t={belly} />
      {bodyOp > 0.01 && (
        <g opacity={bodyOp}>
          <ContactShadow cx={0} cy={4} rx={150} ry={16} opacity={0.34} blur={10} />
          {/* hind flippers, fanned, curling slowly */}
          <g transform={`translate(-142,-14) rotate(${curl - 10})`}>
            <path d="M0,0 q-30,-26 -44,-22 q4,12 14,18 q-20,-2 -30,8 q16,10 34,6 q-10,10 -6,22 q20,-8 32,-32 Z"
              fill={t.core} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <path d="M-8,-4 l-26,-12 M-10,2 l-30,6" stroke={t.shade} strokeWidth={3} strokeLinecap="round" />
          </g>
          {/* body: a fat teardrop rising smoothly into the neck, chest lifting with lift */}
          <g transform={`rotate(${-lf * 10} -140 0) scale(1,${breath})`} style={{transformOrigin: '0px 0px'}}>
            <path d={`M-150,-4 C-162,-48 -70,-82 10,-80 C58,-79 92,${-70 - lf * 10} 108,${-48 - lf * 8} C122,-26 112,2 76,4 L-140,6 Q-154,4 -150,-4 Z`}
              fill={`url(#${id})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            {/* pale belly, inside the outline */}
            <path d="M-134,-2 C-60,6 20,4 96,-8 C92,0 84,2 74,2 L-136,4 Z" fill={`url(#${id}b)`} opacity={0.9} />
            {/* ring rosettes: pale rings with dark centres, the species read */}
            {[[-112, -36, 10], [-84, -56, 13], [-44, -66, 11], [-4, -68, 13], [34, -62, 10], [-98, -18, 8], [-64, -36, 11], [-24, -44, 9], [14, -40, 12], [54, -36, 8], [-40, -16, 7], [4, -18, 6], [72, -54, 7], [-128, -20, 6], [-58, -58, 6]].map(([rx, ry, rr], i) => {
              const j = 0.75 + 0.45 * (((i * 37) % 11) / 10);
              const r0 = rr * j;
              const rot = ((i * 53) % 60) - 30;
              const broken = i % 4 === 3 && rr >= 11;
              return (
                <g key={i} transform={`rotate(${rot} ${rx} ${ry})`}>
                  <ellipse cx={rx} cy={ry} rx={r0} ry={r0 * 0.7} fill="none" stroke="#C9C6CE" strokeWidth={2.2 + (i % 3) * 0.7} opacity={0.9}
                    strokeDasharray={broken ? `${r0 * 2.2} ${r0 * 1.2}` : undefined} />
                  <ellipse cx={rx + 1} cy={ry + 1} rx={r0 * 0.42} ry={r0 * 0.3} fill={t.shade} opacity={0.7} />
                </g>
              );
            })}
            <RimLight d="M-140,-40 C-90,-74 -20,-82 30,-78" w={4} opacity={0.6} />
          </g>
          {/* fore flipper, clawed, planted */}
          <g transform="translate(36,-6)">
            <path d="M0,0 q4,-22 24,-24 q18,0 18,16 q-2,14 -18,16 q-14,2 -24,-8 Z" fill={t.core} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
            {[0, 1, 2, 3].map((i) => (
              <path key={i} d={`M${24 + i * 5},${6} l${3},${7}`} stroke="#2A2620" strokeWidth={2.4} strokeLinecap="round" />
            ))}
          </g>
          {/* head: round, set on the chest, turns with look and lifts with lift */}
          <g transform={`translate(${104 + lf * 10},${-62 - lf * 40}) rotate(${headRot}) scale(1.3)`}>
            <path d="M-34,8 q-6,-36 26,-44 q34,-8 50,16 q12,20 2,38 q-10,16 -40,16 q-30,0 -38,-26 Z"
              fill={`url(#${id})`} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
            {/* muzzle */}
            <ellipse cx={30 + lk * 3} cy={10} rx={18} ry={14} fill={belly.base} stroke={INK} strokeWidth={4} />
            <path d={`M38,4 q3,3 6,0 M30,4 q3,3 6,0`} stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round" />
            {/* whiskers */}
            <g transform={`translate(0,${whisk * 0.3}) rotate(${whisk})`} style={{transformOrigin: '34px 12px'}}>
              {[-6, 0, 6].map((wy, i) => (
                <path key={i} d={`M40,${12 + wy * 0.6} q22,${wy - 4} 44,${wy * 1.6}`} stroke="#EDEBEF" strokeWidth={1.8} fill="none" opacity={0.9} />
              ))}
            </g>
            {/* the big dark eye, with a catchlight and a lid */}
            <g transform={`translate(${6 + lk * 4},-10)`}>
              <ellipse cx={0} cy={0} rx={13} ry={14} fill="#16141A" stroke={INK} strokeWidth={3} />
              <circle cx={-3} cy={-4} r={3.4} fill="#FFFFFF" opacity={0.95} />
              <circle cx={3} cy={3} r={1.4} fill="#FFFFFF" opacity={0.6} />
              {lidAmt > 0.02 && (
                <g>
                  <path d={`M-13.5,0 A13.5,14.5 0 0 1 13.5,0 L13.5,${-14.5 + 29 * lidAmt} Q0,${-14.5 + 29 * lidAmt + 5} -13.5,${-14.5 + 29 * lidAmt} Z`} fill={t.base} stroke="none" />
                  <path d={`M-13.5,${-14.5 + 29 * lidAmt} Q0,${-14.5 + 29 * lidAmt + 5} 13.5,${-14.5 + 29 * lidAmt}`} fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
                </g>
              )}
              {emotion === 'curious' && <path d="M-10,-17 q10,-7 20,-1" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />}
            </g>
            <RimLight d="M-26,-26 q24,-14 52,0" w={3} opacity={0.55} />
          </g>
        </g>
      )}
      {/* the survey's-eye view: two warm pixels on the ice */}
      {px > 0.01 && (
        <g opacity={px}>
          <rect x={-16} y={-34} width={16} height={16} fill={th > 0.5 ? '#FF8A3D' : '#3E3D45'} />
          <rect x={0} y={-34} width={16} height={16} fill={th > 0.5 ? '#FFF4E6' : '#55545C'} />
        </g>
      )}
      {/* thermal glow over the body: hot core, magenta edge */}
      {th > 0.01 && bodyOp > 0.01 && (
        <g opacity={th * bodyOp} style={{mixBlendMode: 'screen'}}>
          <radialGradient id={`${id}th`} cx="72%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#FFF4E6" />
            <stop offset="40%" stopColor="#FF8A3D" />
            <stop offset="75%" stopColor="#E0408A" />
            <stop offset="100%" stopColor="#3A1E5C" stopOpacity={0} />
          </radialGradient>
          <ellipse cx={0} cy={-50 - lf * 20} rx={180} ry={78 + lf * 14} fill={`url(#${id}th)`} />
        </g>
      )}
    </g>
  );
};

/** Nameplate width by arithmetic, so a caller's string always fits (DISPATCH_STANDARD section 9). */
export const podPlateW = (text: string, size: number) => monoW(text, size) + 40;

/**
 * SurveyPod. The belly camera of an aerial survey: an enamel capsule with TWO lenses, a colour lens
 * (blue glass) and a thermal lens (violet glass), which act as its eyes, and a riveted NAMEPLATE whose
 * text is a prop. Origin is the top of the mounting strut.
 *  - text: the nameplate string; plateGrow 1..N swells the plate while the lenses keep their size
 *  - plateSpin 0..1 spins the plate about its vertical axis like a coin (0.5 = edge-on, 1 = back face)
 *  - backText: the string on the plate's back face (plateSpin 0.25 or 0.75 holds it edge-on)
 *  - look -1..1 slides the pupils; lookDown 0..1 tilts the lenses toward the plate (the puzzled glance)
 *  - shutter: the frame number of a shutter click (a flash and a squash)
 *  - gold: draws the plate in gold leaf (the SUPER INTELLIGENCE decal) instead of steel, as METAL
 *  - tilt: degrees the whole capsule tilts about its strut (a glance reads at film scale)
 *  - alaska: stencils an Alaska outline on the capsule; plateOnly draws just the plate on its bolts
 *  - edge-on (plateSpin 0.25 or 0.75): the plate's thickness shows as a solid rim band, not a sliver
 */
export const SurveyPod: React.FC<{
  x: number; y: number; scale?: number; f: number;
  text?: string; backText?: string; plateGrow?: number; plateSpin?: number; gold?: boolean;
  look?: number; lookDown?: number; shutter?: number; plateSize?: number; strut?: boolean;
  tilt?: number; alaska?: boolean; plateOnly?: boolean;
}> = ({x, y, scale = 1, f, text = '', backText = '', plateGrow = 1, plateSpin = 0, gold = false, look = 0, lookDown = 0, shutter = -999, plateSize = 26, strut = true, tilt = 0, alaska = true, plateOnly = false}) => {
  const id = uid(`pod${x}${y}`);
  const enamel = {...tones('#E9E4D8'), core: '#B8B0A0'};
  const steel = tones('#9AA4AD');
  const goldT = {...tones('#D9A520'), core: '#8A6410', key: '#F3D27A'};
  const sinceShot = f - shutter;
  const flash = sinceShot >= 0 && sinceShot < 8 ? 1 - sinceShot / 8 : 0;
  const squash = sinceShot >= 0 && sinceShot < 10 ? Math.sin((sinceShot / 10) * Math.PI) * 0.06 : 0;
  const bob = 3 * Math.sin(f / 19);
  const ld = clamp01(lookDown);
  const lk = Math.max(-1, Math.min(1, look));
  const spin = plateSpin % 1;
  const sx = Math.cos(spin * Math.PI * 2);
  const face = sx >= 0 ? text : backText;
  const pT = gold ? goldT : steel;
  const pw = Math.max(150, podPlateW(face || ' ', plateSize));
  const ph = plateSize + 26;
  const lens = (cx: number, glass: string, ring: string) => (
    <g transform={`translate(${cx},${18 + ld * 6})`}>
      <circle r={34} fill="#2B2F36" stroke={INK} strokeWidth={5} />
      <circle r={25} fill={ring} stroke={INK} strokeWidth={3} />
      <circle r={17} fill={glass} />
      <circle cx={lk * 6} cy={4 + ld * 7} r={8} fill="#0B0D12" />
      <circle cx={-6 + lk * 3} cy={-6} r={4.2} fill="#FFFFFF" opacity={0.85} />
      <path d="M-20,-14 q10,-10 26,-6" stroke="#FFFFFF" strokeWidth={2.4} fill="none" opacity={0.5} />
    </g>
  );
  return (
    <g transform={`translate(${x},${y + bob}) scale(${scale})`}>
      <FormGradient id={id} t={enamel} />
      <FormGradient id={`${id}p`} t={pT} />
      <g transform={`rotate(${tilt} 0 -26)`}>
      {strut && !plateOnly && (
        <g>
          <rect x={-14} y={-40} width={28} height={44} rx={4} fill={steel.core} stroke={INK} strokeWidth={4} />
          <circle cx={0} cy={-26} r={4} fill={steel.key} stroke={INK} strokeWidth={2} />
        </g>
      )}
      {!plateOnly && <g transform={`scale(${1 + squash},${1 - squash})`}>
        {/* the capsule */}
        <path d="M-120,0 h240 q30,0 30,34 q0,40 -40,48 h-220 q-40,-8 -40,-48 q0,-34 30,-34 Z" fill={`url(#${id})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M-118,74 h236" stroke={enamel.shade} strokeWidth={4} opacity={0.7} />
        {[-130, -96, 96, 130].map((rx, i) => <circle key={i} cx={rx} cy={10} r={3.6} fill={enamel.core} stroke={INK} strokeWidth={1.8} />)}
        <RimLight d="M-112,6 h224" w={4} opacity={0.6} />
        {lens(-58, '#3E8FD0', '#5A6470')}
        {lens(58, '#6D3FB0', '#5A6470')}
        <text x={-58} y={74} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} fill="#2B2F36" letterSpacing={1}>COLOR</text>
        <text x={58} y={74} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} fill="#2B2F36" letterSpacing={1}>THERMAL</text>
        {alaska && <path d={AK_PATH} transform="translate(-40,44) scale(0.08)" fill="#2B2F36" opacity={0.75} />}
        {flash > 0 && <circle cx={-58} cy={18} r={44 + 30 * (1 - flash)} fill="#BFE6FF" opacity={0.75 * flash} />}
        {flash > 0 && <circle cx={58} cy={18} r={44 + 30 * (1 - flash)} fill="#C9A6FF" opacity={0.75 * flash} />}
      </g>}
      {/* the NAMEPLATE: riveted, hung under the capsule on two bolts, grows and spins as a prop */}
      <g transform={`translate(0,${96 + (plateGrow - 1) * ph * 0.5}) scale(${plateGrow})`}>
        <path d="M-50,-14 v-6 M50,-14 v-6" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <g transform={`scale(${Math.max(0.04, Math.abs(sx))},1)`}>
          <rect x={-pw / 2 + 5} y={-10} width={pw} height={ph} rx={6} fill="#000" opacity={0.25} />
          <rect x={-pw / 2} y={-14} width={pw} height={ph} rx={6} fill={`url(#${id}p)`} stroke={INK} strokeWidth={4.5} />
          {[[-pw / 2 + 12, -2], [pw / 2 - 12, -2], [-pw / 2 + 12, ph - 26], [pw / 2 - 12, ph - 26]].map(([rx, ry], i) => (
            <circle key={i} cx={rx} cy={ry} r={3.6} fill={pT.key} stroke={INK} strokeWidth={1.8} />
          ))}
          {gold && <path d={`M${-pw / 2 + 20},-6 l${pw * 0.22},0`} stroke="#FFF3B0" strokeWidth={3} opacity={0.8} strokeLinecap="round" />}
          {gold && Math.abs(sx) > 0.25 && <path d={`M${-pw / 2 + 8},${ph - 22} h${pw - 16}`} stroke={goldT.core} strokeWidth={4} opacity={0.6} />}
          {Math.abs(sx) > 0.25 && (
            <text x={0} y={-14 + ph / 2 + plateSize * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={plateSize}
              letterSpacing={1.5} fill={gold ? '#3A2A06' : '#1B2026'}>{face}</text>
          )}
        </g>
        {/* the plate's thickness: a solid rim band that widens as the face turns edge-on */}
        {Math.abs(sx) < 0.35 && (
          <g opacity={1 - Math.abs(sx) / 0.35}>
            <rect x={-9} y={-14} width={18} height={ph} rx={3} fill={pT.core} stroke={INK} strokeWidth={3.5} />
            <path d={`M-3,-8 v${ph - 12}`} stroke={pT.key} strokeWidth={3} opacity={0.85} strokeLinecap="round" />
          </g>
        )}
      </g>
      </g>
    </g>
  );
};
