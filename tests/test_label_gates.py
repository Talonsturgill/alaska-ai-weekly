"""Regression coverage for the real Label/Type JSX contract, not synthetic Plates."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "scripts"))
from text_fit_check import collect_labels, check_label_call_sites
from plate_overlap_check import check, check_label_overlap


COMPONENTS = """
const Type:React.FC<any>=({text,x=540,y,size=42,width=900})=>
  <text x={x} y={y} fontSize={Math.min(size,width/(text.length*.61))}>{text}</text>;
const Label:React.FC<any>=({text,x=540,y,width=810})=><g>
  <rect x={x-width/2} y={y-35} width={width} height={54}/>
  <Type text={text} x={x} y={y} size={29} width={width-28}/>
</g>;
"""


class LabelGateTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.source = Path(self.tmp.name) / "fixture.tsx"
        self.props = Path(self.tmp.name) / "props.json"

    def fixture(self, first, second="<g/>", overlay="", beats=None, components=COMPONENTS):
        self.source.write_text(components + """
const Shot:React.FC<any>=({n,active})=>{let art;
  if(n===1){art=FIRST;}
  else {art=SECOND;}
  return <g>{art}OVERLAY</g>;
};
""".replace("FIRST", first).replace("SECOND", second).replace("OVERLAY", overlay))
        self.props.write_text(json.dumps({"scenes": [{}, {}], "beats": beats or []}))
        return self.source

    def labels(self):
        return collect_labels(self.source, self.props)

    def fit(self):
        return check_label_call_sites(self.source, props_path=self.props)

    def overlaps(self):
        return check_label_overlap(self.source, self.props)

    def test_all_38_actual_props_labels_and_ternary_variants(self):
        self.fixture('<Label text={q>.2?"NOTICE":"OUTCOME"} y={700}/>',
                     overlay='<Label text={active.label} y={1200} width={900}/>',
                     beats=[{"label": f"ACTUAL BEAT {i}"} for i in range(38)])
        data = self.labels()
        self.assertEqual(data["issues"], [])
        self.assertEqual(data["scene_ids"], [1, 2])
        self.assertEqual(data["calls"][0]["width"], 810)
        self.assertEqual(data["calls"][1]["width"], 900)
        self.assertTrue(data["calls"][0]["inside_art"])
        self.assertFalse(data["calls"][1]["inside_art"])
        self.assertEqual(self.fit(), ([], 40))

    def test_long_string_fails_actual_font_floor(self):
        self.fixture('<Label text="' + "X" * 100 + '" y={700}/>')
        failures, count = self.fit()
        self.assertEqual(count, 1)
        self.assertEqual(len(failures), 1)
        self.assertLess(failures[0]["size"], 22)

    def test_narrow_explicit_width_fails(self):
        self.fixture('<Label text="INTERIOR ALASKA" y={700} width={60}/>')
        self.assertTrue(self.fit()[0])

    def test_unknown_width_cannot_pass(self):
        self.fixture('<Label text="TEXT" y={700} width={runtimeWidth}/>')
        failures, count = self.fit()
        self.assertEqual(count, 0)
        self.assertIn("Unresolved", failures[0]["why"])
        self.assertTrue(self.overlaps()[1])

    def test_missing_actual_dynamic_props_cannot_pass(self):
        self.fixture('<Label text={active.label} y={700}/>')
        failures, count = self.fit()
        self.assertEqual(count, 0)
        self.assertIn("Unresolved Label text", failures[0]["why"])

    def test_changed_component_arithmetic_requires_adapter(self):
        self.fixture('<Label text="TEXT" y={700}/>',
                     components=COMPONENTS.replace("width-28", "width/2"))
        self.assertIn("Unrecognized", self.fit()[0][0]["why"])

    def test_real_overlap_is_reported_and_comment_does_not_exempt(self):
        self.fixture('<g><Label text="FIRST" y={700}/>'
                     '<Label text="SECOND" y={720}/>{/* plate-overlap-ok */}</g>')
        findings, issues, scenes = self.overlaps()
        self.assertEqual((issues, scenes), ([], 2))
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0][3], "S1")

    def test_final_else_labels_are_distinct_scene(self):
        self.fixture('<Label text="FIRST" y={700}/>', '<Label text="SECOND" y={700}/>')
        self.assertEqual([c["scene"] for c in self.labels()["calls"]], [1, 2])
        self.assertEqual(self.overlaps(), ([], [], 2))

    def test_static_nested_transforms_apply_inner_to_outer(self):
        self.fixture('<g><g transform="translate(0 100)"><g transform="scale(2)">'
                     '<Label text="FIRST" y={100} width={100}/></g></g>'
                     '<Label text="SECOND" x={1080} y={300} width={200}/></g>')
        findings, issues, _ = self.overlaps()
        self.assertEqual(issues, [])
        self.assertEqual(len(findings), 1)

    def test_animated_transform_is_explicitly_unresolved(self):
        self.fixture('<g transform={`translate(0 ${e.dy})`}><Label text="TEXT" y={700}/></g>')
        findings, issues, scenes = self.overlaps()
        self.assertEqual((findings, scenes), ([], 2))
        self.assertIn("runtime bounds", issues[0]["why"])

    def test_shared_overlay_exclusions_are_respected(self):
        self.fixture('<Label text="FIRST" y={700}/>', '<Label text="SECOND" y={700}/>',
                     overlay='{active&&!([1].includes(n))&&<Label text={active.label} y={700}/>} ',
                     beats=[{"label": "OVERLAY"}])
        findings, issues, _ = self.overlaps()
        self.assertEqual(issues, [])
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0][3], "S2")

    def test_zero_scene_cli_fails_not_false_green(self):
        self.source.write_text("const Empty=()=> <g/>;")
        result = subprocess.run([sys.executable, str(REPO / "scripts/plate_overlap_check.py"),
                                 str(self.source)], text=True, capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("ZERO scenes", result.stdout)

    def test_label_without_recognizable_shot_branch_fails(self):
        self.source.write_text(COMPONENTS + 'const Shot=()=> <Label text="TEXT" y={700}/>;')
        self.props.write_text('{"scenes":[],"beats":[]}')
        self.assertTrue(any("ZERO Shot" in i["why"] for i in self.labels()["issues"]))

    def test_noncontiguous_shot_branch_cannot_claim_complete_coverage(self):
        self.fixture('<Label text="TEXT" y={700}/>')
        self.source.write_text(self.source.read_text().replace("n===1", "n===3"))
        self.assertTrue(any("not contiguous" in i["why"] for i in self.labels()["issues"]))

    def test_projected_art_and_overlay_need_camera_bounds(self):
        self.fixture('<Label text="ART" y={700}/>',
                     overlay='<Label text="OVERLAY" y={1200}/>')
        self.source.write_text(self.source.read_text().replace("return <g>{art}",
                               "return <g><Stage3D>{art}</Stage3D>"))
        self.assertTrue(any("runtime camera bounds" in i["why"] for i in self.overlaps()[1]))

    def test_legacy_plate_collision_still_works(self):
        self.source.write_text('const S1: React.FC<SceneProps> = () => <g>\n'
                               '<Plate text="FIRST" x={540} y={700}/>\n'
                               '<Plate text="SECOND" x={540} y={710}/>\n</g>;')
        self.assertEqual(len(check(self.source)), 1)


if __name__ == "__main__":
    unittest.main()
