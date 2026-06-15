#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
set -a
# shellcheck disable=SC1091
source .env.runtime
set +a
docker compose build upjunoo-pro-backoffice
docker compose up -d upjunoo-pro-backoffice
docker builder prune -f
docker image prune -f
