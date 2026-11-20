import React from 'react';
import {INK} from './Character';
import {tones, ContactShadow} from './lighting';
import {figureIdle} from './figureidle';

// THE LOT FAMILY (net-new 2026-11-20, "Lot 2"). An auction kit for data, privacy and bankruptcy stories:
// Bub (a faced cream speech bubble that walks on its tail, two dot eyes and a typing ellipsis on its belly
// that never finishes, contents never shown), a frosted GlassCase on a velvet plinth (keyhole, frosted
// labels, a VOLUNTARY slide bolt, dashed or solid latches), a square auction Paddle sized to its string with
// an optional sash, a LicenseCrate of turning gears in a sleeve, a LockCutaway with labelled tumblers, and
// the Juneau AuctionHall set (timber, claret velvet, a tall rain window onto Mount Juneau and the Gastineau
// Channel). Key light is a warm spotlight high on screen LEFT, cool fill from the window on the RIGHT.

export const LOT = {
  cream: '#EEF3F1', creamD: '#C9D4D2', cheek: '#F2C9A0', velvet: '#24152A',
  glass: '#DCE8EE', glassD: '#A9BFCB', frost: '#F4F8FA',
  timber: '#9A5A3A', timberL: '#B8744E', walnut: '#5E3426', walnutD: '#361C14',
  claret: '#7A1F35', claretL: '#A2364F', claretD: '#4E1222',
  bronze: '#8E959B', bronzeL: '#BFC5CA', bronzeD: '#5C6268',
  dusk: '#5B6C8F', slate: '#8FA0B8', channel: '#3D5566', rain: '#C9D3E0',
  aubergine: '#2B1B2E', aubergineD: '#1A1020',
  marigold: '#F2B632', marigoldD: '#B8821A',
  birch: '#E3CFA6', birchD: '#BFA478', sleeve: '#4B5563', card: '#F7EBD3', paper: '#FFF8EA',
  spot: '#FFF3DE',
};
const MONO_ = "'JetBrains Mono', monospace";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const uid = (s: string) => 'lt' + Math.abs([...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)).toString(36);
const h01 = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const lotMonoW = (s: string, size: number, ls = 1) => s.length * size * 0.602 + ls * Math.max(0, s.length - 1);

export type BubEmotion = 'calm' | 'shocked' | 'anxious' | 'delighted' | 'worried' | 'shy' | 'startled' | 'lonely' | 'hopeful' | 'wondering';

/**
 * Bub, a faced cream speech bubble. Origin (x, y) is the ground under its tail tip. About 230 wide and 250 tall
 * at scale 1. ellipsis 0..1 is typing speed (0 still, 1 frantic); ask 0..1 turns the ellipsis into a question
 * mark; hide 0..1 curls the tail up over its belly; hop 0..1 is a hop arc; pinch 0..1 squeezes the dots apart.
 */
