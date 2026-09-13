#!/usr/bin/env python3
"""Conform an approved board to its whole-file aligned narration, idempotently.

Unlike the archived dated conformers, this consumes each current board's line
anchors and reveal beat IDs. Reveals keep their physical landing/hold durations.
"""
import hashlib
import json
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'out/dispatch'


def conform(board, voice):
    b = deepcopy(board)
    spans = {x['idx']: x for x in voice['lines']}
    if 'planning_clock' not in b:
        starts = {int(x['vo_line']): round(x['at_s'] - x['offset'], 3) for x in b['beats']}
        b['planning_clock'] = {
            'starts': starts, 'end': b['total_seconds'],
            'beats': {x['id']: x['at_s'] for x in b['beats']},
            'open_loop': deepcopy(b['open_loop']),
            'open_loop_2': deepcopy(b['open_loop_2']),
            'states': deepcopy(b['throughline']['states']),
            'reveals': deepcopy(b['reveals']), 'audio_arc': deepcopy(b['audio_arc'])}
    old = b['planning_clock']
    starts = {int(k): float(v) for k, v in old['starts'].items()}
    if sorted(starts) != list(range(len(starts))) or set(starts) != set(spans):
        raise ValueError('The current board must anchor every aligned narration line exactly.')
    if any(spans[i]['start'] >= spans[i + 1]['start'] for i in range(len(spans) - 1)):
        raise ValueError('Aligned narration starts must increase strictly.')
    end = max(x['end'] for x in spans.values())

    def mapped(t):
        i = max([i for i, s in starts.items() if s <= float(t)] or [0])
        old_hi = starts.get(i + 1, old['end'])
        new_hi = spans[i + 1]['start'] if i + 1 in spans else end
        if old_hi <= starts[i]:
            raise ValueError('Planned narration starts must increase strictly.')
        ratio = (float(t) - starts[i]) / (old_hi - starts[i])
        return round(spans[i]['start'] + ratio * (new_hi - spans[i]['start']), 3)

    for beat in b['beats']:
        source = old['beats'].get(str(beat['id']), old['beats'].get(beat['id']))
        beat['at_s'] = mapped(source)
        beat['offset'] = round(beat['at_s'] - spans[beat['vo_line']]['start'], 3)
    for i, beat in enumerate(b['beats']):
        hi = b['beats'][i + 1]['at_s'] if i + 1 < len(b['beats']) else end
        beat['t'] = f"{beat['at_s']:.3f}-{hi:.3f}"
    for i, shot in enumerate(b['shots']):
        lo = spans[shot['vo_line']]['start']
        hi = spans[b['shots'][i + 1]['vo_line']]['start'] if i + 1 < len(b['shots']) else end + 1
        shot['t'] = f'{lo:.3f}-{hi:.3f}'
    for key in ['open_loop', 'open_loop_2']:
        for t in ['plant_t', 'pay_t']:
            b[key][t] = mapped(old[key][t])
    for dst, src in zip(b['throughline']['states'], old['states']):
        dst['at_s'] = mapped(src['at_s'])
    beat_by_id = {x['id']: x for x in b['beats']}
    for dst, src in zip(b['reveals'], old['reveals']):
        if src.get('beat_id') not in beat_by_id:
            raise ValueError('Each reveal must name a current beat_id.')
        onset = beat_by_id[src['beat_id']]['at_s']
        dst['t'] = onset
        dst['landing_at_s'] = round(onset + src.get('landing_frames', 22) / 30, 3)
        dst['hold_s'] = src['hold_s']
        dst['hold_until_s'] = round(dst['landing_at_s'] + dst['hold_s'], 3)
        dst['secondary_at_s'] = round(dst['hold_until_s'] + src.get('secondary_lag_s', .3), 3)
    for key in ['dip_at', 'riser_at', 'silence_at', 'payoff_at']:
        b['audio_arc'][key] = mapped(old['audio_arc'][key])
    b['total_seconds'] = round(end, 3)
    return b


def main():
    p = OUT / 'storyboard.json'
    b = json.loads(p.read_text())
    stamp = json.loads((OUT / '.run_stamp.json').read_text())
    if b['run_date'] != stamp['run_id']:
        raise SystemExit('Board must belong to the current run stamp.')
    b = conform(b, json.loads((OUT / 'vo_lines.json').read_text()))
    b['voice_conform'] = {
        'script_sha256': hashlib.sha256((OUT / 'vo_script.txt').read_bytes()).hexdigest(),
        'vo_wav_sha256': hashlib.sha256((OUT / 'audio/vo.wav').read_bytes()).hexdigest(),
        'method': 'Piecewise interpolation within actual whole-file aligned narration lines; original audio untouched.'}
    p.write_text(json.dumps(b, indent=2) + '\n')
    print('Conformed', len(b['beats']), 'beats;', len(b['shots']), 'shots;', b['total_seconds'], 'spoken seconds')
    print('Payoffs', b['open_loop']['pay_t'], b['open_loop_2']['pay_t'])


if __name__ == '__main__':
    main()
