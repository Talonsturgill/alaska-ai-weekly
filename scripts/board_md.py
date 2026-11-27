#!/usr/bin/env python3
"""Render out/dispatch/storyboard.md FROM storyboard.json, stamped with the JSON's hash.

WHY THIS EXISTS (machine pass 2026-11-27; queue: board-md-stale, repeat 1). storyboard.md is the
prose the Gate 0 critics read beside the JSON, and no committed script wrote it: each run rendered
it by hand. On 11-27 it was regenerated from an earlier JSON and three critics reviewed the stale
prose in round 2, which is a paid critic round spent on a board that no longer existed.

So the prose is now a pure function of the JSON, and carries the JSON's sha256 on its second line.
`write` renders it (the board script calls it after every gen and conform), `--check` exits 1 when
the stamp is missing or names another JSON, and storyboard_check (Gate 0A) fails a stale stamp, so
a critic can never be handed prose for a board that has since moved.

    python3 scripts/board_md.py               # write out/dispatch/storyboard.md from storyboard.json
    python3 scripts/board_md.py --check       # exit 1 when storyboard.md is stale or unstamped
    python3 scripts/board_md.py --self-test
"""
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out" / "dispatch"
STAMP = re.compile(r"<!-- rendered by scripts/board_md\.py from storyboard\.json sha256:([0-9a-f]{16}) -->")
# Boards from this run date on must carry a stamp; earlier runs wrote storyboard.md by hand.
FIRST_DATE = "2026-11-28"


def json_hash(sb_path):
    return hashlib.sha256(Path(sb_path).read_bytes()).hexdigest()[:16]


def _txt(v):
    return v if isinstance(v, str) else json.dumps(v, ensure_ascii=False) if v is not None else ""


def _t(v):
    try:
        return f"{float(v):g}s"
    except (TypeError, ValueError):
        return str(v)


def render(sb, digest):
    """The prose board: header, every shot with its beats in time order, loops and throughline."""
    out = [f"# {sb.get('title', '(untitled)')} (Dispatch {sb.get('run_date', '?')})",
           f"<!-- rendered by scripts/board_md.py from storyboard.json sha256:{digest} -->", ""]
    ang = sb.get("angle")
    ang = ang.get("thesis") if isinstance(ang, dict) else ang
    for label, v in (("Concept", sb.get("concept")), ("Angle", ang), ("Palette", sb.get("palette"))):
        if v:
            out += [f"{label}. {_txt(v)}", ""]
    beats = sorted(sb.get("beats") or [], key=lambda b: (float(b.get("at_s") or 0.0), b.get("id") or 0))
    out.append("## Shots")
    out.append("")
    for s in sb.get("shots") or []:
        head = ", ".join(x for x in (s.get("framing"), s.get("height"), s.get("camera")) if x)
        out.append(f"- S{s.get('id')} {s.get('t', _t(s.get('start_s')))} **{s.get('title', '')}** ({head}). "
                   f"{_txt(s.get('means'))}".rstrip())
        if s.get("ambient"):
            out.append(f"  - ambient: {s['ambient']}")
        for b in (b for b in beats if b.get("shot") == s.get("id")):
            d = b.get("draw") or {}
            line = f"  - b{b.get('id')} {_t(b.get('at_s'))} [{b.get('sfx', '')}] {d.get('subject', '')} {d.get('action', '')}".rstrip()
            if d.get("annotation"):
                line += f". Plate: {d['annotation']}"
            reaction = (b.get("choreo") or {}).get("reaction")
            if reaction:
                line += f". Reaction: {reaction}"
            out.append(line)
    out += ["", "## Loops, reveals and throughline", ""]
    for i, k in enumerate(("open_loop", "open_loop_2"), 1):
        lp = sb.get(k)
        if isinstance(lp, dict) and lp.get("what"):
            out.append(f"- Loop {i}: {lp['what']}")
    for r in sb.get("reveals") or []:
        if isinstance(r, dict):
            out.append(f"- Reveal {_t(r.get('t'))} {r.get('type', '')}: {r.get('what', '')}")
    th = sb.get("throughline")
    if isinstance(th, dict) and th.get("object"):
        states = "; ".join(f"{_t(x.get('at_s'))} {x.get('state', '')}" for x in th.get("states") or [])
        out.append(f"- Throughline: {th['object']}: {states}")
    aa = sb.get("audio_arc") or {}
    if aa.get("ambience") or aa.get("ambience_stem"):
        out.append(f"- Ambience: {_txt(aa.get('ambience') or '')} {_txt(aa.get('ambience_stem') or '')}".rstrip())
    return "\n".join(out) + "\n"


