---
status: accepted
date: 2026-11-08
---

# 0003 — Agents use mochi first, flow as the fallback

## Context

mochi is a paid superset of flow: the same CLI command tree and all of flow's MCP tools, plus
search, run history, stats, and discovery. Agents should use it where it's installed, but
repos here are shared with teammates and CI, some of them public, and not every machine has
mochi.

## Options

- **mochi in project files** — the `.mcp.json` and settings that `install agent:project` writes
  would require mochi from everyone who opens the repo.
- **mochi per machine** — `install agent:global` registers a user-scope `mochi` MCP server only
  where `mochi` is installed, and skills prefer it when it's present.

## Decision

Per machine. Where mochi is installed, `install agent:global` registers `mochi mcp` at user
scope and sets `disabledMcpjsonServers: ["flow"]`, so repos' `flow` server doesn't add duplicate
tools. Where it isn't, the install removes any stale mochi server and leaves flow alone. The
`flow` plugin's skills (the plugin id is unchanged) prefer `mcp__mochi__*` and the `mochi` CLI,
and fall back to flow when asked or when mochi itself fails: not installed, server not
connected, license not usable, or a license gate. A failing task doesn't trigger a fallback.

## Consequences

- Project templates and files that agents write for other people keep saying `flow`.
- On mochi machines, the flow fallback goes through the `flow` CLI, since the project flow MCP
  server is hidden.
- `check agent:global` reports whether the mochi server is registered and its license usable.
