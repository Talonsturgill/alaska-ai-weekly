import React from 'react';
import {tones, paleTones, FormGradient, RimLight, ContactShadow, INK} from './lighting';
import {figureIdle, FigurePose} from './figureidle';

/**
 * THE CANARY FAMILY (2026-11-22, "The Bird That Says No").
 *
 * Nix is a lichen-chartreuse felt canary that holds a NO card in its wing. It is a MODEL, a warning
 * before harm, never a miner: nothing in this file lets Nix dig, carry ore or touch a speck.
 * The microbe crew does the work. Lilac is reserved for rare-earth specks and a working flask;
 * cobalt is reserved for the scale wall and plant-scale dashed outlines (art_direction.json).
 *
 * Every faced character takes `cues` (beat frames) and commits a beat pose on each, the
 * forest.tsx beatPose pattern, so figure_rig_check counts it as a performer.
 */
export const CAN = {
  felt: '#B8D433', feltD: '#7E9A1E', feltL: '#E4F27A', beak: '#E89A3A', beakD: '#A8601C',
  lilac: '#B48CE0', lilacL: '#DCC6F4', lilacD: '#7A57A8',
  cobalt: '#2F5DB8', cobaltL: '#6D92DC', cobaltD: '#1C3A78',
  chalk: '#EEF0F2', chalkD: '#C9CED6', soot: '#2B2A30', sootL: '#4A4852',
  sky: '#9FB4C4', skyLow: '#B89A9A', teal: '#24474F', glass: '#CFE3F2', bench: '#4A4E52', benchTop: '#EEF0F2',
  card: '#FBF8F0', red: '#C8343C', spruce: '#1E3A3A', spruceL: '#2F5450', snow: '#E8EEF6',
  lamp: '#FFE2A0', night: '#141826', hat: '#F2C230', hatD: '#B98E14',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const h01 = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
let UID = 0;
const uid = (s: string) => `${s.replace(/[^a-z0-9]/gi, '')}${(UID++ % 100000).toString(36)}`;

type BeatPose = {skew: number; dip: number; tilt: number; wing: number; on: boolean};
const NO_POSE: BeatPose = {skew: 0, dip: 0, tilt: 0, wing: 0, on: false};
function beatPose(f: number, seed: number, cues: number[] | undefined, h: number): BeatPose {
  if (!cues || !cues.length) return NO_POSE;
  const p: FigurePose = figureIdle(f, seed, 1, cues);
  const skew = (Math.atan2(p.shift * 2.2 * (h / 300), h) * 180) / Math.PI + p.lean * 0.7;
  return {skew, dip: p.dip * 1.4, tilt: p.headRot * 1.6, wing: (p.armL + p.armR) * 1.4, on: true};
}

export type NixMood = 'alert' | 'smug' | 'worried' | 'steady' | 'tired';

/**
 * Nix. Origin (x, y) is between the feet on the perch. At scale 1 the bird is about 120 wide, 150 tall.
 *  - card 0..1      raises the NO card in the right wing (anticipation dip, overshoot, settle)
 *  - flip 0..1      flips the card through edge-on from `cardText` to `cardBack`
 *  - snapAt         a frame at which the head snaps round (overshoot, settle)
 *  - look -1..1     pupils and head turn
 *  - monocles       four tiny monocles (the four-dial gag)
 *  - flag 0..1      plants a small pennant from the left wing (the turn)
 */
export const Nix: React.FC<{
  f: number; x: number; y: number; scale?: number; facing?: 1 | -1; mood?: NixMood; card?: number; flip?: number;
  cardText?: string; cardBack?: string; snapAt?: number; look?: number; monocles?: boolean; flag?: number; flagText?: string;
  cues?: number[]; seed?: number; hop?: number; reticle?: boolean; silhouette?: boolean;
}> = ({f, x, y, scale = 1, facing = 1, mood = 'alert', card = 0, flip = 0, cardText = 'NO', cardBack = 'NO', snapAt, look = 0, monocles = false, flag = 0, flagText, cues, seed = 3, hop = 0, reticle = false, silhouette = false}) => {
  const id = uid(`nix${seed}`);
  const t = tones(CAN.felt);
  const bp = beatPose(f, seed, cues, 150);
  const breath = 1 + 0.025 * Math.sin(f / 11 + seed);
  const blink = ((f + seed * 17) % 89) < 4;
  // head snap: overshoot past the target and settle
  let snap = 0;
  if (snapAt !== undefined) {
    const s = f - snapAt;
    if (s >= -3 && s < 0) snap = -6 * (s + 3) / 3; // anticipation
    else if (s >= 0) snap = 24 * Math.exp(-s / 5) * Math.cos(s * 0.9) - 0; // overshoot and settle around 0
    snap = s >= 0 && s < 40 ? snap : s < -3 ? 0 : snap;
  }
  const headTurn = look * 14 + snap + bp.tilt + 3 * Math.sin(f / 37 + seed);
  const cu = clamp01(card);
  const raise = cu < 0.2 ? -cu * 0.5 : (cu - 0.2) / 0.8 * 1.08 - 0.08 * Math.sin(clamp01((cu - 0.6) / 0.4) * Math.PI);
  const fl = clamp01(flip);
  const edge = Math.abs(Math.cos(fl * Math.PI));
  const shown = fl < 0.5 ? cardText : cardBack;
  const hopY = -Math.sin(clamp01(hop) * Math.PI) * 30;
  const fg = clamp01(flag);
  const brow = mood === 'worried' ? 8 : mood === 'smug' ? -6 : mood === 'tired' ? 2 : 0;
  const lid = mood === 'tired' ? 0.5 : mood === 'smug' ? 0.35 : 0;
  const cardW = Math.max(54, Math.max(cardText.length, cardBack.length) * 15 + 24);
  return (
    <g transform={`translate(${x} ${y + hopY}) scale(${scale * facing} ${scale})`} style={silhouette ? {filter: 'brightness(0.42) saturate(0.35) contrast(1.15)'} : undefined}>
      <FormGradient id={id} t={t} />
      <ContactShadow cx={0} cy={2} rx={46} ry={8} opacity={0.32} blur={6} />
      {/* feet gripping the perch */}
      {[-14, 12].map((fx, i) => (
        <path key={i} d={`M${fx - 9},0 q4,-10 9,-16 q5,6 9,16 M${fx},-16 l0,16`} fill="none" stroke={CAN.beakD} strokeWidth={4} strokeLinecap="round" />
      ))}
      <g transform={`translate(0 ${-14 + bp.dip}) skewX(${bp.skew}) scale(${1 / breath ** 0.3} ${breath})`}>
        {/* tail */}
        <path d="M-40,-30 q-26,6 -38,22 q16,6 34,-4 q-4,8 4,10 q10,-10 12,-20 Z" fill={t.shade} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
        {/* body, a felt pear */}
        <path d="M-44,-34 q-6,-44 30,-58 q36,-10 52,14 q14,24 4,52 q-12,26 -44,24 q-34,-2 -42,-32 Z" fill={`url(#${id})`} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
        {/* felt texture stitches */}
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <path key={k} d={`M${-26 + k * 9},${-30 + (k % 2) * 8} q3,4 6,0`} fill="none" stroke={CAN.feltD} strokeWidth={2} opacity={0.55} />
        ))}
        {/* belly highlight blob */}
        <ellipse cx={8} cy={-22} rx={18} ry={14} fill={CAN.feltL} opacity={0.55} />
        <RimLight d="M-44,-34 q-6,-44 30,-58 q36,-10 52,14" w={3.5} opacity={0.55} />
        {/* left wing: flag hand */}
        <g transform={`translate(-14 -44) rotate(${-12 - fg * 62 + bp.wing * 6})`}>
          <path d="M0,0 q-30,6 -36,30 q20,4 34,-8 q6,-10 2,-22 Z" fill={t.core} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          {fg > 0.02 && (
            <g transform="translate(-30 20) rotate(62)" opacity={Math.min(1, fg * 2)}>
              <line x1={0} y1={0} x2={0} y2={-70 * fg} stroke={INK} strokeWidth={4} strokeLinecap="round" />
              <path d={`M0,${-70 * fg} l${34 + 4 * Math.sin(f / 5)},8 l-34,10 Z`} fill={CAN.chalk} stroke={INK} strokeWidth={3} />
              {flagText && fg > 0.8 && <text x={6} y={-70 * fg + 13} fontFamily="JetBrains Mono" fontWeight={800} fontSize={9} fill={INK}>{flagText}</text>}
            </g>
          )}
        </g>
        {/* head */}
        <g transform={`translate(22 -84) rotate(${headTurn})`}>
          <circle r={30} fill={`url(#${id})`} stroke={INK} strokeWidth={5} />
          <path d="M-14,-26 q8,-16 20,-8 q-4,-12 10,-10" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <ellipse cx={-8} cy={-12} rx={10} ry={6} fill={CAN.feltL} opacity={0.6} />
          {/* eye */}
          <g transform={`translate(${8 + look * 3} -4)`}>
            <ellipse rx={9} ry={blink ? 1.2 : 10} fill="#fff" stroke={INK} strokeWidth={3} />
            {!blink && <circle cx={2 + look * 3} cy={1} r={5} fill={INK} />}
            {!blink && <circle cx={3.5 + look * 3} cy={-1} r={1.6} fill="#fff" />}
            {lid > 0 && !blink && <path d={`M-10,-10 L10,-10 L10,${-10 + 20 * lid} Q0,${-6 + 20 * lid} -10,${-10 + 20 * lid} Z`} fill={t.core} stroke={INK} strokeWidth={2.5} />}
            <path d={`M-10,${-14 - brow * 0.2} L10,${-14 + brow}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
            {monocles && <circle r={13} fill="none" stroke={CAN.hat} strokeWidth={3} />}
          </g>
          {monocles && [[-16, 10], [-4, 20], [14, 18]].map(([mx, my], i) => (
            <circle key={i} cx={mx} cy={my} r={7} fill="none" stroke={CAN.hat} strokeWidth={2.4} />
          ))}
          {/* beak, opens a touch on the card beat */}
          <path d={`M26,${-2 - raise * 2} l18,6 -18,${6 + raise * 4} Z`} fill={CAN.beak} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          {mood === 'worried' && <path d="M-26,-30 q-6,8 -2,14 q6,-2 4,-10 Z" fill="#9BD3F0" stroke={INK} strokeWidth={2} />}
        </g>
        {/* right wing holding the NO card, gripped at the card's foot */}
        <g transform={`translate(28 -40) rotate(${-30 + raise * -50 + bp.wing * 4})`}>
          <path d="M0,0 q28,0 40,22 q-18,10 -34,-2 Z" fill={t.core} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          {cu > 0.02 && (
            <g transform={`translate(34 10) rotate(${30 + raise * 50})`}>
              <g transform={`scale(${Math.max(0.04, edge)} 1)`}>
                <rect x={-cardW / 2 + 4} y={-78 + 6} width={cardW} height={58} rx={6} fill="#000" opacity={0.25} />
                <rect x={-cardW / 2} y={-78} width={cardW} height={58} rx={6} fill={CAN.card} stroke={INK} strokeWidth={4} />
                <rect x={-cardW / 2 + 5} y={-73} width={cardW - 10} height={8} rx={3} fill={CAN.red} opacity={0.85} />
                {edge > 0.25 && !reticle && (
                  <text x={0} y={-35} textAnchor="middle" fontFamily="JetBrains Mono" fontWeight={800} fontSize={26} fill={INK}>{shown}</text>
                )}
                {edge > 0.25 && reticle && (
                  <g transform="translate(0 -45)"><circle r={16} fill="none" stroke={CAN.red} strokeWidth={4} /><path d="M-24,0 L-8,0 M8,0 L24,0 M0,-24 L0,-8 M0,8 L0,24" stroke={INK} strokeWidth={4} /></g>
                )}
              </g>
              {/* the wingtip closes over the card foot */}
              <path d="M-12,-22 q12,-8 24,0 q-4,10 -12,10 q-8,0 -12,-10 Z" fill={t.core} stroke={INK} strokeWidth={3} />
            </g>
          )}
        </g>
      </g>
    </g>
  );
};

/** A microbe: a lilac-dusted chartreuse rod in a tiny hard hat. `carry` 0..1 hugs a speck. Faced, takes cues. */
export const Microbe: React.FC<{f: number; x: number; y: number; scale?: number; rot?: number; seed?: number; carry?: number; mood?: 'busy' | 'proud' | 'tired' | 'worried' | 'sleepy'; cues?: number[]; hat?: boolean}> =
({f, x, y, scale = 1, rot = 0, seed = 1, carry = 0, mood = 'busy', cues, hat = true}) => {
  const id = uid(`mic${seed}`);
  const t = tones('#9FC23A');
  const bp = beatPose(f, seed, cues, 60);
  const wig = Math.sin(f / 5 + seed * 1.7) * 6;
  const squ = 1 + 0.06 * Math.sin(f / 4 + seed);
  const blink = ((f + seed * 23) % 71) < 3;
  const c = clamp01(carry);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + wig * 0.4 + bp.skew}) scale(${scale * squ} ${scale / squ})`}>
      <FormGradient id={id} t={t} />
      <rect x={-26} y={-16} width={52} height={32} rx={16} fill={`url(#${id})`} stroke={INK} strokeWidth={3.5} />
      {[[-14, -6], [4, 8], [14, -8], [-4, 4]].map(([dx, dy], i) => <circle key={i} cx={dx} cy={dy} r={2.2} fill={CAN.lilac} opacity={0.9} />)}
      {/* flagella */}
      <path d={`M-26,2 q-10,${-6 + wig} -18,${2 - wig}`} fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
      <path d={`M26,0 q10,${6 - wig} 18,${-2 + wig}`} fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
      {/* face */}
      <g transform={`translate(${6} ${-2 + bp.dip * 0.4})`}>
        {[-6, 6].map((ex, i) => (
          mood === 'sleepy' || blink ? <path key={i} d={`M${ex - 3},0 q3,2 6,0`} stroke={INK} strokeWidth={2} fill="none" /> :
            <g key={i}><circle cx={ex} cy={0} r={3.4} fill="#fff" stroke={INK} strokeWidth={1.6} /><circle cx={ex + 0.8} cy={0.6} r={1.6} fill={INK} /></g>
        ))}
        <path d={mood === 'worried' || mood === 'tired' ? 'M-4,8 q4,-3 8,0' : 'M-4,6 q4,4 8,0'} stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
      </g>
      {hat && (
        <g transform="translate(4 -14)">
          <path d="M-14,0 q0,-14 14,-14 q14,0 14,14 Z" fill={CAN.hat} stroke={INK} strokeWidth={2.6} />
          <rect x={-18} y={-2} width={36} height={5} rx={2} fill={CAN.hatD} stroke={INK} strokeWidth={2} />
        </g>
      )}
      {c > 0.02 && <Speck f={f} x={-22} y={-14} r={7 * c} seed={seed + 7} />}
    </g>
  );
};

