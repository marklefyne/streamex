#!/usr/bin/env bash
# Flux Stream - permanent dev server with auto-restart
# Runs Next.js dev server and automatically restarts if it dies

cd /home/z/my-project

while true; do
  echo "[$(date '+%H:%M:%S')] Starting Flux Stream dev server..." >> /tmp/flux-keepalive.log
  npx next dev --port 3000 >> /tmp/next-dev.log 2>&1
  EXIT_CODE=$?
  echo "[$(date '+%H:%M:%S')] Server exited with code $EXIT_CODE, restarting in 2s..." >> /tmp/flux-keepalive.log
  sleep 2
done
