---
name: flow-context
description: Applies in flow workspaces — a repo with a flow.yaml at its root or one registered with `flow workspace add`. When asked to build, test, lint, generate, run, deploy, or perform any dev task, or to run a one-off shell command there, prefer the flow MCP tools (or the flow CLI) over raw Bash so the work runs with the workspace's environment, secrets, and pinned tool versions and is recorded in flow's history.
user-invocable: false
---

# Working in a flow workspace

Skip this skill when the repo has no `flow.yaml` and isn't a registered workspace.

Dev workflows in a flow workspace are executables in `*.flow` files, usually under `.execs/`.
The `mcp__flow__*` tools drive the same engine as the `flow` CLI with structured JSON in and
out. If the MCP tools aren't connected, use the CLI equivalents (`flow <verb> <ref>`).

## Running work — pick the closest tool

1. **Named task?** (build, test, lint, validate, generate, deploy, …) → find it with
   `mcp__flow__list_executables`, then `mcp__flow__execute` with `executable_verb` plus
   `executable_id` when it has a name (verb `test` + id `unit`). Don't hand-roll a shell
   command an executable already covers.
2. **Arbitrary one-off command?** (`git …`, a script, an ad-hoc `go run`) →
   `mcp__flow__run_command` with `command` and a short `label`. It runs with the workspace's
   env and secrets and lands in `flow logs` with provenance. Pass `commands` + `mode`
   (`serial` | `parallel`) to run several in one call, and `dir` for the working directory.
3. **One-off Python?** → `mcp__flow__run_python` with `code` and a `label` instead of
   `python -c` or a scratch file. flow resolves the workspace virtualenv.
4. **Richer than one command?** (a serial/parallel batch, an HTTP request, a render or
   launch) → `mcp__flow__run_executable` with an inline `spec`, shaped like one entry under a
   flowfile's `executables:` list.
5. **Fall back to Bash** only when a run shouldn't be recorded, when you need CLI flags MCP
   doesn't expose (`--param`, `--output json`), or for interactive/TTY programs.

## Why this matters

An executable carries the workspace's working directory, env files, secrets, and pinned tool
versions. `flow lint` in a repo that pins its linter is not the same as the linter on `PATH`;
running the tool directly is how a clean local run turns into a red CI.

## Reading output

`mcp__flow__get_execution_logs` returns run metadata by default. For output, set one of:

- `tail: <n>` — last N lines; the best default when debugging, errors surface at the end.
- `grep: "<regex>"` — only matching lines, applied before `tail`.
- `content: true` — full captured output (capped by `max_bytes`).

Filter with `last: true`, `mine: true` (this session's runs), `status`, `source`, `session`.
Read the logs of a failed run instead of re-running it to see the error.

## Context and authoring

- Call `mcp__flow__get_info` once per session: it returns the current workspace, namespace,
  and vault, plus the docs index and schema URLs.
- Runs target the workspace containing the working directory; `run_command`, `run_python`, and
  `run_executable` accept `workspace` to target another without switching globally.
- To add or change executables, follow the `flow-authoring` skill.
- After adding a `.flow` file, run `mcp__flow__sync_executables` (or `flow sync`).
