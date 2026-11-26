import React from 'react';
import {tones, paleTones, ContactShadow} from './lighting';
import {figureIdle, FigurePose} from './figureidle';
import {MONO, monoW} from './prospect';

/**
 * THE PING FAMILY (2026-11-26, "Ahead of the Patient").
 *
 * For any story about software that READS something and SENDS an alert: a faced coral alert card
 * (Ping) that is born in a CT ring, flags, splits into identical copies and can be checked by a pen;
 * a CT gantry seen dead on; greyscale brain slices with one crimson clot dot; a ream of slices; a
 * faceless report printer whose page creeps out (the running gag: the news beats the paperwork); a
 * wall scoreboard with lit and dashed-blank rows; a faceless gurney token for a patient on a dashed
 * line (never a vehicle); a wall phone with a swinging receiver; a hook rail of gowns; and two ward
 * worlds, the cold interior hospital before dawn and the warm Anchorage stroke room.
 *
 * Palette roles (art_direction.json): coral is Ping and its copies ONLY; crimson is the clot ONLY;
 * everything else is value-led celadon, graphite-teal, bone and brass.
 *
 * Every faced character takes `cues` and commits a beat pose on each (the forest.tsx beatPose pattern).
 */
export const PING = {
  ink: '#1F3438', inkL: '#35504F', tile: '#CFE3D8', tileL: '#E9F1EC', grout: '#9DBFB2', night: '#2D4660', nightD: '#1B2C40',
  sodium: '#FFC98A', bone: '#F4F1E6', boneD: '#D9D3C0', coral: '#FF6F59', coralL: '#FFB4A3', coralD: '#C9412F', coralRim: '#FFE3D9',
  clot: '#C2273A', slice: '#E8E4D8', sliceD: '#6E7470', rose: '#F7E3DA', roseD: '#E2BFB2', lamp: '#FFE9D6', paper: '#EFE7D2',
  print: '#3A3A36', brass: '#B8924A', steel: '#8C9A9A', steelD: '#5E6C6C', floor: '#B7CBC2', floorD: '#8FA79D', beige: '#D8CDB4',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const h01 = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
let UID = 0;
const uid = (s: string) => `${s.replace(/[^a-z0-9]/gi, '')}${(UID++ % 100000).toString(36)}`;

type BeatPose = {skew: number; dip: number; tilt: number; arm: number; on: boolean};
const NO_POSE: BeatPose = {skew: 0, dip: 0, tilt: 0, arm: 0, on: false};
function beatPose(f: number, seed: number, cues: number[] | undefined, h: number): BeatPose {
  if (!cues || !cues.length) return NO_POSE;
  const p: FigurePose = figureIdle(f, seed, 1, cues);
  const skew = (Math.atan2(p.shift * 2.2 * (h / 300), h) * 180) / Math.PI + p.lean * 0.7;
  return {skew, dip: p.dip * 1.4, tilt: p.headRot * 1.6, arm: (p.armL + p.armR) * 1.4, on: true};
}

/** a mono plate sized to its string by arithmetic */
export const PTag: React.FC<{x: number; y: number; text: string; size?: number; fill?: string; ink?: string; rot?: number; dashed?: boolean}> = ({x, y, text, size = 22, fill = PING.paper, ink = PING.ink, rot = 0, dashed = false}) => {
  const w = monoW(text, size) + 28;
  const h = size + 18;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-w / 2 + 4} y={-h / 2 + 5} width={w} height={h} rx={5} fill="#000" opacity={0.22} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={5} fill={fill} stroke={ink} strokeWidth={3.5} strokeDasharray={dashed ? '10 7' : undefined} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={1.5} fill={ink}>{text}</text>
    </g>
  );
};

/**
 * BrainSlice. An axial CT slice: skull ring, grey matter, ventricles, a midline, optional crimson clot dot.
 * Origin is the centre; r is the outer radius. `clot` 0..1 grows the dot; `flag` 0..1 draws a reticle round it.
 */
