import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {EndCredits} from './lib/EndCredits';
import {VoiceProvider} from './lib/voice';
import {DiplomaPress, DocumentFlip, QuestionToken, StampBot} from './lib/credentials';
import {Gate, CapClock} from './lib/civics';
import {GearLever} from './lib/props';
import {AlaskaMini} from './lib/kit';

const W=1080,H=1920,FPS=30,CAPTION_TOP=1336,CAPTION_H=132;
const INK='#17111c', PAPER='#f2e5c4', OXBLOOD='#8e2434', SHADOW='#54252e', BRASS='#d89b32', MARIGOLD='#e6b33d', MINT='#83d9b1', DAWN='#f3b35c';
const BOLD='Archivo, Arial Black, Arial, sans-serif', SERIF='Fraunces, Georgia, serif', MONO='JetBrains Mono, Consolas, monospace';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const prog=(f:number,a:number,b:number)=>clamp((f-a)/Math.max(1,b-a));
const ease=(v:number)=>1-Math.pow(1-clamp(v),3);
const springy=(v:number)=>ease(v)+Math.sin(clamp(v)*Math.PI*2.2)*(1-clamp(v))*0.08;
const fit=(s:string,max=880,ideal=40,floor=15)=>Math.max(floor,Math.min(ideal,max/Math.max(1,s.length*0.78)));

export interface SceneProps {t0:number;L:number[];dur:number}

const Plate:React.FC<{y:number;text:string;sub?:string;tone?:'paper'|'mint'|'gold'|'ox';w?:number;op?:number}>=({y,text,sub,tone='paper',w=900,op=1})=>{
  const fill=tone==='mint'?MINT:tone==='gold'?MARIGOLD:tone==='ox'?OXBLOOD:PAPER;
  const fg=tone==='ox'?PAPER:INK; const h=sub?118:82;
  return <g opacity={op}><rect x={(W-w)/2+10} y={y-40+12} width={w} height={h} rx={18} fill={INK} opacity={0.25}/><rect x={(W-w)/2} y={y-40} width={w} height={h} rx={18} fill={fill} stroke={INK} strokeWidth={8}/><text x={W/2} y={y+13} textAnchor="middle" fontFamily={BOLD} fontSize={fit(text,w-64,38,17)} fontWeight={900} fill={fg}>{text}</text>{sub&&<text x={W/2} y={y+57} textAnchor="middle" fontFamily={MONO} fontSize={fit(sub,w-64,22,14)} fontWeight={800} fill={fg} opacity={0.82}>{sub}</text>}</g>;
};

const World:React.FC<{f:number;dur:number;children:React.ReactNode;warm?:number;grid?:boolean;dark?:boolean}>=({f,dur,children,warm=0.4,grid=false,dark=false})=>{
  const p=clamp(f/Math.max(1,dur)),z=0.97+0.065*ease(p),dx=Math.sin(f/51)*7,dy=Math.cos(f/67)*5;
  return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
    <defs><radialGradient id="dawn0902" cx="18%" cy="6%"><stop offset="0" stopColor={dark?'#6d3540':'#fff1c7'}/><stop offset="0.42" stopColor={dark?'#32181e':'#e9c879'}/><stop offset="1" stopColor={dark?INK:'#bd6c55'}/></radialGradient><linearGradient id="paper0902" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff4d5"/><stop offset="0.55" stopColor={PAPER}/><stop offset="1" stopColor="#d8be87"/></linearGradient></defs>
    <rect data-band="ok" width={W} height={H} fill="url(#dawn0902)"/>
    <circle data-band="ok" cx={150} cy={115} r={150+warm*40} fill={DAWN} opacity={0.18+warm*0.14}/>
    {Array.from({length:28},(_,i)=><circle data-band="ok" key={i} cx={(i*193+f*(0.12+(i%3)*0.04))%1180-50} cy={(i*137)%1280+30} r={1.5+(i%4)} fill={i%6===0?MINT:PAPER} opacity={0.13+(i%4)*0.06}/>) }
    {grid&&<g opacity={0.1}>{Array.from({length:9},(_,i)=><line key={`v${i}`} x1={110+i*108} y1={100} x2={110+i*108} y2={1280} stroke={INK} strokeWidth={2}/>)}{Array.from({length:9},(_,i)=><line key={`h${i}`} x1={60} y1={170+i*120} x2={1020} y2={170+i*120} stroke={INK} strokeWidth={2}/>)}</g>}
    <g transform={`translate(${540+dx} ${680+dy}) scale(${z}) translate(-540 -680)`}>{children}</g>
    <rect data-band="ok" x={28} y={28} width={1024} height={1268} rx={38} fill="none" stroke={PAPER} strokeWidth={4} opacity={dark?0.18:0.3}/>
    <path data-band="ok" d="M0 0H1080V1920H0Z M48 48V1292H1032V48Z" fill={INK} fillRule="evenodd" opacity={0.08}/>
  </svg></AbsoluteFill>;
};

