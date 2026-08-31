import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {EndCredits} from './lib/EndCredits';
import {VoiceProvider} from './lib/voice';
import {ClaimChip} from './lib/vision';
import {EvidenceColumn, EvidenceState, EVIDENCE, RadarGroundCutaway, SeedDrone} from './lib/evidence_state';
import {SIM} from './lib/simulation';

const W = 1080, H = 1920, FPS = 30;
const CAPTION_TOP = 1336, CAPTION_H = 132;
const BOLD = 'Archivo, Arial Black, Arial, sans-serif';
const MONO = 'JetBrains Mono, Consolas, monospace';

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const prog = (f: number, a: number, b: number) => clamp((f - a) / Math.max(1, b - a));
const ease = (v: number) => 1 - Math.pow(1 - clamp(v), 3);

export interface SceneProps {t0: number; L: number[]; dur: number;}
const at = (p: SceneProps, i: number, off = 0) => Math.round(((p.L[i] ?? p.t0) + off - p.t0) * FPS);

const SkyDefs = () => <defs>
  <linearGradient id="sky0830" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stopColor="#247F9C" />
    <stop offset="0.46" stopColor="#63D7F2" />
    <stop offset="1" stopColor="#E9F2E8" />
  </linearGradient>
  <linearGradient id="sun0830" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor="#FFF7C4" />
    <stop offset="1" stopColor="#F3A75D" />
  </linearGradient>
  <radialGradient id="radar0830"><stop offset="0" stopColor="#AFA4FF" stopOpacity={0.82} /><stop offset="1" stopColor="#423A84" stopOpacity={0.12} /></radialGradient>
</defs>;

const CloudWorld: React.FC<{f: number; warm?: number; terrain?: boolean}> = ({f, warm = 0, terrain = false}) => <>
  <rect data-band="ok" width={W} height={H} fill="url(#sky0830)" />
  <circle data-band="ok" cx={850} cy={180} r={150 + warm * 40} fill="url(#sun0830)" opacity={0.18 + warm * 0.62} />
  {Array.from({length: 13}, (_, i) => {
    const x = ((i * 173 + f * (0.18 + (i % 3) * 0.05)) % 1460) - 190;
    const y = 190 + (i % 5) * 170 + 34 * Math.sin(f / (41 + i * 2) + i);
    return <ellipse data-band="ok" key={i} cx={x} cy={y} rx={180 + (i % 3) * 46} ry={54 + (i % 4) * 13}
      fill={i % 3 ? '#EAF7F7' : '#B7E4EA'} opacity={0.22 + (i % 4) * 0.05} />;
  })}
  {terrain && <path data-band="ok" d="M 0 1130 Q 170 900 330 1040 Q 520 820 710 1038 Q 880 900 1080 1090 L 1080 1920 L 0 1920 Z"
    fill={EVIDENCE.spruce} opacity={0.98} />}
</>;

const Stage: React.FC<{f: number; dur: number; children: React.ReactNode; warm?: number; terrain?: boolean; drift?: number}> =
  ({f, dur, children, warm = 0, terrain = false, drift = 1}) => {
    const p = clamp(f / Math.max(1, dur));
    const z = 0.96 + 0.1 * ease(p);
    const dx = Math.sin(f / 39.7) * 18 * drift;
    const dy = Math.cos(f / 53.1) * 10 * drift;
    return <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <SkyDefs />
        <CloudWorld f={f} warm={warm} terrain={terrain} />
        <g transform={`translate(${540 + dx} ${960 + dy}) scale(${z}) translate(-540 -960)`}>{children}</g>
        <rect data-band="ok" width={W} height={H} fill="#07121A" opacity={0.035 + 0.02 * Math.sin(f / 31)} />
        <rect data-band="ok" x={0} y={0} width={W} height={H} fill="none" stroke="#07121A" strokeWidth={42} opacity={0.22} />
      </svg>
    </AbsoluteFill>;
  };

