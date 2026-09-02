#!/usr/bin/env bash
# RevCollect — Cloud Agent install phase.
# Idempotent, runs after the repo is checked out. Refreshes dependencies and
# writes a local dev .env.local (mock business data + local Supabase auth).
set -euo pipefail

export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

cd /workspace

# Install JS dependencies with the committed lockfile.
bun install --frozen-lockfile

# Local development environment file (git-ignored). Only create it if absent so
# a developer-provided .env.local is never overwritten.
#
# The Supabase keys below are the well-known, deterministic keys that
# `supabase start` always issues for a local stack (signed with the default
# local JWT secret) — they are not secrets and are safe to hard-code here.
if [ ! -f .env.local ]; then
  cat > .env.local <<'EOF'
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_REV_COLLECT_DATA_SOURCE=mock
NEXT_PUBLIC_SENTRY_DISABLED=true

# Local Supabase (from `supabase start`) — used for auth only; app data stays mock.
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
EOF
  echo "Created .env.local for local development."
fi

echo "install.sh complete."
