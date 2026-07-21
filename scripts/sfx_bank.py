#!/usr/bin/env python3
"""SFX resolver for the Dispatch mixes — now a SHUFFLE-BAG over variant takes.

2026-07-21 owner note: "ours is boring and reusing the same sfx". The bank now
ships 6 sibling takes per kind (build_sfx_library.py); this resolver plays them
like game-audio middleware plays a random container:

  - shuffle-bag order (every take heard before any repeats), seeded from the
    EPISODE date so each episode deals a different order but a re-run of the
    same episode is bit-identical;
  - no-repeat-last-2 across bag reshuffles (Wwise "avoid repeating last X").

Resolution order for a named effect:
  1. assets/sfx/real/<kind>*.wav  — curated real recordings (CC0/PD, logged in
                                    assets/sfx/MANIFEST.md). If any exist for a
                                    kind they replace the synth takes wholesale
                                    and are shuffle-bagged themselves.
  2. assets/sfx/<kind>_v*.wav     — the designed-foley variant bank.
  3. assets/sfx/<kind>.wav        — legacy single take (pre-variant bank).
  4. self-heal                    — rebuild the bank, then retry.

Usage in a mix script:
    from sfx_bank import resolve
    path = resolve("clank", episode_seed="2026-07-21")   # a different take each call
    path = resolve("clank")                              # same, process-global bag
"""
import os, re, sys, glob, zlib, subprocess
import random as _random

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, ".."))
BANK = os.path.join(REPO, "assets", "sfx")
REAL = os.path.join(BANK, "real")

# old-name aliases so existing mix vocab keeps working
ALIASES = {"bell": "ding", "impact": "thud", "swish": "whoosh", "alarm": "klaxon"}

_bags = {}  # (kind, episode_seed) -> {"order": [paths], "pos": int, "last": [paths]}


def takes(kind):
    """All candidate takes for a kind, best source tier only."""
    real = sorted(glob.glob(os.path.join(REAL, f"{kind}*.wav")))
    real = [p for p in real if os.path.getsize(p) > 1000]
    if real:
        return real
    vs = sorted(glob.glob(os.path.join(BANK, f"{kind}_v*.wav")),
                key=lambda p: int(re.search(r"_v(\d+)\.wav$", p).group(1)))
    vs = [p for p in vs if os.path.getsize(p) > 1000]
    if vs:
        return vs
    legacy = os.path.join(BANK, f"{kind}.wav")
    if os.path.exists(legacy) and os.path.getsize(legacy) > 1000:
        return [legacy]
    return []


def _bag(kind, episode_seed, pool):
    key = (kind, episode_seed)
    if key not in _bags:
        _bags[key] = {"order": [], "pos": 0, "last": [],
                      "rng": _random.Random(zlib.crc32(f"{episode_seed}:{kind}".encode()))}
    return _bags[key]


def resolve(kind: str, episode_seed: str = "default") -> str:
    """Next take for `kind` from the episode's shuffle-bag. Deterministic for a
    given (episode_seed, call sequence); different episodes deal differently."""
    kind = ALIASES.get(kind, kind)
    pool = takes(kind)
    if not pool:
        # self-heal: rebuild the bank once, then retry
        sys.stderr.write(f"sfx_bank: '{kind}' missing — rebuilding bank\n")
        subprocess.run([sys.executable, os.path.join(HERE, "build_sfx_library.py")],
                       capture_output=True)
        pool = takes(kind)
        if not pool:
            raise FileNotFoundError(f"sfx_bank: no design named '{kind}' (see assets/sfx/MANIFEST.md)")
    if len(pool) == 1:
        return pool[0]
    b = _bag(kind, episode_seed, pool)
    if b["pos"] >= len(b["order"]):
        # reshuffle; forbid the last 2 played from opening the new bag
        order = pool[:]
        b["rng"].shuffle(order)
        for _ in range(8):
            if order[0] not in b["last"][-2:]:
                break
            b["rng"].shuffle(order)
        b["order"], b["pos"] = order, 0
    p = b["order"][b["pos"]]
    b["pos"] += 1
    b["last"] = (b["last"] + [p])[-2:]
    return p


if __name__ == "__main__":
    k = sys.argv[1] if len(sys.argv) > 1 else "thud"
    seed = sys.argv[2] if len(sys.argv) > 2 else "default"
    for _ in range(int(sys.argv[3]) if len(sys.argv) > 3 else 1):
        print(resolve(k, seed))
