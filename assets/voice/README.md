# Owner narration voice (zero-shot clone reference)

Drop the reference recording here as **`talon_ref.wav`**. That single file IS the
narrator voice: the Dispatch pipeline clones it zero-shot with Chatterbox
(MIT, the same engine Voicebox bundles) every run. No training step, no model
artifact to maintain. Replace the file to change how the narrator sounds.

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
