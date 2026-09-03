import importlib.util
import math
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("beat_delivery", ROOT / "scripts" / "beat_delivery.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class BeatStartTests(unittest.TestCase):
    def test_prefers_current_conformed_clock(self):
        self.assertEqual(MODULE.beat_start({"at_s": 4.25, "t": "1.000-2.000"}), 4.25)

    def test_accepts_legacy_numeric_and_range_clocks(self):
        self.assertEqual(MODULE.beat_start({"t": 2.5}), 2.5)
        self.assertEqual(MODULE.beat_start({"t": "3.125-4.500"}), 3.125)

    def test_rejects_unusable_clocks(self):
        for value in ("soon", -1, math.nan, math.inf):
            with self.subTest(value=value), self.assertRaises(ValueError):
                MODULE.beat_start({"t": value})


if __name__ == "__main__":
    unittest.main()
