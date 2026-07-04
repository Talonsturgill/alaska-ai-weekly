#!/usr/bin/env python3
"""flow_check.py, the VISUAL FLOW analyzer (never-rest cadence + say-it-show-it + sound-paired).

Scores a Dispatch's PLAN (out/dispatch/storyboard.json > beats[]) and, when present, its rendered
audio (out/dispatch/audio/sfx_events.json + words60.json/timing60.json) against config/visual_flow.yaml.
Doctrine: docs/craft/VISUAL_FLOW.md.

Two roles:
  1. BACK-TEST instrument: `python scripts/flow_check.py --report [--dir out/dispatch]` prints metrics
     for a run (handles the OLD string-beat format too, so past dispatches can be measured).
  2. GATE core: `python scripts/flow_check.py` exits non-zero if a HARD flow rule fails (wired into
     Gate 0A via storyboard_check.py once thresholds are calibrated).

Beat schema (new): each beat is an object {t:"9.0-13.5", vo, shows, sfx, means}. See VISUAL_FLOW.md §3.
numpy-free; stdlib + pyyaml only.
"""
import sys, os, json, argparse, re
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parent.parent
CFG = yaml.safe_load((ROOT / "config" / "visual_flow.yaml").read_text())


def _parse_t(t):
    """'9.0-13.5' -> (9.0, 13.5). The '-' is a RANGE separator, not a minus (times are never negative).
    Tolerant of 'X to Y', a single number, or junk."""
    if isinstance(t, (int, float)):
        return float(t), None
    s = str(t or "").strip().lower().replace(" to ", "-")
    parts = [p for p in s.split("-") if p.strip()]

    def _num(x):
        m = re.search(r"\d+(?:\.\d+)?", x)
        return float(m.group()) if m else None
    a = _num(parts[0]) if parts else None
    b = _num(parts[1]) if len(parts) > 1 else None
    return a, b


def load_beats(sb):
    """Return (beats_normalized, fmt) where fmt in {'object','string','mixed','none'}."""
    raw = sb.get("beats") or []
    if not raw:
        return [], "none"
    kinds = {"object" if isinstance(b, dict) else "string" for b in raw}
    fmt = "object" if kinds == {"object"} else "string" if kinds == {"string"} else "mixed"
    out = []
    for i, b in enumerate(raw):
        if isinstance(b, dict):
            a, e = _parse_t(b.get("t"))
            out.append({"i": i, "t0": a, "t1": e, "vo": b.get("vo", ""), "shows": b.get("shows", b.get("new", "")),
                        "sfx": b.get("sfx", ""), "means": b.get("means", ""), "obj": True})
        else:
            out.append({"i": i, "t0": None, "t1": None, "vo": "", "shows": str(b), "sfx": "", "means": "", "obj": False})
    return out, fmt


