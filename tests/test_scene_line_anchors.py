"""A new cut list must follow its own approved narration, not yesterday's array."""
import unittest
from scripts.build_scenes import scene_line_indices, scene_start_times


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

    def test_declared_breath_cut_moves_only_picture(self):
        starts={0:0,1:6.54,3:22.64}
        board={'shots':[{'vo_line':0},{'vo_line':1},{'vo_line':3,
            'cut_offset_s':-.14,'cut_reason':'Cut in the breath before the next line.'}]}
        self.assertEqual(scene_start_times(board,starts),[0,6.54,22.5])
        self.assertEqual(starts[3],22.64)

    def test_unbounded_or_unexplained_offsets_fail(self):
        for offset,reason in [(True,'reason'),(.51,'reason'),(float('nan'),'reason'),(.1,'')]:
            with self.subTest(offset=offset),self.assertRaises(ValueError):
                scene_start_times({'shots':[{'vo_line':0},{'vo_line':1,
                    'cut_offset_s':offset,'cut_reason':reason}]},{0:0,1:4})


if __name__ == '__main__':
    unittest.main()