const fit = (s: string, max = 900, ideal = 40, floor = 22) => Math.max(floor, Math.min(ideal, max / Math.max(1, s.length * 0.72)));
const Plate: React.FC<{y: number; text: string; sub?: string; displayLines?: string[]; color?: string; ink?: string; w?: number; op?: number}> =
  ({y, text, sub, displayLines, color = '#F4EBDD', ink = EVIDENCE.ink, w = 920, op = 1}) => {
    const size = fit(text, w - 72, 40, 22);
    const twoLine = (displayLines?.length ?? 0) > 1;
    const height = (sub || twoLine) ? 112 : 82;
    return <g opacity={op}>
      <rect x={(W - w) / 2 + 8} y={y - 43 + 9} width={w} height={height} rx={9} fill={EVIDENCE.ink} opacity={0.26} />
      <rect x={(W - w) / 2} y={y - 43} width={w} height={height} rx={9} fill={color} stroke={EVIDENCE.ink} strokeWidth={5} />
      {displayLines?.length ? displayLines.map((line, i) => <text key={line} x={W / 2} y={y + (i === 0 ? 0 : 40)}
        textAnchor="middle" fontFamily={BOLD} fontSize={fit(line, w - 72, 34, 22)} fontWeight={900} fill={ink}>{line}</text>)
        : <text x={W / 2} y={y + 13} textAnchor="middle" fontFamily={BOLD} fontSize={size} fontWeight={900} fill={ink}>{text}</text>}
      {sub && <text x={W / 2} y={y + 52} textAnchor="middle" fontFamily={MONO} fontSize={fit(sub, w - 70, 24, 17)} fill={ink} opacity={0.76}>{sub}</text>}
    </g>;
  };

const ModelHeadline: React.FC<{f: number; y?: number; small?: boolean}> = ({f, y = 460, small = false}) => {
  const hunt = Math.sin(f / 6.7) * 3;
  return <g transform={`translate(${hunt} 0)`}>
    <text x={W / 2} y={y - 84} textAnchor="middle" fontFamily={MONO} fontSize={small ? 24 : 31}
      fontWeight={800} fill={SIM}>COMPANY ESTIMATE</text>
    <text x={W / 2} y={y} textAnchor="middle" fontFamily={BOLD} fontSize={small ? 68 : 116}
      fontWeight={900} fill={SIM} stroke="#314710" strokeWidth={small ? 2 : 4} paintOrder="stroke">ABOUT 19M</text>
    <text x={W / 2} y={y + (small ? 52 : 82)} textAnchor="middle" fontFamily={BOLD} fontSize={small ? 32 : 48}
      fontWeight={900} fill={SIM}>GALLONS</text>
    <path d={`M 170 ${y + (small ? 76 : 115)} Q 540 ${y + (small ? 104 : 144)} 910 ${y + (small ? 76 : 115)}`}
      fill="none" stroke={SIM} strokeWidth={3} strokeDasharray="22 16" strokeDashoffset={-f * 1.4} />
  </g>;
};

const S1: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame();
  const fly = interpolate(f, [0, p.dur], [-260, 1320], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pull = 1 - 0.6 * ease(prog(f, 34, p.dur));
  return <Stage f={f} dur={p.dur} drift={1.4}>
    <ModelHeadline f={f} y={560} />
    <g transform={`translate(540 880) scale(${pull}) translate(-540 -880)`}>
      <SeedDrone f={f} x={fly} y={850} scale={1.08} flareLoad={1} />
    </g>
    <Plate y={1195} text="A TINY ROBOT  ·  A VERY BIG NUMBER" color="#DDF2F3" />
  </Stage>;
};

