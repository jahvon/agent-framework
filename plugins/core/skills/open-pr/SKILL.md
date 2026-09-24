---
name: open-pr
description: Standards for opening a GitHub pull request — whether a ticket is needed at all, whether to split the work, writing a lean description that survives squash-merge, and posting reviewer context as a PR comment. Use before running `gh pr create`, or earlier when a changeset is growing large enough that it might need splitting. Only open a PR when the user asked for one.
---

# Opening a Pull Request

Read the repo's `AGENTS.md` **Project facts** block first: it names the ticket tracker and
prefix, branch convention, validate command, merge strategy, and review routing. Where it's
silent, use the defaults below.

Two failure modes this skill exists to prevent: **inventing a ticket for work that never
needed one**, and **stuffing review-time detail into the PR description**, where it
squash-merges into the main branch and stays in history forever.

| Goes in the **description** (permanent) | Goes in a **PR comment** (read once) |
|---|---|
| Why the change exists | How you verified it — commands run, manual steps |
| What changed, briefly | Screenshots / recordings |
| Ticket footer, or `No ticket` | What a reviewer should scrutinize |
| | What you could *not* verify |
| | Stack position and merge order |
| | Follow-ups deliberately left out of scope |

The description is what a future `git log` / `git blame` reader gets, with no access to the
tracker and no memory of this work.

## Step 1 — Ticket: link, or say there isn't one

Don't create a ticket just to have something to link.

- **Ticket exists?** Link it in the footer: `Refs <ID>`, or `Fixes <ID>` to close it.
- **No ticket, small and self-contained** (bug fix, typo, dependency bump, behavior-preserving
  refactor, doc update)? Open the PR with `No ticket` in the footer. That's a complete answer.
- **No ticket, substantial** (a feature, a multi-package change, work with follow-ons)? Ask the
  user whether to file one (`create-ticket` skill). Don't file it unprompted.
- **Project has no tracker?** Omit the footer entirely.

## Step 2 — One small PR, or a stack

Default to one PR, under ~500 changed lines. Split into a stack only when there are
independently reviewable layers — a backend seam before the UI that uses it, a migration before
the code that depends on it, a shared-library change before its call sites.

Don't split just because the diff is long; split when a reviewer would approve part A without
reading part B. Work that shares real file dependencies with an open PR belongs in that PR. If
the work doesn't decompose, narrow the scope instead of bundling unrelated changes.

**Stacks** render on GitHub when bases chain:

```bash
git switch -c <branch-2> <branch-1>
git push -u origin <branch-2>
gh pr create --base <branch-1> --title "..." --body "..."
```

Each PR targets the previous branch as `--base`, stands alone for review, and states its
position and merge order **in its comment**. Rebase the stack and update bases when an earlier
PR changes.

## Step 3 — Write the description (short, permanent)

Fill the repo's `.github/pull_request_template.md` if it has one.

- **Title** becomes the squashed commit subject: Conventional Commits, imperative, no trailing
  period — `fix(parser): reject empty executable refs`. Never just a ticket number.
- **Summary** — the *why*: the motivation and the constraint that shaped the approach, in a few
  sentences. The diff shows the mechanics.
- **Changes** — only what the Summary doesn't already cover; delete the section otherwise.
- **Footer** — per Step 1.

| Don't | Do |
|---|---|
| `Fix per review comments` | `fix(parser): reject empty executable refs` |
| A ticket ID with no description | A Summary a reader understands without the tracker |
| "As discussed, this moves the check earlier" | "Moves the check before enrichment so a failed fetch never reaches the queue" |
| "Claude added…" / "the agent implemented…" | The change described as settled fact |
| A `## Verification` section | Verification goes in the comment (Step 4) |

Leave no placeholder HTML comments in the submitted body.

## Step 4 — Post reviewer context as a comment

Immediately after `gh pr create`, post one comment with what the reviewer needs and history
doesn't:

```bash
gh pr comment <pr> --body "$(cat <<'BODY'
**Verification**
- `<validate command>` passed (build, tests, lint)
- Manually: <what you exercised and what you saw>
- Not verified: <what you couldn't check, and why>

**Worth a close look**
- <file or area> — <why>

**Out of scope (follow-up)**
- <deferred work>

**Stack**
- Stacked on #<n> — merge after it
BODY
)"
```

Include only the sections that apply. Always state what you could **not** verify — silence
reads as "covered". Never say validation passed without having run it and seen it pass.

## Pre-flight

- Run the validate command from Project facts (or the `validate` skill) first; don't open a PR
  you haven't validated locally.
- Branch follows the project's convention; default `<ticket-id>/<slug>`, or `<type>/<slug>`
  (`fix/empty-ref`) with no ticket.
- Commits follow Conventional Commits: subject says what (imperative, ≤ ~50 chars), body says
  why, footer carries the ticket.
- Leave review routing to CODEOWNERS; don't remove auto-requested reviewers.
- Never push or open a PR the user didn't ask for.
