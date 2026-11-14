#!/usr/bin/env python3
"""Preserve final measured audio evidence, not media, in the run archive.

Reuses delivery provenance validation. Never mixes, publishes or changes social state.
Missing/stale evidence raises an error rather than archiving an invented pass.
"""
import argparse
import datetime
import json
from pathlib import Path
try:
    from . import render_provenance as rp
    from .run_stamp import board_run_id
except ImportError:
    import render_provenance as rp
    from run_stamp import board_run_id


def archive(date, root=rp.ROOT):
    if datetime.date.fromisoformat(date).isoformat() != date:
        raise ValueError('date must be YYYY-MM-DD')
    root = Path(root).resolve()
    out = root / 'out/dispatch'
    ok, why = rp.check_delivery(root)
    if not ok:
        raise ValueError('cannot archive stale delivery: ' + why)
    # check_delivery above verifies the board against the mix's source hash.
    # Match both that bound run identity and the current stamp before touching an archive.
    run_date = board_run_id(rp.read(out / 'storyboard.json'), 'audio archive',
                            stamp=str(out / '.run_stamp.json'))
    if run_date != date:
        raise ValueError('archive date does not match the provenance-bound run: ' + run_date)
    delivery = rp.read(out / 'delivery_sources.json')
    report = rp.read(root / 'out/evidence/audio_report.json')
    measured = report.get('measured_on')
    if measured not in rp.DELIVERABLES or not measured.endswith('.mp4'):
        raise ValueError('audio report must measure a final video')
    if report.get('measured_sha256') != delivery['outputs'][measured]:
        raise ValueError('audio report is missing or has stale final-file hash')
    if not all(report.get('pass', {}).get(k) is True for k in
               ('loudness', 'true_peak', 'speech_priority')):
        raise ValueError('audio report did not pass')
    priority = rp.read(delivery['mix']['speech_priority']['path'])
    if report.get('speech_priority') != priority:
        raise ValueError('audio report uses different speech-priority evidence')
    # Receipts contain only file bindings/source hashes, not input contents or secrets.
    # Make checkout-owned paths portable; never claim old paths still exist elsewhere.
    def portable(value):
        if isinstance(value, dict):
            return {k: portable(v) for k, v in value.items()}
        if isinstance(value, list):
            return [portable(v) for v in value]
        if isinstance(value, str) and value.startswith(str(root) + '/'):
            return value[len(str(root)) + 1:]
        return value
    bundle = {'schema': 1, 'edition_date': date,
              'scope': 'Measured audio and hash-bound delivery provenance; not a listening review or publication receipt.',
              'delivery_sha256': delivery['outputs'], 'audio_report': report,
              'speech_priority': priority, 'provenance': portable(delivery)}
    destination = root / 'runs' / date / 'audio_evidence.json'
    rp.write(destination, bundle)
    return destination


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--date', required=True)
    args = parser.parse_args()
    print(archive(args.date))


if __name__ == '__main__':
    main()
