import React from 'react';
import {INK, ContactShadow, FormGradient, tones} from './lighting';
import {MONO} from './prospect';

// =============================================================================
// THE SIGN KIT (NET-NEW 2026-10-25, "One Word, Every Size")
//
//   Plate : THE HERO and the film's throughline. A rigid enamel sign with a brass rim, stubby cedar legs
//           and a FACE, lettered DATA CENTER. Its drama is ELASTIC against FIXED: the body telescopes like
//           taffy (stretchPx) while the lettering never changes size, and a hairline crack (crack) opens
//           when it is strained past what one word can cover. It reacts to SIZE only, never to policy.
//           Built new because no shelf sign has a face or a body that stretches (AllowanceBoard,
//           HandbookPlate, SteelTag and CouncilSign are rigid and faceless; BrassPlate's rim tokens are reused).
//   Ruler : a long cedar ruler with brass end caps and NO marks until a scene gives it ticks. A tick is
//           'ink' (a closed, filed number), 'dash' (a proposed one) or 'open' (the undrawn one, signal pink).
//           The horizontal twin of the HeightChart idea, without a pencil, because its drama is what is NOT on it.
//
// Draw space for the Plate: origin at the base centre (the ground line), +y down, about 300 wide and 245 tall.
// =============================================================================
export const SIGN = {
  cream: '#F3E9D2', creamShade: '#D9C9A6', brass: '#C8962E', brassHi: '#E7C46A', brassShade: '#8A6420',
  cedar: '#8A5A3B', cedarHi: '#B07A52', cedarShade: '#5E3B25', teal: '#2F6F6B', ink: INK, pink: '#E8457A', blue: '#4FA3C7',
};