/** A rare-earth speck: a lilac grain with a glint. Never drawn in any other colour. */
export const Speck: React.FC<{f: number; x: number; y: number; r?: number; seed?: number; glow?: number}> = ({f, x, y, r = 5, seed = 1, glow = 0}) => {
  const tw = 0.5 + 0.5 * Math.sin(f / 7 + seed * 2.1);
  return (
    <g transform={`translate(${x} ${y})`}>
      {glow > 0 && <circle r={r * 2.6} fill={CAN.lilacL} opacity={0.25 * glow} />}
      <path d={`M0,${-r} L${r * 0.8},0 L0,${r} L${-r * 0.8},0 Z`} fill={CAN.lilac} stroke={INK} strokeWidth={Math.max(1, r * 0.3)} strokeLinejoin="round" />
      <path d={`M0,${-r * 0.6} L${r * 0.3},0`} stroke={CAN.lilacL} strokeWidth={Math.max(0.8, r * 0.25)} />
      {tw > 0.85 && <path d={`M${r * 0.9},${-r * 1.1} l0,${-r * 0.8} M${r * 0.5},${-r * 1.5} l${r * 0.8},0`} stroke="#fff" strokeWidth={1.4} opacity={(tw - 0.85) * 6} />}
    </g>
  );
};

/** A lump of coal refuse: soot charcoal, faceted, a few lilac specks inside. Faceless. */
export const RefuseLump: React.FC<{f: number; x: number; y: number; s?: number; seed?: number; specks?: number}> = ({f, x, y, s = 1, seed = 2, specks = 4}) => {
  const id = uid(`lump${seed}`);
  const t = tones(CAN.soot);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <FormGradient id={id} t={t} />
      <ContactShadow cx={0} cy={2} rx={40} ry={8} opacity={0.35} blur={6} />
      <path d="M-38,0 L-42,-22 L-24,-44 L4,-50 L30,-36 L40,-12 L32,0 Z" fill={`url(#${id})`} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M-24,-44 L-8,-24 L4,-50 M-8,-24 L30,-36 M-8,-24 L-20,0" fill="none" stroke={CAN.sootL} strokeWidth={2} />
      <RimLight d="M-42,-22 L-24,-44 L4,-50" w={2.4} opacity={0.4} />
      {Array.from({length: specks}).map((_, i) => <Speck key={i} f={f} x={-24 + h01(seed, i) * 50} y={-8 - h01(seed + 1, i) * 34} r={2.6} seed={seed + i} />)}
    </g>
  );
};

