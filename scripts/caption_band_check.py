#!/usr/bin/env python3
"""Static gate: nothing informational may be authored into the open-caption band.

WHY THIS EXISTS (2026-08-06). Round 1's panel put "typography and captions" in the
weakest column for two of three judges, and the specific complaint was plated
annotations bisected by, buried under, or pushed below the open-caption card. The fix
that round was a HARD CLAMP inside the Plate component: a plate can never enter the
band, whatever a call site asks for.

The clamp was right and it was not enough, because it is SILENT. In S10 a call site
asked for y=1520 — visually sensible, below the caption card — and the clamp correctly
hauled it back up to ~1251, which is precisely where a different plate was already
sitting. Two plates rendered into the same pixels. The clamp turned one defect into
another one, and nothing anywhere said so: the source read fine, the types checked, the
render succeeded. It took reading the geometry by hand to find.

Two lessons, and this file is both of them.

  1. A clamp that silently overrides an author is a lie the source tells about itself.
     If the y in the code is not the y on screen, that must be an ERROR at build time,
     not a quiet correction at render time.
  2. The clamp only protects <Plate>. Raw <rect> and <text> go straight to the SVG, and
     three of them were sitting in the band: S1's SAME PIPE label at y=1424, S5's vendor
     card at 1300..1354, S10's calendar at 1330..1458. The component-level guard could
     never have seen any of them.

So this checks the SOURCE, where the mistake is actually made. Elements that genuinely
belong in the band — room floors, background fills, the caption card itself — declare it
with a `data-band="ok"` attribute (or a `caption-band-ok` comment on the same line or the
line above, where an attribute will not fit). That is a rule an author can satisfy on
purpose and cannot satisfy by accident. The attribute form is preferred because it rides
on the element itself: a refactor that moves the rect carries the exemption with it,
where a comment on a neighbouring line silently stops applying.

Exit 0 clean, exit 1 with findings. Wire it BEFORE the render, never after: this is a
gate on the source, and its whole value is refusing to spend seven minutes of render on
a frame that was already wrong.
"""
import argparse
import glob
import os
import re
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# Read the band out of the episode itself rather than hardcoding it here, so an episode
# that moves its caption card cannot silently fall out of the gate's coverage.
CAPTION_H = 132
OK = "caption-band-ok"

# The shipped LinkedIn cut is crop=1080:1080:0:420 off the 1080x1920 master, so scene rows
# above 420 are not in the deliverable most of the audience sees.
SQUARE_TOP = 420

# ...BUT AN AUTHORED y IS NOT A RENDERED y, and this is the part that fooled the first
# version of this check. Every scene sits inside World, which applies a continuous push:
#
#     translate(540+dx, 960+dy) scale(k) translate(-540,-960),  k = 1 + 0.062*push
#
# so a point at scene y maps to 960 + (y - 960)*k + dy. Above the centre line that scale
# drives things UP, and by the end of a shot it is worth about 32px at y=450. That is
# exactly how c18 "FREE UNDER 5 STAFF HOURS A MONTH", authored at y=452 with a span of
# 428..476 that looks safely clear of 420 on paper, ended up sliced in half by the crop
# line on the delivered square. Naive arithmetic said it was fine and the render disagreed.
#
# Worst case is the largest push (1.0) at the end of a shot, with the drift at its most
# negative. Modelled conservatively for every scene rather than parsing each World's push,
# so the bound is never too loose.
K_MAX = 1.062
DY_MAX = 14.0


def world_top(scene_y):
    """Where a scene-space y can render at worst, once World's push is applied."""
    return 960.0 + (scene_y - 960.0) * K_MAX - DY_MAX


# the lowest authored TOP edge that still clears the crop line at full push
SAFE_Y_MIN = 960.0 - (960.0 - SQUARE_TOP - DY_MAX) / K_MAX

NUM = r"\{(-?\d+(?:\.\d+)?)\}"


