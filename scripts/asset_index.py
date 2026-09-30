#!/usr/bin/env python3
"""Write the one-line-per-asset index of the Dispatch shelf, generated from the manifest.

WHY THIS EXISTS (2026-09-30, the cost project)
----------------------------------------------
Every run was told to read video-engine/src/lib/ASSET_MANIFEST.md in full before casting.
It is about 96 KB, roughly 24,000 tokens, and once read it stays in the conversation for the
rest of the run, so every later call pays to re-read it. Most of it is the history of how
each asset was built. Casting needs the name, the file and what the asset is. The rest is
needed only for the few assets a scene actually uses, and grep finds those in one call.

So the manifest stays the source of truth and is still edited by hand, one entry per asset,
in the same commit as the asset. This file is DERIVED from it and never edited:

  python3 scripts/asset_index.py            # rewrite video-engine/src/lib/ASSET_INDEX.md
  python3 scripts/asset_index.py --check    # exit 1 when the index is stale against the manifest

A run reads the index to cast, then `grep -n -A6 '`AssetName`' ASSET_MANIFEST.md` for the full
entry of each asset it picks.
"""
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
MANIFEST = REPO / "video-engine" / "src" / "lib" / "ASSET_MANIFEST.md"
INDEX = REPO / "video-engine" / "src" / "lib" / "ASSET_INDEX.md"
WIDTH = 110
FILE_RE = re.compile(r"((?:lib/)?[A-Za-z0-9_]+\.tsx)")


def build(text):
    out = ["# Asset index (GENERATED from ASSET_MANIFEST.md by scripts/asset_index.py, never edit)",
           "",
           "One line per asset: name, file, what it is. Cast from this, then read the full entry",
           "of each asset you pick with grep -n -A6 on its name in ASSET_MANIFEST.md.",
           ""]
    section, section_file, seen = None, None, 0
    for line in text.splitlines():
        head = re.match(r"^#{1,3}\s+(.*)", line)
        if head and not line.startswith("# Cast & Asset Manifest"):
            section = head.group(1).strip()
            m = FILE_RE.search(section)
            section_file = m.group(1) if m else None
            continue
        m = re.match(r"^\s*- `([^`]+)`(.*)", line)
        if not m:
            continue
        name, rest = m.group(1), m.group(2)
        parts = [p.strip() for p in re.split(r"\s+—\s+", rest) if p.strip()]
        where = next((FILE_RE.search(p).group(1) for p in parts if FILE_RE.fullmatch(p.strip("` "))),
                     None) or section_file
        desc = " ".join(p for p in parts if not FILE_RE.fullmatch(p.strip("` ")))
        desc = re.sub(r"\s+", " ", desc.replace("`", "")).strip()
        if len(desc) > WIDTH:
            desc = desc[:WIDTH].rsplit(" ", 1)[0] + " ..."
        if section:
            out += ["", f"## {section[:90]}"]
            section = None
        out.append(f"- {name}" + (f" ({where})" if where else "") + (f" {desc}" if desc else ""))
        seen += 1
    out.append("")
    return "\n".join(out), seen


def main(argv):
    text, n = build(MANIFEST.read_text())
    if "--check" in argv:
        current = INDEX.read_text() if INDEX.exists() else ""
        if current != text:
            print("asset_index: STALE. ASSET_MANIFEST.md changed since the index was written. "
                  "Run python3 scripts/asset_index.py and commit both.")
            return 1
        print(f"asset_index: current, {n} assets")
        return 0
    INDEX.write_text(text)
    print(f"asset_index: wrote {INDEX.relative_to(REPO)}, {n} assets, "
          f"{len(text):,} bytes against the manifest's {MANIFEST.stat().st_size:,}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
