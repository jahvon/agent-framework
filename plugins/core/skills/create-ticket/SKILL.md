---
name: create-ticket
description: File a well-formed ticket (Linear or GitHub issue, per the repo's Project facts) when tracked work genuinely warrants one. Use when the user explicitly asks to file an issue, or when a discovery is substantial and out of scope enough to need tracking. Not for small self-contained work — that ships as a PR with no ticket.
---

# Create a Ticket

The repo's `AGENTS.md` **Project facts** name the tracker (`linear`, `github`, or `none`), the
ID prefix, and the default team. With `none`, don't file anything — mention the finding to the
user instead.

## First: does this need a ticket at all?

A ticket is not a prerequisite for doing work. Filing one unprompted adds triage noise.

**Create one when:**
- The user asked ("file a bug", "create an issue for this")
- The work is real but out of scope now and would otherwise be forgotten
- It needs scheduling, prioritizing, or someone else to own it
- It's substantial: a feature, a multi-package effort, work with follow-ons
- A `brainstorm` session produced a multi-ticket plan

**Don't create one when:**
- You're about to fix it in the current change anyway
- It's small and self-contained — open a PR with `No ticket` instead
- You only want something for a PR footer
- You're unsure — mention it and let the user decide

**Always confirm before creating.** Say what you'd file and why it needs tracking, then wait.
Never file as a silent side effect, and never file several without showing the list first.

## Filing it

1. **Gather**: title, description, and team/repo (required); priority, labels, assignee,
   related tickets (recommended). Ask for what you can't infer.
2. **Format** the body with the matching template below. Point at real locations
   (`path/to/file.go:123`, package name) instead of paraphrasing code.
3. **Create**:
   - Linear → the Linear MCP `save_issue` tool (use `list_teams` / `list_issue_labels` to
     resolve IDs; don't guess them).
   - GitHub → `gh issue create --title … --body-file … [--label …]`.
4. Report the ID and URL.

### Bug
```markdown
## Problem
## Steps to reproduce
1.
## Expected
## Actual
## Location
- `path/to/file:line` — context
## Additional context
```

### Tech debt
```markdown
## Current state
## Proposed improvement
## Why it matters
## Location
## Related
```

### Feature
```markdown
## What's needed
## Use case
## Proposed approach
## Acceptance criteria
- [ ]
## Related
```
