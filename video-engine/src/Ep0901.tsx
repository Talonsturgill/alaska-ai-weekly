import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {EndCredits} from './lib/EndCredits';
import {VoiceProvider} from './lib/voice';
import {MeasurementField, SignalRibbon, SPACE, UncertaintyLattice, UpstreamMonitor} from './lib/spaceweather';

const W = 1080, H = 1920, FPS = 30;
const CAPTION_TOP = 1336, CAPTION_H = 132;
const BOLD = 'Archivo, Arial Black, Arial, sans-serif';
const SERIF = 'Fraunces, Georgia, serif';
const MONO = 'JetBrains Mono, Consolas, monospace';
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const prog = (f: number, a: number, b: number) => clamp((f - a) / Math.max(1, b - a));
const ease = (v: number) => 1 - Math.pow(1 - clamp(v), 3);
const springy = (v: number) => ease(v) + Math.sin(clamp(v) * Math.PI * 2.2) * (1 - clamp(v)) * 0.08;

export interface SceneProps {t0: number; L: number[]; dur: number;}
const at = (p: SceneProps, i: number, off = 0) => Math.round(((p.L[i] ?? p.t0) + off - p.t0) * FPS);

const fit = (s: string, max = 900, ideal = 39, floor = 20) => Math.max(floor, Math.min(ideal, max / Math.max(1, s.length * 0.69)));
const Plate: React.FC<{y: number; text: string; sub?: string; tone?: 'ivory'|'rose'|'ash'; w?: number; op?: number}> =
({y, text, sub, tone = 'ivory', w = 900, op = 1}) => {
  const fill = tone === 'rose' ? '#FFCEDB' : tone === 'ash' ? '#D1C3CA' : SPACE.ivory;
  const h = sub ? 120 : 86;
  return <g opacity={op}>
    <rect x={(W-w)/2+10} y={y-43+11} width={w} height={h} rx={12} fill={SPACE.ink} opacity={0.36}/>
    <rect x={(W-w)/2} y={y-43} width={w} height={h} rx={12} fill={fill} stroke={SPACE.ink} strokeWidth={7}/>
    <text x={W/2} y={y+13} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={fit(text,w-72,38,19)} fill={SPACE.ink}>{text}</text>
    {sub && <text x={W/2} y={y+60} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={fit(sub,w-72,23,16)} fill={SPACE.ink} opacity={0.78}>{sub}</text>}
  </g>;
};

const World: React.FC<{f:number; dur:number; children:React.ReactNode; warmth?:number; drift?:number; grid?:boolean}> =
({f,dur,children,warmth=0,drift=1,grid=false}) => {
  const p = clamp(f/Math.max(1,dur));
  const z = 0.96 + 0.105*ease(p);
  const dx = Math.sin(f/43)*13*drift;
  const dy = Math.cos(f/57)*9*drift;
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <defs>
      <radialGradient id="void0901" cx="72%" cy="13%"><stop offset="0" stopColor="#552536"/><stop offset="0.42" stopColor="#28131E"/><stop offset="1" stopColor={SPACE.void}/></radialGradient>
      <linearGradient id="sun0901" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={SPACE.ivory}/><stop offset="1" stopColor="#E9A25B"/></linearGradient>
    </defs>
    <rect data-band="ok" width={W} height={H} fill="url(#void0901)"/>
    <circle data-band="ok" cx={950} cy={105} r={170+warmth*40} fill="url(#sun0901)" opacity={0.12+warmth*0.11}/>
    {Array.from({length:42},(_,i)=><circle data-band="ok" key={i} cx={(i*197+f*(0.08+(i%4)*0.025))%1180-50} cy={(i*131)%1320+30}
      r={1.5+(i%5)*0.7} fill={i%7===0?SPACE.signal:SPACE.ivory} opacity={0.16+(i%4)*0.1}/>) }
    <MeasurementField f={f} dense={grid}/>
    {grid && <g opacity={0.12}>{Array.from({length:10},(_,i)=><line key={`v${i}`} x1={90+i*100} y1={130} x2={90+i*100} y2={1295} stroke={SPACE.neutral} strokeWidth={2}/>)}
      {Array.from({length:10},(_,i)=><line key={`h${i}`} x1={70} y1={200+i*105} x2={1010} y2={200+i*105} stroke={SPACE.neutral} strokeWidth={2}/>)}</g>}
    <g transform={`translate(${540+dx} ${760+dy}) scale(${z}) translate(-540 -760)`}>{children}</g>
    <rect data-band="ok" x={20} y={20} width={1040} height={1280} rx={34} fill="none" stroke={SPACE.ivory} strokeWidth={3} opacity={0.13}/>
    <path data-band="ok" d="M 0 0 H 1080 V 1920 H 0 Z M 55 55 V 1285 H 1025 V 55 Z" fill={SPACE.void} fillRule="evenodd" opacity={0.13}/>
  </svg></AbsoluteFill>;
};

