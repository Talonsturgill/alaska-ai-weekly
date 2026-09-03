"""A fresh script must pass provisional factual density before TTS can spend."""
import contextlib
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from scripts import vo_claims_check as check
from scripts import vo_synth_gemini as synth


class BeforeSynthTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.out = self.root / "out/dispatch"
        self.out.mkdir(parents=True)

    def write(self, name, value):
        (self.out / name).write_text(json.dumps(value))

    def fixture(self, claims=14, words=280, target=120):
        ids = [f"c{i + 1}" for i in range(claims)]
        self.script = {"lines": [{"idx": 0, "text": " ".join(["fact"] * words), "claims": ids}]}
        self.write("vo_script.json", self.script)
        self.write("claims.json", {"claims": [{"id": cid, "spoken": "fact", "requires": []}
                                               for cid in ids]})
        self.write("vo_direction.json", {"target_seconds": target})

    def run_check(self, before=True):
        output = io.StringIO()
        argv = ["vo_claims_check.py"] + (["--before-synth"] if before else [])
        with patch.object(check, "OUT", str(self.out)), patch.object(check, "REPO", str(self.root)), \
                patch.object(sys, "argv", argv), contextlib.redirect_stdout(output):
            try:
                result = check.main()
            except SystemExit as exc:
                result = exc.code
        return result or 0, output.getvalue()

    def test_fresh_seven_claim_script_fails_before_synth_without_old_timings(self):
        self.fixture(claims=7)
        result, output = self.run_check()
        self.assertEqual(result, 1)
        self.assertIn("7 claims across PROVISIONAL estimated 120s", output)
        self.assertNotIn("cannot measure runtime", output)

    def test_fresh_fourteen_claim_script_passes_before_synth_without_old_timings(self):
        self.fixture()
        result, output = self.run_check()
        self.assertEqual(result, 0)
        self.assertIn("PROVISIONAL [before-synth density estimate]", output)
        self.assertIn("Measured validation is still required", output)
        self.assertFalse((self.out / "vo_lines.json").exists())

    def test_before_synth_never_reads_stale_or_malformed_vo_lines(self):
        for timing in ("not JSON", '{"lines":[{"end":1}]}', '{"lines":[{"end":9999}]}'):
            for count, expected in ((7, 1), (14, 0)):
                with self.subTest(timing=timing, count=count):
                    self.fixture(claims=count)
                    (self.out / "vo_lines.json").write_text(timing)
                    self.assertEqual(self.run_check()[0], expected)

    def test_estimate_uses_larger_of_target_and_current_word_count(self):
        self.fixture(words=300, target=60)
        result, output = self.run_check()
        self.assertEqual(result, 1)
        self.assertIn("300 current-script words", output)
        self.assertIn("125.00s", output)
        self.fixture(words=120, target=120)
        self.assertEqual(self.run_check()[0], 0)
        seconds, _ = check.provisional_runtime(self.script, self.out / "vo_direction.json")
        self.assertEqual(seconds, 120)

    def test_missing_optional_direction_or_target_uses_current_words(self):
        self.fixture()
        (self.out / "vo_direction.json").unlink()
        self.assertEqual(self.run_check()[0], 0)
        self.write("vo_direction.json", {"word_count": 1, "predicted_runtime_s": 1})
        seconds, detail = check.provisional_runtime(self.script, self.out / "vo_direction.json")
        self.assertAlmostEqual(seconds, 280 / 2.4)
        self.assertIn("no declared target", detail)

    def test_invalid_declared_target_fails_closed(self):
        for target in (0, -1, True, None, "120", float("nan"), float("inf")):
            with self.subTest(target=target):
                self.fixture(target=target)
                result, output = self.run_check()
                self.assertEqual(result, 1)
                self.assertIn("finite positive number", output)

    def test_malformed_direction_fails_closed(self):
        self.fixture()
        (self.out / "vo_direction.json").write_text("not JSON")
        self.assertEqual(self.run_check()[0], 1)

    def test_empty_script_or_no_claim_ids_cannot_skip_precheck(self):
        self.fixture(words=0)
        self.assertEqual(self.run_check()[0], 1)
        self.fixture(claims=0)
        result, output = self.run_check()
        self.assertEqual(result, 1)
        self.assertIn("no verified claim IDs", output)

    def test_normal_mode_still_requires_actual_timings(self):
        self.fixture()
        result, output = self.run_check(before=False)
        self.assertEqual(result, 1)
        self.assertIn("cannot measure runtime", output)
        self.assertNotIn("PROVISIONAL", output)

    def test_normal_mode_uses_actual_duration_not_target_or_word_estimate(self):
        self.fixture(claims=7, words=500, target=999)
        self.write("vo_lines.json", {"lines": [{"end": 60}]})
        self.assertEqual(self.run_check(before=False)[0], 0)
        self.fixture(claims=14, words=10, target=10)
        self.write("vo_lines.json", {"lines": [{"end": 130}]})
        result, output = self.run_check(before=False)
        self.assertEqual(result, 1)
        self.assertIn("14 claims across 130s", output)

    def test_same_script_bans_obligations_and_cadence_apply_in_both_modes(self):
        for kind in ("punctuation", "obligation", "cadence", "unsourced quantity"):
            with self.subTest(kind=kind):
                self.fixture(words=120)
                self.write("vo_lines.json", {"lines": [{"end": 120}]})
                if kind == "punctuation":
                    self.script["lines"][0]["text"] += ": detail"
                elif kind == "cadence":
                    self.script["lines"][0]["text"] += " hourly"
                elif kind == "unsourced quantity":
                    self.script["lines"].append({"idx": 1, "text": "One million people.", "claims": []})
                else:
                    ledger = json.loads((self.out / "claims.json").read_text())
                    ledger["claims"][0]["requires"] = ["Must label this in this round."]
                    self.write("claims.json", ledger)
                self.write("vo_script.json", self.script)
                self.assertEqual(self.run_check(before=True)[0], 1)
                self.assertEqual(self.run_check(before=False)[0], 1)

    def test_coverage_rule_is_not_bypassed_before_synth(self):
        self.fixture(claims=21, words=120, target=60)
        self.script["lines"][0]["claims"] = self.script["lines"][0]["claims"][:14]
        self.write("vo_script.json", self.script)
        result, output = self.run_check()
        self.assertEqual(result, 1)
        self.assertIn("14 of 21", output)

    def test_synth_failure_precheck_precedes_api_credentials_and_output_creation(self):
        failure = subprocess.CalledProcessError(1, ["vo_claims_check.py"])
        with patch.object(synth.subprocess, "run", side_effect=failure) as run, \
                patch.object(synth, "_synth_retry") as api, \
                patch.object(synth, "_key") as key, \
                patch.object(synth.os, "makedirs") as mkdir:
            with self.assertRaises(subprocess.CalledProcessError):
                synth.main()
            self.assertEqual(run.call_args.args[0],
                             [sys.executable, str(Path(synth.HERE) / "vo_claims_check.py"), "--before-synth"])
            self.assertTrue(run.call_args.kwargs["check"])
            api.assert_not_called()
            key.assert_not_called()
            mkdir.assert_not_called()

    def test_actual_prompt_must_match_the_checked_json_script(self):
        self.fixture(words=10)
        line = self.script["lines"][0]["text"]
        with patch.object(synth, "OUT", str(self.out)):
            synth._require_checked_transcript([line], "Notes\nTranscript:\n[calm] " + line)
            with self.assertRaisesRegex(SystemExit, "No Gemini call was made"):
                synth._require_checked_transcript([line], "Notes\nTranscript:\n" + line + " changed")
            with self.assertRaises(SystemExit):
                synth._require_checked_transcript([line + " changed"], "Notes\nTranscript:\n" + line)

    def test_successful_precheck_cannot_spend_on_a_different_prompt(self):
        self.fixture(words=10)
        line = self.script["lines"][0]["text"]
        prompt = "Notes\nTranscript:\n" + line + " stale"
        self.write("vo_direction.json", {"target_seconds": 120, "assembled_prompt": prompt,
                                          "lines": [{"idx": 0, "text": line}]})
        with patch.object(synth, "OUT", str(self.out)), \
                patch.object(synth, "AUD", str(self.out / "audio")), \
                patch.object(synth.subprocess, "run", return_value=subprocess.CompletedProcess([], 0)), \
                patch.object(synth, "_reconcile_plan_with_script", return_value=(None, [])), \
                patch.object(synth, "repair_prompt", return_value=(prompt, [])), \
                patch.object(synth, "_synth_retry") as api:
            with self.assertRaisesRegex(SystemExit, "final spoken transcript differs"):
                synth.main()
            api.assert_not_called()


if __name__ == "__main__":
    unittest.main()
