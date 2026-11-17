#!/usr/bin/env bash
# RevCollect — Cloud Agent install phase.
# Idempotent. Provisions system tooling (Bun, Docker + fuse-overlayfs, Supabase
# CLI), installs JS dependencies, and writes a local dev .env.local. Safe to run
# repeatedly and on any Debian/Ubuntu base image.
set -euo pipefail

export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# --- Bun --------------------------------------------------------------------
if ! command -v bun >/dev/null 2>&1; then
  echo "Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
fi

# --- Docker + fuse-overlayfs ------------------------------------------------
# Local Supabase runs in Docker. Nested VMs can't use the overlayfs snapshotter,
# so Docker is configured to use the classic fuse-overlayfs storage driver.
if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sudo sh /tmp/get-docker.sh
fi

if ! command -v fuse-overlayfs >/dev/null 2>&1; then
  echo "Installing fuse-overlayfs..."
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -o Dpkg::Options::=--force-confold fuse-overlayfs
fi

sudo mkdir -p /etc/docker
if [ ! -f /etc/docker/daemon.json ]; then
  echo '{ "features": { "containerd-snapshotter": false }, "storage-driver": "fuse-overlayfs" }' \
    | sudo tee /etc/docker/daemon.json >/dev/null
fi

# --- Supabase CLI -----------------------------------------------------------
if ! command -v supabase >/dev/null 2>&1; then
  echo "Installing Supabase CLI..."
  ARCH="$(dpkg --print-architecture)"
  VER="$(curl -s https://api.github.com/repos/supabase/cli/releases/latest | grep -oP '"tag_name":\s*"v\K[^"]+')"
  curl -fsSL -o /tmp/supabase.deb \
    "https://github.com/supabase/cli/releases/download/v${VER}/supabase_${VER}_linux_${ARCH}.deb"
  sudo dpkg -i /tmp/supabase.deb
fi

# --- JS dependencies --------------------------------------------------------
cd /workspace
bun install --frozen-lockfile

# --- Local dev environment file (git-ignored) -------------------------------
# Created only if absent so a developer-provided .env.local is never clobbered.
# The Supabase keys below are the well-known, deterministic keys that
# `supabase start` always issues locally — they are not secrets.
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