const Student:React.FC<{f:number;x:number;y:number;climb?:number;point?:number;color?:string}>=({f,x,y,climb=0,point=0,color=MARIGOLD})=>{
  const bob=Math.sin(f/15)*3,leg=climb*Math.sin(f/5)*18;
  return <g transform={`translate(${x} ${y+bob})`}><ellipse cx={0} cy={126} rx={68} ry={15} fill={INK} opacity={0.24}/><circle cy={-118} r={48} fill="#d9a37c" stroke={INK} strokeWidth={9}/><path d="M-38,-130 Q0,-166 40,-126" fill={OXBLOOD} stroke={INK} strokeWidth={9}/><circle cx={-16} cy={-112} r={5} fill={INK}/><circle cx={16} cy={-112} r={5} fill={INK}/><path d="M-20,-88 Q0,-75 20,-88" fill="none" stroke={INK} strokeWidth={6}/><rect x={-58} y={-68} width={116} height={150} rx={38} fill={color} stroke={INK} strokeWidth={10}/><path d={`M-43,65 L${-48-leg},130 M43,65 L${48+leg},130`} stroke={INK} strokeWidth={25} strokeLinecap="round"/><path d={`M-48,-42 L${-112-55*point},${20-55*point} M48,-42 L${105+72*point},${5-62*point}`} stroke="#d9a37c" strokeWidth={23} strokeLinecap="round"/></g>;
};

const S1:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const hit=springy(prog(f,0,25));const draft=ease(prog(f,56,86));return <World f={f} dur={p.dur} dark warm={0.25}>
  <g transform="translate(540 630)"><DiplomaPress f={f} x={0} y={0} scale={1.08} pull={hit*0.82} brake={hit} draft={draft>0.2}/></g>
  <g transform={`translate(${540+420*(1-hit)} ${245-120*(1-hit)})`}><QuestionToken scale={0.62+0.22*hit} rot={-12+12*hit} glow={hit}/></g>
  <Plate y={1085} text="WHO EARNED THIS?" tone="gold"/><Plate y={1198} text="AI ENGAGED · DRAFT 2026" sub="BOARD DISCUSSION · SEPTEMBER 2" tone="ox"/>
</World>};

const Gear:React.FC<{x:number;y:number;r:number;f:number;color:string;label:string;count:string}>=({x,y,r,f,color,label,count})=><g transform={`translate(${x} ${y}) rotate(${f*0.3})`}><circle r={r} fill={color} stroke={INK} strokeWidth={10}/>{Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return <rect key={i} x={Math.cos(a)*(r+13)-11} y={Math.sin(a)*(r+13)-11} width={22} height={22} rx={4} fill={color} stroke={INK} strokeWidth={5} transform={`rotate(${i*30} ${Math.cos(a)*(r+13)} ${Math.sin(a)*(r+13)})`}/>})}<circle r={r*0.52} fill={PAPER} stroke={INK} strokeWidth={8}/><text y={2} textAnchor="middle" fontFamily={BOLD} fontSize={r*0.65} fontWeight={900} fill={INK} transform={`rotate(${-f*0.3})`}>{count}</text><text y={r+68} textAnchor="middle" fontFamily={MONO} fontSize={20} fontWeight={900} fill={PAPER} transform={`rotate(${-f*0.3})`}>{label}</text></g>;
const S2:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const build=springy(prog(f,0,36));return <World f={f} dur={p.dur} grid>
  <g opacity={build} transform={`translate(0 ${70*(1-build)})`}><Gear x={270} y={500} r={115} f={f} color={MARIGOLD} count="6" label="PRINCIPLES"/><Gear x={540} y={420} r={145} f={-f} color={OXBLOOD} count="4" label="PRIORITIES"/><Gear x={815} y={520} r={120} f={f} color={MINT} count="5" label="EXPECTATIONS"/></g>
  <Plate y={890} text="6 PRINCIPLES" tone="gold"/><Plate y={990} text="4 INVESTMENT PRIORITIES" tone="ox"/><Plate y={1090} text="5 SYSTEM EXPECTATIONS" tone="mint"/>
  <Plate y={1203} w={1000} text="HUMAN-CENTERED · ACCESS · SECURE · TRANSPARENT" sub="CLASSROOMS TO ARCTIC RESEARCH · LITERACY · SECURITY · HUMAN OVERSIGHT"/>
