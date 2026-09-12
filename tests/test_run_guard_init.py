"""A new date cannot silently abandon an undelivered passing Dispatch cut."""
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from scripts import run_guard as guard


def at(clock):
    return dt.datetime.fromisoformat('2026-09-11T' + clock + '+00:00').timestamp()


class RunInitTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        self.out = self.root / 'out/dispatch'
        (self.out / 'render').mkdir(parents=True)
        self.stamp = self.out / '.run_stamp.json'
        self.lock = self.out / 'SHIP_NOW'
        self.verdict = self.out / 'panel_verdict.json'
        self.receipt = self.out / 'gmail_draft_receipt.json'
        self.archive = self.out / 'previous_run_gate_2026_09_11'
        self.previous = {'run_id': '2026-09-11', 'started_at': at('10:00:00'),
                         'composition': 'Dispatch0911', 'extra': {'keep': True}}
        self.write(self.stamp, self.previous)

    def write(self, path, data):
        path.write_text(json.dumps(data, indent=2))

    def passing_cut(self):
        self.lock.write_text('median 8.08 cleared 7.0 at 14:20:00.\nSHIP THESE BYTES.\n')
        os.utime(self.lock, (at('14:20:00'), at('14:20:00')))
        artifacts = {}
        for name in ('dispatch_master.mp4', 'dispatch_square.mp4', 'dispatch_master_720.mp4'):
            content = ('fixture film bytes ' + name).encode()
            (self.out / name).write_bytes(content)
            artifacts[name] = hashlib.sha256(content).hexdigest()
        self.write(self.verdict, {'recorded_at': '2026-09-11T14:18:57Z',
                                  'median': 8.08, 'threshold': 7.0,
                                  'artifacts': artifacts,
                                  'evidence': {'contact_square.jpg': 'c'*64}})
        os.utime(self.verdict, (at('14:18:57'), at('14:18:57')))
        self.write(self.receipt, {'draft_id': 'example-draft', 'message_id': 'example-message',
                                  'created_at': '2026-09-11T14:28:51Z',
                                  'unsent': True, 'labels': ['DRAFT'],
                                  'readback': {key: True for key in
                                               ('exact_caption', 'square_link', 'vertical_link',
                                                'all_sources', 'credits')}})

    def snapshot(self):
        return {path: (path.read_bytes(), path.stat().st_mtime_ns)
                for path in (self.stamp, self.lock, self.verdict, self.receipt) if path.exists()}

    def refused_unchanged(self):
        before = self.snapshot()
        with self.assertRaises(guard.RunInitError):
            guard.init('2026-09-12', str(self.root))
        self.assertEqual(self.snapshot(), before)
        self.assertFalse(self.archive.exists())

    def test_same_run_preserves_exact_stamp_and_locked_cut(self):
        self.passing_cut()
        before = self.snapshot()
        self.assertEqual(guard.init('2026-09-11', str(self.root)), self.previous)
        self.assertEqual(self.snapshot(), before)
        self.assertFalse(self.archive.exists())

    def test_same_run_does_not_reset_artifact_freshness(self):
        artifact = self.out / 'post.txt'
        artifact.write_text('Existing work')
        os.utime(artifact, (at('10:01:00'), at('10:01:00')))
        guard.init('2026-09-11', str(self.root))
        self.assertTrue(guard.check_path(str(artifact), str(self.root))[0])

    def test_first_run_and_unlocked_next_run_stamp_normally(self):
        self.stamp.unlink()
        first = guard.init('2026-09-11', str(self.root))
        second = guard.init('2026-09-12', str(self.root))
        self.assertEqual((first['run_id'], second['run_id']), ('2026-09-11', '2026-09-12'))
        self.assertGreaterEqual(second['started_at'], first['started_at'])

    def test_completed_prior_run_archives_proof_and_preserves_old_bytes(self):
        self.passing_cut()
        before = self.snapshot()
        result = guard.init('2026-09-12', str(self.root))
        self.assertEqual(result['run_id'], '2026-09-12')
        self.assertNotIn('composition', result)
        for path, (content, mtime) in before.items():
            archived = self.archive / path.name
            self.assertEqual(archived.read_bytes(), content)
            self.assertEqual(archived.stat().st_mtime_ns, mtime)
        self.assertFalse(self.lock.exists())
        self.assertFalse(self.verdict.exists())
        self.assertEqual(self.receipt.read_bytes(), before[self.receipt][0])

    def test_pending_or_partial_gate_is_never_archived(self):
        for missing in ('receipt', 'verdict', 'lock', 'stamp'):
            with self.subTest(missing=missing):
                self.write(self.stamp, self.previous)
                self.passing_cut()
                getattr(self, missing).unlink()
                self.refused_unchanged()

    def test_current_or_ambiguous_lock_is_preserved(self):
        for timestamp in (at('14:00:00'), at('14:20:00') + 86400):
            with self.subTest(timestamp=timestamp):
                self.passing_cut()
                os.utime(self.lock, (timestamp, timestamp))
                self.refused_unchanged()

    def test_post_delivery_recheck_of_same_cut_can_roll_over(self):
        self.passing_cut()
        os.utime(self.lock, (at('14:30:31'), at('14:30:31')))
        self.assertEqual(guard.init('2026-09-12', str(self.root))['run_id'], '2026-09-12')
        self.assertTrue((self.archive / 'SHIP_NOW').exists())

    def test_newer_same_day_verdict_cannot_reuse_the_earlier_draft(self):
        self.passing_cut()
        data = json.loads(self.verdict.read_text())
        self.write(self.verdict, {**data, 'recorded_at': '2026-09-11T14:29:00Z'})
        os.utime(self.verdict, (at('14:29:00'), at('14:29:00')))
        os.utime(self.lock, (at('14:30:31'), at('14:30:31')))
        self.refused_unchanged()

    def test_lock_scores_must_agree_with_bound_verdict(self):
        for text in ('median 8.09 cleared 7.0 at 14:20:00.',
                     'median 8.08 cleared 6.5 at 14:20:00.', 'SHIP THESE BYTES.'):
            with self.subTest(text=text):
                self.passing_cut()
                self.lock.write_text(text)
                os.utime(self.lock, (at('14:20:00'), at('14:20:00')))
                self.refused_unchanged()

    def test_all_three_deliverable_hashes_are_required(self):
        for name in ('dispatch_master.mp4', 'dispatch_square.mp4', 'dispatch_master_720.mp4'):
            for missing in (False, True):
                with self.subTest(name=name, missing=missing):
                    self.passing_cut()
                    path = self.out / name
                    if missing:
                        path.unlink()
                    else:
                        path.write_bytes(b'A different cut after the draft')
                    self.refused_unchanged()

    def test_receipt_must_be_verified_and_belong_to_prior_run(self):
        changes = [{'created_at': '2026-09-11T14:00:00Z'},
                   {'created_at': '2026-09-12T14:28:51Z'},
                   {'created_at': '2026-09-11T14:28:51'}, {'created_at': None},
                   {'run_id': '2026-09-10'}, {'composition': 'AnotherComposition'},
                   {'draft_id': ''}, {'message_id': ''}, {'unsent': False},
                   {'labels': ['SENT']}, {'readback': {'square_link': True}}]
        for change in changes:
            with self.subTest(change=change):
                self.passing_cut()
                self.write(self.receipt, {**json.loads(self.receipt.read_text()), **change})
                self.refused_unchanged()

    def test_verdict_must_match_stamp_and_bind_passing_deliverables(self):
        changes = [{'recorded_at': '2026-09-12T14:18:57Z'}, {'run_date': '2026-09-10'},
                   {'median': 6}, {'median': True}, {'threshold': float('nan')},
                   {'artifacts': {}}, {'artifacts': {'dispatch_master.mp4': 'not-a-hash'}},
                   {'evidence': {}}]
        for change in changes:
            with self.subTest(change=change):
                self.passing_cut()
                self.write(self.verdict, {**json.loads(self.verdict.read_text()), **change})
                os.utime(self.verdict, (at('14:18:57'), at('14:18:57')))
                self.refused_unchanged()

    def test_malformed_metadata_and_unsupported_run_ids_fail_closed(self):
        for path in (self.stamp, self.verdict, self.receipt):
            with self.subTest(path=path.name):
                self.write(self.stamp, self.previous)
                self.passing_cut()
                path.write_text('{broken')
                self.refused_unchanged()
        for run_id in ('not-a-date', '2026-09-13'):
            self.passing_cut()
            self.write(self.stamp, {**self.previous, 'run_id': run_id})
            self.refused_unchanged()

    def test_existing_archive_is_never_overwritten(self):
        self.passing_cut()
        self.archive.mkdir()
        keep = self.archive / 'SHIP_NOW'
        keep.write_text('Existing evidence')
        before = self.snapshot()
        with self.assertRaises(guard.RunInitError):
            guard.init('2026-09-12', str(self.root))
        self.assertEqual(self.snapshot(), before)
        self.assertEqual(keep.read_text(), 'Existing evidence')

    def test_stamp_replace_failure_restores_passing_cut(self):
        self.passing_cut()
        before = self.snapshot()
        with patch.object(guard.os, 'replace', side_effect=OSError('simulated failure')):
            with self.assertRaises(guard.RunInitError):
                guard.init('2026-09-12', str(self.root))
        self.assertEqual(self.snapshot(), before)
        self.assertEqual(list(self.out.glob('.run_stamp.*')), [self.stamp])


if __name__ == '__main__':
    unittest.main()
