#!/usr/bin/env python3
"""SFX resolver for the Dispatch mixes.

Resolution order for a named effect:
  1. assets/sfx/real/<kind>.wav   — a curated real recording (CC0/PD, logged in
                                    assets/sfx/MANIFEST.md). Always wins.
  2. assets/sfx/<kind>.wav        — the designed-foley synth bank
                                    (scripts/build_sfx_library.py).
  3. lavfi fallback               — regenerate the bank entry on the fly if the
                                    bank is missing (self-healing; also logs a
                                    warning so the run report shows it).

Usage in a mix script:
    from sfx_bank import resolve
    path = resolve("thud")          # absolute path to a ready 44.1k stereo wav

Mix scripts should place these at event times with adelay as before; the bank
files are pre-normalized to -6 dBFS so existing per-event volume= scaling keeps
working (they're hotter than the old 0-dBFS sines were AFTER their volume cut,
so keep per-event volume <= 0.9).
"""
import os, sys, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, ".."))
BANK = os.path.join(REPO, "assets", "sfx")
REAL = os.path.join(BANK, "real")

# old-name aliases so existing mix vocab keeps working
ALIASES = {"bell": "ding", "impact": "thud", "swish": "whoosh", "alarm": "klaxon"}


def resolve(kind: str) -> str:
    kind = ALIASES.get(kind, kind)
    for cand in (os.path.join(REAL, f"{kind}.wav"), os.path.join(BANK, f"{kind}.wav")):
        if os.path.exists(cand) and os.path.getsize(cand) > 1000:
            return cand
    # self-heal: rebuild the bank once, then retry
    sys.stderr.write(f"sfx_bank: '{kind}' missing — rebuilding bank\n")
    subprocess.run([sys.executable, os.path.join(HERE, "build_sfx_library.py")],
                   capture_output=True)
    cand = os.path.join(BANK, f"{kind}.wav")
    if os.path.exists(cand):
        return cand
    raise FileNotFoundError(f"sfx_bank: no design named '{kind}' (see assets/sfx/MANIFEST.md)")


if __name__ == "__main__":
    print(resolve(sys.argv[1] if len(sys.argv) > 1 else "thud"))
