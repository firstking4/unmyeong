#!/bin/bash
# Start Metro for iOS Simulator. Uses /tmp/nodebin/node because
# ~/.local/node/bin/node is SIGKILL'd for new processes in some agent shells.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p /tmp/nodebin
if [[ ! -x /tmp/nodebin/node ]]; then
  cp -f /Users/yun/.local/node/bin/node /tmp/nodebin/node
  chmod +x /tmp/nodebin/node
  xattr -cr /tmp/nodebin/node 2>/dev/null || true
fi
export PATH="/tmp/nodebin:/Users/yun/.local/node/bin:$PATH"
export EXPO_NO_TELEMETRY=1
export FORCE_COLOR=0
export NO_COLOR=1
export NODE_OPTIONS="--dns-result-order=ipv4first"
cd "$ROOT"
exec /tmp/nodebin/node ./node_modules/expo/bin/cli start --port 8091 --lan --max-workers 1
