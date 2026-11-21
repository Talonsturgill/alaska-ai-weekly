#!/usr/bin/env python3
"""Speech-first stem mixing. Only background is reduced; narration is never automated.

A 50 ms window with audible narration must exceed the *combined* music, effects and
ambience by 18 dB in both stereo energy and the mono phone-speaker fold-down. This is
an engineering guard, not a claim of perceptual intelligibility or a substitute for
listening to the encoded delivery. Gain knots anticipate reductions and release
slowly under narration, and stay below each window's cap throughout interpolation.

GAPS RECOVER (machine pass 2026-11-14, queue: speech-priority-dead-air). The release was
10 dB/s everywhere. A word tail at -57 dBFS still counts as narration, so a gap SFX at
-5 dBFS right after it demanded a 68 dB cut, and at 10 dB/s the background needed about
seven seconds to come back: the 11-14 film's gaps at 19.48, 29.82, 82.12 and 103.24 s sat
under -55 dBFS delivered and every judge heard dead air. Across a window with no narration
the gain now releases at GAP_RELEASE_DB_S, so the bed returns inside a half-second gap. The
speech release is still slower than gap recovery. Both ramps only lower knots, preserving
the 18 dB margin. The shorter ramps follow the Nov 19 review: a quiet word or loud effect
should not duck the score across the next several lines.
"""
import hashlib
import json
from pathlib import Path
import subprocess

import numpy as np

MARGIN_DB = 18.0
WINDOW_SECONDS = .05
VOICE_FLOOR = 10 ** (-60 / 20)
ATTACK_DB_S = 120.0       # lookahead: reductions are anticipated at this slope
RELEASE_DB_S = 30.0      # recovery across a window that holds narration
GAP_RELEASE_DB_S = 100.0  # recovery across a window with no narration (a genuine gap)
SCORE_ATTACK_DB_S = 200.0 # score can approach each guarded window more closely
SCORE_RELEASE_DB_S = 90.0 # faster music recovery; effects keep RELEASE_DB_S


def _rms(samples):
    return float(np.sqrt(np.mean(np.square(samples, dtype=np.float64))))


def _cap(vs, vm, background, margin_db):
    factor = 10 ** (-margin_db / 20)
    return min(1., factor * vs / max(_rms(background), 1e-15),
               factor * vm / max(_rms(background.mean(axis=1)), 1e-15))


def _envelope(caps, rows, starts, length, attack=ATTACK_DB_S, release=RELEASE_DB_S):
    # Each endpoint <= both adjacent window caps: a linear ramp cannot exceed a cap.
    knots = np.minimum(np.r_[caps[0], caps], np.r_[caps, caps[-1]])
    db = 20 * np.log10(np.maximum(knots, 1e-15))
    # Lookahead attack, then release: slow across narration, fast across a gap window.
    # Both passes only ever lower a knot, so neither can relax a required reduction.
    for i in range(len(db) - 2, -1, -1):
        db[i] = min(db[i], db[i + 1] + attack * WINDOW_SECONDS)
    for i in range(1, len(db)):
        rate = release if rows[i - 1][0] else GAP_RELEASE_DB_S  # ramp i-1 -> i spans window i-1
        db[i] = min(db[i], db[i - 1] + rate * WINDOW_SECONDS)
    return np.interp(np.arange(length), starts + [length], 10 ** (db / 20))