</World>};

const S3:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const climb=ease(prog(f,0,p.dur-20));return <World f={f} dur={p.dur} warm={0.7}>
  {Array.from({length:6},(_,i)=>{const x=95+i*145,y=930-i*105;return <g key={i} transform={`translate(${x} ${y})`}><rect width={160} height={92} rx={12} fill={i%2?PAPER:MARIGOLD} stroke={INK} strokeWidth={9}/><text x={80} y={55} textAnchor="middle" fontFamily={MONO} fontSize={17} fontWeight={900} fill={INK}>{['TRY','FEEDBACK','REVISE','PRACTICE','JUDGMENT','COMPETENCE'][i]}</text></g>})}
  <Student f={f} x={230+540*climb} y={785-430*climb} climb={climb}/>
  <g opacity={ease(prog(f,35,70))} transform="translate(850 310)"><QuestionToken scale={0.72} text="EARNED" glow={0.5}/></g>
  <Plate y={1115} w={1010} text="A CREDENTIAL STILL CERTIFIES EARNED COMPETENCE" tone="gold"/>
  <text x={540} y={1222} textAnchor="middle" fontFamily={SERIF} fontSize={34} fontWeight={900} fill={INK}>AI CAN LIGHT THE STAIRS.</text>
  <text x={540} y={1262} textAnchor="middle" fontFamily={SERIF} fontSize={34} fontWeight={900} fill={INK}>THE STUDENT CLIMBS.</text>
</World>};

const Room:React.FC<{x:number;y:number;label:string;f:number;phase:number}>=({x,y,label,f,phase})=>{const open=0.55+0.3*Math.sin(f/38+phase);return <g transform={`translate(${x} ${y})`}><rect x={-145} y={-230} width={290} height={460} rx={24} fill={PAPER} stroke={INK} strokeWidth={11}/><path d="M-145,-230 H145 V-150 H-145 Z" fill={MARIGOLD}/><text y={-178} textAnchor="middle" fontFamily={BOLD} fontSize={42} fontWeight={900} fill={INK}>{label}</text><g transform={`translate(-25 205) scale(${open} 1)`}><rect x={-90} y={-270} width={180} height={270} fill={SHADOW} stroke={INK} strokeWidth={9}/><circle cx={55} cy={-135} r={11} fill={BRASS}/></g><Student f={f} x={45} y={80} point={open} color={label==='UAF'?MINT:MARIGOLD}/></g>};
const S4:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const pull=ease(prog(f,0,32));return <World f={f} dur={p.dur}>
  <g transform={`translate(540 560) scale(${0.72+0.18*pull})`}><Room x={-330} y={0} label="UAA" f={f} phase={0}/><Room x={0} y={0} label="UAF" f={f} phase={1.3}/><Room x={330} y={0} label="UAS" f={f} phase={2.4}/></g>
  <g transform="translate(540 1010) scale(1.15)"><GearLever x={0} y={0} pulled={springy(prog(f,22,58))}/></g>
  <Plate y={1120} w={1030} text="UAA · UAF · UAS KEEP CURRICULUM JUDGMENT" tone="ox"/><Plate y={1230} text="REQUIRE · ENCOURAGE · LIMIT · EXCLUDE" sub="BY COURSE OBJECTIVES" tone="gold"/>
</World>};

const S5:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const rail=ease(prog(f,0,30));const labels=['TOOLS','TRAINING','CONTRACTS','LEGAL'];return <World f={f} dur={p.dur} grid>
  {[260,540,820].map((x,i)=><g key={x} transform={`translate(${x} 360)`}><Gate f={f} x={0} y={0} condition={['UAA','UAF','UAS'][i]} source="CURRICULUM" verdict="asking" scale={0.8} phase={i}/></g>)}
  <path d="M80 810 H1000" stroke={INK} strokeWidth={34}/><path d="M80 810 H1000" stroke={BRASS} strokeWidth={13} strokeDasharray="45 22" strokeDashoffset={-f*4}/>
  {labels.map((l,i)=>{const x=((i*250+f*5)%1180)-50;return <g key={l} transform={`translate(${x} 760) scale(${0.7+0.3*rail})`}><rect x={-90} y={-58} width={180} height={116} rx={20} fill={i%2?MINT:MARIGOLD} stroke={INK} strokeWidth={9}/><text y={10} textAnchor="middle" fontFamily={MONO} fontSize={19} fontWeight={900} fill={INK}>{l}</text></g>})}
  <Plate y={1020} text="SHARED UPLIFT" tone="mint"/><Plate y={1130} w={1010} text="SYSTEMWIDE AI COORDINATING COUNCIL" sub="PROPOSED SHARED CAPACITY" tone="ox"/>
