# Owner narration voice (zero-shot clone reference)

STATUS: LIVE. `talon_ref.wav` is the owner's 41.5s master recording (landed
2026-07-14). **`talon_ref_cond.wav` is the LOCKED conditioning clip** — the
smoothest 10s window (15-25s) of the master, approved by the owner as "take A"
in an A-D listening comparison. The pipeline clones THIS file zero-shot with
Chatterbox every run (the engine only reads the first 10s of its prompt, so
the window is the voice).

Delivery is the approved **E2 clarity** recipe: exaggeration 0.45 / cfg_weight
0.4 / temperature 0.6 / repetition_penalty 1.3, and every line runs through
`normalize_for_tts()` so numbers, dates, currency and percent are spelled out
before your voice speaks them ("1,750" to "one thousand seven hundred fifty").
Re-cutting the window, changing the dials, or replacing either file requires a
fresh owner listening sign-off (see config/voices.yaml defaults).

## Recording spec

- 20 to 60 seconds of natural speech in the register the narrator should have
  (calm, measured, documentary). Longer and cleaner = better clone.
- Quiet room, no music/TV, minimal echo. A phone voice memo at a consistent
  distance is fine.
- WAV preferred (any sample rate; mono or stereo). MP3 acceptable, convert:
  `ffmpeg -i in.mp3 -ar 24000 -ac 1 talon_ref.wav`
- Avoid clipping and long silences. Trim lead-in noise.

## Consent + use

This clip is the repo owner's own voice, recorded by the owner explicitly to
narrate ALASKA.AI Dispatches (owner request, 2026-07-14). Do not substitute
anyone else's voice here. Chatterbox stamps an imperceptible provenance
watermark (Resemble Perth) into generated audio; the Gmail-draft credits must
say the narration is an AI clone of the owner's voice.

## Pipeline pieces

- Backend module: `.claude/skills/alaska-dispatch/vo_backends.py`
  (`synth()` prefers this clip; falls back kokoro -> edge-tts if absent).
- Engine tiers + licenses: `config/voices.yaml`.
- Env install: `scripts/setup_env.sh` (chatterbox + CPU torch).

## Audition a line locally

    python .claude/skills/alaska-dispatch/vo_backends.py \
      "Alaska dot A I. This is a voice check." check.wav
