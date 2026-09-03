import contextlib
import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts import zoom_clip_check as zoom
from scripts.text_fit_check import collect_labels


LABEL_SOURCE = '''
const Type=({text,x=540,y,size=42,width=900})=><text fontSize={Math.min(size,width/(text.length*.61))}>{text}</text>;
const Label=({text,x=540,y,width=810})=><g><rect x={x-width/2} y={y-35} width={width} height={54}/><Type text={text} x={x} y={y} size={29} width={width-28}/></g>;
const Shot=({n})=>{let art;if(n===1){art=CALL;}else{art=null;}return <svg>{art}</svg>;};
'''


def label(**changes):
    return dict(dict(line=10, texts=['CURRENT LABEL'], x=540, y=1000,
                     width=810, scene=5, transforms=[]), **changes)


class LabelBoundsTests(unittest.TestCase):
    def test_current_default_width_and_baseline(self):
        self.assertEqual(zoom.label_frame_bounds(label()), (135.0, 945.0, 965.0, 1019.0))
        bad, unknown, n, cap = zoom.check_labels({'calls': [label()]}, '')
        self.assertEqual((bad, unknown, n, cap), ([], [], 1, []))

    def test_authored_x_outside_safe_margin_fails(self):
        bad, unknown, n, _ = zoom.check_labels({'calls': [label(x=960, width=200)]}, '')
        self.assertEqual((len(bad), unknown, n), (1, [], 1))
        self.assertGreater(bad[0][6], 1026)

    def test_safe_margin_is_an_exact_boundary(self):
        # The 810px plate ends exactly at the allowed right edge.
        bad, _, n, _ = zoom.check_labels({'calls': [label(x=621)]}, '')
        self.assertEqual((len(bad), n), (0, 1))
        bad, _, _, _ = zoom.check_labels({'calls': [label(x=621.1)]}, '')
        self.assertEqual(len(bad), 1)

    def test_literal_nested_transforms_follow_svg_order(self):
        scaled = label(x=0, y=0, width=100,
                       transforms=['{`scale(.5)`}', '"translate(540 1000)"'])
        self.assertEqual(zoom.label_frame_bounds(scaled), (515.0, 565.0, 982.5, 1009.5))
        self.assertEqual(zoom.literal_transform_matrix('"translate(10,20) scale(2)"'),
                         (2., 0., 0., 2., 10., 20.))

    def test_literal_translation_can_cause_failure(self):
        bad, unknown, n, _ = zoom.check_labels(
            {'calls': [label(transforms=['"translate(300 0)"'])]}, '')
        self.assertEqual((len(bad), unknown, n), (1, [], 1))

    def test_computed_miniature_is_explicitly_unmeasured(self):
        bad, unknown, n, cap = zoom.check_labels(
            {'calls': [label(transforms=['{`translate(${x} 200) scale(.5)`}'])]}, '')
        self.assertEqual((bad, n, cap), ([], 0, []))
        self.assertIn('computed', unknown[0][3])

    def test_unsupported_transform_is_not_identity(self):
        for raw in ('"skewX(20)"', '{motion}', '"translate(50foo 0)"'):
            with self.subTest(raw=raw):
                self.assertIsNone(zoom.literal_transform_matrix(raw))

    def test_rotation_changes_bounds(self):
        matrix = zoom.literal_transform_matrix('"rotate(90 540 1000)"')
        self.assertAlmostEqual(matrix[0]*540+matrix[2]*1000+matrix[4], 540)
        self.assertAlmostEqual(matrix[1]*540+matrix[3]*1000+matrix[5], 1000)
        bounds = zoom.label_frame_bounds(label(transforms=['"rotate(90 540 1000)"']))
        self.assertAlmostEqual(bounds[1]-bounds[0], 54.0)

    def test_camera_branch_not_assumed_flat(self):
        src = 'room=[3,6,9,12,14].includes(n); room||n===10?<Stage3D camera={c}>'
        bad, unknown, n, _ = zoom.check_labels(
            {'calls': [label(scene=3), label(scene=5), label(scene=None)]}, src)
        self.assertEqual((bad, len(unknown), n), ([], 1, 2))
        self.assertIn('Stage3D', unknown[0][3])

    def test_unrecognized_camera_routing_does_not_claim_coverage(self):
        _, unknown, n, _ = zoom.check_labels({'calls': [label(scene=None)]}, '<Stage3D>')
        self.assertEqual((len(unknown), n), (1, 0))

    def test_label_baseline_bottom_hits_caption_guard(self):
        _, _, n, cap = zoom.check_labels({'calls': [label(y=1300)]}, '')
        self.assertEqual((n, len(cap)), (1, 1))


class ExistingCoverageTests(unittest.TestCase):
    def collect_fixture(self, call):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'EpTest.tsx'
            src = LABEL_SOURCE.replace('CALL', call)
            source.write_text(src)
            # No render props are needed for a literal-text two-branch fixture.
            data = collect_labels(str(source), str(Path(directory) / 'absent-props.json'))
            self.assertEqual(data['issues'], [])
            return data, src

    def test_real_ast_label_defaults_are_measured(self):
        data, src = self.collect_fixture('<Label text="DEFAULT" y={1000}/>')
        self.assertEqual(data['calls'][0]['x'], 540)
        self.assertEqual(data['calls'][0]['width'], 810)
        bad, unknown, n, cap = zoom.check_labels(data, src)
        self.assertEqual((bad, unknown, n, cap), ([], [], 1, []))

    def test_real_ast_width_property_is_not_w(self):
        data, src = self.collect_fixture('<Label text="WIDE" y={1000} width={1100} w={20}/>')
        self.assertEqual(data['calls'][0]['width'], 1100)
        bad, unknown, n, _ = zoom.check_labels(data, src)
        self.assertEqual((len(bad), unknown, n), (1, [], 1))

    def test_real_ast_computed_group_does_not_get_flat_bounds(self):
        data, src = self.collect_fixture('<g transform={`translate(${offset} 0)`}><Label text="MOVING" y={1000}/></g>')
        bad, unknown, n, _ = zoom.check_labels(data, src)
        self.assertEqual((bad, len(unknown), n), ([], 1, 0))

    def test_plate_still_measured_and_clipped(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'EpTest.tsx'
            source.write_text('const S1: React.FC<SceneProps> = (p) => { '
                              'return <Plate text="A LONG LABEL" x={1000} y={900}/>; }')
            bad, _, n, _, _ = zoom.check(str(source))
            self.assertEqual(n, 1)
            self.assertEqual(len(bad), 1)

    def test_zero_coverage_still_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'EpEmpty.tsx'
            source.write_text('const S1: React.FC<SceneProps> = (p) => null;')
            output = io.StringIO()
            with patch.object(zoom.sys, 'argv', ['zoom_clip_check.py', str(source)]), \
                    contextlib.redirect_stdout(output):
                status = zoom.main()
            self.assertEqual(status, 1)
            self.assertIn('measured NOTHING', output.getvalue())


if __name__ == '__main__':
    unittest.main()
