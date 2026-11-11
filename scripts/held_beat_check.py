#!/usr/bin/env python3
"""Name the beats whose evidence strip barely moves, before a judge does. ADVISORY.

WHY THIS EXISTS (machine pass 2026-10-09; queue: ship-hold-under-2pct 10-08,
held-beats-under-2pct 10-09, repeat 1). On 10-08 all three judges listed the same boats,
chair, phone, pencil and closing lens at 1.3 to 2 percent change; on 10-09 the pen, barge,
news card and bench at 0.6 to 1.3 percent, again from all three. build_evidence.py had
already measured every one of them into out/evidence/motion.json, and nothing read it until
the panel did. A held beat under 2 percent reads as a still with a caption
(DISPATCH_STANDARD section 11), and the fix is one continuous idle cycle on that beat.

This prints those beats, by strip name and board beat, so make_cut's summary carries them as a
NOTE line before a panel is spent. It never fails a cut: exit 0 when every strip is at or
above the floor, exit 2 (preflight NOTE) when some are under it or the data is missing.
It changes no threshold of any other gate.

CAMERA SOLVED OUT (machine pass 2026-10-25; queue: held-beats-under-six-percent, repeat 2). The
10-24 and 10-25 panels capped Motion at 6.5 to 7.2 on both films for held beats (island, cord,
intakes, podium, testimony sheet) at 2.0 to 5.9 percent, and wrote that the camera push and the
rain do not count. motion.json's changed_pct is frame 1 against frame 8 of the strip with the
camera IN it, so a push repaints the frame and a beat whose objects are statues still reads 5 or 7
percent. So every strip is now measured a second time on the delivered master: the engine's own
camera (uniform scale about the centre plus translation) is solved with motion_check.register and
warped out, a 3x3 median removes thin rain streaks and grain, the caption band counts as still, and
what is left is the share of the frame that moved more than 12/255. A strip under --held-floor
(6 percent, the panel's own line) is printed as HELD with both numbers side by side. ADVISORY in
preflight like the 2 percent floor above, until a shipped film clears it; `--strict` exits 1, and
the named beats are the work order: an object-level secondary motion on the held thing (HeldProp
from lib/heldidle.tsx, a drip, a sway, a flutter), never a bigger camera move.

BEFORE THE RENDER (machine pass 2026-10-26; queue: held beats under 6 percent, repeat 3: the
judges named the class on 10-22, 10-24, 10-25 and 10-26, twelve strips on 10-26: map, alert lamp,
chamber doors, LATER tab, sponsor tag). The measure above runs on the delivered master, so the work
order arrived after a 20 minute render and the run shipped it rather than spend another. Every input
except the pixels is known before the render: `--source` plans the same strip windows build_evidence
will cut (conformed_moves on the board and the VO clock, slid off shot boundaries the same way),
renders only frame 1 and frame 8 of each window in Remotion's Chrome (scripts/held_beat_probe.cjs,
the label_footprint bundle path, about two frames a second), and applies the same camera solve.
make_cut runs it as an advisory source step, so the summary names each HELD beat, its shot and what
the board says it shows before a frame of the full render is spent. The remedy it prints is a
TRAVELLING element on the held thing (HeldTravel in lib/heldidle.tsx: a light sweep, a runner along
a cord or rail, a drifting shadow), because a HeldProp rock alone moves edges, not area.

Usage: python3 scripts/held_beat_check.py [--motion out/evidence/motion.json] [--floor 2.0]
                                          [--held-floor 6.0] [--no-solve] [--strict]
       python3 scripts/held_beat_check.py --source [EPISODE.tsx] [--props ...] [--strict]
"""
import argparse
import json
import os
import re
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
MOTION = os.path.join(REPO, "out", "evidence", "motion.json")
BOARD = os.path.join(REPO, "out", "dispatch", "storyboard.json")
VIDEO = os.path.join(REPO, "out", "dispatch", "dispatch_master.mp4")
FLOOR = 2.0
HELD_FLOOR = 6.0        # the panel's line, 10-24 and 10-25: under 6 percent reads as held
CAPTION_TOP = 1310      # the most conservative caption top in the gates (plate_overlap_check)
MID_W, MID_H = 270, 480 # quarter resolution: a prop's drift survives, a 1 px rain streak does not


