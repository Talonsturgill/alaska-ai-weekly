#!/usr/bin/env python3
"""Write the Gmail draft receipt that scripts/no_exit.py's delivery leg requires.

WHY (2026-08-03). no_exit.py used to ask only whether the encoded BYTES existed. That
let a run finish both cuts, look at them, and still stop without the draft that puts the
film in front of the owner, which is exactly the state the 2026-08-03 run stopped in.
The gate now asks for this receipt instead, so "delivered" means a draft exists rather
than a file exists.

Call this after the Gmail connector returns a draft id and readback verifies DRAFT.
For autonomous runs, write the verified result with the file tool and invoke:

  python3 scripts/record_draft.py --input out/dispatch/draft_input.json

The legacy flag interface remains supported:

  python3 scripts/record_draft.py --draft-id <id> --to <connected-profile-address> \\
      --subject "<subject>" [--square-url URL] [--vertical-url URL]
"""
import argparse, datetime as dt, json, os, sys
from run_guard import fresh, StaleArtifactError

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "out", "dispatch")


FIELDS = frozenset({'draft-id', 'to', 'subject', 'square-url', 'vertical-url'})


def load_input(path):
    """Read current-run connector results as data, never shell source."""
    def unique(pairs):
        values = {}
        for key, value in pairs:
            if key in values:
                raise ValueError('duplicate field')
            values[key] = value
        return values
    try:
        with open(fresh(path)) as fh:
            values = json.load(fh, object_pairs_hook=unique)
        if not isinstance(values, dict) or set(values) - FIELDS:
            raise ValueError('unknown field')
        if not {'draft-id', 'to'}.issubset(values):
            raise ValueError('missing field')
        if any(not isinstance(v, str) or not v.strip() or '\x00' in v for v in values.values()):
            raise ValueError('invalid value')
        return {key.replace('-', '_'): value for key, value in values.items()}
    except (OSError, ValueError, StaleArtifactError):
        raise ValueError('Draft receipt input is missing, stale, or invalid') from None


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", help="Fresh JSON file of the verified connector draft result")
    ap.add_argument("--draft-id")
    ap.add_argument("--to", help="Actual email address from the connected Gmail profile")
    ap.add_argument("--subject", default="")
    ap.add_argument("--square-url", default="")
    ap.add_argument("--vertical-url", default="")
    a = ap.parse_args(argv)
    if a.input:
        if any(getattr(a, key.replace('-', '_')) for key in FIELDS):
            ap.error('--input cannot be combined with receipt flags')
        try:
            values = load_input(a.input)
        except ValueError as exc:
            ap.error(str(exc))
        for key, value in values.items():
            setattr(a, key, value)
    if not a.draft_id or not a.to or not a.to.strip():
        ap.error('draft-id and to are required')

    if not a.draft_id.strip():
        print("refusing to write a receipt with no draft id", file=sys.stderr)
        return 1

    receipt = {
        "draft_id": a.draft_id,
        "to": a.to,
        "subject": a.subject,
        "created_at": dt.datetime.now().isoformat(timespec="seconds"),
        "square_url": a.square_url,
        "vertical_url": a.vertical_url,
        "note": "Written only after the Gmail connector accepted the draft. "
                "no_exit.py's delivery leg reads this.",
    }
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, "gmail_draft_receipt.json")
    with open(path, "w") as fh:
        json.dump(receipt, fh, indent=2)
    print(f"wrote {path}  draft={a.draft_id}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
