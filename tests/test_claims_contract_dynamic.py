"""Dynamic props count only through a resolved live TSX text route."""
import contextlib
import copy
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

from scripts import claims_contract_check as check


REPO = Path(__file__).resolve().parents[1]


class DynamicLabelTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Intentional integration fixture: changes to the live route must require a
        # supported adapter, not leave a passing obsolete copy of the renderer here.
        cls.engine = (REPO / "video-engine/src/Ep0903.tsx").read_text()
        cls.root_source = (REPO / "video-engine/src/Root.tsx").read_text()

    def setUp(self):
        self.props = {"total": 150, "scenes": [{"from": i * 30, "dur": 30} for i in range(5)],
                      "beats": [{"id": i + 1, "at": i, "label": f"UNIQUE PROP TOKEN {i + 1}"}
                                for i in range(5)]}

    def resolve(self, engine=None, props=None, root=None):
        return check.dynamic_labels(self.engine if engine is None else engine,
                                    self.props if props is None else props,
                                    self.root_source if root is None else root)

    def test_live_route_counts_only_frames_in_unsuppressed_scenes(self):
        rows, note = self.resolve()
        self.assertIn("frame spans resolved", note)
        self.assertEqual([r["beat_id"] for r in rows], [1, 2, 4, 5])
        self.assertEqual(rows[1], {"beat_id": 2, "label": "UNIQUE PROP TOKEN 2",
                                   "scene": 2, "from": 30, "to": 60})
        self.assertNotIn("UNIQUE PROP TOKEN 3", [r["label"] for r in rows])

    def test_removed_or_dead_renderer_does_not_count_props(self):
        label = '<Label text={active.label} y={1278} width={900}/>'
        self.assertIn(label, self.engine)
        for replacement in ('<g/>', '<g/>/* removed renderer: ' + label + ' */',
                            'false&&' + label, '<Label text="active.label" y={1278} width={900}/>'):
            with self.subTest(replacement=replacement):
                rows, note = self.resolve(engine=self.engine.replace(label, replacement))
                self.assertEqual(rows, [])
                self.assertIn("NOT RESOLVED", note)

    def test_unknown_filter_scene_route_or_text_sink_fails_closed(self):
        changes = [('beats={beats} lines={lines}', 'beats={[]} lines={lines}'),
                   ('n={i+1} from={s.from}', 'n={s.number} from={s.from}'),
                   ('seconds=g/30', 'seconds=f/30'),
                   ('b.at<=seconds+.005', 'b.at<=seconds'),
                   ('<Type text={text} x={x}', '<Type text="UNUSED" x={x}'),
                   ('<text x={x} y={y} fill={color}', '<text opacity={0} x={x} y={y} fill={color}')]
        for old, new in changes:
            with self.subTest(old=old):
                self.assertIn(old, self.engine)
                self.assertEqual(self.resolve(engine=self.engine.replace(old, new))[0], [])

    def test_early_return_and_mutated_binding_fail_closed(self):
        for change in ('if(n===1)return null;', 'beats[0].label="MUTATED";'):
            with self.subTest(change=change):
                altered = self.engine.replace('let art:React.ReactNode;', 'let art:React.ReactNode;' + change)
                self.assertNotEqual(altered, self.engine)
                self.assertEqual(self.resolve(engine=altered)[0], [])

    def test_root_must_import_and_directly_render_same_30fps_component(self):
        for old, new in [("from './Ep0903'", "from './OldEpisode'"),
                         ('component={Ep0903}', 'component={Ep0902}'),
                         ('fps={30} width={1080} height={1920} schema={ep0903Schema}',
                          'fps={60} width={1080} height={1920} schema={ep0903Schema}')]:
            with self.subTest(old=old):
                self.assertIn(old, self.root_source)
                self.assertEqual(self.resolve(root=self.root_source.replace(old, new))[0], [])

    def test_suppression_is_read_from_actual_condition_not_hardcoded(self):
        source = self.engine.replace('[3,6,9,10,12,13,14].includes(n)', '[1,2,3,4,5].includes(n)')
        self.assertNotEqual(source, self.engine)
        self.assertEqual(self.resolve(engine=source)[0], [])

    def test_missing_parser_cannot_grant_props_credit(self):
        with patch.object(check, '_dynamic_route', side_effect=FileNotFoundError('node missing')):
            rows, note = self.resolve()
        self.assertEqual(rows, [])
        self.assertIn('no props credit', note)

    def test_bad_or_unresolved_data_routing_never_counts(self):
        variants = []
        for key in ('scenes', 'beats', 'total'):
            props = copy.deepcopy(self.props)
            del props[key]
            variants.append(props)
        for field, value in [('at', float('nan')), ('at', -1), ('at', '1'), ('id', 1), ('label', None)]:
            props = copy.deepcopy(self.props)
            props['beats'][1][field] = value
            variants.append(props)
        props = copy.deepcopy(self.props)
        props['beats'].reverse()
        variants.append(props)
        for field, value in [('from', 0), ('from', 30.5), ('dur', 0), ('dur', 900)]:
            props = copy.deepcopy(self.props)
            props['scenes'][1][field] = value
            variants.append(props)
        props = copy.deepcopy(self.props)
        props['credits'] = {'frames': '30'}
        variants.append(props)
        with patch.object(check, '_dynamic_route', return_value={'suppressed': [3], 'fps': 30}):
            for props in variants:
                with self.subTest(props=props):
                    rows, note = self.resolve(props=props)
                    self.assertEqual(rows, [])
                    self.assertIn('NOT RESOLVED', note)

    def test_frame_quantization_carryover_and_credits_are_exact(self):
        self.props['beats'][3]['at'] = 3.04
        self.props['credits'] = {'frames': 30}
        with patch.object(check, '_dynamic_route', return_value={'suppressed': [3], 'fps': 30}):
            rows, _ = self.resolve()
        # Beat 3 starts in suppressed shot 3, then really appears for two frames
        # in shot 4. Beat 5 is entirely behind the credits and earns no evidence.
        carry = [r for r in rows if r['beat_id'] == 3]
        self.assertEqual([(r['scene'], r['from'], r['to']) for r in carry], [(4, 90, 92)])
        self.assertNotIn(5, [r['beat_id'] for r in rows])

    def run_contract(self, claims, props=None, engine=None):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            (directory / 'Ep0903.tsx').write_text(engine or self.engine)
            (directory / 'Root.tsx').write_text(self.root_source)
            (directory / 'props.json').write_text(json.dumps(self.props if props is None else props))
            (directory / 'claims.json').write_text(json.dumps({'claims': claims}))
            (directory / 'vo.txt').write_text('The narration says roughly.')
            args = ['claims_contract_check.py', '--engine', str(directory / 'Ep0903.tsx'),
                    '--props', str(directory / 'props.json'), '--claims', str(directory / 'claims.json'),
                    '--vo', str(directory / 'vo.txt')]
            output = io.StringIO()
            with patch.object(sys, 'argv', args), contextlib.redirect_stdout(output):
                result = check.main()
            return result, output.getvalue()

    def test_all_contract_obligations_use_proven_labels(self):
        claims = [{'id': 'c1', 'on_screen': 'UNIQUE PROP TOKEN 1', 'contract': {
            'must_ship': True, 'on_screen_verbatim': True, 'attribution_on_screen': 'UNIQUE PROP TOKEN 2',
            'must_ship_with': ['c2'], 'spoken_contains': ['roughly']}},
            {'id': 'c2', 'on_screen': 'UNIQUE PROP TOKEN 4'}]
        result, output = self.run_contract(claims)
        self.assertEqual(result, 0, output)
        self.assertIn('5 machine obligation(s)', output)
        for field, value in [('attribution_on_screen', 'UNIQUE PROP TOKEN 3'),
                             ('spoken_contains', ['missing spoken hedge'])]:
            altered = copy.deepcopy(claims)
            altered[0]['contract'][field] = value
            self.assertEqual(self.run_contract(altered)[0], 1)
        claims[1]['on_screen'] = 'UNIQUE PROP TOKEN 3'
        result, output = self.run_contract(claims)
        self.assertEqual(result, 1)
        self.assertIn('must_ship_with', output)

    def test_suppressed_metadata_research_and_cross_label_phrases_cannot_ship(self):
        self.props['research'] = {'on_screen': 'RESEARCH IS NOT DRAWN'}
        for text in ('UNIQUE PROP TOKEN 3', 'RESEARCH IS NOT DRAWN', 'TOKEN 1 UNIQUE PROP'):
            with self.subTest(text=text):
                claims = [{'id': 'c1', 'on_screen': text,
                           'contract': {'must_ship': True, 'on_screen_verbatim': True}}]
                result, output = self.run_contract(claims)
                self.assertEqual(result, 1)
                self.assertIn('2 unmet obligation(s)', output)

    def test_prose_and_legacy_literal_contracts_are_preserved(self):
        claims = [{'id': 'c1', 'on_screen': 'MEDICAL RECORD', 'contract': {'must_ship': True}},
                  {'id': 'c2', 'requires': 'Human semantic obligation'}]
        result, output = self.run_contract(claims)
        self.assertEqual(result, 0)
        self.assertIn('1 machine obligation(s)', output)
        self.assertIn('NOT MACHINE-CHECKED HERE', output)


if __name__ == '__main__':
    unittest.main()
