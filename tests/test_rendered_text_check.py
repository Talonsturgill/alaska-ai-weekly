"""Adversarial browser evidence, not a copy of Box's layout arithmetic."""
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

from scripts import rendered_text_check as guard
from scripts import text_fit_check, zoom_clip_check, visible_copy_check

REPO = Path(__file__).resolve().parents[1]

FIXTURE = '''import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame} from 'remotion';
const Type:React.FC<any>=({text,x=540,y,size=44})=><text x={x} y={y} textAnchor="middle" fontFamily="Fraunces" fontSize={size} fontWeight={800}>{text}</text>;
const Box:React.FC<any>=({text,x=540,y=600,w=860,size=42})=>{
 const max=Math.floor((w-44)/(size*.67));const rows:string[]=[];let row='';
 for(const word of text.split(' ')){if((row+' '+word).trim().length>max&&row){rows.push(row);row=word;}else row=(row+' '+word).trim();}if(row)rows.push(row);
 const h=rows.length*(size+8)+26;
 return <g><rect x={x-w/2} y={y} width={w} height={h} stroke="black" strokeWidth={4}/>{rows.map((r,i)=><Type text={r} x={x} y={y+size+8+i*(size+8)} size={size}/>)}</g>;
};
const Scope:React.FC<any>=({caseName})=><g><Box text={caseName??'SIMULATED EDITORIAL SCHEMATIC'} y={1150} size={28}/></g>;
export const EpFixture:React.FC<any>=()=>{const f=useCurrentFrame();return <AbsoluteFill>
 <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}');font-weight:100 900;}`}</style>
 <svg width={1080} height={1920}>
 <g transform={f===2?'translate(250 0) scale(1.3)':'translate(0 0)'}><Box text={f===1?'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW':'Correct wrapped outcome for an actual browser measurement'}/></g>
 <Scope caseName={f===0?undefined:'CONSTANT RECRUITMENT'}/>
 {f===3&&<Type text={42 as any} y={950}/>}
 {false&&<Box text={'UNREACHED COPY'} y={800}/>}
 </svg></AbsoluteFill>;};
'''


class RenderedTextTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.directory = Path(cls.temp.name)
        cls.source = cls.directory / 'fixture.tsx'
        cls.source.write_text(FIXTURE)
        cls.props = cls.directory / 'props.json'
        cls.props.write_text(json.dumps({'scenes': [{'from': i, 'dur': 1} for i in range(4)]}))
        options, result = cls.directory / 'options.json', cls.directory / 'result.json'
        options.write_text(json.dumps({'source': str(cls.source), 'props': str(cls.props)}))
        run = subprocess.run(['node', str(REPO / 'scripts/rendered_text_probe.cjs'), str(options), str(result)],
                             capture_output=True, text=True, timeout=180)
        if run.returncode:
            raise AssertionError(run.stderr)
        cls.data = json.loads(result.read_text())

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def test_actual_wrapped_fraunces_rows_fit_without_a_font_width_estimate(self):
        rows = [r for r in self.data['fit'] if r['frame'] == 0]
        self.assertGreaterEqual(len(rows), 3)
        self.assertTrue(all(min(r['margin_l'], r['margin_r']) >= 14 for r in rows))
        self.assertTrue(all(min(r['top'], r['bottom']) >= 0 for r in rows))

    def test_single_unbreakable_word_overflows_actual_plate(self):
        rows = [r for r in self.data['fit'] if r['text'].startswith('WWWW')]
        self.assertEqual(len(rows), 1)
        self.assertLess(rows[0]['margin_l'], 0)
        failures, measured = guard.fit_results(self.data)
        self.assertGreater(measured, 0)
        self.assertTrue(any(r['text'].startswith('WWWW') for r in failures))

    def test_actual_projected_geometry_catches_clipping(self):
        data = {**self.data, 'issues': []}  # isolate projection from separate coverage failures
        bad, _, measured, _, _ = guard.projection_results(data)
        self.assertGreater(measured, 0)
        self.assertTrue(any(row[0] == 'S3' for row in bad))

    def test_scope_api_and_dynamic_row_values_are_resolved_by_real_component(self):
        text = [r['text'] for r in self.data['copy_literals']]
        self.assertIn('SIMULATED EDITORIAL SCHEMATIC', text)
        self.assertIn('CONSTANT RECRUITMENT', text)
        self.assertFalse(any('Scope.text' in r['why'] for r in self.data['issues']))

    def test_nonstring_and_unvisited_calls_fail_closed(self):
        why = [i['why'] for i in self.data['issues']]
        self.assertTrue(any('not a resolved string' in s for s in why))
        self.assertTrue(any('never mounted' in s for s in why))
        with self.assertRaises(ValueError):
            guard.projection_results(self.data)

    def test_all_frames_and_actual_scene_ranges_are_measured(self):
        self.assertEqual(self.data['frames_measured'], 4)
        self.assertEqual(self.data['scene_frames'], {str(i): 1 for i in range(1, 5)})

    def test_three_guards_share_evidence_and_keep_failures(self):
        with patch.object(guard, 'collect_rendered', return_value=self.data):
            extracted = text_fit_check.collect_labels(str(self.source), str(self.props))
            self.assertTrue(extracted['copy_literals'])
            self.assertTrue(extracted['copy_issues'])
            failures, measured = text_fit_check.check_label_call_sites(str(self.source), props_path=str(self.props))
            self.assertTrue(failures)
            self.assertGreater(measured, 0)
            with self.assertRaises(ValueError):
                zoom_clip_check.check(str(self.source))
            self.assertEqual(visible_copy_check.check([str(self.source)], str(self.props))['status'], 'FAIL')

    def test_source_or_props_mutation_changes_provenance(self):
        before = guard.provenance(self.source, self.props)
        original = self.source.read_text()
        try:
            self.source.write_text(original + '\n// changed renderer\n')
            self.assertNotEqual(before, guard.provenance(self.source, self.props))
        finally:
            self.source.write_text(original)


if __name__ == '__main__':
    unittest.main()
