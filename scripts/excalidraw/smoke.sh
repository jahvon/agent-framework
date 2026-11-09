#!/usr/bin/env bash
# Unit tests, then a real render of the skill's examples (needs Chrome and esm.sh).
set -euo pipefail
cd "$(dirname "$0")"
examples="../../plugins/diagrams/skills/excalidraw-diagram/examples"

node --test --test-reporter=dot test/*.test.mjs

out="$(mktemp -d)"
trap 'rm -rf "$out"' EXIT
cp "$examples"/*.skeleton.json "$out"/
node render.mjs "$out" --strict

for f in "$out"/*.skeleton.json; do
  base="${f%.skeleton.json}"
  for ext in excalidraw svg png; do
    [ -s "$base.$ext" ] || { echo "missing $(basename "$base").$ext"; exit 1; }
  done
  grep -q '@font-face' "$base.svg" || { echo "$(basename "$base").svg has no embedded fonts"; exit 1; }
done
echo "✅ renderer ok"
