#!/usr/bin/env bash
# Validates everything this repo ships: flowfiles, JSON, skill frontmatter, and the plugin marketplace.
set -euo pipefail
cd "$(dirname "$0")/.."
fail=0

echo "→ flowfiles"
flow schema validate --strict flow.yaml .execs/*.flow || fail=1

echo "→ json"
while IFS= read -r f; do
  jq empty "$f" 2>/dev/null || { echo "invalid json: $f"; fail=1; }
done < <(git ls-files --cached --others --exclude-standard '*.json')

echo "→ skill frontmatter"
while IFS= read -r f; do
  head -1 "$f" | grep -qx -- '---' || { echo "missing frontmatter: $f"; fail=1; continue; }
  fm="$(awk 'NR==1{next} /^---$/{exit} {print}' "$f")"
  for key in name description; do
    grep -q "^${key}:" <<<"$fm" || { echo "missing '${key}': $f"; fail=1; }
  done
  dir="$(basename "$(dirname "$f")")"
  grep -qx "name: ${dir}" <<<"$fm" || { echo "name does not match directory '${dir}': $f"; fail=1; }
done < <(find plugins -name SKILL.md 2>/dev/null)

if [ -f .claude-plugin/marketplace.json ]; then
  echo "→ plugins"
  claude plugin validate . || fail=1
  for p in plugins/*/; do claude plugin validate "$p" || fail=1; done
fi

[ "$fail" -eq 0 ] && echo "✅ all checks passed" || { echo "❌ validation failed"; exit 1; }