/**
 * A glass flask, origin at its base centre. fill 0..1, glow 0..1 lilac (a working flask),
 * fillLine 0..1 draws a ruled mark at that level, label on a tag.
 */
export const Flask: React.FC<{f: number; x: number; y: number; s?: number; fill?: number; glow?: number; fillLine?: number; lump?: boolean; seed?: number; bubbles?: boolean; crew?: number}> =
({f, x, y, s = 1, fill = 0, glow = 0, fillLine, lump = false, seed = 5, bubbles = true, crew = 0}) => {
  const id = uid(`flask${seed}`);
  const fl = clamp01(fill);
  const liquidTop = -14 - fl * 110;
  const body = 'M-22,-170 L-22,-120 L-62,-20 Q-66,0 -46,0 L46,0 Q66,0 62,-20 L22,-120 L22,-170 Z';
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <clipPath id={`${id}c`}><path d={body} /></clipPath>
        <linearGradient id={`${id}g`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" /><stop offset="0.3" stopColor="#fff" stopOpacity="0.05" /><stop offset="1" stopColor="#fff" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <ContactShadow cx={0} cy={3} rx={62} ry={10} opacity={0.35} blur={7} />
      {glow > 0 && <ellipse cx={0} cy={-50} rx={90} ry={70} fill={CAN.lilac} opacity={0.22 * glow} />}
      <path d={body} fill={CAN.glass} opacity={0.35} />
      <g clipPath={`url(#${id}c)`}>
        {fl > 0 && <rect x={-70} y={liquidTop} width={140} height={-liquidTop + 4} fill={glow > 0.3 ? CAN.lilac : '#8FB0B8'} opacity={0.75} />}
        {fl > 0 && <path d={`M-70,${liquidTop} q35,${-4 * Math.sin(f / 9)} 70,0 t70,0`} fill="none" stroke="#fff" strokeWidth={2} opacity={0.6} />}
        {bubbles && fl > 0 && [0, 1, 2, 3].map((k) => {
          const by = ((f * 1.6 + k * 37 + seed * 11) % 110);
          return <circle key={k} cx={-24 + k * 16} cy={-6 - by} r={3 + (k % 2)} fill="none" stroke="#fff" strokeWidth={1.6} opacity={0.6} />;
        })}
        {lump && <RefuseLump f={f} x={0} y={-4} s={0.55} seed={seed} specks={3} />}
        {crew > 0 && Array.from({length: Math.round(crew)}).map((_, i) => (
          <Microbe key={i} f={f} x={-30 + (i % 3) * 30} y={-30 - Math.floor(i / 3) * 26} scale={0.5} seed={seed + i * 3} rot={(i % 2 ? -1 : 1) * 12} carry={glow} />
        ))}
      </g>
      <path d={body} fill={`url(#${id}g)`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <rect x={-28} y={-182} width={56} height={14} rx={4} fill={CAN.chalk} stroke={INK} strokeWidth={4} />
      {fillLine !== undefined && (
        <g>
          <line x1={-58} x2={58} y1={-14 - fillLine * 110} y2={-14 - fillLine * 110} stroke={INK} strokeWidth={3} strokeDasharray="8 5" />
        </g>
      )}
      <path d="M-14,-160 L-14,-126 L-50,-30" fill="none" stroke="#fff" strokeWidth={4} opacity={0.5} strokeLinecap="round" />
    </g>
  );
};

/** A round bench dial on a stalk with a face-free label plate, a needle and a red zone. value 0..1. */
export const BenchDial: React.FC<{f: number; x: number; y: number; s?: number; label: string; value?: number; jitter?: number; red?: boolean; seed?: number}> =
({f, x, y, s = 1, label, value = 0.4, jitter = 2, red = false, seed = 1}) => {
  const id = uid(`dial${seed}`);
  const t = paleTones(CAN.chalk);
  const ang = -120 + 240 * clamp01(value) + jitter * Math.sin(f / 4 + seed * 3);
  const w = label.length * 13.5 + 20;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <FormGradient id={id} t={t} />
      <ContactShadow cx={0} cy={2} rx={34} ry={7} opacity={0.3} blur={5} />
      <rect x={-6} y={-60} width={12} height={60} fill={CAN.bench} stroke={INK} strokeWidth={3} />
      <circle cx={0} cy={-100} r={46} fill={`url(#${id})`} stroke={INK} strokeWidth={5} />
      <path d={`M${46 * Math.cos((30 - 90) * Math.PI / 180) * 0.78},${-100 + 46 * Math.sin((30 - 90) * Math.PI / 180) * 0.78} A36,36 0 0 1 ${36 * Math.cos(30 * Math.PI / 180)},${-100 + 36 * Math.sin(30 * Math.PI / 180)}`} fill="none" stroke={CAN.red} strokeWidth={7} opacity={red ? 1 : 0.55} />
      {Array.from({length: 9}).map((_, i) => {
        const a = (-120 + i * 30 - 90) * Math.PI / 180;
        return <line key={i} x1={Math.cos(a) * 32} y1={-100 + Math.sin(a) * 32} x2={Math.cos(a) * 40} y2={-100 + Math.sin(a) * 40} stroke={INK} strokeWidth={2.4} />;
      })}
      <g transform={`translate(0 -100) rotate(${ang})`}>
        <path d="M-3,6 L0,-36 L3,6 Z" fill={red ? CAN.red : INK} stroke={INK} strokeWidth={1.5} />
      </g>
      <circle cx={0} cy={-100} r={5} fill={INK} />
      <RimLight d="M-44,-110 A46,46 0 0 1 20,-142" w={3} opacity={0.5} />
      <rect x={-w / 2} y={-44} width={w} height={26} rx={4} fill={CAN.card} stroke={INK} strokeWidth={3} />
      <text x={0} y={-25} textAnchor="middle" fontFamily="JetBrains Mono" fontWeight={800} fontSize={18} fill={INK}>{label}</text>
    </g>
  );
};

