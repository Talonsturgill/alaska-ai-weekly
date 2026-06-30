"""60s beluga VO — 9 segments, edge-tts Ava, laid on a 60s timeline.
ALSO captures real per-WORD timings (edge-tts --write-subtitles) so the on-screen
captions can be word-synced to the actual voice. Writes:
  audio/vo60.wav        the 60s VO bed (stereo, -1.5 dBTP normalized)
  audio/timing60.json   segment starts/beats/durs/speech_end (audio mix + scene beats)
  audio/words60.json    global word list [{w,s,e,seg}] for kinetic captions
"""
import os, subprocess, json, re
import numpy as np
from scipy.io import wavfile
HERE=os.path.dirname(os.path.abspath(__file__)); AUD=os.path.join(HERE,"audio"); os.makedirs(AUD,exist_ok=True)
VOICE="en-US-BrianMultilingualNeural"; RATE="+10%"; SR=44100; FPS=30; LEAD=0.45; GAP=0.12; TOTAL=60.0
SEG=[
 "Every summer, Alaska counts its salmon. One fish at a time.",
 "The rivers run too gray to see into, so we don't watch with light. We watch with sound.",
 "On the Kenai, a sonar has stared into the current since twenty ten, turning each passing fish into a bright echo.",
 "For years, a person watched that sonar and counted every shape by hand.",
 "Now computer vision is learning the job, drawing a box around each fish as it swims upstream.",
 "It can even tell a big king from a smaller sockeye by length, the same trick the biologists use.",
 "The same approach is spreading, counting salmon on rivers from British Columbia to Alaska, trained on hundreds of thousands of labeled frames.",
 "But the machine still misses. On the Kenai, one twenty twenty five test was off by about a quarter.",
 "And counting was never the hard part. How many salmon must reach the spawning beds before the nets open. That call is still ours.",
]
env=dict(os.environ); env["SSL_CERT_FILE"]="/etc/ssl/certs/ca-certificates.crt"; env["SSL_CERT_DIR"]="/etc/ssl/certs"
def run(c): return subprocess.run(c,check=True,capture_output=True,text=True,env=env)
def dur(p): return float(run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",p]).stdout)
def load(p):
    w=p[:-4]+".wav"; run(["ffmpeg","-y","-i",p,"-ac","1","-ar",str(SR),"-f","wav",w]); sr,d=wavfile.read(w)
    return (d.astype(np.float32)/32768.0) if d.dtype==np.int16 else d.astype(np.float32)
def ts(s):  # "00:00:01,234" or "...01.234" -> seconds
    h,m,rest=s.replace(",",".").split(":"); return int(h)*3600+int(m)*60+float(rest)
def parse_vtt(p):
    out=[]; lines=open(p,encoding="utf-8").read().splitlines(); i=0
    while i<len(lines):
        if "-->" in lines[i]:
            a,b=[x.strip() for x in lines[i].split("-->")]; b=b.split()[0]
            txt=lines[i+1].strip() if i+1<len(lines) else ""
            if txt: out.append((ts(a),ts(b),txt))
            i+=2
        else: i+=1
    return out
durs=[]; clips=[]; wordseg=[]
for i,t in enumerate(SEG,1):
    mp3=os.path.join(AUD,f"s{i}.mp3"); vtt=os.path.join(AUD,f"s{i}.vtt")
    run(["edge-tts","--voice",VOICE,f"--rate={RATE}","--text",t,"--write-media",mp3,"--write-subtitles",vtt])
    durs.append(dur(mp3)); clips.append(load(mp3)); wordseg.append(parse_vtt(vtt))
    print(f"s{i}: {durs[-1]:.2f}s  words={len(wordseg[-1])}")
N=int(TOTAL*SR); buf=np.zeros(N,np.float32); t=LEAD; beats=[]; starts=[]; words=[]
for i,c in enumerate(clips):
    s=int(t*SR); starts.append(round(t,3)); beats.append(round(t*FPS)); e=min(s+len(c),N); buf[s:e]+=c[:e-s]
    for (ws,we,w) in wordseg[i]:
        words.append({"w":w,"s":round(t+ws,3),"e":round(t+we,3),"seg":i})
    t+=durs[i]+GAP
speech_end=t-GAP; print("speech_end",round(speech_end,2),"beats",beats,"words",len(words))
buf=buf/(np.max(np.abs(buf))+1e-9)*(10**(-1.5/20))
wavfile.write(os.path.join(AUD,"vo60.wav"),SR,(np.stack([buf,buf],1)*32767).astype(np.int16))
json.dump({"starts":starts,"beats":beats,"durs":durs,"speech_end":speech_end,"total":TOTAL,"fps":FPS},
          open(os.path.join(AUD,"timing60.json"),"w"),indent=2)
json.dump({"words":words,"speech_end":speech_end,"total":TOTAL,"fps":FPS},
          open(os.path.join(AUD,"words60.json"),"w"),indent=2)
print("wrote vo60.wav, timing60.json, words60.json")
