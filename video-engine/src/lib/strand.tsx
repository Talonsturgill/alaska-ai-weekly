import React from 'react';

// lib/strand.tsx, NET-NEW 2026-11-08 ("The Ground Takes Notes"). The buried-instrument family.
// STRAND is a long horizontal fiber cable with a round plug head that carries a face (ivory body, turquoise ferrule, travelling cyan pulse).
// KNOT is a six node network with eyes. HEAT is a steel solver box with a gauge, rivets and a porthole. DIAL is a brass accuracy dial whose
// window can be taped over in coral. RIBBON is a paper record tape that prints ticks and extends as dotted unlit years.
// Palette roles are out/dispatch/art_direction.json: coral is the missing number ONLY, lilac is the twin ghost ONLY, chartreuse is the separate study ONLY.

export const ST = {
  // REBASED twice 2026-11-08 after the Gate 0 critics. Field names are historical, VALUES are the licence:
  // navy = pale overcast sky, ground = deep umber, glacier = bone-white ice, glacierD = ice shadow, honey = terracotta thaw (line and drop ONLY),
  // ivory = violet Strand body (Strand ONLY), turq = Strand's white core, lilac = ink line, chart = ink (separate study is black and white newsprint),
  // coral = caution yellow (the tape ONLY), steel/pewter = instruments, brass fields = pewter, cyan = white pulse.
  navy: '#D8DEE4', ground: '#2E2A24', glacier: '#EEF2F2', glacierD: '#A9B6BA', honey: '#B5583A', honeyD: '#7A3620', ivory: '#6F3DF0', ivoryD: '#4A22B8',
  turq: '#EDE6FF', turqD: '#4A22B8', ink: '#0E1020', paper: '#F4F6F7', road: '#5E5A55', roadD: '#37332E', lilac: '#1C1F2A', chart: '#1C1F2A', chartD: '#0E1020',
  coral: '#FFD21F', steel: '#7A8087', steelD: '#4B5057', brass: '#D3D5D6', brassL: '#F1F2F3', brassD: '#86898C', cyan: '#F4F1FF',
  stone: '#A39A88', umber: '#5C5446', umberD: '#2E2A24',
};
export const STMONO = "'JetBrains Mono', ui-monospace, monospace";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export type StrandMood = 'startled' | 'calm' | 'proud' | 'sag' | 'curious' | 'wry' | 'hopeful' | 'asleep';

