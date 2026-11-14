# Alaska narration/background balance, November 14th, 2026

## Report and evidence

Owner reported the latest Alaska TikTok's background drowning out narration and a
viewer requesting a version without the sound. The comment was not independently
retrieved. The original delivery receipt identifies the November 13th edition,
**The Faucet Before the Water**, at https://www.tiktok.com/@alaskaai_/video/7707571425321700622 .

The downloaded released hosted master (135.533 seconds, 1080x1920, AAC 48 kHz stereo)
measured -13.99 LUFS integrated, -2.28 dBTP and LRA 6.60. These existing whole-mix
checks do not measure whether narration is audible over the background. The
original voice report/delivery receipt did not measure standalone voice loudness.

Current mixer source reduced narration as low as 35% using the music's authored arc,
then applied a second whole-mix arc. Music had independent gap boosts up to 6.5x;
effects and ambience were outside the music sidechain. No combined-background
speech-margin check existed. This created a genuine path for masking; it does not
prove an exact perceptual threshold in the already-published TikTok.

## Correction

Keep narration intact. Render the complete non-speech bus separately, apply a
measured 18 dB speech-window margin in stereo and mono, with anticipatory gain
reductions and slow release. Apply common headroom and final mastering afterwards.
Preserve codec loudness/peak checks. Bind measured speech-priority evidence to the
master and the mix provenance so absent or stale evidence cannot be accepted.
LRA is descriptive, not a target that can justify lowering speech or raising music.

## Validation and limits

Unit coverage includes loud music/effects, quiet voice, mono phase cancellation,
gaps, nonfinite inputs, real FFmpeg I/O, stale/missing report rejection and codec
loudness tests. A ten-second real-speech test fixture (not this episode's voice)
against this edition's actual music, Long Note Two at twice source gain, produced
200 measured speech windows: minimum stereo margin 18.00 dB and mono 19.48 dB.

This runtime cannot receive audio for listening. These are quantitative and code
checks, not a claimed listening review. No isolated November 13th narration stem
was available, so no exact before/after stem measurement of that release is claimed.
No old film was replaced and no new public post or comment was submitted. The
change applies to subsequent routine mixes; verify the next scheduled run's actual
speech-priority and published-delivery receipts separately.

The full dispatch_mix.py graph also ran successfully with the November 13th board,
44 real SFX events, the actual music, repeated real-speech fixture and synthetic
line anchors (120.73 seconds). It measured 2,415 voiced windows with 18.00 dB
minimum stereo/mono margin. The resulting AAC probe passed at -14.26 LUFS,
-2.85 dBTP, LRA 2.50 (advisory); finish-mix and check_mix provenance passed.
This was an integration fixture, not a rerender of the published film.