export const BrainSlice: React.FC<{x: number; y: number; r?: number; clot?: number; flag?: number; seed?: number; dim?: number; clotAt?: [number, number]}> = ({x, y, r = 60, clot = 0, flag = 0, seed = 1, dim = 0, clotAt = [0.32, -0.18]}) => {
  const id = uid(`slice${seed}`);
  const wob = (k: number) => 1 + 0.035 * Math.sin(k * 3.1 + seed);
  const pts = Array.from({length: 24}, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const rr = r * 0.86 * wob(i) * (i % 2 ? 1 : 0.985);
    return `${(Math.cos(a) * rr * 0.86).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`;
  }).join(' ');
  const cx = clotAt[0] * r, cy = clotAt[1] * r;
  return (
    <g transform={`translate(${x} ${y})`} opacity={1 - 0.45 * dim}>
      <defs>
        <radialGradient id={`${id}-g`} cx="0.45" cy="0.42" r="0.7">
          <stop offset="0" stopColor="#B9B8AE" /><stop offset="0.7" stopColor="#8E908A" /><stop offset="1" stopColor={PING.sliceD} />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={0} rx={r * 0.92} ry={r * 1.04} fill="#111A1C" />
      <ellipse cx={0} cy={0} rx={r * 0.86} ry={r * 0.98} fill="none" stroke={PING.slice} strokeWidth={r * 0.08} />
      <polygon points={pts} fill={`url(#${id}-g)`} />
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={`M ${s * r * 0.12} ${-r * 0.22} q ${s * r * 0.18} ${r * 0.05} ${s * r * 0.14} ${r * 0.32} q ${-s * r * 0.08} ${r * 0.06} ${-s * r * 0.12} ${-r * 0.02} Z`} fill="#3E4442" />
          {[0, 1, 2, 3].map((k) => (
            <path key={k} d={`M ${s * r * (0.42 + k * 0.08)} ${-r * (0.6 - k * 0.32)} q ${s * r * 0.1} ${r * 0.08} ${s * r * 0.02} ${r * 0.18}`} stroke="#6A6E68" strokeWidth={r * 0.025} fill="none" />
          ))}
        </g>
      ))}
      <line x1={0} y1={-r * 0.92} x2={0} y2={r * 0.92} stroke="#5F6460" strokeWidth={r * 0.025} />
      {clot > 0 && (
        <g transform={`translate(${cx} ${cy})`}>
          <circle r={r * 0.1 * clot + 2} fill={PING.clot} stroke="#5A0E18" strokeWidth={Math.max(1.5, r * 0.02)} />
          <circle r={r * 0.04 * clot} cx={-r * 0.02} cy={-r * 0.03} fill="#FF8A93" opacity={0.7} />
        </g>
      )}
      {flag > 0 && (
        <g transform={`translate(${cx} ${cy}) rotate(${45 * (1 - flag)}) scale(${1.8 - 0.8 * clamp01(flag)})`} opacity={clamp01(flag * 1.5)}>
          <circle r={r * 0.24} fill="none" stroke={PING.coral} strokeWidth={r * 0.045} />
          {[0, 90, 180, 270].map((a) => <line key={a} x1={0} y1={-r * 0.3} x2={0} y2={-r * 0.18} stroke={PING.coral} strokeWidth={r * 0.045} transform={`rotate(${a})`} strokeLinecap="round" />)}
        </g>
      )}
      <ellipse cx={0} cy={0} rx={r * 0.92} ry={r * 1.04} fill="none" stroke={PING.ink} strokeWidth={Math.max(2.5, r * 0.05)} />
    </g>
  );
};

export type PingEmotion = 'sleepy' | 'alert' | 'proud' | 'determined' | 'sheepish' | 'deflated' | 'hopeful' | 'curious';

/**
 * Ping. A faced coral alert card. Origin (x, y) is the bottom centre of the card. At s=1 it is 150 wide and 190 tall.
 *  - split 0..1   two identical copies pull apart sideways with a stretched neck that snaps at 0.55 (spread px each side)
 *  - glow 0..1    the coral spill that rims nearby things
 *  - squash 0..1  landing squash; pop 0..1 a birth pop (scale overshoot)
 *  - grey 0..1    a checked card turns from coral to neutral grey (false positive cleared)
 *  - look -1..1   pupils; arm -1..1 the waving arm
 *  - clot         the slice thumbnail shows the clot dot
 */
