"""The pre-payoff silence dip keeps the room playing (machine pass 2026-11-23).

Queue pre-payoff-silence-reads-dead-air: on 11-23 the dip pulled the whole background bus,
ambience included, to 0.15 under a music bed already at 0.015, so the window before the payoff
measured -59.9 dBFS in the master, under audio_report's -55 dBFS dead-air floor, and all three
seats wrote "dead air". dispatch_mix now dips the music and the effects but keeps the ambience
bus at AMB_DIP_GAIN, and its DIP FLOOR check fails a mix whose breath is digital quiet.

This remixes the newest run's real inputs (out/dispatch) in a throwaway tree, so nothing in
out/ is written, and reads the DIP FLOOR line and the master itself.
"""
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "out" / "dispatch"
NEEDED = ["storyboard.json", "vo_lines.json", "music_bed.wav", "music_credit.json", ".run_stamp.json",
          "audio/vo.wav", "audio/words.json"]
OPTIONAL = ["episode_props.json", "shots.json", "sfx_events.json"]


@unittest.skipUnless(all((SRC / n).exists() for n in NEEDED), "needs a mixed run in out/dispatch")
class DipFloorTest(unittest.TestCase):
    def test_dip_window_is_above_dead_air_floor(self):
        sys.path.insert(0, str(ROOT / "scripts"))
        from audio_report import DEAD_AIR_DBFS
        with tempfile.TemporaryDirectory() as tmp:
            t = pathlib.Path(tmp)
            for item in ROOT.iterdir():
                if item.name not in ("out", "scripts", ".git"):
                    os.symlink(item, t / item.name)
            shutil.copytree(ROOT / "scripts", t / "scripts")
            (t / "out" / "dispatch" / "audio").mkdir(parents=True)
            for n in NEEDED + [o for o in OPTIONAL if (SRC / o).exists()]:
                shutil.copy2(SRC / n, t / "out" / "dispatch" / n)
            p = subprocess.run([sys.executable, str(t / "scripts" / "dispatch_mix.py")],
                               capture_output=True, text=True, cwd=t)
            out = p.stdout + p.stderr
            self.assertEqual(p.returncode, 0, out[-3000:])
            m = re.search(r"DIP FLOOR silence dip window ([\d.]+)-([\d.]+)s measures (-?[\d.]+) dBFS", out)
            self.assertIsNotNone(m, "the mixer printed no DIP FLOOR measurement:\n" + out[-2000:])
            self.assertGreaterEqual(float(m.group(3)), DEAD_AIR_DBFS + 5,
                                    "the breath before the payoff is still near digital quiet")
            # The breath is still a breath: quality_gate's SILENCE_DIP margin (6 dB) holds.
            import numpy as np
            from scipy.io import wavfile
            sr, w = wavfile.read(t / "out" / "dispatch" / "audio" / "master.wav")
            k = float(np.iinfo(w.dtype).max + 1) if w.dtype.kind == "i" else 1.0
            w = w.astype(np.float64) / k
            w = w.mean(1) if w.ndim > 1 else w
            c = json.load(open(t / "out" / "dispatch" / "audio" / "sfx_events.json"))["silence_dip_at"]

            def rms(a, b):
                s = w[int(a * sr):int(b * sr)]
                return 20 * np.log10(np.sqrt((s * s).mean()) + 1e-12)
            din = rms(c - 0.35, c + 0.35)
            dnb = max(rms(c - 3.0, c - 0.6), rms(c + 0.6, c + 3.0))
            self.assertGreaterEqual(dnb - din, 6.0, f"dip only {dnb - din:.1f} dB under its neighbourhood")


if __name__ == "__main__":
    unittest.main()
