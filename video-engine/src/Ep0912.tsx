import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {Sheet, PaperFiber} from './lib/paper';
import {Stage3D, Plane, CameraMoves, composeCams} from './lib/stage3d';
import {EvidenceTrace} from './lib/spaceweather';
import {GripHand} from './lib/props';
import {EEGHeadset} from './lib/research';
import {QuestionToken} from './lib/credentials';
import {ContactShadow, RimLight, MotionBlur, GradeLayer} from './lib/lighting';
import {entrance, followThrough} from './lib/motion';
import {EndCredits} from './lib/EndCredits';
import {VoiceProvider} from './lib/voice';
import {EEGDemo0912} from './EEGDemo0912';

const W=1080,H=1920,CAPTION_TOP=1336,CAPTION_H=132;
const SKY='#E8E1FA',GROUND='#776CB6',PAPER='#FFF9E8',CITRON='#E4EC65',INK='#25213D',CORAL='#ED9575';
const FONT='Archivo, Arial, sans-serif',MONO='JetBrains Mono, monospace';
const e=(f:number,a=0,d=24)=>interpolate(f,[a,a+d],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.18,.8,.25,1)});
const SVG:React.FC<{children:React.ReactNode}>=({children})=><svg width={W} height={H} viewBox="0 0 1080 1920" style={{position:'absolute',inset:0,overflow:'visible'}}>{children}</svg>;
const Fit:React.FC<{text:string;x?:number;y:number;size?:number;width?:number;color?:string;mono?:boolean}>=({text,x=540,y,size=44,width=900,color=INK,mono=false})=><text x={x} y={y} textAnchor="middle" fill={color} fontFamily={mono?MONO:FONT} fontWeight={850} fontSize={Math.min(size,width/(Math.max(1,text.length)*.59))}>{text}</text>;
const Plate:React.FC<{text:string;x?:number;y:number;width?:number;color?:string}>=({text,x=540,y,width=850,color=PAPER})=><g><rect x={x-width/2+6} y={y-38+8} width={width} height={62} rx={8} fill={INK} opacity={.2}/><rect x={x-width/2} y={y-38} width={width} height={62} rx={8} fill={color} stroke={INK} strokeWidth={4}/><Fit text={text} x={x} y={y+4} size={29} width={width-30} mono/></g>;
type Beat={id:number;at:number;label:string};
const Notebook:React.FC<{x?:number;y?:number;s?:number;open?:number;wing?:number;f:number;shuffle?:number;task?:number}>=({x=540,y=880,s=1,open=1,wing=0,f,shuffle=0,task=0})=>{
 const flick=followThrough(f,30,0,{amp:5,decay:2.1,freq:2.6});
 // Loose corners flex independently in the same room air as the hanging tag.
 // The printed pages and their meaning remain fixed; only paper bends.
 const leftCurl=12*Math.sin(f/29)+4*Math.sin(f/67),rightCurl=11*Math.sin(f/37+1.4)+4*Math.sin(f/73);
 return <g transform={`translate(${x} ${y}) scale(${s})`}>
 <ContactShadow cx={18} cy={222} rx={350+130*wing} ry={30} opacity={.27} blur={8}/>
 <defs><linearGradient id="notebookCover0912" x2="1" y2="1"><stop stopColor="#FFC19C"/><stop offset=".5" stopColor={CORAL}/><stop offset="1" stopColor="#AF6263"/></linearGradient><linearGradient id="page0912" x2="1" y2=".2"><stop stopColor="#F5E8CE"/><stop offset=".17" stopColor={PAPER}/><stop offset=".86" stopColor={PAPER}/><stop offset="1" stopColor="#D6C7D9"/></linearGradient></defs>
 {[4,3,2,1].map(i=><rect key={i} x={-346+i*2} y={-199+i*4} width={690} height={406} rx={8} fill={i%2?PAPER:'#C3B5D0'} stroke={INK} strokeWidth={2}/>)}
 <rect x={-347} y={-218} width={694} height={425} rx={12} fill="url(#notebookCover0912)" stroke={INK} strokeWidth={7}/>
 <g transform={`translate(${-12*shuffle} ${-5*shuffle}) rotate(${-1.5*shuffle})`}><Sheet x={-334} y={-211} w={330} h={405} fill="url(#page0912)" fiber="fiber0912" curl={1}/><Fit text="PUBLIC EEG DATA" x={-170} y={-145} size={27} width={285} mono/>
 <rect x={-306} y={-102} width={265} height={139} rx={6} fill="#E8E1FA" stroke={INK} strokeWidth={3}/>
 <path d="M-286 -74h217M-286 -48h198M-286 -22h217M-286 4h172" stroke={GROUND} strokeWidth={5}/>
 <g transform={`translate(-169 111)`}><path d="M-24 17q24 22 48 0" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round"/>{[-22,22].map(xx=><g key={xx}><ellipse cx={xx} cy={-8} rx={12} ry={15} fill="white" stroke={INK} strokeWidth={2}/><circle cx={xx+3*Math.sin(f/47)} cy={-8} r={5} fill={INK}/></g>)}</g>
 <path d="M-320-202H-28" stroke="white" strokeWidth={3} opacity={.8}/><path d={`M-334 -211H-266Q${-273+leftCurl} ${-168-leftCurl} -334 -144Z`} fill="#E8E1FA" stroke={GROUND} strokeWidth={3}/><path d={`M-334 -144Q${-286+leftCurl} -159 -266 -211`} fill="none" stroke={PAPER} strokeWidth={4}/></g>
 <g transform={`translate(3 0) scale(${.12+.88*open} 1)`}><Sheet x={0} y={-211} w={332} h={405} fill="url(#page0912)" fiber="fiber0912" curl={1}/><path d="M35 -115h260M35 -61h215" stroke={GROUND} strokeWidth={3} opacity={.25}/><path d="M40 114h245" stroke={GROUND} strokeWidth={4} strokeDasharray="9 9" opacity={.5}/>{task>0&&<g opacity={task}><rect x={32} y={-20} width={258} height={83} rx={8} fill={CITRON} stroke={INK} strokeWidth={3}/><Fit text="OWN-TASK PLAN" x={161} y={32} size={23} width={232} mono/></g>}</g>
 <g transform={`translate(3 0) scale(${.12+.88*open} 1)`}><path d={`M332 194H258Q${276+rightCurl} ${155-rightCurl} 332 121Z`} fill="#E8E1FA" stroke={GROUND} strokeWidth={3}/><path d={`M258 194Q${280+rightCurl} ${156-rightCurl} 332 121`} fill="none" stroke={PAPER} strokeWidth={4}/></g>
 <path d="M-4-197V180" stroke={GROUND} strokeWidth={10}/>{Array.from({length:13},(_,i)=><path key={i} d={`M-11 ${-181+i*29}q12-9 23 0`} stroke={INK} strokeWidth={3} fill="none"/>)}
 <g transform={`translate(332 -155) rotate(${flick+5*Math.sin(f/31)+2*Math.sin(f/71)})`}><path d="M0 0h111l13 28-13 30H0Z" fill={CORAL} stroke={INK} strokeWidth={4}/><Fit text="NEXT STEP" x={56} y={36} size={17} width={103} mono/><path d="M8 7h96" stroke="#FFE3BE" strokeWidth={3}/></g>
 {wing>0&&<g transform={`translate(345 -211) scale(${wing} 1)`}><Sheet x={0} y={0} w={370} h={405} fill="url(#page0912)" fiber="fiber0912"/><Fit text="TO COLLECT" x={185} y={62} size={30} width={325} mono/><rect x={24} y={91} width={321} height={99} rx={6} fill="none" stroke={GROUND} strokeWidth={4} strokeDasharray="12 10"/><Fit text="TO TEST" x={185} y={260} size={30} width={320} mono/><rect x={24} y={285} width={321} height={91} rx={6} fill="none" stroke={GROUND} strokeWidth={4} strokeDasharray="12 10"/></g>}
 <RimLight d="M-346 175V-208Q-345-218-335-218H330" color={PAPER} w={3}/></g>;
};
const Trace:React.FC<{x:number;y:number;s?:number;f:number;p?:number}>=({x,y,s=1,f,p=1})=><g transform={`translate(${x} ${y}) scale(${s})`}><EvidenceTrace f={f} width={8} progress={p} color={CORAL} d="M0 0Q35 -20 70 4L90 24 116 -44 141 16Q160 32 185 0T265 5L290 -25 317 18 350 0"/><Fit text="SCHEMATIC" x={175} y={69} size={25} width={300} mono/></g>;
const Marker:React.FC<{x:number;y:number;s?:number}>=({x,y,s=1})=><g transform={`translate(${x} ${y}) scale(${s})`}><path d="M-43 -60h64l22 22v120h-86Z" fill={CITRON} stroke={INK} strokeWidth={5}/><circle cy={-22} r={16} fill={INK}/><path d="M-24 30q0-36 24-36t24 36" fill={INK}/></g>;
const HEADS=['THE QUESTION COMES FIRST','A NEW RESEARCH OPTION','ANNOUNCED SEPTEMBER 9TH','RECORDING DEMONSTRATION','THE PUBLIC PAGES STAY OPEN','WHO MIGHT IT WORK FOR?','PLANNED STUDY','PLANNED STUDY','PUBLIC DATA KEEPS ITS PLACE','DO THE RECORDINGS FIT?','AN EXTRA PAGE','IF THE CLAIM IS NEW PEOPLE','A RESEARCH PRINCIPLE','WHICH QUESTION COMES NEXT?'];
const Shot:React.FC<{n:number;from:number;dur:number;beats:Beat[]}>=({n,from,dur,beats})=>{const f=useCurrentFrame();let g=f+from;for(const id of [10,23,29]){const at=(beats.find(b=>b.id===id)?.at??999)*30,land=at+22,until=land+(id===29?21:18);if(g>=land&&g<until)g=land;}
 const p=e(g-from),travel=e(g-from,0,dur),bp=(id:number,d=25,lag=0)=>e(g-lag,(beats.find(b=>b.id===id)?.at??999)*30,d);let art:React.ReactNode;
 if(n===1) art=<g><EEGHeadset x={228} y={890} scale={1.05} mode="contact" f={g}/><Notebook x={665} y={956} s={.67} open={.48+.52*entrance(g-from,30,5).t} shuffle={bp(2)} f={g}/><QuestionToken x={830} y={1125} scale={.64} text="NEXT STEP" color={CORAL} faceColor={PAPER} inkColor={INK} rimColor={CITRON} rot={-6+6*bp(3)}/><Fit text="19" x={230} y={729} size={166} width={280}/><Fit text="SCALP ELECTRODES" x={687} y={674} size={40} width={590}/><Fit text="WHAT IS ON THE NEXT PAGE?" x={687} y={733} size={29} width={580} mono/></g>;
 else if(n===2) art=<g><rect x={140} y={1050} width={800} height={80} fill={GROUND} stroke={INK} strokeWidth={7}/><EEGHeadset x={545} y={830-55*(1-p)} scale={.96} mode="side" f={g}/><GripHand x={705} y={850} reach={bp(5)} scale={.45} cuffColor={GROUND}/><g opacity={bp(5)}><Plate x={540} text="TRAINING DEMONSTRATION" y={1203} width={610}/></g><Notebook x={170} y={1183} s={.16} f={g}/><Plate x={540} text="UNIVERSITY OF ALASKA ANCHORAGE" y={600}/><Plate x={540} text="DRY EEG · DSI-24" y={1140} width={590}/></g>;
 else if(n===3) {
  // Funding leads into a sheet that two people actually handle. Keep the notice
  // fixed for reading; each motion changes the training leaflet or its grip.
  const present=bp(8,42,18),openTraining=bp(8,45,62),share=bp(9,40);
  const trainingX=580*(1-present),trainingY=45*(1-present),pageLift=18*Math.sin(share*Math.PI);
  art=<g>
   <g transform={`translate(0 ${60*(1-bp(6))}) rotate(${-3*(1-bp(6))} 540 760)`}><Sheet x={120} y={595} w={840} h={340} fill={PAPER} fiber="fiber0912" curl={1}/><path d="M120 640h840" stroke={CORAL} strokeWidth={11}/><Fit text="SEPTEMBER 9TH" y={739} size={56} mono/>
    <g transform={`translate(${40*(1-bp(7))} 0)`}><Plate x={540} text="AI AND ROBOTICS LAB" y={654} width={700} color={CITRON}/></g>
    <g transform={`translate(0 ${40*(1-bp(8))}) scale(1 ${.12+.88*bp(8)})`} opacity={bp(8)} style={{transformOrigin:'540px 860px'}}><rect x={160} y={780} width={760} height={125} rx={8} fill={CORAL} stroke={INK} strokeWidth={4}/><Fit text="EDUCATIONAL LEGACY FUND" y={855} size={36} width={700}/></g>
   </g>
   <g opacity={present} transform={`translate(${trainingX} ${trainingY})`}>
    <ContactShadow cx={546} cy={1247} rx={365} ry={16} opacity={.22}/>
    <Sheet x={160} y={951} w={760} h={281} fill={GROUND} curl={1}/>
    <path d="M182 966H895" stroke={CITRON} strokeWidth={5}/>
    <g transform={`translate(160 951) scale(1 ${.07+.93*openTraining})`}>
     <Sheet x={0} y={0} w={760} h={281} fill={PAPER} fiber="fiber0912" curl={1}/>
     <path d={`M25 253Q370 ${253-pageLift} 735 253`} fill="none" stroke={GROUND} strokeWidth={4}/>
     <Fit text="TRAINING DEMONSTRATION" x={380} y={69} size={28} width={690} mono/>
     <g opacity={share}><Fit text="STUDENTS + FACULTY TRAINED" x={380} y={143} size={34} width={690}/></g>
     <path d={`M698 279Q${697-12*share} ${230-pageLift} 757 ${236-pageLift}`} fill={CITRON} stroke={INK} strokeWidth={3}/>
    </g>
   </g>
   <Notebook x={220} y={1290} s={.17} f={g}/>
   <g transform={`rotate(${-4*openTraining+4*share} 900 1190)`}><GripHand x={900+trainingX} y={1190+trainingY-18*openTraining-pageLift} reach={present} scale={.48} cuffColor={GROUND}/></g>
   <g transform={`translate(1080 0) scale(-1 1) rotate(${-3*share} 899 1190)`}><GripHand x={899} y={1190-18*openTraining+10*share} reach={openTraining*(1-.06*Math.sin(share*Math.PI))} scale={.43} skin="#b97960" cuffColor={CORAL}/></g>
  </g>;
 }
 else if(n===4) art=<EEGDemo0912 f={g} observationAt={(beats.find(b=>b.id===11)?.at??999)*30} bp={bp}/>;
 else if(n===5) art=<g><g transform={`translate(0 ${44*(1-bp(13))})`}><Notebook x={480} y={930} s={1} f={g} task={bp(15)} open={.6+.4*bp(13)}/></g>
 <MotionBlur vx={185*(bp(14)-bp(14,25,1))} vy={190*(bp(14)-bp(14,25,1))} gain={.5} max={10}><g transform={`translate(${240+185*bp(14)} ${850+190*bp(14)}) rotate(${-6+6*bp(14)})`}><rect x={-130} y={-42} width={260} height={84} rx={5} fill={CITRON} stroke={INK} strokeWidth={4}/><Fit text="EXISTING RECORDING" x={0} y={-3} size={20} width={235} mono/><path d="M-105 20q30-17 58 0t62 0t68 0" fill="none" stroke={INK} strokeWidth={3}/></g></MotionBlur>
 <GripHand x={550} y={1040} reach={bp(14)} scale={.46} cuffColor={GROUND}/>
 <g transform={`translate(838 805) rotate(${-18*bp(16)})`}><path d="M0 0h45v158H0" fill={CORAL} stroke={INK} strokeWidth={4}/><path d="M7 10v130" fill="none" stroke={PAPER} strokeWidth={3}/></g>
 <Plate x={540} text="PUBLIC DATA + OWN-TASK PLANS" y={590}/><Fit text="COLLECTION STILL AHEAD" y={1224} size={30} width={760} mono/></g>;
 else if(n===6) art=<g><Notebook x={390} y={1010} s={.69} f={g}/><Sheet x={155} y={730} w={450} h={320} fill={PAPER}/><Fit text="EXAMPLE TRAINING" x={380} y={790} size={32} width={400} mono/><path d="M210 835h330v165H210Z" fill="none" stroke={GROUND} strokeWidth={4}/><Marker x={930-130*p} y={950} s={1.3}/><path d="M705 1060h185" stroke={CORAL} strokeWidth={9}/><Fit text="OUTSIDE TRAINING" x={800} y={1125} size={25} width={310} mono/><Plate x={540} text="GENERAL METHODS EXAMPLE" y={585}/><Plate x={540} text="IF NEW PEOPLE" y={1220} width={600} color={CITRON}/></g>;
 else if(n===7) art=<g><Notebook x={430} y={1030} s={.65} f={g}/>
 <g transform={`translate(545 ${795+55*(1-bp(18))})`}><path d="M-355-95q178-55 355 0q175-55 350 0V173q-175-40-350 0q-177-40-355 0Z" fill={CITRON} stroke={INK} strokeWidth={7}/><path d="M-341-89q170-42 341 0q169-42 335 0V159q-173-30-335 0q-173-30-341 0Z" fill={PAPER} stroke={INK} strokeWidth={3}/><path d="M0-86V158" stroke={GROUND} strokeWidth={8}/>{[-295,43].map(x=><g key={x}>{[0,1,2,3].map(i=><path key={i} d={`M${x} ${-45+i*41}q113-20 245 0`} fill="none" stroke={GROUND} strokeWidth={5}/>)}</g>)}<g transform={`translate(115 -110) rotate(${12*Math.sin(bp(19)*Math.PI)*Math.exp(-bp(19))})`}><path d="M0 0h45v172l-23-16-22 16Z" fill={CORAL} stroke={INK} strokeWidth={4}/></g></g>
 <Plate x={540} text="PLANNED · READING" y={580}/><g opacity={bp(19)}><Plate x={540} text="COGNITIVE STATES" y={1128} width={540} color={CITRON}/></g><GripHand x={778} y={1090} reach={bp(19)} scale={.43} cuffColor={GROUND}/><Fit text="STUDY TARGET · ANSWERS AHEAD" y={1230} size={27} width={800} mono/></g>;
 else if(n===8) art=<g><g transform={`translate(0 ${50*(1-p)})`}><rect x={160} y={625} width={760} height={465} rx={26} fill={INK}/><rect x={181} y={650} width={718} height={360} rx={12} fill={PAPER}/><path d="M230 725h200m-160 65h320m-360 65h280" stroke={GROUND} strokeWidth={10}/><circle cx={290+400*bp(21)} cy={925} r={30} fill={CORAL} stroke={INK} strokeWidth={6}/><Fit text="PLANNED EYE MOVEMENTS" y={1065} size={27} color={PAPER}/><g opacity={bp(22)} transform={`translate(0 ${28*(1-bp(22))})`}><rect x={555} y={717} width={300} height={255} rx={8} fill={PAPER} stroke={GROUND} strokeWidth={4} strokeDasharray="12 10"/><Fit text="ANSWERS AHEAD" x={705} y={774} size={27} width={270} mono/></g></g><Plate x={540} text="PLANNED · PROGRAMMING" y={560}/><Notebook x={350} y={1200} s={.32} f={g}/><Trace x={615} y={1160} f={g} s={.62}/><Fit text="PLANNED BRAIN ACTIVITY" x={715} y={1281} size={24} width={440} mono/></g>;
 else if(n===9) art=<g><g opacity={bp(23)} transform={`translate(0 ${45*(1-bp(23))})`}>{[0,1,2].map(i=><g key={i}><rect x={125} y={650+i*145} width={830} height={118} fill={GROUND} stroke={INK} strokeWidth={5}/>{[0,1,2,3,4].map(k=><Sheet key={k} x={155+k*155} y={662+i*145} w={130} h={95} fill={PAPER}/>)}</g>)}</g><Notebook x={540} y={1100-80*p} s={1.05} f={g}/><Plate x={540} text="EXISTING RECORDINGS" y={585}/><g><rect x={612} y={642} width={340} height={121} rx={8} fill={PAPER} stroke={INK} strokeWidth={4}/><Marker x={915} y={699} s={.48}/><Fit text="IF NEW PEOPLE" x={747} y={686} size={24} width={252} mono/><Fit text="METHODS EXAMPLE" x={747} y={726} size={22} width={252} mono/></g></g>;
 else if(n===10) art=<g><Plate x={540} text="GENERAL EXAMPLE" y={565}/><Notebook x={390} y={1070} s={.57} f={g}/>
 <Sheet x={125} y={675} w={435} h={330} fill={PAPER} fiber="fiber0912"/><Fit text="QUESTION A" x={340} y={731} size={34} width={385} mono/>
 <g transform={`translate(${160+64*bp(24)} ${805+55*bp(24)})`}><rect x={-18} y={-36} width={300} height={66} rx={8} fill={CITRON} stroke={INK} strokeWidth={4}/><Fit text="RECORDING A" x={132} y={6} size={28} width={270} mono/></g>
 <g opacity={bp(25)}><Trace x={162} y={947} s={.93} f={g} p={bp(25)}/><path d={`M180 ${907+3*Math.sin(g/12)}q55-22 90 0t95 0t92 0`} fill="none" stroke={GROUND} strokeWidth={5}/></g>
 <g opacity={bp(26)} transform={`translate(${45*(1-bp(26))} 0)`}><Sheet x={625} y={738} w={310} h={316} fill={PAPER}/><Fit text="QUESTION B" x={780} y={791} size={28} width={280} mono/><g transform={`translate(${-18*Math.sin(bp(27)*Math.PI)} 0)`}><rect x={655} y={825} width={250} height={62} fill={CORAL} stroke={INK} strokeWidth={4}/><Fit text="ASSESS FIT" x={780} y={865} size={26} width={230} mono/></g><path d="M650 930h260v99H650Z" fill="none" stroke={GROUND} strokeWidth={4} strokeDasharray="12 10"/></g>
 <g opacity={bp(28)}><path d={`M${885-40*bp(28)} 900l-46 155`} stroke={INK} strokeWidth={16} strokeLinecap="round"/><path d={`M${885-40*bp(28)} 900l-46 155`} stroke={CITRON} strokeWidth={9}/><path d="M666 963h221v58" fill="none" stroke={CORAL} strokeWidth={5}/></g><GripHand x={877} y={990} reach={bp(28)} scale={.43} cuffColor={GROUND}/><Plate x={540} text="OPTIONAL COLLECTION" y={1210} width={660}/></g>;
 else if(n===11) art=<g><Notebook x={365} y={925} s={.81} wing={p} f={g} shuffle={2.8*bp(30)}/><g opacity={bp(31)} transform={`translate(${785+28*(1-bp(31))} ${875+35*(1-bp(31))})`}><rect x={-97} y={-28} width={195} height={58} rx={6} fill={CITRON} stroke={INK} strokeWidth={4}/><Fit text="TASK PLAN" x={0} y={9} size={26} width={178} mono/></g><Plate x={540} text="STUDENTS CAN HELP DESIGN THE PLAN" y={590} color={CITRON}/><GripHand x={810} y={1020} reach={bp(31)} scale={.55} cuffColor={GROUND}/><g opacity={bp(32)} transform={`translate(0 ${35*(1-bp(32))})`}><Sheet x={140} y={751} w={820} h={345} fill={PAPER} fiber="fiber0912"/><Fit text="RECORDING" x={370} y={820} size={34} width={360}/><Trace x={205} y={920} s={.78} f={g}/><Fit text="INTERPRETATION" x={781} y={820} size={30} width={310}/><rect x={620} y={856} width={298} height={190} rx={6} fill="none" stroke={GROUND} strokeWidth={4} strokeDasharray="12 10"/></g></g>;
 else if(n===12) art=<g><Plate x={540} text="GENERAL METHODS EXAMPLE" y={565}/><g transform={`translate(0 ${35*(1-bp(33))})`}><Plate x={540} text="IF A MODEL CLAIMS NEW PEOPLE" y={650} color={CITRON}/></g><rect x={140} y={765} width={330} height={320} rx={15} fill={PAPER} stroke={INK} strokeWidth={7}/><rect x={620} y={765} width={330} height={320} rx={15} fill={PAPER} stroke={INK} strokeWidth={7}/><Fit text="TRAINING" x={305} y={835} size={33} width={300}/><Fit text="TEST" x={785} y={835} size={33} width={300}/><QuestionToken x={545} y={917} scale={.58} text="TEST?" color={CORAL} faceColor={PAPER} inkColor={INK} rimColor={CITRON}/><path d="M575 1000V845" stroke={CORAL} strokeWidth={6} strokeDasharray="9 8"/><Marker x={975-190*bp(34)} y={944} s={1.06}/><g opacity={bp(35)}><path d="M650 1100h270v94H650Z" fill={PAPER} stroke={INK} strokeWidth={4}/><Fit text="EVALUATE" x={785} y={1160} size={26} width={230} mono/></g><Notebook x={440} y={1210} s={.28} wing={1} f={g}/></g>;
 else if(n===13) art=<g><Notebook x={382} y={1035} s={.78} wing={1} f={g}/><g transform={`translate(0 ${-95*bp(36)}) scale(1 ${1-.46*bp(36)})`} style={{transformOrigin:'540px 820px'}}><Sheet x={240} y={635} w={650} h={280} fill={GROUND}/><Fit text="METHODS" y={734} size={44} color={PAPER}/><Fit text="GENERAL PRINCIPLE" y={812} size={30} color={PAPER} mono/></g>
 <g transform={`translate(0 ${70*(1-bp(37))})`}><Sheet x={155} y={805} w={735} h={235} fill={PAPER} fiber="fiber0912"/><Fit text="UAA STUDIES" y={882} size={46}/><Fit text="PLANNED" y={974} size={43} mono/></g><GripHand x={775} y={1036} reach={bp(37)} scale={.44} cuffColor={GROUND}/><Plate x={540} text="RESEARCH PRINCIPLE · NO UAA RESULT" y={1228}/></g>;
 else art=<g><Notebook x={410} y={945} s={.76} wing={1} open={1-.13*bp(39)} f={g}/><path d={`M${800-150*p} 630l-75 300`} stroke={INK} strokeWidth={25} strokeLinecap="round"/><path d={`M${800-150*p} 630l-75 300`} stroke={CITRON} strokeWidth={16}/><GripHand x={740-150*p} y={830} reach={p} scale={.58} cuffColor={GROUND}/><Plate x={540} text="WHICH QUESTION ABOUT LEARNING?" y={585}/></g>;
 const quiet=(n===4&&bp(12)>0)||(n===11&&bp(30)===0);
 // Carry the camera through the whole shot; prop entrances keep their quick easing.
 const cameraTravel=interpolate(g-from,[0,dur],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.quad)});
 const push=(distance:number)=>CameraMoves.dollyThrough((200+distance*cameraTravel)/(200+distance),distance);
 const cam=n===1?composeCams(CameraMoves.orbitReveal(cameraTravel,12),push(45)):
 n===2?composeCams(CameraMoves.craneDown(.6+.4*cameraTravel,75),CameraMoves.orbitReveal(cameraTravel,4)):
 n===3?composeCams(CameraMoves.craneDown(.65+.35*cameraTravel,80),CameraMoves.truckAcross(cameraTravel,30)):
 n===4?composeCams(CameraMoves.orbitReveal(cameraTravel,16),push(65)):
 n===5?composeCams(CameraMoves.truckAcross(cameraTravel,90),CameraMoves.orbitReveal(cameraTravel,6)):
 n===6?composeCams(CameraMoves.orbitReveal(cameraTravel,16),push(70)):
 n===7?composeCams(CameraMoves.craneDown(.7+.3*cameraTravel,60),CameraMoves.truckAcross(cameraTravel,35)):
 n===8?composeCams(CameraMoves.truckAcross(cameraTravel,125),CameraMoves.orbitReveal(cameraTravel,12)):
 n===9?composeCams(CameraMoves.craneDown(.6+.4*cameraTravel,85),CameraMoves.orbitReveal(cameraTravel,8)):
 n===10?composeCams(CameraMoves.truckAcross(cameraTravel,70),CameraMoves.craneDown(.82+.18*cameraTravel,30)):
 n===11?composeCams(CameraMoves.orbitReveal(cameraTravel,10),push(20)):
 n===12?composeCams(CameraMoves.truckAcross(cameraTravel,100),CameraMoves.orbitReveal(cameraTravel,8)):
 n===13?composeCams(CameraMoves.craneDown(.7+.3*cameraTravel,55),push(20)):
 composeCams(CameraMoves.orbitReveal(cameraTravel,16),push(75));
 const room=n<=4?'lab':n===7?'reading':n===8?'programming':n>=12?'methods':'archive';
 return <AbsoluteFill><Stage3D background={SKY} camera={cam}>
 <Plane z={480} fill><SVG><defs><linearGradient id="room0912" x2="1" y2="1"><stop stopColor="#F3ECFE"/><stop offset=".46" stopColor={SKY}/><stop offset="1" stopColor="#B8AFDC"/></linearGradient><linearGradient id="desk0912" x2=".2" y2="1"><stop stopColor="#A99BCD"/><stop offset=".3" stopColor={GROUND}/><stop offset="1" stopColor="#4E467D"/></linearGradient></defs><rect data-band="ok" width={W} height={H} fill="url(#room0912)"/><path d="M0 1090H1080V1920H0Z" fill="url(#desk0912)" data-band="ok"/>
 <g opacity={quiet?0:.6}><path d="M90 150H540V680H90Z" fill={PAPER} stroke="#B6A9D3" strokeWidth={13}/><path d="M315 150V680M90 410H540" stroke="#B6A9D3" strokeWidth={12}/><path d="M100 160L630 1040H1060L535 160Z" fill={PAPER} opacity={.32}/><path d="M70 690H570" stroke={INK} strokeWidth={15} opacity={.5}/>
 {Array.from({length:12},(_,i)=><circle key={i} cx={120+(i*83)%810} cy={360+(i*47)%480+4*Math.sin(g/65+i)} r={2+(i%2)} fill={PAPER} opacity={.4}/>)}</g>
 {Array.from({length:9},(_,i)=><path data-band="ok" key={i} d={`M0 ${1240+i*72}Q320 ${1190+i*72} 570 ${1260+i*72}T1080 ${1240+i*72}`} stroke={INK} opacity={.045} strokeWidth={4} fill="none"/>)}</SVG></Plane>
 <Plane z={160}><SVG><g opacity={quiet?0:.55*(n===9?bp(23):1)}>
 {room==='archive'?<g><path d={`M88 577h112v57q-55 ${14+12*Math.sin(g/29)+4*Math.sin(g/71)} -112 0Z`} fill={CORAL} stroke={INK} strokeWidth={4}/><path d={`M929 627q${20+13*Math.sin(g/33)+4*Math.sin(g/77)} 36 0 74t0 74`} fill="none" stroke={INK} strokeWidth={6}/><path d={`M105 1185q80 ${13+16*Math.sin(g/31)+5*Math.sin(g/73)} 155 0`} fill="none" stroke={CORAL} strokeWidth={9}/>{[0,1,2].map(i=><g key={i}><rect x={70} y={650+i*160} width={930} height={130} rx={8} fill={GROUND} stroke={INK} strokeWidth={6}/>{[0,1,2,3,4,5].map(k=><g key={k}><rect x={93+k*148} y={663+i*160} width={126} height={91} rx={6} fill={PAPER} stroke={INK} strokeWidth={4}/><path d={`M${135+k*148} ${710+i*160}h43`} stroke={CORAL} strokeWidth={8}/></g>)}</g>)}</g>:<g><path d={n===4?"M758 661V535h56":"M125 775V520h72"} fill="none" stroke={INK} strokeWidth={9}/><g transform={`translate(${n===4?820:202} ${n===4?570:543}) rotate(${quiet?0:8*Math.sin(g/29)+3*Math.sin(g/71)})`}><rect x={-58} y={-25} width={116} height={68} rx={8} fill={CORAL} stroke={INK} strokeWidth={4}/><path d="M-25 0h50" stroke={PAPER} strokeWidth={5}/></g><path d={`M920 620q${18+14*Math.sin(g/33)+4*Math.sin(g/77)} 35 0 70t0 70`} fill="none" stroke={INK} strokeWidth={5}/><path d={`M116 1186q74 ${12+Math.sin(g/31)*16+Math.sin(g/73)*5} 150 0`} fill="none" stroke={CORAL} strokeWidth={8}/></g>}
 </g><path d="M75 1214H1015L1028 1270H62Z" fill={GROUND} stroke={INK} strokeWidth={6}/><path d="M80 1217H1010" stroke={PAPER} strokeWidth={5}/></SVG></Plane>
 <Plane z={0}><SVG><PaperFiber id="fiber0912" ruleColor={GROUND}/>{art}</SVG></Plane></Stage3D>
 <GradeLayer f={g} bloom={.22} vignette={.13} grain={.025} warmth={.02}/><SVG><Fit text="ALASKA.AI / DISPATCH" y={255} size={30} color={INK} mono/><Fit text="SEPTEMBER 12TH, 2026" y={300} size={22} color={INK} mono/><Fit text={HEADS[n-1]} y={490} size={38}/></SVG></AbsoluteFill>;

};
const Captions:React.FC<{cues:{t:number;d:number;text:string}[]}>=({cues})=>{const f=useCurrentFrame(),c=cues.find(x=>f/30>=x.t&&f/30<x.t+x.d);if(!c)return null;const words=c.text.split(/\s+/);let cut=Math.ceil(words.length/2),best=Infinity;for(let i=1;i<words.length;i++){const score=Math.max(words.slice(0,i).join(' ').length,words.slice(i).join(' ').length);if(score<best){best=score;cut=i;}}const rows=c.text.length<=38?[c.text]:[words.slice(0,cut).join(' '),words.slice(cut).join(' ')],size=Math.min(40,950/(Math.max(...rows.map(x=>x.length))*.58));return <AbsoluteFill><SVG><rect data-band="ok" x={0} y={CAPTION_TOP} width={W} height={CAPTION_H} fill={INK}/>{rows.map((s,i)=><text data-band="ok" key={i} x={540} y={CAPTION_TOP+(rows.length===1?80:50)+i*47} textAnchor="middle" fontFamily={FONT} fontSize={size} fontWeight={850} fill={PAPER}>{s}</text>)}</SVG></AbsoluteFill>};
export const ep0912Schema=z.object({captions:z.array(z.object({t:z.number(),d:z.number(),text:z.string()})).optional(),scenes:z.array(z.object({from:z.number(),dur:z.number()})).optional(),total:z.number().optional(),lines:z.array(z.number()).optional(),beats:z.array(z.object({id:z.number(),at:z.number(),label:z.string()})).optional(),credits:z.any().optional(),mouth:z.any().optional(),accents:z.any().optional()});
export const Ep0912:React.FC<z.infer<typeof ep0912Schema>>=({captions=[],scenes=[],total=3900,beats=[],credits,mouth=[],accents=[]})=>{const end=total-(credits?.frames??369);return <VoiceProvider data={{fps:30,mouth,accents}}><AbsoluteFill style={{backgroundColor:SKY}}>{scenes.map((s,i)=><Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i+1}`}><Shot n={i+1} from={s.from} dur={s.dur} beats={beats}/></Sequence>)}<Captions cues={captions}/>{credits&&<Sequence from={end} durationInFrames={credits.frames} name="CREDITS"><EndCredits data={credits} durationInFrames={credits.frames} paperDesk/></Sequence>}</AbsoluteFill></VoiceProvider>};
