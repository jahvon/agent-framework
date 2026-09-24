---
status: accepted
date: 2026-09-24
---

# 0002 — Project install merges onto existing repos with a shell script

## Context

`install agent:project` has to work on repos that already have `AGENTS.md`, `.claude/settings.json`,
and `.mcp.json`, leaving a reviewable `git diff` the owner can tweak. It also has to be re-runnable
to pick up framework updates.

## Options

- **`flow template generate`** — built-in forms and conditional artifacts. Tested on flow 2.2.2:
  with `-f` it wrote output next to the template rather than into the workspace, overwrote files
  on a second run, and truncated an artifact copied onto itself.
- **Script behind a flow executable** — full control over per-file merge behavior.

## Decision

`scripts/install-project.sh`, run by `install agent:project`. Per file type:
JSON is deep-merged (existing values win, permission arrays are unioned); `AGENTS.md` gets
marker-delimited managed sections that re-runs refresh, plus a Project facts block that is only
ever inserted; `CLAUDE.md` gets an `@AGENTS.md` import if missing; everything else is added only
when absent.

## Consequences

- Re-running is safe and pulls in updated managed sections.
- Edits inside a managed `AGENTS.md` section are overwritten on the next run; project-specific
  content belongs outside the markers or in Project facts.
- Revisit `flow template` once generation into an arbitrary workspace directory is reliable.
