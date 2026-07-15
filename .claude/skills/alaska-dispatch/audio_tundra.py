"""Audio mix for Dispatch 'The Claim on the Tundra' — cloned VO (talon) + sourced music
(Long Note Two, Kevin MacLeod, ducked) + cold North Slope tundra ambient + motivated SFX
placed at the (compressed 60s) beat times, two-pass loudnorm -14 LUFS / -1.0 dBTP, audio gate.
Emits audio/sfx_events.json (>=8 events, >=1 per shot) + music_status.json. Sourced music only.
Run under system python (no chatterbox needed):  python audio_tundra.py
"""
import os, subprocess, json, re, sys, shutil
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
HERE=os.path.dirname(os.path.abspath(__file__))
REPO=os.path.abspath(os.path.join(HERE,"..","..",".."))
AUD=os.path.join(REPO,"out","dispatch","audio"); os.makedirs(AUD,exist_ok=True)
SB=os.path.join(REPO,"out","dispatch","storyboard.json")
def write_sfx_events(events, path):
    os.makedirs(os.path.dirname(path),exist_ok=True)
    ev=[{"t":round(float(e["t"]),3),"kind":e.get("kind","hit"),"label":e.get("label","")} for e in events]
    json.dump({"events":ev,"n":len(ev)},open(path,"w"),indent=2); return path
SR=44100; TOTAL=60.0; N=int(TOTAL*SR)
env=dict(os.environ); env["SSL_CERT_FILE"]="/etc/ssl/certs/ca-certificates.crt"; env["SSL_CERT_DIR"]="/etc/ssl/certs"
def run(c): return subprocess.run(c,capture_output=True,text=True,env=env)
def t(d): return np.linspace(0,d,int(SR*d),endpoint=False)
def lp(x,fc,o=4): return sosfilt(butter(o,fc/(SR/2),'low',output='sos'),x)
def bp(x,a,b,o=4): return sosfilt(butter(o,[a/(SR/2),b/(SR/2)],'band',output='sos'),x)
def nrm(x,p=.9): x=x/(np.max(np.abs(x))+1e-9); return (x*p*32767).astype(np.int16)
rng=np.random.default_rng(17)

# ---- SFX one-shots (float32 mono) ----
def sfx_whoosh(d=0.5): tt=t(d); e=np.sin(np.pi*np.clip(tt/d,0,1))**1.4; return (bp(rng.standard_normal(len(tt)),220,2200)*e*0.9).astype(np.float32)
def sfx_boom(d=0.7): tt=t(d); f=74-30*tt/d; return (np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt/(d*.35))*0.95).astype(np.float32)
def sfx_hit(d=0.2): tt=t(d); return ((.6*np.sin(2*np.pi*120*tt)+bp(rng.standard_normal(len(tt)),300,3000))*np.exp(-tt/(d*.3))).astype(np.float32)
def sfx_tick(d=0.05): tt=t(d); return (bp(rng.standard_normal(len(tt)),2200,6500)*np.exp(-tt/(d*.3))*0.8).astype(np.float32)
def sfx_riser(d=0.7,up=True):
    tt=t(d); f=(380+900*tt/d) if up else (1300-900*tt/d); e=np.clip(tt/(d*.2),0,1)*np.clip((d-tt)/(d*.3),0,1)
    return (np.tanh(1.3*np.sin(2*np.pi*np.cumsum(f)/SR))*e*0.7).astype(np.float32)
def sfx_pulse(d=0.35): tt=t(d); return (np.sin(2*np.pi*1300*tt)*np.exp(-tt/(d*.3))*0.7).astype(np.float32)
def sfx_lock(d=0.3):
    tt=t(d); s=np.zeros(len(tt),np.float32)
    for k in (0.0,0.06,0.12):
        i=int(k*SR); s[i:i+400]+=bp(rng.standard_normal(400),900,3500)*np.exp(-np.linspace(0,1,400)*6)
    s+=0.7*np.sin(2*np.pi*88*tt)*np.exp(-tt/(d*.25)); return (s*0.8).astype(np.float32)
def sfx_pop(d=0.12): tt=t(d); return (bp(rng.standard_normal(len(tt)),500,2600)*np.exp(-tt/(d*.3))*0.7).astype(np.float32)
MAKERS={"whoosh":sfx_whoosh,"boom":sfx_boom,"hit":sfx_hit,"tick":sfx_tick,"riser":sfx_riser,
        "pulse":sfx_pulse,"lock":sfx_lock,"pop":sfx_pop,"ambient":lambda:np.zeros(1,np.float32)}
GAIN={"whoosh":.55,"boom":.85,"hit":.6,"tick":.6,"riser":.5,"pulse":.6,"lock":.75,"pop":.55}

