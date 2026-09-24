#!/usr/bin/env bash
# Applies the agent-framework project layer on top of the repo in the current directory.
# Existing files are merged, never replaced: JSON deep-merges with the repo's values winning,
# AGENTS.md gets marker-delimited managed sections, and other files are added only when absent.
#
# Env (all optional; detected when unset):
#   TRACKER=linear|github|none  PREFIX=KLI  VALIDATE="flow validate"  DECISIONS_DIR=docs/decisions
#   FLOW=true|false (default: true when flow.yaml exists; true without one creates it)
#   PRETTIER=true|false  PLUGINS=true|false  MARKETPLACE_SOURCE=jahvon/agent-framework
#   DRY_RUN=true — report what would change and exit 1 if anything would.
set -euo pipefail

FRAMEWORK="$(cd "$(dirname "$0")/.." && pwd)"
TPL="$FRAMEWORK/templates/project"
MERGE="$FRAMEWORK/scripts/lib/merge.jq"
TARGET="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$TARGET"

if [ "$TARGET" = "$FRAMEWORK" ]; then
  echo "refusing to install into agent-framework itself; run from the target repo" >&2
  exit 2
fi

DRY_RUN="${DRY_RUN:-false}"
PRETTIER="${PRETTIER:-false}"
PLUGINS="${PLUGINS:-true}"
MARKETPLACE_SOURCE="${MARKETPLACE_SOURCE:-jahvon/agent-framework}"
TRACKER="${TRACKER:-none}"
PREFIX="${PREFIX:-}"
PROJECT_NAME="$(basename "$TARGET")"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
pending=0

if [ -z "${FLOW:-}" ]; then
  [ -f flow.yaml ] && FLOW=true || FLOW=false
fi

detect_validate() {
  if [ "$FLOW" = "true" ] && grep -rqsE '^\s*-?\s*verb:\s*validate\s*$' --include='*.flow' . 2>/dev/null; then
    echo "\`flow validate\`"; return
  fi
  if [ -f package.json ] && jq -e '.scripts.validate' package.json >/dev/null 2>&1; then
    if [ -f yarn.lock ]; then echo "\`yarn validate\`"
    elif [ -f pnpm-lock.yaml ]; then echo "\`pnpm validate\`"
    else echo "\`npm run validate\`"; fi
    return
  fi
  if [ -f Makefile ] && grep -qE '^validate:' Makefile; then echo "\`make validate\`"; return; fi
  echo "⟨no single validate task found — add one and name it here⟩"
}

detect_decisions_dir() {
  for d in docs/decisions docs/adr docs/adrs docs/architecture/decisions decisions; do
    [ -d "$d" ] && { echo "$d"; return; }
  done
  echo "docs/decisions"
}

# A Project facts block the user already edited is the source of truth on re-runs.
fact() {
  [ -f AGENTS.md ] || return 0
  sed -n '/agent-framework:begin project-facts/,/agent-framework:end project-facts/p' AGENTS.md \
    | grep -m1 "^- \*\*$1:\*\*" | grep -oE '`[^`]+`' | head -1 | tr -d '`' || true
}

if [ -n "${VALIDATE:-}" ]; then VALIDATE_LINE="\`$VALIDATE\`"
elif [ -n "$(fact Validate)" ]; then VALIDATE_LINE="\`$(fact Validate)\`"
else VALIDATE_LINE="$(detect_validate)"; fi
DECISIONS_DIR="${DECISIONS_DIR:-$(fact 'Decision records')}"
DECISIONS_DIR="${DECISIONS_DIR:-$(detect_decisions_dir)}"
DECISIONS_DIR="${DECISIONS_DIR%/}"
ID="${PREFIX:+$PREFIX-}123"
case "$TRACKER" in
  linear) TRACKER_LINE="Linear${PREFIX:+, IDs \`$PREFIX-123\`}"; FOOTER="Refs $ID";;
  github) TRACKER_LINE="GitHub issues, IDs \`#123\`"; FOOTER="Refs #123";;
  none)   TRACKER_LINE="none"; FOOTER="";;
  *) echo "TRACKER must be linear, github, or none" >&2; exit 2;;
esac

render() {
  local s
  s="$(cat "$1")"
  s="${s//\{\{PROJECT_NAME\}\}/$PROJECT_NAME}"
  s="${s//\{\{VALIDATE\}\}/$VALIDATE_LINE}"
  s="${s//\{\{TRACKER_LINE\}\}/$TRACKER_LINE}"
  s="${s//\{\{DECISIONS_DIR\}\}/$DECISIONS_DIR}"
  s="${s//\{\{TICKET_FOOTER\}\}/$2}"
  s="${s//\{\{IMPORTS\}\}/$3}"
  printf '%s\n' "$s"
}

