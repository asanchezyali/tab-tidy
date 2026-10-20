#!/usr/bin/env bash
# Renders the Chrome Web Store images from store/assets.html with headless
# Chrome: three 1280x800 screenshots, the 440x280 promo tile and the
# 1400x560 marquee. Output goes to store/*.png.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
chrome="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
page="file://$root/store/assets.html"

render() {
  local view="$1" size="$2" out="$3"
  "$chrome" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --allow-file-access-from-files --window-size="$size" \
    --screenshot="$root/store/$out" "$page?view=$view" >/dev/null 2>&1
  echo "store/$out"
}

render sorted 1280,800 screenshot-1-sorted.png
render duplicate 1280,800 screenshot-2-duplicate.png
render settings 1280,800 screenshot-3-settings.png
render promo 440,280 promo-small-440x280.png
render marquee 1400,560 promo-marquee-1400x560.png
