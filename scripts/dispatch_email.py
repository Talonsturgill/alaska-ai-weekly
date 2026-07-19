"""Build the Gmail draft payload for a finished Alaska.Ai video Dispatch (story-agnostic).

Media is NEVER base64'd through the model. The routine uploads the cuts (and ideally the poster)
with scripts/upload_video.py and passes their direct-download URLs here. This prints the draft
payload JSON {subject,to,html_body} on the LAST stdout line for the orchestrator to hand to the
Gmail create_draft connector (use --poster-url, not --poster, to keep that payload small).

Usage:
  python scripts/dispatch_email.py \
    --post out/dispatch/post.txt \
    --video-url-vertical "<9:16 url>" --video-url-square "<4:5 url>" \
    --poster-url "<poster url>" \
    --voice "Kokoro af_heart" --music '"Title" Composer (source) - CC BY 4.0' \
    --sources out/dispatch/sources.json --score "9.2/10" \
    --note "On-screen numbers are illustrative unless drawn from a live feed." \
    --temporary --date 2026-06-27 --title "Cook Inlet belugas" --out-html out/dispatch/email.html
"""
import argparse, base64, json, datetime as dt, sys
from pathlib import Path

# Run-freshness guard: refuse to email a PREVIOUS run's scratch (see run_guard.py
# for the 07-18/07-19 stale-artifact incidents this prevents). Import from the
# sibling scripts/ dir regardless of the caller's cwd.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from run_guard import fresh, StaleArtifactError  # noqa: E402

CSS = """
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#13202b;background:#eef1f3;margin:0;padding:24px;}
.wrap{max-width:720px;margin:0 auto;background:#fff;border:1px solid #e3e6e8;border-radius:14px;padding:28px;}
h1{font-size:22px;margin:0 0 2px;} .sub{color:#6a7782;font-size:13px;margin-bottom:22px;}
h2{font-size:15px;letter-spacing:.02em;text-transform:uppercase;color:#516170;margin-top:26px;border-bottom:1px solid #eef0f2;padding-bottom:6px;}
pre.post{white-space:pre-wrap;background:#f6f8f9;padding:16px;border-radius:10px;font:14px/1.55 ui-monospace,Menlo,monospace;}
.dl{display:inline-block;background:#FFC72C;color:#13202b;font-weight:700;text-decoration:none;padding:13px 20px;border-radius:10px;font-size:15px;margin:4px 8px 4px 0;}
.dl.alt{background:#13202b;color:#fff;} .dl small{display:block;font-weight:500;font-size:12px;margin-top:2px;opacity:.8;}
.poster{margin:16px 0;text-align:center;} .poster img{max-width:300px;width:100%;border-radius:10px;border:1px solid #e3e6e8;}
ul{padding-left:20px;} li{margin:4px 0;font-size:13.5px;} a{color:#0b6;}
.warn{background:#fff6e0;border:1px solid #f0d68a;color:#7a5a10;font-size:12.5px;padding:8px 12px;border-radius:8px;margin:10px 0;}
ul.upg{background:#eefaf1;border:1px solid #bfe6cd;border-radius:10px;padding:12px 12px 12px 32px;}
ul.upg li{color:#1c5f38;}
.foot{color:#97a2ab;font-size:11px;margin-top:24px;}
"""

def render(post, poster_html, vids, voice, music, sources, score, note, temporary, date_str, title, upgrades):
    src = "\n".join(
        f'<li><a href="{s.get("url","")}">{s.get("outlet", s.get("title",""))}</a> &middot; {s.get("note","")}</li>'
        for s in (sources or [])
    ) or "<li>See DISPATCH.md in the run branch for full sources + fact-check.</li>"
    buttons = ""
    # LinkedIn is PRIMARY, so the 4:5 leads: 4:5 shows in the MAIN HOME FEED beside the post copy;
    # 9:16 gets routed into LinkedIn's swipe-only vertical Video tab. Post the 4:5 to LinkedIn.
    if vids.get("square"):
        buttons += (f'<a class="dl" href="{vids["square"]}">&#9660;&nbsp; Post to LinkedIn &middot; 4:5 (main feed)'
                    f'<small>1080&times;1350 &middot; ~60s &middot; H.264 MP4 &middot; stays in the home feed</small></a>')
    if vids.get("vertical"):
        buttons += (f'<a class="dl alt" href="{vids["vertical"]}">&#9660;&nbsp; TikTok &middot; 9:16 (full-screen)'
                    f'<small>1080&times;1920 &middot; on LinkedIn this goes to the vertical Video tab, not the feed</small></a>')
    feed_guide = ('<div class="warn" style="background:#eaf4ff;border-color:#b6d8f5;color:#245c8a;">'
                  'For LinkedIn use the <b>4:5</b> cut (top button) so the video lands in the <b>main feed</b> '
                  'next to your caption. The 9:16 is TikTok-native; uploaded to LinkedIn it gets pulled into the '
                  'swipe-only Video tab instead of the feed.</div>') if vids.get("square") else ''
    warn = '<div class="warn">Heads up: these download links are temporary (~1 hour). Save the file before it expires, or configure a permanent host.</div>' if temporary else ""
    score_html = f"<h2>Grade</h2><ul><li>{score}</li></ul>" if score else ""
    # "Upgrades shipped this run" — Phase 8 makes fixes on the spot and reports what it DID here
    # (one bullet per line of --upgrades). A run that self-improved should say so.
    up_items = "\n".join(f"<li>{ln.strip().lstrip('-').strip()}</li>"
                         for ln in (upgrades or "").splitlines() if ln.strip())
    upgrades_html = (f'<h2>Upgrades shipped this run</h2><ul class="upg">{up_items}</ul>'
                     if up_items else "")
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div class="wrap">
  <h1>ALASKA.AI &middot; Dispatch ready{(' &middot; ' + title) if title else ''}</h1>
  <div class="sub">{date_str} &middot; LinkedIn (primary) + TikTok &middot; review, then post</div>

  <h2>The video</h2>
  {buttons}
  {feed_guide}
  {warn}
  {poster_html}

  <h2>Post text (copy/paste)</h2>
  <pre class="post">{post}</pre>

  <h2>Credits (include when you post)</h2>
  <ul><li><b>Voice:</b> {voice}</li><li><b>Music:</b> {music}</li></ul>
  {score_html}
  {upgrades_html}
  <h2>Sources</h2>
  <ul>{src}</ul>

  <div class="foot">Generated {dt.datetime.utcnow().isoformat()}Z by the Alaska.Ai Dispatch routine. {note}</div>
