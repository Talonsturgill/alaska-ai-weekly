#!/usr/bin/env python3
"""The run id, read from the run stamp, so no script carries a per-run date constant.

WHY THIS EXISTS (machine pass 2026-10-09). dispatch_mix.DATE, its riser beat id and BED_ARC,
and build_evidence.MOVE_RUN_DATE were hand-edited on every run and failed the cut one at a
time (2026-10-08 and again 2026-10-09, queue signature evidence-run-date-constant). Phase 0
already writes the run id once, `python3 scripts/run_guard.py init --run-id <date>`, into
out/dispatch/.run_stamp.json. Every per-run script reads it from here instead.

The guard those constants existed for is kept: board_run_id() fails when the board's own
run_date is not the stamped run, which is how a stale storyboard.json from a previous film is
caught before it is mixed or sampled.

Usage: python3 scripts/run_stamp.py            # prints the run id, exit 1 when unstamped
"""
import json
import os
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
STAMP = os.path.join(REPO, "out", "dispatch", ".run_stamp.json")


class RunStampError(ValueError):
    """The run is not stamped, or the board belongs to another run."""


def run_id(stamp=None):
    """The stamped run id (for example '2026-10-09'). Raises RunStampError when unstamped."""
    path = stamp or STAMP
    try:
        rid = json.load(open(path)).get("run_id")
    except (OSError, ValueError) as exc:
        raise RunStampError(f"run not stamped ({path}: {exc}); run "
                            f"`python3 scripts/run_guard.py init --run-id <date>` in Phase 0") from None
    if not rid or not isinstance(rid, str):
        raise RunStampError(f"{path} has no run_id")
    return rid


def board_run_id(board, who, stamp=None):
    """The stamped run id, after checking the board was written for this run."""
    rid = run_id(stamp)
    if str(board.get("run_date", "")) != rid:
        raise RunStampError(f"{who}: storyboard.json run_date {board.get('run_date')!r} is not this "
                            f"run ({rid!r} in out/dispatch/.run_stamp.json); the board is stale")
    return rid


if __name__ == "__main__":
    try:
        print(run_id())
    except RunStampError as exc:
        print(f"run_stamp: {exc}", file=sys.stderr)
        sys.exit(1)
