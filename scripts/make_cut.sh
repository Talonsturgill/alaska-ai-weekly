#!/usr/bin/env bash
# ============================================================================
# ONE CUT, ONE JOB: source gates -> mix -> full render -> encode -> evidence -> preflight.
#
# WHY THIS EXISTS (2026-09-30, the cost project). A panel candidate used to take a dozen or
# more main-loop calls: launch the render, poll it, launch the encode, poll that, build the
# evidence, run preflight, read each output. Every one of those calls re-reads the whole
# conversation, which late in a run is several hundred thousand tokens, and the calls were
# bookkeeping rather than decisions. This runs the same scripts in the same order as one
# background job and writes a short summary, so the run spends one call to launch it and one
# or two to wait on it (scripts/wait_for.py).
#
# It adds no gate and removes none. Every step is an existing script, unchanged, and the
# source gates run first for the reason the routine already gives: a string that is wider
# than its plate fails in four seconds here instead of after a fourteen minute render.
#
# Usage (always in the background, then wait in one call):
#   scripts/run_bg.sh out/dispatch/bg cut -- scripts/make_cut.sh <Comp>
#   python3 scripts/wait_for.py out/dispatch/bg cut --show out/dispatch/cut_summary.txt
#
# Exit 0 = a cut exists and preflight is clear, so the panel may be convened.
# Exit 1 = a step failed. The summary names it and the log under out/dispatch/cut_logs/ has it.
# ============================================================================
set -uo pipefail
cd "$(dirname "$0")/.."

