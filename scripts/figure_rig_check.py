#!/usr/bin/env python3
"""A held figure, and the hero, owe a lib idle rig before the render. SOURCE GATE.

WHY THIS EXISTS (machine pass 2026-11-09; queue: held-figure motion, repeat 4). Motion was the
lowest axis on 10 of 15 judge cards from 10-28 to 11-09, and on 11-09 every seat scored it 6.5 to
6.8: "held figures show no weight shift", "Person and Reels show only breath". The shared rig
(Character + humanIdle in lib/motion.tsx) has had a weight shift since August, but no film since
10-24 drew a Character. Each episode hand-rolls a flat `Person` in its own style, and Ep1106's and
Ep1109's both animate with `1 + 0.014 * Math.sin(f / 16)`, a breathing balloon, and their heroes
(Ep1109's Reels) with a sine bob. held_plan --gate (11-06) was satisfied by a HeldTravel light sweep
on a prop in the same shot, so the measure rose and the figures stayed statues.

So this reads the episode source and FAILS when
  * an episode-local component that takes a `skin` prop (a human figure, by the one prop every
    hand-rolled Person has carried) neither draws a lib rig inside its body (figureIdle(,
    <IdleFigure, humanIdle(, <Character) nor is wrapped in <IdleFigure> at every place it is drawn;
  * the hero component (the first word of art_direction.json casting.hero, when the episode
    defines a component of that name) does neither of those, nor a lib prop rig (propIdle(,
    <HeldProp, strike(, <StrikeProp).
It NOTES (does not fail) a file that uses IdleFigure or figureIdle without passing any `cues`: the
weight shift still happens on humanIdle's schedule, but only cues put it inside the strip a judge
reads, which is built on the beat. `gain={0}` on a rig is an explicit decision and counts.

The remedy it prints is lib/figureidle.tsx (FigureLook and scripts/figure_look_check.py measure it:
the 11-09 Person 0.18 percent of the frame on its beat strips, the same drawing in IdleFigure 1.19).

    python3 scripts/figure_rig_check.py [EPISODE.tsx ...] [--art out/dispatch/art_direction.json]
    python3 scripts/figure_rig_check.py --self-test
Exit 0 clean, 1 a figure or the hero has no rig, 2 nothing to read.
"""
import argparse
import json
import os
import re
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
ART = os.path.join(REPO, "out", "dispatch", "art_direction.json")
FIGURE_RIGS = ("figureIdle(", "<IdleFigure", "humanIdle(", "<Character")
PROP_RIGS = ("propIdle(", "<HeldProp", "strike(", "<StrikeProp")
REMEDY = ("draw it through lib/figureidle.tsx: wrap each use in <IdleFigure f x footY h seed cues={[p.b(id), ...]}> "
          "(a function child gets the pose for head and arms), or call figureIdle() inside it; a striking "
          "prop takes <StrikeProp at>. gain={0} if the stillness is the point")


def components(src):
    """[(name, props_text, body)] for each top-level `const Name: React.FC<...> = ...` in the file."""
    starts = [m for m in re.finditer(r"^const (\w+)\s*:\s*React\.FC\b", src, re.M)]
    out = []
    for i, m in enumerate(starts):
        end = starts[i + 1].start() if i + 1 < len(starts) else len(src)
        body = src[m.start():end]
        arrow = body.find("=>")
        out.append((m.group(1), body[:arrow if arrow > 0 else 0], body))
    return out


def wrapped_everywhere(src, name, defn_body):
    """True when every `<Name` drawn outside its own definition sits inside an open <IdleFigure>."""
    rest = src.replace(defn_body, "")
    uses = [m.start() for m in re.finditer(r"<" + re.escape(name) + r"\b", rest)]
    if not uses:
        return False
    for u in uses:
        before = rest[:u]
        if before.rfind("<IdleFigure") <= before.rfind("</IdleFigure>"):
            return False
    return True


def hero_name(art_path):
    try:
        hero = json.load(open(art_path)).get("casting", {}).get("hero", "")
    except (OSError, ValueError, AttributeError):
        return None
    m = re.match(r"\s*([A-Z][A-Za-z0-9]*)", str(hero or ""))
    return m.group(1) if m else None


