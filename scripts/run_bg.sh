#!/usr/bin/env bash
# ============================================================================
# NO-STALL BACKGROUND RUNNER (routine keep-alive helper)
# ----------------------------------------------------------------------------
# Why this exists: the Dispatch routine kept STALLING. Root causes:
#   1. Long jobs (voice synth ~45min, Remotion renders) run in FOREGROUND Bash
#      hit the 10-minute tool timeout and get killed mid-run, or block the driver.
#   2. The driver ends a turn waiting on a job with a LONG fallback wakeup, so a
#      missed completion notification sleeps the whole run blind for minutes.
#   3. A silently-hung job (dead render, wedged synth) looks identical to a
#      slow-but-alive one, so the driver waits forever.
#
# This runner fixes all three: it detaches the command, writes a PID, a HEARTBEAT
# file it touches every few seconds (so a hang is DETECTABLE: a stale heartbeat =
# wedged), and a .done marker containing the exit code when it finishes (so the
# driver can cheaply POLL a file instead of blocking or sleeping blind). It works
# across context windows / ScheduleWakeup resumes because state is on the FS, not
# in the harness task table.
#
# Usage:
#   scripts/run_bg.sh <marker_dir> <name> -- <command...>
# Files written under <marker_dir>:
#   <name>.pid        the detached job's PID
#   <name>.log        combined stdout+stderr
#   <name>.heartbeat  touched every HEARTBEAT_S seconds while alive
#   <name>.done       written ONCE on exit; contents = the command's exit code
#
# Poll pattern for the driver (cheap, non-blocking):
#   test -f <marker_dir>/<name>.done && echo "exit=$(cat ...<name>.done)"   # finished?
#   find <marker_dir>/<name>.heartbeat -newermt '-90 seconds' | grep -q .    # still alive?
#   (heartbeat older than ~90s AND no .done  => the job is WEDGED, not slow.)
# ============================================================================
set -uo pipefail
HEARTBEAT_S="${HEARTBEAT_S:-15}"

if [ "$#" -lt 4 ]; then
  echo "usage: run_bg.sh <marker_dir> <name> -- <command...>" >&2
  exit 2
fi
MARKER_DIR="$1"; NAME="$2"; shift 2
if [ "$1" != "--" ]; then
  echo "run_bg.sh: expected '--' before the command, got '$1'" >&2
  exit 2
fi
shift

mkdir -p "$MARKER_DIR"
LOG="$MARKER_DIR/$NAME.log"
PIDF="$MARKER_DIR/$NAME.pid"
HB="$MARKER_DIR/$NAME.heartbeat"
DONE="$MARKER_DIR/$NAME.done"
rm -f "$DONE"
: > "$LOG"
touch "$HB"

setsid bash -c '
  HB="$1"; DONE="$2"; LOG="$3"; HEARTBEAT_S="$4"; shift 4
  ( while true; do touch "$HB"; sleep "$HEARTBEAT_S"; done ) &
  HBPID=$!
  "$@" >> "$LOG" 2>&1
  code=$?
  kill "$HBPID" 2>/dev/null
  touch "$HB"
  echo "$code" > "$DONE"
' _ "$HB" "$DONE" "$LOG" "$HEARTBEAT_S" "$@" &

echo $! > "$PIDF"
echo "launched '$NAME' pid=$(cat "$PIDF")"
echo "  log:   $LOG"
echo "  done:  $DONE   (poll: test -f this; contents = exit code)"
echo "  beat:  $HB      (fresh mtime = alive; stale >90s + no .done = wedged)"
