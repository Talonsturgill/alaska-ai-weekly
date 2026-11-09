import contextlib
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import dispatch_email_from_file as delivery


class FileDeliveryTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name) / 'email.json'
        self.values = dict(post='out/dispatch/post.txt', sources='out/dispatch/sources.json',
                           to='test@example.com', **{'video-url-vertical': 'https://example.com/v.mp4',
                           'video-url-square': 'https://example.com/s.mp4'})

    def build(self, values=None):
        self.path.write_text(json.dumps(self.values if values is None else values))
        with patch.object(delivery, 'fresh', side_effect=lambda p: p):
            return delivery.build_command(self.path)

    def test_shell_metacharacters_remain_literal_data(self):
        prose = "Apostrophe's $HOME $(touch NEVER) `echo bad`\n--no-freshness-check"
        command = self.build({**self.values, 'title': prose})
        self.assertIn('--title=' + prose, command)
        self.assertNotIn('--no-freshness-check', command)
        self.assertEqual(command[:2], [sys.executable, str(Path(delivery.__file__).with_name('dispatch_email.py'))])

    def test_address_is_optional(self):
        # 2026-11-09: the owner's mailbox stays out of the input file; the Gmail call carries it.
        values = {k: v for k, v in self.values.items() if k != 'to'}
        command = self.build(values)
        self.assertFalse(any(arg.startswith('--to=') for arg in command))

    def test_upgrades_loaded_as_data_with_freshness_check(self):
        upgrades = Path(self.tmp.name) / 'upgrades.txt'
        upgrades.write_text("Literal $HOME and quotes ' retained\nSecond fix")
        self.path.write_text(json.dumps({**self.values, 'upgrades-file': str(upgrades)}))
        with patch.object(delivery, 'fresh', side_effect=lambda p: p) as fresh:
            command = delivery.build_command(self.path)
        self.assertIn('--upgrades=' + upgrades.read_text(), command)
        self.assertEqual(fresh.call_count, 2)

    def test_disallowed_bypass_and_unknown_flags_rejected(self):
        for key in ('no-freshness-check', 'temporary', 'help', 'args', 'upgrades'):
            with self.subTest(key=key), self.assertRaises(ValueError):
                self.build({**self.values, key: 'true'})

    def test_invalid_types_missing_fields_rejected(self):
        for value in ([], {}, {**self.values, 'to': ''}, {**self.values, 'title': False},
                      {**self.values, 'title': 'bad\x00value'}):
            with self.subTest(value=value), self.assertRaises(ValueError):
                self.build(value)

    def test_duplicate_keys_rejected(self):
        self.path.write_text('{"to":"first@example.com","to":"second@example.com"}')
        with patch.object(delivery, 'fresh', side_effect=lambda p: p), self.assertRaises(ValueError):
            delivery.build_command(self.path)

    def test_stale_input_fails_closed_without_spawning(self):
        with patch.object(delivery, 'fresh', side_effect=delivery.StaleArtifactError('stale')):
            with patch.object(delivery.subprocess, 'run') as run:
                with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as exc:
                    delivery.main(['--input', str(self.path)])
                self.assertEqual(exc.exception.code, 2)
                run.assert_not_called()

    def test_diagnostics_never_include_mailbox(self):
        self.path.write_text(json.dumps({**self.values, 'unknown': 'secret'}))
        with patch.object(delivery, 'fresh', side_effect=lambda p: p):
            with self.assertRaises(ValueError) as exc:
                delivery.build_command(self.path)
        self.assertNotIn('test@example.com', str(exc.exception))

    def test_existing_validation_exit_status_preserved(self):
        command = self.build()
        with patch.object(delivery, 'build_command', return_value=command):
            with patch.object(delivery.subprocess, 'run', return_value=subprocess.CompletedProcess(command, 2)) as run:
                self.assertEqual(delivery.main(['--input', str(self.path)]), 2)
                run.assert_called_once_with(command, check=False)


if __name__ == '__main__':
    unittest.main()