export const Ping: React.FC<{
  f: number; x: number; y: number; s?: number; emotion?: PingEmotion; split?: number; spread?: number; glow?: number; squash?: number;
  pop?: number; grey?: number; look?: number; arm?: number; cues?: number[]; seed?: number; tilt?: number; shadow?: boolean; clot?: boolean; label?: string;
}> = ({f, x, y, s = 1, emotion = 'alert', split = 0, spread = 150, glow = 0.8, squash = 0, pop = 1, grey = 0, look = 0, arm = 0, cues, seed = 1, tilt = 0, shadow = true, clot = true, label}) => {
  const sp = clamp01(split);
  if (sp > 0.02) {
    const d = spread * (sp < 0.55 ? sp * 0.5 : 0.275 + (sp - 0.55) / 0.45 * 0.725 + 0.06 * Math.sin((sp - 0.55) * 14) * (1 - sp));
    const neck = sp < 0.55 ? 1 - sp / 0.55 : 0;
    return (
      <g>
        {neck > 0 && <path d={`M ${x - d} ${y - 90 * s} C ${x - d / 3} ${y - (90 + 30 * neck) * s} ${x + d / 3} ${y - (90 + 30 * neck) * s} ${x + d} ${y - 90 * s}`}
          stroke={PING.coral} strokeWidth={60 * s * neck} strokeLinecap="round" fill="none" />}
        <Ping f={f} x={x - d} y={y} s={s} emotion={emotion} glow={glow} squash={squash} pop={pop} grey={grey} look={-1} arm={-0.6} cues={cues} seed={seed} tilt={tilt - 8 * neck} shadow={shadow} clot={clot} label={label} />
        <Ping f={f} x={x + d} y={y} s={s} emotion={emotion} glow={glow} squash={squash} pop={pop} grey={grey} look={1} arm={0.6} cues={cues} seed={seed + 3} tilt={tilt + 8 * neck} shadow={shadow} clot={clot} label={label} />
      </g>
    );
  }
  const id = uid(`ping${seed}`);
  const bp = beatPose(f, seed, cues, 190);
  const breathe = 1 + 0.02 * Math.sin(f / 11 + seed);
  const bob = 4 * Math.sin(f / 17 + seed * 1.7);
  const W = 150, H = 190;
  const blinkPh = (f + seed * 31) % 96;
  const blink = emotion === 'sleepy' ? 0.75 : blinkPh < 4 ? 1 - Math.abs(blinkPh - 2) / 2 : 0;
  const mix = (a: string, b: string, t: number) => {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const c = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
    return `#${[16, 8, 0].map((sh) => c(sh).toString(16).padStart(2, '0')).join('')}`;
  };
  const base = mix(PING.coral, '#A7ADA9', grey), lit = mix(PING.coralL, '#D4D8D4', grey), shade = mix(PING.coralD, '#6F7672', grey);
  const pScale = pop >= 1 ? 1 : 1 - Math.exp(-6 * pop) * Math.cos(9 * pop) * 0.9;
  const sq = 1 - 0.16 * squash;
  const mouth: Record<PingEmotion, string> = {
    sleepy: 'M -10 2 Q 0 6 10 2', alert: 'M -12 0 Q 0 14 12 0', proud: 'M -18 -2 Q 0 18 18 -2', determined: 'M -14 4 L 14 2',
    sheepish: 'M -14 6 q 7 -6 14 0 q 7 6 14 0', deflated: 'M -12 8 Q 0 -2 12 8', hopeful: 'M -12 0 Q 0 10 12 0', curious: 'M -6 4 a 6 6 0 1 0 12 0 a 6 6 0 1 0 -12 0',
  };
  const brow: Record<PingEmotion, number> = {sleepy: 2, alert: -8, proud: -5, determined: 9, sheepish: -9, deflated: -10, hopeful: -6, curious: -10};
  const armA = 30 + 60 * arm + 10 * Math.sin(f / 9 + seed) + bp.arm * 8;
  return (
    <g transform={`translate(${x} ${y + bob * 0.4}) rotate(${tilt + bp.skew}) scale(${s * pScale * (1 + 0.1 * squash)} ${s * pScale * sq * breathe}) translate(0 ${-bp.dip})`}>
      <defs>
        <linearGradient id={`${id}-b`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={lit} /><stop offset="0.45" stopColor={base} /><stop offset="1" stopColor={shade} />
        </linearGradient>
        <radialGradient id={`${id}-glow`}><stop offset="0" stopColor={PING.coral} stopOpacity={0.55} /><stop offset="1" stopColor={PING.coral} stopOpacity={0} /></radialGradient>
      </defs>
      {glow > 0 && grey < 0.9 && <ellipse cx={0} cy={-H / 2} rx={W * 1.25} ry={H * 1.05} fill={`url(#${id}-glow)`} opacity={glow * (0.85 + 0.15 * Math.sin(f / 6 + seed)) * (1 - grey)} />}
      {shadow && <ContactShadow cx={0} cy={4} rx={70} ry={11} opacity={0.4} />}
      {/* arms behind the card */}
      <g transform={`translate(${-W / 2 + 6} ${-H * 0.42}) rotate(${-armA})`}>
        <path d="M 0 0 Q -26 4 -42 -6" stroke={PING.ink} strokeWidth={15} strokeLinecap="round" fill="none" />
        <path d="M 0 0 Q -26 4 -42 -6" stroke={shade} strokeWidth={8} strokeLinecap="round" fill="none" />
        <circle cx={-44} cy={-7} r={10} fill={lit} stroke={PING.ink} strokeWidth={4} />
      </g>
      <g transform={`translate(${W / 2 - 6} ${-H * 0.42}) rotate(${armA * 0.6 - 10})`}>
        <path d="M 0 0 Q 26 4 42 -6" stroke={PING.ink} strokeWidth={15} strokeLinecap="round" fill="none" />
        <path d="M 0 0 Q 26 4 42 -6" stroke={shade} strokeWidth={8} strokeLinecap="round" fill="none" />
        <circle cx={44} cy={-7} r={10} fill={lit} stroke={PING.ink} strokeWidth={4} />
      </g>
      {/* card body, a soft squircle with a folded tab corner */}
      <path d={`M ${-W / 2 + 26} ${-H} H ${W / 2 - 34} L ${W / 2} ${-H + 34} V -26 Q ${W / 2} 0 ${W / 2 - 26} 0 H ${-W / 2 + 26} Q ${-W / 2} 0 ${-W / 2} -26 V ${-H + 26} Q ${-W / 2} ${-H} ${-W / 2 + 26} ${-H} Z`}
        fill={`url(#${id}-b)`} stroke={PING.ink} strokeWidth={7} strokeLinejoin="round" />
      <path d={`M ${W / 2 - 34} ${-H} V ${-H + 34} H ${W / 2}`} fill={shade} stroke={PING.ink} strokeWidth={5} strokeLinejoin="round" />
      <path d={`M ${-W / 2 + 14} ${-H + 30} Q ${-W / 2 + 14} ${-H + 12} ${-W / 2 + 34} ${-H + 12}`} stroke={mix(PING.coralRim, '#F0F2F0', grey)} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.85} />
      <path d={`M ${W / 2 - 8} -40 Q ${W / 2 - 8} -10 ${W / 2 - 30} -8`} stroke={shade} strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.6} />
      {/* rivet dots along the top, a little UI texture */}
      {[0, 1, 2].map((i) => <circle key={i} cx={-W / 2 + 30 + i * 16} cy={-H + 22} r={4} fill={PING.ink} opacity={0.55} />)}
      {/* face */}
      <g transform={`translate(${look * 5} ${-H * 0.66}) rotate(${bp.tilt})`}>
        {[-1, 1].map((sd) => (
          <g key={sd}>
            <ellipse cx={sd * 24} cy={0} rx={15} ry={17 * (1 - blink)} fill="#FFFDF8" stroke={PING.ink} strokeWidth={4} />
            <circle cx={sd * 24 + look * 6} cy={2} r={7.5 * (1 - blink)} fill={PING.ink} />
            <circle cx={sd * 24 + look * 6 - 2.5} cy={-1.5} r={2.4 * (1 - blink)} fill="#fff" />
            <path d={`M ${sd * 24 - 13} ${-25 + (sd < 0 ? brow[emotion] : -brow[emotion]) * 0.35} L ${sd * 24 + 13} ${-25 + (sd < 0 ? -brow[emotion] : brow[emotion]) * 0.35}`} stroke={PING.ink} strokeWidth={5} strokeLinecap="round" />
          </g>
        ))}
        <path d={mouth[emotion]} transform="translate(0 34)" stroke={PING.ink} strokeWidth={5} fill={emotion === 'proud' || emotion === 'alert' ? '#7A1F14' : 'none'} strokeLinecap="round" strokeLinejoin="round" />
        {(emotion === 'proud' || emotion === 'hopeful') && [-1, 1].map((sd) => <ellipse key={sd} cx={sd * 44} cy={24} rx={9} ry={5} fill="#FF8F80" opacity={0.7} />)}
        {emotion === 'sheepish' && <path d="M 44 -24 q 6 10 0 16 q -6 -6 0 -16 Z" fill="#BFE8FF" stroke={PING.ink} strokeWidth={2.5} />}
        {emotion === 'sleepy' && <text x={52} y={-28} fontFamily={MONO} fontWeight={800} fontSize={22} fill={PING.ink} opacity={0.6 + 0.4 * Math.sin(f / 10)}>z</text>}
      </g>
      {/* belly window with the slice thumbnail */}
      <rect x={-34} y={-62} width={68} height={50} rx={8} fill="#111A1C" stroke={PING.ink} strokeWidth={4} />
      <BrainSlice x={0} y={-37} r={22} clot={clot ? 1 : 0} seed={seed + 9} />
      {label && (
        <g transform={`translate(0 ${-H - 26})`}>
          <PTag x={0} y={0} text={label} size={20} />
        </g>
      )}
    </g>
  );
};

