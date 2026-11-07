# PR Workflow

## Opening

- Open as a draft (`gh pr create --draft`, or the host's equivalent).
- Title in conventional-commit style with the ticket ID, e.g. `feat(api): retry on upstream timeout (ABC-123)`.
- Never cite rule IDs (`R-…`) in commits or PR descriptions. State the reason in plain words.
- The description squash-merges as the commit body on main, so it holds only what belongs in
  history: no status line, try-it commands, verification, checklists, HTML comments, or trailers.
- Use the repo's PR template if it has one; otherwise this:

~~~markdown
## Summary
Why this change exists and what it does, in 2–4 sentences. The diff shows the mechanics.

## Changes
Only what the Summary doesn't make obvious. Omit if empty.

## Design
Mermaid diagram if architecture or data flow changed. Omit otherwise.
~~~

Everything for the reviewer goes in **one status comment**, edited in place as things change:

~~~markdown
> **Status:** <Done | Needs you: … | Blocked: …>

Review packet: <link, if any>

## Try it
```bash
<commands to check out the branch and run or test the change>
```

## Verification
- Verified: <what you ran and the result>
- Not verified: <what you couldn't test, and why>

## Risks
- ...
~~~

## Ready checklist

All true before you hand the PR to Jahvon:

- [ ] Implementation matches the answered packet
- [ ] CI green: build, tests, lint, type checks
- [ ] No debug code, stray files, or unrelated churn in the diff
- [ ] Description is history-clean; status comment has the status line, try-it commands, verified and not-verified
- [ ] Delivers complete, working functionality (`R-PR-03`); if stacked, the stack was agreed and integrates end to end

## Review feedback

- Push new commits instead of force-pushing, so the delta is visible. Squash happens at merge.
- Reply to each comment with what changed, or why it didn't.
- If feedback states a general preference, propose a new rule.
