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
    python3 scripts/caption_rounds.py brief        # BEFORE the first draft: Hook pattern + lowest criteria
    python3 scripts/caption_rounds.py verify       # the final card is a recorded round (preflight, advisory)
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


CARD = os.path.join(REPO, "out", "dispatch", "caption_score.json")


def verify(card_path=CARD, ledger=LEDGER, rubric=RUBRIC):
    """THE FINAL CARD MUST BE A ROUND THE LEDGER SAW (machine pass 2026-11-13; queue:
    caption-scorer-hair-under-bar, repeat 5). 11-11 and 11-13 each shipped a card reading "round 5
    of 5, below the bar" while caption_rounds.json held none and one round respectively, so the
    one-target rule never ran and the per-round cards a root cause needs were gone both times.
    (0, msg) when the final card's scores are a recorded round, and a below-bar card sits on a
    ledger that reached the rubric's cap; (1, msg) naming what is missing otherwise."""
    thr, cap, weights = rubric_numbers(rubric)
    if not os.path.exists(card_path):
        return 0, f"no final caption card at {card_path} yet; nothing to verify"
    card = json.load(open(card_path))
    scores = card_scores(card, weights)
    tot = total(scores, weights)
    rounds = load(ledger)["rounds"]
    seen = [i + 1 for i, r in enumerate(rounds)
            if all(abs(r["scores"][n] - scores[n]) < 1e-6 for n in weights)]
    problems = []
    if not seen:
        problems.append(f"the final card ({tot:.2f}) is not any round in the ledger ({len(rounds)} recorded); "
                        f"run `caption_rounds.py record --card <card>` after EVERY scorer card")
    if tot < thr and not card.get("hard_fails") and len(rounds) < cap:
        problems.append(f"the card ships below the {thr} bar but the ledger recorded {len(rounds)} of the "
                        f"{cap} rounds the STOP rule needs; record each round, then follow status's target")
    if problems:
        return 1, "caption_rounds verify: FAIL\n  " + "\n  ".join(problems)
    return 0, (f"caption_rounds verify: ok, the final card is round {seen[-1]} of {len(rounds)} recorded "
               f"({tot:.2f}, bar {thr})")


def rubric_anchors(path=RUBRIC):
    """({criterion name: its '10' anchor text}, the Hook pattern line) read from the rubric YAML."""
    text = open(path).read()
    tens = {}
    for m in re.finditer(r'-\s*name:\s*"([^"]+)"\s*\n\s*weight:\s*[\d.]+\s*\n\s*10:\s*"([^"]+)"', text):
        tens[m.group(1)] = m.group(2)
    pm = re.search(r'^\s*pattern:\s*"([^"]+)"', text, re.M)
    return tens, (pm.group(1) if pm else "")


def archived_cards(root=REPO):
    """[(date, {criterion: score})] for every shipped caption card that kept per-criterion scores."""
    import glob
    _thr, _cap, weights = rubric_numbers()
    out = []
    for path in sorted(glob.glob(os.path.join(root, "runs", "*", "caption_score.json"))):
        try:
            out.append((os.path.basename(os.path.dirname(path)), card_scores(json.load(open(path)), weights)))
        except (OSError, ValueError, KeyError, TypeError):
            continue      # a totals-only card (round, history) has no criteria to learn from
    return out


def brief(cards=None, rubric=RUBRIC, last=6):
    """THE LEVERS BEFORE ROUND 1 (machine pass 2026-11-06; queue: caption-scorer-hair-under-bar,
    10-31, 11-01, 11-02, repeat 2). Three runs in a row took four to seven rounds to clear 8.5 by a
    few hundredths, and the round that cleared was a hashtag swap or a readability trim, levers a
    first draft can pull for free. The ledger only names a target AFTER a card, so the first draft
    never saw them. This prints, before the first scorer, the rubric's Hook pattern and the criteria
    that finished lowest on the shipped cards that kept their scores, each with its '10' anchor."""
    thr, cap, weights = rubric_numbers(rubric)
    tens, pattern = rubric_anchors(rubric)
    cards = archived_cards() if cards is None else cards
    recent = cards[-last:]
    print(f"BEFORE THE FIRST SCORER, the levers (bar {thr}, cap {cap} rounds):")
    print(f"  HOOK PATTERN, from the first draft: {pattern}")
    if not recent:
        print("  no shipped card kept per-criterion scores yet; target the Hook and the hashtags anyway")
        return 0
    short = {n: sum(weights[n] * max(0.0, thr - sc[n]) for _d, sc in recent) / len(recent) for n in weights}
    low = {n: sum(1 for _d, sc in recent if min(sc.values()) == sc[n] < max(sc.values())) for n in weights}
    ranked = sorted(weights, key=lambda n: (-short[n], -low[n], -weights[n]))
    print(f"  from {len(recent)} shipped card(s) with scores ({', '.join(d for d, _ in recent)}):")
    for n in ranked[:3]:
        mean = sum(sc[n] for _d, sc in recent) / len(recent)
        print(f"  - {n}: mean {mean:.2f}, lowest criterion on {low[n]} card(s). A 10 reads: {tens.get(n, '')}")
    print("  Write all three into the FIRST draft; the ledger's one-target rule starts at round 2.")
    return 0


def _self_test():
    tens, pattern = rubric_anchors()
    assert pattern.startswith("line 1 is the number") and len(tens) == 7, (pattern, len(tens))
    _thr, _cap, wts = rubric_numbers()
    nm = list(wts)
    fake = [("2026-11-01", {**{n: 8.5 for n in nm}, nm[-1]: 8.2, nm[3]: 8.3}),
            ("2026-11-02", {**{n: 8.6 for n in nm}, nm[-1]: 8.3})]
    import io
    import contextlib
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        brief(fake)
    lines = buf.getvalue().splitlines()
    assert "HOOK PATTERN" in lines[1] and nm[-1] in lines[3], lines
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
        # verify: the final card must be a recorded round, and a below-bar card needs the full cap
        assert verify(card, ledger)[0] == 0, verify(card, ledger)
        os.remove(ledger)
        rnd({hook: 8.0}, "low")
        code, msg = verify(card, ledger)
        assert code == 1 and "below the" in msg, msg
        score({hook: 8.1})
        code, msg = verify(card, ledger)
        assert code == 1 and "not any round" in msg, msg
        assert verify(os.path.join(tmp, "absent.json"), ledger)[0] == 0
        print("caption_rounds self-test: PASS (target = largest weighted shortfall, held until it stalls twice; "
              f"STOP at the rubric's {cap} cycles with the best clean round; hard fails never capped; "
              "brief names the Hook pattern and the shipped cards' lowest criteria; verify refuses an unrecorded final card)")
        return 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    if "--self-test" in sys.argv:
        return _self_test()
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("action", choices=["record", "status", "brief", "verify"])
    ap.add_argument("--card")
    a = ap.parse_args()
    try:
        if a.action == "brief":
            return brief()
        if a.action == "verify":
            code, msg = verify(a.card or CARD)
            print(msg)
            return code
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
