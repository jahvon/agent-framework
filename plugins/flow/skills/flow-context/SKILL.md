---
name: flow-context
description: Applies in flow workspaces — a repo with a flow.yaml at its root or one registered with `flow workspace add`. When asked to build, test, lint, generate, run, deploy, or perform any dev task, or to run a one-off shell command there, prefer the mochi MCP tools or mochi CLI (falling back to flow) over raw Bash so the work runs with the workspace's environment, secrets, and pinned tool versions and is recorded in its run history.
user-invocable: false
---

# Working in a flow workspace

Skip this skill when the repo has no `flow.yaml` and isn't a registered workspace.

Dev workflows in a flow workspace are executables in `*.flow` files, usually under `.execs/`.
Two front ends drive the same engine and the same workspaces:

| | MCP tools | CLI |
|---|---|---|
| **mochi** (default) | `mcp__mochi__*` | `mochi <verb> <ref>` |
| **flow** (fallback) | `mcp__flow__*` | `flow <verb> <ref>` |

mochi is flow plus extras: every flow tool and command works under it, with the same names.

## Which one

1. Use **mochi**: its MCP tools first, then the `mochi` CLI.
2. Use **flow** when the user asks for flow, or when mochi itself fails. That means mochi is
   not installed, its MCP server isn't connected, its license isn't usable
   (`mochi license status`), or it errors where flow wouldn't, such as a license gate.
   Retry the same step once with flow and say that you switched and why.
3. Don't switch when the task itself fails. A failing test or a bad flowfile fails the
   same way under both; read the logs instead.

In the steps below, `<mcp>` means `mcp__mochi__` (or `mcp__flow__` when falling back), and
`<cli>` means `mochi` (or `flow`).

## Running work — pick the closest tool

1. **Named task?** (build, test, lint, validate, generate, deploy, …) → find it with
   `<mcp>list_executables` (with mochi, `mochi_search` also matches descriptions), then
   `<mcp>execute` with `executable_verb` plus `executable_id` when it has a name (verb `test`
   + id `unit`). Don't hand-roll a shell command an executable already covers.
2. **Arbitrary one-off command?** (`git …`, a script, an ad-hoc `go run`) →
   `<mcp>run_command` with `command` and a short `label`. It runs with the workspace's env and
   secrets and lands in the run history with provenance. Pass `commands` + `mode`
   (`serial` | `parallel`) to run several in one call, and `dir` for the working directory.
3. **One-off Python?** → `<mcp>run_python` with `code` and a `label` instead of `python -c` or
   a scratch file. It resolves the workspace virtualenv.
4. **Richer than one command?** (a serial/parallel batch, an HTTP request, a render or launch)
   → `<mcp>run_executable` with an inline `spec`, shaped like one entry under a flowfile's
   `executables:` list.
5. **Fall back to Bash** only when a run shouldn't be recorded, when you need CLI flags MCP
   doesn't expose (`--param`, `--output json`), or for interactive/TTY programs. With the CLI,
   use `<cli>`, and put executable args after `--`.

## Why this matters

An executable carries the workspace's working directory, env files, secrets, and pinned tool
versions. `mochi lint` in a repo that pins its linter is not the same as the linter on `PATH`;
running the tool directly is how a clean local run turns into a red CI.

## Reading output

`<mcp>get_execution_logs` returns run metadata by default. For output, set one of:

- `tail: <n>` — last N lines; the best default when debugging, errors surface at the end.
- `grep: "<regex>"` — only matching lines, applied before `tail`.
- `content: true` — full captured output (capped by `max_bytes`).

Filter with `last: true`, `mine: true` (this session's runs), `status`, `source`, `session`.
Read the logs of a failed run instead of re-running it to see the error. With mochi,
`mochi_query_runs` searches history across workspaces, and `mochi_get_stats` shows failure
rates and durations.

## Context and authoring

- Call `<mcp>get_info` once per session: it returns the current workspace, namespace, and
  vault, plus the docs index and schema URLs.
- Runs target the workspace containing the working directory; `run_command`, `run_python`, and
  `run_executable` accept `workspace` to target another without switching globally.
- To add or change executables, follow the `flow-authoring` skill.
- After adding a `.flow` file, run `<mcp>sync_executables` (or `<cli> sync`).
- In files other people use (a repo's AGENTS.md, README, CI, flowfiles), write `flow`
  commands, not `mochi` ones: teammates and CI have flow, not mochi.
