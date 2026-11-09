import contextlib
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import record_draft as receipt


class RecordDraftTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name) / 'input.json'
        self.out = Path(self.tmp.name) / 'output'
        self.values = {'draft-id': 'r-123', 'to': 'test@example.com',
                       'subject': "Apostrophe's $(touch NEVER) `echo hi`\n--help",
                       'square-url': 'https://example.com/s.mp4',
                       'vertical-url': 'https://example.com/v.mp4'}
        self.path.write_text(json.dumps(self.values))

    def invoke(self, args):
        with patch.object(receipt, 'OUT', str(self.out)), contextlib.redirect_stdout(io.StringIO()):
            return receipt.main(args)

    def test_file_writes_literal_data(self):
        with patch.object(receipt, 'fresh', side_effect=lambda p: p) as fresh:
            self.assertEqual(self.invoke(['--input', str(self.path)]), 0)
        actual = json.loads((self.out / 'gmail_draft_receipt.json').read_text())
        for key, value in self.values.items():
            self.assertEqual(actual[key.replace('-', '_')], value)
        fresh.assert_called_once_with(str(self.path))

    def test_address_is_optional_and_never_needed(self):
        # 2026-11-09: the routine keeps the owner's mailbox out of files and shell commands.
        values = {k: v for k, v in self.values.items() if k != 'to'}
        self.path.write_text(json.dumps(values))
        with patch.object(receipt, 'fresh', side_effect=lambda p: p):
            self.assertEqual(self.invoke(['--input', str(self.path)]), 0)
        actual = json.loads((self.out / 'gmail_draft_receipt.json').read_text())
        self.assertEqual(actual['draft_id'], 'r-123')
        self.assertEqual(actual['to'], 'connected-profile')
        self.assertEqual(self.invoke(['--draft-id', 'r-789']), 0)

    def test_legacy_flags_still_work(self):
        self.assertEqual(self.invoke(['--draft-id', 'r-456', '--to', 'test@example.com']), 0)

    def test_stale_input_writes_nothing(self):
        with patch.object(receipt, 'fresh', side_effect=receipt.StaleArtifactError('stale')):
            with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
                self.invoke(['--input', str(self.path)])
        self.assertFalse(self.out.exists())

    def test_ambiguous_mixed_input_rejected(self):
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            self.invoke(['--input', str(self.path), '--draft-id', 'other'])
        self.assertFalse(self.out.exists())

    def test_invalid_file_fails_closed(self):
        for value in ([], {}, {**self.values, 'to': ''}, {**self.values, 'draft-id': ' '},
                      {**self.values, 'subject': None}, {**self.values, 'to': 'bad\x00'},
                      {**self.values, 'no-freshness-check': True}):
            with self.subTest(value=value):
                self.path.write_text(json.dumps(value))
                with patch.object(receipt, 'fresh', side_effect=lambda p: p):
                    with self.assertRaises(ValueError):
                        receipt.load_input(str(self.path))

    def test_duplicate_fields_rejected(self):
        self.path.write_text('{"to":"a","to":"b"}')
        with patch.object(receipt, 'fresh', side_effect=lambda p: p), self.assertRaises(ValueError):
            receipt.load_input(str(self.path))

    def test_diagnostics_do_not_leak_data(self):
        self.path.write_text(json.dumps({**self.values, 'extra': 'private'}))
        with patch.object(receipt, 'fresh', side_effect=lambda p: p):
            with self.assertRaises(ValueError) as exc:
                receipt.load_input(str(self.path))
        self.assertNotIn('test@example.com', str(exc.exception))


if __name__ == '__main__':
    unittest.main()
