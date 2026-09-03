"""Verify filmstrip evidence by the pixels of uniquely colored source frames."""
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from PIL import Image

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "scripts"))
from make_review_sheets import strip_indices


class ReviewStripTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.frames = Path(self.tmp.name) / "frames"
        self.output = Path(self.tmp.name) / "review"
        self.frames.mkdir()

    def make_frames(self, count):
        for i in range(count):
            Image.new("RGB", (8, 8), self.color(i)).save(self.frames / f"frame_{i:04d}.png")

    @staticmethod
    def color(index):
        return (index * 9, 255 - index * 7, index * 5)

    def run_script(self, strips):
        return subprocess.run([sys.executable, str(REPO / "scripts/make_review_sheets.py"),
                               "--frames", str(self.frames), "--out", str(self.output),
                               "--sheets", "0", "--strips", strips],
                              text=True, capture_output=True)

    def assert_samples(self, name, expected, width=270, height=480):
        with Image.open(self.output / f"strip_{name}.png") as strip:
            self.assertEqual(strip.size, (8 * width, height))
            actual = [strip.getpixel((i * width + width // 2, height // 2)) for i in range(8)]
        self.assertEqual(actual, [self.color(i) for i in expected])

    def test_last_group_uses_exact_frames_16_through_23(self):
        self.make_frames(24)
        result = self.run_script("last:16:1")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assert_samples("last", range(16, 24))

    def test_step_two_clamps_last_sample_to_23_not_21(self):
        self.make_frames(24)
        result = self.run_script("last:16:2;unclamped:8:2;crop:16:2:0,0,8,8")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assert_samples("last", range(9, 24, 2))
        self.assert_samples("unclamped", range(8, 23, 2))
        self.assert_samples("crop", range(9, 24, 2), width=8, height=8)

    def test_insufficient_files_fail_before_writing_evidence(self):
        self.make_frames(14)
        result = self.run_script("short:0:2")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("need 15 files, found 14", result.stderr)
        self.assertNotIn("IndexError", result.stderr)
        self.assertFalse(self.output.exists())

    def test_minimum_files_and_lower_clamp(self):
        self.assertEqual(strip_indices(15, 200, 8, 2), list(range(0, 15, 2)))
        self.assertEqual(strip_indices(24, -5, 8, 1), list(range(8)))
        self.assertEqual(strip_indices(1, 10, 1, 2), [0])

    def test_invalid_length_and_stride_are_rejected(self):
        for length, step in ((0, 1), (8, 0), (8, -1)):
            with self.assertRaisesRegex(ValueError, "positive"):
                strip_indices(24, 0, length, step)


if __name__ == "__main__":
    unittest.main()
