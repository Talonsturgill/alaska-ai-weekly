#!/usr/bin/env python3
"""Fetch + curate LICENSE-CLEAN real recordings into assets/sfx/real/.

Sources are CC0/public-domain ONLY, so committing the files to this repo is
unambiguously legal (no attribution required; we log provenance anyway).
Per the 2026-07-21 sourcing review:
  - kenney.nl audio packs: CC0, direct-URL, professionally produced, exactly
    the "cartoon-adjacent but tasteful" register. The zip URL embeds a content
    hash that drifts across pack updates, so we scrape the asset page for the
    current href first.
  - DO NOT add Sonniss/Pixabay/Mixkit here: commercial use is allowed but
    REDISTRIBUTION (= committing raw files) is not. BBC RemArc is
    non-commercial: never use it.

Curated takes land as assets/sfx/real/<kind>_<slug>.wav (44.1k stereo, peak
-6 dBFS, silence-trimmed, edge fades) — scripts/sfx_bank.py shuffle-bags all
real takes for a kind, replacing the synth variants wholesale. Provenance goes
to assets/sfx/real/manifest.json (source URL, pack, license, sha256).

Run occasionally (network needed); output is committed. Idempotent.
"""
import os, io, re, sys, json, glob, zipfile, hashlib, tempfile, subprocess, urllib.request
import datetime as dt
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, ".."))
REAL = os.path.join(REPO, "assets", "sfx", "real")
FF = os.environ.get("FFMPEG_BIN", "ffmpeg")
SR = 44100

# pack slug -> asset page (the page is scraped for the current zip href)
KENNEY_PACKS = {
    "interface-sounds": "https://kenney.nl/assets/interface-sounds",
    "impact-sounds": "https://kenney.nl/assets/impact-sounds",
}

# (pack, filename regex) -> (bank kind, max takes). Conservative: only map
# files whose names make the material unambiguous; everything else stays synth.
CURATION = [
    ("impact-sounds", r"impactMetal_(medium|heavy)_\d+", "clank", 6),
    ("impact-sounds", r"impactWood_(medium|heavy)_\d+",  "thud", 6),
    ("impact-sounds", r"impactBell_heavy_\d+",           "ding", 5),
    ("impact-sounds", r"impactSoft_(medium|heavy)_\d+",  "paw", 5),
    # NOTE: kenney click_* rejected on audition-by-analysis — 7-12ms bone-dry
    # clicks, thinner than the synth ticks (which carry a designed room tail).
    ("interface-sounds", r"drop_\d+",                    "pop", 4),
    ("interface-sounds", r"confirmation_\d+",            "chime", 4),
]


def http_get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "alaska-ai-weekly-sfx-fetch"})
    with urllib.request.urlopen(req, timeout=90) as r:
        return r.read()


def kenney_zip_url(slug, page_html):
    # the page quotes hrefs with ' or " and mixes absolute/relative URLs
    m = re.search(rf'(?:https://kenney\.nl)?/?(media/pages/assets/{slug}/[^\'"]+\.zip)', page_html)
    if not m:
        raise SystemExit(f"fetch_sfx: no zip href on kenney page for {slug} (layout changed?)")
    return "https://kenney.nl/" + m.group(1)


def normalize(raw_ogg, dst):
    """ogg -> 44.1k stereo wav, silence-trimmed, peak -6 dBFS, 4ms fades."""
    with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as f:
        f.write(raw_ogg); src = f.name
    tmp = src + ".wav"
    r = subprocess.run([FF, "-y", "-i", src, "-ar", str(SR), "-ac", "2", tmp],
                       capture_output=True)
    if r.returncode != 0:
        os.unlink(src); return False
    from scipy.io import wavfile
    _, y = wavfile.read(tmp)
    os.unlink(src); os.unlink(tmp)
    y = y.astype(np.float64) / 32767.0
    env = np.max(np.abs(y), axis=1)
    keep = np.where(env > 10 ** (-55 / 20))[0]
    if keep.size < SR * 0.02:
        return False
    pad = int(SR * 0.005)
    y = y[max(0, keep[0] - pad):min(y.shape[0], keep[-1] + int(SR * 0.05))]
    y = y / max(1e-9, np.max(np.abs(y))) * 0.5   # -6 dBFS, matches synth bank
    fade = min(int(SR * 0.004), y.shape[0] // 4)
    y[:fade] *= np.linspace(0, 1, fade)[:, None]
    y[-fade:] *= np.linspace(1, 0, fade)[:, None]
    wavfile.write(dst, SR, (y * 32767).astype(np.int16))
    return True


def main():
    os.makedirs(REAL, exist_ok=True)
    manifest_path = os.path.join(REAL, "manifest.json")
    manifest = json.load(open(manifest_path)) if os.path.exists(manifest_path) else {"files": []}
    known = {f["filename"] for f in manifest["files"]}

    for slug, page in KENNEY_PACKS.items():
        rules = [(rx, kind, cap) for p, rx, kind, cap in CURATION if p == slug]
        if not rules:
            continue
        print(f"pack {slug}: scraping zip href from {page}")
        zurl = kenney_zip_url(slug, http_get(page).decode("utf-8", "replace"))
        print(f"  -> {zurl}")
        z = zipfile.ZipFile(io.BytesIO(http_get(zurl)))
        names = sorted(n for n in z.namelist() if n.endswith(".ogg"))
        for rx, kind, cap in rules:
            got = 0
            for n in names:
                stem = os.path.splitext(os.path.basename(n))[0]
                if not re.fullmatch(rx, stem):
                    continue
                if got >= cap:
                    break
                fname = f"{kind}_kenney_{stem}.wav"
                dst = os.path.join(REAL, fname)
                raw = z.read(n)
                if not normalize(raw, dst):
                    print(f"  SKIP {stem} (decode/trim failed)")
                    continue
                got += 1
                if fname not in known:
                    manifest["files"].append({
                        "filename": fname, "kind": kind, "pack": slug,
                        "source_file": n, "source_url": zurl,
                        "author": "Kenney (kenney.nl)", "license": "CC0-1.0",
                        "sha256": hashlib.sha256(open(dst, "rb").read()).hexdigest(),
                        "retrieved": dt.date.today().isoformat()})
                    known.add(fname)
            # a kind needs >=3 real takes or none: a lone take would win the
            # resolve order wholesale and play IDENTICALLY every time — the
            # exact "reusing the same sfx" failure this bank exists to kill
            if 0 < got < 3:
                print(f"  {kind}: only {got} takes survived — dropping them (synth variants stay)")
                for f in glob.glob(os.path.join(REAL, f"{kind}_kenney_*.wav")):
                    os.unlink(f)
                manifest["files"] = [x for x in manifest["files"]
                                     if not (x["kind"] == kind and x["pack"] == slug)]
                known = {f["filename"] for f in manifest["files"]}
                got = 0
            print(f"  {kind}: {got} takes from /{rx}/")

    json.dump(manifest, open(manifest_path, "w"), indent=2)
    n_files = len(glob.glob(os.path.join(REAL, "*.wav")))
    print(f"real bank: {n_files} takes, provenance in {manifest_path}")


if __name__ == "__main__":
    main()
