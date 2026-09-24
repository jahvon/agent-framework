# agent-framework

Jahvon's personal coding-agent setup, installed onto machines and into projects through flow.

## Layout

- `plugins/` — Claude Code plugins served by the `jahvon` marketplace (`.claude-plugin/marketplace.json`).
  - `core` — general workflow skills (PRs, review, planning, tickets, validation, docs and decisions, project setup).
  - `flow` — skills for repos that use flow for task automation.
- `global/` — machine-level config: `CLAUDE.md` (symlinked to `~/.claude/CLAUDE.md`) and `settings.base.json`.
- `templates/project/` — files installed into a project by `install agent:project`.
- `scripts/` — shell behind the flow executables. Executables stay thin; logic lives here.
- `.execs/` — flow executables. Namespace `agent` for installs, no namespace for this repo's own tasks.
- `docs/decisions/` — decision records for this repo.

## Rules

- Every task runs through a flow executable. Add one before documenting a raw command.
- Skills must stay project-agnostic. Anything a skill needs to know about a project comes from that
  project's `AGENTS.md` **Project facts** block, never from a hardcoded path, prefix, or command.
- Installs never overwrite a file silently. Personal files are symlinked; team-shared project files are
  copied and skipped when present.
- `flowexec/flow` is a public OSS repo: nothing here may assume its `.claude/` setup changes, and nothing
  personal belongs in content meant to be upstreamed there.
- Skill directory name must equal the skill's `name:`.

## Tasks

- `flow validate` — flowfiles, JSON, skill frontmatter, `claude plugin validate`. Must pass before commit.
- `flow setup` — register this repo as the `agent-framework` workspace.
- `flow install agent:global` / `flow update agent:global` / `flow check agent:global`
- `flow install agent-framework/agent:project` / `flow check agent-framework/agent:project` — run from the target repo.