</World>};

const S6:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const flip=springy(prog(f,2,p.dur-10));return <World f={f} dur={p.dur} dark warm={0.25}>
  <DocumentFlip f={f} x={540} y={600} progress={flip} front="UA CREDENTIAL" back="DECISION RECORD" tabs={['ADMISSIONS','FINANCIAL AID','ADVISING','HR ANALYTICS']}/>
  <Plate y={1085} text="THE DIPLOMA FLIPS INTO A SECOND TRUST TEST" tone="gold"/><Plate y={1198} text="PREDICTIVE AI · STUDENT PROGRESS · OPERATIONS" tone="ox"/>
</World>};

const S7:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const lock=ease(prog(f,10,48));const reject=ease(prog(f,52,p.dur-8));return <World f={f} dur={p.dur} grid>
  <g transform="translate(540 570)"><Gate f={f} x={0} y={0} condition="EVALUATE" source="OVERSIGHT" verdict={lock>0.65?'pass':'block'} swing={lock} scale={1.42} accent={lock}/></g>
  <g transform="translate(225 650) scale(0.62)"><DocumentFlip f={f} x={0} y={0} progress={1} back="DECISION RECORD" tabs={['ADMISSIONS','AID','ADVISING','HR']} token={0}/></g>
  <StampBot f={f} x={855} y={720} reject={reject}/>
  <Plate y={1060} w={1010} text="CONSEQUENTIAL AI · HUMAN OVERSIGHT" tone="ox"/><Plate y={1175} text="DOCUMENTED EVALUATION · MEANINGFUL" sub="NOT A CLAIM THAT HUMANS MAKE EVERY FINAL DECISION" tone="gold"/>
</World>};

const S8:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const drop=springy(prog(f,0,32));const swing=Math.sin(f/15)*18*(1-drop*0.3);return <World f={f} dur={p.dur} dark warm={0.15}>
  <g transform={`translate(540 620) rotate(${swing})`}><path d="M-350 0 H350" stroke={BRASS} strokeWidth={20}/><path d="M0 -220 V120" stroke={INK} strokeWidth={24}/><circle cy={0} r={48} fill={PAPER} stroke={INK} strokeWidth={10}/><path d="M-270 0 V245 M270 0 V245" stroke={INK} strokeWidth={9}/><path d="M-385 245 H-155 M155 245 H385" stroke={INK} strokeWidth={15}/></g>
  {[['EARNED',270],['MEANINGFUL',810]].map(([txt,x],i)=><g key={String(txt)} transform={`translate(${x} ${330+220*(1-drop)+i*18}) rotate(${(i?-5:5)*(1-drop)})`}><rect x={-170} y={-70} width={340} height={140} rx={22} fill={i?MINT:MARIGOLD} stroke={INK} strokeWidth={11}/><text y={18} textAnchor="middle" fontFamily={BOLD} fontSize={fit(String(txt),285,44,28)} fontWeight={900} fill={INK}>{txt}</text></g>)}
  <Plate y={1030} text="STRONG WORDS ARE NOT MEASUREMENTS" tone="gold"/><Plate y={1145} text="POWER? · EVIDENCE? · APPEAL?" sub="THE DRAFT DOES NOT DEFINE THEM" tone="ox"/>
</World>};

