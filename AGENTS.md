# agent-framework

Jahvon's personal coding-agent setup, installed onto Jahvon's machines and into Jahvon's projects through flow.
Single user: optimize for Jahvon's workflow, not for teammates.

## Layout

- `plugins/` — Claude Code plugins served by the `jahvon` marketplace (`.claude-plugin/marketplace.json`).
  - `core` — workflow skills (PRs, review, planning, tickets, validation, docs and decisions, project setup).
    `personal-dev-workflow` holds the persona, the numbered `RULES.md`, and the review-packet / PR /
    quiet-hours references; other skills defer to it.
  - `flow` — skills for repos that use flow for task automation. Agents drive them through mochi
    when the machine has it and fall back to flow (decision 0003); files written for others say `flow`.
  - `diagrams` — `excalidraw-diagram`: Excalidraw diagrams for blogs and docs. The skill holds the
    method and examples. Rendering lives in `scripts/excalidraw/` behind
    `render excalidraw:diagram`, a dependency-free Node script that drives headless Chrome
    (pinned Excalidraw from esm.sh). Colors come only from `scripts/excalidraw/palette.json`.
- `global/` — machine-level config: `CLAUDE.md` and `settings.base.json`. `install agent:global` symlinks
  `CLAUDE.md`, plus `PERSONA.md` and `RULES.md` from `personal-dev-workflow`, into `~/.claude/`.
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
- Change rules by appending to `RULES.md` with the next free ID in the category. Never renumber; strike
  retired rules with a date.

## Tasks

- `flow validate` — flowfiles, JSON, unit tests, skill frontmatter, `claude plugin validate`. Must pass before commit.
- `flow setup` — register this repo as the `agent-framework` workspace.
- `flow install agent:global` / `flow update agent:global` / `flow check agent:global`
- `flow install agent-framework/agent:project` / `flow check agent-framework/agent:project` — run from the target repo.
- `flow render agent-framework/excalidraw:diagram -- <file-or-dir>` — render diagrams from any directory.
- `flow test excalidraw:renderer` — unit tests plus a real render of the skill's examples (needs Chrome and esm.sh). Run after changing `scripts/excalidraw/`.
