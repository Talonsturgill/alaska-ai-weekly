#!/usr/bin/env python3
"""qa.py — machine QA over rendered slides. The objective half of the review
loop; the subjective half is the pixel-critic agents reading the PNGs.

Checks per slide (consuming render_report.json + the PNGs):
  - PNG exists, exact expected pixel size
  - not blank / not near-uniform (dead render detector)
  - TEXT COLLISIONS: no two text elements' line boxes may overprint
    (FAIL when both are primary text, WARN when either is decorative).
    Added 2026-07-08 after a body-copy-over-bar-label collision passed
    every other gate and had to be caught by the scorer's eyes.
  - BUSY ART UNDER TEXT (WARN only): samples the PNG under each primary text
    line box, masks the glyph ink, and warns when the background carries
    high-contrast structured edges (a canvas/bitmap arc or texture the DOM
    collision gate cannot see). Added 2026-07-10 after canvas flightpath/orbit
    arcs crossed body copy and a headline and machine QA passed both.
  - approximate contrast of every non-decorative text node vs its local
    background (WCAG-style luminance ratio; estimate, so thresholds are
    conservative: <2.0 on primary text = FAIL, <3.5 = WARN)
  - text nodes inside the safe zone (default 80px margins at 1080x1350;
    slides may bleed decorative art, not primary text)
  - forwards render_report warnings (offscreen/clipped/tiny text, missing
    fonts, console errors)

Usage:
  python .claude/skills/carousel-engine/qa.py --render-dir out/run/render
Exit codes: 0 pass (warnings allowed), 1 any FAIL.
Writes <render-dir>/machine_qa.json
"""

import argparse
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

SAFE_MARGIN = 80  # px at 1080-wide design size


