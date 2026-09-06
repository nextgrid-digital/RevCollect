#!/usr/bin/env bash
# RevCollect — Cloud Agent start phase (runs on every boot).
# Brings up the Docker daemon and the local Supabase stack that the app uses
# for authentication. Tolerant of restarts and safe to run repeatedly.
set -uo pipefail

export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# --- Docker daemon --------------------------------------------------------
# Nested VMs can't use the overlayfs snapshotter, so we run dockerd with the
# classic fuse-overlayfs storage driver (configured in /etc/docker/daemon.json).
if [ ! -f /etc/docker/daemon.json ]; then
  sudo mkdir -p /etc/docker
  echo '{ "features": { "containerd-snapshotter": false }, "storage-driver": "fuse-overlayfs" }' \
    | sudo tee /etc/docker/daemon.json >/dev/null
fi

if ! sudo docker info >/dev/null 2>&1; then
  echo "Starting dockerd..."
  sudo setsid dockerd >/tmp/dockerd.log 2>&1 &
  for _ in $(seq 1 60); do
    sudo docker info >/dev/null 2>&1 && break
    sleep 1
  done
fi
sudo chmod 666 /var/run/docker.sock 2>/dev/null || true

# --- Nested bridge networking --------------------------------------------
# Let containers on the same Docker bridge talk to each other. Without this,
# bridged traffic is pushed through netfilter and dropped in this environment,
# which hangs the Supabase service migrations.
sudo sysctl -w net.bridge.bridge-nf-call-iptables=0  >/dev/null 2>&1 || true
sudo sysctl -w net.bridge.bridge-nf-call-ip6tables=0 >/dev/null 2>&1 || true

# --- Local Supabase (auth) ------------------------------------------------
cd /workspace
if ! supabase status >/dev/null 2>&1; then
  echo "Starting local Supabase..."
  supabase start || { echo "First supabase start failed, retrying..."; supabase stop >/dev/null 2>&1 || true; supabase start; }
fi

echo "start.sh complete — Supabase auth is up on http://127.0.0.1:54321"
