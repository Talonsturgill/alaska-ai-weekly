import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, INK, ContactShadow, tones, FormGradient} from './lib/lighting';
import {VoiceProvider} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {FO, Folio, AerialBG, DeskBG, ExteriorBG, SenateBG, CounterBG, MapSheet, Stamp, ReceiptTag, DottedBuilding, LetterSheet, CouncilSign, WitnessChair, CoinStack, Headlights, Paperclip, VoteLamp, OctNote} from './lib/folio';
import {IDS} from './Ep1020Ids';

// ADL 234762, 2026-10-20. Palette roles are art_direction.json. FIREWEED MAGENTA is only what is missing or not yet true, MANILA is only the folder, tabs and plan sheet,
// BANKER GREEN only lamps and the hearing-room wall. Every painted string is a claims.json on_screen string, a quote, or a plain label. Ruaro, Giessel and Crowther appear
// only as plates and a nameplate, never as drawn people. Folio is a labelled metaphor for the record, never a claim about how any project works beyond what claims.json says.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

const MONO = "'JetBrains Mono', monospace";
const SERIF = 'Fraunces, Georgia, serif';
const C = {ink: INK, paper: FO.paper};
const monoW = (text: string, size: number, ls = 1.5) => text.length * size * 0.602 + ls * (text.length - 1);

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.18, 0.76, 0.24, 1);
const ease = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const easeIO = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const easeIn = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
const spring = (f: number, a: number, d = 20) => {
  const t = clamp01((f - a) / d);
  if (t <= 0) return 0;
  return 1 - Math.pow(2, -9 * t) * Math.cos((t * d - 1.2) * 0.9);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** a decaying squash bump that starts at frame a: 0 before, 1 at contact, rebounding with overshoot */
const bump = (f: number, a: number, len = 16) => (f < a ? 0 : Math.max(0, 1 - (f - a) / len) * (0.55 + 0.45 * Math.cos((f - a) / 1.6)));

type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]; bt: (id: number) => number};
type SceneProps = {p: SP};

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'ink' | 'paper' | 'felt' | 'plum' | 'indigo' | 'green';
const TONES: Record<Tone, {fill: string; fg: string}> = {
  ink: {fill: FO.navy, fg: FO.cream},
  paper: {fill: FO.cream, fg: FO.navy},
  felt: {fill: FO.manila, fg: FO.navy},
  plum: {fill: FO.magentaDeep, fg: FO.cream},
  indigo: {fill: FO.slateDeep, fg: FO.cream},
  green: {fill: FO.green, fg: FO.cream},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. */
const Plate: React.FC<{text: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number; drop?: number; dashed?: boolean}> =
({text, displayLines, x = 540, y, size = 30, tone = 'ink', p = 1, rot = 0, drop = 0, dashed = false}) => {
  const ls = displayLines ?? [text];
  const w = Math.min(1020, Math.max(...ls.map((l) => monoW(l, size))) + 56);
  const h = ls.length * (size + 16) + 14;
  const yy = Math.min(y, CAP_GUARD - h / 2);
  assertCropSafe(ls.join(' '), yy - h / 2, yy + h / 2);
  const t = TONES[tone];
  const k = clamp01(p);
  if (k <= 0.01) return null;
  const fr = useCurrentFrame();
  const sc = (0.84 + 0.16 * spring(k * 20, 0, 20)) * (1 + 0.012 * Math.sin(fr / 11 + x * 0.01));
  return (
    <g opacity={Math.min(1, k * 1.6)} transform={`translate(${x} ${yy - drop * (1 - k)}) rotate(${rot}) scale(${sc})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={6} fill="#000" opacity={0.3} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={t.fill} stroke={C.ink} strokeWidth={4} />
      {dashed && <rect x={-w / 2 + 7} y={-h / 2 + 7} width={w - 14} height={h - 14} rx={3} fill="none" stroke={t.fg} strokeWidth={2.4} strokeDasharray="10 7" strokeDashoffset={-fr * 0.6} opacity={0.8} />}
      {ls.map((l, i) => (
        <text key={i} x={0} y={-h / 2 + 7 + (size + 16) * (i + 0.5) + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800}
          fontSize={size} letterSpacing={1.5} fill={t.fg}>{l}</text>
      ))}
    </g>
  );
};

/** A boxed quote, serif on paper with the attribution under it. `text` is "quote · attribution". */
const QuotePlate: React.FC<{text: string; x?: number; y: number; size?: number; wrap?: number; p?: number; rot?: number}> =
({text, x = 540, y, size = 34, wrap = 30, p = 1, rot = 0}) => {
  const parts = text.split(' · ');
  const by = parts.length > 1 ? parts.slice(1).join(' · ') : undefined;
  const lines: string[] = [];
  let cur = '';
  parts[0].split(' ').forEach((w) => { if ((cur + ' ' + w).trim().length > wrap) { lines.push(cur.trim()); cur = w; } else cur = (cur + ' ' + w).trim(); });
  if (cur) lines.push(cur);
  const k = clamp01(p);
  if (k <= 0.01) return null;
  const tw = Math.min(1000, Math.max(...lines.map((l) => l.length * size * 0.68), by ? monoW(by, 20) : 0) + 80);
  const th = lines.length * (size + 10) + (by ? 46 : 0) + 36;
  const yy = Math.min(y, CAP_GUARD - th / 2);
  assertCropSafe(lines.join(' '), yy - th / 2, yy + th / 2);
  const sc = 0.6 + 0.4 * spring(k * 18, 0, 18);
  return (
    <g transform={`translate(${x},${yy}) rotate(${rot}) scale(${sc})`} opacity={Math.min(1, k * 2)}>
      <rect x={-tw / 2 + 10} y={-th / 2 + 12} width={tw} height={th} fill="#000" opacity={0.3} />
      <rect x={-tw / 2} y={-th / 2} width={tw} height={th} fill={C.paper} stroke={C.ink} strokeWidth={7} />
      <rect x={-tw / 2 + 11} y={-th / 2 + 11} width={tw - 22} height={th - 22} fill="none" stroke={C.ink} strokeWidth={2.2} />
      {lines.map((l, i) => (
        <text key={i} x={0} y={-th / 2 + 22 + size * 0.86 + i * (size + 10)} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={size} fill={C.ink}>{l}</text>
      ))}
      {by && <text x={0} y={th / 2 - 22} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={20} letterSpacing={1} fill={FO.slateDeep}>{by}</text>}
    </g>
  );
};

// ---- the shot frame: push, kick, grade ---------------------------------------------------------
const CHIP = 'ILLUSTRATION';
const Frame: React.FC<{p: SP; z0?: number; z1?: number; zk?: (f: number) => number; dx0?: number; dx1?: number; dy0?: number; dy1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; tag?: boolean; overlay?: React.ReactNode; tagText?: string; children: React.ReactNode}> =
({p, z0 = 1, z1 = 1.05, zk, dx0 = 0, dx1 = 0, dy0 = 0, dy1 = 0, bloom = 0.05, vignette = 0.28, ox = 540, oy = 900, tag = true, overlay, tagText = CHIP, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const z = zk ? zk(p.f) : lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur)));
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${jl.x + lerp(dx0, dx1, t) + 9 * Math.sin(p.f / 23)}px, ${jl.y + lerp(dy0, dy1, t) + 12 * Math.sin(p.f / 17 + 1)}px) rotate(${0.35 * Math.sin(p.f / 31)}deg) scale(${z * jl.scale * (1 + 0.009 * Math.sin(p.f / 13))})`, transformOrigin: `${ox}px ${oy}px`}}>
        {children}
      </div>
      {overlay && <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>{overlay}</svg>}
      {tag && (
        <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <g data-band="ok">
            <rect x={50} y={436} width={monoW(tagText, 20) + 30} height={38} rx={5} fill="#10151F" stroke={C.paper} strokeWidth={2.4} opacity={0.92} />
            <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill={C.paper}>{tagText}</text>
          </g>
        </svg>
      )}
      <GradeLayer f={p.f} bloom={bloom} vignette={vignette} grain={0.05} warmth={0.02} />
    </AbsoluteFill>
  );
};