note() { printf '  %-9s %s\n' "$1" "$2"; }

# Writes $2 to path $1 when it differs; reports the action taken.
put() {
  local path="$1" src="$2" label="$3"
  if [ -f "$path" ] && cmp -s "$path" "$src"; then note "ok" "$path"; return; fi
  pending=1
  if [ "$DRY_RUN" = "true" ]; then note "would $label" "$path"; return; fi
  mkdir -p "$(dirname "$path")"
  cp "$src" "$path"
  note "$label" "$path"
}

add_if_absent() {
  if [ -e "$1" ]; then note "kept" "$1 (exists)"; return; fi
  put "$1" "$2" "create"
}

merge_json() {
  # The repo's own scalar values win and arrays are unioned. Merging the result back onto the
  # existing file keeps its key and array order, so the diff shows only additions.
  local path="$1" tpl="$2" out="$TMP/merged.json"
  if [ -f "$path" ]; then
    jq -n --slurpfile a "$tpl" --slurpfile b "$path" -f "$MERGE" > "$TMP/pass1.json"
    jq -n --slurpfile a "$path" --slurpfile b "$TMP/pass1.json" -f "$MERGE" > "$out"
    # Keep the file byte-identical when the merge adds nothing.
    if [ "$(jq -S . "$out")" = "$(jq -S . "$path")" ]; then note "ok" "$path"; return; fi
    put "$path" "$out" "merge"
  else
    jq . "$tpl" > "$out"
    put "$path" "$out" "create"
  fi
}

# Ensures a marker-delimited block from $2 is in AGENTS.md. mode=refresh replaces an existing
# block's contents; mode=once leaves an existing block alone.
agents_block() {
  local name="$1" src="$2" mode="$3" file="AGENTS.md" out="$TMP/agents.md"
  local begin="<!-- agent-framework:begin $name -->" end="<!-- agent-framework:end $name -->"
  if [ -f "$file" ] && grep -qF "$begin" "$file"; then
    [ "$mode" = "once" ] && { note "kept" "$file § $name"; return; }
    # Replace only the lines between the markers (inclusive) with the fresh block's.
    awk -v b="$begin" -v e="$end" -v blk="$src" '
      BEGIN { while ((getline l < blk) > 0) { if (l == b) on = 1; if (on) body = body l "\n"; if (l == e) on = 0 } }
      $0 == b { printf "%s", body; skip = 1; next }
      $0 == e { skip = 0; next }
      !skip { print }
    ' "$file" > "$out"
  else
    { [ -f "$file" ] && { cat "$file"; echo; }; cat "$src"; } > "$out"
  fi
  local label="update"; grep -qF "$begin" "$file" 2>/dev/null || label="add"
  if cmp -s "$file" "$out"; then note "ok" "$file § $name"; return; fi
  pending=1
  if [ "$DRY_RUN" = "true" ]; then note "would $label" "$file § $name"; return; fi
  cp "$out" "$file"
  note "$label" "$file § $name"
}

echo "→ agent-framework project layer: $TARGET"
[ "$DRY_RUN" = "true" ] && echo "  (dry run)"

# AGENTS.md — skeleton only when missing, then the managed sections.
if [ ! -f AGENTS.md ]; then
  render "$TPL/agents/AGENTS.md" "" "" > "$TMP/AGENTS.md"
  if [ "$DRY_RUN" = "true" ]; then note "would create" "AGENTS.md"; pending=1; else cp "$TMP/AGENTS.md" AGENTS.md; fi
fi
if [ -f AGENTS.md ]; then
  render "$TPL/agents/project-facts.md" "" "" > "$TMP/facts.md"
  agents_block project-facts "$TMP/facts.md" once
  agents_block working-agreements "$TPL/agents/working-agreements.md" refresh
  [ "$FLOW" = "true" ] && agents_block flow "$TPL/agents/flow.md" refresh
fi

# CLAUDE.md imports AGENTS.md.
if [ ! -f CLAUDE.md ]; then
  printf '@AGENTS.md\n' > "$TMP/CLAUDE.md"; put CLAUDE.md "$TMP/CLAUDE.md" "create"
elif grep -qxF '@AGENTS.md' CLAUDE.md; then
  note "ok" "CLAUDE.md"
else
  { printf '@AGENTS.md\n\n'; cat CLAUDE.md; } > "$TMP/CLAUDE.md"; put CLAUDE.md "$TMP/CLAUDE.md" "update"
