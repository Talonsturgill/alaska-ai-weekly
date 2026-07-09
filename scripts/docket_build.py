#!/usr/bin/env python3
"""docket_build.py builds the public Alaska AI Docket site from ledger/docket.json.

The daily routine runs this in Phase 11 (ship) after Phase 3.5 updates the
ledger; docs/ is committed with the run and GitHub Pages serves it. The
script is also the ledger's lint gate: it validates every item against the
schema, checks every date parses, and refuses to emit a page containing
banned punctuation (em or en dashes, curly quotes, emoji).

Design: the site carries the studio's deck language to the web. Dark
arctic night, an aurora that actually drifts, the glowing Alaska
coastline as the hero, door glyphs for the four-rooms access model, gold
reserved for open doors and deadlines, grain over everything. Zero
dependencies, one HTML file, fast.

  python scripts/docket_build.py --date 2026-07-09 [--out docs]

Exit 0 on success, 1 on any validation failure.
"""

import argparse
import base64
import io
import json
import math
import random
import re
import sys
from datetime import date as ddate
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
DEFAULT_DOMAIN = "alaskaaihq.com"
DEFAULT_SITE = f"https://{DEFAULT_DOMAIN}"

KINDS = {"state-land-lease", "federal-lease", "utility-decision", "legislation",
         "regulatory-docket", "procurement", "grant", "other"}
STATUSES = {"open-for-comment", "pending-decision", "decided", "closed", "watching"}
ACCESS = {"open", "indirect", "closed"}
DATE_KINDS = {"deadline", "vote", "decision", "milestone"}

ACCESS_LABEL = {"open": "OPEN TO YOU", "indirect": "INDIRECT", "closed": "CLOSED"}
STATUS_LABEL = {"open-for-comment": "Open for comment", "pending-decision": "Pending decision",
                "decided": "Decided", "closed": "Closed", "watching": "Watching"}
KIND_LABEL = {"state-land-lease": "State land lease", "federal-lease": "Federal lease",
              "utility-decision": "Utility decision", "legislation": "Legislation",
              "regulatory-docket": "Regulatory docket", "procurement": "Procurement",
              "grant": "Grant", "other": "Decision"}
MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

BANNED = re.compile("[–—‘’“”]|[\U0001F000-\U0001FAFF]")


def fail(msg):
    print(f"FAIL: {msg}", file=sys.stderr)
    sys.exit(1)


def parse_date(s, ctx):
    try:
        return ddate.fromisoformat(s)
    except Exception:
        fail(f"{ctx}: bad date {s!r}")


def mon_day(s):
    d = ddate.fromisoformat(s)
    return f"{MONTHS[d.month - 1]} {d.day}"


def validate(items):
    seen = set()
    for it in items:
        i = it.get("id", "<missing id>")
        if i in seen:
            fail(f"duplicate id {i}")
        seen.add(i)
        for field in ("id", "title", "kind", "status", "decider", "public_access",
                      "access_note", "summary", "key_dates", "sources",
                      "first_seen", "last_updated", "history"):
            if field not in it:
                fail(f"{i}: missing {field}")
        if it["kind"] not in KINDS:
            fail(f"{i}: bad kind {it['kind']}")
        if it["status"] not in STATUSES:
            fail(f"{i}: bad status {it['status']}")
        if it["public_access"] not in ACCESS:
            fail(f"{i}: bad public_access {it['public_access']}")
        if not it["sources"]:
            fail(f"{i}: needs at least one source")
        for s in it["sources"]:
            if not s.get("url", "").startswith("http"):
                fail(f"{i}: source without a real url")
        for d in it["key_dates"]:
            parse_date(d["date"], i)
            if d.get("kind") not in DATE_KINDS:
                fail(f"{i}: key_date kind {d.get('kind')!r}")
        parse_date(it["first_seen"], i)
        parse_date(it["last_updated"], i)


def next_date(it, today):
    upcoming = [d for d in it["key_dates"] if parse_date(d["date"], it["id"]) >= today]
    upcoming.sort(key=lambda d: d["date"])
    return upcoming[0] if upcoming else None


def esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace('"', "&quot;"))


