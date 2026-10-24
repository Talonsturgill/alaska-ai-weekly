import React from 'react';
import {ContactShadow, FormGradient, INK, tones} from './lighting';

// THE THAW KIT, 2026-10-24 ("Seeing Is the Easy Part"). Two small pieces the shelf did not have. SoilColumn is a layered cut of Interior
// ground: a mat on top, thawed peat, then frozen ground with ice lenses, a ruler down the left edge in feet, a `thawDepth` that can
// move, a `burned` setting (the mat is gone and the char sits on a darker peat) and amber carbon motes that lift out of the peat.
// ThawProbe is a plain steel rod with a T handle and depth ticks. It has no face on purpose. It is driven by `depth` (pixels of rod
// below the surface), so a scene can stop it dead on the ice at one foot or let it plunge three times as far.
// Everything is SVG at a caller-set x, y. The only strings painted are the ruler's "N FT" labels.
export const TH = {
  moss: '#6F8F4E', mossHi: '#9DBB74', mossDeep: '#41592F',
  peat: '#5A3B2A', peatHi: '#7C5640', peatDeep: '#3A2418',
  char: '#2B2623', charHi: '#4A413B', ash: '#8A8A92',
  ice: '#9FD8E6', iceHi: '#E3F6FB', iceDeep: '#5C9DB4', silt: '#6D7C86',
  ember: '#FF8A1F', emberHi: '#FFF4C2', thawGlow: '#C46A2A', steel: '#9AA6B4', rubber: '#1B2233',
};
export const MONO = "'JetBrains Mono', monospace";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const hash = (i: number) => {
  let x = (Math.floor(i) + 2410) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};

/** an irregular boundary: x across 0..w, y wandering around yb by a few px (ground has no ruler-straight layers) */
const wavy = (w: number, yb: number, amp: number, seed: number) => {
  const pts: string[] = [];
  for (let x = 0; x <= w; x += 20) pts.push(`${x},${(yb + amp * (Math.sin(x / 47 + seed) * 0.6 + Math.sin(x / 19 + seed * 2.1) * 0.4)).toFixed(1)}`);
  return pts;
};

type ColProps = {
  x: number; y: number; w?: number; h?: number; f: number; ftPx?: number;
  thawDepth?: number;      // 0..1 of h where the frozen ground begins
  burned?: boolean; carbon?: number; ruler?: boolean; id?: string; glow?: number;
};