const alaskaD = 'M 180 720 L 250 590 L 360 560 L 420 450 L 548 470 L 620 560 L 756 620 L 836 748 L 746 840 L 610 812 L 536 904 L 412 854 L 304 888 L 220 810 Z';
const S2: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame();
  const rise = ease(prog(f, 8, 34));
  const question = ease(prog(f, 10, 28));
  return <Stage f={f} dur={p.dur} drift={0.7}>
    <g transform="translate(0 -40)">
      <path d={alaskaD} fill="#DCE7D7" stroke={EVIDENCE.ink} strokeWidth={12} />
      <path d={alaskaD} fill="none" stroke="#7EA18E" strokeWidth={4} strokeDasharray="20 14" strokeDashoffset={-f * 0.6} />
      <circle cx={620} cy={724} r={20 + 4 * Math.sin(f / 8)} fill={EVIDENCE.flare} stroke={EVIDENCE.ink} strokeWidth={6} />
      <text x={650} y={716} fontFamily={MONO} fontSize={24} fontWeight={800} fill={EVIDENCE.ink}>KENAI</text>
    </g>
    <g transform={`translate(620 ${760 - 130 * rise})`}>
      <EvidenceColumn f={f} scale={0.72 * rise} ground="unknown" compact />
    </g>
    <g opacity={question} transform={`translate(0 ${28 * (1 - question)})`}>
      <rect x={232} y={930} width={616} height={126} rx={63} fill="#F2EAD8" stroke={EVIDENCE.ink} strokeWidth={8} />
      <text x={540} y={1016} textAnchor="middle" fontFamily={BOLD} fontSize={76} fontWeight={900} fill={EVIDENCE.ink}>GROUND?</text>
    </g>
    <Plate y={1185} text="KENAI PENINSULA  ·  AUGUST 23RD, 2026" color="#F2EAD8" />
  </Stage>;
};

const S3: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame();
  const loaded = ease(prog(f, 8, Math.min(90, p.dur * 0.55)));
  return <Stage f={f} dur={p.dur} drift={0.9}>
    <SeedDrone f={f} x={305} y={430} scale={0.72} flareLoad={loaded} />
    <SeedDrone f={f + 17} x={775} y={430} scale={0.72} flareLoad={loaded} facing={-1} />
    <g transform="translate(130 700)">
      {Array.from({length: 10}, (_, i) => <g key={i} transform={`translate(${(i % 5) * 164} ${Math.floor(i / 5) * 92})`}>
        <rect x={0} y={0} width={136} height={68} rx={8} fill="#C2CDD2" stroke={EVIDENCE.ink} strokeWidth={5} />
        <text x={68} y={44} textAnchor="middle" fontFamily={MONO} fontSize={22} fontWeight={900} fill={EVIDENCE.ink}>SORTIE {i + 1}</text>
      </g>)}
    </g>
    <g transform="translate(175 930)">
      {Array.from({length: 19}, (_, i) => <rect key={i} x={i * 39} y={Math.sin(i) * 3} width={26} height={78}
        rx={8} fill={i / 19 < loaded ? EVIDENCE.flare : '#77838A'} stroke={EVIDENCE.ink} strokeWidth={4} />)}
    </g>
    <Plate y={1080} text="10 SORTIES  ·  7 COORDINATED MISSIONS" />
    <Plate y={1192} text="EL-151 + EL-153  ·  19 AgI FLARES" color="#F4D5C8" />
  </Stage>;
};

const S4: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [0, p.dur], [120, 960], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <Stage f={f} dur={p.dur} drift={1.25}>
    <g opacity={0.78}>
      <rect x={110} y={700} width={860} height={170} rx={85} fill="#D6EEF0" stroke={EVIDENCE.ink} strokeWidth={7} />
      <rect x={250} y={740} width={560} height={90} rx={45} fill="#97DBE3" />
      <line x1={250} y1={785} x2={810} y2={785} stroke={EVIDENCE.flare} strokeWidth={14} strokeLinecap="round" />
      <rect x={142} y={636} width={796} height={66} rx={12} fill="#EAF7F7" stroke={EVIDENCE.ink} strokeWidth={5} />
      <text x={540} y={686} textAnchor="middle" fontFamily={MONO} fontSize={28} fontWeight={900} fill={EVIDENCE.ink}>RAINMAKER-REPORTED TEMPERATURE BAND</text>
      <text x={540} y={808} textAnchor="middle" fontFamily={BOLD} fontSize={42} fontWeight={900} fill={EVIDENCE.ink}>−5°C TO −15°C</text>
    </g>
    <SeedDrone f={f} x={x} y={470 + 42 * Math.sin(f / 19)} scale={0.82} flareLoad={0.95} />
    {Array.from({length: 7}, (_, i) => <circle key={i} cx={x - 130 - i * 54} cy={500 + 38 * Math.sin(f / 21 + i)}
      r={10 + (i % 3) * 3} fill={EVIDENCE.flare} opacity={clamp((f - i * 7) / 20)} />)}
    <Plate y={1055} text="RELEASES IN REPORTED −5°C TO −15°C BAND" />
    <Plate y={1170} text="≈19.7 g EACH  ·  ≈374.3 g TOTAL" color="#F4D5C8" />
  </Stage>;
};