const Ceiling: React.FC<{f:number; x?:number; y?:number; lift?:number; ghost?:boolean}> = ({f,x=540,y=390,lift=0,ghost=false}) => {
  const shake=(1-lift)*Math.sin(f*1.7)*4;
  return <g transform={`translate(${x+shake} ${y-lift*340})`} opacity={ghost?0.36:1}>
    <rect x={-370} y={-42} width={740} height={84} rx={14} fill={ghost?'none':SPACE.graphite} stroke={ghost?SPACE.ash:SPACE.ink} strokeWidth={ghost?7:12} strokeDasharray={ghost?'24 18':undefined}/>
    {!ghost && [-300,-100,100,300].map((bx)=><g key={bx}><circle cx={bx} cy={0} r={18} fill={SPACE.neutral} stroke={SPACE.ink} strokeWidth={7}/><line x1={bx} y1={22} x2={bx+12*Math.sin(f/15)} y2={115} stroke={SPACE.neutral} strokeWidth={9}/></g>)}
    <text x={0} y={14} textAnchor="middle" fontFamily={BOLD} fontSize={44} fontWeight={900} fill={ghost?SPACE.ivory:SPACE.ivory}>{ghost?'PHYSICS BEYOND 15?':'PHYSICS?'}</text>
  </g>;
};

const S1:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const hit=springy(prog(f,0,28));return <World f={f} dur={p.dur} drift={0.8}>
  <Ceiling f={f} y={385}/><g transform={`translate(${interpolate(hit,[0,1],[-720,-60])} ${interpolate(hit,[0,1],[340,-45])}) scale(0.96)`}><SignalRibbon f={f} state="clean" progress={1}/></g>
  <text x={540} y={930} textAnchor="middle" fontFamily={SERIF} fontSize={70} fontWeight={900} fill={SPACE.ivory}>THE CEILING WAS</text>
  <text x={540} y={1015} textAnchor="middle" fontFamily={SERIF} fontSize={62} fontWeight={900} fill={SPACE.signal}>IN THE MEASUREMENT</text>
  <Plate y={1190} text="SPACE OR MEASUREMENT?" tone="ash"/>
</World>};

const S2:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const open=springy(prog(f,5,42));return <World f={f} dur={p.dur} warmth={0.15} drift={0.45}>
  <g transform={`translate(540 585) scale(${0.68+0.32*open}) rotate(${(1-open)*-9})`}>
    <rect x={-390} y={-310} width={780} height={620} rx={24} fill="#E7D8C8" stroke={SPACE.ink} strokeWidth={13}/>
    {Array.from({length:11},(_,i)=><line key={i} x1={-330} y1={-210+i*38} x2={330-(i%3)*95} y2={-210+i*38} stroke={SPACE.graphite} strokeWidth={8} opacity={0.5}/>) }
    <text x={0} y={-235} textAnchor="middle" fontFamily={SERIF} fontSize={74} fontWeight={900} fill={SPACE.ink}>Nature</text>
    <path d="M -330 110 Q 0 30 330 110" fill="none" stroke={SPACE.signal} strokeWidth={19} strokeLinecap="round"/>
  </g>
  <Plate y={1010} text="NATURE · JULY 15TH, 2026"/>
  <Plate y={1128} text="NITHIN SIVADAS · LEAD" sub="DOĞACAN ÖZTÜRK · UAF COAUTHOR" tone="rose"/>
  <g transform="translate(-10 355) scale(0.72)"><SignalRibbon f={f} state="clean" progress={open}/></g>
</World>};