// ---- S1: the folder skids in, the chair swivels, a forest pokes out (keys 1, 2, 49, 3) ------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t1 = b(1), t2 = b(2), t49 = b(49), t3 = b(3);
  const skid = ease(f, 0, 22);
  const x = lerp(-420, 540, skid);
  const land = bump(f, 20, 14);
  const lean = ease(f, t49, 22);
  const forest = ease(f, t49, 26);
  const flick = f > t3 && f < t3 + 46 ? (Math.sin((f - t3) * 1.4) > -0.2 ? 1 : 0.15) * (1 - easeIn(f, t3 + 30, 16)) : 0;
  const swing = 6 * ease(f, t2, 12) * (1 - ease(f, t2 + 30, 30)) * Math.sin((f - t2) / 6);
  return (
    <Frame p={p} z0={1.0} z1={1.07} oy={1100}
      overlay={<>
        <Plate text="WHAT DOES THE STATE HAND OVER?" y={530} size={34} tone="ink" p={ease(f, t1 + 4, 8)} />
      </>}>
      <SVG>
        <DeskBG f={g} desk={1180} id="s1d" chairSwing={swing} />
        {flick > 0 && <DottedBuilding x={690} y={1090} f={g} scale={0.6} k={flick} label="" />}
        {f < 26 && skid < 1 && [0, 1, 2, 3].map((i) => <ellipse key={i} cx={x - 200 - i * 40} cy={1192 - i * 6} rx={46 - i * 8} ry={7} fill="#FFFFFF" opacity={0.35 * (1 - skid)} />)}
        <Folio x={x} y={1196} f={g} scale={lerp(0.98, 1.08, lean)} emotion={f < 30 ? 'alert' : 'smug'} sq={land * 0.9} look={lerp(0, 0.8, lean)} forest={forest} tilt={-2 + 4 * lean} id="s1f" />
      </SVG>
    </Frame>
  );
};

