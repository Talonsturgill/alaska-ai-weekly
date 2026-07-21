# SFX bank — designed foley with variants (scripts/build_sfx_library.py)

Deterministic numpy sound design (crc32-seeded), 44.1k/16-bit stereo, -6 dBFS
peaks. Each kind ships SIX sibling takes (`<kind>_v1..v6.wav`) sampled from a
param family — scripts/sfx_bank.py shuffle-bags them (no-repeat-last-2) so no
two plays of a kind in an episode (or across weeks) are the same take.
Layering: transient + body + Schroeder room tail (+ sweetener). Metal is modal
(f_n = n*f0*sqrt(1+B*n^2)); paper is granular; snap is Karplus-Strong.
License: original synthesis, no third-party material.

To UPGRADE any kind with real recordings: put curated CC0/public-domain takes
at `assets/sfx/real/<kind>*.wav` (e.g. clank_a.wav, clank_b.wav) and log source
+ license here. sfx_bank.py then shuffle-bags the real takes for that kind
instead of the synth ones, automatically.

- `thud_v1..v6.wav` — 0.69-0.74s — designed synth — no attribution needed
- `stamp_v1..v6.wav` — 0.74-0.82s — designed synth — no attribution needed
- `boom_v1..v6.wav` — 2.06-2.25s — designed synth — no attribution needed
- `pop_v1..v6.wav` — 0.09-0.09s — designed synth — no attribution needed
- `snap_v1..v6.wav` — 0.58-0.58s — designed synth — no attribution needed
- `tick_v1..v6.wav` — 0.24-0.24s — designed synth — no attribution needed
- `ding_v1..v6.wav` — 1.10-1.10s — designed synth — no attribution needed
- `chime_v1..v6.wav` — 2.17-2.17s — designed synth — no attribution needed
- `clank_v1..v6.wav` — 1.35-1.35s — designed synth — no attribution needed
- `chain_v1..v6.wav` — 1.05-1.06s — designed synth — no attribution needed
- `whoosh_v1..v6.wav` — 0.85-0.96s — designed synth — no attribution needed
- `riser_v1..v6.wav` — 0.92-1.05s — designed synth — no attribution needed
- `creak_v1..v6.wav` — 0.82-0.82s — designed synth — no attribution needed
- `paper_v1..v6.wav` — 0.69-0.79s — designed synth — no attribution needed
- `paw_v1..v6.wav` — 0.34-0.34s — designed synth — no attribution needed
- `klaxon_v1..v6.wav` — 0.50-0.50s — designed synth — no attribution needed
- `caw_v1..v6.wav` — 1.08-1.15s — designed synth — no attribution needed

## Real recordings (assets/sfx/real/ — win over synth, per kind)

Harvested by scripts/fetch_sfx.py from kenney.nl audio packs — **CC0/public
domain** (verified at kenney.nl/support: "public domain licensed (CC0)... free
to use them, even in commercial projects"), so committing them here is clean.
No attribution required (credit "Kenney" anyway — thanks!). Full provenance
(source URL, pack, sha256, retrieval date) in `real/manifest.json`.

- `clank_kenney_impactMetal_*.wav` — 6 takes — Impact Sounds pack
- `thud_kenney_impactWood_*.wav` — 6 takes — Impact Sounds pack
- `ding_kenney_impactBell_*.wav` — 5 takes — Impact Sounds pack
- `paw_kenney_impactSoft_*.wav` — 5 takes — Impact Sounds pack
- `pop_kenney_drop_*.wav` — 4 takes — Interface Sounds pack
- `chime_kenney_confirmation_*.wav` — 4 takes — Interface Sounds pack

Do NOT add Sonniss/Pixabay/Mixkit files here (commercial use OK, but
redistribution — i.e. committing — is prohibited). BBC RemArc is
non-commercial: never use it. CC0-only in this directory.
