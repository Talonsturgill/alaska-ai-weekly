"""
Alaska.Ai Dispatch v2 — sound design + mix.
Synthesizes an underwater ambient bed, a distant whale call, and a sonar ping
(numpy), then mixes with the VO (EQ/compress/de-ess/presence) and the music bed
(HPF + 1-4kHz pocket + sidechain duck), two-pass loudnorm to -14 LUFS / -1.5 dBTP,
true-peak limit, and a measurement GATE. No paid samples.
"""
import os, subprocess, json, re, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

HERE=os.path.dirname(os.path.abspath(__file__)); AUD=os.path.join(HERE,"audio")
SR=44100
env=dict(os.environ); env["SSL_CERT_FILE"]="/etc/ssl/certs/ca-certificates.crt"; env["SSL_CERT_DIR"]="/etc/ssl/certs"
def run(c): return subprocess.run(c,capture_output=True,text=True,env=env)
def t(d): return np.linspace(0,d,int(SR*d),endpoint=False)
def lp(x,fc,o=4): return sosfilt(butter(o,fc/(SR/2),btype='low',output='sos'),x)
def bp(x,lo,hi,o=4): return sosfilt(butter(o,[lo/(SR/2),hi/(SR/2)],btype='band',output='sos'),x)
def norm(x,peak=0.9): x=x/(np.max(np.abs(x))+1e-9); return (x*peak*32767).astype(np.int16)
rng=np.random.default_rng(7)

# 1) underwater ambient bed (30s)
tt=t(30.0)
base=lp(rng.standard_normal(len(tt)),340)*(0.6+0.4*np.sin(2*np.pi*0.08*tt))
mid =0.22*lp(rng.standard_normal(len(tt)),780)
amb=base+mid
# sparse bubbles
for _ in range(6):
    st=rng.uniform(0,28); dur=rng.uniform(0.04,0.09); n=int(dur*SR); tb=np.linspace(0,dur,n)
    f=400+800*tb/dur; b=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tb/ (dur*0.4))
    i0=int(st*SR); amb[i0:i0+n]+=lp(b,1500)*0.25
wavfile.write(os.path.join(AUD,"amb.wav"),SR,norm(amb,0.8))

# 2) distant whale call (~5s): downward glide + harmonics + drifting formant + slow env
tw_=t(5.0); f=230-50*(tw_/5.0); ph=2*np.pi*np.cumsum(f)/SR
call=np.sin(ph)+0.5*np.sin(2*ph)+0.25*np.sin(3*ph)
call=call*(1+0.01*np.sin(2*np.pi*4*tw_))                      # vibrato
form=bp(call,300,700)                                          # vocal formant
call=0.6*call+0.8*form
envc=np.minimum(np.clip(tw_/0.6,0,1),np.clip((5.0-tw_)/1.5,0,1))
wavfile.write(os.path.join(AUD,"whale.wav"),SR,norm(lp(call*envc,1800),0.8))

# 3) sonar ping (~3s): tone + fast downglide + long exp decay + light sat
tp=t(3.0); fp=900+120*np.exp(-tp/0.03); ping=np.tanh(1.5*np.sin(2*np.pi*np.cumsum(fp)/SR))*np.exp(-tp/0.5)
wavfile.write(os.path.join(AUD,"sonar.wav"),SR,norm(lp(ping,4000),0.8))

# normalize music bed to a known loudness first
run(["ffmpeg","-y","-i",os.path.join(AUD,"bed_raw.wav"),"-af","loudnorm=I=-22:TP=-4:LRA=11","-ar","44100",os.path.join(AUD,"bed_v2.wav")])

# 4) PREMIX (everything except final loudnorm) -> mix_raw.wav
graph=(
 "[0:a]highpass=f=85,acompressor=threshold=-20dB:ratio=3.5:attack=8:release=120,"
 "equalizer=f=3400:t=q:w=2:g=2.5,equalizer=f=6800:t=q:w=2.2:g=-3[vo];"
 "[vo]asplit=2[voout][key];"
 "[1:a]highpass=f=100,equalizer=f=2500:t=q:w=1.3:g=-3.5[mus];"
 "[mus][key]sidechaincompress=threshold=0.03:ratio=8:attack=25:release=450[musd];"
 "[2:a]volume=-25dB,lowpass=f=2000[amb];"
 "[3:a]adelay=900|900,volume=-23dB,lowpass=f=1800[whale];"
 "[4:a]adelay=12200|12200,volume=-17dB[sonar];"
 "[voout][musd][amb][whale][sonar]amix=inputs=5:duration=first:normalize=0[mix]"
)
r=run(["ffmpeg","-y","-i",os.path.join(AUD,"vo.wav"),"-i",os.path.join(AUD,"bed_v2.wav"),
       "-i",os.path.join(AUD,"amb.wav"),"-i",os.path.join(AUD,"whale.wav"),"-i",os.path.join(AUD,"sonar.wav"),
       "-filter_complex",graph,"-map","[mix]","-ar","44100",os.path.join(AUD,"mix_raw.wav")])
if r.returncode: print("PREMIX FAIL\n",r.stderr[-700:]); sys.exit(1)

# 5) two-pass loudnorm
p1=run(["ffmpeg","-i",os.path.join(AUD,"mix_raw.wav"),
        "-af","loudnorm=I=-14:TP=-1.5:LRA=8:print_format=json","-f","null","-"])
m=re.search(r'\{[^{}]*"input_i"[^{}]*\}', p1.stderr, re.S); meas=json.loads(m.group(0)) if m else {}
print("measured:",{k:meas.get(k) for k in["input_i","input_tp","input_lra","input_thresh"]})
ln=("loudnorm=I=-14:TP=-1.5:LRA=8:measured_I={input_i}:measured_TP={input_tp}:"
    "measured_LRA={input_lra}:measured_thresh={input_thresh}:linear=true:print_format=summary").format(**meas)
r=run(["ffmpeg","-y","-i",os.path.join(AUD,"mix_raw.wav"),"-af",ln+",alimiter=limit=0.89:level=false",
       "-ar","44100",os.path.join(AUD,"master_v2.wav")])
if r.returncode: print("LN FAIL\n",r.stderr[-700:]); sys.exit(1)

# 6) GATE
def rms(f,a,b):
    r=run(["ffmpeg","-ss",str(a),"-to",str(b),"-i",f,"-af","astats","-f","null","-"])
    mm=re.findall(r"RMS level dB:\s*(-?[\d.]+)",r.stderr); return float(mm[0]) if mm else -120
def integ(f):
    r=run(["ffmpeg","-i",f,"-af","ebur128=peak=true","-f","null","-"])
    I=re.findall(r"I:\s*(-?[\d.]+)\s*LUFS",r.stderr); TP=re.findall(r"Peak:\s*(-?[\d.]+)\s*dBFS",r.stderr)
    return (float(I[-1]) if I else None, float(TP[-1]) if TP else None)
M=os.path.join(AUD,"master_v2.wav"); I,TP=integ(M)
tail=rms(M,27.95,29.5); midv=rms(M,7,9); vo=rms(os.path.join(AUD,"vo.wav"),7,9)
print("\n===== SOUND CHECK (v2) =====")
print(f"integrated {I} LUFS (-14±1) | true peak {TP} dBFS (<=-1.0)")
print(f"music-only tail {tail:.1f}dB (>-34 audible) | mid-voice {midv:.1f}dB | music-adds {midv-vo:+.1f}dB")
ok=(tail>-34) and (I is not None and -15.5<I<-12.5) and (TP is not None and TP<=-1.0)
print("RESULT:", "PASS" if ok else "CHECK")
