---
name: alaska-dispatch
description: Reference engine + helpers for producing an Alaska.Ai video "Dispatch" — a ~60s, 1080x1350, narrated cinematic video tying a recent verifiable Alaska story to an honest AI/ML angle. Use when the routine (see docs/ROUTINE_SPEC.md) needs to build a Dispatch video to the locked production standard (docs/VIDEO_PRODUCTION_STANDARD.md). Provides a proven, hand-coded PIL/numpy renderer, an edge-tts VO + sound-design + loudnorm-gated mix, cinematic finishing, and open captions. This is a STARTING POINT TO ADAPT per story, not a rigid template — vary the visual concept every time.
---

# Alaska.Ai Dispatch — production engine

Hand-coded illustration video (PIL + numpy + ffmpeg). No AI-generated imagery — that
is the brand signature. Pairs with `docs/VIDEO_PRODUCTION_STANDARD.md` (craft bible) and
`docs/ROUTINE_SPEC.md` (the routine). Fonts live in `../alaska-ai-brief/fonts/` (committed).

## Files
- `easing.py` — Penner/easings.net curves + closed-form spring (vectorized). Import as `E`.
- `post_grade.py` — standalone cinematic finishing pass (ACES, split-tone, bloom, grain,
  vignette, CA, dither) over a frame; also integrated inline in the renderer.
- `render_v2.py` — the reference renderer: 4:5 scene (glacial water + aurora + hero + parallax
  drift + push-in), finishing, crisp UI, open captions. `test`/range CLI. Currently authored
  at 30s/900 frames for the beluga Dispatch — **adapt per run** (see below).
- `audio_build.py` — edge-tts VO assembly (5 segments → timed vo.wav). New session CA setup
  required before edge-tts (append /etc/ssl/certs/ca-certificates.crt to certifi; export
  SSL_CERT_FILE+SSL_CERT_DIR=/etc/ssl/certs; install edge-tts with pip --break-system-packages).
- `audio_v2.py` — sound design + mix: synth underwater bed + distant whale + sonar, EQ-carved
  + sidechain-ducked VO, two-pass loudnorm to -14 LUFS/-1.5 dBTP, plus the **measurement gate**.

## How to use (per run — VARY THE CONCEPT)
1. This engine is a REFERENCE, not a stamp. Each Dispatch must use a different visual
   archetype (see ROUTINE_SPEC Phase 3) and its own scene code. Copy the relevant pieces,
   re-derive the scene/hero for the new story, keep the finishing + audio + caption + gate
   machinery (those are the reusable quality layer).
2. For ~60s: set the frame count to 1800 (NF) and re-time the VO segments, caption windows,
   beat frames, and the music window to 60s. ~130–150 VO words.
3. Render in the BACKGROUND, in parallel chunks (e.g. 3×600), never blocking the run.
4. Always run the audio gate and a 4-frame visual contact sheet before muxing/delivering.
5. Encode a ~12–14 Mbps faststart H.264/AAC post-master; deliver via `scripts/upload_video.py`
   (→ one-click link) + `scripts/dispatch_email.py` (→ Gmail draft). Never base64 video
   through the model.

## Dependencies (install in the routine environment setup script; cached)
- ffmpeg, Python 3.11+, `pip install --break-system-packages pillow numpy scipy edge-tts`
- `rclone` for the upload step (`curl https://rclone.org/install.sh | bash`)
- Fonts are committed under `../alaska-ai-brief/fonts/` — no download needed.

## Locked brand tokens
Deep flag-blue #081838, Pantone gold #FFC72C, aurora cyan-green #1AE5A4 + violet #7B5BFF,
glacier/teal/spruce/slate/snow/coral; Fraunces Black display (opsz 144 wght 900), JetBrains
Mono telemetry; vivid aurora signature; eyebrow "ALASKA.AI / FIELD SIGNAL"; signoff "alaska.ai".
