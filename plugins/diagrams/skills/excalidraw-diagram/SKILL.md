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
   is: a tree for containment, a pipeline for order, zones for where things run, a contrast
   for an argument. Each diagram in a set should use a different pattern.
3. **Write a skeleton** `<name>.skeleton.json` (see "Skeleton format" below). Use
   `references/palette.md` for every color.
4. **Render** with `node <this skill's dir>/scripts/render.mjs <name>.skeleton.json`. It writes
   `<name>.excalidraw` (editable), `<name>.svg` (publish this; fonts are embedded), and
   `<name>.png` (for review). It needs Node 22+, Google Chrome, and network access to esm.sh.
5. **Look at the PNG** with the Read tool. Fix anything wrong and render again. Stop when
   it's clean, usually after 2–3 passes. Check for:
   - text clipped by its box, or touching another element
   - arrows that stop short, overshoot, or cross a shape
   - labels that could belong to two things
   - uneven gaps between siblings, or one crowded region next to an empty one
   - any text too small to read at the size the page will show it
6. **Deliver** the SVG path, the `.excalidraw` path (for editing at excalidraw.com), and
   the sentence from the start, so the reader can judge whether the diagram says it.

## Skeleton format

The renderer expands skeleton elements with Excalidraw's `convertToExcalidrawElements`, so
you write only what matters:

```json
{
  "appState": { "viewBackgroundColor": "#1A1E20" },
  "elements": [
    { "type": "rectangle", "id": "repo", "x": 0, "y": 0, "width": 240, "height": 80,
      "strokeColor": "#a7c080", "backgroundColor": "#2d353b", "fillStyle": "solid",
      "label": { "text": "system repo", "strokeColor": "#d3c6aa", "fontSize": 20 } },
    { "type": "arrow", "x": 240, "y": 40, "points": [[0, 0], [140, 0]],
      "strokeColor": "#9da9a0", "start": { "id": "repo" }, "end": { "id": "mac" } },
    { "type": "text", "x": 262, "y": 8, "text": "flow sync", "fontSize": 16, "strokeColor": "#859289" }
  ]
}
```

- Containers (`rectangle`, `ellipse`, `diamond`) take a `label`; its text wraps and centers.
- Arrows **must** set `x`, `y`, and `points` so they span the full gap. `start`/`end` only
  bind them; they don't stretch them. Use extra points to route around shapes.
- Put arrow captions in a free `text` element just above the line. Arrow `label`s sit on
  top of the line.
- Free `text` is cheaper than a box. Use boxes for things that exist (a machine, a file, a
  command) and plain text for annotations, headings, and section titles.
- `line` with `points` draws tree branches, timelines, and dividers.
- Defaults are hand-drawn (`roughness: 1`, Excalifont). For a crisp technical look, set
  `"roughness": 0` and `"fontFamily": 2` on each element.
- To center text on a point (labels on timeline dots), make it the `label` of a rectangle
  with `"strokeColor": "transparent"`. A free `text` element's `x` is its left edge.
- A label that is too wide for its container wraps. Plan widths at about `0.55 × fontSize`
  per character for Excalifont and `0.6 ×` for monospace, plus 40px padding.

## Layout

- Lay out on a grid: pick a column width and row height and snap every `x`/`y` to it.
- Size shows importance. The one thing the diagram is about is the largest or most isolated.
- One reading direction per diagram: left to right for time and order, top to bottom
  for hierarchy.
- Aim for fewer than ~15 boxes. If you need more, split it into two diagrams.
- Font sizes: 32–40 title, 20–24 primary labels, 14–16 annotations. Nothing under 14.
