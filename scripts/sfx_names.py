#!/usr/bin/env python3
"""Board sfx names to bank kinds, for scripts/dispatch_mix.py.

A board beat's `sfx` is a DESCRIPTIVE name for the film's author ("ding-ring", "thock",
"silence-pop-pop"); the bank knows 17 kinds. The first word of the name maps to one kind, adjacent
beats are walked off each other's spectral family, and the film's one riser sits on its beat.

WHY THIS MODULE EXISTS (machine pass 2026-10-23, queue items mix-tick-ceiling-mapping 10-11 and
sfx-names-fall-to-tick 10-20). The lookup was `_BY_NAME.get(name, "tick")`, so every name the
table did not know became a tick, silently. On 10-11 "click" and the unknown names tripped the 18
percent single-kind ceiling, and on 10-20 the schedule gate failed twice at 13 and 14 kinds, each
time with a message about tick and nothing about which board names had fallen through. Now:

  - an unknown name takes the least-used kind outside the neighbouring families (the same walk a
    family clash already uses), so a fallback can't pile onto one kind;
  - `unknown` names each one with the nearest known names, and dispatch_mix prints it every mix;
  - `names_for_kind` lets the schedule errors say which board names landed on the crowded kind.

Known names map exactly as before.

    python3 scripts/sfx_names.py --self-test
"""
import difflib
import sys

FAM = {"thud": "sub", "stamp": "sub", "boom": "sub", "paw": "sub", "clank": "metal", "chain": "metal", "klaxon": "metal",
       "ding": "bell", "chime": "bell", "tick": "click", "pop": "blip", "snap": "pluck", "whoosh": "air", "riser": "air",
       "paper": "texture", "creak": "texture", "caw": "bird"}
BY_NAME = {"whoosh": "whoosh", "sizzle": "paper", "snap": "snap", "slide": "creak", "thunk": "stamp", "whirr": "whoosh",
           "click": "tick", "blip": "pop", "riser": "whoosh", "clunk": "clank", "clip": "snap", "hum": "creak", "thump": "paw",
           "splash": "whoosh", "cascade": "chain", "page": "paper", "scratch": "paper", "sonar": "ding", "hit": "boom",
           "fade": "creak", "bloop": "chime", "silence": "creak", "tick": "tick", "stamp": "stamp", "creak": "creak",
           # 2026-10-15 The Door With a Condition: this film's descriptive names, each to one bank kind
           "alarm": "klaxon", "swell": "whoosh", "sting": "boom", "tap": "tick", "thock": "tick", "bloom": "chime", "ping": "ding",
           "bell": "ding", "hush": "paper", "rumble": "boom", "crunch": "paper", "pulse": "ding", "crack": "snap", "clank": "clank",
           "punch": "pop", "knock": "thud", "drone": "creak", "roll": "chain", "flip": "paper", "stop": "clank", "heavy": "boom",
           "fold": "paper", "type": "tick", "pop": "pop", "clink": "ding", "chime": "chime", "thud": "thud", "boom": "boom"}
ALT = {"sub": ["thud", "stamp", "boom", "paw"], "metal": ["clank", "chain"], "bell": ["chime", "ding"], "click": ["tick"], "blip": ["pop"],
       "pluck": ["snap"], "air": ["whoosh"], "texture": ["paper", "creak"], "bird": ["caw"]}
CYCLE = {"slide": ["creak", "paper", "whoosh"], "hum": ["creak", "chain", "ding", "clank"], "sizzle": ["paper", "snap", "tick"],
         "scratch": ["paper", "tick"], "fade": ["creak", "chime"], "silence": ["creak"], "splash": ["whoosh", "caw", "pop"]}


def head(sfx):
    return str(sfx).split("-")[0]


def known(name):
    return name in BY_NAME or name in CYCLE


def nearest(name, n=3):
    return difflib.get_close_matches(name, sorted(set(BY_NAME) | set(CYCLE)), n=n, cutoff=0.5)