const S9:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const strain=ease(prog(f,0,30));return <World f={f} dur={p.dur} dark>
  <g transform="translate(540 560) scale(4.7)"><CapClock f={f} x={0} y={0} hands={1} sweep={0.004*Math.sin(f/9)*strain} scale={1} tint={BRASS}/></g>
  <g transform={`translate(540 ${360+50*Math.sin(f/12)}) rotate(-9)`}><rect x={-285} y={-72} width={570} height={144} rx={18} fill={OXBLOOD} stroke={INK} strokeWidth={12}/><text y={20} textAnchor="middle" fontFamily={BOLD} fontSize={58} fontWeight={900} fill={PAPER}>DRAFT · STOPPED</text></g>
  <Plate y={1080} text="12-MONTH CLOCK · NOT STARTED" tone="gold"/><Plate y={1190} text="THE FRAMEWORK HAS NOT BEEN ADOPTED" sub="BUDGET REQUEST IS A SEPARATE ITEM" tone="ox"/>
</World>};

const S10:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const turn=springy(prog(f,0,38));const cards=ease(prog(f,28,p.dur-8));return <World f={f} dur={p.dur} grid warm={0.85}>
  <g transform={`translate(540 360) rotate(${-75+75*turn})`}><QuestionToken scale={0.86} text="IF ADOPTED" glow={turn}/><rect x={45} y={-22} width={330} height={44} rx={18} fill={BRASS} stroke={INK} strokeWidth={9}/><path d="M330 -20 V80 M280 -20 V55" stroke={INK} strokeWidth={20}/></g>
  {['SYSTEM PLAN','UNIVERSITY PLANS','INSTITUTION POLICIES'].map((t,i)=><g key={t} opacity={cards} transform={`translate(${200+i*335} ${620+i*125-120*(1-cards)})`}><rect x={-150} y={-90} width={300} height={180} rx={20} fill={i%2?MINT:PAPER} stroke={INK} strokeWidth={10}/><path d="M-112 -38 H112 M-112 2 H80 M-112 42 H100" stroke={SHADOW} strokeWidth={8} opacity={0.5}/><text y={-54} textAnchor="middle" fontFamily={BOLD} fontSize={fit(t,255,24,16)} fontWeight={900} fill={INK}>{t}</text></g>)}
  <Plate y={1050} text="IF ADOPTED · 1 YEAR" tone="gold"/><Plate y={1165} text="POLICIES + PLANS" sub="CONDITIONAL WORK · NOT A SEPTEMBER 2027 DEADLINE" tone="ox"/>
</World>};

const Gauge:React.FC<{x:number;y:number;label:string;f:number;phase:number}>=({x,y,label,f,phase})=>{const a=-50+30*Math.sin(f/17+phase);return <g transform={`translate(${x} ${y})`}><path d="M-95 65 A115 115 0 0 1 95 65" fill={PAPER} stroke={INK} strokeWidth={10}/><path d="M-70 54 A84 84 0 0 1 70 54" fill="none" stroke={MINT} strokeWidth={13} strokeDasharray="16 11"/><line x1={0} y1={60} x2={70*Math.sin(a*Math.PI/180)} y2={60-70*Math.cos(a*Math.PI/180)} stroke={OXBLOOD} strokeWidth={12} strokeLinecap="round"/><circle cy={60} r={16} fill={BRASS} stroke={INK} strokeWidth={6}/><text y={115} textAnchor="middle" fontFamily={BOLD} fontSize={24} fontWeight={900} fill={INK}>{label}</text><text y={7} textAnchor="middle" fontFamily={SERIF} fontSize={56} fontWeight={900} fill={OXBLOOD}>?</text></g>};
const S11:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const split=ease(prog(f,12,45));return <World f={f} dur={p.dur}>
  <g transform="translate(540 530) scale(1.12)"><AlaskaMini frame={f} x={0} y={0} scale={1} pin pinLabel="UA"/></g>
  <Gauge x={230} y={790} label="LEARNING" f={f} phase={0}/><Gauge x={540} y={815} label="OVERSIGHT" f={f} phase={1.4}/><Gauge x={850} y={790} label="CREDENTIAL" f={f} phase={2.6}/>
  <g opacity={split}><line x1={540} y1={680} x2={540} y2={1030} stroke={INK} strokeWidth={12}/><rect x={215} y={940} width={290} height={66} rx={14} fill={PAPER} stroke={INK} strokeWidth={5}/><text x={360} y={982} textAnchor="middle" fontFamily={MONO} fontSize={25} fontWeight={900} fill={INK}>OVERSIGHT LEDGER</text><rect x={575} y={940} width={290} height={66} rx={14} fill={PAPER} stroke={INK} strokeWidth={5}/><text x={720} y={982} textAnchor="middle" fontFamily={MONO} fontSize={25} fontWeight={900} fill={INK}>CREDENTIAL LANE</text><QuestionToken x={210} y={635} scale={0.52} rot={f*0.7}/></g>
  <Plate y={1130} text="EVIDENCE, NOT PROMISES" tone="gold"/><Plate y={1230} text="TWO PROMISES · ONE PUBLIC TEST" tone="ox"/>
