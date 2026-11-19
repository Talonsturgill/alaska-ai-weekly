import os
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
            self.assertTrue((pathlib.Path(root) / "probe.ready").exists())
            marker = pathlib.Path(root) / "probe.done"
            deadline = time.monotonic() + 10
            while not marker.exists() and time.monotonic() < deadline:
                time.sleep(0.05)
            self.assertEqual(marker.read_text().strip(), "7")
            self.assertEqual((pathlib.Path(root) / "probe.log").read_text(), "background-ok")
            self.assertTrue((pathlib.Path(root) / "probe.heartbeat").exists())

    def _run(self, *args):
        runner = pathlib.Path(__file__).resolve().parents[1] / "scripts/run_bg.sh"
        return subprocess.run(["bash", str(runner), *args], capture_output=True, text=True)

    def test_argument_errors_print_usage(self):
        # 2026-11-19 queue run-bg-usage: three calls failed on argument order with no usage line.
        with tempfile.TemporaryDirectory() as root:
            for args in ([root, "probe", "true"],            # missing --
                         [root, "probe", "--"],              # no command
                         ["probe", root, "--", "true"],      # name and marker dir swapped
                         [root, "--", "true"],               # missing name, dir taken as name
                         ["probe"]):
                r = self._run(*args)
                self.assertEqual(r.returncode, 2, args)
                self.assertIn("usage: run_bg.sh <name> -- <command...>", r.stderr, args)
                self.assertIn("run_bg.sh <marker_dir> <name> -- <command...>", r.stderr, args)
            self.assertEqual(os.listdir(root), [], "a rejected call writes nothing")

    def test_short_form_uses_default_marker_dir(self):
        repo = pathlib.Path(__file__).resolve().parents[1]
        bg = repo / "out/dispatch/bg"
        name = f"selftest_short_{os.getpid()}"
        try:
            r = self._run(name, "--", "bash", "-c", "printf short-ok")
            self.assertEqual(r.returncode, 0, r.stderr)
            marker = bg / f"{name}.done"
            deadline = time.monotonic() + 10
            while not marker.exists() and time.monotonic() < deadline:
                time.sleep(0.05)
            self.assertEqual(marker.read_text().strip(), "0")
            self.assertEqual((bg / f"{name}.log").read_text(), "short-ok")
        finally:
            for f in bg.glob(f"{name}.*"):
                f.unlink()


if __name__ == "__main__":
    unittest.main()
