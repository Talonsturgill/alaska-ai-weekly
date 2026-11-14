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
slow release still governs every window that holds narration, so music does not pump with
syllables, and the release pass can only lower a knot, so the 18 dB margin is unchanged.
"""
import hashlib
import json
from pathlib import Path
import subprocess

import numpy as np

MARGIN_DB = 18.0
WINDOW_SECONDS = .05
VOICE_FLOOR = 10 ** (-60 / 20)
ATTACK_DB_S = 60.0       # lookahead: reductions are anticipated at this slope
RELEASE_DB_S = 10.0      # recovery across a window that holds narration
GAP_RELEASE_DB_S = 60.0  # recovery across a window with no narration (a genuine gap)


def _rms(samples):
    return float(np.sqrt(np.mean(np.square(samples, dtype=np.float64))))


def protect(voice, background, sample_rate, margin_db=MARGIN_DB):
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
        vs, bs = _rms(v), _rms(b)
        vm, bm = _rms(v.mean(axis=1)), _rms(b.mean(axis=1))
        active = vs > VOICE_FLOOR
        if active and vm < vs * .1:
            raise ValueError('narration cancels in mono; repair voice channel phase before mixing')
        cap = min(1., vs / max(bs, 1e-15) * 10 ** (-margin_db / 20),
                  vm / max(bm, 1e-15) * 10 ** (-margin_db / 20)) if active else 1.
        caps.append(cap)
        rows.append((active, vs, vm, start, end))
    if not any(r[0] for r in rows):
        raise ValueError('missing or inaudible narration')
    # Each endpoint <= both adjacent window caps: a linear ramp cannot exceed a cap.
    knots = np.minimum(np.r_[caps[0], caps], np.r_[caps, caps[-1]])
    db = 20 * np.log10(np.maximum(knots, 1e-15))
    # Lookahead attack, then release: slow across narration, fast across a gap window.
    # Both passes only ever lower a knot, so neither can relax a required reduction.
    for i in range(len(db) - 2, -1, -1):
        db[i] = min(db[i], db[i + 1] + ATTACK_DB_S * WINDOW_SECONDS)
    for i in range(1, len(db)):
        rate = RELEASE_DB_S if rows[i - 1][0] else GAP_RELEASE_DB_S  # ramp i-1 -> i spans window i-1
        db[i] = min(db[i], db[i - 1] + rate * WINDOW_SECONDS)
    gain = np.interp(np.arange(len(voice)), starts + [len(voice)], 10 ** (db / 20))
    protected = background * gain[:, None]
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
              'maximum_background_reduction_db': float(-min(db)), 'shared_headroom_gain': headroom,
              'attack_db_per_s': ATTACK_DB_S, 'release_db_per_s': RELEASE_DB_S,
              'gap_release_db_per_s': GAP_RELEASE_DB_S}
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


def mix_files(voice_path, background_path, output_path, report_path, sample_rate=44100, ffmpeg='ffmpeg'):
    Path(report_path).write_text(json.dumps({'pass': False, 'error': 'mix incomplete'}) + '\n')
    voice, background = decode(voice_path, sample_rate, ffmpeg), decode(background_path, sample_rate, ffmpeg)
    mixed, _, report = protect(voice, background, sample_rate)
    subprocess.run([ffmpeg, '-nostdin', '-v', 'error', '-y', '-f', 'f64le', '-ar', str(sample_rate),
                    '-ac', '2', '-i', '-', '-c:a', 'pcm_f32le', str(output_path)],
                   input=mixed.astype('<f8').tobytes(), check=True, capture_output=True)
    report.update(voice_sha256=sha(voice_path), background_sha256=sha(background_path),
                  premix_sha256=sha(output_path))
    Path(report_path).write_text(json.dumps(report, indent=2, allow_nan=False) + '\n')
    return report
