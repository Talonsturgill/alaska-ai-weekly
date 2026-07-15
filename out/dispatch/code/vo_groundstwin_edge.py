"""60s VO for 'THE GROUND'S TWIN' (Dispatch 2026-07-15) — Penn State permafrost digital twin,
Utqiagvik. edge-tts (word timings for kinetic captions); disclosed as crash-net in the draft if it
ships. Writes audio/vo60.wav, audio/timing60.json (starts/beats/durs/speech_end), audio/words60.json.
Facts corrected per validator: '2 F per decade' is CONTEXT (not stated as a twin output); no 'first'
claim; about-a-kilometer cables to match the on-screen label.
"""
import os, subprocess, json
import numpy as np
from scipy.io import wavfile
HERE=os.path.dirname(os.path.abspath(__file__)); AUD=os.path.join(HERE,"audio"); os.makedirs(AUD,exist_ok=True)
VOICE=os.environ.get("VO_VOICE","en-US-BrianMultilingualNeural"); RATE="+2%"; SR=44100; FPS=30; LEAD=0.35; GAP=0.16; TOTAL=60.0
# 12 segments, aligned to the 5 shots / 16 beats of storyboard.json
SEG=[
 "In Utqiagvik, the ground itself is the foundation.",
 "Roads, runways, the pipes under town, all of it rests on frozen soil. And that soil is warming.",
 "So a team at Penn State built the road a twin.",
 "Two fiber optic cables, about a kilometer each, are buried in the embankment.",
 "They feel the heat and the tremor in the ground, every hour.",
 "A physics model and machine learning turn those readings into a living copy of the earth below.",
 "As new data arrives, the twin corrects itself. It learns how fast heat moves through the soil, and it runs a step ahead.",
 "Forecasting the thaw before it reaches the road.",
 "Here is the honest part. The twin predicts the ground. It cannot freeze it back.",
 "And it is proven at one embankment, on about three years of data, not across the whole Arctic.",
 "Still, a road that can see its own thaw coming is a road you can save.",
 "That is the promise. Measured, and named. This is Alaska dot A I.",
]
env=dict(os.environ); env["SSL_CERT_FILE"]="/etc/ssl/certs/ca-certificates.crt"; env["SSL_CERT_DIR"]="/etc/ssl/certs"
def run(c): return subprocess.run(c,check=True,capture_output=True,text=True,env=env)
def dur(p): return float(run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",p]).stdout)
def load(p):
    w=p[:-4]+".wav"; run(["ffmpeg","-y","-i",p,"-ac","1","-ar",str(SR),"-f","wav",w]); sr,d=wavfile.read(w)
    return (d.astype(np.float32)/32768.0) if d.dtype==np.int16 else d.astype(np.float32)
def ts(s):
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
speech_end=t-GAP; print("speech_end",round(speech_end,2),"segs",len(SEG),"words",len(words))
buf=buf/(np.max(np.abs(buf))+1e-9)*(10**(-1.5/20))
wavfile.write(os.path.join(AUD,"vo60.wav"),SR,(np.stack([buf,buf],1)*32767).astype(np.int16))
json.dump({"starts":starts,"beats":beats,"durs":durs,"speech_end":round(speech_end,3),"total":TOTAL,"fps":FPS,
           "voice":VOICE,"engine":"edge_tts"},
          open(os.path.join(AUD,"timing60.json"),"w"),indent=2)
json.dump({"words":words,"speech_end":round(speech_end,3),"total":TOTAL,"fps":FPS},
          open(os.path.join(AUD,"words60.json"),"w"),indent=2)
print("wrote vo60.wav, timing60.json, words60.json  total speech", round(speech_end,2),"s")