// ---- S2: the folder hops, a tab stamp, the plan sheet unrolls (keys 4, 44, 5, 6) ------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t4 = b(4), t44 = b(44), t5 = b(5), t6 = b(6);
  const hop = ease(f, t4 - 4, 22);
  const x = lerp(540, 290, hop);
  const y = 1192 - 170 * Math.sin(hop * Math.PI);
  const land = bump(f, t4 + 18, 12);
  const roll = ease(f, t5, 30);
  const sd = easeIn(f, t44 - 14, 14);
  const stampInk = f >= t44 ? ease(f, t44, 6) : 0;
  const stampOut = f > t44 + 30 ? 1 : 0;
  return (
    <Frame p={p} zk={(ff) => lerp(1.0, 1.08, easeIO(ff, 0, p.dur))} oy={1100}
      overlay={<>
        <Plate text="DNR PROPOSES" y={545} size={40} tone="felt" p={ease(f, t6 + 2, 8)} />
      </>}>
      <SVG>
        <DeskBG f={g} desk={1180} id="s2d" />
        <MapSheet x={700} y={880} f={g} scale={0.8} k={roll} hatch={ease(f, t5 + 20, 20)} pinK={0} rot={-2 + 2 * (1 - roll)} id="s2m" />
        <Folio x={x} y={y} f={g} scale={1.02} emotion={f < t44 ? 'proud' : 'smug'} sq={land * 0.7} look={0.5} forest={0.4 * (1 - ease(f, t5, 20))} id="s2f" />
        {!stampOut && <Stamp x={x} y={y - 470} f={g} scale={0.8} down={sd} ink={stampInk} lines={['COMMENTS CLOSED', 'AUG 19']} size={30} rot={-5} id="s2s" />}
        {stampOut === 1 && <Stamp x={x} y={y - 470} f={g} scale={0.8} down={1} ink={1} lines={['COMMENTS CLOSED', 'AUG 19']} size={30} rot={-5} id="s2s2" />}
      </SVG>
    </Frame>
  );
};

// ---- S3: paper becomes land, the aerial match cut (keys 7, 45, 8) -----------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t7 = b(7), t45 = b(45), t8 = b(8);
  return (
    <Frame p={p} zk={(ff) => lerp(1.3, 1.0, easeIO(ff, 0, 60))} oy={800} tagText="ILLUSTRATION · TRUE SHAPE, SIMPLIFIED"
      overlay={<>
        <Plate text="ABOUT 19,950 ACRES NEAR HOUSTON" displayLines={['ABOUT 19,950 ACRES', 'NEAR HOUSTON']} y={575} size={40} tone="paper" p={ease(f, t7 + 2, 8)} />
        <Plate text="HOUSTON, ALASKA" x={650} y={1255} size={30} tone="ink" p={ease(f, t45 + 2, 8)} />
        <Plate text="AIDEA RECEIVES" y={720} size={38} tone="felt" p={ease(f, t8 + 2, 8)} />
      </>}>
      <SVG>
        <AerialBG f={g} id="s3a" outline={ease(f, 0, 14)} hatch={ease(f, t7, 26)} roofs={ease(f, t45, 16)} />
        <Folio x={880} y={1905} f={g} scale={0.62} emotion="alert" thick={ease(f, t7, 26)} forest={ease(f, t7, 26)} look={-0.6} id="s3f" />
      </SVG>
    </Frame>
  );
};