def write(sb_path=OUT / "storyboard.json", md_path=None):
    sb_path = Path(sb_path)
    md_path = Path(md_path) if md_path else sb_path.with_name("storyboard.md")
    md_path.write_text(render(json.loads(sb_path.read_text()), json_hash(sb_path)))
    return md_path


def stale(sb_path=OUT / "storyboard.json", md_path=None):
    """None when storyboard.md matches the JSON, else the reason it can't be handed to a critic."""
    sb_path = Path(sb_path)
    md_path = Path(md_path) if md_path else sb_path.with_name("storyboard.md")
    if not md_path.exists():
        return f"{md_path.name} is missing; run python3 scripts/board_md.py"
    m = STAMP.search(md_path.read_text()[:600])
    if not m:
        return (f"{md_path.name} has no board_md stamp, so nothing proves it was rendered from this "
                f"storyboard.json; run python3 scripts/board_md.py")
    if m.group(1) != json_hash(sb_path):
        return (f"{md_path.name} was rendered from another storyboard.json (stamp {m.group(1)}, board "
                f"{json_hash(sb_path)}), so a critic would read stale prose; run python3 scripts/board_md.py")
    return None


def _self_test():
    import tempfile
    sb = {"title": "T", "run_date": "2026-11-28", "concept": "c", "palette": "p",
          "angle": {"thesis": "a"}, "shots": [{"id": 1, "t": "0.000-4.000", "title": "One",
                                                "framing": "wide", "means": "m", "ambient": "wind"}],
          "beats": [{"id": 2, "shot": 1, "at_s": 2.0, "sfx": "tap", "draw": {"subject": "B", "action": "taps"}},
                    {"id": 1, "shot": 1, "at_s": 0.0, "sfx": "crack",
                     "draw": {"subject": "A", "action": "falls", "annotation": "PLATE"},
                     "choreo": {"reaction": "r"}}],
          "throughline": {"object": "seal", "states": [{"at_s": 0, "state": "S0"}]},
          "audio_arc": {"ambience": ["wind", "storm"]}}
    bad = []
    with tempfile.TemporaryDirectory() as d:
        p = Path(d) / "storyboard.json"
        p.write_text(json.dumps(sb))
        if "missing" not in (stale(p) or ""):
            bad.append("a missing storyboard.md was not reported")
        md = write(p).read_text()
        if stale(p) is not None:
            bad.append(f"a freshly written storyboard.md reads stale: {stale(p)}")
        if md.index("b1 0s [crack] A falls. Plate: PLATE. Reaction: r") > md.index("b2 2s [tap] B taps"):
            bad.append("beats are not in time order or lose their plate and reaction")
        for frag in ("Angle. a", "**One** (wide)", "ambient: wind", "Throughline: seal: 0s S0", "storm"):
            if frag not in md:
                bad.append(f"rendered board lacks {frag!r}")
        sb["beats"][0]["draw"]["action"] = "taps twice"
        p.write_text(json.dumps(sb))
        if "another storyboard.json" not in (stale(p) or ""):
            bad.append("a board edited after the render did not read stale")
        (Path(d) / "storyboard.md").write_text("# hand written\n")
        if "no board_md stamp" not in (stale(p) or ""):
            bad.append("an unstamped storyboard.md was not reported")
    for b in bad:
        print("  FAIL " + b)
    print("board_md self-test: " + ("FAIL" if bad else "PASS"))
    return 1 if bad else 0


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if "--self-test" in argv:
        return _self_test()
    sb = Path(next((a for a in argv if not a.startswith("--")), OUT / "storyboard.json"))
    if "--check" in argv:
        why = stale(sb)
        print(f"FAIL [board_md] {why}" if why else f"PASS [board_md] storyboard.md matches {sb.name}")
        return 1 if why else 0
    print(f"board_md: wrote {write(sb)} from {sb.name} sha256:{json_hash(sb)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
