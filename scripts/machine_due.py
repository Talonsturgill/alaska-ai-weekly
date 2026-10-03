#!/usr/bin/env python3
"""Is the weekly machine pass due? Exit 0 = yes, run Phase 9. Exit 1 = no.

WHY THIS EXISTS (owner, 2026-09-30: "machine upgrades weekly instead of every run")
-------------------------------------------------------------------------------
Every Dispatch run used to end in a self-upgrade phase that edited the engine, the gates and the
doctrine, verified each change with test renders, and scanned a 285 KB fix log for repeat
offenders. That work ran in the main loop, at the end of the run, when the conversation was at
its largest, so each of its calls re-read several hundred thousand tokens. Now the run queues
what it finds in docs/MACHINE_QUEUE.md, and once a week a pass works the queue in a fresh agent.

The pass is due when no pass has run yet, when six or more days have passed since the last one
(even with nothing queued, since 2026-10-02, because scripts/week_digest.py reads the panel's own
verdicts for the themes), or the day after a pass when an open item is a repeat offender (it has
bitten two or more runs), because a repeat offender waiting a week is a week of runs paying for it.

  python3 scripts/machine_due.py [--date YYYY-MM-DD]
  python3 scripts/machine_due.py --self-test
"""
import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
STATE = REPO / "config" / "machine_pass.json"
QUEUE = REPO / "docs" / "MACHINE_QUEUE.md"
DAYS = 6
ITEM = re.compile(r"^- \[ \] (.*)$")
REPEAT = re.compile(r"repeat:\s*(\d+)", re.I)


def open_items(text):
    items = []
    for line in text.splitlines():
        m = ITEM.match(line)  # column 0 only, so the indented format example never counts
        if m:
            r = REPEAT.search(m.group(1))
            items.append({"text": m.group(1), "repeat": int(r.group(1)) if r else 0})
    return items


def verdict(state, queue_text, today):
    # DUE ON SCHEDULE EVEN WITH AN EMPTY QUEUE (owner, 2026-10-02: upgrades "based on the recurring
    # themes that it saw during the week ... based on actual output"). The themes come from the
    # panel's own verdicts through scripts/week_digest.py, not only from what a run queued, so an
    # empty queue no longer means there is nothing to do.
    items = open_items(queue_text)
    last = state.get("last_pass")
    # Phase 9 records the pass as an object ({"date": ..., "shipped": [...]}) since 2026-10-02.
    if isinstance(last, dict):
        last = last.get("date")
    repeats = [i for i in items if i["repeat"] >= 2]
    if not last:
        return True, f"no pass has run yet ({len(items)} item(s) queued)"
    age = (today - dt.date.fromisoformat(last)).days
    if age >= DAYS:
        return True, f"last pass {last}, {age} days ago, {len(items)} item(s) queued"
    if repeats and age >= 1:
        return True, f"{len(repeats)} repeat offender(s) queued, last pass {last}"
    return False, f"last pass {last}, {age} days ago (due at {DAYS}), {len(items)} queued"


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=dt.date.today().isoformat())
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args(argv)
    if a.self_test:
        return self_test()
    state = json.loads(STATE.read_text()) if STATE.exists() else {}
    due, why = verdict(state, QUEUE.read_text() if QUEUE.exists() else "",
                       dt.date.fromisoformat(a.date))
    print(f"machine pass {'DUE' if due else 'not due'}: {why}")
    return 0 if due else 1


def self_test():
    d = dt.date(2026, 10, 10)
    q1 = "## Open\n- [ ] 2026-10-03 | repeat: 0 | a | evidence | fix\n"
    q2 = "## Open\n- [ ] 2026-10-03 | repeat: 2 | a | evidence | fix\n"
    q0 = ("    - [ ] <date found> | repeat: <n> | the format example\n"
          "## Open\n(none)\n## Done\n- [x] 2026-10-01 | repeat: 3 | old\n")
    checks = [
        (open_items(q0) == [], "closed items and the indented example are not open items"),
        (verdict({}, q0, d)[0], "the first pass is due even with nothing queued"),
        (verdict({"last_pass": "2026-10-04"}, q0, d)[0], "six days after a pass is due with nothing queued"),
        (not verdict({"last_pass": "2026-10-10"}, q2, d)[0], "never twice on one day"),
        (not verdict({"last_pass": "2026-10-06"}, q1, d)[0], "four days after a pass is not due"),
        (verdict({"last_pass": "2026-10-04"}, q1, d)[0], "six days after a pass is due"),
        (verdict({"last_pass": "2026-10-09"}, q2, d)[0], "a repeat offender is due at once"),
    ]
    for ok, msg in checks:
        print(("ok   " if ok else "FAIL ") + msg)
    if not all(ok for ok, _ in checks):
        return 1
    print("machine_due self-test passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
