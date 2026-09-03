"""Advisory checks must read real clocks/JSX without concealing genuine gaps."""
import contextlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from scripts import evidence_coverage_check as coverage
from scripts import staging_check as staging


class BeatClockTests(unittest.TestCase):
    def test_authoritative_numeric_clock_and_legacy_ranges(self):
        self.assertEqual(coverage.beat_time({"at_s": 5.2, "t": "5-9"}), 5.2)
        self.assertEqual(coverage.beat_time({"at_s": 0}), 0)
        for value in (5.2, "5.2", "5.2-9", "5.2 – 9", "5.2 to 9"):
            with self.subTest(value=value):
                self.assertEqual(coverage.beat_time({"t": value}), 5.2)

    def test_invalid_clocks_cannot_disappear_or_fall_back(self):
        invalid = [{}, {"at_s": "5", "t": "5-9"}, {"at_s": None, "t": 5},
                   {"at_s": True}, {"at_s": float("nan")}, {"at_s": float("inf")},
                   {"at_s": -1}, {"t": None}, {"t": True}, {"t": "9-5"},
                   {"t": "5-5"}, {"t": "5-noon"}, {"t": "NaN"},
                   {"t": "-1"}, {"at_s": 5, "t": "bad"}]
        for beat in invalid:
            with self.subTest(beat=beat), self.assertRaises(ValueError):
                coverage.beat_time(beat)

    def run_check(self, beat, sample=5, strip_exists=True):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "motion.json").write_text(json.dumps({"strips": {
                "test": {"centre_s": sample, "changed_pct": 4}}}))
            (root / "episode_props.json").write_text(json.dumps({"scenes": [{"from": 0, "dur": 300}]}))
            (root / "storyboard.json").write_text(json.dumps({"beats": [beat]}))
            if strip_exists:
                (root / "filmstrip_test.jpg").touch()
            output = io.StringIO()
            with patch.object(coverage, "EV", temp), patch.object(coverage, "OUT", temp), \
                    patch("sys.argv", ["evidence_coverage_check.py"]), contextlib.redirect_stdout(output):
                code = coverage.main()
            return code, output.getvalue()

    def test_same_window_floor_authoritative_clock_and_disk_obligation(self):
        self.assertEqual(self.run_check({"at_s": 5, "t": "0-9"})[0], 0)
        self.assertEqual(self.run_check({"at_s": 5, "t": "0-9"}, sample=7)[0], 1)
        self.assertEqual(self.run_check({"t": "0-9"}, sample=7)[0], 1)
        code, output = self.run_check({"at_s": "bad", "t": 5})
        self.assertEqual(code, 1)
        self.assertIn("invalid clock", output)
        self.assertIn("NOT ON DISK", self.run_check({"at_s": 5}, strip_exists=False)[1])


class GestureParserTests(unittest.TestCase):
    def scan(self, source):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "Scene.tsx"
            path.write_text(source)
            return staging.scan_engine(path)

    def test_actual_s11_driven_expressions_and_scene_mapping(self):
        source = '''const Shot=({n,from})=>{const f=useCurrentFrame(),g=f+from;
        const ease=(frame,start)=>interpolate(frame,[start,start+24],[0,1]);
        const p=(id)=>ease(g,id*30);
        if(n===11){const question=p(26),tell=p(29),offer=.52+.35*Math.sin(f/17),
        reply=.48+.36*Math.sin((f-13)/19);
        return <><Character pose="point" gesture={question*offer}/>
        <Character pose="point" gesture={question*(reply+.1*tell)}/></>;}};'''
        rows = self.scan(source)
        self.assertEqual(len(rows), 2)
        self.assertTrue(all(row["driven"] and row["scene"] == 11 for row in rows))

    def test_constant_or_missing_gesture_not_excused_by_nearby_frame(self):
        rows = self.scan('''const S3=()=>{const f=useCurrentFrame();
        return <><Character pose="point" gesture={.5} frame={f}/>
        <Character pose="raise" frame={f}/></>;};''')
        self.assertEqual([row["driven"] for row in rows], [False, False])
        self.assertEqual([row["scene"] for row in rows], [3, 3])
        self.assertEqual([row["has_gesture"] for row in rows], [True, False])

    def test_lexical_shadow_unknown_call_and_comments_fail_closed(self):
        rows = self.scan('''const Shot=({n})=>{const f=useCurrentFrame(),question=f/30;
        // <Character pose="point" gesture={f}/>
        if(n===10){return <Character pose="point" gesture={question}/>;}
        else if(n===11){const question=.5;return <><Character pose="point" gesture={question}/>
        <Character pose="point" gesture={unknown(f)}/></>;}};''')
        self.assertEqual([row["driven"] for row in rows], [True, False, False])
        self.assertEqual([row["scene"] for row in rows], [10, 11, 11])

    def test_function_arguments_resolved_but_constant_return_is_not_driven(self):
        rows = self.scan('''const S4=()=>{const f=useCurrentFrame();
        const moving=(v)=>Math.sin(v),still=(v)=>.5;
        return <><Character pose={'point'} gesture={moving(f)}/>
        <Character pose="point" gesture={still(f)}/></>;};''')
        self.assertEqual([row["driven"] for row in rows], [True, False])
        self.assertEqual(rows[0]["poses"], {"point"})

    def test_legacy_helper_frame_parameter_but_not_constant_f(self):
        rows = self.scan('''const Pair=({f,gesture})=>
        <Character pose="point" gesture={gesture+.05*voice.accentAt(f)}/>;
        const S3=()=>{const f=.5;return <Character pose="point" gesture={f}/>;};''')
        self.assertEqual([row["driven"] for row in rows], [True, False])
        self.assertEqual([row["scene"] for row in rows], [0, 3])

    def test_invalid_tsx_or_missing_parser_is_not_a_pass(self):
        with self.assertRaises(ValueError):
            self.scan('const X=()=> <Character pose="point" gesture={;')
        with patch.object(staging, "REPO", "/missing-staging-parser"), self.assertRaises(ValueError):
            self.scan('<Character pose="point" gesture={f}/>')


if __name__ == "__main__":
    unittest.main()
