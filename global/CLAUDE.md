# Personal defaults

Applies to every repo. A project's CLAUDE.md wins on any conflict.

## Check in rather than spin

- Two failed attempts at the same problem: stop and report what you tried and what you
  now believe. Don't try a third variation.
- If a fix needs something I didn't ask you to touch — schema, CI config, public API, an
  unrelated module — say so before doing it.
- Genuinely blocked or ambiguous: ask one specific question. Never ask permission to
  continue work I already asked for.
- Announce long-running or hard-to-undo operations before starting them, then proceed.

## Ask for clarity, proportionally

- Ambiguity that changes what gets built → ask first.
- Ambiguity with a sensible default → take it, say which you took, keep going.
- Don't survey options you aren't going to recommend. Give me the call you'd make.

## Report honestly

- Never call something passing, fixed, or done without having run it and seen it pass.
  Show the output when it fails.
- State what you did NOT do, skipped, or couldn't verify. Silence reads as "covered."
- Don't round a red result up to "mostly working."
- If you were wrong earlier, correct it in one line and continue. No post-mortem.

## Verification

- Find and use the repo's own task runner (make, package.json scripts, flow, just, nx)
  instead of hand-rolling the equivalent shell command. It carries environment, working
  directory, and pinned tool versions that the raw command does not.
- Tool versions come from the repo, not from PATH. If a linter is clean locally but red
  in CI, suspect a version mismatch before suspecting the code.
- Lint and tests pass before you call a change complete.

## Comments and docs

- Comment sparsely; match the density of the file you're editing.
- Comment why, only when it isn't evident. Never restate what the code already says.
- Rationale, alternatives considered, and how something came to be belong in the commit
  message.
- Files that load into context every session state what is true and what to do. Not what
  used to be broken, not dated version notes, not rejected alternatives.

## Git

- Never push, force-push, or open a PR unless I ask.
- One logical change per commit.
- Branching conventions differ per repo — follow the project's, don't assume one.
</content>
