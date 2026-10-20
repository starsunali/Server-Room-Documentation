#!/usr/bin/env bash
# One-command RackFlow deploy: build + (re)start the container.
#   ./docker/deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

docker compose -f docker-compose.yml up -d --build

# .env next to this compose file supplies RACKFLOW_PORT (default 8082)
PORT="$(grep -E '^RACKFLOW_PORT=' .env 2>/dev/null | cut -d= -f2 || true)"
PORT="${PORT:-8082}"
echo "RackFlow is up → http://localhost:${PORT}"
