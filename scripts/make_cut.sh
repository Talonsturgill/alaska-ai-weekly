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
step say_it_show_it    1 python3 scripts/say_it_show_it_check.py
step staging           0 python3 scripts/staging_check.py

# 1b. The mix, every cut (machine pass 2026-10-09). The mix receipt hashes storyboard.json,
# episode_props.json and vo_lines.json, so a board or build_scenes change after the last mix
# made encode fail with "source contents changed" on a render that was fine, and 10-09 lost a
# cut to it. dispatch_mix.py is deterministic (seeded by the run id) and reads nothing the
# render writes, so it runs here, after the source gates and before the render, and a schedule
# failure (family repeat, second riser) costs seconds instead of a render.
step mix               1 python3 scripts/dispatch_mix.py

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
