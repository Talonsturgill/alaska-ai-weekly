#!/usr/bin/env python3
"""Content receipts for render, mix and encode; no checkout timestamps.

Cache keys and render receipts share one manifest. New chunks stay quarantined
until the full render validates. Explicit input paths support alternate props/WAVs.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile

ROOT = Path(__file__).resolve().parent.parent
SCHEMA = 2
RENDER_REQUIRED = ('video-engine/src/index.ts', 'video-engine/package.json',
                   'video-engine/package-lock.json', 'video-engine/tsconfig.json',
                   'video-engine/remotion.config.ts', 'scripts/render_parallel.sh',
                   'scripts/render_provenance.py', 'scripts/parse_engine.cjs')
RENDER_PATTERNS = ('video-engine/src/**/*', 'video-engine/public/**/*',
                   'video-engine/node_modules/.package-lock.json',
                   'out/dispatch/captions.json', 'scripts/build_scenes.py',
                   *RENDER_REQUIRED)
MIX_REQUIRED = ('scripts/dispatch_mix.py', 'scripts/sfx_bank.py', 'scripts/mix_aac_check.py',
                'out/dispatch/vo_lines.json', 'out/dispatch/episode_props.json',
                'out/dispatch/storyboard.json')
MIX_PATTERNS = (*MIX_REQUIRED, 'out/dispatch/music_credit.json',
                'scripts/render_provenance.py')
ENCODE_PATTERNS = ('scripts/mux_and_verify.sh', 'scripts/encode_deliverables.sh',
                   'scripts/render_provenance.py')
DELIVERABLES = ('dispatch_master.mp4', 'dispatch_square.mp4',
                'dispatch_master_720.mp4', 'dispatch_master_hosted.mp4',
                'poster.png', 'poster_thumb.jpg')


def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


# THE MIX HASHES WHAT THE MIX HEARS (machine pass 2026-10-15). storyboard.json was hashed as raw
# bytes, so a text-only edit to a beat's `shows` or a shot's prose while the render ran failed
# begin_encode with "source contents changed: out/dispatch/storyboard.json", and 10-15 paid a 17
# minute re-cut for a sentence nobody can hear. The mix receipt now hashes the board WITHOUT the
# fields below. Every other field, including any field added later, stays hashed, so the default is
# still "a change re-mixes". Nothing in the render reads storyboard.json (build_scenes bakes it into
# episode_props.json, which the render binds by hash), so the picture receipt is unchanged.
# `shows` feeds only the descriptive sfx_events.json label, never the audio; make_cut re-mixes on
# every cut, so the label catches up on the next one. mix_board_guard() refuses a mix whose own
# source starts reading any other dropped field.
BOARD = 'out/dispatch/storyboard.json'
BOARD_PROSE_TOP = ('concept', 'treatment', 'divergence_note', 'angle', 'hook', 'fingerprint',
                   'palette', 'title', 'slug', 'derived_from', 'engine', 'reveals', 'throughline',
                   'open_loop', 'open_loop_2', 'shots')
BOARD_PROSE_BEAT = ('shows', 'draw', 'choreo', 'means', 'vo', 'phrase', 'rehook', 'annotation')
MIX_READERS = ('scripts/dispatch_mix.py', 'scripts/sfx_bank.py', 'scripts/run_stamp.py')
LABEL_ONLY = ('shows',)


def board_audio_sha(path):
    """sha256 of the board with its prose removed: what a text-only edit cannot change."""
    board = json.loads(Path(path).read_text())
    if not isinstance(board, dict):
        return sha(path)
    kept = {k: v for k, v in board.items() if k not in BOARD_PROSE_TOP}
    if isinstance(kept.get('beats'), list):
        kept['beats'] = [{k: v for k, v in b.items() if k not in BOARD_PROSE_BEAT}
                         if isinstance(b, dict) else b for b in kept['beats']]
    payload = json.dumps(kept, sort_keys=True, separators=(',', ':')).encode()
    return 'board-audio:' + hashlib.sha256(payload).hexdigest()


def mix_board_guard(root=ROOT):
    """Fail when a mix source reads a board field the mix receipt does not hash."""
    import re
    for rel in MIX_READERS:
        path = Path(root) / rel
        if not path.is_file():
            continue
        for n, line in enumerate(path.read_text().splitlines(), 1):
            for key in BOARD_PROSE_TOP + BOARD_PROSE_BEAT:
                if not re.search(r'["\']' + key + r'["\']', line):
                    continue
                if key in LABEL_ONLY and '# label-only' in line:
                    continue   # the sfx_events label, never the audio
                raise ValueError(f'{rel}:{n} reads board field {key!r}, which the mix receipt does '
                                 'not hash (render_provenance.BOARD_PROSE_*). Remove it from that '
                                 'list in the same change, or the mix can go stale silently.')


def snapshot(root=ROOT, patterns=RENDER_PATTERNS):
    root = Path(root)
    files = sorted({p for pat in patterns for p in root.glob(pat) if p.is_file()})
    hashed = patterns is MIX_PATTERNS
    return {str(p.relative_to(root)): (board_audio_sha(p) if hashed and str(p.relative_to(root)) == BOARD
                                       else sha(p))
            for p in files}


def same_sources(expected, root=ROOT, patterns=RENDER_PATTERNS):
    current = snapshot(root, patterns)
    changed = sorted(k for k in expected.keys() | current.keys() if expected.get(k) != current.get(k))
    if changed:
        raise ValueError('source contents changed: ' + ', '.join(changed[:8]))


def require_files(root, names):
    for name in names:
        if not (Path(root) / name).is_file():
            raise ValueError('required input missing: ' + str(Path(root) / name))


def binding(path):
    path = Path(path).resolve()
    return {'path': str(path), 'sha256': sha(path)}


def check_binding(data):
    if data['sha256'] != sha(data['path']):
        raise ValueError('input/output contents changed: ' + data['path'])


def read(path):
    return json.loads(Path(path).read_text())


def write(path, data):
    """Publish a receipt atomically; interrupted writes never look complete."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile('w', dir=path.parent, prefix='.' + path.name,
                                     delete=False) as stream:
        temporary = Path(stream.name)
        try:
            json.dump(data, stream, indent=2)
            stream.write('\n')
        except BaseException:
            temporary.unlink(missing_ok=True)
            raise
    try:
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def receipt_path(output, kind):
    suffix = '.sources.json' if kind == 'render' else '.mix.json'
    return Path(str(Path(output).resolve()) + suffix)