export type PlateMood = 'smug' | 'plain' | 'strained' | 'worried' | 'curious' | 'alarm';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const Plate: React.FC<{
  x?: number; y?: number; s?: number; f: number; mood?: PlateMood; stretchPx?: number; crack?: number; look?: number; tilt?: number;
  legs?: boolean; legH?: number; phase?: number; id?: string;
}> = ({x = 0, y = 0, s = 1, f, mood = 'plain', stretchPx = 0, crack = 0, look = 0, tilt = 0, legs = true, legH = 44, phase = 0, id = 'pl'}) => {
  const W = 300 + stretchPx;
  const H = 190;
  const base = legs ? legH : 0;
  const top = -base - H;
  const bottom = -base;
  const pinch = Math.min(1, stretchPx / 700) * 34;
  const breath = 1 + 0.012 * Math.sin(f / 15 + phase) + 0.004 * Math.sin(f / 6.1 + phase * 2);
  const sway = tilt + 2.1 * Math.sin(f / 26 + phase) + 0.9 * Math.sin(f / 11.3 + phase * 1.7);
  const blink = ((f + Math.floor(phase * 37)) % 88) < 5;
  const r = 34;
  const body = `M ${-W / 2 + r},${top} Q 0,${top + pinch} ${W / 2 - r},${top} Q ${W / 2},${top} ${W / 2},${top + r} L ${W / 2},${bottom - r} Q ${W / 2},${bottom} ${W / 2 - r},${bottom} Q 0,${bottom - pinch} ${-W / 2 + r},${bottom} Q ${-W / 2},${bottom} ${-W / 2},${bottom - r} L ${-W / 2},${top + r} Q ${-W / 2},${top} ${-W / 2 + r},${top} Z`;
  const t = tones(SIGN.cream);
  const gid = `${id}_g`;
  const ex = 50 + stretchPx * 0.045;
  const ey = top + 58;
  const eyeR = mood === 'alarm' ? 21 : 18;
  const squint = mood === 'smug' ? 0.52 : mood === 'strained' ? 0.4 : 1;
  const lx = Math.max(-6, Math.min(6, look));
  const brow = (sx: number) => {
    const a = mood === 'worried' ? -14 : mood === 'strained' ? 16 : mood === 'smug' ? -6 : mood === 'alarm' ? -18 : mood === 'curious' ? -8 : 0;
    return `M ${sx * ex - 22},${ey - 30 + (sx < 0 ? 0 : 0) - a * 0.3} L ${sx * ex + 22},${ey - 30 + a * 0.5 * sx * -1 + (mood === 'worried' ? 0 : 0)}`;
  };
  const mouthY = top + 104;
  const mouth = mood === 'smug' ? `M -34,${mouthY} Q 0,${mouthY + 22} 38,${mouthY - 10}`
    : mood === 'strained' ? `M -44,${mouthY + 2} L -26,${mouthY - 4} L -8,${mouthY + 4} L 10,${mouthY - 4} L 28,${mouthY + 4} L 44,${mouthY}`
    : mood === 'worried' ? `M -34,${mouthY + 6} Q -17,${mouthY - 8} 0,${mouthY + 6} T 34,${mouthY + 6}`
    : mood === 'alarm' ? `M -16,${mouthY} Q 0,${mouthY + 28} 16,${mouthY} Q 0,${mouthY - 8} -16,${mouthY} Z`
    : mood === 'curious' ? `M -10,${mouthY} Q 0,${mouthY + 10} 10,${mouthY}`
    : `M -26,${mouthY} Q 0,${mouthY + 10} 26,${mouthY}`;
  const cx = 28 + stretchPx * 0.12;
  const crackPath = `M ${-(W / 2 - 26)},${top - 3} l 12,30 l -16,20 l 18,26 l -10,24`;
  const crackLen = 150;
  return (
    <g transform={`translate(${x},${y - 5 * Math.max(0, Math.sin(f / 17 + phase))}) rotate(${sway}) scale(${s * (1 + (breath - 1) * 0.5)},${s * breath})`}>
      <defs><FormGradient id={gid} t={t} /></defs>
      <ContactShadow cx={0} cy={4} rx={W * 0.42} ry={12} opacity={0.34} blur={8} />
      {legs && [-1, 1].map((sx) => (
        <g key={sx} transform={`translate(${sx * Math.max(78, W / 2 - 70)},0)`}>
          <rect x={-17} y={-base - 4} width={34} height={base + 4} rx={6} fill={SIGN.cedar} stroke={INK} strokeWidth={5} />
          <rect x={-11} y={-base} width={9} height={Math.max(0, base - 4)} fill={SIGN.cedarHi} opacity={0.6} />
          <rect x={-22} y={-8} width={44} height={12} rx={5} fill={SIGN.cedarShade} stroke={INK} strokeWidth={4} />
        </g>
      ))}
      <path d={body} fill="none" stroke={INK} strokeWidth={26} strokeLinejoin="round" />
      <path d={body} fill="none" stroke={SIGN.brass} strokeWidth={16} strokeLinejoin="round" />
      <path d={body} fill="none" stroke={SIGN.brassHi} strokeWidth={4} strokeLinejoin="round" opacity={0.7} transform="translate(-2,-2)" />
      <path d={body} fill={`url(#${gid})`} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => (
        <circle key={i} cx={a * (W / 2 - 22)} cy={(b < 0 ? top : bottom) + (b < 0 ? 22 : -22)} r={5} fill={SIGN.brassShade} stroke={INK} strokeWidth={2.4} />
      ))}
      {/* the face */}
      {[-1, 1].map((sx) => (
        <g key={sx} transform={`translate(${sx * ex},${ey})`}>
          <ellipse cx={0} cy={0} rx={eyeR} ry={blink ? 2.4 : eyeR * squint + 2} fill="#fff" stroke={INK} strokeWidth={4} />
          {!blink && <circle cx={lx + (mood === 'worried' ? 0 : 0)} cy={mood === 'smug' ? 3 : 0} r={eyeR * 0.46} fill={INK} />}
          {!blink && <circle cx={lx + 4} cy={-3} r={3} fill="#fff" />}
        </g>
      ))}
      {[-1, 1].map((sx) => <path key={sx} d={brow(sx)} stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />)}
      <path d={mouth} fill={mood === 'alarm' ? '#7A2A2A' : 'none'} stroke={INK} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      {mood === 'strained' && <path d={`M ${-W / 2 + 40},${top + 70} q 14,-8 22,6 M ${W / 2 - 40},${top + 70} q -14,-8 -22,6`} stroke={SIGN.brassShade} strokeWidth={3} fill="none" opacity={0.55} />}
      {/* the lettering never scales: it is the fixed thing the body is stretched around */}
      <text x={0} y={bottom - 30} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={34} letterSpacing={1.5} fill={INK}>DATA CENTER</text>
      {crack > 0.01 && (
        <g>
          <path d={crackPath} fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={crackLen} strokeDashoffset={crackLen * (1 - clamp01(crack))} />
          <path d={crackPath} fill="none" stroke={SIGN.creamShade} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={crackLen} strokeDashoffset={crackLen * (1 - clamp01(crack))} transform="translate(2,1)" opacity={0.9} />
        </g>
      )}
    </g>
  );
};

