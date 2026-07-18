# Dispatch Run Upgrades — the fix-log / rollback trail

Every run appends a dated entry here (Phase 8 retrospective): what shipped, every
code/doctrine/asset change with commit refs, what was upgraded and why, deferred
known-issues, and the gate/panel result. This is the log to diff against and roll
back on if a later run regresses. Newest first.

---

## 2026-07-18 — "The Fence That Falls Short" (Mat-Su AIDEA land conveyance)

**Shipped:** ~67s vertical Dispatch, Gemini narrator, objective gate 10/10. Story:
Alaska's proposed non-competitive conveyance of ~31 sq mi of Mat-Su birch forest
near Houston to AIDEA for speculative data-center/rail development, no operator
named, local ban falling two miles short of the parcel, comments open to Aug 19.

**Panel trajectory (config/dispatch_rubric.yaml, ship 9.0):** this run was a major
craft-engine rebuild, tracked across four 3-judge panels — median 6.62 (pre-engine)
→ 7.70 (environment lighting) → 7.78 (full-frame lighting) → motion pass + Gemini
(not re-paneled; owner accepted as ship-worthy). Objective gate 10/10 throughout.
Delivered below the 9.0 subjective bar by owner decision, disclosed here.

**Upgrades made this run (with why):**
- NEW ENGINE `video-engine/src/lib/lighting.tsx` — principled depth system
  (tones() key/core/shade ramps, FormGradient, RimLight, ContactShadow/AO,
  Bark/BrushedMetal/Foliage texture, filmic GradeLayer, anisotropic MotionBlur).
  Why: three judges unanimously read the old flat-fill art as "clip-art"; this took
  illustration craft 4/5/6 → 8/7/8 and color 6/6/8 → 8/8/8.
- APPLIED lighting to environment, MachineShadow, the Character rig, and the sled
  dogs; added a gallop gait + 180° motion blur to the dogs and a physical
  shockwave/dust stake impact (replacing a flat comic starburst). Why: motion craft
  and "flat sticker" figure were the named ceilings.
- ROSTER GROWTH SYSTEM (owner directive: stop reusing, grow as artists):
  - `prompts/dispatch_routine.md` §4.3a growth mandate (net-new floor per run),
    §4.1a art-direction pass, Gate 0D (art-direction critic), Phase 8 retrospective.
  - `lib/ASSET_MANIFEST.md` living inventory + backlog.
  - `lib/fauna.tsx` bestiary seeded 1 → 5 (Moose, Raven, BaldEagle, Salmon).
- VOICE: retired the cloned Chatterbox voice for the Gemini TTS narrator (Charon)
  per owner; fixed the Gemini billing/key path (prepay→postpay, project-scoped key).
- BUG FIXES worth remembering:
  - `build_timeline.py` filename-collision that silently SHUFFLED VO line audio on
    re-run (every line but the last played the wrong content) — rewrote to read from
    a permanent `recovered/` source dir; verify VO order by transcript, always.
  - `dispatch_captions.py` — retry whisper alignment + normalize cues (monotonic,
    non-overlapping, min 0.8s) so no caption can collapse to a 0.04s flash.
  - `build_scenes.py` — SCENE_START_LINE had 8 entries vs 6 scenes, so episode_props
    silently fell back to hardcoded bounds; corrected to [0,2,4,6,8,10].
  - `shots.json` was stale from the 07-17 episode; regenerate per run.
  - SILENCE_DIP + VIDEO_SECS in the mix now derive live from vo_lines.json.

**Known issues deferred (owner-acknowledged):**
- Gemini voice reads slightly robotic — tune prosody/style (or a warmer voice /
  ElevenLabs) in a later run.
- HUD/label chips (StatCard, boundary polygon, dotted chain) still render as flat
  fills over the lit world — give the label kit form-shading + drop shadow next.
- Non-question VO close caps the Writing axis; consider a question button.
- SledDogTeam should be promoted from Episode.tsx into fauna.tsx and parameterized.

**Commits (branch tsturg/lucid-cray-s1n1b2):** caption/dip fixes → audio-shift
recovery → scene retime → HUD_TEXT fix → lighting engine → full-frame lighting →
motion pass → Gemini VO retime → roster-growth system → art-direction/retrospective
doctrine. See `git log` on the branch for exact refs.
