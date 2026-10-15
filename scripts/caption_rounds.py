#!/usr/bin/env python3
"""GATE B's round ledger: one target per rewrite, the scorer anchored, and the owner's cycle cap.

WHY THIS EXISTS (machine pass 2026-10-15; queue: caption-scorer-plateau, five entries, repeat
offender). Gate B scored 8.16, 8.34, 8.06 (10-09), 8.12 to 8.57 over five rounds (10-10), 7.3 to
7.9 over FIFTEEN rounds (10-11), 7.8 to 8.1 over six (10-15) and 8.0 to 8.42 over twenty-five
(10-07), every time with zero hard fails. Two things kept it there, and both are mechanical:

1. RE-ANCHORING. Each round's scorer graded from scratch, so a criterion whose text had not
   changed moved by a few tenths either way and the "weakest criterion" hopped from Hook to
   hashtags to POV. The rewrite chased whichever one the last card named and undid the round
   before. Fix: the scorer gets the previous card AND the line diff, and holds the score of any
   criterion whose lines did not change unless it names what changed its mind (scorer.md).
2. NO TARGET RULE AND NO CAP. The rubric has carried `max_revision_cycles: 5` all along and
   nothing read it. Fix: this ledger picks the rewrite's ONE target, the criterion with the largest
   weighted shortfall (weight x (threshold - score)), and keeps it until it reaches the threshold
   or fails to rise twice, so a rewrite stops spending its edit on hashtags while the Hook is the
   shortfall. At the cap, with zero hard fails, it says STOP and names the best round to ship, and
   the email discloses that card. Hard fails are never capped: they are fixed or nothing ships.

It changes no threshold. `rubric.ship_threshold` and `max_revision_cycles` are read from
config/linkedin_caption_rubric.yaml and never written.

    python3 scripts/caption_rounds.py record --card out/dispatch/caption_card.json   # after each scorer card
    python3 scripts/caption_rounds.py status       # the target, the diff for the next scorer, STOP or GO
    python3 scripts/caption_rounds.py --self-test

Exit codes: 0 = SHIP (passed) or STOP (cap reached, ship the named best round), 3 = GO (rewrite
the named target), 1 = an error or a hard fail at the cap (fix it, nothing ships with a hard fail).
"""
import argparse
import difflib
import hashlib
import json
import os
import re
import shutil
import sys
import tempfile

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
RUBRIC = os.path.join(REPO, "config", "linkedin_caption_rubric.yaml")
POST = os.path.join(REPO, "out", "dispatch", "post.txt")
LEDGER = os.path.join(REPO, "out", "dispatch", "caption_rounds.json")


def rubric_numbers(path=RUBRIC):
    """(threshold, max cycles, {criterion name: weight}) read from the YAML without a YAML dep."""
    text = open(path).read()
    thr = float(re.search(r"ship_threshold:\s*([\d.]+)", text).group(1))
    cap = int(re.search(r"max_revision_cycles:\s*(\d+)", text).group(1))
    weights = {}
    for m in re.finditer(r'-\s*name:\s*"([^"]+)"\s*\n\s*weight:\s*([\d.]+)', text):
        weights[m.group(1)] = float(m.group(2))
    return thr, cap, weights


def key(name):
    return re.sub(r"[^a-z]", "", name.lower().split("(")[0].split("/")[0])


def card_scores(card, weights):
    """{rubric criterion name: score} from either scorer shape (criteria list or scores dict)."""
    raw = {}
    if isinstance(card.get("criteria"), list):
        raw = {c["name"]: float(c["score"]) for c in card["criteria"]}
    elif isinstance(card.get("scores"), dict):
        raw = {k: float(v) for k, v in card["scores"].items()}
    out = {}
    for name in weights:
        k = key(name)
        hit = [v for n, v in raw.items() if key(n) and (key(n).startswith(k[:8]) or k.startswith(key(n)[:8]))]
        if not hit:
            raise ValueError(f"the card has no score for rubric criterion {name!r} (card names: {sorted(raw)})")
        out[name] = hit[0]
    return out


def load(path=LEDGER):
    return json.load(open(path)) if os.path.exists(path) else {"rounds": []}


def save(data, path=LEDGER):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with tempfile.NamedTemporaryFile("w", dir=os.path.dirname(path), delete=False) as s:
        json.dump(data, s, indent=2)
        s.write("\n")
    os.replace(s.name, path)


def total(scores, weights):
    return round(sum(scores[n] * w for n, w in weights.items()) / sum(weights.values()), 3)


def pick_target(rounds, thr, weights):
    """The criterion with the largest weighted shortfall, kept until it clears or stalls twice."""
    last = rounds[-1]["scores"]
    short = {n: weights[n] * (thr - last[n]) for n in weights if last[n] < thr}
    if not short:
        return None
    prev = rounds[-2].get("target") if len(rounds) >= 2 else None
    if prev in short:
        hist = [r["scores"][prev] for r in rounds if r.get("target") == prev or r is rounds[-1]]
        stalled = len(hist) >= 3 and hist[-1] <= hist[-2] <= hist[-3]
        if not stalled:
            return prev
        short.pop(prev)
        if not short:
            return prev
    return max(short, key=lambda n: (short[n], weights[n]))


