import contextlib
import copy
import io
import json
import os
from pathlib import Path
import tempfile
import time
import unittest
from unittest.mock import patch

from scripts import dispatch_email
from scripts.dispatch_email import S, render, parse_sources
from scripts.visible_copy_check import check_email_copy, visible_html_text


class DispatchEmailRenderingTest(unittest.TestCase):
    def test_comment_sources_use_specific_titles_before_shared_outlet(self):
        sources, _ = parse_sources({"sources": [
            {"url": "https://example.com/notice", "title": "The announcement", "outlet": "TCC"},
            {"url": "https://example.com/about", "title": "About TCC", "outlet": "TCC"},
            {"url": "https://example.com/other", "outlet": "Publisher"},
        ]})
        self.assertEqual([s["label"] for s in sources],
                         ["The announcement", "About TCC", "Publisher"])

    def test_permanent_and_temporary_templates_obey_visible_copy_rules(self):
        for temporary in (False, True):
            with self.subTest(temporary=temporary):
                html = render(
                    "The care has to stay.", "",
                    {"square": "https://example.com/square.mp4",
                     "vertical": "https://example.com/vertical.mp4"},
                    "Gemini native TTS, Sulafat", "Track, Artist",
                    [{"url": "https://example.com:8443/source;identifier", "label": "Primary source",
                      "note": "Unused sourcing note: not inserted"}],
                    "Objective gate 10.0 out of 10", "Draft only.", temporary,
                    "2026-09-03", "The Care Has to Stay", "Added a visible copy guard.")
                result = check_email_copy("Ready to post · The Care Has to Stay", html)
                self.assertEqual(result["status"], "PASS", result)

    def test_decoded_visible_copy_not_html_syntax_is_checked(self):
        clean = '<head><style>.a {color:red;}</style></head><p style="color:red;">Read <a href="https://example.com">https://example.com</a>.</p>'
        self.assertEqual(check_email_copy("Ready to post", clean)["status"], "PASS")
        for html in ('<p>Choice&#58; how long?</p>', '<p>can<b>not</b> assume it.</p>'):
            self.assertEqual(check_email_copy("Ready to post", html)["status"], "FAIL")
        self.assertEqual(check_email_copy("Ready to post: film", clean)["status"], "FAIL")
        self.assertEqual(check_email_copy("Ready to post", '<style>.a {color:red;}</style>')["status"], "FAIL")
        self.assertNotIn("color", visible_html_text(clean))

    def test_gmail_critical_formatting_is_inline(self):
        html = render(
            "First <claim>.\n\nSecond & final paragraph.",
            f'<div style="{S["poster"]}"><img width="240" style="{S["poster_img"]}" alt="poster"></div>',
            {
                "square": "https://example.com/square.mp4",
                "vertical": "https://example.com/vertical.mp4",
            },
            "Gemini native TTS, Sulafat",
            "Track, Artist",
            [{"url": "https://example.com/source", "label": "Primary source", "note": "Audit note"}],
            "Objective gate 10.0 out of 10",
            "Draft only.",
            False,
            "2026-09-01",
            "The Ceiling Was in the Measurement",
            "Gmail-safe rendering\nEscaped <upgrade>",
        )

        self.assertIn('<body style="', html)
        self.assertIn('role="presentation" width="100%"', html)
        self.assertIn('max-width:620px;min-width:0', html)
        self.assertIn('overflow-wrap:anywhere', html)
        self.assertIn('table-layout:fixed', html)
        self.assertIn('style="display:block;background:#FFC72C', html)
        self.assertIn('style="display:block;background:#13202b', html)
        self.assertIn('First &lt;claim&gt;.<br><br>Second &amp; final paragraph.', html)
        self.assertIn('font-family:Arial,Helvetica,sans-serif', html)
        self.assertIn('width="240"', html)
        self.assertIn(f'style="{S["poster_img"]}"', html)
        self.assertLess(html.index('Download LinkedIn video'), html.index('Download TikTok video'))
        self.assertLess(html.index('Download TikTok video'), html.index('width="240"'))
        self.assertLess(html.index('width="240"'), html.index('LinkedIn caption'))
        self.assertIn('Run notes', html)
        self.assertIn('Upgrades shipped this run', html)
        self.assertIn('Gmail-safe rendering', html)
        self.assertIn('Escaped &lt;upgrade&gt;', html)
        self.assertNotIn('Sources (clickable reference)', html)


class DispatchEmailVoiceScorecardTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.report_path = self.root / "vo_report.json"
        self.report = {
            "soundcheck": {
                "pass": True, "score": 0.991,
                "heard": "PRIVATE ASR TRANSCRIPT must never appear in the email.",
                "diagnosis": "clean: automated only",
                "in_target_band": True,
                "checks": {
                    "word_accuracy": {"wer": 0.019, "pass": True},
                    "no_leak": {"leaked": [], "pass": True},
                    "expressive": {"pitch_std_semitones": 6.42, "voiced_frac": 0.55, "pass": True},
                    "duration": {"seconds": 122.88, "pass": True},
                    "loudness": {"lufs": None, "pass": True},
                },
            },
            "runtime_warning": None,
        }
        stamp = self.root / "out/dispatch/.run_stamp.json"
        stamp.parent.mkdir(parents=True)
        stamp.write_text(json.dumps({"run_id": "2026-09-12", "started_at": time.time()}))
        (self.root / "post.txt").write_text("The care has to stay.\n\nRead the next page.")
        (self.root / "sources.json").write_text(json.dumps({"sources": [
            {"url": "https://example.com/source", "title": "Primary source"},
        ]}))
        self.write_report()

    def write_report(self, report=None):
        self.report_path.write_text(json.dumps(self.report if report is None else report))

    def cli(self, *extra):
        args = ["dispatch_email.py", "--to", "connected-profile@example.com", "--post", str(self.root / "post.txt"),
                "--sources", str(self.root / "sources.json"),
                "--video-url-vertical", "https://example.com/vertical.mp4",
                "--video-url-square", "https://example.com/square.mp4",
                "--voice", "Gemini native TTS, Sulafat, preset voice with a SynthID watermark",
                "--music", "Track, Artist, CC BY 4.0", "--title", "The Next Page",
                "--score", "Objective gate 10.0 out of 10", "--upgrades", "Restored the poster.",
                "--note", "On-screen numbers are illustrative.", *extra]
        output = io.StringIO()
        real_fresh = dispatch_email.fresh
        # Run the real freshness guard against this test run's stamp. Network and
        # caption linting are independent contracts, already covered elsewhere.
        with patch.object(dispatch_email, "VO_REPORT_PATH", self.report_path), \
                patch.object(dispatch_email, "fresh", side_effect=lambda path, check=True:
                             real_fresh(path, check=check, root=str(self.root))), \
                patch.object(dispatch_email, "refuse_unless_copy_is_clean"), \
                patch.object(dispatch_email, "refuse_unless_links_are_live"), \
                patch("sys.argv", args), contextlib.redirect_stdout(output):
            dispatch_email.main()
        return json.loads(output.getvalue().splitlines()[-1])

    def test_cli_restores_hosted_poster_and_compact_factual_scorecard(self):
        payload = self.cli("--poster-url", 'https://example.com/poster.png?x=1&name="page"')
        self.assertEqual(payload['to'], 'connected-profile@example.com')
        html = payload["html_body"]
        text = visible_html_text(html)
        self.assertIn('src="https://example.com/poster.png?x=1&amp;name=&quot;page&quot;"', html)
        for expected in ("Automated voice sound check · PASS · score 0.991", "Word error rate 1.9%",
                         "no spoken-tag leaks", "pitch spread 6.42 semitones", "voiced frames 55%",
                         "Voice take 122.88 seconds", "Voice loudness unmeasured",
                         "The care has to stay.", "Read the next page.", "Primary source",
                         "https://example.com/source", "Voice, Gemini native TTS", "Music, Track, Artist",
                         "SynthID watermark", "CC BY 4.0", "Objective gate 10.0 out of 10",
                         "Upgrades shipped this run", "Restored the poster.",
                         "On-screen numbers are illustrative."):
            self.assertIn(expected, text)
        self.assertIn('The care has to stay.<br><br>Read the next page.', html)
        self.assertLess(text.index("Download LinkedIn video"), text.index("Download TikTok video"))
        self.assertLess(text.index("Run notes"), text.index("Automated voice sound check"))
        self.assertNotIn("PRIVATE ASR TRANSCRIPT", html)
        self.assertNotIn("diagnosis", html)
        self.assertNotIn("listened", text.lower())
        self.assertNotIn("heard", text.lower())
        self.assertEqual(check_email_copy(payload["subject"], html)["status"], "PASS")

    def test_cli_preserves_inline_poster_option(self):
        poster = self.root / "poster.png"
        poster.write_bytes(b"poster fixture")
        html = self.cli("--poster", str(poster))["html_body"]
        self.assertIn('src="data:image/png;base64,cG9zdGVyIGZpeHR1cmU="', html)
        self.assertIn(f'style="{S["poster_img"]}"', html)

    def test_measured_loudness_is_reported_and_visible_copy_passes(self):
        self.report["soundcheck"]["checks"]["loudness"]["lufs"] = -19.3
        self.write_report()
        payload = self.cli()
        self.assertIn("Voice loudness -19.3 LUFS", payload["html_body"])
        self.assertNotIn("loudness unmeasured", payload["html_body"])
        self.assertEqual(check_email_copy(payload["subject"], payload["html_body"])["status"], "PASS")

    def test_cli_refuses_overall_or_individual_failed_checks(self):
        for failed in ("overall", *self.report["soundcheck"]["checks"]):
            with self.subTest(failed=failed):
                report = copy.deepcopy(self.report)
                target = report["soundcheck"] if failed == "overall" else report["soundcheck"]["checks"][failed]
                target["pass"] = False
                self.write_report(report)
                with self.assertRaisesRegex(SystemExit, "failed its sound check"):
                    self.cli()

    def test_cli_refuses_runtime_miss_even_when_broad_soundcheck_passes(self):
        for field in ("in_target_band", "runtime_warning"):
            with self.subTest(field=field):
                report = copy.deepcopy(self.report)
                if field == "in_target_band":
                    report["soundcheck"][field] = False
                else:
                    report[field] = "Retained for rough-cut work."
                self.write_report(report)
                with self.assertRaisesRegex(SystemExit, "valid passing sound-check report"):
                    self.cli()

    def test_cli_refuses_missing_report_even_for_manual_freshness_opt_out(self):
        self.report_path.unlink()
        for flags in ((), ("--no-freshness-check",)):
            with self.subTest(flags=flags), self.assertRaisesRegex(SystemExit, "REFUSING TO BUILD DRAFT: --vo-report"):
                self.cli(*flags)

    def test_cli_refuses_stale_report(self):
        old = time.time() - 86400
        os.utime(self.report_path, (old, old))
        with self.assertRaisesRegex(SystemExit, "--vo-report is not from this run"):
            self.cli()

    def test_cli_refuses_invalid_json_and_report_shapes(self):
        for raw in ("{broken", "[]", "null", "{}", '{"soundcheck": []}'):
            with self.subTest(raw=raw):
                self.report_path.write_text(raw)
                with self.assertRaisesRegex(SystemExit, "valid passing sound-check report"):
                    self.cli()

    def test_cli_refuses_invalid_or_contradictory_measurements(self):
        cases = [
            (("pass",), "true"), (("score",), float("nan")),
            (("checks", "word_accuracy", "wer"), "0.019"),
            (("checks", "no_leak", "leaked"), ["slow"]),
            (("checks", "expressive", "pitch_std_semitones"), float("inf")),
            (("checks", "expressive", "voiced_frac"), 1.1),
            (("checks", "duration", "seconds"), 0),
            (("checks", "loudness", "lufs"), True),
            (("checks", "loudness", "pass"), "true"),
        ]
        for keys, value in cases:
            with self.subTest(keys=keys, value=value):
                report = copy.deepcopy(self.report)
                target = report["soundcheck"]
                for key in keys[:-1]:
                    target = target[key]
                target[keys[-1]] = value
                self.write_report(report)
                with self.assertRaisesRegex(SystemExit, "valid passing sound-check report"):
                    self.cli()

    def test_cli_accepts_explicit_report_path(self):
        alternate = self.root / "selected_voice_report.json"
        self.report_path.rename(alternate)
        payload = self.cli("--vo-report", str(alternate))
        self.assertIn("Automated voice sound check · PASS", payload["html_body"])


if __name__ == "__main__":
    unittest.main()
