#!/usr/bin/env python3
"""Conform this episode's approved picture plan to the unaltered winning voice.

The saved planning clock is immutable metadata, so rerunning this operation never
compounds retiming. All derived sound and evidence consume the resulting beat clock.
"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'out/dispatch'

def main():
    p = OUT / 'storyboard.json'
    b = json.loads(p.read_text())
    if b.get('run_date') != '2026-09-12':
        raise SystemExit('This conformer only owns the September 12 episode.')
    vo = json.loads((OUT / 'vo_lines.json').read_text())
    spans = {x['idx']: x for x in vo['lines']}
    if len(spans) != 20:
        raise SystemExit('Expected the locked twenty-line script.')
    if 'planning_clock' not in b:
        starts = {int(x['vo_line']): round(x['at_s'] - x['offset'], 3) for x in b['beats']}
        b['planning_clock'] = {'starts':starts, 'end':b['total_seconds'],
            'beats':{x['id']:x['at_s'] for x in b['beats']},
            'shots':{x['id']:x['t'] for x in b['shots']},
            'open_loop':dict(b['open_loop']), 'open_loop_2':dict(b['open_loop_2']),
            'states':[dict(x) for x in b['throughline']['states']],
            'reveals':[dict(x) for x in b['reveals']]}
    old = b['planning_clock']
    starts = {int(k):float(v) for k,v in old['starts'].items()}
    end = max(x['end'] for x in spans.values())
    def mapped(t):
        i = max([i for i,s in starts.items() if s <= float(t)] or [0])
        old_hi = starts.get(i+1, old['end'])
        new_hi = spans[i+1]['start'] if i+1 in spans else end
        ratio = (float(t)-starts[i]) / (old_hi-starts[i])
        return round(spans[i]['start'] + ratio*(new_hi-spans[i]['start']), 3)
    for j,beat in enumerate(b['beats']):
        source = old['beats'].get(str(beat['id']),old['beats'].get(beat['id']))
        at = mapped(source)
        beat['at_s'] = at
        beat['offset'] = round(at-spans[int(beat['vo_line'])]['start'],3)
    for i,beat in enumerate(b['beats']):
        hi = b['beats'][i+1]['at_s'] if i+1<len(b['beats']) else end
        beat['t'] = f"{beat['at_s']:.3f}-{hi:.3f}"
    for i,shot in enumerate(b['shots']):
        lo = spans[int(shot['vo_line'])]['start']
        hi = spans[int(b['shots'][i+1]['vo_line'])]['start'] if i+1<len(b['shots']) else end+1
        shot['t'] = f'{lo:.3f}-{hi:.3f}'
    for k in ['open_loop','open_loop_2']:
        for t in ['plant_t','pay_t']:
            b[k][t]=mapped(old[k][t])
    for dst,src in zip(b['throughline']['states'],old['states']): dst['at_s']=mapped(src['at_s'])
    for dst,src in zip(b['reveals'],old['reveals']):
        for key in ['t','landing_at_s','hold_until_s','secondary_at_s']:
            dst[key]=mapped(src[key])
        dst['hold_s']=round(dst['hold_until_s']-dst['landing_at_s'],3)
        dst['planning_telegraph']=src['telegraph']
    b['total_seconds']=round(end,3)
    b['voice_conform']={'script_sha256':hashlib.sha256((OUT/'vo_script.txt').read_bytes()).hexdigest(),
                       'vo_wav_sha256':hashlib.sha256((OUT/'audio/vo.wav').read_bytes()).hexdigest(),
                       'method':'Piecewise interpolation within actual whole-file aligned narration lines; original audio untouched.'}
    p.write_text(json.dumps(b,indent=2)+'\n')
    print('Conformed',len(b['beats']),'beats;',len(b['shots']),'shots;',round(end,3),'spoken seconds')
    for s in b['shots']: print(s['id'],s['t'],s['title'])
    print('Payoffs',b['open_loop']['pay_t'],b['open_loop_2']['pay_t'])

if __name__=='__main__': main()