# ---- read the compressed 60s beat schedule + audio_arc from the storyboard ----
sb=json.load(open(SB)); beats=sb["beats"]; aa=sb.get("audio_arc",{})
silence_at=float(aa.get("silence_at",52.0)); riser_at=float(aa.get("riser_at",18.0))
# build motivated SFX events: one per beat that carries a non-ambient sfx (>=1 per shot)
button_start=float(beats[-1]["t"])
EVENTS=[]
for b in beats:
    k=b.get("sfx","ambient")
    if k=="ambient" or k not in MAKERS: continue
    tt0=float(b["t"])
    # keep only the pre-payoff BREATH clean (events before the button that land in the dip)
    if tt0<button_start-0.05 and abs(tt0-silence_at)<0.4: continue
    EVENTS.append((round(tt0,3),k,b.get("means","")[:48]))
EVENTS=sorted(EVENTS)

# ---- SFX bus ----
sfxbus=np.zeros(N,np.float32)
for (tt0,mk,lab) in EVENTS:
    s=MAKERS[mk](); i=int(tt0*SR); e=min(i+len(s),N); sfxbus[i:e]+=s[:e-i]*GAIN.get(mk,.5)
wavfile.write(os.path.join(AUD,"sfxbus60.wav"),SR,nrm(sfxbus,.85))

# ---- ambient: cold North Slope wind (sparse, sober) + occasional flag-tape flutter ----
tt=t(TOTAL)
wind=lp(rng.standard_normal(N),260)*(0.5+0.5*np.sin(2*np.pi*0.045*tt-0.6))
wind+=0.3*lp(rng.standard_normal(N),90)          # low sub-bass drone under the land
flutter=np.zeros(N,np.float32)
for _ in range(22):
    st=rng.uniform(0,59); n=int(rng.uniform(.05,.14)*SR); i=int(st*SR)
    flutter[i:i+n]+=bp(rng.standard_normal(n),700,2600)*np.exp(-np.linspace(0,1,n)*4)*rng.uniform(.15,.4)
amb=wind*0.8+flutter*0.4
wavfile.write(os.path.join(AUD,"amb60.wav"),SR,nrm(amb,.8))

# ---- music (sourced only): Long Note Two, ducked; dip the bed at the pre-payoff silence ----
def _loadwav(p):
    _,d=wavfile.read(p); a=(d.astype(np.float32)/32768.) if d.dtype==np.int16 else d.astype(np.float32)
    return a if a.ndim>1 else np.stack([a,a],1)
_mp=os.environ.get("DISPATCH_MUSIC") or os.path.join(REPO,"out","dispatch","music_bed.wav")
if not os.path.exists(_mp): print("NO MUSIC BED at",_mp); sys.exit(2)
X=_loadwav(_mp)
_mstat={"source":"sourced","path":_mp}
_cf=os.path.join(os.path.dirname(_mp),"music_credit.json")
if os.path.exists(_cf):
    _cr=json.load(open(_cf)); _mstat["credit"]=_cr.get("credit","")
    shutil.copy(_cf,os.path.join(AUD,"music_credit.json"))
json.dump(_mstat,open(os.path.join(AUD,"music_status.json"),"w"),indent=2)
# quietest 60s window then fade
mono=X.mean(1); hop=int(SR*0.2)
envv=np.array([np.sqrt(np.mean(mono[i:i+hop]**2)) for i in range(0,max(1,len(mono)-int(60*SR)),hop)])
wl=int(60/0.2); best=None
for s_ in range(0,max(1,len(envv)-wl),3):
    m_=envv[s_:s_+wl].mean()
    if best is None or m_<best[0]: best=(m_,s_*0.2)
w0=best[1] if best else 0.0
seg=X[int(w0*SR):int(w0*SR)+int(60*SR)].copy()
if len(seg)<int(60*SR): seg=np.pad(seg,((0,int(60*SR)-len(seg)),(0,0)))
fi=int(.8*SR); fo=int(2.6*SR); seg[:fi]*=np.linspace(0,1,fi)[:,None]; seg[-fo:]*=np.linspace(1,0,fo)[:,None]
# pre-payoff breath: notch the bed (and ambient) down to ~0.12x for ~0.9s at silence_at
def dip(arr,center,width=0.9,floor=0.12):
    tv=np.arange(len(arr))/SR; g=1-(1-floor)*np.exp(-((tv-center)**2)/(2*(width/2.2)**2))
    return (arr*g[:,None]) if arr.ndim>1 else (arr*g)
seg=dip(seg,silence_at)
wavfile.write(os.path.join(AUD,"bed60raw.wav"),SR,(seg*32767).astype(np.int16))
run(["ffmpeg","-y","-i",os.path.join(AUD,"bed60raw.wav"),"-af","loudnorm=I=-24:TP=-6:LRA=11","-ar","44100",os.path.join(AUD,"bed60.wav")])
# dip ambient too at the breath
amb_d=dip(amb.astype(np.float32),silence_at); wavfile.write(os.path.join(AUD,"amb60.wav"),SR,nrm(amb_d,.8))

