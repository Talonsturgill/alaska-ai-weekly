"""Transport-only TTS tests. All HTTP and credential access is mocked."""
import base64
import contextlib
import http.client
import io
import json
import unittest
from unittest.mock import patch

import numpy as np

from scripts import vo_synth_gemini as synth


MODEL = "gemini-3.1-flash-tts-preview"


class Response(io.BytesIO):
    def __init__(self, body, content_type="text/event-stream", status=200, remaining=None):
        super().__init__(body)
        self.headers = {"Content-Type": content_type}
        self.status = status
        self.length = remaining


class DisconnectedResponse(Response):
    def read1(self, size=-1):
        if self.tell() == len(self.getvalue()):
            raise http.client.RemoteDisconnected("private transport diagnostic")
        return super().read1(size)


def audio_part(raw, mime="audio/L16;codec=pcm;rate=24000"):
    return {"inlineData": {"mimeType": mime, "data": base64.b64encode(raw).decode()}}


def candidate(parts=(), finish=None, index=0):
    value = {"index": index, "content": {"parts": list(parts)}}
    if finish is not None:
        value["finishReason"] = finish
    return {"candidates": [value]}


def event(value, kind=None):
    prefix = f"event: {kind}\n" if kind else ""
    return (prefix + "data: " + json.dumps(value) + "\n\n").encode()