def decide(data, thr, cap, weights):
    rounds = data["rounds"]
    if not rounds:
        return 1, "no round recorded yet; run the scorer, then `record --card`"
    last = rounds[-1]
    best = max(rounds, key=lambda r: (not r["hard_fails"], r["total"]))
    if not last["hard_fails"] and last["total"] >= thr:
        return 0, f"SHIP round {len(rounds)}: {last['total']:.2f} >= {thr} with zero hard fails"
    if len(rounds) >= cap:
        if best["hard_fails"]:
            return 1, (f"HARD FAIL at the cap ({len(rounds)} of {cap} rounds): {best['hard_fails']}. "
                       "A hard fail is never capped; fix it and score again.")
        return 0, (f"STOP at the cap ({len(rounds)} of {cap} rounds, rubric max_revision_cycles). Ship round "
                   f"{rounds.index(best) + 1} ({best['total']:.2f}, zero hard fails, post sha {best['sha'][:12]}); "
                   f"restore its text from caption_rounds.json if post.txt has moved on, and put its card in the "
                   f"email as below the {thr} bar. Do not start round {len(rounds) + 1}.")
    if last["hard_fails"]:
        return 3, f"GO round {len(rounds) + 1}: fix the hard fail(s) first: {last['hard_fails']}"
    t = last.get("target")
    return 3, (f"GO round {len(rounds) + 1} of {cap}: rewrite for ONE target, {t!r} "
               f"(scored {last['scores'][t]:.2f}, weight {weights[t]}). Leave the other lines alone.")


def record(card_path, post=POST, ledger=LEDGER, rubric=RUBRIC):
    thr, cap, weights = rubric_numbers(rubric)
    card = json.load(open(card_path))
    text = open(post).read()
    data = load(ledger)
    scores = card_scores(card, weights)
    r = {"sha": hashlib.sha256(text.encode()).hexdigest(), "text": text, "scores": scores,
         "total": total(scores, weights), "hard_fails": list(card.get("hard_fails") or [])}
    data["rounds"].append(r)
    r["target"] = pick_target(data["rounds"], thr, weights)
    save(data, ledger)
    return data


def status(ledger=LEDGER, rubric=RUBRIC, post=POST):
    thr, cap, weights = rubric_numbers(rubric)
    data = load(ledger)
    code, msg = decide(data, thr, cap, weights)
    rounds = data["rounds"]
    if rounds:
        print("rounds: " + ", ".join(f"{r['total']:.2f}" for r in rounds))
    print(msg)
    if code == 3 and rounds:
        print("\nFor the NEXT scorer (scorer.md, caption section): the previous card, and the lines that changed.")
        print("PREVIOUS SCORES: " + json.dumps(rounds[-1]["scores"]))
        if os.path.exists(post) and len(rounds) >= 1:
            cur = open(post).read()
            if cur != rounds[-1]["text"]:
                print("DIFF vs the last scored text:")
                for line in difflib.unified_diff(rounds[-1]["text"].splitlines(), cur.splitlines(),
                                                 "scored", "now", lineterm="", n=0):
                    print("  " + line)
    return code


def _self_test():
    tmp = tempfile.mkdtemp()
    try:
        post, ledger, card = (os.path.join(tmp, n) for n in ("post.txt", "rounds.json", "card.json"))
        thr, cap, weights = rubric_numbers()
        assert thr == 8.5 and cap >= 1 and len(weights) == 7, (thr, cap, weights)
        names = list(weights)
        hook, pov, tags = names[0], names[1], names[-1]

        def score(over, hard=()):
            s = {n: 8.6 for n in names}
            s.update(over)
            json.dump({"criteria": [{"name": n, "score": v, "weight": weights[n]} for n, v in s.items()],
                       "hard_fails": list(hard)}, open(card, "w"))

        def rnd(over, text, hard=()):
            open(post, "w").write(text)
            score(over, hard)
            return record(card, post, ledger)

        # the 10-11 shape: Hook is the weighted shortfall; hashtags a little low too
        d = rnd({hook: 7.5, tags: 8.0, pov: 8.0}, "v1")
        assert d["rounds"][-1]["target"] == hook, d["rounds"][-1]["target"]
        # the scorer hops to hashtags as "weakest", but Hook is still the biggest weighted shortfall: keep it
        d = rnd({hook: 7.6, tags: 7.4, pov: 8.0}, "v2")
        assert d["rounds"][-1]["target"] == hook
        # Hook stalls twice: move on to the next largest weighted shortfall
        d = rnd({hook: 7.6, tags: 7.4, pov: 8.0}, "v3")
        d = rnd({hook: 7.5, tags: 7.4, pov: 8.0}, "v4")
        assert d["rounds"][-1]["target"] != hook, d["rounds"][-1]["target"]
        code, msg = decide(d, thr, cap, weights)
        assert code == 3 and "GO" in msg
        while len(d["rounds"]) < cap:
            d = rnd({hook: 7.9, tags: 8.2}, f"v{len(d['rounds']) + 1}")
        code, msg = decide(d, thr, cap, weights)
        assert code == 0 and msg.startswith("STOP"), msg
        best = max(d["rounds"], key=lambda r: r["total"])
        assert f"round {d['rounds'].index(best) + 1}" in msg
        # a hard fail is never capped
        os.remove(ledger)
        for i in range(cap):
            d = rnd({hook: 9.0}, f"h{i}", hard=["first person"])
        code, msg = decide(d, thr, cap, weights)
        assert code == 1 and "HARD FAIL" in msg
        # a passing round ships
        os.remove(ledger)
        d = rnd({}, "ok")
        assert decide(d, thr, cap, weights)[0] == 0
        print("caption_rounds self-test: PASS (target = largest weighted shortfall, held until it stalls twice; "
              f"STOP at the rubric's {cap} cycles with the best clean round; hard fails never capped)")
        return 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    if "--self-test" in sys.argv:
        return _self_test()
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("action", choices=["record", "status"])
    ap.add_argument("--card")
    a = ap.parse_args()
    try:
        if a.action == "record":
            if not a.card:
                ap.error("record needs --card <scorer JSON>")
            record(a.card)
        return status()
    except (OSError, ValueError, KeyError) as exc:
        print(f"caption_rounds: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
