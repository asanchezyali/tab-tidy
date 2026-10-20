#!/usr/bin/env bash
# Packages the extension into dist/tab-tidy-<version>.zip, ready to upload to
# the Chrome Web Store. Only the files the browser needs go into the zip.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

version="$(node -p "require('./manifest.json').version")"
package_version="$(node -p "require('./package.json').version")"
if [[ "$version" != "$package_version" ]]; then
  echo "Version mismatch: manifest.json is $version, package.json is $package_version" >&2
  exit 1
fi

mkdir -p dist
out="dist/tab-tidy-$version.zip"
rm -f "$out"
zip -qr "$out" manifest.json src icons -x '*.DS_Store'
echo "$out"
