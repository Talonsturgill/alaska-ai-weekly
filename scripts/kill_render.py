#!/usr/bin/env python3
"""Kill a stuck render by scanning /proc, excluding this process and its parent. `pkill -f render_parallel` also matches the shell that runs it (exit 144, 2026-10-22)."""
import os,signal
me=os.getpid(); par=os.getppid()
keys=("render_parallel.sh","make_cut.sh","remotion","chrome-headless","chrome_crashpad","headless_shell")
for pid in os.listdir('/proc'):
    if not pid.isdigit() or int(pid) in (me,par): continue
    try:
        cmd=open(f'/proc/{pid}/cmdline','rb').read().replace(b'\0',b' ').decode()
    except Exception: continue
    if any(k in cmd for k in keys) and 'kill_render' not in cmd:
        try: os.kill(int(pid),signal.SIGKILL); print('killed',pid,cmd[:60])
        except Exception as e: pass
