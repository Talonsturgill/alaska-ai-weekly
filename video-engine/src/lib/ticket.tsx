import React from 'react';

// =============================================================================
// THE TICKET KIT (NET-NEW 2026-11-10, "Take a Number")
// TakeANumberMachine: a fat vermilion deli-counter dispenser with no face. Posture and clack carry it:
//   flip 0..1 snaps the NOW SERVING sign over, print 0..1 pushes a ticket out of the slot, shake 0..1 clacks the box.
// Ticket: a paper stub with serrated notches, a vermilion edge band, a number, optional stamps and a split.
// Both are drawn at the origin on their base so a scene can stand them on any ground line.
// Reusable for any permit, queue or place-in-line story.
// =============================================================================

const INK = '#0B1226';
const VERM = '#D6372B';
const VERM_D = '#8E1F18';
const PAPER = '#F2E8D0';
const BRASS = '#D9A441';

export const Ticket: React.FC<{
  x?: number; y?: number; s?: number; rot?: number; num?: string; stamps?: string[]; stampK?: number;
  split?: number; labels?: [string, string]; curl?: number; ghost?: boolean; mono?: string;
}> = ({x = 0, y = 0, s = 1, rot = 0, num = 'P-15423', stamps = [], stampK = 1, split = 0, labels = ['STUDY', 'OUTREACH'], curl = 0, ghost = false, mono = "'JetBrains Mono', monospace"}) => {
  const sp = Math.max(0, Math.min(1, split));
  const half = (side: -1 | 1) => (
    <g transform={`translate(${side * (14 + 120 * sp) * 1} ${-30 * sp}) rotate(${side * 14 * sp})`}>
      <clipPath id={`tk${side > 0 ? 'r' : 'l'}${Math.round(x)}${Math.round(y)}`}>
        <rect x={side > 0 ? 0 : -90} y={-120} width={90} height={240} />
      </clipPath>
      <g clipPath={`url(#tk${side > 0 ? 'r' : 'l'}${Math.round(x)}${Math.round(y)})`}>
        <path d="M -90,-120 H 90 V 120 H -90 Z" fill={ghost ? 'none' : PAPER} stroke={ghost ? PAPER : INK} strokeWidth={6} strokeDasharray={ghost ? '14 10' : undefined} />
        <rect x={-90} y={-120} width={180} height={44} fill={ghost ? 'none' : VERM} stroke={INK} strokeWidth={5} />
        <text y={-88} textAnchor="middle" fontFamily={mono} fontWeight={900} fontSize={22} letterSpacing={3} fill={PAPER}>FERC</text>
        <text y={-6} textAnchor="middle" fontFamily={mono} fontWeight={900} fontSize={30} letterSpacing={1} fill={INK}>{num}</text>
        {[-60, -30, 0, 30, 60].map((nx) => <rect key={nx} x={nx - 4} y={40} width={8} height={50} fill={INK} opacity={0.55} />)}
      </g>
      {sp > 0.5 && (
        <g opacity={Math.min(1, (sp - 0.5) * 3)}>
          <rect x={side > 0 ? 6 : -84} y={8} width={78} height={34} rx={4} fill={BRASS} stroke={INK} strokeWidth={4} />
          <text x={side > 0 ? 45 : -45} y={32} textAnchor="middle" fontFamily={mono} fontWeight={900} fontSize={side > 0 ? 18 : 18} fill={INK}>{labels[side > 0 ? 1 : 0]}</text>
        </g>
      )}
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {sp > 0.01 ? (
        <g>{half(-1)}{half(1)}</g>
      ) : (
        <g transform={`rotate(${-8 * curl})`}>
          <path d="M -90,-120 H 90 V 120 H -90 Z" fill={ghost ? 'none' : PAPER} stroke={ghost ? PAPER : INK} strokeWidth={6} strokeDasharray={ghost ? '14 10' : undefined} />
          <rect x={-90} y={-120} width={180} height={44} fill={ghost ? 'none' : VERM} stroke={INK} strokeWidth={5} />
          <text y={-88} textAnchor="middle" fontFamily={mono} fontWeight={900} fontSize={22} letterSpacing={3} fill={PAPER}>FERC</text>
          <text y={-6} textAnchor="middle" fontFamily={mono} fontWeight={900} fontSize={30} letterSpacing={1} fill={INK}>{num}</text>
          {[-60, -30, 0, 30, 60].map((nx) => <rect key={nx} x={nx - 4} y={40} width={8} height={50} fill={INK} opacity={0.55} />)}
          {[-100, 100].map((nx) => [-60, -10, 40, 90].map((ny) => <circle key={`${nx}${ny}`} cx={nx} cy={ny} r={9} fill="#1B2342" />))}
          {stamps.map((t, i) => (
            <g key={t} transform={`translate(${i % 2 ? 12 : -10} ${50 + 34 * i}) rotate(${i % 2 ? 9 : -11}) scale(${0.7 + 0.3 * Math.min(1, stampK)})`} opacity={Math.min(1, stampK * 2)}>
              <rect x={-84} y={-17} width={168} height={34} rx={4} fill="none" stroke={INK} strokeWidth={5} />
              <text y={7} textAnchor="middle" fontFamily={mono} fontWeight={900} fontSize={t.length > 11 ? 14 : 17} fill={INK}>{t}</text>
            </g>
          ))}
        </g>
      )}
    </g>
  );
};

