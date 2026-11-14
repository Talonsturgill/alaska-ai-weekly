import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from speech_priority import protect, mix_files, sha


class SpeechPriorityTests(unittest.TestCase):
    sr = 8000

    def signals(self):
        t = np.arange(self.sr * 4) / self.sr
        v = .02 * np.sin(2 * np.pi * 220 * t)
        v[:self.sr] = 0
        v[3*self.sr:] = 0
        b = .7 * np.sin(2 * np.pi * 700 * t)
        return v, b

    def test_loud_music_and_effect_bus_below_quiet_voice(self):
        v, b = self.signals()
        b[self.sr*2:self.sr*2+50] += 2  # loud effect already on the background bus
        mixed, protected, r = protect(v, b, self.sr)
        self.assertTrue(r['pass'])
        self.assertGreaterEqual(r['minimum_stereo_margin_db'], 18 - 1e-6)
        self.assertGreaterEqual(r['minimum_mono_margin_db'], 18 - 1e-6)
        self.assertLessEqual(np.max(np.abs(mixed)), .85 + 1e-9)
        # Original voice preserved except for one common headroom factor.
        np.testing.assert_allclose(mixed / r['shared_headroom_gain'] - protected, v[:, None], atol=1e-15)

    def test_stereo_and_mono_both_checked(self):
        v, b = self.signals()
        _, _, r = protect(np.column_stack([v, v*.4]), np.column_stack([b, b*.7]), self.sr)
        self.assertGreaterEqual(r['minimum_mono_margin_db'], 18 - 1e-6)

    def test_phase_cancelled_voice_rejected(self):
        v, b = self.signals()
        with self.assertRaisesRegex(ValueError, 'cancels in mono'):
            protect(np.column_stack([v, -v]), np.column_stack([b, b]), self.sr)

    def test_silent_background_valid_and_not_raised(self):
        v, b = self.signals()
        _, p, _ = protect(v, b*0, self.sr)
        self.assertTrue(np.all(p == 0))

    def test_background_recovers_in_long_gaps_and_has_no_steps(self):
        sr = self.sr
        v = np.zeros(sr*12); v[4*sr:6*sr] = .02
        b = np.ones_like(v)*.3
        _, p, _ = protect(v, b, sr)
        self.assertAlmostEqual(p[0, 0], .3)
        self.assertAlmostEqual(p[-1, 0], .3)
        self.assertLess(np.max(np.abs(np.diff(p[:, 0]))), .001)
        self.assertLessEqual(p[4*sr, 0], .02 * 10**(-18/20))

    def test_short_gap_after_quiet_word_tail_is_not_dead_air(self):
        # 2026-11-14: a -57 dBFS word tail before a loud gap effect demanded a ~69 dB cut and the
        # 10 dB/s release left the whole gap digital quiet (19.48, 29.82, 82.12, 103.24 s).
        sr = self.sr
        v = np.zeros(sr * 4)
        v[:sr] = .02                                    # narration, about -34 dBFS
        v[sr:sr + sr // 10] = 10 ** (-57 / 20)          # a quiet word tail, still above -60
        gap0, gap1 = sr + sr // 10, 2 * sr + sr // 10   # one second with no narration
        v[gap1:] = .02
        b = np.ones_like(v) * .5                        # loud effect on the background bus
        _, p, r = protect(v, b, sr)
        self.assertTrue(r['pass'])
        peak_db = 20 * np.log10(np.max(np.abs(p[gap0:gap1, 0])) / .5)
        # The old release reached only about -64 dB inside this gap; the bed must come back.
        self.assertGreater(peak_db, -35)
        self.assertLess(np.max(np.abs(np.diff(p[:, 0]))), .01)

    def test_release_stays_slow_while_narration_holds(self):
        sr = self.sr
        t = np.arange(sr * 3) / sr
        v = .02 * np.sin(2 * np.pi * 220 * t)            # continuous narration
        b = np.ones_like(v) * .01
        b[sr:sr + sr // 20] = .9                        # one loud hit under the words
        _, p, _ = protect(v, b, sr)
        g = 20 * np.log10(np.maximum(np.abs(p[:, 0]) / np.abs(b), 1e-15))
        w = sr // 20
        knots = g[::w]
        self.assertLessEqual(np.max(np.diff(knots)), 10 * .05 + 1e-6)

    def test_empty_nonfinite_silent_and_mismatched_inputs_fail(self):
        for v, b in (([], []), ([0]*20, [1]*20), ([np.nan], [0]), ([1], [np.inf]), ([1,2],[1])):
            with self.assertRaises(ValueError): protect(v, b, self.sr)

    def test_actual_ffmpeg_float_stems_and_evidence(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name, vol, hz in [('voice', .03, 220), ('background', .8, 880)]:
                subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-f','lavfi','-i',
                                f'sine=frequency={hz}:duration=1:sample_rate=8000',
                                '-af',f'volume={vol*8}', '-ac','2','-c:a','pcm_f32le',str(root/f'{name}.wav')], check=True)
            out, report = root/'mixed.wav', root/'report.json'
            r = mix_files(root/'voice.wav', root/'background.wav', out, report, self.sr)
            self.assertEqual(r['premix_sha256'], sha(out))
            self.assertTrue(json.loads(report.read_text())['pass'])

if __name__ == '__main__': unittest.main()