/** The scale wall: a tall ruled cobalt wall of blocks. grow 0..1 rises it from the floor with overshoot. */
export const ScaleWall: React.FC<{f: number; x: number; y: number; w?: number; h?: number; grow?: number; seed?: number; dashed?: boolean}> =
({f, x, y, w = 260, h = 900, grow = 1, seed = 4, dashed = false}) => {
  const id = uid(`wall${seed}`);
  const t = tones(CAN.cobalt);
  const g = clamp01(grow);
  const gh = g < 0.85 ? (g / 0.85) * 1.04 : 1.04 - 0.04 * Math.sin(((g - 0.85) / 0.15) * Math.PI / 2);
  const hh = h * gh;
  const rows = Math.floor(hh / 60);
  if (dashed) {
    return (
      <g transform={`translate(${x} ${y})`}>
        <rect x={-w / 2} y={-hh} width={w} height={hh} fill={CAN.cobalt} opacity={0.12} stroke={CAN.cobaltL} strokeWidth={5} strokeDasharray="18 12" />
        {Array.from({length: rows}).map((_, i) => <line key={i} x1={-w / 2} x2={w / 2} y1={-i * 60} y2={-i * 60} stroke={CAN.cobaltL} strokeWidth={2} strokeDasharray="10 10" opacity={0.6} />)}
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <FormGradient id={id} t={t} />
      <ContactShadow cx={0} cy={2} rx={w * 0.6} ry={14} opacity={0.4} blur={8} />
      <rect x={-w / 2} y={-hh} width={w} height={hh} fill={`url(#${id})`} stroke={INK} strokeWidth={6} />
      {Array.from({length: rows}).map((_, i) => (
        <g key={i}>
          <line x1={-w / 2} x2={w / 2} y1={-i * 60} y2={-i * 60} stroke={CAN.cobaltD} strokeWidth={3} />
          {[0, 1, 2].map((k) => {
            const bx = -w / 2 + ((k + (i % 2) * 0.5) * w) / 3;
            return bx > -w / 2 + 4 && bx < w / 2 - 4 ? <line key={k} x1={bx} x2={bx} y1={-i * 60} y2={-i * 60 - 60} stroke={CAN.cobaltD} strokeWidth={3} /> : null;
          })}
          <rect x={-w / 2 + 6} y={-i * 60 - 54} width={w * 0.3} height={6} fill={CAN.cobaltL} opacity={0.35 + 0.1 * Math.sin(f / 30 + i)} />
        </g>
      ))}
      <RimLight d={`M${-w / 2},0 L${-w / 2},${-hh}`} w={4} opacity={0.5} />
    </g>
  );
};

/**
 * The paper staircase: `n` drawn zigzag flights climbing from (x, y) toward (x2, y2), revealed 0..1.
 * dashed draws it as a planned outline. Each step is ruled; a count tick every 10th step.
 */
export const Staircase: React.FC<{f: number; x: number; y: number; x2: number; y2: number; reveal?: number; steps?: number; dashed?: boolean; color?: string}> =
({x, y, x2, y2, reveal = 1, steps = 40, dashed = false, color = CAN.card}) => {
  const r = clamp01(reveal);
  const nShow = Math.max(1, Math.round(steps * r));
  const dx = (x2 - x) / steps, dy = (y2 - y) / steps;
  let d = `M${x},${y}`;
  for (let i = 0; i < nShow; i++) {
    const px = x + dx * i, py = y + dy * i;
    d += ` L${px},${py + dy} L${px + dx},${py + dy}`;
  }
  const endX = x + dx * nShow, endY = y + dy * nShow;
  return (
    <g>
      {!dashed && <path d={`${d} L${endX},${y + 30} L${x},${y + 30} Z`} fill={color} opacity={0.85} />}
      <path d={d} fill="none" stroke={dashed ? CAN.cobaltL : INK} strokeWidth={dashed ? 4 : 4.5} strokeDasharray={dashed ? '10 8' : undefined} strokeLinejoin="round" />
      {!dashed && Array.from({length: Math.floor(nShow / 5)}).map((_, k) => {
        const i = (k + 1) * 5;
        return <line key={k} x1={x + dx * i} y1={y + dy * i} x2={x + dx * i} y2={y + dy * i + 12} stroke={CAN.lilacD} strokeWidth={2} />;
      })}
    </g>
  );
};

/**
 * The bench world: a lab bench at blue hour with a big window onto the Chugach front range and the
 * Anchorage grid below, spruce on the slope, a warm lamp. `dusk` 0..1 darkens the sky across the film.
 * `seed` varies the ridge, the window props and the near-plane glassware so no two shots stamp alike.
 * Draws within 0..1080 x 0..1920; benchY is the bench top line.
 */
export const BenchWorld: React.FC<{f: number; seed?: number; dusk?: number; benchY?: number; winTop?: number; winBottom?: number; lamp?: number; near?: boolean; behind?: React.ReactNode; wallUp?: number; children?: React.ReactNode}> =
({f, seed = 1, dusk = 0, benchY = 1240, winTop = 160, winBottom = 980, lamp = 1, near = true, behind, wallUp = 0, children}) => {
  const id = uid(`bw${seed}`);
  const dk = clamp01(dusk);
  const mix = (a: string, b: string, k: number) => {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - k) + ((pb >> sh) & 255) * k);
    return `#${((1 << 24) + (ch(16) << 16) + (ch(8) << 8) + ch(0)).toString(16).slice(1)}`;
  };
  const skyTop = mix('#9FB4C4', '#24474F', dk);
  const skyLow = mix('#D9D2CC', '#B89A9A', dk);
  const drift = Math.sin(f / 200) * 10;
  const ridge = (base: number, amp: number, s: number) => {
    let d = `M-40,${base}`;
    for (let i = 0; i <= 12; i++) {
      const px = -40 + i * 100;
      const py = base - amp * (0.35 + 0.65 * h01(s, i)) - (i % 3 === 1 ? amp * 0.3 : 0);
      d += ` L${px},${py}`;
    }
    return d + ` L1120,${base + 400} L-40,${base + 400} Z`;
  };
  const wb = winBottom;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyTop} /><stop offset="1" stopColor={skyLow} />
        </linearGradient>
        <clipPath id={`${id}w`}><rect x={60} y={winTop} width={960} height={wb - winTop} /></clipPath>
        <radialGradient id={`${id}l`} cx="0.2" cy="0.1" r="0.9">
          <stop offset="0" stopColor={CAN.lamp} stopOpacity={0.4 * lamp} /><stop offset="1" stopColor={CAN.lamp} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* the room wall */}
      <rect x={-60} y={-60} width={1200} height={2040} fill={mix('#5C6064', '#34373B', dk)} />
      {/* the window and the world outside */}
      <g clipPath={`url(#${id}w)`}>
        <rect x={60} y={winTop} width={960} height={wb - winTop} fill={`url(#${id}s)`} />
        {dk > 0.3 && Array.from({length: 14}).map((_, i) => <circle key={i} cx={80 + h01(seed + 9, i) * 920} cy={winTop + 20 + h01(seed + 3, i) * 200} r={1.6} fill="#fff" opacity={(dk - 0.3) * h01(i, seed)} />)}
        <g transform={`translate(${drift * 0.3} 0)`}>
          <path d={ridge(wb - 300, 260, seed)} fill={mix('#B7C3CB', '#4E6A70', dk)} stroke={INK} strokeWidth={3} />
          {/* snow caps on the far ridge */}
          <path d={ridge(wb - 300, 260, seed)} fill="none" stroke={CAN.snow} strokeWidth={10} opacity={0.6} strokeDasharray="60 140" />
        </g>
        <g transform={`translate(${drift * 0.7} 0)`}>
          <path d={ridge(wb - 180, 150, seed + 5)} fill={mix('#7F949E', '#2E4A50', dk)} stroke={INK} strokeWidth={3} />
          {/* spruce on the near slope */}
          {Array.from({length: 16}).map((_, i) => {
            const tx = 70 + i * 62 + h01(seed, i) * 20, ty = wb - 70 - h01(seed + 2, i) * 60, th = 50 + h01(seed + 4, i) * 40;
            return <path key={i} d={`M${tx},${ty - th} L${tx + th * 0.28},${ty} L${tx - th * 0.28},${ty} Z`} fill={CAN.spruce} stroke={INK} strokeWidth={2.5} />;
          })}
        </g>
        {/* the Anchorage grid of lights below */}
        <g transform={`translate(${drift} 0)`}>
          <rect x={60} y={wb - 60} width={960} height={60} fill={mix('#5E6E74', '#1E3034', dk)} />
          {Array.from({length: 40}).map((_, i) => (
            <rect key={i} x={70 + (i % 20) * 48 + h01(seed + 6, i) * 20} y={wb - 50 + Math.floor(i / 20) * 22} width={8} height={5} fill={CAN.lamp} opacity={0.35 + 0.6 * dk * h01(i, seed + 1)} />
          ))}
        </g>
      </g>
      {/* window frame and mullions */}
      <rect x={60} y={winTop} width={960} height={wb - winTop} fill="none" stroke={CAN.chalkD} strokeWidth={22} />
      <rect x={60} y={winTop} width={960} height={wb - winTop} fill="none" stroke={INK} strokeWidth={5} />
      <line x1={540} x2={540} y1={winTop} y2={wb} stroke={CAN.chalkD} strokeWidth={14} />
      <line x1={540} x2={540} y1={winTop} y2={wb} stroke={INK} strokeWidth={3} />
      {/* sill with a jar row, seeded */}
      <rect x={40} y={wb} width={1000} height={26} fill={CAN.chalk} stroke={INK} strokeWidth={4} />
      {Array.from({length: 3 + (seed % 3)}).map((_, i) => {
        const jx = 120 + i * (780 / (3 + (seed % 3))) + h01(seed, i) * 40;
        return (
          <g key={i} transform={`translate(${jx} ${wb})`}>
            <rect x={-16} y={-40 - (i % 2) * 10} width={32} height={40 + (i % 2) * 10} rx={5} fill={CAN.glass} opacity={0.55} stroke={INK} strokeWidth={3} />
            <rect x={-18} y={-48 - (i % 2) * 10} width={36} height={10} rx={3} fill={i % 2 ? CAN.chalkD : CAN.sootL} stroke={INK} strokeWidth={2.5} />
          </g>
        );
      })}
      {wallUp > 0 && <ScaleWall f={f} x={540} y={benchY} w={1000} h={benchY - winTop + 40} grow={wallUp} seed={seed + 40} />}
      {behind}
      {/* bench */}
      <rect x={-60} y={benchY} width={1200} height={30} fill={CAN.benchTop} stroke={INK} strokeWidth={5} />
      <rect x={-60} y={benchY + 30} width={1200} height={760} fill={CAN.bench} />
      {Array.from({length: 6}).map((_, i) => <line key={i} x1={-60} x2={1140} y1={benchY + 90 + i * 110} y2={benchY + 90 + i * 110} stroke={INK} strokeWidth={2} opacity={0.3} />)}
      {Array.from({length: 4}).map((_, i) => <rect key={i} x={40 + i * 270} y={benchY + 80} width={220} height={260} rx={8} fill="none" stroke={INK} strokeWidth={3} opacity={0.45} />)}
      {Array.from({length: 4}).map((_, i) => <circle key={i} cx={150 + i * 270} cy={benchY + 210} r={9} fill={CAN.chalkD} stroke={INK} strokeWidth={2.5} />)}
      <rect x={-60} y={-60} width={1200} height={2040} fill={`url(#${id}l)`} />
      {children}
      {/* near plane: a glassware rack along the bench front, seeded */}
      {near && (
        <g transform={`translate(${-drift * 0.6} 0)`}>
          {Array.from({length: 7}).map((_, i) => {
            const rx = 30 + i * 160 + h01(seed + 11, i) * 40;
            const rh = 70 + h01(seed + 12, i) * 60;
            return (
              <g key={i}>
                <rect x={rx} y={1590 - rh} width={34} height={rh} rx={14} fill={CAN.glass} opacity={0.5} stroke={INK} strokeWidth={3.5} />
                <rect x={rx + 4} y={1590 - rh * (0.3 + 0.4 * h01(seed, i))} width={26} height={rh * (0.3 + 0.4 * h01(seed, i)) - 4} rx={10} fill={i % 3 === 0 ? CAN.lilac : '#8FB0B8'} opacity={0.6} />
              </g>
            );
          })}
          <rect x={-60} y={1590} width={1200} height={22} fill={CAN.chalkD} stroke={INK} strokeWidth={4} />
          <rect x={-60} y={1612} width={1200} height={360} fill={mix('#3C3F43', '#232528', dk)} />
          {Array.from({length: 9}).map((_, i) => <line key={i} x1={-60 + i * 150} x2={-120 + i * 150} y1={1612} y2={1960} stroke={INK} strokeWidth={2} opacity={0.35} />)}
        </g>
      )}
    </g>
  );
};

