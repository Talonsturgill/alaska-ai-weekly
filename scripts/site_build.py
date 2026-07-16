#!/usr/bin/env python3
"""site_build.py builds the whole Alaska AI site into docs/ (GitHub Pages).

Pages: / (home), /docket/ (the tracker), /archive/ (every shipped deck),
/archive/<date>/ (deck detail with a swipeable gallery), /about/. Plus
sitemap.xml, robots.txt, and the public data feed docket.json (kept at the
root AND under /docket/ so shared links never break).

Data in: ledger/docket.json (tracker), runs/<date>/ (shipped decks: copy,
caption, reports; slide images referenced from raw.githubusercontent so
the site stays light). The daily routine runs this in Phase 11; docs/ is
committed with the run and Pages republishes on merge.

House gates carried over from docket_build: schema validation, date
checks, and a banned-punctuation refusal over every emitted page.

Alaskan identity, by design: the hero night sky is the state flag (the
Big Dipper and Polaris in gold), and a daylight telemetry chip computes
Anchorage's hours of daylight for the build date, including whether the
day is growing or shrinking. Flare with taste: CSS scroll-driven reveals
(compositor-only) with an IntersectionObserver fallback, one-line view
transitions between pages, a gold scroll-progress hairline, drifting
aurora, seeded grain. Zero dependencies, static files only.

  python scripts/site_build.py --date 2026-07-09 [--out docs] [--domain d]
"""

import argparse
import json
import math
import sys
from datetime import date as ddate, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import docket_build as db  # projection, validation, docket components, gates

REPO = Path(__file__).resolve().parents[1]
RAW = "https://raw.githubusercontent.com/Talonsturgill/alaskaaicarousels/main"
MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July",
              "August", "September", "October", "November", "December"]

esc = db.esc


# ---------- Anchorage daylight telemetry (NOAA-style approximation) ----------

def daylight_minutes(d, lat=61.2181):
    n = d.timetuple().tm_yday
    decl = -23.44 * math.cos(math.radians(360.0 / 365.0 * (n + 10)))
    x = -math.tan(math.radians(lat)) * math.tan(math.radians(decl))
    x = max(-1.0, min(1.0, x))
    return 2.0 * math.degrees(math.acos(x)) / 15.0 * 60.0


