#!/usr/bin/env bash
# Ensure .secrets/*.env exist (copy from *.env.example when missing).
# Real .env files live in this repo's .secrets/ folder and are gitignored.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/.secrets"
mkdir -p "$DEST"

files=(
  cloudflare.env
  stripe.env
  stripe-live.env
  google-calendar.env
  railway.env
  resend.env
)

for f in "${files[@]}"; do
  example="$DEST/${f}.example"
  envfile="$DEST/$f"

  if [[ -e "$envfile" && ! -L "$envfile" ]]; then
    echo "ok .secrets/$f"
    continue
  fi

  # Replace a leftover symlink with a real file if needed
  if [[ -L "$envfile" ]]; then
    target=$(readlink "$envfile")
    rm -f "$envfile"
    if [[ -f "$target" ]]; then
      cp "$target" "$envfile"
      chmod 600 "$envfile"
      echo "materialized .secrets/$f"
      continue
    fi
  fi

  if [[ -f "$example" ]]; then
    cp "$example" "$envfile"
    chmod 600 "$envfile"
    echo "created .secrets/$f from example — fill in values"
  else
    echo "skip $f: missing $example" >&2
  fi
done

echo "Done. Edit secrets under $DEST (*.env is gitignored; *.example is committed)."
