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
    # eight stars of gold; positions echo the flag's proportions
    dipper = [(140, 318), (205, 296), (262, 302), (318, 276),
              (332, 208), (416, 232), (404, 300)]
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
             ("archive/", "ARCHIVE"), ("about/", "ABOUT")]
    on = ' class="on"'
    a = "".join(
        f'<a href="{prefix}{href or "./"}"{on if key.lower().startswith(active) else ""}>{key}</a>'
        for href, key in links)
    return f"""<nav class="topnav">
  <a class="wordmark" href="{prefix}./">{db.POLARIS}<span>ALASKA.AI</span></a>
  <div class="navlinks">{a}</div>
</nav>"""


def footer(prefix, today):
    return f"""<footer>{db.POLARIS}
<span>ALASKA.AI &middot; BUILT IN THE NORTH &middot; UPDATED {today.isoformat()} &middot; 61&#176;13'N 149&#176;54'W</span>
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
html{scroll-behavior:smooth;}
body{background:var(--night);color:var(--body);font-family:Manrope,system-ui,sans-serif;
line-height:1.55;overflow-x:hidden;}
body::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:60;
background-image:url(GRAIN_URI);mix-blend-mode:overlay;opacity:.55;}
::selection{background:rgba(255,199,44,.25);}
a{color:inherit;}

/* gold scroll progress hairline (scroll-driven, compositor only) */
@supports (animation-timeline: scroll()){
  body::before{content:"";position:fixed;top:0;left:0;right:0;height:2px;z-index:70;
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
.stars{position:absolute;inset:0;background-image:
radial-gradient(1px 1px at 12% 22%,rgba(244,248,255,.7),transparent 60%),
radial-gradient(1px 1px at 33% 8%,rgba(244,248,255,.5),transparent 60%),
radial-gradient(1.5px 1.5px at 56% 30%,rgba(244,248,255,.6),transparent 60%),
radial-gradient(1px 1px at 72% 12%,rgba(244,248,255,.5),transparent 60%),
radial-gradient(1px 1px at 88% 26%,rgba(244,248,255,.65),transparent 60%),
radial-gradient(1.5px 1.5px at 44% 16%,rgba(244,248,255,.4),transparent 60%);}
/* the flag: Big Dipper + Polaris, gold on the night */
.flagsky{position:absolute;right:2vw;top:5vh;width:min(46vw,560px);height:auto;opacity:.95;}
.fstar{fill:var(--gold);filter:drop-shadow(0 0 6px rgba(255,199,44,.55));
animation:twinkle 4s ease-in-out infinite;}
.fstar.polaris{filter:drop-shadow(0 0 12px rgba(255,199,44,.8));}
@keyframes twinkle{0%,100%{opacity:.75;}50%{opacity:1;}}

.wrap{position:relative;max-width:1120px;margin:0 auto;padding:0 24px 110px;z-index:1;}

/* ---------- nav ---------- */
.topnav{display:flex;align-items:center;gap:20px;padding:30px 0 0;flex-wrap:wrap;}
.wordmark{display:flex;align-items:center;gap:11px;font-family:JBMono,monospace;
font-size:15px;letter-spacing:.24em;color:var(--snow);text-decoration:none;font-weight:500;}
.wordmark .polaris{width:17px;height:17px;}
.navlinks{margin-left:auto;display:flex;gap:26px;font-family:JBMono,monospace;
font-size:12px;letter-spacing:.16em;}
.navlinks a{color:var(--mute);text-decoration:none;padding:6px 0;border-bottom:1.5px solid transparent;
transition:color .2s,border-color .2s;}
.navlinks a:hover{color:var(--snow);}
.navlinks a.on{color:var(--gold);border-bottom-color:var(--gold);}

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
.hero{padding:12vh 0 0;min-height:74vh;}
.daylight{display:inline-block;font-family:JBMono,monospace;font-size:12.5px;letter-spacing:.14em;
color:var(--gold);border:1px solid rgba(255,199,44,.35);border-radius:5px;padding:8px 14px;
background:rgba(14,33,56,.55);margin-bottom:34px;}
.hero h1{max-width:12ch;}
.tag{font-size:clamp(17px,2.2vw,21px);max-width:600px;margin:28px 0 0;color:var(--body);}
.ctarow{display:flex;gap:16px;margin:40px 0 0;flex-wrap:wrap;}
.cta{font-family:JBMono,monospace;font-size:13px;letter-spacing:.12em;text-decoration:none;
padding:14px 22px;border-radius:6px;transition:transform .2s,box-shadow .2s;}
.cta.gold{background:var(--gold);color:#241a00;font-weight:500;}
.cta.gold:hover{transform:translateY(-2px);box-shadow:0 10px 34px rgba(255,199,44,.3);}
.cta.ghost{border:1px solid var(--line);color:var(--body);}
.cta.ghost:hover{border-color:var(--blue);color:var(--snow);}
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

/* ---------- deck detail gallery ---------- */
.gallery{display:flex;gap:18px;overflow-x:auto;scroll-snap-type:x mandatory;
padding:8px 4px 20px;scrollbar-width:thin;scrollbar-color:var(--line) transparent;}
.gallery img{width:min(74vw,430px);height:auto;border-radius:10px;border:1px solid var(--line);
scroll-snap-align:center;flex:none;box-shadow:0 16px 46px rgba(0,0,0,.45);}
.galhint{font-family:JBMono,monospace;font-size:11.5px;letter-spacing:.14em;color:#5f7390;margin:4px 0 0;}
pre.copy{white-space:pre-wrap;background:var(--panel);border:1px solid var(--line);
padding:22px 24px;border-radius:10px;font-family:JBMono,monospace;font-size:13.5px;
line-height:1.7;color:var(--body);overflow-x:auto;}

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

/* ---------- footer ---------- */
.about-line{border-top:1px solid var(--line);margin-top:90px;padding-top:34px;font-size:15px;
color:var(--mute);max-width:660px;}
footer{margin-top:60px;display:flex;gap:14px;align-items:center;font-family:JBMono,monospace;
font-size:11.5px;color:#5a6d87;letter-spacing:.14em;flex-wrap:wrap;}
footer .polaris{width:13px;height:13px;}

/* ---------- reveals: CSS scroll-driven where supported, IO fallback ---------- */
html.js [data-reveal]{opacity:0;transform:translateY(18px);transition:opacity .7s ease,transform .7s ease;}
html.js [data-reveal].in{opacity:1;transform:none;}
@media (max-width:720px){
  .item{flex-direction:column;gap:16px;padding:24px 20px;}
  .doorcol{flex-direction:row;}
  .rail{flex-direction:column;gap:14px;}
  .rail::before{left:5px;right:auto;top:0;bottom:0;width:1.5px;height:auto;}
  .stop{padding:0 0 0 26px;}
  .maphero{margin:34px -12px 0;padding:0 12px;}
  .latest{grid-template-columns:1fr;}
  .flagsky{right:-4vw;top:2vh;width:70vw;opacity:.8;}
  .navlinks{gap:16px;font-size:11px;}
}
@media (prefers-reduced-motion:reduce){
  .veil,.fstar{animation:none;}
  html.js [data-reveal]{opacity:1;transform:none;transition:none;animation:none;}
  html{scroll-behavior:auto;}
  body::before{display:none;}
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


def page(title, desc, body, prefix, active, today, site_url, path, og_image="og.png",
         og_size=(1200, 630)):
    css = SITE_CSS.replace("FONTPREFIX", prefix).replace("GRAIN_URI", db.grain_data_uri() or "none")
    canonical = f"{site_url}/{path}"
    og_url = og_image if og_image.startswith("http") else f"{site_url}/{og_image}"
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
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
<style>{css}</style>
<script>document.documentElement.classList.add('js')</script>
</head>
<body>
<div class="sky"><div class="stars"></div>{flag_sky() if active == 'home' else ''}
<div class="veil v1"></div><div class="veil v2"></div><div class="veil v3"></div></div>
<div class="wrap">
{nav(prefix, active)}
{body}
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
            "title": copy.get("document_title", d.name),
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

    stats = f"""<div class="statrow" data-reveal>
  <div class="stat"><div class="n">{len(runs):02d}</div><div class="l">DECKS SHIPPED</div></div>
  <div class="stat"><div class="n">{len(live):02d}</div><div class="l">DECISIONS TRACKED</div></div>
  <div class="stat"><div class="n g">{n_open:02d}</div><div class="l">DOORS OPEN TO YOU</div></div>
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

    cards = "".join(db.card_html(it, today) for it in dated[:3])
    closing = f"""<h2 data-reveal><a href="docket/">The docket</a></h2>
<p class="sub" data-reveal>Every AI infrastructure decision in Alaska, tracked daily with a source on
every fact. Gold means a door is open to the public right now.</p>
<div class="cards">{cards}</div>
<div class="ctarow" data-reveal><a class="cta gold" href="docket/">OPEN THE FULL DOCKET</a></div>"""

    steps = """<h2 data-reveal>Built by Alaskans, run by a machine</h2>
<p class="sub" data-reveal>Alaska AI is an autonomous editorial studio with a human hand on the tiller.
Every day it works the state's AI beat the way a newsroom would, then a person decides what posts.</p>
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
        next_line = (f"Next on the docket: {esc(dated[0]['title'])}, "
                     f"{esc(pretty_date(nearest['date']))}. ")
    body = f"""<div class="hero">
