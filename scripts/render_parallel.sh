#!/usr/bin/env bash
# ============================================================================
# PARALLEL RENDER — split the frame range across SEPARATE PROCESSES, then concat.
#
# MEASURED 2026-08-04 on the 4-core / 15GB routine box, 240 frames of Dispatch0803:
#     one process, --concurrency=2 ....... 149s
#     one process, --concurrency=4 ....... 155s   (NO GAIN)
#     four processes, 60 frames each ......  56s   (2.7x FASTER)
#
# AND THEN, on the full 2513-frame film, 4 equal chunks measured:
#     chunk 0 (S1-S3, characters + packet) .. ~14 min
#     chunks 1, 2, 3 ........................ ~4 min each, then idle
# i.e. ~26 min of work spread over 4 slots finished in 14 min of wall clock, because equal
# FRAME counts are not equal WORK. Hence the queue below: 12 chunks through 4 slots.
#
# So Remotion's in-process concurrency does not scale here: the tabs contend inside
# one Chrome and adding more just adds contention. Separate PROCESSES each get their
# own browser and do scale. That is why raising --concurrency looked like the obvious
# lever and did nothing, and it is why the owner remembered splitting the render.
#
# On the full 2513-frame film: ~30 minutes single-process, 14 with 4 equal chunks, and
# the queue below is what closes the rest of the gap toward the ~7 the work actually costs.
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
# NO DEFAULT COMPOSITION (2026-08-08). This read `${1:-Dispatch0803}`, so invoking the
# script with no arguments silently rendered a film that shipped on August 3rd. It cost
# 2.5 hours: the render succeeded, printed OK, produced a valid 3835-frame file with a
# plausible size, and every downstream step would have graded the wrong movie.
#
# A default target is only ever right for the run it was written in. Nothing about a
# per-run composition id belongs in a fallback, because the failure mode is not an error
# but a confident success on the wrong subject. Same family as the three gates this run
# that reported clean while reading a shipped July episode.
if [ $# -lt 1 ]; then
  echo "render_parallel.sh: refusing to guess which film to render." >&2
  echo "Usage: scripts/render_parallel.sh <Comp> <out.mp4> [total_frames] [chunks]" >&2
  echo "Compositions are declared in video-engine/src/Root.tsx." >&2
  exit 2
fi
# ONE RENDER AT A TIME (2026-08-08). Two instances were started minutes apart because the
# first launch LOOKED like it had failed - the command that started it errored on an
# unrelated `head` of its log, so it read as dead, while nohup had in fact started it and
# the script's own `cd` had already corrected its working directory.
#
# They then fought over CPU and over identically-named chunk files, and the run reported
# "a chunk failed" while every chunk log showed 320/320 encoded. That is an expensive way
# to lose half an hour: the failure message pointed at rendering, and the cause was that
# there were two of everything.
#
# A render is exclusive by nature, so say so rather than trusting the caller to have
# checked. flock releases automatically if the holder is killed, so a crashed run does not
# leave a lock nobody can clear.
LOCK_DIR=""
WORK=""
ABS_OUT=""
RENDER_STARTED=0
RENDER_COMPLETE=0
cleanup() {
  if [ "$RENDER_STARTED" = 1 ] && [ "$RENDER_COMPLETE" != 1 ]; then
    rm -f "$ABS_OUT"
  fi
  if [ -n "$WORK" ]; then rm -rf "$WORK"; fi
  if [ -n "$LOCK_DIR" ]; then rmdir "$LOCK_DIR" 2>/dev/null || true; fi
}
trap cleanup EXIT
if command -v flock >/dev/null 2>&1; then
  exec 200>"${TMPDIR:-/tmp}/alaska-dispatch-render.lock"
  if ! flock -n 200; then
    echo "render_parallel.sh: another render is already running (lock held)." >&2
    echo "Wait for it, or kill it, before starting a second one. Two concurrent renders" >&2
    echo "contend for CPU and clobber each other's chunk files." >&2
    exit 3
  fi
else
  # macOS does not ship the Linux flock command. An atomic lock directory gives the same
  # one-render-at-a-time guarantee without requiring a package install. It is removed by the
  # EXIT trap below; a stale directory is therefore evidence of an unclean kill and is named
  # plainly instead of being misreported as a missing command.
  LOCK_DIR="${TMPDIR:-/tmp}/alaska-dispatch-render.lockdir"
  if ! mkdir "$LOCK_DIR" 2>/dev/null; then
    echo "render_parallel.sh: another render is already running (lock directory held: $LOCK_DIR)." >&2
    echo "If no renderer process exists, remove that stale lock directory and retry." >&2
    exit 3
  fi
fi

# Content receipts below fail closed on changed render inputs. An unchanged
# checkout timestamp is harmless. Cache publication waits for the same check.
if [ ! -x video-engine/node_modules/.bin/remotion ]; then
  echo "render_parallel.sh: local Remotion dependencies are missing; install the locked video-engine dependencies before rendering." >&2
  exit 4
fi

# PARSE THE SOURCES BEFORE SPENDING A RENDER ON THEM (2026-08-09).
# A single misplaced JSX comment - `{/* ... */}` used as the first child of a parenthesised
# expression, which is not legal JSX - made every chunk's bundle throw. The queue does not
# know the difference between "this chunk crashed" and "this film cannot compile", so it did
# what it is designed to do: retried each of 12 chunks 3 times, 36 identical bundle failures,
# and reported "a chunk failed" several minutes later. The real message was on line 3 of a
# temp log nobody had a path to.
#
# esbuild parses the whole engine in well under a second, so the check is free next to a
# render, and it turns a multi-minute mystery into one line naming the file and the column.
# It is a PARSE, not a typecheck: it catches the class that stops a bundle dead, and it does
# not pretend to catch a type error, which Remotion would render straight through anyway.
if [ -d video-engine/node_modules/esbuild ]; then
  _parse_err=0
  for _f in video-engine/src/*.tsx video-engine/src/*.ts video-engine/src/lib/*.tsx; do
    [ -e "$_f" ] || continue
    if ! (cd video-engine && npx --no-install esbuild "${_f#video-engine/}" \
            --log-level=error --outfile=/dev/null) 2>&1; then
      _parse_err=1
    fi
  done
  if [ "$_parse_err" -ne 0 ]; then
    echo "render_parallel.sh: the engine does not parse, so no chunk could ever bundle." >&2
    echo "Fix the syntax above and re-launch. Nothing was rendered." >&2
    exit 4
  fi
fi

# A PASSING CUT IS FINISHED (2026-08-09, owner's instruction). ship_gate.py writes
# out/dispatch/SHIP_NOW the moment a panel median clears the bar. While that file exists this
# script will not start a render, because the only reason to render after a pass is to replace
# a cut that was already good enough, and that is exactly what cost this routine nine hours and
# five rounds on the day the rule was written.
if [ -f out/dispatch/SHIP_NOW ]; then
  echo "render_parallel.sh: REFUSING. A passing cut is waiting to ship." >&2
  cat out/dispatch/SHIP_NOW >&2
  echo "If you really mean to abandon it, delete out/dispatch/SHIP_NOW first." >&2
  exit 5
fi

COMP="$1"
OUT="${2:-out/dispatch/render_mute.mp4}"
PROPS="${PROPS:-out/dispatch/episode_props.json}"
PROPS="$(python3 -c 'from pathlib import Path; import sys; print(Path(sys.argv[1]).resolve())' "$PROPS")"
# MORE CHUNKS THAN SLOTS, ON PURPOSE (2026-08-04). The first version cut the film into
# exactly one chunk per slot, which is only optimal when every frame costs the same. It
# does not: on the 2026-08-03 film, chunk 0 held S1 to S3, which carry the characters and
# the award packet, and it took about 14 minutes while chunks 1, 2 and 3 finished in about
# 4 and then sat idle. Wall clock was 14 minutes for roughly 26 minutes of work across 4
# slots, so three quarters of the machine was doing nothing for ten minutes.
#
# Smaller chunks fed through a work queue fix that without needing to predict which shots
# are expensive: when a slot frees, it takes the next chunk. The cost is one extra Chrome
# start per chunk (~10-15s), which is why this is 12 and not 60.
CHUNKS="${4:-12}"
SLOTS="${SLOTS:-4}"

# A CHUNK CAN HANG FOREVER AFTER BUNDLING (2026-08-04, observed twice in two renders).
# Remotion prints "Bundling 100%" and then never emits a single "Rendered" line. It does
# not crash, it does not exit, it just sits. Measured: a healthy 210-frame chunk finishes
# in 90 to 150 seconds; the hung ones sat past 330 and 700 seconds with zero frames. It
# hit chunk 0 on one render and chunk 3 on the next, so it is not a property of any shot.
#
# Left alone this stalls the WHOLE render behind one dead slot, and a run that is waiting
# on a process that will never finish looks exactly like a run that is making progress.
# That is how a routine burns its window and ships nothing. A hang is now a bounded
# failure: cap the attempt, then retry the chunk from scratch.
CHUNK_TIMEOUT="${CHUNK_TIMEOUT:-420}"
TRIES="${TRIES:-3}"
if command -v timeout >/dev/null 2>&1; then
  TIMEOUT_CMD=(timeout -k 15 "$CHUNK_TIMEOUT")
elif command -v gtimeout >/dev/null 2>&1; then
  TIMEOUT_CMD=(gtimeout -k 15 "$CHUNK_TIMEOUT")
else
  TIMEOUT_CMD=(python3 "$PWD/scripts/run_with_timeout.py" --timeout "$CHUNK_TIMEOUT" --kill-after 15 --)
fi

# total frames: from episode_props.json unless the caller states it
TOTAL="${3:-}"
if [ -z "$TOTAL" ]; then
  TOTAL="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["total"])' "$PROPS")"
fi

case "$OUT" in /*) ABS_OUT="$OUT";; *) ABS_OUT="$PWD/$OUT";; esac
WORK="$(mktemp -d)"
CACHE_KEY="$(python3 scripts/render_provenance.py begin-render --video "$ABS_OUT" \
  --props "$PROPS" --composition "$COMP" --total "$TOTAL" --chunks "$CHUNKS")"
RENDER_STARTED=1

# CHUNK CACHE, KEYED ON CONTENT (2026-08-09). This routine box restarted twice in one run and
# each restart killed a render mid-flight, costing ~25 minutes of work that had already been
# done: chunks 0-3 were sitting complete in a temp dir the next invocation could not see,
# because WORK is a fresh mktemp every time.
#
# The key is the exact receipt manifest: sources, assets, dependency/config files,
# actual props, composition and chunk partition. Only complete.json makes a cache
# reusable. New chunks stay in WORK until source and frame-count validation passes.
CACHE_ROOT="out/dispatch/chunkcache"
CACHE="$CACHE_ROOT/$CACHE_KEY"
echo "  validated chunk cache: $CACHE"

echo "parallel render: $COMP  $TOTAL frames  $CHUNKS chunks, $SLOTS at a time"
# DELETE THE OLD FILM BEFORE RENDERING THE NEW ONE (2026-08-04). When a chunk dies the
# script exits 1, correctly, but it used to leave the PREVIOUS render sitting at $OUT
# with a plausible size and a valid frame count. Every downstream step then ran happily
# on yesterday's picture: encode, evidence, panel, all of it scoring a film that does
# not contain the fixes the run just made. It cost a full panel round to notice, by
# checking a timestamp by hand. A failed render must leave NO output, so that everything
# after it fails loudly instead of quietly succeeding on the wrong bytes.
rm -f "$ABS_OUT"

# Render one chunk, surviving the post-bundle hang described above. A chunk that produces
# no complete output inside CHUNK_TIMEOUT is killed and retried from scratch. A
# chunk is accepted only with its full expected frame count.
render_chunk() {
  local i="$1" A="$2" B="$3" attempt=1 got="" cache_status=0
  python3 scripts/render_provenance.py restore-chunk --video "$ABS_OUT" \
      --cache-dir "$CACHE" --chunk "c$i.mp4" --destination "$WORK/c$i.mp4" || cache_status=$?
  if [ "$cache_status" = 0 ]; then
    echo "  chunk $i reused from validated cache (input and chunk hashes match)" >&2
    return 0
  fi
  # A missing/corrupt cache is an ordinary miss (1). Changed/missing source inputs
  # fail closed (2); do not spend attempts rendering after validation has failed.
  if [ "$cache_status" != 1 ]; then return "$cache_status"; fi
  while [ "$attempt" -le "$TRIES" ]; do
    rm -f "$WORK/c$i.mp4"
    ( cd video-engine && "${TIMEOUT_CMD[@]}" \
        npx --no-install remotion render src/index.ts "$COMP" "$WORK/c$i.mp4" \
        --props="$PROPS" --codec=h264 --muted --concurrency=1 --crf=19 \
        --frames="$A-$B" ) >"$WORK/c$i.attempt$attempt.log" 2>&1 || true
    got="$(ffprobe -v error -select_streams v:0 -count_frames \
      -show_entries stream=nb_read_frames -of default=nw=1:nk=1 "$WORK/c$i.mp4" 2>/dev/null | head -1)" || got=""
    if [ "$got" = "$(( B - A + 1 ))" ]; then
      cp "$WORK/c$i.attempt$attempt.log" "$WORK/c$i.log"
      [ "$attempt" -gt 1 ] && echo "  chunk $i recovered on attempt $attempt" >&2
      return 0
    fi
    echo "  chunk $i attempt $attempt didn't produce all expected frames, retrying" >&2
    attempt=$(( attempt + 1 ))
  done
  cp "$WORK/c$i.attempt$(( attempt - 1 )).log" "$WORK/c$i.log" 2>/dev/null || true
  echo "  chunk $i FAILED after $TRIES attempts" >&2
  return 1
}

PER=$(( (TOTAL + CHUNKS - 1) / CHUNKS ))
LIST="$WORK/list.txt"; : > "$LIST"
FAIL=0
PIDS=()

# Bash 3.2 ships on macOS and does not implement `wait -n`. Polling only the exact child PIDs
# preserves the dynamic work queue on both old Bash and modern Linux shells, while `wait` still
# collects the real exit status once a child finishes.
wait_one_child() {
  local idx pid
  while true; do
    for idx in "${!PIDS[@]}"; do
      pid="${PIDS[$idx]}"
      if ! kill -0 "$pid" 2>/dev/null; then
        wait "$pid" || FAIL=1
        unset 'PIDS[idx]'
        if [ -n "${PIDS[*]-}" ]; then
          PIDS=("${PIDS[@]}")
        else
          PIDS=()
        fi
        return
      fi
    done
    sleep 0.2
  done
}

for i in $(seq 0 $((CHUNKS - 1))); do
  A=$(( i * PER ))
  B=$(( A + PER - 1 ))
  [ "$B" -ge "$TOTAL" ] && B=$(( TOTAL - 1 ))
  [ "$A" -gt "$B" ] && continue
  echo "  chunk $i: frames $A-$B"
  render_chunk "$i" "$A" "$B" &
  PIDS+=("$!")
  echo "file '$WORK/c$i.mp4'" >> "$LIST"
  # THE WORK QUEUE. Hold at most SLOTS renders in flight and start the next chunk the
  # moment any one of them finishes, so a slow chunk overlaps with fast ones instead of
  # holding the whole render open on its own.
  if [ "${#PIDS[@]}" -ge "$SLOTS" ]; then
    wait_one_child
  fi
done

while [ -n "${PIDS[*]-}" ]; do
  wait_one_child
done
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
python3 scripts/render_provenance.py finish-render --video "$ABS_OUT" \
  --chunk-dir "$WORK" --cache-dir "$CACHE"
RENDER_COMPLETE=1
echo "  OK  $ABS_OUT  $GOT frames  $(du -h "$ABS_OUT" | cut -f1)"