/** CTRing. The gantry seen dead on: a thick bone torus on a plinth, a bore with a lit rim, a table sliding in. Origin is the bore centre. */
export const CTRing: React.FC<{f: number; x: number; y: number; s?: number; table?: number; glow?: number; spin?: number; seed?: number; children?: React.ReactNode}> = ({f, x, y, s = 1, table = 0.6, glow = 1, spin = 1, seed = 2, children}) => {
  const id = uid('ct');
  const R = 300, r = 150;
  const b = paleTones(PING.bone);
  const rot = (f * 3 * spin) % 360;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <radialGradient id={`${id}-t`} cx="0.4" cy="0.35" r="0.75"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.55" stopColor={b.base} /><stop offset="1" stopColor={PING.boneD} /></radialGradient>
        <radialGradient id={`${id}-bore`} cx="0.5" cy="0.5" r="0.5"><stop offset="0.6" stopColor="#0E1A1C" /><stop offset="1" stopColor="#24393B" /></radialGradient>
        <mask id={`${id}-m`}><rect x={-R - 20} y={-R - 20} width={2 * R + 40} height={2 * R + 40} fill="#fff" /><circle r={r} fill="#000" /></mask>
      </defs>
      <ContactShadow cx={0} cy={R + 70} rx={R * 1.1} ry={22} opacity={0.4} />
      {/* plinth */}
      <path d={`M ${-R * 0.75} ${R * 0.7} L ${-R * 0.85} ${R + 64} H ${R * 0.85} L ${R * 0.75} ${R * 0.7} Z`} fill={PING.boneD} stroke={PING.ink} strokeWidth={7} strokeLinejoin="round" />
      <path d={`M ${-R * 0.7} ${R + 40} H ${R * 0.7}`} stroke="#B9B2A0" strokeWidth={6} />
      {/* torus */}
      <circle r={R} fill={`url(#${id}-t)`} mask={`url(#${id}-m)`} stroke={PING.ink} strokeWidth={8} />
      <circle r={R - 26} fill="none" stroke="#C9C3B0" strokeWidth={4} opacity={0.8} />
      <path d={`M ${-R * 0.72} ${-R * 0.62} A ${R * 0.95} ${R * 0.95} 0 0 1 ${R * 0.1} ${-R * 0.94}`} stroke="#fff" strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.7} />
      {/* bore */}
      <circle r={r} fill={`url(#${id}-bore)`} stroke={PING.ink} strokeWidth={8} />
      <g transform={`rotate(${rot})`} opacity={0.55 * glow}>
        {Array.from({length: 18}, (_, i) => <rect key={i} x={-4} y={-r + 6} width={8} height={16} rx={3} fill={PING.bone} transform={`rotate(${i * 20})`} opacity={i % 3 === 0 ? 1 : 0.35} />)}
      </g>
      <circle r={r - 2} fill="none" stroke={PING.bone} strokeWidth={6} opacity={0.35 + 0.25 * glow * (0.5 + 0.5 * Math.sin(f / 8 + seed))} />
      {children}
      {/* control panel and status lamps on the face */}
      <rect x={R * 0.42} y={-R * 0.2} width={70} height={110} rx={10} fill="#2A3B3D" stroke={PING.ink} strokeWidth={5} />
      {[0, 1, 2].map((i) => <circle key={i} cx={R * 0.42 + 35} cy={-R * 0.2 + 26 + i * 30} r={9} fill={i === 0 ? PING.bone : '#5D7472'} opacity={i === 0 ? 0.6 + 0.4 * Math.sin(f / 5) : 1} />)}
      <text x={0} y={-r - 70} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} letterSpacing={6} fill="#9FA59A">CT</text>
      {/* table tongue */}
      <g transform={`translate(0 ${r * 0.62})`}>
        <path d={`M ${-r * 0.9} 0 H ${r * 0.9} L ${r * 1.15 + 260 * (1 - table)} 46 H ${-r * 1.15 - 260 * (1 - table)} Z`} fill={PING.boneD} stroke={PING.ink} strokeWidth={6} strokeLinejoin="round" />
        <path d={`M ${-r * 0.8} 10 H ${r * 0.8}`} stroke="#fff" strokeWidth={5} opacity={0.6} />
      </g>
    </g>
  );
};

