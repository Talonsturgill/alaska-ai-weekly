#!/usr/bin/env python3
"""Refuse two text plates that occupy the same pixels.

WHY THIS EXISTS (2026-08-06, after it cost score in three separate panel rounds).

Three times in one run, a card was added to a band that already held one, and every time
the result was worse than the gap being closed:

  1. S8. Adding c19 stacked it onto the Sanders quote, clipping it to '"BASICALLY /
     YOUTUBERS F' and leaving a CHIEF RON DUPEE credit inside a quotation belonging to
     Chief of Staff Mike Sanders. Two judges hard-failed it: the film's most inflammatory
     line read as credited to a different named living police chief.
  2. S9. The c20 attribution I added to fix (1) rendered UNDERNEATH the concession card,
     completely occluded. A judge then reported c20 as the only quote in the film with no
     speaker — true on screen, false in the source.
  3. S7 earlier the same day: the spool's FULL tag landed on the word YOUTUBERS.

Every one was invisible to typecheck, to text_fit_check, and to caption_band_check, because
each element is individually fine. The defect is only in the RELATIONSHIP, and nothing was
looking at relationships.

WHAT IT DOES. Parses each scene component, reconstructs the box of every <Plate> from its
own layout arithmetic (the same monoW/height maths the component uses), and reports any two
boxes that intersect. Deliberate overlaps declare themselves with `plate-overlap-ok` on one
of the two lines.

WHAT IT DOES NOT DO, stated plainly. It is GEOMETRIC and opacity-blind: two plates that
overlap in space but never share a frame in time — because one retires before the other
lands — will be reported. That is the right failure direction. A false positive costs one
comment; a false negative costs a misattributed quotation on a named public official.
"""
import argparse
import os
import re
import sys
import math

from text_fit_check import collect_labels

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OK = "plate-overlap-ok"
NUM = r"\{(-?\d+(?:\.\d+)?)\}"

CAPTION_TOP = 1310
CAP_GUARD = CAPTION_TOP - 34


def mono_w(s, size, track=0.5):
    return len(s) * size * 0.602 + track * max(0, len(s) - 1)


def scenes(src):
    # Episode components are allowed to omit the style-space after `:` and may use a
    # lettered insert such as S9b.  Treat formatting as formatting; a geometry gate must
    # not go blind because Prettier or an episode author chose `:React.FC`.
    starts = [(m.group(1), m.start()) for m in
              re.finditer(r"^const (S\d+[A-Za-z]*):\s*React\.FC<SceneProps\b[^>]*>", src, re.M)]
    for i, (name, a) in enumerate(starts):
        b = starts[i + 1][1] if i + 1 < len(starts) else len(src)
        yield name, a, src[a:b]


def plates(body, base_line):
    """Every <Plate> in a scene, as (line, box, label)."""
    out = []
    # <Head> COUNTS TOO (2026-08-12). This gate only ever looked at <Plate>, so the 128px
    # display word TRIPLED was invisible to it, and on this run a fix that moved TRIPLED
    # dropped it straight on top of the ALASKA ONLY TO NATIONAL plate. All three round-4
    # judges reported that frame as unreadable; the gate reported the file clean, because the
    # colliding element was not a shape it knew about. A checker that only sees one of the two
    # kinds of text in the episode cannot answer the question it is named after.
    #
    # Head is centre-anchored like Plate and auto-fits the same way, so the same box maths
    # applies; only the advance differs, and HEAD_ADV is read out of the episode below.
    for m in re.finditer(r"<(?:Plate|Head)\b", body):
        blk = body[m.start():m.start() + 420]
        end = blk.find("/>")
        if end == -1:
            continue
        blk = blk[:end]
        xm, ym = re.search(r"\bx=" + NUM, blk), re.search(r"\by=" + NUM, blk)
        if not (xm and ym):
            continue
        x, y = float(xm.group(1)), float(ym.group(1))
        is_head = body[m.start():m.start() + 6].startswith("<Head")
        sm = re.search(r"\bsize=" + NUM, blk)
        size = float(sm.group(1)) if sm else (96.0 if is_head else 26.0)
        rows = re.findall(r"'([^']*)'|`([^`]*)`|\"([^\"]*)\"", blk)
        texts = [a or b or c for a, b, c in rows if (a or b or c)]
        texts = [t for t in texts if not t.startswith("#")] or [""]
        n = len(texts) if "lines=" in blk else 1
        wide = max((mono_w(t, size) for t in texts), default=0) + 34
        h = size + 24 + (n - 1) * (size + 10)
        yy = min(y, CAP_GUARD - h / 2)
        line = base_line + body[:m.start()].count("\n")
        out.append((line, (x - wide / 2, yy - h / 2, x + wide / 2, yy + h / 2), texts[0][:34]))
    return out


