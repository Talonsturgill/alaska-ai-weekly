"""Credit presence depends on rendered text, not decoration or configured props."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from PIL import Image, ImageDraw, ImageFont

from scripts import credits_check as check


RENDERER = '''
const bodyOut = durationInFrames - 46;
const body = interpolate(f, [0, 9, bodyOut - 12, bodyOut],
    [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
'''
PROPS = {'total': 4067, 'credits': {
    'music': '"Life of Riley" Kevin MacLeod (incompetech.com), licensed under CC BY 4.0',
    'sources': ['UAA.ALASKA.EDU', 'WEARABLESENSING.COM', 'FRONTIERSIN.ORG'],
    'site': 'alaskaaihq.com', 'seconds': 12.3, 'frames': 369}}


def credit_image(omit=None, body_level=225, notebook=True):
    image = Image.new('RGB', (1080, 1920), (16, 16, 16))
    draw = ImageDraw.Draw(image)
    # A bright logo must not excuse a missing/faded source or licence body.
    draw.rectangle((370, 570, 710, 655), fill=(254, 254, 254))
    if notebook:
        draw.rectangle((180, 1390, 900, 1760), fill=(230, 230, 230))
    for row in check.credit_rows(PROPS['credits']):
        if row['text'] == omit:
            continue
        font = ImageFont.load_default(size=int(row['size']))
        draw.text((540, row['y'] - row['size']), row['text'], font=font,
                  anchor='mt', fill=(body_level,) * 3)
    return image


class RenderedCreditTests(unittest.TestCase):
    def test_resolves_full_ten_seconds_inside_the_actual_opacity_plateau(self):
        start, end, plateau = check.readable_window(PROPS, PROPS['total'] / 30, RENDERER)
        self.assertAlmostEqual(start, 123.6)
        self.assertAlmostEqual(end, 133.6)
        self.assertAlmostEqual(end - start, 10)
        self.assertAlmostEqual(plateau, 10.0666666667)

    def test_short_credit_interval_and_truncated_or_unresolved_video_fail(self):
        short = copy.deepcopy(PROPS)
        short['credits']['frames'] = 330
        cases = [(short, short['total'] / 30, RENDERER),
                 (PROPS, PROPS['total'] / 30 - 1, RENDERER),
                 (PROPS, None, RENDERER),
                 (PROPS, PROPS['total'] / 30, RENDERER.replace('[0, 1, 1, 0]', '[0, 0, 0, 0]'))]
        for props, duration, source in cases:
            with self.subTest(duration=duration):
                with self.assertRaises(ValueError):
                    check.readable_window(props, duration, source)

    def test_bright_notebook_does_not_change_credit_row_presence(self):
        rows = check.credit_rows(PROPS['credits'])
        with_book, problems = check.row_contrast(credit_image(), rows)
        without_book, other = check.row_contrast(credit_image(notebook=False), rows)
        self.assertEqual(problems, [])
        self.assertEqual(other, [])
        self.assertEqual(with_book, without_book)

    def test_missing_source_or_license_row_fails_despite_bright_logo_and_book(self):
        rows = check.credit_rows(PROPS['credits'])
        for text in ('WEARABLESENSING.COM', 'LICENSED UNDER CC BY 4.0'):
            with self.subTest(text=text):
                _, problems = check.row_contrast(credit_image(omit=text), rows)
                self.assertTrue(any(text in problem for problem in problems))

    def test_faded_body_and_body_absent_logo_only_frames_fail(self):
        rows = check.credit_rows(PROPS['credits'])
        for level in (85, 16):
            with self.subTest(level=level):
                _, problems = check.row_contrast(credit_image(body_level=level), rows)
                self.assertEqual(len(problems), len(rows))

    def test_ocr_requires_actual_domain_author_and_license_text_without_fuzzy_excuses(self):
        expected = [r['text'] for r in check.credit_rows(PROPS['credits'])] + ['SOURCES']
        self.assertEqual(check.missing_ocr_lines(expected, expected), [])
        for omitted in ('WEARABLESENSING.COM', 'LICENSED UNDER CC BY 4.0'):
            self.assertIn(omitted, check.missing_ocr_lines(expected, [s for s in expected if s != omitted]))
        truncated = [s.replace('MACLEOD', 'MACLE').replace('CC BY 4.0', 'CC BY') for s in expected]
        self.assertEqual(len(check.missing_ocr_lines(expected, truncated)), 2)
        self.assertEqual(len(check.missing_ocr_lines(expected, [])), len(expected))

    def test_missing_master_cannot_pass_from_complete_props(self):
        with tempfile.TemporaryDirectory() as directory:
            report = check.check_rendered_credits(str(Path(directory) / 'missing.mp4'), PROPS, RENDERER)
        self.assertFalse(report['pass'])
        self.assertIn('props cannot prove', ' '.join(report['problems']))

    def test_missing_ocr_backend_fails_closed(self):
        with patch.object(check.platform, 'system', return_value='Linux'), \
                patch.object(check.shutil, 'which', return_value=None):
            with self.assertRaisesRegex(ValueError, 'no pixel-presence proof'):
                check._ocr_frames(['unused.png'])

    def test_render_audit_checks_whole_window_and_requires_ocr_at_both_ends(self):
        expected = [r['text'] for r in check.credit_rows(PROPS['credits'])] + ['SOURCES']
        with tempfile.TemporaryDirectory() as directory:
            video = Path(directory) / 'fixture.mp4'
            video.write_bytes(b'only a mocked decoder reads this fixture')
            for missing_end in (False, True):
                ocr = [expected, expected, [] if missing_end else expected]
                with patch.object(check, '_probe_duration', return_value=PROPS['total'] / 30), \
                        patch.object(check, '_frame', return_value=credit_image()) as decode, \
                        patch.object(check, '_ocr_frames', return_value=(ocr, 'test OCR')) as recognition:
                    report = check.check_rendered_credits(str(video), PROPS, RENDERER)
                self.assertEqual(report['pass'], not missing_end, report['problems'])
                self.assertEqual(decode.call_count, 21)
                self.assertEqual(len(recognition.call_args.args[0]), 3)
                self.assertEqual(report['window'], [123.6, 133.6])
                self.assertEqual(len(report['input_sha256']['video']), 64)

    def test_mid_window_missing_body_fails_even_with_good_endpoint_ocr(self):
        expected = [r['text'] for r in check.credit_rows(PROPS['credits'])] + ['SOURCES']
        images = [credit_image()] * 21
        images[7] = credit_image(body_level=16)
        with tempfile.TemporaryDirectory() as directory:
            video = Path(directory) / 'fixture.mp4'; video.write_bytes(b'fixture')
            with patch.object(check, '_probe_duration', return_value=PROPS['total'] / 30), \
                    patch.object(check, '_frame', side_effect=images), \
                    patch.object(check, '_ocr_frames', return_value=([expected] * 3, 'test OCR')):
                report = check.check_rendered_credits(str(video), PROPS, RENDERER)
        self.assertFalse(report['pass'])
        self.assertTrue(any('at 127.100s' in p for p in report['problems']))

    def test_malformed_or_incomplete_ocr_output_never_passes(self):
        cases = [None, 'not a frame list', [], [['one frame only']],
                 [['SOURCES'], ['SOURCES'], [123]], ['a', 'b', 'c']]
        with tempfile.TemporaryDirectory() as directory:
            video = Path(directory) / 'fixture.mp4'; video.write_bytes(b'fixture')
            for output in cases:
                with self.subTest(output=output), \
                        patch.object(check, '_probe_duration', return_value=PROPS['total'] / 30), \
                        patch.object(check, '_frame', return_value=credit_image()), \
                        patch.object(check, '_ocr_frames', return_value=(output, 'test OCR')):
                    report = check.check_rendered_credits(str(video), PROPS, RENDERER)
                self.assertFalse(report['pass'])
                self.assertIn('malformed or incomplete', ' '.join(report['problems']))

    def test_missing_decoded_frame_fails_without_falling_back_to_props(self):
        with tempfile.TemporaryDirectory() as directory:
            video = Path(directory) / 'fixture.mp4'; video.write_bytes(b'fixture')
            with patch.object(check, '_probe_duration', return_value=PROPS['total'] / 30), \
                    patch.object(check, '_frame', return_value=None), \
                    patch.object(check, '_ocr_frames') as recognition:
                report = check.check_rendered_credits(str(video), PROPS, RENDERER)
        self.assertFalse(report['pass'])
        self.assertIn('could not decode', ' '.join(report['problems']))
        recognition.assert_not_called()

    def test_one_transient_good_frame_does_not_establish_a_readable_dwell(self):
        expected = [r['text'] for r in check.credit_rows(PROPS['credits'])] + ['SOURCES']
        images = [credit_image(body_level=16)] * 21
        images[10] = credit_image()
        with tempfile.TemporaryDirectory() as directory:
            video = Path(directory) / 'fixture.mp4'; video.write_bytes(b'fixture')
            with patch.object(check, '_probe_duration', return_value=PROPS['total'] / 30), \
                    patch.object(check, '_frame', side_effect=images), \
                    patch.object(check, '_ocr_frames', return_value=([[], expected, []], 'test OCR')):
                report = check.check_rendered_credits(str(video), PROPS, RENDERER)
        self.assertFalse(report['pass'])
        self.assertGreater(len(report['problems']), 20)


if __name__ == '__main__':
    unittest.main()
