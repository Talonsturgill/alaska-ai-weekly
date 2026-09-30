#!/usr/bin/env bash
# usage: stills.sh name:frame name:frame ...  (renders in parallel, 4 at a time)
cd /home/user/alaska-ai-weekly
run() { n="${1%%:*}"; fr="${1##*:}"; bash scripts/render.sh still "$fr" Dispatch0930 "out/dispatch/look/$n.png" --draft >/dev/null 2>&1 && echo "ok $n" || echo "FAIL $n"; }
export -f run
printf '%s\n' "$@" | xargs -P 4 -I{} bash -c 'run {}'
