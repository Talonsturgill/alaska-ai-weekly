import unittest

from scripts.dispatch_email import S, render


class DispatchEmailRenderingTest(unittest.TestCase):
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
            "Gmail-safe rendering",
        )

        self.assertIn('<body style="', html)
        self.assertIn('style="display:inline-block;background:#FFC72C', html)
        self.assertIn('style="display:inline-block;background:#13202b', html)
        self.assertIn('First &lt;claim&gt;.<br><br>Second &amp; final paragraph.', html)
        self.assertIn('font-family:Menlo,Consolas,monospace', html)
        self.assertIn('width="240"', html)


if __name__ == "__main__":
    unittest.main()
