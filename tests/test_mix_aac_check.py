import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from mix_aac_check import check_audio, parse_loudnorm, sha256, validate_metrics

SCRIPT = Path(__file__).resolve().parents[1] / "scripts/mix_aac_check.py"


def metrics(i=-14, tp=-1.5, lra=5):
    return {"input_i": i, "input_tp": tp, "input_lra": lra}


class AACMetricTests(unittest.TestCase):
    def test_positive_and_existing_inclusive_boundaries(self):
        for value in (-15, -14, -13):
            parsed, errors = validate_metrics(metrics(i=str(value), tp="-1.00"))
            self.assertEqual(errors, [])
            self.assertEqual(parsed["input_i"], value)

    def test_loudness_and_codec_peak_failures(self):
        for raw in (metrics(i=-15.01), metrics(i=-12.99), metrics(tp=-.99), metrics(tp=-.48)):
            self.assertTrue(validate_metrics(raw)[1])

    def test_lra_is_reported_without_new_gate_threshold(self):
        for lra in (0, 50):
            parsed, errors = validate_metrics(metrics(lra=lra))
            self.assertEqual((parsed["input_lra"], errors), (lra, []))

    def test_missing_malformed_and_nonfinite_metrics_fail_closed(self):
        for key in metrics():
            for value in (None, True, "not a number", "nan", "inf", "-inf"):
                raw = metrics()
                raw[key] = value
                with self.assertRaises(ValueError):
                    validate_metrics(raw)
            raw = metrics()
            del raw[key]
            with self.assertRaises(ValueError):
                validate_metrics(raw)

    def test_parse_real_style_json_and_refuse_bad_or_ambiguous_output(self):
        block = json.dumps(metrics())
        self.assertEqual(parse_loudnorm("ffmpeg log\n" + block)[1], [])
        for text in ("no analysis", '{"input_i": broken}', block + block,
                     '{"input_i":"-14","input_tp":"-2"}'):
            with self.assertRaises(ValueError):
                parse_loudnorm(text)

    def test_mocked_probe_records_pcm_hash_codec_and_cleans_temp(self):
        with tempfile.TemporaryDirectory() as directory:
            wav = Path(directory) / "mix.wav"
            wav.write_bytes(b"unchanged synthetic PCM fixture")
            completed = subprocess.CompletedProcess([], 0, "", json.dumps(metrics()))
            with patch("mix_aac_check.subprocess.run", return_value=completed) as run:
                report = check_audio(wav)
            self.assertTrue(report["pass"])
            self.assertEqual(report["pcm_sha256"], sha256(wav))
            self.assertEqual(report["codec_params"], {"codec": "aac", "bitrate": "192k",
                                                       "sample_rate_hz": 48000, "channels": 2})
            encode = run.call_args_list[0].args[0]
            self.assertEqual(encode[encode.index("-b:a") + 1], "192k")
            self.assertEqual(encode[encode.index("-ar") + 1], "48000")
            self.assertEqual(encode[encode.index("-ac") + 1], "2")
            self.assertFalse(Path(encode[-1]).parent.exists())
            self.assertEqual(wav.read_bytes(), b"unchanged synthetic PCM fixture")

    def test_ffmpeg_error_and_missing_metrics_are_failed_reports(self):
        with tempfile.TemporaryDirectory() as directory:
            wav = Path(directory) / "mix.wav"
            wav.write_bytes(b"fixture")
            with patch("mix_aac_check.subprocess.run", side_effect=
                       subprocess.CalledProcessError(2, "ffmpeg", stderr="encode failed")):
                report = check_audio(wav)
            self.assertFalse(report["pass"])
            self.assertIn("ffmpeg exited 2", report["errors"][0])
            completed = subprocess.CompletedProcess([], 0, "", "no metric object")
            with patch("mix_aac_check.subprocess.run", return_value=completed):
                report = check_audio(wav)
            self.assertFalse(report["pass"])
            self.assertIn("expected one loudnorm", report["errors"][0])

    def test_cli_missing_input_writes_failed_report_and_exits_one(self):
        with tempfile.TemporaryDirectory() as directory:
            wav = Path(directory) / "missing.wav"
            destination = Path(directory) / "reports/aac.json"
            result = subprocess.run([sys.executable, str(SCRIPT), "--wav", str(wav),
                                     "--report", str(destination)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 1)
            self.assertIn("AAC check FAIL", result.stdout)
            self.assertIs(json.loads(destination.read_text())["pass"], False)

    def test_cli_report_cannot_overwrite_pcm(self):
        with tempfile.TemporaryDirectory() as directory:
            wav = Path(directory) / "mix.wav"
            wav.write_bytes(b"preserve input")
            result = subprocess.run([sys.executable, str(SCRIPT), "--wav", str(wav),
                                     "--report", str(wav)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 1)
            self.assertIn("must not overwrite", result.stderr)
            self.assertEqual(wav.read_bytes(), b"preserve input")


if __name__ == "__main__":
    unittest.main()
