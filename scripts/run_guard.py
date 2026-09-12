#!/usr/bin/env python3
"""Run-freshness guard: make it physically impossible to ship a PREVIOUS run's scratch.

WHY THIS EXISTS
---------------
out/dispatch/ is gitignored scratch that survives across container sessions.
The pipeline reads and writes artifacts BY PATH, and a stale file at the right
path is byte-for-byte indistinguishable from a fresh one. Two runs have already
been bitten by this:
  - 2026-07-18 found a stale shots.json left over from the 07-17 episode.
  - 2026-07-19 found stale post.txt / sources.json / shots.json / vo_script.json
    left over from a run about an ENTIRELY DIFFERENT story (the Mat-Su AIDEA land
    conveyance). Delivery could have emailed the wrong caption and source list.

The root cause is not "someone forgot to clean up." It is that the pipeline
DRIFTS: newer runs stopped producing some of the old artifacts (they moved to
caption.txt, inline shots, etc.), so those old outputs are never overwritten and
just linger. Any fix that asks every PRODUCER to stamp or register its output
re-introduces exactly this drift problem the next time the pipeline changes.

THE INVARIANT (why this is a real fix and not another sticky note)
------------------------------------------------------------------
A run starts at a recorded instant T. Every artifact this run legitimately
produces is written at or after T. Therefore ANY scratch file with mtime < T is,
by definition, a leftover from an earlier run and must never be trusted.

Freshness is thus a property the filesystem already tracks (mtime), and mtime is
trustworthy here precisely because scratch files are gitignored -- git never
rewrites their timestamps the way it does for checked-out files. No producer has
to change; only:
  1. Phase 0 stamps the run ONCE, before any artifact is produced:
         python3 scripts/run_guard.py init --run-id 2026-07-19
  2. Consumers route their reads through fresh(), which refuses (loudly, with
     both timestamps) anything older than the stamp:
         from run_guard import fresh
         post = open(fresh("out/dispatch/post.txt")).read()

A missing stamp is also a hard failure: if the run was never stamped we cannot
PROVE a file is fresh, so we refuse rather than guess. The escape hatch for
deliberate manual/standalone use is an explicit opt-out on the consumer
(dispatch_email.py --no-freshness-check), never a silent fallback.
"""
import argparse
import datetime as dt
import hashlib
import json
import math
import os
import re
import shutil
import sys
import tempfile
import time
from pathlib import Path

STAMP_REL = "out/dispatch/.run_stamp.json"

# A file written up to GRACE_S seconds before the stamp is still accepted. Real
# leftovers are hours-to-days old, so this never lets a genuine stale file
# through; it only avoids a false positive on a file created moments before init
# in the same run's own setup.
GRACE_S = 5.0


class StaleArtifactError(RuntimeError):
    """Raised when a scratch artifact predates the current run (or the run was
    never stamped, so freshness cannot be proven)."""


class RunInitError(RuntimeError):
    """Initialization cannot safely replace the previous run's state."""


def _stamp_path(root: str | None = None) -> Path:
    base = Path(root) if root else Path.cwd()
    return base / STAMP_REL


def _fmt(ts: float) -> str:
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(ts))


def _read_object(path: Path) -> dict:
    try:
        if path.is_symlink() or not path.is_file():
            raise ValueError
        data = json.loads(path.read_text())
        if not isinstance(data, dict):
            raise ValueError
        return data
    except (OSError, ValueError):
        # Never put receipt bodies, subjects, addresses or IDs in diagnostics.
        raise RunInitError(f"{path.name} is missing, unreadable or ambiguous") from None


def _instant(value, field: str) -> dt.datetime:
    try:
        instant = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
        if instant.tzinfo is None:
            raise ValueError
        return instant.astimezone(dt.timezone.utc)
    except (AttributeError, TypeError, ValueError):
        raise RunInitError(f"{field} needs an unambiguous timezone-aware timestamp") from None


