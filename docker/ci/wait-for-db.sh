#!/bin/bash

# Script to wait for the database to be ready
# Usage: ./wait-for-db.sh [host] [port] [timeout]

set -e

HOST="${1:-db}"
PORT="${2:-5432}"
TIMEOUT="${3:-60}"

echo "Waiting for database at $HOST:$PORT to be ready (timeout: ${TIMEOUT}s)..."

start_time=$(date +%s)
end_time=$((start_time + TIMEOUT))

while [ $(date +%s) -lt $end_time ]; do
  if nc -z "$HOST" "$PORT" > /dev/null 2>&1; then
    echo "Database is ready!"
    exit 0
  fi
  echo "Database is not ready yet, waiting..."
  sleep 1
done

echo "Timed out waiting for database at $HOST:$PORT"
exit 1