const RadarField: React.FC<{f: number; x?: number; y?: number; scale?: number}> = ({f, x = 540, y = 640, scale = 1}) => <g transform={`translate(${x} ${y}) scale(${scale})`}>
  <circle r={390} fill="url(#radar0830)" stroke={EVIDENCE.ink} strokeWidth={10} />
  {[90, 180, 270, 360].map((r) => <circle key={r} r={r} fill="none" stroke="#BDB6FF" strokeWidth={2} opacity={0.24} />)}
  <line x1={0} y1={0} x2={370 * Math.cos(f / 18)} y2={370 * Math.sin(f / 18)} stroke="#E5E1FF" strokeWidth={4} opacity={0.72} />
  {Array.from({length: 7}, (_, i) => {
    const a = i * 0.83 + 0.3, r = 92 + i * 35;
    const cx = Math.cos(a) * r + 12 * Math.sin(f / 21 + i);
    const cy = Math.sin(a) * r + 10 * Math.cos(f / 24 + i);
    return <g key={i}>
      <ellipse cx={cx} cy={cy} rx={38 + (i % 2) * 14} ry={22 + (i % 3) * 8} fill={EVIDENCE.radar} opacity={0.5 + 0.24 * Math.sin(f / 17 + i)} />
      <path d={`M ${cx - 48} ${cy - 36} Q ${cx} ${cy - 58} ${cx + 52} ${cy - 18} Q ${cx + 36} ${cy + 44} ${cx - 44} ${cy + 34} Z`}
        fill="none" stroke="#E8E5FF" strokeWidth={3} strokeDasharray="10 8" />
    </g>;
  })}
  <text x={0} y={24} textAnchor="middle" fontFamily={BOLD} fontSize={96} fontWeight={900} fill="#F4F0FF">7</text>
</g>;

const S5: React.FC<SceneProps> = (p) => { const f = useCurrentFrame(); return <Stage f={f} dur={p.dur} drift={0.45}>
  <RadarField f={f} y={610} scale={0.92} />
  <Plate y={1110} text="7 MANUALLY TRACKED RADAR FEATURES" color="#E5E0FF" />
  <Plate y={1215} text="PAHG NEXRAD  ·  COMPANY ANALYSIS" color="#DCECF0" />
</Stage>; };

const S6: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame();
  const chip = ease(prog(f, 18, 42));
  const gate = ease(prog(f, 8, 30));
  return <Stage f={f} dur={p.dur} drift={0.4}>
    <RadarField f={f} x={330} y={580} scale={0.66} />
    <g transform={`translate(115 ${390 + gate * 360})`}>
      <rect x={0} y={0} width={430} height={34} rx={17} fill="#F2EAD8" stroke={EVIDENCE.ink} strokeWidth={7} />
      <circle cx={32} cy={17} r={12} fill={SIM} />
      <circle cx={398} cy={17} r={12} fill={SIM} />
      <path d="M 430 17 L 560 17 L 560 78 L 670 78" fill="none" stroke={SIM} strokeWidth={8} strokeLinecap="round" />
    </g>
    <g transform="translate(820 550)"><EvidenceColumn f={f} scale={0.82} record={1} radar={1} interpretation={chip} ground="unknown" compact interpretationSide="left" /></g>
    <ClaimChip x={540} y={920} text="RAINMAKER ASSUMPTION" sub="−5 dBZ BACKGROUND" op={chip} w={560} />
    <Plate y={1090} text="RADAR REFLECTIVITY: OBSERVED  ·  CAUSE: INTERPRETED"
      displayLines={['RADAR REFLECTIVITY: OBSERVED', 'CAUSE: INTERPRETED']} color="#E5E0FF" />
    <Plate y={1200} text="ASSUMED BACKGROUND  ·  −5 dBZ" color="#F2EAD8" />
  </Stage>;
};

