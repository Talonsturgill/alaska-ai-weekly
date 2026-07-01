"""60s Dispatch mix: vo60 + open-ocean/engine ambient + engine-swell + data-chirp + ducked music,
two-pass loudnorm -14 LUFS / -1.5 dBTP, with the audio GATE. Adapted from audio_v3.py's structure
for THE DEPTH CHART (2026-07-01): the whale/sonar layers become an engine-hum swell (the boat working
the net, timed to the SEASON CLOSED tally climb) and a bright data-chirp (the pings assembling)."""
import os, subprocess, json, re, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
HERE=os.path.dirname(os.path.abspath(__file__)); AUD=os.path.join(HERE,"audio"); SR=44100
env=dict(os.environ); env["SSL_CERT_FILE"]="/root/.ccr/ca-bundle.crt"; env["SSL_CERT_DIR"]="/root/.ccr"
def run(c): return subprocess.run(c,capture_output=True,text=True,env=env)
def t(d): return np.linspace(0,d,int(SR*d),endpoint=False)
def lp(x,fc,o=4): return sosfilt(butter(o,fc/(SR/2),'low',output='sos'),x)
def bp(x,a,b,o=4): return sosfilt(butter(o,[a/(SR/2),b/(SR/2)],'band',output='sos'),x)
def nrm(x,p=.85): x=x/(np.max(np.abs(x))+1e-9); return (x*p*32767).astype(np.int16)
rng=np.random.default_rng(19)
# ambient 60s: open-ocean swell + a low boat-engine drone under it
tt=t(60.0); amb=lp(rng.standard_normal(len(tt)),300)*(.55+.35*np.sin(2*np.pi*.05*tt))+.18*lp(rng.standard_normal(len(tt)),700)
engine_drone=lp(np.sin(2*np.pi*46*tt)+.4*np.sin(2*np.pi*92*tt),260)*.10
amb=amb+engine_drone
for _ in range(8):
    st=rng.uniform(0,57);dur=rng.uniform(.05,.11);n=int(dur*SR);tb=np.linspace(0,dur,n)
    amb[int(st*SR):int(st*SR)+n]+=lp(rng.standard_normal(n)*np.exp(-tb/(dur*.5)),900)*.18
wavfile.write(os.path.join(AUD,"amb60.wav"),SR,nrm(amb,.8))
# engine-swell 5s (the boat working the net, timed under the SEASON CLOSED tally climb) — replaces whale
tw_=t(5.0);fw=52+10*(tw_/5);call=np.sin(2*np.pi*np.cumsum(fw)/SR)+.5*np.sin(2*2*np.pi*np.cumsum(fw)/SR)+.25*np.sin(3*2*np.pi*np.cumsum(fw)/SR)
call=.7*call+.4*bp(call,60,220);envc=np.minimum(np.clip(tw_/.9,0,1),np.clip((5-tw_)/1.6,0,1))
wavfile.write(os.path.join(AUD,"whale60.wav"),SR,nrm(lp(call*envc,380),.8))
# data-chirp 3s (bright, the pings assembling into a field) — replaces sonar ping, higher + cleaner
tp=t(3.0);fp=2200+900*np.exp(-tp/.03);ping=np.tanh(1.3*np.sin(2*np.pi*np.cumsum(fp)/SR))*np.exp(-tp/.22)
ping+=0.5*np.exp(-tp/.12)*np.sin(2*np.pi*np.cumsum(3400+np.zeros_like(tp))/SR)*(tp<0.04)
wavfile.write(os.path.join(AUD,"sonar60.wav"),SR,nrm(lp(ping,6200),.8))
# music bed: prefer a freshly-sourced track (DISPATCH_MUSIC, via scripts/get_music.py), else the
# legacy asset, else a synthesized fallback so the mix NEVER hard-blocks on a missing file.
def _loadwav(p):
    _,d=wavfile.read(p); a=(d.astype(np.float32)/32768.) if d.dtype==np.int16 else d.astype(np.float32)
    return a if a.ndim>1 else np.stack([a,a],1)
def _synth_bed(d=80.0):
    n=int(d*SR); tt2=t(d); base=55.0; sig=np.zeros(n,np.float32)
    for k,r in enumerate([1.0,1.5,2.0,2.997,4.0]):
        vib=1+0.003*np.sin(2*np.pi*0.06*tt2+k)
        sig+=(0.55/(k+1))*np.sin(2*np.pi*base*r*np.cumsum(vib)/SR).astype(np.float32)
    swell=(0.45+0.55*np.sin(2*np.pi*0.018*tt2-1.2)).astype(np.float32)
    sig=lp(sig*swell,560).astype(np.float32)+0.12*lp(rng.standard_normal(n).astype(np.float32),180)*swell
    return np.stack([s:=sig/(np.max(np.abs(sig))+1e-9)*0.6, s],1).astype(np.float32)
