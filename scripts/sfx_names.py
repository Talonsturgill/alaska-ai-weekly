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
    python3 scripts/sfx_names.py --board out/dispatch/storyboard.json   # Gate 0A, also in storyboard_check
"""
import difflib
import sys

FAM = {"thud": "sub", "stamp": "sub", "boom": "sub", "paw": "sub", "clank": "metal", "chain": "metal", "klaxon": "metal",
       "ding": "bell", "chime": "bell", "tick": "click", "pop": "blip", "snap": "pluck", "whoosh": "air", "riser": "air",
       "paper": "texture", "creak": "texture", "caw": "bird"}
BY_NAME = {"whoosh": "whoosh", "sizzle": "paper", "snap": "snap", "slide": "creak", "thunk": "stamp", "whirr": "whoosh",
           "click": "tick", "blip": "pop", "riser": "whoosh", "clunk": "clank", "clip": "snap", "hum": "creak", "thump": "thud",
           "splash": "whoosh", "cascade": "chain", "page": "paper", "scratch": "paper", "sonar": "ding", "hit": "boom",
           "fade": "creak", "bloop": "chime", "silence": "creak", "tick": "tick", "stamp": "stamp", "creak": "creak",
           # 2026-10-15 The Door With a Condition: this film's descriptive names, each to one bank kind
           "alarm": "klaxon", "swell": "whoosh", "sting": "boom", "tap": "tick", "thock": "tick", "bloom": "chime", "ping": "ding",
           "bell": "ding", "hush": "paper", "rumble": "boom", "crunch": "paper", "pulse": "ding", "crack": "snap", "clank": "clank",
           "punch": "pop", "knock": "thud", "drone": "creak", "roll": "chain", "flip": "paper", "stop": "clank", "heavy": "boom",
           "fold": "paper", "type": "tick", "pop": "pop", "clink": "ding", "chime": "chime", "thud": "thud", "boom": "boom",
           # machine pass 2026-11-12 (queue sfx-name-table-and-family-ceiling, repeat 1, and the 11-07
           # sfx_names table item). Every bank kind is a name for itself: "ding", "paper" and "chain"
           # were not in this table, so 51 shipped beats that named a bank kind exactly were walked to
           # whatever kind was least used. Then the descriptive names shipped boards have used
           # since 10-06 that fell through (counted over runs/*/storyboard.json), each to the kind it
           # sounds like. clack and squeak are the 11-12 names dispatch_mix rejected.
           "ding": "ding", "paper": "paper", "chain": "chain", "klaxon": "klaxon",
           "swoosh": "whoosh", "swish": "whoosh", "swing": "whoosh", "rush": "whoosh", "clack": "tick",
           "tock": "tick", "pebble": "tick", "squeak": "creak", "scrape": "creak", "buzz": "creak",
           "rattle": "chain", "ratchet": "chain", "coins": "chain", "ching": "ding", "ring": "ding",
           "glass": "ding", "shimmer": "chime", "drip": "pop", "bubble": "pop", "boing": "pop",
           "splat": "thud", "boots": "thud", "step": "thud", "footstep": "thud", "door": "thud",
           "slam": "stamp", "press": "stamp", "pin": "snap", "flap": "paper", "flutter": "paper",
           "rustle": "paper", "scribble": "paper", "pencil": "paper", "tear": "paper", "hiss": "paper",
           "stinger": "boom"}
ALT = {"sub": ["thud", "stamp", "boom"], "metal": ["clank", "chain"], "bell": ["chime", "ding"], "click": ["tick"], "blip": ["pop"],
       "pluck": ["snap"], "air": ["whoosh"], "texture": ["paper", "creak"]}

# THE SFX CLASS TAG (machine pass 2026-10-28, queue item from 10-28 "The River It Never Saw"). The
# family walk could land on caw (a bird) and paw (an animal footfall) for an odometer, clickers and
# a bar, and the judges heard the mismatch. The run fixed it by taking caw and paw out of the walk
# and the table entirely, which also made them unreachable for a beat that IS an animal. Now a kind
# carries a class. An animal kind plays only on a beat of class animal, and the walk for an object
# beat never offers one, so the fallback can't put a gull on a typewriter again.
#
# A beat's class is its `sfx_class` field ("animal" or "object") when the board sets it, else
# "animal" when its sfx name maps to an animal kind (caw, gull, paw, hoof), else "object". A beat
# that names an animal sound but declares sfx_class "object" walks to an object kind and is
# reported by class_conflicts, so the board's author sees the contradiction.
KIND_CLASS = {"caw": "animal", "paw": "animal"}
ANIMAL_NAMES = {"caw": "caw", "gull": "caw", "squawk": "caw", "cry": "caw", "bird": "caw", "raven": "caw",
                "paw": "paw", "pawstep": "paw", "hoof": "paw", "pad": "paw", "flipper": "paw"}
ANIMAL_ALT = {"bird": ["caw"], "sub": ["paw"]}


def kind_class(kind):
    return KIND_CLASS.get(kind, "object")


def beat_class(beat):
    """'animal' or 'object', from the beat's sfx_class or, failing that, its sfx name."""
    declared = str(beat.get("sfx_class") or "").strip().lower()
    if declared in ("animal", "object"):
        return declared
    return "animal" if head(beat.get("sfx", "")) in ANIMAL_NAMES else "object"


