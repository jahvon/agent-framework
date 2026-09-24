---
status: accepted
date: 2026-09-24
---

# 0001 — Deliver skills through a plugin marketplace, installed by flow

## Context

Generic skills (PR workflow, review, planning, flow usage) were copied between klipster-platform,
flow, and mochi and had drifted. `~/.claude` was hand-edited and owned by no repo. The older
`system` workspace installs dotfiles by `cp`, and the copies in `$HOME` have drifted from source.

## Options

- **Symlink `skills/` into `~/.claude`** — instant edits, unprefixed names; unversioned, invisible
  to cloud sessions, and teammates can't get them.
- **Plugin marketplace** — Claude Code's own versioned mechanism, installable at user or project
  scope, works in cloud sessions; skill names become `core:open-pr`.

## Decision

This repo is a plugin marketplace (`jahvon`) with `core` and `flow` plugins. flow executables
drive every install and update. Personal machine files (`CLAUDE.md`) are symlinked; settings are
built from a tracked base plus an untracked per-machine overlay.

The flow plugin ships no MCP server: plugin servers get namespaced tool names, which would
duplicate the `mcp__flow__*` tools in repos whose own `.mcp.json` declares flow. The project
install writes the standard `.mcp.json` entry instead.

## Consequences

- Skill edits reach a machine after `flow update agent:global`, not instantly.
- Project-scope installs record the marketplace in the repo, so teammates are prompted too.
- Skills can't hardcode project details; they read the target repo's Project facts block.
