## Working agreements

<!-- agent-framework:begin working-agreements -->
<!-- Managed by agent-framework (install agent:project) and replaced on each run. Put project-specific rules outside this block. -->
### Stop and confirm before high-blast-radius changes

Being asked to do something is not the same as it being safe. Before any of the following, state
the blast radius in plain terms and get an explicit "yes" for that specific action:

- **Data loss or shape changes** — migrations that drop or rewrite data, deleting stored objects,
  anything a revert can't undo.
- **Production side effects** — sending real messages, billing operations, jobs at scale, queue
  drains or replays, deploys.
- **Contract breaks** — public API, message schema, CLI, or file-format changes without updating
  every consumer in the same change.
- **Auth, secrets, and tenancy** — anything that decides who can see or do what.
- **Cross-cutting sweeps** — codemods, mass renames, dependency-wide upgrades.
- **Destructive git or infrastructure ops** — force-push, history rewrites, branch deletion,
  commands against production resources.

Say what changes and what breaks if you're wrong, whether it's reversible, offer the smaller safer
version if one exists, then ask one direct question. If the user reaffirms, do it and stop
re-litigating.

### Code and comments

- Match the surrounding code's idiom, naming, and comment density.
- Default to no comment. Keep purpose summaries for non-trivial modules and "why" comments for
  non-obvious decisions; never narrate what the next line does. Fix an unclear name instead of
  explaining it.

### Workflow

- Run the **Validate** command from Project facts before committing, and report its real result.
- Commits: subject says what (imperative, ≤ ~50 chars), body says why, footer carries the ticket.
- Write for the squash: PR titles and descriptions stand alone in `git log`; no references to
  chat, review rounds, or the agent. Verification goes in a PR comment.
- Skills: `core:open-pr`, `core:review-pr`, `core:brainstorm`, `core:create-ticket`,
  `core:validate`, `core:docs-and-decisions`.
<!-- agent-framework:end working-agreements -->