def solved_change(a_rgb, b_rgb):
    """Percent of the frame changing by more than 12/255 after the engine's camera is solved and
    warped out. The caption band counts as unchanged (burned words are not the beat) but stays in
    the denominator, so the figure is on the same whole-frame scale as motion.json's changed_pct."""
    import numpy as np
    from PIL import ImageFilter
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import motion_check as mc
    w_full, h_full = a_rgb.size
    small = [np.asarray(im.convert("L").resize((mc.RW, mc.RH)), dtype=np.float32) / 255.0
             for im in (a_rgb, b_rgb)]
    # Register on the picture above the captions only, so changing words cannot pull the solve.
    rcap = int(mc.RH * CAPTION_TOP / 1920.0)
    k, dx, dy, _ = mc.register(small[0][:rcap], small[1][:rcap])
    # register() scales about the centre of the array it was given; rebase dy to the full frame.
    dy_full = dy + (rcap - mc.RH) / 2.0 * (1 - k)
    mid = [np.asarray(im.convert("L").resize((MID_W, MID_H)).filter(ImageFilter.MedianFilter(3)),
                      dtype=np.float32) / 255.0 for im in (a_rgb, b_rgb)]
    warped = mc.warp(mid[1], k, dx * MID_W / mc.RW, dy_full * MID_H / mc.RH)
    moved = np.abs(mid[0] - warped) > 12 / 255.0
    moved[int(MID_H * CAPTION_TOP / 1920.0):, :] = False       # captions are not the beat
    bx, by = int(MID_W * 0.04), int(MID_H * 0.04)               # the warp clamps at the border
    moved[:by, :] = moved[MID_H - by:, :] = False
    moved[:, :bx] = moved[:, MID_W - bx:] = False
    return float(moved.mean() * 100.0), float(k)


def _grab(video, t):
    import subprocess
    import tempfile
    from PIL import Image
    fd, path = tempfile.mkstemp(suffix=".png")
    os.close(fd)
    try:
        r = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-ss", f"{t:.3f}", "-i",
                            video, "-frames:v", "1", "-y", path], capture_output=True)
        if r.returncode != 0 or not os.path.getsize(path):
            return None
        return Image.open(path).convert("RGB")
    finally:
        try:
            os.remove(path)
        except OSError:
            pass


def held_solved(strips, video, floor=HELD_FLOOR):
    """[(name, solved_pct, gross_pct)] for within-shot strips under `floor` once the camera is
    solved out, measured frame 1 against frame 8 of the same window build_evidence used."""
    out, measured = [], 0
    for name, s in strips.items():
        if s.get("within_shot") is False or not isinstance(s.get("window_start_s"), (int, float)):
            continue
        t0 = float(s["window_start_s"])
        a, b = _grab(video, t0), _grab(video, t0 + 7 / 30.0)
        if a is None or b is None:
            continue
        pct, _k = solved_change(a, b)
        pct = round(pct, 1)
        s["solved_pct"] = pct
        measured += 1
        if pct < floor:
            out.append((name, pct, s.get("changed_pct")))
    return sorted(out, key=lambda x: (x[1], x[0])), measured


REMEDY = ("give each held thing a TRAVELLING element, <HeldTravel> from lib/heldidle.tsx (a sweep "
          "across it, a runner along its cord or rail, a shadow drifting over it), at the lib's default "
          "strength and mode=\"shadow\" on a white or pale ground, where a light sweep moves nothing; "
          "not a camera move")