const S3:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const deploy=ease(prog(f,3,38));const pull=ease(prog(f,30,p.dur-10));return <World f={f} dur={p.dur} drift={1.1}>
  <g transform={`translate(${300-210*pull} ${510-170*pull}) scale(${0.98-0.55*pull})`}><UpstreamMonitor f={f} x={0} y={0} scale={1} deploy={deploy}/></g>
  <g transform={`translate(${20-180*pull} ${140+100*pull}) scale(${0.73+0.13*pull})`}><SignalRibbon f={f} state="clean" progress={1}/></g>
  <circle cx={850} cy={700} r={40+150*pull} fill="#9A6B5C" stroke={SPACE.ivory} strokeWidth={8}/>
  <path d="M 240 760 C 420 890 620 890 835 760" fill="none" stroke={SPACE.neutral} strokeWidth={6} strokeDasharray="16 13" strokeDashoffset={-f}/>
  <Plate y={1035} text="WIND TODAY · ABOUT 930,000 MILES SUNWARD"/>
  <Plate y={1155} text="CURRENT L1 SETTING" sub="NOT A CLAIM ABOUT THE FULL STUDY RECORD" tone="ash"/>
</World>};

const S4:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const many=ease(prog(f,22,p.dur-18));return <World f={f} dur={p.dur} grid drift={0.45}>
  <g transform="translate(30 150) scale(0.92)"><SignalRibbon f={f} state="paired" progress={1}/></g>
  {Array.from({length:18},(_,i)=>{const x=115+(i%6)*165,y=280+Math.floor(i/6)*230;return <g key={i} opacity={0.18+0.82*many} transform={`translate(${x} ${y}) scale(${0.5+0.5*many})`}>
    <circle r={24} fill={SPACE.signal} stroke={SPACE.ink} strokeWidth={7}/><circle cx={62} r={24} fill={SPACE.ivory} stroke={SPACE.ink} strokeWidth={7}/><line x1={25} x2={38} stroke={SPACE.neutral} strokeWidth={9}/>
    <text x={31} y={58} textAnchor="middle" fontFamily={MONO} fontSize={16} fontWeight={900} fill={SPACE.ivory}>1 MIN</text></g>})}
  <Plate y={1080} text="1995 TO 2019 · 1-MINUTE MATCHES"/>
  <Plate y={1200} text="A DATE RANGE · NOT AN UNINTERRUPTED RECORD" tone="ash"/>
</World>};

const S5:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const fray=ease(prog(f,3,40));return <World f={f} dur={p.dur} drift={1.35}>
  <g transform={`translate(0 90) scale(${1+0.07*fray})`}><SignalRibbon f={f} state={fray>0.35?'frayed':'paired'} progress={1}/></g>
  <g opacity={fray}><text x={295} y={395} fontFamily={BOLD} fontSize={56} fontWeight={900} fill={SPACE.ivory}>WHEN</text><text x={690} y={705} fontFamily={BOLD} fontSize={48} fontWeight={900} fill={SPACE.ivory}>HOW MUCH</text></g>
  <g transform={`translate(${260+380*fray} 920)`}><circle r={38} fill={SPACE.signal} stroke={SPACE.ink} strokeWidth={9}/><rect x={90} y={-45} width={210} height={90} rx={16} fill={SPACE.ivory} stroke={SPACE.ink} strokeWidth={8}/><path d="M 45 0 H 90" stroke={SPACE.neutral} strokeWidth={10}/></g>
  <Plate y={1100} text="TIMING + MAGNITUDE UNCERTAINTY"/>
  <Plate y={1212} text="SHIFTED CAUSE-RESPONSE MATCH" tone="ash"/>
</World>};

const S6:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const sim=ease(prog(f,2,44));const calAt=Math.max(46,at(p,7));const cal=ease(prog(f,calAt,calAt+44));return <World f={f} dur={p.dur} grid drift={0.65}>
  <Ceiling f={f} y={380} lift={cal*0.45}/><g transform="translate(0 40)"><SignalRibbon f={f} state={cal>0.4?'recalibrated':'frayed'} progress={sim}/></g>
  {Array.from({length:8},(_,i)=><g key={i} opacity={sim*(1-cal)}><circle cx={180+i*105} cy={790-20*i+42*Math.sin(i*1.7)} r={13} fill={SPACE.ash}/><line x1={180+i*105} y1={810-20*i} x2={180+i*105+28} y2={860-9*i} stroke={SPACE.ash} strokeWidth={5}/></g>)}
  <g opacity={cal} transform={`translate(0 ${30*(1-cal)})`}><path d="M 150 835 H 930" stroke={SPACE.ivory} strokeWidth={8}/>{Array.from({length:9},(_,i)=><line key={i} x1={170+i*92} y1={790} x2={170+i*92} y2={885} stroke={SPACE.neutral} strokeWidth={8}/>)}</g>
  <Plate y={1065} text={cal>0.35?'CALIBRATE THE UNCERTAINTY':'UNCERTAINTY CAN DRAW A FALSE CEILING'} tone={cal>0.35?'ivory':'ash'}/>
  <Plate y={1180} text={cal>0.35?'RE-CENTER THE PAIRS':'SIMULATED MISMATCHES'} tone="rose"/>