def walk_options(avoid, cls):
    """Every kind the walk may pick outside the avoided families, for a beat of this class."""
    opts = [x for fam, xs in ALT.items() if fam not in avoid for x in xs]
    if cls == "animal":
        opts += [x for fam, xs in ANIMAL_ALT.items() if fam not in avoid for x in xs]
    return opts


def pick(avoid, cls, used):
    """The walk's choice: same-class kinds first (an animal beat prefers an animal kind), then the
    least-used, then by name. For an object beat this is exactly the walk before the class tag."""
    return sorted(walk_options(avoid, cls), key=lambda x: (kind_class(x) != cls, used.get(x, 0), x))[0]


def class_conflicts(beats):
    """[(beat id, name)] for beats that name an animal sound but declare sfx_class object."""
    return [(b["id"], head(b.get("sfx", ""))) for b in beats
            if head(b.get("sfx", "")) in ANIMAL_NAMES and beat_class(b) == "object"]
CYCLE = {"slide": ["creak", "paper", "whoosh"], "hum": ["creak", "chain", "ding", "clank"], "sizzle": ["paper", "snap", "tick"],
         "scratch": ["paper", "tick"], "fade": ["creak", "chime"], "silence": ["creak"], "splash": ["whoosh", "pop"]}


def head(sfx):
    return str(sfx).split("-")[0]


def known(name):
    return name in BY_NAME or name in CYCLE or name in ANIMAL_NAMES


def nearest(name, n=3):
    return difflib.get_close_matches(name, sorted(set(BY_NAME) | set(CYCLE) | set(ANIMAL_NAMES)), n=n, cutoff=0.5)


def kinds_by_beat(beats, riser_beat):
    """(kinds, unknown): one bank kind per beat id, and [(beat id, name)] for names the table lacks."""
    seen, kinds, used, prev_fam, unknown = {}, {}, {}, None, []
    for i, b in enumerate(beats):
        nm = head(b["sfx"])
        cls = beat_class(b)
        nxt = beats[i + 1]["id"] if i + 1 < len(beats) else None
        avoid = {prev_fam} | ({FAM["riser"]} if nxt == riser_beat else set())
        if not known(nm):
            unknown.append((b["id"], nm))
            k = pick(avoid, cls, used)
        elif nm in ANIMAL_NAMES:
            k = ANIMAL_NAMES[nm]
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
        if b["id"] != riser_beat and (FAM[k] in avoid or kind_class(k) != "object" and kind_class(k) != cls):
            k = pick(avoid, cls, used)
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


# THE SCHEDULE'S PALETTE RULES, READ ON THE BOARD (machine pass 2026-11-12, queue item
# sfx-name-table-and-family-ceiling). dispatch_mix.check_schedule holds a film to at least
# max(8, 30 percent) distinct kinds, no kind over 18 percent and the top four under 55 percent, but
# it runs in the mix, after the render: on 11-12 the tick ceiling forced a recast of eleven beats
# once the frames already existed, and two names the table lacked surfaced there too. The kinds
# follow from the board alone (this module's walk plus the board's riser_at), so storyboard_check
# runs the same rules at Gate 0A. The numbers are dispatch_mix's; the self-test fails if they drift.
PALETTE_MIN_EVENTS = 12
SINGLE_KIND_CEILING = 0.18
TOP_FOUR_CEILING = 0.55


