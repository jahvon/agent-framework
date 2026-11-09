---
name: excalidraw-diagram
description: Draw Excalidraw diagrams that explain a system, flow, or idea, rendered to a self-contained SVG for blogs and docs plus an editable .excalidraw file. Use when asked for an Excalidraw diagram, a hand-drawn or sketch-style diagram, or visuals for a blog post, talk, or README, and when a diagram must be an image rather than Mermaid or a text block.
---

# Excalidraw diagrams

A diagram earns its place by showing something prose can't: shape, flow, grouping, contrast.
Before drawing, write one sentence saying what the reader should understand afterwards.
If the layout doesn't make that sentence obvious with the labels covered, change the layout.

## Workflow

1. **Research.** Read the real code, config, or docs. Use actual command names, file paths,
   and counts, never "Service A" or "Step 1". Leave out anything private when the
   destination is public: IPs, internal domains, hostnames that aren't already public, secrets.
2. **Pick a pattern** from `references/patterns.md` that matches what the idea actually
   is. Each diagram in a set should use a different pattern.
3. **Write `<name>.skeleton.json`** in the shorthand below, in
   `${ASSETS_DIR:-~/workspaces/assets}/<project>/diagrams/<topic>/`, unless the user names
   another place. The outputs land next to it, so the source and every render stay
   together. Copy the SVG into a repo only when asked. `examples/release.skeleton.json`
   uses every feature.
4. **Render** through mochi (or flow as the fallback, per `flow-context`), passing an absolute
   path to a file or a directory:
   `mochi render agent-framework/excalidraw:diagram -- <path> [--scale=2] [--png=false] [--strict]`
   Over MCP, call `execute` with ref `render agent-framework/excalidraw:diagram`.
   It writes `<name>.excalidraw` (editable), `<name>.svg` (publish this; fonts are embedded),
   and `<name>.png` (for review). Each diagram gets one line: `✓` when clean, or `⚠` followed
   by one `⚠ <name>: <finding>` line per problem. Flow shows these as NTC, so they stand out.
5. **Fix every finding,** then look at the PNG with the Read tool for what lint can't judge:
   balance, reading order, whether the main element stands out. Render again. It's
   usually done after 2–3 passes.
6. **Deliver** the SVG path, the `.excalidraw` path (for editing at excalidraw.com), and
   the sentence from the start, so the reader can judge whether the diagram says it.

## Shorthand

Elements are Excalidraw skeleton elements (`convertToExcalidrawElements`) plus these
additions, which the renderer expands:

| Key | On | Does |
|---|---|---|
| `role` | shapes, text, arrows | Colors from `references/palette.md`: `entry`, `source`, `machine`, `network`, `agent`, `decision`, `failure`, `done`, `neutral` |
| `color` | any | `fg`, `note`, `line`, `faint`, a role name, or `#hex` |
| `label` | shapes | `{ "text": "…" }`; wraps and centers inside the shape |
| `from`, `to` | arrows | Shape ids. The arrow leaves and enters on facing edges, already bound |
| `via` | arrows | `[[x, y], …]` waypoints for routing around things |
| `path` | arrows, lines | Absolute `[[x, y], …]` points for free-standing lines |
| `dashed` | arrows, lines | `true` for optional or failure paths |
| `"kind": "code"` | rectangle | A dark evidence block in monospace. One line is centered; several are left-aligned |
| `"kind": "zone"` | rectangle | A dashed region with a `title` in its top-left |
| `"kind": "caption"` | — | Text centered on `cx` (labels under timeline dots); `width` defaults to 200 |
| `"kind": "dot"` | — | A filled circle at `cx`, `cy`, radius `r` (default 10) |

Shapes used in `from`/`to` need an `id`, `width`, and `height`. The defaults give the
hand-drawn look (Excalifont, `roughness: 1`). For a crisp look, set `"roughness": 0` and
`"fontFamily": 2` on each element.

## Lint findings

| Finding | Fix |
|---|---|
| label wraps / taller than its box | Widen the box (plan about `0.55 × fontSize` px per character, `0.6 ×` for monospace, plus 40), or shorten the label |
| text overlaps text, or crosses a shape's edge | Move the text, or give it more room |
| arrow crosses a shape, or runs through text | Add `via` waypoints, or move the shape or text out of the path |
| arrow ends Npx from a shape | You set the points by hand; use `from`/`to` instead |

`--strict` exits non-zero on any finding. Use it to confirm a diagram is clean before
delivering it.

## Layout

- Keep text to labels and facts: names, commands, paths, counts. No subtitles, captions that
  explain, or sentences. If the shapes don't make the point, change the shapes. If a
  diagram needs more words to be understood, split it into two diagrams.
- Lay out on a grid: pick a column width and row height and snap every `x`/`y` to it.
- Size shows importance. The one thing the diagram is about is the largest or most isolated.
- One reading direction per diagram: left to right for time and order, top to bottom
  for hierarchy.
- Aim for fewer than ~15 boxes. If you need more, split it into two diagrams.
- Font sizes: 32–40 title, 20–24 primary labels, 14–16 annotations. Nothing under 14.
- An arrow caption is one or two words (`NFS`, `Tailscale`), in free text just above the line,
  not in an arrow `label`, which sits on it.
- Aim for a width of at most 2.5× the height. Blog columns shrink wide diagrams until
  the text can't be read.
