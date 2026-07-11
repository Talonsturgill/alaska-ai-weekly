#!/usr/bin/env bash
cd /home/user/alaska-ai-weekly/.claude/skills/alaska-dispatch
HIGH=$(ls thelid_final/frame_*.png 2>/dev/null | sed -E 's/.*frame_0*([0-9]+)\.png/\1/' | sort -n | tail -1)
START=${HIGH:-0}
DIM_SCALE=1.0 DIM_OUT=thelid_final DISPATCH_TEXTLOG=1 nohup python render_thelid.py $START 1755 > /home/user/alaska-ai-weekly/out/dispatch/render_full.log 2>&1 &
echo $! > /tmp/render.pid
echo "resumed from frame $START, PID $(cat /tmp/render.pid)"
