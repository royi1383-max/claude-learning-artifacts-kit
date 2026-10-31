#!/usr/bin/env bash
# Installs the learning-artifact skill and agent for Claude Code (macOS/Linux/Git Bash).
# Usage: ./install.sh [dest_claude_dir]    default: $HOME/.claude
set -euo pipefail
dest="${1:-$HOME/.claude}"; root="$(cd "$(dirname "$0")" && pwd)"
for kind in skills agents; do
  mkdir -p "$dest/$kind"
  for item in "$root/en/$kind"/*; do
    name="$(basename "$item")"
    if [ -e "$dest/$kind/$name" ]; then echo "Skipping $name (exists; delete it to reinstall)"; continue; fi
    cp -r "$item" "$dest/$kind/$name"; echo "Installed $kind/$name"
  done
done
echo "Done. Restart Claude Code, then ask for a learning artifact (see README)."
