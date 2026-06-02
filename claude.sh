#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIR_NAME="$(basename "$SCRIPT_DIR")"
PROJECT_NAME="${CLAUDE_PROJECT_NAME:-$DIR_NAME}"
DEVICE_NAME="${CLAUDE_DEVICE_NAME:-$(hostname -s 2>/dev/null | tr '[:upper:]' '[:lower:]' || echo host)}"
SESSION_NAME="${CLAUDE_SESSION_NAME:-${DIR_NAME}-${PROJECT_NAME}-${DEVICE_NAME}-cc}"
CLAUDE_HOME="$SCRIPT_DIR/.claude-home"
CLAUDE_CMD="${CLAUDE_BIN:-claude}"

mkdir -p "$CLAUDE_HOME"

usage() {
  cat <<EOF
Usage: ./claude.sh [a|rd|st]

  a   attach to the tmux session
  rd  restart the tmux session
  st  show status

Session name: $SESSION_NAME
Workdir:      $SCRIPT_DIR
EOF
}

status() {
  echo "▶ claude.sh status"
  echo "  dir          : $DIR_NAME"
  echo "  project      : $PROJECT_NAME"
  echo "  device       : $DEVICE_NAME"
  echo "  session      : $SESSION_NAME"
  echo "  workdir      : $SCRIPT_DIR"
  if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "  tmux         : running"
  else
    echo "  tmux         : stopped"
  fi
}

attach() {
  if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    exec tmux attach-session -t "$SESSION_NAME"
  fi
  echo "No tmux session found: $SESSION_NAME" >&2
  exit 1
}

start() {
  if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "✓ Already running: $SESSION_NAME"
    echo "  attach: ./claude.sh a"
    return
  fi

  echo "▶ starting Claude Code"
  echo "  session : $SESSION_NAME"
  echo "  workdir : $SCRIPT_DIR"
  echo "  home    : $CLAUDE_HOME"

  tmux new-session -d -s "$SESSION_NAME" -c "$SCRIPT_DIR" "$CLAUDE_CMD"

  echo "✓ Started"
  echo "  attach: ./claude.sh a"
}

restart() {
  if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    tmux kill-session -t "$SESSION_NAME"
  fi
  start
}

case "${1:-}" in
  a|attach) attach ;;
  rd|restart) restart ;;
  st|status) status ;;
  -h|--help|help) usage ;;
  "") start ;;
  *) echo "Unknown command: $1" >&2; usage; exit 1 ;;
esac