def plan_windows(out_dir=os.path.join(REPO, "out", "dispatch")):
    """[(name, beat_id, t0_s)] for every strip build_evidence will cut, from the board, the VO clock
    and the props alone, slid off shot boundaries exactly as build_evidence slides them. Beat-internal
    cuts (which build_evidence finds in the pixels) are caught later by the wholesale-change guard."""
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import build_evidence as be
    lines = json.load(open(os.path.join(out_dir, "vo_lines.json")))["lines"]
    start = {L["idx"]: L["start"] for L in lines}
    board = json.load(open(os.path.join(out_dir, "storyboard.json")))
    props = json.load(open(os.path.join(out_dir, "episode_props.json")))
    film_end = max(max(L["end"] for L in lines), props["total"] / 30.0)
    moves = be.conformed_moves(board, start, film_end)
    beat_of_name = {name: beat for name, beat, _ in be.MOVES}
    bounds = sorted({round(sc["from"] / 30.0, 3) for sc in props.get("scenes") or [] if sc.get("from")})
    win = 8 / 30.0
    out = []
    for name, line, off in moves:
        if line not in start:
            continue
        centre = start[line] + off
        t0 = max(0.0, centre - 0.13)
        cut = next((b for b in bounds if t0 < b < t0 + win), None)
        if cut is not None:
            t0 = cut + 1 / 30.0 if centre >= cut - 1e-6 else max(0.0, cut - win - 1 / 30.0)
        out.append((name, beat_of_name.get(name), t0))
    return out, props


def shot_at(props, t):
    f = t * 30.0
    for i, sc in enumerate(props.get("scenes") or []):
        if sc["from"] <= f < sc["from"] + sc["dur"]:
            return i + 1
    return None


def source_held(source, props_path, floor=HELD_FLOOR, out_dir=os.path.join(REPO, "out", "dispatch")):
    """Render frame 1 and frame 8 of every planned strip in Chrome and solve the camera out.
    Returns ([(name, beat_id, shot, t0, pct)] under floor, measured count, cut-straddling names)."""
    import subprocess
    import tempfile
    from PIL import Image
    windows, props = plan_windows(out_dir)
    pairs = [(name, beat, t0, int(round(t0 * 30)), int(round(t0 * 30)) + 7) for name, beat, t0 in windows]
    with tempfile.TemporaryDirectory(prefix="held-beat-") as tmp:
        opts = os.path.join(tmp, "o.json")
        with open(opts, "w") as fh:
            json.dump({"source": os.path.abspath(source), "props": os.path.abspath(props_path),
                       "frames": sorted({f for p in pairs for f in p[3:]})}, fh)
        frames_dir = os.path.join(tmp, "frames")
        r = subprocess.run(["node", os.path.join(REPO, "scripts", "held_beat_probe.cjs"), opts, frames_dir],
                           cwd=REPO, capture_output=True, text=True, timeout=1800)
        if r.returncode:
            raise RuntimeError("held_beat_probe failed:\n" + (r.stderr or r.stdout)[-3000:])
        low, measured, straddled = [], 0, []
        # The same Chrome frames also measure the TOP OF THE SQUARE (machine pass 2026-11-06), so
        # dead_space_check --plan can fail an empty top band before the full render is spent.
        import dead_space_check as dsc
        tops = []
        for name, beat, t0, f0, f1 in pairs:
            pa, pb = (os.path.join(frames_dir, f"f{f:05d}.png") for f in (f0, f1))
            if not (os.path.exists(pa) and os.path.exists(pb)):
                continue
            a, b = Image.open(pa).convert("RGB"), Image.open(pb).convert("RGB")
            tops.append({"frame": f0, "top": round(dsc.top_band_fraction(a), 4)})
            if _wholesale(a, b):
                straddled.append(name)      # a beat-internal cut: build_evidence slides off it
                continue
            pct, _k = solved_change(a, b)
            measured += 1
            if pct < floor:
                low.append((name, beat, shot_at(props, t0), t0, round(pct, 1)))
    with open(os.path.join(out_dir, "top_band_plan.json"), "w") as fh:
        json.dump({"source": os.path.relpath(os.path.abspath(source), REPO),
                   "measure": "dead_space_check.top_band_fraction on Chrome frame 1 of each strip",
                   "samples": tops}, fh, indent=1)
    return sorted(low, key=lambda x: (x[4], x[0])), measured, straddled


