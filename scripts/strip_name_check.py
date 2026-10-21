#!/usr/bin/env python3
"""Refuse an evidence strip named for something the film does not draw there.

WHY THIS EXISTS (2026-09-19, after it cost two panel rounds of the Motion axis).

The evidence pack names each motion filmstrip after a storyboard beat's choreography line,
and the panel reads that name as a promise about the frames underneath it. On this run the
board and the engine had drifted a whole shot apart from beat 10 onward, and nine beats the
board describes were not drawn by any shot at all. So `filmstrip_bar_overshoots_and_settles`
was cut at a beat the engine spends on a headline and a ghost outline, and three judges
across two rounds wrote, correctly and independently, that the strip named for an overshoot
contains no bar and the strip named for a character stepping contains no character. They
were right about the strip. The film was not the thing that was wrong.

That is the 2026-08-03 failure in a new coat: an artifact read BY NAME that looked plausible
and misrepresented the film, and the cost is the most expensive kind, because it is paid in
judge attention and in a score that then reads as a craft verdict.

WHAT THIS CHECKS. For every board beat (named as build_evidence names its strip) it finds which
scene of the episode animates that beat, through q(), pop(), at(), since(), bAt(), or the
scene-component episodes' b(key) and bt(key), and compares the beat's own
storyboard `shot` field against it. A mismatch means the strip is named from a beat sheet
that no longer describes the picture. A beat no shot animates at all is worse: the pack will
photograph a moment the film never stages.

WHAT IT DOES NOT CHECK. It compares WHICH SHOT, not whether the named action is the one that
shot performs at that instant. A board can be shot-correct and still describe the wrong
gesture. This catches the structural drift, which is the failure that actually happened.
"""
import argparse
import json
import os
import re
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(REPO, "scripts"))


def episode_path(board_date):
    stamp = os.path.join(REPO, "out", "dispatch", ".run_stamp.json")
    comp = None
    if os.path.exists(stamp):
        comp = json.load(open(stamp)).get("composition")
    if comp:
        p = os.path.join(REPO, "video-engine", "src", comp.replace("Dispatch", "Ep") + ".tsx")
        if os.path.exists(p):
            return p
    guess = "Ep" + (board_date or "").replace("-", "")[4:] + ".tsx"
    return os.path.join(REPO, "video-engine", "src", guess)


# A beat is animated in a shot when the shot keys anything to that beat's time: the helpers
# q(N), pop(N), at(N), since(N), or bAt(N) itself as the start of ease/spring/land/interpolate
# or a state switch (machine pass 2026-10-03). Until then only the three helpers counted, so
# 10-02 had six beats driven by ease(f, bAt(N)) reported unanimated and rewrote the FILM to
# satisfy the checker, twice in one run.
DRIVER = re.compile(r"\b(?:q|pop|at|since|bAt)\((\d+)")


def _legacy_shot_of_beat(src):
    """The pre-10-06 single-component episode: `if (n === k)` branches under `let picture`."""
    body = src[src.index("let picture: React.ReactNode"):]
    marks = sorted([(int(m.group(1)), m.start())
                    for m in re.finditer(r"\(n === (\d+)\)", body)], key=lambda x: x[1])
    out = {}
    for i, (n, a) in enumerate(marks):
        b = marks[i + 1][1] if i + 1 < len(marks) else len(body)
        for m in DRIVER.finditer(body[a:b]):
            out.setdefault(int(m.group(1)), n)
    return out


# The scene-component episode (Ep1006 on): one top-level `const S<k>: React.FC<SceneProps>`
# per scene, beats read through the shot's `b(key)` / `bt(key)`, where key is the AUTHORING
# key and `Ep<date>Ids.ts` maps it to the storyboard beat id, and `SHOT_ORDER` maps the
# sequence slot (the board's `shot`) to the scene component it plays.
# Machine pass 2026-10-21: every film from 10-06 to 10-21 used this shape, and the check only
# knew the `let picture` one, so it raised "ValueError: substring not found" on every cut and
# had silently checked nothing for two weeks while preflight printed it as a NOTE.
SCENE = re.compile(r"^const S(\d+)\s*:\s*React\.FC", re.M)
TOP_LEVEL = re.compile(r"^(?:const|let|function|export|type|interface)\b", re.M)
KEYED_DRIVER = re.compile(r"\b(?:q|pop|at|since|bAt|b|bt)\((\d+)")


def _ids_map(ids_src):
    if not ids_src:
        return {}
    m = re.search(r"=\s*(\{.*?\})\s*;", ids_src, re.S)
    return {int(k): int(v) for k, v in json.loads(m.group(1)).items()} if m else {}


def _scene_shot_of_beat(src, ids):
    order = None
    so = re.search(r"SHOT_ORDER\s*=\s*\[([^\]]*)\]", src)
    if so:
        order = [int(x) for x in so.group(1).split(",") if x.strip()]
    out = {}
    for m in SCENE.finditer(src):
        n = int(m.group(1))
        end = TOP_LEVEL.search(src, m.end())
        body = src[m.start():end.start() if end else len(src)]
        slot = order.index(n) + 1 if order and n in order else n
        for d in KEYED_DRIVER.finditer(body):
            k = int(d.group(1))
            out.setdefault(ids.get(k, k), slot)
    return out