def band_of(src, path):
    m = re.search(r"^const CAPTION_TOP = (\d+);", src, re.M)
    if not m:
        return None
    top = int(m.group(1))
    return top, top + CAPTION_H


def guard_of(src):
    """The y a Plate is clamped to: CAP_GUARD = CAPTION_TOP - 34, minus half its height."""
    m = re.search(r"CAP_GUARD = CAPTION_TOP - (\d+)", src)
    top = int(re.search(r"^const CAPTION_TOP = (\d+);", src, re.M).group(1))
    return top - int(m.group(1)) if m else top


def exempt(lines, i):
    if OK in lines[i] or 'data-band="ok"' in lines[i]:
        return True
    return i > 0 and OK in lines[i - 1]


# --- a LITERAL translate group carries its children into the band (machine pass 2026-11-26) ---------
# Ep1126 S12 drew its pager inset as `<g transform="translate(900 1420)">` around a <rect y={-90}> and a
# <text y={70}>, so the card sat under the caption band from 47.3 to 50.0 s and its loop payoff never
# read (queue inset-under-caption). The RAW rule read y -90 and y 70, local numbers, and passed it. A
# group whose transform is a pure literal translate now shifts every child by its y, so the rule reads
# the y the element renders at. Under any other transform (a template, a scale, a rotate) anywhere in the
# open stack the position is unknown, and the child keeps its old, local reading, so nothing that passed
# before for that reason starts failing (Ep1126 S10's template-translated card inside a literal 1300
# group read 1248 with the outer offset alone, a false finding, until this rule). A
# `data-band="ok"` on the group exempts everything inside it.
G_OPEN = re.compile(r"<g\b([^>]*?)(/?)>")
G_TRANSLATE = re.compile(r"""^\s*transform=["']translate\(\s*(-?\d+(?:\.\d+)?)[\s,]+(-?\d+(?:\.\d+)?)\s*\)["']\s*""")


def group_offsets(lines):
    """[(dy, exempt)] per line: the summed literal-translate y of the <g> groups open at the start of the
    line's first element, and whether one of them carries data-band="ok". Lines are scanned in order and
    every <g ...> / </g> on a line is applied after the line's own reading, except that a group opened on
    a line is in force for the rest of that line's children (none, in practice: one element a line)."""
    stack, out = [], []
    for ln in lines:
        known = all(k for _d, _e, k in stack)
        out.append((sum(d for d, _e, _k in stack) if known else 0.0, any(e for _d, e, _k in stack)))
        events = [(m.start(), "open", m) for m in G_OPEN.finditer(ln)] + \
                 [(m.start(), "close", None) for m in re.finditer(r"</g>", ln)]
        for _pos, kind, m in sorted(events, key=lambda e: e[0]):
            if kind == "open":
                if m.group(2) == "/":
                    continue
                attrs = m.group(1)
                tm = re.search(r"""transform=["'][^"']*["']""", attrs)
                dy, known = 0.0, True
                if tm:
                    pm = G_TRANSLATE.match(tm.group(0))
                    dy, known = (float(pm.group(2)), True) if pm else (0.0, False)
                elif re.search(r"\btransform=", attrs):
                    known = False             # transform={...}: a template or an expression
                stack.append((dy, 'data-band="ok"' in attrs, known))
            elif stack:
                stack.pop()
    return out


