#!/bin/sh

# Usage: ./wait-for-db.sh host port [timeout]
# Example: ./wait-for-db.sh db 5432 60

HOST="$1"
PORT="$2"
TIMEOUT="${3:-60}"

START_TIME=$(date +%s)

while :; do
  nc -z "$HOST" "$PORT" 2>/dev/null && echo "Database is up!" && exit 0
  NOW=$(date +%s)
  if [ $((NOW - START_TIME)) -ge "$TIMEOUT" ]; then
    echo "Timed out waiting for $HOST:$PORT after $TIMEOUT seconds" >&2
    exit 1
  fi
  echo "Waiting for $HOST:$PORT..."
  sleep 2
done 