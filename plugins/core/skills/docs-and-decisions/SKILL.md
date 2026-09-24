---
name: docs-and-decisions
description: Where documentation and decisions live and when to write or update them — agent context files, on-demand docs, decision records, and commit/PR text. Use after a change that alters documented behavior, architecture, APIs, config, or workflows; when a choice between real alternatives is being made; when asked to "update the docs", "write an ADR/decision record", or "document this"; and before opening a PR, to check what went stale.
---

# Docs & Decisions

Each kind of knowledge has one home. Paths below are defaults; the repo's `AGENTS.md` Project
facts override them (**Docs**, **Decision records**).

| What | Where | Loaded |
|---|---|---|
| Rules and facts that are true now and needed every session | `AGENTS.md` (root, and nested per area); `CLAUDE.md` only imports it | Every session |
| How a subsystem works, runbooks, guides, reference | `docs/` (or next to the code as a package README) | On demand |
| Why a significant choice was made, and what it rules out | `docs/decisions/NNNN-slug.md` | On demand |
| Why *this change* was made; history; alternatives tried | Commit body and PR description | `git log` |
| Verification, screenshots, review notes | PR comment | Once, in review |

## Rules for always-loaded files (`AGENTS.md`, `CLAUDE.md`, rules files)

- State what is true and what to do. No dates, version notes, "we used to", or rejected
  alternatives — those go in a decision record or the commit.
- Keep them short. Push detail into `docs/` and link it; every line here costs context in every
  session.
- When a rule has a reason that isn't obvious, give the reason in one clause; the full story
  belongs in a decision record.
- If a statement stops being true, fix or delete it in the same change that made it false.

## When a decision record is warranted

Write one when a change:
- chooses between real alternatives that a reasonable person could pick differently,
- is costly to reverse (a storage format, a public contract, a dependency or external service),
- or sets a rule other code must follow (a layering boundary, a naming or workflow convention).

Don't write one for a choice the code or a single commit message already explains.

**How:**
1. Take the next free number in the decision-record directory (4 digits, zero-padded); never
   reuse or renumber.
2. Copy `reference/decision-record.md` (or the repo's own template if it has one) to
   `NNNN-kebab-slug.md` and fill it in. Keep it to a page.
3. Add it to the directory's `README.md` index.
4. Records are immutable once accepted. To change course, write a new record and set the old
   one's status to `superseded by NNNN`.
5. When a rule from the record must be followed every session, add a one-line rule to
   `AGENTS.md` citing the record number.

## After a change — what went stale?

Before calling the change done or opening a PR, walk this list against the diff:

- **Behavior, API, CLI, or config changed** → the docs page, README, or reference that
  describes it; generated docs regenerated through the repo's task, not hand-edited.
- **New package, service, or major component** → its README, and the structure section of the
  nearest `AGENTS.md`.
- **A convention or architecture rule changed** → a decision record, and the rule line in
  `AGENTS.md`.
- **A task/command was added, renamed, or removed** → every place that lists it (AGENTS.md,
  README, flow executable descriptions).
- **Something an always-loaded file says is now false** → fix it now.

If nothing needed updating, say "Docs: N/A — ⟨reason⟩" in the PR comment so a reviewer knows
it was checked, not skipped.

## Writing style

- Short sentences, bullets, real paths and values instead of placeholders.
- Describe what and why; the code shows how.
- Match the existing structure of the doc you're editing; update its index or sidebar when you
  add a page.