def check(path):
    src = open(path).read()
    band = band_of(src, path)
    if band is None:
        return []
    lo, hi = band
    guard = guard_of(src)
    lines = src.split("\n")
    out = []
    offsets = group_offsets(lines)

    for i, ln in enumerate(lines):
        if exempt(lines, i):
            continue
        gdy, gex = offsets[i]

        # --- raw geometry authored into the band -----------------------------
        for tag in ("rect", "text", "ellipse", "circle", "image"):
            if f"<{tag}" not in ln:
                continue
            ym = re.search(r"\by=" + NUM, ln)
            if not ym:
                continue
            if gex:
                break
            y = float(ym.group(1)) + gdy
            hm = re.search(r"\bheight=" + NUM, ln)
            y1 = y + (float(hm.group(1)) if hm else 0.0)
            if y1 >= lo and y <= hi:
                where = f" (local y {float(ym.group(1)):g} inside a translate group at y {gdy:g})" if gdy else ""
                out.append((path, i + 1, "RAW",
                            f"<{tag}> spans y {y:g}..{y1:g}{where}, inside the caption band {lo}..{hi}"))
            break

        # --- a Plate whose authored y is not the y it renders at -------------
        if "<Plate" in ln:
            blk = "\n".join(lines[i:i + 3])
            ym = re.search(r"\by=" + NUM, blk)
            if not ym:
                continue
            y = float(ym.group(1))
            sm = re.search(r"\bsize=" + NUM, blk)
            size = float(sm.group(1)) if sm else 26.0
            half = (size + 24) / 2.0
            eff = min(y, guard - half)
            if abs(eff - y) > 0.5:
                out.append((path, i + 1, "CLAMPED",
                            f"<Plate y={y:g} size={size:g}> renders at y={eff:g}, "
                            f"{y - eff:g}px above where the call site puts it"))

            # --- and the OTHER edge, which cost this run two claim cards -----
            # The shipped LinkedIn deliverable is the 1:1 square, crop=1080:1080:0:420, so
            # scene y < 420 does not exist for most of the audience. On 2026-08-06 two cards
            # were authored above it: c18 "FREE UNDER 5 STAFF HOURS A MONTH" at y=452 was
            # sliced exactly in half, and c20 "YOU'LL GET IT WHEN YOU GET IT" at y=392 was
            # cut ENTIRELY — the square viewer never saw that claim at all.
            #
            # crop_safety.py does catch this, but only by sampling a finished render, which
            # means the cost of the mistake is a full render plus an encode plus somebody
            # reading an advisory carefully enough not to wave it through as decorative.
            # It is arithmetic on a literal, so it belongs here, before the render.
            top = world_top(y - half)
            if top < SQUARE_TOP:
                how = ("wholly above it, invisible in the shipped 1:1 cut"
                       if world_top(y + half) <= SQUARE_TOP else "cut by it")
                out.append((path, i + 1, "CROPPED",
                            f"<Plate y={y:g} size={size:g}> authored top {y - half:g} "
                            f"RENDERS at {top:.0f} under the World push, crossing the square "
                            f"crop line at y={SQUARE_TOP} - {how}. Lowest safe y is "
                            f"{SAFE_Y_MIN + half:.0f}."))
    return out


# --- FEET: a figure standing behind the caption card (machine pass 2026-11-21) ---------------
# Four 11-21 courtroom shots stood figures with their feet at y 1440 to 1470, behind the caption
# card that starts at CAPTION_TOP 1336 (a judge and the flow critic, queue caption-band-feet). No
# check above sees it: a figure is a component call, not a raw <rect>, and its y is the FOOT line.
# A figure component is any component whose body draws the lib rig (IdleFigure, FigureFinish or
# figureIdle), in the episode or in lib/; a call site with a literal y (or footY) is its foot line.
# The World push is applied the same conservative way as above, downward this time. ADVISORY: it
# prints and never changes the exit code, because a foot inside a scaled group is not in screen px.
FOOT_TOL = 20        # px a shoe may sit under the card's top edge (the shipped 11-21 feet render at +10)
FIG_RIG = re.compile(r"<IdleFigure\b|<FigureFinish\b|\bfigureIdle\(")
COMP_DEF = re.compile(r"^(?:export\s+)?const\s+([A-Z]\w*)\s*:\s*React\.FC\b", re.M)


def figure_components(srcs):
    """Names of components whose body draws a lib figure rig, plus the rig components themselves."""
    names = {"IdleFigure", "FigureFinish"}
    for src in srcs:
        defs = list(COMP_DEF.finditer(src))
        for k, m in enumerate(defs):
            body = src[m.end():defs[k + 1].start() if k + 1 < len(defs) else len(src)]
            if FIG_RIG.search(body):
                names.add(m.group(1))
    return names


