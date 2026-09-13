import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from dispatch_captions import word_document

class WordTimelineTests(unittest.TestCase):
    def test_long_narration_keeps_its_real_end(self):
        words=[{'w':'last','s':117.9,'e':118.54,'seg':15}]
        actual=word_document(words,118.54)
        self.assertEqual(actual['total'],118.54)
        self.assertIs(actual['words'],words)
        self.assertEqual(actual['speech_end'],actual['total'])

    def test_short_narration_has_no_legacy_padding(self):
        self.assertEqual(word_document([{'e':32.11}],32.11)['total'],32.11)

    def test_rejects_a_clock_ending_before_its_words(self):
        with self.assertRaises(ValueError):
            word_document([{'e':118.54}],60.0)

    def test_rejects_empty_or_invalid_timelines(self):
        for words,end in [([],1),([{'e':1}],float('nan')),([{'e':0}],0)]:
            with self.subTest(end=end),self.assertRaises(ValueError):
                word_document(words,end)