// ---- S4: a stamp, a receipt, a preliminary stamp (keys 9, 10, 11) -----------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t9 = b(9), t10 = b(10), t11 = b(11);
  const jump = bump(f, t9 + 8, 12);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1000}
      overlay={<>
        <Plate text="NO PAYMENT FOR LAND VALUE" y={545} size={36} tone="ink" p={ease(f, t9 + 6, 8)} />
        <Plate text="PRELIMINARY ONLY · NO FINAL DECISION" y={625} size={30} tone="paper" p={ease(f, t11 + 12, 8)} />
      </>}>
      <SVG>
        <g transform={`translate(0 ${-6 * jump})`}>
          <DeskBG f={g} desk={1180} id="s4d" chair={false} />
          <Folio x={140} y={1285} f={g} scale={0.42} emotion={f < t11 ? 'proud' : 'worried'} look={0.9} id="s4f" />
          <MapSheet x={540} y={920} f={g} scale={1.0} k={1} hatch={1} pinK={0} id="s4m" />
          <Stamp x={540} y={900} f={g} scale={1.1} down={easeIn(f, t9 - 14, 14)} ink={f >= t9 ? ease(f, t9, 5) : 0} lines={['NO PAYMENT', 'FOR LAND VALUE']} size={46} rot={-3} smudge={0} id="s4s1" />
          <ReceiptTag x={lerp(560, 810, ease(f, t10, 26))} y={lerp(900, 1130, easeIn(f, t10, 26))} f={g} scale={0.95} rot={lerp(-20, 6, ease(f, t10, 26))} lines={['SURVEY + CLOSING', 'COSTS · AIDEA PAYS']} k={ease(f, t10, 6)} size={24} />
          <Stamp x={400} y={1110} f={g} scale={0.95} down={easeIn(f, t11 - 14, 14)} ink={f >= t11 ? ease(f, t11, 5) : 0} lines={['PRELIMINARY ONLY', 'NO FINAL DECISION']} size={32} rot={4} smudge={ease(f, t11 + 4, 20)} id="s4s2" />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S5: AIDEA's plan, a dotted data center on the real land (keys 12, 13, 14, 15) ------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t12 = b(12), t13 = b(13), t14 = b(14), t15 = b(15);
  const k = ease(f, t13, 28);
  return (
    <Frame p={p} z0={1.04} z1={1.14} oy={800} tagText="ILLUSTRATION · TRUE SHAPE, SIMPLIFIED"
      overlay={<>
        <Plate text="AIDEA'S OWN PLAN" y={545} size={40} tone="felt" p={ease(f, t12 + 2, 8)} />
        <Plate text="DATA CENTERS · 'POTENTIALLY'" displayLines={['DATA CENTERS', "'POTENTIALLY'"]} y={650} size={38} tone="paper" p={ease(f, t13 + 4, 8)} />
        <Plate text="THE BUILDINGS AI RUNS IN" displayLines={['THE BUILDINGS', 'AI RUNS IN']} y={1180} size={34} tone="ink" p={ease(f, t14 + 2, 8)} />
        <Plate text="NOT A COMMITMENT" y={820} size={38} tone="indigo" dashed p={ease(f, t15 + 2, 8)} />
      </>}>
      <SVG>
        <AerialBG f={g} id="s5a" outline={1} hatch={0.6} roofs={1} />
        <g transform="translate(480 860) scale(1)">
          <DottedBuilding x={0} y={0} f={g} scale={1} k={k} label="" />
          {Array.from({length: 7}, (_, i) => {
            const on = f > t14 + i * 5 ? 1 : 0;
            return on ? <rect key={i} x={-270 + i * 80} y={-130} width={52} height={56} fill={FO.headlight} opacity={0.75 + 0.2 * Math.sin(g / 4 + i)} stroke={INK} strokeWidth={4} /> : null;
          })}
        </g>
        <Folio x={920} y={1905} f={g} scale={0.55} emotion="ask" thick={1} forest={1} look={-0.6} id="s5f" />
      </SVG>
    </Frame>
  );
};

