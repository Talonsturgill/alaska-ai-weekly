#!/usr/bin/env bash
# ============================================================================
# PARALLEL RENDER — split the frame range across SEPARATE PROCESSES, then concat.
#
# MEASURED 2026-08-04 on the 4-core / 15GB routine box, 240 frames of Dispatch0803:
#     one process, --concurrency=2 ....... 149s
#     one process, --concurrency=4 ....... 155s   (NO GAIN)
#     four processes, 60 frames each ......  56s   (2.7x FASTER)
#
# So Remotion's in-process concurrency does not scale here: the tabs contend inside
# one Chrome and adding more just adds contention. Separate PROCESSES each get their
# own browser and do scale. That is why raising --concurrency looked like the obvious
# lever and did nothing, and it is why the owner remembered splitting the render.
#
# On the full 2513-frame film this is roughly 30 minutes -> roughly 10.
#
# Concat is STREAM COPY (-c copy), so the output is bit-identical to a single-process
# render; no re-encode, no generation loss. Chunk boundaries are exact frame ranges so
# no frame is rendered twice or skipped, and the script ASSERTS the final frame count
# against the expected total before it will hand back a file.
#
# Usage: scripts/render_parallel.sh <Comp> <out.mp4> [total_frames] [chunks]
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."
COMP="${1:-Dispatch0803}"
OUT="${2:-out/dispatch/render_mute.mp4}"
PROPS="${PROPS:-out/dispatch/episode_props.json}"
CHUNKS="${4:-4}"

# total frames: from episode_props.json unless the caller states it
TOTAL="${3:-}"
if [ -z "$TOTAL" ]; then
  TOTAL="$(python3 -c "import json;print(json.load(open('$PROPS'))['total'])")"
fi

case "$OUT" in /*) ABS_OUT="$OUT";; *) ABS_OUT="$PWD/$OUT";; esac
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "parallel render: $COMP  $TOTAL frames  $CHUNKS chunks"
PER=$(( (TOTAL + CHUNKS - 1) / CHUNKS ))
PIDS=(); LIST="$WORK/list.txt"; : > "$LIST"

for i in $(seq 0 $((CHUNKS - 1))); do
  A=$(( i * PER ))
  B=$(( A + PER - 1 ))
  [ "$B" -ge "$TOTAL" ] && B=$(( TOTAL - 1 ))
  [ "$A" -gt "$B" ] && continue
  echo "  chunk $i: frames $A-$B"
  ( cd video-engine && npx remotion render src/index.ts "$COMP" "$WORK/c$i.mp4" \
      --props="../$PROPS" --codec=h264 --muted --concurrency=1 --crf=19 \
      --frames="$A-$B" >"$WORK/c$i.log" 2>&1 ) &
  PIDS+=($!)
  echo "file '$WORK/c$i.mp4'" >> "$LIST"
done

FAIL=0
for p in "${PIDS[@]}"; do wait "$p" || FAIL=1; done
if [ "$FAIL" -ne 0 ]; then
  echo "a chunk failed; logs in $WORK" >&2
  for l in "$WORK"/c*.log; do echo "--- $l"; tail -5 "$l"; done >&2
  exit 1
fi

ffmpeg -y -f concat -safe 0 -i "$LIST" -c copy "$ABS_OUT" -v error

GOT="$(ffprobe -v error -select_streams v:0 -count_frames \
        -show_entries stream=nb_read_frames -of default=nw=1:nk=1 "$ABS_OUT" | head -1)"
if [ "$GOT" != "$TOTAL" ]; then
  echo "FRAME COUNT ASSERT FAILED: concat produced $GOT frames, expected $TOTAL ($ABS_OUT)" >&2
  echo "  A short concat means a chunk boundary is wrong; do NOT ship this file." >&2
  exit 1
fi
echo "  OK  $ABS_OUT  $GOT frames  $(du -h "$ABS_OUT" | cut -f1)"