def require_state(data, kind, state):
    if data.get('schema') != SCHEMA or data.get('kind') != kind or data.get('state') != state:
        raise ValueError(f'{kind} requires a schema-{SCHEMA} {state} receipt')


def render_manifest(props, composition, total, chunks, root=ROOT):
    require_files(root, RENDER_REQUIRED)
    if not composition or total <= 0 or chunks <= 0:
        raise ValueError('composition, positive total and positive chunks are required')
    browser = os.environ.get('REMOTION_BROWSER_EXECUTABLE')
    return {'sources': snapshot(root), 'props': binding(props),
            'composition': composition, 'total': total, 'chunks': chunks,
            'browser_override': binding(browser) if browser else None}


def cache_key(manifest):
    payload = {'schema': SCHEMA, 'manifest': manifest}
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def check_render_inputs(manifest, root=ROOT):
    require_files(root, RENDER_REQUIRED)
    same_sources(manifest['sources'], root)
    check_binding(manifest['props'])
    if manifest['browser_override']:
        check_binding(manifest['browser_override'])


def begin_render(video, props, composition, total, chunks, root=ROOT):
    manifest = render_manifest(props, composition, total, chunks, root)
    data = {'schema': SCHEMA, 'kind': 'render', 'state': 'rendering',
            'manifest': manifest, 'cache_key': cache_key(manifest)}
    write(receipt_path(video, 'render'), data)
    return data


def chunk_ranges(manifest):
    total, chunks = manifest['total'], manifest['chunks']
    per = (total + chunks - 1) // chunks
    return {f'c{i}.mp4': [i * per, min((i + 1) * per, total) - 1]
            for i in range(chunks) if i * per < total}


def restore_chunk(video, cache_dir, chunk, destination, root=ROOT):
    pending = read(receipt_path(video, 'render'))
    require_state(pending, 'render', 'rendering')
    check_render_inputs(pending['manifest'], root)
    try:
        data = read(Path(cache_dir) / 'complete.json')
        require_state(data, 'chunk-cache', 'complete')
        if data['cache_key'] != pending['cache_key']:
            return False
        want = data['chunks'][chunk]
        if want['frames'] != chunk_ranges(pending['manifest'])[chunk]:
            return False
        source = Path(cache_dir) / chunk
        if sha(source) != want['sha256']:
            return False
        shutil.copyfile(source, destination)
        if sha(destination) != want['sha256']:
            raise ValueError('cached chunk changed during copy')
        return True
    except (OSError, ValueError, KeyError, TypeError):
        return False