</World>};

const S7:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const rise=springy(prog(f,1,45));return <World f={f} dur={p.dur} warmth={0.4} drift={0.6}>
  <Ceiling f={f} y={425} lift={rise}/><g transform={`translate(0 ${150*(1-rise)})`}><SignalRibbon f={f} state="recalibrated" progress={rise}/></g>
  <line x1={650} y1={180} x2={650} y2={900} stroke={SPACE.ivory} strokeWidth={7}/><circle cx={650} cy={420} r={21} fill={SPACE.ivory} stroke={SPACE.ink} strokeWidth={7}/>
  <text x={692} y={440} fontFamily={BOLD} fontSize={52} fontWeight={900} fill={SPACE.ivory}>15 mV/m</text>
  <Plate y={1090} text="CORRECTED RELATION · LINEAR THROUGH 15 mV/m"/>
  <Plate y={1210} text="OBSERVATION-SUPPORTED LIMIT" tone="ash"/>
</World>};

const S8:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const seam=ease(prog(f,4,38));return <World f={f} dur={p.dur} warmth={0.25} grid drift={0.85}>
  <g transform={`translate(${-20-130*seam} ${70-55*seam}) scale(${1.0+0.13*seam})`}><SignalRibbon f={f} state="solid-to-dashed" progress={1}/></g>
  <text x={635} y={535} fontFamily={BOLD} fontSize={58} fontWeight={900} fill={SPACE.ivory}>15</text><text x={910} y={350} fontFamily={BOLD} fontSize={58} fontWeight={900} fill={SPACE.ash}>25</text>
  <path d="M 650 690 V 855" stroke={SPACE.ivory} strokeWidth={9}/><path d="M 900 435 V 855" stroke={SPACE.ash} strokeWidth={7} strokeDasharray="18 13"/>
  <Plate y={1015} text="EVIDENCE STOPS AT 15"/>
  <Plate y={1135} text="AT ABOUT 25 mV/m · EXTRAPOLATED RESPONSE ≈2×" tone="rose"/>
  <text x={540} y={1275} textAnchor="middle" fontFamily={MONO} fontSize={26} fontWeight={900} fill={SPACE.ivory}>NOT OBSERVED · NOT DOUBLED DAMAGE</text>
</World>};

const S9:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const dock=ease(prog(f,8,44));const ghost=ease(prog(f,48,p.dur-8));return <World f={f} dur={p.dur} drift={0.72}>
  <g transform="translate(-70 40) scale(0.9)"><SignalRibbon f={f} state="solid-to-dashed" progress={1}/></g>
  <g transform={`translate(${190+455*dock} 810)`}><rect x={-120} y={-58} width={240} height={116} rx={20} fill="#FFCEDB" stroke={SPACE.ink} strokeWidth={9}/><text y={2} textAnchor="middle" fontFamily={BOLD} fontSize={56} fontWeight={900} fill={SPACE.ink}>≈2×</text><text y={38} textAnchor="middle" fontFamily={MONO} fontSize={21} fontWeight={900} fill={SPACE.ink}>EXTRAPOLATED</text></g>
  {['OBSERVED','DOUBLED DAMAGE','PROJECTED RESPONSE'].map((s,i)=><g key={s} transform={`translate(${210+i*330} 970)`} opacity={i<2?1-0.58*dock:0.45+0.55*dock}><rect x={-140} y={-48} width={280} height={96} rx={15} fill={i===2?SPACE.ivory:'#C7B6BF'} stroke={SPACE.ink} strokeWidth={8}/><text y={12} textAnchor="middle" fontFamily={BOLD} fontSize={fit(s,230,26,18)} fontWeight={900} fill={SPACE.ink}>{s}</text>{i<2&&dock>0.45?<path d="M -80 -23 L 80 23 M 80 -23 L -80 23" stroke="#8E2D47" strokeWidth={13}/>:null}</g>)}
  <g opacity={ghost}><Ceiling f={f} y={360} ghost/></g>
  <Plate y={1165} text="PHYSICAL SATURATION BEYOND THE DATA?" sub="STILL POSSIBLE" tone="ash"/>