def kinds_by_beat(beats, riser_beat):
    """(kinds, unknown): one bank kind per beat id, and [(beat id, name)] for names the table lacks."""
    seen, kinds, used, prev_fam, unknown = {}, {}, {}, None, []
    for i, b in enumerate(beats):
        nm = head(b["sfx"])
        nxt = beats[i + 1]["id"] if i + 1 < len(beats) else None
        avoid = {prev_fam} | ({FAM["riser"]} if nxt == riser_beat else set())
        if not known(nm):
            unknown.append((b["id"], nm))
            opts = [x for fam, xs in ALT.items() if fam not in avoid for x in xs]
            k = sorted(opts, key=lambda x: (used.get(x, 0), x))[0]
        else:
            k = BY_NAME.get(nm, "tick")
        if nm in CYCLE:
            k = CYCLE[nm][seen.get(nm, 0) % len(CYCLE[nm])]
            seen[nm] = seen.get(nm, 0) + 1
        if b["id"] == riser_beat:
            k = "riser"       # the ONE riser of the film: the build into the closing question
        elif k == "riser":
            k = "whoosh"      # a descriptive "riser" on any other beat must not add a second one
        # Walk off the previous beat's family. The riser beat is never walked; the beat BEFORE
        # it is walked off the riser's family instead, so the board's riser can't be recast away.
        if b["id"] != riser_beat and FAM[k] in avoid:
            opts = [x for fam, xs in ALT.items() if fam not in avoid for x in xs]
            k = sorted(opts, key=lambda x: (used.get(x, 0), x))[0]
        used[k] = used.get(k, 0) + 1
        kinds[b["id"]] = k
        prev_fam = FAM[k]
    return kinds, unknown


def unknown_report(unknown):
    """One line per distinct unknown name, with the beats that carry it and the nearest known names."""
    by = {}
    for bid, nm in unknown:
        by.setdefault(nm, []).append(bid)
    out = []
    for nm, ids in sorted(by.items()):
        near = nearest(nm)
        out.append(f"'{nm}' (beats {', '.join(map(str, ids))}) is not in the sfx name table"
                   + (f"; nearest: {', '.join(near)}" if near else "")
                   + ". Rename the beat's sfx or add the name to BY_NAME in scripts/sfx_names.py.")
    return out


def names_for_kind(beats, kinds, kind):
    return sorted({head(b["sfx"]) for b in beats if kinds.get(b["id"]) == kind})


def self_test():
    ok = True

    def expect(name, cond):
        nonlocal ok
        print(("  ok   " if cond else "  FAIL ") + name)
        ok = ok and cond

    beats = [{"id": i + 1, "sfx": s} for i, s in enumerate(
        ["zorp", "glimmer", "fwip", "zorp-zorp", "quabble", "snorf", "blat", "stamp", "whirr", "zing"])]
    kinds, unknown = kinds_by_beat(beats, riser_beat=9)
    expect("unknown names are reported, known ones are not",
           [nm for _, nm in unknown] == ["zorp", "glimmer", "fwip", "zorp", "quabble", "snorf", "blat", "zing"])
    expect("eight unknown names do not pile onto tick", sum(1 for k in kinds.values() if k == "tick") <= 2)
    expect("the riser stays on its beat", kinds[9] == "riser")
    expect("no two adjacent beats share a family",
           all(FAM[kinds[i]] != FAM[kinds[i + 1]] for i in range(1, len(beats))))
    rep = unknown_report([(3, "thok"), (5, "thok")])
    expect("the report names the beats and the nearest known name",
           len(rep) == 1 and "beats 3, 5" in rep[0] and "thock" in rep[0])
    expect("a known name maps exactly as the table says",
           kinds_by_beat([{"id": 1, "sfx": "knock-knock"}], None)[0] == {1: "thud"})
    expect("names_for_kind lists the board names on a kind",
           names_for_kind([{"id": 1, "sfx": "tap"}, {"id": 2, "sfx": "type-x"}], {1: "tick", 2: "tick"}, "tick") == ["tap", "type"])
    print("sfx_names self-test: " + ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


if __name__ == "__main__":
    if "--self-test" in sys.argv:
        sys.exit(self_test())
    print(__doc__)
