#!/usr/bin/env bash
# Installs the learning-artifact skill(s) and agent(s) for Claude Code (macOS/Linux/Git Bash).
# Usage: ./install.sh [en|he|both] [dest_claude_dir]    default: en, $HOME/.claude
set -euo pipefail
ed="${1:-en}"; dest="${2:-$HOME/.claude}"; root="$(cd "$(dirname "$0")" && pwd)"
case "$ed" in both) eds="en he";; en|he) eds="$ed";; *) echo "edition must be en, he or both"; exit 1;; esac
for e in $eds; do
  for kind in skills agents; do
    mkdir -p "$dest/$kind"
    for item in "$root/$e/$kind"/*; do
      name="$(basename "$item")"
      if [ -e "$dest/$kind/$name" ]; then echo "Skipping $name (exists; delete it to reinstall)"; continue; fi
      cp -r "$item" "$dest/$kind/$name"; echo "Installed $kind/$name"
    done
  done
done
echo "Done. Restart Claude Code, then ask for a learning artifact (see README)."
