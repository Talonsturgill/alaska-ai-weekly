"""Imported display labels require a live component-to-SVG text route."""
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


class ImportedLabelTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = (REPO / "video-engine/src/Ep0912.tsx").read_text()
        cls.helper = (REPO / "video-engine/src/EEGDemo0912.tsx").read_text()
        cls.root_source = (REPO / "video-engine/src/Root.tsx").read_text()
        cls.props = {"total": 1500,
                     "scenes": [{"from": 0, "dur": 100}, {"from": 100, "dur": 100},
                                {"from": 200, "dur": 100}, {"from": 300, "dur": 900}],
                     "beats": [{"id": 10, "at": 11}, {"id": 40, "at": 14},
                               {"id": 11, "at": 20}, {"id": 12, "at": 30}]}

    def resolve(self, engine=None, helper=None, root=None, props=None):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "Ep0912.tsx"
            (path.parent / "EEGDemo0912.tsx").write_text(self.helper if helper is None else helper)
            return check.imported_labels(str(path), self.engine if engine is None else engine,
                                         self.props if props is None else props,
                                         self.root_source if root is None else root)

    def labels(self, **kwargs):
        return [row["label"] for row in self.resolve(**kwargs)[0]]

    def test_live_imported_text_and_label_calls_are_resolved(self):
        rows, note = self.resolve()
        labels = [row["label"] for row in rows]
        for label in ("Vadim Egorov", "GRADUATE STUDENT", "19 SCALP CONTACTS",
                      "ELECTRICAL ACTIVITY", "SCHEMATIC", "INTERPRETATION"):
            self.assertIn(label, labels)
        self.assertIn("source route resolved", note)
        self.assertTrue(all(row["scene"] == 4 for row in rows))

    def test_unconnected_import_scene_or_plane_cannot_supply_evidence(self):
        changes = [("from './EEGDemo0912'", "from './OldDemo'"),
                   ('else if(n===4) art=<EEGDemo0912', 'else if(n===40) art=<EEGDemo0912'),
                   ('art=<EEGDemo0912', 'art=false&&<EEGDemo0912'),
                   ('{art}</SVG></Plane>', '{null}</SVG></Plane>'),
                   ('<Plane z={0}>', '<Plane z={0} opacity={0}>'),
                   ('beats={beats}/></Sequence>', 'beats={[]}/></Sequence>'),
                   ('let g=f+from;', 'let g=0;'),
                   ('bp=(id:number,d=25,lag=0)=>e(', 'bp=(id:number,d=25,lag=0)=>0&&e(')]
        for old, new in changes:
            with self.subTest(old=old):
                self.assertIn(old, self.engine)
                self.assertEqual(self.labels(engine=self.engine.replace(old, new)), [])

    def test_unregistered_or_conditionally_dead_composition_cannot_supply_evidence(self):
        for old, new in [("from './Ep0912'", "from './OldEpisode'"),
                         ('component={Ep0912}', 'component={Ep0911}')]:
            with self.subTest(old=old):
                self.assertIn(old, self.root_source)
                self.assertEqual(self.labels(root=self.root_source.replace(old, new)), [])

    def test_removed_label_is_not_recovered_from_comments_or_unused_literals(self):
        helper = self.helper.replace('>Vadim Egorov</text>', '>Another student</text>')
        helper += '\n// Vadim Egorov\nconst unused = "Vadim Egorov";\n'
        helper += 'const unusedJsx = <text>Vadim Egorov</text>;\n'
        self.assertNotIn('Vadim Egorov', self.labels(helper=helper))
        self.assertIn('Another student', self.labels(helper=helper))

    def test_hidden_and_conditional_helper_groups_do_not_count(self):
        old = '<g opacity={observe * (1 - isolate)}>'
        self.assertIn(old, self.helper)
        for replacement in ('<g opacity={0}>', '<g style={{display:"none"}}>',
                            '<g visibility="hidden">', '<g transform="scale(0)">'):
            with self.subTest(replacement=replacement):
                self.assertNotIn('Vadim Egorov', self.labels(helper=self.helper.replace(old, replacement)))
        call = "{label('19 SCALP CONTACTS', 309, 579, 29)}"
        self.assertIn(call, self.helper)
        self.assertNotIn('19 SCALP CONTACTS', self.labels(helper=self.helper.replace(
            call, "{false && label('19 SCALP CONTACTS', 309, 579, 29)}")))

    def test_changed_native_sink_or_visibility_clock_fails_closed(self):
        changes = [('fontWeight={800}>{text}</text>', 'fontWeight={800}>UNUSED</text>'),
                   ('const observe = clamp(bp(11, 32));', 'const observe = 0;'),
                   ('export const EEGDemo0912', 'const EEGDemo0912'),
                   ('return <g data-scene=', 'if(f>0)return null; return <g data-scene=')]
        for old, new in changes:
            with self.subTest(old=old):
                self.assertIn(old, self.helper)
                self.assertEqual(self.labels(helper=self.helper.replace(old, new)), [])

    def test_missing_or_invalid_scene_and_beat_data_fail_closed(self):
        variants = [{}, {**self.props, 'scenes': []}]
        for key, value in [('at', float('nan')), ('at', '20'), ('id', 10)]:
            props = copy.deepcopy(self.props)
            props['beats'][2][key] = value
            variants.append(props)
        props = copy.deepcopy(self.props)
        props['beats'][3]['at'] = 20.3  # no visible credit interval
        variants.append(props)
        variants.append({**self.props, 'credits': {'frames': 1000}})
        for props in variants:
            with self.subTest(props=props):
                self.assertEqual(self.labels(props=props), [])

    def test_missing_parser_fails_without_helper_credit(self):
        with patch.object(check.subprocess, 'run', side_effect=FileNotFoundError('node')):
            rows, note = self.resolve()
        self.assertEqual(rows, [])
        self.assertIn('no helper credit', note)

    def test_context_contract_adds_assertions_and_does_not_waive_must_ship(self):
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory)
            (p / 'Ep0912.tsx').write_text(self.engine)
            (p / 'EEGDemo0912.tsx').write_text(self.helper)
            (p / 'Root.tsx').write_text(self.root_source)
            (p / 'props.json').write_text(json.dumps(self.props))
            (p / 'vo.txt').write_text('A recording demonstration.')
            claim = {'id': 'c6', 'on_screen': 'VADIM EGOROV',
                     'contract': {'must_ship': True, 'on_screen_verbatim': True,
                                  'on_screen_all': ['GRADUATE STUDENT', 'SCHEMATIC']}}
            args = ['check', '--engine', str(p / 'Ep0912.tsx'), '--claims', str(p / 'claims.json'),
                    '--props', str(p / 'props.json'), '--vo', str(p / 'vo.txt')]
            for missing in (None, 'context', 'claim', 'invalid context'):
                current = copy.deepcopy(claim)
                if missing == 'context':
                    current['contract']['on_screen_all'].append('MISSING LIMIT')
                elif missing == 'claim':
                    current['on_screen'] = 'MISSING PERSON'
                elif missing == 'invalid context':
                    current['contract']['on_screen_all'] = 'SCHEMATIC'
                (p / 'claims.json').write_text(json.dumps({'claims': [current]}))
                output = io.StringIO()
                with patch.object(sys, 'argv', args), contextlib.redirect_stdout(output):
                    result = check.main()
                self.assertEqual(result, 0 if missing is None else 1, output.getvalue())
                if missing is None:
                    self.assertIn('4 machine obligation(s)', output.getvalue())


if __name__ == '__main__':
    unittest.main()