</div></body></html>"""

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--post", required=True)
    ap.add_argument("--video-url-vertical", required=True, help="9:16 1080x1920 TikTok cut (dispatch_master.mp4)")
    ap.add_argument("--video-url-square", default="",
                    help="4:5 1080x1350 LinkedIn feed cut (dispatch_master_4x5.mp4). ALWAYS pass this — it is the "
                         "primary LinkedIn deliverable; without it the draft only offers the 9:16, which LinkedIn "
                         "routes to the Video tab instead of the main feed.")
    ap.add_argument("--poster-url", default="", help="hosted poster (preferred, keeps payload small)")
    ap.add_argument("--poster", default="", help="poster file to inline as base64 (heavier)")
    ap.add_argument("--voice", default=""); ap.add_argument("--music", default="")
    ap.add_argument("--sources", default=""); ap.add_argument("--score", default="")
    ap.add_argument("--note", default="On-screen counters/charts are illustrative unless drawn from a live data feed.")
    ap.add_argument("--upgrades", default="",
                    help="what Phase 8 actually FIXED/upgraded this run, one item per line (not "
                         "suggestions -- changes committed this run). Rendered as the 'Upgrades "
                         "shipped this run' section so the owner sees what self-improved.")
    ap.add_argument("--temporary", action="store_true", help="flag download links as temporary (~1h)")
    ap.add_argument("--date", default=dt.date.today().isoformat()); ap.add_argument("--title", default="")
    ap.add_argument("--to", default="me"); ap.add_argument("--out-html", default="")
    ap.add_argument("--no-freshness-check", action="store_true",
                    help="bypass the run-freshness guard (deliberate manual/standalone use only; "
                         "the routine must NEVER pass this -- it is how a previous run's scratch ships)")
    a = ap.parse_args()
    chk = not a.no_freshness_check
    try:
        post = Path(fresh(a.post, check=chk)).read_text().strip()
    except StaleArtifactError as e:
        sys.exit(f"REFUSING TO BUILD DRAFT: --post is not from this run.\n  {e}")
    if a.poster_url:
        poster_html = f'<div class="poster"><img src="{a.poster_url}" alt="poster"/></div>'
    elif a.poster and Path(a.poster).exists():
        b64 = base64.b64encode(Path(a.poster).read_bytes()).decode()
        poster_html = f'<div class="poster"><img src="data:image/png;base64,{b64}" alt="poster"/></div>'
    else:
        poster_html = ""
    sources = None
    if a.sources and Path(a.sources).exists():
        try:
            sources = json.loads(Path(fresh(a.sources, check=chk)).read_text()).get("sources")
        except StaleArtifactError as e:
            sys.exit(f"REFUSING TO BUILD DRAFT: --sources is not from this run.\n  {e}")
    html = render(post, poster_html, {"vertical": a.video_url_vertical, "square": a.video_url_square},
                  a.voice or "(unset)", a.music or "(unset)", sources, a.score, a.note, a.temporary, a.date, a.title,
                  a.upgrades)
    if a.out_html:
        Path(a.out_html).write_text(html); print("wrote", a.out_html)
    payload = {"subject": f"ALASKA.AI · Dispatch ready · {a.date}", "to": a.to, "html_body": html}
    print(json.dumps(payload))   # LAST line = the draft payload for Gmail create_draft

if __name__ == "__main__":
    main()