def shot_of_beat(src, ids_src=None):
    """beat id -> the shot (sequence slot) that first animates it, for either episode shape."""
    if "let picture: React.ReactNode" in src:
        return _legacy_shot_of_beat(src)
    if SCENE.search(src):
        return _scene_shot_of_beat(src, _ids_map(ids_src))
    raise SystemExit("strip_name_check: the episode has neither `let picture` branches nor "
                     "`const S<k>: React.FC` scenes, so no beat can be located. Teach this "
                     "checker the new shape rather than skipping it.")


def _ids_path(episode):
    p = episode[:-len(".tsx")] + "Ids.ts"
    return p if os.path.exists(p) else None


def _slug(text, n=36):
    # build_evidence._slug, copied so a historical board can be named without importing
    # build_evidence, which reads out/dispatch/storyboard.json at import.
    return re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")[:n].strip("_")


def strip_names(board):
    """beat id -> the strip name build_evidence gives it (subject slug plus id)."""
    return {b["id"]: f"{_slug(b['draw']['subject'])}_{b['id']}" for b in board["beats"]}


def opens_its_shot(beat, board):
    """A beat on its shot's first frame is staged by the cut itself, with no b() call."""
    for s in board.get("shots", []):
        if s.get("id") == beat.get("shot") and "start_s" in s and "at_s" in beat:
            return abs(float(beat["at_s"]) - float(s["start_s"])) < 1.5 / 30
    return False


def _self_test():
    src = """
  let picture: React.ReactNode = null;
  if (n === 1) { const k = q(3); }
  else if (n === 2) { const drop = ease(f, bAt(4), 9); const s = spring(f, bAt(5) + 6, 18); }
  else if (n === 3) { const t = interpolate(f, [bAt(6), bAt(6) + 20], [0, 1]); const w = since(7); }
  else if (n === 4) { const d = 12; }
"""
    got = shot_of_beat(src)
    want = {3: 1, 4: 2, 5: 2, 6: 3, 7: 3}
    ok1 = got == want
    print(f"  [{'x' if ok1 else ' '}] legacy: q(N), ease/spring(f, bAt(N)), interpolate([bAt(N)]) "
          f"and since(N) all count: {got}")

    scene = """
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t3 = b(3);
  return <rect fill="rgb(1,2,3)" />;
};

const Helper = () => <g />;

// ---- S2 ----
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b, bt} = p;
  const t7 = b(7), g = bt(9);
  return null;
};
const SHOTS = {1: S1, 2: S2};
const SHOT_ORDER = [2, 1];
"""
    ids = "export const IDS: Record<number, number> = {\"3\": 2, \"7\": 5, \"9\": 4};"
    got2 = shot_of_beat(scene, ids)
    want2 = {2: 2, 5: 1, 4: 1}
    ok2 = got2 == want2
    print(f"  [{'x' if ok2 else ' '}] scene components: b(key) and bt(key) map through IDS, "
          f"scene S<k> maps through SHOT_ORDER to its slot, rgb( is not a driver: {got2}")

    board = {"shots": [{"id": 1, "start_s": 0.0}, {"id": 2, "start_s": 5.66}],
             "beats": [{"id": 1, "shot": 1, "at_s": 0.0}, {"id": 2, "shot": 2, "at_s": 5.67},
                       {"id": 3, "shot": 2, "at_s": 7.0}]}
    ok3 = [opens_its_shot(b, board) for b in board["beats"]] == [True, True, False]
    print(f"  [{'x' if ok3 else ' '}] a beat on its shot's first frame is staged by the cut")

    try:
        shot_of_beat("const X = 1;")
        ok4 = False
    except SystemExit:
        ok4 = True
    print(f"  [{'x' if ok4 else ' '}] an unknown episode shape fails loudly, never a bare traceback")

    ok = ok1 and ok2 and ok3 and ok4
    print("SELF-TEST", "PASS" if ok else "FAIL")
    return 0 if ok else 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--board", default=os.path.join(REPO, "out", "dispatch", "storyboard.json"))
    ap.add_argument("--episode")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return _self_test()

    board = json.load(open(a.board))
    episode = a.episode or episode_path(board.get("run_date"))
    ids_path = _ids_path(episode)
    src = open(episode).read()
    drawn = shot_of_beat(src, open(ids_path).read() if ids_path else None)

    named = strip_names(board)

    undrawn, misplaced = [], []
    for beat in board["beats"]:
        bid = beat["id"]
        where = drawn.get(bid)
        if where is None:
            if not opens_its_shot(beat, board):
                undrawn.append((bid, named[bid]))
        elif where != beat.get("shot"):
            misplaced.append((bid, named[bid], beat.get("shot"), where))

    for bid, name in undrawn:
        print(f"FAIL beat {bid} '{name}': no shot animates it, so the strip photographs a "
              f"moment the film never stages")
    for bid, name, said, real in misplaced:
        print(f"FAIL beat {bid} '{name}': the board files it under shot {said} and the engine "
              f"draws it in shot {real}, so the strip is named for another shot's action")

    bad = len(undrawn) + len(misplaced)
    print(f"strip_name_check: {len(named)} named strips, {bad} named for something the film "
          f"does not draw there")
    if bad:
        print("  A judge reads the strip NAME as a promise about the frames under it. When the")
        print("  two disagree the panel reports a move that did not happen, marks the Motion")
        print("  axis down for it, and the run reads that as a craft verdict. Fix the BOARD or")
        print("  the names, never the film, and never argue with the resulting score before")
        print("  this is green.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