TREATMENTS = ("HeldTravel", "HeldProp")
# A HeldTravel under this group opacity, or any rig at 0 < gain < 1, is a TOKEN rig (machine pass
# 2026-11-11). The lib defaults are 0.38 for a sweep or runner and 0.30 for a shadow.
WORKING_STRENGTH = 0.3


def _rig_tags(body):
    """[(tag, attribute_text)] for every <HeldTravel ...> and <HeldProp ...> opening tag in `body`,
    reading attributes with balanced braces so an arrow function inside a prop cannot end the tag."""
    out = []
    for m in re.finditer(r"<(%s)\b" % "|".join(TREATMENTS), body):
        i, depth = m.end(), 0
        while i < len(body):
            c = body[i]
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
            elif c == ">" and depth == 0:
                break
            i += 1
        out.append((m.group(1), body[m.end():i]))
    return out


def _num(attrs, name):
    m = re.search(r"\b%s=\{\s*([0-9]*\.?[0-9]+)\s*\}" % name, attrs)
    return float(m.group(1)) if m else None


def rig_working(tag, attrs):
    """True when a rig is drawn at working strength, or switched off on purpose with gain={0}.

    WHY (machine pass 2026-11-11; queue: held-beats-under-six-percent, repeat 3 on 11-05, 11-08, 11-10
    and 11-11). The 11-06 gate asked for a rig in any shot with a held strip, and the films complied
    with a rig turned down to a token: all twelve HeldTravels on Ep1111 at strength 0.2, Ep1110's at
    0.08 to 0.16, Ep1108's HeldProps at gain 0.4 to 0.8. held_plan named 18 of 42 Ep1111 strips and the
    panel capped Motion at 6.5 to 7.2 on all three cuts. Restoring the lib default strength on a
    scratch copy of Ep1111 took held_plan from 18 to 12 strips, and turning the S6 whiteout sweep into
    a shadow took it to 10 (S6 2.9 and 3.6 cleared 6). A literal strength or gain is read; an
    expression is trusted, because the source cannot say what it evaluates to."""
    gain = _num(attrs, "gain")
    if gain is not None:
        if gain == 0:
            return True                 # an explicit held-breath beat: the stillness is the point
        if gain < 1:
            return False
    if tag == "HeldTravel":
        strength = _num(attrs, "strength")
        if strength is not None and strength < WORKING_STRENGTH:
            return False
    return True


def _has_working_rig(body, rigged_comps=()):
    if any(rig_working(t, a) for t, a in _rig_tags(body)):
        return True
    return any(re.search(r"<%s\b" % c, body) for c in rigged_comps)


def treated_shots(source):
    """{shot_number: bool} for each `const S<n>: React.FC<SceneProps>` in the episode: True when the
    shot draws a lib held-motion rig AT WORKING STRENGTH (rig_working), directly or through a
    component of the same file that does.

    WHY (machine pass 2026-11-06; queue: held-beats-under-six-percent, repeat 3 after 11-02 and
    11-06). held_plan named 18 of 48 strips on 11-06 before the render and the panel named 19 after
    it, and it has named the class on every film since 10-26, but it was a NOTE, and no film from
    10-24 to 11-06 drew a single HeldTravel or HeldProp. On a scratch copy of Ep1106 two shadow
    HeldTravels (one on the S6 quote sheet, one over the S7 faculty table) lifted the typewriter
    (3.4), the pencil marks (2.9) and the faculty (5.1) strips over 6 percent. So the gate does not
    demand a number, it demands the known remedy where the measure names a held beat: a held strip
    in a shot that carries no rig fails the source gates. `gain={0}` on a rig is an explicit, visible
    decision that the stillness is the point, and counts. A token rig (strength under 0.3, or gain
    between 0 and 1) does not count, since 2026-11-11 (see rig_working)."""
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from shot_map import scene_bodies
    src = open(source).read()
    comps = [(m.group(1), m.start()) for m in re.finditer(r"^const (\w+)\s*:\s*React\.FC", src, re.M)]
    rigged = set()
    for i, (name, a) in enumerate(comps):
        body = src[a:comps[i + 1][1] if i + 1 < len(comps) else len(src)]
        if not re.match(r"S\d+$", name) and _has_working_rig(body):
            rigged.add(name)
    out = {}
    for name, body in scene_bodies(source).items():
        out[int(name[1:])] = _has_working_rig(body, sorted(rigged))
    return out


