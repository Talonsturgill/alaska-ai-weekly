"""The generated Pace line is never padded and names the aim, and vo_report carries the gap share.

Machine pass 2026-11-21, queue pace-line-pads: "take a real breath at every period" read 290 words at
124.8 s with 25.8 percent of runtime in gaps of 0.35 s or more; the never-padded line landed 118.7 s.
"""
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))

import vo_length_probe  # noqa: E402
import vo_synth_gemini as vs  # noqa: E402


class PaceLineTest(unittest.TestCase):
    def test_line_is_never_padded_and_names_the_aim(self):
        line = vs._pace_line(120.0, 112.0)
        self.assertNotIn("real breath at every period", line)
        self.assertIn("never padded", line)
        self.assertIn("about one hundred and fifteen seconds", line)
        self.assertTrue(vs._pace_names_runtime(line, 120.0))

    def test_generated_line_is_the_measured_line(self):
        self.assertEqual(vs._pace_line(120.0, 112.0), vo_length_probe.PACE_MODES["anchored"])

    def test_without_a_band_floor_the_seconds_name_the_target(self):
        self.assertIn("about one hundred and twenty seconds", vs._pace_line(120.0))

    def test_gap_share(self):
        words = [{"s": 0.0, "e": 1.0}, {"s": 1.2, "e": 2.0}, {"s": 2.5, "e": 3.5}, {"s": 4.5, "e": 5.0}]
        row = vs.gap_share(words, 5.0)
        self.assertEqual(row["gaps"], 2)          # 0.5 s and 1.0 s; the 0.2 s beat is not a gap
        self.assertAlmostEqual(row["seconds"], 1.5)
        self.assertAlmostEqual(row["share"], 0.3)
        self.assertTrue(row["over_aim"])
        self.assertEqual(row["longest_s"], 1.0)


if __name__ == "__main__":
    unittest.main()
