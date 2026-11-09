#!/usr/bin/env python3
"""Gate 0A: the board must SHOW Alaska, not only say it. Runs inside storyboard_check.

WHY THIS EXISTS (machine pass 2026-11-09; queue: Alaska cue, owner proposal "a Gate 0D check that
every film shows one Alaska cue"). Alaska authenticity was the lowest axis on two judge cards in the
14 days to 11-09, both on the two films whose boards draw the least of Alaska: on 11-09 every seat
wrote "no Alaska cue in the visuals" / "generic courtroom" (6.5 to 7.0) although a plate read
ALASKA COURT SYSTEM, and on 11-06 a single map-pin beat carried the whole film. A plate string is
copy, not picture. Counted over the last 25 archived boards, with plate strings and all-caps copy
removed, the beats' `shows` and `draw` fields name an Alaska PICTURE (a place, a landscape, a
species, a map of the state, a bush plane) in 0 of 13 shots on 11-09, 1 of 12 on 11-06, and 4 of 13
on 10-31, which the panel scored 7.5 on that axis.

So this counts the SHOTS whose beats draw an Alaska picture:
  0 shots   FAIL. The owner's line: every film shows one Alaska cue.
  1 shot    WARN. 11-06's single beat did not lift the axis; put the cue where the film lives
            (a window onto the Chugach, a ferry schedule on the wall, the state on a map).
The cue must be a thing DRAWN. Words a plate, tag, sign or stamp reads are stripped first, and so
is any all-caps run, which on these boards is always on-screen copy. The cultural rules still bind
what is drawn: nothing here asks for Native imagery, and the vocabulary leaves it out on purpose.

    python3 scripts/alaska_cue_check.py [storyboard.json]     # exit 0 pass, 1 fail
    python3 scripts/alaska_cue_check.py --self-test
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SB = ROOT / "out" / "dispatch" / "storyboard.json"

PLACES = (r"alaska\w*|anchorage|juneau|fairbanks|denali|kenai|kodiak|bethel|nome|sitka|ketchikan|"
          r"mat-su|matanuska|valdez|homer|seward|yukon|aleutian\w*|kuskokwim|bristol bay|prudhoe|"
          r"bering|tongass|chugach|cook inlet|wrangell|haines|utqiagvik|kotzebue|dillingham|"
          r"eielson|north slope|inside passage|turnagain|knik|susitna|copper river|tanana")
PICTURES = (r"tundra|spruce|birch|moose|caribou|salmon|halibut|ptarmigan|fireweed|glacier\w*|"
            r"permafrost|northern lights|aurora|bush plane|float ?plane|marine highway|"
            r"state ferry|pipeline|dipper flag|big dipper|state flag|state seal|"
            r"fish wheel|setnet|gillnet\w*|smokehouse|snowmachine|dog ?sled|iditarod")
CUE = re.compile(r"\b(" + PLACES + "|" + PICTURES + r")\b", re.I)
# "a plate reads ALASKA COURT SYSTEM", "a tag labelled NOT AN ALASKA CLAIM": copy, not picture
COPY = re.compile(r"\b(plate|tag|label|sign|card|stamp|banner|header|chip|strap|caption|title)s?\s+"
                  r"(reads?|reading|says?|labell?ed|stamped|printed)\s+[A-Z0-9][A-Z0-9 ·,.'$%&/:?!-]*")
CAPS = re.compile(r"\b[A-Z][A-Z0-9·.'-]{2,}(?:\s+[A-Z0-9·.'&-]{2,})*")


def drawn_text(beat):
    draw = dict(beat.get("draw") or {})
    draw.pop("annotation", None)          # the annotation is the plate string itself
    txt = " ".join([str(beat.get("shows") or "")] + [str(v) for v in draw.values()])
    return CAPS.sub(" ", COPY.sub(" ", txt))


def analyze(sb):
    """{'shots': {shot: [cues]}, 'n_shots': int, 'problems': [...], 'warnings': [...]}"""
    beats = sb.get("beats") or []
    by_shot = {}
    for b in beats:
        hits = sorted({m.group(0).lower() for m in CUE.finditer(drawn_text(b))})
        if hits:
            by_shot.setdefault(b.get("shot"), set()).update(hits)
    n_shots = len({b.get("shot") for b in beats}) or len(sb.get("shots") or [])
    problems, warnings = [], []
    if not by_shot:
        problems.append(f"no shot of {n_shots} DRAWS Alaska. A plate that reads ALASKA is copy, not "
                        "picture (11-09: 'generic courtroom, no Alaska cue', every seat). Put one Alaska "
                        "thing in a beat's shows: a window onto a named range, the state on a map, a bush "
                        "plane, spruce, a ferry schedule, the place the story happens")
    elif len(by_shot) == 1:
        (shot, cues), = by_shot.items()
        warnings.append(f"only shot {shot} draws Alaska ({', '.join(sorted(cues))}). 11-06 carried the "
                        "axis on one map-pin beat and scored 7.0; give the set itself an Alaska cue "
                        "that stays on screen across shots")
    return {"shots": {k: sorted(v) for k, v in by_shot.items()}, "n_shots": n_shots,
            "problems": problems, "warnings": warnings}


def _self_test():
    def board(*shows):
        return {"beats": [{"id": i + 1, "shot": i + 1, "shows": s, "draw": {"annotation": "X"}}
                          for i, s in enumerate(shows)]}
    cases = [
        ("plate-only Alaska fails", board("a binder slaps the bench, a plate reads AI POLICY · ALASKA COURT SYSTEM",
                                          "a door creaks open"), 1, 0),
        ("caps copy fails", board("a chalk map plate labelled CONTEXT, NOT AN ALASKA CLAIM"), 1, 0),
        ("one drawn cue warns", board("a map pin drops onto Fairbanks on a top-down Alaska map",
                                      "a typewriter clacks"), 0, 1),
        ("two drawn cues pass", board("a bush plane banks over spruce", "a window onto the Chugach glows"), 0, 0),
    ]
    bad = []
    for name, sb, want_p, want_w in cases:
        r = analyze(sb)
        if len(r["problems"]) != want_p or len(r["warnings"]) != want_w:
            bad.append(f"{name}: got {len(r['problems'])} problem(s), {len(r['warnings'])} warning(s)")
    print("alaska_cue_check self-test:", "FAIL " + "; ".join(bad) if bad else f"PASS ({len(cases)} cases)")
    return 1 if bad else 0


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if argv[:1] == ["--self-test"]:
        return _self_test()
    path = Path(argv[0]) if argv else DEFAULT_SB
    r = analyze(json.loads(path.read_text()))
    for w in r["warnings"]:
        print(f"  WARN [alaska_cue] {w}")
    for p in r["problems"]:
        print(f"FAIL [alaska_cue] {p}")
    if not r["problems"]:
        print(f"PASS [alaska_cue] {len(r['shots'])} of {r['n_shots']} shots draw Alaska: "
              + "; ".join(f"S{k} {', '.join(v)}" for k, v in sorted(r["shots"].items(), key=lambda kv: str(kv[0]))))
    return 1 if r["problems"] else 0


if __name__ == "__main__":
    sys.exit(main())