def analyze(src, hero=None):
    """(problems, notes) for one episode source."""
    problems, notes = [], []
    for name, props, body in components(src):
        if re.match(r"S\d+$", name):
            continue
        human = re.search(r"\bskin\??\s*:", props) is not None
        is_hero = hero is not None and name == hero
        if not (human or is_hero):
            continue
        rigs = FIGURE_RIGS + (PROP_RIGS if is_hero else ())
        if any(r in body for r in rigs) or wrapped_everywhere(src, name, body):
            continue
        what = "the hero" if is_hero else "a human figure (takes `skin`)"
        problems.append(f"{name} is {what} and draws no lib idle rig, so it holds with breath only")
    if ("<IdleFigure" in src or "figureIdle(" in src) and "cues" not in src:
        notes.append("IdleFigure/figureIdle used without `cues`: the shift lands on humanIdle's schedule, "
                     "not inside the beat strips; pass cues={[p.b(id), ...]} for the figure's beats")
    return problems, notes


def _self_test():
    bare = ("const Person: React.FC<{x: number; skin?: string; f?: number}> = ({x, f = 0}) => {\n"
            "  const breathe = 1 + 0.014 * Math.sin(f / 16);\n  return <g />;\n};\n"
            "const S1: React.FC<SceneProps> = ({p}) => <svg><Person x={1} f={p.f} /></svg>;\n")
    wrapped = bare.replace("<Person x={1} f={p.f} />",
                           "<IdleFigure f={p.f} x={1} footY={2} cues={[p.b(3)]}><Person x={1} f={p.f} /></IdleFigure>")
    half = wrapped + "const S2: React.FC<SceneProps> = ({p}) => <svg><Person x={2} /></svg>;\n"
    inner = bare.replace("const breathe = 1 + 0.014 * Math.sin(f / 16);", "const pose = figureIdle(f, 0, 1, cues);")
    hero_bare = "const Reels: React.FC<{f: number; x: number}> = ({f, x}) => {\n  const bob = 3 * Math.sin(f / 19);\n  return <g />;\n};\n"
    hero_rig = hero_bare.replace("const bob = 3 * Math.sin(f / 19);", "const st = strike(f, 30);")
    prop = "const Lamp: React.FC<{f: number}> = ({f}) => <g />;\n"
    cases = [
        ("breath-only Person fails", analyze(bare)[0], 1),
        ("Person wrapped at its one use passes", analyze(wrapped)[0], 0),
        ("Person wrapped at one of two uses fails", analyze(half)[0], 1),
        ("Person calling figureIdle passes", analyze(inner)[0], 0),
        ("sine-bob hero fails", analyze(hero_bare, "Reels")[0], 1),
        ("hero with a strike passes", analyze(hero_rig, "Reels")[0], 0),
        ("a plain prop is not a figure", analyze(prop, "Reels")[0], 0),
    ]
    bad = [n for n, got, want in cases if len(got) != want]
    no_cues = analyze(wrapped.replace("cues={[p.b(3)]}", ""))[1]
    if not no_cues:
        bad.append("IdleFigure without cues should note")
    print("figure_rig_check self-test:", "FAIL " + "; ".join(bad) if bad else f"PASS ({len(cases) + 1} cases)")
    return 1 if bad else 0


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("targets", nargs="*")
    ap.add_argument("--art", default=ART)
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args(argv)
    if a.self_test:
        return _self_test()
    targets = a.targets
    if not targets:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from caption_band_check import default_targets
        targets = default_targets()
    if not targets:
        print("figure_rig_check: no episode file found")
        return 2
    hero = hero_name(a.art)
    worst = 0
    for t in targets:
        problems, notes = analyze(open(t).read(), hero)
        rel = os.path.relpath(t, REPO)
        for n in notes:
            print(f"  NOTE  {rel}: {n}")
        if problems:
            for p in problems:
                print(f"  FAIL  {rel}: {p}")
            print(f"figure_rig_check: {len(problems)} held figure(s) without a rig in {rel}: "
                  + ", ".join(p.split(' ')[0] for p in problems) + f". {REMEDY}")
            worst = 1
        else:
            print(f"figure_rig_check: {rel} clean (hero {hero or 'not named'}; every human figure carries a lib rig)")
    return worst


if __name__ == "__main__":
    sys.exit(main())