export type RulerTick = {at: number; kind: 'ink' | 'dash' | 'open'; k?: number; label?: string};

/** a long cedar ruler centred on (x, y): `len` wide, `h` tall, brass caps, NO marks unless ticks are given. at is 0..1 along it. */
export const Ruler: React.FC<{x?: number; y?: number; len?: number; h?: number; f: number; ticks?: RulerTick[]; id?: string}> = ({x = 540, y = 960, len = 900, h = 76, f, ticks = [], id = 'rl'}) => {
  const t = tones(SIGN.cedar);
  const gid = `${id}_g`;
  const x0 = -len / 2;
  return (
    <g transform={`translate(${x},${y})`}>
      <defs><FormGradient id={gid} t={t} /></defs>
      <ContactShadow cx={0} cy={h / 2 + 18} rx={len * 0.46} ry={9} opacity={0.26} blur={9} />
      <rect x={x0} y={-h / 2} width={len} height={h} rx={8} fill={`url(#${gid})`} stroke={INK} strokeWidth={6} />
      {Array.from({length: 9}).map((_, i) => (
        <path key={i} d={`M ${x0 + 40 + i * (len / 9)},${-h / 2 + 12 + (i % 3) * 14} q 40,-5 78,2`} stroke={SIGN.cedarShade} strokeWidth={2.2} fill="none" opacity={0.4} />
      ))}
      <rect x={x0 + 4} y={-h / 2 + 4} width={len - 8} height={7} rx={3} fill={SIGN.cedarHi} opacity={0.55} />
      {[x0 - 4, x0 + len - 30].map((cxp, i) => (
        <g key={i}>
          <rect x={cxp} y={-h / 2 - 5} width={34} height={h + 10} rx={6} fill={SIGN.brass} stroke={INK} strokeWidth={5} />
          <rect x={cxp + 5} y={-h / 2} width={8} height={h} fill={SIGN.brassHi} opacity={0.6} />
          <circle cx={cxp + 17} cy={-h / 4} r={4.2} fill={SIGN.brassShade} stroke={INK} strokeWidth={2} />
          <circle cx={cxp + 17} cy={h / 4} r={4.2} fill={SIGN.brassShade} stroke={INK} strokeWidth={2} />
        </g>
      ))}
      {ticks.map((tk, i) => {
        const k = clamp01(tk.k ?? 1);
        if (k <= 0.01) return null;
        const tx = x0 + 34 + (len - 68) * tk.at;
        const hh = h * (0.55 + 0.45 * k);
        if (tk.kind === 'open') {
          const pulse = 0.65 + 0.35 * Math.sin(f / 7 + i);
          return (
            <g key={i}>
              <rect x={tx - 11} y={-h / 2 - 22} width={22} height={hh + 30} rx={5} fill="none" stroke={SIGN.pink} strokeWidth={5} opacity={pulse} />
              <rect x={tx - 5} y={-h / 2 - 8} width={10} height={hh} fill={SIGN.pink} opacity={0.22 + 0.2 * pulse} />
            </g>
          );
        }
        return (
          <g key={i}>
            <line x1={tx} y1={-h / 2} x2={tx} y2={-h / 2 + hh} stroke={INK} strokeWidth={tk.kind === 'dash' ? 6 : 8} strokeLinecap="round" strokeDasharray={tk.kind === 'dash' ? '10 8' : undefined} strokeDashoffset={-f * 0.6} />
            {tk.kind === 'ink' && <circle cx={tx} cy={-h / 2 + hh} r={6} fill={SIGN.brass} stroke={INK} strokeWidth={2.6} />}
          </g>
        );
      })}
    </g>
  );
};