export const Bub: React.FC<{
  f: number; x: number; y: number; scale?: number; emotion?: BubEmotion; ellipsis?: number; ask?: number; hide?: number;
  hop?: number; pinch?: number; look?: number; cues?: number[]; seed?: number; idleGain?: number; shadow?: boolean; asleep?: number;
}> = ({f, x, y, scale = 1, emotion = 'calm', ellipsis = 0.4, ask = 0, hide = 0, hop = 0, pinch = 0, look = 0, cues, seed = 3, idleGain = 1, shadow = true, asleep = 0}) => {
  const pose = cues && cues.length && idleGain > 0 ? figureIdle(f, seed, idleGain, cues) : null;
  const lean = (pose ? pose.lean * 1.1 + pose.shift * 0.05 : 0) + Math.sin(f / 27 + seed) * 1.6;
  const breath = 1 + 0.025 * Math.sin(f / 12 + seed) + (pose ? (pose.breath - 1) * 0.7 : 0);
  const hy = -Math.sin(clamp01(hop) * Math.PI) * 120;
  const squash = hop > 0.9 || hop < 0.1 ? 1 : 1 + 0.06 * Math.sin(clamp01(hop) * Math.PI * 2);
  const id = uid(`bub${x}${y}${seed}`);
  const T = tones(LOT.cream);
  const sl = clamp01(asleep);
  const blink = sl > 0.5 || ((f + seed * 23) % 97) < 4;
  const eyeX = look * 7 + (pose ? pose.headX * 0.4 : 0);
  const brow = {calm: 0, shocked: -9, anxious: 6, delighted: -6, worried: 7, shy: 3, startled: -10, lonely: 5, hopeful: -4, wondering: -2}[emotion];
  const eyeR = emotion === 'shocked' || emotion === 'startled' ? 19 : 15;
  const mouth = {
    calm: 'M -14 44 Q 0 50 14 44', shocked: 'M -10 44 Q 0 64 10 44 Q 0 38 -10 44', anxious: 'M -14 50 Q -4 44 4 50 Q 10 54 14 48',
    delighted: 'M -18 42 Q 0 62 18 42', worried: 'M -14 52 Q 0 43 14 52', shy: 'M -9 47 Q 2 51 10 46', startled: 'M -8 46 Q 0 60 8 46 Q 0 41 -8 46',
    lonely: 'M -12 51 Q 0 46 12 51', hopeful: 'M -15 43 Q 0 55 15 43', wondering: 'M -8 48 Q 4 52 12 45',
  }[emotion];
  const W = 116, Hh = 96;
  // the speed of the typing cycle
  const speed = (0.08 + clamp01(ellipsis) * 0.42);
  const ph = f * speed;
  const ak = clamp01(ask);
  const pz = clamp01(pinch);
  const tailCurl = 0;
  const freeze = clamp01(hide);
  return (
    <g transform={`translate(${x},${y + hy}) rotate(${lean}) scale(${scale})`}>
      {shadow && <ContactShadow cx={-30} cy={4} rx={110 * (1 - clamp01(hop) * 0.4)} ry={12} opacity={0.38} />}
      <g transform={`scale(${breath / squash},${(2 - breath) * squash})`}>
        <defs>
          <radialGradient id={id} cx="0.32" cy="0.28" r="0.85">
            <stop offset="0" stopColor="#FFFDF7" /><stop offset="0.45" stopColor={LOT.cream} /><stop offset="1" stopColor={LOT.creamD} />
          </radialGradient>
        </defs>
        {/* the tail, which is also its foot: from the body's lower left down to the ground tip, curling up when it hides */}
        <path d={`M -54 ${-60} Q ${-60 - tailCurl * 10} ${-24 + tailCurl * -30} ${-30 + tailCurl * 40} ${0 - tailCurl * 92} Q ${-20 + tailCurl * 50} ${-30 - tailCurl * 60} ${-14} ${-62}`}
          fill={LOT.creamD} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d={`M -48 -60 Q -50 -30 ${-32 + tailCurl * 40} ${-8 - tailCurl * 84}`} stroke="#FFFDF4" strokeWidth={4} fill="none" opacity={0.6} />
        {/* body */}
        <g transform={`translate(0,${-62 - Hh})`}>
          <ellipse cx={0} cy={0} rx={W} ry={Hh} fill={`url(#${id})`} stroke={INK} strokeWidth={6.5} />
          {/* core shade crescent on the far (right) side and a rim on the key side */}
          <path d={`M ${W * 0.55} ${-Hh * 0.78} A ${W} ${Hh} 0 0 1 ${W * 0.4} ${Hh * 0.9} A ${W * 0.86} ${Hh * 0.86} 0 0 0 ${W * 0.55} ${-Hh * 0.78} Z`} fill={T.shade} opacity={0.42} />
          <path d={`M ${-W * 0.86} ${-Hh * 0.35} A ${W * 0.95} ${Hh * 0.95} 0 0 1 ${-W * 0.3} ${-Hh * 0.9}`} stroke="#FFFFFF" strokeWidth={6} fill="none" opacity={0.75} strokeLinecap="round" />
          <ellipse cx={-W * 0.5} cy={-Hh * 0.5} rx={18} ry={10} fill="#FFFFFF" opacity={0.7} transform={`rotate(-30 ${-W * 0.5} ${-Hh * 0.5})`} />
          {/* paper fibre flecks */}
          {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M ${-70 + i * 28} ${50 - (i % 2) * 10} l 9 -3`} stroke={LOT.creamD} strokeWidth={2} opacity={0.8} />)}
          {/* face: dot eyes, brows, small mouth, cheeks */}
          <g transform={`translate(${eyeX},-26)`}>
            {blink ? (
              <>
                <path d="M -42 0 Q -32 6 -22 0" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
                <path d="M 22 0 Q 32 6 42 0" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx={-32} cy={0} rx={eyeR * 0.82} ry={eyeR} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
                <ellipse cx={32} cy={0} rx={eyeR * 0.82} ry={eyeR} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
                <circle cx={-30 + look * 5} cy={3} r={7.5} fill={INK} />
                <circle cx={34 + look * 5} cy={3} r={7.5} fill={INK} />
                <circle cx={-27 + look * 5} cy={0} r={2.6} fill="#fff" />
                <circle cx={37 + look * 5} cy={0} r={2.6} fill="#fff" />
              </>
            )}
            <path d={`M -48 ${-26 + brow * 0.5} Q -32 ${-33 - brow * 0.3} -16 ${-26 - brow}`} stroke={INK} strokeWidth={5.5} fill="none" strokeLinecap="round" />
            <path d={`M 16 ${-26 - brow} Q 32 ${-33 - brow * 0.3} 48 ${-26 + brow * 0.5}`} stroke={INK} strokeWidth={5.5} fill="none" strokeLinecap="round" />

          </g>
          {/* the typing ellipsis on its belly, never finishing, or a question mark */}
          <g transform="translate(0,48)" opacity={1}>
            {[0, 1, 2].map((i) => {
              const bob = Math.sin(ph * (1 - freeze) - i * 0.9) * (4 + clamp01(ellipsis) * 6) * (1 - freeze);
              const dx = (i - 1) * (24 + pz * 26);
              return <circle key={i} cx={dx} cy={-bob * (1 - ak)} r={8} fill={LOT.walnut} stroke={INK} strokeWidth={3} opacity={1 - ak} />;
            })}
            {ak > 0.01 && (
              <g opacity={ak} transform={`scale(${0.6 + ak * 0.4})`}>
                <path d="M -12 -14 Q -12 -30 2 -30 Q 16 -30 16 -18 Q 16 -8 4 -2 L 2 6" stroke={INK} strokeWidth={10} fill="none" strokeLinecap="round" />
                <path d="M -12 -14 Q -12 -30 2 -30 Q 16 -30 16 -18 Q 16 -8 4 -2 L 2 6" stroke={LOT.walnut} strokeWidth={6} fill="none" strokeLinecap="round" />
                <circle cx={2} cy={18} r={5} fill={LOT.walnut} stroke={INK} strokeWidth={2.5} />
              </g>
            )}
          </g>
          {sl > 0.4 && (
            <g opacity={sl} transform={`translate(${W * 0.7},${-Hh * 1.1})`}>
              {[0, 1, 2].map((i) => (
                <text key={i} x={i * 16} y={-((f / 2 + i * 12) % 36)} fontFamily={MONO_} fontWeight={800} fontSize={18 + i * 4} fill={INK} opacity={0.6}>z</text>
              ))}
            </g>
          )}
        </g>
      </g>
    </g>
  );
};

/**
 * GlassCase, a frosted glass dome on a claret velvet plinth. Origin (x, y) is the floor under the plinth.
 * At scale 1 the plinth is 360 wide and the dome stands 420 tall (top at y - 560). Children draw INSIDE the
 * dome (Bub), behind the glass. frost 0..1 frosts it, labels slide up through the frost by labelsT 0..1,
 * bolt 0..1 slides the VOLUNTARY bolt back, latches 0..1 draws dashed (or solid if latched) latches, key
 * 0..1 shows a key in the keyhole.
 */
export const GlassCase: React.FC<{
  f: number; x: number; y: number; scale?: number; frost?: number; labels?: string[]; labelsT?: number; bolt?: number; boltLabel?: boolean;
  latches?: number; latched?: boolean; keyIn?: number; glint?: number; children?: React.ReactNode; spot?: number;
}> = ({f, x, y, scale = 1, frost = 0.35, labels = [], labelsT = 0, bolt = 0, boltLabel = false, latches = 0, latched = false, keyIn = 0, glint = 0, children, spot = 1}) => {
  const id = uid(`case${x}${y}`);
  const PW = 180, PH = 140, DW = 160, DH = 400;
  const fr = clamp01(frost);
  const sweep = ((f / 90) % 1);
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <defs>
        <linearGradient id={`${id}v`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={LOT.claretL} /><stop offset="0.45" stopColor={LOT.claret} /><stop offset="1" stopColor={LOT.claretD} />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55} /><stop offset="0.35" stopColor={LOT.glass} stopOpacity={0.25 + fr * 0.35} />
          <stop offset="1" stopColor={LOT.glassD} stopOpacity={0.4 + fr * 0.3} />
        </linearGradient>
        <clipPath id={`${id}c`}><path d={`M ${-DW} ${-PH} L ${-DW} ${-PH - DH + DW} A ${DW} ${DW} 0 0 1 ${DW} ${-PH - DH + DW} L ${DW} ${-PH} Z`} /></clipPath>
      </defs>
      <ContactShadow cx={0} cy={4} rx={PW * 1.25} ry={18} opacity={0.5} />
      {/* plinth: velvet drape over a walnut base with bronze trim */}
      <rect x={-PW} y={-36} width={PW * 2} height={36} rx={6} fill={LOT.walnut} stroke={INK} strokeWidth={5} />
      <rect x={-PW + 8} y={-30} width={PW * 2 - 16} height={8} fill={LOT.bronze} opacity={0.8} />
      <path d={`M ${-PW + 10} ${-PH} L ${PW - 10} ${-PH} L ${PW + 4} -36 L ${-PW - 4} -36 Z`} fill={`url(#${id}v)`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {[-0.6, -0.2, 0.2, 0.6].map((k, i) => <path key={i} d={`M ${k * PW} ${-PH + 4} Q ${k * PW + 8} -90 ${k * PW * 1.04} -40`} stroke={LOT.claretD} strokeWidth={4} fill="none" opacity={0.7} />)}
      <path d={`M ${-PW + 18} ${-PH + 6} L ${-PW + 4} -42`} stroke="#FFFFFF" strokeWidth={4} opacity={0.3} />
      {/* the dome and what's inside it */}
      <g clipPath={`url(#${id}c)`}>
        <rect x={-DW} y={-PH - DH} width={DW * 2} height={DH} fill={LOT.velvet} opacity={0.92} />
        {[-0.6, -0.2, 0.2, 0.6].map((k, i) => <rect key={i} x={k * DW - 6} y={-PH - DH} width={12} height={DH} fill={LOT.claretD} opacity={0.5} />)}
        {children}
        {/* frost veil */}
        <rect x={-DW} y={-PH - DH} width={DW * 2} height={DH} fill={LOT.frost} opacity={Math.min(0.35, fr * 0.38)} />
        {Array.from({length: 18}, (_, i) => (
          <circle key={i} cx={-DW + h01(i, 3) * DW * 2} cy={-PH - h01(i, 5) * DH} r={6 + h01(i, 7) * 18} fill="#FFFFFF" opacity={fr * 0.18} />
        ))}
        {/* frosted labels surfacing through the glass */}
        {labels.map((l, i) => {
          const k = clamp01(labelsT * labels.length - i);
          const ww = lotMonoW(l, 26) + 34;
          const ly = -PH - 90 - i * 70 + (1 - k) * 40;
          return (
            <g key={l} opacity={k} transform={`translate(0,${ly})`}>
              <rect x={-ww / 2} y={-22} width={ww} height={42} rx={21} fill="#FFFFFF" opacity={0.7} stroke={LOT.glassD} strokeWidth={3} />
              <text x={0} y={9} textAnchor="middle" fontFamily={MONO_} fontWeight={800} fontSize={26} fill={LOT.channel}>{l}</text>
            </g>
          );
        })}
        {/* travelling glint */}
        <rect x={-DW + sweep * DW * 3 - DW} y={-PH - DH} width={40} height={DH} fill="#FFFFFF" opacity={0.18 * spot} transform={`skewX(-18)`} />
      </g>
      <path d={`M ${-DW} ${-PH} L ${-DW} ${-PH - DH + DW} A ${DW} ${DW} 0 0 1 ${DW} ${-PH - DH + DW} L ${DW} ${-PH} Z`} fill={`url(#${id}g)`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M ${-DW + 22} ${-PH - 20} L ${-DW + 22} ${-PH - DH + DW} A ${DW - 22} ${DW - 22} 0 0 1 ${-30} ${-PH - DH + 26}`} stroke="#FFFFFF" strokeWidth={8} fill="none" opacity={0.55} strokeLinecap="round" />
      <path d={`M ${DW - 16} ${-PH - 30} L ${DW - 16} ${-PH - DH + DW + 10}`} stroke={LOT.glassD} strokeWidth={6} opacity={0.6} />
      {/* bronze base ring of the dome */}
      <rect x={-DW - 10} y={-PH - 16} width={DW * 2 + 20} height={22} rx={6} fill={LOT.bronze} stroke={INK} strokeWidth={4} />
      <rect x={-DW - 4} y={-PH - 13} width={DW * 2 + 8} height={5} fill={LOT.bronzeL} opacity={0.8} />
      {/* keyhole plate on the base ring front */}
      <g transform={`translate(0,${-PH - 5})`}>
        <ellipse cx={0} cy={0} rx={22} ry={22} fill={LOT.bronzeD} stroke={INK} strokeWidth={4} transform="translate(0,-2)" />
        <circle cx={0} cy={-6} r={6} fill={INK} />
        <path d="M -4 -4 L -6 10 L 6 10 L 4 -4 Z" fill={INK} />
        {glint > 0.01 && <path d="M -18 -18 l 8 8 M 14 -20 l -6 6" stroke="#FFFFFF" strokeWidth={3} opacity={glint * (0.6 + 0.4 * Math.sin(f / 4))} />}
        {keyIn > 0.01 && (
          <g opacity={keyIn} transform="translate(0,-6)">
            <rect x={-3} y={-2} width={6} height={22} fill={LOT.bronze} stroke={INK} strokeWidth={2} />
            <circle cx={0} cy={30} r={12} fill="none" stroke={LOT.bronze} strokeWidth={6} />
          </g>
        )}
      </g>
      {/* the VOLUNTARY slide bolt on the right of the base ring */}
      <g transform={`translate(${DW - 30 + clamp01(bolt) * 46},${-PH - 6})`}>
        <rect x={-34} y={-12} width={68} height={22} rx={4} fill={LOT.bronze} stroke={INK} strokeWidth={4} />
        <rect x={-14} y={-24} width={14} height={14} rx={3} fill={LOT.bronzeD} stroke={INK} strokeWidth={3} />
        {boltLabel && <text x={0} y={5} textAnchor="middle" fontFamily={MONO_} fontWeight={800} fontSize={11} fill={INK}>VOLUNTARY</text>}
      </g>
      {/* safeguard latches, dashed (recommended) or solid (fastened) */}
      {latches > 0.01 && [-1, 1].map((s) => (
        <g key={s} opacity={clamp01(latches)} transform={`translate(${s * (DW - 6)},${-PH - DH * 0.45})`}>
          <path d={`M 0 -70 Q ${s * 46} -70 ${s * 46} 0 Q ${s * 46} 70 0 70`} fill="none" stroke={LOT.marigold} strokeWidth={12}
            strokeDasharray={latched ? undefined : '16 12'} strokeLinecap="round" opacity={0.8 + 0.2 * Math.sin(f / 9)} />
          <rect x={s * 46 - 14} y={-14} width={28} height={28} rx={6} fill="none" stroke={LOT.marigold} strokeWidth={6} strokeDasharray={latched ? undefined : '8 6'} />
        </g>
      ))}
    </g>
  );
};

/** a square auction Paddle on a handle. Origin (x, y) is the grip. label sized to its string; sash draws a diagonal ribbon. */
export const Paddle: React.FC<{f: number; x: number; y: number; scale?: number; rot?: number; label?: string; sub?: string; sash?: string; sashFix?: number; color?: string}> =
({f, x, y, scale = 1, rot = 0, label = '2', sub, sash, sashFix = 0, color = LOT.card}) => {
  const T = tones(color);
  const lw = Math.max(170, lotMonoW(label, 52) + 50, sub ? lotMonoW(sub, 22) + 40 : 0);
  const ph = sub ? 170 : 140;
  const wob = Math.sin(f / 15) * 1.2;
  const sashSlip = 6 * Math.sin(f / 30) * (1 - clamp01(sashFix));
  return (
    <g transform={`translate(${x},${y}) rotate(${rot + wob}) scale(${scale})`}>
      <rect x={-12} y={-30} width={24} height={150} rx={10} fill={LOT.walnut} stroke={INK} strokeWidth={5} />
      <rect x={-8} y={-24} width={6} height={136} fill={LOT.timberL} opacity={0.6} />
      <rect x={-16} y={-36} width={32} height={18} rx={4} fill={LOT.bronze} stroke={INK} strokeWidth={4} />
      <g transform={`translate(0,${-36 - ph / 2})`}>
        <rect x={-lw / 2 + 6} y={-ph / 2 + 8} width={lw} height={ph} rx={14} fill="#000" opacity={0.25} />
        <rect x={-lw / 2} y={-ph / 2} width={lw} height={ph} rx={14} fill={color} stroke={INK} strokeWidth={6} />
        <rect x={lw / 2 - 26} y={-ph / 2 + 10} width={14} height={ph - 20} rx={6} fill={T.shade} opacity={0.4} />
        <path d={`M ${-lw / 2 + 14} ${-ph / 2 + 16} L ${lw / 2 - 40} ${-ph / 2 + 16}`} stroke="#FFFFFF" strokeWidth={5} opacity={0.6} strokeLinecap="round" />
        <text x={0} y={sub ? -4 : 18} textAnchor="middle" fontFamily={MONO_} fontWeight={800} fontSize={52} fill={INK}>{label}</text>
        {sub && <text x={0} y={46} textAnchor="middle" fontFamily={MONO_} fontWeight={800} fontSize={22} fill={INK}>{sub}</text>}
        {sash && (
          <g transform={`rotate(${-24 + sashSlip})`}>
            <rect x={-lw * 0.75} y={ph * 0.22} width={lw * 1.5} height={30} fill={LOT.claret} stroke={INK} strokeWidth={4} />
            <text x={0} y={ph * 0.22 + 21} textAnchor="middle" fontFamily={MONO_} fontWeight={800} fontSize={17} fill={LOT.paper}>{sash}</text>
          </g>
        )}
      </g>
    </g>
  );
};

/** a birch crate of gears in a slate sleeve, origin = floor centre. spin turns the gears behind the slats. */
export const LicenseCrate: React.FC<{f: number; x: number; y: number; scale?: number; spin?: number; sleeve?: string; copies?: number}> =
({f, x, y, scale = 1, spin = 1, sleeve = 'LICENSE', copies = 0}) => {
  const a = f * 2.2 * spin;
  const gear = (cx: number, cy: number, r: number, dir: number, key: number) => (
    <g key={key} transform={`translate(${cx},${cy}) rotate(${a * dir})`}>
      {Array.from({length: 10}, (_, i) => <rect key={i} x={-7} y={-r - 12} width={14} height={18} fill={LOT.bronze} stroke={INK} strokeWidth={3} transform={`rotate(${i * 36})`} />)}
      <circle cx={0} cy={0} r={r} fill={LOT.bronze} stroke={INK} strokeWidth={4} />
      <circle cx={0} cy={0} r={r * 0.35} fill={LOT.bronzeD} stroke={INK} strokeWidth={3} />
    </g>
  );
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={4} rx={190} ry={14} opacity={0.45} />
      {Array.from({length: Math.round(clamp01(copies) * 2)}, (_, i) => (
        <rect key={i} x={-150 + (i + 1) * 22} y={-250 - (i + 1) * 14} width={300} height={56} rx={6} fill={LOT.sleeve} stroke={INK} strokeWidth={4} opacity={0.6} />
      ))}
      <rect x={-160} y={-220} width={320} height={220} rx={6} fill={LOT.aubergine} stroke={INK} strokeWidth={6} />
      {gear(-70, -120, 46, 1, 0)}{gear(36, -90, 34, -1.35, 1)}{gear(80, -160, 26, 1.8, 2)}
      {[0, 1, 2, 3].map((i) => <rect key={i} x={-160} y={-206 + i * 54} width={320} height={22} fill={LOT.birch} stroke={INK} strokeWidth={4} />)}
      {[0, 1, 2, 3].map((i) => <rect key={i} x={-150} y={-202 + i * 54} width={300} height={5} fill="#FFFFFF" opacity={0.35} />)}
      <rect x={-160} y={-220} width={18} height={220} fill={LOT.birchD} stroke={INK} strokeWidth={4} />
      <rect x={142} y={-220} width={18} height={220} fill={LOT.birchD} stroke={INK} strokeWidth={4} />
      <g transform="translate(0,-250)">
        <rect x={-150} y={-28} width={300} height={56} rx={6} fill={LOT.sleeve} stroke={INK} strokeWidth={5} />
        <text x={0} y={10} textAnchor="middle" fontFamily={MONO_} fontWeight={800} fontSize={28} letterSpacing={3} fill={LOT.paper}>{sleeve}</text>
      </g>
    </g>
  );
};

/** the lock cutaway: a bronze lock body in cross section, origin = centre. lifts[i] 0..1 lifts tumbler i; bolt stays put. */
export const LockCutaway: React.FC<{f: number; x: number; y: number; scale?: number; labels: string[]; lifts: number[]; open?: number}> =
({f, x, y, scale = 1, labels, lifts, open = 1}) => {
  const o = clamp01(open);
  const n = labels.length;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={o}>
      <ContactShadow cx={0} cy={330} rx={360} ry={22} opacity={0.4} />
      <rect x={-400} y={-300} width={800} height={600} rx={50} fill={LOT.bronze} stroke={INK} strokeWidth={8} />
      <rect x={-370} y={-270} width={740} height={540} rx={36} fill={LOT.bronzeD} stroke={INK} strokeWidth={5} />
      <rect x={-340} y={-240} width={680} height={480} rx={28} fill="#2A1A10" stroke={INK} strokeWidth={4} />
      {/* the keyway along the bottom */}
      <rect x={-320} y={150} width={640} height={50} rx={12} fill="#1A0F08" stroke={LOT.bronzeL} strokeWidth={3} />
      {/* the bolt on the right, which stays put */}
      <rect x={260} y={-60} width={200} height={90} rx={10} fill={LOT.bronze} stroke={INK} strokeWidth={6} />
      <rect x={270} y={-54} width={180} height={14} fill={LOT.bronzeL} opacity={0.7} />
      {labels.map((l, i) => {
        const cx = -240 + (i * 480) / Math.max(1, n - 1);
        const lift = clamp01(lifts[i] ?? 0);
        const dy = -lift * 90;
        const ww = lotMonoW(l, 24) + 26;
        return (
          <g key={l} transform={`translate(${cx},0)`}>
            <rect x={-26} y={-220} width={52} height={180} rx={8} fill="#4A2E1A" stroke={INK} strokeWidth={3} />
            {/* spring */}
            <path d={`M 0 -220 ${Array.from({length: 8}, (_, k) => `L ${k % 2 ? 14 : -14} ${-210 + k * (16 + lift * -6)}`).join(' ')}`} stroke={LOT.bronzeL} strokeWidth={4} fill="none" />
            {/* pin stack */}
            <g transform={`translate(0,${dy})`}>
              <rect x={-20} y={-80} width={40} height={120} rx={10} fill={lift > 0.95 ? LOT.marigold : LOT.bronzeL} stroke={INK} strokeWidth={4} />
              <rect x={-20} y={40} width={40} height={90} rx={10} fill={LOT.bronze} stroke={INK} strokeWidth={4} />
              <rect x={-14} y={-74} width={8} height={100} fill="#FFFFFF" opacity={0.35} />
            </g>
            {/* label plate below the keyway, sized to its string */}
            <g transform="translate(0,250)">
              <rect x={-ww / 2} y={-22} width={ww} height={40} rx={6} fill={LOT.paper} stroke={INK} strokeWidth={4} />
              <text x={0} y={8} textAnchor="middle" fontFamily={MONO_} fontWeight={800} fontSize={24} fill={INK}>{l}</text>
            </g>
          </g>
        );
      })}
      <path d="M -380 -280 Q -390 0 -380 270" stroke="#FFFFFF" strokeWidth={8} opacity={0.3} fill="none" />
      <circle cx={0} cy={-270} r={8} fill={LOT.bronzeL} opacity={0.4 + 0.3 * Math.sin(f / 8)} />
    </g>
  );
};

/**
 * AuctionHall, the Juneau set: timber panelling, a gallery rail, sconces, a tall rain window onto Mount Juneau and
 * the Gastineau Channel, a turntable, and a floor. winX/winW place the window; dark 0..1 dims the hall except the
 * spotlight; spotX is the spotlight cone's floor centre.
 */
export const AuctionHall: React.FC<{f: number; seed?: number; winX?: number; winW?: number; winY?: number; winH?: number; rain?: number; dark?: number; spotX?: number; spotY?: number; spot?: number; floorY?: number; sill?: boolean; showWindow?: boolean}> =
({f, seed = 0, winX = 690, winW = 300, winY = 150, winH = 820, rain = 1, dark = 0, spotX = 540, spotY = 1260, spot = 1, floorY = 1180, sill = true, showWindow = true}) => {
  const id = uid(`hall${seed}${winX}`);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A4562" /><stop offset="0.5" stopColor={LOT.dusk} /><stop offset="1" stopColor={LOT.slate} />
        </linearGradient>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={LOT.walnutD} /><stop offset="0.6" stopColor={LOT.walnut} /><stop offset="1" stopColor={LOT.timber} />
        </linearGradient>
        <radialGradient id={`${id}s`} cx="0.5" cy="1" r="0.8">
          <stop offset="0" stopColor={LOT.spot} stopOpacity={0.55} /><stop offset="1" stopColor={LOT.spot} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-80} y={-80} width={1240} height={2080} fill={`url(#${id}p)`} data-band="ok" />
      {/* vertical panelling */}
      {Array.from({length: 12}, (_, i) => (
        <g key={i}>
          <rect x={-40 + i * 100} y={-60} width={6} height={floorY + 60} fill={LOT.walnutD} opacity={0.55} />
          <rect x={-30 + i * 100} y={-60} width={3} height={floorY + 60} fill={LOT.timberL} opacity={0.25} />
        </g>
      ))}
      {/* wainscot rail and lower panels */}
      <rect x={-80} y={floorY - 300} width={1240} height={16} fill={LOT.timberL} stroke={INK} strokeWidth={3} />
      {Array.from({length: 6}, (_, i) => <rect key={i} x={-40 + i * 200} y={floorY - 270} width={170} height={240} rx={8} fill="none" stroke={LOT.walnutD} strokeWidth={5} opacity={0.6} />)}
      {/* gallery rail along the top with hanging lot banners */}
      <rect x={-80} y={70} width={1240} height={26} fill={LOT.walnut} stroke={INK} strokeWidth={4} />
      {Array.from({length: 14}, (_, i) => <rect key={i} x={-60 + i * 90} y={96} width={10} height={80} fill={LOT.walnutD} stroke={INK} strokeWidth={2} />)}
      <rect x={-80} y={170} width={1240} height={14} fill={LOT.walnut} stroke={INK} strokeWidth={3} />
      {[160, 400].map((bx, i) => (
        <g key={i} transform={`translate(${bx},184) rotate(${Math.sin(f / 40 + i) * 2})`}>
          <path d="M -50 0 L 50 0 L 50 110 L 0 140 L -50 110 Z" fill={LOT.claret} stroke={INK} strokeWidth={4} />
          <path d="M -40 10 L -40 100" stroke={LOT.claretL} strokeWidth={4} opacity={0.6} />
          <circle cx={0} cy={60} r={22} fill="none" stroke={LOT.bronze} strokeWidth={5} />
        </g>
      ))}
      {/* sconces */}
      {[60, 560].map((sx, i) => (
        <g key={i} transform={`translate(${sx},${floorY - 520})`}>
          <ellipse cx={0} cy={0} rx={70} ry={90} fill={LOT.spot} opacity={0.12 + 0.03 * Math.sin(f / 13 + i)} />
          <path d="M -14 30 L 14 30 L 8 60 L -8 60 Z" fill={LOT.bronze} stroke={INK} strokeWidth={3} />
          <path d="M -18 0 Q 0 -30 18 0 L 14 30 L -14 30 Z" fill="#FFF0C8" stroke={INK} strokeWidth={3} />
        </g>
      ))}
      {/* the tall window: Mount Juneau, the channel and rain */}
      {showWindow && <g>
        <rect x={winX - 18} y={winY - 18} width={winW + 36} height={winH + 36} rx={14} fill={LOT.walnut} stroke={INK} strokeWidth={6} />
        <rect x={winX} y={winY} width={winW} height={winH} fill={`url(#${id}w)`} stroke={INK} strokeWidth={4} />
        <svg x={winX} y={winY} width={winW} height={winH} viewBox={`0 0 ${winW} ${winH}`} overflow="hidden">
          {/* cloud bands */}
          {[0, 1, 2].map((i) => (
            <ellipse key={i} cx={((f * (0.2 + i * 0.1) + i * 140) % (winW + 300)) - 150} cy={70 + i * 70} rx={160} ry={28} fill={LOT.rain} opacity={0.35} />
          ))}
          {/* Mount Juneau, steep and forested, snow on its shoulder */}
          <path d={`M -20 ${winH * 0.78} L ${winW * 0.18} ${winH * 0.42} L ${winW * 0.34} ${winH * 0.3} L ${winW * 0.52} ${winH * 0.22} L ${winW * 0.68} ${winH * 0.36} L ${winW * 0.84} ${winH * 0.4} L ${winW + 20} ${winH * 0.5} L ${winW + 20} ${winH} L -20 ${winH} Z`}
            fill="#33415A" stroke={INK} strokeWidth={4} />
          <path d={`M ${winW * 0.34} ${winH * 0.3} L ${winW * 0.52} ${winH * 0.22} L ${winW * 0.62} ${winH * 0.31} L ${winW * 0.55} ${winH * 0.3} L ${winW * 0.48} ${winH * 0.34} L ${winW * 0.42} ${winH * 0.31} Z`} fill="#E8EEF5" stroke={INK} strokeWidth={2.5} />
          <path d={`M ${winW * 0.52} ${winH * 0.22} L ${winW * 0.68} ${winH * 0.36} L ${winW + 20} ${winH * 0.5}`} stroke="#1F2A3C" strokeWidth={10} fill="none" opacity={0.5} />
          {/* spruce on the lower slope */}
          {Array.from({length: 16}, (_, i) => {
            const tx = h01(i, seed + 2) * winW, ty = winH * (0.55 + h01(i, seed + 4) * 0.18);
            return <path key={i} d={`M ${tx} ${ty - 34} L ${tx + 12} ${ty} L ${tx - 12} ${ty} Z`} fill="#1E3A34" stroke={INK} strokeWidth={1.5} />;
          })}
          {/* the Gastineau Channel and the town's lights along the shore */}
          <rect x={0} y={winH * 0.76} width={winW} height={winH * 0.24} fill={LOT.channel} />
          {Array.from({length: 6}, (_, i) => <path key={i} d={`M ${i * 60 - ((f * 0.4) % 60)} ${winH * 0.82 + i * 8} l 40 0`} stroke={LOT.rain} strokeWidth={2} opacity={0.5} />)}
          {Array.from({length: 12}, (_, i) => <circle key={i} cx={10 + i * (winW / 12)} cy={winH * 0.745} r={3} fill="#FFD98A" opacity={0.6 + 0.4 * Math.sin(f / 9 + i)} />)}
          {/* rain streaks running down the glass */}
          {Array.from({length: Math.round(22 * rain)}, (_, i) => {
            const rx = h01(i, seed + 9) * winW;
            const ry = ((f * (6 + h01(i, 1) * 5) + h01(i, 2) * winH) % (winH + 80)) - 40;
            return <path key={i} d={`M ${rx} ${ry} l -3 34`} stroke={LOT.rain} strokeWidth={2} opacity={0.6} />;
          })}
        </svg>
        <rect x={winX + winW / 2 - 5} y={winY} width={10} height={winH} fill={LOT.walnut} stroke={INK} strokeWidth={3} />
        <rect x={winX} y={winY + winH * 0.48} width={winW} height={10} fill={LOT.walnut} stroke={INK} strokeWidth={3} />
        {sill && <rect x={winX - 30} y={winY + winH + 10} width={winW + 60} height={26} rx={4} fill={LOT.timberL} stroke={INK} strokeWidth={4} />}
      </g>}
      {!showWindow && [winX, winX + winW * 0.5].map((px, i) => (
        <g key={i} transform={`translate(${px},${winY + 120})`}>
          <rect x={-70} y={0} width={140} height={190} rx={6} fill={LOT.walnutD} stroke={INK} strokeWidth={5} />
          <rect x={-56} y={14} width={112} height={162} fill={i ? LOT.claretD : LOT.channel} opacity={0.7} />
          <path d={`M -56 ${120 - i * 20} L -10 ${70 + i * 10} L 20 ${100 - i * 10} L 56 ${60 + i * 20} L 56 176 L -56 176 Z`} fill={LOT.walnut} opacity={0.6} />
        </g>
      ))}
      {/* floor: honey boards in perspective */}
      <rect x={-80} y={floorY} width={1240} height={2000 - floorY} fill={LOT.timber} data-band="ok" />
      {Array.from({length: 14}, (_, i) => (
        <path key={i} d={`M ${540 + (i - 7) * 40} ${floorY} L ${540 + (i - 7) * 190} 2000`} stroke={LOT.walnut} strokeWidth={3} opacity={0.45} data-band="ok" />
      ))}
      {Array.from({length: 6}, (_, i) => <rect key={i} x={-80} y={floorY + 40 + i * i * 22} width={1240} height={3} fill={LOT.walnutD} opacity={0.35} data-band="ok" />)}
      {/* the darkening of the hall around the spotlight */}
      {dark > 0.01 && <rect x={-80} y={-80} width={1240} height={2080} fill={LOT.aubergineD} opacity={clamp01(dark) * 0.62} data-band="ok" />}
      {/* the spotlight cone, opaque with dust */}
      {spot > 0.01 && (
        <g opacity={clamp01(spot)}>
          <path d={`M ${spotX - 40 + Math.sin(f / 50) * 10} -60 L ${spotX - 260} ${spotY} L ${spotX + 260} ${spotY} L ${spotX + 40 + Math.sin(f / 50) * 10} -60 Z`} fill={`url(#${id}s)`} />
          {Array.from({length: 26}, (_, i) => {
            const dx = (h01(i, 11) - 0.5) * 360 * (h01(i, 12));
            const dy = ((h01(i, 13) * spotY + f * (0.6 + h01(i, 14))) % spotY);
            return <circle key={i} cx={spotX + dx * (dy / spotY)} cy={dy} r={1.6 + h01(i, 15) * 2.4} fill="#FFF6DC" opacity={0.5} />;
          })}
          <ellipse cx={spotX} cy={spotY} rx={270} ry={46} fill={LOT.spot} opacity={0.3} />
        </g>
      )}
    </g>
  );
};

/** the turntable disc on the floor, origin = centre of its top face; turns slowly */
export const Turntable: React.FC<{f: number; x: number; y: number; w?: number; spin?: number}> = ({f, x, y, w = 560, spin = 1}) => {
  const a = (f * 0.6 * spin) % 360;
  return (
    <g transform={`translate(${x},${y})`} data-band="ok">
      <ellipse cx={0} cy={26} rx={w / 2 + 6} ry={w * 0.14 + 6} fill="#000" opacity={0.3} />
      <path d={`M ${-w / 2} 0 L ${-w / 2} 34 A ${w / 2} ${w * 0.14} 0 0 0 ${w / 2} 34 L ${w / 2} 0 Z`} fill={LOT.walnutD} stroke={INK} strokeWidth={5} />
      <ellipse cx={0} cy={0} rx={w / 2} ry={w * 0.14} fill={LOT.walnut} stroke={INK} strokeWidth={5} />
      {Array.from({length: 12}, (_, i) => {
        const t = ((i * 30 + a) * Math.PI) / 180;
        return <path key={i} d={`M 0 0 L ${Math.cos(t) * w * 0.48} ${Math.sin(t) * w * 0.13}`} stroke={LOT.timberL} strokeWidth={2.5} opacity={0.4} />;
      })}
      <ellipse cx={0} cy={0} rx={w * 0.42} ry={w * 0.115} fill="none" stroke={LOT.bronze} strokeWidth={4} opacity={0.8} />
      {Array.from({length: 16}, (_, i) => {
        const t = ((i * 22.5 + a) * Math.PI) / 180;
        return Math.sin(t) > 0 ? <circle key={i} cx={Math.cos(t) * (w / 2 - 4)} cy={Math.sin(t) * (w * 0.14) + 18} r={4} fill={LOT.bronzeL} stroke={INK} strokeWidth={1.5} /> : null;
      })}
    </g>
  );
};

/** a claret velvet curtain from the top; open 0..1 sweeps it to the side (side -1 left, 1 right) */
export const Curtain: React.FC<{f: number; open: number; side?: 1 | -1; w?: number; h?: number; x0?: number}> = ({f, open, side = -1, w = 1240, h = 2000, x0 = -80}) => {
  const o = clamp01(open);
  const cw = w * (1 - o * 0.86);
  const x = side < 0 ? x0 : x0 + w - cw;
  const folds = 10;
  return (
    <g data-band="ok">
      <rect x={x} y={-80} width={cw} height={h + 80} fill={LOT.claret} stroke={INK} strokeWidth={6} />
      {Array.from({length: folds}, (_, i) => {
        const fx = x + (i + 0.5) * (cw / folds) + Math.sin(f / 18 + i) * 4;
        return (
          <g key={i}>
            <rect x={fx - cw / folds / 4} y={-80} width={cw / folds / 2} height={h + 80} fill={LOT.claretD} opacity={0.5} />
            <rect x={fx + cw / folds / 6} y={-80} width={6} height={h + 80} fill={LOT.claretL} opacity={0.5} />
          </g>
        );
      })}
      <rect x={x} y={-80} width={cw} height={120} fill={LOT.claretD} stroke={INK} strokeWidth={4} />
      {Array.from({length: Math.max(1, Math.round(cw / 70))}, (_, i) => <circle key={i} cx={x + 30 + i * 70} cy={36} r={8} fill={LOT.bronze} stroke={INK} strokeWidth={2} />)}
    </g>
  );
};

/**
 * AuctionHammer, an auctioneer's hammer raised on a nickel arm from a wall bracket. Origin (x, y) is the hammer head's
 * centre. bx, by is the bracket (absolute, same space). cords[i] 0..1 draws marigold cord i from the head up to topY,
 * tagged tags[i]; a cord shoots up and knots taut at 1. creak adds a small idle sway. drop 0..1 would lower it; the film
 * never drops it.
 */
export const AuctionHammer: React.FC<{f: number; x: number; y: number; bx: number; by: number; scale?: number; cords?: number[]; tags?: string[]; topY?: number; ghost?: boolean; glint?: number; card?: number; cardText?: string; dip?: number; weight?: number}> =
({f, x, y, bx, by, scale = 1, cords = [], tags = [], topY = 140, ghost = false, glint = 0, card = 0, cardText = '', dip = 0, weight = 0}) => {
  const sway = Math.sin(f / 37) * 1.6;
  const hx = x + sway * 2, hy = y + Math.sin(f / 23) * 1.2 + dip * 70;
  return (
    <g opacity={ghost ? 0.35 : 1}>
      {/* the arm */}
      <path d={`M ${bx} ${by} Q ${(bx + hx) / 2} ${by - 60} ${hx + 40 * scale} ${hy - 40 * scale}`} stroke={INK} strokeWidth={26 * scale} fill="none" strokeLinecap="round" />
      <path d={`M ${bx} ${by} Q ${(bx + hx) / 2} ${by - 60} ${hx + 40 * scale} ${hy - 40 * scale}`} stroke={LOT.bronze} strokeWidth={16 * scale} fill="none" strokeLinecap="round" />
      <path d={`M ${bx} ${by - 4} Q ${(bx + hx) / 2} ${by - 66} ${hx + 40 * scale} ${hy - 46 * scale}`} stroke={LOT.bronzeL} strokeWidth={4 * scale} fill="none" opacity={0.7} />
      <rect x={bx - 30} y={by - 40} width={60} height={80} rx={8} fill={LOT.bronzeD} stroke={INK} strokeWidth={5} />
      {[0, 1].map((i) => <circle key={i} cx={bx} cy={by - 22 + i * 44} r={6} fill={LOT.bronzeL} stroke={INK} strokeWidth={2} />)}
      {/* marigold cords from the head up to the rail */}
      {cords.map((c, i) => {
        const k = clamp01(c);
        if (k <= 0.01) return null;
        const x0 = hx + (i - 1) * 46 * scale, y0 = hy - 30 * scale;
        const x1 = x0 + (i - 1) * 90, y1 = topY;
        const ex = x0 + (x1 - x0) * k, ey = y0 + (y1 - y0) * k;
        const taut = k > 0.99;
        const mid = taut ? 0 : 30 * (1 - k);
        const ty = y0 + (y1 - y0) * 0.45;
        const tag = tags[i];
        const tw = tag ? lotMonoW(tag, 18) + 20 : 0;
        return (
          <g key={i}>
            <path d={`M ${x0} ${y0} Q ${(x0 + ex) / 2 + mid} ${(y0 + ey) / 2} ${ex} ${ey}`} stroke={INK} strokeWidth={11} fill="none" strokeLinecap="round" />
            <path d={`M ${x0} ${y0} Q ${(x0 + ex) / 2 + mid} ${(y0 + ey) / 2} ${ex} ${ey}`} stroke={LOT.marigold} strokeWidth={6} fill="none" strokeLinecap="round" />
            <circle cx={x0} cy={y0} r={9} fill={LOT.marigold} stroke={INK} strokeWidth={3} />
            {taut && <circle cx={x1} cy={y1} r={8} fill={LOT.marigoldD} stroke={INK} strokeWidth={3} />}
            {tag && taut && (
              <g transform={`translate(${x0 + (x1 - x0) * 0.45},${ty}) rotate(${Math.sin(f / 19 + i) * 3})`}>
                <rect x={-tw / 2} y={-16} width={tw} height={32} rx={5} fill={LOT.paper} stroke={INK} strokeWidth={3} />
                <text x={0} y={7} textAnchor="middle" fontFamily={MONO_} fontWeight={800} fontSize={18} fill={INK}>{tag}</text>
              </g>
            )}
          </g>
        );
      })}
      {/* the hammer: a turned cherry head on a handle, raised */}
      <g transform={`translate(${hx},${hy}) rotate(${-28 + sway}) scale(${scale})`}>
        <ContactShadow cx={0} cy={260} rx={60} ry={8} opacity={0.12} />
        <rect x={-10} y={-10} width={20} height={150} rx={8} fill={LOT.timber} stroke={INK} strokeWidth={5} />
        <rect x={-6} y={-4} width={5} height={140} fill={LOT.timberL} opacity={0.6} />
        <rect x={-70} y={-62} width={140} height={60} rx={22} fill={LOT.timber} stroke={INK} strokeWidth={6} />
        <rect x={-74} y={-60} width={20} height={56} rx={8} fill={LOT.bronze} stroke={INK} strokeWidth={4} />
        <rect x={54} y={-60} width={20} height={56} rx={8} fill={LOT.bronze} stroke={INK} strokeWidth={4} />
        <path d="M -48 -52 L 40 -52" stroke={LOT.timberL} strokeWidth={6} strokeLinecap="round" opacity={0.7} />
        <path d="M -50 -12 L 44 -12" stroke={LOT.walnutD} strokeWidth={6} strokeLinecap="round" opacity={0.6} />
      </g>
      {/* the release catch on the arm by the head: a nickel box with a keyhole and no key */}
      <g transform={`translate(${hx + 80 * scale},${hy - 64 * scale})`}>
        <rect x={-30 * scale} y={-26 * scale} width={60 * scale} height={52 * scale} rx={8} fill={LOT.bronze} stroke={INK} strokeWidth={4} />
        <rect x={-24 * scale} y={-20 * scale} width={14 * scale} height={40 * scale} fill={LOT.bronzeL} opacity={0.5} />
        <circle cx={0} cy={-4 * scale} r={7 * scale} fill={INK} />
        <path d={`M ${-4 * scale} ${-2 * scale} L ${-6 * scale} ${14 * scale} L ${6 * scale} ${14 * scale} L ${4 * scale} ${-2 * scale} Z`} fill={INK} />
        {glint > 0.01 && <path d={`M ${-22 * scale} ${-22 * scale} l 9 9 M ${18 * scale} ${-24 * scale} l -7 7`} stroke="#FFFFFF" strokeWidth={3} opacity={glint * (0.6 + 0.4 * Math.sin(f / 4))} />}
        {card > 0.01 && (
          <g transform={`translate(0,${26 * scale + (1 - clamp01(card)) * -260}) rotate(${Math.sin(f / 15) * 4})`} opacity={clamp01(card * 3)}>
            <path d="M 0 0 L 0 20" stroke={INK} strokeWidth={3} />
            <rect x={-lotMonoW(cardText, 16) / 2 - 14} y={20} width={lotMonoW(cardText, 16) + 28} height={36} rx={4} fill={LOT.paper} stroke={INK} strokeWidth={3} />
            <text x={0} y={44} textAnchor="middle" fontFamily={MONO_} fontWeight={800} fontSize={16} fill={INK}>{cardText}</text>
          </g>
        )}
      </g>
      {/* a sheet hung as a counterweight on the arm's far end, by the bracket */}
      {weight > 0.01 && (
        <g transform={`translate(${bx - 70},${by + 10 + (1 - clamp01(weight)) * -200}) rotate(${Math.sin(f / 17) * 3})`} opacity={clamp01(weight * 2)}>
          <path d="M 0 -30 L 0 0" stroke={INK} strokeWidth={3} />
          <rect x={-60} y={0} width={120} height={150} rx={4} fill={LOT.paper} stroke={INK} strokeWidth={4} />
          {Array.from({length: 5}, (_, i) => <g key={i}><rect x={-48} y={18 + i * 20} width={56} height={7} rx={3} fill="#B9B0A0" /><rect x={16} y={18 + i * 20} width={30} height={7} rx={3} fill={LOT.claretL} /></g>)}
          <rect x={-48} y={124} width={96} height={3} fill={INK} />
          <rect x={16} y={130} width={30} height={12} rx={2} fill="none" stroke={INK} strokeWidth={2} strokeDasharray="4 3" />
        </g>
      )}
    </g>
  );
};
