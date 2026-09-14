"""Current-source, current-props browser evidence shared by three preflight guards.

This adapter executes the real renderer. A source/library/font/props change
invalidates its cache; missing, failed, or incomplete measurement fails closed.
"""
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile

REPO = Path(__file__).resolve().parents[1]


def uses_runtime_boxes(path):
    return bool(re.search(r"\bconst\s+Box\s*:", Path(path).read_text())
                and re.search(r"<Box\b", Path(path).read_text()))


def provenance(source, props):
    files = {Path(source).resolve(), Path(props).resolve()}
    for folder, pattern in ((REPO / 'video-engine/src', '*'),
                            (REPO / 'video-engine/public/fonts', '*')):
        files.update(p for p in folder.rglob(pattern) if p.is_file())
    files.update(REPO / 'scripts' / name for name in
                 ('rendered_text_check.py', 'rendered_text_probe.cjs', 'rendered_text_loader.cjs'))
    files.update(p for p in (REPO / 'video-engine/package.json', REPO / 'video-engine/package-lock.json') if p.exists())
    return {str(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(files)}


def collect_rendered(source, props=None):
    source = Path(source).resolve()
    props = Path(props or REPO / 'out/dispatch/episode_props.json').resolve()
    cache_dir = Path(tempfile.gettempdir()) / 'alaska-dispatch-text-preflight'
    cache_dir.mkdir(exist_ok=True)
    key = hashlib.sha256((str(source) + str(props)).encode()).hexdigest()
    cache = cache_dir / (key + '.json')
    with (cache_dir / (key + '.lock')).open('w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        before = provenance(source, props)
        if cache.is_file():
            try:
                data = json.loads(cache.read_text())
                if data.get('provenance') == before:
                    return data
            except (OSError, ValueError):
                pass
        with tempfile.TemporaryDirectory(prefix='dispatch-text-request-') as temporary:
            options, result = Path(temporary) / 'options.json', Path(temporary) / 'result.json'
            options.write_text(json.dumps({'source': str(source), 'props': str(props)}))
            log = cache_dir / (key + '.log')
            with log.open('w') as output:
                run = subprocess.run(['node', str(REPO / 'scripts/rendered_text_probe.cjs'), str(options), str(result)],
                                     cwd=REPO, text=True, stdout=output, stderr=output, timeout=1800)
            if run.returncode:
                raise ValueError('Rendered text probe failed: ' + log.read_text()[-6000:])
            data = json.loads(result.read_text())
        if provenance(source, props) != before:
            raise ValueError('Source, library, fonts or props changed during rendered text measurement; rerun')
        expected_frames = sum(s['dur'] for s in json.loads(props.read_text())['scenes'])
        if (data.get('version') != 1 or data.get('source') != str(source)
                or data.get('complete') is not True or data.get('frames_measured') != expected_frames
                or not data.get('frames_measured') or not data.get('fit') or not data.get('bounds')
                or not data.get('copy_literals')):
            raise ValueError('Rendered text probe returned incomplete or wrong-source evidence')
        data['provenance'] = before
        staged = cache.with_suffix('.tmp')
        staged.write_text(json.dumps(data, indent=2) + '\n')
        os.replace(staged, cache)
        return data


def site_line(site):
    parts = site.split(':')
    return int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 1


def fit_results(data, min_margin=14, min_px=22):
    failures = []
    for issue in data['issues']:
        failures.append({'line': site_line(issue.get('site', '')), 'text': '<runtime coverage>',
                         'size': 0, 'text_w': 0, 'plate': [0, 0], 'margin_l': 0,
                         'margin_r': 0, 'why': issue['why']})
    for item in data['fit']:
        if (min(item['margin_l'], item['margin_r']) < min_margin
                or min(item['top'], item['bottom']) < 0 or item['size'] < min_px):
            failures.append({**item, 'line': site_line(item['site']),
                             'why': f"Actual browser glyphs overflow plate margin or type floor at frame {item['frame']} (S{item['scene']})"})
    return failures, len(data['fit'])


def projection_results(data, margin=54, frame_width=1080, caption_limit=1310):
    if data['issues']:
        raise ValueError('Rendered coverage unresolved: ' + '; '.join(x['why'] for x in data['issues']))
    bad, cap_bad = [], []
    for item in data['bounds']:
        scene, line = 'S' + str(item['scene']), site_line(item['site'])
        left, right = item['left'], item['right']
        if left < margin or right > frame_width-margin:
            bad.append((scene, line, item['kind'], item['text'][:60], round(right-left),
                        round(left), round(right), (left+right)/2, margin, frame_width-margin))
        if item['bottom'] > caption_limit:
            cap_bad.append((scene, line, item['kind'], item['text'][:60], round(item['top']), round(item['bottom'])))
    return bad, [], len(data['bounds']), [], cap_bad