</World>};

const S9b:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const reveal=ease(prog(f,2,34));return <World f={f} dur={p.dur} grid drift={0.5}>
  <g transform="translate(-70 80) scale(0.92)"><SignalRibbon f={f} state="solid-to-dashed" progress={1}/></g>
  <g opacity={reveal} transform={`translate(0 ${70*(1-reveal)})`}><Ceiling f={f} y={380} ghost/></g>
  <path d="M 650 300 V 860" stroke={SPACE.ivory} strokeWidth={9}/><path d="M 650 540 C 760 445 835 365 960 260" fill="none" stroke={SPACE.signal} strokeWidth={7} strokeDasharray="30 22" strokeDashoffset={-f*1.3} opacity={0.5}/>
  <text x={540} y={910} textAnchor="middle" fontFamily={BOLD} fontSize={36} fontWeight={900} fill={SPACE.ivory}>SUPPORTED THROUGH 15 mV/m</text>
  <Plate y={1060} text="PHYSICAL SATURATION BEYOND THE DATA?" tone="ash"/>
  <Plate y={1180} text="STILL POSSIBLE" sub="THE CORRECTION DOESN'T OBSERVE THE UNKNOWN"/>
</World>};

const S10:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const flex=ease(prog(f,8,52));return <World f={f} dur={p.dur} grid drift={0.88}>
  <UncertaintyLattice f={f} y={610} scale={0.96} flex={flex}/><g transform="translate(0 60) scale(0.96)"><SignalRibbon f={f} state="frayed" progress={1}/></g>
  <Ceiling f={f} y={410} lift={0}/><Plate y={1055} w={1020} text="AI WARNING · FLEXIBILITY CAN'T RECOVER LOST INFORMATION" tone="rose"/>
  <Plate y={1175} text="NO OPERATIONAL AI TESTED" tone="ash"/>
</World>};

const S11:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const show=ease(prog(f,5,42));const icons=[['GRID','▦'],['GPS','◎'],['AIRCRAFT','▲'],['SATELLITES','✦']];return <World f={f} dur={p.dur} warmth={0.15} drift={0.45}>
  {icons.map(([name,g],i)=>{const a=i*Math.PI/2+f/190,x=540+260*Math.cos(a)*show,y=580+250*Math.sin(a)*show;return <g key={name} transform={`translate(${x} ${y}) scale(${0.5+0.5*show})`}><circle r={78} fill={SPACE.graphite} stroke={SPACE.ivory} strokeWidth={8}/><text y={18} textAnchor="middle" fontFamily={BOLD} fontSize={48} fontWeight={900} fill={SPACE.signal}>{g}</text><text y={118} textAnchor="middle" fontFamily={MONO} fontSize={21} fontWeight={900} fill={SPACE.ivory}>{name}</text></g>})}
  <g transform="translate(0 120) scale(0.82)"><SignalRibbon f={f} state="clean" progress={1}/></g>
  <Plate y={1020} text="GENERAL HAZARDS · GRID · GPS · AIRCRAFT · SATELLITES"/>
  <Plate y={1145} text="NO FORECAST · NO CURRENT ALERT · NO ALASKA DATA SET" tone="ash"/>
</World>};

const S12:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const move=ease(prog(f,3,36));return <World f={f} dur={p.dur} warmth={0.45} drift={0.35}>
  <Ceiling f={f} y={430} lift={move}/><g transform="translate(0 80)"><SignalRibbon f={f} state="solid-to-dashed" progress={1}/></g>
  <line x1={640} y1={280} x2={640} y2={880} stroke={SPACE.ivory} strokeWidth={9}/><circle cx={640} cy={505} r={22} fill={SPACE.ivory} stroke={SPACE.ink} strokeWidth={7}/>
  <text x={680} y={510} fontFamily={BOLD} fontSize={58} fontWeight={900} fill={SPACE.ivory}>15 mV/m</text>
  <Plate y={1030} text="THE APPARENT CEILING MOVED" tone="rose"/>
  <Plate y={1155} text="THE EVIDENCE BOUNDARY DIDN'T"/>
