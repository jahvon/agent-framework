---
name: validate
description: Run the repo's own full validation (build, tests, lint, format, generated-file checks) through its task runner and report the result honestly. Use before committing, before opening a PR, after a non-trivial change, or when asked "does this pass?".
---

# Validate

## Find the command

Use the first that applies:

1. The **Validate** line in `AGENTS.md` Project facts.
2. A flow workspace (`flow.yaml` at the root): a `validate` executable via
   `mcp__flow__list_executables` / `mcp__flow__execute` (see `flow-context`).
3. `package.json` script `validate` (or `check`), run with the repo's package manager — the
   lockfile tells you which.
4. A `validate`/`check` target in a `Makefile` or `justfile`.
5. None of the above: run the individual build, test, and lint tasks the repo defines, and tell
   the user there's no single validate entry point.

Never substitute a hand-rolled equivalent (`go test ./...`, a linter off `PATH`) for the repo's
task: the task carries the environment, working directory, build tags, and pinned tool versions.

## Run it and report

- Run the full command, not a subset, unless the user asked for scope.
- **Pass**: say so, with the command you ran.
- **Fail**: show the failing step and the relevant output (the tail, not the whole log). Fix
  failures caused by your change and re-run. If a failure predates your change (it fails on the
  base branch too), say so and don't fix it unasked.
- Never call a change done, passing, or fixed without having run validation and seen it pass.
  If you couldn't run part of it (needs secrets, a service, a platform you don't have), name
  that part explicitly.
- Don't weaken a test, skip a check, or add an ignore to make validation pass without asking.
