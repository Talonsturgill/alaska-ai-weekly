#!/usr/bin/env python3
"""render.py — deterministic slide renderer for Alaska.Ai LinkedIn carousels.

Renders per-slide HTML files to exact-size PNGs via headless Chromium
(pre-installed in the cloud environment), and extracts an objective in-page
QA report (console/page errors, missing fonts, text-node geometry, clipped
or offscreen text) that downstream gates consume.

Conventions the slide HTML must follow (see SKILL.md for the full contract):
  - One file per slide, named  slide-01.html, slide-02.html, ...
  - Canvas is the viewport: design for exactly 1080x1350 CSS px (4:5).
  - Reference committed assets with the @@ASSETS@@ token, e.g.
      <link rel="stylesheet" href="@@ASSETS@@/fonts/fonts.css">
      <script src="@@ASSETS@@/js/noise.js"></script>
      fetch("@@ASSETS@@/geo/alaska-state.geo.json")
    The renderer resolves the token to an absolute file:// path.
  - NO external URLs (no CDNs, no Google Fonts, no http(s) at all).
  - If artwork draws asynchronously (canvas animation frames, fetched
    geodata), set  window.renderReady = new Promise(...)  and resolve it
    when the final frame is painted. The renderer awaits it (30s cap).

Usage:
  python .claude/skills/carousel-engine/render.py \
      --slides-dir out/run/slides --out-dir out/run/render [--scale 2] [--only 2,5]

Exit codes: 0 = all slides rendered (warnings possible; read the report),
            1 = at least one slide hard-failed (JS error, timeout, missing PNG).
Writes: <out-dir>/slide-XX.png + <out-dir>/render_report.json
"""

import argparse
import glob
import json
import re
import shutil
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

REPO_ROOT = Path(__file__).resolve().parents[3]
ASSETS_DIR = REPO_ROOT / "assets"

CHROMIUM_ARGS = [
    "--allow-file-access-from-files",   # lets slides fetch() committed geodata
    "--hide-scrollbars",
    "--force-color-profile=srgb",
    "--disable-lcd-text",               # subpixel AA looks wrong in screenshots
    "--font-render-hinting=none",       # fixes headless kerning/letter-spacing bugs
    "--enable-unsafe-swiftshader",      # software WebGL (experimental; probe before relying on it)
]

IN_PAGE_QA_JS = """
() => {
  const W = window.innerWidth, H = window.innerHeight;
  const out = { text_nodes: [], overflow_warnings: [], fonts_missing: [], body_overflow: false };
  const de = document.documentElement, b = document.body;
  if (de.scrollWidth > W + 1 || de.scrollHeight > H + 1 ||
      (b && (b.scrollWidth > W + 1 || b.scrollHeight > H + 1))) {
    out.body_overflow = true;
  }
  const seenFam = new Set();
  const walk = document.createTreeWalker(document.body || de, NodeFilter.SHOW_ELEMENT);
  let el;
  while ((el = walk.nextNode())) {
    const hasText = Array.from(el.childNodes).some(
      n => n.nodeType === 3 && n.textContent.trim().length > 0);
    if (!hasText) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const txt = el.textContent.trim().replace(/\\s+/g, " ").slice(0, 80);
    const fs = parseFloat(cs.fontSize);
    const fam = cs.fontFamily.split(",")[0].trim().replace(/["']/g, "");
    // For SVG text the ink is `fill`, not CSS `color`; the fill attribute or
    // computed fill is the real text color the contrast check must use.
    const isSvgText = el.namespaceURI === "http://www.w3.org/2000/svg";
    const inkColor = isSvgText ? (cs.fill || cs.getPropertyValue("fill") || cs.color) : cs.color;
    const node = {
      text: txt,
      x: Math.round(r.x), y: Math.round(r.y),
      w: Math.round(r.width), h: Math.round(r.height),
      font_px: Math.round(fs * 10) / 10,
      weight: cs.fontWeight,
      family: fam,
      color: inkColor,
      decorative: el.hasAttribute("data-decorative")
    };
    out.text_nodes.push(node);
    if (!node.decorative) {
      if (r.x < -1 || r.y < -1 || r.right > W + 1 || r.bottom > H + 1) {
        out.overflow_warnings.push({ kind: "offscreen", text: txt,
          detail: `bbox ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} vs ${W}x${H}` });
      }
      if (el.scrollWidth > el.clientWidth + 2 && ["hidden","clip"].includes(cs.overflowX)) {
        out.overflow_warnings.push({ kind: "clipped-x", text: txt,
          detail: `scrollWidth ${el.scrollWidth} > clientWidth ${el.clientWidth}` });
      }
      if (el.scrollHeight > el.clientHeight + 2 && ["hidden","clip"].includes(cs.overflowY)) {
        out.overflow_warnings.push({ kind: "clipped-y", text: txt,
          detail: `scrollHeight ${el.scrollHeight} > clientHeight ${el.clientHeight}` });
      }
      if (fs < 24) {
        out.overflow_warnings.push({ kind: "tiny-text", text: txt,
          detail: `font-size ${fs}px < 24px mobile floor (mark data-decorative if intentional)` });
      }
    }
    if (!["serif","sans-serif","monospace","system-ui","cursive","fantasy"].includes(fam) &&
        !seenFam.has(fam + "|" + cs.fontWeight)) {
      seenFam.add(fam + "|" + cs.fontWeight);
      let spec = cs.fontWeight + " 32px \\"" + fam + "\\"";
      try {
        if (!document.fonts.check(spec)) out.fonts_missing.push({ family: fam, weight: cs.fontWeight });
      } catch (e) {}
    }
  }
  return out;
}
"""


