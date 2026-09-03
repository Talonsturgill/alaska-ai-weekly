#!/usr/bin/env python3
"""Bind rendered and encoded bytes to source contents, not checkout timestamps.

Only the render/encode wrappers create receipts. A changed input, missing receipt,
or changed output fails closed. Touching an unchanged source is harmless.
"""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'out/dispatch'
RENDER_PATTERNS = ('video-engine/src/**/*.ts', 'video-engine/src/**/*.tsx',
                   'video-engine/public/**/*', 'video-engine/package-lock.json',
                   'out/dispatch/episode_props.json', 'out/dispatch/captions.json',
                   'scripts/build_scenes.py', 'scripts/render_parallel.sh')
ENCODE_PATTERNS = ('out/dispatch/audio/master.wav', 'out/dispatch/audio/vo.wav',
                   'scripts/dispatch_mix.py', 'scripts/mux_and_verify.sh',
                   'scripts/encode_deliverables.sh')
DELIVERABLES = ('dispatch_master.mp4', 'dispatch_square.mp4',
                'dispatch_master_720.mp4', 'dispatch_master_hosted.mp4', 'poster.png')


def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def snapshot(root=ROOT, patterns=RENDER_PATTERNS):
    return {str(p.relative_to(root)): sha(p)
            for p in sorted({p for pat in patterns for p in root.glob(pat) if p.is_file()})}


def same_sources(expected, root=ROOT, patterns=RENDER_PATTERNS):
    current = snapshot(root, patterns)
    changed = sorted(k for k in expected.keys() | current.keys() if expected.get(k) != current.get(k))
    if changed:
        raise ValueError('source contents changed: ' + ', '.join(changed[:8]))


def read(path):
    return json.loads(Path(path).read_text())


def write(path, data):
    Path(path).write_text(json.dumps(data, indent=2) + '\n')


def render_receipt(video):
    return Path(str(Path(video).resolve()) + '.sources.json')


def check_receipt(video):
    data = read(render_receipt(video))
    if data.get('output_sha256') != sha(video):
        raise ValueError('silent render differs from its completed render receipt')
    same_sources(data['sources'])
    return data


def check_delivery():
    try:
        data = read(OUT / 'delivery_sources.json')
        if data.get('state') != 'complete':
            raise ValueError('encode did not complete')
        same_sources(data['render_sources'])
        same_sources(data['encode_sources'], patterns=ENCODE_PATTERNS)
        for name in DELIVERABLES:
            if data['outputs'].get(name) != sha(OUT / name):
                raise ValueError('delivered bytes changed: ' + name)
        return True, 'render inputs, mix inputs and all delivery hashes match'
    except (OSError, ValueError, KeyError) as exc:
        return False, str(exc)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['begin-render', 'finish-render', 'begin-encode', 'finish-encode', 'check'])
    parser.add_argument('--video')
    args = parser.parse_args()
    if args.action == 'begin-render':
        write(render_receipt(args.video), {'sources': snapshot(), 'state': 'rendering'})
    elif args.action == 'finish-render':
        data = read(render_receipt(args.video))
        same_sources(data['sources'])
        data.update(state='complete', output_sha256=sha(args.video))
        write(render_receipt(args.video), data)
    elif args.action == 'begin-encode':
        render = check_receipt(args.video)
        write(OUT / 'delivery_sources.json', {'state': 'encoding', 'render_sources': render['sources'],
              'encode_sources': snapshot(patterns=ENCODE_PATTERNS)})
    elif args.action == 'finish-encode':
        data = read(OUT / 'delivery_sources.json')
        same_sources(data['render_sources'])
        same_sources(data['encode_sources'], patterns=ENCODE_PATTERNS)
        data.update(state='complete', outputs={n: sha(OUT / n) for n in DELIVERABLES})
        write(OUT / 'delivery_sources.json', data)
    else:
        ok, message = check_delivery()
        print(('PASS' if ok else 'FAIL') + ' [render provenance] ' + message)
        raise SystemExit(0 if ok else 1)


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError) as exc:
        raise SystemExit('FAIL [render provenance] ' + str(exc))
