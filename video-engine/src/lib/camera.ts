// THE CAMERA DOES NOT PUNCTUATE BEATS (owner, 2026-10-03).
//
// Ep1002 and Ep1003 kicked the whole frame on every board beat, a 3 px jitter and a 2 percent
// zoom punch over 22 frames, 47 times a film. The owner, watching the 10-03 film: "every like
// five seconds or something ... there's like this pulse ... the screen is shaking slightly ...
// It's happening so frequently that it's just kind of overstimulating." scripts/jolt_check.py
// measured the master at 41 whole-frame jolts in a 113.7 s story, one every 2.8 s.
//
// An impact lands in the OBJECT: squash, overshoot, a star, a dust puff (./motion). The whole
// frame moves on a beat only where the board asks for it by name, `"kick": true` on the beat, at
// most three a film and 20 s apart. build_scenes.py holds the board to that budget and writes the
// allowed seconds into episode_props.json as `kicks`; jolt_check.py measures the master and fails
// a film over it. Feed `kicks` here and nothing else: never drive a whole-frame move from `beats`,
// and never from VO accents.
//
// Import it in a new episode. Never copy it in.

const KICK_FRAMES = 22;

/** 0..1 envelope of the board-flagged kicks that land inside this shot, at shot-local frame f.
 *  from/dur are the shot's Sequence; kicks are seconds on the film clock. A kick never bleeds
 *  across a cut. */
export const cameraKick = (f: number, from: number, dur: number, kicks: readonly number[] = [], fps = 30): number =>
  Math.min(1, kicks.reduce((a, s) => {
    const at = Math.round(s * fps) - from;
    const d = f - at;
    return at >= 0 && at < dur && d >= 0 && d < KICK_FRAMES ? a + Math.exp(-d / 6) : a;
  }, 0));

/** The kick as a whole-frame offset in px and a zoom punch, for the shot wrapper's transform. */
export const kickTransform = (f: number, k: number) => ({
  x: Math.sin(f * 2.3) * 3 * k,
  y: Math.cos(f * 1.9) * 2.4 * k,
  scale: 1 + 0.02 * k,
});
