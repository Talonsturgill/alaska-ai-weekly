"""Build the Gmail draft payload for a finished Alaska.Ai video Dispatch.

The video is NOT attached or base64'd (that would blow the token window and
exceed Gmail's 25MB limit). Instead the routine uploads the mp4 to a host
(see scripts/upload_video.py) and passes the resulting direct-download URL in
--video-url. This script renders an email with: the copy-paste post text, a
prominent one-click DOWNLOAD button, an inline poster preview, the voice/music
credits, and sources. It prints a JSON payload {subject,to,html_body} to stdout
for the orchestrator to hand to the Gmail `create_draft` connector, and can also
write the HTML to --out-html for local preview.

Usage:
  python scripts/dispatch_email.py \
    --post out/dispatch/post.txt \
    --poster archive/.../poster_v2.png \
    --video-url "https://drive.google.com/uc?export=download&id=FILEID" \
    --voice "edge-tts Ava (en-US-AvaMultilingualNeural), -3%" \
    --music "Echoes by Andrew Ev (Mixkit Free License)" \
    --sources out/dispatch/sources.json \
    --date "2026-06-27" --out-html out/dispatch/email_preview.html
"""
import argparse, base64, json, datetime as dt
from pathlib import Path

CSS = """
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#13202b;background:#eef1f3;margin:0;padding:24px;}
.wrap{max-width:720px;margin:0 auto;background:#fff;border:1px solid #e3e6e8;border-radius:14px;padding:28px;}
h1{font-size:22px;margin:0 0 2px;} .sub{color:#6a7782;font-size:13px;margin-bottom:22px;}
h2{font-size:15px;letter-spacing:.02em;text-transform:uppercase;color:#516170;margin-top:26px;border-bottom:1px solid #eef0f2;padding-bottom:6px;}
pre.post{white-space:pre-wrap;background:#f6f8f9;padding:16px;border-radius:10px;font:14px/1.55 ui-monospace,Menlo,monospace;}
.dl{display:inline-block;background:#FFC72C;color:#13202b;font-weight:700;text-decoration:none;padding:14px 22px;border-radius:10px;font-size:16px;}
.dl small{display:block;font-weight:500;color:#5a4a10;font-size:12px;margin-top:2px;}
.poster{margin:16px 0;text-align:center;} .poster img{max-width:340px;width:100%;border-radius:10px;border:1px solid #e3e6e8;}
ul{padding-left:20px;} li{margin:4px 0;font-size:13.5px;} a{color:#0b6;}
.foot{color:#97a2ab;font-size:11px;margin-top:24px;}
"""

def render(post, poster_b64, video_url, voice, music, sources, date_str):
    src = "\n".join(
        f'<li><a href="{s.get("url","")}">{s.get("outlet", s.get("title",""))}</a> &mdash; {s.get("note","")}</li>'
        for s in (sources or [])
    ) or "<li>See DISPATCH.md in the run branch for full sources + fact-check.</li>"
    poster_html = (f'<div class="poster"><img src="data:image/png;base64,{poster_b64}" alt="poster"/></div>'
                   if poster_b64 else "")
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div class="wrap">
  <h1>ALASKA.AI &mdash; Dispatch ready</h1>
  <div class="sub">{date_str} &middot; review, then post to Facebook / LinkedIn / Substack</div>

  <h2>The video</h2>
  <a class="dl" href="{video_url}">&#9660;&nbsp; Download the video (full quality MP4)<small>1080&times;1350 &middot; 30s &middot; one click</small></a>
  {poster_html}

  <h2>Post text (copy/paste)</h2>
  <pre class="post">{post}</pre>

  <h2>Credits (for the comments)</h2>
  <ul><li><b>Voice:</b> {voice}</li><li><b>Music:</b> {music}</li></ul>

  <h2>Sources</h2>
  <ul>{src}</ul>

  <div class="foot">Generated {dt.datetime.utcnow().isoformat()}Z by the Alaska.Ai routine. On-screen counters/spectrogram are illustrative; population figure is the NOAA 2022 estimate.</div>
</div></body></html>"""

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--post",required=True); ap.add_argument("--poster",default="")
    ap.add_argument("--video-url",required=True)
    ap.add_argument("--voice",default=""); ap.add_argument("--music",default="")
    ap.add_argument("--sources",default=""); ap.add_argument("--date",default=dt.date.today().isoformat())
    ap.add_argument("--to",default="me"); ap.add_argument("--out-html",default="")
    a=ap.parse_args()
    post=Path(a.post).read_text().strip()
    poster_b64=base64.b64encode(Path(a.poster).read_bytes()).decode() if a.poster and Path(a.poster).exists() else ""
    sources=json.loads(Path(a.sources).read_text()).get("sources") if a.sources and Path(a.sources).exists() else None
    html=render(post,poster_b64,a.video_url,a.voice or "(unset)",a.music or "(unset)",sources,a.date)
    if a.out_html: Path(a.out_html).write_text(html); print("wrote",a.out_html)
    print(json.dumps({"subject":f"ALASKA.AI — Dispatch ready — {a.date}","to":a.to,"html_body":html}))

if __name__=="__main__": main()
