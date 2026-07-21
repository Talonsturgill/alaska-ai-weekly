import React, {createContext, useContext} from 'react';

// =============================================================================
// VOICE — characters that react to the narration. The VO pipeline already emits
// word-level timings (words.json) and a per-frame amplitude envelope
// (mouth_track.json via scripts/vo_envelope.py). This module turns that data
// into ACTING:
//
//   VoiceProvider     Episode wraps the timeline once with the voice data from
//                     props; any scene/component reads it via useVoice().
//   opennessAt(f)     0..1 mouth openness at a global frame (smoothed RMS).
//   accentAt(f)       0..1 pulse around each VO EMPHASIS word (from the
//                     vo-director's per-line emphasis plan) — drive gestures,
//                     chip pops, camera nudges, machine flinches off it.
//   <TalkMouth>       a mouth that actually flaps: interpolates closed -> open
//                     shapes, with teeth + tongue at full extension.
//
// IMPORTANT: frames here are GLOBAL timeline frames. Inside a <Sequence>,
// useCurrentFrame() is LOCAL — add the sequence's `from` offset, or use
// useVoice().global(localFrame, from).
// =============================================================================

export interface VoiceAccent {
  frame: number;      // global frame of the emphasized word's onset
  word: string;
  energy?: number;    // 1-5 from the vo-director plan (default 3)
  lineIdx?: number;
}

export interface VoiceData {
  fps: number;
  mouth: number[];          // per-frame 0..1 envelope, global timeline
  accents: VoiceAccent[];
}

const VoiceCtx = createContext<VoiceData | null>(null);

export const VoiceProvider: React.FC<{data: VoiceData | null; children: React.ReactNode}> = ({data, children}) => (
  <VoiceCtx.Provider value={data}>{children}</VoiceCtx.Provider>
);

export interface VoiceApi {
  /** mouth openness 0..1 at a GLOBAL frame */
  opennessAt: (globalFrame: number) => number;
  /** strongest accent pulse 0..1 at a GLOBAL frame (0.42s decay per accent) */
  accentAt: (globalFrame: number) => number;
  /** the accent object currently pulsing, if any */
  activeAccent: (globalFrame: number) => VoiceAccent | null;
  /** helper: convert a Sequence-local frame to global */
  global: (localFrame: number, sequenceFrom: number) => number;
  ready: boolean;
}

const ZERO: VoiceApi = {
  opennessAt: () => 0, accentAt: () => 0, activeAccent: () => null,
  global: (f, from) => f + from, ready: false,
};

export function useVoice(): VoiceApi {
  const d = useContext(VoiceCtx);
  if (!d || !d.mouth || d.mouth.length === 0) return ZERO;
  const opennessAt = (gf: number) => {
    const i = Math.max(0, Math.min(d.mouth.length - 1, Math.round(gf)));
    return d.mouth[i] ?? 0;
  };
  const pulse = (gf: number, a: VoiceAccent) => {
    const t = (gf - a.frame) / d.fps;
    const dur = 0.42;
    if (t < 0 || t > dur) return 0;
    const up = Math.min(1, t / 0.06);
    const down = 1 - (t - 0.06) / (dur - 0.06);
    const e = (a.energy ?? 3) / 5;
    return Math.max(0, Math.min(up, down)) * (0.6 + 0.4 * e);
  };
  return {
    opennessAt,
    accentAt: (gf) => d.accents.reduce((m, a) => Math.max(m, pulse(gf, a)), 0),
    activeAccent: (gf) => d.accents.find((a) => pulse(gf, a) > 0) ?? null,
    global: (f, from) => f + from,
    ready: true,
  };
}

// ---------------------------------------------------------------------------
// ambientMouth — 2026-07-21 OWNER RULE: characters NEVER lip-sync the narrator.
// Word-synced mouth flapping reads as a failed narration attempt (owner note on
// the 2026-07-21 dispatch: "it looked like they were trying to narrate").
// Scenes may keep passing useVoice().opennessAt(f) as `talking` — the rigs route
// it through THIS converter, which discards the per-word amplitude entirely and
// renders a slow, small, word-independent conversational cycle instead (people
// chatting IN the scene, not mouthing the voiceover). The cycle dips fully
// closed once per period so it reads as natural talk, and callers pass a phase
// so two figures in a two-shot never chew in sync. Enforced here in the engine
// so no future scene can reintroduce lip-sync by passing raw openness.
// ---------------------------------------------------------------------------
export const ambientMouth = (talking: number | undefined, f: number, phase = 0): number | undefined => {
  if (talking === undefined) return undefined;
  // ~0.85s period at 30fps, max ~0.3 open, bottoms below TalkMouth's closed
  // threshold (0.06) so the mouth visibly closes between "phrases".
  return Math.max(0, 0.17 + 0.145 * Math.sin(f / 4.2 + phase));
};

// ---------------------------------------------------------------------------
// TalkMouth — a flapping mouth. Drawn in a local space centered at (0,0),
// `w` wide. openness 0 = closed line, 1 = full open with teeth + tongue.
// Drop into any face. Rigs must drive openness via ambientMouth(...) — never
// raw useVoice().opennessAt (see the owner rule above).
// ---------------------------------------------------------------------------
export const TalkMouth: React.FC<{
  openness: number;           // 0..1
  w?: number;                 // mouth width
  ink?: string;
  mood?: 'neutral' | 'smile' | 'frown';
  showTeeth?: boolean;
}> = ({openness, w = 60, ink = '#101423', mood = 'neutral', showTeeth = true}) => {
  const o = Math.max(0, Math.min(1, openness));
  const h = 4 + o * (w * 0.62);              // open height
  const curve = mood === 'smile' ? 10 : mood === 'frown' ? -10 : 2;
  if (o < 0.06) {
    // closed: a simple expressive line
    return (
      <path d={`M${-w / 2},0 q${w / 2},${curve} ${w},0`} fill="none"
            stroke={ink} strokeWidth={Math.max(5, w * 0.09)} strokeLinecap="round" />
    );
  }
  const half = w / 2;
  return (
    <g>
      <path
        d={`M${-half},${-curve * 0.3} q${half},${-h * 0.45} ${w},0 q${-8},${h} ${-half},${h * 0.92} q${-half + 8},${h * 0.08} ${-half},${-h * 0.92} Z`}
        fill="#5b1b1b" stroke={ink} strokeWidth={Math.max(4.5, w * 0.08)} strokeLinejoin="round"
      />
      {showTeeth && o > 0.3 && (
        <path d={`M${-half * 0.72},${-h * 0.16} q${half * 0.72},${-h * 0.18} ${half * 1.44},0 l0,${h * 0.16} q${-half * 0.72},${-h * 0.14} ${-half * 1.44},0 Z`}
              fill="#fff" stroke={ink} strokeWidth={2.5} />
      )}
      {o > 0.45 && (
        <ellipse cx={0} cy={h * 0.62} rx={half * 0.5} ry={h * 0.22}
                 fill="#c4453a" stroke={ink} strokeWidth={3} />
      )}
    </g>
  );
};
