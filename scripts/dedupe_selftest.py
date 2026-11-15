#!/usr/bin/env python3
"""Prove the dedupe STOP list still catches real repeats after it was widened.

WHY THIS EXISTS (2026-08-09). `dedupe.py check` calls DUP on any two shared word
tokens. The tokeniser splits multi-word entities into single words, so on an
Alaska-and-AI channel the words in EVERY entry were casting the deciding votes:
this run was refused four times running on ['learning','machine'], ['ash','learning'],
['alaska','nsf'] and ['alaska','anchorage']. None of those pairs names a subject. A
gate that can only ever return DUP trains a run to argue past it, which is the exact
entity-list gaming the routine forbids.

Widening a stopword list makes a gate MORE permissive, and a more permissive gate is
worth exactly what it can still catch. So this asserts both directions against the
REAL history in config/state.yaml:

  KEEP  — the archive's genuine same-subject repeats must still DUP.
  DROP  — the four measured false positives above must now be FRESH.

Run it whenever a word is added to STOP. Exit 0 all green, exit 1 with the failures
named. No network, no fixtures: it replays the shipped ledger.
"""
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DEDUPE = REPO / "scripts" / "dedupe.py"

# Same-subject repeats that are actually in the 30-day ledger. A run pitching these
# entity sets IS pitching a story the audience just watched, and the gate must say so.
MUST_DUP = [
    ("the NEH / ChatGPT grant-screening story, pitched again",
     "neh, national endowment for the humanities, dei classifier, chatgpt grant screening, "
     "alaska native language archive, grant termination, doge, reinstatement"),
    ("the Stak Energy North Slope data centre, pitched again",
     "stak energy, deadhorse, dalton highway, adl 422741, gas-fired power, public comment, "
     "john boyle, gigawatt, form letters"),
    ("the Anchorage crime centre / Fairbanks redaction film, pitched again",
     "real time crime center, thundercat, license plate reader, object recognition, "
     "body camera redaction, evidence technician, sean case, mike sanders"),
]

# Measured false positives from the 2026-08-09 run. Each was refused on tokens that
# name a place or a field rather than a subject.
MUST_BE_FRESH = [
    ("this run's story, honest entity list",
     "shewanella oneidensis, bioleaching, rare earth elements, coal refuse, coal ash, "
     "university of alaska anchorage, nsf epscor focused collaborations, bioreactor, "
     "smart bio-refinery, virtual pilot plant, brandon briggs, srijan aggarwal, "
     "montana technological university, reinforcement learning process control"),
    ("refused earlier on ['learning','machine']",
     "shewanella oneidensis, bioleaching, rare earth elements, coal refuse, uaa, "
     "nsf epscor, machine learning controller, bioreactor, smart bio-refinery, "
     "virtual pilot plant, brandon briggs, montana tech"),
    ("refused earlier on ['alaska','nsf']",
     "shewanella oneidensis, bioleaching, rare earth elements, coal refuse, "
     "university of alaska anchorage, nsf epscor, bioreactor, smart bio-refinery, "
     "virtual pilot plant, brandon briggs, srijan aggarwal, microbial recovery"),
    ("the ANA AI3 / SEDS-Alaska carried lead",
     "administration for native americans, seds-alaska, ai3 action institute, eagle, "
     "91 fr 47241, hhs-2026-acf-ana-nai-0035, alaska federation of natives, set-aside"),
]

# Every case above was measured against the ledger as it stood on 2026-08-09. Replayed against
# today's window they aged out (by 2026-11-15 two KEEP cases read FRESH and one DROP case DUP'd on
# a November entry), so the test failed on the calendar, not on the code. Each case now replays the
# ledger as of the day it was measured (dedupe.py check --asof). The DROP cases are the 08-09 run's
# own story, so they replay the day before it shipped, when its own entry was not yet in the ledger.
ASOF = "2026-08-09"
ASOF_DROP = "2026-08-08"

# Measured 2026-11-15: the records-rule story was refused as a DUP of the 10-21 walrus film on
# ['act', 'public'] (Public Records Act against Marine Mammal Protection Act and Alaska Public Media).
# Replayed the day before it shipped, so its own ledger entry is not in the window.
FRESH_ASOF = [
    ("2026-11-14", "the DOA records-rule story, refused on ['act','public']",
     "department of administration, records requests, automated tools, juneau empire, 2 aac 96, "
     "as 40.25, resident priority, public records act"),
]
DUP_ASOF = [
    ("2026-11-16", "the DOA records-rule story, pitched again the next day",
     "department of administration, records requests, automated tools, public records act"),
]


def verdict(entities: str, asof: str = ASOF) -> tuple[str, str]:
    p = subprocess.run([sys.executable, str(DEDUPE), "check", "--asof", asof, "--entities", entities],
                       capture_output=True, text=True, cwd=str(REPO))
    return ("DUP" if p.returncode else "FRESH"), (p.stdout or p.stderr).strip()


def main() -> int:
    failures = []
    print("KEEP — genuine repeats must still be refused:")
    for name, ents in MUST_DUP:
        got, msg = verdict(ents)
        ok = got == "DUP"
        print(f"  [{'ok' if ok else 'FAIL'}] {name}: {got}")
        if not ok:
            failures.append(f"{name}: expected DUP, got FRESH. The stopword list is now too wide.")
        elif msg:
            print(f"        {msg.splitlines()[0]}")

    print("DROP — measured false positives must now pass:")
    for name, ents in MUST_BE_FRESH:
        got, msg = verdict(ents, ASOF_DROP)
        ok = got == "FRESH"
        print(f"  [{'ok' if ok else 'FAIL'}] {name}: {got}")
        if not ok:
            failures.append(f"{name}: expected FRESH, got {msg.splitlines()[0] if msg else 'DUP'}")

    print("DATED — later measurements, replayed on their own day:")
    for asof, name, ents in DUP_ASOF:
        got, msg = verdict(ents, asof)
        ok = got == "DUP"
        print(f"  [{'ok' if ok else 'FAIL'}] {name} (as of {asof}): {got}")
        if not ok:
            failures.append(f"{name}: expected DUP, got FRESH. The stopword list is now too wide.")
    for asof, name, ents in FRESH_ASOF:
        got, msg = verdict(ents, asof)
        ok = got == "FRESH"
        print(f"  [{'ok' if ok else 'FAIL'}] {name} (as of {asof}): {got}")
        if not ok:
            failures.append(f"{name}: expected FRESH, got {msg.splitlines()[0] if msg else 'DUP'}")

    if failures:
        print(f"\ndedupe_selftest: {len(failures)} FAILED")
        for f in failures:
            print(f"  - {f}")
        return 1
    print(f"\ndedupe_selftest: OK  ({len(MUST_DUP) + len(DUP_ASOF)} repeats still caught, "
          f"{len(MUST_BE_FRESH) + len(FRESH_ASOF)} false positives cleared)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
