import pathlib
import subprocess
import tempfile
import time
import unittest


class BackgroundRunnerTest(unittest.TestCase):
    def test_detached_exit_status_and_log(self):
        runner = pathlib.Path(__file__).resolve().parents[1] / "scripts/run_bg.sh"
        with tempfile.TemporaryDirectory() as root:
            subprocess.run(["bash", str(runner), root, "probe", "--", "bash", "-c",
                            "printf background-ok; exit 7"], check=True, capture_output=True)
            marker = pathlib.Path(root) / "probe.done"
            deadline = time.monotonic() + 10
            while not marker.exists() and time.monotonic() < deadline:
                time.sleep(0.05)
            self.assertEqual(marker.read_text().strip(), "7")
            self.assertEqual((pathlib.Path(root) / "probe.log").read_text(), "background-ok")
            self.assertTrue((pathlib.Path(root) / "probe.heartbeat").exists())


if __name__ == "__main__":
    unittest.main()
