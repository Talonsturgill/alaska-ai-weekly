#!/usr/bin/env python3
"""Conform the September 3 approved paper plan to the selected full VO take.

Retains original line-relative fractions so reruns are idempotent. No edit can
silently change the delivered narration; this only binds picture/sound events.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'out/dispatch'

def main():
    board = json.loads((OUT / 'storyboard.json').read_text())
    vo = json.loads((OUT / 'vo_lines.json').read_text())['lines']
    props = json.loads((OUT / 'episode_props.json').read_text())
    script = json.loads((OUT / 'vo_script.json').read_text())['lines']
    starts = {x['idx']: x['start'] for x in vo}
    old_lengths = {x['idx']: len(x['text'].split()) * .425 for x in script}
    story_end = (props['total'] - props['credits']['frames']) / 30
    board['beats'][18]['anchor']['fraction'] = 0.0  # HIPAA lands as line9 says it.
    for beat in board['beats']:
        anchor = beat['anchor']; idx = anchor['vo_line']
        fraction = anchor.setdefault('fraction', anchor['offset'] / old_lengths[idx])
        end = starts.get(idx + 1, story_end)
        at = starts[idx] + fraction * (end - starts[idx])
        anchor['offset'] = round(at - starts[idx], 3)
        beat['at_s'] = round(at, 3)
        beat['vo'] = script[idx]['text']
    board['beats'][0]['at_s'] = 0.0
    beats = board['beats']
    # Approved claim labels are the actual data-driven lower-third strings.
    # These wording changes do not add claims or change their scope.
    for ident, label in {
        3: 'TCC INTRODUCES SULLY.AI',
        4: 'INTERIOR ALASKA · TRIBAL HEALTH',
        8: 'CONVERSATION TO DRAFT',
        9: 'PROVIDER REVIEWS AND APPROVES',
        17: 'DE-IDENTIFIED PORTIONS MAY BE REUSED',
    }.items():
        beats[ident-1]['draw']['annotation'] = label
    for i, beat in enumerate(beats):
        beat['t'] = f"{beat['at_s']:.3f}-{(beats[i+1]['at_s'] if i+1<len(beats) else story_end):.3f}"
    for shot, timing in zip(board['shots'], props['scenes'], strict=True):
        shot['t'] = f"{timing['from']/30:.3f}-{(timing['from']+timing['dur'])/30:.3f}"
    board['total_seconds'] = story_end
    board['open_loop']['pay_t'] = beats[31]['at_s']
    board['open_loop_2'].update(plant_t=beats[12]['at_s'], pay_t=beats[24]['at_s'])
    for state, idx in zip(board['throughline']['states'], [0,9,19,30,36], strict=True):
        state['at_s'] = beats[idx]['at_s']
    for reveal, idx in zip(board['reveals'], [4,23,31], strict=True):
        reveal['t'] = beats[idx]['at_s']
        reveal['hold'] = f"Hold all focal and secondary arrival motion for {reveal['hold_s']}s after disclosure."
    board['audio_arc'].update(dip_at=beats[24]['at_s'], riser_at=beats[28]['at_s'],
        silence_at=max(0, starts[18]-.7), payoff_at=starts[18])
    board['beats'][25]['draw']['subject'] = 'Possible recording portion and unanswered retention bracket'
    board['shots'][13]['world_arc'] = 'Patient lifts the audience question card; provider follows the gesture; window handle opens and the same warm room holds into credits.'
    # Two additional sourced facts replace redundant commentary, without moving
    # the surgical VO slots or pretending the original seven bundles were 14 facts.
    for i, subject, action, label in [
        (14, 'Recording policy bracket surrounds the coil',
         'Ninety-day policy bracket closes around the recording well only; no deletion is performed.',
         'RECORDINGS · 90 DAYS'),
        (15, 'Recording and approved note split into separate wells',
         'The recording well and chart-sheet well slide apart, preserving the bracket on recordings only.',
         'RECORDING ≠ APPROVED NOTE'),
        (18, 'The recording policy folds into a privacy shield',
         'A HIPAA privacy-policy shield folds beside the recording coil only; dotted reuse branch remains separate.',
         'TCC SAYS · RECORDING STORAGE FOLLOWS HIPAA'),
        (28, 'Patient tells the provider their choice',
         'Patient turns the question card toward the provider; a speech arc joins them and the provider acknowledges the choice.',
         'TO DECLINE · TELL YOUR PROVIDER')]:
        b = board['beats'][i]
        b['draw'].update(subject=subject, action=action, annotation=label)
        b['shows'] = action; b['means'] = label; b['choreo']['primary'] = action
        b['choreo']['reaction'] = 'The physically separate recording lever waits for the patient and provider.'
    # The real available inter-line gap, not a requested time that would erase VO.
    board['audio_arc']['silence_at'] = 105.81
    board['audio_arc']['silence_note'] = '0.90s fitted to the verified gap before line17; closing care principle follows.'
    (OUT / 'storyboard.json').write_text(json.dumps(board, indent=2)+'\n')
    print(f'Conformed {len(beats)} beats / {len(board["shots"])} shots to {story_end:.3f}s narrative')

if __name__ == '__main__':
    main()