/** STRAND. (x, y) is the centre of the plug head; the body runs left to (x - len, y) along a gentle wave. facing=-1 mirrors it. */
export const Strand: React.FC<{x: number; y: number; f: number; s?: number; len?: number; mood?: StrandMood; look?: number; draw?: number; face?: boolean; pulse?: boolean; dim?: number; sag?: number; seed?: number; id?: string; w?: number; flush?: number}> =
({x, y, f, s = 1, len = 1100, mood = 'calm', look = 0, draw = 1, face = true, pulse = true, dim = 1, sag = 0, seed = 0, id = 'st', w = 40, flush = 0}) => {
  const blink = ((f + seed * 41) % 124) < 4 ? 0.12 : 1;
  const breath = 1 + 0.025 * Math.sin((f + seed * 13) / 17);
  const wob = 5 * Math.sin((f + seed * 29) / 33);
  const L = len * clamp01(draw);
  const sg = sag * 46;
  const d = `M 0,0 C ${-L * 0.25},${wob + sg * 0.3} ${-L * 0.55},${-wob * 0.8 + sg} ${-L},${sg * 0.6 + wob * 0.3}`;
  const brow = mood === 'startled' ? [-9, -9] : mood === 'sag' ? [8, 8] : mood === 'wry' ? [4, -8] : mood === 'proud' ? [-5, -5] : mood === 'curious' ? [-6, 4] : mood === 'asleep' ? [4, 4] : [0, 0];
  const mouth = mood === 'startled' ? 'M-10,30 Q0,44 10,30 Q0,36 -10,30' : mood === 'sag' ? 'M-14,36 Q0,26 14,36' : mood === 'proud' ? 'M-16,28 Q0,46 16,28' : mood === 'wry' ? 'M-14,34 Q-2,38 14,26' : mood === 'hopeful' ? 'M-14,30 Q0,44 14,30' : mood === 'asleep' ? 'M-8,34 Q0,38 8,34' : 'M-12,32 Q0,40 12,32';
  const eyeOpen = mood === 'asleep' ? 0.1 : blink;
  const p = f * 14 % 1200;
  return (
    <g opacity={dim} transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={-L / 2} cy={w * 0.9 + sg * 0.5} rx={Math.max(60, L / 2)} ry={10} fill="#000" opacity={0.24} />
      <path d={d} fill="none" stroke={ST.ink} strokeWidth={w + 10} strokeLinecap="round" />
      <path d={d} fill="none" stroke={ST.ivoryD} strokeWidth={w} strokeLinecap="round" transform={`translate(0 ${w * 0.12})`} />
      <path d={d} fill="none" stroke={ST.ivory} strokeWidth={w * 0.86} strokeLinecap="round" />
      <path d={d} fill="none" stroke={ST.turq} strokeWidth={w * 0.34} strokeLinecap="round" opacity={0.75} />
      <path d={d} fill="none" stroke="#fff" strokeWidth={w * 0.16} strokeLinecap="round" opacity={0.5} transform={`translate(0 ${-w * 0.28})`} />
      {flush > 0 && <path d={d} fill="none" stroke={ST.honey} strokeWidth={w * 0.5} strokeLinecap="round" opacity={0.35 * Math.abs(Math.sin(f / 9))} />}
      {pulse && draw > 0.95 && <path d={d} fill="none" stroke={ST.cyan} strokeWidth={w * 0.3} strokeLinecap="round" strokeDasharray="70 420" strokeDashoffset={-p} opacity={0.9} />}
      {Array.from({length: Math.floor(L / 170)}).map((_, i) => <rect key={i} x={-120 - i * 170 - 6} y={-w / 2 - 2} width={12} height={w + 4} rx={4} fill={ST.turqD} opacity={0.6} />)}
      <g transform={`scale(${breath} ${2 - breath})`}>
        <rect x={-48} y={-58} width={132} height={116} rx={30} fill={ST.ink} />
        <defs><linearGradient id={`pg${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9B7BFF" /><stop offset="0.55" stopColor={ST.ivory} /><stop offset="1" stopColor={ST.ivoryD} /></linearGradient></defs>
        <rect x={-44} y={-54} width={124} height={108} rx={28} fill={`url(#pg${id})`} />
        <ellipse cx={46} cy={-34} rx={26} ry={9} fill="#FFFFFF" opacity={0.35} />
        <rect x={-44} y={34} width={124} height={20} rx={14} fill="#000" opacity={0.18} />
        <rect x={-44} y={-54} width={34} height={108} rx={20} fill={ST.turq} stroke={ST.ink} strokeWidth={5} />
        <path d="M-38,-46 Q-8,-62 40,-52" fill="none" stroke="#fff" strokeWidth={6} opacity={0.5} strokeLinecap="round" />
        <rect x={-44} y={-54} width={124} height={108} rx={28} fill="none" stroke={ST.ink} strokeWidth={6} />
        {face && (
          <g transform="translate(26 -2)">
            {[-1, 1].map((sd) => (
              <g key={sd} transform={`translate(${sd * 22} -12)`}>
                <ellipse rx={13} ry={16 * eyeOpen} fill="#fff" stroke={ST.ink} strokeWidth={3.5} />
                <circle cx={look * 5} cy={mood === 'sag' ? 4 : 1} r={6.5} fill={ST.ink} />
                <path d={`M-14,${-22 + brow[sd > 0 ? 1 : 0]} L14,${-22 - brow[sd > 0 ? 1 : 0] * 0.4}`} stroke={ST.ink} strokeWidth={4.5} strokeLinecap="round" />
              </g>
            ))}
            <path d={mouth} fill={mood === 'startled' ? '#7A1F2A' : 'none'} stroke={ST.ink} strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" />
            {mood === 'proud' && <ellipse cx={-34} cy={14} rx={9} ry={5} fill={ST.coral} opacity={0.0} />}
          </g>
        )}
      </g>
    </g>
  );
};

/** KNOT: a six node network with eyes. guess 0..1 makes its dotted guesses settle to solid. */
export const Knot: React.FC<{x: number; y: number; f: number; s?: number; guess?: number; wave?: number; dotted?: boolean}> = ({x, y, f, s = 1, guess = 0, wave = 0, dotted = true}) => {
  const nodes: Array<[number, number]> = [[-34, -20], [0, -34], [34, -18], [-30, 20], [4, 32], [36, 18]];
  const edges: Array<[number, number]> = [[0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5], [1, 3], [1, 5]];
  const j = (i: number) => ({dx: (1 - guess) * 3.2 * Math.sin(f / 5 + i * 2.1), dy: (1 - guess) * 3.2 * Math.cos(f / 6 + i * 1.7)});
  const blink = (f % 110) < 4 ? 0.15 : 1;
  const dash = dotted && guess < 0.98 ? '5 6' : undefined;
  return (
    <g transform={`translate(${x} ${y + 3 * Math.sin(f / 13)}) scale(${s}) rotate(${wave * 8 * Math.sin(f / 4)})`}>
      {edges.map(([a, b], i) => <line key={i} x1={nodes[a][0] + j(a).dx} y1={nodes[a][1] + j(a).dy} x2={nodes[b][0] + j(b).dx} y2={nodes[b][1] + j(b).dy} stroke={ST.lilac} strokeWidth={4} strokeDasharray={dash} strokeLinecap="round" />)}
      {nodes.map((n, i) => <circle key={i} cx={n[0] + j(i).dx} cy={n[1] + j(i).dy} r={9} fill={ST.paper} stroke={ST.ink} strokeWidth={3.5} />)}
      {[-1, 1].map((sd) => (
        <g key={sd} transform={`translate(${sd * 11} -2)`}>
          <ellipse rx={7.5} ry={9 * blink} fill="#fff" stroke={ST.ink} strokeWidth={2.6} />
          <circle cx={sd * 1.2} cy={1} r={3.4} fill={ST.ink} />
        </g>
      ))}
      <path d="M-7,12 Q0,17 7,12" fill="none" stroke={ST.ink} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

/** HEAT: the physics solver, a steel box with a gauge, rivets, vents and a round porthole. children draw inside the porthole (centre 0,0 radius 74). */
export const Heat: React.FC<{x: number; y: number; f: number; s?: number; needle?: number; label?: string; children?: React.ReactNode}> = ({x, y, f, s = 1, needle = 0.5, label = 'HEAT SOLVER', children}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={210} rx={250} ry={22} fill="#000" opacity={0.28} />
    <rect x={-260} y={-190} width={520} height={400} rx={34} fill={ST.steelD} stroke={ST.ink} strokeWidth={9} />
    <rect x={-248} y={-178} width={496} height={376} rx={28} fill={ST.steel} />
    <rect x={-248} y={-178} width={496} height={110} rx={28} fill="#fff" opacity={0.12} />
    {[-224, 224].flatMap((rx) => [-154, 174].map((ry) => <circle key={`${rx}${ry}`} cx={rx} cy={ry} r={9} fill={ST.steelD} stroke={ST.ink} strokeWidth={3} />))}
    {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={-216} y={80 + i * 22} width={104} height={9} rx={4} fill={ST.ink} opacity={0.7} />)}
    <circle cx={0} cy={-6} r={96} fill={ST.ink} />
    <circle cx={0} cy={-6} r={86} fill="#1B2347" stroke={ST.brassD} strokeWidth={7} />
    <g transform="translate(0 -6)" data-band="ok">{children}</g>
    <circle cx={0} cy={-6} r={86} fill="none" stroke="#fff" strokeWidth={4} opacity={0.18} strokeDasharray="60 340" />
    <g transform="translate(156 96)">
      <circle r={50} fill={ST.paper} stroke={ST.ink} strokeWidth={6} />
      {Array.from({length: 9}).map((_, i) => { const a = (-210 + i * 30) * Math.PI / 180; return <line key={i} x1={Math.cos(a) * 36} y1={Math.sin(a) * 36} x2={Math.cos(a) * 44} y2={Math.sin(a) * 44} stroke={ST.ink} strokeWidth={3} />; })}
      <line x1={0} y1={0} x2={Math.cos((-210 + 240 * needle + 2 * Math.sin(f / 7)) * Math.PI / 180) * 34} y2={Math.sin((-210 + 240 * needle + 2 * Math.sin(f / 7)) * Math.PI / 180) * 34} stroke={ST.coral} strokeWidth={0} />
      <line x1={0} y1={0} x2={Math.cos((-210 + 240 * needle + 2 * Math.sin(f / 7)) * Math.PI / 180) * 34} y2={Math.sin((-210 + 240 * needle + 2 * Math.sin(f / 7)) * Math.PI / 180) * 34} stroke={ST.ink} strokeWidth={5} strokeLinecap="round" />
      <circle r={6} fill={ST.ink} />
    </g>
    <rect x={-130} y={-176} width={0} height={0} />
    <text x={0} y={190} textAnchor="middle" fontFamily={STMONO} fontWeight={800} fontSize={20} letterSpacing={2} fill="#1C1F2A">{label}</text>
  </g>
);

/** DIAL: the brass accuracy dial. tape 0..1 covers the window in a coral strip (1 fully taped), peel 0..1 lifts it, the window is EMPTY (never a digit). */
export const Dial: React.FC<{x: number; y: number; f: number; s?: number; tape?: number; peel?: number; rot?: number; hang?: boolean; wobble?: number; label?: string}> = ({x, y, f, s = 1, tape = 1, peel = 0, rot = 0, hang = true, wobble = 1, label = 'ACCURACY'}) => {
  const sw = wobble * 4 * Math.sin(f / 15);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + sw}) scale(${s})`}>
      {hang && <path d="M0,-120 V-190" stroke={ST.ink} strokeWidth={6} />}
      <ellipse cx={4} cy={150} rx={104} ry={13} fill="#000" opacity={0.24} />
      <circle r={118} fill={ST.brassD} stroke={ST.ink} strokeWidth={8} />
      <circle r={106} fill={ST.brass} stroke={ST.brassL} strokeWidth={5} />
      <circle r={88} fill={ST.paper} stroke={ST.ink} strokeWidth={5} />
      {Array.from({length: 11}).map((_, i) => { const a = (-220 + i * 26) * Math.PI / 180; return <line key={i} x1={Math.cos(a) * 66} y1={Math.sin(a) * 66} x2={Math.cos(a) * 80} y2={Math.sin(a) * 80} stroke={ST.ink} strokeWidth={4} />; })}
      <rect x={-52} y={4} width={104} height={46} rx={8} fill="#F6F9FA" stroke={ST.ink} strokeWidth={5} />
      <rect x={-46} y={9} width={92} height={10} rx={5} fill="#FFFFFF" opacity={0.8} />
      <circle cx={0} cy={27} r={5} fill={ST.ink} opacity={0.5} />
      <rect x={-66} y={tape > 0 ? 6 : 6} width={132} height={42} rx={4} fill={ST.coral} stroke={ST.ink} strokeWidth={4} transform={`rotate(${-5 - peel * 38} -66 27)`} opacity={tape * (1 - clamp01((peel - 0.8) / 0.2))} />
      <text y={-34} textAnchor="middle" fontFamily={STMONO} fontWeight={800} fontSize={17} letterSpacing={2} fill={ST.ink}>{label}</text>
      {tape > 0.5 && peel < 0.3 && <path d="M-40,20 L40,34 M-36,34 L44,20" stroke="#fff" strokeWidth={3} opacity={0.35} />}
      <circle r={9} fill={ST.ink} />
    </g>
  );
};

/** RIBBON: a paper record tape. ticks 0..1 prints, ext 0..1 draws ten unlit dotted years beyond the inked run. */
export const Ribbon: React.FC<{x: number; y: number; w?: number; h?: number; f: number; ticks?: number; ext?: number; rot?: number; label?: boolean; glow?: number}> = ({x, y, w = 820, h = 64, f, ticks = 1, ext = 0, rot = 0, label = true, glow = 0}) => {
  const n = 33;
  const inked = Math.round(n * clamp01(ticks));
  const cell = (w * 0.72) / n;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={0} y={-h / 2 + 6} width={w * clamp01(ticks > 0 ? 1 : 0)} height={h} rx={5} fill="#000" opacity={0.22} />
      <rect x={0} y={-h / 2} width={w} height={h} rx={5} fill={ST.paper} stroke={ST.ink} strokeWidth={5} />
      {glow > 0 && <rect x={0} y={-h / 2} width={w} height={h} rx={5} fill="none" stroke={ST.cyan} strokeWidth={5} opacity={glow} />}
      {Array.from({length: inked}).map((_, i) => <rect key={i} x={14 + i * cell} y={-h / 2 + 10} width={Math.max(3, cell * 0.5)} height={h - 20} rx={2} fill={i % 3 === 0 ? '#5C5446' : '#9AA3A8'} opacity={0.9} />)}
      {ext > 0 && Array.from({length: 10}).map((_, i) => {
        const k = clamp01(ext * 10 - i);
        return <rect key={`e${i}`} x={14 + n * cell + 8 + i * (w * 0.24 / 10)} y={-h / 2 + 10} width={Math.max(3, w * 0.24 / 10 - 7)} height={h - 20} rx={2} fill="none" stroke={ST.ink} strokeWidth={3} strokeDasharray="5 5" opacity={k * (0.45 + 0.4 * Math.abs(Math.sin(f / 14 + i)))} />;
      })}
      {label && <text x={14} y={h / 2 + 30} fontFamily={STMONO} fontWeight={800} fontSize={18} letterSpacing={2} fill="#4B5057">SEPT 2021</text>}
      {label && <text x={14 + n * cell} y={h / 2 + 30} textAnchor="end" fontFamily={STMONO} fontWeight={800} fontSize={18} letterSpacing={2} fill="#4B5057">JUNE 2024</text>}
    </g>
  );
};

/** TAG: a brass tag on a string, marked with one short string. swing 0..1 drops it in. */
export const NumTag: React.FC<{x: number; y: number; f: number; text?: string; drop?: number; s?: number; lock?: number}> = ({x, y, f, text = '10', drop = 1, s = 1, lock = 0}) => {
  const k = clamp01(drop);
  const sw = (1 - lock) * 7 * Math.sin(f / 9) * (1 - k * 0.3);
  return (
    <g transform={`translate(${x} ${y - 340 * (1 - k)}) rotate(${sw} 0 -50) scale(${s})`} opacity={clamp01(k * 3)}>
      <path d="M0,-90 V-24" stroke={ST.ink} strokeWidth={5} />
      <rect x={-52} y={-24} width={104} height={86} rx={12} fill={ST.brass} stroke={ST.ink} strokeWidth={6} />
      <rect x={-44} y={-16} width={88} height={70} rx={8} fill={ST.brassL} stroke={ST.brassD} strokeWidth={3} />
      <circle cx={0} cy={-8} r={5} fill={ST.ink} />
      <text x={0} y={42} textAnchor="middle" fontFamily={STMONO} fontWeight={900} fontSize={text.length > 2 ? 22 : 44} fill={ST.ink}>{text}</text>
    </g>
  );
};