def protect(voice, background, sample_rate, margin_db=MARGIN_DB, music=None):
    voice, background = np.asarray(voice, dtype=np.float64), np.asarray(background, dtype=np.float64)
    if voice.ndim == 1:
        voice = voice[:, None]
    if background.ndim == 1:
        background = background[:, None]
    if (voice.shape != background.shape or voice.ndim != 2 or voice.shape[1] not in (1, 2)
            or len(voice) == 0 or sample_rate <= 0 or not np.isfinite(voice).all()
            or not np.isfinite(background).all() or not np.isfinite(margin_db) or margin_db < 18):
        raise ValueError('invalid, nonfinite or mismatched speech/background stems')
    width = max(1, round(sample_rate * WINDOW_SECONDS))
    starts = list(range(0, len(voice), width))
    caps, rows = [], []
    for start in starts:
        end = min(start + width, len(voice))
        v, b = voice[start:end], background[start:end]
        vs, vm = _rms(v), _rms(v.mean(axis=1))
        active = vs > VOICE_FLOOR
        if active and vm < vs * .1:
            raise ValueError('narration cancels in mono; repair voice channel phase before mixing')
        cap = _cap(vs, vm, b, margin_db) if active else 1.
        caps.append(cap)
        rows.append((active, vs, vm, start, end))
    if not any(r[0] for r in rows):
        raise ValueError('missing or inaudible narration')
    gain = _envelope(caps, rows, starts, len(voice))
    protected = background * gain[:, None]
    protected_music = None
    effect_gain = gain
    if music is not None:
        music = np.asarray(music, dtype=np.float64)
        if music.shape != voice.shape or not np.isfinite(music).all():
            raise ValueError('invalid, nonfinite or mismatched music meter stem')
        # Keep effects on the original recovery envelope. Music can recover
        # faster after quiet syllables instead of staying buried under the next
        # phrase. Recheck the complete bus because different gains change its sum.
        score_gain = _envelope(caps, rows, starts, len(voice),
                               attack=SCORE_ATTACK_DB_S, release=SCORE_RELEASE_DB_S)
        provisional = protected + music * (score_gain - gain)[:, None]
        caps = [_cap(vs, vm, provisional[start:end], margin_db) if active else 1.
                for active, vs, vm, start, end in rows]
        guard = _envelope(caps, rows, starts, len(voice),
                          attack=SCORE_ATTACK_DB_S, release=SCORE_RELEASE_DB_S)
        protected = provisional * guard[:, None]
        effect_gain = gain * guard
        protected_music = music * (score_gain * guard)[:, None]
    margins, mono_margins = [], []
    for active, vs, vm, start, end in rows:
        if active:
            p = protected[start:end]
            margins.append(20 * np.log10(vs / max(_rms(p), 1e-15)))
            mono_margins.append(20 * np.log10(vm / max(_rms(p.mean(axis=1)), 1e-15)))
    if min(margins + mono_margins) < margin_db - 1e-6:
        raise ValueError('speech-priority measurement failed')
    combined = voice + protected
    # Shared static headroom changes neither balance nor voice dynamics; float output avoids clipping.
    headroom = min(1., .85 / max(float(np.max(np.abs(combined))), 1e-15))
    report = {'schema': 1, 'pass': True, 'scope': 'pre-master stems, not perceptual intelligibility',
              'margin_target_db': margin_db, 'window_seconds': WINDOW_SECONDS,
              'voice_activity_floor_dbfs': -60, 'speech_windows': len(margins),
              'minimum_stereo_margin_db': min(margins), 'minimum_mono_margin_db': min(mono_margins),
              'maximum_background_reduction_db': float(-20 * np.log10(np.min(effect_gain))), 'shared_headroom_gain': headroom,
              'attack_db_per_s': ATTACK_DB_S, 'release_db_per_s': RELEASE_DB_S,
              'gap_release_db_per_s': GAP_RELEASE_DB_S}
    if protected_music is not None:
        report['score_attack_db_per_s'] = SCORE_ATTACK_DB_S
        report['score_release_db_per_s'] = SCORE_RELEASE_DB_S
        # Measure the score alone after the actual per-sample protection, in
        # phone mono. Normalization applies equally to voice and score.
        # Ignore word tails when describing typical speech, not in the guard.
        regions = {'opening': [], 'middle': []}
        for active, _, vm, start, end in rows:
            if not active or vm < 10 ** (-30 / 20):
                continue
            where = 'opening' if start < 15 * sample_rate else 'middle'
            audible = _rms(protected_music[start:end].mean(axis=1))
            regions[where].append(20 * np.log10(max(audible, 1e-15) / vm))
        report['music_under_speech_mono'] = {
            region: {'windows': len(values),
                     'median_music_relative_to_voice_db': float(np.median(values)) if values else None}
            for region, values in regions.items()
        }
    return combined * headroom, protected, report


def decode(path, sample_rate, ffmpeg='ffmpeg'):
    result = subprocess.run([ffmpeg, '-nostdin', '-v', 'error', '-i', str(path), '-vn', '-ac', '2',
                             '-ar', str(sample_rate), '-f', 'f64le', '-'], check=True, capture_output=True)
    return np.frombuffer(result.stdout, dtype='<f8').reshape(-1, 2)


def sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def mix_files(voice_path, background_path, output_path, report_path, sample_rate=44100, ffmpeg='ffmpeg', *, music_path=None):
    Path(report_path).write_text(json.dumps({'pass': False, 'error': 'mix incomplete'}) + '\n')
    voice, background = decode(voice_path, sample_rate, ffmpeg), decode(background_path, sample_rate, ffmpeg)
    # ffmpeg's -t can end the two stems a few samples apart (2026-11-16: background 15 samples short of
    # 6,144,600). Pad or trim the background to the voice length when the difference is under 50 ms; a
    # larger mismatch is a real fault and still fails protect().
    def align(stem):
        short = len(voice) - len(stem)
        if 0 < abs(short) <= int(0.05 * sample_rate):
            return np.pad(stem, ((0, short), (0, 0))) if short > 0 else stem[:len(voice)]
        return stem

    music = align(decode(music_path, sample_rate, ffmpeg)) if music_path else None
    background = align(background)
    if music is not None:
        if voice.shape != background.shape or voice.shape != music.shape:
            raise ValueError('mismatched voice, effects or music stem lengths')
        background = background + music
    mixed, _, report = protect(voice, background, sample_rate, music=music)
    if music_path:
        report['music_meter_sha256'] = sha(music_path)
    subprocess.run([ffmpeg, '-nostdin', '-v', 'error', '-y', '-f', 'f64le', '-ar', str(sample_rate),
                    '-ac', '2', '-i', '-', '-c:a', 'pcm_f32le', str(output_path)],
                   input=mixed.astype('<f8').tobytes(), check=True, capture_output=True)
    report.update(voice_sha256=sha(voice_path), background_sha256=sha(background_path),
                  premix_sha256=sha(output_path))
    Path(report_path).write_text(json.dumps(report, indent=2, allow_nan=False) + '\n')
    return report