def finish_render(video, chunk_dir=None, cache_dir=None, root=ROOT):
    data = read(receipt_path(video, 'render'))
    require_state(data, 'render', 'rendering')
    check_render_inputs(data['manifest'], root)
    output = binding(video)
    if bool(chunk_dir) != bool(cache_dir):
        raise ValueError('chunk-dir and cache-dir must be supplied together')
    if chunk_dir:
        chunks = {name: {'sha256': sha(Path(chunk_dir) / name), 'frames': frames}
                  for name, frames in chunk_ranges(data['manifest']).items()}
        # No unvalidated chunk ever enters a reusable manifest. File replacement is
        # atomic and the complete manifest is published LAST, after source recheck.
        Path(cache_dir).mkdir(parents=True, exist_ok=True)
        for name in chunks:
            with tempfile.NamedTemporaryFile(dir=cache_dir, prefix='.pending-', delete=False) as stream:
                temporary = Path(stream.name)
            try:
                shutil.copyfile(Path(chunk_dir) / name, temporary)
                if sha(temporary) != chunks[name]['sha256']:
                    raise ValueError('chunk changed during cache promotion: ' + name)
                os.replace(temporary, Path(cache_dir) / name)
            finally:
                temporary.unlink(missing_ok=True)
        check_render_inputs(data['manifest'], root)
        check_binding(output)
        write(Path(cache_dir) / 'complete.json',
              {'schema': SCHEMA, 'kind': 'chunk-cache', 'state': 'complete',
               'cache_key': data['cache_key'], 'chunks': chunks})
    data.update(state='complete', output=output)
    write(receipt_path(video, 'render'), data)
    return data


def check_render(data, root=ROOT):
    require_state(data, 'render', 'complete')
    check_render_inputs(data['manifest'], root)
    check_binding(data['output'])


def begin_mix(wav, vo, inputs, root=ROOT):
    require_files(root, MIX_REQUIRED)
    mix_board_guard(root)
    paths = sorted({str(Path(p).resolve()) for p in inputs})
    if str(Path(wav).resolve()) in paths or Path(wav).resolve() == Path(vo).resolve():
        raise ValueError('mix output must not also be an input')
    data = {'schema': SCHEMA, 'kind': 'mix', 'state': 'mixing',
            'sources': snapshot(root, MIX_PATTERNS), 'vo': binding(vo),
            'inputs': [binding(p) for p in paths]}
    write(receipt_path(wav, 'mix'), data)
    return data


def check_mix_inputs(data, root=ROOT):
    require_files(root, MIX_REQUIRED)
    same_sources(data['sources'], root, MIX_PATTERNS)
    check_binding(data['vo'])
    for item in data['inputs']:
        check_binding(item)


def finish_mix(wav, root=ROOT):
    data = read(receipt_path(wav, 'mix'))
    require_state(data, 'mix', 'mixing')
    check_mix_inputs(data, root)
    data.update(state='complete', output=binding(wav))
    write(receipt_path(wav, 'mix'), data)
    return data


def check_mix(data, root=ROOT):
    require_state(data, 'mix', 'complete')
    check_mix_inputs(data, root)
    check_binding(data['output'])


def begin_encode(video, wav, root=ROOT):
    render = read(receipt_path(video, 'render'))
    mix = read(receipt_path(wav, 'mix'))
    check_render(render, root)
    check_mix(mix, root)
    if render['output']['path'] != str(Path(video).resolve()) or mix['output']['path'] != str(Path(wav).resolve()):
        raise ValueError('receipt belongs to a different input path')
    require_files(root, ENCODE_PATTERNS)
    data = {'schema': SCHEMA, 'kind': 'encode', 'state': 'encoding',
            'render': render, 'mix': mix, 'sources': snapshot(root, ENCODE_PATTERNS)}
    write(Path(root) / 'out/dispatch/delivery_sources.json', data)
    return data


def check_encode_inputs(data, root=ROOT):
    require_files(root, ENCODE_PATTERNS)
    check_render(data['render'], root)
    check_mix(data['mix'], root)
    same_sources(data['sources'], root, ENCODE_PATTERNS)


def finish_encode(root=ROOT):
    out = Path(root) / 'out/dispatch'
    data = read(out / 'delivery_sources.json')
    require_state(data, 'encode', 'encoding')
    check_encode_inputs(data, root)
    data.update(state='complete', outputs={name: sha(out / name) for name in DELIVERABLES})
    write(out / 'delivery_sources.json', data)
    return data


def check_delivery(root=ROOT):
    try:
        out = Path(root) / 'out/dispatch'
        data = read(out / 'delivery_sources.json')
        require_state(data, 'encode', 'complete')
        check_encode_inputs(data, root)
        for name in DELIVERABLES:
            if data['outputs'].get(name) != sha(out / name):
                raise ValueError('delivered bytes changed: ' + name)
        return True, 'render, mix, explicit inputs and all delivery hashes match'
    except (OSError, ValueError, KeyError, TypeError) as exc:
        return False, str(exc)


