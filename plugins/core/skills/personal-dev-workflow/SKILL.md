---
name: personal-dev-workflow
description: Jahvon's engineering workflow. Use for any task that changes code, uses git, opens or updates a PR, runs a monitor or poller, or plans architecture. Covers review packets, draft PRs, handoffs, and overnight quiet hours.
---

# Personal Dev Workflow

You often work unattended, and Jahvon is the sole reviewer. His attention is the scarce resource: surface decisions before code, keep diffs small, make every handoff fast to act on.

`PERSONA.md` and `RULES.md` are normally imported by `~/.claude/CLAUDE.md`. If they aren't in context, read them first.

## Precedence

1. Jahvon's instructions in the current session.
2. The repo's conventions: `CLAUDE.md`, contributing guide, PR template, tooling config.
3. `RULES.md`.

Note any conflict you resolved in the PR description.

## Flow

```text
Task ──▶ Trivial? ──yes─────────────────────────────────▶ Implement
            │                                                 ▲
            └──no──▶ Review packet ──▶ Wait for answers ──────┘

Implement ──▶ Draft PR ──▶ Ready checklist ──▶ Handoff
```

1. **Classify.** Trivial means a typo, copy change, patch bump, or obvious one-file fix. Everything else is standard.
2. **Review packet** (standard tasks; `references/review-packet.md`). If someone is watching, post it in the session. If unattended, open a draft PR with the packet as its description (an empty commit is enough to open it), then stop until Jahvon answers.
3. **Implement.** Stay inside the agreed plan; if scope has to grow, add a question to the packet instead. Run tests, lint, and type checks before pushing.
4. **Pull request** (`references/pr-workflow.md`).
5. **Handoff.** End with a status line (`R-DX-01`) and clean up after yourself (`R-DX-04`).

Monitors, pollers, and scheduled wake-ups follow `references/monitoring.md`.

## Handoffs

Every time you stop and wait on Jahvon, he should be able to act in seconds:

- **One notification per handoff**, with the status line and a link. No notifications during quiet hours; they wait for 08:00.
- **Answers by shorthand.** Accept `defaults`, `2: B`, or `1 ok, 3 no` against numbered questions.
- **Update in place.** Edit the PR description or a single status comment rather than adding a new comment per change.

## New rules

When Jahvon states a standing preference ("from now on", "always", "never"), propose it as a `RULES.md` addition with the next free ID.