/** the surface (y = 0 at the top edge of the cut) sits at the caller's y; the cut hangs below it, centred on x. */
export const SoilColumn: React.FC<ColProps> = ({x, y, w = 420, h = 700, f, ftPx = 150, thawDepth = 0.2, burned = false, carbon = 0, ruler = true, id = 'sc', glow = 0}) => {
  const matH = burned ? 18 : 46;
  const thawY = Math.max(matH + 20, thawDepth * h);
  const cid = `${id}_clip`;
  const specks = Array.from({length: 120}, (_, i) => ({sx: hash(i * 3) * w, sy: hash(i * 3 + 1) * h, sr: 1.6 + hash(i * 3 + 2) * 3.4}));
  const lenses = Array.from({length: 9}, (_, i) => ({lx: hash(i * 7 + 400) * (w - 120), ly: thawY + 30 + hash(i * 7 + 401) * (h - thawY - 60), lw: 60 + hash(i * 7 + 402) * 110}));
  const motes = Array.from({length: Math.round(26 * clamp01(carbon))}, (_, i) => {
    const ph = ((f / 70) + hash(i + 900)) % 1;
    return {mx: (hash(i + 910) - 0.5) * (w - 40) + 18 * Math.sin(f / 19 + i), my: matH + 30 + (thawY - matH - 40) * (1 - ph) - 230 * ph * ph, mo: Math.sin(ph * Math.PI)};
  });
  const blades = Array.from({length: 26}, (_, i) => ({bx: -w / 2 + 14 + (i / 25) * (w - 28), bh: 18 + hash(i + 60) * 26, bl: (hash(i + 70) - 0.5) * 18}));
  return (
    <g transform={`translate(${x},${y})`}>
      <ContactShadow cx={0} cy={h + 12} rx={w * 0.52} ry={14} opacity={0.3} />
      <clipPath id={cid}><rect x={-w / 2} y={0} width={w} height={h} /></clipPath>
      <g clipPath={`url(#${cid})`} transform={`translate(${-w / 2},0)`}>
        {/* frozen ground first, it fills the whole cut */}
        <rect x={0} y={0} width={w} height={h} fill={TH.ice} />
        <rect x={0} y={thawY} width={w} height={h - thawY} fill={TH.iceDeep} opacity={0.35} />
        {lenses.map((l, i) => (
          <g key={i}>
            <ellipse cx={l.lx + l.lw / 2} cy={l.ly} rx={l.lw / 2} ry={5} fill={TH.iceHi} opacity={0.85} />
            <ellipse cx={l.lx + l.lw / 2 + 12} cy={l.ly + 12} rx={l.lw / 3} ry={3} fill={TH.silt} opacity={0.55} />
          </g>
        ))}
        {/* the thawed peat above the front, its lower edge irregular */}
        <path d={`M0,0 L${w},0 L${wavy(w, thawY, 9, 1.3).slice().reverse().map((q, i) => (i === 0 ? 'L' : 'L') + q).join(' ')} Z`} fill={TH.peat} />
        <path d={`M0,${thawY - 30} ${wavy(w, thawY - 26, 7, 2.1).map((q) => 'L' + q).join(' ')} L${w},${thawY + 4} L0,${thawY + 4} Z`} fill={TH.peatDeep} opacity={0.5} />
        {specks.filter((s) => s.sy < thawY - 4).map((s, i) => <circle key={i} cx={s.sx} cy={s.sy} r={s.sr} fill={i % 3 ? TH.peatHi : TH.peatDeep} opacity={0.7} />)}
        {/* the mat on top, moss when whole, char when burned */}
        <path d={`M0,0 L${w},0 ${wavy(w, matH, 6, 3.7).slice().reverse().map((q) => 'L' + q).join(' ')} Z`} fill={burned ? TH.char : TH.moss} />
        <path d={`M0,${matH - 12} ${wavy(w, matH - 6, 4, 4.4).map((q) => 'L' + q).join(' ')} L${w},${matH + 6} L0,${matH + 6} Z`} fill={burned ? TH.charHi : TH.mossDeep} opacity={0.7} />
        {/* root threads hanging into the peat */}
        {Array.from({length: 10}).map((_, i) => <path key={i} d={`M${hash(i + 120) * w},${matH} q${(hash(i + 121) - 0.5) * 30},${20 + hash(i + 122) * 40} ${(hash(i + 123) - 0.5) * 24},${50 + hash(i + 124) * 60}`} fill="none" stroke={burned ? TH.charHi : TH.mossDeep} strokeWidth={3} strokeLinecap="round" opacity={0.7} />)}
        {Array.from({length: 14}).map((_, i) => <circle key={i} cx={hash(i + 30) * w} cy={hash(i + 31) * (matH - 8)} r={3 + hash(i + 32) * 4} fill={burned ? TH.charHi : TH.mossHi} opacity={0.8} />)}
        {/* the thaw front: a hot edge when the ground is burned and still giving way */}
        {glow > 0.02 && (
          <g opacity={glow}>
            <path d={`M0,${thawY - 22} ${wavy(w, thawY - 14, 8, 1.3).map((q) => 'L' + q).join(' ')} L${w},${thawY + 22} L0,${thawY + 22} Z`} fill={TH.thawGlow} opacity={0.4} style={{mixBlendMode: 'screen'}} />
            <path d={`M0,${thawY - 6} ${wavy(w, thawY, 9, 1.3).map((q) => 'L' + q).join(' ')} L${w},${thawY + 6} L0,${thawY + 6} Z`} fill={TH.ember} opacity={0.35} style={{mixBlendMode: 'screen'}} />
          </g>
        )}
      </g>
      <rect x={-w / 2} y={0} width={w} height={h} fill="none" stroke={INK} strokeWidth={8} />
      {/* the surface line and what stands on it */}
      <line x1={-w / 2 - 40} y1={0} x2={w / 2 + 40} y2={0} stroke={INK} strokeWidth={6} />
      {blades.map((b, i) => burned
        ? (i % 4 === 0 ? <path key={i} d={`M${b.bx},0 L${b.bx + b.bl * 0.5},${-b.bh * 1.4} L${b.bx + 7},0 Z`} fill={TH.char} stroke={INK} strokeWidth={2.4} /> : null)
        : <path key={i} d={`M${b.bx},0 Q${b.bx + b.bl * 0.5},${-b.bh * 0.6} ${b.bx + b.bl},${-b.bh} L${b.bx + 6},0 Z`} fill={i % 2 ? TH.mossHi : TH.moss} stroke={INK} strokeWidth={2.2} />)}
      {burned && Array.from({length: 4}).map((_, i) => (
        <circle key={i} cx={-w / 2 + 70 + i * 95 + 10 * Math.sin(f / 30 + i)} cy={-12 - ((f / 3 + i * 40) % 90)} r={5 + i % 2 * 2} fill={TH.ash} opacity={0.28} />
      ))}
      {/* carbon lifting out of the peat */}
      {motes.map((m, i) => (
        <g key={i} opacity={m.mo * 0.95} transform={`translate(${m.mx},${m.my})`}>
          <circle r={7} fill={TH.ember} stroke={INK} strokeWidth={2.4} />
          <circle r={3} cx={-1.5} cy={-1.5} fill={TH.emberHi} />
        </g>
      ))}
      {ruler && Array.from({length: Math.floor(h / ftPx) + 1}).map((_, i) => (
        <g key={i} transform={`translate(${-w / 2 - 14},${i * ftPx})`}>
          <line x1={0} y1={0} x2={-34} y2={0} stroke="#F4EEDC" strokeWidth={5} strokeLinecap="round" />
          <line x1={0} y1={0} x2={-34} y2={0} stroke={INK} strokeWidth={1.5} opacity={0.6} />
          {i > 0 && (
            <text x={-42} y={8} textAnchor="end" fontFamily={MONO} fontWeight={800} fontSize={24} letterSpacing={1} fill="#F4EEDC" stroke={INK} strokeWidth={5} paintOrder="stroke">{`${i} FT`}</text>
          )}
        </g>
      ))}
    </g>
  );
};

