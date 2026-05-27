#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Error: not a git repository."
  exit 1
fi

if [ -z "${1:-}" ]; then
  echo "Paste your GitHub Personal Access Token (input hidden):"
  read -rsp "" TOKEN
  echo
else
  TOKEN="$1"
fi

if [ -z "$TOKEN" ]; then
  echo "Error: token is required."
  exit 1
fi

USERNAME="${GITHUB_USERNAME:-nextgrid-digital}"
REMOTE="https://${USERNAME}:${TOKEN}@github.com/nextgrid-digital/RevCollect.git"

echo "Pushing main to GitHub..."
if git push "$REMOTE" main:main; then
  git remote set-url origin https://github.com/nextgrid-digital/RevCollect.git
  git branch --set-upstream-to=origin/main main 2>/dev/null || true
  echo
  echo "Success! View your repo:"
  echo "https://github.com/nextgrid-digital/RevCollect"
else
  echo
  echo "Push failed. Common fixes:"
  echo "  1. Token must have 'repo' scope (classic) or Contents: Read and write (fine-grained)"
  echo "  2. Use token as password — not your GitHub account password"
  echo "  3. Username should be: nextgrid-digital"
  exit 1
fi
