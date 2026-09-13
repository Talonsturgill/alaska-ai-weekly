"""Contact sounds follow physical landings after narration changes the entry time."""
import unittest
from scripts.sfx_bank import scheduled_time


class SfxContactTimingTests(unittest.TestCase):
    def test_cap_contact_follows_forty_frame_travel_after_voice_conform(self):
        for start in (76.0, 80.65, 94.125):
            beat = {'at_s': start, 'sfx_offset_frames': 40,
                    'sfx_offset_reason': 'Cap reaches the rear socket after its 40-frame move.'}
            self.assertAlmostEqual(scheduled_time(beat, start + 3.31) - start, 40 / 30)
            self.assertEqual(beat['at_s'], start)

    def test_entry_texture_keeps_its_visual_start(self):
        self.assertEqual(scheduled_time({'at_s': 46.64}, 50.939), 46.64)

    def test_invalid_or_unexplained_contact_offsets_fail(self):
        for offset, reason in [(-1, 'contact'), (True, 'contact'), (40.0, 'contact'),
                               (float('nan'), 'contact'), (40, ''), (40, None)]:
            with self.subTest(offset=offset, reason=reason), self.assertRaises(ValueError):
                scheduled_time({'at_s': 80.65, 'sfx_offset_frames': offset,
                                'sfx_offset_reason': reason}, 83.96)

    def test_contact_must_stay_inside_its_own_visual_beat(self):
        for offset in (60, 61):
            with self.subTest(offset=offset), self.assertRaises(ValueError):
                scheduled_time({'at_s': 10, 'sfx_offset_frames': offset,
                                'sfx_offset_reason': 'Contact'}, 12)

    def test_invalid_visual_clock_fails(self):
        for start, end, fps in [(float('nan'), 12, 30), (10, 10, 30),
                                (-1, 2, 30), (10, float('inf'), 30), (10, 12, 0)]:
            with self.subTest(start=start, end=end, fps=fps), self.assertRaises(ValueError):
                scheduled_time({'at_s': start}, end, fps)


if __name__ == '__main__':
    unittest.main()