def intersect(a, b, pad=2.0):
    return not (a[2] <= b[0] + pad or b[2] <= a[0] + pad
                or a[3] <= b[1] + pad or b[3] <= a[1] + pad)


def check(path):
    with open(path) as source:
        src = source.read()
    lines = src.split("\n")
    found = []
    for name, off, body in scenes(src):
        base = src[:off].count("\n")
        ps = plates(body, base)
        for i in range(len(ps)):
            for j in range(i + 1, len(ps)):
                (li, bi, ti), (lj, bj, tj) = ps[i], ps[j]
                if not intersect(bi, bj):
                    continue
                if OK in lines[li] or OK in lines[lj]:
                    continue
                ox = min(bi[2], bj[2]) - max(bi[0], bj[0])
                oy = min(bi[3], bj[3]) - max(bi[1], bj[1])
                found.append((path, li + 1, lj + 1, name, ti, tj, ox, oy))
    return found


def _literal_transform(raw):
    """SVG affine transform, or None when runtime state is needed. No eval."""
    raw = raw.strip()
    if len(raw) >= 2 and raw[0] in ('\"', "'", '`') and raw[-1] == raw[0]:
        raw = raw[1:-1]
    if '${' in raw:
        return None
    result = (1, 0, 0, 1, 0, 0)
    consumed = ''
    for m in re.finditer(r'(translate|scale|rotate|matrix)\s*\(([^)]*)\)', raw):
        consumed += m.group(0)
        try:
            v = [float(x) for x in re.split(r'[\s,]+', m.group(2).strip()) if x]
        except ValueError:
            return None
        name = m.group(1)
        if name == 'translate' and len(v) in (1, 2):
            part = (1, 0, 0, 1, v[0], v[1] if len(v) == 2 else 0)
        elif name == 'scale' and len(v) in (1, 2):
            part = (v[0], 0, 0, v[-1], 0, 0)
        elif name == 'matrix' and len(v) == 6:
            part = tuple(v)
        elif name == 'rotate' and len(v) in (1, 3):
            angle = math.radians(v[0]); c, s = math.cos(angle), math.sin(angle)
            x, y = v[1:] if len(v) == 3 else (0, 0)
            part = (c, s, -s, c, x-c*x+s*y, y-s*x-c*y)
        else:
            return None
        result = _multiply(result, part)
    if re.sub(r'\s+', '', consumed) != re.sub(r'\s+', '', raw):
        return None
    return result


def _multiply(a, b):
    return (a[0]*b[0]+a[2]*b[1], a[1]*b[0]+a[3]*b[1],
            a[0]*b[2]+a[2]*b[3], a[1]*b[2]+a[3]*b[3],
            a[0]*b[4]+a[2]*b[5]+a[4], a[1]*b[4]+a[3]*b[5]+a[5])


def _label_box(call, adapter):
    x, y, width = call['x'], call['y'], call['width']
    points = [(x-width/2, y+adapter['top']), (x+width/2, y+adapter['top']),
              (x+width/2, y+adapter['bottom']), (x-width/2, y+adapter['bottom'])]
    # AST ancestry is inner-to-outer, the order points encounter the transforms.
    for raw in call['transforms']:
        matrix = _literal_transform(raw)
        if matrix is None:
            return None
        a, b, c, d, e, f = matrix
        points = [(a*px+c*py+e, b*px+d*py+f) for px, py in points]
    return (min(p[0] for p in points), min(p[1] for p in points),
            max(p[0] for p in points), max(p[1] for p in points))