const MONO_F = 'JetBrains Mono';
const tagW = (s: string, size: number) => s.length * size * 0.602 + 22;

/** A small tear-off wall calendar on a nail. `torn` 0..1 peels the top page off and away (a month, or a year with big). */
export const TearCalendar: React.FC<{f: number; x: number; y: number; s?: number; top?: string; under?: string; torn?: number; seed?: number}> =
({f, x, y, s = 1, top = 'MONTH', under = 'MONTH', torn = 0, seed = 1}) => {
  const tr = clamp01(torn);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx={0} cy={-6} r={6} fill={CAN.chalkD} stroke={INK} strokeWidth={3} />
      <rect x={-90} y={0} width={180} height={190} rx={6} fill="#000" opacity={0.2} transform="translate(6 6)" />
      <rect x={-90} y={0} width={180} height={190} rx={6} fill={CAN.card} stroke={INK} strokeWidth={5} />
      <rect x={-90} y={0} width={180} height={40} rx={6} fill={CAN.red} stroke={INK} strokeWidth={5} />
      {Array.from({length: 20}).map((_, i) => <rect key={`g${i}`} x={-76 + (i % 5) * 31} y={56 + Math.floor(i / 5) * 30} width={24} height={20} fill={CAN.chalkD} />)}
      {under && <text x={0} y={120} textAnchor="middle" fontFamily={MONO_F} fontWeight={800} fontSize={30} fill={INK}>{under}</text>}
      {tr < 0.98 && (
        <g transform={`translate(${-90 + tr * 260} ${40 + tr * 120}) rotate(${tr * 70 + 6 * Math.sin(f / 3 + seed) * tr})`} opacity={1 - tr * 0.6}>
          <rect x={0} y={0} width={180} height={150} rx={4} fill={CAN.card} stroke={INK} strokeWidth={4} />
          {Array.from({length: 12}).map((_, i) => <rect key={i} x={14 + (i % 4) * 40} y={58 + Math.floor(i / 4) * 26} width={28} height={16} fill={CAN.chalkD} />)}
          <text x={90} y={44} textAnchor="middle" fontFamily={MONO_F} fontWeight={800} fontSize={26} fill={INK}>{top}</text>
        </g>
      )}
    </g>
  );
};

