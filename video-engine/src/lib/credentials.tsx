import React from 'react';
import {interpolate} from 'remotion';
import {ContactShadow, RimLight} from './lighting';

const INK = '#17111c';
const PAPER = '#f2e5c4';
const OXBLOOD = '#8e2434';
const OXBLOOD_D = '#54252e';
const BRASS = '#d89b32';
const BRASS_L = '#f3cf73';
const MINT = '#83d9b1';
const MONO = 'JetBrains Mono, Consolas, monospace';
const BOLD = 'Archivo, Arial Black, Arial, sans-serif';
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => 1 - Math.pow(1 - clamp(v), 3);

export const QuestionToken: React.FC<{
  x?: number; y?: number; scale?: number; rot?: number; text?: string; glow?: number;
}> = ({x = 0, y = 0, scale = 1, rot = 0, text = 'WHO EARNED THIS?', glow = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
    <circle cx={0} cy={7} r={68} fill={OXBLOOD_D} opacity={0.34}/>
    <path d="M0,-72 L18,-62 L39,-60 L51,-42 L68,-28 L65,-7 L73,12 L60,31 L55,51 L34,58 L17,72 L-4,65 L-25,72 L-42,56 L-63,48 L-65,26 L-77,8 L-65,-11 L-67,-33 L-47,-44 L-34,-64 L-12,-63 Z"
      fill={BRASS} stroke={INK} strokeWidth={8}/>
    <circle r={52} fill="#f0be52" stroke={OXBLOOD_D} strokeWidth={5}/>
    <circle r={43} fill="none" stroke={BRASS_L} strokeWidth={5} opacity={0.8}/>
    <text x={0} y={-7} textAnchor="middle" fontFamily={MONO} fontSize={text === 'EARNED' ? 20 : 10}
      fontWeight={900} fill={INK}>{text === 'EARNED' ? 'EARNED' : 'WHO EARNED'}</text>
    {text !== 'EARNED' && <text x={0} y={10} textAnchor="middle" fontFamily={MONO} fontSize={11}
      fontWeight={900} fill={INK}>THIS?</text>}
    <circle r={76 + glow * 8} fill="none" stroke={MINT} strokeWidth={4} opacity={glow * 0.65}/>
  </g>
);

export const documentFlip = (progress: number) => {
  const p = clamp(progress);
  const anticipated = p < 0.12 ? interpolate(p, [0, 0.12], [0, -8]) : 0;
  const turnP = ease(interpolate(p, [0.12, 0.78], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const overshoot = p < 0.78 ? 0 : interpolate(p, [0.78, 0.9, 1], [0, 12, 0]);
  // Complete the physical action: the old 90 degree endpoint left the
  // document permanently edge-on, so the promised reverse face never read.
  const angle = anticipated + turnP * 180 + overshoot;
  const radians = angle * Math.PI / 180;
  return {
    angle,
    sx: Math.max(0.045, Math.abs(Math.cos(radians))),
    face: angle < 90 ? 'front' as const : 'back' as const,
    shadowScale: 0.42 + Math.abs(Math.cos(radians)) * 0.58,
    lift: Math.sin(Math.min(Math.PI, radians)) * 34,
  };
};

export const DocumentFlip: React.FC<{
  f: number; x: number; y: number; progress: number; front?: string; back?: string;
  tabs?: string[]; token?: number;
}> = ({f, x, y, progress, front = 'UA CREDENTIAL', back = 'DECISION RECORD', tabs = [], token = 1}) => {
  const d = documentFlip(progress);
  const showBack = progress > 0.55;
  const tabP = ease(interpolate(progress, [0.72, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  return <g transform={`translate(${x} ${y - d.lift})`}>
    <ellipse cx={0} cy={295 + d.lift} rx={270 * d.shadowScale} ry={36} fill={INK} opacity={0.26}/>
    <g transform={`scale(${d.sx} 1)`}>
      <rect x={-280} y={-220} width={560} height={440} rx={24} fill={showBack ? '#ead9b7' : PAPER} stroke={INK} strokeWidth={12}/>
      <path d="M-250,-183 H250 V-122 H-250 Z" fill={showBack ? OXBLOOD : '#e6b33d'} opacity={0.93}/>
      <path d="M-235,155 Q0,195 235,155" fill="none" stroke={BRASS} strokeWidth={10}/>
      {Array.from({length: 7}, (_, i) => <line key={i} x1={-215} y1={-70 + i * 31} x2={205 - (i % 3) * 60} y2={-70 + i * 31}
        stroke={OXBLOOD_D} strokeWidth={7} opacity={0.34}/>) }
      <text x={0} y={-142} textAnchor="middle" fontFamily={BOLD} fontSize={38} fontWeight={900} fill={PAPER}>{showBack ? back : front}</text>
      <RimLight d="M-250,-185 L-250,175" w={7} opacity={0.62}/>
    </g>
    {showBack && tabs.slice(0, 4).map((t, i) => {
      const a = tabP * (1 + 0.08 * Math.sin(f / 7 + i));
      const px = -245 + i * 162;
      return <g key={t} transform={`translate(${px} ${-226 - a * (52 + (i % 2) * 15)})`}>
        <rect x={-5} y={0} width={146} height={54} rx={11} fill={i % 2 ? MINT : '#e6b33d'} stroke={INK} strokeWidth={7}/>
        <text x={68} y={34} textAnchor="middle" fontFamily={MONO} fontSize={14} fontWeight={900} fill={INK}>{t}</text>
      </g>;
    })}
    {token > 0 && <QuestionToken x={0} y={80} scale={0.68 + 0.08 * Math.sin(f / 18)} rot={d.angle * 0.12} glow={showBack ? 0.4 : 0.1}/>}
  </g>;
};

export const DiplomaPress: React.FC<{
  f: number; x: number; y: number; scale?: number; pull?: number; brake?: number;
  tokenText?: string; machine?: boolean; examiner?: boolean; draft?: boolean;
}> = ({f, x, y, scale = 1, pull = 0, brake = 0, tokenText = 'WHO EARNED THIS?', machine = true, examiner = false, draft = false}) => {
  const p = ease(pull);
  const bob = Math.sin(f / 24) * 2;
  const dieY = -290 + p * 335 - brake * 14;
  const shake = p > 0.92 ? Math.sin(f * 2.3) * 5 * (1 - p) : 0;
  return <g transform={`translate(${x + shake} ${y + bob}) scale(${scale})`}>
    <ContactShadow cx={0} cy={285} rx={330} ry={48} opacity={0.32} blur={14}/>
    <rect x={-350} y={-350} width={700} height={650} rx={45} fill={OXBLOOD_D} stroke={INK} strokeWidth={16}/>
    <rect x={-315} y={-315} width={630} height={540} rx={30} fill="#32181e" stroke={BRASS} strokeWidth={8}/>
    <path d="M-310,-310 H310 V-250 H-310 Z" fill={OXBLOOD}/>
    {[[-250,-275],[250,-275],[-250,250],[250,250]].map(([bx,by],i)=><g key={i}><circle cx={bx} cy={by} r={19} fill={BRASS} stroke={INK} strokeWidth={6}/><circle cx={bx-5} cy={by-5} r={5} fill={BRASS_L}/></g>)}
    <g transform={`translate(0 ${dieY})`}>
      <rect x={-205} y={-64} width={410} height={128} rx={24} fill={BRASS} stroke={INK} strokeWidth={12}/>
      <rect x={-170} y={-30} width={340} height={62} rx={14} fill={BRASS_L} opacity={0.7}/>
      <text y={18} textAnchor="middle" fontFamily={BOLD} fontSize={34} fontWeight={900} fill={INK}>{tokenText === 'EARNED' ? 'EARNED' : 'AUTO STAMP?'}</text>
      <RimLight d="M-178,-43 H175" w={6} opacity={0.7}/>
    </g>
    <g transform="translate(0 152)">
      <rect x={-255} y={-92} width={510} height={184} rx={16} fill={PAPER} stroke={INK} strokeWidth={10}/>
      <path d="M-214,-52 H214" stroke={OXBLOOD} strokeWidth={10}/>
      <path d="M-205,-18 H120 M-205,17 H175 M-205,52 H85" stroke={OXBLOOD_D} strokeWidth={7} opacity={0.45}/>
      <QuestionToken x={172} y={35} scale={0.62} text={tokenText} glow={p}/>
    </g>
    {machine && <g transform={`translate(315 ${-165 + p * 45}) rotate(${-18 + p * 20})`}>
      <rect x={-30} y={-100} width={60} height={210} rx={28} fill={MINT} stroke={INK} strokeWidth={10}/>
      <circle cy={-105} r={42} fill="#b8f0d9" stroke={INK} strokeWidth={10}/>
      <path d="M-18,105 q-40,55 -78,6 M18,105 q40,55 78,6" fill="none" stroke={INK} strokeWidth={15} strokeLinecap="round"/>
    </g>}
    {examiner && <g transform="translate(-350 -70)">
      <circle cy={-92} r={48} fill="#d9a37c" stroke={INK} strokeWidth={10}/>
      <path d="M-25,-95 q25,20 50,0" fill="none" stroke={INK} strokeWidth={7}/>
      <path d={`M0,-40 C80,-10 130,${-85 + p * 105} 210,${-98 + p * 128}`} fill="none" stroke="#e6b33d" strokeWidth={34} strokeLinecap="round"/>
      <rect x={-72} y={-50} width={144} height={200} rx={40} fill={OXBLOOD} stroke={INK} strokeWidth={10}/>
    </g>}
    {draft && <g transform="translate(-205 -395) rotate(-4)">
      <rect x={-110} y={-42} width={220} height={84} rx={12} fill={PAPER} stroke={INK} strokeWidth={8}/>
      <text y={12} textAnchor="middle" fontFamily={BOLD} fontSize={30} fontWeight={900} fill={OXBLOOD}>DRAFT 2026</text>
    </g>}
  </g>;
};

export const StampBot: React.FC<{f:number; x:number; y:number; reject?:number}> = ({f,x,y,reject=0}) => {
  const r=ease(reject); const tilt=Math.sin(f/20)*2-r*16;
  return <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
    <ContactShadow cx={0} cy={130} rx={105} ry={28} opacity={0.28} blur={8}/>
    <rect x={-105} y={-90} width={210} height={220} rx={42} fill={MINT} stroke={INK} strokeWidth={11}/>
    <rect x={-68} y={-55} width={136} height={72} rx={22} fill={PAPER} stroke={INK} strokeWidth={8}/>
    <circle cx={-30} cy={-19} r={13} fill={INK}/><circle cx={30} cy={-19} r={13} fill={INK}/>
    <path d={`M-36,${20+r*14} Q0,${38-r*34} 36,${20+r*14}`} fill="none" stroke={INK} strokeWidth={9}/>
    <g transform={`translate(${90+r*85} ${35-r*30}) rotate(${25+r*80})`}><rect x={0} y={-18} width={130} height={36} rx={16} fill={OXBLOOD} stroke={INK} strokeWidth={8}/><rect x={105} y={-45} width={84} height={90} rx={13} fill={BRASS} stroke={INK} strokeWidth={8}/></g>
  </g>;
};
