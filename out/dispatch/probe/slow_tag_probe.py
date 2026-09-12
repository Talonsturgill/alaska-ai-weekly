import sys,json,re,hashlib,datetime
from pathlib import Path
sys.path.insert(0,str(Path.cwd()/'scripts'))
import vo_synth_gemini as synth
import vo_soundcheck as sc
out=Path('out/dispatch/probe')
script=json.loads(Path('out/dispatch/vo_script.json').read_text())['lines']
spoken='\n'.join(script[i]['text'] for i in [0,4,16,17,18])
tagged=spoken.replace('Nineteen scalp','Nineteen [slow] scalp',1)
prompt='Read ONLY the transcript aloud. The notes are direction and must never be spoken.\n# AUDIO PROFILE: Nora, warm and grounded Alaska public-radio narrator.\n### DIRECTION NOTES\nStyle: Speak slowly and calmly, with the patient cadence of a reflective science documentary. Keep ordinary vowels and real thought-breaths. This is a short isolated pronunciation and pacing-tag probe.\nTranscript:\n'+tagged
pcm=synth._synth_once(prompt,'gemini-3.1-flash-tts-preview','Sulafat')
wav=out/'slow_tag_probe.wav';synth._save_24k(pcm,str(wav))
report=sc.check(str(wav),spoken,tags=['[slow]'],dur_lo=10,dur_hi=65)
report.update({'test_scope':'Isolated56-word tag validation, not a delivery-format pass.','tag':'[slow]','placement':'mid-line after Nineteen, never line-initial or adjacent to another tag','source':'https://cloud.google.com/blog/products/ai-machine-learning/gemini-3-1-flash-tts-on-google-cloud','script':spoken,'tagged_transcript':tagged,'wav_sha256':hashlib.sha256(wav.read_bytes()).hexdigest(),'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat()})
(out/'slow_tag_probe.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
