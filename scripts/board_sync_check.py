#!/usr/bin/env python3
"""Diff the board's shot-level fields against its beats, before a critic spends a round on it.

WHY THIS EXISTS (machine pass 2026-10-25; queue: critic-loops-never-reach-ship, repeat 1).
On 10-24 and again on 10-25 the Gate 0B, 0C and 0D critics returned revise for two to three
rounds, and most of what they named was not craft. It was bookkeeping a script can see: a
shot whose `means` still described beats that had been rewritten, an `ambient` line no beat
carried any more, and on-screen strings quoted one way in a beat's `shows` and another way
in the `draw.annotation` the engine actually paints (OCT 26 against OCT 26TH, TO THE STATE
against TO STATE). Each of those costs a critic round at full model price and buys nothing.

What it checks, per shot (a shot is the set of beats whose `shot` equals its id):

  FAIL (the first five have zero hits on every board from 2026-10-10 to 2026-10-25; the rain
  row fails 10-16 and 10-25, the two boards whose ambient named rain with no rain in the mix):
    - a beat names a shot id the shots table does not have
    - a shot has no beats
    - a shot's vo_line is not the vo_line of its first beat
    - a shot's ambient is not the choreo.ambient any of its beats carries
    - a shot's first beat starts before the shot does (by more than 0.25 s)
    - the shots' ambient lines name rain in a quarter of the shots but audio_arc asks the mix for
      no rain (audio_arc.ambience: ["rain"] or an ambience_stem); 10-25 capped Sound for it

  WARN (text, printed as advisories so the board's author fixes them before the critic):
    - text a beat's `shows` says is painted (after reads, marked, labelled, types, stamped,
      says) that no annotation in the same shot carries, punctuation ignored
    - an upper-case string in the shot's `means` or `ambient` that no beat in the shot carries
    - a shot `means` most of whose content words appear in none of its beats (stale summary)

Usage:
  python3 scripts/board_sync_check.py [out/dispatch/storyboard.json]   # exit 1 on a FAIL
  python3 scripts/board_sync_check.py --self-test
storyboard_check.py imports analyze() and folds the FAILs into its own (Gate 0A).
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SB = ROOT / "out" / "dispatch" / "storyboard.json"

STOP = {"the", "a", "an", "of", "in", "and", "for", "to", "on", "with", "by", "ai", "its",
        "it", "is", "at", "as", "from", "into", "onto", "over", "under", "then", "that",
        "this", "while", "who", "what", "one", "two", "all", "every", "but", "not", "are",
        "camera", "shot", "frame", "beat", "beats", "where", "which", "their", "they"}

# Verbs a board uses to say "this string is painted on screen".
QUOTE = re.compile(r"\b(?:reads?|reading|says|saying|marked|labell?ed|types?|typing|printed|"
                   r"stamped|spells?)\s+((?:[^a-z]|\b[a-z]\b(?=[^a-z]))+)")
CAPS = re.compile(r"\b[A-Z0-9][A-Z0-9'.%$]*(?:[ ,\-·]+[A-Z0-9][A-Z0-9'.%$]*)+\b")


def _norm_caps(s):
    return re.sub(r"[^A-Z0-9]+", " ", str(s or "").upper()).strip()


def _norm(s):
    return re.sub(r"\s+", " ", str(s or "").strip().lower())


def _stem(w):
    return re.sub(r"(ies|es|s|ing|ed)$", "", w)


def _words(s):
    return {_stem(w) for w in re.findall(r"[a-z][a-z0-9']+", str(s or "").lower())
            if w not in STOP and len(w) > 2}


def _num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _quoted(shows):
    """The painted strings a beat's `shows` names, trimmed of a trailing stray article."""
    out = []
    for c in QUOTE.findall(str(shows or "")):
        c = re.sub(r"(?:[\s,]+[a-z])+\s*$", "", c).strip(" ,.;:")
        if len(_norm_caps(c)) >= 3 and re.search(r"[A-Z]{2}", c):
            out.append(c)
    return out


RAIN_WORDS = ("rain", "drizzle", "downpour", "raindrop", "rainy")


def rain_shots(board):
    """How many shots' ambient lines name rain, and whether that makes rain a world of the film
    (a quarter of the shots, at least two). The mix cannot read shots (its receipt does not hash
    prose), so storyboard_check uses this to require audio_arc.ambience: ["rain"]."""
    shots = board.get("shots") or []
    n = sum(1 for s in shots if any(w in str(s.get("ambient", "")).lower() for w in RAIN_WORDS))
    return n, bool(shots) and n >= max(2, len(shots) / 4.0)