def rel_luminance(rgb):
    def chan(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (chan(x) for x in rgb[:3])
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def parse_css_color(s):
    m = re.match(r"rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)", s or "")
    if not m:
        return None
    return tuple(float(m.group(i)) for i in (1, 2, 3))


def contrast_estimate(img_arr, node, scale):
    """Estimate contrast between text color and its local background.

    The bbox contains both text and background pixels; the background is
    estimated as the median of the pixels most different from the text color
    (text coverage in a bbox is typically well under half).
    """
    color = parse_css_color(node.get("color"))
    if color is None:
        return None
    x, y = int(node["x"] * scale), int(node["y"] * scale)
    w, h = int(node["w"] * scale), int(node["h"] * scale)
    H, W = img_arr.shape[:2]
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(W, x + w), min(H, y + h)
    if x1 - x0 < 4 or y1 - y0 < 4:
        return None
    crop = img_arr[y0:y1, x0:x1].reshape(-1, img_arr.shape[2])[:, :3].astype(float)
    if len(crop) > 20000:
        crop = crop[:: len(crop) // 20000]
    dist = np.abs(crop - np.array(color)).sum(axis=1)
    bg = np.median(crop[dist > np.percentile(dist, 55)], axis=0) if (dist > np.percentile(dist, 55)).any() else np.median(crop, axis=0)
    lt, lb = rel_luminance(color), rel_luminance(bg)
    lo, hi = min(lt, lb), max(lt, lb)
    return (hi + 0.05) / (lo + 0.05)


BUSY_INK_DIST = 90      # sum-abs RGB distance under which a pixel counts as glyph ink
BUSY_EDGE_LUM = 28      # luminance step (0..255) that counts as a "structured edge"
BUSY_DILATE = 2         # px to grow the ink mask by, to exclude anti-aliased glyph edges
BUSY_WARN = 0.03        # background edge-density above which we point the critics at the box


def _dilate(mask, k):
    m = mask.copy()
    for _ in range(k):
        n = m.copy()
        n[:-1] |= m[1:]; n[1:] |= m[:-1]
        n[:, :-1] |= m[:, 1:]; n[:, 1:] |= m[:, :-1]
        m = n
    return m


def busy_art_under_text(img_arr, node, scale):
    """WARN-level tripwire for canvas/bitmap art crossing a DOM text line box.

    text_collisions() only sees DOM/SVG text vs DOM/SVG text; canvas ink is a
    bitmap invisible to render.py's DOM walk, so structured art drawn UNDER a
    text line passes every objective gate (2026-07-10: an S3 flightpath arc
    crossed two body lines and an S4 orbit arc crossed the headline, and
    machine_qa PASSED both -- only the pixel critics caught them). This samples
    the PNG under each of a node's text line boxes, masks off the glyph ink
    (plus a 2px dilation for anti-aliased edges), and measures the fraction of
    remaining BACKGROUND pixel pairs that straddle a high-contrast luminance
    step. A solid or smooth-gradient background scores ~0; an arc, stroke, or
    dense texture crossing the text scores high. Returns the worst background
    edge density over the node's line boxes (0..1), or None if unmeasurable.
    Never a FAIL and never a threshold on legibility itself: it only points the
    pixel critics at a box to judge by eye.
    """
    color = parse_css_color(node.get("color"))
    if color is None:
        return None
    lines = node.get("lines") or [[node["x"], node["y"], node["w"], node["h"]]]
    H, W = img_arr.shape[:2]
    worst = None
    for bx, by, bw, bh in lines:
        x0, y0 = max(0, int(bx * scale)), max(0, int(by * scale))
        x1, y1 = min(W, int((bx + bw) * scale)), min(H, int((by + bh) * scale))
        if x1 - x0 < 8 or y1 - y0 < 8:
            continue
        crop = img_arr[y0:y1, x0:x1, :3].astype(float)
        lum = 0.2126 * crop[..., 0] + 0.7152 * crop[..., 1] + 0.0722 * crop[..., 2]
        ink = np.abs(crop - np.array(color)).sum(axis=2) < BUSY_INK_DIST
        if ink.mean() > 0.75:
            continue  # box is almost all ink colour (solid plate); nothing to read under
        bg = ~_dilate(ink, BUSY_DILATE)
        hd = np.abs(lum[:, 1:] - lum[:, :-1]); hb = bg[:, 1:] & bg[:, :-1]
        vd = np.abs(lum[1:, :] - lum[:-1, :]); vb = bg[1:, :] & bg[:-1, :]
        tot = int(hb.sum()) + int(vb.sum())
        if tot < 50:
            continue
        edges = int(((hd > BUSY_EDGE_LUM) & hb).sum()) + int(((vd > BUSY_EDGE_LUM) & vb).sum())
        d = edges / tot
        worst = d if worst is None else max(worst, d)
    return worst


def text_collisions(nodes, min_overlap=0.30, min_px=8):
    """Detect text-on-text overprint between distinct elements.

    Compares per-LINE boxes (render.py extracts them; falls back to the
    element bbox), skips DOM ancestor/descendant pairs, and counts a
    collision when the intersection covers >= min_overlap of the smaller
    line box in both dimensions beyond min_px. Returns
    [(i, j, overlap_ratio)] with i < j indexing `nodes`.
    """
    found = []
    for i in range(len(nodes)):
        a = nodes[i]
        a_lines = a.get("lines") or [[a["x"], a["y"], a["w"], a["h"]]]
        a_anc = set(a.get("anc") or [])
        for j in range(i + 1, len(nodes)):
            b = nodes[j]
            if i in (b.get("anc") or []) or j in a_anc:
                continue  # nested elements share ink legitimately
            b_lines = b.get("lines") or [[b["x"], b["y"], b["w"], b["h"]]]
            worst = 0.0
            for ax, ay, aw, ah in a_lines:
                for bx, by, bw, bh in b_lines:
                    ix = min(ax + aw, bx + bw) - max(ax, bx)
                    iy = min(ay + ah, by + bh) - max(ay, by)
                    if ix < min_px or iy < min_px:
                        continue
                    smaller = min(aw * ah, bw * bh)
                    if smaller <= 0:
                        continue
                    worst = max(worst, (ix * iy) / smaller)
            if worst >= min_overlap:
                found.append((i, j, worst))
    return found


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--render-dir", required=True)
    ap.add_argument("--safe-margin", type=int, default=SAFE_MARGIN)
    args = ap.parse_args()

    rdir = Path(args.render_dir)
    report = json.loads((rdir / "render_report.json").read_text())
    scale = report["canvas"]["scale"]
    exp_w, exp_h = report["canvas"]["px"]
    design_w, design_h = report["canvas"]["width"], report["canvas"]["height"]

    out = {"slides": [], "fails": 0, "warns": 0}
    for rec in report["slides"]:
        res = {"file": rec["file"], "fails": [], "warns": []}
        png = rdir / rec["png"]
        if not png.exists():
            res["fails"].append("png missing")
            out["slides"].append(res)
            continue
        im = Image.open(png).convert("RGB")
        if im.size != (exp_w, exp_h):
            res["fails"].append(f"size {im.size} != expected {(exp_w, exp_h)}")
        arr = np.asarray(im)
        if float(arr.std()) < 6.0:
            res["fails"].append(f"near-uniform image (std {arr.std():.1f}) — dead or empty render")

        for e in rec.get("page_errors", []):
            res["fails"].append(f"page error: {e}")
        for e in rec.get("console_errors", []):
            res["warns"].append(f"console error: {e}")
        for f in rec.get("fonts_missing", []):
            res["fails"].append(f"font not loaded: {f['family']} w{f['weight']}")
        if rec.get("body_overflow"):
            res["fails"].append("body overflow (page scrolls beyond canvas)")
        for wr in rec.get("overflow_warnings", []):
            level = res["warns"] if wr["kind"] == "tiny-text" else res["fails"]
            level.append(f"{wr['kind']}: '{wr['text'][:50]}' ({wr['detail']})")

        # text-on-text overprint (the class of defect no other gate sees).
        # data-overlap-ok marks DELIBERATE layering (e.g., a chip on an
        # opaque plate crossing a display line box): demoted to WARN so the
        # pixel critics still judge it.
        tnodes = rec.get("text_nodes", [])
        for i, j, ratio in text_collisions(tnodes):
            a, b = tnodes[i], tnodes[j]
            msg = (f"text collision ({ratio:.0%} overprint): "
                   f"'{a['text'][:36]}' x '{b['text'][:36]}' "
                   f"near {max(a['x'], b['x'])},{max(a['y'], b['y'])}")
            if a.get("overlap_ok") or b.get("overlap_ok"):
                res["warns"].append(msg + " [marked data-overlap-ok]")
            elif a.get("decorative") or b.get("decorative"):
                res["warns"].append(msg + " [decorative involved]")
            else:
                res["fails"].append(msg)

        for node in rec.get("text_nodes", []):
            if node.get("decorative"):
                continue
            primary = node["font_px"] >= 30
            if (node["x"] < args.safe_margin - 8 or node["y"] < args.safe_margin - 8 or
                    node["x"] + node["w"] > design_w - args.safe_margin + 8 or
                    node["y"] + node["h"] > design_h - args.safe_margin + 8):
                res["warns"].append(
                    f"outside safe zone: '{node['text'][:40]}' at {node['x']},{node['y']} "
                    f"{node['w']}x{node['h']} (margin {args.safe_margin}px)")
            ratio = contrast_estimate(arr, node, scale)
            if ratio is not None:
                if primary and ratio < 2.0:
                    res["fails"].append(f"contrast ~{ratio:.1f} on '{node['text'][:40]}' (est.)")
                elif ratio < 3.5:
                    res["warns"].append(f"low contrast ~{ratio:.1f} on '{node['text'][:40]}' (est.)")
            # canvas/bitmap-under-text tripwire (WARN only): the DOM collision
            # gate cannot see canvas ink, so busy art crossing a text line box
            # is otherwise invisible to the machine (2026-07-10 S3/S4 arcs).
            # Restricted to primary text, where a crossing genuinely hurts.
            if primary:
                busy = busy_art_under_text(arr, node, scale)
                if busy is not None and busy >= BUSY_WARN:
                    res["warns"].append(
                        f"busy art under text (bg edge density {busy:.2f}) beneath "
                        f"'{node['text'][:40]}' -- canvas/bitmap may be crossing a "
                        f"text line box; pixel critic verify legibility")

        out["fails"] += len(res["fails"])
        out["warns"] += len(res["warns"])
        out["slides"].append(res)

    out["verdict"] = "FAIL" if out["fails"] else ("WARN" if out["warns"] else "PASS")
    (rdir / "machine_qa.json").write_text(json.dumps(out, indent=2))
    for s in out["slides"]:
        flag = "FAIL" if s["fails"] else ("warn" if s["warns"] else "ok  ")
        print(f"[{flag}] {s['file']}  fails={len(s['fails'])} warns={len(s['warns'])}")
        for f in s["fails"]:
            print(f"    FAIL: {f}")
        for w in s["warns"][:6]:
            print(f"    warn: {w}")
    print(f"verdict: {out['verdict']}  (report -> {rdir / 'machine_qa.json'})")
    sys.exit(1 if out["fails"] else 0)


if __name__ == "__main__":
    main()
