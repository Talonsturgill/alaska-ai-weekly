#!/usr/bin/env python3
"""Dedupe ledger for the DAILY Alaska.Ai Dispatch routine.
Never repeat a story within the same week (and never an exact repeat). The ledger is
config/state.yaml > dispatch_history; it is read at the start of research and written at
the end of every run.

  python scripts/dedupe.py list  --days 14
      -> the exclusion list of recently-covered topics + key entities (for research).
  python scripts/dedupe.py check --entities "cook inlet,beluga,noaa" [--days 7]
      -> prints FRESH (exit 0) or DUP ... (exit 1) if it overlaps a recent Dispatch.
  python scripts/dedupe.py add --date 2026-06-28 --topic "..." --slug dispatch-... \
      --entities "a,b,c" --archetype "..." --palette "..." --voice "..."
      -> appends the run to the ledger.
"""
import sys, argparse, datetime as dt, re
from pathlib import Path
import yaml  # installed by scripts/setup_env.sh

STATE = Path(__file__).resolve().parent.parent / "config" / "state.yaml"
STOP = {"the","a","an","of","in","and","for","ai","to","on","with","by"}

def load():
    d = yaml.safe_load(STATE.read_text()) or {}
    d.setdefault("dispatch_history", [])
    return d

def norm(s):
    return {w for w in re.findall(r"[a-z0-9]+", (s or "").lower()) if w not in STOP and len(w) > 1}

def entity_key(e):
    ents = e.get("key_entities") or []
    s = ",".join(ents) if isinstance(ents, list) else str(ents)
    return norm(s) | norm(e.get("topic", ""))

def recent(d, days):
    today = dt.date.today(); out = []
    for e in d["dispatch_history"]:
        try: ed = dt.date.fromisoformat(str(e.get("date")))
        except Exception: ed = None
        if ed is None or (today - ed).days <= days:
            out.append(e)
    return out

def main():
    ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest="cmd", required=True)
    pl = sub.add_parser("list");  pl.add_argument("--days", type=int, default=14)
    pc = sub.add_parser("check"); pc.add_argument("--entities", required=True); pc.add_argument("--days", type=int, default=7)
    pa = sub.add_parser("add")
    for f in ["date","topic","slug","entities","archetype","palette","voice"]:
        pa.add_argument("--"+f, default="")
    a = ap.parse_args(); d = load()

    if a.cmd == "list":
        rs = recent(d, a.days)
        if not rs: print("(ledger empty — anything is fresh)"); return
        print(f"# Covered in the last {a.days} days — DO NOT repeat:")
        for e in rs:
            ents = e.get("key_entities") or []
            print(f"- {e.get('date')} | {e.get('topic')} | entities: {', '.join(ents) if isinstance(ents,list) else ents}")

    elif a.cmd == "check":
        cand = norm(a.entities)
        for e in recent(d, a.days):
            if e.get("slug") and e.get("slug") in a.entities:
                print(f"DUP: slug {e.get('slug')} ({e.get('date')})"); sys.exit(1)
            shared = cand & entity_key(e)
            if len(shared) >= 2:
                print(f"DUP: overlaps {e.get('date')} \"{e.get('topic')}\" on {sorted(shared)}"); sys.exit(1)
        print("FRESH"); sys.exit(0)

    elif a.cmd == "add":
        ents = [x.strip() for x in a.entities.split(",") if x.strip()]
        d["dispatch_history"].append({
            "date": a.date or dt.date.today().isoformat(),
            "topic": a.topic, "slug": a.slug, "key_entities": ents,
            "archetype": a.archetype, "palette": a.palette, "voice": a.voice})
        STATE.write_text(yaml.safe_dump(d, sort_keys=False, allow_unicode=True))
        print("added:", a.slug or a.topic)

if __name__ == "__main__":
    main()