_mp=os.environ.get("DISPATCH_MUSIC"); _legacy=os.path.join(HERE,"music","188_44.wav")
if _mp and os.path.exists(_mp): X=_loadwav(_mp); print("music: sourced ->",_mp)
elif os.path.exists(_legacy): X=_loadwav(_legacy); print("music: legacy asset")
else: X=_synth_bed(); print("music: SYNTH fallback (no track sourced; note it in the draft)")
_msrc=("sourced" if (_mp and os.path.exists(_mp)) else ("legacy" if os.path.exists(_legacy) else "synth"))
_mstat={"source":_msrc,"path":_mp or _legacy or ""}
try:
    _cf=os.path.join(os.path.dirname(_mp),"music_credit.json") if _mp else ""
    if _cf and os.path.exists(_cf): _mstat["credit"]=json.load(open(_cf)).get("credit","")
except Exception: pass
json.dump(_mstat,open(os.path.join(AUD,"music_status.json"),"w"))
mono=X.mean(1) if X.ndim>1 else X; hop=int(SR*0.2)
envv=np.array([np.sqrt(np.mean(mono[i:i+hop]**2)) for i in range(0,len(mono)-int(60*SR),hop)])
wl=int(60/0.2); best=None
for s_ in range(0,max(1,len(envv)-wl),3):
    m_=envv[s_:s_+wl].mean()
    if best is None or m_<best[0]: best=(m_,s_*0.2)
w0=best[1] if best else 0.0; print("music window start",round(w0,1)); seg=X[int(w0*SR):int(w0*SR)+int(60*SR)].copy()
if len(seg)<int(60*SR): seg=np.pad(seg,((0,int(60*SR)-len(seg)),(0,0)))
fi=int(.6*SR);fo=int(2.0*SR);seg[:fi]*=np.linspace(0,1,fi)[:,None];seg[-fo:]*=np.linspace(1,0,fo)[:,None]
wavfile.write(os.path.join(AUD,"bed60raw.wav"),SR,(seg*32767).astype(np.int16))
run(["ffmpeg","-y","-i",os.path.join(AUD,"bed60raw.wav"),"-af","loudnorm=I=-23:TP=-5:LRA=11","-ar","44100",os.path.join(AUD,"bed60.wav")])
# premix: engine-swell (whale slot) placed under the SEASON CLOSED tally climb (~8s in);
# data-chirp (sonar slot) placed under the ping-assembly beat (~17s in)
graph=("[0:a]highpass=f=85,acompressor=threshold=-20dB:ratio=3.5:attack=8:release=120,equalizer=f=3400:t=q:w=2:g=2.5,equalizer=f=6800:t=q:w=2.2:g=-3[vo];"
 "[vo]asplit=2[vout][key];[1:a]highpass=f=100,equalizer=f=2500:t=q:w=1.3:g=-3.5[mus];[mus][key]sidechaincompress=threshold=0.03:ratio=8:attack=25:release=450[md];"
 "[2:a]volume=-25dB,lowpass=f=2000[amb];[3:a]adelay=8000|8000,volume=-20dB,lowpass=f=800[wh];[4:a]adelay=17000|17000,volume=-16dB[sn];"
 "[vout][md][amb][wh][sn]amix=inputs=5:duration=first:normalize=0[mix]")
r=run(["ffmpeg","-y","-i",os.path.join(AUD,"vo60.wav"),"-i",os.path.join(AUD,"bed60.wav"),"-i",os.path.join(AUD,"amb60.wav"),
       "-i",os.path.join(AUD,"whale60.wav"),"-i",os.path.join(AUD,"sonar60.wav"),"-filter_complex",graph,"-map","[mix]",os.path.join(AUD,"mix60.wav")])
if r.returncode: print("PREMIX FAIL",r.stderr[-600:]);sys.exit(1)
run(["ffmpeg","-y","-i",os.path.join(AUD,"mix60.wav"),"-af","loudnorm=I=-14:TP=-1.5:LRA=8","-ar","44100",os.path.join(AUD,"master60.wav")])
def rms(a,b):
    r=run(["ffmpeg","-ss",str(a),"-to",str(b),"-i",os.path.join(AUD,"master60.wav"),"-af","astats","-f","null","-"]);mm=re.findall(r"RMS level dB:\s*(-?[\d.]+)",r.stderr);return float(mm[0]) if mm else -120
r=run(["ffmpeg","-i",os.path.join(AUD,"master60.wav"),"-af","ebur128=peak=true","-f","null","-"]);I=re.findall(r"I:\s*(-?[\d.]+)\s*LUFS",r.stderr);TP=re.findall(r"Peak:\s*(-?[\d.]+)\s*dBFS",r.stderr)
tail=rms(56.2,58.5);mid=rms(40,42)
print(f"GATE: I={I[-1] if I else '?'} LUFS TP={TP[-1] if TP else '?'} dBFS | tail={tail:.1f}dB (>-34) mid-voice={mid:.1f}dB")
print("PASS" if (tail>-34 and I and -15.5<float(I[-1])<-12.5) else "CHECK")