def _completed_prior_run(out: Path, previous: dict | None, run_id: str) -> Path:
    """Prove a dated passing cut was delivered before permitting lock rollover.

    Bind verified draft readback to the prior stamp's date, the verdict time and
    the exact three deliverable hashes. SHIP_NOW is rewritten by ordinary final
    verification, so its mtime is not the time the cut was graded. Overnight or
    otherwise ambiguous records require investigation, never an automatic unlock.
    """
    try:
        prior_id = previous['run_id']
        prior_day, next_day = dt.date.fromisoformat(prior_id), dt.date.fromisoformat(run_id)
        if prior_day.isoformat() != prior_id or next_day.isoformat() != run_id or prior_day >= next_day:
            raise ValueError
    except (KeyError, TypeError, ValueError):
        raise RunInitError("protected cut has no matching, strictly prior-date run stamp") from None

    lock, verdict_path = out / 'SHIP_NOW', out / 'panel_verdict.json'
    receipt_path = out / 'gmail_draft_receipt.json'
    if lock.is_symlink() or not lock.is_file() or not lock.stat().st_size:
        raise RunInitError("protected cut needs both a nonempty SHIP_NOW and its panel verdict")
    verdict, receipt = _read_object(verdict_path), _read_object(receipt_path)
    for data in (verdict, receipt):
        for key in ('run_id', 'run_date', 'date'):
            if key in data and data[key] != prior_id:
                raise RunInitError("delivery metadata disagrees with the prior run stamp")
        if 'composition' in data and data['composition'] != previous.get('composition'):
            raise RunInitError("delivery composition disagrees with the prior run stamp")

    graded = _instant(verdict.get('recorded_at'), 'panel recorded_at')
    delivered = _instant(receipt.get('created_at'), 'draft created_at')
    started = dt.datetime.fromtimestamp(previous['started_at'], dt.timezone.utc)
    locked = dt.datetime.fromtimestamp(lock.stat().st_mtime, dt.timezone.utc)
    verdict_written = dt.datetime.fromtimestamp(verdict_path.stat().st_mtime, dt.timezone.utc)
    if any(value.date() != prior_day for value in (started, graded, locked, verdict_written, delivered)):
        raise RunInitError("stamp, verdict, lock and draft must all identify the same prior UTC date")
    grace = dt.timedelta(seconds=GRACE_S)
    if graded + grace < started or locked + grace < graded or delivered < graded:
        raise RunInitError("draft receipt does not prove delivery after this passing verdict")

    scores = [verdict.get('median'), verdict.get('threshold')]
    if (any(type(value) not in (int, float) or not math.isfinite(value) for value in scores)
            or not 0 < scores[1] <= scores[0] <= 10):
        raise RunInitError("prior verdict does not establish a passing cut")
    try:
        lock_scores = re.match(r'^median (\d+(?:\.\d+)?) cleared (\d+(?:\.\d+)?) at ', lock.read_text())
        if not lock_scores or [float(value) for value in lock_scores.groups()] != scores:
            raise ValueError
    except (OSError, ValueError):
        raise RunInitError("SHIP_NOW scores do not match the passing verdict") from None
    artifacts, evidence = verdict.get('artifacts'), verdict.get('evidence')
    deliverables = ('dispatch_master.mp4', 'dispatch_square.mp4', 'dispatch_master_720.mp4')
    if (not isinstance(artifacts, dict) or not set(deliverables) <= artifacts.keys()
            or not isinstance(evidence, dict) or not evidence
            or any(not isinstance(value, str) or not re.fullmatch(r'[0-9a-f]{64}', value)
                   for value in [*artifacts.values(), *evidence.values()])):
        raise RunInitError("prior verdict lacks bound deliverable and review-evidence hashes")
    for name in deliverables:
        path = out / name
        try:
            if path.is_symlink() or not path.is_file() or not path.stat().st_size:
                raise ValueError
            digest = hashlib.sha256()
            with path.open('rb') as fp:
                for block in iter(lambda: fp.read(1024 * 1024), b''):
                    digest.update(block)
            if digest.hexdigest() != artifacts[name]:
                raise ValueError
        except (OSError, ValueError):
            raise RunInitError(f"{name} is unavailable or does not match the prior verdict") from None
    readback = receipt.get('readback')
    if (not all(isinstance(receipt.get(key), str) and receipt[key].strip() for key in ('draft_id', 'message_id'))
            or receipt.get('unsent') is not True or receipt.get('labels') != ['DRAFT']
            or not isinstance(readback, dict)
            or any(readback.get(key) is not True for key in
                   ('exact_caption', 'square_link', 'vertical_link', 'all_sources', 'credits'))):
        raise RunInitError("Gmail receipt lacks verified unsent draft delivery and complete readback")
    archive = out / ('previous_run_gate_' + prior_id.replace('-', '_'))
    if archive.exists() or archive.is_symlink():
        raise RunInitError("prior gate archive already exists; refusing to overwrite evidence")
    return archive


