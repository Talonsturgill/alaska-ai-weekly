#!/usr/bin/env python3
"""Build the existing draft payload from data, without interpolating prose into a shell.

This does not send mail, upload media, or change permission rules. All existing
email validation runs in dispatch_email.py. The input and upgrades must be fresh.
"""
import argparse
import json
from pathlib import Path
import subprocess
import sys

from run_guard import fresh, StaleArtifactError

FIELDS = frozenset({
    'post', 'video-url-vertical', 'video-url-square', 'poster-url', 'voice',
    'vo-report', 'music', 'sources', 'score', 'note', 'cost-json', 'date',
    'title', 'to', 'out-html', 'upgrades-file',
})
REQUIRED = frozenset({'post', 'video-url-vertical', 'video-url-square', 'sources', 'to'})


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('duplicate field in email input')
        result[key] = value
    return result


def build_command(path):
    try:
        values = json.loads(Path(fresh(str(path))).read_text(), object_pairs_hook=unique_object)
        if not isinstance(values, dict) or set(values) - FIELDS:
            raise ValueError('unknown field or non-object email input')
        if not REQUIRED.issubset(values):
            raise ValueError('missing required email input field')
        if any(not isinstance(v, str) or not v.strip() or '\x00' in v for v in values.values()):
            raise ValueError('email input values must be nonempty strings without NUL')
        upgrades_path = values.pop('upgrades-file', None)
        if upgrades_path:
            values['upgrades'] = Path(fresh(upgrades_path)).read_text()
        command = [sys.executable, str(Path(__file__).with_name('dispatch_email.py'))]
        # The equals form keeps even a value beginning with -- as data, not an option.
        command.extend('--' + key + '=' + value for key, value in values.items())
        return command
    except (OSError, ValueError, StaleArtifactError):
        # Never echo the input, which contains the connected mailbox address.
        raise ValueError('Email input is missing, stale, or invalid; correct the current-run data file') from None


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', required=True)
    args = parser.parse_args(argv)
    try:
        command = build_command(args.input)
    except ValueError as exc:
        parser.exit(2, str(exc) + '\n')
    return subprocess.run(command, check=False).returncode


if __name__ == '__main__':
    sys.exit(main())
