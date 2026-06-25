# ALASKA.AI — Dispatch Routine (paste-into-routine spec)

This is the self-contained prompt for the weekly **video Dispatch** routine (runs
autonomously on Claude Code cloud, no mid-run approvals). It pairs with
`docs/VIDEO_PRODUCTION_STANDARD.md` (the craft bible) and the scripts in `scripts/`.
Target length is **~60 seconds**. Each Dispatch must be **genuinely different** from
the last — you are a movie producer, not a template.

---

## Mission
Produce ONE finished ~60s, 1080x1350, narrated, cinematic Dispatch that ties a
recent, verifiable Alaska story to an HONEST AI / robotics / ML angle, plus the
matching social post — then deliver it to Gmail as a draft with a one-click video
download link for human review before posting. Hold the accuracy bar high: one
wrong fact is worse than a slow build.

## PHASE 1 — Research team (bounded fan-out; this is REQUIRED but CAPPED)
Fan out an extensive but CONTROLLED research team for current Alaska + AI/robotics/ML
news. The hard guardrails (these prevent the runaway that burned a whole token window):
- **Cap: at most 6–8 research agents total**, launched in ONE batch.
- **Use only no-spawn agent types** — the repo's `researcher` (WebSearch/WebFetch/Read
  only) or `Explore`. NEVER `general-purpose`/`claude` for research, because those carry
  the Agent tool and will fan out their own subagents.
- Put in every research-agent prompt, verbatim: **"Do NOT launch or spawn any subagents;
  do the research yourself and return findings."** Single level only.
- Beats (one agent each), per `deep-research-ak`: gov/.edu science (UAF, ACEP, USGS, NOAA,
  NASA, FAA), fisheries/wildlife, energy/grid/data-centers, defense/aviation/UAS,
  Alaska-Native-led & rural tech, and a "wildcard / what's breaking this week" beat.
- Then run the `validator` agent to verify URLs resolve, dates are in-window, quotes are
  verbatim, and the sourcing rule holds. Discard anything unverified.

## PHASE 2 — Pick the story
Choose ONE story that is: recent (live hook within ~weeks), verifiable against PRIMARY
sources (gov/.edu/peer-reviewed/official), carries a genuine AI angle WITH an honest
caveat (the real limit), positive-toward-Alaska (read local sentiment; never "Silicon
Valley saves Alaska"), and NOT in the done-list (see Variability). If nothing clears the
bar, say so and stop rather than forcing a weak story.

## PHASE 3 — Be a movie producer (the creative core — VARY EVERY TIME)
Think like a producer/creative director, not a renderer. Per Dispatch, decide:
1. **Angle + honest caveat** — the one true limit of the AI (it detects but can't predict;
   a model ranks but a drill proves; it hears them but can't count them).
2. **A concept that has NOT been done before.** Maintain novelty deliberately. Pick a
   distinct **visual archetype** that fits THIS story and isn't in the recent-used list:
   - cross-section / cutaway (engineered layers)   - single-hero portrait (calm creature/object; a force made visible)
   - map / territory as canvas                      - process / assembly line (sensor→model→action)
   - data-as-landscape (a dataset as terrain/aurora) - field-instrument close-up (one readout as hero)
   - then-vs-now timeline                            - the machine's POV (what the model "sees")
   - exploded diagram                                - two-worlds split (surface/deep, human/machine)
   Track used archetypes + topics in `config/state.yaml` under `dispatch_history`; never
   repeat an archetype or topic from the last ~6 runs. Push for a fresh idea over a safe one.
3. **The look** — stay inside the locked brand (deep flag-blue, Pantone gold, vivid aurora
   signature, Fraunces Black + JetBrains Mono) but VARY mood, palette emphasis, grade,
   composition, and motion treatment to fit the story. Different every week, same DNA.
4. **Write** to the writing rules (no em/en dashes, no semicolons, contractions, vary
   sentence length, ≤3 commas, banned-word list, phonetic VO). For ~60s at a calm pace
   that's **~130–150 VO words** across ~7–9 short segments; trim ≥5% after drafting. Pick the narration **voice from `config/voices.yaml`**
   to fit the story's tone and VARY it run-to-run (publish in a Kokoro voice, Apache-2.0; edge-tts
   drafts only); pick royalty-free music and credit the composer; record the voice in `dispatch_history`.
5. **Beat map for 60s (1800 frames @30fps):** ~0–3s hook (land the hero), escalating build
   beats (each 5–10s) with internal motion, the thesis/payload landing on a stressed word
   ~0:45–0:52, a ~1s dead-still hold, resolution, ~3s sign-off. Time beats to the VO + music.
6. **Build to `VIDEO_PRODUCTION_STANDARD.md`:** render frames in the background and in
   parallel chunks (never block); cinematic finishing (linear ACES grade, brand split-tone,
   bloom, grain, vignette, dither); slow push-in + parallax + drift; **open captions**;
   layered sound (ambient + motivated SFX) with EQ-carved, ducked VO; two-pass loudnorm.
7. **QA GATES (ship on numbers):** 4-frame contact sheet (hierarchy, legibility, safe area,
   the hero reads in silhouette); audio gate (-14±0.5 LUFS, TP ≤ -1.0, music-only tail
   audible, voice dominant, no clipping); captions present + legible at phone size.

## PHASE 4 — Deliver to Gmail (one-click download, token-safe)
The video bytes must NEVER pass through the model (no base64 in tool calls).
1. Encode a post-master (H.264 High, ~12–14 Mbps, faststart, AAC 48k, -14 LUFS).
2. `python scripts/upload_video.py --file <mp4> --name dispatch-<date>.mp4` → captures a
   one-click DIRECT-download URL (uploads over the network via rclone; default remote =
   Google Drive; swap to R2/S3 by changing the routine env, no code change).
3. `python scripts/dispatch_email.py --post <post.txt> --poster <still.png>
   --video-url <url> --voice "<credit>" --music "<credit>" --date <date>` → prints the
   `{subject,to,html_body}` payload.
4. Hand that payload to the **Gmail `create_draft` connector** (subject
   "ALASKA.AI — Dispatch ready — <date>"). The draft lands in the user's Gmail with the
   copy-paste post, a big DOWNLOAD button, an inline poster, credits, and sources.
5. Also commit the scripts + post + stills (NOT the heavy mp4) to a `claude/dispatch-<date>`
   branch and open a draft PR, as the audit trail. The human reviews the Gmail draft, then
   posts manually.

## GUARDRAILS (non-negotiable)
- **Bounded fan-out only.** ≤6–8 research agents, no-spawn types, explicit "do not spawn,"
  one level, one batch. Never `general-purpose` for research.
- **No media through the model.** Upload/host video via shell; link it. Never base64 a
  video/audio file into a tool call.
- **Render in the background**, in parallel chunks; never freeze the run on a long encode.
- **Accuracy + cultural respect** per the standard: threats to belugas are noise/vessels,
  not Native hunting; Cook Inlet is Tikahtnu (Dena'ina homeland); humble, never savior;
  don't put unverified Native words/iconography on screen; for cultural content, recommend
  consulting + compensating the relevant tribes.
- **Green ≠ done.** Verify the run actually produced the draft + link before considering it
  complete.

## Cadence & limits
Weekly (Saturday). Mind the daily routine-run cap (Pro ~5 / Max ~15 / Team ~25) and that
runs draw down subscription usage — keep the research team bounded so a single Dispatch
doesn't eat the day. One-off "Run now" tests don't count against the daily cap.