// ---- S6: the July letter and six tabs (keys 16, 17, 18, 19) ------------------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t16 = b(16), t17 = b(17), t18 = b(18), t19 = b(19);
  const tabs = 2 * ease(f, t17, 10) + 2 * ease(f, t18, 10) + 2 * ease(f, t19, 10);
  const open = ease(f, t19 + 14, 18);
  const slide = ease(f, t16, 22);
  const shown = 6 * 0 + 2 * ease(f, t17, 10) + 2 * ease(f, t18, 10) + 2 * ease(f, t19, 10);
  return (
    <Frame p={p} zk={(ff) => lerp(1.0, 1.1, easeIO(ff, 0, p.dur))} oy={1000} dx0={20} dx1={-20}
      overlay={<>
        <Plate text="AIDEA · JULY 30TH LETTER · RANDY RUARO" y={538} size={28} tone="green" p={ease(f, t16 + 4, 8)} />
        <Plate text="NO COMMITTED TENANT · NO SITE PLAN" y={612} size={30} tone="plum" p={ease(f, t17 + 2, 8) * (f < t18 ? 1 : 0)} />
        <Plate text="NO POWER SOURCE · NO COOLING" y={684} size={30} tone="plum" p={ease(f, t18 + 2, 8) * (f < t19 ? 1 : 0)} />
        <Plate text="NO WATER PLAN · NO SCHEDULE" y={756} size={30} tone="plum" p={ease(f, t19 + 2, 8)} />
      </>}>
      <SVG>
        <DeskBG f={g} desk={1180} id="s6d" chair={false} />
        <LetterSheet x={lerp(1500, 800, slide)} y={900} f={g} scale={0.7} rot={lerp(8, -1.5, slide)} head="AIDEA · JULY 30TH" items={['TENANT', 'SITE PLAN', 'POWER', 'COOLING', 'WATER', 'SCHEDULE']} shown={shown} />
        <Folio x={265} y={1195} f={g} scale={1.0} emotion={f < t17 ? 'alert' : 'worried'} look={0.9} tabs={tabs} open={open} blank={0.6 + 0.4 * Math.sin(g / 5)} rattle={0.15 * ease(f, t19, 6)} id="s6f" />
      </SVG>
    </Frame>
  );
};

// ---- S7: shaken, ghosted and hollow (keys 20, 21, 22, 23) ---------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t20 = b(20), t21 = b(21), t22 = b(22), t23 = b(23);
  const open = 1 - ease(f, 0, 16);
  const shake = f >= t20 && f < t20 + 46 ? Math.min(1, (f - t20) / 6) * (1 - easeIn(f, t20 + 30, 16)) : 0;
  const tilt = 9 * Math.sin((f - t20) / 3) * shake;
  const dropT = clamp01((f - (t20 + 10)) / 22);
  const clipY = lerp(760, 1226, dropT * dropT) - (dropT >= 1 ? 26 * Math.abs(Math.sin((f - t20 - 32) / 4)) * Math.max(0, 1 - (f - t20 - 32) / 30) : 0);
  const hollow = ease(f, t23, 10);
  return (
    <Frame p={p} z0={1.0} z1={1.03} oy={1100}
      overlay={<>
        <QuotePlate text={'"IMPLAUSIBLE" · AIDEA DIRECTOR · PER ALASKA PUBLIC MEDIA'} y={610} size={40} wrap={22} p={ease(f, t21 + 2, 12) * (f < t22 ? 1 : 0)} />
        <Plate text="NOT THE QUESTION" y={560} size={42} tone="ink" p={ease(f, t22 + 2, 8) * (f < t23 ? 1 : 0)} />
        <Plate text="THE EMPTY FOLDER" y={660} size={44} tone="plum" p={ease(f, t23 + 2, 8)} />
      </>}>
      <SVG>
        <AerialBG f={g} id="s7a" outline={1} hatch={0.5} roofs={1} />
        <g transform="translate(500 860)"><DottedBuilding x={0} y={0} f={g} scale={0.95} k={1} erase={Math.min(1, ease(f, t21, 40) * (1 + ease(f, t22, 50) * 0.3))} label="" /></g>
        <Folio x={400} y={1235} f={g} scale={1.15} emotion={f < t22 ? 'worried' : f < t23 ? 'ask' : 'hollow'} tilt={tilt} rattle={shake * 0.9 + 0.12 * hollow} tabs={6} open={open} forest={0.5} blank={0.7 + 0.3 * Math.sin(g / 4) * hollow + 0.3 * (1 - hollow)} look={f < t22 ? 0.7 : 0} id="s7f" />
        {f > t20 + 10 && <Paperclip x={560 + 30 * dropT} y={clipY} scale={0.9} rot={20 + 160 * dropT} />}
      </SVG>
    </Frame>
  );
};

