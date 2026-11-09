# Palette

Everforest Dark on a `#1A1E20` canvas, matching the terminal and jahvon.dev. The values
are defined in `scripts/excalidraw/palette.json` in agent-framework. Diagrams use role
and color names, never hex codes, so a palette change re-themes every diagram.

## Roles

A role colors a shape's outline and fill, or an arrow's or text's stroke. Pick by meaning:

| Role | Use for | Looks |
|---|---|---|
| `entry` | The command you type, a trigger, a starting point | orange |
| `source` | Source of truth: a repo, a registry, config | green, tinted fill |
| `machine` | Where something runs: a host, a runtime, a cluster | blue, tinted fill |
| `network` | Network paths, external services | aqua |
| `agent` | Agents, AI, automation, CI | pink |
| `decision` | Branches, warnings, caveats | yellow, tinted fill |
| `failure` | Errors, rollbacks, the "before" in a contrast | red, tinted fill |
| `done` | Success, the end state | green |
| `neutral` | Everything else | grey |

Use at most four roles per diagram. Color is the second thing a reader notices, after shape.

## Colors

| Name | Use for |
|---|---|
| `fg` | Titles and labels (the default for text) |
| `note` | Subtitles, annotations, captions |
| `line` | Arrows and structural lines (the default for arrows) |
| `faint` | Zone outlines, dividers, tree branches (the default for lines) |

## Light pages

The palette is built for dark pages. On a light page the SVG shows as a dark card, which is
intentional. Don't swap in a second palette for one diagram.