/** A loose page that blows across the frame. t 0..1 along the path. */
export const BlowPage: React.FC<{f: number; x0: number; y0: number; x1: number; y1: number; t: number; seed?: number; label?: string}> = ({f, x0, y0, x1, y1, t, seed = 1, label}) => {
  const k = clamp01(t);
  if (k <= 0 || k >= 1) return null;
  const x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * 120;
  return (
    <g transform={`translate(${x} ${y}) rotate(${k * 300 * (seed % 2 ? 1 : -1) + 10 * Math.sin(f / 4 + seed)})`}>
      <rect x={-40} y={-30} width={80} height={60} rx={3} fill={CAN.card} stroke={INK} strokeWidth={3} />
      <rect x={-40} y={-30} width={80} height={12} fill={CAN.red} />
      {label && <text x={0} y={12} textAnchor="middle" fontFamily={MONO_F} fontWeight={800} fontSize={13} fill={INK}>{label}</text>}
    </g>
  );
};

/** A hanging bird feeder with a DATA tag; seeds 0..n sit in its tray. Hangs from a hook at (x, y). */
export const DataFeeder: React.FC<{f: number; x: number; y: number; s?: number; seeds?: number; drop?: number; seed?: number; frosted?: boolean; tag?: string}> = ({f, x, y, s = 1, seeds = 0, drop = 1, seed = 2, frosted = false, tag = 'DATA'}) => {
  const sway = 3 * Math.sin(f / 23 + seed);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-14,0 q14,-16 28,0" fill="none" stroke={INK} strokeWidth={4} />
      <g transform={`rotate(${sway})`}>
        <line x1={0} y1={0} x2={0} y2={60} stroke={INK} strokeWidth={3} />
        <path d="M-60,60 L0,30 L60,60 Z" fill={CAN.cobaltD} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <rect x={-40} y={60} width={80} height={110} rx={6} fill={frosted ? '#E3E9EE' : CAN.glass} opacity={frosted ? 0.95 : 0.6} stroke={INK} strokeWidth={4} />
        {frosted && Array.from({length: 5}).map((_, i) => <path key={i} d={`M${-30 + i * 14},${70 + (i % 2) * 8} l8,90`} stroke="#fff" strokeWidth={3} opacity={0.5} />)}
        <rect x={-62} y={170} width={124} height={18} rx={5} fill={CAN.chalk} stroke={INK} strokeWidth={4} />
        {Array.from({length: Math.round(seeds)}).map((_, i) => {
          const sy = 168 - 160 * (1 - clamp01(drop * 3 - i * 0.6));
          return <ellipse key={i} cx={-22 + i * 22} cy={Math.min(168, sy)} rx={6} ry={4} fill="#C9A46A" stroke={INK} strokeWidth={2} />;
        })}
        <rect x={-tagW(tag, 22) / 2} y={96} width={tagW(tag, 22)} height={34} rx={4} fill={CAN.card} stroke={INK} strokeWidth={3} />
        <text x={0} y={121} textAnchor="middle" fontFamily={MONO_F} fontWeight={800} fontSize={22} fill={INK}>{tag}</text>
      </g>
    </g>
  );
};

/** A bassinet on rockers with a sleeping bench reactor inside (a little stoppered vessel, eyes shut). */
export const Bassinet: React.FC<{f: number; x: number; y: number; s?: number; rock?: number; seed?: number}> = ({f, x, y, s = 1, rock = 1, seed = 3}) => {
  const id = uid(`bas${seed}`);
  const t = paleTones('#E8DDF4');
  const a = 6 * rock * Math.sin(f / 14 + seed);
  const z = (f % 60) / 60;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <FormGradient id={id} t={t} />
      <ContactShadow cx={0} cy={4} rx={130} ry={12} opacity={0.35} blur={8} />
      <g transform={`rotate(${a})`}>
        <path d="M-130,0 Q0,40 130,0" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
        <path d="M-110,-12 L-96,-110 L96,-110 L110,-12 Z" fill={`url(#${id})`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {Array.from({length: 7}).map((_, i) => <line key={i} x1={-84 + i * 28} y1={-104} x2={-90 + i * 30} y2={-18} stroke={CAN.lilacD} strokeWidth={2} opacity={0.5} />)}
        {/* the reactor asleep */}
        <g transform="translate(0 -110)">
          <path d="M-36,0 L-30,-70 L30,-70 L36,0 Z" fill={CAN.glass} stroke={INK} strokeWidth={4} />
          <rect x={-30} y={-46} width={60} height={46} fill={CAN.lilac} opacity={0.55} />
          <rect x={-16} y={-86} width={32} height={18} rx={4} fill={CAN.sootL} stroke={INK} strokeWidth={3} />
          <path d="M-16,-36 q6,5 12,0 M6,-36 q6,5 12,0" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
          <path d="M-6,-22 q6,4 12,0" fill="none" stroke={INK} strokeWidth={2.4} />
          {/* a blanket */}
          <path d="M-60,0 q20,-26 60,-20 q40,-6 60,20 Z" fill="#F2E6C8" stroke={INK} strokeWidth={4} />
          <text x={48 + z * 30} y={-80 - z * 50} fontFamily={MONO_F} fontWeight={800} fontSize={22 + z * 8} fill={CAN.chalk} opacity={1 - z}>z</text>
        </g>
      </g>
    </g>
  );
};