def analyze(dirp):
    d = Path(dirp)
    sb = json.loads((d / "storyboard.json").read_text())
    beats, fmt = load_beats(sb)
    bc = CFG["beats"]; cov = CFG["coverage"]; sc = CFG["sfx"]
    R = {"beat_format": fmt, "n_beats": len(beats), "problems": [], "warnings": [], "metrics": {}}

    # ---- beat count ----
    if len(beats) < bc["min"]:
        R["problems"].append(f"beats_min: {len(beats)} beats < {bc['min']} required story-advancing beats")

    # ---- timing / never-rest gap (only computable when beats declare t) ----
    timed = [b for b in beats if b["t0"] is not None]
    R["metrics"]["timed_beats"] = len(timed)
    if len(timed) >= 2:
        starts = sorted(b["t0"] for b in timed)
        gaps = [round(starts[i + 1] - starts[i], 2) for i in range(len(starts) - 1)]
        med = sorted(gaps)[len(gaps) // 2]
        over = [g for g in gaps if g > bc["max_gap_s"]]
        R["metrics"]["start_to_start_gaps"] = gaps
        R["metrics"]["median_gap_s"] = med
        R["metrics"]["max_gap_s"] = max(gaps)
        if over:
            R["problems"].append(f"max_gap: {len(over)} beat gap(s) exceed the {bc['max_gap_s']}s never-rest "
                                 f"ceiling (worst {max(gaps)}s), schedule a change in that window")
        lo, hi = bc["target_gap_s"]
        if not (lo <= med <= hi):
            R["warnings"].append(f"median_gap_in_target: median beat gap {med}s is outside the {lo} to {hi}s "
                                 f"sweet spot")
        if starts[0] > cov["head_start_s"]:
            R["warnings"].append(f"head_start: first beat at {starts[0]}s (> {cov['head_start_s']}s); open on the stake sooner")
    elif fmt != "object":
        R["problems"].append(f"beats are the OLD prose format ({fmt}); upgrade to timed objects "
                             f"{{t,vo,shows,sfx,means}} so cadence + coverage are checkable (VISUAL_FLOW.md §3)")
    else:
        R["warnings"].append("beats declare no timestamps; cannot check the never-rest gap")

    # ---- required fields (object beats) ----
    if fmt in ("object", "mixed"):
        missing_sfx = [b["i"] for b in beats if b["obj"] and not str(b["sfx"]).strip()]
        missing_shows = [b["i"] for b in beats if b["obj"] and not str(b["shows"]).strip()]
        missing_vo = [b["i"] for b in beats if b["obj"] and not str(b["vo"]).strip()]
        if missing_shows:
            R["problems"].append(f"beats {missing_shows} have no `shows` (the new on-screen thing)")
        if missing_sfx:
            R["problems"].append(f"beats {missing_sfx} have no `sfx` (every beat names a motivated sound)")
        if missing_vo:
            R["warnings"].append(f"beats {missing_vo} have no `vo` (the phrase they illustrate), coverage unprovable")
        # sfx must be concrete, not "music"
        lazy = [b["i"] for b in beats if b["obj"] and str(b["sfx"]).strip().lower() in ("music", "sound", "sfx")]
        if lazy:
            R["problems"].append(f"beats {lazy} give a vague sfx ('music'/'sound'); name the actual event")

    # ---- VO coverage (say-it-show-it): no un-illustrated speech gap > max ----
    tim_p = d / "audio" / "timing60.json"
    speech_end = None
    if len(timed) >= 2 and tim_p.exists():
        try:
            speech_end = json.loads(tim_p.read_text() or "{}").get("speech_end")
        except (json.JSONDecodeError, ValueError):
            speech_end = None
        if speech_end:
            starts = sorted(b["t0"] for b in timed)
            covg = [round(starts[i + 1] - starts[i], 2) for i in range(len(starts) - 1)]
            tail = round(speech_end - starts[-1], 2)
            worst = max(covg + [tail]) if covg else tail
            R["metrics"]["speech_end_s"] = speech_end
            R["metrics"]["worst_uncovered_vo_gap_s"] = worst
            if worst > cov["max_uncovered_vo_gap_s"]:
                R["problems"].append(f"coverage: a {worst}s stretch of VO has no beat illustrating it "
                                     f"(> {cov['max_uncovered_vo_gap_s']}s), orphan narration")

    # ---- SFX events (sound-paired-to-picture), if the mix emitted them ----
    ev_p = d / sc["events_json"]
    if ev_p.exists() and (ev_p.read_text().strip()):
        ev = json.loads(ev_p.read_text())
        events = ev.get("events", ev) if isinstance(ev, dict) else ev
        R["metrics"]["sfx_events"] = len(events)
        if len(events) < sc["min_events_total"]:
            R["problems"].append(f"sfx_min_total: only {len(events)} sfx events (< {sc['min_events_total']}); "
                                 f"under-sonified")
        shots = sb.get("shots") or []
        if shots and events:
            per = []
            for s in shots:
                a, e = _parse_t(s.get("t"))
                if a is None:
                    continue
                e = e if e is not None else a + 10
                per.append(sum(1 for x in events if a <= _parse_t(x.get("t"))[0] < e))
            if per and min(per) < sc["min_events_per_shot"]:
                R["warnings"].append(f"sfx_per_shot: a shot has {min(per)} sfx events (< {sc['min_events_per_shot']})")
            R["metrics"]["sfx_per_shot"] = per
    else:
        R["metrics"]["sfx_events"] = None
        R["warnings"].append(f"no {sc['events_json']} (mix has not emitted its event list yet)")

    return R


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default="out/dispatch")
    ap.add_argument("--report", action="store_true", help="print metrics and never exit non-zero (back-test mode)")
    a = ap.parse_args()
    R = analyze(a.dir)
    print("=== VISUAL FLOW CHECK ===")
    print(f"beats: {R['n_beats']} ({R['beat_format']} format)   metrics: {json.dumps(R['metrics'])}")
    for p in R["problems"]:
        print(f"  [FAIL] {p}")
    for w in R["warnings"]:
        print(f"  [warn] {w}")
    ok = not R["problems"]
    print("RESULT:", "PASS ✓" if ok else "FAIL ✗")
    if a.report:
        sys.exit(0)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
