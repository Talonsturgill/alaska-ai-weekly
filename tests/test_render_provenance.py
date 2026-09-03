import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from scripts import render_provenance as rp
from scripts.render_provenance import snapshot, same_sources


class ProvenanceTests(unittest.TestCase):
    def test_touch_is_not_a_source_edit(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            p = root / 'scene.tsx'
            p.write_text('current film')
            before = snapshot(root, ('*.tsx',))
            os.utime(p, (999999999, 999999999))
            same_sources(before, root, ('*.tsx',))

    def test_edits_additions_and_deletions_fail_even_with_old_mtime(self):
        for mutation in ('edit', 'add', 'delete'):
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                p = root / 'scene.tsx'
                p.write_text('current film')
                before = snapshot(root, ('*.tsx',))
                if mutation == 'edit':
                    p.write_text('outdated film')
                    os.utime(p, (1, 1))
                elif mutation == 'add':
                    (root / 'new.tsx').write_text('added scene')
                else:
                    p.unlink()
                with self.assertRaises(ValueError):
                    same_sources(before, root, ('*.tsx',))


class ReceiptTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name).resolve()
        self.environment = patch.dict(os.environ, {}, clear=True)
        self.environment.start()
        self.addCleanup(self.environment.stop)
        for name in {*rp.RENDER_REQUIRED, *rp.MIX_REQUIRED, *rp.ENCODE_PATTERNS}:
            self.make(name, 'input: ' + name)
        self.props = self.root / 'out/dispatch/episode_props.json'
        self.video = self.make('out/dispatch/render.mp4', 'video A')
        self.vo = self.make('out/dispatch/audio/vo.wav', 'voice A')
        self.wav = self.make('out/dispatch/audio/master.wav', 'mix A')
        self.music = self.make('out/dispatch/music_bed.wav', 'music A')
        self.cache = self.root / 'cache'
        self.chunks = self.root / 'quarantine'

    def make(self, name, text):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)
        return path

    def begin_render(self, props=None, total=12, chunks=2):
        return rp.begin_render(self.video, props or self.props, 'CurrentFilm',
                               total, chunks, self.root)

    def complete_render(self):
        self.begin_render()
        return rp.finish_render(self.video, root=self.root)

    def complete_mix(self, wav=None):
        wav = wav or self.wav
        rp.begin_mix(wav, self.vo, [self.music], self.root)
        return rp.finish_mix(wav, self.root)

    def outputs(self):
        for name in rp.DELIVERABLES:
            self.make('out/dispatch/' + name, 'delivered ' + name)

    def test_required_inputs_fail_before_receipt(self):
        for name in rp.RENDER_REQUIRED:
            with self.subTest(name=name):
                path = self.root / name
                old = path.read_text()
                path.unlink()
                with self.assertRaisesRegex(ValueError, 'required input missing'):
                    self.begin_render()
                path.write_text(old)

    def test_missing_alternate_props_fail(self):
        with self.assertRaises(OSError):
            self.begin_render(self.root / 'absent.json')

    def test_alternate_props_are_bound_and_old_mtime_does_not_hide_edit(self):
        props = self.make('alternate props.json', 'alternate A')
        data = self.begin_render(props)
        self.assertEqual(data['manifest']['props']['path'], str(props))
        props.write_text('alternate B')
        os.utime(props, (1, 1))
        with self.assertRaisesRegex(ValueError, 'contents changed'):
            rp.finish_render(self.video, root=self.root)

    def test_touching_all_inputs_does_not_change_key_or_fail_delivery(self):
        initial = self.complete_render()['cache_key']
        self.complete_mix()
        rp.begin_encode(self.video, self.wav, self.root)
        self.outputs()
        rp.finish_encode(self.root)
        for path in self.root.rglob('*'):
            if path.is_file():
                os.utime(path, (999999999, 999999999))
        self.assertEqual(initial, rp.cache_key(rp.render_manifest(
            self.props, 'CurrentFilm', 12, 2, self.root)))
        self.assertTrue(rp.check_delivery(self.root)[0])

    def test_cache_key_covers_assets_configs_dependencies_and_non_ts_sources(self):
        for name in ('video-engine/public/font.woff2', 'video-engine/src/theme.css',
                     'video-engine/src/data.json', 'video-engine/package-lock.json',
                     'video-engine/package.json', 'video-engine/tsconfig.json',
                     'video-engine/remotion.config.ts',
                     'video-engine/node_modules/.package-lock.json'):
            with self.subTest(name=name):
                before = self.begin_render()['cache_key']
                path = self.make(name, 'changed input')
                os.utime(path, (1, 1))
                after = self.begin_render()['cache_key']
                self.assertNotEqual(before, after)

    def test_cache_key_binds_partition_and_composition(self):
        manifest = rp.render_manifest(self.props, 'CurrentFilm', 12, 2, self.root)
        original = rp.cache_key(manifest)
        for key, value in [('total', 13), ('chunks', 3), ('composition', 'OtherFilm')]:
            self.assertNotEqual(original, rp.cache_key({**manifest, key: value}))

    def test_browser_override_is_content_bound(self):
        browser = self.make('custom-browser', 'browser A')
        os.environ['REMOTION_BROWSER_EXECUTABLE'] = str(browser)
        self.begin_render()
        browser.write_text('browser B')
        with self.assertRaisesRegex(ValueError, 'contents changed'):
            rp.finish_render(self.video, root=self.root)
        browser.unlink()
        with self.assertRaises(OSError):
            self.begin_render()

    def test_failed_render_never_promotes_chunks_even_after_source_revert(self):
        self.begin_render()
        self.make('quarantine/c0.mp4', 'old chunk')
        self.make('quarantine/c1.mp4', 'new chunk')
        scene = self.root / 'video-engine/src/index.ts'
        original = scene.read_text()
        scene.write_text('changed during render')
        with self.assertRaises(ValueError):
            rp.finish_render(self.video, self.chunks, self.cache, self.root)
        self.assertFalse((self.cache / 'complete.json').exists())
        scene.write_text(original)
        self.begin_render()
        self.assertFalse(rp.restore_chunk(self.video, self.cache, 'c1.mp4',
                                          self.root / 'restored.mp4', self.root))

    def test_completed_cache_hashes_ranges_and_schema_are_checked(self):
        self.begin_render()
        self.make('quarantine/c0.mp4', 'chunk zero')
        self.make('quarantine/c1.mp4', 'chunk one')
        rp.finish_render(self.video, self.chunks, self.cache, self.root)
        self.begin_render()
        destination = self.root / 'restored.mp4'
        self.assertTrue(rp.restore_chunk(self.video, self.cache, 'c0.mp4', destination, self.root))
        self.assertEqual(destination.read_text(), 'chunk zero')
        (self.cache / 'c0.mp4').write_text('corrupt chunk')
        self.assertFalse(rp.restore_chunk(self.video, self.cache, 'c0.mp4', destination, self.root))
        metadata = rp.read(self.cache / 'complete.json')
        metadata['chunks']['c1.mp4']['frames'] = [0, 5]
        rp.write(self.cache / 'complete.json', metadata)
        self.assertFalse(rp.restore_chunk(self.video, self.cache, 'c1.mp4', destination, self.root))

    def test_incomplete_or_legacy_render_receipt_cant_be_encoded(self):
        self.complete_mix()
        self.begin_render()
        with self.assertRaisesRegex(ValueError, 'complete receipt'):
            rp.begin_encode(self.video, self.wav, self.root)
        rp.write(rp.receipt_path(self.video, 'render'),
                 {'state': 'complete', 'sources': snapshot(self.root), 'output_sha256': rp.sha(self.video)})
        with self.assertRaisesRegex(ValueError, 'schema-2'):
            rp.begin_encode(self.video, self.wav, self.root)

    def test_changed_or_missing_mix_inputs_fail(self):
        for mode in ('vo edit', 'music delete', 'script edit'):
            with self.subTest(mode=mode):
                self.setUpFixtureMixInputs()
                rp.begin_mix(self.wav, self.vo, [self.music], self.root)
                if mode == 'vo edit':
                    self.vo.write_text('voice B')
                    os.utime(self.vo, (1, 1))
                elif mode == 'music delete':
                    self.music.unlink()
                else:
                    (self.root / 'scripts/dispatch_mix.py').write_text('changed schedule')
                with self.assertRaises((ValueError, OSError)):
                    rp.finish_mix(self.wav, self.root)

    def setUpFixtureMixInputs(self):
        self.vo.write_text('voice A')
        self.music.write_text('music A')
        (self.root / 'scripts/dispatch_mix.py').write_text('mix schedule A')

    def test_stale_mix_rejected_even_if_new_vo_has_old_mtime(self):
        self.complete_render()
        self.complete_mix()
        self.vo.write_text('voice B')
        os.utime(self.vo, (1, 1))
        with self.assertRaisesRegex(ValueError, 'contents changed'):
            rp.begin_encode(self.video, self.wav, self.root)

    def test_missing_mix_receipt_or_input_fails_closed(self):
        self.complete_render()
        with self.assertRaises(OSError):
            rp.begin_encode(self.video, self.wav, self.root)
        with self.assertRaises(OSError):
            rp.begin_mix(self.wav, self.vo, [self.root / 'missing-sfx.wav'], self.root)

    def test_mix_cannot_bind_its_own_output_as_input(self):
        with self.assertRaisesRegex(ValueError, 'must not also be an input'):
            rp.begin_mix(self.wav, self.vo, [self.wav], self.root)

    def test_source_validation_is_not_downgraded_to_cache_miss(self):
        self.begin_render()
        (self.root / 'video-engine/src/index.ts').unlink()
        with self.assertRaisesRegex(ValueError, 'required input missing'):
            rp.restore_chunk(self.video, self.cache, 'c0.mp4',
                             self.root / 'restored.mp4', self.root)

    def test_alternate_wav_is_bound_and_rechecked_at_finish(self):
        self.complete_render()
        alternate = self.make('alternate mix.wav', 'alternate mix A')
        self.complete_mix(alternate)
        data = rp.begin_encode(self.video, alternate, self.root)
        self.assertEqual(data['mix']['output']['path'], str(alternate))
        self.outputs()
        alternate.write_text('alternate mix B')
        with self.assertRaisesRegex(ValueError, 'contents changed'):
            rp.finish_encode(self.root)

    def test_silent_input_replacement_during_encode_is_rejected(self):
        self.complete_render()
        self.complete_mix()
        rp.begin_encode(self.video, self.wav, self.root)
        self.outputs()
        self.video.write_text('different silent film')
        with self.assertRaisesRegex(ValueError, 'contents changed'):
            rp.finish_encode(self.root)

    def test_delivery_missing_changed_outputs_and_incomplete_state_fail(self):
        self.complete_render()
        self.complete_mix()
        rp.begin_encode(self.video, self.wav, self.root)
        self.assertFalse(rp.check_delivery(self.root)[0])
        self.outputs()
        rp.finish_encode(self.root)
        self.assertTrue(rp.check_delivery(self.root)[0])
        for name in rp.DELIVERABLES:
            with self.subTest(name=name):
                output = self.root / 'out/dispatch' / name
                original = output.read_text()
                output.unlink()
                self.assertFalse(rp.check_delivery(self.root)[0])
                output.write_text('different output')
                self.assertFalse(rp.check_delivery(self.root)[0])
                output.write_text(original)

    def test_deleted_source_after_render_fails_delivery(self):
        self.complete_render()
        self.complete_mix()
        rp.begin_encode(self.video, self.wav, self.root)
        self.outputs()
        rp.finish_encode(self.root)
        (self.root / 'video-engine/remotion.config.ts').unlink()
        self.assertFalse(rp.check_delivery(self.root)[0])