OBJECT_KINDS = len([k for k in FAM if k != "riser" and KIND_CLASS.get(k, "object") == "object"])


def want_distinct(n):
    return max(8, round(n * 0.30))


def _onset(beat):
    v = beat.get("at_s", beat.get("t"))
    return float(v.split("-", 1)[0]) if isinstance(v, str) else float(v)


def riser_beat_of(board):
    """The riser's beat, exactly as dispatch_mix.riser_beat_id picks it (nearest audio_arc.riser_at,
    ties to the earlier beat). None when the board names no riser_at."""
    try:
        at = float((board.get("audio_arc") or {}).get("riser_at"))
    except (TypeError, ValueError):
        return None
    beats = board.get("beats") or []
    if not beats:
        return None
    return min(beats, key=lambda b: (abs(_onset(b) - at), _onset(b)))["id"]


def palette_problems(kind_list, names_on=lambda kind: []):
    """The palette half of dispatch_mix.check_schedule, as messages (empty when it would pass)."""
    from collections import Counter
    n, out = len(kind_list), []
    if n < PALETTE_MIN_EVENTS:
        return out
    kinds = Counter(kind_list)
    need = want_distinct(n)
    if len(kinds) < need:
        out.append(f"only {len(kinds)} distinct sfx kinds across {n} beats; the mix needs >= {need}. "
                   f"Unused in the bank: {sorted(set(FAM) - set(kinds) - {'riser'})}."
                   + (f" The walk reaches {OBJECT_KINDS} object kinds plus the riser, so a board of this "
                      f"many object beats can't pass the mix: merge beats or give an animal beat its sound."
                      if need > OBJECT_KINDS + 1 else ""))
    top, c = kinds.most_common(1)[0]
    if c / n > SINGLE_KIND_CEILING:
        out.append(f"'{top}' carries {c} of {n} beats ({c/n:.0%}), over the mix's 18% ceiling. Board sfx "
                   f"names on '{top}': {', '.join(names_on(top)) or 'none'}. Rename some beats to another kind.")
    heavy = sum(x for _, x in kinds.most_common(4))
    if heavy / n > TOP_FOUR_CEILING:
        out.append(f"the top four kinds carry {heavy} of {n} beats ({heavy/n:.0%}), over the mix's 55% ceiling.")
    return out