/** A recovery bar of stacked blocks, origin at its foot. blocks shown 0..n with rise 0..1, a label tab under it. */
export const BlockBar: React.FC<{f: number; x: number; y: number; n: number; rise?: number; label: string; color?: string; bw?: number; bh?: number; dashedTo?: number}> =
({f, x, y, n, rise = 1, label, color = CAN.lilac, bw = 120, bh = 40, dashedTo}) => {
  const shown = n * clamp01(rise);
  const t = tones(color);
  return (
    <g transform={`translate(${x} ${y})`}>
      <ContactShadow cx={0} cy={2} rx={bw * 0.7} ry={9} opacity={0.35} blur={6} />
      {dashedTo !== undefined && Array.from({length: dashedTo}).map((_, i) => (
        <rect key={`d${i}`} x={-bw / 2} y={-(i + 1) * bh} width={bw} height={bh - 4} rx={4} fill="none" stroke={CAN.cobaltL} strokeWidth={3} strokeDasharray="8 6" />
      ))}
      {Array.from({length: Math.ceil(shown)}).map((_, i) => {
        const k = clamp01(shown - i);
        const sq = i === Math.ceil(shown) - 1 ? 1 + 0.15 * Math.sin(k * Math.PI) : 1;
        return (
          <g key={i} transform={`translate(0 ${-(i + 1) * bh + (1 - k) * -40}) scale(1 ${sq})`} opacity={Math.min(1, k * 3)}>
            <rect x={-bw / 2} y={0} width={bw} height={bh - 4} rx={4} fill={t.core} stroke={INK} strokeWidth={3.5} />
            <rect x={-bw / 2 + 6} y={4} width={bw * 0.4} height={6} rx={3} fill="#fff" opacity={0.35} />
          </g>
        );
      })}
      <rect x={-tagW(label, 24) / 2} y={14} width={tagW(label, 24)} height={38} rx={5} fill={CAN.card} stroke={INK} strokeWidth={3.5} />
      <text x={0} y={41} textAnchor="middle" fontFamily={MONO_F} fontWeight={800} fontSize={24} fill={INK}>{label}</text>
    </g>
  );
};

/** A ghost pilot tank: a big dashed cobalt-outlined vessel on legs, no face, no fill, a stencil plate. */
export const GhostTank: React.FC<{f: number; x: number; y: number; s?: number; k?: number; plate?: string}> = ({f, x, y, s = 1, k = 1, plate}) => {
  const a = clamp01(k);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={0.35 + 0.65 * a}>
      <path d="M-150,-120 L-150,-560 Q-150,-640 0,-650 Q150,-640 150,-560 L150,-120 Z" fill={CAN.cobalt} opacity={0.12} stroke={CAN.cobaltL} strokeWidth={6} strokeDasharray="22 12" />
      {[-110, 110].map((lx, i) => <line key={i} x1={lx} y1={-120} x2={lx * 1.15} y2={0} stroke={CAN.cobaltL} strokeWidth={8} strokeDasharray="14 10" />)}
      {Array.from({length: 6}).map((_, i) => <line key={i} x1={-150} x2={150} y1={-180 - i * 70} y2={-180 - i * 70} stroke={CAN.cobaltL} strokeWidth={2} opacity={0.4} strokeDasharray="10 12" />)}
      <path d="M-120,-600 q40,-30 90,-30" fill="none" stroke="#fff" strokeWidth={6} opacity={0.25 + 0.1 * Math.sin(f / 20)} />
      {plate && (
        <g transform="translate(0 -360)">
          <rect x={-tagW(plate, 20) / 2} y={-20} width={tagW(plate, 20)} height={40} rx={4} fill={CAN.night} stroke={CAN.cobaltL} strokeWidth={3} />
          <text x={0} y={7} textAnchor="middle" fontFamily={MONO_F} fontWeight={800} fontSize={20} fill={CAN.cobaltL}>{plate}</text>
        </g>
      )}
    </g>
  );
};

/** An open ledger on a lectern; pages flip (flip counts pages turned), each turned page shows a red stamp. */
export const Ledger: React.FC<{f: number; x: number; y: number; s?: number; flip?: number; stamps?: number}> = ({f, x, y, s = 1, flip = 0, stamps = 0}) => {
  const fl = Math.max(0, flip);
  const cur = fl - Math.floor(fl);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ContactShadow cx={0} cy={4} rx={150} ry={14} opacity={0.35} blur={8} />
      <path d="M-20,0 L-40,-200 L40,-200 L20,0 Z" fill={CAN.bench} stroke={INK} strokeWidth={5} />
      <g transform="translate(0 -220) skewX(-8)">
        <rect x={-170} y={-130} width={340} height={150} rx={6} fill={CAN.card} stroke={INK} strokeWidth={5} />
        <line x1={0} y1={-130} x2={0} y2={20} stroke={INK} strokeWidth={3} />
        {Array.from({length: 6}).map((_, i) => (
          <g key={i}>
            <line x1={-150} x2={-20} y1={-104 + i * 20} y2={-104 + i * 20} stroke={CAN.chalkD} strokeWidth={3} />
            <line x1={20} x2={150} y1={-104 + i * 20} y2={-104 + i * 20} stroke={CAN.chalkD} strokeWidth={3} />
            {i < stamps && <rect x={96} y={-112 + i * 20} width={48} height={14} rx={2} fill={CAN.red} opacity={0.9} />}
            {i < stamps && <rect x={-60} y={-112 + i * 20} width={48} height={14} rx={2} fill={CAN.red} opacity={0.9} />}
          </g>
        ))}
        {cur > 0.02 && cur < 0.98 && (
          <g transform={`scale(${Math.cos(cur * Math.PI)} 1)`}>
            <rect x={0} y={-130} width={170} height={150} rx={4} fill="#FFFDF6" stroke={INK} strokeWidth={4} />
            <rect x={110} y={-100} width={48} height={14} fill={CAN.red} opacity={0.8} />
          </g>
        )}
      </g>
    </g>
  );
};

