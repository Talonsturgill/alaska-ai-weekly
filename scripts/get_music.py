#!/usr/bin/env python3
"""Fetch + prepare the Dispatch music bed, and emit the credit for the Gmail draft.

PRIMARY (every run): the routine RESEARCHES a fresh royalty-free track that fits THIS story, then
passes it here to download + validate + credit:
  python scripts/get_music.py --url <direct audio url> --title "T" --composer "C" \
      --license "CC BY 4.0" --source "pixabay.com" --out out/dispatch/music_bed.wav

BACKUP (only if the live search fails): pick a verified track from config/music_sources.yaml:
  python scripts/get_music.py --pool --mood ambient --out out/dispatch/music_bed.wav

It downloads, converts to 44.1k stereo WAV, VALIDATES it is real audio (>=20s, not a 404/HTML page),
and writes the credit to music_credit.json (and prints `CREDIT: ...`). The WAV path is the LAST
stdout line. Exit !=0 on any failure so the caller can fall back to the engine's synth bed.
Then set DISPATCH_MUSIC=<the wav> so audio_v3.py uses it.
"""
import argparse, os, sys, json, subprocess, tempfile, random

def sh(c, **k): return subprocess.run(c, capture_output=True, text=True, **k)
def dur(p):
    r = sh(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p])
    try: return float(r.stdout.strip())
    except Exception: return 0.0
def download(url, dst):
    # a browser-like UA + same-origin referer, several free hosts (ccmixter, etc) hotlink-block bare curl
    from urllib.parse import urlparse
    origin = f"{urlparse(url).scheme}://{urlparse(url).netloc}/"
    r = sh(["curl", "-sSL", "--max-time", "240", "-A", "Mozilla/5.0", "-e", origin, "-o", dst, url])
    return r.returncode == 0 and os.path.exists(dst) and os.path.getsize(dst) > 50_000
def to_wav(src, out, cap=180):
    r = sh(["ffmpeg", "-y", "-t", str(cap), "-i", src, "-ac", "2", "-ar", "44100", out])
    return r.returncode == 0 and os.path.exists(out) and dur(out) >= 20.0
def pool_pick(mood):
    import yaml
    cfg = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "config", "music_sources.yaml")
    pool = (yaml.safe_load(open(cfg)) or {}).get("pool", [])
    if mood:
        m = [t for t in pool if mood.lower() in [x.lower() for x in t.get("mood", [])]]
        pool = m or pool
    return random.choice(pool) if pool else None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url"); ap.add_argument("--title", default=""); ap.add_argument("--composer", default="")
    ap.add_argument("--license", default=""); ap.add_argument("--source", default=""); ap.add_argument("--credit", default="")
    ap.add_argument("--pool", action="store_true"); ap.add_argument("--mood", default="")
    ap.add_argument("--out", default="out/dispatch/music_bed.wav")
    a = ap.parse_args(); os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    if a.pool or not a.url:
        t = pool_pick(a.mood)
        if not t: print("no pool track available", file=sys.stderr); sys.exit(2)
        track = {k: t.get(k, "") for k in ("url", "title", "composer", "license", "source", "credit")}
        print(f"(pool fallback: {track['title']})", file=sys.stderr)
    else:
        track = dict(url=a.url, title=a.title, composer=a.composer, license=a.license, source=a.source, credit=a.credit)
    tmp = tempfile.mktemp(suffix=os.path.splitext(track["url"])[1] or ".mp3")
    if not download(track["url"], tmp):
        print("download failed: " + track["url"], file=sys.stderr); sys.exit(1)
    if not to_wav(tmp, a.out):
        print("not valid audio / convert failed: " + track["url"], file=sys.stderr); sys.exit(1)
    credit = track["credit"] or " ".join(x for x in [
        f'"{track["title"]}"' if track["title"] else "", track["composer"],
        f'({track["source"]})' if track["source"] else "", f'- {track["license"]}' if track["license"] else ""] if x).strip()
    json.dump({**track, "credit": credit, "wav": a.out, "duration": round(dur(a.out), 1)},
              open(os.path.join(os.path.dirname(os.path.abspath(a.out)), "music_credit.json"), "w"), indent=2)
    print("CREDIT: " + credit)
    print(a.out)   # LAST line = the prepared wav

if __name__ == "__main__":
    main()
