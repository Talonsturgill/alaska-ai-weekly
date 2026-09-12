"""Compact scene syntax must not change geometry coverage or finding ownership."""
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "scripts"))
import plate_overlap_check as overlap
import zoom_clip_check as zoom


def episode(third, *, braced=True):
    third = ('{\n const present=progress(8), open=progress(9);\n'
             ' art=' + third + ';\n }') if braced else 'art=' + third + ';'
    return '''const Shot:React.FC<{n:number}>=({n})=>{
 let art;
 if(n===1) art=<Plate text="FIRST" x={540} y={600}/>;
 else if(n===2) art=<Plate text="SECOND" x={540} y={800}/>;
 else if(n===3) THIRD
 else art=<Plate text="LAST" x={540} y={1000}/>;
 return <g>{art}</g>;
};
'''.replace('THIRD', third)


class CompactSceneGeometryTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.path = Path(directory.name) / 'EpFixture.tsx'

    def write(self, third, **options):
        self.path.write_text(episode(third, **options))
        return str(self.path)

    def test_mixed_and_direct_branches_have_exact_scene_ownership(self):
        for braced in (False, True):
            with self.subTest(braced=braced):
                src = episode('<Plate text="THIRD" x={540} y={900}/>', braced=braced)
                parts = list(overlap.scenes(src))
                cameras = zoom.scenes(src, 1.0)
                self.assertEqual([p[0] for p in parts], ['S1', 'S2', 'S3', 'S4'])
                self.assertEqual([p[0] for p in cameras], ['S1', 'S2', 'S3', 'S4'])
                for index, text in enumerate(('FIRST', 'SECOND', 'THIRD', 'LAST')):
                    self.assertIn('text="' + text + '"', parts[index][2])
                    self.assertEqual(parts[index][2], cameras[index][2])
                    self.assertEqual(src[:parts[index][1]].count('\n') + 1, cameras[index][1])
                self.assertNotIn('text="THIRD"', parts[1][2])

    def test_same_position_in_adjacent_scenes_is_not_an_overlap(self):
        path = self.write('<Plate text="THIRD" x={540} y={800}/>')
        self.assertEqual(overlap.check(path), [])

    def test_real_overlap_in_braced_branch_reports_scene_and_source_lines(self):
        path = self.write('<g>\n<Plate text="THIRD A" x={540} y={900}/>\n'
                          '<Plate text="THIRD B" x={540} y={910}/>\n</g>')
        findings = overlap.check(path)
        self.assertEqual(len(findings), 1)
        finding = findings[0]
        self.assertEqual(finding[3], 'S3')
        lines = self.path.read_text().splitlines()
        self.assertIn('THIRD A', lines[finding[1] - 1])
        self.assertIn('THIRD B', lines[finding[2] - 1])

    def test_clipped_plate_in_braced_branch_is_measured_and_reports_scene(self):
        path = self.write('<Plate text="CLIPPED" x={1050} y={900} width={240}/>')
        bad, unknown, measured, scenes, captions = zoom.check(path)
        self.assertEqual((len(bad), unknown, measured, len(scenes), captions), (1, [], 4, 4, []))
        self.assertEqual(bad[0][0], 'S3')
        self.assertIn('CLIPPED', self.path.read_text().splitlines()[bad[0][1] - 1])

    def test_computed_transform_remains_unmeasured_in_its_own_scene(self):
        path = self.write('<g transform={`translate(${present} 0)`}>'
                          '<Plate text="MOVING" x={540} y={900}/></g>')
        bad, unknown, measured, scenes, captions = zoom.check(path)
        self.assertEqual((bad, measured, len(scenes), captions), ([], 3, 4, []))
        self.assertEqual(len(unknown), 1)
        self.assertEqual(unknown[0][0], 'S3')
        self.assertIn('computed transform', unknown[0][3])


if __name__ == '__main__':
    unittest.main()
