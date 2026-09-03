"""Exercise the real gate CLI's report routing without touching a live scorecard."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

SOURCE = Path(__file__).resolve().parents[1] / ".claude/skills/alaska-dispatch/quality_gate.py"


class QualityReportDestinationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.skill = self.root / "skill"
        self.skill.mkdir()
        # Run an exact copy so a regression cannot overwrite a real run's report
        # in the repository's skill folder before this negative test detects it.
        self.script = self.skill / "quality_gate.py"
        shutil.copy2(SOURCE, self.script)

    def invoke(self, *args):
        return subprocess.run([sys.executable, str(self.script), "--frames", "run/frames", *args],
                              cwd=self.root, text=True, capture_output=True)

    def assert_failed_report(self, result, report):
        self.assertEqual(result.returncode, 1, result.stderr)
        self.assertIn("RESULT: FAIL", result.stdout)
        self.assertIn(f"quality report: {report.resolve()}", result.stdout)
        data = json.loads(report.read_text())
        self.assertIs(data["pass"], False)
        self.assertEqual(data["checks"], [{"name": "FRAMES", "pass": False,
                                          "detail": "no frames in run/frames"}])
        self.assertEqual(data["metrics"], {})
        self.assertFalse((self.skill / "quality_report.json").exists())

    def test_missing_run_writes_fail_report_beside_requested_frames(self):
        self.assertFalse((self.root / "run").exists())
        result = self.invoke()
        self.assert_failed_report(result, self.root / "run/quality_report.json")
        self.assertFalse((self.root / "run/frames").exists())

    def test_explicit_out_creates_parent_and_preserves_failure_exit(self):
        result = self.invoke("--out", "reports/nested/failure.json")
        self.assert_failed_report(result, self.root / "reports/nested/failure.json")
        self.assertFalse((self.root / "run/quality_report.json").exists())


if __name__ == "__main__":
    unittest.main()