</World>};

const S13:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const loop=ease(prog(f,0,p.dur-3));return <World f={f} dur={p.dur} warmth={0.7} drift={0.8}>
  <UncertaintyLattice f={f} y={560} scale={0.78} flex={1-loop}/><g transform={`translate(${120*loop-60} ${40-260*loop}) rotate(${-18*loop} 540 500) scale(${0.96+0.14*loop})`}><SignalRibbon f={f} state={loop>0.76?'clean':'solid-to-dashed'} progress={1}/></g>
  <Ceiling f={f} y={310+250*loop} lift={0}/><Plate y={1010} text="A MODEL CAN FOLLOW THE RIBBON"/>
  <Plate y={1135} text="IT CAN'T RESTORE WHAT THE MEASUREMENT LOST" tone="rose"/>
</World>};

const Captions:React.FC<{cues:{t:number;d:number;text:string}[]}>=({cues})=>{const f=useCurrentFrame(),t=f/FPS,cue=cues.find(c=>t>=c.t&&t<c.t+c.d);if(!cue)return null;const words=cue.text.split(' '),rows:string[]=[],per=32;let row='';for(const w of words){if(row&&`${row} ${w}`.length>per){rows.push(row);row=w}else row=row?`${row} ${w}`:w;if(rows.length===2)break}if(row&&rows.length<2)rows.push(row);const top=CAPTION_TOP+(rows.length>1?45:82);return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}><rect data-band="ok" x={0} y={CAPTION_TOP} width={W} height={CAPTION_H} fill={SPACE.ink} opacity={0.88}/>{rows.map((r,i)=><text key={i} x={W/2} y={top+i*51} textAnchor="middle" fontFamily={BOLD} fontSize={42} fontWeight={900} fill={SPACE.ivory} stroke={SPACE.ink} strokeWidth={7} paintOrder="stroke">{r}</text>)}</svg></AbsoluteFill>};

export const ep0901Schema=z.object({captions:z.array(z.object({t:z.number(),d:z.number(),text:z.string()})).optional(),scenes:z.array(z.object({from:z.number(),dur:z.number()})).optional(),total:z.number().optional(),lines:z.array(z.number()).optional(),credits:z.any().optional(),mouth:z.any().optional(),accents:z.any().optional()});
const SCENES=[S1,S2,S3,S4,S5,S6,S7,S8,S9,S9b,S10,S11,S12,S13];
const DEFAULT_LINES=[0,6,12,20,29,38,48,58,66,73,79,88,96,103,109,115,119,121,123];
const DEFAULT_STARTS=[0,1,2,3,5,6,8,9,11,12,13,15,16,18];

export const Ep0901:React.FC<z.infer<typeof ep0901Schema>>=({captions=[],scenes,total,lines,credits,mouth,accents})=>{const{fps}=useVideoConfig();const L=lines&&lines.length>=19?lines:DEFAULT_LINES;const totalF=total??Math.round(124*fps);const creditF=credits?.frames??195;const storyEnd=credits?totalF-creditF:Math.round(120*fps);const bounds=scenes??DEFAULT_STARTS.map((li,i)=>{const from=Math.round(L[li]*fps),next=DEFAULT_STARTS[i+1],end=next===undefined?storyEnd:Math.round(L[next]*fps);return{from,dur:Math.max(1,end-from)}});return <VoiceProvider data={(mouth||accents)?({mouth,accents} as never):null}><AbsoluteFill style={{backgroundColor:SPACE.void}}>{SCENES.map((Comp,i)=>{const b=bounds[i];if(!b||b.dur<=0)return null;return <Sequence key={i} from={b.from} durationInFrames={b.dur} name={`S${i+1}`}><Comp t0={b.from/fps} L={L} dur={b.dur}/></Sequence>})}<Captions cues={captions}/>{credits?<Sequence from={totalF-creditF} durationInFrames={creditF} name="CREDITS"><EndCredits data={credits} durationInFrames={creditF}/></Sequence>:null}</AbsoluteFill></VoiceProvider>};
