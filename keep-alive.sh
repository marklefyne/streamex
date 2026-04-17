#!/bin/bash
# keep-alive.sh — Ensures the Next.js dev server stays running
# Runs in a loop, restarting the server if it dies

PROJECT_DIR="/home/z/my-project"
LOG_FILE="/tmp/flux-dev.log"
MAX_RESTARTS=100
RESTART_COUNT=0

while [ $RESTART_COUNT -lt $MAX_RESTARTS ]; do
    # Check if server is already running
    if curl -s --connect-timeout 2 --max-time 5 "http://localhost:3000" > /dev/null 2>&1; then
        # Server is alive, wait and check again
        sleep 15
        continue
    fi

    # Server is down, restart it
    echo "[$(date '+%H:%M:%S')] Server down. Restarting... (attempt $((RESTART_COUNT+1))/$MAX_RESTARTS)"
    RESTART_COUNT=$((RESTART_COUNT + 1))

    # Kill any leftover processes
    pkill -f "next dev" 2>/dev/null
    pkill -f "node.*next" 2>/dev/null
    sleep 2

    # Start fresh
    cd "$PROJECT_DIR"
    nohup bun run dev > "$LOG_FILE" 2>&1 &
    NEW_PID=$!
    disown "$NEW_PID" 2>/dev/null || true

    # Wait for it to be ready
    for i in $(seq 1 20); do
        sleep 1
        if curl -s --connect-timeout 2 --max-time 5 "http://localhost:3000" > /dev/null 2>&1; then
            echo "[$(date '+%H:%M:%S')] Server is back up (PID: $NEW_PID)"
            break
        fi
    done

    # Reset restart count after successful start
    RESTART_COUNT=0
    sleep 10
done

echo "[$(date '+%H:%M:%S')] Max restarts reached. Exiting."
