"""60s Dispatch mix: vo60 + underwater ambient + distant whale + sonar + ducked music,
two-pass loudnorm -14 LUFS / -1.5 dBTP, with the audio GATE."""
import os, subprocess, json, re, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
HERE=os.path.dirname(os.path.abspath(__file__)); AUD=os.path.join(HERE,"audio"); SR=44100
env=dict(os.environ); env["SSL_CERT_FILE"]="/etc/ssl/certs/ca-certificates.crt"; env["SSL_CERT_DIR"]="/etc/ssl/certs"
def run(c): return subprocess.run(c,capture_output=True,text=True,env=env)
def t(d): return np.linspace(0,d,int(SR*d),endpoint=False)
def lp(x,fc,o=4): return sosfilt(butter(o,fc/(SR/2),'low',output='sos'),x)
def bp(x,a,b,o=4): return sosfilt(butter(o,[a/(SR/2),b/(SR/2)],'band',output='sos'),x)
def nrm(x,p=.85): x=x/(np.max(np.abs(x))+1e-9); return (x*p*32767).astype(np.int16)
rng=np.random.default_rng(7)
# ambient 60s
tt=t(60.0); amb=lp(rng.standard_normal(len(tt)),340)*(.6+.4*np.sin(2*np.pi*.07*tt))+.22*lp(rng.standard_normal(len(tt)),780)
for _ in range(12):
    st=rng.uniform(0,57);dur=rng.uniform(.04,.09);n=int(dur*SR);tb=np.linspace(0,dur,n);ff=400+800*tb/dur
    amb[int(st*SR):int(st*SR)+n]+=lp(np.sin(2*np.pi*np.cumsum(ff)/SR)*np.exp(-tb/(dur*.4)),1500)*.25
wavfile.write(os.path.join(AUD,"amb60.wav"),SR,nrm(amb,.8))
# whale call 5s
tw_=t(5.0);fw=230-50*(tw_/5);call=np.sin(2*np.pi*np.cumsum(fw)/SR)+.5*np.sin(2*2*np.pi*np.cumsum(fw)/SR)+.25*np.sin(3*2*np.pi*np.cumsum(fw)/SR)
call=.6*call+.8*bp(call,300,700);envc=np.minimum(np.clip(tw_/.6,0,1),np.clip((5-tw_)/1.5,0,1))
wavfile.write(os.path.join(AUD,"whale60.wav"),SR,nrm(lp(call*envc,1800),.8))
# sonar 3s
tp=t(3.0);fp=900+120*np.exp(-tp/.03);ping=np.tanh(1.5*np.sin(2*np.pi*np.cumsum(fp)/SR))*np.exp(-tp/.5)
wavfile.write(os.path.join(AUD,"sonar60.wav"),SR,nrm(lp(ping,4000),.8))
# music: 60s window of Echoes (start 20s) with fades
sr,x=wavfile.read(os.path.join(AUD if os.path.exists(os.path.join(AUD,"..","music","188_44.wav")) else AUD,"..","music","188_44.wav")) if False else (None,None)
sr,x=wavfile.read(os.path.join(HERE,"music","188_44.wav"));X=x.astype(np.float32)/32768.
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
# premix
graph=("[0:a]highpass=f=85,acompressor=threshold=-20dB:ratio=3.5:attack=8:release=120,equalizer=f=3400:t=q:w=2:g=2.5,equalizer=f=6800:t=q:w=2.2:g=-3[vo];"
 "[vo]asplit=2[vout][key];[1:a]highpass=f=100,equalizer=f=2500:t=q:w=1.3:g=-3.5[mus];[mus][key]sidechaincompress=threshold=0.03:ratio=8:attack=25:release=450[md];"
 "[2:a]volume=-25dB,lowpass=f=2000[amb];[3:a]adelay=6500|6500,volume=-23dB,lowpass=f=1800[wh];[4:a]adelay=30500|30500,volume=-17dB[sn];"
 "[vout][md][amb][wh][sn]amix=inputs=5:duration=first:normalize=0[mix]")
r=run(["ffmpeg","-y","-i",os.path.join(AUD,"vo60.wav"),"-i",os.path.join(AUD,"bed60.wav"),"-i",os.path.join(AUD,"amb60.wav"),
       "-i",os.path.join(AUD,"whale60.wav"),"-i",os.path.join(AUD,"sonar60.wav"),"-filter_complex",graph,"-map","[mix]",os.path.join(AUD,"mix60.wav")])
if r.returncode: print("PREMIX FAIL",r.stderr[-600:]);sys.exit(1)
run(["ffmpeg","-y","-i",os.path.join(AUD,"mix60.wav"),"-af","loudnorm=I=-14:TP=-1.5:LRA=8","-ar","44100",os.path.join(AUD,"master60.wav")])
def rms(a,b):
    r=run(["ffmpeg","-ss",str(a),"-to",str(b),"-i",os.path.join(AUD,"master60.wav"),"-af","astats","-f","null","-"]);mm=re.findall(r"RMS level dB:\s*(-?[\d.]+)",r.stderr);return float(mm[0]) if mm else -120
r=run(["ffmpeg","-i",os.path.join(AUD,"master60.wav"),"-af","ebur128=peak=true","-f","null","-"]);I=re.findall(r"I:\s*(-?[\d.]+)\s*LUFS",r.stderr);TP=re.findall(r"Peak:\s*(-?[\d.]+)\s*dBFS",r.stderr)
tail=rms(55.6,57.5);mid=rms(40,42)
print(f"GATE: I={I[-1] if I else '?'} LUFS TP={TP[-1] if TP else '?'} dBFS | tail={tail:.1f}dB (>-34) mid-voice={mid:.1f}dB")
print("PASS" if (tail>-34 and I and -15.5<float(I[-1])<-12.5) else "CHECK")
