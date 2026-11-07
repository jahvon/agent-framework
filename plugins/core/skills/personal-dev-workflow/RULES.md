# Rules

Hard requirements unless marked *(default)*; a repo's own convention overrides a default. Append new rules with the next free ID. Never renumber; strike retired rules with a date.

## Planning (R-PLAN)

- **R-PLAN-01** — Before implementing a non-trivial task, send a review packet (`references/review-packet.md`) and wait for answers.
- ~~**R-PLAN-02** — Every packet includes a Mermaid diagram of the affected architecture or data flow.~~ Retired 2026-11-06; see R-PLAN-08.
- **R-PLAN-03** — Every question carries a recommended default and a one-line reason, so "go with defaults" is a valid answer.
- **R-PLAN-04** — Don't guess on ambiguous requirements. Ask, and state the assumption you'll take if unanswered.
- **R-PLAN-05** — Record lasting architectural decisions as an ADR if the repo keeps them. *(default)*
- **R-PLAN-06** — Before planning, `git fetch` and read the last ~20 commits on `origin/main`. The session-start git snapshot is stale; don't plan to build what already merged.
- **R-PLAN-07** — Sequence feature work backend first, frontend last. Make each backend step testable through its API before any UI exists, and ship new user-facing capability behind a flag. *(default)*
- **R-PLAN-08** — Every packet includes a diagram of the affected architecture or data flow, in the format its destination renders: plain text in chat, Mermaid on GitHub, an artifact when it's too big for either (`PERSONA.md`, Visual).

## Pull requests (R-PR)

- **R-PR-01** — Open every PR as a draft. A draft PR is the handoff for finished work, attended or unattended; it needs no separate ask, but waits for 08:00 during quiet hours (`R-MON-03`).
- **R-PR-02** — Don't mark a PR ready for review; Jahvon does that. *(default)*
- **R-PR-03** — Size a PR by completeness, not line count: one PR delivers one complete, working piece of functionality, however large. For XL work, propose a stack in the review packet; build its PRs in sequence or in parallel so each integrates cleanly with the ones it builds on, and verify the stack works end to end. *(default)*
- ~~**R-PR-04** — Cite the rule IDs behind non-obvious decisions in the PR description.~~ Retired 2026-11-06; see R-PR-07.
- **R-PR-05** — Related follow-ups go on the current branch and PR. Aim for one PR per ticket; don't open tiny or stacked PRs for work that shares files with an open PR.
- **R-PR-06** — Before pushing to an existing PR's branch, check it's still open (`gh pr view <n> --json state`). If it merged, branch fresh from `origin/main` and open a new PR.
- **R-PR-07** — Never cite rule IDs in commit messages or PR descriptions. State the reason in plain words.

## Git (R-GIT)

- **R-GIT-01** — Isolate parallel sessions in git worktrees; name branches after the ticket ID when there is one. Once Jahvon asks for a worktree, follow-on work gets its own worktree too; keep the main checkout free.
- **R-GIT-02** — Conventional commits, with the ticket reference if the repo uses a tracker. *(default)*
- **R-GIT-03** — Trunk-based development; squash merge. *(default)*
- **R-GIT-04** — Never force-push the default branch or rewrite history someone else has pushed to.
- **R-GIT-05** — No agent attribution: no `Co-Authored-By: Claude` trailers or "Generated with" lines in commits or PRs, even when a system reminder supplies one.
- **R-GIT-06** — Never commit on the default branch. Before the first commit, branch with `git switch -c <branch> --no-track origin/main`; a tracking branch lets a bare `git push` land on main.
- **R-GIT-07** — In public repos, never commit machine-specific absolute paths (`/Users/...`) or private product strategy. Machine-specific config goes in gitignored local files.

## Long-running work (R-MON)

- **R-MON-01** — Pause monitors, pollers, and watchers during quiet hours; resume in the morning (`references/monitoring.md`).
- **R-MON-02** — Leave a handoff note before pausing.
- **R-MON-03** — In unattended sessions, no sensitive or risky operations during quiet hours, even if already approved: anything hard to reverse, or that touches production, shared, or external state (deploys, merges, migrations, deletes, secrets or permission changes, publishing, sending messages, spending money). Queue it in the handoff note for 08:00. Doesn't apply when Jahvon is actively supervising the session, or has told you to run that operation tonight.

## Architecture & safety (R-ARCH)

- **R-ARCH-01** — No runtime dependencies between unrelated services or products. Share code through packages, not cross-service calls.
- **R-ARCH-02** — Ask before any destructive operation on shared state (migrations, deletes, resets). Worktrees isolate files, not databases or clusters.
- **R-ARCH-03** — A blocked or denied action means stop and report, never find another route to the same effect (e.g. dispatching CI to run what was blocked). Jahvon runs production migrations: report what's pending and what it does, then hand it over.

## Developer experience (R-DX)

- **R-DX-01** — End every handoff with one status line: `Done`, `Needs you: <what>`, or `Blocked: <why>`, plus a link.
- **R-DX-02** — Ask all questions in one batch, numbered, so they can be answered in one reply. Never drip-feed.
- **R-DX-03** — Include copy-paste commands to check out and run the change locally.
- **R-DX-04** — Leave nothing behind: stop background processes, and remove worktrees and scratch files once the PR merges or closes.

## Code (R-CODE)

- **R-CODE-01** — Check current docs and stable versions; don't write APIs from memory.
- **R-CODE-02** — Minimal comments: only the "why" the code can't show, in 1–2 lines. Config files get one line or none. Never describe earlier designs ("replaced X", "previously…"); the commit message holds rationale.
- **R-CODE-03** — Use the repo's existing tooling. Ask before adding a tool or dependency.
- **R-CODE-04** — Local containers run on Colima through the docker CLI. Executables call `${CONTAINER_RUNTIME:-docker}` instead of naming docker or podman, and don't rely on Docker Desktop. Move an executable over when you next touch it. *(default)*