const S7: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame();
  const draw = ease(prog(f, 6, Math.min(62, p.dur * 0.65)));
  const scanner = 145 + ((f * 6.4) % 760);
  return <Stage f={f} dur={p.dur} drift={0.65}>
    <g transform="translate(130 370)">
      {Array.from({length: 9}, (_, i) => <EvidenceState key={`a${i}`} state="modeled"
        d={`M 0 ${i * 64} C 280 ${i * 64}, 430 ${130 + (i % 3) * 155}, 790 ${130 + (i % 3) * 155}`}
        fidelity={0.92} f={f} drawn={draw} phase={i * 1.3} strokeWidth={3.2} />)}
      {[0, 1, 2].map((i) => <text key={i} x={810} y={140 + i * 155} fontFamily={BOLD} fontSize={62} fontWeight={900} fill={SIM}>b{i + 1}</text>)}
    </g>
    <rect x={scanner} y={342} width={30} height={640} rx={15} fill="#F4EBDD" opacity={0.28} />
    <circle cx={scanner + 15} cy={1010} r={24 + 8 * Math.sin(f / 6)} fill={SIM} stroke={EVIDENCE.ink} strokeWidth={5} />
    <text x={540} y={1010} textAnchor="middle" fontFamily={BOLD} fontSize={112} fontWeight={900} fill={SIM}>9 × 3 = 27</text>
    <Plate y={1190} text="9 VALUES OF a  ×  3 VALUES OF b  =  27 MODELS"
      displayLines={['9 VALUES OF a  ×  3 VALUES OF b', '= 27 MODELS']} color="#EAF4CF" />
  </Stage>;
};

const S8: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame();
  const meanAt = Math.max(12, at(p, 7));
  const grow = ease(prog(f, meanAt, meanAt + 34));
  return <Stage f={f} dur={p.dur} drift={0.5}>
    <g transform="translate(300 585)"><EvidenceColumn f={f} scale={1.05} record={1} radar={1} model={1} ground="unknown" compact /></g>
    <g opacity={0.25 + 0.75 * grow}><ModelHeadline f={f} y={550} small /></g>
    <text x={720} y={780} textAnchor="middle" fontFamily={BOLD} fontSize={82} fontWeight={900} fill={SIM}>57.62</text>
    <text x={720} y={830} textAnchor="middle" fontFamily={MONO} fontSize={25} fontWeight={800} fill={SIM}>ACRE-FEET · MODEL MEAN</text>
    <Plate y={1080} text="COMPANY ESTIMATE  ·  MEAN 57.62 ACRE-FEET" color="#EAF4CF" />
    <Plate y={1195} text="57.62 ACRE-FEET  ≈  18.8M GALLONS  →  ABOUT 19M"
      displayLines={['57.62 ACRE-FEET  ≈  18.8M GALLONS', 'COMPANY MEAN  ·  ABOUT 19M']} color="#EAF4CF" />
  </Stage>;
};

