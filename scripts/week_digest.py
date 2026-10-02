#!/usr/bin/env python3
"""What the Dispatch panel kept saying, counted, for the weekly machine pass.

WHY THIS EXISTS (owner, 2026-10-02)
-----------------------------------
The weekly machine pass is meant to fix "the things that really need to be fixed based on the
recurring themes that it saw during the week ... based on actual output". Until this file it read
only `docs/MACHINE_QUEUE.md`, what the runs remembered to queue, and `config/eval_ledger.yaml`,
whose last entry is 2026-09-03. So a pass could run with no idea what the last films' panels said.

This reads the panel's own verdicts and judge cards for every film in the window, from git
history, because each run overwrites `out/dispatch/panel_verdict.json` and the judge cards and the
history is the only place every run's copy survives, plus the archive's `panel_j*.json`. It counts
which axis each judge scored lowest and the axes the verdict notes name, and lists every concrete
defect verbatim. The default window is 14 days, because the Dispatch ships two or three films a
week and one week is too few films to call anything recurring.

  python3 scripts/week_digest.py --date 2026-10-03 [--days 14] [--out out/dispatch/week_digest.md]
  python3 scripts/week_digest.py --self-test
"""
import argparse
import datetime as dt
import hashlib
import html
import json
import re
import subprocess
import sys
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parents[1]
QUEUE = REPO / "docs" / "MACHINE_QUEUE.md"
UPGRADES = REPO / "docs" / "RUN_UPGRADES.md"
RUBRIC = REPO / "config" / "dispatch_rubric.yaml"
PANEL_FILES = ["out/dispatch/panel_verdict.json", "out/dispatch/judge1.json",
               "out/dispatch/judge2.json", "out/dispatch/judge3.json"]


def axis_names():
    try:
        crit = yaml.safe_load(RUBRIC.read_text())["rubric"]["criteria"]
        return [c["name"] if isinstance(c, dict) else str(c) for c in crit]
    except Exception:  # noqa: BLE001
        return []


def _num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def axis_scores(card):
    """{axis: score} out of a judge card, whichever of the shapes the panel has used."""
    ax = card.get("axes")
    out = {}
    if isinstance(ax, dict):
        for k, v in ax.items():
            s = v.get("score") if isinstance(v, dict) else v
            if _num(s):
                out[html.unescape(str(k))] = float(s)
    elif isinstance(ax, list):
        for a in ax:
            if isinstance(a, dict) and _num(a.get("score")):
                out[html.unescape(str(a.get("name") or a.get("axis")))] = float(a["score"])
    return out


def digest(items, axes, queue_text, upgrades_tail, end, days):
    """items: [(date, source, kind, obj)] where kind is 'verdict' or 'card'. Pure, for the self-test."""
    weakest, mentioned, cards, verdicts, defects = {}, {}, 0, [], []
    for date, src, kind, obj in items:
        if kind == "verdict":
            notes = str(obj.get("notes") or "")
            verdicts.append((date, obj.get("median"), obj.get("judges"), notes[:400]))
            for a in axes:
                head = a.split(" & ")[0].split(" and ")[0]
                if head and re.search(re.escape(head), notes, re.I):
                    mentioned.setdefault(a, set()).add(date)
        else:
            sc = axis_scores(obj)
            if sc:
                cards += 1
                lo = min(sc.values())
                for a, v in sc.items():
                    if v == lo:
                        weakest.setdefault(a, []).append(date)
            for d in obj.get("concrete_defects") or []:
                defects.append((date, src, str(d)[:300]))
            for b in obj.get("hard_blockers") or []:
                defects.append((date, src, "HARD BLOCKER: " + str(b)[:300]))
    films = sorted({d for d, *_ in items})
    L = [f"# The Dispatch machine digest, {len(films)} film date(s) in the {days} days to {end}", "",
         "Computed by `scripts/week_digest.py` from the git history of the panel's verdicts and "
         "judge cards, and the archive. Every number here is counted, never typed.", "",
         "## The panel's verdicts", "", "| date | median | judges | notes |", "|---|---|---|---|"]
    for date, med, judges, notes in sorted(verdicts):
        L.append(f"| {date} | {med} | {judges} | {notes.replace('|', '/')} |")
    L += ["", f"## The axis each judge scored lowest, over {cards} judge card(s)", "",
          "| axis | cards | dates |", "|---|---|---|"]
    for a, ds in sorted(weakest.items(), key=lambda x: (-len(x[1]), x[0])):
        L.append(f"| {a} | {len(ds)} | {', '.join(sorted(set(ds)))} |")
    if not weakest:
        L.append("| no judge card with axis scores | 0 | |")
    L += ["", "## The axes the verdict notes name, by film date", "", "| axis | films |", "|---|---|"]
    for a, ds in sorted(mentioned.items(), key=lambda x: (-len(x[1]), x[0])):
        L.append(f"| {a} | {len(ds)} ({', '.join(sorted(ds))}) |")
    if not mentioned:
        L.append("| none named | 0 |")
    L += ["", "## Every concrete defect and hard blocker, verbatim", ""]
    L += [f"- {d} {s}: {t}" for d, s, t in defects] or ["- none recorded"]
    open_q = [ln for ln in queue_text.splitlines() if ln.startswith("- [ ] ")]
    L += ["", "## The queue, open items", ""] + (open_q or ["- none"])
    L += ["", "## The newest fix log entries (docs/RUN_UPGRADES.md, tail)", "", "```", upgrades_tail.rstrip(), "```", ""]
    return "\n".join(L), {"films": len(films), "cards": cards,
                          "weakest": {a: len(d) for a, d in weakest.items()},
                          "mentioned": {a: len(d) for a, d in mentioned.items()}}


