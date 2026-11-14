import json
import tempfile
import unittest
from pathlib import Path
from scripts import render_provenance as rp
from scripts.archive_audio_evidence import archive


class AudioArchiveTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name).resolve()
        for name in {*rp.RENDER_REQUIRED, *rp.MIX_REQUIRED, *rp.ENCODE_PATTERNS}:
            self.put(name, 'input ' + name)
        self.put('out/dispatch/storyboard.json', '{"run_date": "2026-11-15", "beats": []}')
        self.put('out/dispatch/.run_stamp.json', '{"run_id": "2026-11-15"}')
        props = self.root / 'out/dispatch/episode_props.json'
        video = self.put('out/dispatch/render.mp4', 'render')
        vo = self.put('out/dispatch/audio/vo.wav', 'voice')
        wav = self.put('out/dispatch/audio/master.wav', 'mix')
        rp.begin_render(video, props, 'Film', 12, 2, self.root)
        rp.finish_render(video, root=self.root)
        rp.begin_mix(wav, vo, [], self.root)
        self.priority = {'pass': True, 'master_sha256': rp.sha(wav), 'minimum_stereo_margin_db': 18}
        self.put('out/dispatch/audio/speech_priority.json', json.dumps(self.priority))
        rp.finish_mix(wav, self.root)
        rp.begin_encode(video, wav, self.root)
        for name in rp.DELIVERABLES:
            self.put('out/dispatch/' + name, 'delivered ' + name)
        self.delivery = rp.finish_encode(self.root)
        self.report = {'measured_on': 'dispatch_square.mp4',
                       'measured_sha256': self.delivery['outputs']['dispatch_square.mp4'],
                       'pass': {'loudness': True, 'true_peak': True, 'speech_priority': True},
                       'speech_priority': self.priority}
        self.report_path = self.put('out/evidence/audio_report.json', json.dumps(self.report))

    def put(self, name, content):
        p = self.root / name
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content)
        return p

    def test_preserves_complete_evidence_portably_and_idempotently(self):
        p = archive('2026-11-15', self.root)
        first = p.read_bytes()
        bundle = json.loads(first)
        self.assertEqual(bundle['delivery_sha256'], self.delivery['outputs'])
        self.assertEqual(bundle['audio_report'], self.report)
        self.assertEqual(bundle['speech_priority'], self.priority)
        self.assertNotIn(str(self.root), first.decode())
        self.assertIn('not a listening review', bundle['scope'])
        archive('2026-11-15', self.root)
        self.assertEqual(first, p.read_bytes())

    def test_refuses_stale_or_incomplete_report(self):
        for key, value in [('measured_sha256', 'stale'), ('measured_on', '../../other'),
                           ('pass', {}), ('speech_priority', {'pass': True})]:
            with self.subTest(key=key):
                bad = dict(self.report, **{key: value})
                self.report_path.write_text(json.dumps(bad))
                with self.assertRaises(ValueError):
                    archive('2026-11-15', self.root)
                self.assertFalse((self.root / 'runs').exists())

    def test_refuses_changed_delivery(self):
        self.put('out/dispatch/dispatch_master_hosted.mp4', 'later cut')
        with self.assertRaisesRegex(ValueError, 'stale delivery'):
            archive('2026-11-15', self.root)

    def test_refuses_missing_report(self):
        self.report_path.unlink()
        with self.assertRaises(OSError):
            archive('2026-11-15', self.root)

    def test_invalid_date_cannot_escape_archive(self):
        with self.assertRaises(ValueError):
            archive('../escape', self.root)

    def test_wrong_edition_preserves_existing_evidence(self):
        previous = self.put('runs/2026-11-14/audio_evidence.json', 'prior edition evidence')
        with self.assertRaisesRegex(ValueError, 'archive date does not match'):
            archive('2026-11-14', self.root)
        self.assertEqual(previous.read_text(), 'prior edition evidence')

    def test_missing_or_mismatched_stamp_preserves_existing_evidence(self):
        previous = self.put('runs/2026-11-15/audio_evidence.json', 'existing evidence')
        stamp = self.root / 'out/dispatch/.run_stamp.json'
        for content in (None, '{"run_id": "2026-11-16"}', '{}'):
            with self.subTest(content=content):
                if content is None:
                    stamp.unlink()
                else:
                    stamp.write_text(content)
                with self.assertRaises(ValueError):
                    archive('2026-11-15', self.root)
                self.assertEqual(previous.read_text(), 'existing evidence')

    def test_relabeling_board_and_stamp_cannot_relabel_finished_delivery(self):
        self.put('out/dispatch/storyboard.json', '{"run_date": "2026-11-16", "beats": []}')
        self.put('out/dispatch/.run_stamp.json', '{"run_id": "2026-11-16"}')
        with self.assertRaisesRegex(ValueError, 'stale delivery'):
            archive('2026-11-16', self.root)
        self.assertFalse((self.root / 'runs').exists())
