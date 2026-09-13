import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from conform_storyboard import conform


class ConformTest(unittest.TestCase):
    def board(self):
        return {
            'total_seconds': 20,
            'beats': [{'id': 1, 'at_s': 0, 'offset': 0, 'vo_line': 0},
                      {'id': 2, 'at_s': 10, 'offset': 0, 'vo_line': 1}],
            'shots': [{'vo_line': 0}, {'vo_line': 1}],
            'open_loop': {'plant_t': 2, 'pay_t': 18},
            'open_loop_2': {'plant_t': 9, 'pay_t': 15},
            'throughline': {'states': [{'at_s': 0}, {'at_s': 18}]},
            'reveals': [{'beat_id': 2, 't': 10, 'hold_s': .6}],
            'audio_arc': {'dip_at': 16, 'riser_at': 11, 'silence_at': 18, 'payoff_at': 19}}

    def test_retime_is_idempotent_and_keeps_physical_hold(self):
        voice = {'lines': [{'idx': 0, 'start': 0, 'end': 11},
                           {'idx': 1, 'start': 12, 'end': 25}]}
        first = conform(self.board(), voice)
        # Serialization changes planning-clock keys from integers to strings.
        repeated = conform(json.loads(json.dumps(first)), voice)
        self.assertEqual(json.loads(json.dumps(first)), repeated)
        self.assertEqual(first['shots'][1]['t'], '12.000-26.000')
        self.assertEqual(first['reveals'][0]['hold_s'], .6)
        self.assertEqual(first['open_loop']['pay_t'], 22.4)

    def test_foreign_cutlist_and_stale_reveal_fail(self):
        voice = {'lines': [{'idx': 0, 'start': 0, 'end': 8}]}
        with self.assertRaisesRegex(ValueError, 'every aligned'):
            conform(self.board(), voice)
        voice['lines'].append({'idx': 1, 'start': 9, 'end': 20})
        board = self.board()
        board['reveals'][0]['beat_id'] = 29
        with self.assertRaisesRegex(ValueError, 'current beat_id'):
            conform(board, voice)


if __name__ == '__main__':
    unittest.main()
