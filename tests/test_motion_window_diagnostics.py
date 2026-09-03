"""All weak windows remain inspectable; reporting cannot move the actual gate."""
import importlib.util
from pathlib import Path
import unittest

SOURCE = Path(__file__).resolve().parents[1] / ".claude/skills/alaska-dispatch/quality_gate.py"
spec = importlib.util.spec_from_file_location("dispatch_quality_diagnostics", SOURCE)
quality = importlib.util.module_from_spec(spec)
spec.loader.exec_module(quality)


class MotionWindowDiagnosticsTests(unittest.TestCase):
    def test_reports_every_weak_window_in_order_including_after_sixth(self):
        wins = {i: i % 4 for i in reversed(range(20))}
        before = dict(wins)
        result = quality.motion_window_diagnostics(wins, 18, 2.0, 3)
        expected = [i * 2.0 for i in range(18) if i % 4 < 3]
        self.assertEqual(result["living_screen_weak_windows_s"], expected)
        self.assertGreater(len(expected), 6)
        self.assertEqual(wins, before)
        self.assertEqual(len(result["living_screen_windows"]), 20)

    def test_exempt_tail_is_visible_but_not_counted_as_a_weak_graded_window(self):
        rows = quality.motion_window_diagnostics({0: 3, 1: 2, 2: 1}, 2, 2.0, 3)
        self.assertEqual(rows["living_screen_weak_windows_s"], [2.0])
        self.assertEqual(rows["living_screen_windows"][-1],
                         {"start_s": 4.0, "regions": 1, "graded": False, "alive": False})
        self.assertTrue(rows["living_screen_windows"][0]["alive"])

    def test_fractional_window_and_empty_measurements_are_not_reinterpreted(self):
        self.assertEqual(quality.motion_window_diagnostics({3: 0}, 4, 1.5, 3)
                         ["living_screen_weak_windows_s"], [4.5])
        self.assertEqual(quality.motion_window_diagnostics({}, 0, 2.0, 3),
                         {"living_screen_windows": [], "living_screen_weak_windows_s": []})


if __name__ == "__main__":
    unittest.main()
