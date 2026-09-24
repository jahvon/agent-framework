---
name: flow-help
description: Discover which flow executables a workspace defines and what they actually run. Use to find the right dev task before running or hand-rolling a shell command, or when asked "what tasks does this repo have".
allowed-tools: mcp__flow__list_executables, mcp__flow__get_executable, mcp__flow__get_info, mcp__flow__sync_executables, Bash(flow browse:*), Bash(flow sync:*), Read
---

# Finding flow executables

1. List executables with `mcp__flow__list_executables`, filtered by `verb`, `tag`, or
   `keyword` when you know roughly what you want. Without MCP:
   `flow browse --list --all --output json`.
2. Before running anything unfamiliar, read it with `mcp__flow__get_executable` — what it
   runs, its `params` (env from secrets, prompts, files) and `args` (`--param KEY=value` or
   positional), and any `ref`s it chains to.
3. If the list looks stale or a `.flow` file was just added, run
   `mcp__flow__sync_executables` and list again.

Present results grouped by verb, with the full ref (`verb namespace:name`) and a one-line
description each. Point at the defining file (`.execs/*.flow` or wherever it lives) so the
user can edit it.

Refs from another workspace take the form `verb workspace/namespace:name`, e.g.
`flow install agent-framework/agent:project`. Executables marked `private` can only be run
from inside their own workspace.
