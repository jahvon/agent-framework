---
name: flow-authoring
description: Conventions for adding or changing flow executables (*.flow files) in a flow workspace. Use when automating a task, turning a repeated shell command into an executable, wrapping a package.json/Makefile task, or editing anything under .execs/.
---

# Authoring flow executables

Automation in a flow workspace belongs in an executable, not in a README code block or a
one-off shell history. When you notice yourself running the same command twice, or documenting
a command for someone else, propose an executable for it.

## Where things go

- Put executables in `.execs/<concern>.flow` (`build.flow`, `test.flow`, `validate.flow`,
  `tools.flow`, `release.flow`, …). One file per concern; don't grow a single catch-all file.
- Start each file with the schema header so editors validate it:
  `# yaml-language-server: $schema=https://flowexec.io/schemas/flowfile_schema.json`
- Use a `namespace` only for a distinct area (a sub-app, a deploy target); root tasks like
  `validate` and `test unit` stay un-namespaced so they're short to type.
- Logic longer than ~15 lines goes in `scripts/<name>.sh` and the executable calls it. The
  flowfile stays a readable index of what the repo can do.
- An existing `package.json` or `Makefile` can be imported with the flowfile's `imports:` key
  instead of re-declaring each script.

## Shape of an executable

- `verb` is from flow's fixed set (build, test, lint, validate, generate, install, setup,
  start, deploy, publish, clean, check, …); `name` is a noun (`test unit`, `build binary`).
  Pick the verb a person would type; add `aliases` rather than near-duplicate executables.
- Always set `description` — it's what `list_executables` and `flow browse` show.
- `dir: //` runs from the workspace root; the default is the flowfile's directory, and
  `./` is the caller's working directory (use it for tasks meant to act on another repo).
- Caller input → `args` (`pos` or `flag`, with `envKey`, `type`, `default`, `required`), set
  with `--param KEY=value`. Environment the task needs → `params` (`secretRef` for vault
  secrets, `envFile`, `prompt`, `text`). Never inline a secret.
- Chain steps with `serial` (`execs: [{ref: …} | {cmd: …}]`, `failFast`) and fan out with
  `parallel` (`maxThreads`). Compose from existing refs rather than copying their commands.
- Helpers that only other executables call get `visibility: private`.
- Tools a task depends on are pinned and installed into `./bin` by an `install` executable
  in `tools.flow`, and the task calls that first. Don't gate on `command -v` — a tool on
  `PATH` is not the pinned version.

## Writing and checking

1. Prefer `mcp__flow__write_flowfile`, which validates against the schema as it writes.
   Otherwise edit the file, then run `flow schema validate --strict <file>`.
2. Run `mcp__flow__sync_executables` (or `flow sync`) so the new executable is discoverable.
3. Run it once through `mcp__flow__execute` and check the output before calling it done.
4. If the repo's AGENTS.md or README lists tasks, update the list in the same change.
