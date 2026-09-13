"""A new cut list must follow its own approved narration, not yesterday's array."""
import unittest
from scripts.build_scenes import scene_line_indices


class SceneLineAnchorTests(unittest.TestCase):
    def test_distinct_current_episode_cut_lists_are_preserved(self):
        starts = {i: i * 4.5 for i in range(20)}
        for anchors in ([0, 2, 5, 7, 10, 14, 16, 18], [0, 1, 3, 8, 9, 11, 13, 15, 17, 19]):
            with self.subTest(anchors=anchors):
                self.assertEqual(scene_line_indices({'shots': [{'vo_line': i} for i in anchors]}, starts), anchors)

    def test_missing_repeated_reversed_or_unknown_anchors_fail(self):
        for anchors in ([], [None], [0, True], [0, '1'], [1, 2], [0, 2, 2], [0, 3, 2], [0, 99]):
            with self.subTest(anchors=anchors), self.assertRaises(ValueError):
                scene_line_indices({'shots': [{'vo_line': i} for i in anchors]}, {i: i * 4.5 for i in range(5)})


if __name__ == '__main__':
    unittest.main()
