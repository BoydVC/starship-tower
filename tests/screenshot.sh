#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${STARSHIP_TOWER_PORT:-4295}"
CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser)"
mkdir -p screenshots dist
python3 build.py
# ensure server is up for live shot; fallback to file://
if ! curl -sf "http://127.0.0.1:$PORT/health" >/dev/null 2>&1; then
  nohup python3 server.py > /tmp/starship-tower-$PORT.log 2>&1 &
  for i in 1 2 3 4 5 6 7 8; do
    curl -sf "http://127.0.0.1:$PORT/health" >/dev/null 2>&1 && break
    sleep 0.4
  done
fi
shot() {
  local url="$1" out="$2" size="$3"; shift 3 || true
  local prof; prof="$(mktemp -d /tmp/stowershot.XXXX)"
  "$CHROME" --headless=new --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --run-all-compositor-stages-before-draw --virtual-time-budget=28000 \
    --window-size="$size" --user-data-dir="$prof" --screenshot="$out" "$@" "$url" >/dev/null 2>&1
  rm -rf "$prof"; echo "  $out ($(wc -c < "$out") bytes)"
}
U="http://127.0.0.1:$PORT"
shot "$U/" screenshots/00-best-home.png 1440,1100
shot "file://$PWD/dist/starship-tower.html" screenshots/01-offline-file.png 1440,1100
shot "$U/" screenshots/02-desktop-full.png 1440,1600
echo "screenshots done"
