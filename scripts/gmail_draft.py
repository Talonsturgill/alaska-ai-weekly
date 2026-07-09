#!/usr/bin/env python3
"""Build the Gmail draft payload for a finished carousel run.

Composes the HTML body with: paste-ready post copy, paste-ready first
comment (sources), the document title + upload instructions, inline slide
previews (downscaled base64 JPEGs so the draft renders instantly), links to
the full-resolution PNGs and the PDF on GitHub, the scorer's report card,
editor notes, and the aftercare checklist.

The actual draft creation happens via the Gmail MCP `create_draft` tool —
this script prints a JSON payload {subject, to, html_body} to stdout.

Usage:
  python scripts/gmail_draft.py \
      --run-dir out/2026-07-14 \
      --run-date 2026-07-14 \
      --carousel-no 1 \
      --raw-base https://raw.githubusercontent.com/talonsturgill/alaskaaicarousels/main \
      --branch claude/carousel-2026-07-14 \
      --payload-out out/2026-07-14/gmail_payload.json

Expects in --run-dir:
  copy.json           (copywriter output: post_copy, first_comment,
                       document_title, aftercare, hashtags)
  score_report.json   (scorer output)
  render/slide-*.png  (full renders)
  final/carousel.pdf, final/assemble_report.json
"""

import argparse
import base64
import datetime as dt
import glob
import html
import io
import json
from pathlib import Path

from PIL import Image

CSS = """
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;background:#f6f7f9;margin:0;padding:24px;}
.wrap{max-width:760px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:30px;}
h1{font-size:22px;margin:0 0 4px;} .sub{color:#667085;font-size:13px;margin-bottom:22px;}
h2{font-size:16px;margin:26px 0 8px;border-bottom:1px solid #eee;padding-bottom:6px;}
pre.copy{white-space:pre-wrap;background:#f4f5f7;padding:16px;border-radius:8px;font-family:ui-monospace,Menlo,monospace;font-size:13.5px;line-height:1.55;border:1px solid #e8eaee;}
.step{background:#f0f7ff;border-left:3px solid #2f6fed;padding:10px 14px;border-radius:4px;margin:10px 0;font-size:14px;}
.grid{display:block;}
.slide{display:inline-block;vertical-align:top;width:31%;margin:0 1% 14px 1%;}
.slide img{width:100%;height:auto;border-radius:6px;border:1px solid #e5e7eb;}
.slide .cap{font-size:11px;color:#667085;margin-top:4px;text-align:center;}
.slide .cap a{color:#2f6fed;text-decoration:none;}
table.score{width:100%;border-collapse:collapse;font-size:13px;}
table.score th,table.score td{border-bottom:1px solid #eee;padding:6px 8px;text-align:left;}
.flag{background:#fff4e5;border-left:3px solid #f0a500;padding:10px 12px;border-radius:4px;margin:12px 0;font-size:14px;}
.ok{background:#eefaf2;border-left:3px solid #12b76a;padding:10px 12px;border-radius:4px;margin:12px 0;font-size:14px;}
ul.check{padding-left:20px;font-size:14px;} ul.check li{margin:5px 0;}
.links{font-size:13.5px;line-height:1.7;}
.foot{color:#98a2b3;font-size:11px;margin-top:22px;}
"""