def launch_chromium(p):
    """Launch chromium, falling back to the pre-installed browser binary."""
    try:
        return p.chromium.launch(args=CHROMIUM_ARGS)
    except Exception:
        candidates = sorted(glob.glob("/opt/pw-browsers/chromium-*/chrome-linux/chrome"))
        candidates += ["/opt/pw-browsers/chromium/chrome-linux/chrome", "/opt/pw-browsers/chromium"]
        for c in candidates:
            if Path(c).exists():
                try:
                    return p.chromium.launch(executable_path=c, args=CHROMIUM_ARGS)
                except Exception:
                    continue
        raise RuntimeError("No launchable Chromium found (tried default + /opt/pw-browsers)")


def resolve_html(src: Path, resolved_dir: Path) -> Path:
    html = src.read_text()
    if re.search(r'src\s*=\s*["\']https?://|href\s*=\s*["\']https?://|url\(\s*["\']?https?://', html):
        raise ValueError(f"{src.name}: external http(s) reference found. Slides must be fully offline.")
    html = html.replace("@@ASSETS@@", ASSETS_DIR.as_uri())
    dst = resolved_dir / src.name
    dst.write_text(html)
    return dst


def render_slide(browser, path: Path, out_png: Path, width: int, height: int,
                 scale: float, timeout_ms: int) -> dict:
    rec = {"file": path.name, "png": out_png.name, "console_errors": [], "page_errors": [],
           "overflow_warnings": [], "fonts_missing": [], "text_nodes": [],
           "body_overflow": False, "render_ms": 0, "ok": False}
    t0 = time.time()
    page = browser.new_page(viewport={"width": width, "height": height},
                            device_scale_factor=scale)
    page.on("console", lambda m: rec["console_errors"].append(m.text)
            if m.type in ("error",) else None)
    page.on("pageerror", lambda e: rec["page_errors"].append(str(e)))
    try:
        page.goto(path.as_uri(), wait_until="load", timeout=timeout_ms)
        page.evaluate("() => document.fonts.ready.then(() => true)")
        has_ready = page.evaluate("() => typeof window.renderReady !== 'undefined'")
        if has_ready:
            page.evaluate("() => Promise.race([window.renderReady, "
                          "new Promise((_, rej) => setTimeout(() => rej('renderReady timeout'), 30000))])")
        else:
            page.wait_for_timeout(400)
        qa = page.evaluate(IN_PAGE_QA_JS)
        rec.update({k: qa[k] for k in ("text_nodes", "overflow_warnings",
                                       "fonts_missing", "body_overflow")})
        page.screenshot(path=str(out_png), clip={"x": 0, "y": 0, "width": width, "height": height})
        rec["ok"] = out_png.exists() and out_png.stat().st_size > 10_000
        if not rec["ok"]:
            rec["page_errors"].append("screenshot missing or suspiciously small")
    except Exception as e:
        rec["page_errors"].append(f"render exception: {e}")
    finally:
        page.close()
    rec["render_ms"] = int((time.time() - t0) * 1000)
    return rec


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slides-dir", required=True)
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--scale", type=float, default=2.0)
    ap.add_argument("--width", type=int, default=1080)
    ap.add_argument("--height", type=int, default=1350)
    ap.add_argument("--only", default="", help="comma-separated slide numbers to re-render, e.g. 2,5")
    ap.add_argument("--timeout", type=int, default=45000)
    args = ap.parse_args()

    slides_dir = Path(args.slides_dir).resolve()
    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    resolved_dir = out_dir / ".resolved"
    resolved_dir.mkdir(exist_ok=True)

    slides = sorted(slides_dir.glob("slide-*.html"))
    if not slides:
        print(f"FAIL: no slide-*.html in {slides_dir}", file=sys.stderr)
        sys.exit(1)
    if args.only:
        keep = {int(x) for x in args.only.split(",")}
        slides = [s for s in slides
                  if int(re.search(r"slide-(\d+)", s.name).group(1)) in keep]

    report_path = out_dir / "render_report.json"
    prior = {}
    if report_path.exists():
        try:
            prior = {r["file"]: r for r in json.loads(report_path.read_text())["slides"]}
        except Exception:
            prior = {}

    results = []
    with sync_playwright() as p:
        browser = launch_chromium(p)
        for s in slides:
            resolved = resolve_html(s, resolved_dir)
            png = out_dir / (s.stem + ".png")
            rec = render_slide(browser, resolved, png, args.width, args.height,
                               args.scale, args.timeout)
            status = "OK " if rec["ok"] and not rec["page_errors"] else "FAIL"
            warn = len(rec["overflow_warnings"])
            print(f"[{status}] {s.name} -> {png.name}  {rec['render_ms']}ms"
                  f"  warnings={warn}  errors={len(rec['page_errors'])}")
            prior[s.name] = rec
            results.append(rec)
        browser.close()
    shutil.rmtree(resolved_dir, ignore_errors=True)

    merged = [prior[k] for k in sorted(prior.keys())]
    report = {
        "canvas": {"width": args.width, "height": args.height, "scale": args.scale,
                   "px": [int(args.width * args.scale), int(args.height * args.scale)]},
        "slides": merged,
    }
    report_path.write_text(json.dumps(report, indent=2))
    print(f"report -> {report_path}")

    hard_fail = any((not r["ok"]) or r["page_errors"] or r["body_overflow"] for r in results)
    if hard_fail:
        print("HARD FAIL: at least one slide has render errors or body overflow "
              "(see render_report.json)", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