# ---- pre-payoff BREATH: the cloned VO is gapless (no pause >0.12s anywhere), so ducking only the
# bed/music can never make the MASTER dip (VO dominates). Carve a REAL silent beat before the button
# line by inserting VO_PAD s of silence at the button boundary and shifting the caption word-timings
# to match, so the master genuinely drops >=6 dB at silence_at (bed+amb are ducked there too).
# Idempotent: always rebuilt from a one-time snapshot of the original VO / words.
VO_SPLIT=54.70; VO_PAD=0.75      # gap 54.70..55.45  ->  silence_at 55.05
def _snap(p,suf):
    o=p.replace(suf,"_orig"+suf)
    if not os.path.exists(o): shutil.copy(p,o)
    return o
vo_o=_snap(os.path.join(AUD,"vo60.wav"),".wav")
_vsr,_vw=wavfile.read(vo_o)
_pad=np.zeros((int(VO_PAD*_vsr),)+_vw.shape[1:],_vw.dtype)
_vg=np.concatenate([_vw[:int(VO_SPLIT*_vsr)],_pad,_vw[int(VO_SPLIT*_vsr):]],0)[:int(TOTAL*_vsr)]
wavfile.write(os.path.join(AUD,"vo60_gapped.wav"),_vsr,_vg)
wj_o=_snap(os.path.join(AUD,"words60.json"),".json"); WJ=json.load(open(wj_o))
for _w in WJ.get("words",[]):
    if _w.get("s",0)>=VO_SPLIT-1e-6:
        _w["s"]=round(_w["s"]+VO_PAD,3); _w["e"]=round(_w["e"]+VO_PAD,3)
WJ["speech_end"]=round(min(TOTAL,WJ.get("speech_end",0)+VO_PAD),3)
json.dump(WJ,open(os.path.join(AUD,"words60.json"),"w"),indent=2)
print(f"VO breath: inserted {VO_PAD}s silence at {VO_SPLIT}s; shifted button captions to match")

# ---- premix: VO (EQ+comp) + ducked music + ambient + SFX bus ----
graph=("[0:a]highpass=f=90,acompressor=threshold=-20dB:ratio=3.5:attack=8:release=120,"
       "equalizer=f=3200:t=q:w=2:g=2.5,equalizer=f=6800:t=q:w=2.2:g=-3[vo];"
       "[vo]asplit=2[vout][key];"
       "[1:a]highpass=f=110,equalizer=f=2500:t=q:w=1.3:g=-3.5[mus];"
       "[mus][key]sidechaincompress=threshold=0.03:ratio=9:attack=20:release=420[md];"
       "[2:a]volume=-23dB,lowpass=f=1800[amb];"
       "[3:a]volume=-4dB[sfx];"
       "[vout][md][amb][sfx]amix=inputs=4:duration=first:normalize=0[mix]")
r=run(["ffmpeg","-y","-i",os.path.join(AUD,"vo60_gapped.wav"),"-i",os.path.join(AUD,"bed60.wav"),
       "-i",os.path.join(AUD,"amb60.wav"),"-i",os.path.join(AUD,"sfxbus60.wav"),
       "-filter_complex",graph,"-map","[mix]",os.path.join(AUD,"mix60.wav")])
if r.returncode: print("PREMIX FAIL",r.stderr[-800:]); sys.exit(1)
run(["ffmpeg","-y","-i",os.path.join(AUD,"mix60.wav"),"-af","loudnorm=I=-14:TP=-1.0:LRA=8","-ar","44100",os.path.join(AUD,"master60.wav")])

# ---- emit sfx events + measure gate ----
write_sfx_events([{"t":e[0],"kind":e[1],"label":e[2]} for e in EVENTS],
                 os.path.join(AUD,"sfx_events.json"))
def rms(a,b):
    r=run(["ffmpeg","-ss",str(a),"-to",str(b),"-i",os.path.join(AUD,"master60.wav"),"-af","astats","-f","null","-"])
    mm=re.findall(r"RMS level dB:\s*(-?[\d.]+)",r.stderr); return float(mm[0]) if mm else -120
r=run(["ffmpeg","-i",os.path.join(AUD,"master60.wav"),"-af","ebur128=peak=true","-f","null","-"])
I=re.findall(r"I:\s*(-?[\d.]+)\s*LUFS",r.stderr); TP=re.findall(r"Peak:\s*(-?[\d.]+)\s*dBFS",r.stderr)
tail=rms(58.4,59.9); mid=rms(20,22)
din=rms(silence_at-0.35,silence_at+0.35); dnb=max(rms(silence_at-3,silence_at-0.6),rms(silence_at+0.6,silence_at+3))
ok=(tail>-40 and I and -15.5<float(I[-1])<-12.5 and TP and float(TP[-1])<=-0.9)
print(f"AUDIO GATE: I={I[-1] if I else '?'} LUFS  TP={TP[-1] if TP else '?'} dBFS  tail={tail:.1f}dB  mid-voice={mid:.1f}dB")
print(f"SILENCE_DIP: bed at {silence_at}s = {dnb-din:.1f} dB under neighborhood (need >=6)")
print(f"SFX events: {len(EVENTS)}  -> {'PASS' if ok else 'CHECK'}")