def _wholesale(a, b):
    """build_evidence's own cut test: more than 22 percent of a 120 px wide copy moving 40/255."""
    from PIL import ImageChops
    sa = a.convert("L").resize((120, 213))
    sb = b.convert("L").resize((120, 213))
    h = ImageChops.difference(sa, sb).histogram()
    return 100.0 * sum(h[40:]) / (120 * 213) > 22.0


def held(strips, floor=FLOOR):
    """[(name, pct)] for strips measured within one shot under `floor` percent, stillest first."""
    out = []
    for name, s in strips.items():
        if s.get("within_shot") is False:
            continue          # a strip across a cut measures the cut, not the beat
        pct = s.get("changed_pct")
        if isinstance(pct, (int, float)) and pct < floor:
            out.append((name, float(pct)))
    return sorted(out, key=lambda x: (x[1], x[0]))


def beat_of(name):
    m = re.search(r"_(\d+)$", name)
    return int(m.group(1)) if m else None


def _self_test():
    """A pure camera push over a still picture must read near zero; the same push with a moving
    prop must read over the floor. Proves the solve removes the camera and keeps the object."""
    import numpy as np
    from PIL import Image, ImageDraw
    rng = np.random.default_rng(7)
    base = Image.fromarray((rng.random((60, 34, 3)) * 255).astype("uint8")).resize((1080, 1920), Image.BILINEAR)

    def push(im, k):
        w, h = im.size
        cw, ch = int(w / k), int(h / k)
        x0, y0 = (w - cw) // 2, (h - ch) // 2
        return im.crop((x0, y0, x0 + cw, y0 + ch)).resize((w, h), Image.BILINEAR)

    still, _ = solved_change(base, push(base, 1.012))
    moved_b = push(base, 1.012)
    d = ImageDraw.Draw(moved_b)
    d.rectangle((300, 500, 780, 1000), fill=(250, 40, 40))
    moving, _ = solved_change(base, moved_b)
    capb = base.copy()
    ImageDraw.Draw(capb).rectangle((0, 1400, 1080, 1700), fill=(255, 255, 255))
    caption_only, _ = solved_change(base, capb)
    # A 1.2 percent push (four times an 8-frame push on the 10-25 film) repaints 26 percent of
    # this texture before the solve; the 0.0025 solve grid leaves about 1.4 percent.
    assert still < 2.5, f"a pure camera push read {still:.2f}%"
    assert moving > HELD_FLOOR, f"a moving prop read {moving:.2f}%"
    assert caption_only < 0.5, f"a caption change read {caption_only:.2f}%"
    import tempfile
    ep = ("const Lamp: React.FC<{f: number}> = ({f}) => <g><HeldTravel f={f} x={0} y={0} w={9} h={9} /></g>;\n"
          "const Desk: React.FC<{f: number}> = ({f}) => <rect />;\n"
          "const S1: React.FC<SceneProps> = ({p}) => <g><HeldTravel f={p.f} x={1} y={1} w={2} h={2} /></g>;\n"
          "const S2: React.FC<SceneProps> = ({p}) => <g><Desk f={p.f} /></g>;\n"
          "const S3: React.FC<SceneProps> = ({p}) => <g><Lamp f={p.f} /></g>;\n"
          "const S4: React.FC<SceneProps> = ({p}) => <g><HeldProp f={p.f} gain={0}><Desk f={p.f} /></HeldProp></g>;\n"
          "const S5: React.FC<SceneProps> = ({p}) => <g><HeldTravel f={p.f} x={1} y={1} w={2} h={2} strength={0.2} rx={20} /></g>;\n"
          "const S6: React.FC<SceneProps> = ({p}) => <g><HeldProp f={p.f} px={1} py={1} w={2} h={2} gain={0.5}><Desk f={p.f} /></HeldProp></g>;\n"
          "const S7: React.FC<SceneProps> = ({p}) => <g><HeldTravel f={p.f} x={1} y={1} w={2} h={2} mode=\"shadow\" path={[0, 1].map((i) => [i, i])} strength={0.3} /></g>;\n"
          "const S8: React.FC<SceneProps> = ({p}) => <g><HeldProp f={p.f} px={1} py={1} w={2} h={2} gain={2.5}><Desk f={p.f} /></HeldProp></g>;\n")
    with tempfile.NamedTemporaryFile("w", suffix=".tsx", delete=False) as fh:
        fh.write(ep)
    try:
        rig = treated_shots(fh.name)
    finally:
        os.remove(fh.name)
    assert rig == {1: True, 2: False, 3: True, 4: True, 5: False, 6: False, 7: True, 8: True}, \
        f"treated_shots read {rig}"
    print(f"held_beat_check self-test: PASS (push only {still:.2f}%, push plus prop {moving:.2f}%, "
          f"caption only {caption_only:.2f}%)")
    return 0


