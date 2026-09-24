---
name: review-pr
description: Review a GitHub PR against the repo's own standards, post a single coaching-tone review with inline comments after the user approves the draft, then apply and push the safe fixes. Use when the user points at a PR number or URL and asks to review it, conform it to standards, or get it ready to merge. For uncommitted local changes, review the working tree directly instead.
---

# Review & Fix a PR

Bring a pull request into line with the repo's standards: its `AGENTS.md` files, decision
records, package READMEs, and style guides. The author is often less steeped in the codebase,
so comments **teach**: state the issue, cite the specific standard, explain why it matters.

## Behavior contract

- **One review.** Compose a single review (summary + inline comments), show the draft, and
  submit **only after the user approves**.
- **Safe fixes get pushed.** Apply the mechanical, unambiguous fixes, validate, commit, and push
  to the PR branch. Design-level or behavior-changing findings stay as comments.
- **Fork guard.** If pushing to a cross-repo PR is rejected, don't force it — keep the commit
  local, tell the user, and offer to post the fixes as suggestion blocks instead.

## Phase 0 — Resolve the PR and guard the working tree

1. Resolve the target (number, URL, or the current branch's PR):
   ```bash
   gh pr view <pr> --json number,title,body,headRefName,baseRefName,isCrossRepository,author,url,files,additions,deletions
   ```
2. `git status --porcelain` must be clean. If it isn't, stop and ask — never stash or discard
   the user's work.
3. Record the current branch so you can return to it.
4. Note `isCrossRepository`; the Phase 4 push may be rejected.
5. `gh pr checkout <pr>`.

## Phase 1 — Build the standards context

1. The diff and touched files: `gh pr diff <pr>`, `git diff --name-only origin/<base>...HEAD`.
2. **Linked ticket.** Parse the footer (`Refs`/`Fixes <ID>`). If the tracker's MCP tools are
   available, fetch the ticket for acceptance criteria. With no ticket, judge completeness
   against the PR's own description. A missing ticket is **not** a finding.
3. **Only the standards relevant to touched paths**: root `AGENTS.md` (and its Project facts
   block), the nearest `AGENTS.md`/`CLAUDE.md` to each touched directory, the decision-record
   index, the README of each touched package, and any style guide for a touched UI area. Cite
   decision records by number when a change bears on one.

## Phase 2 — Review

If the repo has its own review-checklist skill (commonly `code-review`), apply it to the
checked-out diff; it's the source of truth for what good code looks like there. Then add the
PR-level dimensions it won't cover:

- **Completeness vs stated intent** — does the diff do what the ticket or description claims?
  Flag partial implementations, TODOs, and promised scope that's missing.
- **Description hygiene** — verification logs, screenshots, reviewer instructions, or stack
  notes in the description belong in a comment (`open-pr` skill). Flag references to chat,
  review rounds, or the agent that wrote it.
- **Architecture and decision-record adherence** — dependency direction, layering, and the
  patterns the repo's docs mandate.
- **Comment style** — purpose and "why" comments only; flag narration.

**Verify before you report.** Run the validate command from Project facts so type, lint, and
test claims rest on real output. Only report findings you can point to a concrete cause for.

**Severity buckets:**
- 🔴 **Blocking** — bug, standards or decision-record violation, broken or missing tests,
  security.
- 🟡 **Standards** — off-convention but not wrong.
- 🔵 **Nit** — optional polish.

For each finding capture `path:line`, what's wrong, **why** (cite the doc or record), and the
fix. Produce one numbered list, 🔴 → 🟡 → 🔵, blast radius first within a bucket. An empty list
is a fine outcome — say the PR conforms and post a short approving comment.

**Tag each finding:**
- **auto-fix** — mechanical and unambiguous: import or layering corrections, naming, style,
  deleting narration comments, an obvious missing test, formatting.
- **comment-only** — changes behavior or public contracts, design-level restructuring, more
  than one reasonable resolution, or anything that would balloon the diff.

## Phase 3 — Post ONE review (after approval)

- **Summary body**: open with what's good, then findings grouped by severity with `path:line`.
- **Inline comments**: one per finding, all in a single API call — see `reference/gh-review.md`.
  Frame auto-fix items as handled ("I've corrected this in a follow-up commit; here's the
  pattern and why"). Describe comment-only fixes and leave them to the author.
- **Event**: `REQUEST_CHANGES` only if a comment-only 🔴 remains; otherwise `COMMENT`.
- Show the assembled review and **wait for explicit approval** before submitting.

## Phase 4 — Apply the auto-fix items, commit, push

1. Work the auto-fix items top-down. For more than a few, track them as tasks so none are
   dropped.
2. Validate until green.
3. Stage **only** the files you changed. Commit with a Conventional Commit whose body says why;
   include the ticket footer only if the PR already has one.
4. `git push` — never force. On a permissions rejection, follow the fork guard.
5. Return to the original branch and report: what was commented, what was fixed and pushed,
   what remains for the author.

## Guardrails

- Never stash or discard the user's uncommitted work.
- Never force-push or rewrite the author's history — only add a commit.
- Never submit the review before the user approves the draft.
- Don't invent findings to look thorough.
- Keep the fix commit scoped to the review findings.