def check_label_overlap(path, props_path=None):
    """Actual Label rectangles in Shot's n branches, plus its shared overlay.

    Text variants of one callsite are mutually exclusive, not overlapping plates.
    Opacity never exempts a separate callsite. Unknown geometry/transform is a
    failure. Boxes are conservative AABBs; rotated disjoint polygons may overflag.
    A common downstream projection preserves overlap; mixed projected/overlay
    coordinates are rejected instead of being compared as though identical.
    """
    data = collect_labels(path, props_path)
    findings, issues = [], list(data['issues'])
    if not data.get('adapter') or issues:
        return findings, issues, len(data['scene_ids'])
    with open(path) as source:
        src = source.read()
    compact = re.sub(r'\s+', '', src)
    room_match = re.search(r'room=\[([\d,]+)\]\.includes\(n\)', compact)
    projected = set(map(int, room_match.group(1).split(','))) if room_match else set()
    projected.update(int(x) for x in re.findall(r'room\|\|n===(\d+)', compact))
    boxes = {}
    for index, call in enumerate(data['calls']):
        boxes[index] = _label_box(call, data['adapter'])
        if boxes[index] is None:
            issues.append({'line': call['line'], 'why': 'Unresolved animated Label ancestor transform; actual runtime bounds required: ' + ' / '.join(call['transforms'])})
    for scene in data['scene_ids']:
        visible = [(i, c) for i, c in enumerate(data['calls'])
                   if c['scene'] in (None, scene) and scene not in c['excluded_scenes']]
        for ai, (i, first) in enumerate(visible):
            for j, second in visible[ai+1:]:
                if boxes[i] is None or boxes[j] is None:
                    continue  # already a failing unresolved-geometry finding above
                if first['inside_art'] != second['inside_art'] and 'Stage3D' in src:
                    if not room_match or scene in projected:
                        issues.append({'line': first['line'], 'why': f'S{scene}: cannot compare projected art Label with screen overlay without runtime camera bounds'})
                        continue
                if not intersect(boxes[i], boxes[j]):
                    continue
                bi, bj = boxes[i], boxes[j]
                findings.append((path, first['line'], second['line'], f'S{scene}',
                                 ' | '.join(first['texts'])[:65], ' | '.join(second['texts'])[:65],
                                 min(bi[2], bj[2])-max(bi[0], bj[0]),
                                 min(bi[3], bj[3])-max(bi[1], bj[1])))
    return findings, issues, len(data['scene_ids'])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("targets", nargs="*")
    ap.add_argument("--props", help="Actual episode props for dynamic Label variants")
    a = ap.parse_args()
    targets = a.targets
    if not targets:
        sys.path.insert(0, os.path.join(REPO, "scripts"))
        from caption_band_check import default_targets
        targets = default_targets()

    # A CHECKER THAT PARSED NOTHING MUST NOT REPORT CLEAN (2026-08-08).
    #
    # `scenes()` matches `^const (S\d+): React.FC<SceneProps>`. Ep0808 declared its scenes
    # as bare `React.FC`, so the pattern matched zero scenes, `check()` returned no
    # findings, and this printed "clean across 1 file(s)" every time it ran for an entire
    # run — while a plate sat over a cycling hatch and two more overlapped at 22.8s.
    #
    # That is the FOURTH time this run that a gate has announced clean while grading
    # nothing: caption_band_check resolved a shipped July episode through a stamp field
    # nobody writes, then passed again by returning early on a missing constant, and
    # claims_contract_check printed "0 obligation(s) met" in the same breath as "none
    # outstanding". Every one was found by a human noticing a number looked wrong. That is
    # not a control, it is luck.
    #
    # So: emptiness is now a finding in its own right. If a file contains plates but the
    # parser yielded no scenes to put them in, the gate FAILS and says why, rather than
    # congratulating the run on a file it could not read. The fix for a real refactor is
    # one line here; the cost of the silent version is a whole run's worth of false green.
    found, blind, unresolved, total_scenes = [], [], [], 0
    for t in targets:
        src = open(t).read()
        legacy_count = len(list(scenes(src)))
        label_found, label_issues, label_count = check_label_overlap(t, a.props)
        if legacy_count + label_count == 0:
            blind.append(t)
        found += check(t)
        found += label_found
        unresolved += [(t, issue) for issue in label_issues]
        total_scenes += legacy_count + label_count

    for path, issue in unresolved:
        print(f"FAIL {os.path.relpath(path, REPO)}:{issue['line']}  {issue['why']}")

    if blind:
        for t in blind:
            print(f"FAIL {os.path.relpath(t, REPO)}: the scene "
                  f"parser matched ZERO scenes, so nothing in this file was checked.")
        print("\nplate_overlap_check: parsed no scenes, so 'clean' would be a lie.")
        print("Expected legacy S<n> components or actual Shot n=== branches. If the episode renamed")
        print("or retyped its scene components, update the pattern — do not ignore this.")
        return 1

    if not found and not unresolved:
        print(f"plate_overlap_check: clean across {len(targets)} file(s), "
              f"{total_scenes} scene(s) parsed")
        return 0
    for path, li, lj, scene, ti, tj, ox, oy in found:
        rel = os.path.relpath(path, REPO)
        print(f"{rel}:{li} and :{lj}  {scene}  OVERLAP {ox:.0f}x{oy:.0f}px")
        print(f"    '{ti}'  vs  '{tj}'")
    print(f"\nplate_overlap_check: {total_scenes} scenes, {len(found)} overlapping pair(s), {len(unresolved)} unresolved geometry finding(s).")
    print("Two plates in the same pixels means one of them is unreadable, and the one")
    print("underneath is usually an attribution. Separate them, sequence them so one")
    print("retires before the other lands with measured frame evidence. Label geometry")
    print("does not accept comment exemptions; unresolved motion needs actual bounds.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
