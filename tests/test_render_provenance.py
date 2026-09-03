import os
from pathlib import Path
import tempfile
import unittest
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