# ---------- grain tile (seeded, like AK.grainTile) ----------

def grain_data_uri(size=110, strength=26, seed=11):
    try:
        from PIL import Image
    except ImportError:
        return ""
    rng = random.Random(seed)
    im = Image.new("L", (size, size))
    im.putdata([128 + rng.randint(-strength, strength) for _ in range(size * size)])
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


# ---------- Alaska map (Albers equal-area conic, the house projection) ----------

def albers(lon, lat, lon0=-154.0, p1=55.0, p2=65.0, lat0=63.0):
    rad = math.radians
    n = (math.sin(rad(p1)) + math.sin(rad(p2))) / 2.0
    C = math.cos(rad(p1)) ** 2 + 2.0 * n * math.sin(rad(p1))
    rho0 = math.sqrt(C - 2.0 * n * math.sin(rad(lat0))) / n
    rho = math.sqrt(max(0.0, C - 2.0 * n * math.sin(rad(lat)))) / n
    dlon = ((lon - lon0 + 540.0) % 360.0) - 180.0
    th = n * rad(dlon)
    return rho * math.sin(th), rho0 - rho * math.cos(th)


def alaska_paths(max_points=3000, keep_rings=16):
    geo = json.loads((REPO / "assets/geo/alaska-state.geo.json").read_text())
    g = geo["features"][0]["geometry"]
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    rings = sorted((r[0] for r in polys), key=len, reverse=True)[:keep_rings]
    total = sum(len(r) for r in rings)
    step = max(1, total // max_points)
    out = []
    for r in rings:
        pts = [albers(lon, lat) for lon, lat in r[::step]]
        if len(pts) >= 8:
            out.append(pts)
    return out


def graticule_paths(lon_step=10, lat_step=5):
    paths = []
    for lon in range(-180, -125, lon_step):
        paths.append([albers(lon, lat / 2.0) for lat in range(102, 145)])
    for lat in range(50, 75, lat_step):
        paths.append([albers(lon / 2.0, lat) for lon in range(-360, -249, 2)])
    return paths


def fit_transform(paths, w, h, pad):
    xs = [p[0] for path in paths for p in path]
    ys = [p[1] for path in paths for p in path]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    s = min((w - 2 * pad) / (x1 - x0), (h - 2 * pad) / (y1 - y0))
    ox = (w - (x1 - x0) * s) / 2.0
    oy = (h - (y1 - y0) * s) / 2.0
    def T(p):
        return ((p[0] - x0) * s + ox, h - ((p[1] - y0) * s + oy))
    return T


def path_d(paths, T, close=True):
    z = " Z" if close else ""
    return " ".join(
        "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in (T(p) for p in path)) + z
        for path in paths)


PIN_COLOR = {"open": "#3ce6b4", "indirect": "#8da2be", "closed": "#f2a43a"}


def map_svg(ordered_items, w=1000, h=620):
    located = [(n, it) for n, it in enumerate(ordered_items, 1) if it.get("location")]
    coast = alaska_paths()
    T = fit_transform(coast, w, h, 44)
    coast_d = path_d(coast, T)
    grat_d = path_d(graticule_paths(), T, close=False)
    pts = [list(T(albers(it["location"]["lon"], it["location"]["lat"]))) for _, it in located]
    for _ in range(60):   # relax overlapping pins apart (min 34px separation)
        moved = False
        for a in range(len(pts)):
            for b in range(a + 1, len(pts)):
                dx = pts[b][0] - pts[a][0]; dy = pts[b][1] - pts[a][1]
                dist = max(0.001, math.hypot(dx, dy))
                if dist < 34:
                    push = (34 - dist) / 2.0
                    ux, uy = dx / dist, dy / dist
                    if abs(dx) < 1 and abs(dy) < 1: ux, uy = 0.0, 1.0
                    pts[a][0] -= ux * push; pts[a][1] -= uy * push
                    pts[b][0] += ux * push; pts[b][1] += uy * push
                    moved = True
        if not moved:
            break
    pins = []
    for (n, it), (x, y) in zip(located, pts):
        c = PIN_COLOR[it["public_access"]]
        pulse = ""
        if it["public_access"] == "open":
            pulse = (f'<circle cx="{x:.0f}" cy="{y:.0f}" r="15" fill="none" stroke="{c}" stroke-width="1.6" opacity="0.8">'
                     f'<animate attributeName="r" values="15;30" dur="2.8s" repeatCount="indefinite"/>'
                     f'<animate attributeName="opacity" values="0.8;0" dur="2.8s" repeatCount="indefinite"/></circle>')
        pins.append(
            f'<a href="#{esc(it["id"])}" aria-label="{esc(it["title"])}">{pulse}'
            f'<circle cx="{x:.0f}" cy="{y:.0f}" r="14" fill="#050b16" stroke="{c}" stroke-width="2.6"/>'
            f'<text x="{x:.0f}" y="{y + 5:.0f}" text-anchor="middle" class="pinnum" fill="{c}">{n}</text></a>')
    caption = "".join(
        f'<a class="mapkey" href="#{esc(it["id"])}"><b class="k-{it["public_access"]}">{n}</b>'
        f'<span>{esc(it["location"]["name"])}</span></a>'
        for n, it in located)
    svg = f"""<svg viewBox="0 0 {w} {h}" role="img" aria-label="Map of Alaska with every tracked decision pinned">
<defs>
  <filter id="coastglow" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="5" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <radialGradient id="landfill" cx="60%" cy="30%" r="90%">
    <stop offset="0%" stop-color="#0d2038"/><stop offset="100%" stop-color="#081426"/>
  </radialGradient>
</defs>
<path d="{grat_d}" fill="none" stroke="rgba(110,165,255,0.07)" stroke-width="1"/>
<path d="{coast_d}" fill="url(#landfill)" stroke="#5ac8f0" stroke-width="1.5" filter="url(#coastglow)"/>
{''.join(pins)}
</svg>"""
    return svg, caption


# ---------- door glyphs (the four rooms, from slide 8) ----------

def door_svg(access):
    if access == "open":
        return """<svg class="door" viewBox="0 0 44 56" aria-hidden="true">
<polygon points="30,6 44,50 10,46" fill="rgba(255,199,44,0.13)"/>
<rect x="7" y="4" width="26" height="48" rx="2" fill="none" stroke="#ffc72c" stroke-width="2.4"/>
<polygon points="9,6 22,12 22,48 9,50" fill="#12233a" stroke="#ffc72c" stroke-width="1.6"/>
<rect x="24" y="12" width="7" height="36" fill="#ffda6e" opacity="0.55"/>
</svg>"""
    if access == "closed":
        return """<svg class="door" viewBox="0 0 44 56" aria-hidden="true">
<rect x="7" y="4" width="26" height="48" rx="2" fill="none" stroke="#f2a43a" stroke-width="2"/>
<rect x="10" y="7" width="20" height="42" fill="#141311" stroke="#8a6030" stroke-width="1.2"/>
<circle cx="26" cy="30" r="2" fill="#f2a43a"/>
<line x1="7" y1="4" x2="33" y2="52" stroke="#f2a43a" stroke-width="1.2" opacity="0.5"/>
</svg>"""
    return """<svg class="door" viewBox="0 0 44 56" aria-hidden="true">
<rect x="7" y="4" width="26" height="48" rx="2" fill="none" stroke="#8da2be" stroke-width="2"/>
<rect x="10" y="7" width="20" height="42" fill="#0c1c30" stroke="#3a5f84" stroke-width="1.2"/>
<circle cx="26" cy="30" r="2" fill="#8da2be"/>
</svg>"""


# ---------- page assembly ----------

def rail_html(it, today):
    stops = []
    for d in sorted(it["key_dates"], key=lambda x: x["date"]):
        dd = parse_date(d["date"], it["id"])
        cls = "future" if dd >= today else "past"
        if d["kind"] in ("deadline", "vote"):
            cls += " hard"
        stops.append(
            f'<div class="stop {cls}"><span class="dot"></span>'
            f'<span class="d">{mon_day(d["date"])}</span>'
            f'<span class="l">{esc(d["label"])}</span></div>')
    solo = ' solo' if len(stops) == 1 else ''
    return f'<div class="rail{solo}">{"".join(stops)}</div>'


def item_html(it, today, num):
    nd = next_date(it, today)
    chip = (f'<span class="chip days" data-date="{nd["date"]}">by {mon_day(nd["date"])}</span>'
            if nd else f'<span class="chip" style="color:var(--mute)">{esc(STATUS_LABEL[it["status"]])}</span>')
    srcs = " &middot; ".join(
        f'<a href="{esc(s["url"])}" rel="noopener">{esc(s["outlet"])}</a>' for s in it["sources"])
    hist = it["history"][-1] if it["history"] else None
    hist_html = (f'<div class="hist">{esc(hist["date"])} &middot; {esc(hist["note"])}</div>' if hist else "")
    return f"""<article class="item a-{it["public_access"]}" id="{esc(it["id"])}" data-reveal>
  <div class="doorcol">{door_svg(it["public_access"])}<span class="num">{num:02d}</span></div>
  <div class="body">
    <div class="top">
      <span class="badge b-{it["public_access"]}">{ACCESS_LABEL[it["public_access"]]}</span>
      <span class="chip kind">{esc(KIND_LABEL[it["kind"]]).upper()}</span>
      {chip}
    </div>
    <h3>{esc(it["title"])}</h3>
    <div class="who">DECIDES &middot; {esc(it["decider"]).upper()}</div>
    <p>{esc(it["summary"])}</p>
    <div class="access">{esc(it["access_note"])}</div>
    {rail_html(it, today)}
    <div class="srcs">Sources &middot; {srcs}</div>
    {hist_html}
  </div>
</article>"""


def card_html(it, today):
    nd = next_date(it, today)
    return f"""<a class="card a-{it["public_access"]}" href="#{esc(it["id"])}" data-reveal>
  <div class="cardtop"><span class="badge b-{it["public_access"]}">{ACCESS_LABEL[it["public_access"]]}</span></div>
  <div class="big" data-days="{nd['date']}">{mon_day(nd['date'])}</div>
  <div class="when chip days" data-date="{nd['date']}">by {mon_day(nd['date'])}</div>
  <h3>{esc(it["title"])}</h3>
  <div class="who">{esc(nd["label"]).upper()}</div>
</a>"""


CSS_TEMPLATE = """
:root{--night:#02060f;--deep:#050b16;--panel:#0a1626;--panel2:#0e2138;--line:#1c3350;
--snow:#f4f8ff;--body:#c3d2e6;--mute:#8da2be;--gold:#ffc72c;--halo:#ffda6e;
--green:#3ce6b4;--amber:#f2a43a;--blue:#5ac8f0;--violet:#9664e6;}
@font-face{font-family:Fraunces;src:url(fonts/fraunces.woff2) format("woff2");font-weight:100 900;font-display:swap;}
@font-face{font-family:JBMono;src:url(fonts/jbmono.woff2) format("woff2");font-weight:400;font-display:swap;}
@font-face{font-family:JBMono;src:url(fonts/jbmono-md.woff2) format("woff2");font-weight:500;font-display:swap;}
@font-face{font-family:Manrope;src:url(fonts/manrope.woff2) format("woff2");font-weight:200 800;font-display:swap;}
*{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{background:var(--night);color:var(--body);font-family:Manrope,system-ui,sans-serif;
line-height:1.55;overflow-x:hidden;}
body::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:50;
background-image:url(GRAIN_URI);mix-blend-mode:overlay;opacity:.55;}
::selection{background:rgba(255,199,44,.25);}
a{color:inherit;}

/* ---------- aurora sky ---------- */
.sky{position:absolute;inset:0 0 auto 0;height:120vh;overflow:hidden;pointer-events:none;z-index:0;}
.veil{position:absolute;border-radius:50%;filter:blur(70px);mix-blend-mode:screen;opacity:.62;}
.v1{width:60vw;height:44vh;left:38vw;top:-12vh;background:radial-gradient(closest-side,rgba(60,230,180,.5),transparent 70%);
animation:drift1 26s ease-in-out infinite alternate;}
.v2{width:48vw;height:40vh;left:16vw;top:-16vh;background:radial-gradient(closest-side,rgba(90,200,240,.4),transparent 70%);
animation:drift2 34s ease-in-out infinite alternate;}
.v3{width:34vw;height:30vh;left:62vw;top:6vh;background:radial-gradient(closest-side,rgba(150,100,230,.28),transparent 70%);
animation:drift3 42s ease-in-out infinite alternate;}
@keyframes drift1{from{transform:translate(-6vw,0) rotate(-4deg);}to{transform:translate(7vw,4vh) rotate(5deg);}}
@keyframes drift2{from{transform:translate(5vw,2vh);}to{transform:translate(-7vw,-2vh);}}
@keyframes drift3{from{transform:translate(0,0) scale(1);}to{transform:translate(-5vw,3vh) scale(1.15);}}
.stars{position:absolute;inset:0;background-image:
radial-gradient(1px 1px at 12% 22%,rgba(244,248,255,.7),transparent 60%),
radial-gradient(1px 1px at 33% 8%,rgba(244,248,255,.5),transparent 60%),
radial-gradient(1.5px 1.5px at 56% 30%,rgba(244,248,255,.6),transparent 60%),
radial-gradient(1px 1px at 72% 12%,rgba(244,248,255,.5),transparent 60%),
radial-gradient(1px 1px at 88% 26%,rgba(244,248,255,.65),transparent 60%),
radial-gradient(1.5px 1.5px at 44% 16%,rgba(244,248,255,.4),transparent 60%);}

.wrap{position:relative;max-width:1120px;margin:0 auto;padding:0 24px 110px;z-index:1;}

/* ---------- hero ---------- */
.brandrow{display:flex;align-items:center;gap:12px;padding:44px 0 0;
font-family:JBMono,monospace;font-size:13px;letter-spacing:.22em;color:var(--mute);}
.brandrow .polaris{width:18px;height:18px;flex:none;}
.brandrow .upd{margin-left:auto;letter-spacing:.12em;color:#5f7390;}
h1{font-family:Fraunces,serif;font-weight:580;font-size:clamp(42px,7vw,84px);line-height:1.0;
letter-spacing:-.015em;color:var(--snow);margin:34px 0 0;max-width:11ch;}
h1 em{font-style:normal;color:var(--gold);}
.tag{font-size:clamp(17px,2.2vw,21px);max-width:560px;margin:26px 0 0;color:var(--body);}
.statrow{display:flex;gap:34px;flex-wrap:wrap;margin:36px 0 0;font-family:JBMono,monospace;}
.stat .n{font-size:clamp(26px,3.4vw,38px);font-weight:500;color:var(--snow);font-variant-numeric:tabular-nums;}
.stat .n.g{color:var(--gold);text-shadow:0 0 22px rgba(255,199,44,.35);}
.stat .l{font-size:11.5px;letter-spacing:.18em;color:var(--mute);margin-top:2px;}

/* ---------- map ---------- */
.maphero{margin:44px -24px 0;padding:10px 24px 6px;position:relative;}
.maphero svg{width:100%;height:auto;display:block;}
.pinnum{font-family:JBMono,monospace;font-size:13.5px;font-weight:500;}
.mapcap{display:flex;gap:10px 26px;flex-wrap:wrap;padding:14px 2px 0;}
.mapkey{display:flex;align-items:center;gap:9px;font-family:JBMono,monospace;font-size:12.5px;
letter-spacing:.05em;color:var(--mute);text-decoration:none;transition:color .2s;}
.mapkey:hover{color:var(--snow);}
.mapkey b{font-weight:500;border:1.5px solid;border-radius:50%;width:21px;height:21px;flex:none;
text-align:center;line-height:19px;background:var(--deep);}
.k-open{color:var(--green);border-color:var(--green);}
.k-indirect{color:var(--mute);border-color:var(--mute);}
.k-closed{color:var(--amber);border-color:var(--amber);}

/* ---------- sections ---------- */
h2{font-family:Fraunces,serif;font-weight:540;font-size:clamp(26px,3.6vw,36px);color:var(--snow);
margin:84px 0 8px;letter-spacing:-.01em;}
.sub{color:var(--mute);font-size:15.5px;margin-bottom:26px;max-width:640px;}

/* ---------- closing-soon cards ---------- */
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;}
.card{display:block;background:linear-gradient(165deg,var(--panel) 0%,var(--deep) 100%);
border:1px solid var(--line);border-radius:12px;padding:22px 24px;text-decoration:none;
transition:transform .25s,border-color .25s,box-shadow .25s;}
.card:hover{transform:translateY(-3px);border-color:#2c5876;box-shadow:0 14px 40px rgba(0,0,0,.5);}
.card.a-open{border-color:rgba(255,199,44,.45);}
.card.a-open:hover{border-color:var(--gold);box-shadow:0 14px 44px rgba(255,199,44,.13);}
.cardtop{margin-bottom:14px;}
.card .big{font-family:Fraunces,serif;font-weight:560;font-size:44px;color:var(--snow);line-height:1;}
.card.a-open .big{color:var(--gold);}
.card .when{display:block;margin:8px 0 14px;}
.card h3{font-family:Manrope,sans-serif;font-weight:600;font-size:16.5px;color:var(--snow);line-height:1.3;}
.card .who{margin-top:8px;}

/* ---------- badges + chips ---------- */
.badge{font-family:JBMono,monospace;font-size:11px;letter-spacing:.13em;font-weight:500;
padding:4px 10px;border-radius:4px;border:1px solid;display:inline-block;}
.b-open{color:var(--green);border-color:rgba(60,230,180,.5);background:rgba(60,230,180,.06);}
.b-indirect{color:var(--mute);border-color:rgba(141,162,190,.4);}
.b-closed{color:var(--amber);border-color:rgba(242,164,58,.5);background:rgba(242,164,58,.05);}
.chip{font-family:JBMono,monospace;font-size:12px;letter-spacing:.09em;font-weight:500;}
.chip.days{color:var(--gold);}
.chip.kind{color:#6a7d97;}
.who{font-family:JBMono,monospace;font-size:11.5px;letter-spacing:.09em;color:var(--mute);}

/* ---------- docket items ---------- */
.item{display:flex;gap:26px;background:linear-gradient(170deg,var(--panel) 0%,var(--deep) 88%);
border:1px solid var(--line);border-radius:14px;padding:30px 32px;margin-bottom:18px;}
.item.a-open{border-color:rgba(255,199,44,.4);
box-shadow:0 0 0 1px rgba(255,199,44,.08),0 18px 60px rgba(0,0,0,.35);}
.doorcol{flex:none;display:flex;flex-direction:column;align-items:center;gap:10px;padding-top:4px;}
.door{width:44px;height:56px;}
.item.a-open .door{filter:drop-shadow(0 0 10px rgba(255,199,44,.45));}
.doorcol .num{font-family:JBMono,monospace;font-size:12px;color:#5f7390;letter-spacing:.1em;}
.item .body{min-width:0;flex:1;}
.item .top{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px;}
.item h3{font-family:Fraunces,serif;font-weight:540;font-size:clamp(22px,2.8vw,28px);
color:var(--snow);line-height:1.18;margin-bottom:8px;}
.item p{margin:12px 0;font-size:16px;max-width:70ch;}
.access{font-size:14.5px;color:var(--mute);border-left:2px solid var(--gold);
padding:2px 0 2px 14px;margin:14px 0;max-width:64ch;}
.item.a-indirect .access,.item.a-closed .access{border-left-color:var(--line);}
.srcs{font-size:13.5px;color:var(--mute);margin-top:14px;}
.srcs a{color:var(--blue);text-decoration:none;border-bottom:1px solid rgba(90,200,240,.25);}
.srcs a:hover{border-bottom-color:var(--blue);}
.hist{font-size:12.5px;color:#5f7390;margin-top:10px;font-family:JBMono,monospace;letter-spacing:.02em;}

/* ---------- timeline rail ---------- */
.rail{display:flex;margin:22px 0 4px;position:relative;}
.rail::before{content:"";position:absolute;left:0;right:0;top:5px;height:1.5px;
background:linear-gradient(90deg,var(--line) 0%,#2c5876 100%);}
.rail.solo::before{display:none;}
.stop{flex:1;min-width:0;position:relative;padding:16px 14px 0 0;}
.stop .dot{position:absolute;top:0;left:0;width:11px;height:11px;border-radius:50%;
background:var(--deep);border:2px solid #3a5f84;}
.stop.future .dot{border-color:var(--gold);box-shadow:0 0 10px rgba(255,199,44,.5);}
.stop .d{display:block;font-family:JBMono,monospace;font-size:12px;font-weight:500;
letter-spacing:.08em;color:#5f7390;}
.stop.future .d{color:var(--gold);}
.stop .l{display:block;font-size:12.5px;color:var(--mute);line-height:1.35;margin-top:3px;max-width:24ch;}
.stop.future .l{color:var(--body);}

/* ---------- about + footer ---------- */
.about{border-top:1px solid var(--line);margin-top:90px;padding-top:34px;font-size:15px;
color:var(--mute);max-width:660px;}
.about a{color:var(--blue);text-decoration:none;}
footer{margin-top:60px;display:flex;gap:14px;align-items:center;font-family:JBMono,monospace;
font-size:11.5px;color:#5a6d87;letter-spacing:.14em;flex-wrap:wrap;}
footer .polaris{width:13px;height:13px;}

/* ---------- reveal (only when JS runs; no-JS sees everything) ---------- */
html.js [data-reveal]{opacity:0;transform:translateY(18px);transition:opacity .7s ease,transform .7s ease;}
html.js [data-reveal].in{opacity:1;transform:none;}

@media (max-width:720px){
  .item{flex-direction:column;gap:16px;padding:24px 20px;}
  .doorcol{flex-direction:row;}
  .rail{flex-direction:column;gap:14px;}
  .rail::before{left:5px;right:auto;top:0;bottom:0;width:1.5px;height:auto;}
  .stop{padding:0 0 0 26px;}
  .maphero{margin:34px -12px 0;padding:0 12px;}
}
@media (prefers-reduced-motion:reduce){
  .veil{animation:none;}
  html.js [data-reveal]{opacity:1;transform:none;transition:none;}
  html{scroll-behavior:auto;}
}
"""

JS = """
(function(){
  var now = new Date(); now.setHours(0,0,0,0);
  document.querySelectorAll('[data-date]').forEach(function(el){
    var d = new Date(el.getAttribute('data-date') + 'T00:00:00');
    var days = Math.round((d - now) / 86400000);
    var t = days > 1 ? 'in ' + days + ' days' : days === 1 ? 'tomorrow'
          : days === 0 ? 'today' : 'window passed';
    el.textContent = t;
    if (days < 0) { el.classList.remove('days'); el.style.color = '#8da2be'; }
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, {rootMargin: '0px 0px -8% 0px'});
    document.querySelectorAll('[data-reveal]').forEach(function(el){ io.observe(el); });
  } else {
    document.querySelectorAll('[data-reveal]').forEach(function(el){ el.classList.add('in'); });
  }
})();
"""

POLARIS = ('<svg class="polaris" viewBox="-10 -10 20 20" aria-hidden="true">'
           '<path d="M0,-9 L2.2,-2.2 L9,0 L2.2,2.2 L0,9 L-2.2,2.2 L-9,0 L-2.2,-2.2 Z" fill="#ffc72c"/></svg>')

FAVICON = ("data:image/svg+xml," +
           "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-10 -10 20 20'%3E"
           "%3Cpath d='M0,-9 L2.2,-2.2 L9,0 L2.2,2.2 L0,9 L-2.2,2.2 L-9,0 L-2.2,-2.2 Z'"
           " fill='%23ffc72c'/%3E%3C/svg%3E")


def build(today, out_dir, site_url=None, domain=""):
    site_url = site_url or DEFAULT_SITE
    ledger = json.loads((REPO / "ledger/docket.json").read_text())
    items = ledger["items"]
    validate(items)

    live = [it for it in items if it["status"] in ("open-for-comment", "pending-decision", "watching")]
    done = [it for it in items if it["status"] in ("decided", "closed")]
    dated = sorted((it for it in live if next_date(it, today)),
                   key=lambda it: next_date(it, today)["date"])
    live_sorted = dated + [it for it in live if not next_date(it, today)]
    svg, mapcap = map_svg(live_sorted + done)
    cards = "".join(card_html(it, today) for it in dated[:6])
    live_html = "".join(item_html(it, today, n) for n, it in enumerate(live_sorted, 1))
    done_html = "".join(item_html(it, today, n) for n, it in enumerate(done, len(live_sorted) + 1))

    n_open = sum(1 for it in live if it["public_access"] == "open")
    nearest = next_date(dated[0], today) if dated else None
    stats = f"""<div class="statrow">
  <div class="stat"><div class="n">{len(live):02d}</div><div class="l">DECISIONS TRACKED</div></div>
  <div class="stat"><div class="n g">{n_open:02d}</div><div class="l">OPEN TO THE PUBLIC</div></div>
  {f'<div class="stat"><div class="n">{mon_day(nearest["date"])}</div><div class="l">NEXT DATE</div></div>' if nearest else ''}
</div>"""

    css = CSS_TEMPLATE.replace("GRAIN_URI", grain_data_uri() or "none")

    html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Alaska AI Docket</title>
<meta name="description" content="Every AI infrastructure decision in Alaska, tracked daily. Who decides, when it lands, and whether the public gets a say. Sources on every item.">
<meta property="og:title" content="The Alaska AI Docket">
<meta property="og:description" content="Every AI infrastructure decision in Alaska, tracked daily, with sources on every item.">
<meta property="og:type" content="website">
<meta property="og:url" content="{site_url}/">
<meta property="og:image" content="{site_url}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="{site_url}/">
<link rel="icon" href="{FAVICON}">
<style>{css}</style>
<script>document.documentElement.classList.add('js')</script>
</head>
<body>
<div class="sky"><div class="stars"></div><div class="veil v1"></div><div class="veil v2"></div><div class="veil v3"></div></div>
<div class="wrap">

<div class="brandrow">{POLARIS}<span>ALASKA.AI &middot; THE DOCKET</span>
<span class="upd">UPDATED {today.isoformat()}</span></div>

<h1>Who decides what AI builds in <em>Alaska</em></h1>
<p class="tag">Land leases, comment windows, utility votes and legislation, tracked every day
with a source on every fact. Gold marks a door the public can still walk through.</p>
{stats}

<div class="maphero">{svg}<div class="mapcap">{mapcap}</div></div>

<h2>Closing soon</h2>
<p class="sub">The nearest deadlines and votes. A pulsing pin on the map means a public
comment window is open right now.</p>
<div class="cards">{cards}</div>

<h2>The docket</h2>
<p class="sub">Access reads OPEN when a formal public comment or testimony path exists today,
INDIRECT when an elected or member-accountable body decides, CLOSED when the evaluation is private.</p>
{live_html}
{'<h2>Decided</h2>' + done_html if done_html else ''}

<div class="about" data-reveal>
<p>All sources verified against claims.</p>
</div>
<footer>{POLARIS}<span>ALASKA.AI &middot; UPDATED DAILY &middot; 64&#176;12'N 150&#176;00'W</span></footer>
</div>
<script>{JS}</script>
</body>
</html>"""

    bad = BANNED.findall(html)
    if bad:
        fail(f"banned punctuation in output: {bad[:8]}")

    out = REPO / out_dir
    out.mkdir(parents=True, exist_ok=True)
    (out / "index.html").write_text(html)
    (out / "docket.json").write_text(json.dumps(
        {"updated": today.isoformat(), "items": items}, indent=2))
    (out / ".nojekyll").write_text("")
    if domain:
        (out / "CNAME").write_text(domain + "\n")
    print(f"docket site -> {out/'index.html'} ({len(html)//1024} KB, "
          f"{len(items)} items, {len(dated)} with upcoming dates, {n_open} open to the public)")


def main():
    # This module is now the shared library (projection, docket components,
    # gates). The CLI delegates to site_build so a stale invocation can never
    # overwrite docs/ with the retired single-page layout.
    import site_build
    site_build.main()


if __name__ == "__main__":
    main()