if [ $# -lt 1 ]; then
  echo "usage: make_cut.sh <Comp>" >&2
  exit 2
fi
COMP="$1"
OUT=out/dispatch
LOGS="$OUT/cut_logs"
SUMMARY="$OUT/cut_summary.txt"
mkdir -p "$LOGS"
: > "$SUMMARY"
say() { echo "$*" | tee -a "$SUMMARY"; }
T0=$(date +%s)
say "make_cut $COMP started $(date -u +%H:%M:%SZ)"

# step <name> <required 1|0> <command...>. The full output goes to its own log, the summary
# gets one line, and a required failure ends the cut with the log's last lines in the summary.
step() {
  local name="$1" required="$2"; shift 2
  local t=$(date +%s)
  "$@" > "$LOGS/$name.log" 2>&1
  local code=$?
  local secs=$(( $(date +%s) - t ))
  local last
  last=$(grep -v '^\s*$' "$LOGS/$name.log" | tail -1 | cut -c1-200)
  if [ $code -eq 0 ]; then
    say "  OK    $name (${secs}s) $last"
    return 0
  fi
  if [ "$required" = 1 ]; then
    say "  FAIL  $name (${secs}s, exit $code). Last lines of $LOGS/$name.log:"
    tail -12 "$LOGS/$name.log" | sed 's/^/          /' | tee -a "$SUMMARY" >/dev/null
    say "make_cut: STOPPED at $name after $(( $(date +%s) - T0 ))s. Fix it and relaunch."
    exit 1
  fi
  say "  NOTE  $name (${secs}s, exit $code, advisory) $last"
  return 0
}

# 1. Source gates, before a single frame is spent. Each reads the engine or the props only.
step typecheck         1 video-engine/node_modules/.bin/tsc --noEmit -p video-engine/tsconfig.json
step text_fit          1 python3 scripts/text_fit_check.py
step caption_band      1 python3 scripts/caption_band_check.py
# Machine pass 2026-10-25: the lib sign-kit Plate was drawn at s 0.5 to 0.62 in three 10-25 shots and
# every seat called its lettering unreadable. A lettered Plate stays at s 0.8 or more, or passes
# lettered={false}. Reads the episode source only.
step plate_scale       1 python3 scripts/plate_scale_check.py
step say_it_show_it    1 python3 scripts/say_it_show_it_check.py
# Machine pass 2026-10-22, a repeat offender (10-21, 10-22 twice). These four read only the episode
# source and episode_props.json, yet ran only inside preflight, after the render. The 10-22 re-cut
# lost a 24 minute render to an 11 px plate overlap and a plate 6 px past the crop margin, both
# knowable from the source in seconds. Preflight still runs them on the shipped bytes.
step plate_overlap     1 python3 scripts/plate_overlap_check.py
step zoom_clip         1 python3 scripts/zoom_clip_check.py
step caption_rows      1 python3 scripts/caption_render_check.py --rows-only
step caption_spelling  1 python3 scripts/caption_spelling_check.py
# Machine pass 2026-10-24, a repeat offender (10-20, 10-24). The 10-24 first cut spent 26 minutes
# to fail preflight on two checks that read only source and props: a `72:00` colon in a board beat
# label (visible_copy_check) and three claims whose approved on_screen string existed only as split
# plate lines (claims_contract_check). Both run in under a second, from claims.json, vo_script.txt,
# the episode source and episode_props.json. Preflight still runs them on the shipped cut.
step visible_copy      1 python3 scripts/visible_copy_check.py
step claims_contract   1 python3 scripts/claims_contract_check.py
# Machine pass 2026-10-23, a repeat offender (10-02, 10-23 four cuts running). A label behind a
# character, under a quote card, or past the frame after a push-in passed every gate above,
# because each models one source relationship and none models a label against ART or reads the
# Frame camera. This renders the composition in Chrome every third frame (about a minute) and
# fails a label cut for 0.5 s or more. `--shots 7,13` re-checks named shots in seconds.
step label_footprint   1 python3 scripts/label_footprint_check.py
# Machine pass 2026-10-23: a beat too short for its evidence strip failed build_evidence AFTER the
# render on 10-15, 10-17 (twice) and 10-22. The strip plan reads only the board, vo_lines.json and
# the props, so resolve it here, naming every short beat at once.
step evidence_plan     1 python3 scripts/build_evidence.py --check-plan
step staging          0 python3 scripts/staging_check.py

# 1b. The mix, every cut (machine pass 2026-10-09). The mix receipt hashes storyboard.json,
# episode_props.json and vo_lines.json, so a board or build_scenes change after the last mix
# made encode fail with "source contents changed" on a render that was fine, and 10-09 lost a
# cut to it. dispatch_mix.py is deterministic (seeded by the run id) and reads nothing the
# render writes, so it runs here, after the source gates and before the render, and a schedule
# failure (family repeat, second riser) costs seconds instead of a render.
step mix               1 python3 scripts/dispatch_mix.py
# Machine pass 2026-10-24: a derived bed arc delivered LRA 5.9 against the 6 to 9 target on 10-24,
# an authored audio_arc.bed 7.5. Say so in the summary, where the run reads it before the render.
if grep -q "derived from board audio_arc" "$LOGS/mix.log"; then
  say "  NOTE  bed_arc derived, not authored. Write audio_arc.bed on the board (storyboard_check prints the node forms); a derived arc ran under the LRA target on 10-24."
fi

# 2. The full-resolution render, the parallel queue, its own frame count assert.
step render            1 bash scripts/render_parallel.sh "$COMP"

# 3. Mux, square, 720p, poster and every aspect and loudness assert.
step encode            1 bash scripts/encode_deliverables.sh

# 4. The evidence pack from the master that will ship.
step evidence          1 python3 scripts/build_evidence.py

# 5. Every mechanical gate, on the bytes above. Its FAIL and NOTE lines go in the summary.
t=$(date +%s)
python3 scripts/preflight.py > "$LOGS/preflight.log" 2>&1
code=$?
grep -E '^\s+(FAIL|NOTE)' "$LOGS/preflight.log" | cut -c1-220 | tee -a "$SUMMARY" >/dev/null
if [ $code -ne 0 ]; then
  say "  FAIL  preflight ($(( $(date +%s) - t ))s). Do NOT convene a panel. Full report in $LOGS/preflight.log"
  say "make_cut: cut rendered and encoded, preflight BLOCKED, $(( $(date +%s) - T0 ))s in all."
  exit 1
fi
say "  OK    preflight ($(( $(date +%s) - t ))s) $(tail -1 "$LOGS/preflight.log" | cut -c1-160)"
say "make_cut: $COMP is a panel candidate, $(( $(date +%s) - T0 ))s in all. Deliverables in $OUT/, evidence from build_evidence.py."
exit 0
