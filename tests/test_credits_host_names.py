"""End-card source labels name the outlet, not its hostname (2026-11-18 machine pass)."""
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import build_scenes  # noqa: E402  (imports its siblings by bare name)


class HostNames(unittest.TestCase):
    def test_alaska_outlets_render_by_name(self):
        srcs = [{"url": "https://www.newsminer.com/news/a.html"},
                {"url": "https://www.alaskasnewssource.com/2026/11/17/b/"},
                {"url": "https://www.adn.com/politics/2026/11/11/c/"},
                {"url": "https://www.adn.com/politics/2026/11/17/d/"}]
        self.assertEqual(build_scenes._source_labels(srcs),
                         ["FAIRBANKS DAILY NEWS-MINER", "ALASKA'S NEWS SOURCE",
                          "ANCHORAGE DAILY NEWS"])

    def test_unmapped_host_still_falls_back_to_hostname(self):
        self.assertEqual(build_scenes._source_labels([{"url": "https://www.example.org/x"}]),
                         ["EXAMPLE.ORG"])

    def test_shipped_1118_sources_carry_no_bare_domains(self):
        p = Path(__file__).resolve().parents[1] / "runs/2026-11-18/sources.json"
        labels = build_scenes._source_labels(json.loads(p.read_text())["sources"])
        self.assertFalse([l for l in labels if l.endswith(".COM")], labels)


if __name__ == "__main__":
    unittest.main()