/** SliceStack. Thousands of slices as a ream: n visible sheets fanned in depth, the top one a real slice. `crawl` slides it along +x. */
export const SliceStack: React.FC<{f: number; x: number; y: number; s?: number; n?: number; crawl?: number; sweat?: number; seed?: number; clot?: number}> = ({f, x, y, s = 1, n = 14, crawl = 0, sweat = 0, seed = 5, clot = 1}) => {
  const jig = 1.5 * Math.sin(f / 3 + seed);
  return (
    <g transform={`translate(${x + crawl} ${y + jig}) scale(${s})`}>
      <ContactShadow cx={0} cy={8} rx={120} ry={14} opacity={0.4} />
      {Array.from({length: n}, (_, i) => {
        const k = n - 1 - i;
        return (
          <g key={i} transform={`translate(${k * 3 - n * 1.5} ${-k * 7})`}>
            <rect x={-100} y={-24} width={200} height={24} rx={4} fill={k % 2 ? '#2A3436' : '#1E2829'} stroke={PING.ink} strokeWidth={3} />
            <rect x={-92} y={-20} width={184} height={4} fill="#5F6B6B" opacity={0.6} />
          </g>
        );
      })}
      <g transform={`translate(${-n * 1.5} ${-n * 7 - 64})`}>
        <rect x={-74} y={-60} width={148} height={120} rx={6} fill="#111A1C" stroke={PING.ink} strokeWidth={4} />
        <BrainSlice x={0} y={0} r={50} clot={clot} seed={seed} />
      </g>
      {sweat > 0 && [0, 1].map((i) => (
        <path key={i} d="M 0 0 q 7 12 0 18 q -7 -6 0 -18 Z" transform={`translate(${110 + i * 18} ${-n * 7 - 20 - ((f * 2 + i * 30) % 50)})`} fill="#BFE8FF" stroke={PING.ink} strokeWidth={2.5} opacity={sweat} />
      ))}
    </g>
  );
};

/** ReportPrinter. Faceless beige printer. `page` 0..1 is how far the OFFICIAL REPORT page has crept out; `drop` lands it in the tray. */
export const ReportPrinter: React.FC<{f: number; x: number; y: number; s?: number; page?: number; drop?: number; seed?: number; text?: string}> = ({f, x, y, s = 1, page = 0, drop = 0, seed = 3, text = 'OFFICIAL REPORT'}) => {
  const id = uid('prn');
  const t = paleTones(PING.beige);
  const hum = Math.sin(f / 1.7 + seed) * (page > 0 && page < 1 ? 1.2 : 0.2);
  const pageH = 190 * clamp01(page);
  const lamp = ((f + seed * 9) % 36) < 18 ? 1 : 0.35;
  return (
    <g transform={`translate(${x} ${y + hum}) scale(${s})`}>
      <defs><linearGradient id={`${id}-g`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={t.key} /><stop offset="0.6" stopColor={t.base} /><stop offset="1" stopColor={t.shade} /></linearGradient></defs>
      <ContactShadow cx={0} cy={4} rx={190} ry={16} opacity={0.42} />
      {/* page creeping out of the top slot */}
      {drop < 1 && (
        <g transform={`translate(0 ${-150 + 40 * drop})`}>
          <rect x={-110} y={-pageH} width={220} height={pageH} fill={PING.paper} stroke={PING.ink} strokeWidth={4} />
          {pageH > 40 && <text x={0} y={-pageH + 30} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={PING.print}>{text}</text>}
          {Array.from({length: Math.floor(pageH / 22)}, (_, i) => i > 1 && <rect key={i} x={-90} y={-pageH + 16 + i * 22} width={150 + 30 * h01(i, seed)} height={6} fill="#9A9586" />)}
        </g>
      )}
      {/* body */}
      <path d="M -180 -150 H 180 L 196 -20 V 0 H -196 V -20 Z" fill={`url(#${id}-g)`} stroke={PING.ink} strokeWidth={7} strokeLinejoin="round" />
      <rect x={-130} y={-162} width={260} height={18} rx={6} fill="#2E3A3A" stroke={PING.ink} strokeWidth={5} />
      <rect x={-196} y={-62} width={392} height={12} fill={t.shade} opacity={0.7} />
      <rect x={110} y={-120} width={50} height={34} rx={5} fill="#2E3A3A" stroke={PING.ink} strokeWidth={4} />
      <circle cx={135} cy={-103} r={8} fill={PING.bone} opacity={lamp} />
      {[-150, -120, -90].map((vx) => <rect key={vx} x={vx} y={-120} width={18} height={6} rx={3} fill={t.core} />)}
      <path d="M -170 -140 H 60" stroke="#fff" strokeWidth={5} opacity={0.5} />
      {/* output tray */}
      <path d="M -150 -30 L -170 30 H 170 L 150 -30 Z" fill={t.shade} stroke={PING.ink} strokeWidth={6} strokeLinejoin="round" />
      {drop > 0 && (
        <g transform={`translate(0 ${10 - 4 * (1 - drop)})`} opacity={clamp01(drop * 3)}>
          <path d="M -120 -16 L -130 18 H 130 L 120 -16 Z" fill={PING.paper} stroke={PING.ink} strokeWidth={4} />
          <text x={0} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={PING.print}>{text}</text>
        </g>
      )}
    </g>
  );
};

/** Scoreboard. A wall board with labelled rows; each row lit (with a value) or dashed blank. Origin is the top centre. */
export const Scoreboard: React.FC<{
  f: number; x: number; y: number; s?: number; title?: string; rows: {label: string; value?: string; lit?: number}[]; w?: number; glowRow?: number; seed?: number; nail?: boolean;
}> = ({f, x, y, s = 1, title = 'STROKE SCOREBOARD', rows, w = 640, glowRow = -1, seed = 4, nail = true}) => {
  const rowH = 96;
  const h = 110 + rows.length * rowH;
  const t = paleTones('#E7E2D2');
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {nail && <g><line x1={0} y1={-46} x2={-w * 0.28} y2={0} stroke={PING.ink} strokeWidth={4} /><line x1={0} y1={-46} x2={w * 0.28} y2={0} stroke={PING.ink} strokeWidth={4} /><circle cx={0} cy={-48} r={9} fill={PING.steel} stroke={PING.ink} strokeWidth={4} /></g>}
      <rect x={-w / 2 + 10} y={12} width={w} height={h} rx={10} fill="#000" opacity={0.25} />
      <rect x={-w / 2} y={0} width={w} height={h} rx={10} fill="#3B4A48" stroke={PING.ink} strokeWidth={8} />
      <rect x={-w / 2 + 16} y={16} width={w - 32} height={h - 32} rx={6} fill={t.base} stroke={PING.ink} strokeWidth={4} />
      <text x={0} y={66} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={Math.min(34, (w - 70) / (title.length * 0.62))} letterSpacing={2} fill={PING.ink}>{title}</text>
      <line x1={-w / 2 + 34} y1={86} x2={w / 2 - 34} y2={86} stroke={PING.ink} strokeWidth={3} />
      {rows.map((r, i) => {
        const yy = 110 + i * rowH;
        const lit = clamp01(r.lit ?? 0);
        const pulse = glowRow === i ? 0.5 + 0.5 * Math.sin(f / 6 + seed) : 0;
        return (
          <g key={i}>
            <text x={-w / 2 + 40} y={yy + 40} fontFamily={MONO} fontWeight={800} fontSize={24} letterSpacing={1} fill={PING.ink}>{r.label}</text>
            <rect x={-w / 2 + 40} y={yy + 52} width={w - 80} height={30} rx={5} fill={lit > 0 ? '#F9F6EC' : 'none'} stroke={PING.ink} strokeWidth={3.5}
              strokeDasharray={lit > 0 ? undefined : '12 8'} opacity={lit > 0 ? 1 : 0.85 + 0.15 * pulse} />
            {lit > 0 && r.value && <text x={-w / 2 + 52} y={yy + 75} fontFamily={MONO} fontWeight={800} fontSize={20} fill={PING.ink} opacity={lit}>{r.value}</text>}
            {glowRow === i && <rect x={-w / 2 + 34} y={yy + 46} width={w - 68} height={42} rx={8} fill="none" stroke={PING.coral} strokeWidth={4} opacity={0.3 + 0.5 * pulse} />}
          </g>
        );
      })}
    </g>
  );
};