/** A brass magnifier, its grip at the origin (hand anchor). rot in degrees. */
export const Magnifier: React.FC<{x: number; y: number; s?: number; rot?: number; glint?: number}> = ({x, y, s = 1, rot = 0, glint = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-10} y={-10} width={20} height={90} rx={8} fill="#6B4A2A" stroke={INK} strokeWidth={4} transform="rotate(180)" />
    <g transform="translate(0 -130)">
      <circle r={62} fill={CAN.glass} opacity={0.35} />
      <circle r={62} fill="none" stroke="#C9A04A" strokeWidth={12} />
      <circle r={62} fill="none" stroke={INK} strokeWidth={4} />
      <circle r={74} fill="none" stroke={INK} strokeWidth={3} />
      <path d="M-34,-30 q14,-18 36,-20" fill="none" stroke="#fff" strokeWidth={6} opacity={0.5 + 0.4 * glint} strokeLinecap="round" />
    </g>
  </g>
);

/** A labelled chemical drum (acid, heat or solvent) that can shake and steam. */
export const Drum: React.FC<{f: number; x: number; y: number; s?: number; label: string; color?: string; shake?: number; steam?: number; seed?: number}> =
({f, x, y, s = 1, label, color = '#7A8696', shake = 0, steam = 0, seed = 1}) => {
  const id = uid(`drum${seed}`);
  const t = tones(color);
  const jx = shake * 3 * Math.sin(f * 1.7 + seed);
  return (
    <g transform={`translate(${x + jx} ${y}) scale(${s})`}>
      <FormGradient id={id} t={t} />
      <ContactShadow cx={0} cy={3} rx={52} ry={9} opacity={0.35} blur={6} />
      <rect x={-44} y={-120} width={88} height={120} rx={8} fill={`url(#${id})`} stroke={INK} strokeWidth={4.5} />
      {[-90, -30].map((ry, i) => <line key={i} x1={-44} x2={44} y1={ry} y2={ry} stroke={INK} strokeWidth={3} />)}
      <ellipse cx={0} cy={-120} rx={44} ry={10} fill={t.base} stroke={INK} strokeWidth={4} />
      <rect x={-tagW(label, 16) / 2} y={-72} width={tagW(label, 16)} height={26} rx={3} fill={CAN.card} stroke={INK} strokeWidth={2.5} />
      <text x={0} y={-53} textAnchor="middle" fontFamily={MONO_F} fontWeight={800} fontSize={16} fill={INK}>{label}</text>
      {steam > 0 && [0, 1, 2].map((k) => {
        const p = ((f / 30 + k / 3 + seed * 0.1) % 1);
        return <circle key={k} cx={-10 + k * 12 + 8 * Math.sin(f / 9 + k)} cy={-130 - p * 90} r={10 + p * 16} fill="#E8EEF6" opacity={steam * (1 - p) * 0.7} />;
      })}
    </g>
  );
};

/** A toy wind turbine on a base; spin is the rotor angle in degrees. */
export const ToyTurbine: React.FC<{x: number; y: number; s?: number; spin?: number}> = ({x, y, s = 1, spin = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ContactShadow cx={0} cy={2} rx={30} ry={6} opacity={0.3} blur={5} />
    <path d="M-6,0 L-3,-150 L3,-150 L6,0 Z" fill={CAN.chalk} stroke={INK} strokeWidth={3} />
    <g transform={`translate(0 -150) rotate(${spin})`}>
      {[0, 120, 240].map((a) => <path key={a} transform={`rotate(${a})`} d="M0,0 L-6,-80 Q0,-90 6,-80 Z" fill={CAN.chalk} stroke={INK} strokeWidth={3} />)}
      <circle r={9} fill={CAN.lilac} stroke={INK} strokeWidth={3} />
    </g>
  </g>
);

/** The NSF award board: a cork-free steel clip board with a big stamped figure and pin slots for partners. */
export const AwardBoard: React.FC<{f: number; x: number; y: number; s?: number; land?: number; pins?: string[]; pinK?: number[]}> = ({f, x, y, s = 1, land = 1, pins = [], pinK = []}) => {
  const l = clamp01(land);
  const drop = (1 - l) * -400;
  const sq = 1 + 0.08 * Math.sin(l * Math.PI) * (l > 0.7 ? 1 : 0);
  if (l <= 0) return null;
  return (
    <g transform={`translate(${x} ${y + drop}) scale(${s} ${s / sq})`}>
      <ContactShadow cx={0} cy={4} rx={180} ry={12} opacity={0.35} blur={8} />
      <rect x={-170} y={-200} width={340} height={200} rx={10} fill={CAN.card} stroke={INK} strokeWidth={6} />
      <rect x={-170} y={-200} width={340} height={46} rx={10} fill={CAN.cobaltD} stroke={INK} strokeWidth={6} />
      <text x={0} y={-168} textAnchor="middle" fontFamily={MONO_F} fontWeight={800} fontSize={26} fill={CAN.chalk}>NSF</text>
      <text x={0} y={-98} textAnchor="middle" fontFamily={MONO_F} fontWeight={800} fontSize={56} fill={INK}>$6M</text>
      {pins.map((p, i) => {
        const k = clamp01(pinK[i] ?? 0);
        if (k <= 0) return null;
        const px = -110 + i * 110;
        return (
          <g key={i} transform={`translate(${px} ${-44 - (1 - k) * 60}) scale(${0.8 + 0.2 * k})`} opacity={k}>
            <rect x={-tagW(p, 14) / 2} y={-16} width={tagW(p, 14)} height={30} rx={4} fill={CAN.chalkD} stroke={INK} strokeWidth={2.5} />
            <text x={0} y={5} textAnchor="middle" fontFamily={MONO_F} fontWeight={800} fontSize={14} fill={INK}>{p}</text>
          </g>
        );
      })}
    </g>
  );
};

/** The GOAL step stool: four or five chalk-white treads, round-cornered. outline (default true) draws it dashed: a goal, never a result. slide 0..1 slides it in from the right. */
export const GoalStool: React.FC<{f: number; x: number; y: number; s?: number; treads?: number; outline?: boolean; slide?: number; label?: string}> =
({f, x, y, s = 1, treads = 5, outline = true, slide = 1, label = 'GOAL'}) => {
  const k = clamp01(slide);
  if (k <= 0) return null;
  const ox = (1 - k) * 260;
  const tw = 30, th = 26;
  let d = `M0,0`;
  for (let i = 0; i < treads; i++) d += ` L${i * tw},${-(i + 1) * th} L${(i + 1) * tw},${-(i + 1) * th}`;
  d += ` L${treads * tw},0 Z`;
  return (
    <g transform={`translate(${x + ox} ${y}) scale(${s})`} opacity={Math.min(1, k * 1.6)}>
      {!outline && <ContactShadow cx={treads * tw / 2} cy={2} rx={treads * tw * 0.6} ry={7} opacity={0.3} blur={5} />}
      <path d={d} fill={outline ? CAN.chalk : CAN.chalk} fillOpacity={outline ? 0.14 : 1} stroke={outline ? CAN.chalk : INK} strokeWidth={4}
        strokeDasharray={outline ? '10 7' : undefined} strokeLinejoin="round" strokeDashoffset={-f * 0.4} />
      <g transform={`translate(${treads * tw / 2} 26)`}>
        <rect x={-tagW(label, 16) / 2} y={-14} width={tagW(label, 16)} height={26} rx={4} fill={CAN.card} stroke={INK} strokeWidth={2.5} />
        <text x={0} y={5} textAnchor="middle" fontFamily={MONO_F} fontWeight={800} fontSize={16} fill={INK}>{label}</text>
      </g>
    </g>
  );
};