class TTSStreamingTests(unittest.TestCase):
    def setUp(self):
        # A test can never fall through to real credentials or a live request.
        key = patch.object(synth, "_key", return_value="test-only-key")
        self.key = key.start()
        self.addCleanup(key.stop)
        http = patch.object(synth.urllib.request, "urlopen")
        self.http = http.start()
        self.addCleanup(http.stop)

    def synthesize(self, body, model=MODEL, **response_args):
        self.http.return_value = Response(body, **response_args)
        return synth._synth_once("Exact transcript. [short pause] Next thought.", model, "Sulafat")

    def test_joins_every_audio_part_in_event_order_and_preserves_request(self):
        # PCM sample bytes may even straddle a chunk boundary.
        expected = np.array([1, -2, 300, -400], dtype="<i2")
        raw = expected.tobytes()
        body = (event(candidate([audio_part(raw[:1]), audio_part(raw[1:4])]))
                + event(candidate([audio_part(raw[4:])], finish="STOP"))
                + event({"usageMetadata": {"totalTokenCount": 7}}))
        actual = self.synthesize(body)
        np.testing.assert_array_equal(actual, expected)
        request = self.http.call_args.args[0]
        self.assertTrue(request.full_url.endswith(f"/{MODEL}:streamGenerateContent?alt=sse"))
        self.assertEqual(request.get_method(), "POST")
        self.assertEqual(request.get_header("Accept"), "text/event-stream")
        self.assertEqual(request.get_header("X-goog-api-key"), "test-only-key")
        payload = json.loads(request.data)
        self.assertEqual(payload, {
            "contents": [{"parts": [{"text": "Exact transcript. [short pause] Next thought."}]}],
            "generationConfig": {"responseModalities": ["AUDIO"], "speechConfig": {
                "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": "Sulafat"}}}},
        })
        self.assertEqual(self.http.call_args.kwargs["timeout"], 180)

    def test_multiline_data_bom_and_all_sse_line_endings(self):
        obj = candidate([audio_part(b"\x01\x00")], finish="STOP")
        pretty = json.dumps(obj, indent=2)
        for ending in ("\n", "\r\n", "\r"):
            with self.subTest(ending=repr(ending)):
                fields = [": heartbeat", "id: 12", "retry: 1000", "event: message"]
                fields += ["data: " + line for line in pretty.splitlines()]
                body = ("\ufeff" + ending.join(fields) + ending * 2).encode()
                np.testing.assert_array_equal(self.synthesize(body), [1])

    def test_ignores_metadata_unknown_and_non_audio_parts(self):
        body = (event({"unknownMetadata": True}, kind="metadata")
                + event(candidate([{"text": "not spoken PCM"}, {"futurePart": {}},
                                   audio_part(b"not-audio", "image/png"),
                                   audio_part(b"\x02\x00", "audio/pcm;rate=24000")]))
                + event(candidate(finish="STOP")) + b"data: [DONE]\n\n")
        np.testing.assert_array_equal(self.synthesize(body), [2])

    def test_requires_audio_and_successful_stop(self):
        for body in (b"", event({"usageMetadata": {}}),
                     event(candidate(finish="STOP")),
                     event(candidate([audio_part(b"\x01\x00")])),
                     event(candidate([audio_part(b"\x01\x00")])) + b"data: [DONE]\n\n"):
            with self.subTest(body=body):
                with self.assertRaises(RuntimeError):
                    self.synthesize(body)

    def test_rejects_encoded_errors_and_unsuccessful_finish_without_exposing_payload(self):
        first = event(candidate([audio_part(b"\x01\x00")]))
        cases = [event({"error": {"message": "private payload"}}),
                 event({"message": "private payload"}, kind="error"),
                 b"event: error\n\n",
                 event({"promptFeedback": {"blockReason": "SAFETY"}})]
        cases += [event(candidate(finish=reason)) for reason in
                  ("MAX_TOKENS", "OTHER", "SAFETY", "PROHIBITED_CONTENT")]
        for failure in cases:
            with self.subTest(failure=failure):
                with self.assertRaises(RuntimeError) as raised:
                    self.synthesize(first + failure)
                self.assertNotIn("private", str(raised.exception))

    def test_malformed_json_and_incomplete_event_are_not_completion(self):
        complete = event(candidate([audio_part(b"\x01\x00")], finish="STOP"))
        for body in (b"data: {private payload}\n\n", b"data: []\n\n",
                     complete.rstrip(b"\n"), complete[:-1],
                     complete + b"data: {\"error\":"):
            with self.subTest(body=body):
                with self.assertRaises(RuntimeError):
                    self.synthesize(body)

    def test_error_or_new_audio_after_stop_invalidates_entire_attempt(self):
        complete = event(candidate([audio_part(b"\x01\x00")], finish="STOP"))
        endings = [event({"error": {"message": "private payload"}}),
                   event(candidate([audio_part(b"\x02\x00")])),
                   b"data: [DONE]\n\n" + event({"usageMetadata": {}})]
        for ending in endings:
            with self.subTest(ending=ending):
                with self.assertRaises(RuntimeError):
                    self.synthesize(complete + ending)

    def test_rejects_invalid_audio_encoding_and_incomplete_sample(self):
        invalid = {"inlineData": {"mimeType": "audio/pcm;rate=24000", "data": "!private!"}}
        parts = [invalid, audio_part(b"\x01"),
                 audio_part(b"\x01\x00", "audio/mpeg"),
                 audio_part(b"\x01\x00", "audio/pcm;rate=48000"),
                 audio_part(b"\x01\x00", "audio/pcm;rate=24000;channels=2"),
                 audio_part(b"\x01\x00", "audio/L16;codec=mp3;rate=24000")]
        for part in parts:
            with self.subTest(part=part):
                with self.assertRaises(RuntimeError):
                    self.synthesize(event(candidate([part], finish="STOP")))

    def test_does_not_concatenate_alternative_candidates(self):
        body = event(candidate([audio_part(b"\x01\x00")], finish="STOP", index=1))
        with self.assertRaises(RuntimeError):
            self.synthesize(body)

    def test_disconnection_even_after_stop_never_returns_partial_audio(self):
        body = event(candidate([audio_part(b"\x01\x00")], finish="STOP"))
        self.http.return_value = DisconnectedResponse(body)
        with self.assertRaises(http.client.RemoteDisconnected):
            synth._synth_once("text", MODEL, "Sulafat")

    def test_rejects_unfulfilled_http_length_or_wrong_http_response(self):
        body = event(candidate([audio_part(b"\x01\x00")], finish="STOP"))
        for arguments in ({"remaining": 20}, {"status": 206}, {"content_type": "application/json"}):
            with self.subTest(arguments=arguments):
                with self.assertRaises(RuntimeError):
                    self.synthesize(body, **arguments)

    def test_legacy_25_and_unknown_models_keep_nonstreaming_behavior(self):
        # The legacy branch intentionally does not acquire new streaming/STOP rules.
        body = json.dumps(candidate([audio_part(b"\x03\x00")])).encode()
        for model in ("gemini-2.5-pro-preview-tts", "unrecognized-model"):
            with self.subTest(model=model):
                np.testing.assert_array_equal(self.synthesize(body, model, content_type="application/json"), [3])
                request = self.http.call_args.args[0]
                self.assertTrue(request.full_url.endswith(f"/{model}:generateContent"))
                self.assertIsNone(request.get_header("Accept"))

    def test_retry_discards_incomplete_attempt_and_returns_only_complete_audio(self):
        failed = event(candidate([audio_part(b"\xff\x7f")]))
        expected = np.full(60000, -2, dtype="<i2")
        success = event(candidate([audio_part(expected.tobytes())], finish="STOP"))
        self.http.side_effect = [Response(failed), Response(success)]
        with patch.object(synth, "MODEL", MODEL), patch.object(synth, "FALLBACK", MODEL), \
                patch.object(synth, "SECOND_FALLBACK", MODEL), patch.object(synth.time, "sleep"):
            actual, model = synth._synth_retry("exact transcript")
        np.testing.assert_array_equal(actual, expected)
        self.assertEqual(model, MODEL)
        self.assertEqual(self.http.call_count, 2)

    def test_retry_logs_only_sanitized_error_type(self):
        self.http.side_effect = lambda *args, **kwargs: Response(
            event({"error": {"message": "private payload test-only-key https://private.invalid"}}))
        output = io.StringIO()
        with patch.object(synth, "MODEL", MODEL), patch.object(synth, "FALLBACK", MODEL), \
                patch.object(synth, "SECOND_FALLBACK", MODEL), patch.object(synth.time, "sleep"), \
                contextlib.redirect_stdout(output):
            with self.assertRaisesRegex(RuntimeError, "failed on every configured model"):
                synth._synth_retry("private prompt")
        self.assertEqual(self.http.call_count, 4)
        self.assertIn("last exception: RuntimeError", output.getvalue())
        for secret in ("private", "test-only-key", "https://"):
            self.assertNotIn(secret, output.getvalue())


if __name__ == "__main__":
    unittest.main()