/** GurneyToken. A small faceless gurney marker for a patient on a route; origin at the wheels. Never a vehicle. */
export const GurneyToken: React.FC<{f: number; x: number; y: number; s?: number; seed?: number}> = ({f, x, y, s = 1, seed = 6}) => {
  const rock = 1.5 * Math.sin(f / 4 + seed);
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rock})`}>
      <ContactShadow cx={0} cy={4} rx={56} ry={8} opacity={0.45} />
      <rect x={-56} y={-44} width={112} height={18} rx={6} fill={PING.steel} stroke={PING.ink} strokeWidth={4} />
      <path d="M -50 -44 Q -40 -66 -14 -62 Q 30 -60 50 -50 L 50 -44 Z" fill={PING.bone} stroke={PING.ink} strokeWidth={4} strokeLinejoin="round" />
      <circle cx={-34} cy={-60} r={12} fill={PING.bone} stroke={PING.ink} strokeWidth={4} />
      {[-40, 40].map((wx) => <g key={wx}><line x1={wx} y1={-26} x2={wx} y2={-8} stroke={PING.ink} strokeWidth={5} /><circle cx={wx} cy={-4} r={7} fill={PING.inkL} stroke={PING.ink} strokeWidth={3} /></g>)}
    </g>
  );
};

/** WallPhone. A beige wall phone; `lift` 0..1 the receiver off the hook, `swing` makes a hung receiver's cord sway. */
export const WallPhone: React.FC<{f: number; x: number; y: number; s?: number; lift?: number; swing?: number; seed?: number}> = ({f, x, y, s = 1, lift = 0, swing = 0, seed = 8}) => {
  const t = paleTones(PING.beige);
  const sw = swing * 14 * Math.sin(f / 5 + seed) * Math.exp(-((f % 90) / 60));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-46} y={-80} width={92} height={160} rx={14} fill={t.base} stroke={PING.ink} strokeWidth={6} />
      {Array.from({length: 9}, (_, i) => <circle key={i} cx={-18 + (i % 3) * 18} cy={0 + Math.floor(i / 3) * 20} r={6} fill={t.shade} stroke={PING.ink} strokeWidth={2} />)}
      <g transform={`translate(0 ${-60 - 70 * lift}) rotate(${sw + lift * -20})`}>
        <path d="M -54 -10 Q -60 -30 -40 -30 H 40 Q 60 -30 54 -10 L 44 0 H -44 Z" fill={t.key} stroke={PING.ink} strokeWidth={6} strokeLinejoin="round" />
      </g>
      <path d={`M -40 70 C -80 110 -20 140 -60 ${170 + 10 * Math.sin(f / 7)}`} stroke={PING.ink} strokeWidth={4} fill="none" strokeDasharray="8 4" />
    </g>
  );
};

/** GownHooks. A rail of hooks with gowns hanging, `ready` 0..1 how many are up; the Anchorage room gets ready early. */
export const GownHooks: React.FC<{f: number; x: number; y: number; s?: number; n?: number; ready?: number; seed?: number}> = ({f, x, y, s = 1, n = 4, ready = 1, seed = 2}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-n * 60} y={-12} width={n * 120} height={20} rx={6} fill={PING.steel} stroke={PING.ink} strokeWidth={5} />
    {Array.from({length: n}, (_, i) => {
      const hx = -n * 60 + 60 + i * 120;
      const on = clamp01(ready * n - i);
      const sw = 3 * Math.sin(f / 19 + i * 1.3 + seed);
      return (
        <g key={i}>
          <path d={`M ${hx} 8 v 18 q 0 12 -12 12`} stroke={PING.ink} strokeWidth={5} fill="none" />
          {on > 0 && (
            <g transform={`translate(${hx} ${26 - 40 * (1 - on)}) rotate(${sw})`} opacity={on}>
              <path d="M -16 0 L -50 30 L -40 170 H 40 L 50 30 L 16 0 Q 0 14 -16 0 Z" fill="#8FC1B4" stroke={PING.ink} strokeWidth={5} strokeLinejoin="round" />
              <path d="M -30 40 L -26 160" stroke="#6FA092" strokeWidth={6} />
              <path d="M -16 0 Q 0 14 16 0" stroke="#fff" strokeWidth={4} fill="none" opacity={0.6} />
            </g>
          )}
        </g>
      );
    })}
  </g>
);

/**
 * WardWorld. The interior room: a tiled wall with a window onto the winter dark (far sodium lights and a ridge),
 * a floor with a near counter edge. `warm` 0..1 turns it into the rose-white Anchorage room under a lamp.
 * `windowX` places the window; `near` picks the lower-third foreground ('counter' | 'cart' | 'desk' | 'none').
 */
export const WardWorld: React.FC<{f: number; warm?: number; seed?: number; windowX?: number; windowW?: number; floorY?: number; near?: 'counter' | 'cart' | 'desk' | 'none'; dawn?: number}> = ({f, warm = 0, seed = 1, windowX = 540, windowW = 520, floorY = 1180, near = 'counter', dawn = 0}) => {
  const id = uid('ward');
  const wall = warm > 0.5 ? PING.rose : PING.tile;
  const wallL = warm > 0.5 ? '#FBEFE9' : PING.tileL;
  const grout = warm > 0.5 ? PING.roseD : PING.grout;
  const wy = 330, wh = 420;
  const lights = Array.from({length: 7}, (_, i) => ({x: windowX - windowW / 2 + 40 + h01(i, seed) * (windowW - 80), y: wy + wh * (0.62 + 0.25 * h01(i + 3, seed)), r: 3 + 4 * h01(i + 7, seed)}));
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-w`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={wallL} /><stop offset="1" stopColor={wall} /></linearGradient>
        <linearGradient id={`${id}-n`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={dawn > 0 ? '#3E5A78' : PING.nightD} /><stop offset="1" stopColor={dawn > 0 ? '#7D93A8' : PING.night} /></linearGradient>
        <linearGradient id={`${id}-f`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={warm > 0.5 ? '#E8CFC4' : PING.floor} /><stop offset="1" stopColor={warm > 0.5 ? '#C9A99C' : PING.floorD} /></linearGradient>
        <radialGradient id={`${id}-lamp`} cx="0.5" cy="0.15" r="0.7"><stop offset="0" stopColor={PING.lamp} stopOpacity={0.75 * warm} /><stop offset="1" stopColor={PING.lamp} stopOpacity={0} /></radialGradient>
      </defs>
      <rect x={-40} y={-40} width={1160} height={floorY + 40} fill={`url(#${id}-w)`} />
      {Array.from({length: 22}, (_, i) => <line key={`h${i}`} x1={-40} x2={1120} y1={i * 60} y2={i * 60} stroke={grout} strokeWidth={2} opacity={0.6} />)}
      {Array.from({length: 20}, (_, i) => <line key={`v${i}`} y1={0} y2={floorY} x1={i * 60 + ((seed * 13) % 60)} x2={i * 60 + ((seed * 13) % 60)} stroke={grout} strokeWidth={2} opacity={0.45} />)}
      {/* window onto the winter dark */}
      <rect x={windowX - windowW / 2 - 18} y={wy - 18} width={windowW + 36} height={wh + 36} rx={8} fill={PING.steelD} stroke={PING.ink} strokeWidth={7} />
      <rect x={windowX - windowW / 2} y={wy} width={windowW} height={wh} fill={`url(#${id}-n)`} />
      <path d={`M ${windowX - windowW / 2} ${wy + wh * 0.62} L ${windowX - windowW / 4} ${wy + wh * 0.5} L ${windowX - 40} ${wy + wh * 0.58} L ${windowX + windowW / 5} ${wy + wh * 0.44} L ${windowX + windowW / 2} ${wy + wh * 0.56} V ${wy + wh} H ${windowX - windowW / 2} Z`} fill="#22344A" />
      {Array.from({length: 9}, (_, i) => {
        const tx = windowX - windowW / 2 + 30 + i * (windowW - 60) / 8;
        return <path key={i} d={`M ${tx} ${wy + wh * 0.7} l -14 40 h 28 Z`} fill="#152234" />;
      })}
      {lights.map((l, i) => <circle key={i} cx={l.x} cy={l.y} r={l.r * (0.85 + 0.15 * Math.sin(f / 9 + i))} fill={PING.sodium} opacity={0.9} />)}
      {Array.from({length: 14}, (_, i) => {
        const sx = windowX - windowW / 2 + ((h01(i, seed) * windowW + f * (0.6 + h01(i, 2))) % windowW);
        const sy = wy + ((h01(i, 5) * wh + f * (1.4 + h01(i, 4))) % wh);
        return <circle key={`s${i}`} cx={sx} cy={sy} r={2.2} fill="#E8F0F4" opacity={0.7} />;
      })}
      <line x1={windowX} y1={wy} x2={windowX} y2={wy + wh} stroke={PING.steelD} strokeWidth={10} />
      <line x1={windowX - windowW / 2} y1={wy + wh / 2} x2={windowX + windowW / 2} y2={wy + wh / 2} stroke={PING.steelD} strokeWidth={8} />
      <path d={`M ${windowX - windowW / 2 + 20} ${wy + 20} L ${windowX - windowW / 2 + 90} ${wy + 20} L ${windowX - windowW / 2 + 20} ${wy + 110} Z`} fill="#fff" opacity={0.08} />
      {/* chair rail and floor */}
      <rect x={-40} y={floorY - 90} width={1160} height={16} fill={warm > 0.5 ? '#D9B3A6' : '#A9C7BB'} stroke={PING.ink} strokeWidth={4} />
      <rect x={-40} y={floorY} width={1160} height={1960 - floorY} fill={`url(#${id}-f)`} />
      <line x1={-40} y1={floorY} x2={1120} y2={floorY} stroke={PING.ink} strokeWidth={6} />
      {Array.from({length: 9}, (_, i) => <line key={`f${i}`} x1={540 + (i - 4) * 160} y1={floorY} x2={540 + (i - 4) * 420} y2={1920} stroke={warm > 0.5 ? '#C29C8F' : '#86A196'} strokeWidth={3} opacity={0.7} />)}
      {[0.35, 0.62].map((k, i) => <line key={`fl${i}`} x1={-40} x2={1120} y1={floorY + (1920 - floorY) * k} y2={floorY + (1920 - floorY) * k} stroke={warm > 0.5 ? '#C29C8F' : '#86A196'} strokeWidth={3} opacity={0.6} />)}
      {warm > 0 && <rect x={-40} y={-40} width={1160} height={1960} fill={`url(#${id}-lamp)`} />}
      {/* near plane */}
      {near === 'counter' && (
        <g>
          <rect x={-40} y={1560} width={1160} height={60} fill={warm > 0.5 ? '#B98A7C' : '#7FA196'} stroke={PING.ink} strokeWidth={6} />
          <rect x={-40} y={1616} width={1160} height={320} fill={warm > 0.5 ? '#8E6458' : '#4E6E66'} stroke={PING.ink} strokeWidth={6} />
          <path d="M -40 1570 H 1120" stroke="#fff" strokeWidth={5} opacity={0.35} />
          {[160, 420, 760].map((dx, i) => <rect key={i} x={dx} y={1660} width={150} height={90} rx={8} fill="none" stroke={PING.ink} strokeWidth={4} opacity={0.6} />)}
        </g>
      )}
      {near === 'cart' && (
        <g transform="translate(860 1720)">
          <ContactShadow cx={0} cy={190} rx={170} ry={16} opacity={0.4} />
          <rect x={-150} y={-40} width={300} height={30} rx={6} fill={PING.steel} stroke={PING.ink} strokeWidth={5} />
          <rect x={-130} y={-10} width={260} height={160} fill={PING.steelD} stroke={PING.ink} strokeWidth={5} />
          {[0, 1, 2].map((i) => <rect key={i} x={-116} y={4 + i * 48} width={232} height={38} rx={4} fill="#9EB0AF" stroke={PING.ink} strokeWidth={3} />)}
          <rect x={-80} y={-86} width={80} height={46} rx={6} fill="#E8F1EE" stroke={PING.ink} strokeWidth={4} />
          <circle cx={60} cy={-62} r={22} fill="#FFFFFF" stroke={PING.ink} strokeWidth={4} />
        </g>
      )}
      {near === 'desk' && (
        <g>
          <rect x={-40} y={1600} width={1160} height={360} fill="#6E5A48" stroke={PING.ink} strokeWidth={6} />
          <path d="M -40 1612 H 1120" stroke="#9B8268" strokeWidth={8} />
          <g transform="translate(150 1700)"><ellipse cx={0} cy={40} rx={46} ry={10} fill="#000" opacity={0.3} /><rect x={-34} y={-40} width={68} height={80} rx={8} fill="#E9E2D0" stroke={PING.ink} strokeWidth={5} /><path d="M 34 -20 q 26 0 26 22 q 0 22 -26 22" stroke={PING.ink} strokeWidth={6} fill="none" />
            {[0, 1].map((i) => <path key={i} d={`M ${-10 + i * 18} -50 q 8 -14 0 -28`} stroke="#fff" strokeWidth={4} fill="none" opacity={0.5 + 0.3 * Math.sin(f / 8 + i)} />)}</g>
          <g transform="translate(900 1720) rotate(-20)"><rect x={-90} y={-8} width={180} height={16} rx={8} fill="#2E4A5A" stroke={PING.ink} strokeWidth={4} /><path d="M 90 -8 L 112 0 L 90 8 Z" fill={PING.bone} stroke={PING.ink} strokeWidth={3} /></g>
        </g>
      )}
    </g>
  );
};

/** AKBoard. The stylised Alaska outline (AK_PATH) on a graphite board, with labelled points. Pass the path in. Origin top-left of the 1000x700 box. */
export const AK_POINTS: Record<string, [number, number]> = {
  UTQIAGVIK: [470, 40], ANCHORAGE: [494, 424], JUNEAU: [868, 566], INTERIOR: [600, 300],
};