// ---- S8: the aerial descends, two councils oppose (keys 24, 25, 26) -----------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t24 = b(24), t25 = b(25), t26 = b(26);
  const fade = 1 - ease(f, 4, 26);
  const s1 = spring(f, t24, 20), s2 = spring(f, t25, 20);
  return (
    <Frame p={p} zk={(ff) => lerp(1.45, 1.0, easeIO(ff, 0, 50))} oy={900} dx0={0} dx1={0}
      overlay={<>
        <Plate text="HOUSTON + MEADOW LAKES COUNCILS · OPPOSE" displayLines={['HOUSTON + MEADOW LAKES', 'COUNCILS · OPPOSE']} y={575} size={36} tone="felt" p={ease(f, t24 + 2, 8)} />
        <Plate text="PER MAT-SU SENTINEL" y={700} size={36} tone="paper" p={ease(f, t26 + 2, 8)} />
      </>}>
      <SVG>
        <ExteriorBG f={g} ground={1180} id="s8e" stakes />
        <Folio x={915} y={1330} f={g} scale={0.4} emotion="listen" look={-0.8} id="s8f" />
        <g data-band="ok"><ellipse cx={915} cy={1332} rx={170} ry={46} fill={FO.snow} stroke={INK} strokeWidth={5} /><ellipse cx={880} cy={1318} rx={60} ry={18} fill="#FFFFFF" opacity={0.7} /></g>
        <CouncilSign x={290} y={1360} f={g} scale={1.0} lines={['HOUSTON', 'CITY COUNCIL', 'OPPOSE']} k={s1} size={34} lit={0.5 + 0.5 * Math.sin(g / 7)} />
        <CouncilSign x={690} y={1370} f={g} scale={1.0} lines={['MEADOW LAKES', 'COMMUNITY', 'COUNCIL', 'OPPOSE']} k={s2} size={32} lit={0.5 + 0.5 * Math.sin(g / 6 + 1)} />
        {fade > 0.01 && <g opacity={fade}><AerialBG f={g} id="s8a" outline={0.6} hatch={0.3} panX={0} /></g>}
      </SVG>
    </Frame>
  );
};

// ---- S9: the empty chair, a slip, five lamps, a subpoena stamp (keys 46, 27, 28, 29, 30) ---------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t46 = b(46), t27 = b(27), t28 = b(28), t29 = b(29), t30 = b(30);
  const stand = ease(f, t30 - 10, 16);
  return (
    <Frame p={p} zk={(ff) => lerp(1.0, 1.08, easeIO(ff, 0, p.dur))} oy={1000}
      overlay={<>
        <Plate text="DNR · 'NO PERMISSION TO ATTEND'" y={545} size={32} tone="ink" p={ease(f, t27 + 2, 8) * (f < t28 ? 1 : 0)} />
        <Plate text="OCT 14 · SENATE SUBPOENAS DNR COMMISSIONER" y={620} size={28} tone="paper" p={ease(f, t28 + 2, 8)} />
        <Plate text="5 VOTED YES" y={720} size={44} tone="green" p={ease(f, t29 + 6, 8)} />
      </>}>
      <SVG>
        <SenateBG f={g} id="s9s" floor={1230} />
        <g data-band="ok"><rect x={470} y={858} width={560} height={26} fill={FO.brassDeep} stroke={INK} strokeWidth={6} opacity={ease(f, t29 - 6, 8)} /></g>
        {[0, 1, 2, 3, 4].map((i) => <VoteLamp key={i} x={520 + i * 112} y={800} f={g} on={ease(f, t29 + i * 9, 6)} scale={0.8} />)}
        <WitnessChair x={300} y={1260} f={g} scale={1.0} plate="CROWTHER" slip={f >= t27 - 6} slipK={ease(f, t27 - 6, 16)} spin={0.4} k={ease(f, t46, 10)} />
        <Stamp x={240} y={1100} f={g} scale={0.9} down={easeIn(f, t30 - 14, 14)} ink={f >= t30 ? ease(f, t30, 5) : 0} lines={['SUBPOENA']} size={36} rot={-6} id="s9st" />
        <Folio x={830} y={1270} f={g} scale={0.78} emotion="ask" tabs={6} tabsStand={stand} look={-0.9} blank={0.7} id="s9f" />
      </SVG>
    </Frame>
  );
};

