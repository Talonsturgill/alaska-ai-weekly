"""Forbidden claim wording must fail even when a numeric claim is optional."""
import contextlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from scripts import claims_contract_check as check


class NegativeDisplayContractTests(unittest.TestCase):
    def run_contract(self, engine, forbidden, evidence=None):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            paths = {name: root / name for name in ('claims.json', 'vo.txt', 'EpTest.tsx', 'props.json')}
            paths['claims.json'].write_text(json.dumps({'claims': [{
                'id': 'timing', 'on_screen': 'OPTIONAL DURATION',
                'contract': {'must_ship': False, 'on_screen_none': forbidden}}]}))
            paths['vo.txt'].write_text('A person reviews the report.')
            paths['EpTest.tsx'].write_text(engine)
            paths['props.json'].write_text('{}')
            (root / 'Root.tsx').write_text('')
            argv = ['check', '--claims', str(paths['claims.json']), '--vo', str(paths['vo.txt']),
                    '--engine', str(paths['EpTest.tsx']), '--props', str(paths['props.json'])]
            output = io.StringIO()
            with patch('sys.argv', argv), contextlib.redirect_stdout(output), \
                    patch.object(check, 'dynamic_labels', return_value=(evidence or [], 'test route')):
                result = check.main()
            return result, output.getvalue()

    def test_optional_claim_still_rejects_overstated_award(self):
        status, output = self.run_contract('<text>Contract awarded in 2 minutes</text>',
                                           ['CONTRACT AWARDED IN 2 MINUTES'])
        self.assertEqual(status, 1)
        self.assertIn('forbidden on-screen phrase', output)

    def test_safe_report_and_prohibited_wording_only_in_comment_pass(self):
        status, output = self.run_contract('// CONTRACT AWARDED IN 2 MINUTES\n<text>HUMAN REVIEW</text>',
                                           ['CONTRACT AWARDED IN 2 MINUTES'])
        self.assertEqual(status, 0)
        self.assertIn('1 machine obligation', output)

    def test_resolved_dynamic_display_is_checked(self):
        status, _ = self.run_contract('<text>HUMAN REVIEW</text>', ['AUTOMATIC AWARD'],
                                      [{'label': 'AUTOMATIC AWARD'}])
        self.assertEqual(status, 1)

    def test_malformed_negative_contract_fails(self):
        for malformed in ('AUTOMATIC AWARD', [None], [''], ['!!!']):
            with self.subTest(malformed=malformed):
                status, output = self.run_contract('<text>HUMAN REVIEW</text>', malformed)
                self.assertEqual(status, 1)
                self.assertIn('invalid on_screen_none', output)


if __name__ == '__main__':
    unittest.main()
