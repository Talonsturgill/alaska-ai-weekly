"""60s Chinook depth-occupancy VO - 9 segments, edge-tts (Emma, clear/conversational female voice),
laid on a 60s timeline. ALSO captures real per-WORD timings (edge-tts --write-subtitles) so the
on-screen captions are word-synced to the actual voice. Writes:
  audio/vo60.wav        the 60s VO bed (stereo, -1.5 dBTP normalized)
  audio/timing60.json   segment starts/beats/durs/speech_end (audio mix + scene beats)
  audio/words60.json    global word list [{w,s,e,seg}] for kinetic captions
"""
import os, subprocess, json, re
import numpy as np
from scipy.io import wavfile
HERE=os.path.dirname(os.path.abspath(__file__)); AUD=os.path.join(HERE,"audio"); os.makedirs(AUD,exist_ok=True)
VOICE="en-US-EmmaMultilingualNeural"; RATE="+2%"; SR=44100; FPS=30; LEAD=0.40; GAP=0.18; TOTAL=60.0
SEG=[
 "Every summer, boats drag nets through Gulf of Alaska water, and somewhere below swims a Chinook they can't keep.",
 "Catch too many Chinook by accident and the season can shut down overnight.",
 "A University of Alaska Fairbanks team studied thirteen years of tagged Chinook, seven hundred thousand signals in all.",
 "They trained a model to turn those signals into one number, the odds a Chinook sits at a given depth and hour.",
 "The result reads like a living map. Cold spring water pulls Chinook shallow. A warm afternoon pushes them deep.",
 "A captain can read that map before the net ever leaves the deck.",
 "The honest limit: the model learned from the past. It cannot promise where one fish swims today.",
 "No boat has to use it. The call to drop the net still belongs to the person on deck.",
 "Thirteen years of pings taught a machine the odds. Reading them right is still up to a person.",
]
env=dict(os.environ); env["SSL_CERT_FILE"]="/root/.ccr/ca-bundle.crt"; env["SSL_CERT_DIR"]="/root/.ccr"
PROXY=os.environ.get("HTTPS_PROXY", os.environ.get("https_proxy", ""))
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
    run(["edge-tts","--voice",VOICE,f"--rate={RATE}","--text",t,"--write-media",mp3,"--write-subtitles",vtt,"--proxy",PROXY])
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
print("total words in VO:", sum(len(s.split()) for s in SEG))
