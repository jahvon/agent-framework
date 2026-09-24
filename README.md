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

Copies `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json`, a PR template, and decision-record
scaffolding into the repo, skipping anything that already exists, then enables the plugins at
project scope so teammates get them too. See `.execs/project.flow` for the params.

## For agents in other repos

If you were asked to install this setup into the repo you're working in:

1. If the `core:setup-project` skill is available, follow it.
2. Otherwise confirm `flow workspace list` shows `agent-framework`, then from the repo root run
   `flow install agent-framework/agent:project` with params that fit the repo (read its task runner,
   ticket tracker, and existing docs first), then `flow check agent-framework/agent:project`.
3. Report what was created, what was skipped because it already existed, and what the user should
   fill in (the **Project facts** block in `AGENTS.md`).