def daylight_chip(today):
    mins = daylight_minutes(today)
    delta = mins - daylight_minutes(today - timedelta(days=1))
    h, m = int(mins // 60), int(mins % 60)
    trend = "GAINING" if delta >= 0 else "LOSING"
    return (f"ANCHORAGE &middot; {h}H {m:02d}M OF DAYLIGHT &middot; "
            f"{trend} {abs(delta):.0f} MIN A DAY")


# ---------- the flag sky (Big Dipper + Polaris, gold on the night) ----------

def flag_sky():
    # eight stars of gold; centers scaled from the official flag geometry
    # (1416x1000, dipper handle top-left, bowl opening up toward Polaris)
    dipper = [(148, 181), (215, 206), (248, 241), (282, 278),
              (382, 314), (278, 331), (353, 356)]
    stars = "".join(
        f'<circle class="fstar" cx="{x}" cy="{y}" r="3.2" '
        f'style="animation-delay:{(i * 0.7) % 4:.1f}s"/>'
        for i, (x, y) in enumerate(dipper))
    polaris = ('<path class="fstar polaris" style="animation-delay:2.1s" '
               'transform="translate(520,96) scale(1.9)" '
               'd="M0,-9 L2.2,-2.2 L9,0 L2.2,2.2 L0,9 L-2.2,2.2 L-9,0 L-2.2,-2.2 Z"/>')
    return (f'<svg class="flagsky" viewBox="0 0 600 400" aria-hidden="true">'
            f"{stars}{polaris}</svg>")


# ---------- shared chrome ----------

def nav(prefix, active):
    links = [("", "HOME"), ("docket/", "THE DOCKET"),
             ("archive/", "ARCHIVE"), ("services/", "SERVICES"),
             ("about/", "ABOUT")]
    on = ' class="on"'
    a = "".join(
        f'<a href="{prefix}{href or "./"}"{on if key.lower().startswith(active) else ""}>{key}</a>'
        for href, key in links)
    return f"""<nav class="topnav">
  <a class="wordmark" href="{prefix}./">{db.POLARIS}<span>ALASKA.AI</span></a>
  <div class="navlinks">{a}</div>
</nav>"""


def subscribe_html():
    """Native signup form posting straight to Buttondown, styled to house."""
    return """<h2 data-reveal id="alerts">Deadline alerts, in your inbox</h2>
<p class="sub" data-reveal>One email when a public comment window opens or a decision is about
to land. Nothing else, ever. Unsubscribe any time.</p>
<form class="subscribe" data-reveal action="https://buttondown.com/api/emails/embed-subscribe/AlaskaAI"
method="post" target="_blank">
  <label class="vh" for="bd-email">Your email</label>
  <input type="email" name="email" id="bd-email" required placeholder="you@example.com"
  autocomplete="email">
  <button class="cta gold" type="submit">GET ALERTS</button>
</form>"""


def footer(prefix, today):
    return f"""<footer>
<div class="foot-grid">
  <div class="foot-brand">{db.POLARIS}<span>ALASKA.AI</span></div>
  <div class="foot-links">
    <a href="{prefix}docket/">THE DOCKET</a>
    <a href="{prefix}archive/">ARCHIVE</a>
    <a href="{prefix}services/">SERVICES</a>
    <a href="{prefix}about/">ABOUT</a>
    <a href="{prefix}docket.json">DATA</a>
  </div>
</div>
<div class="foot-line">BUILT IN THE NORTH &middot; UPDATED {today.isoformat()} &middot;
61&#176;13'N 149&#176;54'W &middot; EVERY FACT VERIFIED TO ITS SOURCE</div>
</footer>"""


SITE_CSS = """
:root{--night:#02060f;--deep:#050b16;--panel:#0a1626;--panel2:#0e2138;--line:#1c3350;
--snow:#f4f8ff;--body:#c3d2e6;--mute:#8da2be;--gold:#ffc72c;--halo:#ffda6e;
--green:#3ce6b4;--amber:#f2a43a;--blue:#5ac8f0;--violet:#9664e6;}
@font-face{font-family:Fraunces;src:url(FONTPREFIXfonts/fraunces.woff2) format("woff2");font-weight:100 900;font-display:swap;}
@font-face{font-family:JBMono;src:url(FONTPREFIXfonts/jbmono.woff2) format("woff2");font-weight:400;font-display:swap;}
@font-face{font-family:JBMono;src:url(FONTPREFIXfonts/jbmono-md.woff2) format("woff2");font-weight:500;font-display:swap;}
@font-face{font-family:Manrope;src:url(FONTPREFIXfonts/manrope.woff2) format("woff2");font-weight:200 800;font-display:swap;}
@view-transition{navigation:auto;}
*{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;overflow-x:clip;}
body{background:var(--night);color:var(--body);font-family:Manrope,system-ui,sans-serif;
line-height:1.55;overflow-x:clip;scrollbar-color:#1c3350 transparent;}
body::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:90;
background-image:url(GRAIN_URI);mix-blend-mode:overlay;opacity:.55;}
::selection{background:rgba(255,199,44,.25);}
::-webkit-scrollbar{width:11px;}
::-webkit-scrollbar-thumb{background:var(--panel2);border-radius:6px;border:3px solid var(--night);}
::-webkit-scrollbar-thumb:hover{background:#2c5876;}
a{color:inherit;}
:focus-visible{outline:2px solid var(--gold);outline-offset:3px;border-radius:4px;}
.skip{position:absolute;left:-9999px;top:0;z-index:100;background:var(--gold);color:#241a00;
font-family:JBMono,monospace;font-size:12px;letter-spacing:.1em;padding:10px 18px;border-radius:0 0 8px 0;}
.skip:focus{left:0;}

/* gold scroll progress hairline (scroll-driven, compositor only) */
@supports (animation-timeline: scroll()){
  body::before{content:"";position:fixed;top:0;left:0;right:0;height:2px;z-index:95;
  background:linear-gradient(90deg,var(--gold),var(--halo));transform-origin:0 50%;
  transform:scaleX(0);animation:progress linear both;animation-timeline:scroll(root);}
  @keyframes progress{to{transform:scaleX(1);}}
}

/* ---------- sky ---------- */
.sky{position:absolute;inset:0 0 auto 0;height:130vh;overflow:hidden;pointer-events:none;z-index:0;}
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
/* aurora curtains: banded light drifting sideways, faded toward the ground */
.curtain{position:absolute;inset:-14% 0 auto;height:96vh;mix-blend-mode:screen;
background:repeating-linear-gradient(97deg,transparent 0 5%,rgba(60,230,180,.22) 7% 9.5%,
rgba(60,230,180,.06) 11% 13%,transparent 15% 19%,rgba(90,200,240,.19) 21% 23.5%,
rgba(90,200,240,.05) 25% 27%,transparent 29% 34%,rgba(150,100,230,.13) 35% 37%,transparent 39% 45%);
background-size:220% 100%;filter:blur(16px);transform:skewY(-6deg);
-webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,1) 8%,rgba(0,0,0,.5) 46%,transparent 76%);
mask-image:linear-gradient(180deg,rgba(0,0,0,1) 8%,rgba(0,0,0,.5) 46%,transparent 76%);
animation:curtain 44s ease-in-out infinite alternate;}
.curtain.c2{transform:skewY(4deg);filter:blur(26px);opacity:.7;
background-size:260% 100%;animation-duration:58s;animation-direction:alternate-reverse;}
@keyframes curtain{from{background-position:0% 0;}to{background-position:100% 0;}}
/* a meteor, every so often */
.meteor{position:absolute;top:9vh;left:-8vw;width:120px;height:2px;border-radius:2px;
background:linear-gradient(90deg,transparent,rgba(223,241,255,.9) 65%,#fff);opacity:0;
transform:rotate(16deg);animation:meteor 7s linear infinite;animation-delay:3s;}
@keyframes meteor{0%,76%{opacity:0;transform:translate(0,0) rotate(16deg);}
78%{opacity:.9;}88%{opacity:0;transform:translate(64vw,20vh) rotate(16deg);}
100%{opacity:0;transform:translate(64vw,20vh) rotate(16deg);}}
.stars{position:absolute;inset:0;background-image:
radial-gradient(1px 1px at 12% 22%,rgba(244,248,255,.7),transparent 60%),
radial-gradient(1px 1px at 33% 8%,rgba(244,248,255,.5),transparent 60%),
radial-gradient(1.5px 1.5px at 56% 30%,rgba(244,248,255,.6),transparent 60%),
radial-gradient(1px 1px at 72% 12%,rgba(244,248,255,.5),transparent 60%),
radial-gradient(1px 1px at 88% 26%,rgba(244,248,255,.65),transparent 60%),
radial-gradient(1.5px 1.5px at 44% 16%,rgba(244,248,255,.4),transparent 60%),
radial-gradient(1px 1px at 22% 34%,rgba(244,248,255,.45),transparent 60%),
radial-gradient(1px 1px at 64% 6%,rgba(244,248,255,.55),transparent 60%),
radial-gradient(1.2px 1.2px at 80% 38%,rgba(244,248,255,.4),transparent 60%),
radial-gradient(1px 1px at 5% 10%,rgba(244,248,255,.5),transparent 60%);}
/* the flag: Big Dipper + Polaris, gold on the night */
.flagsky{position:absolute;right:2vw;top:5vh;width:min(46vw,560px);height:auto;opacity:.95;}
.fstar{fill:var(--gold);filter:drop-shadow(0 0 6px rgba(255,199,44,.55));
animation:twinkle 4s ease-in-out infinite;}
.fstar.polaris{filter:drop-shadow(0 0 12px rgba(255,199,44,.8));}
@keyframes twinkle{0%,100%{opacity:.75;}50%{opacity:1;}}

.wrap{position:relative;max-width:1120px;margin:0 auto;padding:0 24px 110px;z-index:1;}

/* ---------- nav (sticky, glass when scrolled) ---------- */
.topnav{position:sticky;top:0;z-index:80;display:flex;align-items:center;gap:20px;
padding:26px 0 14px;flex-wrap:wrap;}
.topnav::before{content:"";position:absolute;top:0;bottom:0;left:50%;width:100vw;
margin-left:-50vw;z-index:-1;opacity:0;
background:rgba(2,6,15,.78);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
border-bottom:1px solid rgba(28,51,80,.7);transition:opacity .35s;}
.topnav.scrolled::before{opacity:1;}
.wordmark{display:flex;align-items:center;gap:11px;font-family:JBMono,monospace;
font-size:15px;letter-spacing:.24em;color:var(--snow);text-decoration:none;font-weight:500;}
.wordmark .polaris{width:17px;height:17px;transition:transform .5s;}
.wordmark:hover .polaris{transform:rotate(90deg) scale(1.15);}
.navlinks{margin-left:auto;display:flex;gap:26px;font-family:JBMono,monospace;
font-size:12px;letter-spacing:.16em;}
.navlinks a{color:var(--mute);text-decoration:none;padding:6px 0;position:relative;}
.navlinks a::after{content:"";position:absolute;left:0;right:100%;bottom:2px;height:1.5px;
background:var(--gold);transition:right .25s ease;}
.navlinks a:hover{color:var(--snow);}
.navlinks a:hover::after{right:0;background:var(--blue);}
.navlinks a.on{color:var(--gold);}
.navlinks a.on::after{right:0;}

/* ---------- type ---------- */
h1{font-family:Fraunces,serif;font-weight:580;font-size:clamp(44px,7.4vw,92px);line-height:1.0;
letter-spacing:-.015em;color:var(--snow);}
h1 em{font-style:normal;color:var(--gold);}
h2{font-family:Fraunces,serif;font-weight:540;font-size:clamp(26px,3.6vw,36px);color:var(--snow);
margin:84px 0 8px;letter-spacing:-.01em;}
h2 a{text-decoration:none;}
.sub{color:var(--mute);font-size:15.5px;margin-bottom:26px;max-width:640px;}
.chip{font-family:JBMono,monospace;font-size:12px;letter-spacing:.09em;font-weight:500;}
.chip.days{color:var(--gold);}
.chip.kind{color:#6a7d97;}
.who{font-family:JBMono,monospace;font-size:11.5px;letter-spacing:.09em;color:var(--mute);}

/* ---------- hero (home) ---------- */
.hero{padding:11vh 0 0;min-height:74vh;}
html.js .heroanim > *{opacity:0;transform:translateY(22px);
animation:rise .85s cubic-bezier(.2,.7,.2,1) forwards;}
html.js .heroanim > *:nth-child(2){animation-delay:.1s;}
html.js .heroanim > *:nth-child(3){animation-delay:.22s;}
html.js .heroanim > *:nth-child(4){animation-delay:.34s;}
html.js .heroanim > *:nth-child(5){animation-delay:.46s;}
@keyframes rise{to{opacity:1;transform:none;}}
.daylight{display:inline-block;font-family:JBMono,monospace;font-size:12.5px;letter-spacing:.14em;
color:var(--gold);border:1px solid rgba(255,199,44,.35);border-radius:5px;padding:8px 14px;
background:rgba(14,33,56,.55);margin-bottom:34px;position:relative;overflow:hidden;}
.daylight::after{content:"";position:absolute;inset:0;transform:translateX(-130%) skewX(-18deg);
background:linear-gradient(105deg,transparent 30%,rgba(255,218,110,.16) 50%,transparent 70%);
animation:sweep 7s ease-in-out infinite;}
@keyframes sweep{0%,72%{transform:translateX(-130%) skewX(-18deg);}
88%,100%{transform:translateX(130%) skewX(-18deg);}}
.hero h1{max-width:12ch;}
.tag{font-size:clamp(17px,2.2vw,21px);max-width:600px;margin:28px 0 0;color:var(--body);}
.ctarow{display:flex;gap:16px;margin:40px 0 0;flex-wrap:wrap;}
.ctarow.act{margin-top:20px;}
.cta{font-family:JBMono,monospace;font-size:13px;letter-spacing:.12em;text-decoration:none;
padding:14px 22px;border-radius:6px;transition:transform .2s,box-shadow .2s,border-color .2s;
position:relative;overflow:hidden;display:inline-block;}
.cta:active{transform:translateY(0) scale(.98);}
.cta.gold{background:var(--gold);color:#241a00;font-weight:500;}
.cta.gold::after{content:"";position:absolute;inset:0;transform:translateX(-130%) skewX(-18deg);
background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.5) 50%,transparent 65%);
transition:transform .55s ease;}
.cta.gold:hover{transform:translateY(-2px);box-shadow:0 10px 34px rgba(255,199,44,.3);}
.cta.gold:hover::after{transform:translateX(130%) skewX(-18deg);}
.cta.ghost{border:1px solid var(--line);color:var(--body);}
.cta.ghost:hover{border-color:var(--blue);color:var(--snow);transform:translateY(-2px);}
.cta.sm{font-size:12px;padding:11px 18px;}
.statrow{display:flex;gap:34px;flex-wrap:wrap;margin:36px 0 0;font-family:JBMono,monospace;}
.stat .n{font-size:clamp(26px,3.4vw,38px);font-weight:500;color:var(--snow);font-variant-numeric:tabular-nums;}
.stat .n.g{color:var(--gold);text-shadow:0 0 22px rgba(255,199,44,.35);}
.stat .l{font-size:11.5px;letter-spacing:.18em;color:var(--mute);margin-top:2px;}

/* ---------- latest deck ---------- */
.latest{display:grid;grid-template-columns:minmax(260px,380px) 1fr;gap:44px;align-items:center;}
.cover{border-radius:12px;border:1px solid var(--line);overflow:hidden;display:block;
transition:transform .25s,box-shadow .25s;box-shadow:0 24px 70px rgba(0,0,0,.5);}
.cover img{width:100%;height:auto;display:block;aspect-ratio:1080/1350;}
.cover:hover{transform:translateY(-4px) rotate(-.4deg);box-shadow:0 30px 80px rgba(0,0,0,.65);}
.latest h3{font-family:Fraunces,serif;font-weight:540;font-size:clamp(24px,3vw,32px);
color:var(--snow);line-height:1.15;margin:12px 0 14px;}
.latest p{font-size:16.5px;max-width:56ch;}

/* ---------- cards (docket closing soon + archive) ---------- */
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
.badge{font-family:JBMono,monospace;font-size:11px;letter-spacing:.13em;font-weight:500;
padding:4px 10px;border-radius:4px;border:1px solid;display:inline-block;}
.b-open{color:var(--green);border-color:rgba(60,230,180,.5);background:rgba(60,230,180,.06);}
.b-indirect{color:var(--mute);border-color:rgba(141,162,190,.4);}
.b-closed{color:var(--amber);border-color:rgba(242,164,58,.5);background:rgba(242,164,58,.05);}

/* archive deck cards */
.deckgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:22px;}
.deck{background:linear-gradient(165deg,var(--panel) 0%,var(--deep) 100%);
border:1px solid var(--line);border-radius:14px;overflow:hidden;text-decoration:none;display:block;
transition:transform .25s,border-color .25s,box-shadow .25s;}
.deck:hover{transform:translateY(-4px);border-color:#2c5876;box-shadow:0 18px 54px rgba(0,0,0,.55);}
.deck img{width:100%;height:auto;display:block;border-bottom:1px solid var(--line);aspect-ratio:1080/1350;background:var(--panel);}
.deck .meta{padding:18px 20px 20px;}
.deck .meta h3{font-family:Fraunces,serif;font-weight:540;font-size:19px;color:var(--snow);line-height:1.25;}
.deck .meta .who{margin-top:10px;}

/* ---------- docket items ---------- */
.item{display:flex;gap:26px;background:linear-gradient(170deg,var(--panel) 0%,var(--deep) 88%);
border:1px solid var(--line);border-radius:14px;padding:30px 32px;margin-bottom:18px;
scroll-margin-top:96px;transition:border-color .3s,box-shadow .3s;}
.item:target{border-color:var(--gold);
box-shadow:0 0 0 1px rgba(255,199,44,.3),0 18px 70px rgba(0,0,0,.5);}
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
/* the TODAY tick on a timeline */
.stop.now{flex:0 0 auto;padding-right:26px;}
.stop.now .dot{width:9px;height:9px;top:1px;background:var(--gold);border-color:var(--gold);
box-shadow:0 0 12px rgba(255,199,44,.85);animation:heartbeat 2.4s ease-in-out infinite;}
.stop.now .d{color:var(--gold);letter-spacing:.2em;}
@keyframes heartbeat{0%,100%{box-shadow:0 0 6px rgba(255,199,44,.5);}
50%{box-shadow:0 0 16px rgba(255,199,44,.95);}}

/* ---------- map ---------- */
.maphero{margin:44px -24px 0;padding:10px 24px 6px;position:relative;}
.maphero svg{width:100%;height:auto;display:block;}
.maphero a{cursor:pointer;}
.maphero a circle{transition:stroke-width .2s;}
.maphero a:hover circle{stroke-width:4;}
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

/* ---------- deck detail gallery ---------- */
.gallery{display:flex;gap:18px;overflow-x:auto;scroll-snap-type:x mandatory;
padding:8px 4px 20px;scrollbar-width:thin;scrollbar-color:var(--line) transparent;}
.gallery img{width:min(74vw,430px);height:auto;border-radius:10px;border:1px solid var(--line);
scroll-snap-align:center;flex:none;box-shadow:0 16px 46px rgba(0,0,0,.45);
transition:transform .25s,border-color .25s;}
html.js .gallery img{cursor:zoom-in;}
html.js .gallery img:hover{transform:translateY(-3px);border-color:#2c5876;}
.galhint{font-family:JBMono,monospace;font-size:11.5px;letter-spacing:.14em;color:#5f7390;margin:4px 0 0;}
.galbar{display:none;align-items:center;gap:16px;margin-top:6px;font-family:JBMono,monospace;}
html.js .galbar{display:flex;}
.galbar .count{font-size:13px;letter-spacing:.18em;color:var(--mute);font-variant-numeric:tabular-nums;min-width:76px;}
.galbtn{width:42px;height:42px;border-radius:50%;border:1px solid var(--line);background:rgba(10,22,38,.7);
color:var(--body);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;
transition:border-color .2s,color .2s,transform .2s;}
.galbtn:hover{border-color:var(--gold);color:var(--gold);transform:translateY(-2px);}
.galbtn svg{width:16px;height:16px;}
pre.copy{white-space:pre-wrap;background:var(--panel);border:1px solid var(--line);
padding:22px 24px;border-radius:10px;font-family:JBMono,monospace;font-size:13.5px;
line-height:1.7;color:var(--body);overflow-x:auto;}

/* ---------- lightbox ---------- */
.lightbox{border:none;background:transparent;padding:0;max-width:none;max-height:none;
width:100vw;height:100dvh;display:none;align-items:center;justify-content:center;}
.lightbox[open]{display:flex;}
.lightbox::backdrop{background:rgba(2,6,15,.93);backdrop-filter:blur(8px);}
.lightbox img{max-height:86dvh;max-width:92vw;width:auto;border-radius:10px;
border:1px solid var(--line);box-shadow:0 30px 110px rgba(0,0,0,.8);}
.lightbox .lbbar{position:fixed;top:18px;left:0;right:0;display:flex;align-items:center;
justify-content:center;gap:18px;font-family:JBMono,monospace;color:var(--mute);}
.lightbox .lbbar .count{font-size:13px;letter-spacing:.2em;font-variant-numeric:tabular-nums;}
.lightbox .lbclose{position:fixed;top:16px;right:20px;}
.lightbox .lbprev{position:fixed;left:20px;top:50%;transform:translateY(-50%);}
.lightbox .lbnext{position:fixed;right:20px;top:50%;transform:translateY(-50%);}

/* ---------- how it works ---------- */
.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;}
.step{background:linear-gradient(165deg,var(--panel) 0%,var(--deep) 100%);
border:1px solid var(--line);border-radius:12px;padding:24px 26px;}
.step .k{font-family:JBMono,monospace;font-size:12px;letter-spacing:.16em;color:var(--gold);}
.step h3{font-family:Fraunces,serif;font-weight:540;font-size:21px;color:var(--snow);margin:10px 0 8px;}
.step p{font-size:14.5px;color:var(--mute);}

/* ---------- prose (about) ---------- */
.prose{max-width:660px;font-size:17px;}
.prose p{margin:18px 0;}
.prose a{color:var(--blue);text-decoration:none;border-bottom:1px solid rgba(90,200,240,.25);}

/* ---------- subscribe ---------- */
.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);}
.subscribe{display:flex;gap:12px;flex-wrap:wrap;max-width:560px;}
.subscribe input[type=email]{flex:1;min-width:230px;background:rgba(10,22,38,.85);
border:1px solid var(--line);border-radius:6px;padding:13px 16px;color:var(--snow);
font-family:JBMono,monospace;font-size:13.5px;letter-spacing:.03em;transition:border-color .2s;}
.subscribe input[type=email]::placeholder{color:#5f7390;}
.subscribe input[type=email]:focus{border-color:var(--gold);outline:none;}
.subscribe .cta{border:none;cursor:pointer;font-family:JBMono,monospace;}
.fineprint{font-family:JBMono,monospace;font-size:11px;color:#5a6d87;
letter-spacing:.08em;margin-top:14px;}
.fineprint a{color:var(--mute);text-decoration:none;border-bottom:1px solid rgba(141,162,190,.3);}
.fineprint a:hover{color:var(--snow);}

/* ---------- footer ---------- */
.about-line{border-top:1px solid var(--line);margin-top:90px;padding-top:34px;font-size:15px;
color:var(--mute);max-width:660px;}
footer{margin-top:70px;border-top:1px solid var(--line);padding-top:30px;}
.foot-grid{display:flex;gap:20px 40px;align-items:flex-start;flex-wrap:wrap;}
.foot-brand{display:flex;align-items:center;gap:12px;font-family:JBMono,monospace;
font-size:13px;letter-spacing:.22em;color:var(--snow);}
.foot-brand .polaris{width:15px;height:15px;}
.foot-links{margin-left:auto;display:flex;gap:22px;font-family:JBMono,monospace;
font-size:11.5px;letter-spacing:.14em;}
.foot-links a{color:var(--mute);text-decoration:none;transition:color .2s;}
.foot-links a:hover{color:var(--gold);}
.foot-line{margin-top:18px;font-family:JBMono,monospace;font-size:11px;color:#5a6d87;
letter-spacing:.14em;line-height:2;}

/* ---------- reveals: IO-driven, no-JS users see everything ---------- */
html.js [data-reveal]{opacity:0;transform:translateY(18px);transition:opacity .7s ease,transform .7s ease;}
html.js [data-reveal].in{opacity:1;transform:none;}
@media (max-width:720px){
  .item{flex-direction:column;gap:16px;padding:24px 20px;}
  .doorcol{flex-direction:row;}
  .rail{flex-direction:column;gap:14px;}
  .rail::before{left:5px;right:auto;top:0;bottom:0;width:1.5px;height:auto;}
  .stop{padding:0 0 0 26px;}
  .stop.now{padding:0 0 0 26px;}
  .maphero{margin:34px -12px 0;padding:0 12px;}
  .latest{grid-template-columns:1fr;}
  .flagsky{right:-4vw;top:2vh;width:70vw;opacity:.8;}
  .navlinks{gap:14px;font-size:10.5px;}
  .topnav{padding:18px 0 12px;}
  .lightbox .lbprev{left:8px;}
  .lightbox .lbnext{right:8px;}
  .foot-links{margin-left:0;flex-wrap:wrap;}
}
@media (prefers-reduced-motion:reduce){
  .veil,.fstar,.curtain,.meteor,.daylight::after,.stop.now .dot{animation:none;}
  html.js .heroanim > *{animation:none;opacity:1;transform:none;}
  .cta.gold::after{display:none;}
  html.js [data-reveal]{opacity:1;transform:none;transition:none;animation:none;}
  html{scroll-behavior:auto;}
  body::before{display:none;}
}
"""

JS = """
(function(){
  'use strict';
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* live countdowns: chips with data-date tick down to the start of that day */
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function tickChips(){
    var now = new Date();
    var mid = new Date(now); mid.setHours(0,0,0,0);
    document.querySelectorAll('[data-date]').forEach(function(el){
      var d = new Date(el.getAttribute('data-date') + 'T00:00:00');
      var days = Math.round((d - mid) / 86400000);
      var t;
      if (days < 0) { t = 'window passed'; el.classList.remove('days'); el.style.color = '#8da2be'; }
      else if (days === 0) { t = 'TODAY'; }
      else if (days > 14) { t = 'in ' + days + ' days'; }
      else {
        var ms = d - now, hh = Math.floor(ms / 3600000) % 24,
            mm = Math.floor(ms / 60000) % 60, ss = Math.floor(ms / 1000) % 60,
            dd = Math.floor(ms / 86400000);
        t = 'in ' + dd + 'd ' + pad(hh) + 'h ' + pad(mm) + 'm ' + pad(ss) + 's';
      }
      if (el.textContent !== t) el.textContent = t;
    });
  }
  tickChips();
  setInterval(tickChips, 1000);

  /* sticky nav turns to glass once the page moves */
  var nav = document.querySelector('.topnav');
  if (nav) {
    var onScroll = function(){ nav.classList.toggle('scrolled', scrollY > 30); };
    addEventListener('scroll', onScroll, {passive: true}); onScroll();
  }

  /* reveals */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, {rootMargin: '0px 0px -8% 0px'});
    document.querySelectorAll('[data-reveal]').forEach(function(el){ io.observe(el); });
  } else {
    document.querySelectorAll('[data-reveal]').forEach(function(el){ el.classList.add('in'); });
  }

  /* stat numbers count up when they enter the viewport */
  function countUp(el){
    var to = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (reduced || to === 0) { el.textContent = pad(to); return; }
    var t0 = null;
    function step(ts){
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / 900), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pad(Math.round(to * e));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
    }, {threshold: 0.6});
    document.querySelectorAll('[data-count]').forEach(function(el){ cio.observe(el); });
  } else {
    document.querySelectorAll('[data-count]').forEach(countUp);
  }

  /* deck gallery: counter, arrows, keyboard, lightbox */
  var gal = document.querySelector('.gallery');
  if (gal) {
    var imgs = Array.prototype.slice.call(gal.querySelectorAll('img'));
    var count = document.querySelector('.galbar .count');
    var cur = 0;
    function setCur(i){
      cur = Math.max(0, Math.min(imgs.length - 1, i));
      if (count) count.textContent = pad(cur + 1) + ' / ' + pad(imgs.length);
    }
    setCur(0);
    if ('IntersectionObserver' in window) {
      var gio = new IntersectionObserver(function(es){
        es.forEach(function(e){ if (e.isIntersecting) setCur(imgs.indexOf(e.target)); });
      }, {root: gal, threshold: 0.6});
      imgs.forEach(function(im){ gio.observe(im); });
    }
    function go(i){
      var im = imgs[Math.max(0, Math.min(imgs.length - 1, i))];
      if (im) im.scrollIntoView({behavior: reduced ? 'auto' : 'smooth', block: 'nearest', inline: 'center'});
    }
    var prev = document.querySelector('.galbar .prev'), next = document.querySelector('.galbar .next');
    if (prev) prev.addEventListener('click', function(){ go(cur - 1); });
    if (next) next.addEventListener('click', function(){ go(cur + 1); });

    var lb = document.querySelector('.lightbox');
    if (lb && lb.showModal) {
      var lbimg = lb.querySelector('img'), lbcount = lb.querySelector('.count'), li = 0;
      function show(i){
        li = (i + imgs.length) % imgs.length;
        lbimg.src = imgs[li].src;
        lbimg.alt = imgs[li].alt;
        if (lbcount) lbcount.textContent = pad(li + 1) + ' / ' + pad(imgs.length);
      }
      imgs.forEach(function(im, i){
        im.addEventListener('click', function(){ show(i); lb.showModal(); });
      });
      lb.querySelector('.lbclose').addEventListener('click', function(){ lb.close(); });
      lb.querySelector('.lbprev').addEventListener('click', function(){ show(li - 1); });
      lb.querySelector('.lbnext').addEventListener('click', function(){ show(li + 1); });
      lb.addEventListener('click', function(e){ if (e.target === lb) lb.close(); });
      addEventListener('keydown', function(e){
        if (!lb.open) return;
        if (e.key === 'ArrowLeft') show(li - 1);
        if (e.key === 'ArrowRight') show(li + 1);
      });
    }
  }
})();
"""


def page(title, desc, body, prefix, active, today, site_url, path, og_image="og.png",
         og_size=(1200, 630), ld=None):
    css = SITE_CSS.replace("FONTPREFIX", prefix).replace("GRAIN_URI", db.grain_data_uri() or "none")
    canonical = f"{site_url}/{path}"
    og_url = og_image if og_image.startswith("http") else f"{site_url}/{og_image}"
    ld_html = (f'<script type="application/ld+json">{json.dumps(ld, separators=(",", ":"))}</script>'
               if ld else "")
    preload = "".join(
        f'<link rel="preload" href="{prefix}fonts/{f}" as="font" type="font/woff2" crossorigin>'
        for f in ("fraunces.woff2", "manrope.woff2", "jbmono-md.woff2"))
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="theme-color" content="#02060f">
<meta property="og:site_name" content="Alaska AI">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{og_url}">
<meta property="og:image:width" content="{og_size[0]}">
<meta property="og:image:height" content="{og_size[1]}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="{canonical}">
<link rel="icon" href="{db.FAVICON}">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
{preload}
{ld_html}
<style>{css}</style>
<script>document.documentElement.classList.add('js')</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="sky"><div class="stars"></div><div class="curtain"></div><div class="curtain c2"></div>{flag_sky() if active in ('home', 'services') else ''}
<div class="veil v1"></div><div class="veil v2"></div><div class="veil v3"></div>
<div class="meteor"></div></div>
<div class="wrap">
{nav(prefix, active)}
<main id="main">
{body}
</main>
{footer(prefix, today)}
</div>
<script>{JS}</script>
</body>
</html>"""


# ---------- data loading ----------

def load_docket(today):
    ledger = json.loads((REPO / "ledger/docket.json").read_text())
    items = ledger["items"]
    db.validate(items)
    live = [it for it in items if it["status"] in ("open-for-comment", "pending-decision", "watching")]
    done = [it for it in items if it["status"] in ("decided", "closed")]
    dated = sorted((it for it in live if db.next_date(it, today)),
                   key=lambda it: db.next_date(it, today)["date"])
    live_sorted = dated + [it for it in live if not db.next_date(it, today)]
    return items, live, done, dated, live_sorted


def load_runs():
    out = []
    for d in sorted((REPO / "runs").iterdir(), reverse=True):
        if not d.is_dir():
            continue
        try:
            copy = json.loads((d / "copy.json").read_text())
            asm = json.loads((d / "assemble_report.json").read_text())
            caption = (d / "caption.txt").read_text().strip()
        except Exception:
            continue
        out.append({
            "date": d.name,
            # house style bans colons on the page; titled decks read fine with a comma
            "title": copy.get("document_title", d.name).replace(": ", ", "),
            "hook": caption.split("\n")[0].strip(),
            "caption": caption,
            "first_comment": copy.get("first_comment", ""),
            "slides": asm.get("slides", 0),
            "pdf_mb": asm.get("pdf_mb", 0),
        })
    return out


def pretty_date(iso):
    d = ddate.fromisoformat(iso)
    return f"{MONTH_FULL[d.month - 1]} {d.day}, {d.year}"


# ---------- pages ----------

def home_page(today, site_url, docket, runs):
    items, live, done, dated, live_sorted = docket
    n_open = sum(1 for it in live if it["public_access"] == "open")
    nearest = db.next_date(dated[0], today) if dated else None
    latest = runs[0] if runs else None

    stats = f"""<div class="statrow">
  <div class="stat"><div class="n" data-count="{len(runs)}">{len(runs):02d}</div><div class="l">DECKS SHIPPED</div></div>
  <div class="stat"><div class="n" data-count="{len(live)}">{len(live):02d}</div><div class="l">DECISIONS TRACKED</div></div>
  <div class="stat"><div class="n g" data-count="{n_open}">{n_open:02d}</div><div class="l">DOORS OPEN TO YOU</div></div>
</div>"""

    latest_html = ""
    if latest:
        cover = f"{RAW}/runs/{latest['date']}/slide-01.png"
        latest_html = f"""<h2 data-reveal>The latest deck</h2>
<p class="sub" data-reveal>One verified Alaska and AI story a day, drawn as a swipeable carousel.</p>
<div class="latest" data-reveal>
  <a class="cover" href="archive/{latest['date']}/"><img src="{cover}" width="1080" height="1350" alt="{esc(latest['title'])} cover slide" loading="lazy"></a>
  <div>
    <div class="chip kind">{esc(pretty_date(latest['date'])).upper()} &middot; {latest['slides']} SLIDES</div>
    <h3>{esc(latest['title'])}</h3>
    <p>{esc(latest['hook'])}</p>
    <div class="ctarow"><a class="cta ghost" href="archive/{latest['date']}/">SWIPE THE DECK</a>
    <a class="cta ghost" href="archive/">EVERY DECK</a></div>
  </div>
</div>"""

    cards = "".join(db.card_html(it, today, prefix="docket/") for it in dated[:3])
    closing = f"""<h2 data-reveal><a href="docket/">The docket</a></h2>
<p class="sub" data-reveal>Every AI infrastructure decision in Alaska, tracked daily with a source on
every fact. Gold means a door is open to the public right now.</p>
<div class="cards">{cards}</div>
<div class="ctarow" data-reveal><a class="cta gold" href="docket/">OPEN THE FULL DOCKET</a></div>"""

    steps = """<h2 data-reveal>The house rules</h2>
<p class="sub" data-reveal>Alaska AI works the state's AI beat the way a newsroom would.
These rules never bend.</p>
<div class="steps">
  <div class="step" data-reveal><div class="k">01 &middot; RESEARCHED</div><h3>Six beats, every day</h3>
  <p>Power and compute, research and Indigenous AI, the field, policy and money, robotics, and what
  Alaskans are actually saying.</p></div>
  <div class="step" data-reveal><div class="k">02 &middot; VERIFIED</div><h3>Claims or it did not happen</h3>
  <p>Every number and quote is re-fetched from a primary source before it can appear on a slide,
  the docket, or this site.</p></div>
  <div class="step" data-reveal><div class="k">03 &middot; DRAWN</div><h3>Art from code, daily</h3>
  <p>Each deck's artwork is written as fresh code, seeded and reviewed pixel by pixel. No two decks
  alike, by rule.</p></div>
</div>"""

    next_line = ""
    if nearest and dated:
        next_line = (f"Next on the docket is {esc(dated[0]['title'])}, "
                     f"{esc(pretty_date(nearest['date']))}. ")
    body = f"""<div class="hero heroanim">
<div><div class="daylight">{daylight_chip(today)}</div></div>
<h1>AI is coming <em>north</em></h1>
<p class="tag">Alaska AI watches it happen. Every deal, docket and decision on the state's
AI beat, verified to the source and told for Alaskans. From the Slope to Southeast, daily.</p>
<div class="ctarow">
  <a class="cta gold" href="docket/">THE DOCKET</a>
  <a class="cta ghost" href="archive/">THE DECKS</a>
</div>
{stats}
</div>
{latest_html}
{closing}
{steps}
{subscribe_html()}
<div class="about-line" data-reveal><p>{next_line}All sources verified against claims.</p></div>"""
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "NewsMediaOrganization", "@id": f"{site_url}/#org", "name": "Alaska AI",
         "url": f"{site_url}/", "logo": f"{site_url}/og.png",
         "description": "The daily publication on Alaska's AI beat, verified to the source."},
        {"@type": "WebSite", "url": f"{site_url}/", "name": "Alaska AI",
         "publisher": {"@id": f"{site_url}/#org"}}]}
    return page("Alaska AI", "The daily publication on Alaska's AI beat. Verified stories, "
                "a public docket of every AI infrastructure decision, and bespoke data art. "
                "Built by and for Alaskans.", body, "", "home", today, site_url, "", ld=ld)


def docket_page(today, site_url, docket):
    items, live, done, dated, live_sorted = docket
    svg, mapcap = db.map_svg(live_sorted + done)
    n_open = sum(1 for it in live if it["public_access"] == "open")
    nearest = db.next_date(dated[0], today) if dated else None
    cards = "".join(db.card_html(it, today) for it in dated[:6])
    live_html = "".join(db.item_html(it, today, n) for n, it in enumerate(live_sorted, 1))
    done_html = "".join(db.item_html(it, today, n) for n, it in enumerate(done, len(live_sorted) + 1))
    stats = f"""<div class="statrow">
  <div class="stat"><div class="n">{len(live):02d}</div><div class="l">DECISIONS TRACKED</div></div>
  <div class="stat"><div class="n g">{n_open:02d}</div><div class="l">OPEN TO THE PUBLIC</div></div>
  {f'<div class="stat"><div class="n">{db.mon_day(nearest["date"])}</div><div class="l">NEXT DATE</div></div>' if nearest else ''}
</div>"""
    body = f"""<div class="hero" style="min-height:auto;padding-top:9vh">
<h1>The Alaska AI <em>Docket</em></h1>
<p class="tag">Every AI infrastructure decision in Alaska, tracked daily. Who decides,
when it lands, and whether the public gets a say. Sources on every item.</p>
{stats}
</div>
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
{subscribe_html()}
<div class="about-line" data-reveal><p>All sources verified against claims.
The data behind this page is public at <a href="../docket.json" style="color:var(--blue);text-decoration:none">docket.json</a>.</p></div>"""
    ld = {"@context": "https://schema.org", "@type": "Dataset",
          "name": "The Alaska AI Docket",
          "description": "Every AI infrastructure decision in Alaska. Land leases, comment "
                         "windows, utility votes and legislation, with deciders, deadlines "
                         "and public access, sourced and updated daily.",
          "url": f"{site_url}/docket/", "dateModified": today.isoformat(),
          "creator": {"@type": "Organization", "name": "Alaska AI", "url": f"{site_url}/"},
          "distribution": [{"@type": "DataDownload", "encodingFormat": "application/json",
                            "contentUrl": f"{site_url}/docket.json"}]}
    return page("The Alaska AI Docket", "Every AI infrastructure decision in Alaska, tracked daily. "
                "Who decides, when it lands, and whether the public gets a say.",
                body, "../", "the docket", today, site_url, "docket/",
                og_image="og-docket.png", ld=ld)


def archive_page(today, site_url, runs):
    decks = "".join(
        f"""<a class="deck" href="{r['date']}/" data-reveal>
  <img src="{RAW}/runs/{r['date']}/slide-01.png" width="1080" height="1350" alt="{esc(r['title'])} cover" loading="lazy">
  <div class="meta"><h3>{esc(r['title'])}</h3>
  <div class="who">{esc(pretty_date(r['date'])).upper()} &middot; {r['slides']} SLIDES</div></div>
</a>""" for r in runs)
    body = f"""<div class="hero" style="min-height:auto;padding-top:9vh">
<h1>The <em>archive</em></h1>
<p class="tag">Every deck we have shipped, one verified Alaska and AI story at a time.
Newest first.</p>
</div>
<div class="deckgrid" style="margin-top:44px">{decks}</div>"""
    return page("Archive - Alaska AI", "Every carousel Alaska AI has published. Verified stories "
                "about Alaska and AI, drawn as bespoke data art.",
                body, "../", "archive", today, site_url, "archive/")


def sources_text(first_comment):
    """The first_comment is written for LinkedIn: a 'Sources:' label up top
    and a reply call-to-action at the bottom. On the site the H2 already says
    Sources and there is nothing to reply to, so trim both."""
    lines = [l.rstrip() for l in first_comment.strip().split("\n")]
    if lines and lines[0].strip().lower().rstrip(":") == "sources":
        lines = lines[1:]
    while lines and "http" not in lines[-1]:
        lines.pop()  # trailing CTA lines; every citation ends in its URL
    while lines and not lines[0].strip():
        lines = lines[1:]
    # house style bans colons; give each citation's URL its own line instead
    return "\n".join(lines).replace(": http", "\nhttp")


CHEV_L = ('<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">'
          '<path d="M10.5 2.5 5 8l5.5 5.5" stroke="currentColor" stroke-width="1.8" '
          'stroke-linecap="round" stroke-linejoin="round"/></svg>')
CHEV_R = ('<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">'
          '<path d="M5.5 2.5 11 8l-5.5 5.5" stroke="currentColor" stroke-width="1.8" '
          'stroke-linecap="round" stroke-linejoin="round"/></svg>')
CROSS = ('<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">'
         '<path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="1.8" '
         'stroke-linecap="round"/></svg>')


def deck_page(today, site_url, r):
    slides = "".join(
        f'<img src="{RAW}/runs/{r["date"]}/slide-{i:02d}.png" width="1080" height="1350" '
        f'alt="Slide {i} of {r["slides"]}"'
        + (' fetchpriority="high"' if i == 1 else ' loading="lazy"') + '>'
        for i in range(1, r["slides"] + 1))
    srcs = esc(sources_text(r["first_comment"]))
    body = f"""<div class="hero" style="min-height:auto;padding-top:9vh">
<div class="chip kind">{esc(pretty_date(r['date'])).upper()} &middot; {r['slides']} SLIDES</div>
<h1 style="font-size:clamp(34px,5vw,60px);margin-top:14px">{esc(r['title'])}</h1>
<p class="tag">{esc(r['hook'])}</p>
</div>
<h2>The deck</h2>
<p class="galhint">SWIPE, SCROLL OR CLICK A SLIDE TO GO FULLSCREEN &middot; {r['slides']} SLIDES</p>
<div class="gallery">{slides}</div>
<div class="galbar">
  <button class="galbtn prev" aria-label="Previous slide">{CHEV_L}</button>
  <span class="count">01 / {r['slides']:02d}</span>
  <button class="galbtn next" aria-label="Next slide">{CHEV_R}</button>
</div>
<dialog class="lightbox" aria-label="Slide viewer">
  <div class="lbbar"><span class="count">01 / {r['slides']:02d}</span></div>
  <img src="" alt="">
  <button class="galbtn lbprev" aria-label="Previous slide">{CHEV_L}</button>
  <button class="galbtn lbnext" aria-label="Next slide">{CHEV_R}</button>
  <button class="galbtn lbclose" aria-label="Close">{CROSS}</button>
</dialog>
<div class="ctarow" data-reveal>
  <a class="cta gold" href="{RAW}/runs/{r['date']}/carousel.pdf">DOWNLOAD THE PDF ({r['pdf_mb']} MB)</a>
  <a class="cta ghost" href="../">EVERY DECK</a>
</div>
<h2 data-reveal>Sources</h2>
<pre class="copy" data-reveal>{srcs}</pre>"""
    ld = {"@context": "https://schema.org", "@type": "NewsArticle",
          "headline": r["title"], "datePublished": r["date"],
          "image": f"{RAW}/runs/{r['date']}/slide-01.png",
          "url": f"{site_url}/archive/{r['date']}/",
          "publisher": {"@type": "Organization", "name": "Alaska AI", "url": f"{site_url}/"},
          "author": {"@type": "Organization", "name": "Alaska AI"}}
    return page(f"{r['title']} - Alaska AI", r["hook"][:150],
                body, "../../", "archive", today, site_url, f"archive/{r['date']}/",
                og_image=f"{RAW}/runs/{r['date']}/slide-01.png", og_size=(1080, 1350), ld=ld)


def services_page(today, site_url):
    """The services tab. AI partnership for Alaska businesses, framed in
    labor language (digital employees, the digital crew), entered through
    The Field Study. Copy obeys the house gates like every other page."""
    apply_mail = ("mailto:docket@alaskaaihq.com?subject=Field%20Study%20application"
                  "&body=Business%20name%20-%20%0AWhere%20in%20Alaska%20-%20%0A"
                  "What%20the%20work%20is%20-%20%0AWhat%20AI%20should%20take%20off%20your%20plate%20-%20%0A"
                  "What%20you%20have%20tried%20so%20far%20-%20%0ABudget%20range%20-%20")

    stats = """<div class="statrow">
  <div class="stat"><div class="n"><span data-count="88">88</span>%</div><div class="l">OF ORGANIZATIONS USE AI</div></div>
  <div class="stat"><div class="n"><span data-count="6">06</span>%</div><div class="l">CAPTURE REAL VALUE</div></div>
  <div class="stat"><div class="n g"><span data-count="20">20</span>+</div><div class="l">SYSTEMS SHIPPED BY THIS DESK</div></div>
</div>"""

    range_steps = """<h2 data-reveal>From one task to a full digital crew</h2>
<p class="sub" data-reveal>Whatever the work is, if it happens on a screen it can probably be
built. Bring us a specific ask or let the Field Study find the highest payers.</p>
<div class="steps" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">
  <div class="step" data-reveal><div class="k">01 &middot; ANSWER</div><h3>Voice and chat agents</h3>
  <p>Every call answered and every job booked, at 2 am in January and in the July rush.
  A front desk that never calls in sick.</p></div>
  <div class="step" data-reveal><div class="k">02 &middot; RETRIEVE</div><h3>Assistants that know your files</h3>
  <p>Twenty years of contracts, permits and procedures, answering questions with the source
  attached. Institutional memory, on demand.</p></div>
  <div class="step" data-reveal><div class="k">03 &middot; AUTOMATE</div><h3>Workflows that run themselves</h3>
  <p>Invoicing, scheduling, data entry, reporting. The busywork moves on its own and your
  people do the work that needs a person.</p></div>
  <div class="step" data-reveal><div class="k">04 &middot; DRAFT</div><h3>The paperwork engine</h3>
  <p>Proposals, RFP responses, permits and compliance filings, drafted in hours instead of
  weeks. Built for the paperwork state.</p></div>
  <div class="step" data-reveal><div class="k">05 &middot; EMPLOY</div><h3>Digital employees</h3>
  <p>The hire you could not make. A named agent with a real job description, working whole
  systems end to end, on shift around the clock.</p></div>
  <div class="step" data-reveal><div class="k">06 &middot; CONNECT</div><h3>The digital crew</h3>
  <p>Connected agents running the back office together, a working model of your operation.
  This is the ceiling, and this desk has built it before.</p></div>
</div>"""

    tiers = f"""<h2 data-reveal>Three ways in</h2>
<p class="sub" data-reveal>Every engagement starts with the truth about your operation and
ends with something you own. Prices are where the work starts, scoped in the open.</p>
<div class="item a-open" id="field-study" data-reveal>
  <div class="body">
    <div class="top"><span class="chip days">FROM $2,500</span><span class="chip kind">1 TO 2 WEEKS &middot; THE FLAGSHIP</span></div>
    <h3>The Field Study</h3>
    <p>Deep discovery, run like our reporting. We study your operation from the inside and
    your industry and competitors from the outside, then hand you a ranked map of where AI
    actually pays in your business and a working prototype of the best bet. Most firms sell
    a slide deck at this stage. The prototype comes standard here.</p>
    <div class="access">If the honest answer is that AI does not pay in your business yet,
    that is the answer you get. The desk that verifies every claim on the docket does not
    sell systems that do not pay.</div>
  </div>
</div>
<div class="item" data-reveal>
  <div class="body">
    <div class="top"><span class="chip days">FROM $6,000</span><span class="chip kind">FIRST SYSTEM TYPICALLY LIVE INSIDE A MONTH</span></div>
    <h3>The Build</h3>
    <p>Whatever the Field Study surfaces, or whatever you already know you want. Shipped to
    production behind real quality gates, then improved on a schedule. Every build ends with
    a model you own, trained on your work, so costs fall over time instead of climbing.</p>
  </div>
</div>
<div class="item" data-reveal>
  <div class="body">
    <div class="top"><span class="chip days">FROM $6,000 A MONTH</span><span class="chip kind">ONGOING</span></div>
    <h3>The Partnership</h3>
    <p>An embedded engineer plus standing AI leadership, for owners who want to win the AI
    front of their industry without becoming engineers. We work inside your business, keep
    every system on the best model for the job, train models you own outright, and stay on
    the hook for the outcome, not the deliverable.</p>
  </div>
</div>"""

    headcount = """<h2 data-reveal>Cut once, correctly</h2>
<p data-reveal>Some businesses are weighing AI against headcount. Few say it out loud, and
fewer have anywhere honest to think it through. The record so far argues for care. Klarna
shrank its human support behind an AI assistant, then went back to hiring people when
quality slipped. Commonwealth Bank cut 45 service roles for a chatbot, then admitted the
roles were not redundant and offered them back. Ford brought back more than 350 veteran
engineers after AI inspection kept missing defects. Gartner now predicts half the companies
that cut staff over AI will be rehiring for the same work by 2027.</p>
<p data-reveal>The Field Study maps which work AI can genuinely absorb and which it will
fail at, before anyone's job is on the line. If you are going to restructure around AI, do
it once, correctly, with evidence.</p>"""

    receipts = """<h2 data-reveal>The shop runs on what it sells</h2>
<p class="sub" data-reveal>You are not the test case. The systems we sell are the systems
we already run.</p>
<div class="steps">
  <div class="step" data-reveal><div class="k">01 &middot; IN PUBLIC</div><h3>This site is the portfolio</h3>
  <p>The deck that ships every morning is researched, drawn, reviewed and delivered by our
  own autonomous studio. You are reading the proof of work right now.</p></div>
  <div class="step" data-reveal><div class="k">02 &middot; IN PRODUCTION</div><h3>Twenty plus systems, running now</h3>
  <p>Content engines, event pipelines, comment agents, analytics loops and multi-agent
  systems built for Lower 48 companies, including a fintech and a national AI consultancy,
  all behind quality gates and approval steps.</p></div>
  <div class="step" data-reveal><div class="k">03 &middot; SELF IMPROVING</div><h3>The machine upgrades itself</h3>
  <p>After every run our studio studies what hurt and ships fixes to its own machinery.
  Client systems get the same habit, so what you own gets better every month.</p></div>
</div>"""

    body = f"""<div class="hero heroanim">
<div><div class="daylight">{daylight_chip(today)}</div></div>
<h1>Put AI to <em>work</em></h1>
<p class="tag">Alaska AI reads the state's AI beat every morning. The rest of the day, this
desk builds AI systems for Alaska businesses. Digital employees for the jobs you cannot
fill, paperwork engines for the filings that never stop, and straight answers about what
pays and what does not.</p>
<div class="ctarow">
  <a class="cta gold" href="#apply">SEE WHAT PAYS</a>
  <a class="cta ghost" href="#field-study">THE FIELD STUDY</a>
</div>
{stats}
</div>
<h2 data-reveal>Most AI projects do not pay. The winners share one habit.</h2>
<p data-reveal>Stanford's 2026 AI Index counts 88% of organizations using AI. McKinsey's
latest survey finds about 6% getting real bottom line value from it, and those winners are
three times more likely to have redesigned how the work is done than to have bought a
smarter tool. Goldman Sachs polled 1,256 small businesses this spring. 76% use AI, 14% have
it wired into daily operations, and 73% say they need help getting there.</p>
<p data-reveal>That gap is not a technology problem. It is an execution problem, and closing
it is the job. We find the places AI genuinely pays in your operation, build them into
production, and keep improving them for as long as they run.</p>
{range_steps}
{tiers}
{headcount}
{receipts}
<h2 data-reveal>Built for the businesses that run this state</h2>
<p data-reveal>Lodges and outfitters from Talkeetna to Southeast. Clinics and elder care in
the Valley. Processors in Kodiak and Dutch Harbor. Native corporations with a proposal desk
and a federal deadline. Contractors, utilities, and the shops that keep them all supplied.
If you already know what you want built, bring it. If you only know that AI matters and you
do not want to become an engineer to win with it, you are exactly who this desk works for.</p>
<h2 data-reveal id="apply">See what pays</h2>
<p class="sub" data-reveal>Send five plain lines about your operation. You get a straight
read on whether the Field Study fits, and a no costs you nothing.</p>
<div class="ctarow act" data-reveal>
  <a class="cta gold" href="{apply_mail}">SEE WHAT PAYS</a>
  <a class="cta ghost" href="../archive/">READ THE DAILY BEAT</a>
</div>
<p class="fineprint" data-reveal>No pitch deck, no drip campaign. One reply, from the same
desk that writes the deck.</p>
<div class="about-line" data-reveal><p>Prices are starting points, scoped in the open before
any work begins. The docket stays free. The deck ships daily either way.</p></div>"""

    ld = {"@context": "https://schema.org", "@type": "ProfessionalService",
          "name": "Alaska AI", "url": f"{site_url}/services/",
          "areaServed": {"@type": "State", "name": "Alaska"},
          "description": "AI systems built in Alaska for Alaska businesses. Digital "
                         "employees, paperwork engines and embedded AI partnership from "
                         "the desk behind the state's daily AI beat.",
          "makesOffer": [
              {"@type": "Offer", "name": "The Field Study",
               "description": "Deep discovery inside your operation and across your "
                              "industry, with a ranked roadmap and a working prototype.",
               "priceSpecification": {"@type": "PriceSpecification", "minPrice": 2500,
                                      "priceCurrency": "USD"}},
              {"@type": "Offer", "name": "The Build",
               "description": "Production AI systems, from voice agents to digital "
                              "employees, each ending in a model the client owns.",
               "priceSpecification": {"@type": "PriceSpecification", "minPrice": 6000,
                                      "priceCurrency": "USD"}},
              {"@type": "Offer", "name": "The Partnership",
               "description": "An embedded AI engineer plus standing AI leadership, "
                              "monthly.",
               "priceSpecification": {"@type": "PriceSpecification", "minPrice": 6000,
                                      "priceCurrency": "USD"}}]}
    return page("Services - Alaska AI", "AI systems built in Alaska for Alaska businesses. "
                "Digital employees, paperwork engines and embedded AI partnership from the "
                "desk behind the state's daily AI beat. The Field Study from $2,500.",
                body, "../", "services", today, site_url, "services/", ld=ld)


def about_page(today, site_url):
    body = f"""<div class="hero" style="min-height:auto;padding-top:9vh">
<h1>Built in the <em>North</em></h1>
</div>
<div class="prose" data-reveal>
<p>Alaska AI is a daily publication about the biggest technology shift of our
lifetimes, told from the only place we would tell it from. AI is arriving in
Alaska the way pipelines and railroads once did, as land leases, gas
contracts, utility votes and federal solicitations. Alaskans deserve to see
it coming, in plain English, with receipts.</p>
<p>Every day Alaska AI works six beats across the state, from power and
compute to policy and money to what Alaskans are actually saying. Every
claim is verified against a fetched primary source before it appears
anywhere, and every deck's artwork is drawn fresh for its story. The same
desk maintains <a href="../docket/">the Alaska AI Docket</a>, a public
tracker of every AI infrastructure decision in the state and whether the
public gets a say in it.</p>
<p>Some rules never bend. Every fact carries a verified claim. No topic
repeats. No two decks look alike.</p>
<p>Find the decks daily on LinkedIn under Alaska AI.</p>
</div>"""
    return page("About - Alaska AI", "Alaska AI is a daily publication on Alaska's AI beat, "
                "built in the North and verified to the source.",
                body, "../", "about", today, site_url, "about/")


def not_found_page(today, site_url):
    body = """<div class="hero" style="min-height:56vh;padding-top:12vh">
<div class="chip kind">404</div>
<h1 style="margin-top:14px">Off the <em>trail</em></h1>
<p class="tag">This page does not exist, or it moved when the ice went out.
The stars will get you home.</p>
<div class="ctarow">
  <a class="cta gold" href="/">BACK HOME</a>
  <a class="cta ghost" href="/docket/">THE DOCKET</a>
  <a class="cta ghost" href="/archive/">THE DECKS</a>
</div>
</div>"""
    return page("Page not found - Alaska AI",
                "That page does not exist. The stars will get you home.",
                body, "/", "none", today, site_url, "404.html")


def touch_icon(out):
    """A 180px gold Polaris on the night, for phone home screens."""
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        return
    s = 180
    im = Image.new("RGB", (s, s), (2, 6, 15))
    dr = ImageDraw.Draw(im)
    cx, cy, R, r = s / 2, s / 2, 62, 15
    pts = []
    for i in range(8):
        a = math.pi / 2 * (i / 2.0) - math.pi / 2
        rad = R if i % 2 == 0 else r
        pts.append((cx + rad * math.cos(a), cy + rad * math.sin(a)))
    for gr, col in ((1.5, (80, 62, 10)), (1.18, (166, 130, 26)), (1.0, (255, 199, 44))):
        glow = [(cx + (x - cx) * gr, cy + (y - cy) * gr) for x, y in pts]
        dr.polygon(glow, fill=col)
    im.save(out / "apple-touch-icon.png", optimize=True)


def sitemap(site_url, runs):
    urls = ["", "docket/", "archive/", "services/", "about/"] + [f"archive/{r['date']}/" for r in runs]
    entries = "".join(f"<url><loc>{site_url}/{u}</loc></url>" for u in urls)
    return ('<?xml version="1.0" encoding="UTF-8"?>'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
            f"{entries}</urlset>")


# ---------- build ----------

def prose_colon_gate(rel, html):
    """House style bans colons in visible copy (clock times like 4:30 and
    URLs are not prose and pass). Fails the build if one slips in."""
    import re as _re
    txt = _re.sub(r"(?s)<(script|style)[^>]*>.*?</\1>", " ", html)
    txt = _re.sub(r"<[^>]+>", "\n", txt)
    txt = _re.sub(r"https?://\S+", " ", txt)
    txt = _re.sub(r"\d{1,2}:\d{2}", " ", txt)
    for line in txt.split("\n"):
        if ":" in line:
            db.fail(f"prose colon in {rel} near {line.strip()[:70]!r}")


def build(today, out_dir, site_url=None, domain=""):
    site_url = site_url or db.DEFAULT_SITE
    docket = load_docket(today)
    runs = load_runs()
    out = REPO / out_dir

    pages = {
        "index.html": home_page(today, site_url, docket, runs),
        "docket/index.html": docket_page(today, site_url, docket),
        "archive/index.html": archive_page(today, site_url, runs),
        "services/index.html": services_page(today, site_url),
        "about/index.html": about_page(today, site_url),
        "404.html": not_found_page(today, site_url),
    }
    for r in runs:
        pages[f"archive/{r['date']}/index.html"] = deck_page(today, site_url, r)

    for rel, html in pages.items():
        bad = db.BANNED.findall(html)
        if bad:
            db.fail(f"banned punctuation in {rel} {bad[:8]}")
        prose_colon_gate(rel, html)
        p = out / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(html)

    feed = json.dumps({"updated": today.isoformat(), "items": docket[0]}, indent=2)
    (out / "docket.json").write_text(feed)
    (out / "docket").mkdir(exist_ok=True)
    (out / "docket" / "docket.json").write_text(feed)
    touch_icon(out)
    (out / "sitemap.xml").write_text(sitemap(site_url, runs))
    (out / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {site_url}/sitemap.xml\n")
    (out / ".nojekyll").write_text("")
    if domain:
        (out / "CNAME").write_text(domain + "\n")
    print(f"site -> {out} ({len(pages)} pages, {len(runs)} decks, "
          f"{len(docket[1])} tracked decisions)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", required=True, help="build date YYYY-MM-DD (America/Anchorage)")
    ap.add_argument("--out", default="docs")
    ap.add_argument("--domain", default=db.DEFAULT_DOMAIN,
                    help="custom domain; emits CNAME and rewrites absolute URLs")
    args = ap.parse_args()
    site = f"https://{args.domain}" if args.domain else db.DEFAULT_SITE
    build(ddate.fromisoformat(args.date), args.out, site, args.domain)


if __name__ == "__main__":
    main()