fi

# .claude/settings.json
jq -n \
  --arg validate "$VALIDATE_LINE" --argjson flow "$FLOW" --argjson prettier "$PRETTIER" \
  --argjson plugins "$PLUGINS" --arg src "$MARKETPLACE_SOURCE" \
  --slurpfile hook "$TPL/prettier-hook.json" '
  {
    "$schema": "https://json.schemastore.org/claude-code-settings.json",
    permissions: {
      allow: (
        [$validate | capture("^`(?<c>[^`]+)`$")?.c | "Bash(\(.):*)"]
        + (if $flow then [
            "mcp__flow__get_info", "mcp__flow__list_workspaces", "mcp__flow__get_workspace",
            "mcp__flow__get_workspace_config", "mcp__flow__list_executables",
            "mcp__flow__get_executable", "mcp__flow__get_execution_logs",
            "mcp__flow__sync_executables", "mcp__flow__execute"
          ] else [] end)
      ),
      ask: ["Bash(git push:*)", "Bash(gh pr create:*)"],
      deny: ["Bash(git push --force:*)", "Bash(git push -f:*)", "Read(**/.env)", "Read(**/.env.local)"]
    }
  }
  + (if $flow then {
      env: { FLOW_RUN_CLIENT: "claude-code", FLOW_RUN_SESSION: "${CLAUDE_CODE_SESSION_ID}" }
    } else {} end)
  + (if $plugins then {
      extraKnownMarketplaces: { jahvon: { source: { source: "github", repo: $src } } },
      enabledPlugins: ({ "core@jahvon": true } + (if $flow then { "flow@jahvon": true } else {} end))
    } else {} end)
  + (if $prettier then $hook[0] else {} end)
' > "$TMP/settings.json"
jq -e 'type == "object" and has("permissions")' "$TMP/settings.json" >/dev/null \
  || { echo "internal error: generated settings.json is empty" >&2; exit 1; }
merge_json .claude/settings.json "$TMP/settings.json"

# .mcp.json — the flow server, in the shape flow's own docs publish.
if [ "$FLOW" = "true" ]; then
  echo '{"mcpServers":{"flow":{"type":"stdio","command":"flow","args":["mcp"],"timeout":600000}}}' > "$TMP/mcp.json"
  merge_json .mcp.json "$TMP/mcp.json"
fi

# PR template and decision-record scaffolding — only when absent.
render "$TPL/github/pull_request_template.md" "${FOOTER:+
<!-- Ticket footer: \`Refs <ID>\` / \`Fixes <ID>\`, or \`No ticket\` for small self-contained work. -->
$FOOTER}" "" > "$TMP/pr.md"
add_if_absent .github/pull_request_template.md "$TMP/pr.md"
if [ -f "$DECISIONS_DIR" ]; then
  note "kept" "$DECISIONS_DIR (single-file decision log)"
else
  add_if_absent "$DECISIONS_DIR/README.md" "$TPL/decisions/README.md"
  add_if_absent "$DECISIONS_DIR/template.md" "$TPL/decisions/template.md"
fi

# A flow workspace when asked for and missing.
if [ "$FLOW" = "true" ] && [ ! -f flow.yaml ]; then
  printf '# yaml-language-server: $schema=https://flowexec.io/schemas/workspace_schema.json\ndisplayName: %s\n' "$PROJECT_NAME" > "$TMP/flow.yaml"
  put flow.yaml "$TMP/flow.yaml" "create"
  imports=""
  [ -f package.json ] && imports+="  - ../package.json"$'\n'
  [ -f Makefile ] && imports+="  - ../Makefile"$'\n'
  render "$TPL/dev.flow.in" "" "${imports:+imports:
$imports}" > "$TMP/dev.flow"
  add_if_absent .execs/dev.flow "$TMP/dev.flow"
fi

if [ "$DRY_RUN" = "true" ]; then
  [ "$pending" -eq 0 ] && echo "✓ up to date" || { echo "✗ changes pending — run install agent:project"; exit 1; }
else
  echo "done. Review with \`git diff\` and \`git status\`, then fill in the Project facts block in AGENTS.md."
  [ "$FLOW" = "true" ] && [ -z "$(flow workspace list --output json 2>/dev/null | jq -r --arg p "$TARGET" '.workspaces[]? | select(.path == $p) | .name')" ] \
    && echo "note: this repo isn't a registered flow workspace; run \`flow workspace add $PROJECT_NAME $TARGET\` to add it."
fi
exit 0