def world_bottom(scene_y):
    """Where a scene-space y BELOW the centre can render at worst, under World's push."""
    return 960.0 + (scene_y - 960.0) * K_MAX + DY_MAX


def feet(src, names, caption_top, path="<src>"):
    out = []
    lines = src.split("\n")
    call = re.compile(r"<(" + "|".join(sorted(map(re.escape, names))) + r")\b")
    for i, ln in enumerate(lines):
        m = call.search(ln)
        if not m or exempt(lines, i):
            continue
        tag = "\n".join(lines[i:i + 3])[m.start():]
        end = tag.find("/>")
        tag = tag[:end] if end >= 0 else tag
        ym = re.search(r"\b(?:footY|y)=" + NUM, tag)
        if not ym:
            continue
        y = float(ym.group(1))
        bot = world_bottom(y)
        if bot > caption_top + FOOT_TOL:
            out.append((path, i + 1, "FEET",
                        f"<{m.group(1)} y={y:g}> stands its feet at y {y:g}, rendering to {bot:.0f} under the "
                        f"World push, {bot - caption_top:.0f}px behind the caption card (CAPTION_TOP "
                        f"{caption_top}). Raise the foot line to y {(caption_top + FOOT_TOL - DY_MAX - 960) / K_MAX + 960:.0f} "
                        f"or less and scale the figure up instead (advisory)"))
    return out


def feet_of_file(path):
    src = open(path).read()
    band = band_of(src, path)
    if band is None:
        return []
    libs = []
    for lp in glob.glob(os.path.join(REPO, "video-engine", "src", "lib", "*.tsx")):
        try:
            libs.append(open(lp).read())
        except OSError:
            pass
    return feet(src, figure_components([src] + libs), band[0], path)


def _self_test():
    lib = ("export const Walker: React.FC<{f: number; x: number; y: number}> = ({f, x, y}) => (\n"
           "  <IdleFigure f={f} x={x} footY={y}><g /></IdleFigure>);\n"
           "export const Crate: React.FC<{x: number; y: number}> = ({x, y}) => <rect x={x} y={y} />;\n")
    names = figure_components([lib])
    assert names >= {"Walker", "IdleFigure"} and "Crate" not in names, names
    ep = ("const S1 = () => <g>\n"
          "  <Walker f={f} x={fx} y={1460} />\n"            # the 11-21 cut-1 courtroom foot line
          "  <Walker f={f} x={fx} y={1310} />\n"            # the shipped one
          "  <Crate x={1} y={1500} />\n"                    # not a figure
          "  <IdleFigure f={f} x={2}\n    footY={1440} h={200}>\n"
          "  <Walker f={f} x={3} y={1480} /> {/* caption-band-ok */}\n"
          "</g>;\n")
    got = [(ln, kind) for _p, ln, kind, _m in feet(ep, names, 1336)]
    assert got == [(2, "FEET"), (5, "FEET")], got
    # the Ep1126 S12 pager inset: children at local y inside a literal translate group (2026-11-26)
    import tempfile
    inset = ("const CAPTION_TOP = 1336;\n"
             "const S12 = () => <g>\n"
             "  <g transform=\"translate(900 1420)\">\n"
             "    <rect x={-110} y={-90} width={220} height={180} rx={8} />\n"
             "    <text x={0} y={30}>SPECIALIST PAGER</text>\n"
             "  </g>\n"
             "  <g transform=\"translate(870 790)\">\n"
             "    <rect x={-110} y={-90} width={220} height={180} rx={8} />\n"
             "  </g>\n"
             "  <g transform={`translate(0 ${dy})`}>\n"
             "    <rect x={0} y={-90} width={9} height={9} />\n"
             "  </g>\n"
             "  <g data-band=\"ok\" transform=\"translate(0 1400)\">\n"
             "    <rect x={0} y={0} width={1080} height={200} />\n"
             "  </g>\n"
             "  <rect x={0} y={1350} width={9} height={9} />\n"
             "  <g transform=\"translate(470 1300)\">\n"
             "    <g transform={`translate(0 -170) rotate(${r})`}>\n"
             "      <rect x={-118} y={-52} width={236} height={104} />\n"
             "    </g>\n"
             "  </g>\n"
             "</g>;\n")
    with tempfile.NamedTemporaryFile("w", suffix=".tsx", delete=False) as fh:
        fh.write(inset)
    try:
        raw = [(ln, kind) for _p, ln, kind, _m in check(fh.name)]
    finally:
        os.remove(fh.name)
    assert raw == [(4, "RAW"), (5, "RAW"), (16, "RAW")], raw
    print("caption_band_check self-test: PASS (feet at 1460 and footY 1440 flagged, 1310, a crate and an "
          "exempt line clean; an inset group at translate y 1420 flagged, one at 790, a template group and "
          "an exempt group clean)")
    return 0


