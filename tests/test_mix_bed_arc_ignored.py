"""dispatch_mix.bed_arc says when an authored bed makes board extra_dips a no-op.

Machine pass 2026-11-21, queue extra-dips-ignored-with-authored-bed: the 11-08 board's extra_dips did
nothing because an authored audio_arc.bed owns the arc, and the 11-10 to 11-13 boards did the same.
dispatch_mix runs the whole mix at import, so the function is lifted out of the source with ast.
"""
import ast
import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


def _bed_arc():
    src = (ROOT / "scripts" / "dispatch_mix.py").read_text()
    fn = next(n for n in ast.parse(src).body if isinstance(n, ast.FunctionDef) and n.name == "bed_arc")
    ns = {"BED_FLOOR": 0.0, "BED_CEIL": 2.0}
    exec(compile(ast.Module(body=[fn], type_ignores=[]), "bed_arc", "exec"), ns)
    return ns["bed_arc"]


class BedArcIgnoredTest(unittest.TestCase):
    def test_authored_bed_names_ignored_extra_dips(self):
        bed_arc = _bed_arc()
        board = {"audio_arc": {"bed": [[0, 0.6], [10, 0.5]], "extra_dips": [5.0]}}
        pts, source = bed_arc(board, {0: 0.0}, 20.0)
        self.assertEqual(pts, [(0.0, 0.6), (10.0, 0.5)])
        self.assertIn("IGNORED", source)
        self.assertIn("extra_dips", source)

    def test_authored_bed_without_extra_dips_is_quiet(self):
        _, source = _bed_arc()({"audio_arc": {"bed": [[0, 0.6]], "extra_dips": []}}, {0: 0.0}, 20.0)
        self.assertEqual(source, "board audio_arc.bed")

    def test_shipped_11_12_board_is_named(self):
        board = json.loads((ROOT / "runs" / "2026-11-12" / "storyboard.json").read_text())
        self.assertTrue(board["audio_arc"].get("bed") and board["audio_arc"].get("extra_dips"))
        lines = {i: float(i) for i in range(60)}
        _, source = _bed_arc()(board, lines, 130.0)
        self.assertIn("IGNORED with an authored bed: extra_dips", source)


if __name__ == "__main__":
    unittest.main()
