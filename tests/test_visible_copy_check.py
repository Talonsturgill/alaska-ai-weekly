"""Focused source/props copy regressions, with no OCR or geometry claims."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "scripts"))
from preflight import CHECKS
from text_fit_check import collect_labels
from visible_copy_check import check, violations


class VisibleCopyTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.source = Path(self.tmp.name) / "episode.tsx"
        self.props = Path(self.tmp.name) / "props.json"
        self.source.write_text('const Shot=()=> <Type text="CLEAN COPY"/>;')
        self.data = {"captions": [{"text": "The care has to stay."}],
                     "beats": [{"label": "PATIENT CHOICE"}],
                     "credits": {"music": "Music by Artist", "site": "example.com",
                                 "sources": ["https://example.com/notice"]}}
        self.save_props()

    def save_props(self):
        self.props.write_text(json.dumps(self.data))

    def result(self):
        return check([self.source], self.props)

    def test_normal_margin_of_copy_passes(self):
        self.assertEqual(self.result()["status"], "PASS")

    def test_literal_film_label_colon_fails(self):
        self.source.write_text('const Shot=()=> <Label text="DECISIONS: PROVIDER"/>;')
        result = self.result()
        self.assertEqual(result["status"], "FAIL")
        self.assertEqual(result["failures"][0]["text"], "DECISIONS: PROVIDER")
        self.assertIn("Label.text", result["failures"][0]["location"])

    def test_built_caption_not_locked_vo_is_checked(self):
        self.data["captions"][0]["text"] = "For that informed choice: how long?"
        self.save_props()
        result = self.result()
        self.assertEqual(result["status"], "FAIL")
        self.assertIn("captions[0].text", result["failures"][0]["location"])

    def test_case_insensitive_whole_word_formal_ban(self):
        for text in ("cannot", "CANNOT", "We Cannot assume it."):
            with self.subTest(text=text):
                self.assertTrue(violations(text))
        for text in ("can't", "cannotary", "scannot"):
            self.assertEqual(violations(text), [])

    def test_all_four_punctuation_bans(self):
        for char in ":;\u2014\u2013":
            with self.subTest(char=char):
                self.assertTrue(violations("Before" + char + " after"))

    def test_url_identifier_not_whole_line_is_exempt(self):
        self.assertEqual(violations("Read https://example.com:8443/a;b?q=cannot now."), [])
        self.assertTrue(violations("Source: https://example.com"))
        self.assertTrue(violations("https://example.com; then cannot assume it."))
        self.assertTrue(violations("https://example.com\u2014another source"))
        self.assertTrue(violations("https:// is not a URL."))

    def test_note_lever_type_and_headline_ternaries_are_collected(self):
        self.source.write_text('''
const HEADS=[['CLEAN','BAD; HEAD'],['SECOND','CANNOT ASSUME']];
const Shot=()=> <g>
 <Type text={ready?'CLEAN':'TYPE: BAD'}/>
 <Note title={ready?'DRAFT':'NOTE\u2014BAD'}/>
 <Lever label={ready?'ON':'LEVER\u2013BAD'}/>
</g>;
''')
        result = self.result()
        self.assertEqual(result["checked"]["source"], 10)
        self.assertEqual(len(result["failures"]), 5)

    def test_defaults_are_checked_and_forwarded_props_not_guessed(self):
        self.source.write_text('''
const Note=({title='DEFAULT: TITLE'})=><Type text={title}/>;
const Shot=()=> <Note/>;
''')
        result = self.result()
        self.assertEqual(result["issues"], [])
        self.assertEqual(result["failures"][0]["text"], "DEFAULT: TITLE")

    def test_head_alias_and_actual_beat_label_are_resolved(self):
        self.source.write_text('''
const HEADS=[['FIRST','SECOND']];
const Shot=({n,active})=>{const head=HEADS[n-1];
return <g><Type text={head[0]}/><Type text={head[1]}/><Label text={active.label}/></g>;};
''')
        result = self.result()
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["checked"]["source"], 3)

    def test_code_style_and_comments_not_display_copy(self):
        self.source.write_text('''
// cannot: a comment;
const declaration='cannot: code;';
const Shot=()=> <Type style={{content:'cannot: style;'}} text="CLEAN"/>;
''')
        self.assertEqual(self.result()["status"], "PASS")

    def test_credit_and_beat_prose_is_checked(self):
        self.data["beats"][0]["label"] = "ONE; TWO"
        self.data["credits"]["music"] = "Music: Artist"
        self.data["credits"]["sources"] = ["https://example.com/path;identifier"]
        self.save_props()
        result = self.result()
        self.assertEqual(len(result["failures"]), 2)

    def test_zero_source_coverage_fails_despite_valid_props(self):
        for source in ('const Shot=()=> <rect/>;', 'const Shot=()=> <Type text=""/>;'):
            self.source.write_text(source)
            result = self.result()
            self.assertEqual(result["status"], "FAIL")
            self.assertTrue(any("ZERO" in issue["why"] for issue in result["issues"]))

    def test_unresolved_visible_expression_and_parse_errors_fail(self):
        for source in ('const Shot=()=> <Type text={runtimeText}/>;',
                       'const Shot=()=> <Type text="CLEAN"/> BROKEN {{;'):
            self.source.write_text(source)
            result = self.result()
            self.assertEqual(result["status"], "FAIL")
            self.assertTrue(result["issues"])

    def test_missing_props_and_empty_caption_group_fail(self):
        self.props.unlink()
        self.assertEqual(self.result()["status"], "FAIL")
        self.data["captions"] = []
        self.save_props()
        self.assertEqual(self.result()["status"], "FAIL")

    def test_additive_fields_leave_geometry_contract_available(self):
        data = collect_labels(self.source, self.props)
        self.assertEqual(data["issues"], [])
        self.assertEqual(data["calls"], [])
        self.assertIn("copy_literals", data)
        self.assertIn("copy_issues", data)

    def test_cli_nonzero_on_real_fixture_defect(self):
        self.data["captions"][0]["text"] = "Choice: how long?"
        self.save_props()
        result = subprocess.run([sys.executable, str(REPO / "scripts/visible_copy_check.py"),
                                 str(self.source), "--props", str(self.props)],
                                capture_output=True, text=True)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(json.loads(result.stdout)["status"], "FAIL")

    def test_preflight_requires_the_guard(self):
        entries = [entry for entry in CHECKS if "scripts/visible_copy_check.py" in entry[1]]
        self.assertEqual(len(entries), 1)
        self.assertTrue(entries[0][2])


if __name__ == "__main__":
    unittest.main()