def default_targets():
    """This run's episode only.

    Deliberately NOT every Ep*.tsx. The older episodes are shipped and published, and
    they fail this gate — that is what a new standard looks like on the day it is
    written. Retrofitting them would mean re-rendering and re-publishing films that are
    already out, which is rewriting history to make a checker happy. The gate binds what
    this run is about to render; pass explicit paths to audit anything else.
    """
    # FALLBACK HARDENING (2026-08-08). When the stamp carries no composition -- which is
    # what run_guard writes unless a run sets it -- this resolver used to fall back to
    # Episode.tsx, a shipped 2026-07 film. Three source gates then reported "clean across
    # 1 file(s)" all run while never once reading the episode about to be rendered. A
    # checker pointed at the wrong file is worse than no checker, because it reports PASS.
    # The fallback is now the NEWEST Ep*.tsx, which is at worst this run's own file.
    stamp = os.path.join(REPO, "out", "dispatch", ".run_stamp.json")
    src = os.path.join(REPO, "video-engine", "src")
    if os.path.exists(stamp):
        import json
        comp = json.load(open(stamp)).get("composition") or ""
        # the composition id is not the filename (id="Dispatch0806", file Ep0806.tsx), so
        # resolve it through Root.tsx the way Remotion does rather than guessing a path
        root = os.path.join(src, "Root.tsx")
        if comp and os.path.exists(root):
            r = open(root).read()
            m = re.search(r'id="' + re.escape(comp) + r'"\s*\n\s*component=\{(\w+)\}', r)
            if m:
                mi = re.search(r"import\s*\{[^}]*\b" + m.group(1) + r"\b[^}]*\}\s*from\s*'\./(\w+)'", r)
                if mi and os.path.exists(os.path.join(src, mi.group(1) + ".tsx")):
                    return [os.path.join(src, mi.group(1) + ".tsx")]
    return sorted(glob.glob(os.path.join(src, "Ep[0-9][0-9][0-9][0-9].tsx")))[-1:]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("targets", nargs="*", default=None)
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return _self_test()
    a.targets = a.targets or default_targets()

    findings = []
    for t in a.targets:
        findings += check(t)

    advisories = []
    for t in a.targets:
        advisories += feet_of_file(t)
    for path, line, kind, msg in advisories:
        print(f"{os.path.relpath(path, REPO)}:{line}  {kind}  {msg}")

    if not findings:
        print(f"caption_band_check: clean across {len(a.targets)} file(s)")
        return 0

    for path, line, kind, msg in findings:
        print(f"{os.path.relpath(path, REPO)}:{line}  {kind}  {msg}")
    print(f"\ncaption_band_check: {len(findings)} finding(s).")
    print("Move the element clear of the band, or mark the line `caption-band-ok` if it")
    print("is background that genuinely belongs under the caption card.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
