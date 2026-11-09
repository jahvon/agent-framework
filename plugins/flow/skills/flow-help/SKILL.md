---
name: flow-help
description: Discover which flow executables a workspace defines and what they actually run. Use to find the right dev task before running or hand-rolling a shell command, or when asked "what tasks does this repo have".
allowed-tools: mcp__flow__list_executables, mcp__flow__get_executable, mcp__flow__get_info, mcp__flow__sync_executables, Bash(flow browse:*), Bash(flow sync:*), Read
---

# Finding flow executables

Use mochi first and flow as the fallback, per `flow-context`: `<mcp>` is `mcp__mochi__` or
`mcp__flow__`, and `<cli>` is `mochi` or `flow`.

1. List executables with `<mcp>list_executables`, filtered by `verb`, `tag`, or `keyword`
   when you know roughly what you want. With mochi, `mochi_search` also matches
   descriptions and searches across every workspace. Without MCP:
   `<cli> browse --list --all --output json`.
2. Before running anything unfamiliar, read it with `<mcp>get_executable` — what it runs,
   its `params` (env from secrets, prompts, files) and `args` (`--param KEY=value` or
   positional), and any `ref`s it chains to.
3. If the list looks stale or a `.flow` file was just added, run `<mcp>sync_executables`
   and list again. If a repo has tasks in a Makefile or package.json but no executables yet,
   mochi's `mochi_discover` finds them.

Present results grouped by verb, with the full ref (`verb namespace:name`) and a one-line
description each. Point at the defining file (`.execs/*.flow` or wherever it lives) so the
user can edit it.

Refs from another workspace take the form `verb workspace/namespace:name`, e.g.
`mochi install agent-framework/agent:project`. Executables marked `private` can only be run
from inside their own workspace.
