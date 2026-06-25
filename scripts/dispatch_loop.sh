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
FRAMES_DIR="$WORK/frames_v3"
TOT="${DISPATCH_FRAMES:-1800}"
NORENDER=0; [ "${1:-}" = "--no-render" ] && NORENDER=1

mkdir -p "$WORK" "$FRAMES_DIR"; cd "$WORK"
# always run the committed engine, so the loop reflects what's actually shipped
for f in render_v3.py vo60.py audio_v3.py quality_gate.py craft.py easing.py; do
  [ -f "$ENG/$f" ] && cp -f "$ENG/$f" "$WORK/"; done

if [ "$NORENDER" = "0" ]; then
  echo "=== render $TOT frames (parallel across $(nproc) cores) ==="
  rm -f "$FRAMES_DIR"/*.png
  N=$(nproc); CH=$(( (TOT + N - 1) / N ))
  for ((i=0;i<N;i++)); do s=$((i*CH)); e=$((s+CH)); [ $e -gt $TOT ] && e=$TOT; [ $s -ge $TOT ] && break
    python render_v3.py $s $e >"$WORK/_rv_$i.log" 2>&1 & done
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