<div class="daylight">{daylight_chip(today)}</div>
<h1>AI is coming <em>north</em></h1>
<p class="tag">Alaska AI watches it happen: every deal, docket and decision on the state's
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
<div class="about-line" data-reveal><p>{next_line}All sources verified against claims.</p></div>"""
    return page("Alaska AI", "The daily publication on Alaska's AI beat: verified stories, "
                "a public docket of every AI infrastructure decision, and bespoke data art. "
                "Built by and for Alaskans.", body, "", "home", today, site_url, "")


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
<div class="about-line" data-reveal><p>All sources verified against claims.
The data behind this page is public at <a href="../docket.json" style="color:var(--blue);text-decoration:none">docket.json</a>.</p></div>"""
    return page("The Alaska AI Docket", "Every AI infrastructure decision in Alaska, tracked daily. "
                "Who decides, when it lands, and whether the public gets a say.",
                body, "../", "the docket", today, site_url, "docket/",
                og_image="og-docket.png")


def archive_page(today, site_url, runs):
    decks = "".join(
        f"""<a class="deck" href="{r['date']}/" data-reveal>
  <img src="{RAW}/runs/{r['date']}/slide-01.png" width="1080" height="1350" alt="{esc(r['title'])} cover" loading="lazy">
  <div class="meta"><h3>{esc(r['title'])}</h3>
  <div class="who">{esc(pretty_date(r['date'])).upper()} &middot; {r['slides']} SLIDES</div></div>
</a>""" for r in runs)
    body = f"""<div class="hero" style="min-height:auto;padding-top:9vh">
<h1>The <em>archive</em></h1>
<p class="tag">Every deck the studio has shipped, one verified Alaska and AI story at a time.
Newest first.</p>
</div>
<div class="deckgrid" style="margin-top:44px">{decks}</div>"""
    return page("Archive - Alaska AI", "Every carousel Alaska AI has published: verified stories "
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
    return "\n".join(lines)


def deck_page(today, site_url, r):
    slides = "".join(
        f'<img src="{RAW}/runs/{r["date"]}/slide-{i:02d}.png" width="1080" height="1350" alt="Slide {i} of {r["slides"]}" loading="lazy">'
        for i in range(1, r["slides"] + 1))
    srcs = esc(sources_text(r["first_comment"]))
    body = f"""<div class="hero" style="min-height:auto;padding-top:9vh">
<div class="chip kind">{esc(pretty_date(r['date'])).upper()} &middot; {r['slides']} SLIDES</div>
<h1 style="font-size:clamp(34px,5vw,60px);margin-top:14px">{esc(r['title'])}</h1>
<p class="tag">{esc(r['hook'])}</p>
</div>
<h2>The deck</h2>
<p class="galhint">SWIPE OR SCROLL SIDEWAYS &middot; {r['slides']} SLIDES</p>
<div class="gallery">{slides}</div>
<div class="ctarow" data-reveal>
  <a class="cta gold" href="{RAW}/runs/{r['date']}/carousel.pdf">DOWNLOAD THE PDF ({r['pdf_mb']} MB)</a>
  <a class="cta ghost" href="../">EVERY DECK</a>
</div>
<h2 data-reveal>Sources</h2>
<pre class="copy" data-reveal>{srcs}</pre>"""
    return page(f"{r['title']} - Alaska AI", r["hook"][:150],
                body, "../../", "archive", today, site_url, f"archive/{r['date']}/",
                og_image=f"{RAW}/runs/{r['date']}/slide-01.png", og_size=(1080, 1350))


def about_page(today, site_url):
    body = f"""<div class="hero" style="min-height:auto;padding-top:9vh">
<h1>Built in the <em>North</em></h1>
</div>
<div class="prose" data-reveal>
<p>Alaska AI is a daily publication about the biggest technology shift of our
lifetimes, told from the only place we would tell it from. AI is arriving in
Alaska the way pipelines and railroads once did: as land leases, gas
contracts, utility votes and federal solicitations. Alaskans deserve to see
it coming, in plain English, with receipts.</p>
<p>The studio behind it is an autonomous editorial pipeline. Every day it
researches six beats across the state, verifies every claim against fetched
primary sources, plans a story slide by slide, draws the artwork as fresh
code, reviews its own work pixel by pixel, and hands a human the final say.
Nothing publishes without a person deciding it should. The same pipeline
maintains <a href="../docket/">the Alaska AI Docket</a>, a public tracker of
every AI infrastructure decision in the state and whether the public gets a
say in it.</p>
<p>Some rules never bend. Every fact carries a verified claim. No topic
repeats. No two decks look alike. Honest scores, honest emails, and the
machinery is open at
<a href="https://github.com/Talonsturgill/alaskaaicarousels" rel="noopener">github.com/Talonsturgill/alaskaaicarousels</a>.</p>
<p>Find the decks daily on LinkedIn under Alaska AI.</p>
</div>"""
    return page("About - Alaska AI", "Alaska AI is a daily publication on Alaska's AI beat, "
                "produced by an autonomous editorial studio with a human hand on the tiller.",
                body, "../", "about", today, site_url, "about/")


def sitemap(site_url, runs):
    urls = ["", "docket/", "archive/", "about/"] + [f"archive/{r['date']}/" for r in runs]
    entries = "".join(f"<url><loc>{site_url}/{u}</loc></url>" for u in urls)
    return ('<?xml version="1.0" encoding="UTF-8"?>'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
            f"{entries}</urlset>")


# ---------- build ----------

def build(today, out_dir, site_url=None, domain=""):
    site_url = site_url or db.DEFAULT_SITE
    docket = load_docket(today)
    runs = load_runs()
    out = REPO / out_dir

    pages = {
        "index.html": home_page(today, site_url, docket, runs),
        "docket/index.html": docket_page(today, site_url, docket),
        "archive/index.html": archive_page(today, site_url, runs),
        "about/index.html": about_page(today, site_url),
    }
    for r in runs:
        pages[f"archive/{r['date']}/index.html"] = deck_page(today, site_url, r)

    for rel, html in pages.items():
        bad = db.BANNED.findall(html)
        if bad:
            db.fail(f"banned punctuation in {rel}: {bad[:8]}")
        p = out / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(html)

    feed = json.dumps({"updated": today.isoformat(), "items": docket[0]}, indent=2)
    (out / "docket.json").write_text(feed)
    (out / "docket").mkdir(exist_ok=True)
    (out / "docket" / "docket.json").write_text(feed)
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
    ap.add_argument("--domain", default="",
                    help="custom domain; emits CNAME and rewrites absolute URLs")
    args = ap.parse_args()
    site = f"https://{args.domain}" if args.domain else db.DEFAULT_SITE
    build(ddate.fromisoformat(args.date), args.out, site, args.domain)


if __name__ == "__main__":
    main()