const S9: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame();
  const spread = ease(prog(f, 8, 38));
  const left = 540 - 320 * spread, right = 540 + 320 * spread;
  const scan = 190 + ((f * 7.6) % 700);
  const meanFade = 1 - ease(prog(f, 7, 31));
  return <Stage f={f} dur={p.dur} drift={0.62}>
    <rect x={145} y={430} width={790} height={430} rx={48} fill="#23343E" opacity={0.2} stroke={SIM} strokeWidth={5} />
    <text x={540} y={655} textAnchor="middle" fontFamily={BOLD} fontSize={94} fontWeight={900} fill={SIM}
      opacity={meanFade} transform={`rotate(${2 * Math.sin(f / 8)} 540 655)`}>57.62</text>
    <path d={`M ${left} 650 Q 540 ${600 + 24 * Math.sin(f / 13)} ${right} 650`} fill="none" stroke={SIM} strokeWidth={7}
      strokeDasharray="20 13" strokeDashoffset={-f * 1.3} />
    <circle cx={left} cy={650} r={18} fill="none" stroke={SIM} strokeWidth={6} />
    <circle cx={right} cy={650} r={18} fill="none" stroke={SIM} strokeWidth={6} />
    <text x={left} y={590} textAnchor="middle" fontFamily={BOLD} fontSize={64} fontWeight={900} fill={SIM}>41.70</text>
    <text x={right} y={590} textAnchor="middle" fontFamily={BOLD} fontSize={64} fontWeight={900} fill={SIM}>89.35</text>
    <rect x={scan} y={462} width={18} height={370} rx={9} fill="#F4EBDD" opacity={0.42} />
    {Array.from({length: 9}, (_, i) => {
      const x = 220 + i * 80 + 18 * Math.sin(f / 9 + i);
      const y = 730 + 32 * Math.sin(f / 11 + i * 0.8);
      return <circle key={i} cx={x} cy={y} r={10 + (i % 3) * 4} fill={SIM} opacity={0.38 + 0.18 * Math.sin(f / 7 + i)} />;
    })}
    <path d="M 170 780 Q 540 970 910 780" fill="none" stroke={SIM} strokeWidth={4} strokeDasharray="7 22" strokeDashoffset={f * 0.8} opacity={0.5} />
    <text x={540} y={900} textAnchor="middle" fontFamily={BOLD} fontSize={58} fontWeight={900} fill="#F4EBDD">NOT TOTAL UNCERTAINTY</text>
    <Plate y={1135} text="5TH–95TH: 41.70–89.35 ACRE-FEET  ·  NOT TOTAL UNCERTAINTY"
      displayLines={['5TH–95TH: 41.70–89.35 ACRE-FEET', 'NOT TOTAL UNCERTAINTY']} color="#EAF4CF" />
  </Stage>;
};

const S10: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame();
  const reveal = at(p, 10);
  const missing = f >= reveal;
  const dive = ease(prog(f, 0, Math.max(32, reveal + 14)));
  const traceY = 330 + 560 * dive;
  return <Stage f={f} dur={p.dur} terrain drift={1.05}>
    <g transform={`translate(540 ${560 + 105 * dive}) scale(${1.2 - 0.23 * dive})`}>
      <RadarGroundCutaway f={f} scale={0.96} modelProgress={dive} groundEvidence={missing ? 'unreported' : 'unknown'} />
    </g>
    {!missing && <>
      <path d={`M 540 260 L 540 ${traceY}`} stroke="#F4EBDD" strokeWidth={14} strokeLinecap="round" opacity={0.74} />
      <circle cx={540} cy={traceY} r={34 + 8 * Math.sin(f / 5)} fill={SIM} stroke={EVIDENCE.ink} strokeWidth={7} />
      <text x={540} y={970} textAnchor="middle" fontFamily={BOLD} fontSize={74} fontWeight={900} fill="#F4EBDD">GROUND?</text>
    </>}
    <Plate y={missing ? 1035 : 1110}
      text={missing
        ? 'LOWEST RADAR BEAM  ·  ≈1,800–2,200 m MSL  ·  NO GROUND-GAUGE/TRACER CONFIRMATION REPORTED'
        : 'LOWEST RADAR BEAM  ·  ≈1,800–2,200 m MSL'}
      displayLines={missing ? ['LOWEST RADAR BEAM  ·  ≈1,800–2,200 m MSL', 'NO GROUND-GAUGE / TRACER CONFIRMATION REPORTED'] : undefined}
      color={missing ? '#F2EAD8' : '#E5E0FF'} />
    {missing && <Plate y={1175} text="THE REPORT PROVIDES NO SURFACE CONFIRMATION"
      displayLines={['THE REPORT PROVIDES NO', 'SURFACE CONFIRMATION']} color="#F2EAD8" />}
  </Stage>;
};

