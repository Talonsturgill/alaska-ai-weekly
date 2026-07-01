#!/usr/bin/env bash
# Phase-6 self-healing loop driver: render -> objective gate -> encode (ONLY on PASS).
# The master agent runs this. On a non-zero exit (gate FAIL) the master delegates the named
# failure + quality_report.json to the `dispatch-fixer` subagent, then RE-INVOKES this script.
# The loop's only exit is PASS; it never encodes a render that fails the gate. No cap, no fallback.
#
#   bash scripts/dispatch_loop.sh              # render all frames, gate, encode on pass
#   bash scripts/dispatch_loop.sh --no-render  # gate the existing frames, encode on pass
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENG="$ROOT/.claude/skills/alaska-dispatch"        # committed engine = source of truth
WORK="${DISPATCH_WORK:-$ROOT/out/dispatch}"       # working scratch (frames, audio, master)
# Per-run scene script name (this run authors a fresh render_<concept>.py — see the SKILL.md note
# that a render_*.py is a scene, never copied). Override with DISPATCH_RENDER=render_<concept>.py.
RENDER_PY="${DISPATCH_RENDER:-render_v3.py}"
VO_PY="${DISPATCH_VO:-vo60.py}"
FRAMES_DIR="$WORK/frames_$(basename "$RENDER_PY" .py | sed 's/^render_//')"
TOT="${DISPATCH_FRAMES:-1800}"
NORENDER=0; [ "${1:-}" = "--no-render" ] && NORENDER=1

mkdir -p "$WORK" "$FRAMES_DIR"; cd "$WORK"
# always run the committed engine, so the loop reflects what's actually shipped
for f in "$RENDER_PY" "$VO_PY" quality_gate.py craft.py easing.py dispatch_core.py; do
  [ -f "$ENG/$f" ] && cp -f "$ENG/$f" "$WORK/"; done
# the VO/music mix lives in the engine dir (generated once by the producer before this loop runs);
# sync it into $WORK so the copied dispatch_core.py (which reads audio/ relative to its own dir) finds it
if [ -d "$ENG/audio" ]; then mkdir -p "$WORK/audio"; cp -f "$ENG/audio/"*.json "$ENG/audio/"*.wav "$WORK/audio/" 2>/dev/null || true; fi

if [ "$NORENDER" = "0" ]; then
  echo "=== render $TOT frames via $RENDER_PY (parallel across $(nproc) cores) ==="
  rm -f "$FRAMES_DIR"/*.png "$WORK/textlog/"*.json 2>/dev/null
  N=$(nproc); CH=$(( (TOT + N - 1) / N ))
  # DISPATCH_TEXTLOG=1 so dispatch_core emits the per-word manifest the READABILITY gate reads
  for ((i=0;i<N;i++)); do s=$((i*CH)); e=$((s+CH)); [ $e -gt $TOT ] && e=$TOT; [ $s -ge $TOT ] && break
    DISPATCH_TEXTLOG=1 python "$RENDER_PY" $s $e >"$WORK/_rv_$i.log" 2>&1 & done
  wait
fi
echo "frames: $(ls "$FRAMES_DIR"/*.png 2>/dev/null | wc -l)/$TOT"

echo "=== GATE A: objective quality gate ==="
if ! python quality_gate.py --frames "$FRAMES_DIR" --words "$WORK/audio/words60.json" --fps 30 --max-gap 5.0; then
  echo ""
  echo ">>> GATE FAILED — the loop does NOT stop here."
  echo ">>> Master: hand the failing check(s) above + $WORK/quality_report.json to the dispatch-fixer"
  echo ">>> subagent (it patches the cause in its own context), then RE-INVOKE this script."
  echo ">>> Do not encode, do not deliver. The only exit is PASS."
  exit 1
fi

echo "=== GATE PASS — encoding master ==="
ffmpeg -y -framerate 30 -i "$FRAMES_DIR/frame_%05d.png" -i "$WORK/audio/master60.wav" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high \
  -c:a aac -b:a 320k -movflags +faststart -shortest "$WORK/dispatch_master.mp4" 2>"$WORK/_encode.log" \
  || { echo "ENCODE FAIL"; tail -8 "$WORK/_encode.log"; exit 2; }
echo "=== MASTER READY: $WORK/dispatch_master.mp4 ==="
ls -la "$WORK/dispatch_master.mp4" | awk '{print "size:",$5,"bytes"}'
echo "Next (master): scripts/upload_video.py -> verify HTTP 200 -> scripts/dispatch_email.py draft."
