import React from 'react';

const INK = '#071024';
const LIME = '#D7FF45';
const CORAL = '#FF7548';
const PEARL = '#F5F0DF';

export const HydrokineticTurbine: React.FC<{
  f: number; x?: number; y?: number; scale?: number; proposed?: boolean; energy?: number;
}> = ({f, x = 0, y = 0, scale = 1, proposed = true, energy = 0}) => {
  const spin = f * (1.1 + energy * 2.2);
  return <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={0.55 + energy * 0.4}>
    <path d="M0 70V190M-58 190H58" fill="none" stroke={PEARL} strokeWidth={10}
      strokeLinecap="round" strokeDasharray={proposed ? '18 12' : undefined}/>
    <circle r={70} fill="none" stroke={LIME} strokeWidth={7}
      strokeDasharray={proposed ? '16 11' : undefined}/>
    <g transform={`rotate(${spin})`}>
      {[0, 120, 240].map((a) => <path key={a} d="M0 0Q22-19 18-61Q-16-53-18-12Z"
        transform={`rotate(${a})`} fill={LIME} fillOpacity={proposed ? 0.12 : 0.7}
        stroke={LIME} strokeWidth={4}/>) }
    </g>
    <circle r={13} fill={CORAL} stroke={INK} strokeWidth={4}/>
  </g>;
};

export const SubseaHive: React.FC<{
  f: number; x?: number; y?: number; scale?: number; proposed?: boolean;
  awake?: number; open?: number;
}> = ({f, x = 0, y = 0, scale = 1, proposed = true, awake = 0.7, open = 0}) => {
  const bob = Math.sin(f / 21) * 4;
  const dash = proposed ? '18 11' : undefined;
  return <g transform={`translate(${x} ${y + bob}) scale(${scale})`}>
    <path d="M-112-72L0-132L112-72V72L0 132L-112 72Z" fill={proposed ? '#183858' : '#2A6080'}
      fillOpacity={proposed ? 0.25 : 1} stroke={LIME} strokeWidth={8} strokeDasharray={dash}/>
    <path d="M-71-66H71V66H-71Z" fill="none" stroke={PEARL} strokeWidth={5} strokeDasharray={dash}/>
    {[[-35, -22], [35, -22]].map(([cx, cy], i) => <g key={i} opacity={awake}>
      <circle cx={cx} cy={cy} r={13} fill={LIME}/><circle cx={cx + 3} cy={cy} r={5} fill={INK}/>
    </g>)}
    <path d={`M-28 28Q0 ${36 + open * 18} 28 28`} fill="none" stroke={PEARL} strokeWidth={5} strokeLinecap="round"/>
    {[[-135, -42], [135, -42], [-135, 42], [135, 42]].map(([px, py], i) =>
      <path key={i} d={`M${px > 0 ? 108 : -108} ${py}H${px}`} stroke={CORAL} strokeWidth={7}
        strokeDasharray={dash} strokeLinecap="round"/>)}
    <text x={0} y={184} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize={24}
      fontWeight={800} fill={PEARL}>PROPOSED HIVE</text>
  </g>;
};

export const ArmoredCable: React.FC<{
  d: string; progress?: number; conditional?: boolean; label?: string;
}> = ({d, progress = 1, conditional = false, label}) => {
  const p = Math.max(0, Math.min(1, progress));
  return <g>
    <path d={d} pathLength={100} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round"
      strokeDasharray={`${p * 100} 100`} />
    <path d={d} pathLength={100} fill="none" stroke={conditional ? CORAL : LIME} strokeWidth={10}
      strokeLinecap="round" strokeDasharray={conditional ? `${Math.max(1, p * 10)} 5 100` : `${p * 100} 100`} />
    {label && <text x={540} y={1215} textAnchor="middle" fontFamily="JetBrains Mono, monospace"
      fontSize={25} fontWeight={800} fill={conditional ? CORAL : PEARL}>{label}</text>}
  </g>;
};

export const ProposedArray: React.FC<{f: number; progress?: number}> = ({f, progress = 1}) => {
  const count = Math.max(1, Math.floor(18 * Math.max(0, Math.min(1, progress))));
  return <g>
    {Array.from({length: count}, (_, i) => {
      const col = i % 6, row = Math.floor(i / 6);
      return <g key={i} opacity={0.45 + 0.45 * Math.sin((i + 1) * 1.7)}>
        <HydrokineticTurbine f={f + i * 9} x={150 + col * 155} y={625 + row * 190}
          scale={0.42} energy={Math.min(1, progress * 1.4)} />
        {i % 3 === 1 && <SubseaHive f={f + i * 7} x={205 + col * 155} y={685 + row * 190}
          scale={0.22} awake={progress}/>} 
      </g>;
    })}
  </g>;
};