def main(argv=None):
    args = argv if argv is not None else sys.argv[1:]
    if args[:1] == ["--self-test"]:
        return _self_test()
    if args[:1] == ["--source"]:
        return main_source(args[1:])
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--motion", default=MOTION)
    ap.add_argument("--board", default=BOARD)
    ap.add_argument("--floor", type=float, default=FLOOR)
    ap.add_argument("--video", default=VIDEO)
    ap.add_argument("--held-floor", type=float, default=HELD_FLOOR,
                    help="percent of picture moving with the camera solved out (panel line: 6)")
    ap.add_argument("--no-solve", action="store_true", help="skip the camera-solved pass")
    ap.add_argument("--strict", action="store_true",
                    help="exit 1 when a beat is under the held floor (default advisory, exit 2)")
    a = ap.parse_args(argv)
    try:
        strips = json.load(open(a.motion))["strips"]
    except (OSError, ValueError, KeyError) as exc:
        print(f"held beats: no readable motion.json ({exc}); run build_evidence.py first")
        return 2
    try:
        beats = {b["id"]: b for b in json.load(open(a.board))["beats"]}
    except (OSError, ValueError, KeyError):
        beats = {}
    low = held(strips, a.floor)
    solved, measured = [], 0
    if not a.no_solve and os.path.exists(a.video):
        solved, measured = held_solved(strips, a.video, a.held_floor)
        for name, pct, gross in solved:
            b = beats.get(beat_of(name))
            shows = f" | {b.get('shows', '')[:80]}" if b else ""
            print(f"  HELD {pct:4.1f}% solved ({gross}% with camera)  {name}{shows}")
        if measured:
            print(f"camera solved out: {len(solved)} of {measured} strips under {a.held_floor:g}%"
                  + (": " + ", ".join(f"{n} {p:.1f}" for n, p, _g in solved) if solved else ""))
    elif not a.no_solve:
        print(f"held beats: no master at {os.path.relpath(a.video, REPO)}, camera-solved pass skipped")
    if not low and not solved:
        print(f"held beats: all {len(strips)} strips change {a.floor:g} percent or more"
              + (f", and {a.held_floor:g} percent with the camera solved out" if measured else ""))
        return 0
    if not low:
        print(f"{len(solved)} held under {a.held_floor:g}% with the camera solved out: "
              + ", ".join(f"{n} {p:.1f}" for n, p, _g in solved)
              + f" ({REMEDY})")
        return 1 if a.strict else 2
    for name, pct in low:
        b = beats.get(beat_of(name))
        shows = f" | {b.get('shows', '')[:90]}" if b else ""
        print(f"  {pct:4.1f}%  {name}{shows}")
    # Names first: make_cut keeps the first 220 characters of a NOTE line.
    print(f"{len(low)} under {a.floor:g}%: " + ", ".join(f"{n} {p:.1f}" for n, p in low)
          + f" (of {len(strips)} strips; wrap each held prop in <HeldProp> from lib/heldidle.tsx)")
    return 1 if (a.strict and solved) else 2


