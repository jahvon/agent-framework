---
name: setup-project
description: Install or refresh Jahvon's agent setup (AGENTS.md working agreements and Project facts, CLAUDE.md, .claude/settings.json, .mcp.json, PR template, decision-record scaffolding) in the current repo via the agent-framework flow workspace. Use when asked to "install my agent setup", "set up agent-framework here", or "refresh the agent config" in a repo.
---

# Set up a project with agent-framework

The install runs on top of an existing repo: JSON files are deep-merged with the repo's values
winning, `AGENTS.md` gets marker-delimited sections, and anything else is added only when absent.
The user reviews the result with `git diff` and tweaks it.

## Steps

1. **Preconditions.** Run from the repo root. `git status --porcelain` should be clean so the
   install's diff is reviewable on its own — if it isn't, tell the user and ask whether to go
   ahead. Confirm `flow workspace list` includes `agent-framework`; if not, stop and point the
   user at the agent-framework README setup.
2. **Read the repo before choosing args.** Look at the existing `AGENTS.md`/`CLAUDE.md`,
   `flow.yaml`, `package.json`/`Makefile`, `.github/`, and `docs/` to pick:
   - `--tracker=linear|github|none` and `--prefix=<ID prefix>` (from branch names, commit
     footers, or PR templates)
   - `--validate="<command>"` only when auto-detection would miss the real validate task
   - `--decisions-dir=<path>` when the repo keeps decision records somewhere nonstandard
   - `--flow=true` to make a non-flow repo a flow workspace — only if the user wants that
   - `--prettier=true` for repos that format with Prettier
   - `--plugins=false` if the user doesn't want the plugins enabled for the whole team
3. **Preview.** `flow check agent-framework/agent:project -- <args>` lists what would change.
4. **Install.** `flow install agent-framework/agent:project -- <args>`.
5. **Review the diff yourself** before reporting. Look for managed-section wording that
   contradicts rules the repo already states elsewhere in its `AGENTS.md`/`CLAUDE.md`, and for
   Project facts values that detection got wrong (validate command, decision-record path).
   Fix Project facts directly; point out contradictions rather than deleting the repo's rules.
6. **Report** what was created, merged, and kept; what Project facts values need the user's
   eye; and any contradictions found. Don't commit unless the user asks.

Re-running later refreshes the managed `AGENTS.md` sections and merges new settings. It never
rewrites the Project facts block or files it only adds when absent, and it reads the validate
command and decision-record location back from Project facts, so fixing them there sticks. Point
**Decision records** at a single file to keep a one-file decision log without scaffolding.
