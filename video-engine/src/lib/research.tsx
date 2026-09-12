import React from 'react';
import {ContactShadow, RimLight, tones, FormGradient} from './lighting';

// Nineteen scalp contacts only. Earclips and the three empty auxiliary inputs
// are separate shapes and are never included in the scalp-electrode count.
export const SCALP_CONTACTS:readonly [number,number][]=[
 [-67,-151],[67,-151],[-146,-82],[-76,-82],[0,-82],[76,-82],[146,-82],
 [-173,0],[-88,0],[0,0],[88,0],[173,0],
 [-146,82],[-76,82],[0,82],[76,82],[146,82],[-67,151],[67,151],
];
export const EEGHeadset:React.FC<{
 x?:number;y?:number;scale?:number;f:number;mode?:'contact'|'side'|'array';
 spread?:number;body?:string;contact?:string;ink?:string;highlight?:number;
}>=({x=0,y=0,scale=1,f,mode='array',spread=1,body='#776CB6',contact='#E4EC65',ink='#25213D',highlight=-1})=>{
 const uid=`eeg-${React.useId().replace(/:/g,'')}`,t=tones(body),c=tones(contact);
 const p=Math.max(0,Math.min(1,spread));
 const pad=(cx:number,cy:number,i:number)=><g key={i} data-scalp-contact={i+1} transform={`translate(${cx} ${cy})`}><ellipse cy={8} rx={25} ry={23} fill={ink} opacity={.35}/><path d="M-23 0v15q23 19 46 0V0" fill={t.shade} stroke={ink} strokeWidth={3}/><circle r={23} fill={`url(#${uid}-contact)`} stroke={ink} strokeWidth={4}/><circle r={14} fill={c.shade} stroke={ink} strokeWidth={2.3}/><path d="M-15 -7q8-13 23-6" fill="none" stroke={c.key} strokeWidth={4} strokeLinecap="round"/><circle r={4.5} fill={ink}/>{highlight===i&&<circle r={31} fill="none" stroke="#FFF9E8" strokeWidth={5}/>}</g>;
 return <g transform={`translate(${x} ${y}) scale(${scale})`} data-research-sensor="schematic"><FormGradient id={`${uid}-body`} t={t}/><FormGradient id={`${uid}-contact`} t={c}/>
 {mode==='contact'?<g><ContactShadow cx={0} cy={120} rx={118} ry={25} opacity={.27}/><g transform="scale(4)">{pad(0,0,0)}</g></g>:<>
 <ContactShadow cx={0} cy={240} rx={210} ry={27} opacity={.28}/>
 {mode==='side'?<g><path d="M-200 70Q-190-180 0-180T200 70L164 95Q152-140 0-140T-165 95Z" fill={`url(#${uid}-body)`} stroke={ink} strokeWidth={7}/><path d="M-177 21Q-45-120 170 19" fill="none" stroke={t.key} strokeWidth={11}/>{[-120,0,120].map((cx,i)=><g key={i} transform={`translate(${cx} ${-102+Math.abs(cx)*.38}) scale(.72)`}>{pad(0,0,i)}</g>)}<path d="M-24 90H24V200H-24Z" fill={t.shade} stroke={ink} strokeWidth={5}/><ellipse cy={205} rx={138} ry={23} fill={`url(#${uid}-body)`} stroke={ink} strokeWidth={6}/></g>:<g>
 <ellipse cy={9} rx={215} ry={223} fill={t.shade} stroke={ink} strokeWidth={7}/><ellipse rx={215} ry={220} fill={`url(#${uid}-body)`} stroke={ink} strokeWidth={7}/>
 <path d="M-188 -78Q0-155 188-78M-213 0H213M-188 78Q0 150 188 78M-75-196Q-125 0-75 196M75-196Q125 0 75 196M0-220V220" fill="none" stroke={ink} strokeWidth={12} opacity={.72}/>
 <path d="M-188 -83Q0-160 188-83M-213-5H213M-188 73Q0 145 188 73M-80-196Q-130 0-80 196M70-196Q120 0 70 196M-5-220V220" fill="none" stroke={t.key} strokeWidth={4} opacity={.7}/>
 <RimLight d="M-214 0Q-215-203-35-218" color="#FFF9E8" w={5}/>
 {SCALP_CONTACTS.map(([cx,cy],i)=>pad(cx*p,cy*p,i))}
 {[-1,1].map(side=><g key={side} transform={`translate(${side*250} 78) rotate(${side*(4+Math.sin(f/21)*1.4)})`} data-earclip="true"><path d={`M${-side*24}-35Q${-side*43}-11 ${-side*37}45`} stroke={ink} strokeWidth={5} fill="none"/><path d="M-12-30h24l7 62H-18Z" fill="#ED9575" stroke={ink} strokeWidth={4}/><path d="M-3-24v45" stroke="#FFF9E8" strokeWidth={3}/></g>)}
 <g transform="translate(0 244)" data-aux-inputs="three-empty"><rect x={-79} y={-18} width={158} height={53} rx={12} fill={`url(#${uid}-body)`} stroke={ink} strokeWidth={5}/>{[-48,0,48].map(cx=><g key={cx}><circle cx={cx} cy={8} r={12} fill={ink}/><circle cx={cx} cy={8} r={7} fill={t.shade}/></g>)}</g>
 </g>}
 <path d={`M160 189Q${212+Math.sin(f/27)*5} 274 163 286T212 341`} fill="none" stroke={ink} strokeWidth={6} strokeLinecap="round"/>
 </>}
 </g>;
};