def analyze(sb):
    shots = sb.get("shots") or []
    beats = sb.get("beats") or []
    problems, warnings = [], []
    if not shots or not beats:
        return {"problems": problems, "warnings": warnings, "shots": len(shots)}
    ids = {s.get("id") for s in shots}
    for b in beats:
        if b.get("shot") not in ids:
            problems.append(f"beat {b.get('id')} names shot {b.get('shot')}, which the shots table "
                            f"does not have: regenerate shots[] from the beats")
    for s in shots:
        sid = s.get("id")
        bs = sorted([b for b in beats if b.get("shot") == sid],
                    key=lambda b: (_num(b.get("at_s")) or 0.0, b.get("id") or 0))
        if not bs:
            problems.append(f"S{sid} has no beats: delete the shot or give it its beats")
            continue
        if "vo_line" in s and bs[0].get("vo_line") is not None and s.get("vo_line") != bs[0].get("vo_line"):
            problems.append(f"S{sid} vo_line {s.get('vo_line')} but its first beat {bs[0].get('id')} "
                            f"is on line {bs[0].get('vo_line')}: the shot row is stale")
        st, b0 = _num(s.get("start_s")), _num(bs[0].get("at_s"))
        if st is not None and b0 is not None and b0 < st - 0.25:
            problems.append(f"S{sid} starts at {st:.2f}s but its beat {bs[0].get('id')} is at "
                            f"{b0:.2f}s, before the shot: re-run the board's conform step")
        ambs = {_norm((b.get("choreo") or {}).get("ambient")) for b in bs} - {""}
        if s.get("ambient") and ambs and _norm(s.get("ambient")) not in ambs:
            problems.append(f"S{sid} ambient \"{str(s.get('ambient'))[:70]}\" is carried by none of its "
                            f"beats' choreo.ambient: set both from one table")

        anns = " | ".join(_norm_caps((b.get("draw") or {}).get("annotation")) for b in bs)
        beat_text = " ".join(json.dumps({k: b.get(k) for k in ("shows", "draw", "choreo", "vo", "means")})
                             for b in bs)
        beat_caps = _norm_caps(beat_text)
        for b in bs:
            for q in _quoted(b.get("shows")):
                if _norm_caps(q) not in anns:
                    warnings.append(f"S{sid} beat {b.get('id')} shows reads \"{q}\" but no annotation in the "
                                    f"shot paints that (beat's annotation: "
                                    f"\"{(b.get('draw') or {}).get('annotation', '')}\")")
        for fld in ("means", "ambient"):
            for c in CAPS.findall(str(s.get(fld) or "")):
                if len(_norm_caps(c)) >= 4 and re.search(r"[A-Z]{2}", c) and _norm_caps(c) not in beat_caps:
                    warnings.append(f"S{sid} {fld} names \"{c}\", which none of its beats carries")
        mw = _words(s.get("means"))
        if len(mw) >= 6:
            bw = _words(beat_text)
            miss = sorted(w for w in mw if w not in bw)
            if len(miss) > len(mw) / 2:
                warnings.append(f"S{sid} means shares under half its words with its beats "
                                f"({len(miss)}/{len(mw)} absent: {', '.join(miss[:6])}): rewrite it from the beats")
    n_rain, rain_world = rain_shots(sb)
    want = (sb.get("audio_arc") or {}).get("ambience") or []
    want = [want] if isinstance(want, str) else list(want)
    if rain_world and "rain" not in want and not (sb.get("audio_arc") or {}).get("ambience_stem"):
        problems.append(f"{n_rain} of {len(shots)} shots' ambient lines name rain, but audio_arc has no "
                        f"ambience: [\"rain\"] and no ambience_stem, so the mix plays no rain under it "
                        f"(10-25: Sound capped 7.0 to 7.3 for exactly this). Add audio_arc.ambience")
    return {"problems": problems, "warnings": warnings, "shots": len(shots)}


def _self_test():
    good = {"shots": [{"id": 1, "vo_line": 0, "start_s": 0.0, "ambient": "rain runs",
                       "means": "the Plate slams onto the Cubby door in the rain"}],
            "beats": [{"id": 1, "shot": 1, "vo_line": 0, "at_s": 0.0,
                       "shows": "the Plate slams onto the Cubby door, a plate reads DATA CENTER, a gull",
                       "draw": {"subject": "the Plate", "annotation": "DATA CENTER"},
                       "choreo": {"ambient": "rain runs"}}]}
    r = analyze(good)
    assert not r["problems"] and not r["warnings"], r
    bad = json.loads(json.dumps(good))
    bad["shots"][0]["ambient"] = "snow falls"
    bad["shots"][0]["vo_line"] = 2
    bad["beats"][0]["draw"]["annotation"] = "DATA CENTRE"
    bad["beats"].append({"id": 2, "shot": 9, "vo_line": 0, "at_s": 1.0})
    bad["shots"].append({"id": 3, "vo_line": 4, "start_s": 9.0})
    bad["shots"][0]["means"] = "a harbour crane lifts seven glowing reactor drums past CITY HALL tonight"
    r = analyze(bad)
    text = " ".join(r["problems"])
    for frag in ("snow falls", "vo_line 2", "shot 9", "S3 has no beats"):
        assert frag in text, (frag, r["problems"])
    w = " ".join(r["warnings"])
    for frag in ("DATA CENTER", "CITY HALL", "under half"):
        assert frag in w, (frag, r["warnings"])
    assert _quoted("a sign marked SITKA ASSEMBLY, a gull") == ["SITKA ASSEMBLY"]
    wet = json.loads(json.dumps(good))
    wet["shots"] = [dict(good["shots"][0], id=i) for i in (1, 2)]
    wet["beats"] = [dict(good["beats"][0], id=i, shot=i) for i in (1, 2)]
    assert any("name rain" in p for p in analyze(wet)["problems"]), analyze(wet)
    wet["audio_arc"] = {"ambience": ["rain"]}
    assert not analyze(wet)["problems"], analyze(wet)
    print("board_sync_check self-test: PASS")
    return 0


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if "--self-test" in argv:
        return _self_test()
    path = Path(argv[0]) if argv else DEFAULT_SB
    sb = json.loads(path.read_text())
    r = analyze(sb)
    for w in r["warnings"]:
        print(f"  [board-sync-advisory] {w}")
    for p in r["problems"]:
        print(f"FAIL [board_sync_check] {p}")
    if r["problems"]:
        return 1
    print(f"PASS [board_sync_check] {r['shots']} shots agree with their beats "
          f"({len(r['warnings'])} text advisories)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