def board_report(board):
    """{'problems', 'notes', 'kinds'} for a storyboard: every beat names a sound the table knows,
    and the kinds the mix will cast pass its palette rules. Gate 0A, scripts/storyboard_check.py."""
    beats = [b for b in (board.get("beats") or []) if isinstance(b, dict)]
    problems, notes = [], []
    missing = [b.get("id") for b in beats if not str(b.get("sfx") or "").strip()]
    if missing:
        problems.append(f"beats {', '.join(map(str, missing))} name no sfx")
    beats = [b for b in beats if str(b.get("sfx") or "").strip() and "id" in b]
    if not beats:
        return {"problems": problems, "notes": notes, "kinds": {}}
    kinds, unknown = kinds_by_beat(beats, riser_beat_of(board))
    problems += unknown_report(unknown)
    problems += palette_problems([kinds[b["id"]] for b in beats],
                                 lambda k: names_for_kind(beats, kinds, k))
    for bid, nm in class_conflicts(beats):
        notes.append(f"beat {bid} names the animal sound '{nm}' but declares sfx_class object")
    return {"problems": problems, "notes": notes, "kinds": kinds}


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
    # The class tag (2026-10-28). Thirty object beats of unknown and clashing names never reach an
    # animal kind, the walk is what it was for an object board, and an animal beat gets its sound.
    objs = [{"id": i + 1, "sfx": s} for i, s in enumerate(
        ["odometer", "clicker", "bar", "thump", "splash", "zorp", "thud", "boom", "stamp", "whirr"] * 3)]
    ok_kinds, _ = kinds_by_beat(objs, riser_beat=None)
    expect("no object beat gets caw or paw, even when the walk runs out of families",
           not [k for k in ok_kinds.values() if kind_class(k) == "animal"])
    expect("thump maps to thud", kinds_by_beat([{"id": 1, "sfx": "thump"}], None)[0] == {1: "thud"})
    animals = [{"id": 1, "sfx": "gull-cry"}, {"id": 2, "sfx": "caw"}, {"id": 3, "sfx": "hoof"},
               {"id": 4, "sfx": "knock", "sfx_class": "animal"}, {"id": 5, "sfx": "zorp", "sfx_class": "animal"}]
    ak, _ = kinds_by_beat(animals, None)
    expect("an animal name plays its animal kind", ak[1] == "caw"
           and kinds_by_beat([{"id": 1, "sfx": "hoof-step"}], None)[0] == {1: "paw"})
    expect("a caw after a caw walks to another animal kind, not to an object", ak[2] == "paw")
    expect("a declared animal beat with an object name keeps the table's kind", ak[4] == "thud")
    expect("an unknown name on a declared animal beat prefers an animal kind", kind_class(ak[5]) == "animal")
    tagged = [{"id": 1, "sfx": "caw", "sfx_class": "object"}]
    expect("a caw on a beat declared object plays an object kind and is reported",
           kind_class(kinds_by_beat(tagged, None)[0][1]) == "object" and class_conflicts(tagged) == [(1, "caw")])
    # The board check (2026-11-12).
    import os
    import re
    mix = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "dispatch_mix.py")).read()
    expect("the palette numbers are dispatch_mix.check_schedule's own",
           all(x in mix for x in ("if n >= 12:", "max(8, round(n * 0.30))", "c / n > 0.18", "heavy / n > 0.55")))
    expect("every bank kind but the animal ones and the riser is a known name for itself",
           all(BY_NAME.get(k) == k for k in FAM if k not in KIND_CLASS and k != "riser"))
    expect("clack and squeak (11-12) are known", known("clack") and known("squeak"))
    names = ["thud", "tick", "whoosh", "ding", "paper", "snap", "chime", "clank", "pop", "creak",
             "stamp", "boom", "chain", "klaxon"]
    good = {"audio_arc": {"riser_at": 30.0},
            "beats": [{"id": i + 1, "at_s": 2.5 * i, "sfx": names[i % len(names)]} for i in range(42)]}
    rep = board_report(good)
    expect("a board spread across the bank passes", rep["problems"] == [])
    expect("the board's riser lands on the beat nearest riser_at", rep["kinds"][13] == "riser")
    ticky = {"audio_arc": {"riser_at": 30.0},
             "beats": [dict(b, sfx=("clack" if b["id"] % 4 == 0 else b["sfx"])) for b in good["beats"]]}
    tr = board_report(ticky)
    expect("eleven clacks in 42 beats fail the 18% ceiling and name clack",
           any("over the mix's 18% ceiling" in p and "clack" in p for p in tr["problems"]))
    unk = board_report({"audio_arc": {}, "beats": [{"id": 1, "at_s": 0, "sfx": "zorp"}, {"id": 2, "at_s": 3}]})
    expect("an unknown name and a missing sfx fail with the beat ids",
           any("'zorp' (beats 1)" in p for p in unk["problems"]) and any("beats 2 name no sfx" in p for p in unk["problems"]))
    expect("palette messages are worded for the board", re.search(r"18% ceiling", " ".join(tr["problems"])) is not None)
    print("sfx_names self-test: " + ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


if __name__ == "__main__":
    if "--self-test" in sys.argv:
        sys.exit(self_test())
    if len(sys.argv) > 2 and sys.argv[1] == "--board":
        import json
        r = board_report(json.load(open(sys.argv[2])))
        for p in r["problems"]:
            print("FAIL " + p)
        for n_ in r["notes"]:
            print("NOTE " + n_)
        print(f"sfx board check: {len(r['kinds'])} beats, {len(set(r['kinds'].values()))} kinds, "
              + ("FAIL" if r["problems"] else "PASS"))
        sys.exit(1 if r["problems"] else 0)
    print(__doc__)