export const TakeANumberMachine: React.FC<{
  f: number; x?: number; y?: number; s?: number; flip?: number; print?: number; shake?: number; sign?: string; head?: string; mono?: string;
}> = ({f, x = 0, y = 0, s = 1, flip = 0, print = 0, shake = 0, sign = 'P-15423', head = 'NOW SERVING', mono = "'JetBrains Mono', monospace"}) => {
  const k = Math.max(0, Math.min(1, flip));
  const pr = Math.max(0, Math.min(1, print));
  const sh = shake * 5 * Math.sin(f * 2.1);
  const breathe = 1 + 0.01 * Math.sin(f / 17);
  return (
    <g transform={`translate(${x + sh} ${y}) scale(${s * breathe} ${s / breathe})`}>
      <ellipse cx={0} cy={6} rx={170} ry={18} fill="#000" opacity={0.4} />
      {[-110, 110].map((fx) => <rect key={fx} x={fx - 26} y={-22} width={52} height={26} rx={8} fill={VERM_D} stroke={INK} strokeWidth={6} />)}
      <rect x={-130} y={-290} width={260} height={278} rx={26} fill={VERM} stroke={INK} strokeWidth={9} />
      <rect x={-130} y={-290} width={260} height={58} rx={26} fill={VERM_D} stroke={INK} strokeWidth={9} />
      <path d="M -112,-210 q 112,22 224,0" fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={0.28} />
      {[-110, 110].map((sx) => [-270, -34].map((sy) => <circle key={`${sx}${sy}`} cx={sx} cy={sy} r={6} fill={BRASS} stroke={INK} strokeWidth={3} />))}
      <rect x={-84} y={-190} width={168} height={70} rx={10} fill="#1B2342" stroke={INK} strokeWidth={6} />
      <text y={-143} textAnchor="middle" fontFamily={mono} fontWeight={900} fontSize={26} letterSpacing={3} fill={PAPER}>TAKE A NUMBER</text>
      <rect x={-64} y={-98} width={128} height={22} rx={6} fill={INK} stroke={INK} strokeWidth={4} />
      <g transform={`translate(0 ${-86 + 62 * pr})`}>
        <rect x={-48} y={-4} width={96} height={80} fill={PAPER} stroke={INK} strokeWidth={4} opacity={pr > 0.02 ? 1 : 0} />
        <rect x={-48} y={-4} width={96} height={16} fill={VERM_D} opacity={pr > 0.02 ? 1 : 0} />
      </g>
      <rect x={-72} y={-78} width={144} height={14} rx={5} fill={VERM_D} stroke={INK} strokeWidth={4} />
      <circle cx={92} cy={-52} r={16} fill={BRASS} stroke={INK} strokeWidth={5} />
      <circle cx={92} cy={-52} r={6} fill={INK} />
      <g transform="translate(0 -346)">
        <rect x={-6} y={0} width={12} height={58} fill={INK} />
        <g transform={`translate(0 -2) scale(1 ${Math.abs(Math.cos(k * Math.PI))})`}>
          <rect x={-116} y={-64} width={232} height={72} rx={10} fill={k > 0.5 ? BRASS : PAPER} stroke={INK} strokeWidth={7} />
          <text y={-40} textAnchor="middle" fontFamily={mono} fontWeight={900} fontSize={16} letterSpacing={2} fill={INK}>{head}</text>
          <text y={-10} textAnchor="middle" fontFamily={mono} fontWeight={900} fontSize={sign.length > 9 ? 22 : 28} letterSpacing={1} fill={INK}>{sign}</text>
        </g>
      </g>
    </g>
  );
};
