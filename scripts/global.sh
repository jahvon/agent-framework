#!/usr/bin/env bash
# Installs, updates, or checks the machine-level Claude Code setup.
#   global.sh install | update | check
# Env: CLAUDE_CONFIG_DIR (default ~/.claude), MARKETPLACE_SOURCE (default: this repo's path),
#      FORCE=true to overwrite live settings that drifted from the last build.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
STATE_DIR="$CLAUDE_DIR/.agent-framework"
LIVE="$CLAUDE_DIR/settings.json"
OVERLAY="$CLAUDE_DIR/settings.overlay.json"
BUILT="$STATE_DIR/settings.built.json"
MARKETPLACE="jahvon"
MARKETPLACE_SOURCE="${MARKETPLACE_SOURCE:-$REPO}"
PLUGINS=(core flow)
# Keys Claude Code writes on its own; never treated as drift.
RUNTIME_KEYS='["feedbackSurveyState"]'

stamp() { date +%Y%m%d%H%M%S; }

marketplace_source_json() {
  if [ -d "$MARKETPLACE_SOURCE" ]; then
    jq -n --arg p "$MARKETPLACE_SOURCE" '{source: "directory", path: $p}'
  else
    jq -n --arg r "$MARKETPLACE_SOURCE" '{source: "github", repo: $r}'
  fi
}

build_settings() {
  # The plugin CLI records the marketplace and enabled plugins in settings.json, so the build
  # declares them too; otherwise every install would register as drift.
  [ -f "$OVERLAY" ] || echo '{}' > "$OVERLAY"
  jq -n --slurpfile a "$REPO/global/settings.base.json" --slurpfile b "$OVERLAY" \
    -f "$REPO/scripts/lib/merge.jq" \
    | jq --arg m "$MARKETPLACE" --argjson src "$(marketplace_source_json)" --args \
      '.extraKnownMarketplaces[$m] = {source: $src}
       | reduce $ARGS.positional[] as $p (.; .enabledPlugins["\($p)@\($m)"] = true)' "${PLUGINS[@]}"
}

strip_runtime() { jq --argjson k "$RUNTIME_KEYS" 'delpaths([$k[] | [.]])' "$1"; }

settings_drift() {
  # Prints a diff of live settings against the last build; empty when in sync.
  [ -f "$LIVE" ] && [ -f "$BUILT" ] || return 0
  diff <(strip_runtime "$BUILT" | jq -S .) <(strip_runtime "$LIVE" | jq -S .) || true
}

link_claude_md() {
  local target="$REPO/global/CLAUDE.md" link="$CLAUDE_DIR/CLAUDE.md"
  if [ -L "$link" ] && [ "$(readlink "$link")" = "$target" ]; then
    echo "  CLAUDE.md already linked"
    return
  fi
  if [ -e "$link" ] && ! cmp -s "$link" "$target"; then
    cp "$link" "$link.bak.$(stamp)"
    echo "  backed up differing CLAUDE.md to $link.bak.*"
  fi
  ln -sfn "$target" "$link"
  echo "  linked $link -> $target"
}

write_settings() {
  local drift
  drift="$(settings_drift)"
  if [ -n "$drift" ] && [ "${FORCE:-}" != "true" ]; then
    echo "  live settings.json changed since the last build:"
    echo "$drift" | sed 's/^/    /'
    echo "  move these into global/settings.base.json or $OVERLAY, or rerun with FORCE=true"
    exit 1
  fi
  mkdir -p "$STATE_DIR"
  if [ -f "$LIVE" ] && [ ! -f "$BUILT" ]; then
    cp "$LIVE" "$LIVE.bak.$(stamp)"
    echo "  first build: backed up existing settings.json to $LIVE.bak.*"
  fi
  build_settings > "$BUILT"
  # Carry runtime keys over so a rebuild doesn't reset Claude Code's own state.
  if [ -f "$LIVE" ]; then
    jq --slurpfile live "$LIVE" --argjson k "$RUNTIME_KEYS" \
      '. + ($live[0] | with_entries(select(.key as $x | $k | index($x))))' "$BUILT" > "$LIVE.tmp"
  else
    cp "$BUILT" "$LIVE.tmp"
  fi
  mv "$LIVE.tmp" "$LIVE"
  echo "  wrote $LIVE (base + $(basename "$OVERLAY"))"
}

ensure_plugins() {
  if claude plugin marketplace list --json | jq -e --arg n "$MARKETPLACE" 'any(.[]; .name == $n)' >/dev/null; then
    claude plugin marketplace update "$MARKETPLACE"
  else
    claude plugin marketplace add "$MARKETPLACE_SOURCE"
  fi
  local installed
  installed="$(claude plugin list --json)"
  for p in "${PLUGINS[@]}"; do
    if jq -e --arg id "$p@$MARKETPLACE" 'any(.[]; .id == $id and .scope == "user")' <<<"$installed" >/dev/null; then
      claude plugin update "$p@$MARKETPLACE" --scope user
    else
      claude plugin install "$p@$MARKETPLACE" --scope user
    fi
  done
}

check() {
  local ok=0 target="$REPO/global/CLAUDE.md" link="$CLAUDE_DIR/CLAUDE.md"
  if [ -L "$link" ] && [ "$(readlink "$link")" = "$target" ]; then
    echo "✓ CLAUDE.md linked"
  else
    echo "✗ $link is not a symlink to $target"; ok=1
  fi
  if [ ! -f "$BUILT" ]; then
    echo "✗ settings never built — run install agent:global"; ok=1
  else
    local drift
    drift="$(settings_drift)"
    if [ -n "$drift" ]; then echo "✗ live settings.json drifted from the last build:"; echo "$drift" | sed 's/^/    /'; ok=1
    else echo "✓ settings.json matches the last build"; fi
    if ! diff -q <(build_settings | jq -S .) <(jq -S . "$BUILT") >/dev/null; then
      echo "✗ base or overlay changed since the last build — run update agent:global"; ok=1
    fi
  fi
  local installed
  installed="$(claude plugin list --json)"
  for p in "${PLUGINS[@]}"; do
    if jq -e --arg id "$p@$MARKETPLACE" 'any(.[]; .id == $id and .scope == "user" and .enabled)' <<<"$installed" >/dev/null; then
      echo "✓ plugin $p@$MARKETPLACE enabled"
    else
      echo "✗ plugin $p@$MARKETPLACE not installed or disabled at user scope"; ok=1
    fi
  done
  return $ok
}

mkdir -p "$CLAUDE_DIR"
case "${1:-}" in
  install)
    echo "→ CLAUDE.md"; link_claude_md
    echo "→ settings"; write_settings
    echo "→ plugins"; ensure_plugins
    ;;
  update)
    echo "→ pull"; git -C "$REPO" pull --ff-only
    echo "→ CLAUDE.md"; link_claude_md
    echo "→ settings"; write_settings
    echo "→ plugins"; ensure_plugins
    ;;
  check) check ;;
  *) echo "usage: $0 install|update|check" >&2; exit 2 ;;
esac
