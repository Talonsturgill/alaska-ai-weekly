#!/usr/bin/env bash
# Render wrapper — makes the taste loop CHEAP and the final SHIP-GRADE.
#
#   scripts/render.sh draft  [comp] [out.mp4]   half-res, fast-encode preview (~3-4x faster)
#   scripts/render.sh final  [comp] [out.mp4]   full 1080x1920, ship quality
#   scripts/render.sh still  <frame> [comp] [out.png] [--draft]
#
# THE RULE (docs: taste loop / Phase 5): iterate on DRAFT renders and draft
# stills — look, fix, re-render 3-5x at low cost. Only the FINAL gate and the
# judge panel see a full-res render. Draft stills are half-res; critics grading
# COMPOSITION/story can use them, but legibility checks (caption px heights)
# must run on a final-res render.
set -euo pipefail
cd "$(dirname "$0")/../video-engine"
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}"
PROPS="${PROPS:-../out/dispatch/episode_props.json}"

MODE="${1:?usage: render.sh draft|final|still ...}"
case "$MODE" in
  draft)
    COMP="${2:-Dispatch}"; OUT="${3:-../out/dispatch/render/draft.mp4}"
    exec npx remotion render src/index.ts "$COMP" "$OUT" \
      --props="$PROPS" --codec=h264 --muted --concurrency=2 \
      --scale=0.5 --crf=30 --every-nth-frame=1
    ;;
  final)
    COMP="${2:-Dispatch}"; OUT="${3:-../out/dispatch/render/video_mute.mp4}"
    exec npx remotion render src/index.ts "$COMP" "$OUT" \
      --props="$PROPS" --codec=h264 --muted --concurrency=2 --crf=19
    ;;
  still)
    FRAME="${2:?frame number}"; COMP="${3:-Dispatch}"; OUT="${4:-../out/dispatch/probe/still_$FRAME.png}"
    SCALE=1
    if [[ "${5:-}" == "--draft" || "${4:-}" == "--draft" ]]; then SCALE=0.5; fi
    [[ "${4:-}" == "--draft" ]] && OUT="../out/dispatch/probe/still_$FRAME.png"
    exec npx remotion still src/index.ts "$COMP" "$OUT" --frame="$FRAME" --props="$PROPS" --scale="$SCALE"
    ;;
  *)
    echo "unknown mode: $MODE (draft|final|still)"; exit 2
    ;;
esac
