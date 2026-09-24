# Posting a single PR review with inline comments

Goal: land **one** review (summary + N inline line comments) in a single call so
the author gets one notification, not N. `gh pr review` alone can't attach inline
comments, so use the REST API via `gh api`.

## The one-call recipe

Build a JSON payload and POST it to the reviews endpoint. Write the payload to
the scratchpad dir first (avoids shell-escaping pain with multi-line bodies).

```bash
OWNER_REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
PR=195

# payload.json — assemble from your findings
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  "repos/${OWNER_REPO}/pulls/${PR}/reviews" \
  --input /path/to/scratchpad/payload.json
```

### payload.json shape

```json
{
  "commit_id": "<HEAD sha of the PR branch>",
  "event": "REQUEST_CHANGES",
  "body": "## Summary\n\nNice work on X. A few conformance items grouped by severity below…",
  "comments": [
    {
      "path": "internal/services/runner.go",
      "line": 42,
      "side": "RIGHT",
      "body": "🔴 **Layering (decision record 0006).** This imports the concrete store directly. Services depend on the interface and receive the implementation via injection…\n\n```go\nfunc NewRunner(store Store) *Runner {\n```"
    },
    {
      "path": "web/src/components/Badge.tsx",
      "line": 88,
      "side": "RIGHT",
      "body": "🟡 **Style guide.** Badges use the `radius-full` token, not a hard-coded radius — see `STYLE_GUIDE.md` → Badge."
    }
  ]
}
```

### Field notes

- **`event`**: `REQUEST_CHANGES` if a comment-only 🔴 remains; else `COMMENT`. Use `APPROVE` only if
  clean and the user asks you to approve. Omit `event` to leave it **pending**
  (a draft you submit later) — useful if the user wants to eyeball it in the
  GitHub UI first.
- **`commit_id`**: `git rev-parse HEAD` on the checked-out PR branch. Anchoring to
  the reviewed SHA keeps line numbers valid.
- **`line`**: the line number **in the file's new version** (the RIGHT side of the
  diff). The line must be part of the diff or GitHub rejects the comment.
- **`side`**: `RIGHT` for added/context lines (the common case); `LEFT` only to
  comment on a removed line.
- **Multi-line range**: add `"start_line"` + `"start_side"` alongside `line` to
  span a block.
- **Bodies**: real newlines, GitHub-flavored markdown. Fenced code blocks render.

## Suggestion blocks (fork fallback / author-applies flow)

When you can't push (fork) or want the author to apply a fix themselves, put a
GitHub **suggestion** in the comment body — it renders an "Apply" button:

    ```suggestion
    func NewRunner(store Store) *Runner {
    ```

The suggested text replaces exactly the line(s) the comment is anchored to, so
anchor precisely and include the full replacement line(s).

## Verifying line anchors before posting

If a comment 422s ("line must be part of the diff"), the target line isn't in the
PR's diff hunks. Re-derive valid lines from:

```bash
gh pr diff <pr> --patch
```

Map each finding to a `+`/context line within a hunk. For findings on unchanged
code far from any hunk, fall back to referencing `path:line` in the **summary
body** instead of an inline comment.
