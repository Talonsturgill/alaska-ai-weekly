import unittest

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
        self.assertNotIn('width="240"', html)
        self.assertIn('Run notes', html)
        self.assertIn('Upgrades shipped this run', html)
        self.assertIn('Gmail-safe rendering', html)
        self.assertIn('Escaped &lt;upgrade&gt;', html)
        self.assertNotIn('Sources (clickable reference)', html)


if __name__ == "__main__":
    unittest.main()
