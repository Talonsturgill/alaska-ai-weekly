#!/usr/bin/env python3
"""Source a fresh music track for the Dispatch.

Usage:
  # Download a specific track (URL found by research):
  python scripts/get_music.py \\
      --url "https://cdn.pixabay.com/download/audio/..." \\
      --title "My Track" --composer "Artist" \\
      --license "Pixabay Content License" --source "Pixabay Music" \\
      --out out/dispatch/music_bed.wav

  # Fall back to vetted pool (when live search fails):
  python scripts/get_music.py --pool --mood "cold ambient arctic" --out out/dispatch/music_bed.wav

Both modes:
- Download + validate it is real audio (scipy.io.wavfile or ffmpeg probe)
- Print a CREDIT line: "Title by Composer (Source, License)"
- Export DISPATCH_MUSIC=<out_path> (the audio_v3.py mixer reads this)
"""
import argparse, os, subprocess, sys, tempfile, urllib.request
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parent.parent
POOL_FILE = REPO / "config" / "music_sources.yaml"
FFMPEG = os.environ.get("FFMPEG_BIN", "ffmpeg")


def sh(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def probe_audio(path):
    """Return duration in seconds, or None if not valid audio."""
    r = sh([FFMPEG, "-v", "error", "-i", str(path), "-f", "null", "-"], timeout=30)
    # For duration, parse stderr
    import re
    m = re.search(r"Duration:\s*(\d+):(\d+):([\d.]+)", r.stderr)
    if m:
        h, m2, s = int(m.group(1)), int(m.group(2)), float(m.group(3))
        return h * 3600 + m2 * 60 + s
    # Fallback: try scipy
    try:
        from scipy.io import wavfile
        sr, data = wavfile.read(str(path))
        return len(data) / sr
    except Exception:
        return None


def download(url, dest):
    """Download url to dest, return True on success."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as r, open(dest, "wb") as f:
            f.write(r.read())
        return True
    except Exception as e:
        print(f"Download failed: {e}", file=sys.stderr)
        return False


def to_wav(src, dst):
    """Convert any audio to 44100Hz stereo WAV via ffmpeg."""
    r = sh([FFMPEG, "-y", "-i", str(src), "-ac", "2", "-ar", "44100", str(dst)])
    return r.returncode == 0


def pick_from_pool(mood_str):
    """Return best unused pool entry for the requested mood."""
    if not POOL_FILE.exists():
        return None
    pool = yaml.safe_load(POOL_FILE.read_text()) or {}
    tracks = pool.get("pool", [])
    mood_words = set(mood_str.lower().split())
    best, best_score = None, -1
    for t in tracks:
        if t.get("used"):
            continue
        track_moods = set(t.get("mood", []))
        score = len(mood_words & track_moods)
        if score > best_score:
            best, best_score = t, score
    return best


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="")
    ap.add_argument("--title", default="")
    ap.add_argument("--composer", default="")
    ap.add_argument("--license", default="")
    ap.add_argument("--source", default="")
    ap.add_argument("--out", required=True)
    ap.add_argument("--pool", action="store_true", help="Use vetted pool instead of --url")
    ap.add_argument("--mood", default="", help="Mood keywords for pool selection")
    args = ap.parse_args()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if args.pool or not args.url:
        track = pick_from_pool(args.mood)
        if not track:
            print("ERROR: no unused tracks in pool for mood:", args.mood, file=sys.stderr)
            sys.exit(1)
        url = track["url"]
        title = track["title"]
        composer = track["composer"]
        license_ = track["license"]
        source = track["source"]
        print(f"Pool track: {title} by {composer}", file=sys.stderr)
    else:
        url = args.url
        title = args.title or "(unknown title)"
        composer = args.composer or "(unknown composer)"
        license_ = args.license or "(unknown license)"
        source = args.source or "(unknown source)"

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        print(f"Downloading: {url}", file=sys.stderr)
        if not download(url, tmp_path):
            sys.exit(1)

        # Convert to WAV
        if not to_wav(tmp_path, str(out_path)):
            print("ERROR: ffmpeg conversion failed", file=sys.stderr)
            sys.exit(1)

        dur = probe_audio(str(out_path))
        if dur is None or dur < 5:
            print(f"ERROR: invalid audio (duration={dur})", file=sys.stderr)
            sys.exit(1)

        print(f"Downloaded {dur:.1f}s of audio", file=sys.stderr)
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

    # Print the credit line
    credit = f"{title} by {composer} ({source}, {license_})"
    print(f"CREDIT: {credit}")
    print(f"DISPATCH_MUSIC={out_path}")


if __name__ == "__main__":
    main()
