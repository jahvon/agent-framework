---
name: open-pr
description: Standards for opening a GitHub pull request — whether a ticket is needed at all, whether to stack XL work, and writing the draft PR description. Use before running `gh pr create`, or earlier when a changeset is turning into XL work that might need a stack. Opens every PR as a draft.
---

# Opening a Pull Request

Read the repo's `AGENTS.md` **Project facts** block first: it names the ticket tracker and
prefix, branch convention, validate command, merge strategy, and review routing. Where it's
silent, use the defaults below.

The PR format, ready checklist, and review-feedback rules live in
`personal-dev-workflow/references/pr-workflow.md`; this skill covers the decisions around it.
Open every PR as a draft (`R-PR-01`) and don't mark it ready (`R-PR-02`).

## Step 1 — Ticket: link, or say there isn't one

Don't create a ticket just to have something to link.

- **Ticket exists?** Link it in the footer: `Refs <ID>`, or `Fixes <ID>` to close it.
- **No ticket, small and self-contained** (bug fix, typo, dependency bump, behavior-preserving
  refactor, doc update)? Open the PR with `No ticket` in the footer. That's a complete answer.
- **No ticket, substantial** (a feature, a multi-package change, work with follow-ons)? Ask the
  user whether to file one (`create-ticket` skill). Don't file it unprompted.
- **Project has no tracker?** Omit the footer entirely.

## Step 2 — One complete PR, or a stack for XL work

Size by completeness, not line count (`R-PR-03`). A PR delivers one complete, working piece of
functionality; a large PR is fine if that's what complete takes. Don't ship half a feature to keep
a diff small, and don't bundle unrelated changes to make one big.

Propose a stack only for XL work with independently complete layers — a backend seam before the
UI that uses it, a migration before the code that depends on it, a shared-library change before
its call sites. Agree on the stack in the review packet, then build its PRs in sequence or in
parallel (separate worktrees, `R-GIT-01`), rebasing as earlier layers change. Before handing off,
verify the whole stack integrates end to end, not just each PR alone.

**Stacks** render on GitHub when bases chain:

```bash
git switch -c <branch-2> <branch-1>
git push -u origin <branch-2>
gh pr create --base <branch-1> --title "..." --body "..."
```

Each PR targets the previous branch as `--base`, stands alone for review, and states its
position and merge order **in its description**. Rebase the stack and update bases when an earlier
PR changes.

## Step 3 — Write the description

Fill the repo's `.github/pull_request_template.md` if it has one; otherwise use the template in
`pr-workflow.md` (status line, Summary, Try it, Design, Verification, Risks, Rules applied).

- **Title** becomes the squashed commit subject: Conventional Commits, imperative, no trailing
  period, ticket ID in parentheses when there is one — `fix(parser): reject empty refs (ENG-12)`.
- **Summary** — the *why*: the motivation and the constraint that shaped the approach. The diff
  shows the mechanics. Link the answered review packet.
- **Verification** — always state what you could **not** verify; silence reads as "covered".
  Never say validation passed without having run it and seen it pass.
- **Stacks** — state position and merge order in the description.

Leave no placeholder HTML comments in the submitted body. Update the description in place as
things change rather than adding comments.

## Pre-flight

- Run the validate command from Project facts (or the `validate` skill) first; don't open a PR
  you haven't validated locally.
- Branch follows the project's convention; default `<ticket-id>/<slug>`, or `<type>/<slug>`
  (`fix/empty-ref`) with no ticket.
- Commits follow Conventional Commits: subject says what (imperative, ≤ ~50 chars), body says
  why, footer carries the ticket.
- Leave review routing to CODEOWNERS; don't remove auto-requested reviewers.
- Open the draft PR without asking, attended or not, except during quiet hours (`R-MON-03`).
- Follow-ups related to an open PR go on its branch (`R-PR-05`); before pushing to it, check it's
  still open (`R-PR-06`).
- Run the ready checklist in `pr-workflow.md` before handing off.
