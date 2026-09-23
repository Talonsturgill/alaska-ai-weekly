#!/usr/bin/env python3
"""Re-conform an already-conformed board from ONE narration clock onto ANOTHER.

WHY THIS EXISTS (2026-09-23). scripts/conform_storyboard.py maps a board's PLANNING
clock onto an aligned narration, once. It needs either per-beat `vo_line`/`offset`
anchors or a `planning_clock` block it wrote on the first pass. Today's board has
neither: its beats carry absolute `t`/`at_s` only, and the run that built it conformed
by another route. So when the owner restored the Gemini billing mid-day and asked for
the voice to be redone, there was no way to move the board onto the new take, and the
board is where every beat, reveal, loop and audio event in the film lives.

This conforms clock-to-clock instead of planning-to-clock. Both narrations speak the
SAME nineteen lines, so line i in the old take and line i in the new take are the same
sentence. That makes a piecewise-linear map: a time inside old line i lands at the same
fraction of new line i, and a time in the gap after line i lands at the same fraction of
the new gap. Every absolute time in the board goes through it.

Shots are snapped rather than mapped. Each shot already names the `vo_line` it opens on,
and a shot boundary that lands a few frames off its own sentence is the defect the
say-it-show-it gate exists to catch, so a shot's start is taken from the new line start
directly and its duration is recomputed from the next shot.

    python3 scripts/reconform_to_voice.py --old out/dispatch/_oldclock/vo_lines.json \
        --new out/dispatch/vo_lines.json --board out/dispatch/storyboard.json
"""
import argparse
import json
from copy import deepcopy


def build_map(old_lines, new_lines):
    """Piecewise-linear old-time -> new-time over matched narration lines."""
    o = {int(x["idx"]): (float(x["start"]), float(x["end"])) for x in old_lines}
    n = {int(x["idx"]): (float(x["start"]), float(x["end"])) for x in new_lines}
    if sorted(o) != sorted(n):
        raise ValueError("the two takes do not speak the same set of lines")
    idx = sorted(o)
    for i in idx[:-1]:
        if o[i][0] >= o[i + 1][0] or n[i][0] >= n[i + 1][0]:
            raise ValueError("line starts must increase strictly in both takes")
    o_end, n_end = max(v[1] for v in o.values()), max(v[1] for v in n.values())

    def mapped(t):
        t = float(t)
        # before the first word, hold the head gap's own scale
        if t <= o[idx[0]][0]:
            head_o, head_n = o[idx[0]][0], n[idx[0]][0]
            return round(t * (head_n / head_o), 3) if head_o > 1e-9 else round(t, 3)
        i = max(k for k in idx if o[k][0] <= t)
        lo_o, lo_n = o[i][0], n[i][0]
        hi_o = o[i + 1][0] if i + 1 in o else o_end
        hi_n = n[i + 1][0] if i + 1 in n else n_end
        if hi_o - lo_o <= 1e-9:
            return round(lo_n, 3)
        # past the last word the tail keeps its own length rather than stretching
        if t > o_end:
            return round(n_end + (t - o_end), 3)
        return round(lo_n + (t - lo_o) * (hi_n - lo_n) / (hi_o - lo_o), 3)

    return mapped, n, n_end


def reconform(board, old_lines, new_lines):
    b = deepcopy(board)
    mapped, new, n_end = build_map(old_lines, new_lines)

    for beat in b["beats"]:
        beat["t"] = mapped(beat["t"])
        if "at_s" in beat:
            beat["at_s"] = beat["t"]

    # SHOTS SNAP TO THEIR OWN SENTENCE. A mapped shot boundary can land a few frames
    # inside the previous line, and a shot that opens on the tail of the sentence before
    # it is exactly what say_it_show_it_check is built to fail.
    shots = sorted(b["shots"], key=lambda s: s["t"])
    for s in shots:
        li = int(s["vo_line"])
        if li not in new:
            raise ValueError(f"shot {s['id']} names narration line {li}, which the new take does not have")
        s["t"] = round(new[li][0], 3)
    for i, s in enumerate(shots):
        end = shots[i + 1]["t"] if i + 1 < len(shots) else n_end
        s["dur"] = round(end - s["t"], 3)
        if s["dur"] <= 0:
            raise ValueError(f"shot {s['id']} came out non-positive at {s['dur']}s")

    for key in ("dip_at", "riser_at", "silence_at", "payoff_at"):
        if key in b.get("audio_arc", {}):
            b["audio_arc"][key] = mapped(b["audio_arc"][key])
    for r in b.get("reveals", []):
        r["t"] = mapped(r["t"])
    for loop in ("open_loop", "open_loop_2"):
        if loop in b:
            for key in ("plant_t", "pay_t"):
                if key in b[loop]:
                    b[loop][key] = mapped(b[loop][key])
    for st in b.get("throughline", {}).get("states", []):
        if "at_s" in st:
            st["at_s"] = mapped(st["at_s"])
    if "motion_by_s" in b.get("hook", {}):
        b["hook"]["motion_by_s"] = mapped(b["hook"]["motion_by_s"])
    return b


def enforce(board, min_gap=0.65, lead=0.1):
    """Re-apply the two hand-set invariants the first ship established.

    Both were absolute-time edits, so a clock-to-clock map carries them only by luck.
    They are re-derived here from what they actually mean rather than from their old
    numbers, so they survive any future re-conform as well.
    """
    notes = []
    beats = {x["id"]: x for x in board["beats"]}
    shots = {s["id"]: s for s in board["shots"]}

    # A beat belongs INSIDE the shot it is filed under. Beat 20 sat 0.8s before shot 8
    # opened, so its evidence filmstrip photographed the tail of shot 7 and two judges
    # read the turn as an empty frame that was never in the cut.
    for beat in board["beats"]:
        sid = beat.get("shot")
        if sid in shots and beat["t"] < shots[sid]["t"] + lead:
            was = beat["t"]
            beat["t"] = beat["at_s"] = round(shots[sid]["t"] + lead, 3)
            notes.append(f"beat {beat['id']} moved {was}s -> {beat['t']}s, inside shot {sid}")

    # An evidence filmstrip needs 0.28s of room inside its own beat, so two beats closer
    # than that cannot both be sampled and stage on top of each other besides.
    order = sorted(board["beats"], key=lambda x: x["t"])
    for prev, cur in zip(order, order[1:]):
        if cur["t"] - prev["t"] < min_gap:
            was = cur["t"]
            cur["t"] = cur["at_s"] = round(prev["t"] + min_gap, 3)
            notes.append(f"beat {cur['id']} moved {was}s -> {cur['t']}s, {min_gap}s clear of beat {prev['id']}")
    return notes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--old", required=True, help="the vo_lines.json the board is currently conformed to")
    ap.add_argument("--new", required=True, help="the vo_lines.json of the take that replaces it")
    ap.add_argument("--board", required=True)
    ap.add_argument("--out", default="")
    a = ap.parse_args()

    old = json.load(open(a.old))["lines"]
    new = json.load(open(a.new))["lines"]
    board = json.load(open(a.board))
    out = reconform(board, old, new)
    notes = enforce(out)

    dest = a.out or a.board
    json.dump(out, open(dest, "w"), indent=2)
    o_end = max(float(x["end"]) for x in old)
    n_end = max(float(x["end"]) for x in new)
    print(f"reconformed {len(out['beats'])} beats and {len(out['shots'])} shots, "
          f"{o_end:.2f}s of narration -> {n_end:.2f}s")
    for n in notes:
        print("  invariant:", n)
    if not notes:
        print("  invariant: nothing to re-apply, every beat already sits clear")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
