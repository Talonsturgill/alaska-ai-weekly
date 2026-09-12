#!/usr/bin/env python3
"""Sample entry, middle and busy late frame for every scene from actual video bytes."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from PIL import Image,ImageDraw
p=argparse.ArgumentParser();p.add_argument('--video',required=True);p.add_argument('--props',required=True);p.add_argument('--out',required=True);a=p.parse_args()
out=Path(a.out);out.mkdir(parents=True,exist_ok=True);props=json.loads(Path(a.props).read_text());samples=[]
for i,s in enumerate(props['scenes']):
 for j,frac in enumerate([.12,.55,.9]):
  t=(s['from']+s['dur']*frac)/30;f=out/f'S{i+1:02d}_{j}.png'
  subprocess.run(['ffmpeg','-y','-ss',str(t),'-i',a.video,'-frames:v','1',str(f),'-v','error'],check=True)
  samples.append({'scene':i+1,'frame':round(t*30),'time':t,'path':str(f)})
for start in range(0,len(props['scenes']),4):
 sheet=Image.new('RGB',(810,2000),(31,25,43));d=ImageDraw.Draw(sheet)
 for k in range(12):
  idx=start*3+k
  if idx>=len(samples):break
  row=samples[idx];im=Image.open(row['path']).resize((270,480));x=(k%3)*270;y=(k//3)*500;sheet.paste(im,(x,y));d.text((x+8,y+481),f"S{row['scene']:02d} {row['time']:.2f}s",fill='white')
 sheet.save(out/f'sheet_{start//4}.jpg',quality=94)
(out/'receipt.json').write_text(json.dumps({'video':a.video,'sha256':hashlib.sha256(Path(a.video).read_bytes()).hexdigest(),'props':a.props,'samples':samples},indent=2)+'\n')
print(f'Wrote {len(samples)} actual rendered scene frames and contact sheets to {out}')
