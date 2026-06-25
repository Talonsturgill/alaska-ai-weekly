"""60s beluga VO — 9 segments, edge-tts Ava -3%, laid on a 60s timeline."""
import os, subprocess, json
import numpy as np
from scipy.io import wavfile
HERE=os.path.dirname(os.path.abspath(__file__)); AUD=os.path.join(HERE,"audio"); os.makedirs(AUD,exist_ok=True)
VOICE="en-US-AvaMultilingualNeural"; RATE="-3%"; SR=44100; FPS=30; LEAD=0.6; GAP=0.22; TOTAL=60.0
SEG=[
 "Cook Inlet has its own belugas. Just a few hundred, and they never leave.",
 "They're hard to see. The water runs gray with glacier silt, and a white whale just vanishes in it.",
 "So you can't count them by looking. You have to listen.",
 "Scientists sank a ring of microphones across the inlet and recorded it for years.",
 "Then an A.I. learned the sound of a beluga, and learned to pull that one voice out of a passing ship's roar.",
 "It works. It flags a real call with better than ninety six percent accuracy, and turns months of tape into a night's work.",
 "Here's the honest part. The microphone can tell you they're still out there. It can't tell you how many are left.",
 "And it can't make the inlet any quieter for the mothers calling to their calves.",
 "So the machine listens, the people count, and a small white pod keeps moving through the gray.",
]
env=dict(os.environ); env["SSL_CERT_FILE"]="/etc/ssl/certs/ca-certificates.crt"; env["SSL_CERT_DIR"]="/etc/ssl/certs"
def run(c): return subprocess.run(c,check=True,capture_output=True,text=True,env=env)
def dur(p): return float(run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",p]).stdout)
def load(p):
    w=p[:-4]+".wav"; run(["ffmpeg","-y","-i",p,"-ac","1","-ar",str(SR),"-f","wav",w]); sr,d=wavfile.read(w)
    return (d.astype(np.float32)/32768.0) if d.dtype==np.int16 else d.astype(np.float32)
durs=[]; clips=[]
for i,t in enumerate(SEG,1):
    mp3=os.path.join(AUD,f"s{i}.mp3"); run(["edge-tts","--voice",VOICE,f"--rate={RATE}","--text",t,"--write-media",mp3])
    durs.append(dur(mp3)); clips.append(load(mp3)); print(f"s{i}: {durs[-1]:.2f}s")
N=int(TOTAL*SR); buf=np.zeros(N,np.float32); t=LEAD; beats=[]; starts=[]
for i,c in enumerate(clips):
    s=int(t*SR); starts.append(round(t,3)); beats.append(round(t*FPS)); e=min(s+len(c),N); buf[s:e]+=c[:e-s]; t+=durs[i]+GAP
speech_end=t-GAP; print("speech_end",round(speech_end,2),"beats",beats)
buf=buf/(np.max(np.abs(buf))+1e-9)*(10**(-1.5/20))
wavfile.write(os.path.join(AUD,"vo60.wav"),SR,(np.stack([buf,buf],1)*32767).astype(np.int16))
json.dump({"starts":starts,"beats":beats,"durs":durs,"speech_end":speech_end,"total":TOTAL,"fps":FPS},
          open(os.path.join(AUD,"timing60.json"),"w"),indent=2)
print("wrote vo60.wav, timing60.json")
