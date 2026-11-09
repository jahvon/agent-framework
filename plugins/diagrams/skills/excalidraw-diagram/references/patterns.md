# Patterns

Match the pattern to how the idea actually behaves. The structure should make sense even
with the labels hidden.

| The idea is… | Pattern | How to draw it |
|---|---|---|
| Things contain things | **Tree** | Root at the top-left; `line` elements with a `path` as trunk and branches; children as free text or small boxes. No box around every level. |
| Things happen in order | **Pipeline** | A row of steps joined by `from`/`to` arrows (wrap a long row with `via`), or a timeline: one long `line`, a `dot` per step, and a `caption` under each. Mark branches (`macOS` / `Ubuntu`) as a short fork that rejoins. |
| Things run in different places | **Zones** | One `zone` per machine or boundary; components inside; labeled arrows crossing the boundaries are the story. |
| One thing feeds many | **Fan-out** | The source on the left, targets stacked on the right, arrows spreading out. Many into one is the mirror image. |
| A claim or a contrast | **Argument** | Two panels side by side (before / after, by hand / one command), or one bold statement with the evidence beneath it. Size and color carry the claim. |
| Something repeats | **Cycle** | 3–5 steps placed around a circle, with arrows that use one `via` point each to curve. |

## Making it concrete

- Use real names: the actual command, file path, or host, not a placeholder.
- Add one `code` block when a short snippet shows the point better
  than a label does, such as three lines of a flowfile or the exact command.
- Counts make claims checkable: "98 executables", "2 servers".

## Hero image

For the top of a post: one idea, a short 32–40px title, and plenty of empty canvas. A
before/after contrast works well. It should read at thumbnail size.
