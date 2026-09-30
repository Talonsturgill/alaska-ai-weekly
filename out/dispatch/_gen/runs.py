import json
sb=json.load(open('out/dispatch/storyboard.json'))
bs=sb['beats']
g=[round(bs[i+1]['at_s']-bs[i]['at_s'],2) for i in range(len(bs)-1)]
run=1; bad=[]
for i in range(1,len(g)):
    if abs(g[i]-g[i-1])<=0.4:
        run+=1
        if run>=3: bad.append((bs[i]['id'],bs[i]['vo_line'],bs[i]['offset'],g[i-2:i+1]))
    else: run=1
print("max gap",max(g),"runs",bad)
