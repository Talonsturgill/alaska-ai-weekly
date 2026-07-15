#!/usr/bin/env python3
"""docket_alerts.py sends subscriber email alerts for live docket events.

Zero-touch by design. The daily routine runs this in Phase 11 after the
docket ledger is current. It reads ledger/docket.json, works out which
alerts are due, bundles everything due into at most ONE email, sends it
through the Buttondown API, and appends the send to ledger/alerts.json
(the no-repeat ledger, committed with the run so an alert can never fire
twice). The key is read from BUTTONDOWN_API_KEY, then Buttondown, then
BUTTONDOWN; if none is set it prints SKIP and exits 0, so the routine
never breaks on a missing key.

Alert triggers, deliberately narrow so subscribers only hear from us when
something real happens
  window-open   an item is open-for-comment with open public access and
                subscribers have never been told
  near          a deadline or vote lands within the next 2 days

House style is enforced on the composed email, no em or en dashes, no
curly quotes, no emoji, and no prose colons (clock times and URLs pass).

  python scripts/docket_alerts.py --date 2026-07-10 [--dry-run]

Exit 0 always unless the ledger is unreadable or the send fails hard.
"""

import argparse
import json
import os
import re
import sys
import urllib.request
from datetime import date as ddate
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import docket_build as db

REPO = Path(__file__).resolve().parents[1]
API = "https://api.buttondown.com/v1/emails"
SITE = f"{db.DEFAULT_SITE}/docket/"
MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July",
              "August", "September", "October", "November", "December"]
MAX_PER_RUN = 1  # at most one subscriber email per day, ever


def pretty(iso):
    d = ddate.fromisoformat(iso)
    return f"{MONTH_FULL[d.month - 1]} {d.day}"


def lint(text):
    if db.BANNED.findall(text):
        db.fail(f"banned punctuation in alert email {db.BANNED.findall(text)[:4]}")
    t = re.sub(r"https?://\S+", " ", text)
    t = re.sub(r"\d{1,2}:\d{2}", " ", t)
    if ":" in t:
        db.fail(f"prose colon in alert email near {t[t.index(':') - 30:t.index(':') + 10]!r}")


def load_sent():
    p = REPO / "ledger/alerts.json"
    if not p.exists():
        return {"_spec": {"purpose": "No-repeat ledger for subscriber alerts. "
                          "Each send appends one entry; docket_alerts.py refuses "
                          "to send a key that already appears here."},
                "sent": []}
    return json.loads(p.read_text())


def due_alerts(items, sent_keys, today):
    due = []
    for it in items:
        if it["status"] not in ("open-for-comment", "pending-decision", "watching"):
            continue
        if it["status"] == "open-for-comment" and it["public_access"] == "open":
            k = f"{it['id']}/window-open"
            if k not in sent_keys:
                due.append((k, "window-open", it, db.next_date(it, today)))
        for d in it["key_dates"]:
            dd = ddate.fromisoformat(d["date"])
            if d["kind"] in ("deadline", "vote") and 0 <= (dd - today).days <= 2:
                k = f"{it['id']}/near/{d['date']}"
                if k not in sent_keys:
                    due.append((k, "near", it, d))
    return due


def compose(due, today):
    """One email covering everything due. Returns (subject, markdown body)."""
    if len(due) == 1:
        k, kind, it, d = due[0]
        when = pretty(d["date"]) if d else "now"
        if kind == "window-open":
            subject = f"A public comment window is open, {it['title']}"
        else:
            days = (ddate.fromisoformat(d["date"]) - today).days
            inwords = "today" if days == 0 else ("tomorrow" if days == 1 else f"in {days} days")
            subject = f"{it['title']}, {d['kind']} {inwords}"
    else:
        subject = f"{len(due)} Alaska AI decisions land in the next few days"

    lines = []
    for k, kind, it, d in due:
        lines.append(f"**{it['title']}**")
        lines.append(it["summary"].split(". ")[0] + ".")
        if d:
            lines.append(f"{d['label']}, {pretty(d['date'])}.")
        lines.append(it["access_note"])
        src = it["sources"][0]["url"]
        lines.append(f"Act or read the record here\n{src}")
        lines.append("")
    lines.append(f"Every decision we track, with live countdowns\n{SITE}")
    body = "\n\n".join(l for l in lines if l is not None)
    return subject, body


def send(subject, body, dry):
    key = (os.environ.get("BUTTONDOWN_API_KEY")
           or os.environ.get("Buttondown")
           or os.environ.get("BUTTONDOWN")
           or "").strip()
    if dry or not key:
        print(("DRY RUN" if dry else "SKIP, no Buttondown API key (set BUTTONDOWN_API_KEY or Buttondown)") +
              f"\nsubject {subject}\n---\n{body}")
        return bool(dry)
    req = urllib.request.Request(
        API, method="POST",
        data=json.dumps({"subject": subject, "body": body,
                         "status": "about_to_send"}).encode(),
        headers={"Authorization": f"Token {key}",
                 "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        if r.status not in (200, 201):
            db.fail(f"buttondown returned {r.status}")
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", required=True)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    today = ddate.fromisoformat(args.date)

    ledger = json.loads((REPO / "ledger/docket.json").read_text())
    sent = load_sent()
    sent_keys = {e["key"] for e in sent["sent"]}
    due = due_alerts(ledger["items"], sent_keys, today)
    if not due:
        print("no alerts due")
        return

    subject, body = compose(due, today)
    lint(subject + "\n" + body)
    delivered = send(subject, body, args.dry_run)
    if delivered and not args.dry_run:
        for k, kind, it, d in due:
            sent["sent"].append({"key": k, "kind": kind, "sent_on": args.date,
                                 "subject": subject})
        (REPO / "ledger/alerts.json").write_text(json.dumps(sent, indent=2) + "\n")
        print(f"sent 1 email covering {len(due)} alert(s), ledger updated")


if __name__ == "__main__":
    main()