def preview_b64(png_path, width=480, quality=80):
    im = Image.open(png_path).convert("RGB")
    h = int(im.height * width / im.width)
    im = im.resize((width, h), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=quality)
    return base64.b64encode(buf.getvalue()).decode("ascii")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--run-dir", required=True)
    ap.add_argument("--run-date", required=True)
    ap.add_argument("--carousel-no", required=True)
    ap.add_argument("--raw-base", required=True,
                    help="raw.githubusercontent base incl. branch, e.g. .../main")
    ap.add_argument("--branch", required=True)
    ap.add_argument("--payload-out", default="")
    args = ap.parse_args()

    run = Path(args.run_dir)
    copy = json.loads((run / "copy.json").read_text())
    score = json.loads((run / "score_report.json").read_text())
    asm = json.loads((run / "final" / "assemble_report.json").read_text())
    pngs = sorted(glob.glob(str(run / "render" / "slide-*.png")))

    # automation upgrades made by this run (ledger/upgrades.json, Phase 12):
    # surfaced in every dated draft so the maintainer can monitor the
    # machine's evolution and pinpoint which week to revert on degradation.
    upgrades = []
    up_path = Path(__file__).resolve().parents[1] / "ledger" / "upgrades.json"
    try:
        upgrades = [e for e in json.loads(up_path.read_text()).get("entries", [])
                    if e.get("run_date") == args.run_date]
    except Exception:
        pass

    runs_url = f"{args.raw_base}/runs/{args.run_date}"
    pdf_url = f"{runs_url}/carousel.pdf"

    esc = html.escape
    slides_html = ""
    for i, p in enumerate(pngs, 1):
        b64 = preview_b64(p)
        full = f"{runs_url}/slide-{i:02d}.png"
        slides_html += (
            f'<div class="slide"><img src="data:image/jpeg;base64,{b64}" alt="slide {i}"/>'
            f'<div class="cap">{i:02d} · <a href="{full}">full res</a></div></div>'
        )

    url_list = "\n".join(
        f'<div>Slide {i:02d}: <a href="{runs_url}/slide-{i:02d}.png">{runs_url}/slide-{i:02d}.png</a></div>'
        for i in range(1, len(pngs) + 1))

    score_rows = "\n".join(
        f"<tr><td>{esc(c['name'])}</td><td>{c['score']}</td>"
        f"<td>{c['weight']}</td><td>{esc(str(c.get('notes', '')))[:160]}</td></tr>"
        for c in score.get("criteria", []))
    ship = score.get("ship", False)
    ship_html = (
        f'<div class="ok"><b>Quality gate passed:</b> {score.get("weighted_total", "?")} / 10 '
        f'(threshold {score.get("threshold", "?")}).</div>' if ship else
        f'<div class="flag"><b>Shipped below threshold.</b> '
        f'{score.get("weighted_total", "?")} / 10 vs {score.get("threshold", "?")}. '
        f'Weakest: {esc(str(score.get("weakest_criterion", "?")))}. '
        f'Fix next time: {esc(str(score.get("one_sentence_fix", "?")))}</div>')
    notes = esc(str(score.get("editor_notes_for_email", "") or "None."))

    aftercare = "".join(f"<li>{esc(a)}</li>" for a in copy.get("aftercare", []))

    if upgrades:
        up_rows = "\n".join(
            f"<tr><td>{esc(u.get('area',''))}</td>"
            f"<td>{esc(u.get('change',''))}<br>"
            f"<span style='color:#98a2b3'>why: {esc(u.get('trigger',''))[:200]}</span></td>"
            f"<td>{esc(u.get('rollback',''))}<br>"
            f"<span style='color:#98a2b3'>{esc(str(u.get('commit','')))}</span></td></tr>"
            for u in upgrades)
        upgrades_html = (
            f'<h2>Automation changes this run ({len(upgrades)})</h2>'
            f'<div class="flag">The routine modified its own machinery this run. '
            f'If a later week looks worse, this dated section is the rollback trail '
            f'(each set reverts as one commit).</div>'
            f'<table class="score"><tr><th>Area</th><th>Change</th><th>Rollback</th></tr>{up_rows}</table>')
    else:
        upgrades_html = ('<h2>Automation changes this run</h2>'
                         '<div style="font-size:14px;color:#667085">None. '
                         'The machine ran to spec; no upgrades were needed.</div>')

    body = f"""<!doctype html><html><head><style>{CSS}</style></head><body>
<div class="wrap">
  <h1>Alaska.Ai &middot; LinkedIn Carousel No. {esc(str(args.carousel_no))}</h1>
  <div class="sub">{esc(args.run_date)} &middot; {len(pngs)} slides &middot; branch <code>{esc(args.branch)}</code></div>

  <h2>1 &middot; Upload the document</h2>
  <div class="step">Download <a href="{pdf_url}"><b>carousel.pdf</b></a>
  ({asm.get('pdf_mb', '?')} MB, vector text) &rarr; LinkedIn &rarr; start a post &rarr;
  add a <b>document</b> &rarr; upload the PDF &rarr; title it:
  <b>{esc(copy.get('document_title', ''))}</b></div>

  <h2>2 &middot; Paste the post copy</h2>
  <pre class="copy">{esc(copy.get('post_copy', ''))}</pre>

  <h2>3 &middot; Post, then paste this as the FIRST comment (within a minute)</h2>
  <pre class="copy">{esc(copy.get('first_comment', ''))}</pre>

  <h2>The deck</h2>
  <div class="grid">{slides_html}</div>

  <h2>Image URLs</h2>
  <div class="links">{url_list}
  <div>PDF: <a href="{pdf_url}">{pdf_url}</a></div>
  <div>Contact sheet: <a href="{runs_url}/contact_sheet.png">{runs_url}/contact_sheet.png</a></div></div>

  {ship_html}
  <h2>Report card</h2>
  <table class="score"><tr><th>Criterion</th><th>Score</th><th>Weight</th><th>Notes</th></tr>
  {score_rows}</table>

  <h2>Editor's note</h2>
  <div style="font-size:14px">{notes}</div>

  {upgrades_html}

  <h2>Aftercare (this is where reach is won)</h2>
  <ul class="check">{aftercare}</ul>

  <div class="foot">Generated {dt.datetime.utcnow().isoformat()}Z by the Alaska.Ai carousel routine.
  Artifacts: <a href="{runs_url}/storyboard.md">storyboard</a> &middot;
  <a href="{runs_url}/claims.json">claims</a> &middot;
  <a href="{runs_url}/score_report.json">score report</a></div>
</div></body></html>"""

    payload = {
        "subject": f"Alaska.Ai — LinkedIn Carousel No. {args.carousel_no} — {args.run_date} — {copy.get('document_title', '')}"[:180],
        "to": "me",
        "html_body": body,
    }
    out = json.dumps(payload)
    if args.payload_out:
        Path(args.payload_out).write_text(out)
        print(f"payload written -> {args.payload_out}  ({len(out) // 1024} KB)")
    else:
        print(out)


if __name__ == "__main__":
    main()