const S11: React.FC<SceneProps> = (p) => { const f = useCurrentFrame(); const compare = ease(prog(f, 4, 44)); return <Stage f={f} dur={p.dur} terrain warm={0.35} drift={0.72}>
  <g transform={`translate(${230 - 30 * compare} 610) scale(${0.88 - 0.12 * compare})`}><RadarGroundCutaway f={f} scale={0.56} groundEvidence="unreported" modelProgress={1} /></g>
  <g transform={`translate(${850 - 70 * compare} 600) scale(${0.72 + 0.28 * compare})`}><RadarGroundCutaway f={f} scale={0.62} groundEvidence="confirmed" modelProgress={compare} comparison /></g>
  <circle cx={780} cy={720} r={88 + 8 * Math.sin(f / 7)} fill="none" stroke="#A8DCF0" strokeWidth={10} opacity={0.78 * compare} />
  <text x={230} y={910} textAnchor="middle" fontFamily={BOLD} fontSize={46} fontWeight={900} fill="#F4EBDD">KENAI</text>
  <text x={780} y={910} textAnchor="middle" fontFamily={BOLD} fontSize={46} fontWeight={900} fill="#F4EBDD">SNOWIE</text>
  <Plate y={1085} text="SNOWIE  ·  RADAR + GROUND GAUGES" color="#E1F0F4" />
  <Plate y={1195} text="PHYSICAL PRECEDENT  ·  NOT KENAI VALIDATION" color="#F2EAD8" />
</Stage>; };

const S12: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame();
  const verdictAt = at(p, 13);
  const verdict = ease(prog(f, verdictAt, verdictAt + 24));
  return <Stage f={f} dur={p.dur} terrain warm={0.72} drift={0.85}>
    <g opacity={1 - verdict}>
      <rect x={250} y={250} width={580} height={650} rx={290} fill="#DDF2F3" opacity={0.46} stroke="#F4EBDD" strokeWidth={8} strokeDasharray="26 18" strokeDashoffset={-f * 2} />
      {Array.from({length: 7}, (_, i) => <g key={i} transform={`translate(${360 + (i % 3) * 180} ${350 + Math.floor(i / 3) * 170 + 18 * Math.sin(f / 9 + i)})`}>
        <ellipse rx={68} ry={38} fill={EVIDENCE.radar} opacity={0.52 + 0.24 * Math.sin(f / 8 + i)} />
        <text y={12} textAnchor="middle" fontFamily={BOLD} fontSize={28} fontWeight={900} fill="#F4F0FF">{i + 1}</text>
      </g>)}
      <text x={540} y={1000} textAnchor="middle" fontFamily={BOLD} fontSize={58} fontWeight={900} fill="#F4EBDD">SATURATED COLUMN</text>
    </g>
    <g opacity={verdict}>
      <SeedDrone f={f} x={260} y={520} scale={0.65} flareLoad={0} />
      <g transform="translate(665 560)"><EvidenceColumn f={f} scale={0.94} record={1} radar={1} model={1} ground="unreported" compact /></g>
    </g>
    <ClaimChip x={530} y={1095} text="RAINMAKER ARGUES" sub="SATURATED COLUMN REDUCES LOSS RISK" op={1 - verdict} w={760} />
    {verdict > 0.05 && <>
      <Plate y={1115} text="ROBOTICS DEMONSTRATED" sub="YIELD  ·  COMPANY ESTIMATE" color="#DCECF0" op={verdict} />
      <Plate y={1245} text="DRONE ROBOTICS: YES  ·  KENAI AI USE: NOT ESTABLISHED"
        displayLines={['DRONE ROBOTICS: YES', 'KENAI AI USE: NOT ESTABLISHED']} color="#DCECF0" op={verdict} />
    </>}
  </Stage>;
};

const S13: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame();
  const land = ease(prog(f, 0, Math.min(80, p.dur * 0.45)));
  const cup = ease(prog(f, Math.max(50, p.dur - 78), Math.max(78, p.dur - 24)));
  return <Stage f={f} dur={p.dur} terrain warm={1} drift={0.85}>
    <g opacity={1 - 0.86 * cup}>
      <ModelHeadline f={f} y={330} small />
      <SeedDrone f={f} x={330} y={600 + land * 360} scale={0.7} flareLoad={0} landed={land} />
      <g transform="translate(760 760)"><EvidenceColumn f={f} scale={0.84} record={1} radar={1} interpretation={1} model={1} ground="unreported" compact interpretationSide="left" /></g>
    </g>
    <circle cx={540} cy={940} r={180 * cup} fill="#F2EAD8" opacity={0.24 * cup} stroke={SIM} strokeWidth={10 * cup} />
    <g transform={`translate(${350 + 190 * cup} ${1070 - 135 * cup}) scale(${1 + 1.35 * cup})`}>
      <path d="M -54 0 L -42 82 Q 0 106 42 82 L 54 0 Z" fill="#F4EBDD" stroke={EVIDENCE.ink} strokeWidth={7} />
      <path d="M 52 18 Q 106 18 92 68 Q 78 92 46 72" fill="none" stroke={EVIDENCE.ink} strokeWidth={7} />
      <text x={0} y={58} textAnchor="middle" fontFamily={MONO} fontSize={15} fontWeight={900} fill={EVIDENCE.ink}>NEXT TEST</text>
    </g>
    <Plate y={1160} text={cup > 0.6 ? 'NEXT TIME  ·  FINISH THE MEASUREMENT' : 'THE DRONES DELIVERED THE FLARES'} color="#F2EAD8" />
    <text x={540} y={1265} textAnchor="middle" fontFamily={BOLD} fontSize={42} fontWeight={900} fill={SIM}>THE MODEL DELIVERED THE NUMBER</text>
  </Stage>;
};