</World>};

const S12:React.FC<SceneProps>=(p)=>{const f=useCurrentFrame();const release=ease(prog(f,0,28));const pull=springy(prog(f,26,72));const done=ease(prog(f,60,p.dur-8));return <World f={f} dur={p.dur} dark warm={0.85}>
  <g transform="translate(540 650)"><DiplomaPress f={f} x={0} y={0} scale={1.07} pull={pull} brake={0} tokenText={done>0.45?'EARNED':'WHO EARNED THIS?'} machine={release<0.7} examiner draft/></g>
  <g opacity={done} transform={`translate(540 ${315-85*done}) scale(${0.6+0.35*done})`}><QuestionToken text="EARNED" scale={1} glow={done}/></g>
  <Plate y={1090} text="THE MACHINE CAN HELP" tone="mint"/><Plate y={1202} text="A HUMAN PULLS THE CREDENTIAL PRESS" sub="EARNED DIPLOMA · DRAFT PLAN STILL UNDER REVIEW" tone="gold"/>
</World>};

const Captions:React.FC<{cues:{t:number;d:number;text:string}[]}>=({cues})=>{const f=useCurrentFrame(),t=f/FPS,cue=cues.find(c=>t>=c.t&&t<c.t+c.d);if(!cue)return null;const words=cue.text.split(' '),rows:string[]=[],per=32;let row='';for(const w of words){if(row&&`${row} ${w}`.length>per){rows.push(row);row=w}else row=row?`${row} ${w}`:w;if(rows.length===2)break}if(row&&rows.length<2)rows.push(row);const top=CAPTION_TOP+(rows.length>1?45:82);return <AbsoluteFill><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}><rect data-band="ok" x={0} y={CAPTION_TOP} width={W} height={CAPTION_H} fill={INK} opacity={0.9}/>{rows.map((r,i)=><text key={i} x={W/2} y={top+i*51} textAnchor="middle" fontFamily={BOLD} fontSize={42} fontWeight={900} fill={PAPER} stroke={INK} strokeWidth={7} paintOrder="stroke">{r}</text>)}</svg></AbsoluteFill>};

export const ep0902Schema=z.object({captions:z.array(z.object({t:z.number(),d:z.number(),text:z.string()})).optional(),scenes:z.array(z.object({from:z.number(),dur:z.number()})).optional(),total:z.number().optional(),lines:z.array(z.number()).optional(),credits:z.any().optional(),mouth:z.any().optional(),accents:z.any().optional()});
const SCENES=[S1,S2,S3,S4,S5,S6,S7,S8,S9,S10,S11,S12];
const DEFAULT_LINES=[0,6,12,18,24,30,36,42,48,54,60,66,72,78,84,90,96,102,108,114];
const DEFAULT_STARTS=[0,2,3,5,7,8,10,12,15,17,18,19];
export const Ep0902:React.FC<z.infer<typeof ep0902Schema>>=({captions=[],scenes,total,lines,credits,mouth,accents})=>{const{fps}=useVideoConfig();const L=lines&&lines.length>=20?lines:DEFAULT_LINES;const totalF=total??Math.round(120*fps);const creditF=credits?.frames??195;const storyEnd=credits?totalF-creditF:Math.round(120*fps);const bounds=scenes??DEFAULT_STARTS.map((li,i)=>{const from=Math.round(L[li]*fps),next=DEFAULT_STARTS[i+1],end=next===undefined?storyEnd:Math.round(L[next]*fps);return{from,dur:Math.max(1,end-from)}});return <VoiceProvider data={(mouth||accents)?({mouth,accents} as never):null}><AbsoluteFill style={{backgroundColor:INK}}>{SCENES.map((Comp,i)=>{const b=bounds[i];if(!b||b.dur<=0)return null;return <Sequence key={i} from={b.from} durationInFrames={b.dur} name={`S${i+1}`}><Comp t0={b.from/fps} L={L} dur={b.dur}/></Sequence>})}<Captions cues={captions}/>{credits?<Sequence from={totalF-creditF} durationInFrames={creditF} name="CREDITS"><EndCredits data={credits} durationInFrames={creditF}/></Sequence>:null}</AbsoluteFill></VoiceProvider>};