def git_items(end, days):
    """Every distinct committed copy of the panel files in the window, and the archive's cards."""
    start = (end - dt.timedelta(days=days - 1)).isoformat()
    until = (end + dt.timedelta(days=1)).isoformat()
    try:
        log = subprocess.run(["git", "log", "--since", start, "--until", until, "--format=%H %ad",
                              "--date=short", "--"] + PANEL_FILES, cwd=REPO, capture_output=True,
                             text=True, timeout=60).stdout.split("\n")
    except Exception:  # noqa: BLE001
        log = []
    items, seen = [], set()
    for ln in log:
        if not ln.strip():
            continue
        sha, date = ln.split()[:2]
        for path in PANEL_FILES:
            r = subprocess.run(["git", "show", f"{sha}:{path}"], cwd=REPO, capture_output=True, text=True)
            if r.returncode or not r.stdout.strip():
                continue
            h = hashlib.sha256(r.stdout.encode()).hexdigest()
            if h in seen:
                continue
            seen.add(h)
            try:
                obj = json.loads(r.stdout)
            except ValueError:
                continue
            if isinstance(obj, dict):
                items.append((str(obj.get("run_date") or date), path,
                              "verdict" if path.endswith("panel_verdict.json") else "card", obj))
    for d in sorted((REPO / "archive").glob("dispatch-*")):
        m = re.match(r"dispatch-(\d{4}-\d{2}-\d{2})", d.name)
        if not m or not (start <= m.group(1) <= end.isoformat()):
            continue
        for f in sorted(d.glob("panel_*.json")):
            try:
                obj = json.loads(f.read_text())
            except ValueError:
                continue
            kind = "verdict" if f.name == "panel_verdict.json" else "card"
            items.append((m.group(1), str(f.relative_to(REPO)), kind, obj))
    return items


def self_test():
    axes = ["Illustration craft & detail", "Motion & animation craft", "Typography & captions"]
    items = [
        ("2026-09-30", "v", "verdict", {"median": 7.05, "judges": [7.05, 7.25, 6.9],
                                        "notes": "weakest axis Illustration craft (characters below prop finish)"}),
        ("2026-09-30", "j1", "card", {"axes": {"Illustration craft &amp; detail": {"score": 6.5},
                                               "Motion & animation craft": {"score": 7.0}},
                                      "concrete_defects": ["the fisher's face is flat"]}),
        ("2026-09-27", "j2", "card", {"axes": [{"name": "Illustration craft & detail", "score": 6.8},
                                               {"name": "Typography & captions", "score": 7.5}],
                                      "hard_blockers": ["a caption over the face"]}),
        ("2026-09-27", "j3", "card", {"axes": {"Motion & animation craft": "n/a"}}),
    ]
    text, data = digest(items, axes, "## Open\n- [ ] 2026-09-30 | repeat: 0 | x\n", "TAIL", dt.date(2026, 10, 3), 14)
    checks = [
        (data["films"] == 2, "film dates are counted once each"),
        (data["cards"] == 2, "a card with no numeric axis score is not counted as a card"),
        (data["weakest"].get("Illustration craft & detail") == 2, "an escaped axis name is the same axis"),
        (data["mentioned"].get("Illustration craft & detail") == 1, "the verdict notes' axis is counted"),
        ("the fisher's face is flat" in text and "HARD BLOCKER: a caption over the face" in text,
         "defects and blockers reach the digest verbatim"),
        ("repeat: 0" in text and "TAIL" in text, "the queue and the fix log tail reach it"),
    ]
    e, ed = digest([], axes, "", "", dt.date(2026, 10, 3), 14)
    checks.append((ed["films"] == 0 and "no judge card" in e, "an empty window says so rather than failing"))
    live = git_items(dt.date(2026, 10, 3), 30)
    checks.append((isinstance(live, list), "the live git history reads"))
    for ok, msg in checks:
        print(("ok   " if ok else "FAIL ") + msg)
    bad = sum(1 for ok, _ in checks if not ok)
    print("week_digest self-test: " + ("all passed" if not bad else f"{bad} FAILED"))
    return 1 if bad else 0


def main():
    ap = argparse.ArgumentParser(description="the panel's recurring findings, counted")
    ap.add_argument("--date", default=dt.date.today().isoformat())
    ap.add_argument("--days", type=int, default=14)
    ap.add_argument("--out")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    end = dt.date.fromisoformat(a.date)
    tail = "\n".join(UPGRADES.read_text().splitlines()[-40:]) if UPGRADES.exists() else ""
    text, data = digest(git_items(end, a.days), axis_names(),
                        QUEUE.read_text() if QUEUE.exists() else "", tail, end, a.days)
    if a.out:
        Path(a.out).parent.mkdir(parents=True, exist_ok=True)
        Path(a.out).write_text(text)
        print(f"week_digest: {data['films']} film date(s), {data['cards']} judge card(s), written to {a.out}")
    else:
        print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
