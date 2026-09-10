import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "build_evidence", ROOT / "scripts" / "build_evidence.py"
)
BUILD_EVIDENCE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILD_EVIDENCE)


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
        moves = BUILD_EVIDENCE.conformed_moves(
            self.board({"id": 1, "t": "0.0-2.0"}), {0: 0.0}
        )
        self.assertEqual(moves, [("move", 0, 0.35)])

    def test_explicit_at_s_remains_authoritative(self):
        moves = BUILD_EVIDENCE.conformed_moves(
            self.board({"id": 1, "t": "0.0-2.0", "at_s": 0.5}), {0: 0.0}
        )
        self.assertEqual(moves, [("move", 0, 0.85)])


if __name__ == "__main__":
    unittest.main()