const Captions: React.FC<{cues: {t: number; d: number; text: string}[]}> = ({cues}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const cue = cues.find((c) => t >= c.t && t < c.t + c.d);
  if (!cue) return null;
  const size = 42, per = 32;
  const words = cue.text.split(' '), rows: string[] = [];
  let row = '';
  for (const w of words) {
    if (row && `${row} ${w}`.length > per) { rows.push(row); row = w; } else row = row ? `${row} ${w}` : w;
    if (rows.length === 2) break;
  }
  if (row && rows.length < 2) rows.push(row);
  const top = CAPTION_TOP + (rows.length > 1 ? 45 : 82);
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <rect data-band="ok" x={0} y={CAPTION_TOP} width={W} height={CAPTION_H} fill={EVIDENCE.ink} opacity={0.8} />
    {rows.map((r, i) => <text key={i} x={W / 2} y={top + i * 51} textAnchor="middle" fontFamily={BOLD}
      fontSize={size} fontWeight={900} fill="#F5EFDF" stroke={EVIDENCE.ink} strokeWidth={7} paintOrder="stroke">{r}</text>)}
  </svg></AbsoluteFill>;
};

export const ep0830Schema = z.object({
  captions: z.array(z.object({t: z.number(), d: z.number(), text: z.string()})).optional(),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(), lines: z.array(z.number()).optional(), credits: z.any().optional(),
  mouth: z.any().optional(), accents: z.any().optional(),
});

const SCENES = [S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13];
const DEFAULT_LINES = [0, 5.6, 13.6, 22.0, 30.5, 39.0, 47.5, 56.0, 65.0, 74.0, 83.0, 91.5, 100.0, 109.0, 116.0];
const DEFAULT_STARTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 14];

export const Ep0830: React.FC<z.infer<typeof ep0830Schema>> = ({captions = [], scenes, total, lines, credits, mouth, accents}) => {
  const {fps} = useVideoConfig();
  const L = lines && lines.length >= 15 ? lines : DEFAULT_LINES;
  const totalF = total ?? Math.round(128.5 * fps);
  const creditF = credits?.frames ?? 195;
  const storyEnd = credits ? totalF - creditF : Math.round(122 * fps);
  const bounds = scenes ?? DEFAULT_STARTS.map((li, i) => {
    const from = Math.round(L[li] * fps);
    const next = DEFAULT_STARTS[i + 1];
    const end = next === undefined ? storyEnd : Math.round(L[next] * fps);
    return {from, dur: Math.max(1, end - from)};
  });
  return <VoiceProvider data={(mouth || accents) ? ({mouth, accents} as never) : null}>
    <AbsoluteFill style={{backgroundColor: '#247F9C'}}>
      {SCENES.map((Comp, i) => {
        const b = bounds[i]; if (!b || b.dur <= 0) return null;
        return <Sequence key={i} from={b.from} durationInFrames={b.dur} name={`S${i + 1}`}>
          <Comp t0={b.from / fps} L={L} dur={b.dur} />
        </Sequence>;
      })}
      <Captions cues={captions} />
      {credits ? <Sequence from={totalF - creditF} durationInFrames={creditF} name="CREDITS">
        <EndCredits data={credits} durationInFrames={creditF} />
      </Sequence> : null}
    </AbsoluteFill>
  </VoiceProvider>;
};
