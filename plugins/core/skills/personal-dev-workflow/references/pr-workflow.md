# PR Workflow

## Opening

- Open as a draft (`gh pr create --draft`, or the host's equivalent).
- Title in conventional-commit style with the ticket ID, e.g. `feat(api): retry on upstream timeout (ABC-123)`.
- Use the repo's PR template if it has one; otherwise this:

~~~markdown
> **Status:** <Done | Needs you: … | Blocked: …>

## Summary
What changed and why, in 2–4 sentences. Link the answered review packet.

## Try it
```bash
<commands to check out the branch and run or test the change>
```

## Design
Mermaid diagram if architecture or data flow changed; otherwise "No structural change".

## Verification
- Verified: <what you ran and the result>
- Not verified: <what you couldn't test, and why>

## Risks
- ...

## Rules applied
R-ARCH-01 (kept X out of Y's service), R-PR-03 (stacked as two PRs), ...
~~~

## Ready checklist

All true before you hand the PR to Jahvon:

- [ ] Implementation matches the answered packet
- [ ] CI green: build, tests, lint, type checks
- [ ] No debug code, stray files, or unrelated churn in the diff
- [ ] Description complete: status line, try-it commands, verified and not-verified
- [ ] Delivers complete, working functionality (`R-PR-03`); if stacked, the stack was agreed and integrates end to end

## Review feedback

- Push new commits instead of force-pushing, so the delta is visible. Squash happens at merge.
- Reply to each comment with what changed, or why it didn't.
- If feedback states a general preference, propose a new rule.