def init(run_id: str, root: str | None = None) -> dict:
    """Stamp a new run, or resume the same run without changing its freshness clock."""
    p = _stamp_path(root)
    previous = _read_object(p) if p.exists() or p.is_symlink() else None
    if previous is not None:
        started = previous.get('started_at')
        if (not isinstance(previous.get('run_id'), str)
                or type(started) not in (int, float) or not math.isfinite(started) or started <= 0):
            raise RunInitError("existing run stamp is invalid; refusing to replace it")
        try:
            dt.datetime.fromtimestamp(started, dt.timezone.utc)
        except (OSError, OverflowError, ValueError):
            raise RunInitError("existing run timestamp is outside the supported range") from None
        if previous['run_id'] == run_id:
            return previous  # Preserve exact bytes, mtime, composition and all added metadata.

    out = p.parent
    protected = [out / 'panel_verdict.json', out / 'SHIP_NOW']
    archive = (_completed_prior_run(out, previous, run_id)
               if any(path.exists() or path.is_symlink() for path in protected) else None)
    stamp = {"run_id": run_id, "started_at": time.time()}
    out.mkdir(parents=True, exist_ok=True)
    staged = None
    moved = []
    try:
        # Finish the new stamp write before moving any protected file. Replace the
        # live stamp only after archiving; a failed move restores the original lock.
        with tempfile.NamedTemporaryFile(mode='w', dir=out, prefix='.run_stamp.', delete=False) as fp:
            staged = Path(fp.name)
            json.dump(stamp, fp, indent=2)
        if archive:
            archive.mkdir()
            shutil.copy2(p, archive / p.name)
            shutil.copy2(out / 'gmail_draft_receipt.json', archive / 'gmail_draft_receipt.json')
            for path in protected:  # The render-blocking lock moves last.
                target = archive / path.name
                path.rename(target)
                moved.append((path, target))
        os.replace(staged, p)
    except OSError:
        for original, archived in reversed(moved):
            archived.rename(original)
        # Keep copied proof on error for inspection; never silently overwrite it.
        raise RunInitError("initialization could not archive the prior gate and write the new stamp") from None
    finally:
        if staged is not None and staged.exists():
            staged.unlink()
    return stamp


def load_stamp(root: str | None = None) -> dict | None:
    p = _stamp_path(root)
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text())
    except (json.JSONDecodeError, OSError):
        return None


def check_path(path: str, root: str | None = None) -> tuple[bool, str]:
    """Return (ok, reason). ok=False means the file is stale, missing, or the run
    was never stamped. Never raises -- for callers that want to branch."""
    stamp = load_stamp(root)
    if stamp is None:
        return False, (
            f"run not stamped (no {STAMP_REL}); cannot prove freshness. "
            f"Run `python3 scripts/run_guard.py init --run-id <date>` in Phase 0 first."
        )
    started = float(stamp["started_at"])
    fp = Path(path)
    if not fp.exists():
        return False, f"{path} does not exist"
    mtime = fp.stat().st_mtime
    if mtime < started - GRACE_S:
        return False, (
            f"STALE: {path} was last written {_fmt(mtime)}, but this run "
            f"(run_id={stamp.get('run_id')}) started {_fmt(started)}. "
            f"This file is a leftover from an earlier run -- regenerate it this run "
            f"or point at the artifact this run actually produced."
        )
    return True, "fresh"


def fresh(path: str, *, check: bool = True, root: str | None = None) -> str:
    """Assert `path` belongs to the current run and return it unchanged, so it
    drops into existing code:  open(fresh("out/dispatch/post.txt")).
    Set check=False to bypass (deliberate manual use only)."""
    if not check:
        return path
    ok, reason = check_path(path, root)
    if not ok:
        raise StaleArtifactError(reason)
    return path


def _main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)

    pi = sub.add_parser("init", help="stamp the current run (Phase 0, once)")
    pi.add_argument("--run-id", required=True, help="e.g. the run date 2026-07-19")

    pc = sub.add_parser("check", help="check one path; exit 0 fresh, 1 stale/missing")
    pc.add_argument("path")

    a = ap.parse_args()
    if a.cmd == "init":
        try:
            s = init(a.run_id)
        except RunInitError as exc:
            print(f"run_guard: init refused: {exc}. Preserve the passing cut and investigate its delivery evidence.", file=sys.stderr)
            return 1
        print(f"run ready: run_id={s['run_id']} started_at={_fmt(s['started_at'])} -> {STAMP_REL}")
        return 0
    if a.cmd == "check":
        ok, reason = check_path(a.path)
        print(("OK: " if ok else "FAIL: ") + reason, file=sys.stderr if not ok else sys.stdout)
        return 0 if ok else 1
    return 2


if __name__ == "__main__":
    raise SystemExit(_main())