// ---- S10: the best case at the counter (keys 31, 32, 33, 47, 34) ----------------------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t31 = b(31), t32 = b(32), t33 = b(33), t47 = b(47), t34 = b(34);
  const lamps = 3 * ease(f, t33, 40);
  const sweep = ease(f, t32 - 10, 22);
  const glow = ease(f, t32 + 14, 10);
  const grow = ease(f, t47, Math.max(10, t34 - t47 + 24));
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1000}
      overlay={<>
        <Plate text="THE BEST CASE FOR THE TRANSFER" y={540} size={32} tone="paper" p={ease(f, t31 + 2, 8) * (f < t32 ? 1 : 0)} />
        <Plate text="SITE CONTROL BEFORE A TENANT SIGNS" y={610} size={30} tone="felt" p={ease(f, t32 + 2, 8) * (f < t33 ? 1 : 0)} />
        <Plate text="READY LAND · HOW A STATE COMPETES" y={680} size={30} tone="green" p={ease(f, t33 + 2, 8) * (f < t34 ? 1 : 0)} />
        <Plate text="AIDEA SAYS · ~$495M IN DIVIDENDS TO STATE" y={750} size={28} tone="ink" p={ease(f, t34 + 2, 8)} />
      </>}>
      <SVG>
        <CounterBG f={g} id="s10c" floor={1230} lamps={lamps} />
        {glow > 0 && <path data-band="ok" d={`M ${270 + 20} 540 L 330 960 L 560 880 Z`} fill={FO.headlight} opacity={0.28 * glow} />}
        <Headlights x={lerp(90, 270, sweep)} y={470} f={g} k={sweep > 0 ? 1 : 0} scale={0.8} />
        <Folio x={260} y={1250} f={g} scale={0.85} emotion="listen" tabs={6} tabGlow={glow} look={0.6} blank={0.6} id="s10f" />
        {f >= t47 && <CoinStack x={860} y={1250} f={g} scale={0.8} n={12} grow={grow} id="s10k" />}
        {f >= t47 && <ReceiptTag x={860} y={1015 - 120 * 0} f={g} scale={0.75} lines={['AIDEA SAYS']} k={ease(f, t47, 10)} size={26} />}
      </SVG>
    </Frame>
  );
};

// ---- S11: the coins tie to no land here (keys 50, 35, 36) -------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t50 = b(50), t35 = b(35), t36 = b(36);
  const slide = ease(f, t35, 32);
  const cx = lerp(560, 900, slide);
  const sag = lerp(10, 190, slide);
  const fx = 400, fy = 780;
  const tilt = 5 * Math.sin(ease(f, t50, 14) * Math.PI);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={1000}
      overlay={<>
        <Plate text="STATEWIDE · TIED TO NO LAND HERE" displayLines={['STATEWIDE ·', 'TIED TO NO LAND HERE']} y={575} size={38} tone="felt" p={ease(f, t35 + 2, 8)} />
        <Plate text="LETTER · NO RETURN TO HOUSTON GUARANTEED" displayLines={['LETTER · NO RETURN TO', 'HOUSTON GUARANTEED']} y={705} size={34} tone="plum" p={ease(f, t36 + 2, 8)} />
      </>}>
      <SVG>
        <CounterBG f={g} id="s11c" floor={1230} lamps={3} />
        <g data-band="ok" transform={`translate(${cx} 1075)`}>
          <rect x={-170} y={-12} width={340} height={44} fill={FO.manilaDeep} stroke={INK} strokeWidth={6} />
          <text x={0} y={22} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} letterSpacing={4} fill={FO.navy}>STATEWIDE</text>
        </g>
        <path data-band="ok" d={`M ${fx + 40} ${fy + 60} Q ${(fx + cx) / 2} ${Math.max(fy, 1000) + sag} ${cx} 1000`} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
        <path data-band="ok" d={`M ${fx + 40} ${fy + 60} Q ${(fx + cx) / 2} ${Math.max(fy, 1000) + sag} ${cx} 1000`} fill="none" stroke={FO.manila} strokeWidth={3.5} strokeLinecap="round" />
        <Folio x={240} y={1250} f={g} scale={0.85} emotion="ask" tilt={tilt} tabs={6} tabGlow={1 - 0.55 * ease(f, t35, 8)} look={0.8} blank={0.6} id="s11f" />
        <CoinStack x={cx} y={1250} f={g} scale={0.8} n={12} grow={1} id="s11k" />
        <ReceiptTag x={700} y={640} f={g} scale={0.9} lines={['A REAL', 'ARGUMENT']} k={ease(f, t50, 10)} size={26} rot={-3} />
      </SVG>
    </Frame>
  );
};

