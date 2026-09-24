# agent-framework

My coding-agent setup in one place: global Claude Code config, a plugin marketplace of skills, and
project starter files — all installed and kept in sync with [flow](https://flowexec.io).

## Setup on a machine

```sh
git clone git@github.com:jahvon/agent-framework.git ~/workspaces/github.com/jahvon/agent-framework
cd ~/workspaces/github.com/jahvon/agent-framework
flow workspace add agent-framework . && flow sync
flow install agent:global
```

`install agent:global` symlinks `global/CLAUDE.md` to `~/.claude/CLAUDE.md`, builds
`~/.claude/settings.json` from `global/settings.base.json` plus the untracked, per-machine
`~/.claude/settings.overlay.json`, and installs the `core` and `flow` plugins from this repo's
marketplace. `flow update agent:global` pulls and reapplies; `flow check agent:global` shows drift.

## Setup in a project

From the project's root:

```sh
flow install agent-framework/agent:project
```

Runs on top of whatever the repo already has, so you can review the `git diff` and tweak:

- `AGENTS.md` — adds a **Project facts** block (added once, never rewritten; the skills read it)
  and managed working-agreement sections (refreshed on each run) between marker comments.
- `CLAUDE.md` — gets an `@AGENTS.md` import.
- `.claude/settings.json`, `.mcp.json` — deep-merged; the repo's own values win. Enables the
  `core` (and for flow workspaces `flow`) plugins for the whole team.
- PR template and decision-record scaffolding — added only when absent.

Options go after `--`: `--tracker=linear|github|none`, `--prefix=KLI`, `--validate="…"`,
`--decisions-dir=…`, `--flow=true`, `--prettier=true`, `--plugins=false`.
`flow check agent-framework/agent:project` previews the changes. Project installs reference the
marketplace on GitHub (`jahvon/agent-framework`), so the repo must be pushed for teammates.

## For agents in other repos

If you were asked to install this setup into the repo you're working in:

1. If the `core:setup-project` skill is available, follow it.
2. Otherwise confirm `flow workspace list` shows `agent-framework`, then from the repo root run
   `flow install agent-framework/agent:project -- <options>` with options that fit the repo (read
   its task runner, ticket tracker, and existing docs first).
3. Report what was created, what was skipped because it already existed, and what the user should
   fill in (the **Project facts** block in `AGENTS.md`).
