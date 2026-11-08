# Patterns

Match the pattern to how the idea actually behaves. The structure should make sense even
with the labels hidden.

| The idea is… | Pattern | How to draw it |
|---|---|---|
| Things contain things | **Tree** | Root at the top-left; `line` elements as trunk and branches; children as free text or small boxes. No box around every level. |
| Things happen in order | **Pipeline** | A left-to-right row of steps with arrows, or a timeline: one long `line` with small ellipse dots and text under each. Mark branches (`macOS` / `Ubuntu`) as a short fork that rejoins. |
| Things run in different places | **Zones** | One dashed region per machine or boundary; components inside; labeled arrows crossing the boundaries are the story. |
| One thing feeds many | **Fan-out** | The source on the left, targets stacked on the right, arrows spreading out. Many into one is the mirror image. |
| A claim or a contrast | **Argument** | Two panels side by side (before / after, by hand / one command), or one bold statement with the evidence beneath it. Size and color carry the claim. |
| Something repeats | **Cycle** | 3–5 steps placed around a circle, with curved arrows (three points per arrow). |

## Making it concrete

- Use real names: `flow update system`, `tools/servers/inventory.yaml`, `devbox`.
- Add one evidence block (see `palette.md`) when a short snippet shows the point better
  than a label does, such as three lines of a flowfile or the exact command.
- Counts make claims checkable: "98 executables", "2 servers".

## Hero image

For the top of a post: one idea, at most 6 elements, a 32–40px title as free text, and
plenty of empty canvas. It should read at thumbnail size.
