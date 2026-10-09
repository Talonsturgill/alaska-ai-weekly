import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "build_evidence", ROOT / "scripts" / "build_evidence.py"
)
BUILD_EVIDENCE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILD_EVIDENCE)


def CM(board, start):
    # range-string boards: film_end only closes a float-onset board's last row
    return BUILD_EVIDENCE.conformed_moves(board, start, 100.0)


class ConformedMoveClockTests(unittest.TestCase):
    def setUp(self):
        self.old_date = BUILD_EVIDENCE.MOVE_RUN_DATE
        self.old_moves = BUILD_EVIDENCE.MOVES
        BUILD_EVIDENCE.MOVE_RUN_DATE = "2099-01-01"
        BUILD_EVIDENCE.MOVES = [("move", 1, 0.35)]

    def tearDown(self):
        BUILD_EVIDENCE.MOVE_RUN_DATE = self.old_date
        BUILD_EVIDENCE.MOVES = self.old_moves

    @staticmethod
    def board(beat):
        return {
            "run_date": "2099-01-01",
            "beats": [beat],
            "shots": [{"id": 1, "t": "0.0-2.0"}],
        }

    def test_range_start_is_used_when_at_s_is_absent(self):
        moves = CM(
            self.board({"id": 1, "t": "0.0-2.0"}), {0: 0.0}
        )
        self.assertEqual(moves, [("move", 0, 0.35)])

    def test_explicit_at_s_remains_authoritative(self):
        moves = CM(
            self.board({"id": 1, "t": "0.0-2.0", "at_s": 0.5}), {0: 0.0}
        )
        self.assertEqual(moves, [("move", 0, 0.85)])

    def test_flat_vo_clock_is_resolved(self):
        moves = CM(
            self.board({"id": 1, "t": "0.5-2.0", "at_s": 0.5,
                        "vo_line": 7, "offset": 0.25}), {7: 0.25}
        )
        self.assertEqual(moves, [("move", 7, 0.60)])

    def test_flat_and_nested_stale_clocks_are_rejected(self):
        for anchor in ({"vo_line": 0, "offset": 0.5},
                       {"anchor": {"vo_line": 0, "offset": 0.5}}):
            with self.subTest(anchor=anchor), self.assertRaisesRegex(
                    ValueError, "not conformed"):
                CM(
                    self.board({"id": 1, "t": "0.0-2.0", "at_s": 0.0,
                                **anchor}), {0: 0.0})

    def test_declared_clock_must_also_match_range(self):
        with self.assertRaisesRegex(ValueError, "not conformed"):
            CM(
                self.board({"id": 1, "t": "0.0-2.0", "at_s": 0.5,
                            "vo_line": 0, "offset": 0.5}), {0: 0.0})

    def test_missing_or_incomplete_vo_anchor_is_rejected(self):
        for anchor, message in (({"vo_line": 0}, "incomplete"),
                                ({"offset": 0.0}, "incomplete"),
                                ({"vo_line": 1, "offset": 0.0}, "missing aligned")):
            with self.subTest(anchor=anchor), self.assertRaisesRegex(ValueError, message):
                CM(
                    self.board({"id": 1, "t": "0.0-2.0", **anchor}), {0: 0.0})

    def test_stale_date_still_fails(self):
        board = self.board({"id": 1, "t": "0.0-2.0"})
        board["run_date"] = "2098-12-31"
        with self.assertRaisesRegex(ValueError, "move names belong to"):
            CM(board, {0: 0.0})

    def test_duplicate_or_missing_beat_selection_fails(self):
        board = self.board({"id": 1, "t": "0.0-2.0"})
        for moves in ([], [("move", 2, .35)],
                      [("move", 1, .35), ("duplicate", 1, .35)]):
            with self.subTest(moves=moves), self.assertRaisesRegex(ValueError, "exactly once"):
                BUILD_EVIDENCE.MOVES = moves
                CM(board, {0: 0.0})

    def test_duplicate_board_ids_and_sample_names_fail(self):
        board = self.board({"id": 1, "t": "0.0-2.0"})
        board["beats"].append({"id": 1, "t": "2.0-4.0"})
        with self.assertRaisesRegex(ValueError, "exactly once"):
            CM(board, {0: 0.0})
        board["beats"][1]["id"] = 2
        BUILD_EVIDENCE.MOVES = [("move", 1, .35), ("move", 2, .35)]
        with self.assertRaisesRegex(ValueError, "exactly once"):
            CM(board, {0: 0.0})

    def test_short_beat_does_not_get_clamped_to_a_plausible_sample(self):
        with self.assertRaisesRegex(ValueError, "too short"):
            CM(
                self.board({"id": 1, "t": "0.0-0.4"}), {0: 0.0})

    def test_uncovered_shot_still_fails(self):
        board = self.board({"id": 1, "t": "0.0-2.0"})
        board["shots"].append({"id": 2, "t": "2.0-4.0"})
        with self.assertRaisesRegex(ValueError, "every current shot"):
            CM(board, {0: 0.0})

    def test_run_date_comes_from_the_run_stamp(self):
        # machine pass 2026-10-09: no per-run date literal; None reads .run_stamp.json
        import json, os, tempfile, sys
        sys.path.insert(0, str(ROOT / "scripts"))
        import run_stamp
        BUILD_EVIDENCE.MOVE_RUN_DATE = None
        with tempfile.TemporaryDirectory() as d:
            stamp = os.path.join(d, ".run_stamp.json")
            json.dump({"run_id": "2099-01-01"}, open(stamp, "w"))
            old = run_stamp.STAMP
            run_stamp.STAMP = stamp
            try:
                self.assertEqual(CM(self.board({"id": 1, "t": "0.0-2.0"}), {0: 0.0}),
                                 [("move", 0, 0.35)])
                board = self.board({"id": 1, "t": "0.0-2.0"})
                board["run_date"] = "2098-12-31"
                with self.assertRaisesRegex(ValueError, "move names belong to 2099-01-01"):
                    CM(board, {0: 0.0})
            finally:
                run_stamp.STAMP = old


if __name__ == "__main__":
    unittest.main()
