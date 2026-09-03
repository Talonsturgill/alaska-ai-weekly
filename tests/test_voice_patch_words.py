"""Surgical narration must update word timing as well as the visible cue ledger."""
import sys
import unittest
from pathlib import Path
from unittest.mock import patch
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import vo_patch_lines as vp
import vo_synth_gemini as vs

class PatchWordTests(unittest.TestCase):
    def test_recaptions_rebase_real_aligned_words_to_original_slot(self):
        aligned = ([{'w': 'HIPAA', 's': .1, 'e': .8, 'seg': 0}], [], 1.0,
                   [{'text': 'HIPAA', 'start': .1, 'end': 1.0}])
        with patch.object(vp, '_save_wav'), patch.object(vs, '_align_wholefile', return_value=aligned):
            cues, words = vp._recaption(np.zeros(100), 'HIPAA', 56.92, 9)
        self.assertEqual(words, [{'w': 'HIPAA', 's': 57.02, 'e': 57.72, 'seg': 9}])
        self.assertEqual(cues[0]['seg'], 9)
        self.assertEqual(cues[0]['start'], 57.02)
        self.assertEqual(aligned[0][0]['seg'], 0)  # source data was not mutated

if __name__ == '__main__':
    unittest.main()