type ProbeProps = {x: number; y: number; depth: number; f: number; ftPx?: number; len?: number; tilt?: number; id?: string; jolt?: number};

/** a plain steel rod with a rubber T handle and ticks every quarter foot, a long tick at each foot. `y` is the ground surface the tip enters. */
export const ThawProbe: React.FC<ProbeProps> = ({x, y, depth, f, ftPx = 150, len = 620, tilt = 0, id = 'tp', jolt = 0}) => {
  const rod = tones(TH.steel);
  const tipY = y + depth;
  const topY = tipY - len;
  const rw = 22;
  const ticks: number[] = [];
  for (let d = 0; d <= len; d += ftPx / 4) ticks.push(d);
  const shake = jolt * 5 * Math.sin(f * 2.3);
  return (
    <g>
      <ContactShadow cx={x + 10} cy={y + 6} rx={46} ry={9} opacity={0.38} />
      <g transform={`translate(${x + shake},${tipY}) rotate(${tilt})`}>
        <FormGradient id={`${id}_r`} t={rod} softness={0.9} />
        <FormGradient id={`${id}_h`} t={tones(TH.rubber)} softness={0.9} />
        {/* the rod, drawn upward from the tip */}
        <path d={`M0,0 L${rw / 2},-30 L${rw / 2},${-len} L${-rw / 2},${-len} L${-rw / 2},-30 Z`} fill={`url(#${id}_r)`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d={`M${-rw / 2 + 4},-30 L${-rw / 2 + 4},${-len + 6}`} stroke="#F4F7FA" strokeWidth={3} opacity={0.7} strokeLinecap="round" />
        {ticks.map((d, i) => {
          const isFoot = Math.abs((d / ftPx) - Math.round(d / ftPx)) < 0.001;
          return <line key={i} x1={-rw / 2} y1={-d} x2={-rw / 2 + (isFoot ? rw : rw * 0.55)} y2={-d} stroke={INK} strokeWidth={isFoot ? 4 : 2.4} opacity={0.85} />;
        })}
        {/* the T handle */}
        <g transform={`translate(0,${-len})`}>
          <rect x={-70} y={-28} width={140} height={34} rx={14} fill={`url(#${id}_h)`} stroke={INK} strokeWidth={5} />
          <rect x={-56} y={-23} width={112} height={7} rx={3.5} fill="#F4EEDC" opacity={0.28} />
          {[-48, -24, 0, 24, 48].map((gx) => <line key={gx} x1={gx} y1={-24} x2={gx} y2={0} stroke={INK} strokeWidth={2} opacity={0.5} />)}
          <rect x={-14} y={4} width={28} height={16} fill={`url(#${id}_r)`} stroke={INK} strokeWidth={4} />
        </g>
      </g>
    </g>
  );
};