def self_test():
    """A prose edit to the board keeps the mix receipt; a timing, sound or new field breaks it."""
    mix_board_guard(ROOT)   # the real mix sources read no unhashed board field
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        for rel in MIX_REQUIRED + MIX_READERS + ('scripts/render_provenance.py',):
            dst = root / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            if (ROOT / rel).is_file() and rel.startswith('scripts/'):
                shutil.copyfile(ROOT / rel, dst)
            else:
                dst.write_text('{}\n')
        board = {'run_date': '2026-10-15', 'title': 'T', 'audio_arc': {'riser_at': 9.0},
                 'shots': [{'id': 1, 'title': 'a shot'}],
                 'beats': [{'id': 1, 'at_s': 1.0, 't': '1.000-2.000', 'sfx': 'tap',
                            'shows': 'a gate lifts', 'draw': {'subject': 'Gate'}}]}
        bpath = root / BOARD

        def put(b):
            bpath.write_text(json.dumps(b, indent=2) + '\n')
        put(board)
        vo, wav = root / 'vo.wav', root / 'master.wav'
        vo.write_bytes(b'vo')
        data = begin_mix(wav, vo, [], root)
        prose = json.loads(json.dumps(board))
        prose['beats'][0]['shows'] = 'the gate lifts its brow'
        prose['beats'][0]['draw'] = {'subject': 'Gate', 'action': 'lifts'}
        prose['shots'][0]['title'] = 'renamed'
        prose['title'] = 'The Door With a Condition'
        put(prose)
        check_mix_inputs(data, root)   # the 10-15 case: a text-only edit no longer re-cuts
        for mutate in (lambda b: b['beats'][0].update(at_s=1.2),
                       lambda b: b['beats'][0].update(sfx='thud'),
                       lambda b: b['audio_arc'].update(riser_at=8.0),
                       lambda b: b.update(new_field=1)):
            changed = json.loads(json.dumps(prose))
            mutate(changed)
            put(changed)
            try:
                check_mix_inputs(data, root)
            except ValueError:
                continue
            raise AssertionError('an audible board change kept the mix receipt')
        reader = root / 'scripts/dispatch_mix.py'
        reader.write_text(reader.read_text() + '\nX = _board["beats"][0]["means"]\n')
        try:
            mix_board_guard(root)
        except ValueError:
            pass
        else:
            raise AssertionError('a mix reading an unhashed board field must be refused')
    print('render_provenance self-test: PASS (prose edit keeps the mix receipt; timing, sound, '
          'arc and new fields break it; an unhashed read is refused)')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['begin-render', 'finish-render', 'restore-chunk',
                        'begin-mix', 'finish-mix', 'begin-encode', 'finish-encode', 'check',
                        'self-test'])
    parser.add_argument('--video')
    parser.add_argument('--props', default=str(ROOT / 'out/dispatch/episode_props.json'))
    parser.add_argument('--composition')
    parser.add_argument('--total', type=int)
    parser.add_argument('--chunks', type=int)
    parser.add_argument('--wav', default=str(ROOT / 'out/dispatch/audio/master.wav'))
    parser.add_argument('--vo', default=str(ROOT / 'out/dispatch/audio/vo.wav'))
    parser.add_argument('--input', action='append', default=[])
    parser.add_argument('--chunk-dir')
    parser.add_argument('--cache-dir')
    parser.add_argument('--chunk')
    parser.add_argument('--destination')
    args = parser.parse_args()
    if args.action == 'begin-render':
        if not args.video or not args.composition or args.total is None or args.chunks is None:
            parser.error('begin-render requires --video, --composition, --total and --chunks')
        print(begin_render(args.video, args.props, args.composition, args.total, args.chunks)['cache_key'])
    elif args.action == 'finish-render':
        finish_render(args.video, args.chunk_dir, args.cache_dir)
    elif args.action == 'restore-chunk':
        raise SystemExit(0 if restore_chunk(args.video, args.cache_dir, args.chunk, args.destination) else 1)
    elif args.action == 'begin-mix':
        begin_mix(args.wav, args.vo, args.input)
    elif args.action == 'finish-mix':
        finish_mix(args.wav)
    elif args.action == 'begin-encode':
        begin_encode(args.video, args.wav)
    elif args.action == 'finish-encode':
        finish_encode()
    elif args.action == 'self-test':
        self_test()
    else:
        ok, message = check_delivery()
        print(('PASS' if ok else 'FAIL') + ' [render provenance] ' + message)
        raise SystemExit(0 if ok else 1)


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print('FAIL [render provenance] ' + str(exc), file=sys.stderr)
        raise SystemExit(2)