// ---- S12: ask, the date lands on a note, the chair turns (keys 37, 51, 38, 52) ------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t37 = b(37), t51 = b(51), t38 = b(38), t52 = b(52);
  const hop = ease(f, t37 - 12, 26);
  const x = lerp(-260, 330, hop);
  const y = 1255 - 150 * Math.sin(hop * Math.PI);
  const land = bump(f, t37 + 16, 12);
  const turn = -22 * ease(f, t51, 14) + 22 * ease(f, t51 + 26, 6) - 28 * ease(f, t52, 18);
  return (
    <Frame p={p} z0={1.0} z1={1.07} oy={1000}
      overlay={<>
        <Plate text="ASK WHAT READY LAND IS READY FOR" y={540} size={32} tone="paper" p={ease(f, t37 + 2, 8) * (f < t38 ? 1 : 0)} />
        <Plate text="OCT 26 · HEARING" y={612} size={40} tone="ink" p={ease(f, t38 + 2, 8) * (f < t52 ? 1 : 0)} />
        <Plate text="THE FIRST TIME SENATORS CAN ASK" y={684} size={32} tone="green" p={ease(f, t52 + 2, 8)} />
      </>}>
      <SVG>
        <SenateBG f={g} id="s12s" floor={1230} />
        <WitnessChair x={780} y={1260} f={g} scale={1.0} plate="CROWTHER" turn={turn} />
        <Folio x={x} y={y} f={g} scale={0.95} emotion={f < t38 ? 'ask' : 'proud'} sq={land * 0.8} tabs={6} note={ease(f, t38, 8)} look={0.9} blank={0.5} id="s12f" />
      </SVG>
    </Frame>
  );
};

// ---- S13: six blanks, one date, the lamp clicks on (keys 40, 41, 42) -----------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t40 = b(40), t41 = b(41), t42 = b(42);
  const lamp = 0.12 + 0.88 * ease(f, t42, 6);
  const open = ease(f, t40 - 14, 20);
  return (
    <Frame p={p} z0={1.0} z1={1.12} oy={1000}
      overlay={<>
        <Plate text="SIX BLANKS" y={545} size={46} tone="plum" p={ease(f, t40 + 2, 8)} />
        <Plate text="ONE DATE" y={650} size={46} tone="ink" p={ease(f, t41 + 2, 8)} />
        <Plate text="WATCH WHICH TABS FILL" y={755} size={40} tone="paper" p={ease(f, t42 + 2, 8)} />
      </>}>
      <SVG>
        <DeskBG f={g} desk={1180} id="s13d" lamp={lamp} />
        <Folio x={400} y={1230} f={g} scale={1.3} emotion={f < t42 ? 'hollow' : 'ask'} open={open} tabs={6} blank={0.6 + 0.4 * Math.sin(g / 5)} look={0.4} id="s13f" />
        <Paperclip x={470} y={1040 - 4 * Math.sin(g / 9)} scale={0.9} rot={20} />
        {f % 40 < 6 && <circle cx={470} cy={1040} r={20 + 10 * Math.sin(f)} fill="#FFFFFF" opacity={0.35} />}
        <OctNote x={840} y={1000} f={g} scale={0.9} k={ease(f, t41, 8)} rot={5} />
      </SVG>
    </Frame>
  );
};

// ---- the episode ---------------------------------------------------------------------------------------------------------------------------
const Rough: React.FC<{n: number; title: string; p: SP}> = ({n, title, p}) => (
  <Frame p={p}>
    <SVG>
      <rect x={0} y={0} width={W} height={H} fill={FO.walnut} />
      <text x={540} y={900} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={FO.cream}>{`S${n} ${title}`}</text>
    </SVG>
  </Frame>
);
const TITLES: Record<number, string> = {1: 'SKID', 2: 'SHEET', 3: 'LAND', 4: 'STAMPS', 5: 'PLAN', 6: 'LETTER', 7: 'HOLLOW', 8: 'COUNCILS', 9: 'CHAIR', 10: 'COUNTER', 11: 'COINS', 12: 'DATE', 13: 'BLANKS'};
const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

const Shot: React.FC<{n: number; from: number; dur: number; beats: Beat[]; kicks: number[]}> = ({n, from, dur, beats, kicks}) => {
  const f = useCurrentFrame();
  const b = (id: number) => {
    const x = beats.find((y) => y.id === (IDS[id] ?? id));
    return x ? Math.round(x.at * 30) - from : 0;
  };
  const bt = (id: number) => {
    const x = beats.find((y) => y.id === (IDS[id] ?? id));
    return x ? Math.round(x.at * 30) : 0;
  };
  const Comp = SHOTS[n];
  const p = {f, from, dur, b, kicks, bt};
  return Comp ? <Comp p={p} /> : <Rough n={n} title={TITLES[n] ?? ''} p={p} />;
};

const captions = z.array(z.object({t: z.number(), d: z.number(), text: z.string()}));

export const ep1020Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1020Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1020: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 5.7, 17.9, 27.1, 35.6, 44.8, 57.9, 69.8, 77.2, 88.5, 102.8, 111, 120.5, 126.3].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: C.ink}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#1D2A2A" ink="#F4EEDC" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