def main_source(argv):
    ap = argparse.ArgumentParser(description="held beats, measured from the source before the render")
    ap.add_argument("targets", nargs="*")
    ap.add_argument("--props", default=os.path.join(REPO, "out", "dispatch", "episode_props.json"))
    ap.add_argument("--board", default=BOARD)
    ap.add_argument("--held-floor", type=float, default=HELD_FLOOR)
    ap.add_argument("--strict", action="store_true")
    ap.add_argument("--gate", action="store_true",
                    help="make_cut's source gate: exit 1 ONLY for a held strip in a shot with no rig, "
                         "0 otherwise (held but treated, or not measurable, prints and passes)")
    a = ap.parse_args(argv)
    targets = a.targets
    if not targets:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from caption_band_check import default_targets
        targets = default_targets()
    if not targets:
        print("held beats (source): no episode file found")
        return 2
    try:
        beats = {b["id"]: b for b in json.load(open(a.board))["beats"]}
    except (OSError, ValueError, KeyError):
        beats = {}
    worst = 0
    for t in targets:
        try:
            low, measured, straddled = source_held(t, a.props, a.held_floor)
        except (RuntimeError, ValueError, OSError, KeyError) as exc:
            print(f"held beats (source): could not measure {os.path.relpath(t, REPO)}: {exc}")
            worst = max(worst, 2)
            continue
        for name, beat, shot, t0, pct in low:
            b = beats.get(beat)
            shows = f" | {b.get('shows', '')[:80]}" if b else ""
            print(f"  HELD {pct:4.1f}% solved  S{shot} {t0:6.2f}s beat {beat}  {name}{shows}")
        if straddled:
            print(f"  (skipped {len(straddled)} window(s) on a beat-internal cut: {', '.join(straddled[:6])})")
        if not measured:
            print("held beats (source): measured NOTHING")
            worst = max(worst, 2)
            continue
        if not low:
            print(f"held beats (source): all {measured} planned strips move {a.held_floor:g} percent or "
                  "more with the camera solved out")
            continue
        try:
            rig = treated_shots(t)
        except (OSError, ValueError):
            rig = {}
        bare = sorted({shot for _n, _b, shot, _t, _p in low if shot is not None and rig.get(shot) is False})
        # Names first: make_cut keeps the first 200 characters of the last line.
        if bare:
            print(f"UNTREATED: {len(low)} of {measured} strips HELD under {a.held_floor:g}% before the render, "
                  f"and shot(s) {', '.join(f'S{s}' for s in bare)} carry no HeldTravel or HeldProp at working strength: "
                  + ", ".join(f"S{shot} {name} {pct:.1f}" for name, _b, shot, _t, pct in low if shot in bare)
                  + f" (a strength under {WORKING_STRENGTH:g} or a gain between 0 and 1 is a token and does not count; "
                  f"{REMEDY}; gain={{0}} on the rig if the stillness is the point)")
            worst = max(worst, 1)
            continue
        print(f"{len(low)} of {measured} strips HELD under {a.held_floor:g}% before the render: "
              + ", ".join(f"S{shot} {name} {pct:.1f}" for name, _b, shot, _t, pct in low)
              + f" ({REMEDY})")
        worst = max(worst, 1 if a.strict else 2)
    if a.gate:
        return 1 if worst == 1 else 0
    return worst


if __name__ == "__main__":
    sys.exit(main())
