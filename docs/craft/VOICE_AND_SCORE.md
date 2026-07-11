# VOICE AND SCORE — directing the TTS performance + scoring the picture (grip, not drift)

**Why this doc exists.** The 2026-07-11 panel: *"VO rides the beats but the register is
contemplative rather than gripping; the piece resolves on a declarative signoff."* Base Kokoro
(the publish backbone) honors NO SSML and no bracketed stage directions — it will read tags
aloud. The real control surface is: **text phrasing, punctuation, the speed parameter, and
per-segment synthesis assembled by the mixer.** Grip is manufactured in how segments are split,
paced, and placed against music and silence.

## 1. Writing for the ear (this is performance direction, not copyediting)

- **Sentence length is the tempo map.** Ceiling ~15-20 words spoken; at stakes moments drop to
  2-5 word fragments synthesized as their OWN segments (a fresh onset = natural stress).
  Contemplative = uniform medium sentences; grip = a deliberate length contour.
- **Punctuation is prosody**: comma = short breath; period = full stop and reset; question mark =
  rise; ellipsis = suspension (max 1-2 per film or it reads wistful). Convert commas to periods
  where the read needs stops. (House rules still apply: no em/en dashes, no semicolons.)
- **Per-segment speed is the energy dial**: hook segments ~1.05-1.10x; the caveat dip ~0.92-0.97x;
  the payoff and the button slowed ~0.90-0.95x so key words land heavy. Never one global speed.
- **Isolate the money line**: the single most important sentence gets synthesized 3-4 ways
  (phrasing/comma/speed variants) — audition, keep the strongest onset.

## 2. The 60-second energy arc (script + read + mix move together)

| beat | time | VO | music |
|---|---|---|---|
| cold open | 0-8s | hard number or question, punchy fragments, fastest read | pad stem only, enters ON a downbeat |
| build | 8-35s | stakes in steps, tricolon rhythm | +1 stem every 8-12s |
| dip / caveat | 35-45s | slowest, longest sentence, intimate | strip back to pad; ambience forward |
| payoff | 45-55s | the reveal lands ON a musical downbeat | riser 1.5-3s into a NEW section, all stems return |
| button | 55-60s | callback / question / tricolon, own segment, ~0.90x | resolves (never fades to nothing) |

- **Hard number in the first 8 seconds** (authority); direct address ("you") at hook and button;
  **rule of three** for builds; **the callback**: plant an image or number at ~0:05, pay it off
  at ~0:57.
- **The button is never a flat declarative.** Pick one: callback (the opening image or number
  recontextualized), a charged question, or a short-short-long tricolon landing on the long
  phrase. Declare which in the storyboard.

## 3. Scoring to picture

- **Score an emotional journey, not a loop**: the bed starts in one state and ends in another.
  Author or cut the sourced track into STEMS/sections (pad, pulse, bass, motif) and run the
  additive build above.
- **Riser into downbeat**: place a 1.5-3s riser ending exactly on the payoff word; the music's
  new section starts on that same frame. (The dispatch mixer already places SFX at beat times —
  the riser is scheduled from the storyboard's `audio_arc`.)
- **Cut on phrase boundaries**: snap shot changes and VO segment starts to the bed's musical
  phrase boundaries where the timeline allows.

## 4. Silence and ducking as storytelling

- **THE SILENCE**: kill or dip the whole bed (music + ambience, -18 to -24 dB) for 0.5-1.0s
  immediately BEFORE the payoff word, then slam the new section in. One true silence per film
  (two max). Fill it with low room tone, never digital black; crossfade edges.
- **Landing pauses**: 0.5-1.0s micro-gaps at sentence boundaries; 1-2 counts after the payoff;
  up to 2-3s after the heaviest line if the picture is carrying.
- **Ducking depth is a dramatic dial**: transparent baseline 2-3 dB, band-focused around 1-3 kHz
  (keep low-end weight), release ~80-150 ms so the bed swells back between phrases. Deepen to
  3-4 dB in the intimate dip; ease to ~2 dB at the payoff so the music surges WITH the voice.
  Master stays -14 LUFS / TP <= -1.0.
- **Layered ambience, frequency-separated**: low (wind/rumble) + mid (the world's body) + high
  sparkle (birds, ticks, air), EQ'd into their own bands, plus scheduled one-shots. Every world
  gets a diegetic anchor (VISUAL_FLOW §5's per-shot sound, deepened).

## Enforcement

1. **PLAN**: storyboard.json declares a top-level `audio_arc` block:
   `{"build_steps": [<stem-entry times>], "dip_at": <s>, "riser_at": <s>, "silence_at": <s>,
   "payoff_at": <s>, "button_pattern": "callback|question|tricolon"}`. storyboard_check fails
   without it. VO segments carry per-segment speeds in the build script.
2. **VERIFY (objective)**: quality_gate SILENCE_DIP — the master's RMS in the declared
   `silence_at` +/-0.35s window must sit >= 6 dB below its +/-3s neighborhood (proves the
   pre-payoff silence was actually mixed, not just planned).
3. **JUDGE**: the editor + panel grade the button against the three patterns and the read
   against the energy arc (a one-speed read is a finding).

## SOURCES

Kokoro control-surface notes (kokoroweb; base-model SSML caveat verified against the open-weight
engine); TTS narration phrasing guides (Mixcord, Narakeet, sarahfraps); documentary VO craft
(John Henry Krause, journalism.university, New Doc Editing); rhetoric (rule of three,
direct address); scoring-to-picture (MusicTech, Berklee Online, Spitfire, Songer; uppbeat/
ScoreCraft on risers); ambience layering (Bugnet, Pro Sound Effects, Fiveable, FilmLocal);
silence craft (journalism.university, GLCoverage); ducking numerics (Mastering The Mix,
VI-Control, StrongMocha).
